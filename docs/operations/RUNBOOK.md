# TripSync Production Runbook

**Version**: 1.0.0
**Last Updated**: 2026-05-15
**On-Call Contact**: abdulmuheethmd29@gmail.com

---

## Table of Contents
- [Quick Reference](#quick-reference)
- [Health Check](#health-check)
- [Rollback Procedures](#rollback-procedures)
- [Common Issues](#common-issues)
- [Incident Response](#incident-response)
- [Monitoring](#monitoring)
- [Database Operations](#database-operations)

---

## Quick Reference

### Service URLs
- **Production**: https://tripsync.app (when deployed)
- **Staging**: http://localhost:3001
- **Health Check**: https://tripsync.app/api/health?detailed=true

### Key Locations
- **Logs**: `docker-compose logs -f tripsync-app-prod`
- **Database Backups**: `./backups/`
- **Environment Config**: `.env` (production), `.env.staging` (staging)

### Quick Commands
```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f --tail=100

# Restart app only (no downtime for DB)
docker-compose -f docker-compose.prod.yml restart app

# Check service status
docker-compose -f docker-compose.prod.yml ps

# Run health check
curl -s https://tripsync.app/api/health?detailed=true | jq
```

---

## Health Check

### Basic Health Check
```bash
curl -s https://tripsync.app/api/health
# Expected: {"ok": true, "storage": "pg"}
```

### Detailed Health Check
```bash
curl -s https://tripsync.app/api/health?detailed=true | jq
```

**Expected Response:**
```json
{
  "ok": true,
  "storage": "pg",
  "timestamp": "2026-05-15T12:00:00.000Z",
  "uptime": 123456,
  "services": {
    "database": { "status": "ok" },
    "redis": { "status": "ok" },
    "storage": { "status": "ok" },
    "email": { "status": "ok" },
    "sentry": { "status": "ok" },
    "stripe": { "status": "unavailable" },
    "ai": { "status": "ok" }
  }
}
```

### Service Status Indicators
- ✅ `"ok"` - Service healthy
- ⚠️ `"unavailable"` - Service not configured (non-critical)
- ❌ `"error"` - Service failing (investigate immediately)

---

## Rollback Procedures

### Decision Criteria: When to Rollback

**IMMEDIATE ROLLBACK** if:
- [ ] Error rate > 5% for 5+ consecutive minutes
- [ ] Critical feature completely broken (auth, trip creation, data loss)
- [ ] Data corruption detected
- [ ] Security vulnerability actively exploited
- [ ] Database connection failures

**MONITOR AND INVESTIGATE** if:
- [ ] Error rate 1-5%
- [ ] Single feature degraded
- [ ] Performance slower than baseline (but functional)
- [ ] User reports isolated issues

### Rollback Method 1: Docker Image Rollback (Fastest - 2 minutes)

**Use when**: Code issue, no database changes

```bash
# 1. Stop current containers
docker-compose -f docker-compose.prod.yml down

# 2. Find previous working commit
git log --oneline -10
# Identify last known good commit (e.g., abc1234)

# 3. Checkout previous version
git checkout <previous-commit-hash>

# 4. Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# 5. Verify health
curl https://tripsync.app/api/health?detailed=true

# 6. If successful, return to main
git checkout main
```

### Rollback Method 2: Database Rollback (Slower - 5-10 minutes)

**Use when**: Database migration caused issues

```bash
# 1. List available backups
ls -lh backups/

# 2. Stop application (prevent writes)
docker-compose -f docker-compose.prod.yml stop app

# 3. Backup current state (just in case)
docker exec tripsync-postgres-prod pg_dump -U tripsync tripsync > backups/rollback-backup-$(date +%Y%m%d-%H%M%S).sql

# 4. Drop current database
docker exec -it tripsync-postgres-prod psql -U tripsync -c "DROP DATABASE tripsync;"
docker exec -it tripsync-postgres-prod psql -U tripsync -c "CREATE DATABASE tripsync;"

# 5. Restore from backup
docker exec -i tripsync-postgres-prod psql -U tripsync tripsync < backups/backup-YYYYMMDD-HHMMSS.sql

# 6. Restart application
docker-compose -f docker-compose.prod.yml start app

# 7. Verify health and data
curl https://tripsync.app/api/health?detailed=true
```

### Rollback Method 3: Feature Flag Disable (Instant)

**Use when**: New feature causing issues

```bash
# Currently not implemented - would require feature flag system
# Workaround: Environment variable toggle

# 1. Add feature flag to .env
echo "FEATURE_NEW_THING_ENABLED=false" >> .env

# 2. Restart app
docker-compose -f docker-compose.prod.yml restart app
```

### Post-Rollback Checklist
- [ ] Verify health endpoint returns OK
- [ ] Test critical user flows (login, create trip)
- [ ] Check error rate in Sentry (if configured)
- [ ] Notify team of rollback
- [ ] Document what went wrong
- [ ] Plan fix for next deployment

---

## Common Issues

### Issue 1: Database Connection Failures

**Symptoms:**
- Health check shows `"database": { "status": "error" }`
- Logs show: `Error: connect ECONNREFUSED` or `Connection terminated unexpectedly`

**Diagnosis:**
```bash
# Check if PostgreSQL is running
docker-compose -f docker-compose.prod.yml ps postgres

# Check PostgreSQL logs
docker-compose -f docker-compose.prod.yml logs postgres --tail=50

# Test database connection
docker exec tripsync-postgres-prod psql -U tripsync -c "SELECT 1;"
```

**Fix:**
```bash
# Restart PostgreSQL
docker-compose -f docker-compose.prod.yml restart postgres

# If that doesn't work, check disk space
df -h

# Check PostgreSQL max connections
docker exec tripsync-postgres-prod psql -U tripsync -c "SHOW max_connections;"
docker exec tripsync-postgres-prod psql -U tripsync -c "SELECT count(*) FROM pg_stat_activity;"
```

---

### Issue 2: High Memory Usage / OOM

**Symptoms:**
- App container keeps restarting
- Logs show: `JavaScript heap out of memory`

**Diagnosis:**
```bash
# Check memory usage
docker stats tripsync-app-prod --no-stream

# Check Node.js memory limit
docker exec tripsync-app-prod node -e "console.log(v8.getHeapStatistics())"
```

**Fix:**
```bash
# Increase Node.js memory limit in docker-compose.prod.yml
# Add to app service:
environment:
  NODE_OPTIONS: "--max-old-space-size=2048"

# Restart
docker-compose -f docker-compose.prod.yml restart app
```

---

### Issue 3: Redis Connection Failures

**Symptoms:**
- Health check shows `"redis": { "status": "error" }`
- Token blacklist not working (users can't logout)

**Impact**: Medium - app still works, but caching disabled

**Diagnosis:**
```bash
# Check if Redis is running
docker-compose -f docker-compose.prod.yml ps redis

# Test Redis connection
docker exec tripsync-redis-prod redis-cli ping
# Expected: PONG
```

**Fix:**
```bash
# Restart Redis
docker-compose -f docker-compose.prod.yml restart redis

# If data corrupted, flush and restart
docker exec tripsync-redis-prod redis-cli FLUSHALL
docker-compose -f docker-compose.prod.yml restart redis app
```

---

### Issue 4: Email Not Sending

**Symptoms:**
- Password reset emails not arriving
- Trip invitations not sending

**Diagnosis:**
```bash
# Test email configuration
npm run test:email

# Check SMTP credentials in .env
cat .env | grep SMTP
```

**Fix:**
```bash
# Verify SMTP credentials are correct
# For Gmail: Ensure "Less secure app access" is enabled OR use App Password

# Test with curl
curl -v --url 'smtp://smtp.gmail.com:587' \
  --mail-from 'your-email@gmail.com' \
  --mail-rcpt 'test@example.com' \
  --user 'your-email@gmail.com:your-app-password'
```

---

### Issue 5: Slow Response Times

**Symptoms:**
- API requests taking >2 seconds
- Users reporting slow page loads

**Diagnosis:**
```bash
# Check response times
time curl https://tripsync.app/api/health

# Check database query performance
docker exec tripsync-postgres-prod psql -U tripsync -c "\timing on" -c "SELECT COUNT(*) FROM trips;"

# Check active connections
docker exec tripsync-postgres-prod psql -U tripsync -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"
```

**Fix:**
```bash
# Add database indexes (run via migration)
docker exec tripsync-postgres-prod psql -U tripsync -c "
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_user_id ON trips(user_id);
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trip_members_trip_id ON trip_members(trip_id);
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_itinerary_items_trip_id ON itinerary_items(trip_id);
"

# Enable Redis caching if not already
# Verify REDIS_URL is set in .env

# Scale up app containers (if needed)
docker-compose -f docker-compose.prod.yml up -d --scale app=3
```

---

## Incident Response

### Incident Severity Levels

**P0 - Critical (Response: Immediate)**
- Complete service outage
- Data loss or corruption
- Security breach

**P1 - High (Response: <15 minutes)**
- Major feature broken
- Error rate >5%
- Database issues

**P2 - Medium (Response: <1 hour)**
- Single feature degraded
- Performance issues
- Email not sending

**P3 - Low (Response: <24 hours)**
- Minor bugs
- UI issues
- Non-critical features

### Incident Response Checklist

**Step 1: Assess (2 minutes)**
- [ ] Check health endpoint
- [ ] Check error rate in Sentry
- [ ] Review recent deployments (git log)
- [ ] Determine severity level

**Step 2: Communicate (2 minutes)**
- [ ] Notify team: "Investigating issue with [X]"
- [ ] Post status update (if public status page exists)

**Step 3: Mitigate (10 minutes)**
- [ ] Can we rollback? If yes, do it
- [ ] Can we disable feature? If yes, do it
- [ ] Can we restart service? Try it (last resort)

**Step 4: Fix (variable)**
- [ ] Identify root cause
- [ ] Implement fix
- [ ] Test in staging
- [ ] Deploy to production

**Step 5: Verify (5 minutes)**
- [ ] Check health endpoint
- [ ] Test affected feature
- [ ] Monitor error rates for 15 minutes

**Step 6: Post-Mortem (within 24 hours)**
- [ ] Document what happened
- [ ] Document what we did
- [ ] Document how to prevent it
- [ ] Update runbook

---

## Monitoring

### Key Metrics to Track

**Application Health**
- Response time (baseline: <200ms for /api/health)
- Error rate (baseline: <0.1%)
- Uptime (target: 99.9%)

**Database**
- Query time (baseline: <50ms average)
- Connection count (max: 100)
- Database size

**User Activity**
- Active users (DAU)
- Trips created per day
- API requests per minute

### Monitoring Commands

```bash
# Real-time error monitoring
docker-compose -f docker-compose.prod.yml logs -f app | grep -i error

# Request rate
docker-compose -f docker-compose.prod.yml logs app --since 1m | grep "HTTP" | wc -l

# Database connections
docker exec tripsync-postgres-prod psql -U tripsync -c "
  SELECT count(*), state FROM pg_stat_activity GROUP BY state;
"

# Disk space
df -h
docker system df
```

---

## Database Operations

### Manual Backup
```bash
# Create timestamped backup
mkdir -p backups
docker exec tripsync-postgres-prod pg_dump -U tripsync tripsync > backups/manual-backup-$(date +%Y%m%d-%H%M%S).sql

# Compress backup
gzip backups/manual-backup-*.sql
```

### Restore from Backup
```bash
# Stop app to prevent writes
docker-compose -f docker-compose.prod.yml stop app

# Restore
docker exec -i tripsync-postgres-prod psql -U tripsync tripsync < backups/backup-YYYYMMDD-HHMMSS.sql

# Restart app
docker-compose -f docker-compose.prod.yml start app
```

### Run Migration
```bash
# Run from inside app container
docker-compose -f docker-compose.prod.yml exec app npm run db:migrate

# Or from host (if tsx installed)
DATABASE_URL="postgresql://..." npm run db:migrate
```

### Database Maintenance
```bash
# Vacuum and analyze (run weekly)
docker exec tripsync-postgres-prod psql -U tripsync -c "VACUUM ANALYZE;"

# Check database size
docker exec tripsync-postgres-prod psql -U tripsync -c "
  SELECT pg_size_pretty(pg_database_size('tripsync'));
"

# Check table sizes
docker exec tripsync-postgres-prod psql -U tripsync -c "
  SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

---

## Emergency Contacts

**Primary On-Call**: abdulmuheethmd29@gmail.com

**Service Providers**:
- Database Host: [Your provider's support]
- Hosting: [Your hosting provider's support]
- Sentry: support@sentry.io (if using Sentry)

---

## Appendix: Performance Baselines

**API Response Times** (95th percentile):
- GET /api/health: 50ms
- GET /api/trips: 200ms
- POST /api/trips: 300ms
- POST /api/trips/:id/generate: 10s (AI generation)

**Database Query Times** (average):
- Simple SELECT: <10ms
- JOIN queries: <50ms
- Complex aggregations: <200ms

**Error Rate Baseline**: <0.1% (1 error per 1000 requests)

**Resource Usage**:
- App memory: 256MB typical, 512MB peak
- Database memory: 512MB typical
- Redis memory: 64MB typical
- Disk space: <5GB for database

---

**Document Version History**:
- v1.0.0 (2026-05-15): Initial runbook
