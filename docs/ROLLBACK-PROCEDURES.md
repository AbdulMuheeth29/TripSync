# TripSync Rollback Procedures

**Version:** 1.0.0
**Last Updated:** 2026-07-17
**Owner:** Engineering Team

---

## Table of Contents

1. [Overview](#overview)
2. [When to Rollback](#when-to-rollback)
3. [Decision Criteria](#decision-criteria)
4. [Rollback Methods](#rollback-methods)
5. [Database Rollback](#database-rollback)
6. [Feature Flag Emergency Disable](#feature-flag-emergency-disable)
7. [Communication During Rollback](#communication-during-rollback)
8. [Post-Rollback Procedures](#post-rollback-procedures)

---

## Overview

This document outlines procedures for rolling back TripSync deployments when issues occur in production.

**Key Principles:**

- Rollback quickly to minimize user impact
- Preserve data integrity
- Document everything
- Communicate transparently

**Rollback SLA:** Complete rollback within 15 minutes of decision

---

## When to Rollback

### Always Rollback If:

1. **Data Loss**
   - Users reporting lost trips, expenses, or content
   - Database corruption detected

2. **Critical Feature Broken**
   - Cannot create accounts or login
   - Cannot create trips
   - Payment processing broken
   - AI completely non-functional

3. **Security Issue**
   - Authentication bypass discovered
   - Data exposure vulnerability
   - SQL injection or XSS vulnerability

4. **High Error Rate**
   - Error rate >10%
   - Multiple Sentry alerts

5. **Site Down**
   - Complete outage
   - Cannot load any pages

### Consider Rollback If:

1. **Moderate Issues**
   - Non-critical feature broken
   - Error rate 5-10%
   - Performance significantly degraded

2. **User Complaints**
   - Multiple users reporting same issue
   - High severity complaints

### Don't Rollback If:

1. **Minor Issues**
   - UI glitches that don't break functionality
   - Single user issues
   - Error rate <1%

2. **Fixable with Feature Flag**
   - Can disable problematic feature without full rollback
   - Hotfix can be deployed quickly

---

## Decision Criteria

### Rollback Decision Matrix

| Error Rate | User Impact | Data Loss | Decision               |
| ---------- | ----------- | --------- | ---------------------- |
| >10%       | High        | Yes       | **Immediate Rollback** |
| >10%       | High        | No        | **Rollback**           |
| 5-10%      | Medium      | Yes       | **Rollback**           |
| 5-10%      | Medium      | No        | **Consider Rollback**  |
| <5%        | Low         | Yes       | **Rollback**           |
| <5%        | Low         | No        | **Fix Forward**        |

### Decision Makers

**Who Can Authorize Rollback:**

- On-Call Engineer (for critical issues)
- Engineering Manager
- CTO

**How Long to Wait Before Rollback:**

- P0 (Critical): Immediate (0-15 min)
- P1 (High): 15-30 min (try quick fix first)
- P2 (Medium): 1 hour (try fix first)

**Rule:** If not fixed within time window, rollback.

---

## Rollback Methods

### Method 1: Application Rollback (Git-Based)

**When to Use:** Most common rollback method

**Prerequisites:**

- Previous working commit identified
- Database migrations are reversible

**Steps:**

```bash
# 1. Identify last working commit
git log --oneline
# Find commit before deployment

# 2. Revert to previous commit
git revert HEAD  # Revert last commit
# or
git reset --hard <commit-hash>  # Hard reset (destructive)

# 3. Rebuild application
npm install  # If package.json changed
npm run build

# 4. Restart application
pm2 restart tripsync

# 5. Verify rollback
curl https://tripsync.app/api/health
# Should return healthy status
```

**Verification:**

- Site loads
- No Sentry errors
- Test critical flows (login, create trip)

**Rollback Time:** 5-10 minutes

---

### Method 2: Docker Rollback

**When to Use:** Using Docker-based deployment

**Steps:**

```bash
# 1. List recent Docker images
docker images tripsync

# 2. Stop current container
docker stop tripsync
docker rm tripsync

# 3. Run previous image
docker run -d \
  --name tripsync \
  --env-file .env.production \
  -p 3000:3000 \
  tripsync:previous-tag

# 4. Verify
docker logs tripsync
curl https://tripsync.app/api/health
```

**Rollback Time:** 3-5 minutes

---

### Method 3: Cloud Platform Rollback

#### Railway Rollback

```bash
# Via Dashboard:
# 1. Go to Deployments tab
# 2. Find last successful deployment
# 3. Click "Redeploy"

# Via CLI:
railway logs  # Check recent deployments
railway rollback  # Rollback to previous deployment
```

#### Fly.io Rollback

```bash
# 1. List recent releases
fly releases

# 2. Rollback to specific version
fly deploy --image <previous-image-tag>
```

**Rollback Time:** 5-10 minutes (depends on platform)

---

## Database Rollback

### Important: Test Migrations Before Production

**ALL database migrations MUST be reversible!**

### Migration Rollback Procedure

**Step 1: Check Migration History**

```bash
# View applied migrations
npm run db:migrations

# Identify problematic migration
# (e.g., "2026-07-17-add-column")
```

**Step 2: Rollback Migration**

```bash
# Drizzle ORM doesn't have built-in rollback
# You must create a "down" migration manually

# Example: If migration added column, create migration to remove it
npm run db:generate  # Create new migration
```

**Manual Migration Rollback (SQL):**

```sql
-- If migration added column
ALTER TABLE table_name DROP COLUMN column_name;

-- If migration added table
DROP TABLE table_name;

-- If migration modified data
-- Restore from backup (see below)
```

**Step 3: Restore from Backup (Last Resort)**

```bash
# Point-in-time restore to before deployment
# (depends on database provider)

# Supabase: Dashboard → Database → Restore from backup
# Neon: Dashboard → Restore to timestamp
# AWS RDS: Use snapshot restore
```

**⚠️ WARNING:** Database restore loses ALL data since backup!

- Only use for critical data corruption
- Requires management approval
- Users will lose recent changes

---

### Migration Safety Rules

**Before Creating Migration:**

1. **Always Reversible**

   ```sql
   -- Good: Can be reversed
   ALTER TABLE users ADD COLUMN last_login TIMESTAMP;
   -- Reverse: ALTER TABLE users DROP COLUMN last_login;

   -- Bad: Cannot be reversed without data loss
   ALTER TABLE users DROP COLUMN important_data;
   ```

2. **Test in Staging First**
   - Apply migration in staging
   - Test rollback in staging
   - Only then apply in production

3. **Backup Before Risky Migrations**

   ```bash
   # Create manual backup before migration
   npm run db:backup
   # Then run migration
   npm run db:migrate
   ```

4. **Non-Destructive Changes First**

   ```sql
   -- Step 1: Add new column (nullable)
   ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;

   -- Step 2: Backfill data
   UPDATE users SET email_verified = true WHERE email_confirmed_at IS NOT NULL;

   -- Step 3: Make NOT NULL (separate migration later)
   -- ALTER TABLE users ALTER COLUMN email_verified SET NOT NULL;
   ```

---

## Feature Flag Emergency Disable

**When to Use:**

- Specific feature is broken but rest of app works
- Faster than full rollback
- Buys time to fix issue properly

### Available Feature Flags

**In `.env.production` or environment variables:**

```bash
# Disable AI features
FEATURE_AI_ENABLED=false

# Disable file uploads
FEATURE_FILE_UPLOADS_ENABLED=false

# Disable Stripe billing
FEATURE_STRIPE_ENABLED=false

# Disable chat
FEATURE_CHAT_ENABLED=false

# Disable push notifications
FEATURE_PUSH_ENABLED=false

# Enable maintenance mode
MAINTENANCE_MODE=true
```

### How to Toggle Feature Flag

**Method 1: Environment Variable (Requires Restart)**

```bash
# Edit .env.production
FEATURE_AI_ENABLED=false

# Restart application
pm2 restart tripsync
```

**Method 2: Admin Panel (If Implemented)**

```
1. Login to /admin/metrics
2. Go to Feature Flags section
3. Toggle flag OFF
4. Changes take effect immediately
```

**Method 3: Database Override (If Implemented)**

```sql
UPDATE feature_flags SET enabled = false WHERE flag_name = 'ai_enabled';
```

---

### Maintenance Mode

**When to Use:**

- Need to take site offline for emergency fix
- Database maintenance
- Security issue investigation

**Enable Maintenance Mode:**

```bash
# Set environment variable
MAINTENANCE_MODE=true

# Restart application
pm2 restart tripsync

# Site will show maintenance page to all users
```

**Maintenance Page Content:**

```
TripSync is temporarily down for maintenance.

We'll be back shortly! Expected downtime: [X minutes]

Follow @TripSync on Twitter for updates.
```

---

## Communication During Rollback

### Internal Communication

**Immediately notify:**

1. **#incidents Slack channel**

   ```
   🚨 ROLLBACK IN PROGRESS
   Issue: [Description]
   Deployment: [Version/Commit]
   Rolling back to: [Previous version]
   ETA: 15 minutes
   ```

2. **On-call team**
3. **Engineering manager**
4. **Support team** (they'll get user questions)

---

### External Communication

**Status Page / Twitter:**

```
We're aware of issues with TripSync and are rolling back
a recent update. Service will be restored within 15 minutes.

We apologize for the inconvenience.
```

**After Rollback:**

```
Update: TripSync is back online. The issue has been resolved.

Thank you for your patience!
```

**Don't Say:**

- "We broke production" (unprofessional)
- Specific technical details (confusing)
- "This will never happen again" (can't promise)

**Do Say:**

- "We're aware of the issue"
- "Working on a fix"
- "Service is restored"

---

### User Communication (Email)

**If users were significantly impacted:**

```
Subject: TripSync Service Update

Hi [Name],

We wanted to let you know that TripSync experienced a brief
service disruption today between [time] and [time].

The issue has been resolved and all features are now working
normally. Your trip data is safe and no data was lost.

We apologize for any inconvenience this may have caused.

If you continue to experience any issues, please contact
support@tripsync.app.

Thank you for your patience,
The TripSync Team
```

---

## Post-Rollback Procedures

### Immediate Post-Rollback (0-1 hour)

1. **Verify Service Health**

   ```bash
   # Check all critical endpoints
   curl https://tripsync.app/api/health
   curl https://tripsync.app/api/trips

   # Check Sentry for new errors
   # Should be <1% error rate

   # Test critical flows
   # - Login
   # - Create trip
   # - AI generation
   # - Payment (test mode)
   ```

2. **Monitor for 1 Hour**
   - Watch Sentry error rate
   - Monitor server resources
   - Check for user complaints

3. **Update Status**
   - Mark incident as resolved
   - Post "All systems operational"
   - Update Slack #incidents

---

### Post-Mortem (1-48 hours)

1. **Schedule Post-Mortem Meeting**
   - Within 48 hours
   - Invite: On-call engineer, deployment engineer, manager
   - Duration: 30-60 minutes

2. **Document What Happened**
   - Timeline of events
   - Root cause analysis
   - Why wasn't it caught in staging/testing?
   - User impact (how many affected, how long)

3. **Action Items**
   - How to prevent this in the future
   - Testing improvements
   - Monitoring improvements
   - Process improvements

4. **Blameless Culture**
   - Focus on systems, not people
   - "How did the process fail?"
   - Not "Who made a mistake?"

---

### Fix-Forward Plan

1. **Identify Root Cause**
   - What broke?
   - Why did it break?

2. **Create Fix**
   - Write fix
   - Add tests to catch this in future
   - Test in staging

3. **Re-Deploy**
   - Only after thorough testing
   - Monitor closely after deployment
   - Gradual rollout if possible

---

## Rollback Checklist

Use this checklist during rollback:

### Pre-Rollback

- [ ] Rollback decision made and authorized
- [ ] Previous working version identified
- [ ] Database migrations reviewed (are they reversible?)
- [ ] Team notified (#incidents Slack)
- [ ] Status page updated

### During Rollback

- [ ] Application rolled back (git/Docker/platform)
- [ ] Database rolled back (if needed)
- [ ] Feature flags set (if needed)
- [ ] Application restarted
- [ ] Health check passed

### Post-Rollback

- [ ] Sentry errors back to normal (<1%)
- [ ] Critical flows tested
- [ ] User-facing communication sent
- [ ] Incident log updated
- [ ] Monitored for 1 hour
- [ ] Post-mortem scheduled

---

## Rollback Testing

### Rollback Drills

**Frequency:** Quarterly

**Purpose:** Ensure team can execute rollback quickly

**Procedure:**

1. Deploy test change to staging
2. Simulate production issue
3. Practice rollback procedure
4. Time the rollback
5. Document issues encountered
6. Update runbook

**Goal:** Rollback in <10 minutes

---

## Emergency Contacts

**Rollback Authorization:**

- On-Call Engineer: [Phone]
- Engineering Manager: [Phone]
- CTO: [Phone]

**Never Hesitate to Rollback:**
If in doubt, roll back. It's better to be safe than sorry.

---

**Document Owner:** Engineering Team
**Review Frequency:** After each rollback + quarterly
**Last Reviewed:** 2026-07-17
