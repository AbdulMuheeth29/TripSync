# Redis Caching Guide

## Overview

Trip-Sync uses Redis for caching frequently accessed data to improve performance and reduce database load. The caching layer is optional and gracefully degrades when Redis is unavailable.

## Architecture

**Cache Service Location**: `server/cache.ts`

**Key Features**:

- Redis-backed caching with in-memory fallback
- Automatic TTL (time-to-live) expiration
- Cache-aside pattern for data fetching
- Namespace support (`tripsync:*`)
- Graceful error handling
- Connection pooling and retry logic

## Configuration

### Environment Variable

```bash
# Required for production
REDIS_URL=redis://localhost:6379

# Redis Cloud
REDIS_URL=redis://username:password@host:port

# Upstash (with TLS)
REDIS_URL=rediss://username:password@host:port
```

### Connection Settings

The cache service automatically:

- Connects lazily (doesn't block server startup)
- Retries failed connections with exponential backoff
- Reconnects automatically on connection loss
- Logs connection status changes

## Usage

### Basic Operations

```typescript
import { cache, CacheKeys, CacheTTL } from './cache';

// Set a value with TTL (in seconds)
await cache.set('mykey', { data: 'value' }, 3600); // 1 hour

// Get a value
const value = await cache.get<MyType>('mykey');

// Delete a value
await cache.del('mykey');

// Delete pattern (e.g., all user cache)
await cache.delPattern('user:*');
```

### Cache-Aside Pattern (Recommended)

```typescript
// Automatically fetch from DB if cache miss
const user = await cache.getOrSet(
  CacheKeys.user(userId),
  async () => {
    // This only runs on cache miss
    return await db.select().from(users).where(eq(users.id, userId));
  },
  CacheTTL.MEDIUM // 5 minutes
);
```

### Counter Operations

```typescript
// Increment a counter with TTL
const count = await cache.incr('api:requests', 3600);

// Useful for rate limiting
const requestCount = await cache.incr(`ratelimit:${userId}:${endpoint}`, 3600);
if (requestCount > 100) {
  throw new Error('Rate limit exceeded');
}
```

### Hash Operations

```typescript
// Store structured data in a hash
await cache.hset('user:123:profile', 'name', 'John Doe');
await cache.hset('user:123:profile', 'email', 'john@example.com');

// Get single field
const name = await cache.hget<string>('user:123:profile', 'name');

// Get all fields
const profile = await cache.hgetall<string>('user:123:profile');
// Returns: { name: 'John Doe', email: 'john@example.com' }
```

## Cache Keys

Use predefined cache keys from `CacheKeys` for consistency:

```typescript
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
```

## TTL Constants

Use predefined TTL values for consistency:

```typescript
export const CacheTTL = {
  SHORT: 60, // 1 minute - frequently changing data
  MEDIUM: 300, // 5 minutes - user data, profiles
  LONG: 3600, // 1 hour - rate limits, counters
  DAY: 86400, // 24 hours - AI-generated content
  WEEK: 604800, // 7 days - rarely changing data
};
```

## Cache Invalidation

### Pattern: Update and Invalidate

Always invalidate cache after updating data:

```typescript
async function updateUser(id: string, updates: Partial<User>) {
  // Update database
  const user = await db.update(users).set(updates).where(eq(users.id, id)).returning();

  // Invalidate cache
  await cache.del(CacheKeys.user(id));
  if (user.email) {
    await cache.del(`user:email:${user.email}`);
  }

  return user;
}
```

### Pattern: Cascade Invalidation

Invalidate related caches when updating parent entities:

```typescript
async function updateTrip(id: string, updates: Partial<Trip>) {
  const trip = await db.update(trips).set(updates).where(eq(trips.id, id)).returning();

  // Invalidate all trip-related caches
  await cache.del(CacheKeys.trip(id));
  await cache.del(CacheKeys.tripMembers(id));
  await cache.del(CacheKeys.tripItinerary(id));

  return trip;
}
```

## Current Cached Data

### User Data

- **Key**: `user:{userId}`
- **TTL**: 5 minutes
- **Invalidated on**: User profile update, email change

### Trip Data

- **Key**: `trip:{tripId}`
- **TTL**: 1 minute
- **Invalidated on**: Trip update, status change

### Trip Members

- **Key**: `trip:{tripId}:members`
- **TTL**: 1 minute
- **Invalidated on**: Member added/removed, role changed

### Token Blacklist

- **Key**: `blacklist:{token}`
- **TTL**: Token expiration time
- **Purpose**: Session revocation for logout

## Performance Monitoring

### Cache Statistics

```typescript
const stats = await cache.stats();
console.log(stats);
// {
//   enabled: true,
//   connected: true,
//   keyCount: 1234,
//   memory: '15.2M'
// }
```

### Checking Cache Availability

```typescript
if (cache.isEnabled()) {
  // Redis is available
} else {
  // Using fallback (in-memory or disabled)
}
```

## Best Practices

### 1. Always Use Cache-Aside Pattern

```typescript
// ✅ Good - automatic cache management
const user = await cache.getOrSet(CacheKeys.user(id), () => fetchUserFromDb(id), CacheTTL.MEDIUM);

// ❌ Bad - manual cache management
let user = await cache.get(CacheKeys.user(id));
if (!user) {
  user = await fetchUserFromDb(id);
  await cache.set(CacheKeys.user(id), user, CacheTTL.MEDIUM);
}
```

### 2. Invalidate After Updates

```typescript
// ✅ Good - cache stays in sync
async function updateUser(id, data) {
  const user = await db.update(users).set(data);
  await cache.del(CacheKeys.user(id));
  return user;
}

// ❌ Bad - stale cache data
async function updateUser(id, data) {
  return await db.update(users).set(data);
  // Cache still has old data!
}
```

### 3. Use Appropriate TTLs

```typescript
// ✅ Good - appropriate TTLs
await cache.set(CacheKeys.user(id), user, CacheTTL.MEDIUM); // 5 min
await cache.set(CacheKeys.aiGeneration(id, 'itinerary'), data, CacheTTL.DAY); // 24h

// ❌ Bad - inappropriate TTLs
await cache.set(CacheKeys.user(id), user, CacheTTL.WEEK); // Too long, stale data
await cache.set(CacheKeys.aiGeneration(id, 'itinerary'), data, CacheTTL.SHORT); // Too short, wasted computation
```

### 4. Handle Cache Misses Gracefully

The cache service automatically handles Redis being unavailable:

```typescript
// This works even if Redis is down
const user = await cache.getOrSet(
  CacheKeys.user(id),
  () => fetchUserFromDb(id), // Always called if Redis unavailable
  CacheTTL.MEDIUM
);
```

### 5. Don't Cache Sensitive Data Long-Term

```typescript
// ✅ Good - short TTL for sensitive data
await cache.set(`password-reset:${token}`, userId, 3600); // 1 hour

// ❌ Bad - long TTL for sensitive data
await cache.set(`password-reset:${token}`, userId, CacheTTL.WEEK);
```

## Common Mistakes

### ❌ Not Invalidating Related Caches

```typescript
// Wrong
async function addTripMember(tripId, userId) {
  await db.insert(tripMembers).values({ tripId, userId });
  // Missing: await cache.del(CacheKeys.tripMembers(tripId));
}
```

### ❌ Using Cache for Critical Data Without Verification

```typescript
// Wrong - permissions should always check database
const isAdmin = await cache.get(`user:${id}:isAdmin`);
if (isAdmin) {
  // DANGEROUS: Cache could be stale or manipulated
}

// Right - verify critical permissions from database
const user = await db.select().from(users).where(eq(users.id, id));
if (user.role === 'admin') {
  // Safe
}
```

### ❌ Caching Too Much Data

```typescript
// Wrong - large objects shouldn't be cached
await cache.set('all-trips', await getAllTrips(), CacheTTL.MEDIUM);

// Right - cache individual items
for (const trip of trips) {
  await cache.set(CacheKeys.trip(trip.id), trip, CacheTTL.SHORT);
}
```

## Deployment Considerations

### Development

Redis is optional in development. The app works without it:

```bash
# No REDIS_URL needed
npm run dev
```

### Production

Redis is highly recommended for production:

1. **Single Server**: Use local Redis

   ```bash
   REDIS_URL=redis://localhost:6379
   ```

2. **Multiple Servers**: Use managed Redis (Redis Cloud, Upstash, AWS ElastiCache)

   ```bash
   REDIS_URL=redis://username:password@host:port
   ```

3. **High Availability**: Use Redis Cluster or Sentinel
   ```bash
   REDIS_URL=redis://sentinel-host:26379?sentinelMasterId=mymaster
   ```

### Memory Management

Monitor Redis memory usage:

```bash
# Check stats
curl http://localhost:3000/admin/metrics

# Redis CLI
redis-cli INFO memory
```

Configure Redis eviction policy:

```bash
# In redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
```

## Troubleshooting

### Redis Connection Issues

**Symptom**: "Redis connection failed" in logs

**Solutions**:

1. Verify REDIS_URL is correct
2. Check Redis is running: `redis-cli ping`
3. Check firewall rules
4. Verify credentials

**Note**: App continues to work, but without caching

### Cache Misses

**Symptom**: Database queries still high despite caching

**Check**:

1. Verify cache keys are consistent
2. Check TTLs aren't too short
3. Ensure cache invalidation isn't too aggressive
4. Monitor cache hit ratio in Redis

### Stale Data

**Symptom**: Users see outdated data

**Solutions**:

1. Reduce TTL for frequently changing data
2. Add cache invalidation on updates
3. Use cascade invalidation for related data

## Monitoring

### Log Levels

```bash
# See cache operations
LOG_LEVEL=debug npm start

# Production (only errors)
LOG_LEVEL=info npm start
```

### Key Metrics to Monitor

1. **Cache Hit Ratio**: Should be > 80% for user/trip data
2. **Redis Memory**: Should stay under 70% of maxmemory
3. **Connection Errors**: Should be near zero in production
4. **Key Count**: Monitor growth over time

---

**Last Updated**: 2026-05-14
**Version**: 1.0
