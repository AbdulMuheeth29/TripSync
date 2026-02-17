import Anthropic from "@anthropic-ai/sdk";
import { storage } from "./storage";
import { randomUUID } from "crypto";
import type { TripWizardData, AIItinerary } from "@shared/schema";

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

/** Conversational planning: user sends a quick change request, AI suggests an itinerary edit. */
export async function conversationalPlanningSuggestion(params: {
  tripId: string;
  destination: string;
  userMessage: string;
  itemsSummary?: string;
}): Promise<{ suggestion: string; action?: string }> {
  const { destination, userMessage, itemsSummary } = params;
  if (!process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY) {
    return { suggestion: "Quick changes are coming soon. For now, add or edit items from the Itinerary tab.", action: "none" };
  }
  try {
    const prompt = `You are a travel assistant for a trip to ${destination}. The user said: "${userMessage}". ${itemsSummary ? `Current itinerary summary: ${itemsSummary}` : ""}
Reply in 1-2 short sentences: either confirm a simple action (e.g. "I'll add a lunch at X for Day 2") or ask for one clarifying detail. End with a single line "ACTION: add_item|edit_item|none" to indicate what the app could do.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 256,
      messages: [{ role: "user", content: prompt }],
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
