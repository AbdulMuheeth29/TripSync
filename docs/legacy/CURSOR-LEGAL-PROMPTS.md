# Cursor Agent Prompts for Legal Documents

This document contains ready-to-use prompts for generating Privacy Policy and Terms of Service content specifically for TripSync. Copy and paste these prompts into Cursor agent.

---

## 🔒 Privacy Policy Prompt

```
Please generate a comprehensive Privacy Policy for TripSync, a group trip planning SaaS application. Use clear, user-friendly language while ensuring legal compliance with GDPR, CCPA, and CalOPPA.

### Company Information:
- **Product Name**: TripSync
- **Website**: [Your domain - e.g., tripsync.app]
- **Contact Email**: privacy@tripsync.app
- **Company Name**: [Your legal business name]
- **Company Address**: [Your business address]
- **Effective Date**: [Current date]

### What We Are:
TripSync is a collaborative trip planning platform that allows groups to plan trips together, manage itineraries, split expenses, vote on decisions, chat in real-time, and use AI-powered trip planning features.

### Personal Data We Collect:

**Account Information:**
- Full name
- Email address
- Password (encrypted/hashed)
- Profile photo (optional)
- Account preferences (theme, notifications)

**Trip Data:**
- Trip names, descriptions, destinations
- Start and end dates
- Budget information
- Itinerary items (activities, accommodations, transportation)
- Location data (destinations, map coordinates)
- Weather preferences
- Notes and custom fields

**User-Generated Content:**
- Photos uploaded to trips
- Comments and chat messages
- Vote choices on trip decisions
- Expense records (amounts, categories, receipts)
- Trip invitations and responses

**Usage Data:**
- Login timestamps
- Pages visited
- Features used
- Browser type and version
- Device type
- IP address
- Approximate location (city/country level)

**Payment Information (via Stripe):**
- Credit card details (stored by Stripe, not us)
- Billing address
- Subscription tier (Free, Pro, Teams)
- Transaction history

### How We Use This Data:

1. **Core Service Delivery**: Provide trip planning, collaboration, and management features
2. **AI Trip Planning**: Generate personalized trip itineraries using Anthropic Claude AI
3. **Communication**: Send trip invitations, notifications, and updates via email and push notifications
4. **Payment Processing**: Process subscription payments via Stripe
5. **Analytics**: Improve product features and user experience
6. **Security**: Prevent fraud, abuse, and unauthorized access
7. **Legal Compliance**: Comply with legal obligations and enforce our Terms of Service

### Third-Party Services We Use:

**Stripe** (https://stripe.com)
- **Purpose**: Payment processing for Pro and Teams subscriptions
- **Data Shared**: Email, billing address, payment information
- **Privacy Policy**: https://stripe.com/privacy

**AWS S3 / Cloudflare R2**
- **Purpose**: Cloud storage for user-uploaded photos
- **Data Shared**: Photos, file metadata
- **Privacy Policy**: https://aws.amazon.com/privacy/ or https://www.cloudflare.com/privacypolicy/

**Anthropic Claude AI**
- **Purpose**: AI-powered trip planning and itinerary generation
- **Data Shared**: Trip destination, dates, preferences, budget (NO personally identifiable information)
- **Privacy Policy**: https://www.anthropic.com/privacy

**Google Maps API** (Optional)
- **Purpose**: Display interactive maps for trip destinations
- **Data Shared**: Location coordinates, destination names
- **Privacy Policy**: https://policies.google.com/privacy

**Open-Meteo Weather API**
- **Purpose**: Display weather forecasts for trip destinations
- **Data Shared**: Location coordinates, dates
- **Privacy Policy**: https://open-meteo.com/en/terms

### Cookies and Tracking:

**Essential Cookies (Required):**
- Authentication token (tripsync_token) - keeps you logged in
- Session management
- CSRF protection

**Optional Cookies (Consent Required):**
- Analytics cookies - understand how users interact with TripSync
- Preference cookies - remember your theme choice (dark/light mode)

Users can manage cookie preferences through our cookie consent banner.

### Data Retention:
- **Active Accounts**: Data retained as long as your account is active
- **Deleted Accounts**: Data permanently deleted within 30 days of account deletion request
- **Backup Copies**: Removed from backups within 90 days
- **Legal Holds**: Data may be retained longer if required by law

### User Rights:

**Access**: Request a copy of all your personal data
**Rectification**: Correct inaccurate or incomplete data
**Deletion**: Request permanent deletion of your account and all associated data
**Export**: Download your trip data in JSON format
**Objection**: Opt-out of marketing emails or analytics
**Portability**: Export data in machine-readable format

To exercise these rights, email privacy@tripsync.app

### Data Security Measures:
- Passwords encrypted using industry-standard bcrypt hashing
- HTTPS/TLS encryption for all data transmission
- JWT tokens for secure authentication (7-day expiration)
- Database encryption at rest
- Regular security audits
- Limited employee access to user data
- Rate limiting to prevent abuse

### International Data Transfers:
Our servers are located in [Your server location, e.g., United States]. By using TripSync, you consent to your data being transferred to and processed in this location. We ensure adequate protections for international transfers as required by GDPR.

### Children's Privacy:
TripSync is not intended for users under 13 years old (or 16 in the EU). We do not knowingly collect data from children. If you believe a child has provided us with personal data, contact us immediately.

### Changes to This Policy:
We may update this Privacy Policy from time to time. We will notify users of material changes via email and by updating the "Last Updated" date. Continued use after changes constitutes acceptance.

### Contact Us:
For privacy questions or to exercise your rights:
- **Email**: privacy@tripsync.app
- **Mail**: [Your business address]

**GDPR Representative** (if applicable): [Name/contact if you have EU users]
**DPO** (if applicable): [Data Protection Officer contact if required]

### Legal Basis for Processing (GDPR):
- **Contract**: Processing necessary to provide TripSync services
- **Consent**: For optional features like analytics cookies
- **Legitimate Interest**: Fraud prevention, security, product improvement
- **Legal Obligation**: Compliance with tax and financial regulations

Please structure this as a clear, readable Privacy Policy page with proper headings and sections. Use plain language where possible while maintaining legal accuracy.
```

---

## 📜 Terms of Service Prompt

```
Please generate comprehensive Terms of Service for TripSync, a group trip planning SaaS application. Use clear language while ensuring legal protection for the company.

### Company Information:
- **Product Name**: TripSync
- **Website**: [Your domain - e.g., tripsync.app]
- **Contact Email**: legal@tripsync.app
- **Company Name**: [Your legal business name]
- **Company Address**: [Your business address]
- **Effective Date**: [Current date]

### Service Description:
TripSync is a web-based collaborative trip planning platform that provides:
- Group trip creation and management
- Collaborative itinerary planning
- Expense tracking and splitting
- Real-time chat and voting features
- AI-powered trip planning (using third-party AI)
- Photo sharing and storage
- Push notifications for trip updates
- Subscription tiers (Free, Pro, Teams)

### Key Terms to Include:

**1. Acceptance of Terms**
- By creating an account or using TripSync, users agree to these Terms
- Must be 13+ years old (16+ in EU)
- If under 18, need parental consent
- Businesses may use TripSync for commercial trip planning

**2. Account Registration**
- Users must provide accurate information (name, email)
- One account per person
- Users responsible for account security and password protection
- Must notify us immediately of unauthorized access
- We reserve the right to suspend or terminate accounts for violations

**3. Subscription Plans and Billing**

**Free Plan:**
- 3 active trips maximum
- Up to 6 members per trip
- 1 AI-generated itinerary per month
- Basic features

**Pro Plan ($4.99/month or $39/year):**
- Unlimited trips
- Unlimited members
- Unlimited AI generations
- Advanced map view
- Priority support
- 14-day free trial (requires payment method)

**Teams Plan ($9.99/month or $89/year):**
- All Pro features
- Multi-workspace support
- Admin controls
- Team analytics
- Priority support

**Billing Terms:**
- All payments processed securely via Stripe
- Annual plans billed upfront (34% discount)
- Monthly plans billed on recurring basis
- Prices in USD (update for your currency)
- No refunds for partial months
- Free trial auto-converts to paid unless canceled
- Subscriptions auto-renew unless canceled before renewal date
- Users can cancel anytime through billing settings
- Downgrading may result in feature restrictions (e.g., trips beyond Free limit become read-only)

**4. User Content and Intellectual Property**

**User Content Ownership:**
- Users retain all rights to content they upload (photos, trip details, comments)
- By uploading, users grant TripSync a license to store, display, and process content to provide services
- Users warrant they have rights to upload all content
- Prohibited content: illegal, harmful, offensive, infringing, or spam

**TripSync IP:**
- All TripSync code, design, features, and trademarks are owned by [Your company]
- Users may not copy, modify, reverse engineer, or create derivative works
- TripSync name and logo are registered trademarks (or "™" if not registered)

**5. Acceptable Use Policy**

**Prohibited Activities:**
- Upload illegal, defamatory, or harmful content
- Harass, threaten, or impersonate other users
- Attempt to hack, scrape, or reverse engineer TripSync
- Use bots or automated tools without permission
- Share accounts or resell access
- Upload malware, viruses, or malicious code
- Use for spam or unauthorized marketing
- Violate any laws or third-party rights
- Overload our servers or abuse AI generation features

**Consequences:** We may suspend or terminate accounts, remove content, or take legal action for violations.

**6. AI-Generated Content Disclaimer**
- AI trip planning powered by Anthropic Claude
- AI suggestions are not guaranteed to be accurate, safe, or suitable
- Users must verify all AI-generated itineraries, activities, and recommendations
- We are not liable for issues arising from following AI suggestions
- AI may occasionally produce unexpected or incorrect results
- Users should apply common sense and do independent research

**7. Third-Party Services**
- TripSync integrates with Stripe (payments), Google Maps, Open-Meteo, AWS S3, and Anthropic
- Third-party services governed by their own Terms and Privacy Policies
- We are not responsible for third-party service failures or changes
- Links to external websites do not constitute endorsement

**8. Data and Privacy**
- User data handled per our Privacy Policy
- Users consent to data processing as described
- We use cookies for essential functionality and optional analytics
- Users can request data export or account deletion
- We comply with GDPR, CCPA, and other applicable privacy laws

**9. Service Availability**

**No Uptime Guarantee:**
- We strive for 99.9% uptime but make no guarantees
- Service may be temporarily unavailable for maintenance
- We will provide notice for planned downtime when possible

**Changes to Service:**
- We may add, modify, or discontinue features at any time
- Advance notice provided for material changes when feasible
- Continued use after changes constitutes acceptance

**10. Termination**

**By User:**
- Cancel subscription anytime through billing settings
- Deleted accounts and data removed within 30 days

**By TripSync:**
- We may suspend or terminate accounts for Terms violations
- We may discontinue service with 30 days notice
- No refunds for early termination due to violations

**11. Limitation of Liability**

TripSync provided "AS IS" and "AS AVAILABLE" without warranties of any kind, express or implied.

**We Are NOT Liable For:**
- Accuracy of AI-generated trip suggestions
- Lost data due to user error or service issues
- Damages from service interruptions or bugs
- Third-party service failures (Stripe, Google Maps, etc.)
- User content (photos, comments, trip data)
- Decisions made based on information from TripSync
- Travel issues, cancellations, or safety incidents
- Financial losses from expense splitting errors

**Maximum Liability:**
Our total liability limited to the amount you paid in the past 12 months (or $100 if using Free plan).

**12. Indemnification**
Users agree to indemnify and hold TripSync harmless from claims arising from:
- User's violation of these Terms
- User's uploaded content
- User's use of TripSync
- User's violation of third-party rights

**13. Dispute Resolution**

**Governing Law:**
These Terms governed by laws of [Your state/country, e.g., "the State of California, USA"]

**Jurisdiction:**
Disputes resolved in courts of [Your jurisdiction]

**Arbitration (Optional):**
[Include arbitration clause if you want to require arbitration instead of lawsuits]

**No Class Actions:**
Users agree to resolve disputes individually, not as class actions

**14. Modifications to Terms**
- We may update these Terms at any time
- Material changes announced via email and website notice
- Continued use after changes constitutes acceptance
- If you disagree with changes, you must stop using TripSync

**15. Contact and Legal Notices**

For questions about these Terms:
- **Email**: legal@tripsync.app
- **Mail**: [Your business address]

For copyright infringement claims (DMCA):
- **Email**: dmca@tripsync.app
- Include: your contact info, description of copyrighted work, location of infringing content, good faith statement

**16. Miscellaneous**
- **Severability**: If any provision is unenforceable, the rest remains valid
- **No Waiver**: Our failure to enforce any right doesn't waive that right
- **Entire Agreement**: These Terms constitute the entire agreement
- **Assignment**: We may assign our rights; you may not assign yours without permission
- **Force Majeure**: We're not liable for delays due to circumstances beyond our control

Please structure this as a clear, organized Terms of Service document with numbered sections and subsections. Use headers and formatting for readability while maintaining legal precision.
```

---

## 🍪 Cookie Consent Banner Prompt

```
Please generate the text and categories for a GDPR-compliant cookie consent banner for TripSync.

### Cookie Categories:

**Strictly Necessary (Always Active):**
- Authentication token (tripsync_token) - keeps you logged in
- Session management cookies
- CSRF protection tokens
- Security and fraud prevention
These cannot be disabled as they're essential for the service to function.

**Analytics (Optional):**
- Usage statistics and feature analytics
- Error tracking and debugging
- Performance monitoring
Helps us understand how users interact with TripSync to improve the product.

**Preferences (Optional):**
- Theme preference (dark/light mode)
- Language preference
- Notification settings
Remembers your preferences across sessions.

### Banner Text:
"We use cookies to provide essential functionality and improve your experience. Strictly necessary cookies are always active. You can customize optional cookies below."

### Buttons:
- "Accept All" - accepts all cookie categories
- "Reject Optional" - only necessary cookies
- "Customize" - opens detailed cookie settings modal

### Settings Modal:
Include toggle switches for Analytics and Preferences categories with descriptions above.

### Compliance Note:
This banner is required for GDPR (EU users) and recommended for all users. Store user's cookie preference and don't show the banner again unless they clear cookies or 12 months pass.
```

---

## ✅ Content Verification Checklist

After Cursor generates the legal documents, verify they include:

### Privacy Policy Must Have:

- [ ] What data is collected (account, trip data, usage, payment)
- [ ] How data is used (service delivery, AI features, payments)
- [ ] Third-party services listed (Stripe, AWS S3, Anthropic, Google Maps, Open-Meteo)
- [ ] Cookie types and purposes (essential, analytics, preferences)
- [ ] Data retention periods (30 days after deletion)
- [ ] User rights (access, delete, export, correct)
- [ ] Security measures (encryption, HTTPS, JWT tokens)
- [ ] International data transfers (server location)
- [ ] Children's privacy (13+ or 16+ in EU)
- [ ] Contact information (privacy@tripsync.app)
- [ ] Legal basis for processing (GDPR: contract, consent, legitimate interest)
- [ ] How to exercise rights (email privacy@tripsync.app)
- [ ] Changes notification process
- [ ] GDPR representative if you have EU users

### Terms of Service Must Have:

- [ ] Acceptance of terms
- [ ] Age requirements (13+, 16+ in EU)
- [ ] Account registration rules
- [ ] All 3 subscription tiers (Free, Pro, Teams) with pricing
- [ ] Billing terms (auto-renew, cancellation, no refunds)
- [ ] User content ownership and license grant
- [ ] TripSync intellectual property protection
- [ ] Prohibited activities (hacking, spam, illegal content)
- [ ] AI disclaimer (not guaranteed accurate)
- [ ] Third-party services (Stripe, Google Maps, etc.)
- [ ] Service availability ("as is", no uptime guarantee)
- [ ] Termination rights (by user and by TripSync)
- [ ] Limitation of liability (maximum: 12 months of fees or $100)
- [ ] Indemnification clause
- [ ] Governing law and jurisdiction
- [ ] Contact information (legal@tripsync.app)

### Cookie Banner Must Have:

- [ ] Clear explanation of cookie types
- [ ] Strictly necessary cookies always active
- [ ] Optional categories (Analytics, Preferences)
- [ ] Accept All / Reject Optional buttons
- [ ] Link to full Privacy Policy
- [ ] GDPR-compliant (no pre-checked boxes for optional cookies)

---

## 📝 Implementation Steps

**After Cursor generates the content:**

1. **Review for Accuracy**
   - Replace all `[Your domain]` with actual domain (e.g., tripsync.app)
   - Replace `[Your legal business name]` with registered company name
   - Replace `[Your business address]` with actual address
   - Replace `[Current date]` with today's date
   - Replace `[Your state/country]` with your jurisdiction

2. **Create Pages**
   - Create `client/src/pages/privacy.tsx` with Privacy Policy content
   - Create `client/src/pages/terms.tsx` with Terms of Service content
   - Create `client/src/components/cookie-banner.tsx` for cookie consent

3. **Add Routes in App.tsx**

   ```typescript
   import PrivacyPage from "@/pages/privacy";
   import TermsPage from "@/pages/terms";

   <Route path="/privacy" component={PrivacyPage} />
   <Route path="/terms" component={TermsPage} />
   ```

4. **Link from Footer**
   - Add links to Privacy Policy and Terms in footer of all pages
   - Link from signup page: "By signing up, you agree to our [Terms of Service] and [Privacy Policy]"

5. **Add Cookie Banner**
   - Show banner on first visit
   - Store preference in localStorage: `tripsync_cookie_consent`
   - Don't show again for 12 months unless user clears cookies

6. **Legal Compliance**
   - Add checkbox to signup form: "I agree to the Terms of Service and Privacy Policy" (required)
   - Add "Delete Account" button in settings (links to user deletion flow)
   - Add "Export Data" button in settings (downloads JSON of user's trips)

---

## 🎯 Alternative: Use Free Generators

If you prefer not to use Cursor agent, you can use free generators:

**Recommended: Termly** (https://termly.io)

1. Sign up for free account
2. Select "Privacy Policy" generator
3. Answer questions about TripSync (use the data inventory above)
4. Download generated policy
5. Repeat for Terms of Service
6. Repeat for Cookie Policy

**Other Options:**

- TermsFeed (https://www.termsfeed.com)
- FreePrivacyPolicy.com (https://www.freeprivacypolicy.com)
- GetTerms.io (https://getterms.io)

All are free for basic use and GDPR/CCPA compliant.

---

## 📞 When to Consult a Lawyer

Use these templates/generators for now. Consult a lawyer when:

- Revenue exceeds $100,000/year
- You handle sensitive data (health, financial beyond Stripe)
- You operate in heavily regulated industries
- You face a legal dispute or GDPR complaint
- You're raising venture capital (investors may require legal review)

Cost: $2,000-5,000 for lawyer review vs $0 for templates.

---

## ⏱️ Time Estimate

**Using Cursor Agent with these prompts:** 30-60 minutes

- Generate Privacy Policy: 10 minutes
- Generate Terms of Service: 10 minutes
- Generate Cookie Banner text: 5 minutes
- Create 3 page components: 20 minutes
- Add routes and links: 10 minutes
- Review and customize: 15 minutes

**Using Termly or other generator:** 2-3 hours

- Answer questions for each policy
- Copy/paste generated content
- Create page components
- Styling and formatting

**Total:** ~1-3 hours to go from zero to legally compliant.
