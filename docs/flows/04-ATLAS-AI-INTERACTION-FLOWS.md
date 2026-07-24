# Atlas AI Assistant Interaction Flows

Complete end-to-end flows for Atlas AI - TripSync's proactive AI assistant that monitors trips 24/7 and provides intelligent suggestions.

---

## Overview: What is Atlas AI?

**Atlas AI** is TripSync's unique differentiator - a proactive AI assistant powered by Claude Sonnet 4.5 that:

- Monitors trip health every 15 minutes
- Proactively intervenes when issues are detected
- Provides contextual suggestions and optimizations
- Resolves conflicts and deadlocks
- Answers questions about the trip
- Never sleeps, always watching over your trip

**Key Features:**

- 🔍 Continuous monitoring (every 15 minutes)
- 🤖 Conversational chat interface
- 🎯 Context-aware responses (knows everything about the trip)
- ⚡ Proactive interventions (doesn't wait to be asked)
- 💡 Smart suggestions (budget optimization, conflict resolution)
- 🔔 Intelligent notifications (only when needed)

---

## Flow 1: Atlas AI Widget - First Interaction

```
┌─────────────────────────────────────────────────────────────────────┐
│                  ATLAS AI FIRST INTERACTION FLOW                     │
└─────────────────────────────────────────────────────────────────────┘

User lands on Trip Detail Page (/trip/:id)
    ↓
Atlas AI widget appears (bottom-right corner):
    ┌────────────────────────────────────────────────────────────────┐
    │  🤖 Atlas AI                                          [─] [✕]  │
    │  ──────────────────────────────────────────────────────────    │
    │                                                                 │
    │  ┌────────────────────────────────────────────────────────┐  │
    │  │  👋 Hi! I'm Atlas, your AI trip assistant.             │  │
    │  │                                                         │  │
    │  │  I'm here to help make your Bali trip amazing.        │  │
    │  │  I can:                                                │  │
    │  │                                                         │  │
    │  │  • Monitor your trip's progress                        │  │
    │  │  • Suggest budget optimizations                        │  │
    │  │  • Resolve voting conflicts                            │  │
    │  │  • Answer questions about your itinerary              │  │
    │  │  • Recommend activities and restaurants                │  │
    │  │                                                         │  │
    │  │  Try asking me:                                         │  │
    │  │  "Are we over budget?"                                  │  │
    │  │  "Suggest a good restaurant for Day 3"                  │  │
    │  │  "What's our trip completion status?"                   │  │
    │  └────────────────────────────────────────────────────────┘  │
    │                                                                 │
    │  💬 Type a message...                                           │
    │  [Ask Atlas anything about your trip]                           │
    └────────────────────────────────────────────────────────────────┘
    ↓
User can:
    ├─ Minimize widget (clicks [─])
    ├─ Close widget (clicks [✕])
    └─ Start chatting (types in message box)

END: Atlas AI introduced and ready to assist
```

**Widget States:**

1. **Minimized** - Small floating button with Atlas icon
2. **Expanded** - Full chat interface (400px × 600px)
3. **Hidden** - User dismissed (can re-open from menu)
4. **Active** - Currently in conversation
5. **Notification Badge** - Red dot when Atlas has proactive message

---

## Flow 2: Conversational Chat with Atlas

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ATLAS AI CHAT CONVERSATION FLOW                   │
└─────────────────────────────────────────────────────────────────────┘

SCENARIO A: User Asks Question
────────────────────────────────────────
User types: "Are we over budget?"
    ↓
Message appears in chat:
    ┌────────────────────────────────────────────────────────────────┐
    │  👤 You · Just now                                              │
    │  Are we over budget?                                            │
    └────────────────────────────────────────────────────────────────┘
    ↓
POST /api/trips/:tripId/atlas/conversation
Body: {
  message: "Are we over budget?",
  context: "itinerary_view"
}
    ↓
Backend processing:
    ├─ Fetch trip data (budget, expenses, itinerary)
    ├─ Calculate actual spending vs budget
    ├─ Build context for AI
    └─ Call Claude Sonnet 4.5
    ↓
Atlas AI analyzes (2-5 seconds):
    ├─ Trip budget: $1,500/person × 6 = $9,000
    ├─ Estimated expenses: $8,950
    ├─ Actual booked: $7,200
    ├─ Remaining: $1,800
    └─ Status: Under budget ✓
    ↓
Atlas typing indicator shows...
    ┌────────────────────────────────────────────────────────────────┐
    │  🤖 Atlas is typing...                                          │
    └────────────────────────────────────────────────────────────────┘
    ↓
Atlas responds:
    ┌────────────────────────────────────────────────────────────────┐
    │  🤖 Atlas AI · Just now                                         │
    │  ────────────────────────────────────────────────────────────  │
    │  Good news! You're doing great with the budget. 📊              │
    │                                                                 │
    │  Budget Breakdown:                                              │
    │  • Total Budget: $9,000 ($1,500/person × 6)                    │
    │  • Estimated Cost: $8,950 (99.4%)                              │
    │  • Already Booked: $7,200 (80%)                                │
    │  • Remaining: $1,800                                            │
    │                                                                 │
    │  You're $50 under budget! ✅                                    │
    │                                                                 │
    │  Top expenses so far:                                           │
    │  1. Flights: $5,100 (57%)                                      │
    │  2. Accommodation: $1,080 (12%)                                │
    │  3. Activities: $720 (8%)                                      │
    │  4. Meals: $300 (3%)                                           │
    │                                                                 │
    │  💡 Tip: You have $1,800 left for meals and spontaneous        │
    │  activities. That's $50/person/day - perfect for your trip!    │
    │                                                                 │
    │  Need help optimizing further? Just ask!                        │
    └────────────────────────────────────────────────────────────────┘
    ↓
Conversation continues...
User can ask follow-up questions

SCENARIO B: User Asks for Recommendations
────────────────────────────────────────────
User types: "Suggest a good seafood restaurant for Day 3 dinner"
    ↓
POST /api/trips/:tripId/atlas/conversation
    ↓
Atlas analyzes:
    ├─ Day 3 location: Seminyak area
    ├─ Group preferences: Loves seafood
    ├─ Budget: $30-50/person for dinner
    ├─ Trip vibe: Relaxing + foodie
    └─ Dietary restrictions: 1 vegetarian
    ↓
Atlas responds:
    ┌────────────────────────────────────────────────────────────────┐
    │  🤖 Atlas AI · Just now                                         │
    │  ────────────────────────────────────────────────────────────  │
    │  Great choice! Here are 3 excellent seafood restaurants        │
    │  near Seminyak for Day 3 dinner: 🦞                            │
    │                                                                 │
    │  🌟 RECOMMENDED: Menega Café Jimbaran                          │
    │  📍 Jimbaran Beach (20 min from your villa)                    │
    │  💰 $35-45/person                                              │
    │  ⭐ 4.7/5 (1,200 reviews)                                       │
    │  ✨ Beachfront dining, fresh catch of the day                  │
    │  🌱 Vegetarian options available                                │
    │  [🔗 View Menu] [📍 Get Directions] [Add to Itinerary]        │
    │                                                                 │
    │  🥈 ALSO GREAT: Sundara Beach Club                             │
    │  📍 Four Seasons Resort (15 min drive)                         │
    │  💰 $50-70/person                                              │
    │  ⭐ 4.8/5 (890 reviews)                                         │
    │  ✨ Upscale, stunning sunset views                             │
    │  [View Details]                                                 │
    │                                                                 │
    │  🥉 BUDGET FRIENDLY: Warung Mak Beng                           │
    │  📍 Sanur Beach (25 min drive)                                 │
    │  💰 $10-15/person                                              │
    │  ⭐ 4.6/5 (2,100 reviews)                                       │
    │  ✨ Authentic local spot, famous fish soup                     │
    │  [View Details]                                                 │
    │                                                                 │
    │  💡 My pick: Menega Café - perfect for your budget,            │
    │  has vegetarian options, and the sunset views are              │
    │  incredible. Book ahead on weekends!                            │
    │                                                                 │
    │  Want me to add it to Day 3?                                    │
    └────────────────────────────────────────────────────────────────┘
    ↓
User clicks [Add to Itinerary] on Menega Café
    ↓
POST /api/trips/:tripId/items
    ├─ Pre-filled with Atlas's suggestion
    ├─ Name: "Dinner at Menega Café Jimbaran"
    ├─ Time: Day 3, 7:00 PM
    ├─ Price: $40/person
    └─ Booking URL: (menu link)
    ↓
✅ Item added to itinerary
    ↓
Atlas: "Great! I've added Menega Café to your Day 3 itinerary.
       Your group can vote on it now. Bon appétit! 🍽️"

SCENARIO C: Complex Question
────────────────────────────────
User types: "What should I pack for this trip?"
    ↓
Atlas analyzes:
    ├─ Destination: Bali (tropical climate)
    ├─ Dates: June 15-22 (dry season)
    ├─ Activities: Beach, temple visits, hiking
    ├─ Trip vibe: Relaxing + adventure
    └─ Duration: 7 days
    ↓
POST /api/trips/:tripId/generate-packing-list (uses Haiku for speed)
    ↓
Atlas responds:
    ┌────────────────────────────────────────────────────────────────┐
    │  🤖 Atlas AI · Just now                                         │
    │  ────────────────────────────────────────────────────────────  │
    │  I've created a personalized packing list for your Bali trip! │
    │  🎒                                                             │
    │                                                                 │
    │  ESSENTIALS (Must Have)                                         │
    │  ☐ Passport & copies                                            │
    │  ☐ Travel insurance documents                                   │
    │  ☐ Flight confirmations                                         │
    │  ☐ Credit cards & some cash (IDR)                              │
    │  ☐ Phone & chargers                                             │
    │  ☐ Sunscreen (SPF 50+ for tropics!)                            │
    │  ☐ Insect repellent (dengue prevention)                        │
    │                                                                 │
    │  CLOTHING (7 days, tropical weather)                            │
    │  ☐ 7-8 light, breathable t-shirts                              │
    │  ☐ 2-3 shorts                                                   │
    │  ☐ 2-3 swimwear                                                 │
    │  ☐ 1 light jacket (for AC/flights)                             │
    │  ☐ Comfortable walking shoes                                    │
    │  ☐ Sandals/flip-flops                                           │
    │  ☐ Hiking shoes (for Mt. Batur!)                               │
    │  ☐ Temple-appropriate attire (covered shoulders/knees)         │
    │                                                                 │
    │  ACTIVITIES (Based on your itinerary)                           │
    │  ☐ Beach towel                                                  │
    │  ☐ Snorkeling gear (optional - can rent)                       │
    │  ☐ Waterproof phone case                                        │
    │  ☐ Day backpack                                                 │
    │  ☐ Reusable water bottle                                        │
    │  ☐ Headlamp (for sunrise hike!)                                │
    │                                                                 │
    │  HEALTH & SAFETY                                                │
    │  ☐ Prescription medications                                     │
    │  ☐ First aid kit basics                                         │
    │  ☐ Hand sanitizer                                               │
    │  ☐ Anti-diarrheal medication                                    │
    │                                                                 │
    │  💡 Pro tips:                                                   │
    │  • Pack light - laundry is cheap in Bali                       │
    │  • Bring a sarong (required for temples)                       │
    │  • Download offline maps before you go                          │
    │                                                                 │
    │  [📋 Save to Coordination Tab] [✉️ Email This List]            │
    └────────────────────────────────────────────────────────────────┘
    ↓
User clicks [Save to Coordination Tab]
    ↓
✅ Packing list added to trip's Coordination tab
    ↓
Atlas: "Packing list saved! You can check items off as you pack. ✓"

END: Context-aware conversation with helpful responses
```

**Chat Features:**

- ✅ Context-aware (knows everything about the trip)
- ✅ Conversational memory (remembers chat history)
- ✅ Quick actions (buttons to add suggestions to trip)
- ✅ Typing indicators for natural feel
- ✅ Rich formatting (lists, links, emojis)
- ✅ Intelligent fallback if AI unavailable

---

## Flow 3: Proactive Monitoring & Interventions

```
┌─────────────────────────────────────────────────────────────────────┐
│               ATLAS PROACTIVE MONITORING FLOW                        │
└─────────────────────────────────────────────────────────────────────┘

BACKGROUND PROCESS: Runs every 15 minutes
────────────────────────────────────────────

Cron job triggers:
    ↓
For each active trip:
    ↓
GET /api/trips/:id/atlas/health-check
    ↓
Calculate trip health metrics:
    ┌────────────────────────────────────────────────────────────────┐
    │  Trip Health Analysis                                           │
    │  ────────────────────────────────────────────────────────────  │
    │                                                                 │
    │  ✅ Budget Usage: 95% ($8,950 / $9,000)                        │
    │  ⚠️  Completion: 45% (trip in 5 days!)                         │
    │  ✅ Vote Status: 2 pending votes (normal)                      │
    │  🔴 Deadlock Detected: 1 vote tied for 36 hours                │
    │  ✅ Member Activity: All active in last 48h                    │
    │  ⚠️  Bookings: Only 3/8 major items booked                     │
    └────────────────────────────────────────────────────────────────┘
    ↓
Check intervention triggers:

TRIGGER 1: Budget Overrun (>110%)
──────────────────────────────────
IF budget_used > 110%:
    ↓
    POST /api/trips/:id/atlas/intervention
    Type: "budget_overrun"
    ↓
    Atlas analyzes and posts to chat:
    ┌────────────────────────────────────────────────────────────────┐
    │  🤖 Atlas AI · 2 min ago                              [🔔 NEW] │
    │  ────────────────────────────────────────────────────────────  │
    │  ⚠️  Budget Alert                                              │
    │                                                                 │
    │  I noticed you're 15% over budget ($10,350 spent vs $9,000    │
    │  planned). Here are 3 ways to get back on track:               │
    │                                                                 │
    │  1️⃣ Switch to street food for 3 lunches                        │
    │     Current: $25/meal × 18 meals = $450                        │
    │     Street food: $8/meal × 18 meals = $144                     │
    │     💰 Save $306                                                │
    │                                                                 │
    │  2️⃣ Book flights 2 weeks earlier                               │
    │     Current avg: $950/person                                   │
    │     Early booking: ~$800/person                                │
    │     💰 Save $900 total                                          │
    │                                                                 │
    │  3️⃣ Share airport transfers instead of taxis                   │
    │     Current: 6 separate taxis = $180                           │
    │     Shared van: $60 total                                      │
    │     💰 Save $120                                                │
    │                                                                 │
    │  Total potential savings: $1,326                                │
    │  This would put you $26 under budget! 🎯                       │
    │                                                                 │
    │  [Apply Suggestion 1] [Apply All] [Dismiss]                    │
    └────────────────────────────────────────────────────────────────┘
    ↓
    Notification sent to trip organizer
    Red badge appears on Atlas widget

TRIGGER 2: Vote Deadlock (>24 hours tied)
──────────────────────────────────────────
IF vote_tied_duration > 24 hours:
    ↓
    POST /api/trips/:id/atlas/suggest-resolution
    ↓
    Atlas analyzes vote history and suggests compromise
    (See Flow 2 in Collaboration docs for full details)
    ↓
    Posts compromise suggestion to chat
    ↓
    Notifies all trip members

TRIGGER 3: Deadline Urgency (<7 days, <50% complete)
─────────────────────────────────────────────────────
IF days_until_trip < 7 AND completion_percent < 50:
    ↓
    Atlas posts gentle nudge:
    ┌────────────────────────────────────────────────────────────────┐
    │  🤖 Atlas AI · 5 min ago                              [🔔 NEW] │
    │  ────────────────────────────────────────────────────────────  │
    │  ⏰ Trip Starting Soon!                                        │
    │                                                                 │
    │  Your Bali trip starts in 5 days, but your planning is only   │
    │  45% complete. Here's what needs attention:                    │
    │                                                                 │
    │  🔴 URGENT (Book today!)                                       │
    │  • Villa booking (2 members still haven't confirmed)           │
    │  • Mt. Batur sunrise tour (fills up fast!)                    │
    │                                                                 │
    │  🟡 IMPORTANT (Book this week)                                 │
    │  • Airport transfers                                            │
    │  • Restaurant reservations (3 pending)                          │
    │                                                                 │
    │  🟢 OPTIONAL (Can wait)                                        │
    │  • Spa appointments                                             │
    │  • Beach club day passes                                        │
    │                                                                 │
    │  💡 Suggestion: Let's focus on the urgent items first.        │
    │  I can help coordinate with members who haven't booked yet.    │
    │                                                                 │
    │  [Remind Members] [View Urgent Items] [Dismiss]                │
    └────────────────────────────────────────────────────────────────┘
    ↓
    Notifications sent to relevant members

TRIGGER 4: Inactivity (No activity for 3+ days)
────────────────────────────────────────────────
IF days_since_last_activity > 3:
    ↓
    Atlas posts friendly re-engagement:
    ┌────────────────────────────────────────────────────────────────┐
    │  🤖 Atlas AI · Just now                               [🔔 NEW] │
    │  ────────────────────────────────────────────────────────────  │
    │  👋 Hey team!                                                  │
    │                                                                 │
    │  It's been a few days since the last update on this trip.     │
    │  Just checking in! 😊                                          │
    │                                                                 │
    │  Here's what's new:                                             │
    │  • 21 days until departure                                     │
    │  • 2 new votes needed on Day 3 activities                      │
    │  • Weather forecast updated (looks perfect!)                   │
    │                                                                 │
    │  Need help with anything? I'm here! Try asking:                │
    │  • "What still needs to be booked?"                            │
    │  • "Show me the weather forecast"                              │
    │  • "Any new restaurant recommendations?"                        │
    └────────────────────────────────────────────────────────────────┘

TRIGGER 5: Milestone Achievements
──────────────────────────────────
IF trip_completion == 100%:
    ↓
    Atlas celebrates:
    ┌────────────────────────────────────────────────────────────────┐
    │  🤖 Atlas AI · Just now                                         │
    │  ────────────────────────────────────────────────────────────  │
    │  🎉 Congratulations! Your trip is 100% planned!                │
    │                                                                 │
    │  Everything is booked and ready:                                │
    │  ✅ All flights confirmed                                       │
    │  ✅ Accommodation secured                                       │
    │  ✅ All activities booked                                       │
    │  ✅ Budget on track                                             │
    │  ✅ Everyone's voted                                            │
    │                                                                 │
    │  You're all set for an amazing Bali adventure! 🌴              │
    │                                                                 │
    │  Final tips:                                                    │
    │  • Download offline maps                                        │
    │  • Check visa requirements                                      │
    │  • Pack according to your packing list                          │
    │                                                                 │
    │  Have a fantastic trip! I'll still be here if you need me. 😊 │
    └────────────────────────────────────────────────────────────────┘

END: Continuous monitoring with timely interventions
```

**Intervention Strategy:**

- ✅ Only intervene when genuinely helpful (not annoying)
- ✅ Friendly, conversational tone (not bossy)
- ✅ Actionable suggestions (clear next steps)
- ✅ Dismissable (user can ignore if not relevant)
- ✅ Context-aware (knows trip history)

**Monitoring Frequency:**

- Every 15 minutes for active trips
- Every 1 hour for trips >30 days away
- Every 5 minutes for trips <24 hours away
- Paused for completed/archived trips

---

## Flow 4: Atlas Trip Health Score

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TRIP HEALTH SCORE FLOW                            │
└─────────────────────────────────────────────────────────────────────┘

User on Trip Detail Page → Activity Tab
    ↓
Sees trip health widget:
    ┌────────────────────────────────────────────────────────────────┐
    │  Trip Health Score                              Powered by Atlas│
    │  ────────────────────────────────────────────────────────────  │
    │                                                                 │
    │        [████████████████░░░░] 78%                              │
    │                                                                 │
    │  ✅ Budget: On Track (95% used)                                │
    │  ✅ Votes: All Resolved                                        │
    │  ⚠️  Bookings: 60% Complete                                    │
    │  ✅ Member Activity: High                                      │
    │  ⚠️  Time Remaining: 5 days (needs attention)                  │
    │                                                                 │
    │  [View Detailed Breakdown]                                      │
    └────────────────────────────────────────────────────────────────┘
    ↓
User clicks "View Detailed Breakdown"
    ↓
GET /api/trips/:id/atlas/trip-health
    ↓
Returns comprehensive health analysis
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Trip Health Analysis - Bali Adventure                              │
│  ══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  Overall Score: 78% - GOOD                                           │
│  [████████████████░░░░] Healthy                                      │
│                                                                       │
│  ──────────────────────────────────────────────────────────────────  │
│  📊 DETAILED METRICS                                                 │
│  ──────────────────────────────────────────────────────────────────  │
│                                                                       │
│  💰 BUDGET HEALTH: 95% - Excellent ✅                                │
│  ├─ Total Budget: $9,000                                            │
│  ├─ Spent/Estimated: $8,550 (95%)                                   │
│  ├─ Remaining: $450                                                  │
│  └─ Status: Under budget by $450                                     │
│                                                                       │
│  🗳️ VOTING CONSENSUS: 100% - Excellent ✅                           │
│  ├─ Total Items: 24                                                  │
│  ├─ Fully Voted: 22 (92%)                                           │
│  ├─ Pending Votes: 2 (8%)                                           │
│  ├─ Deadlocks: 0                                                     │
│  └─ Average Approval: 87%                                            │
│                                                                       │
│  📅 BOOKING PROGRESS: 60% - Needs Attention ⚠️                       │
│  ├─ Flights: 5/6 booked (83%)                                       │
│  ├─ Accommodation: 6/6 confirmed (100%) ✓                           │
│  ├─ Activities: 4/12 booked (33%)                                   │
│  ├─ Restaurants: 2/6 reserved (33%)                                 │
│  └─ Priority: Book Mt. Batur tour & 2 dinners                       │
│                                                                       │
│  👥 MEMBER ENGAGEMENT: 92% - Excellent ✅                            │
│  ├─ Active Members: 6/6 (100%)                                      │
│  ├─ Last Activity: 2 hours ago                                      │
│  ├─ Avg Response Time: 4 hours                                      │
│  ├─ Participation Rate: 92%                                          │
│  └─ Least Active: Lisa (70%) - might need nudge                     │
│                                                                       │
│  ⏰ TIME URGENCY: High ⚠️                                             │
│  ├─ Days Until Departure: 5 days                                    │
│  ├─ Completion: 78%                                                  │
│  ├─ Daily Progress Needed: 4.4%                                     │
│  └─ Recommendation: Focus on bookings today                          │
│                                                                       │
│  ──────────────────────────────────────────────────────────────────  │
│  🎯 ATLAS RECOMMENDATIONS                                            │
│  ──────────────────────────────────────────────────────────────────  │
│                                                                       │
│  1. URGENT: Book Mt. Batur Sunrise Tour                             │
│     • Only 3 spots left for your dates                              │
│     • 5 members voted yes                                            │
│     • [Book Now →]                                                   │
│                                                                       │
│  2. IMPORTANT: Confirm 2 restaurant reservations                     │
│     • Menega Café (Day 3) - recommended to book                     │
│     • La Lucciola (Day 5) - fills up on weekends                    │
│     • [View Restaurants →]                                           │
│                                                                       │
│  3. REMINDER: Lisa hasn't voted on 4 items                           │
│     • Voting closes in 2 days                                        │
│     • [Send Reminder →]                                              │
│                                                                       │
│  ──────────────────────────────────────────────────────────────────  │
│  📈 TREND ANALYSIS (Last 7 Days)                                     │
│  ──────────────────────────────────────────────────────────────────  │
│                                                                       │
│  Health Score Trend:                                                 │
│  [📉 Chart showing: 65% → 72% → 75% → 78%]                          │
│  +13% improvement - Great progress! 📈                               │
│                                                                       │
│  Activity Trend:                                                     │
│  [📊 Bar chart: Daily votes, comments, bookings]                    │
│  Peak activity on weekends                                           │
│                                                                       │
│  [Close]                                                             │
└──────────────────────────────────────────────────────────────────────┘

END: Comprehensive trip health visibility
```

**Health Score Calculation:**

```javascript
healthScore = (
  budgetHealth * 0.25 +      // 25% weight
  votingConsensus * 0.20 +    // 20% weight
  bookingProgress * 0.30 +    // 30% weight (most important!)
  memberEngagement * 0.15 +   // 15% weight
  timeUrgency * 0.10          // 10% weight
) * 100

Thresholds:
90-100%: Excellent (green)
70-89%: Good (blue)
50-69%: Needs Attention (yellow)
<50%: Critical (red)
```

---

## Flow 5: Quick Actions from Atlas Suggestions

```
┌─────────────────────────────────────────────────────────────────────┐
│                   ATLAS QUICK ACTIONS FLOW                           │
└─────────────────────────────────────────────────────────────────────┘

SCENARIO: Atlas suggests adding an activity
────────────────────────────────────────────

User asks Atlas: "What should we do on Day 4 afternoon?"
    ↓
Atlas responds with suggestion:
    ┌────────────────────────────────────────────────────────────────┐
    │  🤖 Atlas AI                                                    │
    │  ────────────────────────────────────────────────────────────  │
    │  For Day 4 afternoon, I recommend the Tegalalang Rice          │
    │  Terraces! Here's why:                                          │
    │                                                                 │
    │  🌾 Tegalalang Rice Terraces                                   │
    │  📍 Ubud (30 min from your villa)                              │
    │  ⏰ Best time: 2:00 PM - 5:00 PM                               │
    │  💰 $5/person entrance + $20 optional swing                    │
    │  ⭐ 4.8/5 (3,500 reviews)                                       │
    │                                                                 │
    │  ✨ Perfect for:                                                │
    │  • Stunning Instagram photos                                    │
    │  • Cultural experience                                          │
    │  • Light walking (2-3 km trails)                               │
    │  • Jungle swing adventure (optional)                            │
    │                                                                 │
    │  ✅ Matches your "Balanced" trip vibe                          │
    │  ✅ Within budget ($25/person)                                  │
    │  ✅ Good for all fitness levels                                 │
    │                                                                 │
    │  [🔗 View Photos] [📍 Directions] [➕ Add to Itinerary]        │
    └────────────────────────────────────────────────────────────────┘
    ↓
User clicks [Add to Itinerary]
    ↓
Pre-filled form modal opens:
    ┌────────────────────────────────────────────────────────────────┐
    │  Add Activity to Itinerary                                      │
    │  ──────────────────────────────────────────────────────────────│
    │                                                                 │
    │  Category: ● Activity                                           │
    │                                                                 │
    │  Name: *                                                        │
    │  [Tegalalang Rice Terraces Visit                      ]        │
    │                                                                 │
    │  Description:                                                   │
    │  ┌──────────────────────────────────────────────────────────┐ │
    │  │ Explore stunning rice terraces with optional jungle      │ │
    │  │ swing. Best Instagram spot in Ubud!                      │ │
    │  └──────────────────────────────────────────────────────────┘ │
    │                                                                 │
    │  Day: [Day 4 ▼]  Time: [2:00 PM ▼]                            │
    │                                                                 │
    │  Location:                                                      │
    │  [Tegalalang, Ubud                                    ] 📍     │
    │                                                                 │
    │  Price per Person: [$25.00      ]                              │
    │                                                                 │
    │  Booking URL:                                                   │
    │  [https://maps.google.com/tegalalang...               ]        │
    │                                                                 │
    │  ✨ Suggested by Atlas AI                                      │
    │                                                                 │
    │  [Cancel]                          [Add Activity]               │
    └────────────────────────────────────────────────────────────────┘
    ↓
User reviews and clicks "Add Activity"
    ↓
POST /api/trips/:tripId/items
    ↓
✅ Activity added to Day 4 itinerary
    ↓
Atlas confirms in chat:
    ┌────────────────────────────────────────────────────────────────┐
    │  🤖 Atlas AI                                                    │
    │  ────────────────────────────────────────────────────────────  │
    │  Perfect! I've added Tegalalang Rice Terraces to Day 4 at     │
    │  2:00 PM. 🌾                                                    │
    │                                                                 │
    │  Your group can now vote on it. Based on your preferences,    │
    │  I think everyone will love this! 📸                           │
    │                                                                 │
    │  💡 Pro tip: Arrive early (by 2 PM) to avoid crowds and       │
    │  get the best photos. Don't forget your camera!                │
    └────────────────────────────────────────────────────────────────┘
    ↓
Notification sent to all trip members:
"New activity added: Tegalalang Rice Terraces - Vote now!"

END: Seamless action from Atlas suggestion
```

**Quick Action Types:**

1. ➕ Add to Itinerary - Adds suggested activity/restaurant
2. 💰 Apply Budget Optimization - Auto-adjusts budget items
3. 📧 Remind Members - Sends notifications to members
4. 🗳️ Resolve Deadlock - Implements compromise solution
5. 📋 Create Packing List - Saves to Coordination tab
6. 🔖 Bookmark Suggestion - Saves for later review

---

## Flow 6: Atlas Error Handling & Fallback

```
┌─────────────────────────────────────────────────────────────────────┐
│                  ATLAS ERROR HANDLING FLOW                           │
└─────────────────────────────────────────────────────────────────────┘

SCENARIO 1: AI API Timeout
───────────────────────────
User asks Atlas a question
    ↓
POST /api/trips/:id/atlas/conversation
    ↓
Call to Claude API times out (>30 seconds)
    ↓
Circuit breaker opens (after 5 failures)
    ↓
Fallback response triggered:
    ┌────────────────────────────────────────────────────────────────┐
    │  🤖 Atlas AI                                                    │
    │  ────────────────────────────────────────────────────────────  │
    │  ⚠️ I'm having trouble thinking right now (high demand).       │
    │                                                                 │
    │  Here's what I can tell you based on your trip data:           │
    │  • Budget: $8,550 spent / $9,000 total (95%)                   │
    │  • Completion: 78%                                              │
    │  • Pending votes: 2 items                                       │
    │                                                                 │
    │  I'll be back to full capacity shortly. Try asking again in    │
    │  a few minutes, or check the tabs above for detailed info.     │
    │                                                                 │
    │  [View Budget] [View Itinerary] [Try Again]                    │
    └────────────────────────────────────────────────────────────────┘
    ↓
User can:
    ├─ View trip data directly (no AI needed)
    └─ Try again later (circuit breaker resets after 5 min)

SCENARIO 2: Invalid AI Response
────────────────────────────────
Atlas receives malformed response from AI
    ↓
Response validation fails
    ↓
Automatic retry (up to 3 times)
    ↓
All retries fail
    ↓
Generic helpful response:
    ┌────────────────────────────────────────────────────────────────┐
    │  🤖 Atlas AI                                                    │
    │  ────────────────────────────────────────────────────────────  │
    │  I'm having trouble processing that right now. 😅              │
    │                                                                 │
    │  Can you try rephrasing your question? For example:            │
    │  • "Show me the budget breakdown"                              │
    │  • "What needs to be booked?"                                  │
    │  • "Suggest a restaurant for Day 3"                            │
    │                                                                 │
    │  Or explore your trip using the tabs above!                    │
    └────────────────────────────────────────────────────────────────┘

SCENARIO 3: Rate Limit Exceeded
────────────────────────────────
Too many Atlas requests in short time
    ↓
Rate limit: 10 requests/minute per trip
    ↓
Request blocked
    ┌────────────────────────────────────────────────────────────────┐
    │  🤖 Atlas AI                                                    │
    │  ────────────────────────────────────────────────────────────  │
    │  Whoa, slow down! 😊 I need a moment to catch up.              │
    │                                                                 │
    │  You can ask me again in 30 seconds.                           │
    │                                                                 │
    │  Meanwhile, feel free to browse your trip data in the tabs    │
    │  above - no waiting needed!                                    │
    └────────────────────────────────────────────────────────────────┘
    ↓
Countdown timer shown: [Retry in 28s...]

SCENARIO 4: No Trip Context
────────────────────────────
Atlas called before trip data loaded
    ↓
Missing critical context
    ↓
Graceful degradation:
    ┌────────────────────────────────────────────────────────────────┐
    │  🤖 Atlas AI                                                    │
    │  ────────────────────────────────────────────────────────────  │
    │  I'm still loading your trip details. Give me just a second! ⏳│
    │                                                                 │
    │  [Loading trip data...]                                         │
    └────────────────────────────────────────────────────────────────┘
    ↓
Wait for trip data to load
    ↓
Auto-retry when ready

END: Graceful error handling with helpful fallbacks
```

**Error Recovery Strategy:**

- ✅ Automatic retries (exponential backoff)
- ✅ Circuit breaker pattern (prevents cascading failures)
- ✅ Fallback to cached responses
- ✅ Graceful degradation (basic data still shown)
- ✅ Clear user communication (no technical jargon)
- ✅ Alternative actions offered

---

## Flow 7: Atlas Analytics & Learning

```
┌─────────────────────────────────────────────────────────────────────┐
│                   ATLAS ANALYTICS & LEARNING FLOW                    │
└─────────────────────────────────────────────────────────────────────┘

BACKGROUND: Atlas learns from user interactions
───────────────────────────────────────────────

Every Atlas interaction tracked:
    ├─ Question asked
    ├─ Response generated
    ├─ User satisfaction (implicit: did they ask again?)
    ├─ Actions taken (suggestion accepted/rejected)
    └─ Context (trip details, user preferences)
    ↓
Stored in analytics:
POST /api/analytics/atlas-interaction
Body: {
  tripId: "123",
  userId: "456",
  question: "Are we over budget?",
  responseType: "budget_analysis",
  suggestionAccepted: true,
  satisfactionScore: 5,
  timestamp: "2024-06-10T14:30:00Z"
}
    ↓
Aggregated metrics:
    ┌────────────────────────────────────────────────────────────────┐
    │  Atlas Performance Dashboard (Admin View)                      │
    │  ────────────────────────────────────────────────────────────  │
    │                                                                 │
    │  📊 USAGE STATS (Last 30 Days)                                 │
    │  • Total Conversations: 1,247                                  │
    │  • Unique Users: 389                                           │
    │  • Avg Questions/Trip: 3.2                                     │
    │  • Response Time (avg): 4.2 seconds                            │
    │                                                                 │
    │  🎯 EFFECTIVENESS                                              │
    │  • Suggestion Acceptance Rate: 73%                             │
    │  • User Satisfaction: 4.6/5                                    │
    │  • Successful Interventions: 89%                               │
    │  • Deadlock Resolutions: 94% accepted                          │
    │                                                                 │
    │  💬 TOP QUESTION CATEGORIES                                    │
    │  1. Budget inquiries: 28%                                      │
    │  2. Recommendations: 24%                                        │
    │  3. Booking help: 18%                                          │
    │  4. Trip status: 15%                                           │
    │  5. Other: 15%                                                 │
    │                                                                 │
    │  🔥 MOST HELPFUL FEATURES                                      │
    │  1. Budget optimization (85% acceptance)                        │
    │  2. Restaurant suggestions (79%)                                │
    │  3. Packing lists (88%)                                        │
    │  4. Deadlock resolution (94%)                                  │
    │                                                                 │
    │  ⚠️  AREAS FOR IMPROVEMENT                                     │
    │  • Flight recommendations (52% acceptance - needs work)        │
    │  • Generic questions (62% satisfaction)                        │
    └────────────────────────────────────────────────────────────────┘

PERSONALIZATION: Atlas learns preferences
──────────────────────────────────────────

User consistently accepts certain suggestions:
    ├─ Always picks seafood restaurants
    ├─ Prefers morning activities
    ├─ Budget-conscious (picks cheaper options)
    └─ Loves outdoor/nature activities
    ↓
Atlas adjusts future recommendations:
    ┌────────────────────────────────────────────────────────────────┐
    │  🤖 Atlas AI                                                    │
    │  ────────────────────────────────────────────────────────────  │
    │  Based on your previous trips, you might love the Nusa        │
    │  Penida day trip! 🏝️                                           │
    │                                                                 │
    │  I noticed you prefer:                                          │
    │  ✓ Outdoor/nature activities                                    │
    │  ✓ Morning departures (6-9 AM)                                 │
    │  ✓ Budget-friendly options ($30-50)                            │
    │                                                                 │
    │  This trip checks all those boxes! It includes:                │
    │  • Snorkeling at Crystal Bay                                   │
    │  • Kelingking Beach cliff views                                │
    │  • Angel's Billabong natural pool                              │
    │  • Early 7 AM departure                                        │
    │  • $45/person (includes lunch & transport)                     │
    │                                                                 │
    │  [Add to Itinerary] [Not Interested]                           │
    └────────────────────────────────────────────────────────────────┘

END: Continuous improvement through analytics
```

---

## All Atlas Use Cases Summary

### 1. Conversational Assistance

- ✅ Answer questions about trip details
- ✅ Provide recommendations (restaurants, activities)
- ✅ Explain budget breakdown
- ✅ Suggest packing lists
- ✅ Offer trip planning advice
- ✅ Resolve user confusion
- ✅ Multi-turn conversations with context

### 2. Proactive Monitoring

- ✅ Budget overrun alerts (>110%)
- ✅ Vote deadlock detection (>24h)
- ✅ Deadline urgency nudges (<7 days, <50% complete)
- ✅ Inactivity re-engagement (>3 days)
- ✅ Booking progress tracking
- ✅ Member participation monitoring
- ✅ Milestone celebrations (100% complete)

### 3. Intelligent Suggestions

- ✅ Budget optimization tips
- ✅ Activity recommendations
- ✅ Restaurant suggestions
- ✅ Packing list generation
- ✅ Itinerary improvements
- ✅ Time optimization
- ✅ Group compromise solutions

### 4. Problem Resolution

- ✅ Vote deadlock resolution
- ✅ Budget conflict mediation
- ✅ Schedule conflicts
- ✅ Member coordination issues
- ✅ Booking confusion
- ✅ Preference conflicts

### 5. Trip Health Management

- ✅ Overall health score calculation
- ✅ Metric tracking (budget, votes, bookings)
- ✅ Trend analysis
- ✅ Priority identification
- ✅ Risk detection
- ✅ Progress tracking

### 6. Quick Actions

- ✅ Add suggested items to itinerary
- ✅ Apply budget optimizations
- ✅ Send member reminders
- ✅ Implement compromises
- ✅ Create packing lists
- ✅ Generate recaps

### 7. Error Handling

- ✅ AI API timeouts
- ✅ Rate limiting
- ✅ Invalid responses
- ✅ Missing context
- ✅ Network errors
- ✅ Graceful degradation

### 8. Learning & Analytics

- ✅ User preference learning
- ✅ Interaction tracking
- ✅ Effectiveness metrics
- ✅ Personalized recommendations
- ✅ A/B testing suggestions
- ✅ Continuous improvement

---

## Technical Implementation

### AI Model Selection

```
Complex reasoning (60% of interactions):
- Model: Claude Sonnet 4.5
- Use for: Budget analysis, compromise suggestions, recommendations
- Cost: ~$0.02-0.03 per interaction

Simple tasks (40% of interactions):
- Model: Claude Haiku
- Use for: Packing lists, email parsing, simple Q&A
- Cost: ~$0.001-0.002 per interaction

Total average cost per trip: ~$0.50
```

### Caching Strategy

```
24-hour cache for:
- Trip health scores
- Budget analyses
- Common questions
- Recommendation lists

Cache hit rate: ~35%
Cost savings: ~40%
```

### Circuit Breaker

```
Opens after: 5 consecutive failures
Reset timeout: 5 minutes
Fallback: Cached responses or basic data

Uptime: 99.8%
```

### Rate Limiting

```
Per trip: 10 requests/minute
Per user: 50 requests/hour
Burst allowance: 20 requests

Prevents: Abuse and cost overruns
```

---

## Analytics & Tracking

**Events Tracked:**

1. `atlas_chat_initiated` - User opened Atlas
2. `atlas_question_asked` - Question sent
3. `atlas_response_generated` - Response delivered
4. `atlas_suggestion_accepted` - User acted on suggestion
5. `atlas_suggestion_rejected` - User dismissed suggestion
6. `atlas_intervention_triggered` - Proactive alert sent
7. `atlas_error_occurred` - Fallback activated

**Metrics Tracked:**

- Total conversations per trip
- Average questions per user
- Response time (p50, p95, p99)
- Suggestion acceptance rate
- User satisfaction (implicit)
- Cost per interaction
- Cache hit rate
- Error rate

---

**Last Updated:** 2026-07-11
**Status:** ✅ Complete and Production-Ready
