# TripSync AI Agent: "Atlas" Design Document

**Agent Name:** **Atlas** (the titan who held up the world - symbolizes supporting travelers)
**Alternative Names:** Scout, Guide, Compass, Pilot, Navigator

**Tagline:** "Your intelligent travel companion"

---

## 🎯 DESIGN PHILOSOPHY

**Core Principle:** Atlas doesn't wait to be asked - it **observes, understands, and proactively assists**.

### What Makes Atlas Exceptional:

1. **Context-Aware:** Knows exactly where user is in trip planning journey
2. **Proactive:** Surfaces help before user gets stuck
3. **Journey-Intelligent:** Tracks progress across the entire planning workflow
4. **Non-Intrusive:** Helps when needed, invisible when not
5. **Conversational Memory:** Remembers previous interactions within trip context
6. **Group-Aware:** Understands group dynamics and decision-making state

---

## 🧠 CONTEXT ENGINE (The Brain)

### What Atlas Tracks in Real-Time:

```javascript
{
  // Trip Context
  tripStage: "itinerary_planning" | "inviting" | "voting" | "booking" | "pre_trip" | "during_trip",
  tripId: "trip_123",
  tripData: {
    destination: "Paris",
    startDate: "2026-06-15",
    endDate: "2026-06-22",
    groupSize: 6,
    budget: 3000,
    completionPercentage: 45,
  },

  // User Journey State
  currentPage: "/trip/trip_123",
  currentTab: "itinerary",
  timeOnPage: 120, // seconds
  scrollDepth: 65, // percentage
  lastAction: "clicked_add_activity",
  lastActionTime: "2026-02-24T10:30:00Z",

  // User Behavior Signals
  stuckIndicators: {
    inactivityTime: 45, // seconds without action
    backButtonClicks: 2,
    formFieldsAbandoned: ["budget_per_person"],
    featureHovers: ["ai_generate_button"], // hovering but not clicking
    emptyStates: ["no_itinerary_items"],
  },

  // Progress Tracking
  completedSteps: ["destination_set", "dates_set", "group_invited"],
  incompleteSteps: ["itinerary_filled", "budget_set", "accommodations_added"],
  blockers: ["waiting_for_votes", "no_ai_suggestions_yet"],

  // Group Context
  groupActivity: {
    totalMembers: 6,
    activeMembers: 3,
    pendingInvites: 2,
    recentVotes: 4,
    consensusLevel: "high" | "medium" | "low",
  },

  // Conversation Memory
  previousInteractions: [
    { timestamp: "2026-02-24T09:00:00Z", topic: "how_to_add_flights", resolved: true },
    { timestamp: "2026-02-24T10:15:00Z", topic: "ai_itinerary_help", resolved: false },
  ],

  // User Profile
  userTier: "pro" | "free",
  experienceLevel: "first_trip" | "experienced" | "power_user",
  preferredLearningStyle: "tooltips" | "video" | "chat",
}
```

---

## 🚀 PROACTIVE INTELLIGENCE SYSTEM

### When Atlas Appears (Trigger Conditions):

#### 1. **Inactivity Detection**
```javascript
IF user idle > 30 seconds ON form page
AND form incomplete
THEN: "Need help filling this out? I can explain what each field does."
```

#### 2. **Confusion Signals**
```javascript
IF user clicks back button 2+ times
OR hovers over same button for >10 seconds without clicking
OR opens and closes same modal 2+ times
THEN: "I noticed you're exploring [feature]. Want me to walk you through it?"
```

#### 3. **Empty State Assistance**
```javascript
IF user views empty itinerary for >20 seconds
AND no AI suggestions generated
THEN: "Ready to build your itinerary? I can generate AI suggestions based on your Paris trip dates and budget."
```

#### 4. **Feature Discovery**
```javascript
IF user is on free plan
AND viewing limited feature (map view, offline access)
THEN: "This feature is available on Pro. Want to see what it does? I can give you a quick demo."
```

#### 5. **Group Coordination Help**
```javascript
IF pendingInvites > 0 for >24 hours
THEN: "2 people haven't responded to your invite yet. Want me to help you send a reminder?"

IF votes stuck at 50/50 for >1 hour
THEN: "Looks like the group is split on [activity]. I can suggest a compromise or tiebreaker vote."
```

#### 6. **Budget Optimization**
```javascript
IF total expenses > budgetPerPerson * groupSize
THEN: "Your current itinerary is $450 over budget. Want me to suggest more affordable alternatives?"
```

#### 7. **Timeline Feasibility**
```javascript
IF itinerary items overlap in time
OR travel time between activities unrealistic
THEN: "I noticed you have activities at 2pm and 3pm that are 45 minutes apart. Should I help reschedule?"
```

#### 8. **Onboarding Assistance**
```javascript
IF user.experienceLevel === "first_trip"
AND tripStage === "just_created"
THEN: "Welcome! This is your first trip on TripSync. Want a quick 2-minute tour of what you can do?"
```

---

## 💬 ATLAS PERSONALITY & TONE

### Voice Guidelines:

- **Friendly but Professional:** "Hey! I noticed..." not "YO WASSUP"
- **Concise:** Max 2 sentences per message unless explaining complex feature
- **Action-Oriented:** Always offer next step, not just information
- **Empowering:** "You can..." not "You should..."
- **Group-Inclusive:** "Your group can vote on this" (acknowledges collaboration)

### Example Messages:

**❌ Generic Chatbot:**
> "Hello! How can I help you today?"

**✅ Atlas (Context-Aware):**
> "I see you're adding activities to your Paris itinerary. Want me to suggest some must-see spots based on your 7-day trip?"

---

**❌ Generic:**
> "You can click the 'Add Activity' button to add more items."

**✅ Atlas:**
> "Your itinerary only has 2 activities for a 7-day trip. Let me help fill in the gaps—I can suggest activities, restaurants, and transport."

---

**❌ Generic:**
> "Your budget has been exceeded."

**✅ Atlas:**
> "Heads up: you're $450 over budget. I can find cheaper alternatives for the Eiffel Tower dinner ($200) and the Seine cruise ($80)."

---

## 🏗️ TECHNICAL ARCHITECTURE

### Frontend (React)

```typescript
// client/src/components/atlas/AtlasAgent.tsx

interface AtlasContext {
  tripId: string | null;
  currentPage: string;
  currentTab: string;
  tripStage: TripStage;
  tripData: Trip | null;
  userActions: UserAction[];
  stuckIndicators: StuckIndicators;
  groupActivity: GroupActivity;
}

interface AtlasMessage {
  id: string;
  type: "proactive" | "response" | "suggestion";
  trigger: "inactivity" | "confusion" | "empty_state" | "budget" | "manual";
  priority: "low" | "medium" | "high" | "critical";
  message: string;
  actions?: AtlasAction[];
  timestamp: Date;
}

interface AtlasAction {
  label: string;
  type: "navigate" | "fill_form" | "open_modal" | "execute_ai" | "dismiss";
  payload: any;
}

const AtlasAgent: React.FC = () => {
  const [context, setContext] = useState<AtlasContext>({});
  const [messages, setMessages] = useState<AtlasMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);

  // Context tracking hooks
  usePageTracking();
  useInactivityDetection();
  useConfusionSignals();
  useFormAbandonment();

  // Proactive message engine
  useEffect(() => {
    const proactiveMessage = analyzeContextAndSuggest(context);
    if (proactiveMessage) {
      addMessage(proactiveMessage);
      setIsMinimized(false); // Gently expand to show suggestion
    }
  }, [context]);

  return (
    <AtlasWidget
      messages={messages}
      isOpen={isOpen}
      isMinimized={isMinimized}
      onSendMessage={handleUserMessage}
      onActionClick={handleActionClick}
    />
  );
};
```

---

### Backend (Node.js + Claude API)

```typescript
// server/routes/atlas.ts

app.post("/api/atlas/message", async (req, res) => {
  const { message, context, tripId, userId } = req.body;

  // 1. Fetch full trip context from database
  const trip = await db.query.trips.findFirst({ where: eq(trips.id, tripId) });
  const members = await db.query.tripMembers.findMany({ where: eq(tripMembers.tripId, tripId) });
  const itinerary = await db.query.itineraryItems.findMany({ where: eq(itineraryItems.tripId, tripId) });
  const expenses = await db.query.expenses.findMany({ where: eq(expenses.tripId, tripId) });
  const votes = await db.query.votes.findMany({ where: eq(votes.tripId, tripId) });

  // 2. Build rich context for Claude
  const systemPrompt = `
You are Atlas, TripSync's intelligent travel planning assistant. You are helping a user plan a group trip.

CURRENT CONTEXT:
- Trip: ${trip.destination}, ${trip.startDate} to ${trip.endDate}
- Group Size: ${members.length} people (${members.filter(m => m.status === 'accepted').length} confirmed)
- Budget: $${trip.budgetPerPerson} per person
- Current Stage: ${context.tripStage}
- Page: ${context.currentPage}
- User Action: ${context.lastAction}

TRIP PROGRESS:
- Itinerary Items: ${itinerary.length} activities planned
- Total Expenses: $${expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)}
- Pending Votes: ${votes.filter(v => v.status === 'pending').length}
- Completion: ${calculateCompletion(trip, itinerary, members)}%

DETECTED ISSUES:
${context.stuckIndicators.inactivityTime > 30 ? "- User has been inactive for " + context.stuckIndicators.inactivityTime + " seconds" : ""}
${context.stuckIndicators.emptyStates.length > 0 ? "- Empty states: " + context.stuckIndicators.emptyStates.join(", ") : ""}
${expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0) > trip.budgetPerPerson * members.length ? "- Over budget by $" + (expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0) - trip.budgetPerPerson * members.length) : ""}

YOUR ROLE:
- Be proactive but not pushy
- Provide specific, actionable help based on current context
- Reference specific trip details (destination, dates, budget)
- Suggest concrete next steps
- If user is stuck, offer to do something for them (generate AI suggestions, fill forms, etc.)
- Keep responses under 100 words unless explaining a complex feature

USER MESSAGE: "${message}"
`;

  // 3. Call Claude API with full context
  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 500,
    system: systemPrompt,
    messages: [{ role: "user", content: message }],
  });

  // 4. Parse response and extract suggested actions
  const atlasResponse = response.content[0].text;
  const suggestedActions = extractActions(atlasResponse);

  // 5. Return response with actions
  res.json({
    message: atlasResponse,
    actions: suggestedActions,
    context: {
      tripStage: context.tripStage,
      nextRecommendedStep: getNextStep(trip, itinerary, members),
    },
  });
});
```

---

## 🎨 UI/UX DESIGN

### Atlas Widget States:

#### 1. **Minimized (Default)**
```
┌─────────────────┐
│  💬 Atlas      │  ← Floating bottom-right
│  1 suggestion  │     Pulse animation when new message
└─────────────────┘
```

#### 2. **Expanded (Chat Mode)**
```
┌─────────────────────────────────┐
│  💬 Atlas - Your Travel Guide  │  [─][×]
├─────────────────────────────────┤
│                                 │
│  Atlas: I see you're adding     │
│  activities to your Paris       │
│  itinerary. Want me to suggest  │
│  must-see spots?                │
│                                 │
│  [Generate Suggestions]         │
│  [I'll do it myself]            │
│                                 │
│  You: Can you suggest restaurants?│
│                                 │
│  Atlas: Based on your budget    │
│  ($3000 for 6 people), here are │
│  3 restaurants...               │
│                                 │
├─────────────────────────────────┤
│  Type a message... [Send]       │
└─────────────────────────────────┘
```

#### 3. **Proactive Nudge (Tooltip Style)**
```
┌────────────────────────┐
│ Atlas: Quick tip! You  │  ← Appears near relevant UI element
│ can drag activities to │     with arrow pointing to feature
│ reorder your itinerary │
│ [Got it] [Show me how] │
└────────────────────────┘
         ↓
    [Itinerary List]
```

#### 4. **Actionable Card (Inline)**
```
┌─────────────────────────────────────┐
│ 💡 Atlas Suggestion                 │
│                                     │
│ Your itinerary is missing lunch     │
│ options for June 16-18. I found 3   │
│ restaurants near your activities:   │
│                                     │
│ • Le Comptoir (€€, 10 min away)    │
│ • Bistro Paul Bert (€€€, 5 min)    │
│ • L'Avenue (€€€€, 15 min)          │
│                                     │
│ [Add All] [Pick One] [No Thanks]    │
└─────────────────────────────────────┘
```

---

## 🧩 CAPABILITIES & ACTIONS

### What Atlas Can Do:

#### 1. **Generate Content**
- AI itinerary suggestions
- Restaurant recommendations
- Activity ideas based on interests
- Packing lists
- Budget breakdowns

**Example:**
```javascript
{
  action: "generate_itinerary",
  trigger: "User clicked 'Generate Suggestions'",
  execute: async () => {
    const suggestions = await fetch("/api/ai/itinerary", {
      method: "POST",
      body: JSON.stringify({
        destination: trip.destination,
        dates: { start: trip.startDate, end: trip.endDate },
        budget: trip.budgetPerPerson,
        groupSize: trip.groupSize,
      }),
    });
    return suggestions;
  },
}
```

#### 2. **Fill Forms**
- Pre-populate fields based on conversation
- Suggest values for budget, dates, preferences

**Example:**
```javascript
{
  action: "fill_budget_field",
  message: "I can set a budget of $500/person based on similar Paris trips. Sound good?",
  execute: () => {
    document.getElementById("budget_per_person").value = "500";
  },
}
```

#### 3. **Navigate User**
- Guide to specific features
- Open relevant modals
- Scroll to incomplete sections

**Example:**
```javascript
{
  action: "navigate_to_expenses",
  message: "Let me take you to the expense tracker where you can split costs.",
  execute: () => {
    router.push("/trip/" + tripId + "?tab=expenses");
  },
}
```

#### 4. **Send Reminders**
- Nudge group members to vote
- Remind to set budget
- Alert about upcoming trip deadlines

**Example:**
```javascript
{
  action: "send_vote_reminder",
  message: "Should I remind Sarah and Mike to vote on the hotel? They haven't responded in 2 days.",
  execute: async () => {
    await fetch("/api/trips/" + tripId + "/reminders", {
      method: "POST",
      body: JSON.stringify({ type: "vote_reminder", memberIds: ["user_2", "user_5"] }),
    });
  },
}
```

#### 5. **Optimize Plans**
- Reorder itinerary for efficiency
- Suggest budget-friendly alternatives
- Detect scheduling conflicts

**Example:**
```javascript
{
  action: "optimize_itinerary",
  message: "I can reorder your activities to minimize travel time. This will save you ~2 hours.",
  execute: async () => {
    const optimized = await fetch("/api/trips/" + tripId + "/optimize", { method: "POST" });
    return optimized;
  },
}
```

#### 6. **Explain Features**
- Contextual tooltips
- Feature walkthroughs
- Demo mode for Pro features

**Example:**
```javascript
{
  action: "explain_voting",
  message: "Voting lets your group decide together. Each person picks their preference, and the most popular option wins. Want to try it?",
  execute: () => {
    showFeatureDemo("voting");
  },
}
```

---

## 📍 WHERE ATLAS APPEARS

### Page-by-Page Presence:

#### **Dashboard** (`/dashboard`)
- Suggests creating first trip if none exist
- Highlights upcoming trips needing attention
- Offers to archive completed trips

#### **Create Trip** (`/create-trip`)
- Guides through 5-step form
- Suggests destinations based on season
- Recommends budget ranges
- Offers to invite common travel buddies

#### **Trip Detail** (`/trip/:id`)
- **Itinerary Tab:** Suggests activities, detects gaps, offers AI generation
- **Expenses Tab:** Helps split costs, suggests categories, alerts if over budget
- **Chat Tab:** Answers questions about trip, summarizes discussions
- **Votes Tab:** Explains how voting works, suggests creating polls
- **Members Tab:** Helps send invites, reminds inactive members

#### **Pricing** (`/pricing`)
- Explains plan differences
- Calculates value based on user's trips
- Offers trial signup assistance

#### **Login/Signup** (`/login`)
- Helps with password reset
- Explains demo account
- Guides new users through first trip

---

## 🔄 CONVERSATION FLOW EXAMPLES

### Example 1: Empty Itinerary

**Context:**
- User on trip detail page, itinerary tab
- 0 activities added
- Trip to "Tokyo, Japan" June 1-10
- Budget: $2000/person, 4 people

**Atlas (Proactive):**
> "Your Tokyo itinerary is empty. I can generate a full 10-day plan with activities, dining, and transport based on your $2000 budget. Want me to do that?"

**User:** "Yes please"

**Atlas:**
> "Great! Generating your Tokyo itinerary now... [Loading animation]
>
> Done! I've added 25 activities including Senso-ji Temple, Tokyo Skytree, Shibuya Crossing, and authentic ramen spots. Total estimated cost: $1,850/person.
>
> [View Itinerary] [Customize Further]"

---

### Example 2: Budget Overrun

**Context:**
- Total expenses: $12,000
- Budget: $10,000 (4 people × $2500)
- Over by: $2,000

**Atlas (Proactive):**
> "Heads up: You're $2,000 over budget. The biggest costs are:
> - 5-star hotel ($5,000) - I can find 4-star for $3,200
> - Private tour guide ($800) - Group tour is $200
>
> Want me to suggest alternatives?"

**User:** "Yes, show me cheaper hotels"

**Atlas:**
> "Here are 3 highly-rated 4-star hotels near your activities:
>
> 1. **Hotel Gracery Shinjuku** - $3,200 (7 nights, 4★, 8.5/10)
> 2. **Shinagawa Prince Hotel** - $2,900 (7 nights, 4★, 8.2/10)
> 3. **Keio Plaza Hotel** - $3,500 (7 nights, 4.5★, 8.8/10)
>
> Switching to #2 saves you $2,100 and puts you $100 under budget!
>
> [Replace Hotel] [See More Options]"

---

### Example 3: Group Stuck on Vote

**Context:**
- Vote on "Dinner Reservations" has been 3-3 tie for 2 hours
- Options: Sushi vs Ramen
- Trip starts in 3 days

**Atlas (Proactive):**
> "Your group is split 50/50 on dinner for June 2. Since the trip is in 3 days, you might want to decide soon.
>
> Options:
> - Do both (sushi on June 2, ramen on June 3)
> - Let trip organizer break the tie
> - Create a new vote with different options
>
> What sounds best?"

**User:** "Do both"

**Atlas:**
> "Perfect! I'll add both to your itinerary:
> - June 2, 7pm: Sukiyabashi Jiro (Sushi)
> - June 3, 7pm: Ichiran Ramen
>
> Closing the vote and notifying your group now."

---

## 🧪 AI MODEL CONFIGURATION

### Recommended: **Claude 3.5 Sonnet** (You already have API access!)

**Why Claude?**
- ✅ You already use it for trip planning
- ✅ Excellent at understanding context and nuance
- ✅ Can handle long conversations with memory
- ✅ Follows complex instructions
- ✅ Great at structured outputs (can return JSON actions)

### Prompt Engineering Strategy:

```typescript
const buildAtlasSystemPrompt = (context: AtlasContext): string => {
  return `You are Atlas, TripSync's intelligent travel assistant.

PERSONALITY:
- Friendly, helpful, proactive
- Concise (max 100 words per response unless explaining features)
- Action-oriented (always suggest next steps)
- Group-aware (acknowledge collaboration aspect)

CURRENT SITUATION:
${formatTripContext(context)}

CAPABILITIES YOU HAVE:
1. Generate AI itinerary suggestions
2. Find restaurants, activities, accommodations
3. Calculate and optimize budgets
4. Detect scheduling conflicts
5. Send reminders to group members
6. Fill form fields automatically
7. Navigate user to relevant features
8. Explain how features work

RESPONSE FORMAT:
Always respond with:
1. A helpful message (under 100 words)
2. 1-3 suggested actions the user can take

If you detect an issue (over budget, missing info, conflicts), proactively mention it and offer to fix it.

IMPORTANT:
- Reference specific trip details (destination, dates, people)
- Don't ask "How can I help?" - you already know the context
- Offer to DO things, not just explain them
- If user is stuck for >30 seconds, assume they need help

Example good response:
"I see you're adding activities for Day 3 in Paris. You only have breakfast planned but no lunch or dinner. I can suggest 3 cafes near the Louvre for lunch and bistros in Le Marais for dinner. Want me to add them?"

Example bad response:
"Hello! How can I assist you with your trip planning today?"
`;
};
```

---

## 📊 METRICS & LEARNING

### Track Atlas Effectiveness:

```typescript
interface AtlasMetrics {
  // Engagement
  messagesPerSession: number;
  proactiveMessageOpenRate: number;
  actionClickThroughRate: number;
  dismissalRate: number;

  // Helpfulness
  issuesResolved: number;
  timeToResolution: number; // seconds
  userSatisfactionRating: 1-5;

  // Impact
  tripsCompletedFaster: number; // % improvement
  budgetOptimizationSavings: number; // $ saved
  formCompletionRate: number; // before/after
  featureAdoption: Record<string, number>;
}
```

### Learning Loop:

1. **Track successful interventions** → What triggers worked?
2. **Measure dismissals** → When is Atlas annoying?
3. **A/B test message timing** → 30 seconds vs 60 seconds of inactivity?
4. **Refine triggers** → Adjust based on data

---

## 🎯 IMPLEMENTATION PHASES

### Phase 1: MVP (2-3 weeks)
- ✅ Basic chat widget (minimized/expanded states)
- ✅ Manual chat (user initiates conversation)
- ✅ Claude API integration with trip context
- ✅ 5 proactive triggers: inactivity, empty state, confusion, budget, group stuck
- ✅ 3 actions: generate itinerary, navigate, explain feature

### Phase 2: Smart Triggers (1 week)
- ✅ Advanced behavior tracking (scroll depth, hover time, back button)
- ✅ Journey stage detection (onboarding, planning, booking, pre-trip)
- ✅ Conversation memory (remember previous interactions)
- ✅ 10+ proactive triggers

### Phase 3: Autonomous Actions (2 weeks)
- ✅ Auto-fill forms
- ✅ Auto-optimize itinerary
- ✅ Send reminders to group
- ✅ Budget rebalancing suggestions
- ✅ Conflict resolution automation

### Phase 4: Advanced Intelligence (ongoing)
- ✅ Learn from user patterns (ML model for trigger timing)
- ✅ Personalized suggestions based on past trips
- ✅ Predictive assistance (suggest things before user needs them)
- ✅ Multi-trip insights ("You always forget sunscreen, want me to add it to packing list?")

---

## 💻 CODE STRUCTURE

### Frontend Architecture:

```
client/src/
├── components/
│   └── atlas/
│       ├── AtlasWidget.tsx          # Main widget component
│       ├── AtlasChatWindow.tsx      # Expanded chat view
│       ├── AtlasMinimized.tsx       # Minimized floating button
│       ├── AtlasProactiveCard.tsx   # Inline suggestion cards
│       ├── AtlasActionButton.tsx    # Actionable buttons
│       └── AtlasTooltip.tsx         # Contextual tooltips
├── hooks/
│   └── atlas/
│       ├── useAtlasContext.ts       # Track page/trip context
│       ├── useAtlasMessages.ts      # Manage chat messages
│       ├── useProactiveTriggers.ts  # Detect stuck/confusion signals
│       ├── useInactivityDetection.ts
│       └── useFormAbandonment.ts
├── lib/
│   └── atlas/
│       ├── contextAnalyzer.ts       # Analyze context and suggest help
│       ├── triggerEngine.ts         # Decide when to show proactive messages
│       └── actionExecutor.ts        # Execute Atlas actions (navigate, fill forms, etc.)
└── types/
    └── atlas.ts                     # TypeScript interfaces
```

### Backend Architecture:

```
server/
├── routes/
│   └── atlas.ts                     # Atlas API endpoints
├── services/
│   └── atlas/
│       ├── contextBuilder.ts        # Build rich context for Claude
│       ├── claudeService.ts         # Call Claude API
│       ├── actionParser.ts          # Parse Claude response for actions
│       └── metricsTracker.ts        # Track Atlas effectiveness
└── prompts/
    └── atlas-system.ts              # System prompts for Claude
```

---

## 🎨 VISUAL DESIGN

### Atlas Avatar:

**Option 1: Minimalist Icon**
```
💬  (Speech bubble with subtle animation)
```

**Option 2: Globe/Compass**
```
🧭  (Compass needle pointing to help)
```

**Option 3: Custom Mascot**
```
[A]  (Stylized "A" with subtle glow in TripSync brand colors)
```

### Color Scheme:
- **Primary:** Amber/Gold (matches TripSync accent color)
- **Background:** Glass morphism (backdrop-blur + transparency)
- **Text:** White on dark, Dark on light (follows theme)
- **Accent:** Green for positive actions, Red for warnings

### Animation:
- **Pulse:** Gentle pulse on new message
- **Slide-in:** Smooth slide from bottom-right
- **Typing indicator:** Claude is "thinking..."
- **Success checkmark:** Action completed

---

## 🔐 PRIVACY & SECURITY

### Data Handling:

1. **User Consent:** First interaction shows: "Atlas uses AI to help you plan. We analyze your trip data to provide relevant suggestions. [Learn More]"

2. **Data Sent to Claude:**
   - ✅ Trip details (destination, dates, budget)
   - ✅ Group size and member count (NOT names/emails)
   - ✅ Itinerary items (anonymized)
   - ✅ Expenses (amounts only, not who paid)
   - ❌ Personal identifiable information
   - ❌ Payment details
   - ❌ Private messages between users

3. **Data Retention:**
   - Conversation history stored for 30 days
   - Auto-deleted after trip completion + 7 days
   - User can clear chat history anytime

4. **Opt-Out:**
   - Settings toggle: "Enable Atlas AI Assistant"
   - Fully functional without Atlas (all features still accessible)

---

## 🚀 LAUNCH STRATEGY

### Beta Testing:

1. **Week 1-2:** Internal testing with team
2. **Week 3-4:** 50 beta users (Pro plan only)
3. **Week 5-6:** 500 users (gather feedback, refine triggers)
4. **Week 7:** Public launch (all users, Free + Pro)

### Success Metrics:

- **Engagement:** 60%+ of users interact with Atlas
- **Helpfulness:** 4.2+ average satisfaction rating
- **Efficiency:** 20% faster trip planning time
- **Feature Discovery:** 30% increase in advanced feature usage
- **Retention:** 15% improvement in user retention

---

## 💡 COMPETITIVE ADVANTAGE

### Why Atlas is Different:

| Generic Chatbots | Atlas |
|------------------|-------|
| "How can I help you?" | "I see you're stuck on budgeting. Want me to suggest a breakdown?" |
| Waits for user to ask | Proactively offers help based on context |
| Generic responses | Trip-specific, references your Paris trip and $3000 budget |
| One-size-fits-all | Adapts to trip stage (planning vs during-trip) |
| Text-only | Actionable buttons (Generate, Navigate, Fill Form) |
| Isolated feature | Integrated across entire app |

**Atlas knows:**
- Where you are in your trip planning journey
- What you've already done
- What's missing or incomplete
- What your group is stuck on
- When you're confused or inactive
- How to fix issues automatically

---

## 📋 IMPLEMENTATION CHECKLIST

### Frontend:
- [ ] Create AtlasWidget component with minimized/expanded states
- [ ] Implement context tracking hooks (page, trip stage, user actions)
- [ ] Build trigger engine (inactivity, confusion, empty states)
- [ ] Design proactive message UI (inline cards, tooltips, chat)
- [ ] Implement action executor (navigate, fill forms, generate AI)
- [ ] Add conversation memory (localStorage + backend sync)
- [ ] Create settings panel (enable/disable, clear history)

### Backend:
- [ ] Create `/api/atlas/message` endpoint
- [ ] Build context builder (fetch trip, members, itinerary, votes, expenses)
- [ ] Integrate Claude API with rich system prompts
- [ ] Implement action parser (extract actions from Claude response)
- [ ] Create proactive trigger rules engine
- [ ] Add metrics tracking (engagement, helpfulness, impact)
- [ ] Implement conversation history storage

### Testing:
- [ ] Test all 10 proactive triggers
- [ ] Verify context accuracy across pages
- [ ] Test action execution (navigate, fill, generate)
- [ ] Ensure privacy (no PII sent to Claude)
- [ ] Performance test (response time < 2 seconds)
- [ ] A/B test trigger timing (30s vs 60s inactivity)

### Launch:
- [ ] Beta testing with 50 users
- [ ] Gather feedback and refine
- [ ] Create Atlas introduction modal (first-time users)
- [ ] Add to onboarding flow
- [ ] Announce in changelog/blog
- [ ] Monitor metrics and iterate

---

## 🎯 NEXT STEPS

**Immediate (This Week):**
1. Review and approve this design
2. Decide on Atlas name (Atlas, Scout, Guide, Compass?)
3. Create wireframes for chat widget UI
4. Set up Claude API quota for Atlas usage

**Sprint 1 (Week 1-2):**
1. Build basic chat widget (minimized + expanded)
2. Implement manual chat (user initiates)
3. Integrate Claude with trip context
4. Test on trip detail page

**Sprint 2 (Week 3-4):**
1. Add 5 proactive triggers
2. Implement 3 automated actions
3. Beta test with team
4. Refine based on feedback

**Sprint 3 (Week 5-6):**
1. Expand to all pages
2. Add advanced triggers and actions
3. Launch to 50 beta users
4. Gather metrics

**Launch (Week 7):**
1. Public release
2. Marketing announcement
3. Monitor and iterate

---

**This is your differentiator.** No competitor has an AI assistant this intelligent and context-aware. Atlas will make TripSync the easiest, smartest group trip planner on the market. 🚀
