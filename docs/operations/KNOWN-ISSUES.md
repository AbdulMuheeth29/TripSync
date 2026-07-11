# Known Issues & Limitations

**Version**: 1.0.0
**Last Updated**: 2026-05-15

---

## Critical Issues

**None** - All critical functionality tested and working ✅

---

## Functional Limitations

### 1. Chat Storage is In-Memory

**Impact**: Medium
**Status**: By Design (for v1.0)

**Description**:
- Chat messages are stored in memory, not in the database
- Messages will be lost when the server restarts
- Not suitable for long-term chat history

**Workaround**:
- Minimize server restarts
- Use chat for immediate coordination only
- Important information should be added to trip notes or itinerary

**Future Fix**:
- v1.1 will migrate chat to PostgreSQL
- Migration path planned (see `/migrations/` folder)

---

### 2. AI Features Require API Key

**Impact**: Low
**Status**: Optional Feature

**Description**:
- AI trip itinerary generation requires Anthropic API key
- Atlas AI assistant requires API key
- Feature gracefully disabled if key not configured

**Workaround**:
- Users can manually create itineraries
- All other features work without AI

**How to Enable**:
```bash
# Add to .env
AI_INTEGRATIONS_ANTHROPIC_API_KEY=sk-ant-...
```

---

### 3. File Uploads Require Storage Configuration

**Impact**: Low
**Status**: Optional Feature

**Description**:
- Photo uploads require S3 or R2 configuration
- Document uploads require S3 or R2 configuration
- Feature gracefully disabled if not configured

**Workaround**:
- Users can share photos via external links
- Core trip planning works without photo uploads

**How to Enable**:
```bash
# Option 1: Cloudflare R2 (recommended)
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=tripsync-uploads

# Option 2: AWS S3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=tripsync-uploads
AWS_REGION=us-east-1
```

---

### 4. Stripe Billing Optional

**Impact**: Low
**Status**: Optional Feature

**Description**:
- All users default to "free" tier
- Paid tiers (Pro, Teams) require Stripe configuration
- Subscription limits not enforced without Stripe

**Workaround**:
- App works fully without billing
- All features available to all users

**How to Enable**:
```bash
# Add to .env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_ANNUAL=price_...
STRIPE_PRICE_TEAMS_MONTHLY=price_...
STRIPE_PRICE_TEAMS_ANNUAL=price_...
```

---

## Performance Considerations

### 5. Database Not Optimized for >10,000 Users Yet

**Impact**: Low (for initial launch)
**Status**: Planned Optimization

**Description**:
- Database queries are functional but not fully optimized
- No performance issues expected for <10,000 users
- May see slowdowns with larger datasets

**Monitoring**:
- Watch database query times
- Monitor API response times
- Alert if queries exceed 200ms average

**Future Optimization**:
- Add database indexes for frequent queries
- Implement query result caching
- Add database connection pooling tuning

---

### 6. No CDN for Static Assets

**Impact**: Low
**Status**: Planned Enhancement

**Description**:
- Static assets served directly from app server
- Slower load times for international users
- Higher bandwidth usage

**Workaround**:
- Assets are small and load quickly for most users
- Gzip compression enabled

**Future Enhancement**:
- Add Cloudflare CDN
- Or use Vercel/Netlify for frontend

---

### 7. No Image Optimization/Compression

**Impact**: Low
**Status**: Planned Enhancement

**Description**:
- Uploaded images stored at original size
- May consume more storage than necessary
- May load slower on slow connections

**Workaround**:
- Users can manually compress images before upload
- Most modern phones produce reasonable file sizes

**Future Enhancement**:
- Add Sharp for server-side image compression
- Generate multiple sizes (thumbnail, medium, full)
- Convert to WebP format

---

## Browser & Device Support

### 8. Browser Compatibility

**Status**: ✅ Fully Supported

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome/Edge (v100+) | ✅ Fully Supported | Recommended |
| Safari (v15+) | ✅ Fully Supported | iOS and macOS |
| Firefox (v100+) | ✅ Fully Supported | |
| Safari (v14) | ⚠️ Mostly Works | Some CSS issues |
| Chrome/Edge (<v100) | ⚠️ Mostly Works | Update recommended |
| Internet Explorer 11 | ❌ Not Supported | Use modern browser |

**Known Issues**:
- Safari v14: Date picker styling slightly different
- Older browsers: Some modern CSS features may not work

**Recommendation**:
- Encourage users to keep browsers updated
- Display notice for unsupported browsers

---

### 9. Mobile Experience

**Status**: ✅ Mobile-First Design

**Description**:
- App fully responsive and works on all screen sizes
- PWA installable on iOS and Android
- Touch-optimized interface

**Known Issues**:
- None significant

---

## Security Considerations

### 10. No Rate Limiting on API Endpoints (Yet)

**Impact**: Low
**Status**: Planned Enhancement

**Description**:
- API endpoints not rate-limited yet
- Potential for abuse or DDoS
- Not a concern for initial small-scale launch

**Mitigation**:
- Nginx rate limiting in production setup
- Cloudflare provides DDoS protection (if used)

**Future Enhancement**:
```bash
# Add express-rate-limit
npm install express-rate-limit
```

---

### 11. Email Verification Not Required

**Impact**: Low
**Status**: By Design (for v1.0)

**Description**:
- Users can register with any email address
- Email not verified before account activation
- Potential for fake accounts

**Mitigation**:
- Admin can delete fake accounts
- Trip invites verify email implicitly

**Future Enhancement**:
- Add email verification flow
- Add email confirmation requirement

---

## Known Bugs

### 12. No Critical Bugs

**Status**: ✅ All Tests Passing

**Description**:
- 89 automated tests passing
- 0 TypeScript errors
- All critical user flows tested

**Test Coverage**:
- ✅ Authentication
- ✅ Trip CRUD operations
- ✅ Itinerary management
- ✅ Expense tracking
- ✅ Member management
- ✅ Storage layer
- ✅ Middleware

---

## Edge Cases & Minor Issues

### 13. Timezone Handling

**Status**: Works Correctly

**Description**:
- All dates stored in UTC
- Displayed in user's local timezone
- Edge case: Trip with members in multiple timezones may see different dates

**Workaround**:
- Trip dates interpreted in trip destination timezone (implicit)
- Users should coordinate on timezone for meetings

---

### 14. Currency Conversion

**Status**: Not Implemented

**Description**:
- Expenses can be entered in any currency
- No automatic conversion between currencies
- Split calculations work per-currency

**Workaround**:
- Users should agree on single currency for trip
- Or manually convert when entering expenses

**Future Enhancement**:
- Add currency conversion API
- Auto-convert all expenses to trip currency

---

### 15. Large File Uploads

**Status**: Limited

**Description**:
- Max file size: 25MB for photos
- Max file size: 10MB for documents
- No upload progress indicator

**Workaround**:
- Compress large files before upload
- Split large documents into smaller files

---

## Accessibility

### 16. Screen Reader Support

**Status**: ⚠️ Partial

**Description**:
- Semantic HTML used throughout
- ARIA labels on interactive elements
- Not fully tested with screen readers

**Future Enhancement**:
- Comprehensive screen reader testing
- WCAG 2.1 AA compliance audit

---

### 17. Keyboard Navigation

**Status**: ✅ Fully Supported

**Description**:
- All features accessible via keyboard
- Tab order logical
- Focus indicators visible

---

## Internationalization

### 18. English Only

**Status**: By Design (for v1.0)

**Description**:
- UI and documentation in English only
- No multi-language support

**Future Enhancement**:
- Add i18n framework (react-i18next)
- Start with Spanish, French, German, Japanese

---

## Data & Privacy

### 19. GDPR Compliance

**Status**: ✅ Compliant (for basic features)

**Description**:
- Privacy policy implemented
- Cookie consent implemented
- User data deletion supported
- No tracking without consent

**Limitations**:
- No formal GDPR audit yet
- No Data Protection Officer

**Recommendation**:
- If targeting EU: Get formal audit
- If targeting EU: Appoint DPO

---

### 20. Data Export

**Status**: ⚠️ Partial

**Description**:
- Users can view all their data
- No one-click "export all data" feature yet

**Workaround**:
- Admin can export from database
- Users can copy/paste data manually

**Future Enhancement**:
- Add "Download My Data" feature
- Export to JSON or CSV

---

## Third-Party Service Dependencies

### 21. Service Outages

**Potential Issues**:

**PostgreSQL Database**:
- If database goes down, entire app is unavailable
- Mitigation: Use reliable hosting (Supabase, Railway, AWS RDS)

**Redis Cache** (Optional):
- If Redis goes down, app continues working
- Token blacklist disabled (logout may not work immediately)
- Cache disabled (slightly slower)

**Email/SMTP**:
- If SMTP goes down, password reset and invites fail
- Rest of app continues working

**Anthropic API** (Optional):
- If API goes down, AI features disabled
- Rest of app continues working

**Stripe** (Optional):
- If Stripe goes down, billing features disabled
- Existing subscriptions continue
- Rest of app continues working

**S3/R2 Storage** (Optional):
- If storage goes down, file uploads fail
- Existing files still viewable (if public URLs)
- Rest of app continues working

---

## Workarounds Summary

| Issue | Severity | Workaround | ETA for Fix |
|-------|----------|------------|-------------|
| Chat in-memory | Medium | Minimize restarts | v1.1 |
| No rate limiting | Low | Use Nginx | v1.2 |
| No CDN | Low | Acceptable for MVP | v1.3 |
| No email verification | Low | Admin moderation | v1.2 |
| No currency conversion | Low | Use single currency | v2.0 |
| English only | Low | Use translation tools | v2.0 |
| No data export | Low | Manual export | v1.3 |

---

## Reporting New Issues

If you discover a new issue:

1. **Check if it's already listed here**
2. **Determine severity**:
   - Critical: Data loss, security, complete feature failure
   - High: Major feature broken
   - Medium: Feature works but has problems
   - Low: Minor inconvenience

3. **Report via**:
   - GitHub Issues: https://github.com/AbdulMuheeth29/TripSync/issues
   - Email: abdulmuheethmd29@gmail.com

4. **Include**:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Browser/device info
   - Screenshots if applicable

---

## Version History

- **v1.0.0** (2026-05-15): Initial release
  - All core features working
  - 0 critical bugs
  - 89 tests passing

---

**Next Review**: After 1 week of production usage

---
