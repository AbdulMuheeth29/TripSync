# Production Services Setup - Complete Guide

This guide covers setting up Redis, S3/R2, and Sentry for a robust production deployment.

## Quick Start

Run the interactive setup script:

```bash
./scripts/setup-production-services.sh
```

This will guide you through configuring all three services.

## Service Overview

| Service | Purpose | Required? | Free Tier | Monthly Cost |
|---------|---------|-----------|-----------|--------------|
| **Redis** | Cache & sessions | Highly Recommended | ✅ 10K cmds/day | $0 - $5 |
| **S3/R2** | File storage | Recommended | ✅ 10GB storage | $0 - $5 |
| **Sentry** | Error tracking | Recommended | ✅ 5K errors/month | $0 - $29 |

**Total estimated cost for small deployment: $0-10/month**

---

## 1. Redis Cache

### What It Does
- Reduces database queries by 60-80%
- Enables horizontal scaling
- Token blacklist for security
- Session management

### Recommended: Upstash (Free)

**Why Upstash:**
- ✅ Free tier: 10,000 commands/day
- ✅ Global edge network
- ✅ Serverless pricing
- ✅ 5-minute setup

**Setup:**
1. Go to [upstash.com](https://upstash.com/)
2. Create account and database
3. Copy Redis URL
4. Add to `.env.production`:
   ```bash
   REDIS_URL=rediss://default:PASSWORD@HOST.upstash.io:6379
   ```

**Alternative Providers:**
- Redis Cloud: $0 (30MB)
- AWS ElastiCache: ~$12/month
- Local: Free (dev only)

📚 **Detailed Guide:** [docs/REDIS-SETUP.md](./docs/REDIS-SETUP.md)

---

## 2. Cloud Storage (S3 or R2)

### What It Does
- Photo uploads
- Document storage
- Booking confirmations
- Mood board images

### Recommended: Cloudflare R2 (Free)

**Why R2:**
- ✅ Free tier: 10GB storage
- ✅ Zero egress fees (vs $45/month on S3)
- ✅ S3-compatible API
- ✅ 5-minute setup

**Setup:**
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to R2 Object Storage
3. Create bucket: `tripsync-uploads`
4. Create API token with Read & Write permissions
5. Add to `.env.production`:
   ```bash
   R2_ACCOUNT_ID=your_account_id
   R2_ACCESS_KEY_ID=your_access_key
   R2_SECRET_ACCESS_KEY=your_secret_key
   R2_BUCKET_NAME=tripsync-uploads
   ```

**AWS S3 Alternative:**
```bash
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=tripsync-uploads
AWS_REGION=us-east-1
```

**Cost Comparison (500GB transfer):**
- R2: $0.75 storage + $0 egress = **$0.75/month**
- S3: $11.50 storage + $45 egress = **$56.50/month**

📚 **Detailed Guide:** [docs/STORAGE-SETUP.md](./docs/STORAGE-SETUP.md)

---

## 3. Sentry Error Tracking

### What It Does
- Real-time error alerts
- Performance monitoring
- Full stack traces
- User impact analysis

### Setup: Sentry (Free)

**Why Sentry:**
- ✅ Free tier: 5,000 errors/month
- ✅ Real-time alerts
- ✅ Performance monitoring
- ✅ Slack/email integration
- ✅ 2-minute setup

**Setup:**
1. Go to [sentry.io/signup](https://sentry.io/signup/)
2. Create project (select Node.js)
3. Copy DSN
4. Add to `.env.production`:
   ```bash
   SENTRY_DSN=https://abc123...@sentry.io/1234567
   ```

**What's Included:**
- Automatic error capture
- Performance monitoring (10% sampling)
- Security filtering (passwords, tokens removed)
- PostgreSQL query monitoring
- User context on errors

📚 **Detailed Guide:** [docs/SENTRY-SETUP.md](./docs/SENTRY-SETUP.md)

---

## Testing Your Setup

After configuring services, test them:

```bash
npm run test:services
```

This will verify:
- ✅ Database connection
- ✅ Redis connectivity and read/write
- ✅ S3/R2 upload and delete
- ✅ Sentry configuration
- ✅ SMTP email (if configured)

**Expected Output:**
```
╔═══════════════════════════════════════════╗
║  TripSync Service Configuration Test     ║
╚═══════════════════════════════════════════╝

🔍 Testing Database Connection...
✅ Database: Connected successfully
ℹ️  PostgreSQL version: 16.1

🔍 Testing Redis Connection...
✅ Redis: Connected successfully
✅ Redis: Read/Write working
ℹ️  Redis version: 7.2.3

🔍 Testing S3/R2 Storage...
✅ R2: Upload working
✅ R2: Delete working

🔍 Testing Sentry Configuration...
✅ Sentry: Configuration valid

📊 Status: 5/5 services configured
🎉 All services configured correctly! Ready for production.
```

---

## Health Monitoring

### Basic Health Check
```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "ok": true,
  "storage": "pg"
}
```

### Detailed Health Check
```bash
curl http://localhost:3000/api/health?detailed=true
```

Response:
```json
{
  "ok": true,
  "storage": "pg",
  "services": {
    "database": { "status": "ok" },
    "redis": { "status": "ok" },
    "storage": { "status": "ok" },
    "email": { "status": "ok" },
    "sentry": { "status": "ok" },
    "stripe": { "status": "unavailable" },
    "ai": { "status": "ok" }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Deployment Checklist

### Before Deploying

- [ ] Redis configured and tested
- [ ] S3/R2 configured and tested
- [ ] Sentry configured
- [ ] Run `npm run test:services` - all pass
- [ ] Environment variables in `.env.production`
- [ ] Test health endpoint
- [ ] Review security settings

### Deploy

```bash
./deploy.sh
```

### After Deploying

- [ ] Check health endpoint: `curl https://yourdomain.com/api/health?detailed=true`
- [ ] Upload test photo
- [ ] Trigger test error for Sentry
- [ ] Monitor Sentry dashboard for 1 hour
- [ ] Check Redis connection in logs
- [ ] Verify storage bucket has files

---

## Configuration Summary

### Required in `.env.production`

```bash
# Database (REQUIRED)
DATABASE_URL=postgresql://...

# Redis (Highly Recommended)
REDIS_URL=rediss://...

# Cloud Storage (Recommended)
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=tripsync-uploads

# Sentry (Recommended)
SENTRY_DSN=https://...@sentry.io/...
```

---

## Without These Services

### Without Redis
- ✅ App works normally
- ❌ Higher database load
- ❌ Slower response times
- ❌ Cannot scale horizontally
- ❌ In-memory cache (lost on restart)

### Without S3/R2
- ✅ App works normally
- ❌ Photo uploads disabled
- ❌ Document uploads disabled
- ❌ Booking confirmations disabled
- ❌ Mood board disabled

### Without Sentry
- ✅ App works normally
- ❌ No proactive error detection
- ❌ Limited debugging info
- ❌ No performance monitoring
- ❌ Manual log analysis required

---

## Cost Breakdown

### Minimal Setup (Recommended for Start)
- Database: $25/month (Railway/Render)
- Redis: **$0** (Upstash free tier)
- Storage: **$0** (R2 free tier - first 10GB)
- Sentry: **$0** (free tier)
- **Total: ~$25/month**

### Small Business Setup
- Database: $25/month
- Redis: $5/month (Upstash paid)
- Storage: $1-5/month (R2 50GB)
- Sentry: $0-29/month
- **Total: ~$31-60/month**

### Growing Business
- Database: $60/month
- Redis: $10/month
- Storage: $10/month (R2 200GB)
- Sentry: $29/month
- **Total: ~$110/month**

---

## Monitoring & Alerts

### Daily Checks (Automated)
- Sentry dashboard for errors
- Health endpoint monitoring
- Uptime monitoring (UptimeRobot)

### Weekly Review
- Redis memory usage
- Storage usage and costs
- Sentry error trends
- Performance metrics

### Monthly Analysis
- Cost optimization
- Service utilization
- Capacity planning
- Performance trends

---

## Troubleshooting

### Service Won't Connect

1. **Check environment variables:**
   ```bash
   npm run test:services
   ```

2. **Check firewall/security groups:**
   - Ensure app can reach Redis
   - Verify S3/R2 access
   - Test from server: `curl -I https://upstash.io`

3. **Check credentials:**
   - Re-generate API keys
   - Verify expiration dates
   - Test with provider's CLI tools

### High Costs

1. **Redis:**
   - Check command count in dashboard
   - Adjust TTLs (reduce cache time)
   - Review query patterns

2. **Storage:**
   - Check transfer amounts
   - Enable compression
   - Clean up old files
   - Use CDN for frequently accessed files

3. **Sentry:**
   - Adjust sample rates
   - Filter noisy errors
   - Review quota usage

---

## Support Resources

- **Redis Setup:** [docs/REDIS-SETUP.md](./docs/REDIS-SETUP.md)
- **Storage Setup:** [docs/STORAGE-SETUP.md](./docs/STORAGE-SETUP.md)
- **Sentry Setup:** [docs/SENTRY-SETUP.md](./docs/SENTRY-SETUP.md)
- **Deployment:** [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Troubleshooting:** Check service provider docs
- **GitHub Issues:** Report bugs/questions

---

## Quick Command Reference

```bash
# Interactive setup
./scripts/setup-production-services.sh

# Test all services
npm run test:services

# Check health
curl http://localhost:3000/api/health?detailed=true

# Deploy
./deploy.sh

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Monitor Redis
redis-cli -u $REDIS_URL INFO

# Check storage usage
aws s3 ls s3://your-bucket --summarize --human-readable
```

---

## Next Steps

1. ✅ Choose providers (Upstash, R2, Sentry recommended)
2. ✅ Run setup script: `./scripts/setup-production-services.sh`
3. ✅ Test services: `npm run test:services`
4. ✅ Review configuration
5. ✅ Deploy: `./deploy.sh`
6. ✅ Monitor for 24 hours
7. ✅ Set up alerts and monitoring
8. ✅ Optimize costs based on usage

**All services are optional but highly recommended for production deployments.**
