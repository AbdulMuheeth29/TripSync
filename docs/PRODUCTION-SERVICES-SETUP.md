# TripSync Production Services Setup Guide

**Version:** 1.0.0
**Last Updated:** 2026-07-17
**Estimated Setup Time:** 8 hours
**Estimated Monthly Cost:** $27-172

---

## Table of Contents

1. [Overview](#overview)
2. [Database Setup (PostgreSQL)](#1-database-setup-postgresql)
3. [Anthropic API Setup](#2-anthropic-api-setup)
4. [Stripe Payment Setup](#3-stripe-payment-setup)
5. [File Storage Setup (R2 or S3)](#4-file-storage-setup)
6. [Email Service Setup (SMTP)](#5-email-service-setup)
7. [Security Secrets](#6-security-secrets)
8. [Optional Services](#7-optional-services)
9. [Environment Variables Summary](#environment-variables-summary)
10. [Testing All Services](#testing-all-services)

---

## Overview

This guide walks through configuring all required production services for TripSync.

**What you'll need:**

- Credit card for service payments
- ~8 hours of time
- Access to create accounts on various platforms
- Text editor for managing .env files

**Services to Configure:**

1. ✅ **Database** (Supabase/Neon/Railway) - REQUIRED
2. ✅ **Anthropic API** - REQUIRED for AI features
3. ✅ **Stripe** - REQUIRED for billing
4. ✅ **File Storage** (Cloudflare R2 or AWS S3) - REQUIRED for uploads
5. ✅ **Email (SMTP)** - REQUIRED for auth
6. ⚠️ **Redis** - Highly recommended
7. ⚠️ **Sentry** - Recommended for monitoring

---

## 1. Database Setup (PostgreSQL)

**Time: 30-60 minutes**
**Cost: $0-25/month**

### Option A: Supabase (Recommended - Easiest)

**Why Supabase:**

- Free tier available
- Easy setup
- Built-in backups
- Good dashboard

**Steps:**

1. **Sign up for Supabase**
   - Go to https://supabase.com
   - Click "Start your project"
   - Sign up with GitHub (recommended)

2. **Create a new project**
   - Click "New Project"
   - Organization: Create new or select existing
   - Name: `tripsync-production`
   - Database Password: Generate strong password (save this!)
   - Region: Choose closest to your users
   - Pricing plan: Free tier to start

3. **Get connection string**
   - Project created (takes ~2 minutes)
   - Go to Settings → Database
   - Copy "Connection string" under "Connection pooling"
   - Format: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres`

4. **Add to .env.production**

   ```bash
   DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres?sslmode=require
   ```

5. **Run migrations**

   ```bash
   npm run db:migrate
   ```

6. **Verify connection**
   ```bash
   psql "$DATABASE_URL" -c "SELECT 1"
   # Should return: 1
   ```

**Supabase Free Tier Limits:**

- 500MB database
- Unlimited API requests
- 50,000 monthly active users
- 7-day log retention

**When to upgrade:** >500MB data or need more than 7-day logs

---

### Option B: Neon (Good Alternative)

**Why Neon:**

- Serverless (auto-scales)
- Generous free tier
- Fast setup

**Steps:**

1. Sign up at https://neon.tech
2. Create project: `tripsync-production`
3. Copy connection string
4. Add to .env.production
5. Run migrations

**Neon Free Tier:**

- 10 GB storage
- Unlimited compute hours (with autosuspend)

---

### Option C: Railway (All-in-One Platform)

**Why Railway:**

- Can host database + application
- Simple deploys
- Good for startups

**Steps:**

1. Sign up at https://railway.app
2. New Project → Database → PostgreSQL
3. Copy DATABASE_URL from variables tab
4. Add to .env.production

**Railway Pricing:**

- $5/month base + usage
- ~$10-20/month for small app + database

---

## 2. Anthropic API Setup

**Time: 15 minutes**
**Cost: ~$20-100/month (usage-based)**

**Steps:**

1. **Sign up for Anthropic**
   - Go to https://console.anthropic.com
   - Click "Sign Up"
   - Verify email

2. **Add payment method**
   - Settings → Billing
   - Add credit card
   - **Required for production use**

3. **Create API key**
   - Settings → API Keys
   - Click "Create Key"
   - Name: `tripsync-production`
   - Copy API key (starts with `sk-ant-...`)
   - **Save this immediately - you won't see it again!**

4. **Set usage limits (recommended)**
   - Settings → Billing → Usage limits
   - Set monthly limit: $100 (adjust based on expected usage)
   - Enable email alerts at 50%, 75%, 90%

5. **Add to .env.production**

   ```bash
   AI_INTEGRATIONS_ANTHROPIC_API_KEY=sk-ant-api03-...
   ```

6. **Test API key**
   ```bash
   curl https://api.anthropic.com/v1/messages \
     -H "x-api-key: $AI_INTEGRATIONS_ANTHROPIC_API_KEY" \
     -H "anthropic-version: 2023-06-01" \
     -H "content-type: application/json" \
     -d '{
       "model": "claude-sonnet-4-20250514",
       "max_tokens": 10,
       "messages": [{"role": "user", "content": "Hi"}]
     }'
   # Should return a response
   ```

**Pricing:**

- Claude Sonnet 4.5: $3 per 1M input tokens, $15 per 1M output tokens
- Estimated cost: $0.10-0.30 per itinerary generation
- 100 generations/month ≈ $10-30

**Cost Optimization:**

- Implement caching (already built-in TripSync)
- Use Haiku for simple tasks (cheaper)
- Set monthly budget limits

---

## 3. Stripe Payment Setup

**Time: 1-2 hours**
**Cost: 2.9% + $0.30 per transaction**

**Steps:**

### Step 1: Create Stripe Account

1. **Sign up**
   - Go to https://stripe.com
   - Click "Start now"
   - Complete business information
   - Verify identity (may take 1-2 business days)

2. **Activate account**
   - Complete all verification steps
   - Add bank account for payouts
   - Set up business details

### Step 2: Create Products & Prices

1. **Go to Products**
   - Dashboard → Products
   - Click "Add product"

2. **Create Pro Plan (Monthly)**
   - Name: `TripSync Pro`
   - Description: `Unlimited trips, 25 members, 100 AI generations/month`
   - Price: `$9.99 USD` per month
   - Recurring: Monthly
   - Click "Save"
   - **Copy Price ID** (starts with `price_...`)

3. **Create Pro Plan (Annual)**
   - Add pricing to existing product
   - Price: `$99.99 USD` per year
   - Recurring: Yearly
   - **Copy Price ID**

4. **Create Teams Plan (Monthly)**
   - New product: `TripSync Teams`
   - Description: `Unlimited everything + priority support`
   - Price: `$29.99 USD` per month
   - **Copy Price ID**

5. **Create Teams Plan (Annual)**
   - Add pricing
   - Price: `$299.99 USD` per year
   - **Copy Price ID**

### Step 3: Configure Webhooks

1. **Create webhook endpoint**
   - Dashboard → Developers → Webhooks
   - Click "Add endpoint"
   - Endpoint URL: `https://your domain.com/api/webhooks/stripe`
   - Description: `TripSync production webhooks`

2. **Select events**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

3. **Get signing secret**
   - After creating webhook, click to view
   - **Copy Signing Secret** (starts with `whsec_...`)

### Step 4: Get API Keys

1. **Get Secret Key**
   - Dashboard → Developers → API keys
   - **Secret key** (starts with `sk_live_...`)
   - Click "Reveal live key"
   - **Copy immediately - for production use only!**

### Step 5: Add to .env.production

```bash
STRIPE_SECRET_KEY=sk_live_51...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_ANNUAL=price_...
STRIPE_PRICE_TEAMS_MONTHLY=price_...
STRIPE_PRICE_TEAMS_ANNUAL=price_...
```

### Step 6: Test Payment Flow

1. **Use Stripe test mode first**
   - Toggle to "Test mode" in dashboard
   - Use test API keys (sk*test*...)
   - Test card: `4242 4242 4242 4242`

2. **Test in application**
   - Subscribe to Pro plan
   - Use test card
   - Verify subscription created in Stripe dashboard
   - Verify webhook delivered successfully

3. **Switch to live mode**
   - Only after testing successfully
   - Update .env.production with live keys

**Important:**

- Never commit Stripe keys to git
- Use test mode for development
- Monitor webhook deliveries in Stripe dashboard

---

## 4. File Storage Setup

**Time: 30-60 minutes**
**Cost: $1-10/month**

### Option A: Cloudflare R2 (Recommended - Cheaper)

**Why R2:**

- S3-compatible
- No egress fees
- Cheaper than S3
- Easy setup

**Steps:**

1. **Sign up for Cloudflare**
   - Go to https://cloudflare.com
   - Sign up / log in
   - Go to R2

2. **Create R2 bucket**
   - R2 → Create bucket
   - Name: `tripsync-uploads-production`
   - Location: Automatic
   - Click "Create bucket"

3. **Configure CORS**
   - Select bucket → Settings → CORS policy
   - Add CORS policy:

   ```json
   [
     {
       "AllowedOrigins": ["https://your domain.com"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

4. **Create API token**
   - R2 → Manage R2 API Tokens
   - Create API token
   - Permissions: Object Read & Write
   - **Copy Access Key ID and Secret Access Key**

5. **Get Account ID**
   - Dashboard → R2 → Overview
   - Copy Account ID (top right)

6. **Add to .env.production**

   ```bash
   R2_ACCOUNT_ID=your-account-id
   R2_ACCESS_KEY_ID=your-access-key-id
   R2_SECRET_ACCESS_KEY=your-secret-access-key
   R2_BUCKET_NAME=tripsync-uploads-production
   ```

7. **Test upload**
   ```bash
   # Upload test file
   # (via application or AWS CLI configured for R2)
   ```

**R2 Pricing:**

- Storage: $0.015/GB/month
- Class A operations (writes): $4.50/million
- Class B operations (reads): $0.36/million
- **No egress fees!**

**Estimated monthly cost:** $1-5 for small apps

---

### Option B: AWS S3

**Steps:**

1. **Sign up for AWS**
   - https://aws.amazon.com
   - Create account
   - Add payment method

2. **Create S3 bucket**
   - Services → S3 → Create bucket
   - Name: `tripsync-uploads-production`
   - Region: us-east-1 (or closest to users)
   - **Uncheck "Block all public access"** (we'll use signed URLs)
   - Enable versioning (recommended)
   - Create bucket

3. **Configure CORS**
   - Select bucket → Permissions → CORS
   - Edit CORS configuration:

   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["https://yourdomain.com"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```

4. **Create IAM user**
   - Services → IAM → Users → Add user
   - Name: `tripsync-s3-uploader`
   - Access type: Programmatic access
   - Permissions: Attach existing policy → `AmazonS3FullAccess`
   - **Copy Access Key ID and Secret Access Key**

5. **Add to .env.production**
   ```bash
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=...
   AWS_S3_BUCKET=tripsync-uploads-production
   AWS_REGION=us-east-1
   ```

**S3 Pricing:**

- Storage: $0.023/GB/month
- PUT requests: $0.005/1000
- GET requests: $0.0004/1000
- Data transfer OUT: $0.09/GB (first 10TB)

**Estimated monthly cost:** $2-10 for small apps

---

## 5. Email Service Setup (SMTP)

**Time: 30-60 minutes**
**Cost: $0-15/month**

### Option A: SendGrid (Recommended)

**Why SendGrid:**

- Free tier (100 emails/day)
- Easy setup
- Good deliverability
- Detailed analytics

**Steps:**

1. **Sign up**
   - Go to https://sendgrid.com
   - Sign up free account

2. **Verify sender identity**
   - Settings → Sender Authentication
   - **Option 1: Single Sender Verification** (easier)
     - Add email: noreply@yourdomain.com
     - Verify via email link
   - **Option 2: Domain Authentication** (better deliverability)
     - Authenticate your domain
     - Add DNS records provided
     - Wait for verification (1-48 hours)

3. **Create API key**
   - Settings → API Keys
   - Create API Key
   - Name: `tripsync-production`
   - Permissions: Full Access (or Mail Send only)
   - **Copy API key** (starts with `SG.`)

4. **Add to .env.production**

   ```bash
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=SG.your-api-key-here
   SMTP_FROM=noreply@yourdomain.com
   ```

5. **Test email**
   ```bash
   npm run test:email
   ```

**SendGrid Free Tier:**

- 100 emails/day
- Contact management
- Email validation

**Upgrade to Essentials ($19.95/mo) for:**

- 50,000 emails/month
- Remove SendGrid branding
- 7-day email activity feed

---

### Option B: AWS SES (Best for high volume)

**Steps:**

1. **Sign up for AWS SES**
   - AWS Console → SES
   - Verify email or domain

2. **Request production access**
   - SES starts in sandbox mode
   - Request production access (Settings → Account)
   - Explain use case
   - Approval takes 24-48 hours

3. **Create SMTP credentials**
   - SES → SMTP Settings
   - Create SMTP credentials
   - **Copy username and password**

4. **Add to .env.production**
   ```bash
   SMTP_HOST=email-smtp.us-east-1.amazonaws.com
   SMTP_PORT=587
   SMTP_USER=your-smtp-username
   SMTP_PASS=your-smtp-password
   SMTP_FROM=noreply@yourdomain.com
   ```

**SES Pricing:**

- $0.10 per 1,000 emails
- Very cheap for high volume

---

### Option C: Gmail (For testing only)

**NOT recommended for production**, but useful for testing:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password  # Not your Gmail password!
SMTP_FROM=your-email@gmail.com
```

**To get app password:**

1. Enable 2FA on your Google account
2. Go to Google Account → Security → App passwords
3. Generate app password for "Mail"

**Limits:**

- 500 emails/day
- May go to spam
- Don't use for production!

---

## 6. Security Secrets

**Time: 5 minutes**
**Cost: Free**

### Generate JWT Secret

```bash
# Generate strong 64-character secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Add to .env.production:**

```bash
JWT_SECRET=your-64-character-hex-string-here
```

**IMPORTANT:**

- Must be at least 32 characters
- Use cryptographically secure random generation
- NEVER commit to git
- NEVER share publicly

---

### Generate VAPID Keys (Push Notifications)

```bash
npx web-push generate-vapid-keys
```

**Output:**

```
Public Key: BDd3_h...
Private Key: Q4L7...
```

**Add to .env.production:**

```bash
VAPID_PUBLIC_KEY=BDd3_h...
VAPID_PRIVATE_KEY=Q4L7...
```

---

## 7. Optional Services

### Redis (Highly Recommended)

**Why Redis:**

- Faster session management
- Token blacklist (logout)
- Caching
- Better performance

**Option A: Upstash (Recommended)**

1. Sign up at https://upstash.com
2. Create database
3. Copy Redis URL
4. Add to .env.production:
   ```bash
   REDIS_URL=rediss://default:password@host:port
   ```

**Upstash Free Tier:**

- 10,000 commands/day
- Perfect for small apps

**Option B: Redis Cloud**

- https://redis.com/cloud
- Similar setup

**If not using Redis:**

- App falls back to in-memory storage
- Works but less performant
- Users logout when server restarts

---

### Sentry (Error Monitoring)

**Why Sentry:**

- Track errors in production
- Stack traces and context
- Alerts when errors spike

**Steps:**

1. Sign up at https://sentry.io
2. Create project: `tripsync-production`
3. Copy DSN
4. Add to .env.production:
   ```bash
   SENTRY_DSN=https://...@sentry.io/project-id
   ```

**Sentry Free Tier:**

- 5,000 errors/month
- 1-day event retention

---

### Analytics (PostHog)

**Steps:**

1. Sign up at https://posthog.com
2. Create project
3. Copy API key
4. Add to .env (client-side):
   ```bash
   VITE_POSTHOG_KEY=phc_...
   VITE_POSTHOG_HOST=https://app.posthog.com
   ```

**PostHog Free Tier:**

- 1M events/month
- Unlimited users

---

## Environment Variables Summary

Create `.env.production` with all variables:

```bash
# ============ Server ============
PORT=3000
HOST=0.0.0.0
NODE_ENV=production

# ============ Required Services ============
# Database (Supabase, Neon, or Railway)
DATABASE_URL=postgresql://user:password@host:5432/tripsync?sslmode=require

# Authentication (REQUIRED)
JWT_SECRET=your-64-char-hex-string-here

# AI (Anthropic) - REQUIRED for AI features
AI_INTEGRATIONS_ANTHROPIC_API_KEY=sk-ant-...

# Stripe - REQUIRED for billing
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_ANNUAL=price_...
STRIPE_PRICE_TEAMS_MONTHLY=price_...
STRIPE_PRICE_TEAMS_ANNUAL=price_...

# File Storage - REQUIRED for uploads
# Option 1: Cloudflare R2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=tripsync-uploads-production

# Option 2: AWS S3 (if not using R2)
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...
# AWS_S3_BUCKET=tripsync-uploads-production
# AWS_REGION=us-east-1

# Email (SMTP) - REQUIRED for auth
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your-api-key
SMTP_FROM=noreply@yourdomain.com

# Push Notifications (RECOMMENDED)
VAPID_PUBLIC_KEY=BDd3...
VAPID_PRIVATE_KEY=Q4L7...

# ============ Optional Services ============
# Redis (Highly recommended)
REDIS_URL=rediss://user:pass@host:port

# Error Monitoring (Recommended)
SENTRY_DSN=https://...@sentry.io/project-id

# Analytics (Optional)
VITE_POSTHOG_KEY=phc_...
VITE_POSTHOG_HOST=https://app.posthog.com

# ============ Feature Flags ============
FEATURE_AI_ENABLED=true
FEATURE_FILE_UPLOADS_ENABLED=true
FEATURE_STRIPE_ENABLED=true
FEATURE_CHAT_ENABLED=true
FEATURE_PUSH_ENABLED=true
```

---

## Testing All Services

### Complete End-to-End Test

```bash
# 1. Set environment variables
export $(cat .env.production | xargs)

# 2. Test database
psql "$DATABASE_URL" -c "SELECT 1"

# 3. Run migrations
npm run db:migrate

# 4. Test Anthropic API
npm run test:services  # Should test AI generation

# 5. Test Stripe (test mode)
# Subscribe to Pro via UI with test card: 4242 4242 4242 4242

# 6. Test file upload
# Upload photo via UI

# 7. Test email
npm run test:email

# 8. Test Redis (if configured)
# Should see logs showing Redis connection

# 9. Run application
npm run build
npm start

# 10. Full smoke test
# - Create account
# - Create trip
# - Generate AI itinerary
# - Invite member
# - Upload photo
# - Subscribe to Pro
```

**All tests must pass before going to production!**

---

## Cost Summary

| Service           | Provider      | Free Tier       | Paid (Small Scale) |
| ----------------- | ------------- | --------------- | ------------------ |
| Database          | Supabase      | ✅ 500MB        | $25/mo (8GB)       |
| AI                | Anthropic     | ❌              | $20-100/mo         |
| Payments          | Stripe        | ✅              | 2.9% + $0.30/tx    |
| File Storage      | Cloudflare R2 | ❌ 10GB free    | $1-5/mo            |
| Email             | SendGrid      | ✅ 100/day      | $20/mo (50k/mo)    |
| Redis             | Upstash       | ✅ 10k cmds/day | $10/mo             |
| Error Tracking    | Sentry        | ✅ 5k errors/mo | $26/mo             |
| **Total Minimum** |               | **~$0-10/mo**   | **$27-172/mo**     |

**Notes:**

- Free tier good for testing
- Expect $50-100/month for real usage
- AI cost scales with usage
- Stripe takes % of revenue

---

## Next Steps

After configuring all services:

1. ✅ Verify all services in staging
2. ✅ Update .env.production with all keys
3. ✅ Run end-to-end test
4. ✅ Review [LAUNCH-DAY-PROCEDURES.md](./LAUNCH-DAY-PROCEDURES.md)
5. ✅ Schedule launch date
6. 🚀 Launch!

---

**Document Owner:** Engineering Team
**Review Frequency:** When adding new services
**Last Reviewed:** 2026-07-17
