/**
 * Advanced Rate Limiting Middleware
 * Implements multiple strategies for rate limiting with Redis backend
 */

import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { monitoring } from '../../client/lib/monitoring';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Rate limit strategies
export enum RateLimitStrategy {
  FIXED_WINDOW = 'fixed_window',
  SLIDING_WINDOW = 'sliding_window',
  TOKEN_BUCKET = 'token_bucket',
  LEAKY_BUCKET = 'leaky_bucket',
  ADAPTIVE = 'adaptive',
}

// Rate limit configuration
export interface RateLimitConfig {
  strategy: RateLimitStrategy;
  points: number; // Number of requests
  duration: number; // Time window in seconds
  blockDuration?: number; // Block duration in seconds after limit exceeded
  keyPrefix?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  customKeyGenerator?: (req: Request) => string;
  customErrorMessage?: string | ((req: Request, retryAfter: number) => string);
  customHandler?: (req: Request, res: Response, next: NextFunction, info: RateLimitInfo) => void;
}

// Rate limit info
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
  blocked?: boolean;
}

// Rate limiter tiers
export const RATE_LIMIT_TIERS = {
  public: {
    points: 100,
    duration: 3600, // 1 hour
  },
  authenticated: {
    points: 500,
    duration: 3600,
  },
  premium: {
    points: 2000,
    duration: 3600,
  },
  enterprise: {
    points: 10000,
    duration: 3600,
  },
};

/**
 * Advanced Rate Limiter Class
 */
export class AdvancedRateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyPrefix: 'rate_limit',
      strategy: RateLimitStrategy.SLIDING_WINDOW,
      ...config,
    };
  }

  /**
   * Generate rate limit key
   */
  private getKey(req: Request): string {
    if (this.config.customKeyGenerator) {
      return `${this.config.keyPrefix}:${this.config.customKeyGenerator(req)}`;
    }

    // Default key generation based on IP and user
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userId = (req as any).user?.id || 'anonymous';
    const endpoint = `${req.method}:${req.path}`;

    return `${this.config.keyPrefix}:${ip}:${userId}:${endpoint}`;
  }

  /**
   * Fixed window rate limiting
   */
  private async fixedWindow(key: string): Promise<RateLimitInfo> {
    const windowKey = `${key}:${Math.floor(Date.now() / 1000 / this.config.duration)}`;
    
    const multi = redis.multi();
    multi.incr(windowKey);
    multi.expire(windowKey, this.config.duration);
    const results = await multi.exec();

    const count = results?.[0]?.[1] as number;
    const ttl = await redis.ttl(windowKey);

    return {
      limit: this.config.points,
      remaining: Math.max(0, this.config.points - count),
      resetTime: new Date(Date.now() + ttl * 1000),
    };
  }

  /**
   * Sliding window rate limiting
   */
  private async slidingWindow(key: string): Promise<RateLimitInfo> {
    const now = Date.now();
    const windowStart = now - this.config.duration * 1000;

    // Remove old entries
    await redis.zremrangebyscore(key, '-inf', windowStart);

    // Add current request
    await redis.zadd(key, now, `${now}-${Math.random()}`);

    // Count requests in window
    const count = await redis.zcard(key);

    // Set expiry
    await redis.expire(key, this.config.duration);

    return {
      limit: this.config.points,
      remaining: Math.max(0, this.config.points - count),
      resetTime: new Date(now + this.config.duration * 1000),
    };
  }

  /**
   * Token bucket rate limiting
   */
  private async tokenBucket(key: string): Promise<RateLimitInfo> {
    const bucketKey = `${key}:bucket`;
    const timestampKey = `${key}:timestamp`;

    const now = Date.now();
    const refillRate = this.config.points / this.config.duration;

    // Get current bucket state
    const [tokens, lastRefill] = await Promise.all([
      redis.get(bucketKey),
      redis.get(timestampKey),
    ]);

    let currentTokens = tokens ? parseFloat(tokens) : this.config.points;
    const lastRefillTime = lastRefill ? parseInt(lastRefill) : now;

    // Calculate tokens to add
    const timePassed = (now - lastRefillTime) / 1000;
    const tokensToAdd = timePassed * refillRate;
    currentTokens = Math.min(this.config.points, currentTokens + tokensToAdd);

    // Check if request can be processed
    if (currentTokens >= 1) {
      currentTokens -= 1;
      
      // Update bucket
      await redis.set(bucketKey, currentTokens);
      await redis.set(timestampKey, now);
      await redis.expire(bucketKey, this.config.duration);
      await redis.expire(timestampKey, this.config.duration);

      return {
        limit: this.config.points,
        remaining: Math.floor(currentTokens),
        resetTime: new Date(now + (this.config.points - currentTokens) / refillRate * 1000),
      };
    }

    // Calculate retry after
    const tokensNeeded = 1 - currentTokens;
    const retryAfter = Math.ceil(tokensNeeded / refillRate);

    return {
      limit: this.config.points,
      remaining: 0,
      resetTime: new Date(now + retryAfter * 1000),
      retryAfter,
    };
  }

  /**
   * Leaky bucket rate limiting
   */
  private async leakyBucket(key: string): Promise<RateLimitInfo> {
    const queueKey = `${key}:queue`;
    const processKey = `${key}:process`;

    const now = Date.now();
    const leakRate = this.config.points / this.config.duration;

    // Get last process time
    const lastProcess = await redis.get(processKey);
    const lastProcessTime = lastProcess ? parseInt(lastProcess) : now;

    // Calculate leaked requests
    const timePassed = (now - lastProcessTime) / 1000;
    const leaked = Math.floor(timePassed * leakRate);

    // Get current queue size
    let queueSize = await redis.llen(queueKey);

    // Process leaked requests
    if (leaked > 0) {
      await redis.ltrim(queueKey, leaked, -1);
      queueSize = Math.max(0, queueSize - leaked);
      await redis.set(processKey, now);
    }

    // Check if queue has space
    if (queueSize < this.config.points) {
      await redis.rpush(queueKey, now);
      await redis.expire(queueKey, this.config.duration);
      await redis.expire(processKey, this.config.duration);

      return {
        limit: this.config.points,
        remaining: Math.max(0, this.config.points - queueSize - 1),
        resetTime: new Date(now + this.config.duration * 1000),
      };
    }

    // Queue is full
    const retryAfter = Math.ceil(1 / leakRate);

    return {
      limit: this.config.points,
      remaining: 0,
      resetTime: new Date(now + retryAfter * 1000),
      retryAfter,
    };
  }

  /**
   * Adaptive rate limiting based on system load
   */
  private async adaptiveRateLimit(key: string): Promise<RateLimitInfo> {
    // Get system metrics
    const cpuUsage = await this.getSystemCPUUsage();
    const memoryUsage = await this.getSystemMemoryUsage();
    const responseTime = await this.getAverageResponseTime();

    // Calculate adaptive multiplier
    let multiplier = 1.0;
    
    if (cpuUsage > 80) multiplier *= 0.5;
    else if (cpuUsage > 60) multiplier *= 0.75;
    
    if (memoryUsage > 85) multiplier *= 0.5;
    else if (memoryUsage > 70) multiplier *= 0.75;
    
    if (responseTime > 1000) multiplier *= 0.5;
    else if (responseTime > 500) multiplier *= 0.75;

    // Adjust limits
    const adjustedPoints = Math.floor(this.config.points * multiplier);

    // Use sliding window with adjusted limits
    const tempConfig = this.config;
    this.config = { ...this.config, points: adjustedPoints };
    const result = await this.slidingWindow(key);
    this.config = tempConfig;

    return result;
  }

  /**
   * Check if request is blocked
   */
  private async isBlocked(key: string): Promise<{ blocked: boolean; ttl?: number }> {
    if (!this.config.blockDuration) {
      return { blocked: false };
    }

    const blockKey = `${key}:blocked`;
    const ttl = await redis.ttl(blockKey);

    if (ttl > 0) {
      return { blocked: true, ttl };
    }

    return { blocked: false };
  }

  /**
   * Block key for specified duration
   */
  private async block(key: string): Promise<void> {
    if (!this.config.blockDuration) return;

    const blockKey = `${key}:blocked`;
    await redis.set(blockKey, '1', 'EX', this.config.blockDuration);
  }

  /**
   * Main consume method
   */
  async consume(req: Request): Promise<RateLimitInfo> {
    const key = this.getKey(req);

    // Check if blocked
    const blockStatus = await this.isBlocked(key);
    if (blockStatus.blocked) {
      return {
        limit: this.config.points,
        remaining: 0,
        resetTime: new Date(Date.now() + (blockStatus.ttl || 0) * 1000),
        retryAfter: blockStatus.ttl,
        blocked: true,
      };
    }

    // Apply rate limiting based on strategy
    let info: RateLimitInfo;

    switch (this.config.strategy) {
      case RateLimitStrategy.FIXED_WINDOW:
        info = await this.fixedWindow(key);
        break;
      case RateLimitStrategy.SLIDING_WINDOW:
        info = await this.slidingWindow(key);
        break;
      case RateLimitStrategy.TOKEN_BUCKET:
        info = await this.tokenBucket(key);
        break;
      case RateLimitStrategy.LEAKY_BUCKET:
        info = await this.leakyBucket(key);
        break;
      case RateLimitStrategy.ADAPTIVE:
        info = await this.adaptiveRateLimit(key);
        break;
      default:
        info = await this.slidingWindow(key);
    }

    // Block if limit exceeded
    if (info.remaining === 0 && this.config.blockDuration) {
      await this.block(key);
    }

    return info;
  }

  /**
   * Reset rate limit for key
   */
  async reset(req: Request): Promise<void> {
    const key = this.getKey(req);
    const blockKey = `${key}:blocked`;

    await redis.del(key, blockKey, `${key}:bucket`, `${key}:timestamp`, `${key}:queue`, `${key}:process`);
  }

  /**
   * Get system CPU usage
   */
  private async getSystemCPUUsage(): Promise<number> {
    // Implementation would connect to monitoring service
    return 50; // Mock value
  }

  /**
   * Get system memory usage
   */
  private async getSystemMemoryUsage(): Promise<number> {
    // Implementation would connect to monitoring service
    return 60; // Mock value
  }

  /**
   * Get average response time
   */
  private async getAverageResponseTime(): Promise<number> {
    // Implementation would connect to monitoring service
    return 200; // Mock value in ms
  }
}

/**
 * Rate limiting middleware factory
 */
export function createRateLimiter(config: Partial<RateLimitConfig> = {}) {
  const limiter = new AdvancedRateLimiter({
    strategy: RateLimitStrategy.SLIDING_WINDOW,
    points: 100,
    duration: 3600,
    ...config,
  });

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip rate limiting for whitelisted IPs
      if (isWhitelisted(req)) {
        return next();
      }

      // Get user tier
      const tier = getUserTier(req);
      const tierConfig = RATE_LIMIT_TIERS[tier];

      // Apply tier-specific limits
      if (tierConfig) {
        limiter['config'].points = tierConfig.points;
        limiter['config'].duration = tierConfig.duration;
      }

      // Consume rate limit
      const info = await limiter.consume(req);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', info.limit);
      res.setHeader('X-RateLimit-Remaining', info.remaining);
      res.setHeader('X-RateLimit-Reset', info.resetTime.toISOString());

      if (info.remaining === 0) {
        res.setHeader('Retry-After', info.retryAfter || 60);

        // Custom handler
        if (config.customHandler) {
          return config.customHandler(req, res, next, info);
        }

        // Default error response
        const message = config.customErrorMessage
          ? typeof config.customErrorMessage === 'function'
            ? config.customErrorMessage(req, info.retryAfter || 60)
            : config.customErrorMessage
          : `Rate limit exceeded. Try again in ${info.retryAfter || 60} seconds.`;

        return res.status(429).json({
          error: 'RATE_LIMIT_EXCEEDED',
          message,
          retryAfter: info.retryAfter,
          resetTime: info.resetTime,
        });
      }

      // Log rate limit consumption
      monitoring.debug('Rate limit consumed', {
        key: limiter['getKey'](req),
        remaining: info.remaining,
        limit: info.limit,
      });

      next();
    } catch (error) {
      monitoring.error('Rate limiting error', error as Error);
      // Fail open - allow request if rate limiting fails
      next();
    }
  };
}

/**
 * Check if IP is whitelisted
 */
function isWhitelisted(req: Request): boolean {
  const whitelist = (process.env.RATE_LIMIT_WHITELIST || '').split(',');
  const ip = req.ip || req.connection.remoteAddress || '';
  
  return whitelist.includes(ip);
}

/**
 * Get user tier for rate limiting
 */
function getUserTier(req: Request): keyof typeof RATE_LIMIT_TIERS {
  const user = (req as any).user;
  
  if (!user) return 'public';
  if (user.plan === 'enterprise') return 'enterprise';
  if (user.plan === 'premium') return 'premium';
  if (user.id) return 'authenticated';
  
  return 'public';
}

/**
 * Endpoint-specific rate limiters
 */
export const rateLimiters = {
  // General API rate limiter
  api: createRateLimiter({
    points: 100,
    duration: 3600,
    strategy: RateLimitStrategy.SLIDING_WINDOW,
  }),

  // Auth endpoints
  auth: createRateLimiter({
    points: 5,
    duration: 900, // 15 minutes
    blockDuration: 900,
    strategy: RateLimitStrategy.FIXED_WINDOW,
    customErrorMessage: 'Too many authentication attempts. Please try again later.',
  }),

  // Password reset
  passwordReset: createRateLimiter({
    points: 3,
    duration: 3600,
    blockDuration: 3600,
    strategy: RateLimitStrategy.FIXED_WINDOW,
  }),

  // File upload
  upload: createRateLimiter({
    points: 10,
    duration: 3600,
    strategy: RateLimitStrategy.TOKEN_BUCKET,
  }),

  // Search endpoints
  search: createRateLimiter({
    points: 30,
    duration: 60,
    strategy: RateLimitStrategy.LEAKY_BUCKET,
  }),

  // Webhook endpoints
  webhook: createRateLimiter({
    points: 1000,
    duration: 60,
    strategy: RateLimitStrategy.SLIDING_WINDOW,
  }),

  // GraphQL
  graphql: createRateLimiter({
    points: 100,
    duration: 60,
    strategy: RateLimitStrategy.TOKEN_BUCKET,
    customKeyGenerator: (req) => {
      // Rate limit by query complexity
      const complexity = calculateGraphQLComplexity(req.body?.query);
      return `graphql:${complexity}:${req.ip}`;
    },
  }),

  // Adaptive rate limiter for critical endpoints
  adaptive: createRateLimiter({
    points: 50,
    duration: 60,
    strategy: RateLimitStrategy.ADAPTIVE,
  }),
};

/**
 * Calculate GraphQL query complexity
 */
function calculateGraphQLComplexity(query?: string): number {
  if (!query) return 1;
  
  // Simple complexity calculation based on query depth and fields
  const depth = (query.match(/{/g) || []).length;
  const fields = (query.match(/\w+\s*:/g) || []).length;
  
  return Math.min(depth * fields, 100);
}

/**
 * Rate limit statistics
 */
export async function getRateLimitStats(): Promise<any> {
  const keys = await redis.keys('rate_limit:*');
  const stats: any = {
    totalKeys: keys.length,
    byEndpoint: {},
    byUser: {},
    blocked: [],
  };

  for (const key of keys) {
    if (key.includes(':blocked')) {
      const ttl = await redis.ttl(key);
      stats.blocked.push({ key, ttl });
    } else {
      const parts = key.split(':');
      const endpoint = parts[3] || 'unknown';
      const user = parts[2] || 'anonymous';

      stats.byEndpoint[endpoint] = (stats.byEndpoint[endpoint] || 0) + 1;
      stats.byUser[user] = (stats.byUser[user] || 0) + 1;
    }
  }

  return stats;
}

export default createRateLimiter;