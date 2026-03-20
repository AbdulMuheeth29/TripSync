import Anthropic from "@anthropic-ai/sdk";
import { storage } from "./storage";
import { randomUUID } from "crypto";
import type { TripWizardData, AIItinerary, Trip, ItineraryItem, Expense, Vote, TripMember } from "@shared/schema";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

type MemberPreferenceInput = { userName: string; diet?: string | null; budgetFlexibility?: string | null; mustDoActivities?: string | null };

function buildPreferencesSection(preferences: MemberPreferenceInput[]): string {
  if (!preferences.length) return "";
  return `
Group member preferences (synthesize these into a cohesive plan; resolve conflicts by balancing or offering alternatives):
${preferences.map((p) => `- ${p.userName}: Diet: ${p.diet || "Any"}; Budget flexibility: ${p.budgetFlexibility || "Standard"}; Must-do: ${p.mustDoActivities || "None specified"}`).join("\n")}
`;
}

export async function generateItinerary(tripId: string, tripData: TripWizardData, memberPreferences?: MemberPreferenceInput[]) {
  try {
    const preferencesSection = buildPreferencesSection(memberPreferences || []);

    const prompt = `You are a professional travel planner. Create a detailed day-by-day itinerary for a group trip.

Trip parameters:
Destination: ${tripData.destination}
Dates: ${tripData.startDate} to ${tripData.endDate}
Group size: ${tripData.groupSize} people
Budget per person: $${tripData.budgetPerPerson}
Trip vibe: ${tripData.vibes.join(", ")}
Accommodation: ${tripData.accommodationPref}
Dining: ${tripData.diningPref}
${preferencesSection}

Generate a day-by-day itinerary with:
- Flights (if needed) with booking_url hint like "https://www.google.com/travel/flights?q=..."
- Hotels with deep link hint (e.g. Booking.com, Expedia)
- Meals (breakfast, lunch, dinner) with price estimates
- 2-3 activities per day with logical timing
- Evening options if vibe includes nightlife

Resolve conflicting preferences by finding options that work for most (e.g. dietary restrictions, budget spread). All prices in USD per person.

IMPORTANT: Respond with valid JSON only, this structure:
{
  "summary": "Brief trip overview",
  "total_estimated_cost": number,
  "itinerary": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "items": [
        {
          "type": "flight" | "hotel" | "dining" | "activity",
          "time": "HH:MM",
          "name": "Name of activity/place",
          "description": "Detailed description",
          "location": "Address or area",
          "price_per_person": number,
          "booking_url_hint": "Short label e.g. Google Flights, Booking.com",
          "booking_url": "Optional full URL to book (e.g. https://www.booking.com/...)"
        }
      ]
    }
  ]
}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    // Parse the JSON response
    let responseText = content.text;
    
    // Extract JSON if wrapped in markdown code blocks
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      responseText = jsonMatch[1].trim();
    }

    const itinerary: AIItinerary = JSON.parse(responseText);

    // Save itinerary items to storage
    for (const day of itinerary.itinerary) {
      for (const item of day.items) {
        await storage.createItineraryItem({
          id: randomUUID(),
          tripId,
          dayNumber: day.day,
          type: item.type,
          time: item.time,
          name: item.name,
          description: item.description,
          location: item.location,
          pricePerPerson: item.price_per_person,
          bookingUrlHint: item.booking_url_hint,
          bookingUrl: item.booking_url || null,
        });
      }
    }

    console.log(`Generated itinerary for trip ${tripId} with ${itinerary.itinerary.length} days`);
  } catch (error) {
    console.error("Error generating itinerary:", error);
    
    // Create a fallback itinerary if AI fails
    await createFallbackItinerary(tripId, tripData);
  }
}

async function createFallbackItinerary(tripId: string, tripData: TripWizardData) {
  const startDate = new Date(tripData.startDate);
  
  const fallbackItems = [
    // Day 1
    {
      dayNumber: 1,
      type: "flight" as const,
      time: "08:00",
      name: `Flight to ${tripData.destination}`,
      description: "Direct flight to your destination",
      location: `${tripData.destination} Airport`,
      pricePerPerson: Math.round(tripData.budgetPerPerson * 0.15),
      bookingUrlHint: "Google Flights",
    },
    {
      dayNumber: 1,
      type: "hotel" as const,
      time: "14:00",
      name: "Hotel Check-in",
      description: "Check into your accommodation and freshen up",
      location: `Downtown ${tripData.destination}`,
      pricePerPerson: Math.round(tripData.budgetPerPerson * 0.2),
      bookingUrlHint: "Booking.com",
    },
    {
      dayNumber: 1,
      type: "dining" as const,
      time: "19:00",
      name: "Welcome Dinner",
      description: "Start your trip with a memorable group dinner",
      location: `Popular restaurant in ${tripData.destination}`,
      pricePerPerson: Math.round(tripData.budgetPerPerson * 0.05),
      bookingUrlHint: "OpenTable",
    },
    // Day 2
    {
      dayNumber: 2,
      type: "dining" as const,
      time: "09:00",
      name: "Breakfast",
      description: "Start your day with a local breakfast spot",
      location: `${tripData.destination}`,
      pricePerPerson: 20,
      bookingUrlHint: "Google Maps",
    },
    {
      dayNumber: 2,
      type: "activity" as const,
      time: "10:00",
      name: "Morning Activity",
      description: "Explore local attractions and landmarks",
      location: `${tripData.destination}`,
      pricePerPerson: Math.round(tripData.budgetPerPerson * 0.08),
      bookingUrlHint: "Viator",
    },
    {
      dayNumber: 2,
      type: "dining" as const,
      time: "13:00",
      name: "Lunch",
      description: "Casual lunch at a local favorite",
      location: `${tripData.destination}`,
      pricePerPerson: 25,
      bookingUrlHint: "Google Maps",
    },
    {
      dayNumber: 2,
      type: "activity" as const,
      time: "15:00",
      name: "Afternoon Adventure",
      description: "Continue exploring with your group",
      location: `${tripData.destination}`,
      pricePerPerson: Math.round(tripData.budgetPerPerson * 0.1),
      bookingUrlHint: "GetYourGuide",
    },
    {
      dayNumber: 2,
      type: "dining" as const,
      time: "20:00",
      name: "Dinner",
      description: "Evening dining experience",
      location: `${tripData.destination}`,
      pricePerPerson: Math.round(tripData.budgetPerPerson * 0.06),
      bookingUrlHint: "Resy",
    },
    // Day 3
    {
      dayNumber: 3,
      type: "dining" as const,
      time: "10:00",
      name: "Brunch",
      description: "Leisurely brunch before departure",
      location: `${tripData.destination}`,
      pricePerPerson: 30,
      bookingUrlHint: "Yelp",
    },
    {
      dayNumber: 3,
      type: "activity" as const,
      time: "12:00",
      name: "Final Activity",
      description: "Last chance to explore before heading home",
      location: `${tripData.destination}`,
      pricePerPerson: Math.round(tripData.budgetPerPerson * 0.05),
      bookingUrlHint: "TripAdvisor",
    },
    {
      dayNumber: 3,
      type: "flight" as const,
      time: "17:00",
      name: "Return Flight",
      description: "Flight back home",
      location: `${tripData.destination} Airport`,
      pricePerPerson: Math.round(tripData.budgetPerPerson * 0.15),
      bookingUrlHint: "Google Flights",
    },
  ];

  for (const item of fallbackItems) {
    await storage.createItineraryItem({
      id: randomUUID(),
      tripId,
      ...item,
    });
  }

  console.log(`Created fallback itinerary for trip ${tripId}`);
}

/** Smart conflict resolution: suggest a compromise from poll question, options, and vote counts. */
export async function suggestConflictResolution(params: {
  question: string;
  options: string[];
  voteCounts: number[];
  memberNames?: string[];
}): Promise<{ suggestion: string }> {
  const { question, options, voteCounts, memberNames } = params;
  if (!process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY) {
    const total = voteCounts.reduce((a, b) => a + b, 0);
    const leader = voteCounts.indexOf(Math.max(...voteCounts));
    return { suggestion: `Based on votes: ${options[leader]} leads (${voteCounts[leader]}/${total}). Consider splitting the day: morning for one option, afternoon for the other so everyone gets something they want.` };
  }
  try {
    const breakdown = options.map((opt, i) => `${opt}: ${voteCounts[i]} vote(s)`).join("; ");
    const prompt = `The group is deciding: "${question}". Options: ${options.join(", ")}. Vote breakdown: ${breakdown}.
Suggest a short, practical compromise (1-2 sentences). Example: "Since 4 want beach and 2 want museums, suggest morning beach + afternoon museum." Reply with only the suggestion text, no JSON.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 256,
      messages: [{ role: "user", content: prompt }],
    });
    const content = message.content[0];
    const text = content.type === "text" ? content.text.trim() : "";
    return { suggestion: text || "Consider splitting the day so both preferences get time." };
  } catch (e) {
    console.error("Conflict resolution AI error:", e);
    return { suggestion: "Consider splitting the day: do one option in the morning and the other in the afternoon so everyone gets something they want." };
  }
}

/** AI budget optimization: suggest ways to optimize spending given trip data and expenses. */
export async function suggestBudgetOptimization(params: {
  destination: string;
  budgetPerPerson: number;
  groupSize: number;
  totalSpent: number;
  expenseSummary?: string;
  itineraryEstimated?: number;
}): Promise<{ suggestion: string }> {
  const { destination, budgetPerPerson, groupSize, totalSpent, expenseSummary, itineraryEstimated } = params;
  const budgetTotal = budgetPerPerson * groupSize;
  if (!process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY) {
    if (totalSpent > budgetTotal) {
      return { suggestion: "You're over budget. Consider trimming optional activities or dining at more affordable spots." };
    }
    return { suggestion: "You're on track. Try splitting expensive meals or booking activities in advance for discounts." };
  }
  try {
    const prompt = `Travel budget advisor. Trip to ${destination}. Budget: $${budgetPerPerson}/person × ${groupSize} = $${budgetTotal}. Total spent so far: $${totalSpent}. ${expenseSummary ? `Expenses: ${expenseSummary}.` : ""} ${itineraryEstimated ? `Estimated itinerary cost: $${itineraryEstimated}.` : ""}
Give 2-3 short, practical tips to optimize spending (e.g. cheaper dining alternatives, advance bookings, group discounts). Reply with only the tips, no JSON.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });
    const content = message.content[0];
    const text = content.type === "text" ? content.text.trim() : "";
    return { suggestion: text || "Consider advance bookings and group discounts to save." };
  } catch (e) {
    console.error("Budget optimization AI error:", e);
    return { suggestion: "Consider advance bookings and splitting expensive meals to stay on budget." };
  }
}

export type AtlasRichContext = {
  trip: Pick<Trip, "id" | "destination" | "startDate" | "endDate" | "budgetPerPerson" | "groupSize" | "status" | "isLocked">;
  progress: {
    itineraryItems: number;
    daysWithActivities: number;
    daysWithoutActivities: number;
    totalExpenses: number;
    totalBudget: number;
    overBudget: boolean;
    overAmount: number;
    confirmedMembers: number;
    pendingMembers: number;
    activeVotes: number;
    stuckVotes: number;
    completionPercentage: number;
    daysUntilTrip: number | null;
  };
  behavior: {
    currentPage?: string;
    timeOnPage?: number;
    lastAction?: string;
    inactivityTime?: number;
  };
  group?: {
    vibes?: string[];
  };
  detectedIssues?: string[];
};

/** Conversational planning: user sends a quick change request, AI suggests an itinerary edit. */
export async function conversationalPlanningSuggestion(params: {
  tripId: string;
  userMessage: string;
  context: AtlasRichContext;
  fullTrip: Trip;
  items: ItineraryItem[];
  expenses: Expense[];
  votes: Vote[];
  members: (TripMember & { user: { name: string } })[];
}): Promise<{ suggestion: string; action?: string }> {
  const { userMessage, context, fullTrip, items, expenses, votes, members } = params;
  if (!process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY) {
    return {
      suggestion:
        "Quick changes are coming soon. For now, add or edit items from the Itinerary tab, adjust your budget in the Budget section, or invite more friends from the Members tab.",
      action: "none",
    };
  }
  try {
    const { trip, progress, behavior, detectedIssues } = context;

    const issuesList =
      detectedIssues && detectedIssues.length > 0
        ? detectedIssues.map((i) => `- ${i}`).join("\n")
        : "- None detected from metrics above. Focus on what the user is asking.";

    const systemPrompt = `You are Atlas, TripSync's intelligent group travel assistant.

PERSONALITY:
- Friendly, proactive, and helpful
- Concise (1-3 sentences unless explaining complex features)
- Action-oriented: always suggest clear next steps
- Reference specific trip details to show you understand context

CURRENT TRIP CONTEXT:
- Destination: ${trip.destination}
- Dates: ${trip.startDate} to ${trip.endDate}
- Group size: ${trip.groupSize} people
- Budget per person: $${trip.budgetPerPerson} (total: $${progress.totalBudget})
- Current spend: $${progress.totalExpenses} (${progress.overBudget ? `OVER budget by $${progress.overAmount}` : "under budget"})

TRIP PROGRESS:
- Itinerary items: ${progress.itineraryItems} across ${progress.daysWithActivities + progress.daysWithoutActivities} days (${progress.daysWithoutActivities} days empty)
- Expenses: ${expenses.length} tracked
- Votes: ${progress.activeVotes} active, ${progress.stuckVotes} stuck (ties)
- Completion: ${progress.completionPercentage}%

GROUP & MEMBERS:
- Total members: ${members.length}
- Confirmed: ${progress.confirmedMembers}, Pending: ${progress.pendingMembers}

USER BEHAVIOR:
- Current page: ${behavior.currentPage ?? "unknown"}
- Time on page: ${behavior.timeOnPage ?? 0} seconds
- Last action: ${behavior.lastAction ?? "unknown"}
${behavior.inactivityTime && behavior.inactivityTime > 30 ? `- User inactive for ${behavior.inactivityTime}s (may be stuck)` : ""}

DETECTED ISSUES:
${issuesList}

YOUR ROLE:
- Proactively help based on this context (don't just restate it)
- Offer to DO things, not just explain them (e.g. suggest adding, removing, or moving activities; adjusting budget; resolving stuck votes)
- Keep responses under 100 words
- If user seems stuck or the trip is incomplete, offer 1–3 concrete, high‑leverage next steps.
`;

    const recentItemsSummary = items
      .slice(0, 10)
      .map((i) => `- Day ${i.dayNumber} ${i.time} ${i.type}: ${i.name} @ ${i.location} ($${i.pricePerPerson}/person)`)
      .join("\n");

    const userPrompt = `USER MESSAGE:
"${userMessage}"

SNAPSHOT OF ITINERARY (first ${Math.min(items.length, 10)} items):
${recentItemsSummary || "- No items yet; itinerary is empty."}

INSTRUCTIONS:
- Respond in a warm, confident tone.
- Focus on one primary suggestion plus (optionally) 1–2 follow‑ups.
- If an obvious quick fix exists (e.g. fill empty days, reduce budget overrun, resolve stuck vote), propose it directly.
- At the very end of your message, add a line of the form:
  ACTION: add_item | edit_item | optimize_budget | resolve_vote | none
Choose the single best action type for the app to take given the situation.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 256,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });
    const content = message.content[0];
    const text = content.type === "text" ? content.text.trim() : "";
    const actionMatch = text.match(/ACTION:\s*(\w+)/i);
    const action = actionMatch ? actionMatch[1].toLowerCase() : "none";
    const suggestion = text.replace(/\n*ACTION:\s*\w+.*$/i, "").trim();
    return { suggestion: suggestion || "Noted. You can add or edit items in the Itinerary tab.", action };
  } catch (e) {
    console.error("Conversational planning AI error:", e);
    return { suggestion: "You can add or edit items from the Itinerary tab.", action: "none" };
  }
}

/** Generate trip recap from itinerary + photos. */
export async function generateTripRecap(params: {
  destination: string;
  startDate: string;
  endDate: string;
  itinerarySummary?: string;
  photoCaptions?: string[];
}): Promise<{ recap: string }> {
  const { destination, startDate, endDate, itinerarySummary, photoCaptions } = params;
  if (!process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY) {
    return { recap: `A wonderful trip to ${destination} from ${startDate} to ${endDate}.${itinerarySummary ? ` ${itinerarySummary}` : ""}${photoCaptions?.length ? ` Highlights: ${photoCaptions.slice(0, 5).join(", ")}.` : ""}` };
  }
  try {
    const prompt = `Write a short, warm trip recap (2-4 paragraphs) for a group trip to ${destination} (${startDate} to ${endDate}). ${itinerarySummary ? `Itinerary summary: ${itinerarySummary}.` : ""} ${photoCaptions?.length ? `Photo moments: ${photoCaptions.join("; ")}.` : ""} Sound personal and celebratory. No JSON, just prose.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });
    const content = message.content[0];
    const text = content.type === "text" ? content.text.trim() : "";
    return { recap: text || `An unforgettable trip to ${destination}.` };
  } catch (e) {
    console.error("Trip recap AI error:", e);
    return { recap: `A memorable trip to ${destination}. Hope you had a great time!` };
  }
}

/** Generate smart packing list from trip details. */
export async function generatePackingList(params: {
  destination: string;
  startDate: string;
  endDate: string;
  tripType?: string;
  groupSize: number;
}): Promise<{ items: string[] }> {
  const { destination, startDate, endDate, tripType, groupSize } = params;
  if (!process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY) {
    const base = ["Passport/ID", "Phone & charger", "Toiletries", "Clothes", "Sunglasses", "Medications"];
    return { items: base };
  }
  try {
    const prompt = `Generate a practical packing list for a ${groupSize}-person trip to ${destination} from ${startDate} to ${endDate}.${tripType ? ` Trip type: ${tripType}.` : ""}
Return ONLY a JSON array of strings, e.g. ["Passport", "Sunscreen", "Swimwear"]. 15-25 items. No other text.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });
    const content = message.content[0];
    let text = content.type === "text" ? content.text.trim() : "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) text = jsonMatch[0];
    const items = JSON.parse(text) as string[];
    return { items: Array.isArray(items) ? items : [] };
  } catch (e) {
    console.error("Packing list AI error:", e);
    return { items: ["Passport/ID", "Phone & charger", "Toiletries", "Clothes", "Sunglasses"] };
  }
}

/** Parse confirmation email text and suggest itinerary items. */
export async function parseEmailForItinerary(params: { emailText: string; destination?: string }): Promise<{ suggestions: { name: string; description: string; location: string; type: string; dayNumber: number; time: string; pricePerPerson?: number }[] }> {
  const { emailText, destination } = params;
  if (!process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY) {
    return { suggestions: [] };
  }
  try {
    const prompt = `Extract travel booking details from this email. For each flight, hotel, activity, or reservation mentioned, output one line in this exact format (one per line):
NAME|DESCRIPTION|LOCATION|TYPE|DAY|TIME|PRICE
Where TYPE is one of: flight, hotel, dining, activity. DAY is 1-31. TIME is HH:MM. PRICE is number or 0.
Destination context: ${destination || "unknown"}.
Email:
---
${emailText.slice(0, 6000)}
---
Reply with only the lines, no other text. If nothing found, reply with a single line: NONE`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });
    const content = message.content[0];
    const text = content.type === "text" ? content.text.trim() : "";
    if (!text || text.startsWith("NONE")) return { suggestions: [] };
    const lines = text.split("\n").filter((l) => l.includes("|"));
    const suggestions = lines.slice(0, 20).map((line) => {
      const parts = line.split("|");
      return {
        name: parts[0]?.trim() || "Item",
        description: parts[1]?.trim() || "",
        location: parts[2]?.trim() || destination || "",
        type: ["flight", "hotel", "dining", "activity"].includes(parts[3]?.trim() || "") ? parts[3].trim()! : "activity",
        dayNumber: Math.min(31, Math.max(1, parseInt(parts[4] || "1", 10) || 1)),
        time: /^\d{1,2}:\d{2}$/.test(parts[5]?.trim() || "") ? parts[5].trim()! : "12:00",
        pricePerPerson: parseInt(parts[6] || "0", 10) || 0,
      };
    });
    return { suggestions };
  } catch (e) {
    console.error("Parse email error:", e);
    return { suggestions: [] };
  }
}
