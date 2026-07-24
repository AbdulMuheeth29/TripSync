import Redis from 'ioredis';
import { appLogger } from './logger';

/**
 * Redis Cache Service
 * Provides caching layer for frequently accessed data
 *
 * Features:
 * - Get/Set with TTL (time-to-live)
 * - Cache invalidation patterns
 * - Namespace support
 * - JSON serialization
 * - Graceful fallback when Redis unavailable
 */

class CacheService {
  private client: Redis | null = null;
  private enabled: boolean = false;
  private namespace: string = 'tripsync';

  constructor() {
    this.initialize();
  }

  private initialize() {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      appLogger.warn('REDIS_URL not configured. Caching disabled.');
      return;
    }

    try {
      this.client = new Redis(redisUrl, {
        // Connection options
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        enableOfflineQueue: true,

        // Reconnection strategy
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },

        // Connection timeout
        connectTimeout: 10000,

        // Lazy connect (don't block server startup)
        lazyConnect: true,
      });

      // Event handlers
      this.client.on('connect', () => {
        this.enabled = true;
        appLogger.database('Redis connected', { service: 'cache' });
      });

      this.client.on('ready', () => {
        appLogger.database('Redis ready', { service: 'cache' });
      });

      this.client.on('error', (error) => {
        this.enabled = false;
        appLogger.error(error, {
          context: 'redis_connection',
          service: 'cache',
        });
      });

      this.client.on('close', () => {
        this.enabled = false;
        appLogger.warn('Redis connection closed', { service: 'cache' });
      });

      this.client.on('reconnecting', () => {
        appLogger.debug('Redis reconnecting...', { service: 'cache' });
      });

      // Attempt to connect
      this.client.connect().catch((error) => {
        appLogger.error(error, { context: 'redis_initial_connect' });
      });
    } catch (error) {
      appLogger.error(error instanceof Error ? error : new Error(String(error)), {
        context: 'redis_initialization',
      });
    }
  }

  /**
   * Check if Redis is available
   */
  isEnabled(): boolean {
    return this.enabled && this.client !== null;
  }

  /**
   * Generate namespaced key
   */
  private key(key: string): string {
    return `${this.namespace}:${key}`;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isEnabled()) {
      return null;
    }

    try {
      const value = await this.client!.get(this.key(key));

      if (!value) {
        return null;
      }

      // Try to parse as JSON, fall back to raw value
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    } catch (error) {
      appLogger.error(error instanceof Error ? error : new Error(String(error)), {
        context: 'cache_get',
        key,
      });
      return null;
    }
  }

  /**
   * Set value in cache with TTL (time-to-live in seconds)
   */
  async set<T>(key: string, value: T, ttl: number = 3600): Promise<boolean> {
    if (!this.isEnabled()) {
      return false;
    }

    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);

      await this.client!.set(this.key(key), serialized, 'EX', ttl);

      return true;
    } catch (error) {
      appLogger.error(error instanceof Error ? error : new Error(String(error)), {
        context: 'cache_set',
        key,
        ttl,
      });
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<boolean> {
    if (!this.isEnabled()) {
      return false;
    }

    try {
      await this.client!.del(this.key(key));
      return true;
    } catch (error) {
      appLogger.error(error instanceof Error ? error : new Error(String(error)), {
        context: 'cache_del',
        key,
      });
      return false;
    }
  }

  /**
   * Delete keys matching pattern
   */
  async delPattern(pattern: string): Promise<number> {
    if (!this.isEnabled()) {
      return 0;
    }

    try {
      const keys = await this.client!.keys(this.key(pattern));

      if (keys.length === 0) {
        return 0;
      }

      await this.client!.del(...keys);
      return keys.length;
    } catch (error) {
      appLogger.error(error instanceof Error ? error : new Error(String(error)), {
        context: 'cache_del_pattern',
        pattern,
      });
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isEnabled()) {
      return false;
    }

    try {
      const result = await this.client!.exists(this.key(key));
      return result === 1;
    } catch (error) {
      appLogger.error(error instanceof Error ? error : new Error(String(error)), {
        context: 'cache_exists',
        key,
      });
      return false;
    }
  }

  /**
   * Get or set (cache-aside pattern)
   * If key exists, return cached value
   * If key doesn't exist, call factory function, cache result, and return it
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl: number = 3600): Promise<T | null> {
    // Try to get from cache
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    // Cache miss, call factory function
    try {
      const value = await factory();

      // Cache the result
      await this.set(key, value, ttl);

      return value;
    } catch (error) {
      appLogger.error(error instanceof Error ? error : new Error(String(error)), {
        context: 'cache_get_or_set',
        key,
      });
      return null;
    }
  }

  /**
   * Increment a counter
   */
  async incr(key: string, ttl?: number): Promise<number> {
    if (!this.isEnabled()) {
      return 0;
    }

    try {
      const value = await this.client!.incr(this.key(key));

      // Set TTL if provided and this is the first increment
      if (ttl && value === 1) {
        await this.client!.expire(this.key(key), ttl);
      }

      return value;
    } catch (error) {
      appLogger.error(error instanceof Error ? error : new Error(String(error)), {
        context: 'cache_incr',
        key,
      });
      return 0;
    }
  }

  /**
   * Set value in a hash
   */
  async hset(key: string, field: string, value: any): Promise<boolean> {
    if (!this.isEnabled()) {
      return false;
    }

    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      await this.client!.hset(this.key(key), field, serialized);
      return true;
    } catch (error) {
      appLogger.error(error instanceof Error ? error : new Error(String(error)), {
        context: 'cache_hset',
        key,
        field,
      });
      return false;
    }
  }

  /**
   * Get value from a hash
   */
  async hget<T>(key: string, field: string): Promise<T | null> {
    if (!this.isEnabled()) {
      return null;
    }

    try {
      const value = await this.client!.hget(this.key(key), field);

      if (!value) {
        return null;
      }

      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    } catch (error) {
      appLogger.error(error instanceof Error ? error : new Error(String(error)), {
        context: 'cache_hget',
        key,
        field,
      });
      return null;
    }
  }

  /**
   * Get all fields from a hash
   */
  async hgetall<T>(key: string): Promise<Record<string, T> | null> {
    if (!this.isEnabled()) {
      return null;
    }

    try {
      const data = await this.client!.hgetall(this.key(key));

      if (!data || Object.keys(data).length === 0) {
        return null;
      }

      // Parse each value
      const parsed: Record<string, T> = {};
      for (const [field, value] of Object.entries(data)) {
        try {
          parsed[field] = JSON.parse(value) as T;
        } catch {
          parsed[field] = value as T;
        }
      }

      return parsed;
    } catch (error) {
      appLogger.error(error instanceof Error ? error : new Error(String(error)), {
        context: 'cache_hgetall',
        key,
      });
      return null;
    }
  }

  /**
   * Clear all cache (use with caution!)
   */
  async clear(): Promise<boolean> {
    if (!this.isEnabled()) {
      return false;
    }

    try {
      const keys = await this.client!.keys(this.key('*'));

      if (keys.length > 0) {
        await this.client!.del(...keys);
        appLogger.warn('Cache cleared', { count: keys.length });
      }

      return true;
    } catch (error) {
      appLogger.error(error instanceof Error ? error : new Error(String(error)), {
        context: 'cache_clear',
      });
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async stats(): Promise<{
    enabled: boolean;
    connected: boolean;
    keyCount: number;
    memory: string;
  }> {
    const stats = {
      enabled: this.enabled,
      connected: this.client?.status === 'ready',
      keyCount: 0,
      memory: 'N/A',
    };

    if (!this.isEnabled()) {
      return stats;
    }

    try {
      const keys = await this.client!.keys(this.key('*'));
      stats.keyCount = keys.length;

      const info = await this.client!.info('memory');
      const match = info.match(/used_memory_human:(.+)/);
      if (match) {
        stats.memory = match[1].trim();
      }
    } catch (error) {
      appLogger.error(error instanceof Error ? error : new Error(String(error)), {
        context: 'cache_stats',
      });
    }

    return stats;
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
        appLogger.database('Redis connection closed gracefully', {
          service: 'cache',
        });
      } catch (error) {
        appLogger.error(error instanceof Error ? error : new Error(String(error)), {
          context: 'redis_shutdown',
        });
      }
    }
  }
}

// Export singleton instance
export const cache = new CacheService();

/**
 * Common caching patterns
 */

export const CacheKeys = {
  // User cache (TTL: 5 minutes)
  user: (userId: string) => `user:${userId}`,

  // Trip cache (TTL: 2 minutes)
  trip: (tripId: string) => `trip:${tripId}`,
  tripMembers: (tripId: string) => `trip:${tripId}:members`,
  tripItinerary: (tripId: string) => `trip:${tripId}:itinerary`,

  // Subscription cache (TTL: 10 minutes)
  subscription: (userId: string) => `subscription:${userId}`,

  // Rate limiting (TTL: 1 hour)
  rateLimit: (userId: string, endpoint: string) => `ratelimit:${userId}:${endpoint}`,

  // Token blacklist (TTL: based on token expiration)
  tokenBlacklist: (token: string) => `blacklist:${token}`,

  // AI generation cache (TTL: 24 hours)
  aiGeneration: (tripId: string, type: string) => `ai:${tripId}:${type}`,
};

export const CacheTTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
  WEEK: 604800, // 7 days
};
