# Trip Creation & AI Generation Flows

Complete end-to-end flows for creating trips and AI-powered itinerary generation in TripSync.

---

## Flow 1: Create Trip Wizard (5-Step Process)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TRIP CREATION WIZARD FLOW                         │
└─────────────────────────────────────────────────────────────────────┘

START: User clicks "Create New Trip" from dashboard
    ↓
POST /api/trips (creates empty trip)
    ├─ Generates unique trip ID
    ├─ Sets user as organizer
    └─ Status: "draft"
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Create Trip Page (/create?tripId=xxx)                                │
│  ══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  STEP 1 of 5: Trip Basics                                           │
│  ──────────────────────────────────────────────────────────────────  │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  📍 Destination *                                               │ │
│  │  [                                                      ]       │ │
│  │  ↳ Autocomplete with popular destinations                      │ │
│  │     (e.g., "Bali, Indonesia", "Paris, France")                 │ │
│  │                                                                 │ │
│  │  📅 Travel Dates *                                              │ │
│  │  From: [____/____/____]   To: [____/____/____]                │ │
│  │  ↳ Date picker with validation                                 │ │
│  │  ↳ Shows: "7 days, 6 nights"                                   │ │
│  │                                                                 │ │
│  │  💰 Budget per Person (USD) *                                   │ │
│  │  [$___________]                                                │ │
│  │  ↳ Slider: $100 - $10,000                                      │ │
│  │  ↳ Shows: Total budget for group                               │ │
│  │                                                                 │ │
│  │  👥 Group Size *                                                │ │
│  │  [____] people                                                 │ │
│  │  ↳ Number input: 1-50                                          │ │
│  │  ↳ Free tier: Max 6 people                                     │ │
│  │  ↳ Pro tier: Unlimited                                         │ │
│  │                                                                 │ │
│  │  📝 Trip Name (Optional)                                        │ │
│  │  [                                                      ]       │ │
│  │  ↳ Auto-generated if blank: "{Destination} {Month} {Year}"    │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  Validation:                                                         │
│  ├─ All required fields filled                                       │
│  ├─ End date after start date                                        │
│  ├─ Budget > $0                                                       │
│  ├─ Group size within tier limits                                    │
│  └─ Destination is valid location                                    │
│                                                                       │
│  [← Back to Dashboard]           [Continue to Step 2 →]              │
└──────────────────────────────────────────────────────────────────────┘
    ↓
User clicks "Continue to Step 2"
    ↓
PATCH /api/trips/:id (save step 1 data)
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  STEP 2 of 5: Trip Vibe                                             │
│  ──────────────────────────────────────────────────────────────────  │
│                                                                       │
│  What kind of trip vibe are you looking for? *                       │
│                                                                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐  │
│  │  🏖️         │  │  ⛰️          │  │  🍽️         │  │  🏛️          │  │
│  │  Relaxing  │  │  Adventure │  │  Foodie    │  │  Cultural  │  │
│  │  ○         │  │  ○         │  │  ○         │  │  ○         │  │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘  │
│                                                                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                  │
│  │  🎉         │  │  🌃         │  │  ⚖️          │                  │
│  │  Party     │  │  Nightlife │  │  Balanced  │                  │
│  │  ○         │  │  ○         │  │  ○         │                  │
│  └────────────┘  └────────────┘  └────────────┘                  │
│                                                                       │
│  ↳ Single select (one vibe only)                                     │
│  ↳ Default: "Balanced"                                                │
│                                                                       │
│  [← Back]                             [Continue to Step 3 →]         │
└──────────────────────────────────────────────────────────────────────┘
    ↓
User selects vibe and clicks "Continue"
    ↓
PATCH /api/trips/:id (save step 2 data)
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  STEP 3 of 5: Accommodation Preference                              │
│  ──────────────────────────────────────────────────────────────────  │
│                                                                       │
│  Where would you prefer to stay? *                                   │
│                                                                       │
│  ┌────────────────────┐  ┌────────────────────┐  ┌──────────────┐ │
│  │  🏨                 │  │  🏡                 │  │  🎲          │ │
│  │  Hotels/Resorts    │  │  Airbnb/Vacation   │  │  Mix of Both │ │
│  │                    │  │  Rentals           │  │              │ │
│  │  ○                 │  │  ○                 │  │  ○           │ │
│  │                    │  │                    │  │              │ │
│  │  • Professional    │  │  • Homely feel     │  │  • Variety   │ │
│  │  • Amenities       │  │  • More space      │  │  • Flexible  │ │
│  │  • Convenient      │  │  • Group-friendly  │  │  • Balanced  │ │
│  └────────────────────┘  └────────────────────┘  └──────────────┘ │
│                                                                       │
│  ↳ Single select                                                      │
│  ↳ Influences AI hotel recommendations                                │
│                                                                       │
│  [← Back]                             [Continue to Step 4 →]         │
└──────────────────────────────────────────────────────────────────────┘
    ↓
User selects accommodation type
    ↓
PATCH /api/trips/:id (save step 3 data)
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  STEP 4 of 5: Dining Preference                                     │
│  ──────────────────────────────────────────────────────────────────  │
│                                                                       │
│  What's your dining style? *                                          │
│                                                                       │
│  ┌────────────────────┐  ┌────────────────────┐  ┌──────────────┐ │
│  │  🍽️                  │  │  🥙                 │  │  🎲          │ │
│  │  Fine Dining       │  │  Casual/Street     │  │  Mix         │ │
│  │                    │  │  Food              │  │              │ │
│  │  ○                 │  │  ○                 │  │  ○           │ │
│  │                    │  │                    │  │              │ │
│  │  • Upscale         │  │  • Authentic       │  │  • Variety   │ │
│  │  • Reservations    │  │  • Budget-friendly │  │  • Flexible  │ │
│  │  • Special meals   │  │  • Local spots     │  │  • Balanced  │ │
│  └────────────────────┘  └────────────────────┘  └──────────────┘ │
│                                                                       │
│  ↳ Single select                                                      │
│  ↳ Influences AI restaurant recommendations                           │
│                                                                       │
│  [← Back]                             [Continue to Step 5 →]         │
└──────────────────────────────────────────────────────────────────────┘
    ↓
User selects dining preference
    ↓
PATCH /api/trips/:id (save step 4 data)
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  STEP 5 of 5: Invite Members (Optional)                             │
│  ──────────────────────────────────────────────────────────────────  │
│                                                                       │
│  Invite people to collaborate on this trip                           │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Enter email addresses (one per line or comma-separated):      │ │
│  │                                                                 │ │
│  │  ┌──────────────────────────────────────────────────────────┐ │ │
│  │  │ friend1@example.com                                      │ │ │
│  │  │ friend2@example.com                                      │ │ │
│  │  │                                                           │ │ │
│  │  └──────────────────────────────────────────────────────────┘ │ │
│  │                                                                 │ │
│  │  Role for invited members:                                      │ │
│  │  ○ Planner (can edit trip)                                      │ │
│  │  ● Member (can view and vote)                                   │ │
│  │                                                                 │ │
│  │  ✅ Members added: 2                                            │ │
│  │  ⚠️  Free tier limit: 6 members total                           │ │
│  │                                                                 │ │
│  │  [Add More Emails]                                              │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  OR                                                                   │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Share trip link:                                               │ │
│  │  https://tripsync.app/join/ABC123                              │ │
│  │  [Copy Link] [Share via Email]                                  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ℹ️  You can invite more people later from the trip page            │
│                                                                       │
│  [← Back]              [Skip]       [Generate Trip with AI 🤖 →]    │
└──────────────────────────────────────────────────────────────────────┘
    ↓
User clicks "Generate Trip with AI"
    ↓
Validation Check:
    ├─ All required steps complete? ✓
    ├─ Within tier limits? ✓
    └─ Valid data? ✓
    ↓
POST /api/trips/:id/regenerate-itinerary
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  AI Generation Modal (Non-dismissible during generation)             │
│  ══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                      🤖 Creating Your Trip                      │ │
│  │                                                                 │ │
│  │              [████████████░░░░░░░] 75%                         │ │
│  │                                                                 │ │
│  │  ✅ Analyzing your preferences...                              │ │
│  │  ✅ Researching best activities in Bali...                     │ │
│  │  ✅ Finding top-rated restaurants...                           │ │
│  │  🔄 Building your day-by-day itinerary...                      │ │
│  │  ⏳ Calculating price estimates...                             │ │
│  │  ⏳ Adding booking links...                                     │ │
│  │                                                                 │ │
│  │  ⏱️  Estimated time: 30-60 seconds                             │ │
│  │  💡 Pro tip: AI considers your budget, group size, and vibe   │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  Real-time progress updates                                          │
│  WebSocket connection for live status                                │
└──────────────────────────────────────────────────────────────────────┘
    ↓
Backend AI Processing (30-60 seconds):
    ├─ Claude Sonnet 4.5 analyzes inputs
    ├─ Generates flights, hotels, activities, meals
    ├─ Creates day-by-day itinerary with timing
    ├─ Adds price estimates and booking URLs
    ├─ Optimizes for budget and group preferences
    └─ Returns complete itinerary JSON
    ↓
✅ Generation Complete!
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Success Modal                                                       │
│                                                                       │
│  🎉 Your trip is ready!                                             │
│                                                                       │
│  We've created a complete 7-day itinerary with:                     │
│  ✅ Flight recommendations                                           │
│  ✅ 5 hotel options                                                  │
│  ✅ 21 meal suggestions                                              │
│  ✅ 18 activities and attractions                                    │
│  ✅ Price estimates totaling $1,485/person                           │
│                                                                       │
│  [View Your Trip →]                                                  │
└──────────────────────────────────────────────────────────────────────┘
    ↓
Redirect to /trip/:id (Trip Detail Page)

END: Trip created with full AI-generated itinerary
```

**Success Criteria:**
- ✅ All 5 wizard steps completed
- ✅ Trip saved as "active" status
- ✅ AI generation completes in <60 seconds
- ✅ Full itinerary with 15-25 items created
- ✅ Price estimates within ±10% accuracy
- ✅ Booking URLs included for all major items
- ✅ Members invited (if specified)

**Error Handling:**
- Incomplete wizard → Highlight missing fields
- AI generation timeout (>2 min) → Retry with fallback
- API error → Show error + option to regenerate
- Tier limit exceeded → Prompt to upgrade
- Network error → Save progress, allow retry

---

## Flow 2: AI Itinerary Generation (Backend Process)

```
┌─────────────────────────────────────────────────────────────────────┐
│                  AI ITINERARY GENERATION PROCESS                     │
└─────────────────────────────────────────────────────────────────────┘

POST /api/trips/:id/regenerate-itinerary
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Step 1: Input Collection & Validation                              │
│  ──────────────────────────────────────────────────────────────────  │
│                                                                       │
│  Collect from database:                                              │
│  ├─ Trip destination                                                 │
│  ├─ Start date & end date (calculate duration)                       │
│  ├─ Budget per person                                                │
│  ├─ Group size                                                        │
│  ├─ Trip vibe preference                                             │
│  ├─ Accommodation preference                                         │
│  ├─ Dining preference                                                │
│  └─ Member preferences (dietary, accessibility, etc.)                │
│                                                                       │
│  Validate:                                                           │
│  ├─ User has AI generation quota remaining                           │
│  ├─ Trip duration is reasonable (1-30 days)                          │
│  ├─ Budget is realistic ($100+ per person)                           │
│  └─ Destination is valid                                             │
└──────────────────────────────────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Step 2: Check AI Cache (Performance Optimization)                  │
│  ──────────────────────────────────────────────────────────────────  │
│                                                                       │
│  Generate cache key:                                                 │
│  SHA256(destination + dates + budget + vibe + preferences)          │
│                                                                       │
│  Check Redis cache:                                                  │
│  ├─ Cache HIT → Return cached itinerary (instant!)                  │
│  └─ Cache MISS → Continue to AI generation                           │
│                                                                       │
│  Cache TTL: 24 hours                                                 │
│  Cache invalidated on: Trip preferences change                       │
└──────────────────────────────────────────────────────────────────────┘
    ↓
Cache MISS → Generate with AI
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Step 3: Construct AI Prompt                                        │
│  ──────────────────────────────────────────────────────────────────  │
│                                                                       │
│  Build comprehensive prompt for Claude Sonnet 4.5:                   │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  You are a professional travel planner creating a trip to      │ │
│  │  {destination} for {group_size} people from {start_date} to    │ │
│  │  {end_date} ({duration} days).                                 │ │
│  │                                                                 │ │
│  │  Budget: ${budget} per person (total: ${total_budget})         │ │
│  │  Trip vibe: {vibe}                                             │ │
│  │  Accommodation: {accommodation_pref}                           │ │
│  │  Dining: {dining_pref}                                         │ │
│  │                                                                 │ │
│  │  Member preferences:                                           │ │
│  │  - Dietary: {dietary_restrictions}                             │ │
│  │  - Accessibility: {accessibility_needs}                        │ │
│  │  - Interests: {member_interests}                               │ │
│  │                                                                 │ │
│  │  Please generate a complete day-by-day itinerary including:   │ │
│  │  1. Flight recommendations with booking URLs                   │ │
│  │  2. Hotel options (3-5) with booking URLs                      │ │
│  │  3. Detailed daily activities with:                            │ │
│  │     - Activity name and description                            │ │
│  │     - Time (realistic, accounts for travel)                    │ │
│  │     - Location (address or area)                               │ │
│  │     - Price estimate per person                                │ │
│  │     - Booking URL (if applicable)                              │ │
│  │     - Category (flight/accommodation/meal/activity)            │ │
│  │  4. All meals (breakfast, lunch, dinner) for each day          │ │
│  │  5. Balance budget across activities                           │ │
│  │                                                                 │ │
│  │  Return as JSON matching this schema:                          │ │
│  │  {schema definition...}                                        │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Step 4: Call Anthropic API                                         │
│  ──────────────────────────────────────────────────────────────────  │
│                                                                       │
│  POST https://api.anthropic.com/v1/messages                         │
│                                                                       │
│  Headers:                                                            │
│  ├─ x-api-key: {ANTHROPIC_API_KEY}                                  │
│  ├─ anthropic-version: 2023-06-01                                   │
│  └─ content-type: application/json                                   │
│                                                                       │
│  Body:                                                               │
│  ├─ model: "claude-sonnet-4-5-20250929"                             │
│  ├─ max_tokens: 8000                                                 │
│  ├─ temperature: 0.7                                                 │
│  ├─ system: {travel expert instructions}                             │
│  └─ messages: [{role: "user", content: {prompt}}]                   │
│                                                                       │
│  Timeout: 120 seconds                                                │
│  Retry: Up to 3 times with exponential backoff                       │
│  Circuit Breaker: Opens after 5 consecutive failures                 │
└──────────────────────────────────────────────────────────────────────┘
    ↓
Claude Sonnet 4.5 processes (30-60 seconds)
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Step 5: Parse & Validate AI Response                               │
│  ──────────────────────────────────────────────────────────────────  │
│                                                                       │
│  Extract JSON from response                                          │
│  ├─ Handle markdown code blocks                                      │
│  └─ Parse JSON with error handling                                   │
│                                                                       │
│  Validate response structure:                                        │
│  ├─ Contains flights section                                         │
│  ├─ Contains accommodation options                                   │
│  ├─ Has items for each day                                           │
│  ├─ All items have required fields                                   │
│  ├─ Prices are reasonable                                            │
│  ├─ Total cost within budget (±20%)                                  │
│  └─ Dates match trip duration                                        │
│                                                                       │
│  If validation fails:                                                │
│  ├─ Log error details                                                │
│  ├─ Retry with adjusted prompt (if retries < 3)                      │
│  └─ Return fallback basic itinerary                                  │
└──────────────────────────────────────────────────────────────────────┘
    ↓
✅ Valid response received
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Step 6: Save to Database                                           │
│  ──────────────────────────────────────────────────────────────────  │
│                                                                       │
│  Transaction START                                                   │
│                                                                       │
│  1. Delete existing itinerary items (if regenerating)                │
│     DELETE FROM itinerary_items WHERE trip_id = {id}                │
│                                                                       │
│  2. Insert new itinerary items                                       │
│     INSERT INTO itinerary_items (trip_id, day, time, ...)           │
│     VALUES (...) FOR EACH item                                       │
│                                                                       │
│  3. Update trip metadata                                             │
│     UPDATE trips SET                                                 │
│       estimated_cost = {total_cost},                                 │
│       ai_generated_at = NOW(),                                       │
│       ai_generation_count = ai_generation_count + 1,                │
│       status = 'active'                                              │
│     WHERE id = {id}                                                  │
│                                                                       │
│  4. Decrement user's AI quota                                        │
│     UPDATE users SET ai_generations_remaining -= 1                   │
│                                                                       │
│  Transaction COMMIT                                                  │
│                                                                       │
│  If any step fails → ROLLBACK and return error                       │
└──────────────────────────────────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Step 7: Cache Result                                               │
│  ──────────────────────────────────────────────────────────────────  │
│                                                                       │
│  Store in Redis:                                                     │
│  SET cache_key = {itinerary_json}                                    │
│  EXPIRE cache_key = 86400 (24 hours)                                 │
│                                                                       │
│  Benefits:                                                           │
│  ├─ Instant regeneration if same parameters                          │
│  ├─ Cost savings (avoid duplicate AI calls)                          │
│  └─ Improved reliability (fallback if AI fails)                      │
└──────────────────────────────────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Step 8: Send Notifications                                         │
│  ──────────────────────────────────────────────────────────────────  │
│                                                                       │
│  1. Notify trip creator (success)                                    │
│     ├─ In-app notification                                           │
│     ├─ Push notification (if enabled)                                │
│     └─ Email (optional)                                              │
│                                                                       │
│  2. Notify invited members                                           │
│     ├─ "{Creator} created a trip to {destination}"                   │
│     ├─ Email with trip preview                                       │
│     └─ Deep link to join trip                                        │
│                                                                       │
│  3. Track analytics event                                            │
│     Event: "trip_generated"                                          │
│     Properties:                                                      │
│     ├─ destination                                                   │
│     ├─ duration_days                                                 │
│     ├─ budget_per_person                                             │
│     ├─ group_size                                                    │
│     ├─ generation_time_ms                                            │
│     ├─ item_count                                                    │
│     └─ user_tier                                                     │
└──────────────────────────────────────────────────────────────────────┘
    ↓
Return success response to frontend
    ↓
Frontend redirects to /trip/:id

END: Complete itinerary generated and saved
```

**AI Generation Stats:**
- Average time: 30-60 seconds
- Success rate: 98%+
- Average items per trip: 15-25
- Price estimate accuracy: 95%
- Cache hit rate: ~40% (significant cost savings)

**Cost Optimization:**
- Claude Sonnet 4.5: $3 per 1M input tokens
- Average prompt: ~1,500 tokens
- Average response: ~6,000 tokens
- Cost per generation: ~$0.02-0.03
- With 40% cache hit rate: Effective cost ~$0.012-0.018

---

## Flow 3: Regenerate Existing Itinerary

```
┌─────────────────────────────────────────────────────────────────────┐
│                    REGENERATE ITINERARY FLOW                         │
└─────────────────────────────────────────────────────────────────────┘

User is on Trip Detail Page (/trip/:id)
    ↓
Clicks "Regenerate with AI" button (Itinerary tab)
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Confirmation Dialog                                                 │
│                                                                       │
│  ⚠️  Regenerate Itinerary?                                           │
│                                                                       │
│  This will replace your current itinerary with a new AI-generated   │
│  one. Your existing activities will be deleted.                      │
│                                                                       │
│  Member votes and comments will be lost.                             │
│                                                                       │
│  Current preferences will be used:                                   │
│  ✓ Same destination, dates, budget                                   │
│  ✓ Member dietary/accessibility preferences                          │
│  ✓ Previous trip vibe settings                                       │
│                                                                       │
│  [Cancel]                    [Yes, Regenerate]                       │
└──────────────────────────────────────────────────────────────────────┘
    ↓
User confirms
    ↓
Check AI quota:
    ├─ Free tier: 1 generation per trip
    │   └─ Already used? → Show upgrade prompt
    ├─ Pro tier: Unlimited
    └─ Teams tier: Unlimited
    ↓
POST /api/trips/:id/regenerate-itinerary
    ↓
Same AI generation process as Flow 2
    ↓
On completion:
    ├─ Old itinerary items deleted
    ├─ New items inserted
    ├─ Votes reset
    └─ Comments archived
    ↓
✅ Success notification
    ↓
Page auto-refreshes to show new itinerary

END: Fresh itinerary generated
```

**Regeneration Triggers:**
- User manually clicks "Regenerate"
- Trip preferences significantly changed
- Atlas AI suggests regeneration (if trip health score low)

**Data Preservation:**
- Trip metadata (dates, destination, etc.) preserved
- Member list preserved
- Expenses preserved
- Photos preserved
- Old itinerary archived (optional recovery)

---

## Flow 4: Manual Trip Creation (No AI)

```
┌─────────────────────────────────────────────────────────────────────┐
│                  MANUAL TRIP CREATION FLOW                           │
└─────────────────────────────────────────────────────────────────────┘

User wants to build trip manually without AI
    ↓
Dashboard → Create Trip
    ↓
Complete Steps 1-5 of wizard
    ↓
OPTION: Click "Skip AI Generation" on final step
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Confirmation                                                        │
│                                                                       │
│  Create trip without AI?                                             │
│                                                                       │
│  You'll start with an empty itinerary and add activities manually.  │
│  You can always generate with AI later from the trip page.           │
│                                                                       │
│  [Go Back]              [Create Empty Trip]                          │
└──────────────────────────────────────────────────────────────────────┘
    ↓
User confirms
    ↓
POST /api/trips (creates trip without AI call)
    ├─ Status: "active"
    ├─ Itinerary: empty
    └─ ai_generated: false
    ↓
Redirect to /trip/:id
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Trip Detail - Empty Itinerary State                                 │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  📅 Your itinerary is empty                                     │ │
│  │                                                                 │ │
│  │  Get started by:                                               │ │
│  │  • [🤖 Generate with AI] - Let AI create your plan            │ │
│  │  • [+ Add Activity] - Add items manually                       │ │
│  │  • [📋 Import from Email] - Parse booking emails (Pro)        │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
    ↓
User can:
    ├─ Generate with AI (→ Flow 2)
    ├─ Add items manually (→ Flow 5)
    └─ Import from emails (→ Flow 6)

END: Empty trip created, ready for manual planning
```

---

## Flow 5: Add Itinerary Item Manually

```
┌─────────────────────────────────────────────────────────────────────┐
│                  MANUALLY ADD ITINERARY ITEM                         │
└─────────────────────────────────────────────────────────────────────┘

User on Trip Detail Page → Itinerary Tab
    ↓
Clicks "+ Add Activity" button
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Add Activity Dialog                                                 │
│  ══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  Category *                                                          │
│  [○ Flight] [○ Accommodation] [●  Meal] [○ Activity]                │
│                                                                       │
│  Activity Name *                                                     │
│  [Dinner at La Lucciola                                    ]         │
│                                                                       │
│  Description                                                         │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Beachfront Italian restaurant with sunset views            │  │
│  │                                                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  Date & Time *                                                       │
│  Date: [June 15, 2024 ▼]   Time: [7:00 PM ▼]                       │
│                                                                       │
│  Location                                                            │
│  [Seminyak Beach, Bali                                     ] 📍      │
│  ↳ Autocomplete with Google Places                                  │
│                                                                       │
│  Price per Person                                                    │
│  [$  50.00        ]                                                  │
│                                                                       │
│  Booking URL (optional)                                              │
│  [https://                                              ]            │
│                                                                       │
│  Booking Status                                                      │
│  [Not Booked ▼]  (options: Not Booked, Pending, Booked)            │
│                                                                       │
│  [Cancel]                               [Add Activity]               │
└──────────────────────────────────────────────────────────────────────┘
    ↓
User fills form and clicks "Add Activity"
    ↓
POST /api/trips/:tripId/items
    ↓
Validation:
    ├─ Name required
    ├─ Date within trip dates
    ├─ Price >= 0
    └─ Time is valid
    ↓
✅ Item created
    ├─ Inserted into database
    ├─ Added to trip's itinerary
    └─ Budget recalculated
    ↓
Dialog closes, itinerary refreshes
    ↓
New item appears in day-by-day view
    ↓
Atlas AI notification (optional):
"I noticed you added dinner at La Lucciola.
Great choice! It has excellent sunset views.
I recommend booking a table by the window."

END: Manual item added to itinerary
```

---

## Flow 6: Import from Email (Pro Feature)

```
┌─────────────────────────────────────────────────────────────────────┐
│                   EMAIL IMPORT FLOW (PRO)                            │
└─────────────────────────────────────────────────────────────────────┘

User on Trip Detail → Coordination Tab
    ↓
Clicks "Import from Email" (Pro badge shown)
    ↓
Check subscription:
    ├─ Free tier → Show upgrade prompt
    └─ Pro/Teams → Continue
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Import Booking Email Dialog                                        │
│  ══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  Paste your booking confirmation email below:                        │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Subject: Your Flight Booking Confirmation                      │ │
│  │                                                                 │ │
│  │ Dear John,                                                      │ │
│  │                                                                 │ │
│  │ Your flight is confirmed!                                       │ │
│  │ LA (LAX) → Bali (DPS)                                          │ │
│  │ Date: June 15, 2024                                            │ │
│  │ Time: 10:00 AM                                                 │ │
│  │ Confirmation: ABC123XYZ                                         │ │
│  │ Total: $850.00                                                 │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  [Cancel]                            [Parse Email with AI 🤖]       │
└──────────────────────────────────────────────────────────────────────┘
    ↓
User clicks "Parse Email"
    ↓
POST /api/trips/:tripId/parse-email
    ├─ Sends email text to Claude Haiku (fast + cheap)
    ├─ Extracts: type, name, date, time, price, confirmation #
    └─ Returns structured JSON
    ↓
AI parsing (2-5 seconds)
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Review Extracted Information                                        │
│  ══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  We extracted the following details. Please review:                  │
│                                                                       │
│  Type: ✈️ Flight                                                     │
│  Name: LAX → DPS Flight                                              │
│  Date: June 15, 2024                                                 │
│  Time: 10:00 AM                                                      │
│  Price: $850.00 per person                                           │
│  Confirmation: ABC123XYZ                                             │
│                                                                       │
│  [Edit Details] [Cancel]          [Add to Itinerary]                │
└──────────────────────────────────────────────────────────────────────┘
    ↓
User confirms
    ↓
POST /api/trips/:tripId/items (with parsed data)
    ↓
✅ Item added to itinerary with booking confirmed
    ↓
Success notification:
"Flight booking imported successfully! ✓"

END: Email booking automatically added to trip
```

**Supported Email Types:**
- ✅ Flights (airlines, booking sites)
- ✅ Hotels (major chains, Airbnb, Booking.com)
- ✅ Activities (Viator, GetYourGuide, etc.)
- ✅ Restaurant reservations (OpenTable, Resy)
- ✅ Transportation (car rentals, train tickets)

**AI Model Used:**
- Claude Haiku (fast, cost-effective for parsing)
- Average parsing time: 2-5 seconds
- Cost: ~$0.001 per email

---

## Error Scenarios & Edge Cases

### Edge Case 1: AI Generation Fails

```
AI generation times out (>120 seconds)
    ↓
Automatic retry (up to 3 times)
    ↓
All retries fail
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Error Message                                                       │
│                                                                       │
│  ⚠️  AI Generation Failed                                            │
│                                                                       │
│  We couldn't generate your itinerary right now.                      │
│  This could be due to high demand or a temporary issue.              │
│                                                                       │
│  Options:                                                            │
│  • [Try Again] - Retry AI generation                                 │
│  • [Create Manually] - Start with empty itinerary                    │
│  • [Contact Support] - Get help from our team                        │
└──────────────────────────────────────────────────────────────────────┘
    ↓
User chooses option
    ├─ Try Again → Retry generation
    ├─ Create Manually → Empty trip created
    └─ Contact Support → Opens support chat
```

### Edge Case 2: Tier Limit Exceeded

```
User tries to create trip
    ↓
Check tier limits:
Free tier:
    ├─ Already have 3 active trips
    └─ Group size > 6 members
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Upgrade Required                                                    │
│                                                                       │
│  🔒 You've reached your plan limit                                   │
│                                                                       │
│  Free Plan Limits:                                                   │
│  • 3 active trips (you have 3)                                       │
│  • 6 members per trip                                                │
│                                                                       │
│  Upgrade to Pro for:                                                 │
│  ✓ Unlimited trips                                                   │
│  ✓ Unlimited members                                                 │
│  ✓ Unlimited AI generations                                          │
│                                                                       │
│  Just $4.99/month                                                    │
│                                                                       │
│  [Maybe Later]              [Upgrade to Pro →]                       │
└──────────────────────────────────────────────────────────────────────┘
```

### Edge Case 3: Invalid Destination

```
User enters unusual destination:
"Nowhere, Kansas" or "123 Fake St"
    ↓
AI generation attempts
    ↓
AI returns error or generic itinerary
    ↓
Show warning:
"⚠️  We couldn't find much information about this destination.
The generated itinerary may be limited. Consider choosing a
more popular destination or adding activities manually."
```

### Edge Case 4: Concurrent Edits

```
Two users editing trip simultaneously
    ↓
User A regenerates itinerary
User B is viewing old itinerary
    ↓
WebSocket notification to User B:
"This trip was just updated. Refresh to see changes."
    ↓
User B refreshes → Sees new itinerary
```

---

## Analytics & Tracking

**Events Tracked:**
1. `trip_creation_started` - Wizard step 1 loaded
2. `trip_creation_step_completed` - Each step finished
3. `trip_creation_abandoned` - User left wizard mid-flow
4. `ai_generation_requested` - User clicked generate
5. `ai_generation_completed` - Successful generation
6. `ai_generation_failed` - Generation error
7. `trip_regenerated` - Existing trip regenerated
8. `manual_trip_created` - Skipped AI generation
9. `manual_item_added` - User added item manually
10. `email_imported` - Booking email parsed

**Metrics Tracked:**
- Average wizard completion time
- Step abandonment rates
- AI generation success rate
- Average generation time
- Items per trip (AI vs manual)
- Budget accuracy (estimated vs actual)
- User satisfaction with AI results

---

**Last Updated:** 2026-07-11
**Status:** ✅ Complete and Production-Ready
