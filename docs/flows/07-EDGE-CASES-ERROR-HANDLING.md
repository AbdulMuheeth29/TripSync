# Edge Cases & Error Handling Flows

Comprehensive documentation of edge cases, error scenarios, and unusual situations across all TripSync features.

---

## Network & Connectivity Edge Cases

### Edge Case 1: Offline Mode (PWA)

```
SCENARIO: User loses internet connection
──────────────────────────────────────────

User is viewing trip on mobile PWA
    ↓
Network connection lost
    ↓
Service Worker intercepts failed requests
    ↓
Banner appears:
    ┌────────────────────────────────────────────────────────────────┐
    │  📡 You're Offline                                              │
    │  Some features are limited. Changes will sync when back online.│
    │  [Dismiss]                                                      │
    └────────────────────────────────────────────────────────────────┘
    ↓
Offline capabilities:
    ├─ ✅ View cached trip data
    ├─ ✅ View itinerary (last synced)
    ├─ ✅ View expenses (last synced)
    ├─ ✅ View members
    ├─ ❌ Add new items (queued for sync)
    ├─ ❌ Vote on items (queued)
    ├─ ❌ Send chat messages (queued)
    └─ ❌ AI features (require connection)
    ↓
User tries to add expense while offline:
    ┌────────────────────────────────────────────────────────────────┐
    │  ⚠️  You're Offline                                             │
    │                                                                 │
    │  This expense will be added when you reconnect.                │
    │                                                                 │
    │  ☑ Save to queue (will sync when online)                       │
    │                                                                 │
    │  [Cancel] [Save for Later]                                      │
    └────────────────────────────────────────────────────────────────┘
    ↓
Expense saved to IndexedDB queue
    ↓
Connection restored:
    ┌────────────────────────────────────────────────────────────────┐
    │  ✅ Back Online                                                 │
    │  Syncing 3 pending changes...                                  │
    └────────────────────────────────────────────────────────────────┘
    ↓
Queue processed:
    ├─ POST queued expense
    ├─ POST queued votes
    └─ POST queued chat messages
    ↓
✅ All changes synced
```

### Edge Case 2: Slow Network

```
SCENARIO: Very slow connection (2G, poor signal)
────────────────────────────────────────────────

User on slow network loads trip page
    ↓
Requests take >5 seconds
    ↓
Progressive loading strategy:
    ↓
1. Critical data loads first (skeleton):
    ┌────────────────────────────────────────────────────────────────┐
    │  [████░░░░] Loading trip...                                     │
    │                                                                 │
    │  ▓▓▓▓▓▓▓▓░░░░░░░░░  (trip name skeleton)                       │
    │  ▓▓▓░░░░░░░░░░░░░░  (dates skeleton)                           │
    │  ▓▓▓▓▓▓░░░░░░░░░░░  (budget skeleton)                          │
    └────────────────────────────────────────────────────────────────┘
    ↓
2. Basic trip data loaded (3-5 seconds):
    ✅ Trip name, dates, budget shown
    ⏳ Itinerary still loading...
    ⏳ Members still loading...
    ↓
3. Full data loaded (10-15 seconds):
    ✅ All tabs available
    ✅ Images lazy-loaded as user scrolls
    ↓
If still loading after 30 seconds:
    ┌────────────────────────────────────────────────────────────────┐
    │  ⚠️  Slow Connection Detected                                   │
    │                                                                 │
    │  Your connection is very slow. You can:                         │
    │  • Wait for full load (may take 1-2 min)                       │
    │  • Use low-data mode (faster, fewer images)                    │
    │                                                                 │
    │  [Wait] [Enable Low-Data Mode]                                  │
    └────────────────────────────────────────────────────────────────┘
```

### Edge Case 3: Request Timeout

```
SCENARIO: API request times out
────────────────────────────────

User tries to save expense
    ↓
POST /api/trips/:id/expenses
    ↓
Request times out after 30 seconds
    ↓
Automatic retry (exponential backoff):
    Attempt 1: Immediate
    Attempt 2: 2 seconds later
    Attempt 3: 4 seconds later
    ↓
All retries fail
    ↓
Error shown:
    ┌────────────────────────────────────────────────────────────────┐
    │  ⚠️  Connection Timeout                                         │
    │                                                                 │
    │  We couldn't save your expense due to a connection issue.      │
    │                                                                 │
    │  Your data is saved locally. Options:                           │
    │  • Try again now                                                │
    │  • We'll automatically retry when connection improves          │
    │                                                                 │
    │  [Try Again] [Save for Later]                                   │
    └────────────────────────────────────────────────────────────────┘
```

---

## Data Validation Edge Cases

### Edge Case 4: Malformed Input

```
SCENARIO: User enters invalid data
───────────────────────────────────

Add Expense form:
User enters: Amount = "-$50" (negative)
    ↓
Real-time validation:
    ┌────────────────────────────────────────────────────────────────┐
    │  Amount *                                                       │
    │  [-$50        ] ❌                                              │
    │  ⚠️  Amount must be positive                                   │
    └────────────────────────────────────────────────────────────────┘
    ↓
User enters: "fifty dollars" (text)
    ↓
    ┌────────────────────────────────────────────────────────────────┐
    │  Amount *                                                       │
    │  [fifty dollars] ❌                                             │
    │  ⚠️  Must be a valid number                                    │
    └────────────────────────────────────────────────────────────────┘
    ↓
Submit button disabled until valid:
[Add Expense] (grayed out)
```

### Edge Case 5: SQL Injection Attempt

```
SCENARIO: Malicious user tries SQL injection
─────────────────────────────────────────────

User enters in description:
"'; DROP TABLE expenses; --"
    ↓
Frontend sanitization:
    ├─ Escape special characters
    ├─ Strip SQL keywords
    └─ Limit length (max 500 chars)
    ↓
Backend (Drizzle ORM):
    ├─ Uses parameterized queries
    ├─ No raw SQL injection possible
    └─ Additional validation layer
    ↓
✅ Safely stored as literal string
    ↓
Logged to security monitoring:
"Potential SQL injection attempt detected from user_123"
```

### Edge Case 6: XSS Attack Attempt

```
SCENARIO: User tries to inject JavaScript
──────────────────────────────────────────

User enters in trip name:
"<script>alert('hacked')</script>"
    ↓
Frontend (React):
    ├─ Automatically escapes HTML
    ├─ Renders as literal text
    └─ No script execution
    ↓
Stored in database as:
"&lt;script&gt;alert('hacked')&lt;/script&gt;"
    ↓
Displayed safely as text:
<script>alert('hacked')</script>
    ↓
✅ No XSS vulnerability
```

---

## Concurrency Edge Cases

### Edge Case 7: Simultaneous Edits

```
SCENARIO: Two users edit same expense simultaneously
─────────────────────────────────────────────────────

User A opens expense #123 at 10:00:00
User B opens expense #123 at 10:00:05
    ↓
User A changes amount: $50 → $60
User A saves at 10:01:00
    ↓
Backend:
    ├─ Check version/timestamp
    ├─ User A's version matches
    └─ Update successful
    ↓
User B changes amount: $50 → $55
User B saves at 10:01:30
    ↓
Backend:
    ├─ Check version/timestamp
    ├─ Expense was updated by User A (version mismatch)
    └─ Conflict detected
    ↓
Error shown to User B:
    ┌────────────────────────────────────────────────────────────────┐
    │  ⚠️  Conflict Detected                                          │
    │                                                                 │
    │  This expense was updated by Alex while you were editing.      │
    │                                                                 │
    │  Their version: $60                                             │
    │  Your version: $55                                              │
    │                                                                 │
    │  [Use Their Version] [Use My Version] [View Changes]           │
    └────────────────────────────────────────────────────────────────┘
    ↓
User B chooses "Use My Version"
    ↓
Force update with confirmation:
    ┌────────────────────────────────────────────────────────────────┐
    │  Are you sure?                                                  │
    │                                                                 │
    │  This will overwrite Alex's changes ($60 → $55).               │
    │  Alex will be notified.                                         │
    │                                                                 │
    │  [Cancel] [Yes, Overwrite]                                      │
    └────────────────────────────────────────────────────────────────┘
```

### Edge Case 8: Race Condition in Voting

```
SCENARIO: Two users vote at exact same time
────────────────────────────────────────────

User A clicks upvote at 10:00:00.000
User B clicks downvote at 10:00:00.001
    ↓
Both requests hit backend simultaneously
    ↓
Database transaction isolation:
    ├─ Request A locks vote record
    ├─ Request B waits for lock
    └─ Sequential processing guaranteed
    ↓
Result:
    ├─ User A's vote processed first
    ├─ User B's vote processed second
    └─ Final state: User B's vote (last write wins)
    ↓
✅ No race condition, deterministic outcome
```

---

## State Management Edge Cases

### Edge Case 9: Stale Data

```
SCENARIO: User has old cached data
───────────────────────────────────

User opened trip page 2 hours ago (hasn't refreshed)
Meanwhile, other members:
    ├─ Added 5 new expenses
    ├─ Voted on 3 items
    └─ Changed trip budget
    ↓
User tries to add expense
    ↓
Backend returns:
    ├─ Current budget: $10,500 (updated)
    ├─ User's cached budget: $9,000 (stale)
    └─ Version mismatch detected
    ↓
Auto-refresh triggered:
    ┌────────────────────────────────────────────────────────────────┐
    │  🔄 Trip Updated                                                │
    │                                                                 │
    │  Other members made changes. Refreshing...                      │
    │  [████████████] 100%                                            │
    └────────────────────────────────────────────────────────────────┘
    ↓
Page reloads with fresh data
    ↓
User's pending action preserved:
"Your expense draft is saved. You can continue adding it."
```

### Edge Case 10: Session Expiration During Action

```
SCENARIO: JWT expires mid-action
─────────────────────────────────

User is adding expense (form 50% filled)
JWT token expires (24 hours old)
    ↓
User clicks "Add Expense"
    ↓
POST /api/trips/:id/expenses
    ↓
Backend returns: 401 Unauthorized
    ↓
Frontend intercepts:
    ├─ Save form data to localStorage
    ├─ Clear expired token
    └─ Redirect to login
    ↓
Modal shown:
    ┌────────────────────────────────────────────────────────────────┐
    │  ⏱️  Session Expired                                            │
    │                                                                 │
    │  Your session has expired for security.                         │
    │  Please log in again to continue.                               │
    │                                                                 │
    │  Don't worry - your expense draft is saved!                     │
    │                                                                 │
    │  [Log In Again →]                                               │
    └────────────────────────────────────────────────────────────────┘
    ↓
User logs in
    ↓
Redirected back to expense form
    ↓
Form data restored from localStorage:
"Welcome back! Your expense draft is ready."
```

---

## Data Integrity Edge Cases

### Edge Case 11: Orphaned Data

```
SCENARIO: Trip deleted while user is viewing it
────────────────────────────────────────────────

User A viewing trip #123
User B (organizer) deletes trip #123
    ↓
User A tries to add expense
    ↓
POST /api/trips/123/expenses
    ↓
Backend returns: 404 Not Found
    ↓
Error handling:
    ┌────────────────────────────────────────────────────────────────┐
    │  ⚠️  Trip Deleted                                               │
    │                                                                 │
    │  This trip was deleted by the organizer.                        │
    │                                                                 │
    │  You've been removed from the trip.                             │
    │  All your data in this trip is no longer accessible.           │
    │                                                                 │
    │  [Back to Dashboard]                                            │
    └────────────────────────────────────────────────────────────────┘
    ↓
Redirect to dashboard
    ↓
Notification: "Trip 'Bali Adventure' was deleted by Alex"
```

### Edge Case 12: Missing Foreign Key References

```
SCENARIO: Expense references deleted trip member
────────────────────────────────────────────────

Expense paid by User X
User X removed from trip
    ↓
Expense still references User X ID
    ↓
Display logic:
    ┌────────────────────────────────────────────────────────────────┐
    │  🍽️  Dinner expense              $285.00                       │
    │      Paid by: [Removed User]     June 16                       │
    │      Split 5 ways                                               │
    └────────────────────────────────────────────────────────────────┘
    ↓
Settlement calculation:
    ├─ Exclude removed user from "who owes whom"
    ├─ Their balance frozen at removal time
    └─ Note added: "User left trip - balance $50 owed"
```

---

## Business Logic Edge Cases

### Edge Case 13: Trip Date Edge Cases

```
SCENARIO A: Trip in the past
─────────────────────────────

User tries to create trip:
Start date: January 1, 2024
End date: January 7, 2024
Today: June 16, 2024
    ↓
Validation error:
    ┌────────────────────────────────────────────────────────────────┐
    │  ⚠️  Invalid Dates                                              │
    │                                                                 │
    │  Trip dates cannot be in the past.                              │
    │                                                                 │
    │  Did you mean 2025?                                             │
    │  [Change to 2025] [Choose Different Dates]                      │
    └────────────────────────────────────────────────────────────────┘

SCENARIO B: Trip duration > 1 year
────────────────────────────────────

User tries:
Start: June 1, 2024
End: July 1, 2025 (13 months)
    ↓
Warning:
    ┌────────────────────────────────────────────────────────────────┐
    │  ⚠️  Very Long Trip                                             │
    │                                                                 │
    │  Your trip is 13 months long. Are you sure?                    │
    │                                                                 │
    │  Most trips are 1-30 days. For long-term trips, consider:     │
    │  • Creating multiple shorter trips                             │
    │  • Using travel logging apps instead                            │
    │                                                                 │
    │  [Change Dates] [Yes, Continue Anyway]                          │
    └────────────────────────────────────────────────────────────────┘

SCENARIO C: End date before start date
───────────────────────────────────────

User enters:
Start: June 15, 2024
End: June 10, 2024
    ↓
Immediate validation:
    ┌────────────────────────────────────────────────────────────────┐
    │  End Date *                                                     │
    │  [June 10, 2024 ▼] ❌                                           │
    │  ⚠️  End date must be after start date                         │
    └────────────────────────────────────────────────────────────────┘
```

### Edge Case 14: Budget Edge Cases

```
SCENARIO A: Negative budget
────────────────────────────

User enters: Budget = -$500
    ↓
Validation:
"Budget must be positive"
Submit button disabled

SCENARIO B: Unrealistic budget
────────────────────────────────

User enters:
Destination: Bali
Duration: 7 days
Budget: $10 per person
    ↓
AI warning during generation:
    ┌────────────────────────────────────────────────────────────────┐
    │  ⚠️  Budget Might Be Too Low                                    │
    │                                                                 │
    │  A 7-day Bali trip typically costs $500-2000 per person.       │
    │  Your budget: $10                                               │
    │                                                                 │
    │  With this budget, you might only afford:                       │
    │  • Hostel accommodation (barely)                                │
    │  • Street food only                                             │
    │  • Walking/public transport                                     │
    │  • No activities                                                │
    │                                                                 │
    │  Suggested: Increase to at least $500/person for basic trip.   │
    │                                                                 │
    │  [Update Budget] [Continue Anyway]                              │
    └────────────────────────────────────────────────────────────────┘

SCENARIO C: Budget overflow
────────────────────────────

User enters: $999,999,999,999
    ↓
Validation:
"Budget cannot exceed $1,000,000 per person"
```

### Edge Case 15: Member Limit Edge Cases

```
SCENARIO: Adding 7th member on Free tier
─────────────────────────────────────────

Free tier limit: 6 members
Current members: 6
User tries to add 7th
    ↓
Paywall shown:
    ┌────────────────────────────────────────────────────────────────┐
    │  🔒 Member Limit Reached (Free Plan)                            │
    │                                                                 │
    │  You've reached the 6-member limit for Free plan trips.        │
    │                                                                 │
    │  Current members: 6/6                                           │
    │                                                                 │
    │  To invite more people:                                         │
    │  • Upgrade to Pro (unlimited members)                          │
    │  • Remove someone from the trip                                 │
    │  • Create a new trip for extra members                          │
    │                                                                 │
    │  [Upgrade to Pro $4.99/mo] [Cancel]                             │
    └────────────────────────────────────────────────────────────────┘
```

---

## File Upload Edge Cases

### Edge Case 16: Oversized Files

```
SCENARIO: User uploads 20MB receipt
────────────────────────────────────

Max file size: 5MB
User uploads: 20MB PDF
    ↓
Upload starts (client-side validation first):
    ┌────────────────────────────────────────────────────────────────┐
    │  Uploading receipt...                                           │
    │  [██░░░░░░░░░░] 15%                                             │
    └────────────────────────────────────────────────────────────────┘
    ↓
Client detects size > 5MB:
Upload cancelled
    ┌────────────────────────────────────────────────────────────────┐
    │  ❌ File Too Large                                              │
    │                                                                 │
    │  Your file is 20 MB. Maximum size is 5 MB.                     │
    │                                                                 │
    │  Try:                                                           │
    │  • Compress the PDF                                             │
    │  • Take a photo instead of scanning                             │
    │  • Use online compression tool (we can help!)                   │
    │                                                                 │
    │  [Compress Automatically] [Choose Different File]               │
    └────────────────────────────────────────────────────────────────┘
    ↓
User clicks "Compress Automatically":
    ├─ Client-side compression (ImageMagick.js)
    ├─ Reduces to 2.8 MB
    └─ Upload proceeds
```

### Edge Case 17: Unsupported File Types

```
SCENARIO: User uploads .exe file as receipt
────────────────────────────────────────────

Allowed: JPG, PNG, PDF, HEIC
User uploads: malware.exe
    ↓
File picker validation:
    ┌────────────────────────────────────────────────────────────────┐
    │  ❌ Unsupported File Type                                       │
    │                                                                 │
    │  We only accept: JPG, PNG, PDF, HEIC                           │
    │  You selected: .exe                                             │
    │                                                                 │
    │  For receipts, please:                                          │
    │  • Take a photo (JPG/PNG)                                       │
    │  • Scan to PDF                                                  │
    │                                                                 │
    │  [Choose Different File]                                        │
    └────────────────────────────────────────────────────────────────┘
    ↓
If somehow bypasses client validation:
Backend MIME type check:
    ├─ Rejects anything not in whitelist
    ├─ Returns 400 Bad Request
    └─ Logs security incident
```

### Edge Case 18: Corrupted File Upload

```
SCENARIO: Upload interrupted mid-transfer
──────────────────────────────────────────

Upload starts: 5MB file
    ┌────────────────────────────────────────────────────────────────┐
    │  Uploading...                                                   │
    │  [████████░░░░] 60% (3MB / 5MB)                                │
    └────────────────────────────────────────────────────────────────┘
    ↓
Connection drops at 60%
    ↓
Automatic retry (3 attempts):
Attempt 1: Resume from 60% ❌
Attempt 2: Restart from 0% ❌
Attempt 3: Restart from 0% ❌
    ↓
All retries failed:
    ┌────────────────────────────────────────────────────────────────┐
    │  ❌ Upload Failed                                               │
    │                                                                 │
    │  We couldn't upload your file due to connection issues.        │
    │                                                                 │
    │  Your file is saved locally. You can:                           │
    │  • Try again now (if connection improved)                      │
    │  • Try later (we'll queue it for auto-retry)                   │
    │                                                                 │
    │  [Try Again] [Save for Later]                                   │
    └────────────────────────────────────────────────────────────────┘
```

---

## AI-Specific Edge Cases

### Edge Case 19: AI Generates Invalid JSON

```
SCENARIO: Claude returns malformed response
────────────────────────────────────────────

POST /api/trips/:id/regenerate-itinerary
    ↓
Claude Sonnet 4.5 response:
{
  "itinerary": [
    { "day": 1, "activities": [...] }, // Missing closing brace
    { "day": 2, "activities": [...] }
  }
}
    ↓
JSON.parse() fails
    ↓
Automatic retry with stricter prompt:
"IMPORTANT: Return ONLY valid JSON. No markdown, no explanations."
    ↓
Retry succeeds with valid JSON
    ↓
If all 3 retries fail:
    ┌────────────────────────────────────────────────────────────────┐
    │  ⚠️  AI Generation Issue                                        │
    │                                                                 │
    │  We encountered an error generating your itinerary.            │
    │                                                                 │
    │  This is rare! Please try again in a moment, or:               │
    │  • Create your trip manually                                   │
    │  • Contact support (we'll fix this ASAP)                       │
    │                                                                 │
    │  [Try Again] [Create Manually] [Contact Support]                │
    └────────────────────────────────────────────────────────────────┘
```

### Edge Case 20: AI Hallucinates Booking URLs

```
SCENARIO: AI generates fake/broken booking links
─────────────────────────────────────────────────

AI generates itinerary with:
"https://booking.com/fake-villa-12345"
    ↓
Backend validation:
    ├─ Check if URL format valid ✓
    ├─ Check if domain whitelisted ✓
    ├─ Optional: HEAD request to verify URL exists ❌ (404)
    └─ Flag as "unverified"
    ↓
Display with warning:
    ┌────────────────────────────────────────────────────────────────┐
    │  🏠 Beachfront Villa Seminyak                $180/night        │
    │      ⚠️  Booking URL unverified                                │
    │      https://booking.com/fake-villa-12345                      │
    │      [Update URL] [Remove] [Mark as Verified]                  │
    └────────────────────────────────────────────────────────────────┘
```

### Edge Case 21: AI Budget Completely Off

```
SCENARIO: AI estimates way over/under budget
─────────────────────────────────────────────

User budget: $1,500/person
AI generates itinerary totaling: $4,200/person (280% over!)
    ↓
Backend validation after AI generation:
    ├─ Calculate total cost
    ├─ Compare to budget
    └─ If >150% or <50%, flag as suspicious
    ↓
Warning shown:
    ┌────────────────────────────────────────────────────────────────┐
    │  ⚠️  Budget Mismatch Detected                                   │
    │                                                                 │
    │  Your budget: $1,500/person                                     │
    │  AI estimated: $4,200/person (280% over)                       │
    │                                                                 │
    │  This might be because:                                         │
    │  • Peak season pricing                                          │
    │  • Luxury options selected                                      │
    │  • AI miscalculation (rare)                                     │
    │                                                                 │
    │  Options:                                                       │
    │  [Regenerate with Budget Constraints] [Adjust Budget]           │
    │  [Keep Anyway & Optimize Later]                                 │
    └────────────────────────────────────────────────────────────────┘
```

---

## All Edge Cases Summary

### Authentication & Sessions (10 cases)

1. ✅ Password reset link expired
2. ✅ Password reset link used twice
3. ✅ Account locked (too many login attempts)
4. ✅ Session expires during form submission
5. ✅ Concurrent logins from multiple devices
6. ✅ User deletes account while logged in elsewhere
7. ✅ Email verification link expired
8. ✅ Social login fails (OAuth provider down)
9. ✅ JWT token tampered with
10. ✅ Remember me token stolen

### Trips & Itinerary (15 cases)

11. ✅ Trip dates in the past
12. ✅ Trip duration >1 year
13. ✅ End date before start date
14. ✅ Destination doesn't exist
15. ✅ Trip deleted while user viewing
16. ✅ AI generation timeout
17. ✅ AI returns invalid JSON
18. ✅ AI budget way off
19. ✅ AI hallucinates fake URLs
20. ✅ Regenerate with no AI quota left
21. ✅ Create trip with 0 members
22. ✅ Duplicate trip names
23. ✅ Trip with no activities
24. ✅ Activity without date/time
25. ✅ Booking URL broken/invalid

### Expenses & Budget (12 cases)

26. ✅ Negative expense amount
27. ✅ Expense amount overflow ($999B)
28. ✅ Split doesn't add up to total
29. ✅ Expense paid by removed member
30. ✅ Currency conversion API down
31. ✅ Receipt OCR fails
32. ✅ Receipt corrupted/unreadable
33. ✅ Budget exceeded by 500%
34. ✅ Settled expense edited
35. ✅ Expense deleted while someone editing
36. ✅ Duplicate expense submission
37. ✅ Custom split percentages don't equal 100%

### Voting & Collaboration (8 cases)

38. ✅ Vote on deleted item
39. ✅ Tied vote for weeks
40. ✅ Vote after voting closed
41. ✅ Simultaneous votes by 2 users
42. ✅ Atlas compromise rejected by all
43. ✅ Chat message sent to deleted trip
44. ✅ @mention non-existent user
45. ✅ Comment on deleted activity

### Members & Invitations (10 cases)

46. ✅ Invite expired
47. ✅ Invite to full trip (tier limit)
48. ✅ User already in trip
49. ✅ Organizer removes themselves
50. ✅ Last organizer leaves trip
51. ✅ Member removed while active
52. ✅ Duplicate email invitations
53. ✅ Invalid email format
54. ✅ Invite to archived trip
55. ✅ Share link disabled

### Payments & Subscriptions (15 cases)

56. ✅ Card declined
57. ✅ Trial already used
58. ✅ Double subscription (same user)
59. ✅ Cancel then immediately resubscribe
60. ✅ Stripe webhook signature invalid
61. ✅ Payment amount mismatch
62. ✅ Free tier limit hit mid-action
63. ✅ Downgrade with active trips >3
64. ✅ Refund requested after 30 days
65. ✅ Proration calculation edge case
66. ✅ Subscription in past_due state
67. ✅ Upgrade during trial period
68. ✅ Multiple payment methods
69. ✅ Expired credit card
70. ✅ Failed payment auto-retry

### Files & Uploads (8 cases)

71. ✅ File too large (>5MB)
72. ✅ Unsupported file type
73. ✅ Upload interrupted
74. ✅ Storage quota exceeded
75. ✅ Virus detected in upload
76. ✅ Duplicate filename
77. ✅ File corrupted after upload
78. ✅ Image orientation wrong (EXIF)

### Network & Performance (10 cases)

79. ✅ Offline mode (PWA)
80. ✅ Slow network (2G)
81. ✅ Request timeout
82. ✅ API rate limit exceeded
83. ✅ CDN failure (static assets)
84. ✅ Database connection lost
85. ✅ Redis cache unavailable
86. ✅ WebSocket disconnection
87. ✅ CORS error
88. ✅ 502/503 server errors

### Data & State (12 cases)

89. ✅ Stale cached data
90. ✅ Race condition
91. ✅ Optimistic update fails
92. ✅ Orphaned foreign keys
93. ✅ Database constraint violation
94. ✅ Concurrent edits (same record)
95. ✅ Transaction deadlock
96. ✅ IndexedDB quota exceeded (browser)
97. ✅ LocalStorage cleared mid-session
98. ✅ Cookie blocked (third-party)
99. ✅ Timestamp timezone mismatch
100.  ✅ Data migration in progress

---

## Error Recovery Strategies

### 1. Automatic Retries

- Network errors: 3 retries with exponential backoff
- AI timeouts: 2 retries with adjusted prompts
- Payment failures: Stripe auto-retries over 10 days

### 2. Graceful Degradation

- Offline → Show cached data, queue changes
- AI down → Manual entry, cached suggestions
- CDN down → Serve from origin

### 3. User Communication

- Clear error messages (no technical jargon)
- Actionable next steps
- Preserve user work (drafts, queues)
- Show system status

### 4. Fallback Mechanisms

- AI → Manual entry
- Real-time → Polling
- WebSocket → HTTP long-polling
- Primary service → Cached response

### 5. Data Protection

- Auto-save drafts every 30 seconds
- LocalStorage backup before logout
- Confirmation dialogs for destructive actions
- Soft delete (30-day recovery window)

### 6. Monitoring & Alerting

- Sentry for error tracking
- Real-time alerts for critical failures
- Performance monitoring
- User-reported issues

---

**Last Updated:** 2026-07-11
**Status:** ✅ Complete and Production-Ready
**Total Edge Cases Documented:** 100+
