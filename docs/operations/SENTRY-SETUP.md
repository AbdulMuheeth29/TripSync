# Sentry Error Tracking Setup Guide

Sentry provides real-time error tracking and performance monitoring for TripSync, helping you catch and fix issues before users report them.

## Why Sentry?

**Without Sentry:**

- ❌ Errors only visible in logs
- ❌ No proactive error detection
- ❌ Limited debugging context
- ❌ No performance monitoring
- ❌ Manual log searching

**With Sentry:**

- ✅ Real-time error alerts
- ✅ Full stack traces with context
- ✅ Performance monitoring
- ✅ Release tracking
- ✅ User impact analysis
- ✅ Error grouping and trends
- ✅ Integration with Slack/email

## Quick Setup (5 minutes)

### Step 1: Create Sentry Account

1. Go to [sentry.io/signup](https://sentry.io/signup/)
2. Sign up (free account includes 5,000 errors/month)
3. Choose "Create a new organization"

### Step 2: Create Project

1. Click **"Create Project"**
2. Platform: Select **"Node.js"** or **"Express"**
3. Alert frequency: **"Alert me on every new issue"**
4. Project name: `tripsync-production`
5. Click **"Create Project"**

### Step 3: Get DSN

After creating the project, you'll see:

```javascript
Sentry.init({
  dsn: 'https://abc123...@o123456.ingest.sentry.io/1234567',
});
```

Copy the DSN URL (the part after `dsn:`).

### Step 4: Add to Environment Variables

Add to `.env.production`:

```bash
SENTRY_DSN=https://abc123...@o123456.ingest.sentry.io/1234567
```

That's it! Sentry is now configured.

---

## What Sentry Captures

### 1. Server Errors

- Unhandled exceptions
- Database errors
- API failures
- Authentication issues
- File upload errors

### 2. Performance Monitoring

- API endpoint response times
- Database query performance
- External API calls (Stripe, Anthropic)
- PostgreSQL operations

### 3. User Context

When errors occur, Sentry includes:

- User ID and email
- Request path and method
- Request headers (filtered for security)
- Stack trace
- Server environment

### 4. Security Filtering

Sensitive data is **automatically filtered**:

- Passwords
- JWT tokens
- API keys
- Credit card numbers
- Authorization headers

See `server/sentry.ts:43-66` for filtering logic.

---

## Configuration (Already Done)

TripSync includes production-ready Sentry configuration:

```typescript
// server/sentry.ts
Sentry.init({
  dsn: sentryDsn,
  environment: 'production',

  // Performance monitoring (10% of requests in prod)
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1,

  // Automatic integrations
  integrations: [
    httpIntegration(),
    expressIntegration(),
    nodeProfilingIntegration(),
    postgresIntegration(),
  ],

  // Security: filter sensitive data
  beforeSend: (event) => {
    // Remove auth headers, passwords, tokens
    return event;
  },

  // Ignore expected errors
  ignoreErrors: ['AUTH_REQUIRED', 'INVALID_CREDENTIALS', 'NetworkError'],
});
```

---

## Testing Sentry

### Test Configuration

```bash
npm run test:services
```

### Trigger Test Error

```bash
curl http://localhost:3000/api/test-error
```

Or in your app code temporarily:

```javascript
throw new Error('Test error for Sentry');
```

Check Sentry dashboard - you should see the error within seconds!

---

## Sentry Dashboard

### Issues View

- **Real-time errors** - See errors as they happen
- **Frequency** - How often each error occurs
- **Impact** - How many users affected
- **First/Last seen** - Track when issues started
- **Stack trace** - Full debugging context

### Performance View

- **Transaction list** - API endpoint performance
- **Slow queries** - Database bottlenecks
- **External calls** - Third-party API latency
- **Trends** - Performance over time

### Releases

- Track which version introduced bugs
- Compare error rates between releases
- Deploy notifications

---

## Alert Configuration

### Email Alerts (Default)

Sentry sends email for:

- New issues
- Issue reopened
- Spike in error rate

### Slack Integration (Recommended)

1. Sentry → **Settings** → **Integrations**
2. Find **Slack** → **Install**
3. Authorize with your workspace
4. Configure alert rules:
   - New issues → Post to #engineering
   - Critical errors → Post to #alerts

### Alert Rules

Create custom rules:

1. **Project Settings** → **Alerts** → **Create Alert Rule**
2. Examples:
   - Alert when error rate >10/min
   - Alert when 500 error occurs
   - Alert when performance degrades >20%

---

## Best Practices

### 1. Add Context to Errors

```typescript
import { captureException } from './server/sentry';

try {
  await riskyOperation();
} catch (error) {
  captureException(error, {
    userId: user.id,
    tripId: trip.id,
    operation: 'createItineraryItem',
  });
}
```

### 2. Add Breadcrumbs

```typescript
import { addBreadcrumb } from './server/sentry';

addBreadcrumb('Starting payment processing', 'payment', {
  amount: 99.99,
  currency: 'USD',
});
```

### 3. Set User Context

```typescript
import { setUserContext } from './server/sentry';

// After user logs in
setUserContext(user.id, user.email, user.username);

// After user logs out
clearUserContext();
```

### 4. Performance Monitoring

```typescript
import { Sentry } from './server/sentry';

const transaction = Sentry.startTransaction({
  op: 'function',
  name: 'generateAIItinerary',
});

try {
  // ... your code
} finally {
  transaction.finish();
}
```

---

## Pricing

### Free Tier (Recommended to Start)

- 5,000 errors/month
- 10,000 performance units/month
- 30-day error retention
- **Perfect for launching**

### Developer Plan ($29/month)

- 50,000 errors/month
- 100,000 performance units/month
- 90-day retention

### Team Plan ($80/month)

- 100,000 errors/month
- 100,000 performance units/month
- Unlimited team members

### What Counts as an "Error"?

- Unique stack trace = 1 error
- Same error 1000x = still 1 error (until resolved)
- Most apps use <500 errors/month

---

## Monitoring in Production

### Daily Health Check

1. Check Sentry dashboard
2. Review new issues
3. Check error trends
4. Monitor performance metrics

### Weekly Review

1. Top 10 errors by frequency
2. Top 10 errors by user impact
3. Performance bottlenecks
4. Release comparison

### Monthly Analysis

1. Error rate trends
2. Most affected users
3. Browser/device breakdown
4. Deploy correlation

---

## Troubleshooting

### No Events Appearing

**Check:**

1. DSN is correct in `.env.production`
2. App is running in production mode: `NODE_ENV=production`
3. No firewall blocking sentry.io
4. Test with: `curl https://sentry.io`

**Debug:**

```typescript
// Enable Sentry debug logging
Sentry.init({
  dsn: sentryDsn,
  debug: true, // Add this
});
```

### Too Many Events

**Solution 1: Adjust sample rate**

```typescript
tracesSampleRate: 0.01, // 1% instead of 10%
```

**Solution 2: Ignore noisy errors**

```typescript
ignoreErrors: [
  'AUTH_REQUIRED',
  'INVALID_TOKEN',
  // Add more...
],
```

**Solution 3: Rate limiting**

```typescript
beforeSend(event) {
  // Implement custom rate limiting
  return Math.random() < 0.5 ? event : null;
}
```

### Sensitive Data Leaking

**Check:**

1. Review `beforeSend` in `server/sentry.ts`
2. Add more patterns to filter
3. Test with sample error

**Never Log:**

- Passwords
- Credit cards
- Social Security Numbers
- API keys
- JWT tokens

---

## Integration with Development Workflow

### Link Commits to Issues

1. Install Sentry GitHub integration
2. Include Sentry issue ID in commit:

```bash
git commit -m "Fix payment error (Fixes TRIPSYNC-123)"
```

### Release Tracking

```bash
# During deployment
export SENTRY_RELEASE=$(git rev-parse HEAD)
sentry-cli releases new $SENTRY_RELEASE
sentry-cli releases deploys $SENTRY_RELEASE new -e production
```

### Source Maps (Future Enhancement)

For better stack traces, upload source maps:

```bash
npm install @sentry/webpack-plugin
```

---

## Example: Catching Critical Errors

### Database Errors

```typescript
try {
  await db.insert(trips).values(tripData);
} catch (error) {
  captureException(error, {
    context: 'trip_creation',
    userId: user.id,
    tripData: {
      ...tripData,
      // Don't include sensitive data
    },
  });
  throw error;
}
```

### API Errors

```typescript
try {
  const response = await stripe.charges.create(...);
} catch (error) {
  captureException(error, {
    context: 'stripe_charge',
    userId: user.id,
    amount: charge.amount,
  });
  // Handle error gracefully
}
```

### AI Errors

```typescript
try {
  const itinerary = await anthropic.messages.create(...);
} catch (error) {
  captureException(error, {
    context: 'ai_generation',
    tripId: trip.id,
    prompt: prompt.substring(0, 100), // First 100 chars only
  });
  // Fallback to non-AI flow
}
```

---

## Production Monitoring Checklist

- [ ] Sentry account created
- [ ] DSN added to `.env.production`
- [ ] Test error triggered and visible
- [ ] Email alerts configured
- [ ] Slack integration set up (optional)
- [ ] Team members invited
- [ ] Alert rules customized
- [ ] Performance monitoring enabled
- [ ] Sensitive data filtering verified

---

## Cost Optimization

1. **Adjust sample rates** - Don't need 100% coverage
2. **Filter noisy errors** - Ignore expected errors
3. **Group similar errors** - Use fingerprinting
4. **Delete old issues** - Clean up resolved errors
5. **Monitor quota** - Set up billing alerts

---

## Alternatives (Not Recommended)

| Service        | Pros                     | Cons                 |
| -------------- | ------------------------ | -------------------- |
| **Sentry** ⭐  | Best features, free tier | -                    |
| Rollbar        | Good UI                  | Expensive            |
| Bugsnag        | Simple                   | Limited free tier    |
| LogRocket      | Session replay           | Very expensive       |
| Custom logging | Free                     | No real-time, manual |

---

## Next Steps

1. Create Sentry account at [sentry.io](https://sentry.io)
2. Create project and copy DSN
3. Add `SENTRY_DSN` to `.env.production`
4. Test with: `npm run test:services`
5. Deploy and monitor errors in real-time

**Sentry is optional but highly recommended for production deployments.**
