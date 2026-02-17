/**
 * Metrics configuration – feature-specific KPIs, dashboards, priorities.
 * Each metric has an id for toggle persistence.
 */

export interface MetricDef {
  id: string;
  label: string;
  description?: string;
  format?: "number" | "percent" | "currency" | "time" | "ratio";
  defaultOn?: boolean;
}

export interface MetricSection {
  id: string;
  title: string;
  description?: string;
  metrics: MetricDef[];
}

const STORAGE_KEY = "admin-metrics-toggles";

export function getMetricToggles(): Record<string, boolean> {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) return JSON.parse(s);
  } catch {}
  return {};
}

export function setMetricToggle(id: string, on: boolean) {
  const toggles = getMetricToggles();
  toggles[id] = on;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toggles));
  } catch {}
}

/** Phase 1 MVP Features */
export const PHASE1_MVP: MetricSection = {
  id: "phase1",
  title: "Phase 1 MVP Features (1-25)",
  description: "Feature-specific KPIs",
  metrics: [
    { id: "trips-per-week", label: "Trips created/week", description: "Trip Creation", defaultOn: true },
    { id: "ai-gen-success", label: "Generation success rate", description: "AI Itinerary Generation", format: "percent" },
    { id: "ai-gen-time", label: "AI generation time", description: "AI Itinerary Generation", format: "time" },
    { id: "votes-per-item", label: "Votes per itinerary item", description: "Group Voting" },
    { id: "booking-completion", label: "Booking completion rate", description: "Booking Coordination", format: "percent", defaultOn: true },
    { id: "expenses-per-trip", label: "Expenses logged per trip", description: "Expense Logging" },
    { id: "calendar-sync-pct", label: "% of trips synced to calendar", description: "Calendar Integration", format: "percent" },
    { id: "weather-checks", label: "Weather check frequency", description: "Weather Forecast" },
    { id: "direction-clicks", label: "Direction clicks per trip", description: "Maps Integration" },
    { id: "budget-variance", label: "Budget vs. actual variance", description: "Budget Tracking", format: "percent" },
    { id: "push-open-rate", label: "Push notification open rate", description: "Push Notifications", format: "percent" },
    { id: "push-action-rate", label: "Push notification action rate", description: "Push Notifications", format: "percent" },
  ],
};

/** Phase 2 Competitive Features */
export const PHASE2_COMPETITIVE: MetricSection = {
  id: "phase2",
  title: "Phase 2 Competitive Features (26-46)",
  metrics: [
    { id: "flight-alert-accuracy", label: "Alert accuracy", description: "Flight Status Monitoring", format: "percent" },
    { id: "flight-alert-response", label: "User response rate", description: "Flight Status Monitoring", format: "percent" },
    { id: "alt-rec-ctr", label: "Click-through rate on alternatives", description: "Alternative Recommendations", format: "percent" },
    { id: "price-drop-pct", label: "% of price drops caught", description: "Price Monitoring", format: "percent" },
    { id: "rebooking-rate", label: "Rebooking rate", description: "Price Monitoring", format: "percent" },
    { id: "mention-volume", label: "Mention volume", description: "@Mentions in Chat" },
    { id: "mention-response-time", label: "Mention response time", description: "@Mentions in Chat", format: "time" },
    { id: "availability-time-reduction", label: "Date consensus time reduction", description: "Group Availability Finder", format: "time" },
    { id: "dietary-flag-pct", label: "% of restaurants flagged correctly", description: "Dietary Restriction Enforcement", format: "percent" },
    { id: "accessibility-usage", label: "Usage rate (users needing accessibility)", description: "Accessibility Filters", format: "percent" },
    { id: "transport-usage-pct", label: "% of trips using car assignments", description: "Transportation Coordination", format: "percent" },
  ],
};

/** Phase 3 Premium Features */
export const PHASE3_PREMIUM: MetricSection = {
  id: "phase3",
  title: "Phase 3 Premium Features (47-70)",
  metrics: [
    { id: "email-parsing-accuracy", label: "Parsing accuracy", description: "Email Auto-Parsing", format: "percent" },
    { id: "email-time-saved", label: "Time saved", description: "Email Auto-Parsing", format: "time" },
    { id: "auto-booking-success", label: "Booking success rate", description: "Automated Booking", format: "percent" },
    { id: "auto-booking-errors", label: "Booking error rate", description: "Automated Booking", format: "percent" },
    { id: "multi-currency-pct", label: "% of international trips using feature", description: "Multi-Currency Support", format: "percent" },
    { id: "pref-learning-improvement", label: "Recommendation improvement over time", description: "Preference Learning", format: "percent" },
    { id: "docs-per-trip", label: "Documents uploaded per trip", description: "Document Storage" },
    { id: "conv-planning-pct", label: "% preferring chat vs. structured", description: "Conversational Planning", format: "percent" },
    { id: "template-reuse", label: "Template reuse rate", description: "Trip Templates", format: "percent" },
  ],
};

/** Phase 4 Platform Features */
export const PHASE4_PLATFORM: MetricSection = {
  id: "phase4",
  title: "Phase 4 Platform Features (71-85)",
  metrics: [
    { id: "trips-managed-simultaneous", label: "Trips managed simultaneously", description: "Multi-Trip Management" },
    { id: "concierge-usage", label: "Concierge usage rate", description: "Concierge Service", format: "percent" },
    { id: "concierge-satisfaction", label: "Concierge satisfaction", description: "Concierge Service", format: "percent" },
    { id: "discount-utilization", label: "Discount utilization", description: "Group Discounts", format: "percent" },
    { id: "discount-saved", label: "$ saved per trip", description: "Group Discounts", format: "currency" },
    { id: "api-calls-month", label: "API calls/month", description: "API for Travel Agents" },
    { id: "agent-partnerships", label: "Agent partnerships", description: "API for Travel Agents" },
    { id: "carbon-view-pct", label: "% of users viewing carbon data", description: "Carbon Footprint Tracking", format: "percent" },
  ],
};

/** Executive Dashboard */
export const EXECUTIVE: MetricSection = {
  id: "executive",
  title: "Executive Dashboard (Weekly Review)",
  description: "North Star: Completed trips",
  metrics: [
    { id: "completed-trips", label: "Completed trips", description: "North Star", defaultOn: true },
    { id: "new-signups", label: "New signups", description: "Acquisition", defaultOn: true },
    { id: "invite-acceptance", label: "Invite acceptance rate", description: "Acquisition", format: "percent", defaultOn: true },
    { id: "dau", label: "DAU", description: "Engagement" },
    { id: "sessions-per-trip", label: "Sessions per trip", description: "Engagement" },
    { id: "mrr", label: "MRR", description: "Revenue", format: "currency" },
    { id: "arpt", label: "ARPT", description: "Revenue", format: "currency" },
    { id: "retention-30", label: "30-day retention", description: "Retention", format: "percent", defaultOn: true },
    { id: "repeat-trip-rate", label: "Repeat trip rate", description: "Retention", format: "percent" },
    { id: "nps", label: "NPS", description: "Satisfaction", defaultOn: true },
    { id: "app-rating", label: "App rating", description: "Satisfaction" },
  ],
};

/** Product Team Dashboard */
export const PRODUCT: MetricSection = {
  id: "product",
  title: "Product Team Dashboard (Daily)",
  metrics: [
    { id: "feature-adoption", label: "Feature adoption rates", format: "percent" },
    { id: "ai-performance", label: "AI performance metrics", format: "percent" },
    { id: "funnel-conversion", label: "Funnel conversion rates", format: "percent" },
    { id: "bug-error-rate", label: "Bug/error rates", format: "percent" },
    { id: "support-tickets", label: "Support ticket volume" },
  ],
};

/** Growth Team Dashboard */
export const GROWTH: MetricSection = {
  id: "growth",
  title: "Growth Team Dashboard (Weekly)",
  metrics: [
    { id: "cac", label: "CAC by channel", format: "currency" },
    { id: "viral-coef", label: "Viral coefficient" },
    { id: "organic-paid-split", label: "Organic vs. paid split", format: "percent" },
    { id: "ltv-cac", label: "LTV:CAC ratio", format: "ratio" },
    { id: "geo-performance", label: "Geography performance" },
  ],
};

/** Engineering Dashboard */
export const ENGINEERING: MetricSection = {
  id: "engineering",
  title: "Engineering Dashboard (Real-time)",
  metrics: [
    { id: "api-latency", label: "API latency", format: "time" },
    { id: "error-rate", label: "Error rates", format: "percent" },
    { id: "uptime", label: "Uptime", format: "percent" },
    { id: "ai-gen-time-eng", label: "AI generation time", format: "time" },
    { id: "db-performance", label: "Database performance" },
  ],
};

/** KPI Priorities - MVP */
export const PRIORITIES_MVP: MetricSection = {
  id: "priorities-mvp",
  title: "MVP Priorities (Months 0-3) - 15 KPIs",
  metrics: [
    { id: "p-completed-trips", label: "Completed trips/month (NSM)", defaultOn: true },
    { id: "p-signups", label: "Signups", defaultOn: true },
    { id: "p-trip-creators", label: "Trip creators" },
    { id: "p-invite-acceptance", label: "Invite acceptance rate", format: "percent", defaultOn: true },
    { id: "p-pref-quiz", label: "Preference quiz completion", format: "percent" },
    { id: "p-itinerary-acceptance", label: "Itinerary acceptance rate", format: "percent" },
    { id: "p-booking-completion", label: "Booking completion rate", format: "percent", defaultOn: true },
    { id: "p-trip-completion", label: "Trip completion rate", format: "percent" },
    { id: "p-expense-settlement", label: "Expense settlement rate", format: "percent" },
    { id: "p-session-duration", label: "Session duration", format: "time" },
    { id: "p-dau-planning", label: "DAU during planning" },
    { id: "p-nps", label: "NPS", defaultOn: true },
    { id: "p-ai-gen-time", label: "AI generation time", format: "time" },
    { id: "p-budget-accuracy", label: "Budget accuracy", format: "percent" },
    { id: "p-support-tickets", label: "Support tickets" },
  ],
};

/** KPI Priorities - Growth */
export const PRIORITIES_GROWTH: MetricSection = {
  id: "priorities-growth",
  title: "Growth Phase (Months 3-6) - Add 10",
  metrics: [
    { id: "pg-cac", label: "CAC", format: "currency" },
    { id: "pg-ltv", label: "LTV", format: "currency" },
    { id: "pg-retention-30", label: "30-day retention", format: "percent" },
    { id: "pg-repeat-trip", label: "Repeat trip rate", format: "percent" },
    { id: "pg-viral-coef", label: "Viral coefficient" },
    { id: "pg-feature-adoption", label: "Feature adoption rates", format: "percent" },
    { id: "pg-flight-alert", label: "Flight alert accuracy", format: "percent" },
    { id: "pg-price-drop", label: "Price drop detection", format: "percent" },
    { id: "pg-app-rating", label: "App store rating" },
    { id: "pg-revenue-trip", label: "Revenue per trip", format: "currency" },
  ],
};

/** KPI Priorities - Scale */
export const PRIORITIES_SCALE: MetricSection = {
  id: "priorities-scale",
  title: "Scale Phase (Months 6-12) - Add 10",
  metrics: [
    { id: "ps-mrr-arr", label: "MRR/ARR", format: "currency" },
    { id: "ps-churn", label: "Churn rate", format: "percent" },
    { id: "ps-ltv-cac", label: "LTV:CAC ratio", format: "ratio" },
    { id: "ps-cohort-retention", label: "Cohort retention curves" },
    { id: "ps-funnel-conversion", label: "Funnel conversion rates", format: "percent" },
    { id: "ps-very-disappointed", label: "% very disappointed (PMF test)", format: "percent" },
    { id: "ps-email-parsing", label: "Email parsing accuracy", format: "percent" },
    { id: "ps-premium-conversion", label: "Premium conversion rate", format: "percent" },
    { id: "ps-geo-performance", label: "Geographic performance" },
    { id: "ps-seasonal", label: "Seasonal patterns" },
  ],
};

/** Red Flag Metrics */
export const RED_FLAGS: MetricSection = {
  id: "redflags",
  title: "Red Flag Metrics (Immediate Attention)",
  description: "Thresholds that require action",
  metrics: [
    { id: "rf-trip-completion", label: "Trip completion rate", description: "<60%", format: "percent", defaultOn: true },
    { id: "rf-invite-acceptance", label: "Invite acceptance rate", description: "<50%", format: "percent", defaultOn: true },
    { id: "rf-booking-completion", label: "Booking completion rate", description: "<70%", format: "percent", defaultOn: true },
    { id: "rf-expense-settlement", label: "Expense settlement rate", description: "<75%", format: "percent" },
    { id: "rf-retention-30", label: "30-day retention", description: "<30%", format: "percent" },
    { id: "rf-nps", label: "NPS", description: "<20" },
    { id: "rf-budget-accuracy", label: "Budget accuracy", description: ">15% variance", format: "percent" },
    { id: "rf-ai-gen-time", label: "AI generation time", description: ">15 seconds", format: "time" },
    { id: "rf-support-tickets", label: "Support tickets", description: ">10% of trips" },
    { id: "rf-churn", label: "Churn rate", description: ">8% monthly", format: "percent" },
    { id: "rf-ltv-cac", label: "LTV:CAC", description: "<2:1", format: "ratio" },
  ],
};

/** North Star Decomposition */
export const NORTH_STAR: MetricSection = {
  id: "northstar",
  title: "North Star Decomposition",
  description: "Completed Trips = f(Trip Creators × Invite Acceptance × Itinerary Acceptance × Booking Completion × Trip Follow-Through × Settlement)",
  metrics: [
    { id: "ns-signups", label: "Signups", description: "100 →", defaultOn: true },
    { id: "ns-trip-creators", label: "Trip creators (60% activation)", description: "60", defaultOn: true },
    { id: "ns-invites-sent", label: "Invites sent", description: "240 (4 per creator)" },
    { id: "ns-invites-accepted", label: "Invites accepted", description: "144 (60% acceptance)", defaultOn: true },
    { id: "ns-itineraries-generated", label: "Itineraries generated", description: "50 (83% of creators)" },
    { id: "ns-itineraries-approved", label: "Itineraries approved", description: "42 (84%)" },
    { id: "ns-bookings-made", label: "Trips with bookings", description: "35 (83%)" },
    { id: "ns-trips-completed", label: "Trips completed", description: "28 (80%)", defaultOn: true },
    { id: "ns-settled", label: "Trips fully settled", description: "25 (90%)", defaultOn: true },
    { id: "ns-conversion", label: "End-to-end conversion", description: "25%", format: "percent" },
  ],
};

export const ALL_SECTIONS: MetricSection[] = [
  PHASE1_MVP,
  PHASE2_COMPETITIVE,
  PHASE3_PREMIUM,
  PHASE4_PLATFORM,
  EXECUTIVE,
  PRODUCT,
  GROWTH,
  ENGINEERING,
  PRIORITIES_MVP,
  PRIORITIES_GROWTH,
  PRIORITIES_SCALE,
  RED_FLAGS,
  NORTH_STAR,
];
