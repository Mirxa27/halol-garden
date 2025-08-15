import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';

// Cache configuration interface
interface CacheConfig {
  ttl: number; // Time to live in seconds
  type: 'memory' | 'redis';
  keyPrefix?: string;
  skipIf?: (req: Request) => boolean;
  varyBy?: string[];
}

// In-memory cache implementation
class MemoryCache {
  private cache = new Map<string, { data: any; expires: number; hits: number }>();
  private stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };

  set(key: string, value: any, ttlSeconds: number): void {
    const expires = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { data: value, expires, hits: 0 });
    this.stats.sets++;
    
    // Clean up expired entries periodically
    if (this.cache.size % 100 === 0) {
      this.cleanup();
    }
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }
    
    entry.hits++;
    this.stats.hits++;
    return entry.data;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): any {
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`Cache cleanup: removed ${cleaned} expired entries`);
    }
  }
}

// Redis cache implementation (when Redis is available)
class RedisCache {
  private redis: any; // Redis client
  private stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };

  constructor(redisClient: any) {
    this.redis = redisClient;
  }

  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
      this.stats.sets++;
    } catch (error) {
      console.error('Redis cache set error:', error);
    }
  }

  async get(key: string): Promise<any | null> {
    try {
      const result = await this.redis.get(key);
      
      if (result === null) {
        this.stats.misses++;
        return null;
      }
      
      this.stats.hits++;
      return JSON.parse(result);
    } catch (error) {
      console.error('Redis cache get error:', error);
      this.stats.misses++;
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.redis.del(key);
      if (result > 0) {
        this.stats.deletes++;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Redis cache delete error:', error);
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.redis.flushall();
    } catch (error) {
      console.error('Redis cache clear error:', error);
    }
  }

  getStats(): any {
    return {
      ...this.stats,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
    };
  }
}

// Cache manager
class CacheManager {
  private memoryCache = new MemoryCache();
  private redisCache: RedisCache | null = null;

  setRedisClient(redisClient: any): void {
    this.redisCache = new RedisCache(redisClient);
  }

  getCache(type: 'memory' | 'redis'): MemoryCache | RedisCache {
    if (type === 'redis' && this.redisCache) {
      return this.redisCache;
    }
    return this.memoryCache;
  }

  getStats(): { memory: any; redis?: any } {
    const stats: { memory: any; redis?: any } = {
      memory: this.memoryCache.getStats(),
    };
    
    if (this.redisCache) {
      stats.redis = this.redisCache.getStats();
    }
    
    return stats;
  }
}

// Global cache manager instance
const cacheManager = new CacheManager();

// Generate cache key based on request
function generateCacheKey(req: Request, config: CacheConfig): string {
  const base = `${config.keyPrefix || 'api'}:${req.method}:${req.path}`;
  
  if (!config.varyBy || config.varyBy.length === 0) {
    return base;
  }
  
  const varyParts: string[] = [];
  
  config.varyBy.forEach(field => {
    switch (field) {
      case 'query':
        const sortedQuery = Object.keys(req.query)
          .sort()
          .reduce((result: any, key) => {
            result[key] = req.query[key];
            return result;
          }, {});
        varyParts.push(`query:${createHash('md5').update(JSON.stringify(sortedQuery)).digest('hex')}`);
        break;
        
      case 'user':
        const userId = (req as any).user?.id || 'anonymous';
        varyParts.push(`user:${userId}`);
        break;
        
      case 'headers':
        const relevantHeaders = ['accept', 'accept-language', 'authorization'];
        const headerHash = relevantHeaders
          .map(h => `${h}:${req.get(h) || ''}`)
          .join('|');
        varyParts.push(`headers:${createHash('md5').update(headerHash).digest('hex')}`);
        break;
        
      default:
        // Custom header or field
        const value = req.get(field) || (req.body as any)?.[field] || ''; // Cast req.body to any
        varyParts.push(`${field}:${createHash('md5').update(String(value)).digest('hex')}`);
    }
  });
  
  return `${base}:${varyParts.join(':')}`;
}

// Cache middleware factory
export function createCacheMiddleware(config: CacheConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching if condition is met
    if (config.skipIf && config.skipIf(req)) {
      return next();
    }
    
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    const cacheKey = generateCacheKey(req, config);
    const cache = cacheManager.getCache(config.type);
    
    try {
      // Try to get cached response
      const cachedResponse = await cache.get(cacheKey);
      
      if (cachedResponse) {
        // Set cache headers
        res.set({
          'X-Cache': 'HIT',
          'X-Cache-Key': cacheKey,
          'Cache-Control': `public, max-age=${config.ttl}`,
        });
        
        // Return cached response
        return res.status(cachedResponse.status)
          .set(cachedResponse.headers)
          .send(cachedResponse.body);
      }
      
      // Cache miss - intercept response
      const originalSend = res.send;
      const originalJson = res.json;
      
      res.send = function(body: any) {
        // Cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const responseData = {
            status: res.statusCode,
            headers: res.getHeaders(),
            body: body,
          };
          
          // Store in cache asynchronously
          cache.set(cacheKey, responseData, config.ttl);
        }
        
        // Set cache headers
        res.set({
          'X-Cache': 'MISS',
          'X-Cache-Key': cacheKey,
        });
        
        return originalSend.call(this, body);
      };
      
      res.json = function(obj: any) {
        // Cache successful JSON responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const responseData = {
            status: res.statusCode,
            headers: res.getHeaders(),
            body: obj,
          };
          
          cache.set(cacheKey, responseData, config.ttl);
        }
        
        res.set({
          'X-Cache': 'MISS',
          'X-Cache-Key': cacheKey,
        });
        
        return originalJson.call(this, obj);
      };
      
      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
}

// Pre-configured cache middleware
export const cacheMiddleware = {
  // Short-term cache for frequently changing data
  short: createCacheMiddleware({
    ttl: 60, // 1 minute
    type: 'memory',
    keyPrefix: 'short',
  }),
  
  // Medium-term cache for semi-static data
  medium: createCacheMiddleware({
    ttl: 300, // 5 minutes
    type: 'memory',
    keyPrefix: 'medium',
    varyBy: ['query'],
  }),
  
  // Long-term cache for static data
  long: createCacheMiddleware({
    ttl: 3600, // 1 hour
    type: 'redis',
    keyPrefix: 'long',
    varyBy: ['query', 'user'],
  }),
  
  // User-specific cache
  user: createCacheMiddleware({
    ttl: 900, // 15 minutes
    type: 'memory',
    keyPrefix: 'user',
    varyBy: ['user', 'query'],
    skipIf: (req) => !(req as any).user, // Cast req to any
  }),
  
  // Search results cache
  search: createCacheMiddleware({
    ttl: 600, // 10 minutes
    type: 'redis',
    keyPrefix: 'search',
    varyBy: ['query'],
  }),
  
  // API responses cache
  api: createCacheMiddleware({
    ttl: 300, // 5 minutes
    type: 'memory',
    keyPrefix: 'api',
    varyBy: ['query', 'headers'],
  }),
};

// Cache invalidation middleware
export function invalidateCache(patterns: string[] | string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const patternsArray = Array.isArray(patterns) ? patterns : [patterns];
    
    // Clear matching cache entries after response
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        patternsArray.forEach(pattern => {
          // For now, we'll clear all caches if pattern matches
          // In a real implementation, you'd iterate through cache keys
          console.log(`Cache invalidation triggered for pattern: ${pattern}`);
        });
      }
    });
    
    next();
  };
}

// Cache statistics endpoint
export function getCacheStats(req: Request, res: Response) {
  const stats = cacheManager.getStats();
  
  res.json({
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
  });
}

// Cache warming function
export async function warmCache(routes: Array<{ path: string; data: any; ttl: number }>) {
  const cache = cacheManager.getCache('memory');
  
  for (const route of routes) {
    const key = `warm:${route.path}`;
    await cache.set(key, route.data, route.ttl);
    console.log(`Cache warmed for: ${route.path}`);
  }
}

// Initialize Redis connection if available
export function initializeRedis(redisClient: any) {
  cacheManager.setRedisClient(redisClient);
  console.log('Redis cache initialized');
}

// Compression middleware for cached responses
export function compressionMiddleware(req: Request, res: Response, next: NextFunction) {
  const acceptEncoding = req.get('Accept-Encoding');
  
  if (acceptEncoding && acceptEncoding.includes('gzip')) {
    res.set('Content-Encoding', 'gzip');
  }
  
  next();
}

// ETags for cache validation
export function etagMiddleware(req: Request, res: Response, next: NextFunction) {
  const originalSend = res.send;
  
  res.send = function(body: any) {
    if (typeof body === 'string' || Buffer.isBuffer(body)) {
      const etag = createHash('md5').update(body).digest('hex');
      res.set('ETag', `"${etag}"`);
      
      // Check if client has current version
      const clientEtag = req.get('If-None-Match');
      if (clientEtag === `"${etag}"`) {
        return res.status(304).end();
      }
    }
    
    return originalSend.call(this, body);
  };
  
  next();
}

export default {
  cacheManager,
  createCacheMiddleware,
  cacheMiddleware,
  invalidateCache,
  getCacheStats,
  warmCache,
  initializeRedis,
  compressionMiddleware,
  etagMiddleware,
};