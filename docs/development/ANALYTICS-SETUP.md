# Analytics Setup Guide

TripSync supports two analytics providers:

1. **PostHog** (Recommended) - Better privacy, more features, free tier
2. **Google Analytics** - Simple, widely used

---

## Option 1: PostHog (Recommended) ⭐

### Why PostHog?

- ✅ Privacy-friendly (GDPR compliant)
- ✅ Free tier: 1M events/month
- ✅ Session recording
- ✅ Feature flags
- ✅ A/B testing
- ✅ Better insights (funnels, cohorts, retention)
- ✅ Self-hosted option available

### Setup (5 minutes)

**1. Sign up:**

- Go to https://posthog.com
- Create a free account

**2. Create a project:**

- Click "New Project"
- Name it "TripSync"
- Get your API key (starts with `phc_`)

**3. Configure environment:**

```bash
# Add to .env
VITE_POSTHOG_KEY=phc_your_project_api_key_here
VITE_POSTHOG_HOST=https://app.posthog.com
```

**4. Install PostHog (already in package.json):**

```bash
npm install posthog-js
```

**5. Done!** Analytics will automatically start tracking.

### What Gets Tracked

**Automatic (by PostHog):**

- Page views
- Button clicks
- Form submissions
- Session duration
- User paths

**Custom Events (by TripSync):**

- `sign_up` - User registration
- `sign_in` - User login
- `trip_created` - New trip created
- `itinerary_item_added` - Item added to itinerary
- `ai_generate_trip` - AI itinerary generation
- `expense_added` - Expense tracked
- `member_invited` - Team member invited
- And more...

### PostHog Dashboard

After setup, you'll see:

- **Insights**: User behavior, popular features
- **Funnels**: Where users drop off (signup → trip creation → invite)
- **Retention**: How many users come back
- **Session Recording**: Watch actual user sessions
- **Trends**: Growth over time

---

## Option 2: Google Analytics

### Why Google Analytics?

- ✅ Simple to set up
- ✅ Free forever
- ✅ Familiar interface
- ✅ Integrates with Google Ads

### Setup (3 minutes)

**1. Create property:**

- Go to https://analytics.google.com
- Click "Admin" → "Create Property"
- Choose "Web"
- Get your Measurement ID (starts with `G-`)

**2. Configure environment:**

```bash
# Add to .env
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
```

**3. Done!** No npm install needed.

### What Gets Tracked

**Automatic:**

- Page views
- User sessions
- Traffic sources
- Device types
- Geographic location

**Custom Events (by TripSync):**

- Same events as PostHog
- Tracked as GA4 events

---

## Testing Analytics

### Development Mode

By default, analytics is **disabled in development** to avoid polluting production data.

To test analytics in development:

**PostHog:**

```typescript
// In your browser console:
posthog.opt_in_capturing();
```

**Google Analytics:**

- Analytics runs in development automatically
- Use GA Debugger Chrome extension to verify

### Verify It's Working

**1. Trigger an event:**

```bash
# Open your app
# Sign up or log in
# Create a trip
```

**2. Check your dashboard:**

**PostHog:**

- Go to https://app.posthog.com
- Click "Events" → "Live Events"
- Should see events appearing in real-time

**Google Analytics:**

- Go to https://analytics.google.com
- Click "Realtime"
- Should see active users

---

## Success Metrics to Track

### Key Performance Indicators (KPIs)

**Acquisition:**

- Sign-ups per day
- Traffic sources
- Conversion rate (visitor → signup)

**Activation:**

- % of users who create first trip
- Time to first trip
- % who invite team members

**Engagement:**

- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- DAU/MAU ratio (stickiness)
- Trips created per user
- AI generations used

**Retention:**

- Day 1 retention
- Day 7 retention
- Day 30 retention

**Revenue** (if Stripe enabled):

- Free → Pro conversion rate
- Monthly Recurring Revenue (MRR)
- Churn rate

### Recommended Dashboards

**Dashboard 1: Acquisition**

- Traffic sources (organic, direct, referral)
- Sign-up funnel (landing → signup → first trip)
- Top landing pages

**Dashboard 2: Engagement**

- DAU/MAU trend
- Feature usage (AI, expenses, voting)
- Most active trips
- Average trip size (members)

**Dashboard 3: Retention**

- Cohort retention chart
- Churn reasons
- Power users (>5 trips)

---

## Privacy Considerations

### GDPR Compliance

Both PostHog and GA are GDPR compliant when configured correctly.

**Best Practices:**

1. ✅ Cookie consent banner (already implemented)
2. ✅ Privacy policy (already implemented)
3. ✅ Allow users to opt-out
4. ✅ Don't track sensitive data (passwords, private messages)
5. ✅ Anonymize IP addresses

**PostHog Privacy Settings:**

```typescript
// Already configured in analytics.ts
posthog.init(key, {
  autocapture: true,
  capture_pageview: true,
  disable_session_recording: import.meta.env.DEV,
});
```

**Google Analytics Privacy Settings:**

```bash
# Add to GA4 settings:
- Enable IP Anonymization
- Disable Google Signals (for GDPR)
- Enable "Data Deletion Requests"
```

---

## Using Analytics in Code

### Track Custom Events

```typescript
import { trackEvent } from '@/lib/analytics';

// In your component:
const handleCreateTrip = async () => {
  const trip = await createTrip(data);

  // Track the event
  trackEvent.tripCreated(trip.id, trip.destination);
};
```

### Available Tracking Functions

```typescript
// User events
trackEvent.signUp('email');
trackEvent.signIn('google');
trackEvent.signOut();

// Trip events
trackEvent.tripCreated(tripId, destination);
trackEvent.tripDeleted(tripId);
trackEvent.tripShared(tripId, 'email');

// Itinerary events
trackEvent.itemAdded(tripId, 'activity');
trackEvent.itemVoted(tripId, itemId, 'up');

// AI events
trackEvent.aiGenerateTrip(tripId, 7);
trackEvent.aiChatMessage(tripId);

// Expense events
trackEvent.expenseAdded(tripId, 100, 'USD');
trackEvent.expenseSettled(tripId, expenseId);

// Feature usage
trackEvent.featureUsed('packing-list');

// Errors
trackEvent.error('api_error', message);
```

### Track Page Views

```typescript
import { useAnalytics } from '@/lib/analytics';

// In a component:
const { page } = useAnalytics();

useEffect(() => {
  page('Trip Detail', { trip_id: tripId });
}, [tripId]);
```

### Identify Users

```typescript
import { analytics } from '@/lib/analytics';

// After login:
analytics.identify(user.id, {
  email: user.email,
  username: user.username,
  subscription_tier: user.subscriptionTier,
});
```

---

## Troubleshooting

### Analytics Not Working

**Check 1: Environment variables set?**

```bash
echo $VITE_POSTHOG_KEY
# or
echo $VITE_GA_TRACKING_ID
```

**Check 2: PostHog installed?**

```bash
npm list posthog-js
```

**Check 3: Console errors?**

```bash
# Open browser console (F12)
# Look for analytics errors
```

**Check 4: Opted out in dev?**

```typescript
// In browser console:
posthog.has_opted_out_capturing();
// If true: posthog.opt_in_capturing()
```

### Events Not Showing Up

**PostHog:**

- Check "Events" → "Live Events" (real-time)
- Wait 5 minutes for dashboard to update
- Verify API key is correct

**Google Analytics:**

- Check "Realtime" view
- Wait 24 hours for historical data
- Verify Measurement ID is correct

### Ad Blockers

Some users have ad blockers that block analytics.

**PostHog:**

- Use reverse proxy to your domain
- Or accept that some users won't be tracked

**Google Analytics:**

- ~30% of users block GA
- Consider this in your numbers

---

## Costs

### PostHog

**Free Tier:**

- 1M events/month
- 5,000 session recordings/month
- Unlimited team members
- Data retention: 7 years

**Paid:**

- $0.00031/event after 1M
- Estimated: $20-50/month for most apps

### Google Analytics

**Free:**

- Completely free
- No limits on events
- No limits on users

---

## Next Steps

1. ✅ Choose provider (PostHog or GA)
2. ✅ Add credentials to .env
3. ✅ Install PostHog if needed: `npm install posthog-js`
4. ✅ Test with a sign-up or trip creation
5. ✅ Set up dashboards in provider
6. ✅ Monitor daily for first week

---

## Recommended: Start with PostHog

**Why:**

- Better for product analytics
- More insights out of the box
- Session recordings are invaluable
- Free tier is generous

**You can always add GA later** for:

- Google Ads integration
- Comparing with PostHog data
- Stakeholder familiarity

---

## Support

**PostHog:**

- Docs: https://posthog.com/docs
- Community: https://posthog.com/community

**Google Analytics:**

- Docs: https://support.google.com/analytics

**TripSync Analytics Code:**

- See: `client/src/lib/analytics.ts`
- Questions: abdulmuheethmd29@gmail.com
