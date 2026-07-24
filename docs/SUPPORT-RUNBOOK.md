# TripSync Support Team Runbook

**Version:** 1.0.0
**Last Updated:** 2026-07-17
**Owner:** Support Team

---

## Table of Contents

1. [Overview](#overview)
2. [Support Channels](#support-channels)
3. [Tools & Access](#tools--access)
4. [Common Issues & Solutions](#common-issues--solutions)
5. [Support Workflows](#support-workflows)
6. [Escalation Procedures](#escalation-procedures)
7. [Billing & Subscription Support](#billing--subscription-support)
8. [Data Requests (GDPR/Privacy)](#data-requests-gdprprivacy)
9. [Refund Policy](#refund-policy)
10. [Response Templates](#response-templates)
11. [SLAs & Expectations](#slas--expectations)

---

## Overview

This runbook provides the support team with everything needed to handle TripSync user inquiries, troubleshoot issues, and provide excellent customer support.

###Quick Reference

- **Average Response Time:** 24 hours (goal: 4 hours during business hours)
- **Support Email:** support@tripsync.app
- **Escalation Email:** engineering@tripsync.app
- **Emergency Contact:** [Phone number or Slack #emergency]

---

## Support Channels

### Primary Channels

1. **Email Support** - support@tripsync.app
   - Primary support channel
   - Check every 2-4 hours during business hours
   - All emails logged in support system

2. **In-App Contact Form** - /contact page
   - Routes to support@tripsync.app
   - Automatically includes user info if logged in

3. **Help Center** - /help
   - Self-service FAQs
   - Direct users here for common questions

### Secondary Channels (if configured)

4. **Live Chat** - Not yet implemented
5. **Twitter/Social** - Monitor for @mentions
6. **Community Forum** - Not yet implemented

---

## Tools & Access

### Required Tools

**1. Admin Dashboard**

- URL: https://tripsync.app/admin/metrics
- Access: Admin accounts only
- Purpose: View system metrics, user stats, error rates

**2. Sentry (Error Tracking)**

- URL: https://sentry.io/organizations/tripsync
- Purpose: View application errors, stack traces
- When to check: User reports bug or error message

**3. Stripe Dashboard**

- URL: https://dashboard.stripe.com
- Purpose: View/manage subscriptions, process refunds
- Access: Billing team

**4. Database (Read-Only Access)**

- Purpose: Look up user data, trip info
- Access: Via admin panel or approved SQL tool
- **IMPORTANT:** Read-only. Never modify data directly.

**5. Email System**

- SMTP logs to verify email delivery
- Check if password reset/invite emails sent

### How to Look Up a User

**Option 1: By Email (Admin Panel)**

```
1. Go to /admin/metrics
2. Search user by email
3. View: account status, subscription tier, trips created, last login
```

**Option 2: Database Query (if access)**

```sql
SELECT id, username, email, subscription_tier, created_at, last_login
FROM users
WHERE email = 'user@example.com';
```

**What You Can See:**

- User ID
- Email & username
- Subscription tier (free/pro/teams)
- Account creation date
- Last login timestamp
- Number of trips
- Number of AI generations used

**Privacy Note:** Only access user data when necessary for support. Log all lookups.

---

## Common Issues & Solutions

### 1. Password Reset Not Working ⚠️

**Symptoms:**

- User didn't receive password reset email
- Reset link expired
- Reset link doesn't work

**Troubleshooting:**

1. **Check spam folder**
   - Template: "Please check your spam/junk folder for an email from noreply@tripsync.app"

2. **Verify email address**
   - Ask user to confirm exact email used for registration
   - Check for typos

3. **Check email delivery logs**
   - Verify email was sent (check SMTP logs or SendGrid dashboard)
   - If not sent: escalate to engineering

4. **Link expiration**
   - Reset links expire after 1 hour
   - User must request a new link

5. **Manual reset (last resort)**
   - Escalate to engineering for manual password reset
   - Verify user identity first (security questions, ID verification)

**Resolution Time:** 30 minutes - 4 hours

---

### 2. AI Generation Failing or Timing Out 🤖

**Symptoms:**

- AI generation spinner stuck
- "AI service unavailable" error
- Generation takes >5 minutes

**Troubleshooting:**

1. **Check Anthropic API status**
   - Visit https://status.anthropic.com
   - If down: "AI service is temporarily unavailable. Please try again in 15-30 minutes."

2. **Check user's AI quota**
   - Free: 10/month, Pro: 100/month, Teams: unlimited
   - If exceeded: "You've reached your AI limit for this month. Upgrade to Pro or wait until next month."

3. **Check trip details**
   - Vague destinations cause poor results
   - Ask for specific city/region instead of "Europe" or "somewhere warm"

4. **Check Sentry for errors**
   - Search for user's email or trip ID
   - Look for Anthropic API errors

5. **Ask user to retry**
   - Sometimes transient network issues
   - "Please try refreshing the page and generating again."

**Escalate if:**

- AI completely non-functional for >30 minutes
- Multiple users reporting same issue
- Anthropic API key invalid/expired

**Resolution Time:** 15 minutes - 2 hours

---

### 3. Payment Declined / Subscription Issues 💳

**Symptoms:**

- "Payment failed" error
- Card declined
- Subscription not activating

**Troubleshooting:**

1. **Check Stripe dashboard**
   - Look up customer by email
   - View payment attempt logs
   - Check decline reason (insufficient funds, card expired, etc.)

2. **Common decline reasons:**
   - Insufficient funds → User needs to use different card
   - Card expired → User needs to update card info
   - Bank block → User needs to contact bank
   - 3D Secure failed → User needs to complete verification

3. **How to retry payment:**
   - "Please update your payment method in Settings → Billing → Update Card"
   - Or: "Try a different card"

4. **Subscription not showing:**
   - Check Stripe webhook delivery
   - If webhook failed: manually trigger subscription sync (escalate to engineering)

**Refund Requests:** See [Refund Policy](#refund-policy) section

**Resolution Time:** 30 minutes - 24 hours (depends on user's bank)

---

### 4. Invitation Not Working / Not Received 📧

**Symptoms:**

- User didn't receive trip invitation email
- Invitation link doesn't work
- "Invalid invitation" error

**Troubleshooting:**

1. **Check spam folder**
   - "Please check spam for email from noreply@tripsync.app"

2. **Verify email address**
   - Ask inviter to confirm invitee's email is correct

3. **Use share link instead**
   - "As a workaround, the trip organizer can share the join link found in Trip Settings → Share"

4. **Check invitation status**
   - Admin panel: View trip → Invitations tab
   - Status: Pending, Accepted, Expired

5. **Resend invitation**
   - Trip organizer can resend from Members tab

6. **Manual addition (last resort)**
   - Escalate to engineering to manually add user to trip
   - Verify both users consent

**Resolution Time:** 15 minutes - 2 hours

---

### 5. File Upload Failing 📸

**Symptoms:**

- "Upload failed" error
- Photos not appearing
- Receipt upload stuck

**Troubleshooting:**

1. **Check file size**
   - Max 10MB per file
   - "Please ensure your file is under 10MB. Try compressing the image."

2. **Check file type**
   - Supported: JPG, PNG, HEIC, WebP, PDF
   - Unsupported: BMP, TIFF, SVG
   - "Please use JPG or PNG format."

3. **Check cloud storage status**
   - AWS S3 or Cloudflare R2 status
   - If down: "File uploads are temporarily unavailable. Please try again later."

4. **Browser issues**
   - Try different browser
   - Clear browser cache
   - Disable browser extensions

5. **Check storage quota** (if implementing limits)
   - Free: 100MB, Pro: 1GB, Teams: 10GB
   - "You've reached your storage limit. Delete old files or upgrade."

**Escalate if:**

- Cloud storage credentials invalid
- Multiple users affected
- Storage bucket misconfigured

**Resolution Time:** 15 minutes - 4 hours

---

### 6. Email Notifications Not Receiving 📬

**Symptoms:**

- Not receiving trip updates
- Not receiving password reset
- Not receiving invitations

**Troubleshooting:**

1. **Check spam/junk folder**

2. **Verify notification settings**
   - User Settings → Notifications
   - Ensure relevant notifications enabled

3. **Check email address**
   - Settings → Account → Email
   - Confirm it's correct

4. **Add to safe senders**
   - "Add noreply@tripsync.app to your contacts"
   - "Mark TripSync emails as 'Not Spam'"

5. **Check email provider filters**
   - Gmail: Check Promotions/Updates tabs
   - Outlook: Check Junk Email folder
   - Corporate email: May be blocked by IT

6. **Test email delivery**
   - Send password reset to test
   - If not delivered: check SMTP logs

**Escalate if:**

- Emails not sending at all (check SMTP service)
- Multiple users affected

**Resolution Time:** 30 minutes - 4 hours

---

### 7. Performance Issues / App Slow 🐌

**Symptoms:**

- Page loading slowly
- "App is laggy"
- Timeouts

**Troubleshooting:**

1. **Check user's internet connection**
   - "Please check your internet speed at fast.com"

2. **Check trip size**
   - Trips with 100+ itinerary items load slower
   - "Consider archiving old activities or splitting the trip"

3. **Clear browser cache**
   - Chrome: Ctrl+Shift+Delete
   - Safari: Settings → Clear History and Website Data

4. **Try different browser**
   - Test in Chrome, Firefox, Safari

5. **Check server status**
   - Admin dashboard → System health
   - If server issues: escalate to engineering

6. **Check for outages**
   - Internal status page
   - Sentry error spike?

**Resolution Time:** 30 minutes - 4 hours

---

### 8. Data Not Syncing / Changes Not Saving 💾

**Symptoms:**

- Changes disappear after refresh
- Other members not seeing updates
- "Lost my changes"

**Troubleshooting:**

1. **Check internet connection**
   - Offline changes only sync when back online

2. **Hard refresh**
   - Chrome/Firefox: Ctrl+Shift+R (Cmd+Shift+R on Mac)
   - Safari: Cmd+Option+R

3. **Check browser console**
   - Ask user to press F12, check for red errors
   - Screenshot and send to support

4. **Concurrent editing conflict**
   - If two people edit simultaneously, last save wins
   - No conflict resolution yet (roadmap item)

5. **Check Sentry**
   - Search for API errors for this user

**Escalate if:**

- Data actually lost (database issue)
- Sync completely broken
- Multiple users affected

**Resolution Time:** 30 minutes - 8 hours

---

## Support Workflows

### Workflow 1: Initial Response (All Tickets)

**Timeline:** Within 4 hours (business hours) or 24 hours (all tickets)

**Steps:**

1. **Acknowledge receipt**
   - Use template: "Thank you for contacting TripSync support..."

2. **Gather information**
   - What were you trying to do?
   - What happened instead?
   - Browser/device?
   - Screenshots?

3. **Set expectations**
   - "We're looking into this and will update you within X hours"

**Template:**

```
Hi [Name],

Thank you for contacting TripSync support! I'm [Your Name] and I'll be helping you today.

I understand you're experiencing [issue]. To help resolve this quickly, could you please provide:

1. What you were trying to do
2. What happened instead
3. What browser/device you're using
4. Any error messages (screenshot if possible)

I'll investigate and get back to you within [X hours].

Best regards,
[Your Name]
TripSync Support Team
```

---

### Workflow 2: Troubleshooting

**Steps:**

1. **Reproduce the issue**
   - Try to replicate in staging/test environment
   - Confirm it's a bug vs. user error

2. **Check known issues**
   - Reference: docs/KNOWN-ISSUES.md
   - Is this a known limitation?

3. **Provide solution or workaround**
   - Step-by-step instructions
   - Screenshots if helpful

4. **Confirm resolution**
   - "Does this resolve your issue?"
   - Wait for confirmation before closing ticket

---

### Workflow 3: Bug Report

**When user reports a bug:**

1. **Gather details**
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Browser, device, OS
   - Screenshots/video

2. **Check Sentry**
   - Search for related errors
   - Get stack trace if available

3. **Attempt to reproduce**
   - Can you make it happen?
   - Specific to this user or widespread?

4. **Create bug ticket**
   - Document in issue tracker (GitHub Issues, Jira, etc.)
   - Label: bug, priority-[high/medium/low]
   - Assign to engineering

5. **Communicate with user**
   - "Thank you for reporting! We've logged this as bug #[ID]"
   - "Our engineering team will investigate"
   - "We'll update you when it's fixed"

**Bug Template:**

```
**Bug Report #[ID]**
**Reported by:** [User email]
**Date:** [Date]
**Severity:** [High/Medium/Low]

**Description:**
[What's broken]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Environment:**
- Browser: [Chrome 120]
- Device: [iPhone 15, Windows 11, etc.]
- User Tier: [Free/Pro/Teams]

**Sentry Link:**
[Link to error in Sentry]

**Screenshots:**
[Attach screenshots]
```

---

### Workflow 4: Feature Request

**When user requests a feature:**

1. **Thank them**
   - "Thanks for the suggestion!"

2. **Check if feature exists**
   - May already be available but user doesn't know
   - May be Pro/Teams only

3. **Check roadmap**
   - Is it already planned?
   - "This is on our roadmap for Q3 2026!"

4. **Log feature request**
   - Document in feature request tracker
   - Note: User email, description, use case

5. **Set expectations**
   - "We'll consider this for a future update"
   - "I've passed your feedback to the product team"
   - NO specific promises or timelines

**Response Template:**

```
Hi [Name],

Thank you for the feature suggestion! [Brief acknowledgment of the idea]

[If on roadmap:]
Great news! This feature is planned for [Q3 2026 / a future update]. We'll notify you when it's released.

[If not on roadmap:]
I've passed your feedback to our product team for consideration. While I can't make any promises, we really appreciate users sharing what would make TripSync better for them.

Is there anything else I can help you with today?

Best regards,
[Your Name]
```

---

## Escalation Procedures

### When to Escalate

**Escalate to Engineering if:**

- Issue affects >10 users
- Data loss reported
- Security vulnerability suspected
- Payment processing completely broken
- AI completely non-functional
- Unable to login (authentication broken)
- Database errors
- You've spent >2 hours troubleshooting with no resolution

**How to Escalate:**

1. **Email:** engineering@tripsync.app
2. **Subject:** [ESCALATION] Brief description
3. **Include:**
   - User email/ID
   - Issue description
   - Steps to reproduce
   - What you've tried
   - Sentry link
   - Priority: High/Medium/Low

**Escalation Template:**

```
Subject: [ESCALATION] AI generation failing for all users

Priority: HIGH

Issue: AI itinerary generation is timing out for all users since [time]

Affected Users: All users attempting AI generation (20+ reports)

Symptoms:
- AI generation spinner never completes
- Timeout after 2 minutes
- Sentry showing Anthropic API 500 errors

Sentry Link: [link]

What I've tried:
- Checked Anthropic status (shows operational)
- Tested myself - confirmed broken
- Checked API quota - not exceeded

User Impact: HIGH - Core feature is broken

Requesting: Immediate investigation
```

---

### Emergency Escalation

**Immediate escalation (call/text) for:**

- Data breach
- Payment data exposed
- Complete service outage (site down >15 min)
- Security exploit discovered

**Emergency Contact:**

- Phone: [Emergency number]
- Slack: #emergency

---

## Billing & Subscription Support

### Subscription Tiers

| Tier  | Price     | Trips     | Members   | AI/Month  |
| ----- | --------- | --------- | --------- | --------- |
| Free  | $0        | 3         | 8         | 10        |
| Pro   | $9.99/mo  | Unlimited | 25        | 100       |
| Teams | $29.99/mo | Unlimited | Unlimited | Unlimited |

### Common Billing Questions

**"How do I upgrade?"**

- Settings → Billing → Select Plan → Confirm

**"How do I cancel?"**

- Settings → Billing → Cancel Subscription
- Access continues until end of billing period
- Auto-downgrade to Free

**"How do I change payment method?"**

- Settings → Billing → Update Card

**"Why was I charged?"**

- Check Stripe dashboard for transaction details
- Auto-renewal (subscriptions renew automatically)
- Provide receipt

**"I was charged twice!"**

- Check Stripe dashboard
- May be authorization hold + actual charge
- If duplicate: process refund

---

## Data Requests (GDPR/Privacy)

### Right to Access (Data Export)

**Request:** "I want a copy of my data"

**Process:**

1. Verify user identity (email confirmation)
2. In-app: Settings → Privacy → Export Data
3. Or: Manually export via admin panel
4. Format: JSON or CSV
5. Send within 30 days (GDPR requirement)

**What to include:**

- User profile data
- All trip data they created or joined
- Comments, votes, expenses
- NO other users' private data

---

### Right to Deletion (Account Deletion)

**Request:** "I want to delete my account"

**Process:**

1. Verify user identity
2. In-app: Settings → Account → Delete Account
3. Warning: "This is permanent and cannot be undone"
4. What gets deleted:
   - User account
   - Profile data
   - Trips they created (as organizer)
   - Comments, votes
5. What remains:
   - Trips they joined (just removed as member)
   - Billing records (legal requirement for 7 years)

**Timeline:** Complete deletion within 30 days (GDPR)

---

### Right to Correction

**Request:** "My data is incorrect"

**Process:**

1. User can update in Settings → Account
2. Or: Support can update email if verified

---

## Refund Policy

### Official Policy

**7-Day Money-Back Guarantee:**

- Annual plans: Full refund within 7 days
- Monthly plans: Cancel anytime, no refund for current month

**Exceptions:**

- Billing errors → Full refund
- Service outage → Prorated refund or credit
- Fraud/unauthorized charge → Full refund

### How to Process Refund

**Steps:**

1. Verify refund is valid (within policy)
2. Check Stripe for payment details
3. Process refund in Stripe dashboard
4. Update user subscription status if needed
5. Confirm with user: "Refund of $XX processed. You'll see it in 5-10 business days."

**Refund Timeline:**

- Processing: Immediate in Stripe
- Bank posting: 5-10 business days

---

## Response Templates

### Template: General Acknowledgment

```
Hi [Name],

Thank you for contacting TripSync support! I'm [Your Name] and I'm here to help.

I understand [brief summary of issue]. I'll look into this right away and get back to you within [timeframe].

Best regards,
[Your Name]
TripSync Support Team
```

---

### Template: Issue Resolved

```
Hi [Name],

Great news! I've [what you did to fix it].

You should now be able to [expected result].

Please let me know if you continue to experience any issues or if there's anything else I can help with!

Best regards,
[Your Name]
```

---

### Template: Workaround Provided

```
Hi [Name],

While we work on a permanent fix for [issue], here's a workaround you can use:

[Step-by-step workaround]

I apologize for the inconvenience. We'll notify you when this is fully resolved.

Is there anything else I can help with?

Best regards,
[Your Name]
```

---

### Template: Feature is Pro/Teams Only

```
Hi [Name],

Thank you for reaching out! The [feature name] is available on our Pro and Teams plans.

You can upgrade anytime from Settings → Billing. We offer a 7-day free trial so you can try it risk-free!

Here's what you'll get with Pro:
- [Feature 1]
- [Feature 2]
- [Feature 3]

Let me know if you have any questions about upgrading!

Best regards,
[Your Name]
```

---

### Template: Escalated to Engineering

```
Hi [Name],

Thank you for reporting this issue. I've escalated this to our engineering team for investigation as it appears to be a technical bug.

Bug Ticket: #[ID]

We'll update you as soon as we have more information. In the meantime, [workaround if available].

Thank you for your patience!

Best regards,
[Your Name]
```

---

### Template: Cannot Reproduce

```
Hi [Name],

I've attempted to reproduce the issue you described, but I'm unable to replicate it on my end.

To help investigate further, could you please:

1. Try clearing your browser cache and cookies
2. Test in a different browser (Chrome, Firefox, Safari)
3. Provide a screenshot or screen recording if possible
4. Let me know your exact browser version

This will help us identify what might be causing the issue specifically for you.

Best regards,
[Your Name]
```

---

## SLAs & Expectations

### Response Times

**First Response:**

- Priority: Within 4 hours (business hours)
- Normal: Within 24 hours
- Low: Within 48 hours

**Resolution Times:**

- Tier 1 (password reset, simple questions): 4-8 hours
- Tier 2 (troubleshooting, account issues): 1-2 days
- Tier 3 (bugs, complex issues): 3-7 days

**Business Hours:**

- Monday-Friday 9am-6pm [Timezone]
- Closed weekends and holidays

### Customer Satisfaction Goals

- **Target CSAT:** 90%+
- **Follow-up:** Always ask "Did this resolve your issue?"
- **Close ticket:** Only after user confirms resolution

---

## Support Metrics to Track

1. **First Response Time** (target: <4 hours)
2. **Resolution Time** (target: <48 hours)
3. **CSAT Score** (target: >90%)
4. **Ticket Volume** (track trends)
5. **Top Issues** (identify patterns for product improvements)

---

## Additional Resources

- **Known Issues:** docs/KNOWN-ISSUES.md
- **Help Center:** https://tripsync.app/help
- **API Documentation:** docs/api-documentation.md
- **Admin Dashboard:** https://tripsync.app/admin/metrics

---

**Document Owner:** Support Team Lead
**Review Frequency:** Monthly
**Last Reviewed:** 2026-07-17
