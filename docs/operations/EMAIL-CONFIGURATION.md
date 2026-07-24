# Email Configuration Guide

## Overview

Trip-Sync uses Node mailer for sending transactional emails including trip invites, password resets, mentions, and notifications.

**Current Status**: ✅ Service implemented, needs SMTP configuration

## Required Environment Variables

Add to your `.env` file:

```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com        # Your SMTP server
SMTP_PORT=587                   # 587 for TLS, 465 for SSL, 25 for unencrypted
SMTP_USER=your-email@gmail.com  # SMTP username
SMTP_PASS=your-app-password     # SMTP password or app-specific password
SMTP_FROM=noreply@tripsync.app  # From email address

# Optional: Override default from address
# SMTP_FROM="TripSync <noreply@tripsync.app>"
```

## SMTP Provider Setup

### Option 1: Gmail (Recommended for Testing)

**Free tier**: 500 emails/day
**Best for**: Development, staging, small production deployments

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate App Password**:
   - Go to Google Account Settings → Security
   - Under "Signing in to Google" → App passwords
   - Select "Mail" and "Other (Custom name)" → "TripSync"
   - Copy the 16-character password

3. **Configure `.env`**:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=your-email@gmail.com
```

**Limitations**:

- 500 emails/day limit
- Gmail branding in headers
- Less suitable for high-volume production

### Option 2: SendGrid (Recommended for Production)

**Free tier**: 100 emails/day
**Paid**: Starting at $19.95/month for 50,000 emails

1. **Sign up** at [sendgrid.com](https://sendgrid.com)
2. **Create API Key**:
   - Settings → API Keys → Create API Key
   - Name: "TripSync Production"
   - Permissions: Full Access (or Mail Send only)
   - Copy the API key

3. **Verify sender identity**:
   - Settings → Sender Authentication
   - Verify a single sender email or domain

4. **Configure `.env`**:

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your-api-key-here
SMTP_FROM=noreply@yourdomain.com
```

**Benefits**:

- High deliverability
- Advanced analytics
- Dedicated IP options
- Better for production scale

### Option 3: AWS SES (Best for High Volume)

**Free tier**: 62,000 emails/month (if sending from EC2)
**Paid**: $0.10 per 1,000 emails

1. **Sign up** for AWS SES
2. **Verify domain or email**:
   - Add DNS records (TXT, CNAME)
   - Wait for verification (usually <1 hour)

3. **Request production access** (SES starts in sandbox mode)
   - Go to SES → Account Dashboard → Request production access
   - Explain use case, wait for approval (usually 24 hours)

4. **Create SMTP credentials**:
   - SES → SMTP Settings → Create SMTP Credentials
   - Download credentials file

5. **Configure `.env`**:

```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@yourdomain.com
```

**Benefits**:

- Extremely cost-effective at scale
- 99.9% uptime SLA
- Integrates with other AWS services
- Best deliverability

### Option 4: Mailgun

**Free tier**: 5,000 emails/month for 3 months
**Paid**: $35/month for 50,000 emails

1. Sign up at [mailgun.com](https://mailgun.com)
2. Verify domain (add DNS records)
3. Get SMTP credentials from Settings → SMTP credentials

```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@yourdomain.com
SMTP_PASS=your-password
SMTP_FROM=noreply@yourdomain.com
```

## Testing Email Configuration

### Test Script

```bash
# scripts/test-email.sh
#!/bin/bash

# Test email configuration
npm run test:email
```

Create `scripts/test-email.js`:

```javascript
import { emailService } from '../server/email-service.js';

async function testEmail() {
  const testEmail = process.argv[2] || 'test@example.com';

  console.log('🔄 Testing email configuration...');
  console.log(`Sending test email to: ${testEmail}`);

  if (!emailService.isEnabled()) {
    console.error('❌ Email service is not enabled');
    console.error('Please configure SMTP_HOST, SMTP_USER, and SMTP_PASS in .env');
    process.exit(1);
  }

  try {
    await emailService.sendEmail({
      to: testEmail,
      subject: 'TripSync Email Test',
      html: `
        <h1>Email Configuration Test</h1>
        <p>If you're seeing this, your SMTP configuration is working correctly!</p>
        <p>Test sent at: ${new Date().toISOString()}</p>
      `,
      text: "If you're seeing this, your SMTP configuration is working correctly!",
    });

    console.log('✅ Test email sent successfully!');
    console.log(`Check ${testEmail} for the test message`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to send test email:', error.message);
    console.error('\nCommon issues:');
    console.error('- Wrong SMTP credentials');
    console.error('- SMTP host/port incorrect');
    console.error('- Firewall blocking SMTP ports');
    console.error('- Need to enable "Less secure apps" (Gmail)');
    process.exit(1);
  }
}

testEmail();
```

Add to `package.json`:

```json
{
  "scripts": {
    "test:email": "node scripts/test-email.js"
  }
}
```

**Usage**:

```bash
# Test with your email
npm run test:email your-email@example.com

# Or just run (uses default test@example.com)
npm run test:email
```

## Email Templates

Trip-Sync includes the following email templates:

### 1. Trip Invitation

**Trigger**: User invites someone to a trip
**File**: `server/email-service.ts` → `sendTripInvite()`

**Variables**:

- `inviterName`: Name of person sending invite
- `tripDestination`: Trip destination
- `tripDates`: Date range (e.g., "May 15-18, 2026")
- `joinUrl`: Link to join the trip

### 2. Password Reset

**Trigger**: User requests password reset
**File**: `server/email-service.ts` → `sendPasswordResetEmail()`

**Variables**:

- `userName`: User's name
- `resetUrl`: Password reset link (expires in 1 hour)

### 3. Mention Notification

**Trigger**: User is mentioned in chat/comment
**File**: `server/email-service.ts` → `sendMentionNotification()`

**Variables**:

- `mentionedUserName`: User who was mentioned
- `mentionerName`: User who did the mentioning
- `tripDestination`: Trip name
- `messagePreview`: First 200 chars of message
- `tripUrl`: Link to trip

### 4. Deadline Reminder

**Trigger**: Trip starts in 7 days (via Atlas proactive system)
**File**: `server/email-service.ts` → `sendDeadlineReminder()`

**Variables**:

- `userName`: Recipient's name
- `tripDestination`: Trip name
- `daysUntilStart`: Days until trip starts
- `completionPercentage`: Trip completion %
- `tripUrl`: Link to trip

## Customizing Email Templates

All templates are in `server/email-service.ts`. To customize:

1. **Update HTML**:

```typescript
const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      /* Your custom styles */
    </style>
  </head>
  <body>
    <div class="container">
      <!-- Your custom content -->
    </div>
  </body>
  </html>
`;
```

2. **Update plain text version** (for email clients that don't support HTML):

```typescript
const text = `Your plain text version`;
```

3. **Test changes**:

```bash
npm run test:email your-email@example.com
```

## Troubleshooting

### Email not sending

**Check 1**: Is service enabled?

```bash
# Look for this log on server startup:
✓ Email service initialized

# Or this warning:
⚠ Email service not configured. Notifications will be disabled.
```

**Check 2**: Are environment variables set?

```bash
# Verify .env contains:
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
```

**Check 3**: Test SMTP connection manually

```bash
# Install swaks (SMTP testing tool)
# macOS:
brew install swaks

# Test connection:
swaks --to test@example.com \
      --from noreply@tripsync.app \
      --server smtp.gmail.com:587 \
      --auth LOGIN \
      --auth-user your-email@gmail.com \
      --auth-password your-password \
      --tls
```

### Gmail "Less secure apps" error

**Solution**: Use App Passwords (see Gmail setup above)

### Emails going to spam

**Solutions**:

1. **Add SPF record** (DNS):

   ```
   v=spf1 include:_spf.google.com ~all
   ```

2. **Add DKIM record** (provided by email service)

3. **Add DMARC record**:

   ```
   v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
   ```

4. **Use a verified domain** (not Gmail/Yahoo personal emails)

5. **Warm up your domain** (gradually increase sending volume)

### Rate limiting errors

**Gmail**: 500 emails/day limit
**Solution**: Upgrade to SendGrid/SES for production

**SendGrid**: Varies by plan
**Solution**: Contact support to increase limit

## Production Checklist

Before launching with email:

```bash
☐ SMTP credentials configured in .env
☐ SMTP_FROM uses a domain you control (not Gmail)
☐ DNS records configured (SPF, DKIM, DMARC)
☐ Test email sent successfully
☐ All email templates reviewed and tested
☐ Email service error handling tested
☐ Rate limits understood and acceptable
☐ Monitoring/alerts configured for email failures
☐ Unsubscribe links added (if sending marketing emails)
☐ Privacy policy mentions email usage
```

## Monitoring

### Log Email Sending

Emails are logged automatically:

```
Email sent to user@example.com: Trip Invitation
Email sent to user@example.com: Password Reset
```

### Track Email Metrics

For production, use your email provider's dashboard:

**SendGrid**:

- Opens, clicks, bounces, spam reports
- Real-time alerts for delivery issues

**AWS SES**:

- CloudWatch metrics
- Bounce/complaint notifications via SNS

**Gmail**:

- No analytics (not recommended for production)

### Alert on Failures

Add to `server/email-service.ts`:

```typescript
catch (error) {
  console.error('Failed to send email:', error);

  // Send alert to monitoring service
  if (process.env.NODE_ENV === 'production') {
    await sendAlertToSlack({
      text: `❌ Email failure: ${options.subject}`,
      error: error.message,
    });
  }

  throw error;
}
```

## Security Best Practices

1. **Never commit SMTP credentials** to git
   - Use `.env` file
   - Add `.env` to `.gitignore`

2. **Use app-specific passwords** for Gmail
   - Don't use your main Google password

3. **Rotate credentials** periodically
   - Change SMTP passwords every 90 days

4. **Restrict SMTP access**
   - Use firewall rules to allow only your servers

5. **Monitor for abuse**
   - Watch for unusual sending patterns
   - Set up alerts for high bounce rates

## Email Testing Checklist

Test each email type:

```bash
☐ Trip invitation - sends and renders correctly
☐ Password reset - link works and expires
☐ Mention notification - correct message preview
☐ Deadline reminder - accurate days calculation
☐ Plain text version displays correctly
☐ Links are clickable
☐ Mobile rendering looks good
☐ Spam score is low (use mail-tester.com)
```

## Cost Estimates

Based on 1,000 active users:

| Provider | Monthly Volume | Monthly Cost | Notes                    |
| -------- | -------------- | ------------ | ------------------------ |
| Gmail    | 15,000         | $0           | Free but limited         |
| SendGrid | 15,000         | $19.95       | Reliable, good analytics |
| AWS SES  | 15,000         | $1.50        | Cheapest, best for scale |
| Mailgun  | 15,000         | $35          | Good deliverability      |

**Estimated emails/user/month**: 15

- 8x trip invites
- 2x password resets
- 3x mentions
- 2x deadline reminders

---

**Last Updated**: 2026-05-14
**Version**: 1.0
**Next Review**: Before production launch
