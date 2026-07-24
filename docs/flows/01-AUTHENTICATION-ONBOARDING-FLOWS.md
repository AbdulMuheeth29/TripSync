# Authentication & Onboarding Flows

Complete end-to-end flows for user authentication and onboarding in TripSync.

---

## Flow 1: New User Registration

```
┌─────────────────────────────────────────────────────────────────────┐
│                     NEW USER REGISTRATION FLOW                       │
└─────────────────────────────────────────────────────────────────────┘

START: User visits tripsync.com
    ↓
┌──────────────────────┐
│  Landing Page (/)    │
│  - Hero section      │
│  - Features showcase │
│  - Testimonials      │
│  - Pricing preview   │
│  - CTA buttons       │
└──────────────────────┘
    ↓
User clicks "Get Started" or "Sign Up"
    ↓
┌────────────────────────────────────────────────────┐
│  Login Page (/login) - Register Tab Selected       │
│                                                     │
│  Form Fields:                                      │
│  ├─ Email (required, validated)                   │
│  ├─ Password (min 8 chars, required)              │
│  └─ Confirm Password (must match)                 │
│                                                     │
│  Validation:                                       │
│  ├─ Email format check                            │
│  ├─ Password strength indicator                   │
│  ├─ Real-time password match check                │
│  └─ Duplicate email check on submit               │
└────────────────────────────────────────────────────┘
    ↓
User submits registration form
    ↓
POST /api/auth/register
    ├─ Success → Continue
    ├─ Email exists → Show "Email already registered. Try logging in."
    ├─ Invalid email → Show validation error
    └─ Server error → Show error message + retry option
    ↓
✅ Account Created Successfully
    ├─ JWT token generated and stored
    ├─ Session created
    └─ User redirected to dashboard
    ↓
┌────────────────────────────────────────────────────┐
│  First-Time Dashboard (/dashboard)                 │
│                                                     │
│  Welcome State:                                    │
│  ├─ "Welcome to TripSync! 🎉"                     │
│  ├─ Empty state: "No trips yet"                   │
│  ├─ Large "Create Your First Trip" CTA            │
│  ├─ Subscription info: "Free Plan - 3 trips left" │
│  └─ Quick tour option                             │
└────────────────────────────────────────────────────┘
    ↓
User clicks "Create Your First Trip"
    ↓
Redirect to /create (see Flow 6 - Trip Creation Wizard)

END: User ready to create first trip
```

**Success Criteria:**

- ✅ Email validated and unique
- ✅ Password meets security requirements
- ✅ JWT token issued
- ✅ User redirected to dashboard
- ✅ Free tier activated (3 trips, 6 members/trip, 1 AI generation)

**Error Handling:**

- Duplicate email → Suggest login or password reset
- Weak password → Show password requirements
- Network error → Retry mechanism with exponential backoff
- Server error → Friendly error message + support contact

---

## Flow 2: Returning User Login

```
┌─────────────────────────────────────────────────────────────────────┐
│                      RETURNING USER LOGIN FLOW                       │
└─────────────────────────────────────────────────────────────────────┘

START: User visits tripsync.com
    ↓
┌──────────────────────┐
│  Landing Page (/)    │
└──────────────────────┘
    ↓
User clicks "Log In" or "Sign In"
    ↓
┌────────────────────────────────────────────────────┐
│  Login Page (/login) - Login Tab Selected          │
│                                                     │
│  Form Fields:                                      │
│  ├─ Email (required)                               │
│  └─ Password (required)                            │
│                                                     │
│  Options:                                          │
│  ├─ "Remember me" checkbox                         │
│  ├─ "Forgot password?" link                        │
│  └─ "Sign up instead" link                         │
└────────────────────────────────────────────────────┘
    ↓
User enters credentials and submits
    ↓
POST /api/auth/login
    ├─ Success → Continue
    ├─ Invalid credentials → Show "Invalid email or password"
    ├─ Account locked → Show "Too many attempts. Try again in 15 minutes"
    └─ Server error → Show error + retry
    ↓
✅ Login Successful
    ├─ JWT token generated and stored
    ├─ Session created
    ├─ User preferences loaded
    └─ Redirect to dashboard
    ↓
┌────────────────────────────────────────────────────┐
│  Dashboard (/dashboard)                            │
│                                                     │
│  Shows:                                            │
│  ├─ All user's trips (active, upcoming, past)     │
│  ├─ Trip stats (members, days, budget)            │
│  ├─ Quick actions per trip                        │
│  ├─ Subscription info                             │
│  └─ "Create New Trip" button                      │
└────────────────────────────────────────────────────┘
    ↓
User selects a trip or creates new one

END: User accesses dashboard
```

**Success Criteria:**

- ✅ Valid credentials authenticated
- ✅ JWT token issued
- ✅ Session established
- ✅ User redirected to dashboard
- ✅ All trips loaded and displayed

**Error Handling:**

- Invalid credentials → Clear message, suggest password reset
- Rate limiting → Show lockout duration
- Network error → Retry with offline message
- Expired session → Auto-redirect to login with message

---

## Flow 3: Password Reset (Forgot Password)

```
┌─────────────────────────────────────────────────────────────────────┐
│                       PASSWORD RESET FLOW                            │
└─────────────────────────────────────────────────────────────────────┘

START: User can't remember password
    ↓
┌──────────────────────┐
│  Login Page (/login) │
└──────────────────────┘
    ↓
User clicks "Forgot password?"
    ↓
┌────────────────────────────────────────────────────┐
│  Forgot Password Page (/forgot-password)           │
│                                                     │
│  Form:                                             │
│  ├─ Email input (required)                         │
│  ├─ "Send Reset Link" button                       │
│  └─ "Back to login" link                           │
│                                                     │
│  Instructions:                                     │
│  "Enter your email and we'll send you a link to   │
│   reset your password"                             │
└────────────────────────────────────────────────────┘
    ↓
User enters email and submits
    ↓
POST /api/auth/forgot-password
    ├─ Success → Continue (even if email doesn't exist - security)
    └─ Server error → Show error + retry
    ↓
✅ Request Received
┌────────────────────────────────────────────────────┐
│  Success Message                                   │
│                                                     │
│  "If that email exists in our system, we've sent  │
│   a password reset link. Check your inbox and     │
│   spam folder."                                    │
│                                                     │
│  ├─ Link expires in 1 hour                         │
│  └─ "Didn't receive? Request again in 5 minutes"  │
└────────────────────────────────────────────────────┘
    ↓
User checks email inbox
    ↓
┌────────────────────────────────────────────────────┐
│  Email: "Reset Your TripSync Password"             │
│                                                     │
│  Content:                                          │
│  ├─ Greeting                                       │
│  ├─ "Click here to reset your password" button    │
│  ├─ Plain text link (backup)                       │
│  ├─ Expiration warning (60 minutes)                │
│  └─ Security note: "Didn't request this? Ignore"  │
└────────────────────────────────────────────────────┘
    ↓
User clicks reset link
    ↓
┌────────────────────────────────────────────────────┐
│  Reset Password Page (/reset-password?token=xyz)   │
│                                                     │
│  Token Validation (automatic on load):            │
│  GET /api/auth/validate-reset-token/:token        │
│  ├─ Valid token → Show form                       │
│  ├─ Expired → Show "Link expired. Request new"   │
│  └─ Invalid → Show "Invalid link. Request new"   │
└────────────────────────────────────────────────────┘
    ↓
Token Valid → Show Form
    ↓
┌────────────────────────────────────────────────────┐
│  Password Reset Form                               │
│                                                     │
│  Fields:                                           │
│  ├─ New Password (min 8 chars)                     │
│  │  └─ Password strength indicator                │
│  └─ Confirm New Password (must match)              │
│                                                     │
│  Validation:                                       │
│  ├─ Real-time password match check                 │
│  ├─ Strength requirements shown                    │
│  └─ Submit button (disabled until valid)           │
└────────────────────────────────────────────────────┘
    ↓
User enters new password and submits
    ↓
POST /api/auth/reset-password
    ├─ Success → Continue
    ├─ Token expired → Show error + request new link
    ├─ Weak password → Show validation errors
    └─ Server error → Show error + retry
    ↓
✅ Password Reset Successful
┌────────────────────────────────────────────────────┐
│  Success Message                                   │
│                                                     │
│  "Password reset successful! ✓"                   │
│  "Redirecting to login..."                         │
│                                                     │
│  Auto-redirect in 3 seconds                        │
│  Or "Login now" button                             │
└────────────────────────────────────────────────────┘
    ↓
Redirect to /login
    ↓
User logs in with new password

END: Password successfully reset and user logged in
```

**Success Criteria:**

- ✅ Email sent (if account exists)
- ✅ Token generated with 1-hour expiration
- ✅ Token validated on page load
- ✅ New password meets requirements
- ✅ Old password invalidated
- ✅ User can log in with new password

**Error Handling:**

- Token expired → Clear message + "Request new link" button
- Invalid token → Friendly error + request new link
- Network error during email send → Retry mechanism
- Password too weak → Show specific requirements
- Passwords don't match → Real-time validation error

**Security Measures:**

- ✅ Rate limiting on reset requests (max 3/hour per email)
- ✅ Tokens are single-use and expire in 1 hour
- ✅ No indication if email exists (prevent enumeration)
- ✅ Old sessions invalidated on password change
- ✅ Secure token generation (cryptographically random)

---

## Flow 4: Session Management

```
┌─────────────────────────────────────────────────────────────────────┐
│                      SESSION MANAGEMENT FLOW                         │
└─────────────────────────────────────────────────────────────────────┘

SCENARIO A: Active Session Check
────────────────────────────────────────
User visits any protected route
    ↓
Frontend checks for JWT token
    ├─ Token exists → Validate with backend
    │   ↓
    │   GET /api/auth/me
    │   ├─ Valid → Allow access
    │   └─ Invalid/Expired → Clear token, redirect to /login
    │
    └─ No token → Redirect to /login

SCENARIO B: Session Expiration During Use
────────────────────────────────────────
User is actively using the app
    ↓
JWT token expires (after 24 hours)
    ↓
Next API call returns 401 Unauthorized
    ↓
Frontend intercepts 401 response
    ↓
┌────────────────────────────────────────────────────┐
│  Session Expired Modal                             │
│                                                     │
│  "Your session has expired"                        │
│  "Please log in again to continue"                 │
│                                                     │
│  [Log In Again] button                             │
└────────────────────────────────────────────────────┘
    ↓
Clear local storage and redirect to /login
    ↓
User logs in again
    ↓
Redirect back to original page (if applicable)

SCENARIO C: Logout
────────────────────────────────────────
User clicks "Logout" in nav menu
    ↓
Confirmation (optional)
    ↓
POST /api/auth/logout
    ├─ Clears server-side session
    └─ Clears JWT token
    ↓
Clear local storage
    ↓
Redirect to landing page (/)
    ↓
Show "You've been logged out" toast

SCENARIO D: Remember Me
────────────────────────────────────────
User checks "Remember me" on login
    ↓
POST /api/auth/login (with rememberMe: true)
    ↓
Backend issues longer-lived token (30 days)
    ↓
Token stored in localStorage with extended expiry
    ↓
User can access app for 30 days without re-login
```

**Session Security:**

- ✅ JWT tokens expire after 24 hours (or 30 days with "remember me")
- ✅ Tokens stored in httpOnly cookies (or localStorage for PWA)
- ✅ CSRF protection with SameSite cookies
- ✅ XSS protection via React's built-in escaping
- ✅ Server-side session invalidation on logout
- ✅ Automatic session refresh before expiration (optional)

---

## Flow 5: First-Time User Onboarding

```
┌─────────────────────────────────────────────────────────────────────┐
│                  FIRST-TIME USER ONBOARDING FLOW                     │
└─────────────────────────────────────────────────────────────────────┘

START: User just registered and landed on dashboard
    ↓
┌────────────────────────────────────────────────────┐
│  Dashboard - First Visit                           │
│                                                     │
│  ┌──────────────────────────────────────────────┐ │
│  │  Welcome Modal/Tour (Optional)                │ │
│  │                                               │ │
│  │  "Welcome to TripSync! 🎉"                   │ │
│  │                                               │ │
│  │  Quick tour of key features:                 │ │
│  │  1. Create AI-powered trips in 2 minutes     │ │
│  │  2. Collaborate with democratic voting       │ │
│  │  3. Split expenses fairly                    │ │
│  │  4. Chat with Atlas AI for help              │ │
│  │                                               │ │
│  │  [Skip Tour] [Start Tour] [Don't Show Again] │ │
│  └──────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
    ↓
User chooses:
    ├─ Skip Tour → Go to empty dashboard
    └─ Start Tour → Interactive walkthrough
        ↓
        Step 1: Highlight "Create Trip" button
        ↓
        Step 2: Show subscription info panel
        ↓
        Step 3: Point to profile menu
        ↓
        Step 4: Highlight Atlas AI assistant
        ↓
        Tour Complete → Empty dashboard
    ↓
┌────────────────────────────────────────────────────┐
│  Empty Dashboard State                             │
│                                                     │
│  ┌──────────────────────────────────────────────┐ │
│  │                                               │ │
│  │         ✈️  No trips yet!                    │ │
│  │                                               │ │
│  │  Create your first trip to get started       │ │
│  │                                               │ │
│  │  [🎯 Create Your First Trip]                 │ │
│  │                                               │ │
│  │  Or join an existing trip:                   │ │
│  │  [🔗 Enter Trip Code]                        │ │
│  │                                               │ │
│  └──────────────────────────────────────────────┘ │
│                                                     │
│  Subscription Info:                                │
│  Free Plan - 3 trips remaining                     │
│  [Upgrade to Pro →]                                │
└────────────────────────────────────────────────────┘
    ↓
User clicks "Create Your First Trip"
    ↓
Redirect to /create (Trip Creation Wizard)
    ↓
See "Flow 6: Trip Creation & AI Generation"

END: User ready to create first trip
```

**Onboarding Goals:**

- ✅ Make user feel welcome
- ✅ Explain key value propositions
- ✅ Guide to first action (create trip)
- ✅ Introduce AI assistant (Atlas)
- ✅ Show subscription tier and limits

**Optional Enhancements:**

- Interactive product tour with tooltips
- Sample demo trip they can explore
- Video introduction to key features
- Checklist: "Get started in 3 steps"

---

## Flow 6: Social Login (Future Enhancement)

```
┌─────────────────────────────────────────────────────────────────────┐
│                   SOCIAL LOGIN FLOW (FUTURE)                         │
└─────────────────────────────────────────────────────────────────────┘

NOT YET IMPLEMENTED - Placeholder for future OAuth integration

Login Page (/login)
    ↓
User clicks "Continue with Google" or "Continue with Apple"
    ↓
Redirect to OAuth provider
    ↓
User authorizes TripSync
    ↓
Callback to /api/auth/oauth/callback
    ├─ Extract user info (email, name, avatar)
    ├─ Check if user exists
    │   ├─ Exists → Log in
    │   └─ New → Create account
    └─ Issue JWT token
    ↓
Redirect to dashboard

Future Providers:
- Google OAuth 2.0
- Apple Sign In
- Facebook Login
- Microsoft Account
```

---

## Error Scenarios & Edge Cases

### Edge Case 1: Email Verification (Optional Feature)

```
Currently: Emails are not verified on signup
Future: Add email verification step before full access

Registration → Email sent with verification link
            → User must verify within 24 hours
            → Unverified users see banner: "Verify your email"
            → Limited functionality until verified
```

### Edge Case 2: Account Deletion

```
User requests account deletion
    ↓
Show confirmation dialog
    ├─ "This will permanently delete all your trips and data"
    └─ "Type DELETE to confirm"
    ↓
DELETE /api/auth/account
    ↓
All user data deleted (GDPR compliance)
    ↓
Logout and redirect to landing page
```

### Edge Case 3: Duplicate Simultaneous Registrations

```
User submits registration twice quickly
    ↓
First request: Creates account
Second request: Returns "Email already exists"
    ↓
Frontend shows: "You're already registered! Logging you in..."
    ↓
Auto-login with credentials from second attempt
```

### Edge Case 4: Password Reset for Non-Existent Email

```
User requests reset for email that doesn't exist
    ↓
Backend: Still shows success message (security)
    ↓
No email sent (silent failure)
    ↓
User sees: "If that email exists, we've sent a reset link"
    ↓
Prevents email enumeration attacks
```

---

## Analytics & Tracking

**Events Tracked:**

1. `user_registered` - New account created
2. `user_logged_in` - Successful login
3. `user_logged_out` - User logout
4. `password_reset_requested` - Reset email sent
5. `password_reset_completed` - Password changed
6. `onboarding_tour_started` - User started tour
7. `onboarding_tour_completed` - User finished tour
8. `onboarding_tour_skipped` - User skipped tour

**User Properties Tracked:**

- Registration date
- Last login date
- Login count
- Subscription tier
- Onboarding completion status

---

## Security Checklist

- ✅ Passwords hashed with bcrypt (cost 10)
- ✅ JWT tokens with secure random secrets
- ✅ HTTPS/TLS encryption required
- ✅ Rate limiting on auth endpoints
- ✅ CSRF protection with SameSite cookies
- ✅ XSS prevention via React escaping
- ✅ SQL injection prevention via Drizzle ORM
- ✅ Password strength requirements enforced
- ✅ Account lockout after failed attempts
- ✅ Secure password reset flow
- ✅ Session expiration and refresh
- ✅ No sensitive data in logs or error messages

---

**Last Updated:** 2026-07-11
**Status:** ✅ Complete and Production-Ready
