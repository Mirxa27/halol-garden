// Comprehensive Caching System
import { logger } from './logger';

// Cache configuration
interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of items
  storage: 'memory' | 'localStorage' | 'sessionStorage';
  version: string;
}

// Cache entry structure
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

// LRU Cache implementation
class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      ttl: 5 * 60 * 1000, // 5 minutes default
      maxSize: 100,
      storage: 'memory',
      version: '1.0',
      ...config,
    };

    // Load from persistent storage if configured
    if (this.config.storage !== 'memory') {
      this.loadFromStorage();
    }
  }

  set(key: string, value: T, customTTL?: number): void {
    const ttl = customTTL || this.config.ttl;
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now(),
    };

    // Remove expired entries if cache is full
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, entry);
    this.saveToStorage();

    logger.debug('Cache set', { key, ttl, cacheSize: this.cache.size });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      logger.debug('Cache miss', { key });
      return null;
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.saveToStorage();
      logger.debug('Cache expired', { key });
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    logger.debug('Cache hit', { key, accessCount: entry.accessCount });

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry ? !this.isExpired(entry) : false;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.saveToStorage();
      logger.debug('Cache entry deleted', { key });
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.saveToStorage();
    logger.info('Cache cleared');
  }

  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{
      key: string;
      size: number;
      age: number;
      accessCount: number;
      lastAccessed: number;
    }>;
  } {
    let totalAccess = 0;
    const entries: Array<{
      key: string;
      size: number;
      age: number;
      accessCount: number;
      lastAccessed: number;
    }> = [];

    this.cache.forEach((entry, key) => {
      totalAccess += entry.accessCount;
      entries.push({
        key,
        size: JSON.stringify(entry.data).length,
        age: Date.now() - entry.timestamp,
        accessCount: entry.accessCount,
        lastAccessed: entry.lastAccessed,
      });
    });

    const hitRate = totalAccess > 0 ? (totalAccess / this.cache.size) : 0;

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate,
      entries: entries.sort((a, b) => b.accessCount - a.accessCount),
    };
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    this.cache.forEach((entry, key) => {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.cache.delete(oldestKey);
      logger.debug('Cache LRU eviction', { evictedKey: oldestKey });
    }
  }

  private loadFromStorage(): void {
    if (this.config.storage === 'memory') return;

    try {
      const storage = this.getStorage();
      const cached = storage.getItem(`cache_${this.config.version}`);
      
      if (cached) {
        const parsed = JSON.parse(cached);
        
        // Validate version and restore cache
        if (parsed.version === this.config.version) {
          parsed.entries.forEach(([key, entry]: [string, CacheEntry<T>]) => {
            if (!this.isExpired(entry)) {
              this.cache.set(key, entry);
            }
          });
          logger.info('Cache loaded from storage', { 
            entriesLoaded: this.cache.size 
          });
        } else {
          logger.info('Cache version mismatch, starting fresh');
        }
      }
    } catch (error) {
      logger.error('Failed to load cache from storage', error);
    }
  }

  private saveToStorage(): void {
    if (this.config.storage === 'memory') return;

    try {
      const storage = this.getStorage();
      const cacheData = {
        version: this.config.version,
        entries: Array.from(this.cache.entries()),
      };
      
      storage.setItem(`cache_${this.config.version}`, JSON.stringify(cacheData));
    } catch (error) {
      logger.warn('Failed to save cache to storage', error);
    }
  }

  private getStorage(): Storage {
    switch (this.config.storage) {
      case 'localStorage':
        return localStorage;
      case 'sessionStorage':
        return sessionStorage;
      default:
        throw new Error('Invalid storage type for persistent cache');
    }
  }
}

// Multi-level cache manager
class CacheManager {
  private caches = new Map<string, LRUCache<any>>();
  private defaultConfig: CacheConfig = {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
    storage: 'memory',
    version: '1.0',
  };

  createCache<T>(name: string, config?: Partial<CacheConfig>): LRUCache<T> {
    const cache = new LRUCache<T>({ ...this.defaultConfig, ...config });
    this.caches.set(name, cache);
    return cache;
  }

  getCache<T>(name: string): LRUCache<T> | null {
    return this.caches.get(name) || null;
  }

  clearAll(): void {
    this.caches.forEach(cache => cache.clear());
    logger.info('All caches cleared');
  }

  getGlobalStats(): {
    totalCaches: number;
    totalSize: number;
    cacheStats: Array<{ name: string; stats: any }>;
  } {
    let totalSize = 0;
    const cacheStats: Array<{ name: string; stats: any }> = [];

    this.caches.forEach((cache, name) => {
      const stats = cache.getStats();
      totalSize += stats.size;
      cacheStats.push({ name, stats });
    });

    return {
      totalCaches: this.caches.size,
      totalSize,
      cacheStats,
    };
  }
}

// API response cache
class APICache {
  private cache: LRUCache<any>;

  constructor() {
    this.cache = new LRUCache({
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 200,
      storage: 'localStorage',
      version: 'api_v1',
    });
  }

  async getCachedResponse<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    // Fetch fresh data
    try {
      const data = await fetcher();
      this.cache.set(key, data, ttl);
      return data;
    } catch (error) {
      logger.error('API fetch failed', { key, error });
      throw error;
    }
  }

  invalidate(pattern: string): void {
    const regex = new RegExp(pattern);
    const stats = this.cache.getStats();
    
    stats.entries.forEach(entry => {
      if (regex.test(entry.key)) {
        this.cache.delete(entry.key);
      }
    });

    logger.info('Cache invalidated', { pattern });
  }

  preload(requests: Array<{ key: string; fetcher: () => Promise<any>; ttl?: number }>): void {
    requests.forEach(async ({ key, fetcher, ttl }) => {
      if (!this.cache.has(key)) {
        try {
          const data = await fetcher();
          this.cache.set(key, data, ttl);
          logger.debug('Cache preloaded', { key });
        } catch (error) {
          logger.warn('Cache preload failed', { key, error });
        }
      }
    });
  }
}

// Image cache with progressive loading
class ImageCache {
  private cache: LRUCache<string>;
  private preloadCache = new Set<string>();

  constructor() {
    this.cache = new LRUCache({
      ttl: 60 * 60 * 1000, // 1 hour
      maxSize: 50,
      storage: 'sessionStorage',
      version: 'img_v1',
    });
  }

  async loadImage(src: string, priority: 'high' | 'low' = 'low'): Promise<string> {
    // Check cache first
    const cached = this.cache.get(src);
    if (cached) {
      return cached;
    }

    // Load image
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        // Convert to base64 for small images or store URL
        if (priority === 'high') {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL();
            this.cache.set(src, dataURL);
            resolve(dataURL);
          } else {
            this.cache.set(src, src);
            resolve(src);
          }
        } else {
          this.cache.set(src, src);
          resolve(src);
        }
      };
      
      img.onerror = () => {
        logger.warn('Image load failed', { src });
        reject(new Error(`Failed to load image: ${src}`));
      };
      
      img.src = src;
    });
  }

  preloadImages(urls: string[]): void {
    urls.forEach(url => {
      if (!this.preloadCache.has(url) && !this.cache.has(url)) {
        this.preloadCache.add(url);
        this.loadImage(url, 'low').catch(() => {
          this.preloadCache.delete(url);
        });
      }
    });
  }
}

// Service worker cache management
class ServiceWorkerCache {
  private swRegistration: ServiceWorkerRegistration | null = null;

  async register(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.register('/sw.js');
        logger.info('Service Worker registered');
        
        // Listen for updates
        this.swRegistration.addEventListener('updatefound', () => {
          logger.info('Service Worker update found');
        });
      } catch (error) {
        logger.error('Service Worker registration failed', error);
      }
    }
  }

  async updateCache(cacheNames: string[]): Promise<void> {
    if (this.swRegistration) {
      // Send message to service worker to update specific caches
      this.swRegistration.active?.postMessage({
        type: 'UPDATE_CACHE',
        cacheNames,
      });
    }
  }

  async clearOldCaches(): Promise<void> {
    if (this.swRegistration) {
      this.swRegistration.active?.postMessage({
        type: 'CLEAR_OLD_CACHES',
      });
    }
  }
}

// Create singleton instances
export const cacheManager = new CacheManager();

// Pre-configured caches
export const apiCache = new APICache();
export const imageCache = new ImageCache();
export const serviceWorkerCache = new ServiceWorkerCache();

// Specific cache instances
export const userCache = cacheManager.createCache('user', {
  ttl: 15 * 60 * 1000, // 15 minutes
  maxSize: 10,
  storage: 'localStorage',
});

export const searchCache = cacheManager.createCache('search', {
  ttl: 10 * 60 * 1000, // 10 minutes
  maxSize: 50,
  storage: 'sessionStorage',
});

export const servicesCache = cacheManager.createCache('services', {
  ttl: 30 * 60 * 1000, // 30 minutes
  maxSize: 100,
  storage: 'localStorage',
});

// Cache utilities
export const CacheUtils = {
  // Clear all application caches
  clearAll: () => {
    cacheManager.clearAll();
    localStorage.removeItem('cache_api_v1');
    sessionStorage.removeItem('cache_img_v1');
    logger.info('All application caches cleared');
  },

  // Get memory usage
  getMemoryUsage: () => {
    if ('memory' in performance) {
      return (performance as any).memory;
    }
    return null;
  },

  // Cache warming strategy
  warmup: async () => {
    // Preload essential data
    await Promise.allSettled([
      apiCache.getCachedResponse('user-profile', async () => {
        // Fetch user profile
        return { id: 'current-user' };
      }),
      apiCache.getCachedResponse('app-config', async () => {
        // Fetch app configuration
        return { version: '1.0.0' };
      }),
    ]);

    // Preload critical images
    imageCache.preloadImages([
      '/logo.png',
      '/hero-bg.jpg',
      '/placeholder.svg',
    ]);

    logger.info('Cache warmup completed');
  },
};

export default {
  cacheManager,
  apiCache,
  imageCache,
  serviceWorkerCache,
  userCache,
  searchCache,
  servicesCache,
  CacheUtils,
};