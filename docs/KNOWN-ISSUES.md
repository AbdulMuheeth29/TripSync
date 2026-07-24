# Known Issues & Limitations

**Last Updated:** 2026-07-17
**Version:** 1.0.0

---

## Overview

This document lists all known issues, limitations, and workarounds for TripSync. This is for internal use by the support team and should be updated regularly.

---

## Current Known Issues

### 1. AI Generation May Take 30-90 Seconds ⚠️ EXPECTED BEHAVIOR

**Severity:** Low
**Status:** Not a bug - expected behavior

**Description:**
AI itinerary generation can take 30-90 seconds depending on trip complexity.

**Workaround:**

- This is normal behavior
- Show users the progress modal
- If it takes >2 minutes, may indicate API issue

**User Communication:**
"AI generation typically takes 30-90 seconds for complex itineraries. Please wait for the progress indicator to complete."

---

### 2. AI Struggles with Vague Destinations ⚠️ LIMITATION

**Severity:** Low
**Status:** Limitation of AI model

**Description:**
AI may produce generic results or fail when given vague destinations like "somewhere tropical" or "Europe".

**Workaround:**
Ask users to be specific:

- Good: "Bali, Indonesia" or "Paris, France"
- Bad: "Asia" or "somewhere warm"

**User Communication:**
"For best AI results, please specify a city or region name. Instead of 'Europe', try 'Barcelona, Spain' or 'Rome, Italy'."

---

### 3. File Uploads Limited to 10MB 🔴 HARD LIMIT

**Severity:** Medium
**Status:** Configuration limit

**Description:**
File uploads (receipts, photos) are limited to 10MB per file.

**Workaround:**

- Users can compress images before uploading
- Recommend using phone camera in "standard" quality instead of "high quality"
- For very large files, suggest using external sharing (Google Drive, etc.)

**User Communication:**
"File uploads are limited to 10MB per file. Please compress large images or use a lower camera quality setting."

---

### 4. No Native Mobile Apps 📱 ROADMAP ITEM

**Severity:** Medium
**Status:** On roadmap (Q3 2026)

**Description:**
TripSync doesn't have native iOS/Android apps yet.

**Workaround:**

- TripSync is a Progressive Web App (PWA)
- Users can "Add to Home Screen" for app-like experience
- Works offline once installed

**Installation Instructions:**

- **iOS:** Safari → Share → Add to Home Screen
- **Android:** Chrome → Menu → Install app

**User Communication:**
"While we don't have native apps yet, you can install TripSync as a PWA (Progressive Web App) by tapping 'Add to Home Screen' in your browser. This provides an app-like experience with offline support!"

---

### 5. Some Features Require Pro/Teams Subscription 💎 BY DESIGN

**Severity:** N/A (by design)
**Status:** Feature limitation

**Description:**
Certain features are locked behind Pro/Teams tiers:

- Map view
- Offline mode (full features)
- Calendar export (ics)
- Email import
- Receipt OCR
- Currency conversion
- Advanced analytics

**Workaround:**

- Free users can upgrade to access these features
- Trial periods available for Pro/Teams

**User Communication:**
"This feature requires a Pro or Teams subscription. You can upgrade anytime from Settings → Billing. We offer a 7-day free trial!"

---

### 6. Offline Mode Has Limitations ⚠️ TECHNICAL LIMITATION

**Severity:** Low
**Status:** PWA limitation

**Description:**
Offline mode allows viewing cached data but has limitations:

- Cannot create new trips offline
- Cannot invite new members offline
- Cannot upload files offline
- AI features require internet
- Changes sync when back online

**Workaround:**

- Users should view/edit trip data offline
- New creations will work once back online

**User Communication:**
"TripSync's offline mode lets you view and edit existing trips. New trips, invitations, and AI features require an internet connection. Your changes will sync automatically when you're back online."

---

### 7. Browser Support - IE Not Supported 🚫 UNSUPPORTED

**Severity:** Low
**Status:** Unsupported browser

**Description:**
Internet Explorer (IE 11 and below) is not supported.

**Supported Browsers:**

- ✅ Chrome (latest 2 versions)
- ✅ Firefox (latest 2 versions)
- ✅ Safari (latest 2 versions)
- ✅ Edge (Chromium, latest 2 versions)
- ❌ Internet Explorer

**Workaround:**
Ask users to switch to a modern browser.

**User Communication:**
"TripSync doesn't support Internet Explorer. Please use Chrome, Firefox, Safari, or Edge for the best experience."

---

### 8. Currency Conversion Not Automatic 💱 ROADMAP ITEM

**Severity:** Low
**Status:** On roadmap (Q4 2026)

**Description:**
Expense splitting works per-currency. No automatic currency conversion.

**Workaround:**

- Set a trip default currency
- Convert expenses to trip currency before entering
- Use external tool (Google, XE.com) for conversion
- Enter same expense twice if split across currencies

**User Communication:**
"Automatic currency conversion isn't available yet. Please convert expenses to your trip's default currency before adding them. You can set a default currency in Trip Settings."

---

### 9. Email Notifications May Go to Spam 📧 COMMON ISSUE

**Severity:** Medium
**Status:** ISP filtering

**Description:**
TripSync emails (invitations, password reset, etc.) may land in spam folder.

**Workaround:**

1. Check spam/junk folder
2. Add noreply@tripsync.app to contacts
3. Mark TripSync emails as "Not Spam"
4. Check email filters/rules

**For Self-Hosters:**

- Configure SPF, DKIM, DMARC records
- Use reputable SMTP provider (SendGrid, AWS SES)
- Verify sender domain

**User Communication:**
"If you're not receiving emails from TripSync, please check your spam folder. Add noreply@tripsync.app to your contacts to ensure future emails reach your inbox."

---

### 10. Safari Private Browsing Limitations 🕵️ TECHNICAL LIMITATION

**Severity:** Low
**Status:** Safari limitation

**Description:**
Safari's Private Browsing mode limits localStorage, which may cause:

- Cookie consent banner appearing repeatedly
- Theme preference not saving
- "Remember me" not working

**Workaround:**
Use regular browsing mode for consistent experience.

**User Communication:**
"Some features like theme preferences and 'Remember Me' don't work in Safari Private Browsing due to browser limitations. Please use regular browsing mode for the full experience."

---

### 11. Large Trips (100+ Itinerary Items) May Load Slowly ⚠️ PERFORMANCE

**Severity:** Low
**Status:** Optimization in progress

**Description:**
Trips with 100+ itinerary items may experience:

- Slower initial load time (3-5 seconds)
- Lag when dragging/reordering items
- Slower filtering/searching

**Workaround:**

- Split very large trips into multiple smaller trips
- Archive/delete unused itinerary items
- Performance improvements coming in next release

**User Communication:**
"We've noticed your trip has over 100 activities! For better performance, consider archiving past items or splitting the trip. We're working on performance improvements for large trips."

---

### 12. Voting Doesn't Show Realtime Updates ⏱️ ROADMAP ITEM

**Severity:** Low
**Status:** On roadmap (Q3 2026)

**Description:**
Vote counts update when page refreshes, not in realtime.

**Workaround:**

- Refresh page to see latest votes
- WebSocket support coming soon for realtime updates

**User Communication:**
"Votes will appear after refreshing the page. Real-time vote updates are coming soon!"

---

### 13. Photo Gallery Limits by Tier 📸 BY DESIGN

**Severity:** N/A (by design)
**Status:** Tier limitation

**Limits:**

- Free: 10 photos per trip
- Pro: 100 photos per trip
- Teams: Unlimited photos

**Workaround:**

- Delete old/duplicate photos to free space
- Upgrade for more storage
- Use external photo sharing (Google Photos) for large collections

**User Communication:**
"You've reached your photo limit for this tier. Delete unused photos or upgrade to Pro for 100 photos per trip (or Teams for unlimited)."

---

### 14. Time Zone Handling 🌍 KNOWN LIMITATION

**Severity:** Low
**Status:** Working as designed

**Description:**
Times are stored in the trip's local timezone. If members are in different timezones, they see times in the trip's timezone (not converted to their local time).

**Workaround:**

- Trip shows times in destination timezone (as intended)
- For multi-timezone trips, specify timezone in activity notes

**User Communication:**
"All trip times are shown in the destination's local timezone. This ensures everyone sees activities at the correct local time when you arrive."

---

## Platform-Specific Issues

### iOS-Specific

**Issue:** Add to Home Screen prompt doesn't always appear
**Status:** iOS PWA limitation
**Workaround:** Manually add via Safari → Share → Add to Home Screen

**Issue:** Safari may clear PWA cache after 7 days of inactivity
**Status:** iOS limitation
**Workaround:** Open app at least once a week or re-cache data

### Android-Specific

**Issue:** Some older Android devices (<Android 10) have limited PWA support
**Status:** OS limitation
**Workaround:** Recommend Chrome for best experience

---

## Service Dependencies

### Issues When External Services Are Down

**Anthropic Claude API Down:**

- AI generation will fail
- Error: "AI service temporarily unavailable"
- Workaround: Manual itinerary entry, try again later

**Stripe Down:**

- Payment processing fails
- Existing subscriptions unaffected
- Workaround: Wait for Stripe to recover, try payment later

**Cloud Storage (S3/R2) Down:**

- Photo/file uploads fail
- Existing files remain accessible
- Workaround: Try uploading later

**SMTP Service Down:**

- Emails won't send (invites, password reset)
- Workaround: Use share link instead of email invites
- Password reset: Contact support

---

## Not a Bug - Expected Behavior

### Free Tier Limits

Users may report these as "bugs" but they're intentional tier limits:

1. "I can only create 3 trips" → Free tier limit
2. "I can only add 8 members" → Free tier limit
3. "AI isn't working after 10 uses" → Free tier monthly limit
4. "Map view is locked" → Pro feature
5. "Can't export calendar" → Pro feature

**Response:** Explain it's a tier limitation and offer upgrade.

---

## Monitoring & Metrics

### How to Check if Issues Are Widespread

1. **Sentry Dashboard:** Check error spike
2. **Server Logs:** Look for API errors
3. **Support Tickets:** Multiple reports of same issue?
4. **External Status:**
   - Anthropic status: https://status.anthropic.com
   - Stripe status: https://status.stripe.com
   - AWS status: https://status.aws.amazon.com

---

## Escalation Criteria

**Escalate to Engineering if:**

- Issue affects >10 users
- Data loss reported
- Security vulnerability suspected
- Payment processing broken
- AI completely non-functional
- Unable to login (authentication broken)

**Emergency Escalation:**

- Data breach
- Payment data exposed
- Complete service outage

**Contact:** engineering@tripsync.app or Slack #engineering

---

## User FAQ - Quick Responses

**Q: Why is AI so slow?**
A: AI generation takes 30-90 seconds for complex itineraries. This is normal.

**Q: Why can't I create more than 3 trips?**
A: Free tier allows 3 active trips. Upgrade to Pro for unlimited trips.

**Q: My emails are going to spam**
A: Add noreply@tripsync.app to your contacts and mark as "Not Spam".

**Q: Where's the mobile app?**
A: Install as PWA via "Add to Home Screen" in your mobile browser.

**Q: Can I export to Excel?**
A: Yes! Use the Export feature on the Expenses tab (CSV format, opens in Excel).

**Q: How do I delete my account?**
A: Settings → Account → Delete Account. This is permanent and deletes all data.

---

## Recently Fixed (Reference)

Issues that were recently resolved (keep for historical reference):

- ~~Login loop on mobile Safari~~ - Fixed in v1.2.3
- ~~AI generation timeout after 30s~~ - Fixed in v1.2.0 (now 120s timeout)
- ~~Expense rounding errors~~ - Fixed in v1.1.5
- ~~Dark mode not persisting~~ - Fixed in v1.1.0

---

## Report New Issues

Found a new issue? Report it:

1. **Internal:** Create ticket in support system or post in #support Slack
2. **Include:**
   - User email/ID
   - Steps to reproduce
   - Browser/device
   - Screenshots
   - Error messages from Sentry (if available)

---

**Document Owner:** Support Team
**Review Frequency:** Weekly
**Last Reviewed:** 2026-07-17
