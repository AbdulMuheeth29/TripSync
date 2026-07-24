# Production Monitoring Guide

**Version**: 1.0.0
**Last Updated**: 2026-05-15

---

## Overview

This guide covers monitoring, alerting, and observability for TripSync in production.

---

## Monitoring Stack

### Current Setup

1. **Health Check Endpoint**: `/api/health?detailed=true`
2. **Sentry** (optional): Error tracking and performance monitoring
3. **Docker Stats**: Resource monitoring
4. **PostgreSQL Metrics**: Database performance
5. **Redis Metrics** (if enabled): Cache performance
6. **Server Logs**: Application logs via Docker

### Recommended Additions

1. **Grafana + Prometheus**: Metrics dashboards
2. **UptimeRobot**: Uptime monitoring (free tier)
3. **Better Stack (Logtail)**: Log aggregation
4. **PostHog**: Product analytics (already configured)

---

## Quick Monitoring Commands

```bash
# Health check
curl -s https://tripsync.app/api/health?detailed=true | jq

# Docker stats (CPU, memory, network)
docker stats tripsync-app-prod --no-stream

# Application logs
docker-compose -f docker-compose.prod.yml logs -f app --tail=100

# Database connections
docker exec tripsync-postgres-prod psql -U tripsync -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"

# Disk usage
df -h

# Recent errors in logs
docker-compose logs app --tail=1000 | grep -i error
```

---

## Key Metrics to Monitor

### Application Health

| Metric                  | Threshold  | Alert Level         |
| ----------------------- | ---------- | ------------------- |
| API Response Time (p95) | >500ms     | Warning             |
| API Response Time (p95) | >1000ms    | Critical            |
| Error Rate              | >1%        | Warning             |
| Error Rate              | >5%        | Critical            |
| Request Rate            | <5 req/min | Warning (too quiet) |

### System Resources

| Metric       | Threshold     | Alert Level |
| ------------ | ------------- | ----------- |
| CPU Usage    | >80% for 5min | Warning     |
| CPU Usage    | >95% for 5min | Critical    |
| Memory Usage | >85%          | Warning     |
| Memory Usage | >95%          | Critical    |
| Disk Usage   | >80%          | Warning     |
| Disk Usage   | >90%          | Critical    |

### Database

| Metric           | Threshold    | Alert Level |
| ---------------- | ------------ | ----------- |
| Connection Count | >80          | Warning     |
| Connection Count | >95          | Critical    |
| Query Time (p95) | >100ms       | Warning     |
| Query Time (p95) | >500ms       | Critical    |
| Database Size    | >80% of disk | Warning     |

### Business Metrics

| Metric             | Threshold  | Alert Level            |
| ------------------ | ---------- | ---------------------- |
| Sign-ups per day   | <5         | Warning (growth issue) |
| Active users (DAU) | <10        | Warning                |
| Error rate on auth | >2%        | Critical               |
| Trip creation rate | Drops >50% | Critical               |

---

## Setting Up Sentry (Error Tracking)

Already configured in code! Just add your DSN:

```bash
# Add to .env
SENTRY_DSN=https://your-key@sentry.io/your-project
```

**What you get:**

- ✅ Automatic error capture
- ✅ Error grouping and deduplication
- ✅ Stack traces with source maps
- ✅ User context (which user hit the error)
- ✅ Performance monitoring
- ✅ Release tracking
- ✅ Email/Slack alerts

**Sentry Dashboard**: https://sentry.io

---

## Setting Up UptimeRobot (Free Uptime Monitoring)

**Steps:**

1. Sign up at https://uptimerobot.com (free tier: 50 monitors)
2. Add HTTP(s) monitor:
   - URL: `https://tripsync.app/api/health`
   - Interval: 5 minutes
   - Alert contacts: Your email/Slack

**What you get:**

- ✅ Uptime percentage tracking
- ✅ Response time monitoring
- ✅ Email alerts when site is down
- ✅ Public status page
- ✅ SSL expiry monitoring

---

## Setting Up Grafana (Advanced)

For beautiful dashboards and alerting.

### Quick Start with Docker

```bash
# Add to docker-compose.prod.yml
grafana:
  image: grafana/grafana:latest
  ports:
    - "3001:3000"
  volumes:
    - grafana_data:/var/lib/grafana
  environment:
    GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
```

### What to Monitor

**System Dashboard**:

- CPU usage over time
- Memory usage over time
- Disk I/O
- Network throughput

**Application Dashboard**:

- Requests per minute
- Error rate (%)
- Response time (p50, p95, p99)
- Active users

**Database Dashboard**:

- Connections over time
- Query duration
- Deadlocks
- Cache hit rate

---

## Log Monitoring

### Viewing Logs

```bash
# Real-time application logs
docker-compose -f docker-compose.prod.yml logs -f app

# Last 1000 lines
docker-compose logs app --tail=1000

# Errors only
docker-compose logs app | grep -i error

# Specific time range
docker-compose logs app --since 2h

# Export to file
docker-compose logs app > logs/app-$(date +%Y%m%d).log
```

### Log Patterns to Alert On

**Critical Errors:**

```bash
# Database connection errors
grep "ECONNREFUSED.*postgres" logs

# Out of memory
grep "JavaScript heap out of memory" logs

# Unhandled promise rejections
grep "UnhandledPromiseRejectionWarning" logs

# Fatal crashes
grep "FATAL\|CRITICAL\|Process exited" logs
```

**Warning Signs:**

```bash
# Slow queries
grep "slow query" logs | grep -oP "duration: \d+" | sort -rn

# High memory warnings
grep "Memory usage above" logs

# Rate limit hits
grep "rate limit exceeded" logs

# Authentication failures
grep "authentication failed\|invalid credentials" logs
```

---

## Alerting Strategy

### Alert Channels

1. **Critical**: Email + SMS + Slack
2. **Warning**: Email + Slack
3. **Info**: Slack only

### Alert Rules

**Immediate (Critical)**:

- Site is down (health check fails)
- Error rate >5%
- Database connection failure
- Out of memory
- Disk >95% full

**Within 1 Hour (Warning)**:

- Error rate >1%
- p95 response time >1s
- Memory >85%
- Disk >80% full
- Unusual traffic patterns

**Daily Digest (Info)**:

- Daily active users
- New sign-ups
- Total trips created
- AI generations used
- Top errors (non-critical)

---

## Automated Health Checks

Create a cron job to check health:

```bash
# Add to crontab (crontab -e)
*/5 * * * * curl -f https://tripsync.app/api/health || echo "TripSync is DOWN!" | mail -s "ALERT: TripSync Down" your@email.com
```

Or use this script:

```bash
#!/bin/bash
# scripts/health-check.sh

HEALTH_URL="https://tripsync.app/api/health?detailed=true"
ALERT_EMAIL="abdulmuheethmd29@gmail.com"

response=$(curl -s -w "%{http_code}" -o /tmp/health.json "$HEALTH_URL")

if [ "$response" != "200" ]; then
  echo "CRITICAL: Health check failed with HTTP $response" | mail -s "🚨 TripSync Health Check Failed" "$ALERT_EMAIL"
  exit 1
fi

# Check if any service is not ok
errors=$(jq -r '.services | to_entries[] | select(.value.status=="error") | .key' /tmp/health.json)

if [ -n "$errors" ]; then
  echo "WARNING: Services with errors: $errors" | mail -s "⚠️ TripSync Service Degraded" "$ALERT_EMAIL"
  exit 1
fi

echo "✅ All systems healthy"
```

---

## Performance Monitoring

### Track These Over Time

**Response Times**:

```bash
# Test API endpoints
for i in {1..100}; do
  curl -w "%{time_total}\n" -o /dev/null -s https://tripsync.app/api/health
done | awk '{sum+=$1; count++} END {print "Average:", sum/count "s"}'
```

**Database Performance**:

```sql
-- Slowest queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Table sizes
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Memory Leaks**:

```bash
# Monitor app memory over time
watch -n 60 'docker stats tripsync-app-prod --no-stream | grep tripsync'
```

---

## Incident Response Workflow

### When an Alert Fires

1. **Acknowledge** (1 min)
   - Check Slack/email alert
   - Acknowledge you're investigating

2. **Assess** (2 min)
   - Check health endpoint: `curl https://tripsync.app/api/health?detailed=true`
   - Check logs: `docker-compose logs app --tail=100`
   - Check Sentry for recent errors

3. **Diagnose** (5 min)
   - Is it app, database, or infrastructure?
   - How many users affected?
   - Can you reproduce it?

4. **Mitigate** (10 min)
   - Refer to RUNBOOK.md for specific issues
   - Consider rollback if recent deployment
   - Scale up if resource issue

5. **Communicate** (ongoing)
   - Update team on status
   - Post to status page if public
   - ETA for fix

6. **Fix** (variable)
   - Implement permanent fix
   - Test in staging first
   - Deploy fix

7. **Post-Mortem** (within 48h)
   - Document what happened
   - Root cause analysis
   - Prevention measures
   - Update runbook

---

## Monitoring Checklist

### Daily (Automated)

- [ ] Health check passes
- [ ] Error rate <1%
- [ ] Response time <500ms p95
- [ ] No critical alerts

### Weekly (Manual)

- [ ] Review Sentry errors
- [ ] Check disk space
- [ ] Review slow queries
- [ ] Check backup success
- [ ] Review user growth metrics

### Monthly (Manual)

- [ ] Load test in staging
- [ ] Review and update baselines
- [ ] Check SSL expiry (>30 days)
- [ ] Review and optimize costs
- [ ] Update dependencies

---

## Monitoring Tools Comparison

| Tool                 | Free Tier         | Best For               | Setup Time |
| -------------------- | ----------------- | ---------------------- | ---------- |
| Sentry               | 5K errors/mo      | Error tracking         | 5 min      |
| UptimeRobot          | 50 monitors       | Uptime                 | 5 min      |
| PostHog              | 1M events/mo      | Product analytics      | 10 min     |
| Grafana + Prometheus | Yes (self-hosted) | Custom dashboards      | 2 hours    |
| Better Stack         | 1GB logs/mo       | Log aggregation        | 15 min     |
| DataDog              | 14-day trial      | All-in-one (expensive) | 1 hour     |

---

## Resources

- **Runbook**: See `RUNBOOK.md` for incident response
- **Load Testing**: See `load-tests/LOAD-TESTING.md`
- **Performance Baselines**: Run `npm run baseline:prod`

---

## Support

Questions about monitoring?

- Email: abdulmuheethmd29@gmail.com
- Docs: See project README

---

**Next Steps**:

1. ✅ Set up Sentry error tracking
2. ✅ Set up UptimeRobot uptime monitoring
3. ✅ Create health check cron job
4. ✅ Set up alert email/Slack
5. ✅ Review metrics weekly

---

**Last Updated**: 2026-05-15
