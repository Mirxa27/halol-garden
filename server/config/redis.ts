import Redis from 'ioredis';
import { config } from 'dotenv';

config();

// Redis client configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
};

// Create Redis clients
export const redisClient = new Redis(redisConfig);
export const redisSubscriber = new Redis(redisConfig);
export const redisPublisher = new Redis(redisConfig);

// Error handling
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisSubscriber.on('error', (err) => {
  console.error('Redis Subscriber Error:', err);
});

redisPublisher.on('error', (err) => {
  console.error('Redis Publisher Error:', err);
});

// Connection events
redisClient.on('connect', () => {
  console.log('Redis Client Connected');
});

redisClient.on('ready', () => {
  console.log('Redis Client Ready');
});

// Cache key prefixes
export const CacheKeys = {
  USER: 'user:',
  SESSION: 'session:',
  PRODUCT: 'product:',
  CART: 'cart:',
  ORDER: 'order:',
  RENTAL: 'rental:',
  MAINTENANCE: 'maintenance:',
  CHAT: 'chat:',
  NOTIFICATION: 'notification:',
  SEARCH: 'search:',
  ANALYTICS: 'analytics:',
  RATE_LIMIT: 'rate_limit:',
} as const;

// Cache TTL values (in seconds)
export const CacheTTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 3600, // 1 hour
  LONG: 86400, // 24 hours
  SESSION: 604800, // 7 days
  PERMANENT: 0, // No expiration
} as const;

// Cache utilities
export class CacheService {
  /**
   * Get value from cache
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redisClient.get(key);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  static async set<T>(key: string, value: T, ttl: number = CacheTTL.MEDIUM): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl > 0) {
        await redisClient.setex(key, ttl, serialized);
      } else {
        await redisClient.set(key, serialized);
      }
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  static async delete(key: string): Promise<boolean> {
    try {
      const result = await redisClient.del(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  static async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        return await redisClient.del(...keys);
      }
      return 0;
    } catch (error) {
      console.error(`Cache delete pattern error for ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  static async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Increment counter
   */
  static async increment(key: string, amount: number = 1): Promise<number> {
    try {
      return await redisClient.incrby(key, amount);
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Set hash field
   */
  static async hset(key: string, field: string, value: any): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      await redisClient.hset(key, field, serialized);
      return true;
    } catch (error) {
      console.error(`Cache hset error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get hash field
   */
  static async hget<T>(key: string, field: string): Promise<T | null> {
    try {
      const value = await redisClient.hget(key, field);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      console.error(`Cache hget error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Get all hash fields
   */
  static async hgetall<T>(key: string): Promise<Record<string, T> | null> {
    try {
      const hash = await redisClient.hgetall(key);
      if (Object.keys(hash).length === 0) {
        return null;
      }
      const result: Record<string, T> = {};
      for (const [field, value] of Object.entries(hash)) {
        result[field] = JSON.parse(value);
      }
      return result;
    } catch (error) {
      console.error(`Cache hgetall error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Add to sorted set
   */
  static async zadd(key: string, score: number, member: string): Promise<boolean> {
    try {
      await redisClient.zadd(key, score, member);
      return true;
    } catch (error) {
      console.error(`Cache zadd error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get sorted set range
   */
  static async zrange(key: string, start: number, stop: number, withScores: boolean = false): Promise<string[]> {
    try {
      if (withScores) {
        return await redisClient.zrange(key, start, stop, 'WITHSCORES');
      }
      return await redisClient.zrange(key, start, stop);
    } catch (error) {
      console.error(`Cache zrange error for key ${key}:`, error);
      return [];
    }
  }

  /**
   * Publish message to channel
   */
  static async publish(channel: string, message: any): Promise<boolean> {
    try {
      const serialized = JSON.stringify(message);
      await redisPublisher.publish(channel, serialized);
      return true;
    } catch (error) {
      console.error(`Publish error for channel ${channel}:`, error);
      return false;
    }
  }

  /**
   * Subscribe to channel
   */
  static async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    try {
      await redisSubscriber.subscribe(channel);
      redisSubscriber.on('message', (receivedChannel, message) => {
        if (receivedChannel === channel) {
          try {
            const parsed = JSON.parse(message);
            callback(parsed);
          } catch (error) {
            console.error(`Parse error for channel ${channel}:`, error);
          }
        }
      });
    } catch (error) {
      console.error(`Subscribe error for channel ${channel}:`, error);
    }
  }

  /**
   * Unsubscribe from channel
   */
  static async unsubscribe(channel: string): Promise<void> {
    try {
      await redisSubscriber.unsubscribe(channel);
    } catch (error) {
      console.error(`Unsubscribe error for channel ${channel}:`, error);
    }
  }
}

// Session management
export class SessionManager {
  static async createSession(userId: string, sessionData: any, ttl: number = CacheTTL.SESSION): Promise<string> {
    const sessionId = `${CacheKeys.SESSION}${userId}:${Date.now()}`;
    await CacheService.set(sessionId, sessionData, ttl);
    return sessionId;
  }

  static async getSession(sessionId: string): Promise<any> {
    return await CacheService.get(sessionId);
  }

  static async updateSession(sessionId: string, sessionData: any, ttl: number = CacheTTL.SESSION): Promise<boolean> {
    return await CacheService.set(sessionId, sessionData, ttl);
  }

  static async deleteSession(sessionId: string): Promise<boolean> {
    return await CacheService.delete(sessionId);
  }

  static async deleteUserSessions(userId: string): Promise<number> {
    return await CacheService.deletePattern(`${CacheKeys.SESSION}${userId}:*`);
  }
}

// Rate limiting
export class RateLimiter {
  static async checkLimit(identifier: string, limit: number, window: number): Promise<boolean> {
    const key = `${CacheKeys.RATE_LIMIT}${identifier}`;
    const current = await CacheService.increment(key);
    
    if (current === 1) {
      await redisClient.expire(key, window);
    }
    
    return current <= limit;
  }

  static async getRemainingLimit(identifier: string, limit: number): Promise<number> {
    const key = `${CacheKeys.RATE_LIMIT}${identifier}`;
    const current = await redisClient.get(key);
    const used = current ? parseInt(current) : 0;
    return Math.max(0, limit - used);
  }

  static async resetLimit(identifier: string): Promise<boolean> {
    const key = `${CacheKeys.RATE_LIMIT}${identifier}`;
    return await CacheService.delete(key);
  }
}

// Real-time notifications
export class RealtimeService {
  static async sendNotification(userId: string, notification: any): Promise<void> {
    const channel = `${CacheKeys.NOTIFICATION}${userId}`;
    await CacheService.publish(channel, notification);
  }

  static async broadcastToRoom(room: string, message: any): Promise<void> {
    const channel = `room:${room}`;
    await CacheService.publish(channel, message);
  }

  static async subscribeToUserNotifications(userId: string, callback: (notification: any) => void): Promise<void> {
    const channel = `${CacheKeys.NOTIFICATION}${userId}`;
    await CacheService.subscribe(channel, callback);
  }

  static async unsubscribeFromUserNotifications(userId: string): Promise<void> {
    const channel = `${CacheKeys.NOTIFICATION}${userId}`;
    await CacheService.unsubscribe(channel);
  }
}

// Initialize Redis connection
export async function initializeRedis(): Promise<void> {
  try {
    await redisClient.connect();
    await redisSubscriber.connect();
    await redisPublisher.connect();
    console.log('Redis initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Redis:', error);
    throw error;
  }
}

// Cleanup function
export async function closeRedis(): Promise<void> {
  try {
    await redisClient.quit();
    await redisSubscriber.quit();
    await redisPublisher.quit();
    console.log('Redis connections closed');
  } catch (error) {
    console.error('Error closing Redis connections:', error);
  }
}

export default {
  redisClient,
  redisSubscriber,
  redisPublisher,
  CacheService,
  SessionManager,
  RateLimiter,
  RealtimeService,
  initializeRedis,
  closeRedis,
};