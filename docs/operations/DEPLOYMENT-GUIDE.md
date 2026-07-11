# TripSync Deployment Guide

## Overview
This guide covers deploying the TripSync application (Node.js/Express backend + React frontend) to production. The app uses PostgreSQL, session management, authentication, and optional AI features.

---

## Table of Contents
1. [Backend Configuration](#backend-configuration)
2. [Middleware Setup](#middleware-setup)
3. [Database Setup](#database-setup)
4. [Environment Variables](#environment-variables)
5. [Hosting Options - CHEAPEST](#hosting-options---cheapest-💰)
6. [Hosting Options - BEST FOR PRODUCTION](#hosting-options---best-for-production-🚀)
7. [Deployment Steps](#deployment-steps)
8. [Post-Deployment Checklist](#post-deployment-checklist)
9. [Cost Comparison](#cost-comparison)

---

## Backend Configuration

### 1. Prerequisites
- Node.js 20 or higher
- PostgreSQL database
- npm or yarn

### 2. Build Configuration
The project uses a custom build script that bundles the application:

```bash
npm run build
```

This creates:
- `dist/index.cjs` - Server bundle
- `dist/public/` - Client static files

### 3. Production Environment
Set the following in production:
```bash
NODE_ENV=production
```

This enables:
- Trust proxy (for proper IP forwarding behind load balancers)
- HTTPS security headers
- Rate limiting (200 requests per 15 minutes)
- Security headers (CSP, XSS protection, etc.)

---

## Middleware Setup

### Security Middleware (Already Configured)
The app automatically sets up:

1. **Security Headers** (server/index.ts:21-29)
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `X-XSS-Protection: 1; mode=block`
   - `Strict-Transport-Security` (production only)

2. **Rate Limiting** (server/index.ts:114-123)
   - 200 requests per 15 minutes in production
   - Automatic IP-based throttling

3. **Body Parsing**
   - JSON parsing with **10mb limit** (server/index.ts)
   - URL-encoded form parsing

4. **Authentication**
   - JWT-based auth (server/auth.ts); tokens signed with `JWT_SECRET`. No Passport.js or Express session.

### Additional Middleware (Implemented)

1. **Helmet** (Enhanced Security) – configured in `server/index.ts` with `contentSecurityPolicy: false` to avoid breaking the SPA until CSP is tuned.
2. **Compression** – configured in `server/index.ts` to reduce response size.
3. **CORS** – when `CORS_ORIGIN` is set (e.g. `https://yourdomain.com`), the app uses `cors({ origin: env.corsOrigin })`. Set in `.env` when serving the API separately from the frontend.

---

## Database Setup

### PostgreSQL Required in Production
The app REQUIRES PostgreSQL in production (server/db.ts:7-8).

**Connection String Format:**
```
postgresql://username:password@host:port/database?sslmode=require
```

**Key Settings (server/db.ts:18-22):**
- Max connections: 20
- Idle timeout: 30 seconds
- Connection timeout: 10 seconds

### Migrations
Run migrations before starting the app:
```bash
npm run db:push
# or
npm run db:migrate
```

The app **auto-runs migrations on startup** when `DATABASE_URL` is set and the `migrations/` folder exists.

---

## Environment Variables

### Required Variables

```bash
# Server
PORT=3000
HOST=0.0.0.0
NODE_ENV=production

# Database (REQUIRED in production)
DATABASE_URL=postgresql://user:password@host:5432/tripsync

# Authentication (REQUIRED)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# VAPID Keys for Push Notifications (Recommended)
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
```

### Optional Variables

```bash
# AI Features (Anthropic)
AI_INTEGRATIONS_ANTHROPIC_API_KEY=sk-ant-...
AI_INTEGRATIONS_ANTHROPIC_BASE_URL=https://api.anthropic.com (optional)

# Admin Access
ADMIN_EMAILS=admin@example.com,admin2@example.com

# Future: Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Future: File Storage
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=...
```

### Generate Secrets
```bash
# JWT + VAPID instructions (recommended)
npm run generate-secrets

# Or manually:
# JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# VAPID Keys (Web Push)
npx web-push generate-vapid-keys
```

---

## Hosting Options - CHEAPEST 💰

### Option 1: Render.com (RECOMMENDED - Easiest & Free)

**Cost: $0/month**
- Free tier: 750 hours/month web service
- Free PostgreSQL database (90 days, then auto-deletes)
- Auto-deploy from GitHub

**Setup:**
1. Create account at [render.com](https://render.com)
2. New → Web Service → Connect GitHub repo
3. Settings:
   - **Runtime:** Docker
   - **Region:** Choose closest
   - **Instance Type:** Free
4. Add PostgreSQL database (Dashboard → New → PostgreSQL)
5. Set environment variables in Render dashboard
6. Deploy!

**Pros:**
- Zero configuration
- Auto-deploy on git push
- Free SSL certificates
- Easy database backups

**Cons:**
- Free tier spins down after 15 min inactivity (cold start ~30s)
- Database auto-deletes after 90 days (upgrade to $7/month for persistence)

---

### Option 2: Railway.app (Best Free Credits)

**Cost: $0/month (with $5 free credit/month)**
- $5 credit = ~200 hours runtime
- Includes PostgreSQL
- No cold starts

**Setup:**
1. Sign up at [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Add PostgreSQL database
4. Set environment variables
5. Deploy

**Pros:**
- No cold starts
- Better performance than Render free tier
- Generous free credits

**Cons:**
- $5 credit can run out if traffic is high
- After credits, need to pay (~$5-10/month)

---

### Option 3: Fly.io (Good Global CDN)

**Cost: $0-5/month**
- Free tier: 3 shared CPUs, 256MB RAM
- Free PostgreSQL (single node)
- Auto-scaling

**Setup:**
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch app
fly launch

# Set secrets
fly secrets set DATABASE_URL=postgresql://...
fly secrets set JWT_SECRET=...

# Deploy
fly deploy
```

**Pros:**
- Global edge network
- Good for international users
- PostgreSQL included

**Cons:**
- Command-line setup (more technical)
- Free tier limited resources

---

### Option 4: Vercel (Frontend) + Supabase (Backend/DB)

**Cost: $0/month**
- Vercel: Free hosting for frontend
- Supabase: Free PostgreSQL + Auth + Storage

**Setup:**
1. **Frontend (Vercel):**
   - Connect GitHub to Vercel
   - Build command: `npm run build`
   - Output: `dist/public`

2. **Backend (Supabase or separate):**
   - Deploy API to Render/Railway
   - Use Supabase for PostgreSQL

**Pros:**
- Best performance for frontend (global CDN)
- Supabase has generous free tier (500MB database)
- Built-in auth (could replace Passport.js)

**Cons:**
- Requires splitting frontend/backend
- Need CORS configuration
- More complex setup

---

### Option 5: DigitalOcean App Platform

**Cost: $0/month (free static hosting) + $5/month (smallest backend)**
- Free static site hosting
- $5/month basic web service
- $15/month managed PostgreSQL

**Setup:**
1. Create DigitalOcean account
2. Apps → Create App → GitHub
3. Choose Dockerfile deployment
4. Add managed database

**Total: $20/month for production-ready setup**

**Pros:**
- Reliable and fast
- Good documentation
- Predictable pricing

**Cons:**
- Database costs $15/month (not free)

---

## Hosting Options - BEST FOR PRODUCTION 🚀

### Option 1: AWS (Most Scalable)

**Services:**
- **ECS/Fargate:** Run Docker containers (~$15-30/month)
- **RDS PostgreSQL:** Managed database (~$15-50/month)
- **ALB:** Load balancer (~$20/month)
- **CloudFront:** CDN for static assets (~$1-10/month)
- **S3:** Static file storage (~$1/month)

**Estimated Cost: $50-100/month**

**Setup:**
1. Create ECS cluster
2. Push Docker image to ECR
3. Create RDS PostgreSQL instance
4. Configure ALB with SSL certificate
5. Deploy task definition

**Pros:**
- Infinite scalability
- Best security and compliance
- Full control
- 99.99% uptime SLA

**Cons:**
- Complex setup
- Higher cost
- Requires DevOps knowledge

---

### Option 2: Google Cloud Run (Serverless)

**Cost: ~$10-30/month**
- Pay-per-request
- Auto-scaling to zero
- Managed PostgreSQL (Cloud SQL)

**Setup:**
```bash
# Install gcloud CLI
gcloud init

# Build and deploy
gcloud builds submit --tag gcr.io/PROJECT_ID/tripsync
gcloud run deploy --image gcr.io/PROJECT_ID/tripsync --platform managed
```

**Pros:**
- Serverless (pay only for usage)
- Auto-scaling
- Good for variable traffic

**Cons:**
- Cold starts (can be mitigated)
- Cloud SQL adds cost ($10-30/month)

---

### Option 3: Heroku (Easiest Enterprise)

**Cost: $25-50/month**
- $7/month: Eco Dynos (2 web + 2 worker)
- $5/month: Essential PostgreSQL (10M rows)
- $20/month: Optional Redis for sessions

**Setup:**
```bash
heroku create tripsync
heroku addons:create heroku-postgresql:essential-0
heroku config:set JWT_SECRET=...
git push heroku main
```

**Pros:**
- Easiest deployment
- Excellent DX (developer experience)
- Built-in CI/CD
- Automatic SSL

**Cons:**
- More expensive than alternatives
- Less control than AWS

---

### Option 4: Self-Hosted VPS (Most Control)

**Providers:**
- **Hetzner:** €4.51/month (2 vCPU, 4GB RAM) - CHEAPEST VPS
- **DigitalOcean Droplet:** $6/month (1 vCPU, 1GB RAM)
- **Linode:** $5/month (1 vCPU, 1GB RAM)
- **Vultr:** $6/month (1 vCPU, 1GB RAM)

**Setup:**
```bash
# SSH into server
ssh root@your-server-ip

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com | sh

# Clone repo
git clone https://github.com/yourusername/trip-sync.git
cd trip-sync

# Create .env file
nano .env

# Create docker-compose.yml (see below)
nano docker-compose.yml

# Start services
docker-compose up -d

# Setup nginx reverse proxy + SSL (Let's Encrypt)
apt install nginx certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:password@db:5432/tripsync
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: tripsync
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

**Pros:**
- Full control
- Cheapest option at scale
- No vendor lock-in
- Can run multiple apps

**Cons:**
- Requires server management
- You handle security, backups, updates
- No auto-scaling

---

## Deployment Steps

### Step 1: Prepare Repository
```bash
# Ensure Dockerfile works locally
docker build -t tripsync .
docker run -p 3000:3000 -e DATABASE_URL=... tripsync

# Test build
npm run build
npm start
```

### Step 2: Setup Database
1. Create PostgreSQL database (see hosting options above)
2. Copy connection string
3. Run migrations:
   ```bash
   DATABASE_URL=postgresql://... npm run db:push
   ```

### Step 3: Generate Secrets
```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# VAPID Keys
npx web-push generate-vapid-keys
```

### Step 4: Configure Environment Variables
Set in your hosting platform:
- `DATABASE_URL`
- `JWT_SECRET`
- `NODE_ENV=production`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY` (optional)
- `ADMIN_EMAILS` (optional)

### Step 5: Deploy
Follow platform-specific instructions above.

### Step 6: Verify Deployment
```bash
# Check health endpoint
curl https://your-app.com/api/health

# Test authentication
curl -X POST https://your-app.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

---

## Post-Deployment Checklist

### Security
- [ ] Change all default secrets (JWT_SECRET)
- [ ] Enable HTTPS (should be automatic on most platforms)
- [ ] Configure CORS if frontend/backend are separate
- [ ] Review rate limiting settings
- [ ] Enable database backups
- [ ] Set up error monitoring (Sentry, LogRocket)

### Performance
- [ ] Enable compression middleware
- [ ] Configure CDN for static assets
- [ ] Set up database connection pooling (already configured)
- [ ] Monitor application performance

### Monitoring
- [ ] Set up uptime monitoring (UptimeRobot - free)
- [ ] Configure log aggregation
- [ ] Set up alerts for errors
- [ ] Monitor database performance

### Backups
- [ ] Enable automated database backups
- [ ] Test database restore process
- [ ] Document backup retention policy

---

## Cost Comparison

| Option | Monthly Cost | Best For | Difficulty |
|--------|-------------|----------|-----------|
| **Render (Free)** | $0 | Testing, low traffic | Easy ⭐ |
| **Railway** | $0 (with credits) | Small projects | Easy ⭐ |
| **Fly.io** | $0-5 | Global apps | Medium |
| **Vercel + Supabase** | $0 | Jamstack apps | Medium |
| **DigitalOcean App** | $20 | Simple production | Easy ⭐ |
| **Hetzner VPS** | €4.51 (~$5) | DIY, cheapest | Hard |
| **Heroku** | $25-50 | Fast deployment | Easy ⭐ |
| **AWS** | $50-100+ | Enterprise, scale | Hard |
| **Google Cloud Run** | $10-30 | Variable traffic | Medium |

---

## Recommended Setup for Different Use Cases

### 1. Just Testing / MVP
**Recommendation: Render (Free)**
- Cost: $0
- Upgrade path: $7/month for persistent DB

### 2. Small Production App (<1000 users)
**Recommendation: Railway or Render ($7-15/month)**
- Railway: Better performance, no cold starts
- Render: Easier to use, auto-backups

### 3. Growing App (1000-10,000 users)
**Recommendation: DigitalOcean App Platform or Heroku ($20-50/month)**
- Good balance of ease and scalability
- Managed databases
- Easy scaling

### 4. Large Production App (10,000+ users)
**Recommendation: AWS or Google Cloud ($100+/month)**
- Full control
- Auto-scaling
- Best performance

### 5. Absolute Cheapest (DIY)
**Recommendation: Hetzner VPS (€4.51/month)**
- Requires technical knowledge
- You manage everything
- Best value at scale

---

## Database Recommendations

### Free Tier Options
1. **Supabase** - 500MB, unlimited API requests
2. **Neon** - 512MB, serverless PostgreSQL
3. **Render PostgreSQL** - 1GB, 90 days free
4. **ElephantSQL** - 20MB free (very limited)

### Paid Options
1. **Supabase Pro** - $25/month - 8GB
2. **Neon** - $19/month - Scale to zero
3. **DigitalOcean Managed** - $15/month - 1GB
4. **AWS RDS** - $15-50/month - Full control
5. **Heroku PostgreSQL** - $5/month - 10M rows

---

## Support & Monitoring (Free Options)

### Uptime Monitoring
- **UptimeRobot** - Free, 50 monitors
- **Better Uptime** - Free tier available

### Error Tracking
- **Sentry** - Free tier, 5K events/month
- **LogRocket** - Free tier, 1K sessions/month

### Analytics
- **Plausible** - Privacy-friendly (paid)
- **Umami** - Self-hosted, free

---

## Next Steps

1. Choose hosting platform based on budget and scale
2. Set up database (PostgreSQL)
3. Generate and store secrets securely
4. Configure environment variables
5. Deploy using platform-specific instructions
6. Test deployment thoroughly
7. Set up monitoring and backups
8. Plan for scaling

---

## Getting Help

- **Documentation Issues**: Check logs on your platform
- **Database Connection**: Verify `DATABASE_URL` format and SSL settings
- **Build Failures**: Ensure `npm run build` works locally
- **Environment Variables**: Double-check all required vars are set

---

## Quick Start (Recommended for Beginners)

**Fastest way to deploy (5 minutes):**

1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. New → Web Service → Connect repo
4. Select Dockerfile
5. Add PostgreSQL database
6. Set environment variables:
   - `DATABASE_URL` (auto-filled from database)
   - `JWT_SECRET` (generate with command above)
   - `NODE_ENV=production`
7. Click "Create Web Service"
8. Wait 5 minutes for deployment
9. Visit your app at `https://your-app.onrender.com`

**Done!** 🎉
