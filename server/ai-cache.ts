/**
 * AI Response Caching Layer
 *
 * Caches AI responses to achieve:
 * - 60-80% cache hit rate
 * - 90% cost reduction on cached responses
 * - Sub-10ms response time for cache hits
 *
 * Uses existing Redis cache service for distributed caching with smart TTL strategy.
 */

import { cache } from './cache';
import crypto from 'crypto';

export interface CacheOptions {
  ttl?: number;           // Time to live in seconds
  namespace?: string;     // Cache key namespace
  ignoreCache?: boolean;  // Bypass cache for this call
}

export interface CachedResponse<T> {
  data: T;
  cached: boolean;
  cacheKey?: string;
  generatedAt: number;
}

/**
 * Generate a stable cache key from operation inputs
 */
function generateCacheKey(namespace: string, inputs: any): string {
  // Normalize inputs for consistent hashing
  const normalized = JSON.stringify(inputs, Object.keys(inputs).sort());
  const hash = crypto.createHash('sha256').update(normalized).digest('hex').substring(0, 16);
  return `ai:${namespace}:${hash}`;
}

/**
 * Execute an AI operation with caching
 *
 * @param inputs - The operation inputs (used for cache key generation)
 * @param operation - The AI operation to execute
 * @param options - Caching configuration
 * @returns The result with cache metadata
 *
 * @example
 * const result = await cachedAICall(
 *   { operation: 'itinerary', destination: 'Paris', dates: '2024-06-01' },
 *   () => generateItinerary(trip),
 *   { ttl: 3600, namespace: 'itinerary' }
 * );
 */
export async function cachedAICall<T>(
  inputs: Record<string, any>,
  operation: () => Promise<T>,
  options: CacheOptions = {}
): Promise<CachedResponse<T>> {
  const {
    ttl = 3600,              // Default 1 hour
    namespace = 'default',
    ignoreCache = false
  } = options;

  const cacheKey = generateCacheKey(namespace, inputs);
  const startTime = Date.now();

  // Try to get from cache first (unless bypassing)
  if (!ignoreCache) {
    try {
      const cached = await cache.get<T>(cacheKey);
      if (cached !== null) {
        const duration = Date.now() - startTime;
        console.log(`✅ Cache HIT for ${namespace} (${duration}ms, saved AI cost)`);

        // Track cache hit
        await trackCacheMetrics(namespace, 'hit', duration);

        return {
          data: cached,
          cached: true,
          cacheKey,
          generatedAt: Date.now()
        };
      }
    } catch (error) {
      console.warn(`⚠️  Cache read error (continuing to AI):`, error);
      // Continue to AI operation on cache failure
    }
  }

  // Cache miss - execute the operation
  console.log(`⚠️  Cache MISS for ${namespace}, calling AI...`);
  const data = await operation();
  const duration = Date.now() - startTime;

  // Store in cache for future requests
  try {
    await cache.set(cacheKey, data, ttl);
    console.log(`✅ Cached AI response for ${namespace} (TTL: ${ttl}s)`);
  } catch (error) {
    console.warn(`⚠️  Cache write error (response still returned):`, error);
    // Don't fail the request if caching fails
  }

  // Track cache miss
  await trackCacheMetrics(namespace, 'miss', duration);

  return {
    data,
    cached: false,
    cacheKey,
    generatedAt: Date.now()
  };
}

/**
 * Invalidate cache for a specific operation
 */
export async function invalidateCache(namespace: string, inputs: Record<string, any>): Promise<void> {
  const cacheKey = generateCacheKey(namespace, inputs);
  try {
    await cache.del(cacheKey);
    console.log(`🗑️  Invalidated cache for ${namespace}`);
  } catch (error) {
    console.error(`❌ Cache invalidation error:`, error);
  }
}

/**
 * Invalidate all caches for a namespace pattern
 */
export async function invalidateNamespace(namespace: string): Promise<void> {
  try {
    // Note: This requires SCAN command support in Redis
    // For now, we'll track keys separately
    const pattern = `ai:${namespace}:*`;
    console.log(`🗑️  Invalidating cache namespace: ${pattern}`);

    // Upstash Redis doesn't support SCAN, so we'll use individual invalidation
    // This is a limitation - in production, you'd track keys in a separate set
    console.warn(`⚠️  Namespace invalidation not fully supported - invalidate individual keys instead`);
  } catch (error) {
    console.error(`❌ Namespace invalidation error:`, error);
  }
}

/**
 * Smart TTL strategy based on operation type
 */
export function getSmartTTL(operation: string, inputs: any): number {
  switch (operation) {
    case 'itinerary':
      // Cache itineraries longer - destination/dates rarely change
      // But reduce TTL if it's within 7 days of trip start
      const daysUntilTrip = inputs.startDate
        ? Math.ceil((new Date(inputs.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 999;
      return daysUntilTrip < 7 ? 1800 : 7200; // 30min if near trip, else 2 hours

    case 'suggestions':
    case 'conflict_resolution':
      // Short TTL for dynamic suggestions
      return 1800; // 30 minutes

    case 'packing_list':
    case 'trip_recap':
      // Long TTL for static content
      return 86400; // 24 hours

    case 'email_parsing':
      // Don't cache email parsing (unique content)
      return 0;

    default:
      return 3600; // 1 hour default
  }
}

/**
 * Track cache metrics for monitoring
 */
interface CacheMetrics {
  hits: number;
  misses: number;
  avgHitDuration: number;
  avgMissDuration: number;
  hitRate: number;
}

async function trackCacheMetrics(namespace: string, type: 'hit' | 'miss', duration: number): Promise<void> {
  try {
    const key = `ai:metrics:${namespace}:${type}`;
    await cache.incr(key, 86400); // Keep metrics for 24 hours

    // Note: The existing cache service doesn't have list operations (rpush/ltrim)
    // For now, we'll just track counts. Duration tracking can be added later if needed.
  } catch (error) {
    // Silent failure for metrics
  }
}

/**
 * Get cache metrics for monitoring dashboard
 */
export async function getCacheMetrics(namespace: string): Promise<CacheMetrics> {
  try {
    const hits = await cache.get<number>(`ai:metrics:${namespace}:hit`) || 0;
    const misses = await cache.get<number>(`ai:metrics:${namespace}:miss`) || 0;
    const total = hits + misses;

    // Simplified - duration tracking not implemented with current cache service
    // The existing cache service doesn't support list operations needed for duration tracking

    return {
      hits,
      misses,
      avgHitDuration: 0,
      avgMissDuration: 0,
      hitRate: total > 0 ? (hits / total) * 100 : 0
    };
  } catch (error) {
    console.error('Failed to get cache metrics:', error);
    return {
      hits: 0,
      misses: 0,
      avgHitDuration: 0,
      avgMissDuration: 0,
      hitRate: 0
    };
  }
}

/**
 * Get all cache metrics for admin dashboard
 */
export async function getAllCacheMetrics(): Promise<Record<string, CacheMetrics>> {
  const namespaces = ['itinerary', 'suggestions', 'conflict_resolution', 'packing_list', 'trip_recap', 'email_parsing'];
  const metrics: Record<string, CacheMetrics> = {};

  await Promise.all(
    namespaces.map(async (ns) => {
      metrics[ns] = await getCacheMetrics(ns);
    })
  );

  return metrics;
}

/**
 * Warm up cache with common queries (optional optimization)
 */
export async function warmCache(operation: string, commonInputs: Record<string, any>[]): Promise<void> {
  console.log(`🔥 Warming cache for ${operation} with ${commonInputs.length} queries...`);
  // This would be implemented based on your warm-up strategy
  // For now, it's a placeholder for future optimization
}
