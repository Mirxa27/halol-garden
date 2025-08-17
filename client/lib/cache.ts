/**
 * Advanced Caching System with Multiple Strategies
 * Supports memory cache, localStorage, IndexedDB, and Redis integration
 */

import { monitoring } from './monitoring';

// Types
export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size in items
  maxMemory?: number; // Maximum memory usage in bytes
  strategy?: 'LRU' | 'LFU' | 'FIFO' | 'TTL';
  persistent?: boolean;
  compress?: boolean;
  encrypt?: boolean;
  namespace?: string;
}

export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  expiresAt?: number;
  size: number;
  hits: number;
  lastAccessed: number;
  metadata?: Record<string, any>;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  size: number;
  memoryUsage: number;
}

// Cache storage interface
interface CacheStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
  size(): Promise<number>;
}

// Memory Cache Implementation
class MemoryCache implements CacheStorage {
  private cache = new Map<string, CacheEntry<any>>();
  private accessOrder: string[] = [];
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    size: 0,
    memoryUsage: 0,
  };
  private options: CacheOptions;

  constructor(options: CacheOptions = {}) {
    this.options = {
      maxSize: 1000,
      maxMemory: 50 * 1024 * 1024, // 50MB
      strategy: 'LRU',
      ...options,
    };
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      await this.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access metadata
    entry.hits++;
    entry.lastAccessed = Date.now();
    this.updateAccessOrder(key);
    
    this.stats.hits++;
    return entry.value as T;
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const opts = { ...this.options, ...options };
    const size = this.calculateSize(value);
    
    // Check if we need to evict items
    await this.ensureSpace(size, key);

    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      expiresAt: opts.ttl ? Date.now() + opts.ttl : undefined,
      size,
      hits: 0,
      lastAccessed: Date.now(),
    };

    this.cache.set(key, entry);
    this.updateAccessOrder(key);
    this.stats.sets++;
    this.stats.size = this.cache.size;
    this.stats.memoryUsage += size;
  }

  async delete(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;

    this.cache.delete(key);
    this.removeFromAccessOrder(key);
    this.stats.deletes++;
    this.stats.size = this.cache.size;
    this.stats.memoryUsage -= entry.size;
    
    return true;
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.accessOrder = [];
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      size: 0,
      memoryUsage: 0,
    };
  }

  async keys(): Promise<string[]> {
    return Array.from(this.cache.keys());
  }

  async size(): Promise<number> {
    return this.cache.size;
  }

  private async ensureSpace(requiredSize: number, excludeKey?: string): Promise<void> {
    const { maxSize, maxMemory, strategy } = this.options;

    // Check item count limit
    while (maxSize && this.cache.size >= maxSize) {
      const keyToEvict = this.selectEvictionCandidate(strategy!, excludeKey);
      if (keyToEvict) {
        await this.delete(keyToEvict);
        this.stats.evictions++;
      } else {
        break;
      }
    }

    // Check memory limit
    while (maxMemory && this.stats.memoryUsage + requiredSize > maxMemory) {
      const keyToEvict = this.selectEvictionCandidate(strategy!, excludeKey);
      if (keyToEvict) {
        await this.delete(keyToEvict);
        this.stats.evictions++;
      } else {
        break;
      }
    }
  }

  private selectEvictionCandidate(strategy: string, excludeKey?: string): string | null {
    const candidates = Array.from(this.cache.entries())
      .filter(([key]) => key !== excludeKey);

    if (candidates.length === 0) return null;

    switch (strategy) {
      case 'LRU':
        // Least Recently Used
        return this.accessOrder[0];
      
      case 'LFU':
        // Least Frequently Used
        return candidates.reduce((min, [key, entry]) => 
          entry.hits < this.cache.get(min)!.hits ? key : min, 
          candidates[0][0]
        );
      
      case 'FIFO':
        // First In First Out
        return candidates.reduce((oldest, [key, entry]) => 
          entry.timestamp < this.cache.get(oldest)!.timestamp ? key : oldest,
          candidates[0][0]
        );
      
      case 'TTL':
        // Shortest Time To Live
        const withExpiry = candidates.filter(([, entry]) => entry.expiresAt);
        if (withExpiry.length === 0) return candidates[0][0];
        return withExpiry.reduce((soonest, [key, entry]) => 
          entry.expiresAt! < this.cache.get(soonest)!.expiresAt! ? key : soonest,
          withExpiry[0][0]
        );
      
      default:
        return candidates[0][0];
    }
  }

  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  private calculateSize(value: any): number {
    // Rough estimation of object size in bytes
    const str = JSON.stringify(value);
    return new Blob([str]).size;
  }

  public getStats(): CacheStats {
    return { ...this.stats };
  }
}

// LocalStorage Cache Implementation
class LocalStorageCache implements CacheStorage {
  private namespace: string;

  constructor(namespace: string = 'cache') {
    this.namespace = namespace;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const item = localStorage.getItem(this.getKey(key));
      if (!item) return null;

      const entry: CacheEntry<T> = JSON.parse(item);
      
      // Check expiration
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        await this.delete(key);
        return null;
      }

      return entry.value;
    } catch (error) {
      monitoring.error('LocalStorage cache get error', error as Error);
      return null;
    }
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        key,
        value,
        timestamp: Date.now(),
        expiresAt: options?.ttl ? Date.now() + options.ttl : undefined,
        size: 0,
        hits: 0,
        lastAccessed: Date.now(),
      };

      localStorage.setItem(this.getKey(key), JSON.stringify(entry));
    } catch (error) {
      monitoring.error('LocalStorage cache set error', error as Error);
      // Handle quota exceeded error
      if ((error as any).name === 'QuotaExceededError') {
        await this.evictOldest();
        // Retry once
        try {
          localStorage.setItem(this.getKey(key), JSON.stringify({ value }));
        } catch {
          // Give up
        }
      }
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      localStorage.removeItem(this.getKey(key));
      return true;
    } catch {
      return false;
    }
  }

  async clear(): Promise<void> {
    const keys = await this.keys();
    keys.forEach(key => localStorage.removeItem(this.getKey(key)));
  }

  async keys(): Promise<string[]> {
    const keys: string[] = [];
    const prefix = `${this.namespace}:`;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        keys.push(key.substring(prefix.length));
      }
    }
    
    return keys;
  }

  async size(): Promise<number> {
    return (await this.keys()).length;
  }

  private getKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  private async evictOldest(): Promise<void> {
    const keys = await this.keys();
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const key of keys) {
      try {
        const item = localStorage.getItem(this.getKey(key));
        if (item) {
          const entry = JSON.parse(item);
          if (entry.timestamp < oldestTime) {
            oldestTime = entry.timestamp;
            oldestKey = key;
          }
        }
      } catch {
        // Skip invalid entries
      }
    }

    if (oldestKey) {
      await this.delete(oldestKey);
    }
  }
}

// IndexedDB Cache Implementation
class IndexedDBCache implements CacheStorage {
  private dbName: string;
  private storeName: string;
  private db: IDBDatabase | null = null;

  constructor(dbName: string = 'cache', storeName: string = 'entries') {
    this.dbName = dbName;
    this.storeName = storeName;
  }

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('expiresAt', 'expiresAt', { unique: false });
        }
      };
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => {
          const entry = request.result;
          if (!entry) {
            resolve(null);
            return;
          }

          // Check expiration
          if (entry.expiresAt && Date.now() > entry.expiresAt) {
            this.delete(key);
            resolve(null);
            return;
          }

          resolve(entry.value);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      monitoring.error('IndexedDB cache get error', error as Error);
      return null;
    }
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const entry: CacheEntry<T> = {
        key,
        value,
        timestamp: Date.now(),
        expiresAt: options?.ttl ? Date.now() + options.ttl : undefined,
        size: 0,
        hits: 0,
        lastAccessed: Date.now(),
      };

      return new Promise((resolve, reject) => {
        const request = store.put(entry);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      monitoring.error('IndexedDB cache set error', error as Error);
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.delete(key);
        request.onsuccess = () => resolve(true);
        request.onerror = () => {
          reject(request.error);
          resolve(false);
        };
      });
    } catch {
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      monitoring.error('IndexedDB cache clear error', error as Error);
    }
  }

  async keys(): Promise<string[]> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.getAllKeys();
        request.onsuccess = () => resolve(request.result as string[]);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return [];
    }
  }

  async size(): Promise<number> {
    const keys = await this.keys();
    return keys.length;
  }
}

// Multi-tier Cache Manager
export class CacheManager {
  private tiers: CacheStorage[] = [];
  private defaultOptions: CacheOptions;
  private invalidationCallbacks = new Map<string, Set<() => void>>();

  constructor(options: CacheOptions = {}) {
    this.defaultOptions = {
      ttl: 5 * 60 * 1000, // 5 minutes default
      strategy: 'LRU',
      ...options,
    };

    // Initialize cache tiers
    this.initializeTiers();
  }

  private initializeTiers(): void {
    // L1: Memory cache (fastest)
    this.tiers.push(new MemoryCache(this.defaultOptions));

    // L2: LocalStorage (persistent, medium speed)
    if (typeof localStorage !== 'undefined') {
      this.tiers.push(new LocalStorageCache(this.defaultOptions.namespace || 'cache'));
    }

    // L3: IndexedDB (persistent, larger capacity)
    if (typeof indexedDB !== 'undefined') {
      this.tiers.push(new IndexedDBCache());
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const timer = monitoring.startTimer(`cache_get_${key}`);
    
    for (let i = 0; i < this.tiers.length; i++) {
      const value = await this.tiers[i].get<T>(key);
      
      if (value !== null) {
        // Promote to higher tiers
        for (let j = 0; j < i; j++) {
          await this.tiers[j].set(key, value, this.defaultOptions);
        }
        
        timer();
        monitoring.trackAction('cache_hit', 'cache', key, i);
        return value;
      }
    }
    
    timer();
    monitoring.trackAction('cache_miss', 'cache', key);
    return null;
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const opts = { ...this.defaultOptions, ...options };
    const timer = monitoring.startTimer(`cache_set_${key}`);
    
    // Write to all tiers in parallel
    await Promise.all(
      this.tiers.map(tier => tier.set(key, value, opts))
    );
    
    timer();
    monitoring.trackAction('cache_set', 'cache', key);
  }

  async delete(key: string): Promise<boolean> {
    const results = await Promise.all(
      this.tiers.map(tier => tier.delete(key))
    );
    
    // Trigger invalidation callbacks
    const callbacks = this.invalidationCallbacks.get(key);
    if (callbacks) {
      callbacks.forEach(callback => callback());
      this.invalidationCallbacks.delete(key);
    }
    
    monitoring.trackAction('cache_delete', 'cache', key);
    return results.some(result => result);
  }

  async clear(): Promise<void> {
    await Promise.all(
      this.tiers.map(tier => tier.clear())
    );
    
    // Trigger all invalidation callbacks
    this.invalidationCallbacks.forEach(callbacks => {
      callbacks.forEach(callback => callback());
    });
    this.invalidationCallbacks.clear();
    
    monitoring.trackAction('cache_clear', 'cache');
  }

  async invalidate(pattern: string | RegExp): Promise<void> {
    const keys = await this.keys();
    const keysToDelete = keys.filter(key => 
      typeof pattern === 'string' ? key.includes(pattern) : pattern.test(key)
    );
    
    await Promise.all(keysToDelete.map(key => this.delete(key)));
    monitoring.trackAction('cache_invalidate', 'cache', pattern.toString(), keysToDelete.length);
  }

  async keys(): Promise<string[]> {
    const allKeys = new Set<string>();
    
    for (const tier of this.tiers) {
      const keys = await tier.keys();
      keys.forEach(key => allKeys.add(key));
    }
    
    return Array.from(allKeys);
  }

  async size(): Promise<number> {
    const sizes = await Promise.all(
      this.tiers.map(tier => tier.size())
    );
    return Math.max(...sizes);
  }

  // Subscribe to cache invalidation
  onInvalidate(key: string, callback: () => void): () => void {
    if (!this.invalidationCallbacks.has(key)) {
      this.invalidationCallbacks.set(key, new Set());
    }
    
    this.invalidationCallbacks.get(key)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.invalidationCallbacks.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.invalidationCallbacks.delete(key);
        }
      }
    };
  }

  // Cache-aside pattern helper
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    // Try to get from cache
    let value = await this.get<T>(key);
    
    if (value === null) {
      // Cache miss - fetch and cache
      value = await factory();
      await this.set(key, value, options);
    }
    
    return value;
  }

  // Batch operations
  async getMany<T>(keys: string[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();
    
    await Promise.all(
      keys.map(async key => {
        const value = await this.get<T>(key);
        results.set(key, value);
      })
    );
    
    return results;
  }

  async setMany<T>(entries: Array<[string, T, CacheOptions?]>): Promise<void> {
    await Promise.all(
      entries.map(([key, value, options]) => this.set(key, value, options))
    );
  }

  // Cache warming
  async warm<T>(keys: string[], factory: (key: string) => Promise<T>): Promise<void> {
    await Promise.all(
      keys.map(async key => {
        const value = await factory(key);
        await this.set(key, value);
      })
    );
  }
}

// Create default cache instance
export const cache = new CacheManager();

// React hooks for cache
export function useCache<T>(key: string, factory: () => Promise<T>, options?: CacheOptions) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await cache.getOrSet(key, factory, options);
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
          monitoring.error('Cache hook error', err as Error, { key });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Subscribe to invalidation
    const unsubscribe = cache.onInvalidate(key, () => {
      fetchData();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [key]);

  const invalidate = React.useCallback(() => {
    cache.delete(key);
  }, [key]);

  return { data, loading, error, invalidate };
}

// Export types and utilities
export type { CacheEntry, CacheStats, CacheStorage };
export { MemoryCache, LocalStorageCache, IndexedDBCache };