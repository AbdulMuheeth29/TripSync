# Subscription & Payment Flows

Complete end-to-end flows for subscription management, payment processing, and tier upgrades in TripSync.

---

## Subscription Tiers Overview

| Tier | Price | Trips | Members/Trip | AI Generations | Storage |
|------|-------|-------|--------------|----------------|---------|
| **Free** | $0/forever | 3 active | 6 | 1/trip | 5 photos/trip |
| **Pro** | $4.99/mo | Unlimited | Unlimited | Unlimited | Unlimited |
| **Teams** | $9.99/mo | Unlimited | Unlimited | Unlimited | Unlimited + branding |

---

## Flow 1: View Pricing Page

```
┌─────────────────────────────────────────────────────────────────────┐
│                       VIEW PRICING PAGE FLOW                         │
└─────────────────────────────────────────────────────────────────────┘

User navigates to /pricing
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Choose Your Plan                                                    │
│  ══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐          │
│  │     FREE      │  │      PRO      │  │     TEAMS     │          │
│  │               │  │               │  │               │          │
│  │    $0/mo      │  │   $4.99/mo    │  │   $9.99/mo    │          │
│  │               │  │               │  │               │          │
│  │  Perfect for  │  │  Best Value   │  │  For Groups   │          │
│  │  trying out   │  │  🌟 POPULAR   │  │  & Companies  │          │
│  │               │  │               │  │               │          │
│  ├───────────────┤  ├───────────────┤  ├───────────────┤          │
│  │               │  │               │  │               │          │
│  │ ✓ 3 trips     │  │ ✓ Unlimited   │  │ ✓ Everything  │          │
│  │ ✓ 6 members/  │  │   trips       │  │   in Pro      │          │
│  │   trip        │  │ ✓ Unlimited   │  │ ✓ Custom      │          │
│  │ ✓ 1 AI gen/   │  │   members     │  │   branding    │          │
│  │   trip        │  │ ✓ Unlimited   │  │ ✓ Analytics   │          │
│  │ ✓ Voting      │  │   AI          │  │ ✓ Admin       │          │
│  │ ✓ Chat        │  │ ✓ Map view    │  │   controls    │          │
│  │ ✓ Expenses    │  │ ✓ Offline PWA │  │ ✓ API access  │          │
│  │ ✓ 5 photos/   │  │ ✓ Receipt OCR │  │ ✓ Priority    │          │
│  │   trip        │  │ ✓ Currency    │  │   support     │          │
│  │               │  │   conversion  │  │ ✓ SLA         │          │
│  │               │  │ ✓ Calendar    │  │                │          │
│  │               │  │   export      │  │                │          │
│  │               │  │               │  │                │          │
│  │ [Current]     │  │ [Upgrade →]   │  │ [Contact]     │          │
│  └───────────────┘  └───────────────┘  └───────────────┘          │
│                                                                       │
│  💡 All plans include Atlas AI assistant and unlimited expenses      │
│                                                                       │
│  ──────────────────────────────────────────────────────────────────  │
│  FREQUENTLY ASKED QUESTIONS                                          │
│  ──────────────────────────────────────────────────────────────────  │
│                                                                       │
│  Q: Can I try Pro before paying?                                     │
│  A: Yes! 14-day free trial, no credit card required.                │
│                                                                       │
│  Q: Can I cancel anytime?                                            │
│  A: Absolutely. Cancel anytime, no questions asked.                  │
│                                                                       │
│  Q: What happens to my data if I downgrade?                          │
│  A: All your data stays safe. You just can't create new trips       │
│     until under the Free tier limit (3 trips).                       │
│                                                                       │
│  Q: Do you offer refunds?                                            │
│  A: Yes, full refund within 30 days if not satisfied.               │
│                                                                       │
│  [View Full FAQ →]                                                   │
└──────────────────────────────────────────────────────────────────────┘

END: User understands pricing options
```

---

## Flow 2: Upgrade to Pro (Free Trial)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    UPGRADE TO PRO FLOW (FREE TRIAL)                  │
└─────────────────────────────────────────────────────────────────────┘

TRIGGER: User hits Free tier limit
─────────────────────────────────────

User tries to create 4th trip
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  🔒 Free Tier Limit Reached                                          │
│  ══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  You've reached your Free plan limit (3 trips).                      │
│                                                                       │
│  Your active trips:                                                  │
│  1. Bali Adventure (6 members)                                       │
│  2. Tokyo Weekend (4 members)                                        │
│  3. Paris Honeymoon (2 members)                                      │
│                                                                       │
│  To create more trips, either:                                       │
│  • Archive a completed trip                                          │
│  • Upgrade to Pro for unlimited trips                                │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  🌟 UPGRADE TO PRO                                              │ │
│  │                                                                 │ │
│  │  Get unlimited everything:                                      │ │
│  │  ✓ Unlimited trips                                              │ │
│  │  ✓ Unlimited members per trip                                  │ │
│  │  ✓ Unlimited AI generations                                    │ │
│  │  ✓ Map view, offline access, receipt OCR                       │ │
│  │                                                                 │ │
│  │  💰 Just $4.99/month                                            │ │
│  │  🎁 14-day FREE trial - No credit card required!               │ │
│  │                                                                 │ │
│  │  [🚀 Start Free Trial →]                                        │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  [Archive a Trip] [Maybe Later]                                      │
└──────────────────────────────────────────────────────────────────────┘
    ↓
User clicks "Start Free Trial"
    ↓
Check if eligible for trial:
    ├─ Never had Pro before → Eligible ✓
    ├─ Previously had Pro → Not eligible for trial
    └─ Currently on trial → Already in trial
    ↓
ELIGIBLE FOR TRIAL:
───────────────────
┌──────────────────────────────────────────────────────────────────────┐
│  Start Your Pro Trial                                                │
│  ══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  ✨ 14-Day Free Trial                                                │
│                                                                       │
│  No payment needed now. We'll send a reminder 2 days before your    │
│  trial ends. Cancel anytime with one click.                          │
│                                                                       │
│  Email:                                                              │
│  [alex@example.com                                       ] ✓         │
│                                                                       │
│  ☑ I agree to the Terms of Service and Privacy Policy               │
│                                                                       │
│  Trial starts: Today (June 16, 2024)                                │
│  Trial ends: June 30, 2024                                           │
│  First payment: July 1, 2024 ($4.99)                                │
│                                                                       │
│  [Cancel]                          [Start Trial →]                   │
└──────────────────────────────────────────────────────────────────────┘
    ↓
User clicks "Start Trial"
    ↓
POST /api/subscription/start-trial
Body: { plan: "pro", email: "alex@example.com" }
    ↓
Backend processing:
    ├─ Create trial subscription record
    ├─ Set trial_end_date = today + 14 days
    ├─ Upgrade user tier to "pro"
    ├─ Schedule trial ending reminder (day 12)
    └─ Log analytics event
    ↓
✅ Trial started
    ↓
Success modal:
┌──────────────────────────────────────────────────────────────────────┐
│  🎉 Welcome to Pro!                                                  │
│  ══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  Your 14-day free trial has started!                                │
│                                                                       │
│  You now have:                                                       │
│  ✅ Unlimited trips                                                  │
│  ✅ Unlimited members                                                │
│  ✅ Unlimited AI generations                                         │
│  ✅ All Pro features unlocked                                        │
│                                                                       │
│  Trial ends: June 30, 2024                                          │
│  We'll remind you on June 28.                                        │
│                                                                       │
│  [🎯 Create Your 4th Trip →] [Explore Pro Features]                 │
└──────────────────────────────────────────────────────────────────────┘
    ↓
User can immediately use Pro features
    ↓
Confirmation email sent:
┌──────────────────────────────────────────────────────────────────────┐
│  Subject: Your Pro Trial Has Started! 🎉                            │
│  ────────────────────────────────────────────────────────────────   │
│                                                                       │
│  Hi Alex,                                                            │
│                                                                       │
│  Welcome to TripSync Pro! Your 14-day free trial started today.     │
│                                                                       │
│  What you can do now:                                                │
│  • Create unlimited trips (no more 3-trip limit!)                   │
│  • Invite unlimited members                                         │
│  • Generate unlimited AI itineraries                                │
│  • Access map view, offline mode, receipt OCR, and more             │
│                                                                       │
│  Your trial ends on June 30, 2024.                                  │
│  We'll send you a reminder on June 28.                              │
│                                                                       │
│  To add a payment method (so your Pro continues after trial):       │
│  [Add Payment Method →]                                              │
│                                                                       │
│  To cancel your trial:                                              │
│  [Cancel Trial] (cancel anytime, no charges)                        │
│                                                                       │
│  Questions? Reply to this email or visit our Help Center.           │
│                                                                       │
│  Happy planning!                                                     │
│  The TripSync Team                                                   │
└──────────────────────────────────────────────────────────────────────┘

TRIAL ENDING REMINDER (Day 12):
────────────────────────────────
Email sent 2 days before trial ends:
┌──────────────────────────────────────────────────────────────────────┐
│  Subject: Your Pro Trial Ends in 2 Days                             │
│  ────────────────────────────────────────────────────────────────   │
│                                                                       │
│  Hi Alex,                                                            │
│                                                                       │
│  Just a friendly reminder: your Pro trial ends on June 30.          │
│                                                                       │
│  You've created 8 trips and generated 15 AI itineraries during      │
│  your trial. Amazing! 🎉                                             │
│                                                                       │
│  To keep your Pro benefits:                                          │
│  1. Add a payment method before June 30                             │
│  2. You'll be charged $4.99/month starting July 1                   │
│  3. Cancel anytime if you change your mind                          │
│                                                                       │
│  [Add Payment Method & Continue Pro →]                               │
│                                                                       │
│  Don't want to continue?                                             │
│  You'll automatically revert to the Free plan (3 trips, 6 members). │
│  All your existing trips stay safe!                                  │
│                                                                       │
│  [Let Trial End - Stay on Free Plan]                                │
│                                                                       │
│  Questions? We're here to help!                                      │
└──────────────────────────────────────────────────────────────────────┘

END: User on Pro trial, can add payment before trial ends
```

---

## Flow 3: Add Payment Method & Subscribe

```
┌─────────────────────────────────────────────────────────────────────┐
│                   ADD PAYMENT METHOD & SUBSCRIBE                     │
└─────────────────────────────────────────────────────────────────────┘

User clicks "Add Payment Method" from trial reminder or settings
    ↓
Redirects to /dashboard/billing
    ↓
POST /api/stripe/checkout
Body: { plan: "pro", successUrl: "/dashboard", cancelUrl: "/pricing" }
    ↓
Backend creates Stripe Checkout Session:
    ├─ Plan: Pro ($4.99/month)
    ├─ Trial: Already used
    ├─ First charge: Immediate
    └─ Billing cycle: Monthly
    ↓
Redirect to Stripe Checkout:
┌──────────────────────────────────────────────────────────────────────┐
│  🔒 Secure Checkout - Powered by Stripe                             │
│  ══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  TripSync Pro Subscription                                           │
│  $4.99 / month                                                       │
│                                                                       │
│  ──────────────────────────────────────────────────────────────────  │
│  Email                                                               │
│  [alex@example.com                                       ]           │
│                                                                       │
│  Card Information                                                    │
│  [1234 5678 9012 3456                                    ]           │
│  [MM / YY]  [CVC]                                                    │
│  [12 / 26]  [123]                                                    │
│                                                                       │
│  Billing Address                                                     │
│  [United States ▼]                                                   │
│  [12345    ] ZIP                                                     │
│                                                                       │
│  ──────────────────────────────────────────────────────────────────  │
│  Summary                                                             │
│  Pro plan                                        $4.99/month         │
│  Billed monthly                                                      │
│  Next payment: July 1, 2024                                          │
│                                                                       │
│  Total due today: $4.99                                              │
│  ──────────────────────────────────────────────────────────────────  │
│                                                                       │
│  By confirming, you authorize TripSync to charge your payment       │
│  method $4.99/month until you cancel.                                │
│                                                                       │
│  [← Back]                          [Subscribe $4.99/mo →]            │
└──────────────────────────────────────────────────────────────────────┘
    ↓
User enters payment details and clicks "Subscribe"
    ↓
Stripe processes payment (2-5 seconds):
    ┌────────────────────────────────────────────────────────────────┐
    │  Processing payment...                                          │
    │  Please don't close this page                                   │
    └────────────────────────────────────────────────────────────────┘
    ↓
SUCCESS SCENARIO:
─────────────────
Payment successful
    ↓
Stripe webhook: checkout.session.completed
    ↓
POST /api/stripe/webhook
    ↓
Backend processing:
    ├─ Verify webhook signature
    ├─ Create subscription record
    ├─ Upgrade user tier to "pro"
    ├─ Store payment method
    ├─ Set next_billing_date = today + 30 days
    └─ Send confirmation email
    ↓
Redirect to success URL: /dashboard?payment=success
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  🎉 Payment Successful!                                              │
│  ══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  Welcome to TripSync Pro!                                            │
│                                                                       │
│  Your subscription is now active.                                    │
│                                                                       │
│  Plan: Pro                                                           │
│  Price: $4.99/month                                                  │
│  Next billing date: July 1, 2024                                    │
│                                                                       │
│  Receipt: #INV-2024-06-001                                          │
│  Payment method: •••• 3456                                           │
│                                                                       │
│  You now have access to:                                             │
│  ✅ Unlimited trips                                                  │
│  ✅ Unlimited members                                                │
│  ✅ Unlimited AI generations                                         │
│  ✅ Map view, offline mode, receipt OCR                              │
│  ✅ All Pro features                                                 │
│                                                                       │
│  [View Receipt] [Manage Subscription] [Start Planning →]            │
└──────────────────────────────────────────────────────────────────────┘
    ↓
Confirmation email sent:
"Your TripSync Pro subscription is active! Receipt attached."

FAILURE SCENARIO:
─────────────────
Payment failed (card declined, etc.)
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  ❌ Payment Failed                                                    │
│  ══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  We couldn't process your payment.                                   │
│                                                                       │
│  Reason: Card declined (insufficient funds)                          │
│                                                                       │
│  Please try:                                                         │
│  • Using a different card                                            │
│  • Contacting your bank                                              │
│  • Checking your card details are correct                            │
│                                                                       │
│  Your Pro trial is still active until June 30.                      │
│  You can try again anytime before then.                              │
│                                                                       │
│  [Try Different Card] [Contact Support] [Back to Dashboard]          │
└──────────────────────────────────────────────────────────────────────┘

END: User subscribed to Pro or encounters payment error
```

---

## Flow 4: Manage Subscription

```
┌─────────────────────────────────────────────────────────────────────┐
│                     MANAGE SUBSCRIPTION FLOW                         │
└─────────────────────────────────────────────────────────────────────┘

User navigates to /dashboard/billing
    ↓
GET /api/subscription/status
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Billing & Subscription                                              │
│  ══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  CURRENT PLAN                                                        │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  🌟 Pro Plan                                                    │ │
│  │  $4.99 / month                                                  │ │
│  │                                                                 │ │
│  │  Next billing: July 1, 2024                                    │ │
│  │  Payment method: Visa •••• 3456                                │ │
│  │                                                                 │ │
│  │  [Update Payment Method] [Cancel Subscription]                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  USAGE THIS MONTH                                                    │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  • Trips created: 8 (unlimited ✓)                              │ │
│  │  • AI generations: 15 (unlimited ✓)                            │ │
│  │  • Members invited: 42 (unlimited ✓)                           │ │
│  │  • Photos uploaded: 156 (unlimited ✓)                          │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  UPGRADE OPTIONS                                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  🏢 Teams Plan - $9.99/month                                   │ │
│  │  Everything in Pro plus:                                        │ │
│  │  • Custom branding                                              │ │
│  │  • Analytics dashboard                                          │ │
│  │  • Admin controls                                               │ │
│  │  • API access                                                   │ │
│  │  • Priority support                                             │ │
│  │                                                                 │ │
│  │  [Upgrade to Teams →]                                           │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  BILLING HISTORY                                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  June 16, 2024  Pro Subscription   $4.99  Paid  [Receipt]     │ │
│  │  May 16, 2024   Pro Subscription   $4.99  Paid  [Receipt]     │ │
│  │  Apr 16, 2024   Pro Subscription   $4.99  Paid  [Receipt]     │ │
│  │                                                                 │ │
│  │  [View All Invoices →]                                          │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘

User actions available:
    ├─ Update payment method
    ├─ Cancel subscription
    ├─ Upgrade to Teams
    ├─ View invoices
    └─ Download receipts

END: Subscription management dashboard
```

---

## Flow 5: Cancel Subscription

```
┌─────────────────────────────────────────────────────────────────────┐
│                      CANCEL SUBSCRIPTION FLOW                        │
└─────────────────────────────────────────────────────────────────────┘

User on billing page → Clicks "Cancel Subscription"
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Cancel Pro Subscription?                                            │
│  ══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  We're sorry to see you go! 😢                                       │
│                                                                       │
│  Before you cancel, please know:                                     │
│                                                                       │
│  📅 You'll keep Pro access until July 1, 2024                        │
│     (the end of your current billing period)                         │
│                                                                       │
│  ⏬ After July 1, you'll be downgraded to Free:                      │
│     • 3 active trips (you currently have 8)                         │
│     • 6 members per trip                                            │
│     • 1 AI generation per trip                                      │
│     • 5 photos per trip                                             │
│                                                                       │
│  💾 Don't worry! Your data stays safe:                               │
│     • All trips preserved (read-only if >3)                         │
│     • All members stay in trips                                     │
│     • All expenses saved                                            │
│     • All photos accessible                                         │
│                                                                       │
│  ──────────────────────────────────────────────────────────────────  │
│  Before you go, can we help? (Optional)                              │
│  ──────────────────────────────────────────────────────────────────  │
│                                                                       │
│  Why are you canceling?                                              │
│  ○ Too expensive                                                     │
│  ○ Not using it enough                                               │
│  ○ Missing features I need                                           │
│  ○ Found a better alternative                                        │
│  ○ Just trying it out                                                │
│  ○ Other: [                                        ]                 │
│                                                                       │
│  ☐ I'd consider staying for a discount (we might offer one!)        │
│                                                                       │
│  [Keep My Subscription]            [Proceed with Cancellation]       │
└──────────────────────────────────────────────────────────────────────┘
    ↓
SCENARIO A: User selects "Too expensive" + discount checkbox
─────────────────────────────────────────────────────────────

Special offer appears:
┌──────────────────────────────────────────────────────────────────────┐
│  🎁 Special Offer Just For You!                                      │
│  ══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  We'd love to keep you as a Pro member.                              │
│                                                                       │
│  How about 3 months at 50% off?                                      │
│  • Regular price: $4.99/month                                        │
│  • Your price: $2.49/month (for 3 months)                           │
│  • Total savings: $7.50                                              │
│                                                                       │
│  After 3 months, you can:                                            │
│  • Continue at regular price ($4.99/mo)                             │
│  • Cancel anytime                                                    │
│  • Downgrade to Free                                                 │
│                                                                       │
│  [Accept Offer & Stay] [No Thanks, Cancel Anyway]                    │
└──────────────────────────────────────────────────────────────────────┘
    ↓
If user accepts: Apply discount, keep subscription
If user declines: Continue with cancellation

SCENARIO B: User proceeds with cancellation
────────────────────────────────────────────

POST /api/subscription/cancel
Body: {
  reason: "not_using_enough",
  immediateCancel: false
}
    ↓
Backend processing:
    ├─ Cancel Stripe subscription (at period end)
    ├─ Set cancels_at = end_of_billing_period
    ├─ Keep subscription active until then
    ├─ Schedule downgrade job for July 1
    └─ Send confirmation email
    ↓
✅ Cancellation scheduled
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Subscription Cancelled                                              │
│  ══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  Your Pro subscription has been cancelled.                           │
│                                                                       │
│  You'll continue to have Pro access until:                           │
│  📅 July 1, 2024                                                     │
│                                                                       │
│  After that, you'll be on the Free plan:                             │
│  • 3 active trips                                                    │
│  • 6 members per trip                                                │
│  • 1 AI generation per trip                                          │
│                                                                       │
│  Your current 8 trips will stay safe but 5 will be read-only       │
│  until you archive them or resubscribe.                              │
│                                                                       │
│  Changed your mind?                                                  │
│  You can reactivate your subscription anytime before July 1.        │
│                                                                       │
│  [Reactivate Subscription] [Back to Dashboard]                       │
└──────────────────────────────────────────────────────────────────────┘
    ↓
Confirmation email sent:
┌──────────────────────────────────────────────────────────────────────┐
│  Subject: Your Pro subscription will end on July 1                   │
│  ────────────────────────────────────────────────────────────────   │
│                                                                       │
│  Hi Alex,                                                            │
│                                                                       │
│  We've processed your cancellation request.                          │
│                                                                       │
│  Your Pro benefits will remain active until July 1, 2024.           │
│  After that, you'll be downgraded to the Free plan.                 │
│                                                                       │
│  What happens on July 1:                                             │
│  • No more charges to your card                                      │
│  • Trip limit: 3 active trips                                        │
│  • Member limit: 6 per trip                                          │
│  • All your data stays safe                                          │
│                                                                       │
│  Changed your mind? Reactivate anytime:                              │
│  [Reactivate Subscription →]                                         │
│                                                                       │
│  Thank you for using TripSync!                                       │
│  We'd love to have you back anytime.                                 │
└──────────────────────────────────────────────────────────────────────┘

ON JULY 1 (Downgrade Day):
───────────────────────────

Automated job runs:
    ↓
For user with cancelled subscription:
    ├─ Downgrade tier from "pro" to "free"
    ├─ Mark trips >3 as "read_only"
    ├─ Send downgrade notification
    └─ Log analytics event
    ↓
Email sent:
┌──────────────────────────────────────────────────────────────────────┐
│  Subject: You've been moved to the Free plan                         │
│  ────────────────────────────────────────────────────────────────   │
│                                                                       │
│  Hi Alex,                                                            │
│                                                                       │
│  As of today, you're on the Free plan.                               │
│                                                                       │
│  What changed:                                                        │
│  • Active trip limit: 3 (you have 8)                                │
│  • 5 trips are now read-only                                        │
│  • You can still view them, but not edit                            │
│                                                                       │
│  To edit those trips:                                                │
│  • Archive completed trips (makes them inactive)                    │
│  • Or upgrade back to Pro ($4.99/mo)                                │
│                                                                       │
│  All your data is safe and waiting for you! 💾                      │
│                                                                       │
│  [Upgrade to Pro →] [Archive Trips]                                  │
│                                                                       │
│  Thanks for using TripSync!                                          │
└──────────────────────────────────────────────────────────────────────┘

END: Subscription cancelled, access until period end
```

---

## Flow 6: Feature Gating & Paywalls

```
┌─────────────────────────────────────────────────────────────────────┐
│                     FEATURE GATING & PAYWALL FLOW                    │
└─────────────────────────────────────────────────────────────────────┘

SCENARIO 1: Pro Feature - Map View
───────────────────────────────────

Free user clicks "Map" tab on trip
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  🗺️ Map View (Pro Feature)                                          │
│  ══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  [Blurred map preview in background]                                │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  🔒 Upgrade to Pro to unlock Map View                          │ │
│  │                                                                 │ │
│  │  See all your trip locations on an interactive map:            │ │
│  │  ✓ View all activities geographically                          │ │
│  │  ✓ Optimize routes between locations                           │ │
│  │  ✓ Get directions to each spot                                 │ │
│  │  ✓ Discover nearby attractions                                 │ │
│  │                                                                 │ │
│  │  💰 Just $4.99/month                                            │ │
│  │  🎁 14-day free trial                                           │ │
│  │                                                                 │ │
│  │  [🚀 Start Free Trial →]  [Learn More]                         │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘

SCENARIO 2: AI Generation Limit (Free Tier)
────────────────────────────────────────────

Free user tries to regenerate itinerary (already used 1 generation)
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  AI Generation Limit Reached                                         │
│  ══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  You've used your 1 free AI generation for this trip.               │
│                                                                       │
│  On the Free plan, you get:                                          │
│  • 1 AI generation per trip                                          │
│  • Can still edit itinerary manually                                 │
│                                                                       │
│  Want unlimited AI generations?                                      │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  🌟 UPGRADE TO PRO                                              │ │
│  │                                                                 │ │
│  │  ✓ Unlimited AI generations                                    │ │
│  │  ✓ Regenerate as many times as you want                        │ │
│  │  ✓ Try different trip vibes and preferences                    │ │
│  │  ✓ Unlimited everything else too                               │ │
│  │                                                                 │ │
│  │  $4.99/month • 14-day free trial                               │ │
│  │                                                                 │ │
│  │  [Upgrade to Pro →]                                             │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  [Edit Itinerary Manually] [Maybe Later]                            │
└──────────────────────────────────────────────────────────────────────┘

SCENARIO 3: Receipt OCR (Pro Feature)
──────────────────────────────────────

Free user uploads receipt
    ↓
Receipt uploaded but OCR blocked:
┌──────────────────────────────────────────────────────────────────────┐
│  Receipt Uploaded                                                    │
│  ══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  ✅ receipt_dinner.jpg saved                                         │
│                                                                       │
│  💡 Pro Feature: Automatic Receipt Scanning                          │
│                                                                       │
│  Upgrade to Pro to automatically extract:                            │
│  • Amount                                                            │
│  • Date                                                              │
│  • Merchant name                                                     │
│  • Tax & tip                                                         │
│  • Line items                                                        │
│                                                                       │
│  Save time - no more manual entry!                                   │
│                                                                       │
│  [Upgrade to Pro ($4.99/mo)] [Enter Manually]                        │
└──────────────────────────────────────────────────────────────────────┘

END: Soft paywalls encourage upgrades without blocking core features
```

**Paywall Strategy:**
- Soft paywalls: Show preview, explain value
- Allow dismissal: Never force upgrade
- Clear benefits: Show what they get
- Trial offer: Always mention free trial
- No nag: Don't show same paywall repeatedly
- Core features free: Voting, chat, expenses always work

---

## Flow 7: Failed Payment Recovery

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FAILED PAYMENT RECOVERY FLOW                      │
└─────────────────────────────────────────────────────────────────────┘

Monthly billing date arrives (July 1)
    ↓
Stripe attempts to charge $4.99
    ↓
❌ Payment fails (card declined)
    ↓
Stripe webhook: invoice.payment_failed
    ↓
POST /api/stripe/webhook
    ↓
Backend processing:
    ├─ Log payment failure
    ├─ Set subscription status: "past_due"
    ├─ Schedule retry (Stripe auto-retries)
    └─ Send immediate notification
    ↓
Email sent within 1 hour:
┌──────────────────────────────────────────────────────────────────────┐
│  Subject: ⚠️ Payment Failed - Action Required                        │
│  ────────────────────────────────────────────────────────────────   │
│                                                                       │
│  Hi Alex,                                                            │
│                                                                       │
│  We tried to charge your card for your Pro subscription ($4.99)    │
│  but the payment failed.                                             │
│                                                                       │
│  Reason: Card declined                                               │
│                                                                       │
│  Your Pro access is still active, but please update your            │
│  payment method soon to avoid service interruption.                  │
│                                                                       │
│  We'll automatically retry in 3 days. If that fails, your           │
│  subscription will be cancelled and you'll be downgraded to Free.   │
│                                                                       │
│  [Update Payment Method →]                                           │
│                                                                       │
│  Questions? Reply to this email.                                     │
└──────────────────────────────────────────────────────────────────────┘
    ↓
In-app banner shown:
    ┌────────────────────────────────────────────────────────────────┐
    │  ⚠️  Payment Failed                                             │
    │  Your card was declined. Update payment method to keep Pro.    │
    │  [Update Card →] [Dismiss]                                      │
    └────────────────────────────────────────────────────────────────┘
    ↓
Stripe auto-retries after 3 days
    ↓
SUCCESS: Payment goes through
─────────────────────────────
✅ Subscription reactivated
    ↓
Email: "Your payment was successful! Pro access continues."
    ↓
Banner removed

FAILURE: Payment fails again after 3 retries
─────────────────────────────────────────────
After 10 days of failures:
    ↓
Subscription automatically cancelled
    ↓
Email sent:
┌──────────────────────────────────────────────────────────────────────┐
│  Subject: Pro Subscription Cancelled Due to Payment Failure          │
│  ────────────────────────────────────────────────────────────────   │
│                                                                       │
│  Hi Alex,                                                            │
│                                                                       │
│  We tried multiple times to charge your card for your Pro           │
│  subscription, but all attempts failed.                              │
│                                                                       │
│  Your subscription has been cancelled and you've been moved to      │
│  the Free plan.                                                      │
│                                                                       │
│  What this means:                                                    │
│  • Trip limit: 3 active trips                                        │
│  • Member limit: 6 per trip                                          │
│  • All your data is safe                                             │
│                                                                       │
│  To restore Pro access:                                              │
│  [Update Payment & Resubscribe →]                                    │
│                                                                       │
│  Need help? We're here to assist.                                    │
└──────────────────────────────────────────────────────────────────────┘

END: Payment recovered or subscription cancelled
```

---

## All Subscription Use Cases

### 1. Plan Selection
- ✅ View pricing page
- ✅ Compare Free vs Pro vs Teams
- ✅ See feature breakdown
- ✅ FAQ section
- ✅ Contact for custom plans

### 2. Trial & Signup
- ✅ Start 14-day free trial (no card)
- ✅ Trial reminder (2 days before end)
- ✅ Trial expiration handling
- ✅ Add payment before trial ends
- ✅ Automatic transition to paid

### 3. Payment Processing
- ✅ Stripe Checkout integration
- ✅ Credit card processing
- ✅ Payment success handling
- ✅ Payment failure handling
- ✅ Failed payment retry (3 attempts)
- ✅ Automatic subscription cancellation after failures

### 4. Subscription Management
- ✅ View current plan
- ✅ See next billing date
- ✅ Update payment method
- ✅ View billing history
- ✅ Download invoices
- ✅ Manage billing email

### 5. Upgrades & Downgrades
- ✅ Upgrade from Free to Pro
- ✅ Upgrade from Pro to Teams
- ✅ Downgrade from Teams to Pro
- ✅ Cancel and downgrade to Free
- ✅ Prorated charges
- ✅ Immediate vs end-of-period changes

### 6. Cancellation
- ✅ Cancel subscription
- ✅ Cancellation survey
- ✅ Retention offers (discounts)
- ✅ Access until period end
- ✅ Automatic downgrade on expiry
- ✅ Reactivation option

### 7. Feature Gating
- ✅ Soft paywalls for Pro features
- ✅ Usage limit enforcement
- ✅ Graceful degradation
- ✅ Upgrade prompts
- ✅ Trial offers in paywalls

### 8. Billing & Invoices
- ✅ Monthly billing
- ✅ Automatic invoices
- ✅ Receipt emails
- ✅ Invoice downloads (PDF)
- ✅ Billing history
- ✅ Tax calculations (if applicable)

---

## Analytics & Tracking

**Events Tracked:**
1. `pricing_page_viewed` - User viewed pricing
2. `trial_started` - Free trial initiated
3. `trial_ended` - Trial expired
4. `subscription_created` - Paid subscription started
5. `subscription_upgraded` - Plan upgraded
6. `subscription_cancelled` - Subscription cancelled
7. `subscription_reactivated` - Cancelled subscription resumed
8. `payment_failed` - Card declined
9. `payment_recovered` - Failed payment succeeded on retry
10. `paywall_shown` - Feature paywall displayed
11. `paywall_converted` - User upgraded from paywall

**Metrics Tracked:**
- Trial conversion rate (trial → paid)
- Churn rate (cancellations per month)
- ARPU (average revenue per user)
- LTV (lifetime value)
- Payment failure rate
- Failed payment recovery rate
- Paywall conversion rate
- Most common cancellation reasons
- Discount offer acceptance rate

---

**Last Updated:** 2026-07-11
**Status:** ✅ Complete and Production-Ready
