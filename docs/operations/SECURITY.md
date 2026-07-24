# Trip-Sync Security Documentation

## Authentication & Authorization

### JWT-Based Authentication

Trip-Sync uses **JSON Web Tokens (JWT)** for authentication, sent via the `Authorization` header:

```
Authorization: Bearer <token>
```

**Why JWT?**

- Stateless (no server-side session storage required)
- Scales horizontally across multiple servers
- 7-day expiration reduces token compromise risk
- bcrypt password hashing (12 rounds) for strong protection

### CSRF Protection

**CSRF protection is NOT required** for this application because:

1. **JWT tokens are in headers, not cookies**
   - Browsers don't automatically send `Authorization` headers
   - CSRF attacks rely on browsers auto-sending cookies
   - Our JWT architecture is immune to CSRF by design

2. **State-changing requests require explicit authentication**
   - Every protected endpoint uses `requireAuth` middleware
   - Validates JWT signature and expiration
   - No ambient authentication (unlike cookies)

3. **Alternative protections in place:**
   - **Stripe webhooks**: Signature verification via `stripe.webhooks.constructEvent()`
   - **CORS**: Configured for specific origins when needed
   - **SameSite cookies**: If cookies are used in future, set `SameSite=Strict`

### Security Measures Implemented

#### ✅ Authentication Security

- **Password hashing**: bcrypt with 12 salt rounds
- **Password requirements**: Minimum 8 characters
- **Token expiration**: 7 days
- **Email normalization**: Lowercase for consistency

#### ✅ Authorization

- **Role-based access control**: Organizer, Planner, Member roles
- **Trip-level access control**: `requireTripAccess` middleware
- **Resource ownership**: Verified before modifications

#### ✅ Input Validation

- **Zod schemas**: All request bodies validated
- **SQL injection prevention**: Drizzle ORM with parameterized queries
- **File upload validation**: MIME type and size limits (25MB images, 10MB docs)

#### ✅ Security Headers

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (production only)
- Helmet middleware for additional headers

#### ✅ Rate Limiting

- **Production**: 200 requests per 15 minutes per IP
- **AI generation**: 10 requests per hour per user (in-memory)

#### ✅ Error Tracking

- **Sentry**: Production error monitoring
- **Sensitive data filtering**: Passwords, tokens, API keys redacted

#### ✅ Structured Logging

- **Pino**: JSON structured logs
- **Request correlation IDs**: Track requests across services
- **Sensitive field redaction**: Authorization headers, cookies removed

### Known Limitations

#### ✅ Session Revocation (IMPLEMENTED)

**Solution**: Token blacklist for logout and security

**Features**:

- ✅ Logout invalidates JWT immediately
- ✅ Revoke all sessions for security incidents
- ✅ Redis-backed blacklist (with in-memory fallback)
- ✅ Automatic cleanup via Redis TTL
- ✅ Enhanced auth middleware checks blacklist
- ✅ Revoked-before timestamp for bulk revocation

**Usage**:

```bash
# Logout (single session)
POST /api/auth/logout

# Revoke all sessions (security measure)
POST /api/auth/revoke-all-sessions
```

**Implementation**: Uses Redis when available (via `REDIS_URL` env var), falls back to in-memory storage for development. Production deployments should configure Redis for proper session management across multiple servers.

#### ⚠️ Password Reset

**Issue**: Password reset not implemented

**Risk**: Users cannot recover lost passwords

**Status**: TODO at `server/routes.ts:216`

**Priority**: HIGH

#### ⚠️ Content Security Policy

**Issue**: CSP disabled to avoid breaking SPA

**Status**: `helmet({ contentSecurityPolicy: false })`

**Recommendation**: Tune CSP instead of disabling

**Priority**: MEDIUM

### Security Best Practices for Developers

#### When Adding New Endpoints

1. **Always use authentication middleware**

   ```typescript
   app.post('/api/trips', requireAuth, async (req, res) => { ... });
   ```

2. **Validate all input**

   ```typescript
   const schema = z.object({ name: z.string(), ... });
   const data = schema.parse(req.body);
   ```

3. **Check authorization**

   ```typescript
   app.put('/api/trips/:id', requireAuth, requireTripAccess, requireOrganizer, ...);
   ```

4. **Never log sensitive data**

   ```typescript
   // ❌ Bad
   logger.info('User login', { password: user.password });

   // ✅ Good
   logger.info('User login', { userId: user.id });
   ```

5. **Use parameterized queries** (Drizzle does this automatically)

   ```typescript
   // ✅ Safe (Drizzle ORM)
   await db.select().from(users).where(eq(users.id, userId));

   // ❌ Dangerous (don't do this)
   await db.execute(`SELECT * FROM users WHERE id = '${userId}'`);
   ```

#### Security Testing

Run security audits regularly:

```bash
# Dependency vulnerabilities
npm audit

# Fix non-breaking issues
npm audit fix

# Check for outdated packages
npm outdated
```

#### Incident Response

**If a security issue is discovered:**

1. **Assess severity** (CVSS score)
2. **Document the issue** (what, when, who affected)
3. **Patch immediately** if critical
4. **Notify affected users** if data breach
5. **Review logs** for evidence of exploitation
6. **Update this document** with lessons learned

### Security Contacts

- **Security issues**: Create private GitHub Security Advisory
- **Urgent vulnerabilities**: [security@tripsync.app]

### Compliance

- **GDPR**: User data stored in PostgreSQL, deletable via account deletion
- **Data retention**: User data retained while account active
- **Privacy**: See `/privacy` page for user-facing policy

### External Dependencies

Security-critical dependencies:

- **@sentry/node**: Error tracking (sanitizes sensitive data)
- **bcryptjs**: Password hashing (12 rounds)
- **jsonwebtoken**: JWT generation/verification
- **helmet**: Security headers
- **drizzle-orm**: SQL injection prevention

Update regularly and monitor security advisories.

---

**Last Updated**: 2026-05-11
**Version**: 1.0
