/**
 * Caching Service
 * Provides in-memory caching with Redis support
 */

import { Redis } from 'ioredis';

class CacheService {
  private client: Redis | null = null;
  private memoryCache: Map<string, { value: any; expiry: number }> = new Map();
  private readonly DEFAULT_TTL = 300; // 5 minutes

  constructor() {
    this.initializeRedis();
  }

  private initializeRedis() {
    if (process.env.REDIS_URL) {
      try {
        this.client = new Redis(process.env.REDIS_URL, {
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
        });

        this.client.on('error', (err) => {
          console.error('Redis error:', err);
          // Fall back to memory cache
          this.client = null;
        });

        this.client.on('connect', () => {
          console.log('Redis connected');
        });
      } catch (error) {
        console.error('Failed to initialize Redis:', error);
        this.client = null;
      }
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      // Try Redis first
      if (this.client) {
        const value = await this.client.get(key);
        if (value) {
          return JSON.parse(value);
        }
      }

      // Fall back to memory cache
      const cached = this.memoryCache.get(key);
      if (cached && cached.expiry > Date.now()) {
        return cached.value;
      }

      // Clean up expired entry
      if (cached) {
        this.memoryCache.delete(key);
      }

      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const ttlSeconds = ttl || this.DEFAULT_TTL;

    try {
      // Try Redis first
      if (this.client) {
        await this.client.setex(key, ttlSeconds, JSON.stringify(value));
      }

      // Also set in memory cache as backup
      this.memoryCache.set(key, {
        value,
        expiry: Date.now() + (ttlSeconds * 1000),
      });

      // Periodic cleanup of memory cache
      if (this.memoryCache.size > 1000) {
        this.cleanupMemoryCache();
      }
    } catch (error) {
      console.error('Cache set error:', error);
      // Still set in memory cache even if Redis fails
      this.memoryCache.set(key, {
        value,
        expiry: Date.now() + (ttlSeconds * 1000),
      });
    }
  }

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<void> {
    try {
      if (this.client) {
        await this.client.del(key);
      }
      this.memoryCache.delete(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Delete keys matching pattern
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      if (this.client) {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      }

      // Clean memory cache
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      for (const key of this.memoryCache.keys()) {
        if (regex.test(key)) {
          this.memoryCache.delete(key);
        }
      }
    } catch (error) {
      console.error('Cache pattern delete error:', error);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      if (this.client) {
        await this.client.flushdb();
      }
      this.memoryCache.clear();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Get or set cache value
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Invalidate multiple cache keys
   */
  async invalidate(keys: string[]): Promise<void> {
    await Promise.all(keys.map(key => this.del(key)));
  }

  /**
   * Clean up expired entries from memory cache
   */
  private cleanupMemoryCache() {
    const now = Date.now();
    for (const [key, cached] of this.memoryCache.entries()) {
      if (cached.expiry <= now) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    const stats = {
      memoryCache: {
        size: this.memoryCache.size,
        keys: Array.from(this.memoryCache.keys()),
      },
      redis: null as any,
    };

    if (this.client) {
      try {
        const info = await this.client.info('memory');
        const dbSize = await this.client.dbsize();
        stats.redis = {
          connected: this.client.status === 'ready',
          dbSize,
          memory: info,
        };
      } catch (error) {
        stats.redis = { connected: false, error: error.message };
      }
    }

    return stats;
  }
}

// Export singleton instance
export const cache = new CacheService();

// Cache key helpers
export const CacheKeys = {
  // User cache keys
  user: (id: string) => `user:${id}`,
  userByEmail: (email: string) => `user:email:${email}`,
  userSession: (token: string) => `session:${token}`,
  
  // Product cache keys
  product: (id: string) => `product:${id}`,
  productList: (page: number, limit: number) => `products:list:${page}:${limit}`,
  featuredProducts: () => 'products:featured',
  productSearch: (query: string) => `products:search:${Buffer.from(query).toString('base64')}`,
  
  // Order cache keys
  order: (id: string) => `order:${id}`,
  userOrders: (userId: string, page: number) => `orders:user:${userId}:${page}`,
  
  // Cart cache keys
  cart: (userId: string) => `cart:${userId}`,
  
  // Category cache keys
  categories: () => 'categories:all',
  categoryProducts: (category: string, page: number) => `category:${category}:products:${page}`,
  
  // Stats cache keys
  userStats: (userId: string) => `stats:user:${userId}`,
  supplierStats: (supplierId: string) => `stats:supplier:${supplierId}`,
  systemStats: () => 'stats:system',
} as const;

// Cache TTL values (in seconds)
export const CacheTTL = {
  SHORT: 60,        // 1 minute
  MEDIUM: 300,      // 5 minutes
  LONG: 3600,       // 1 hour
  VERY_LONG: 86400, // 24 hours
} as const;