# Collaboration & Voting Flows

Complete end-to-end flows for group collaboration, democratic voting, chat, and member management in TripSync.

---

## Flow 1: Democratic Voting on Activities

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DEMOCRATIC VOTING FLOW                            │
└─────────────────────────────────────────────────────────────────────┘

User on Trip Detail Page → Itinerary Tab
    ↓
Viewing list of activities for Day 2:
    ┌────────────────────────────────────────────────────────────────┐
    │  Day 2: June 16 - Beach & Culture                              │
    │  ────────────────────────────────────────────────────────────  │
    │                                                                 │
    │  10:00 AM - Tanah Lot Temple Tour                              │
    │  📍 Tanah Lot, Tabanan    💰 $25/person                        │
    │                                                                 │
    │  Votes: 👍 4  👎 1  ⚪ 1  (6 members)                          │
    │  ├─ Sarah: 👍                                                  │
    │  ├─ Mike: 👍                                                   │
    │  ├─ Emma: 👍                                                   │
    │  ├─ John: 👍                                                   │
    │  ├─ Lisa: 👎  "Too hot at midday"                             │
    │  └─ You: [Vote now]                                            │
    │                                                                 │
    │  [👍 Upvote] [👎 Downvote] [⚪ Abstain] [💬 2 Comments]       │
    └────────────────────────────────────────────────────────────────┘
    ↓
User clicks "👍 Upvote"
    ↓
POST /api/trips/:tripId/items/:itemId/vote
Body: { vote: "upvote" }
    ↓
Backend processing:
    ├─ Check if user already voted
    │   ├─ If yes: Update existing vote
    │   └─ If no: Create new vote
    ├─ Recalculate vote totals
    ├─ Update item status based on votes
    └─ Notify other members (optional)
    ↓
✅ Vote recorded
    ↓
UI updates in real-time (WebSocket):
    ┌────────────────────────────────────────────────────────────────┐
    │  10:00 AM - Tanah Lot Temple Tour                              │
    │  📍 Tanah Lot, Tabanan    💰 $25/person                        │
    │                                                                 │
    │  Votes: 👍 5  👎 1  ⚪ 0  (6 members)                          │
    │  ├─ Sarah: 👍                                                  │
    │  ├─ Mike: 👍                                                   │
    │  ├─ Emma: 👍                                                   │
    │  ├─ John: 👍                                                   │
    │  ├─ Lisa: 👎  "Too hot at midday"                             │
    │  └─ You: 👍  ← Just voted                                      │
    │                                                                 │
    │  ✅ APPROVED (83% upvotes)                                     │
    │  This activity is locked in!                                    │
    └────────────────────────────────────────────────────────────────┘
    ↓
Other members see notification:
"Alex voted 👍 on Tanah Lot Temple Tour"

END: Vote cast and reflected in real-time
```

**Voting Rules:**
- ✅ Each member gets one vote per item
- ✅ Can change vote anytime before deadline
- ✅ Three vote options: Upvote, Downvote, Abstain
- ✅ Abstain = neutral (doesn't count toward approval)
- ✅ Item status based on vote percentage:
  - ≥70% upvotes → "Approved" (green badge)
  - 40-69% upvotes → "Under Discussion" (yellow badge)
  - <40% upvotes → "Not Approved" (red badge)

**Vote Status Indicators:**
```
🟢 Approved: 70%+ upvotes, locked into itinerary
🟡 Under Discussion: 40-69% upvotes, needs more consensus
🔴 Not Approved: <40% upvotes, consider removing
⚪ Pending Votes: Not all members voted yet
```

---

## Flow 2: Vote Deadlock & AI Resolution

```
┌─────────────────────────────────────────────────────────────────────┐
│                   VOTE DEADLOCK RESOLUTION FLOW                      │
└─────────────────────────────────────────────────────────────────────┘

SCENARIO: Activity has tied votes for >24 hours
    ↓
Activity state:
    ┌────────────────────────────────────────────────────────────────┐
    │  1:00 PM - Museum vs Beach Day                                 │
    │                                                                 │
    │  Option A: Visit Bali Museum                                   │
    │  Votes: 👍 3  👎 3  ⚪ 0                                        │
    │                                                                 │
    │  Option B: Relax at Seminyak Beach                             │
    │  Votes: 👍 3  👎 3  ⚪ 0                                        │
    │                                                                 │
    │  ⚠️  DEADLOCK (tied for 24+ hours)                             │
    │  Atlas AI can suggest a compromise                              │
    │                                                                 │
    │  [🤖 Ask Atlas for Help]                                        │
    └────────────────────────────────────────────────────────────────┘
    ↓
OPTION 1: Atlas AI Proactive Intervention
────────────────────────────────────────────
Atlas monitoring detects deadlock
    ↓
POST /api/trips/:tripId/atlas/suggest-resolution
    ↓
Claude Sonnet 4.5 analyzes:
    ├─ Vote history and member preferences
    ├─ Trip vibe and budget constraints
    ├─ Time of day and schedule flow
    └─ Member comments/feedback
    ↓
AI generates compromise suggestion
    ↓
Atlas posts in trip chat:
    ┌────────────────────────────────────────────────────────────────┐
    │  🤖 Atlas AI                                    Just now        │
    │  ──────────────────────────────────────────────────────────    │
    │                                                                 │
    │  I noticed the museum vs beach vote has been tied for 24      │
    │  hours. Here's a compromise that works for everyone:           │
    │                                                                 │
    │  **Split-Day Option:**                                          │
    │  • 10:00 AM - 1:00 PM: Bali Museum visit (½ day)              │
    │  • 2:00 PM - 6:00 PM: Seminyak Beach relaxation                │
    │                                                                 │
    │  This way:                                                      │
    │  ✓ Culture lovers get museum time                              │
    │  ✓ Beach fans get afternoon by the ocean                       │
    │  ✓ Fits within budget ($15/person for museum)                  │
    │  ✓ Makes sense time-wise (morning culture, afternoon rest)    │
    │                                                                 │
    │  [👍 Accept Compromise] [👎 Keep Discussing] [💬 Reply]       │
    └────────────────────────────────────────────────────────────────┘
    ↓
Members vote on compromise:
    ├─ ≥50% accept → Compromise implemented
    │   ↓
    │   Original items replaced with compromise
    │   Both activities added to itinerary (split)
    │   Status: "Resolved by Atlas AI"
    │   ↓
    │   Success notification:
    │   "✅ Deadlock resolved! Split-day plan added to itinerary."
    │
    └─ <50% accept → Continue discussing
        ↓
        Atlas: "Okay, I'll check back later.
                Let me know if you need more suggestions!"

OPTION 2: Manual Resolution Request
────────────────────────────────────
Trip organizer clicks "Ask Atlas for Help"
    ↓
Same AI resolution process as above
    ↓
Atlas provides compromise in chat

END: Deadlock resolved or alternative suggested
```

**AI Compromise Strategies:**
1. **Split-Day**: Do both activities at different times
2. **Alternate Days**: Schedule for different days if multi-day
3. **Hybrid Option**: Combine elements of both
4. **Third Alternative**: Suggest entirely new option that satisfies both groups
5. **Voting Escalation**: Suggest prioritization vote

---

## Flow 3: Commenting on Activities

```
┌─────────────────────────────────────────────────────────────────────┐
│                      ACTIVITY COMMENTING FLOW                        │
└─────────────────────────────────────────────────────────────────────┘

User viewing activity on Itinerary tab
    ↓
Clicks "💬 2 Comments" button
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Comments for: Tanah Lot Temple Tour                                 │
│  ══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  👤 Sarah · 2 hours ago                                         │ │
│  │  ────────────────────────────────────────────────────────────  │ │
│  │  This looks amazing! I've heard the sunset views are           │ │
│  │  incredible. Should we book a guided tour or explore on        │ │
│  │  our own?                                                       │ │
│  │                                                                 │ │
│  │  [👍 2] [Reply] [⋮]                                             │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  👤 Mike · 1 hour ago                                           │ │
│  │  ────────────────────────────────────────────────────────────  │ │
│  │  @Sarah Good question! I think guided tour is better -         │ │
│  │  we'll learn more about the history. It's only $5 extra.       │ │
│  │                                                                 │ │
│  │  [👍 3] [Reply] [⋮]                                             │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Add a comment...                                               │ │
│  │  ┌──────────────────────────────────────────────────────────┐ │ │
│  │  │ I agree with Mike. Also, the guided tours include          │ │
│  │  │ transportation which saves us hassle.                      │ │
│  │  │                                                             │ │
│  │  └──────────────────────────────────────────────────────────┘ │ │
│  │                                                                 │ │
│  │  💡 Use @name to mention someone                                │ │
│  │                                                                 │ │
│  │  [Cancel]                           [Post Comment]              │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
    ↓
User types comment with @mention
    ↓
POST /api/trips/:tripId/items/:itemId/comments
Body: { text: "I agree with @Mike. Also, the guided tours..." }
    ↓
Backend processing:
    ├─ Parse @mentions
    ├─ Create comment record
    ├─ Send notifications to mentioned users
    └─ Update comment count
    ↓
✅ Comment posted
    ↓
Real-time update via WebSocket
    ↓
Mentioned user (Mike) receives notification:
    ┌────────────────────────────────────────────────────────────────┐
    │  🔔 Notification                                                │
    │                                                                 │
    │  Alex mentioned you in a comment on                            │
    │  "Tanah Lot Temple Tour"                                        │
    │                                                                 │
    │  "I agree with @Mike. Also, the guided tours..."                │
    │                                                                 │
    │  [View Comment]  [Dismiss]                                      │
    └────────────────────────────────────────────────────────────────┘

END: Comment posted and notifications sent
```

**Comment Features:**
- ✅ Threaded replies (nested comments)
- ✅ @mentions for notifications
- ✅ Rich text formatting (bold, italic, links)
- ✅ Edit/delete own comments
- ✅ Like/react to comments
- ✅ Real-time updates

**Comment Permissions:**
- All trip members can comment
- Only comment author can edit/delete
- Organizers can moderate (delete any comment)

---

## Flow 4: Group Chat

```
┌─────────────────────────────────────────────────────────────────────┐
│                          GROUP CHAT FLOW                             │
└─────────────────────────────────────────────────────────────────────┘

User on Trip Detail Page → Chat Tab
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Trip Chat                                                           │
│  ══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  Today                                                               │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  👤 Sarah · 10:30 AM                                            │ │
│  │  Hey everyone! Super excited for this trip! 🎉                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  👤 Mike · 10:32 AM                                             │ │
│  │  Same here! @John did you book your flight yet?                │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  👤 John · 10:35 AM                                             │ │
│  │  Yes! Got the 10 AM flight from LAX. $850 like the itinerary  │ │
│  │  suggested. ✈️                                                  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  🤖 Atlas AI · 10:40 AM                                         │ │
│  │  Great news! 4 out of 6 members have booked their flights.    │ │
│  │  Trip completion: 35%                                           │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  💬 Type a message...                                           │ │
│  │                                                                 │ │
│  │  [😀] [📎] [Send]                                                │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
    ↓
User types message
    ↓
"Perfect! @Sarah @Emma let's coordinate on that villa booking"
    ↓
Clicks [Send] or presses Enter
    ↓
POST /api/trips/:tripId/chat
Body: { text: "Perfect! @Sarah @Emma let's coordinate..." }
    ↓
Backend processing:
    ├─ Parse @mentions
    ├─ Create chat message record
    ├─ Send push notifications to mentioned users
    ├─ Broadcast to all members via WebSocket
    └─ Update unread count for offline members
    ↓
✅ Message sent
    ↓
Real-time delivery via WebSocket to all online members
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  👤 You · Just now                                              │ │
│  │  Perfect! @Sarah @Emma let's coordinate on that villa booking  │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
    ↓
Mentioned users receive notifications:
    ├─ In-app: Red badge on Chat tab
    ├─ Push: "Alex mentioned you in Bali Trip chat"
    └─ Email (if enabled): Daily digest

END: Message sent and delivered to all members
```

**Chat Features:**
- ✅ Real-time messaging via WebSocket
- ✅ @mentions with notifications
- ✅ Emoji picker
- ✅ File attachments (images, PDFs)
- ✅ Message editing (5 min window)
- ✅ Message reactions (👍 ❤️ 😂 etc.)
- ✅ Unread message tracking
- ✅ Typing indicators
- ✅ Read receipts (optional)
- ✅ Search chat history

**Chat Permissions:**
- All trip members can send messages
- Only message author can edit/delete
- Organizers can moderate (delete any message)

---

## Flow 5: Invite Members to Trip

```
┌─────────────────────────────────────────────────────────────────────┐
│                      INVITE MEMBERS FLOW                             │
└─────────────────────────────────────────────────────────────────────┘

User on Trip Detail → Members Tab
    ↓
Clicks "+ Invite Members" button
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Invite People to Trip                                               │
│  ══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  METHOD 1: Email Invitations                                         │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Enter email addresses (one per line):                          │ │
│  │                                                                 │ │
│  │  ┌──────────────────────────────────────────────────────────┐ │ │
│  │  │ friend@example.com                                        │ │ │
│  │  │ colleague@company.com                                     │ │ │
│  │  │                                                           │ │ │
│  │  └──────────────────────────────────────────────────────────┘ │ │
│  │                                                                 │ │
│  │  Role:                                                          │ │
│  │  ○ Organizer (full access)                                      │ │
│  │  ● Planner (can edit)                                           │ │
│  │  ○ Member (view & vote only)                                    │ │
│  │                                                                 │ │
│  │  Personal message (optional):                                   │ │
│  │  ┌──────────────────────────────────────────────────────────┐ │ │
│  │  │ Hey! Join me for our Bali adventure! Can't wait 🎉      │ │ │
│  │  └──────────────────────────────────────────────────────────┘ │ │
│  │                                                                 │ │
│  │  [Send Email Invitations]                                       │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  METHOD 2: Share Link                                                │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Anyone with this link can join:                                │ │
│  │  https://tripsync.app/join/ABC123                              │ │
│  │                                                                 │ │
│  │  [📋 Copy Link] [✉️ Share via Email] [💬 Share in Chat]        │ │
│  │                                                                 │ │
│  │  Link settings:                                                 │ │
│  │  ☑ Allow anyone with link to join                              │ │
│  │  ☐ Require approval from organizer                             │ │
│  │  ☐ Expire link after: [7 days ▼]                               │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  Current members: 4 / 6 (Free tier limit)                            │
│  ⚠️  2 spots remaining. Upgrade to Pro for unlimited members.       │
│                                                                       │
│  [Cancel]                                                            │
└──────────────────────────────────────────────────────────────────────┘
    ↓
METHOD 1 SELECTED: Email Invitations
────────────────────────────────────────
User enters 2 emails and clicks "Send"
    ↓
POST /api/trips/:tripId/invites
Body: {
  emails: ["friend@example.com", "colleague@company.com"],
  role: "planner",
  message: "Hey! Join me for our Bali adventure!"
}
    ↓
Backend processing:
For each email:
    ├─ Check if user exists in system
    │   ├─ Exists → Send invite notification
    │   └─ New → Send signup + invite email
    ├─ Create invitation record
    ├─ Generate unique invite link
    └─ Send personalized email
    ↓
✅ Invitations sent
    ↓
Success notification:
"✅ Invitations sent to 2 people. They'll receive an email shortly."
    ↓
Invitees receive email:
┌──────────────────────────────────────────────────────────────────────┐
│  Subject: Alex invited you to a trip to Bali!                        │
│  ────────────────────────────────────────────────────────────────    │
│                                                                       │
│  Hi there!                                                           │
│                                                                       │
│  Alex invited you to collaborate on a trip to Bali, Indonesia       │
│  from June 15-22, 2024.                                              │
│                                                                       │
│  Personal message from Alex:                                         │
│  "Hey! Join me for our Bali adventure! Can't wait 🎉"               │
│                                                                       │
│  Trip Preview:                                                       │
│  • 7 days, 6 nights                                                  │
│  • 6 travelers                                                       │
│  • Budget: $1,500 per person                                         │
│  • Vibe: Relaxing & Adventure                                        │
│                                                                       │
│  [View Trip & Accept Invitation →]                                   │
│                                                                       │
│  Or copy this link: https://tripsync.app/invite/XYZ789              │
│                                                                       │
│  This invitation expires in 7 days.                                  │
└──────────────────────────────────────────────────────────────────────┘
    ↓
Invitee clicks link
    ↓
Redirects to /invite/:inviteId
    ↓
See Flow 6: Accept Invitation

METHOD 2 SELECTED: Share Link
──────────────────────────────
User copies share link
    ↓
Shares via text, social media, etc.
    ↓
Recipient opens link → /join/ABC123
    ↓
See Flow 7: Join via Share Link

END: Invitations sent or link shared
```

**Invitation Features:**
- ✅ Email invitations with personalized message
- ✅ Share link (public or private)
- ✅ Link expiration options
- ✅ Approval requirement (optional)
- ✅ Role assignment on invite
- ✅ Trip preview before joining
- ✅ Automatic signup for new users

**Tier Limits:**
- Free: 6 members per trip
- Pro: Unlimited members
- Teams: Unlimited members

---

## Flow 6: Accept Email Invitation

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ACCEPT EMAIL INVITATION FLOW                      │
└─────────────────────────────────────────────────────────────────────┘

Invitee clicks email invitation link
    ↓
Redirects to /invite/:inviteId
    ↓
GET /api/invites/:inviteId (validate invitation)
    ├─ Check if invitation valid
    │   ├─ Valid → Continue
    │   ├─ Expired → Show error
    │   ├─ Already accepted → Redirect to trip
    │   └─ Revoked → Show error
    └─ Fetch trip preview data
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Trip Invitation                                                     │
│  ══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  Alex invited you to:                                                │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  🌴 Bali Adventure                                              │ │
│  │                                                                 │ │
│  │  📍 Bali, Indonesia                                             │ │
│  │  📅 June 15-22, 2024 (7 days, 6 nights)                        │ │
│  │  👥 6 travelers                                                 │ │
│  │  💰 $1,500 per person                                           │ │
│  │  🎯 Vibe: Relaxing & Adventure                                  │ │
│  │                                                                 │ │
│  │  Preview Itinerary:                                             │ │
│  │  • ✈️ Flights from LAX to DPS                                  │ │
│  │  • 🏨 6 nights at beachfront villa                             │ │
│  │  • 🏖️ Beach days & temple tours                                │ │
│  │  • 🍽️ 21 meals planned                                         │ │
│  │  • ⛰️ Mt. Batur sunrise hike                                   │ │
│  │                                                                 │ │
│  │  Current members:                                               │ │
│  │  👤 Alex (Organizer)                                            │ │
│  │  👤 Sarah                                                        │ │
│  │  👤 Mike                                                         │ │
│  │  👤 John                                                         │ │
│  │  + 2 more spots available                                       │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  Personal message from Alex:                                         │
│  "Hey! Join me for our Bali adventure! Can't wait 🎉"               │
│                                                                       │
│  [🚫 Decline]                      [✅ Accept & Join Trip]           │
└──────────────────────────────────────────────────────────────────────┘
    ↓
Check if user is logged in:
    ├─ Logged in → Continue to acceptance
    └─ Not logged in → Show login/signup options
        ↓
        ┌──────────────────────────────────────────────────────────┐
        │  To accept this invitation, please:                      │
        │                                                           │
        │  [Log In to Existing Account]                            │
        │  [Create New Account]                                     │
        │                                                           │
        │  ℹ️  Your invitation will be saved                       │
        └──────────────────────────────────────────────────────────┘
        ↓
        User logs in or signs up
        ↓
        Auto-redirects back to invitation page
    ↓
User clicks "Accept & Join Trip"
    ↓
POST /api/invites/:inviteId/respond
Body: { action: "accept" }
    ↓
Backend processing:
    ├─ Validate invitation still valid
    ├─ Check trip member limit (Free tier: 6)
    │   ├─ Within limit → Continue
    │   └─ Limit reached → Show error
    ├─ Add user to trip with specified role
    ├─ Mark invitation as accepted
    ├─ Send welcome notification
    └─ Notify trip organizer
    ↓
✅ Invitation accepted
    ↓
Success modal:
┌──────────────────────────────────────────────────────────────────────┐
│  Welcome to Bali Adventure! 🎉                                       │
│                                                                       │
│  You're now part of the trip! You can:                               │
│  ✓ View and vote on activities                                       │
│  ✓ Chat with trip members                                            │
│  ✓ Add your preferences and dietary restrictions                     │
│  ✓ Track expenses                                                    │
│                                                                       │
│  [Explore Trip →]                                                    │
└──────────────────────────────────────────────────────────────────────┘
    ↓
Redirect to /trip/:id
    ↓
Trip organizer receives notification:
"friend@example.com accepted your invitation to Bali Adventure!"

END: User successfully joined trip
```

**Invitation Acceptance Scenarios:**
1. **Already logged in** → Direct acceptance, redirect to trip
2. **Not logged in, has account** → Login, then accept
3. **Not logged in, no account** → Signup, then accept
4. **Invitation expired** → Show error, suggest contacting organizer
5. **Trip full (Free tier limit)** → Suggest organizer upgrades

---

## Flow 7: Join via Share Link

```
┌─────────────────────────────────────────────────────────────────────┐
│                       JOIN VIA SHARE LINK FLOW                       │
└─────────────────────────────────────────────────────────────────────┘

User clicks share link: https://tripsync.app/join/ABC123
    ↓
Redirects to /join/:code
    ↓
GET /api/trips/join/:code (validate share code)
    ├─ Check if code valid
    │   ├─ Valid → Continue
    │   ├─ Invalid → Show error
    │   └─ Expired → Show error
    └─ Fetch trip preview data
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Join Trip                                                           │
│  ══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  🌴 Bali Adventure                                              │ │
│  │                                                                 │ │
│  │  Organized by Alex                                              │ │
│  │                                                                 │ │
│  │  📍 Bali, Indonesia                                             │ │
│  │  📅 June 15-22, 2024                                            │ │
│  │  👥 4 members (2 spots left)                                    │ │
│  │  💰 $1,500 per person                                           │ │
│  │                                                                 │ │
│  │  Itinerary Preview:                                             │ │
│  │  🏖️ Beach & temple tours                                        │ │
│  │  ⛰️ Sunrise hike at Mt. Batur                                   │ │
│  │  🍽️ Local cuisine & fine dining                                │ │
│  │  🏨 Beachfront villa accommodation                              │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  [⬅ Back]                          [Join This Trip →]               │
└──────────────────────────────────────────────────────────────────────┘
    ↓
Check if user is logged in:
    ├─ Logged in → Continue
    └─ Not logged in → Prompt login/signup
    ↓
User clicks "Join This Trip"
    ↓
POST /api/trips/join/:code
    ↓
Backend processing:
    ├─ Validate code still valid
    ├─ Check if user already member
    │   └─ If yes → Redirect to trip
    ├─ Check member limit
    │   ├─ Within limit → Continue
    │   └─ Full → Show "Trip is full" error
    ├─ Check if approval required
    │   ├─ Yes → Create pending membership
    │   └─ No → Add as member immediately
    └─ Send notifications
    ↓
SCENARIO A: Auto-Join (No Approval Required)
────────────────────────────────────────────
✅ Added to trip immediately
    ↓
Success notification:
"You've joined Bali Adventure! 🎉"
    ↓
Redirect to /trip/:id
    ↓
Organizer notified:
"John joined your trip via share link"

SCENARIO B: Approval Required
──────────────────────────────
⏳ Join request pending
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Join Request Sent                                                   │
│                                                                       │
│  Your request to join "Bali Adventure" has been sent to the          │
│  trip organizer for approval.                                         │
│                                                                       │
│  You'll receive a notification once they respond.                    │
│                                                                       │
│  [OK, Got It]                                                        │
└──────────────────────────────────────────────────────────────────────┘
    ↓
Organizer receives notification:
    ┌────────────────────────────────────────────────────────────────┐
    │  🔔 New Join Request                                            │
    │                                                                 │
    │  John wants to join "Bali Adventure"                           │
    │                                                                 │
    │  [View Profile] [Approve] [Decline]                            │
    └────────────────────────────────────────────────────────────────┘
    ↓
Organizer approves
    ↓
POST /api/trips/:tripId/members/:memberId/approve
    ↓
✅ Request approved
    ↓
John receives notification:
"Alex approved your request to join Bali Adventure! 🎉"
    ↓
Redirect to /trip/:id

END: User joined trip (immediately or after approval)
```

**Share Link Settings:**
- Public (anyone can join immediately)
- Private (organizer approval required)
- Expiring (auto-expires after X days)
- One-time use (disabled after first join)

---

## Flow 8: Member Role Management

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MEMBER ROLE MANAGEMENT FLOW                       │
└─────────────────────────────────────────────────────────────────────┘

Trip organizer on Members Tab
    ↓
Viewing member list:
    ┌────────────────────────────────────────────────────────────────┐
    │  Trip Members (6)                                               │
    │  ────────────────────────────────────────────────────────────  │
    │                                                                 │
    │  👤 Alex (You)                         Organizer  [⋮]          │
    │  👤 Sarah                               Planner   [⋮]          │
    │  👤 Mike                                Member    [⋮]          │
    │  👤 Emma                                Member    [⋮]          │
    │  👤 John                                Member    [⋮]          │
    │  👤 Lisa                                Member    [⋮]          │
    └────────────────────────────────────────────────────────────────┘
    ↓
Organizer clicks [⋮] next to Sarah's name
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Manage Member: Sarah                                                │
│  ══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  Change Role:                                                        │
│  ○ Organizer (full access, can delete trip)                          │
│  ● Planner (can edit itinerary, expenses, settings)                  │
│  ○ Member (view, vote, comment only)                                 │
│                                                                       │
│  Actions:                                                            │
│  [✉️ Send Message]                                                   │
│  [⚙️ View Preferences]                                                │
│  [🚫 Remove from Trip]                                                │
│                                                                       │
│  [Cancel]                          [Save Changes]                    │
└──────────────────────────────────────────────────────────────────────┘
    ↓
Organizer changes role to "Member" and saves
    ↓
PATCH /api/trips/:tripId/members/:memberId
Body: { role: "member" }
    ↓
Confirmation dialog:
┌──────────────────────────────────────────────────────────────────────┐
│  Change Sarah's Role?                                                │
│                                                                       │
│  Sarah will be downgraded from Planner to Member.                    │
│                                                                       │
│  They will lose the ability to:                                      │
│  • Edit itinerary items                                              │
│  • Manage expenses                                                   │
│  • Change trip settings                                              │
│  • Invite new members                                                │
│                                                                       │
│  They can still:                                                     │
│  • View the trip                                                     │
│  • Vote on activities                                                │
│  • Comment and chat                                                  │
│                                                                       │
│  [Cancel]                          [Yes, Change Role]                │
└──────────────────────────────────────────────────────────────────────┘
    ↓
Organizer confirms
    ↓
✅ Role updated
    ↓
Sarah receives notification:
"Your role in Bali Adventure was changed to Member"
    ↓
Members list updates in real-time

END: Member role successfully changed
```

**Role Permissions:**

| Action | Organizer | Planner | Member |
|--------|-----------|---------|--------|
| View trip | ✅ | ✅ | ✅ |
| Vote on activities | ✅ | ✅ | ✅ |
| Comment & chat | ✅ | ✅ | ✅ |
| Add itinerary items | ✅ | ✅ | ❌ |
| Edit itinerary | ✅ | ✅ | ❌ |
| Delete items | ✅ | ✅ | ❌ |
| Add expenses | ✅ | ✅ | ❌ |
| Invite members | ✅ | ✅ | ❌ |
| Change settings | ✅ | ❌ | ❌ |
| Remove members | ✅ | ❌ | ❌ |
| Delete trip | ✅ | ❌ | ❌ |

---

## Analytics & Tracking

**Events Tracked:**
1. `vote_cast` - User voted on activity
2. `vote_changed` - User changed their vote
3. `comment_posted` - Comment added
4. `comment_edited` - Comment modified
5. `chat_message_sent` - Chat message sent
6. `member_invited` - Invitation sent
7. `invitation_accepted` - User joined trip
8. `member_role_changed` - Role updated
9. `vote_deadlock_detected` - Tied vote >24hrs
10. `atlas_compromise_suggested` - AI suggested resolution

**Metrics Tracked:**
- Voting participation rate
- Average time to vote consensus
- Comment engagement per item
- Chat messages per day
- Invitation acceptance rate
- Member activity levels
- Time to first vote after item added

---

**Last Updated:** 2026-07-11
**Status:** ✅ Complete and Production-Ready
