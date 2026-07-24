# TripSync On-Call Runbook

**Version:** 1.0.0
**Last Updated:** 2026-07-17
**Owner:** Engineering Team

---

## Table of Contents

1. [Overview](#overview)
2. [On-Call Schedule](#on-call-schedule)
3. [Emergency Contacts](#emergency-contacts)
4. [Monitoring & Alerts](#monitoring--alerts)
5. [Common Production Issues](#common-production-issues)
6. [Diagnostic Procedures](#diagnostic-procedures)
7. [Emergency Procedures](#emergency-procedures)
8. [Escalation Guidelines](#escalation-guidelines)
9. [Post-Incident Procedures](#post-incident-procedures)

---

## Overview

This runbook provides on-call engineers with procedures for diagnosing and resolving production incidents for TripSync.

**When you're on-call:**

- Respond to alerts within 15 minutes
- Acknowledge incidents in PagerDuty/alert system
- Follow this runbook for common issues
- Escalate if needed
- Document all actions in incident log

**On-Call Duration:** 1 week rotations (Monday-Monday)

---

## On-Call Schedule

**Primary On-Call:** [Name] - [Phone] - [Slack: @handle]
**Secondary On-Call:** [Name] - [Phone] - [Slack: @handle]
**Manager (Escalation):** [Name] - [Phone]

**Handoff Procedure:**

1. Review open incidents
2. Check for upcoming deployments
3. Review recent changes
4. Update on-call contact in alert system

---

## Emergency Contacts

### Internal Contacts

| Role                | Name  | Phone | Slack          | Email               |
| ------------------- | ----- | ----- | -------------- | ------------------- |
| Primary On-Call     | [TBD] | [TBD] | @oncall        | oncall@tripsync.app |
| Secondary On-Call   | [TBD] | [TBD] | @oncall-backup | -                   |
| Engineering Manager | [TBD] | [TBD] | @eng-manager   | -                   |
| CTO                 | [TBD] | [TBD] | @cto           | -                   |

### External Service Contacts

| Service                  | Status Page                      | Support            |
| ------------------------ | -------------------------------- | ------------------ |
| Anthropic Claude         | https://status.anthropic.com     | -                  |
| Stripe                   | https://status.stripe.com        | support@stripe.com |
| AWS S3                   | https://status.aws.amazon.com    | AWS Support        |
| Cloudflare R2            | https://www.cloudflarestatus.com | -                  |
| Database (Supabase/Neon) | [provider status]                | [provider support] |

---

## Monitoring & Alerts

### Alert Channels

1. **Sentry** - Application errors
   - URL: https://sentry.io/organizations/tripsync
   - Alerts via: Email, Slack #alerts

2. **Server Monitoring** (if configured)
   - CPU, memory, disk usage
   - Database performance
   - API response times

3. **Uptime Monitoring** (if configured)
   - UptimeRobot, Pingdom, etc.
   - Alerts when site is down

### Alert Severity Levels

**P0 - Critical (Respond immediately)**

- Site completely down
- Data breach
- Payment processing broken
- Data loss

**P1 - High (Respond within 15 min)**

- Major feature broken (AI, auth, billing)
- Error rate >5%
- API response time >5s
- Database connection issues

**P2 - Medium (Respond within 1 hour)**

- Minor feature broken
- Error rate 1-5%
- Performance degradation
- Elevated warning logs

**P3 - Low (Respond next business day)**

- UI glitches
- Non-critical bugs
- Warning messages

---

## Common Production Issues

### Issue 1: Database Connection Failures 🔴 CRITICAL

**Symptoms:**

- "Database connection error" in logs
- Users can't load trips
- 500 errors on all endpoints

**Diagnosis:**

```bash
# Check database connection
psql $DATABASE_URL -c "SELECT 1"

# Check connection pool
# (check application logs for pool exhaustion)
```

**Common Causes:**

1. Database service down
2. Connection pool exhausted
3. Incorrect DATABASE_URL
4. Database out of disk space
5. Too many concurrent connections

**Resolution:**

```bash
# Option 1: Restart application to reset connection pool
pm2 restart tripsync
# or
docker restart tripsync

# Option 2: Check database service status
# (Supabase dashboard, Neon dashboard, etc.)

# Option 3: Increase connection pool size
# Edit .env
# DATABASE_POOL_SIZE=20 (increase from default 10)

# Option 4: Check database disk space
# Login to database provider dashboard
```

**User Communication:**

```
"We're experiencing database connectivity issues.
Our team is working on it. Updates in 15 minutes."
```

**Escalate if:** Not resolved in 30 minutes

---

### Issue 2: Anthropic API Rate Limit Exceeded 🤖

**Symptoms:**

- AI generation failing
- "API quota exceeded" errors in Sentry
- 429 status codes from Anthropic

**Diagnosis:**

```bash
# Check Sentry for Anthropic errors
# Search: "Anthropic" + "429" or "rate limit"

# Check Anthropic usage dashboard
# https://console.anthropic.com
```

**Common Causes:**

1. Monthly API quota exceeded
2. Request rate limit hit (too many requests/minute)
3. API key invalid or expired

**Resolution:**

```bash
# Option 1: Temporarily disable AI via feature flag
# In .env or admin panel
FEATURE_AI_ENABLED=false

# Option 2: Increase Anthropic quota
# Login to Anthropic console → Increase budget

# Option 3: Implement request queueing
# (requires code change - escalate)
```

**User Communication:**

```
"AI features are temporarily unavailable due to high demand.
We're working to restore service. You can still plan trips manually."
```

**Escalate if:** Need to increase budget beyond approved amount

---

### Issue 3: High Memory Usage / Memory Leak 💾

**Symptoms:**

- Server using >90% memory
- Slow responses
- Server crashes and restarts
- Out of memory errors

**Diagnosis:**

```bash
# Check memory usage
free -h

# Check Node.js process memory
ps aux | grep node

# Get heap snapshot (if node process running)
kill -USR2 <pid>  # Triggers heap dump
```

**Common Causes:**

1. Memory leak in application code
2. Too many concurrent requests
3. Large data processing (e.g., big CSV export)
4. Insufficient server resources

**Resolution:**

```bash
# Quick fix: Restart application
pm2 restart tripsync

# Scale up resources (if cloud platform)
# Railway: Increase memory limit
# Fly.io: fly scale vm shared-cpu-2x

# Long-term: Investigate memory leak
# Analyze heap dumps
# Look for growing arrays, unclosed connections
```

**User Communication:**

```
"We're experiencing performance issues.
Our team is optimizing server resources."
```

**Escalate if:** Memory usage returns to >90% after restart

---

### Issue 4: Disk Space Full 💿

**Symptoms:**

- "No space left on device" errors
- File uploads failing
- Database writes failing
- Application crashes

**Diagnosis:**

```bash
# Check disk usage
df -h

# Find largest directories
du -sh /* | sort -h
du -sh /var/* | sort -h
```

**Common Causes:**

1. Log files growing too large
2. Temp files not cleaned
3. Database backups filling disk
4. User uploads (if stored locally)

**Resolution:**

```bash
# Clear old logs
cd /var/log
rm -f *.log.* # Remove rotated logs
pm2 flush # Clear PM2 logs

# Clear temp files
rm -rf /tmp/*

# Clear Docker images/containers (if using Docker)
docker system prune -a

# Increase disk size (if cloud platform)
# Railway: Increase volume size
# AWS: Resize EBS volume
```

**User Communication:**

```
"We're experiencing storage issues.
File uploads may be temporarily unavailable."
```

**Escalate if:** Disk fills up quickly after cleaning (indicates ongoing issue)

---

### Issue 5: Redis Connection Failures (if using Redis) ⚡

**Symptoms:**

- "Redis connection error" in logs
- Session logout issues
- Token blacklist not working
- Performance degradation

**Diagnosis:**

```bash
# Test Redis connection
redis-cli -h <host> -p <port> ping
# Should return: PONG

# Check Redis memory usage
redis-cli info memory
```

**Common Causes:**

1. Redis service down
2. Redis out of memory
3. Incorrect REDIS_URL
4. Network issues

**Resolution:**

```bash
# Option 1: Restart Redis
# (Upstash dashboard, Redis Cloud, or local)
systemctl restart redis  # if self-hosted

# Option 2: Fall back to memory storage
# Application should automatically fall back

# Option 3: Clear Redis cache
redis-cli FLUSHALL  # WARNING: Clears all data
```

**User Communication:**

```
"We're experiencing caching issues.
You may need to log in again."
```

**Impact:** Users may be logged out, some features slower

---

### Issue 6: Email Delivery Failures 📧

**Symptoms:**

- Password reset emails not sending
- Invitations not received
- SMTP errors in logs

**Diagnosis:**

```bash
# Check SMTP logs (depends on provider)
# SendGrid: Check dashboard
# AWS SES: Check CloudWatch logs

# Test SMTP connection
telnet smtp.sendgrid.net 587
```

**Common Causes:**

1. SMTP service down
2. API key expired/revoked
3. Rate limit exceeded
4. Email marked as spam (reputation issue)
5. Incorrect SMTP credentials

**Resolution:**

```bash
# Check SMTP credentials in .env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxx  # Verify this is correct

# Check SendGrid/SES dashboard for:
# - Bounces
# - Spam reports
# - API key status
# - Rate limits

# Temporary workaround: Disable email features
# Or: Use alternative SMTP provider
```

**User Communication:**

```
"Email delivery is temporarily delayed.
Use the share link feature instead of email invitations."
```

**Escalate if:** SMTP service issue requires contacting provider support

---

### Issue 7: SSL Certificate Expiration 🔒

**Symptoms:**

- "Your connection is not private" browser warning
- SSL certificate expired error
- HTTPS not working

**Diagnosis:**

```bash
# Check certificate expiration
openssl s_client -connect tripsync.app:443 -servername tripsync.app

# Or use online checker
# https://www.sslshopper.com/ssl-checker.html
```

**Prevention:**

- Certificates should auto-renew (Let's Encrypt)
- Set up expiration alerts 30 days before

**Resolution:**

```bash
# Let's Encrypt (certbot) renewal
certbot renew

# Or force renewal
certbot renew --force-renewal

# Cloudflare: Auto-managed
# (no action needed if using Cloudflare SSL)
```

**User Communication:**

```
"We're updating our security certificates.
Service will be restored within 15 minutes."
```

**Escalate if:** Auto-renewal is broken (needs engineering fix)

---

### Issue 8: Stripe Webhook Failures 💳

**Symptoms:**

- Payments successful but subscriptions not activating
- "Webhook signature verification failed"
- User charged but still on Free tier

**Diagnosis:**

```bash
# Check Stripe dashboard
# Webhooks tab → View recent deliveries

# Check for failed webhook deliveries
# Status: Failed, Timed Out

# Check logs for webhook errors
grep "webhook" /var/log/tripsync/app.log
```

**Common Causes:**

1. Webhook secret mismatch
2. Application server down during webhook
3. Webhook endpoint code error
4. Stripe IP blocked by firewall

**Resolution:**

```bash
# Verify webhook secret in .env matches Stripe
# Stripe Dashboard → Webhooks → Signing secret
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Manually trigger webhook resend in Stripe dashboard
# Or manually update user subscription:
# (Admin panel or database update)

# Check application endpoint is accessible
curl https://tripsync.app/api/webhooks/stripe
# Should return 405 Method Not Allowed (not 404)
```

**User Communication:**

```
"Your payment was successful! Your Pro features
are activating now. Please refresh the page."
```

**Manual Fix:**

```sql
-- Update user subscription manually (LAST RESORT)
UPDATE users
SET subscription_tier = 'pro'
WHERE email = 'user@example.com';
```

---

## Diagnostic Procedures

### Procedure 1: Check Application Logs

**Purpose:** Diagnose errors and unusual behavior

```bash
# View live logs (PM2)
pm2 logs tripsync --lines 100

# View live logs (Docker)
docker logs -f tripsync --tail 100

# Search for errors
pm2 logs tripsync | grep ERROR
pm2 logs tripsync | grep "500"

# Check specific time range
# (depends on logging system)
```

**What to look for:**

- Stack traces
- "ERROR" or "FATAL" messages
- 500 status codes
- Database connection errors
- API errors (Anthropic, Stripe)

---

### Procedure 2: Check Sentry for Errors

**Purpose:** View detailed error reports with stack traces

**Steps:**

1. Go to https://sentry.io/organizations/tripsync
2. Filter by time range (e.g., last 1 hour)
3. Sort by "Frequency" or "Users affected"
4. Click error to see:
   - Stack trace
   - User context
   - Breadcrumbs (what led to error)
   - Similar errors

**Key Metrics:**

- Error rate: Should be <1%
- New errors: Investigate immediately
- Regression: Errors that were fixed but returned

---

### Procedure 3: Check Database Health

**Purpose:** Verify database is responsive and performant

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check active connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity"

# Check slow queries
psql $DATABASE_URL -c "
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '5 seconds'
ORDER BY duration DESC;
"

# Check database size
psql $DATABASE_URL -c "
SELECT pg_size_pretty(pg_database_size(current_database()))
"
```

---

### Procedure 4: Check External Service Status

**Purpose:** Determine if issue is with third-party service

**Status Pages:**

- Anthropic: https://status.anthropic.com
- Stripe: https://status.stripe.com
- AWS: https://status.aws.amazon.com
- Cloudflare: https://www.cloudflarestatus.com

**If service is down:**

1. Note in incident log
2. No action needed (wait for service to recover)
3. Communicate to users
4. Implement fallback if available

---

## Emergency Procedures

### Emergency 1: Complete Site Outage 🚨

**Symptoms:** Site completely unreachable, 100% error rate

**Immediate Actions:**

1. **Verify outage**

   ```bash
   curl https://tripsync.app
   # If no response or error → confirmed outage
   ```

2. **Check server status**
   - Cloud platform dashboard (Railway, Fly.io, etc.)
   - Is server running?
   - Recent deployments?

3. **Restart application**

   ```bash
   pm2 restart tripsync
   # or
   docker restart tripsync
   ```

4. **Check database connection**

   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```

5. **Communicate**
   - Post to status page (if available)
   - Tweet from company account
   - Update in #incidents Slack

**Escalation:** If not resolved in 15 minutes, escalate to CTO

---

### Emergency 2: Data Breach Suspected 🔐

**Symptoms:** Unauthorized access, suspicious database activity, reports of data exposure

**CRITICAL - DO NOT DELAY:**

1. **Isolate immediately**

   ```bash
   # Block external database access
   # (depends on provider - Supabase, AWS RDS, etc.)

   # Put site in maintenance mode
   MAINTENANCE_MODE=true
   pm2 restart tripsync
   ```

2. **Notify management immediately**
   - CTO (phone)
   - Legal team
   - Security team (if exists)

3. **Preserve evidence**
   - Don't delete logs
   - Take snapshots
   - Document timeline

4. **Follow data breach protocol**
   - Notify affected users (GDPR: within 72 hours)
   - File reports with authorities if required
   - Engage security firm for investigation

**DO NOT:**

- Try to "fix" the issue yourself
- Delete any logs or evidence
- Communicate publicly before legal review

---

### Emergency 3: Rollback Deployment 🔄

**When:** Recent deployment caused critical issues

**Procedure:** See [ROLLBACK-PROCEDURES.md](./ROLLBACK-PROCEDURES.md)

**Quick Rollback:**

```bash
# Git-based rollback
git revert HEAD
npm run build
pm2 restart tripsync

# Docker rollback
docker pull tripsync:previous-tag
docker stop tripsync
docker run tripsync:previous-tag

# Cloud platform rollback
# Railway: Revert to previous deployment in dashboard
# Fly.io: fly deploy --image previous-image
```

---

## Escalation Guidelines

### When to Escalate

**Escalate to Secondary On-Call if:**

- Issue is outside your expertise
- You've been working on it for >1 hour with no progress
- Multiple simultaneous incidents
- You need another pair of eyes

**Escalate to Manager if:**

- Issue is unresolved after 2 hours
- Requires business decision (e.g., increase costs)
- Data breach suspected
- Need to notify customers

**Escalate to CTO if:**

- Data breach confirmed
- Complete outage >1 hour
- Financial impact >$10,000
- Legal issues

### How to Escalate

1. **Call or text** (don't just Slack)
2. **Brief summary:**
   - "Hi, I need escalation for [issue]"
   - "Impact: [X users affected, site down, etc.]"
   - "What I've tried: [list]"
   - "Next step recommendation: [your suggestion]"

---

## Post-Incident Procedures

### After Resolving Incident

1. **Update incident status**
   - Mark as resolved
   - Note resolution time

2. **Communicate resolution**
   - Post to status page
   - Update users if they were notified
   - Tweet "All systems operational"

3. **Document**
   - What happened
   - How it was discovered
   - How it was fixed
   - How long it took

4. **Create post-mortem** (for P0/P1 incidents)
   - Schedule within 48 hours
   - Blameless
   - Action items to prevent recurrence

---

### Post-Mortem Template

```markdown
# Incident Post-Mortem: [Title]

**Date:** [Date]
**Duration:** [Start time - End time]
**Severity:** [P0/P1/P2]
**Impact:** [X users affected, Y minutes downtime]

## Summary

[Brief description of what happened]

## Timeline

- [HH:MM] - Issue started
- [HH:MM] - Alert triggered
- [HH:MM] - Engineer responded
- [HH:MM] - Root cause identified
- [HH:MM] - Fix deployed
- [HH:MM] - Issue resolved

## Root Cause

[What caused the issue]

## Resolution

[How it was fixed]

## Action Items

- [ ] [Action item 1] - Owner: [Name] - Due: [Date]
- [ ] [Action item 2] - Owner: [Name] - Due: [Date]

## What Went Well

- [Thing 1]
- [Thing 2]

## What Could Be Improved

- [Thing 1]
- [Thing 2]
```

---

## Incident Log Template

Keep a running log during incidents:

```
[HH:MM] - Incident detected: [Description]
[HH:MM] - Alert acknowledged
[HH:MM] - Checked [service] - [Result]
[HH:MM] - Attempted [action] - [Result]
[HH:MM] - Escalated to [person]
[HH:MM] - Incident resolved
```

---

## Tools & Commands Reference

### Quick Commands

```bash
# Restart application
pm2 restart tripsync

# View logs
pm2 logs tripsync

# Check database
psql $DATABASE_URL -c "SELECT 1"

# Check disk space
df -h

# Check memory
free -h

# Check processes
ps aux | grep node

# Test SMTP
telnet smtp.sendgrid.net 587

# Check SSL cert
openssl s_client -connect tripsync.app:443
```

---

## Additional Resources

- [ROLLBACK-PROCEDURES.md](./ROLLBACK-PROCEDURES.md)
- [SUPPORT-RUNBOOK.md](./SUPPORT-RUNBOOK.md)
- [KNOWN-ISSUES.md](./KNOWN-ISSUES.md)
- Sentry: https://sentry.io/organizations/tripsync
- Admin Dashboard: https://tripsync.app/admin/metrics

---

**Document Owner:** Engineering Team
**Review Frequency:** Monthly or after major incidents
**Last Reviewed:** 2026-07-17
