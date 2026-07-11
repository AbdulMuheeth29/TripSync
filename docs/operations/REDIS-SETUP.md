# Redis Setup Guide

Redis provides caching and session management for TripSync, significantly improving performance and enabling horizontal scaling.

## Why Redis?

**Without Redis:**
- Uses in-memory cache (lost on restart)
- Cannot scale across multiple servers
- Higher database load
- Slower response times

**With Redis:**
- Persistent cache across restarts
- Horizontal scaling support
- Reduced database queries by 60-80%
- Token blacklist for security
- Session revocation

## Quick Setup Options

### Option 1: Upstash (Recommended - Free Tier)

**Best for:** Production deployments, global edge caching

1. Go to [upstash.com](https://upstash.com/)
2. Create free account
3. Click "Create Database"
4. Choose region closest to your users
5. Copy the Redis URL (starts with `rediss://`)

**Cost:** Free tier includes:
- 10,000 commands/day
- 256 MB storage
- Global edge caching

**Add to `.env.production`:**
```bash
REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_HOST.upstash.io:6379
```

### Option 2: Redis Cloud (Redis Labs)

**Best for:** Dedicated Redis instance, more control

1. Go to [redis.com/try-free](https://redis.com/try-free/)
2. Create account
3. Create new database (30MB free)
4. Copy connection string

**Cost:** Free tier includes:
- 30 MB storage
- 30 connections

**Add to `.env.production`:**
```bash
REDIS_URL=redis://default:PASSWORD@redis-12345.c123.us-east-1-1.ec2.cloud.redislabs.com:12345
```

### Option 3: AWS ElastiCache

**Best for:** Already using AWS infrastructure

1. AWS Console → ElastiCache
2. Create Redis cluster
3. Choose instance type (cache.t3.micro for start)
4. Configure security group
5. Copy primary endpoint

**Cost:**
- cache.t3.micro: ~$12/month
- Included in AWS free tier (first 12 months)

**Add to `.env.production`:**
```bash
REDIS_URL=redis://your-cluster.abc123.0001.use1.cache.amazonaws.com:6379
```

### Option 4: Local Development

**Best for:** Testing locally

```bash
# macOS
brew install redis
redis-server

# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:alpine
```

**Add to `.env.production`:**
```bash
REDIS_URL=redis://localhost:6379
```

## Configuration Options

### Basic Configuration (Default)
```bash
REDIS_URL=redis://host:6379
```

### With Password
```bash
REDIS_URL=redis://:password@host:6379
```

### With Username and Password
```bash
REDIS_URL=redis://username:password@host:6379
```

### With TLS (Upstash, production)
```bash
REDIS_URL=rediss://default:password@host:6379
```

## Testing Your Redis Connection

```bash
# Test all services including Redis
npm run test:services

# Or test manually
node -e "
const Redis = require('ioredis');
const client = new Redis(process.env.REDIS_URL);
client.ping().then(() => {
  console.log('✅ Redis connected');
  client.quit();
}).catch(err => {
  console.error('❌ Redis error:', err.message);
  process.exit(1);
});
"
```

## What TripSync Uses Redis For

1. **Cache Layer** (60-80% query reduction)
   - User data: 15 minute TTL
   - Trip data: 10 minute TTL
   - Trip members: 5 minute TTL
   - Frequently accessed data

2. **Token Blacklist** (Security)
   - Revoked JWT tokens
   - User session management
   - Global logout functionality

3. **Rate Limiting** (Optional future enhancement)
   - API endpoint throttling
   - Login attempt tracking

## Cache Keys Used

TripSync uses structured cache keys:

```
user:{userId}                 # User profile
trip:{tripId}                 # Trip details
trip:{tripId}:members        # Trip members list
trip:{tripId}:items          # Itinerary items
user:{userId}:trips          # User's trips
token:blacklist:{token}      # Revoked tokens
user:{userId}:revoked_before # Session revocation timestamp
```

## Cache Invalidation

Cache is automatically invalidated on:
- User updates
- Trip modifications
- Member changes
- Itinerary updates

## Monitoring Redis

### Memory Usage
```bash
redis-cli INFO memory
```

### Check Connection
```bash
redis-cli PING
# Should return: PONG
```

### View Keys
```bash
redis-cli KEYS "user:*"
redis-cli KEYS "trip:*"
```

### Clear All Cache (if needed)
```bash
redis-cli FLUSHALL
```

## Performance Impact

**Without Redis:**
- Average response time: 150-300ms
- Database queries per request: 3-8
- Can handle: ~100 concurrent users

**With Redis:**
- Average response time: 30-80ms
- Database queries per request: 0-2
- Can handle: 500+ concurrent users

## Production Recommendations

1. **Use TLS** (rediss://) in production
2. **Set password** - Never use Redis without authentication
3. **Monitor memory** - Set maxmemory policy to `allkeys-lru`
4. **Regular backups** - Enable RDB or AOF persistence
5. **Close to app** - Choose Redis region near your app server

## Troubleshooting

### Connection Timeout
- Check firewall rules
- Verify Redis is running: `redis-cli ping`
- Test from app server: `telnet redis-host 6379`

### Memory Issues
- Check memory usage: `redis-cli INFO memory`
- Increase max memory or adjust TTLs
- Enable eviction policy: `maxmemory-policy allkeys-lru`

### Slow Performance
- Check latency: `redis-cli --latency`
- Ensure Redis is in same region as app
- Consider upgrading instance size

### Connection Refused
- Check Redis URL format
- Verify credentials
- Check if Redis allows external connections

## Alternative: Without Redis

TripSync will work without Redis using in-memory cache:
- ✅ All features functional
- ❌ Cache lost on restart
- ❌ Cannot scale horizontally
- ❌ Higher database load
- ❌ Token blacklist uses memory

**Not recommended for production deployments.**

## Cost Comparison

| Provider | Free Tier | Paid Plans | Best For |
|----------|-----------|------------|----------|
| Upstash | 10K cmds/day, 256MB | From $0.20/100K | Global edge, serverless |
| Redis Cloud | 30MB | From $5/month | Fixed workload |
| AWS ElastiCache | 750 hrs/month (1st year) | From $12/month | AWS ecosystem |
| Local | Free | Infrastructure cost | Development only |

## Next Steps

1. Choose a provider
2. Get Redis URL
3. Add to `.env.production`
4. Test with: `npm run test:services`
5. Deploy and monitor
