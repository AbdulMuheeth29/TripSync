import Anthropic from "@anthropic-ai/sdk";
import { storage } from "./storage";
import { randomUUID } from "crypto";
import type { TripWizardData, AIItinerary } from "@shared/schema";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

export async function generateItinerary(tripId: string, tripData: TripWizardData) {
  try {
    const prompt = `You are a professional travel planner. Create a detailed 3-day itinerary for a group trip with the following parameters:

Destination: ${tripData.destination}
Dates: ${tripData.startDate} to ${tripData.endDate}
Group size: ${tripData.groupSize} people
Budget per person: $${tripData.budgetPerPerson}
Trip vibe: ${tripData.vibes.join(", ")}
Accommodation preference: ${tripData.accommodationPref}
Dining preference: ${tripData.diningPref}

Generate a day-by-day itinerary with:
- Flight recommendations (if needed)
- Hotel options (1-2 choices per stay)
- Breakfast, lunch, dinner recommendations with price estimates
- 2-3 activities per day with timing
- Evening entertainment options if the vibe includes nightlife

All prices should be per person estimates in USD.

IMPORTANT: Format your response as valid JSON with this exact structure:
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
          "booking_url_hint": "Suggestion for where to book"
        }
      ]
    }
  ]
}

Make the itinerary realistic, exciting, and within budget. Include local favorites and hidden gems alongside popular attractions. Ensure logical timing with adequate travel time between locations.`;

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
