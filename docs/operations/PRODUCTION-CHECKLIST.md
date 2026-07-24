# TripSync Production Launch Checklist

Use this checklist to ensure your TripSync deployment is production-ready.

## 🔴 Critical (Must Have Before Launch)

### Security

- [ ] **JWT_SECRET** - Strong random secret (min 32 characters)
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] **DATABASE_URL** - PostgreSQL connection string with SSL
  - Format: `postgresql://user:pass@host:5432/db?sslmode=require`
  - Test connection before deploying
- [ ] **HTTPS/SSL** - SSL certificate configured (Let's Encrypt or purchased)
- [ ] **Environment variables** - Never commit `.env` to git
- [ ] **Database backups** - Automated backup system in place
- [ ] **Admin access** - ADMIN_EMAILS configured for metrics dashboard

### Authentication & Email

- [ ] **SMTP configured** - Required for password resets and invites
  - SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM
  - Test with: `npm run test:email`
- [ ] **Password reset** - Works end-to-end
- [ ] **Trip invites** - Email invitations working

### Database

- [ ] **Migrations run** - All migrations applied
  ```bash
  npm run db:migrate
  ```
- [ ] **Connection pooling** - PostgreSQL max connections reviewed (default: 20)
- [ ] **Indexes** - Database properly indexed (check slow queries)

### Monitoring

- [ ] **Health check** - `/api/health` endpoint responding
- [ ] **Error tracking** - Sentry DSN configured (recommended)
- [ ] **Server logs** - Log aggregation set up (PM2, Docker logs, etc.)

## 🟡 Important (Highly Recommended)

### Performance & Caching

- [ ] **Redis configured** - For caching and session management
  - Without Redis: Falls back to in-memory (doesn't scale across instances)
  - With Redis: Better performance and supports horizontal scaling
- [ ] **CDN** - CloudFlare or similar for static assets
- [ ] **Database optimization** - Query performance reviewed

### Push Notifications

- [ ] **VAPID keys generated** - For web push notifications
  ```bash
  npx web-push generate-vapid-keys
  ```
- [ ] **Service worker** - PWA features tested
- [ ] **Push notifications** - Test on desktop and mobile browsers

### File Storage

- [ ] **S3 or R2 configured** - For photo/document uploads
  - AWS S3: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET
  - Cloudflare R2: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
  - Without storage: File upload features disabled
- [ ] **File size limits** - 25MB image, 10MB document limits tested
- [ ] **Upload security** - File type validation working

### Billing (If Monetizing)

- [ ] **Stripe configured** - If using paid features
  - STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
  - Price IDs for all plans
- [ ] **Webhook endpoint** - Stripe webhooks tested
  - Test with: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- [ ] **Subscription flows** - Checkout, cancellation, upgrades tested

## 🟢 Optional (Nice to Have)

### AI Features

- [ ] **Anthropic API key** - For Atlas AI trip planning
  - AI_INTEGRATIONS_ANTHROPIC_API_KEY
  - Test AI features before launch
- [ ] **Rate limiting** - API rate limits configured for AI endpoints

### SEO & Marketing

- [ ] **Meta tags** - Social media preview images working
- [ ] **Sitemap** - Generated and submitted to search engines
- [ ] **robots.txt** - Properly configured
- [ ] **Analytics** - Google Analytics or similar configured
- [ ] **Public trip pages** - SEO-optimized for sharing

### Compliance

- [ ] **Privacy policy** - Reviewed and accurate (see `/privacy`)
- [ ] **Terms of service** - Reviewed and accurate (see `/terms`)
- [ ] **Cookie consent** - Banner implemented
- [ ] **GDPR compliance** - If serving EU users
  - Right to data export
  - Right to deletion
- [ ] **Data retention** - Policy documented

### Infrastructure

- [ ] **Horizontal scaling** - Multiple app instances tested (if needed)
- [ ] **Load balancing** - Nginx or ALB configured
- [ ] **DDoS protection** - CloudFlare or similar
- [ ] **Rate limiting** - API rate limits configured (200 req/15min default)
- [ ] **Firewall rules** - Only necessary ports exposed (80, 443)

### DevOps

- [ ] **CI/CD pipeline** - Automated testing and deployment
- [ ] **Staging environment** - Test changes before production
- [ ] **Rollback plan** - Can revert to previous version quickly
- [ ] **Database backup restore** - Tested recovery from backup
- [ ] **Monitoring alerts** - Notified of downtime or errors

## 📋 Pre-Launch Testing Checklist

### Core Flows

- [ ] **User registration** - Create account with email
- [ ] **Login/logout** - Authentication working
- [ ] **Password reset** - Email received and reset works
- [ ] **Create trip** - From wizard and quick create
- [ ] **Invite members** - Email invites sent and accepted
- [ ] **Add itinerary items** - Flight, hotel, activity
- [ ] **Upload photos** - Image upload working
- [ ] **Upload documents** - PDF/image documents working
- [ ] **Group chat** - Real-time messaging working
- [ ] **Polls & voting** - Create poll, vote, see results
- [ ] **Expense tracking** - Add expense, split costs
- [ ] **Packing list** - Create items, assign, check off

### AI Features (If Enabled)

- [ ] **AI trip generation** - Create trip from wizard
- [ ] **Atlas chat** - Ask questions about trip
- [ ] **Itinerary optimization** - AI suggestions working

### Mobile Experience

- [ ] **Responsive design** - Works on mobile browsers
- [ ] **PWA installation** - Can install as app
- [ ] **Offline mode** - Basic features work offline
- [ ] **Touch interactions** - Swipe, tap gestures working

### Security Testing

- [ ] **SQL injection** - Protected (using parameterized queries)
- [ ] **XSS attacks** - Protected (React escaping + CSP headers)
- [ ] **CSRF** - Protected (SameSite cookies)
- [ ] **Rate limiting** - API rate limits enforced
- [ ] **File upload security** - Only allowed types accepted
- [ ] **Authentication bypass** - Cannot access protected routes

## 🚀 Deployment Commands

### Quick Deploy (Using Script)

```bash
./deploy.sh
```

### Manual Deploy with Docker

```bash
# 1. Set up environment
cp .env.example .env.production
# Edit .env.production with your values

# 2. Run migrations
npm run db:migrate

# 3. Deploy
docker-compose -f docker-compose.prod.yml up -d --build

# 4. Check health
curl http://localhost:3000/api/health
```

### Manual Deploy without Docker

```bash
# 1. Install dependencies
npm ci --omit=dev

# 2. Build
npm run build

# 3. Run migrations
npm run db:migrate

# 4. Start
NODE_ENV=production npm start
```

## 📊 Post-Launch Monitoring

### First Hour

- [ ] Check error logs every 15 minutes
- [ ] Monitor response times
- [ ] Verify health check endpoint
- [ ] Test critical user flows
- [ ] Monitor database connections

### First Day

- [ ] Review error rate in Sentry
- [ ] Check database performance
- [ ] Monitor Redis memory usage (if enabled)
- [ ] Review user feedback/support tickets
- [ ] Test on different browsers/devices

### First Week

- [ ] Analyze user behavior patterns
- [ ] Identify slow API endpoints
- [ ] Review server resource usage
- [ ] Plan optimizations based on real usage
- [ ] Gather user feedback

## 🆘 Emergency Contacts

Document your emergency procedures:

- **On-call engineer**: [Name, Phone, Email]
- **Database admin**: [Hosting provider support]
- **Hosting support**: [Provider contact info]
- **Sentry alerts**: [Configured email/Slack]

## 📚 Additional Resources

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Detailed deployment instructions
- [docs/DEPLOYMENT-GUIDE.md](./docs/DEPLOYMENT-GUIDE.md) - Hosting provider guides
- [docs/EMAIL-CONFIGURATION.md](./docs/EMAIL-CONFIGURATION.md) - Email setup
- [docs/SECURITY.md](./docs/SECURITY.md) - Security best practices

## 🎯 Current Status

You can track your progress by checking off items as you complete them.

**Recommended Launch Order:**

1. Complete all 🔴 Critical items
2. Complete 🟡 Important items (at least Redis, VAPID, and file storage)
3. Run through Pre-Launch Testing Checklist
4. Deploy to staging and test
5. Deploy to production
6. Monitor actively for first 24 hours
