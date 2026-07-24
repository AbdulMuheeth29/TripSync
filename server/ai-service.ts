import Anthropic from '@anthropic-ai/sdk';
import { storage } from './storage';
import { randomUUID } from 'crypto';
import type {
  TripWizardData,
  AIItinerary,
  Trip,
  ItineraryItem,
  Expense,
  Vote,
  TripMember,
} from '@shared/schema';
import { retryWithBackoff, RetryMetrics } from './ai-retry';
import { aiCircuitBreakers, CircuitBreakerError } from './ai-circuit-breaker';
import { cachedAICall, getSmartTTL } from './ai-cache';
import { recordAIOperation, calculateCost, type AIOperationMetrics } from './ai-metrics';

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

/**
 * AI Model Configuration
 *
 * Cost optimization strategy:
 * - Use Sonnet 4.5 for complex reasoning (full itinerary generation)
 * - Use Haiku for simple tasks (suggestions, lists, extraction)
 *
 * Pricing (per 1M tokens):
 * - Haiku: $0.25 input / $1.25 output (12x cheaper)
 * - Sonnet 4.5: $3 input / $15 output
 *
 * Estimated savings: 40-60% of AI costs
 */
const AI_MODELS = {
  // Complex reasoning - needs Sonnet's intelligence
  ITINERARY_GENERATION: 'claude-sonnet-4-5' as const,

  // Simple tasks - Haiku is faster and 12x cheaper
  SUGGESTIONS: 'claude-3-5-haiku-20241022' as const,
  EXTRACTION: 'claude-3-5-haiku-20241022' as const,
  CONTENT_GENERATION: 'claude-3-5-haiku-20241022' as const,
};

type MemberPreferenceInput = {
  userName: string;
  diet?: string | null;
  budgetFlexibility?: string | null;
  mustDoActivities?: string | null;
};

function buildPreferencesSection(preferences: MemberPreferenceInput[]): string {
  if (!preferences.length) return '';
  return `
Group member preferences (synthesize these into a cohesive plan; resolve conflicts by balancing or offering alternatives):
${preferences.map((p) => `- ${p.userName}: Diet: ${p.diet || 'Any'}; Budget flexibility: ${p.budgetFlexibility || 'Standard'}; Must-do: ${p.mustDoActivities || 'None specified'}`).join('\n')}
`;
}

export async function generateItinerary(
  tripId: string,
  tripData: TripWizardData,
  memberPreferences?: MemberPreferenceInput[]
) {
  const operationStart = Date.now();
  const model = AI_MODELS.ITINERARY_GENERATION;

  try {
    // Build cache key from inputs
    const cacheInputs = {
      operation: 'itinerary',
      destination: tripData.destination,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      groupSize: tripData.groupSize,
      budgetPerPerson: tripData.budgetPerPerson,
      vibes: tripData.vibes.sort().join(','),
      accommodationPref: tripData.accommodationPref,
      diningPref: tripData.diningPref,
      preferences:
        memberPreferences
          ?.map((p) => `${p.userName}:${p.diet}:${p.budgetFlexibility}`)
          .sort()
          .join(',') || '',
    };

    // Execute with retry + circuit breaker + caching
    const result = await retryWithBackoff(
      async () => {
        return await aiCircuitBreakers.itineraryGeneration.execute(async () => {
          return await cachedAICall(
            cacheInputs,
            async () => {
              const preferencesSection = buildPreferencesSection(memberPreferences || []);

              const prompt = `You are a professional travel planner. Create a detailed day-by-day itinerary for a group trip.

Trip parameters:
Destination: ${tripData.destination}
Dates: ${tripData.startDate} to ${tripData.endDate}
Group size: ${tripData.groupSize} people
Budget per person: $${tripData.budgetPerPerson}
Trip vibe: ${tripData.vibes.join(', ')}
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
                model,
                max_tokens: 8192,
                messages: [
                  {
                    role: 'user',
                    content: prompt,
                  },
                ],
              });

              const content = message.content[0];
              if (content.type !== 'text') {
                throw new Error('Unexpected response type');
              }

              // Parse the JSON response
              let responseText = content.text;

              // Extract JSON if wrapped in markdown code blocks
              const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
              if (jsonMatch) {
                responseText = jsonMatch[1].trim();
              }

              const itinerary: AIItinerary = JSON.parse(responseText);

              // Calculate cost and return with metadata
              return {
                itinerary,
                usage: message.usage,
                model,
              };
            },
            {
              ttl: getSmartTTL('itinerary', cacheInputs),
              namespace: 'itinerary',
            }
          );
        });
      },
      {
        maxRetries: 3,
        baseDelay: 1000,
      }
    );

    // Extract itinerary from result
    const responseData = result.data;
    const actualData = responseData.cached ? responseData.data : responseData;
    const {
      itinerary,
      usage,
      model: usedModel,
    } = actualData as { itinerary: AIItinerary; usage: any; model: string };

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
          confirmationImageUrl: null, // Images are handled by frontend for US destinations
        });
      }
    }

    // Record successful metrics
    const duration = Date.now() - operationStart;
    const cost = usage ? calculateCost(usedModel, usage.input_tokens, usage.output_tokens) : 0;

    await recordAIOperation({
      operation: 'itinerary-generation',
      model: usedModel,
      success: true,
      duration,
      inputTokens: usage?.input_tokens,
      outputTokens: usage?.output_tokens,
      costUsd: cost,
      cached: result.data.cached,
      attempts: result.attempts,
      timestamp: Date.now(),
    });

    RetryMetrics.recordSuccess(result.attempts, result.totalDuration);

    console.log(
      `✅ Generated itinerary for trip ${tripId} with ${itinerary.itinerary.length} days (${result.attempts} attempts, ${duration}ms, $${cost.toFixed(4)})`
    );
  } catch (error: any) {
    // Record failure metrics
    const duration = Date.now() - operationStart;

    await recordAIOperation({
      operation: 'itinerary-generation',
      model,
      success: false,
      duration,
      errorType:
        error instanceof CircuitBreakerError ? 'circuit_breaker' : error?.type || 'unknown',
      timestamp: Date.now(),
    });

    RetryMetrics.recordFailure();

    console.error(`❌ Failed to generate itinerary for trip ${tripId}:`, {
      error: error?.message || String(error),
      duration,
      type: error?.constructor?.name,
    });

    // Re-throw with user-friendly message
    if (error instanceof CircuitBreakerError) {
      throw new Error(
        'AI service is temporarily unavailable due to high load. Please try again in a few moments.'
      );
    }

    throw new Error(
      'Failed to generate itinerary after multiple attempts. Please try again or contact support if the issue persists.'
    );
  }
}

/** Smart conflict resolution: suggest a compromise from poll question, options, and vote counts. */
export async function suggestConflictResolution(params: {
  question: string;
  options: string[];
  voteCounts: number[];
  memberNames?: string[];
}): Promise<{ suggestion: string }> {
  const { question, options, voteCounts, memberNames } = params;
  const operationStart = Date.now();
  const model = AI_MODELS.SUGGESTIONS;

  try {
    const cacheInputs = {
      operation: 'conflict_resolution',
      question,
      options: options.sort().join(','),
      voteCounts: voteCounts.join(','),
    };

    const result = await retryWithBackoff(
      async () => {
        return await aiCircuitBreakers.suggestions.execute(async () => {
          return await cachedAICall(
            cacheInputs,
            async () => {
              const breakdown = options
                .map((opt, i) => `${opt}: ${voteCounts[i]} vote(s)`)
                .join('; ');
              const prompt = `The group is deciding: "${question}". Options: ${options.join(', ')}. Vote breakdown: ${breakdown}.
Suggest a short, practical compromise (1-2 sentences). Example: "Since 4 want beach and 2 want museums, suggest morning beach + afternoon museum." Reply with only the suggestion text, no JSON.`;

              const message = await anthropic.messages.create({
                model,
                max_tokens: 256,
                messages: [{ role: 'user', content: prompt }],
              });

              const content = message.content[0];
              const text = content.type === 'text' ? content.text.trim() : '';

              return {
                suggestion: text || 'Consider splitting the day so both preferences get time.',
                usage: message.usage,
                model,
              };
            },
            {
              ttl: getSmartTTL('conflict_resolution', cacheInputs),
              namespace: 'conflict-resolution',
            }
          );
        });
      },
      { maxRetries: 3, baseDelay: 500 }
    );

    const responseData = result.data;
    const actualData = responseData.cached ? responseData.data : responseData;
    const {
      suggestion,
      usage,
      model: usedModel,
    } = actualData as { suggestion: string; usage: any; model: string };

    // Record metrics
    const duration = Date.now() - operationStart;
    const cost = usage ? calculateCost(usedModel, usage.input_tokens, usage.output_tokens) : 0;

    await recordAIOperation({
      operation: 'conflict-resolution',
      model: usedModel,
      success: true,
      duration,
      inputTokens: usage?.input_tokens,
      outputTokens: usage?.output_tokens,
      costUsd: cost,
      cached: result.data.cached,
      attempts: result.attempts,
      timestamp: Date.now(),
    });

    return { suggestion };
  } catch (error: any) {
    const duration = Date.now() - operationStart;

    await recordAIOperation({
      operation: 'conflict-resolution',
      model,
      success: false,
      duration,
      errorType:
        error instanceof CircuitBreakerError ? 'circuit_breaker' : error?.type || 'unknown',
      timestamp: Date.now(),
    });

    console.error('Conflict resolution AI error:', error);

    if (error instanceof CircuitBreakerError) {
      throw new Error('AI assistant is temporarily unavailable. Please try again in a moment.');
    }

    throw new Error('Failed to generate conflict resolution suggestion. Please try again.');
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
  const {
    destination,
    budgetPerPerson,
    groupSize,
    totalSpent,
    expenseSummary,
    itineraryEstimated,
  } = params;
  const budgetTotal = budgetPerPerson * groupSize;
  const operationStart = Date.now();
  const model = AI_MODELS.SUGGESTIONS;

  try {
    const cacheInputs = {
      operation: 'budget_optimization',
      destination,
      budgetTotal,
      totalSpent,
      overBudget: totalSpent > budgetTotal,
    };

    const result = await retryWithBackoff(
      async () => {
        return await aiCircuitBreakers.suggestions.execute(async () => {
          return await cachedAICall(
            cacheInputs,
            async () => {
              const prompt = `Travel budget advisor. Trip to ${destination}. Budget: $${budgetPerPerson}/person × ${groupSize} = $${budgetTotal}. Total spent so far: $${totalSpent}. ${expenseSummary ? `Expenses: ${expenseSummary}.` : ''} ${itineraryEstimated ? `Estimated itinerary cost: $${itineraryEstimated}.` : ''}
Give 2-3 short, practical tips to optimize spending (e.g. cheaper dining alternatives, advance bookings, group discounts). Reply with only the tips, no JSON.`;

              const message = await anthropic.messages.create({
                model,
                max_tokens: 512,
                messages: [{ role: 'user', content: prompt }],
              });

              const content = message.content[0];
              const text = content.type === 'text' ? content.text.trim() : '';

              return {
                suggestion: text || 'Consider advance bookings and group discounts to save.',
                usage: message.usage,
                model,
              };
            },
            {
              ttl: getSmartTTL('suggestions', cacheInputs),
              namespace: 'budget-optimization',
            }
          );
        });
      },
      { maxRetries: 3, baseDelay: 500 }
    );

    const responseData = result.data;
    const actualData = responseData.cached ? responseData.data : responseData;
    const {
      suggestion,
      usage,
      model: usedModel,
    } = actualData as { suggestion: string; usage: any; model: string };

    // Record metrics
    const duration = Date.now() - operationStart;
    const cost = usage ? calculateCost(usedModel, usage.input_tokens, usage.output_tokens) : 0;

    await recordAIOperation({
      operation: 'budget-optimization',
      model: usedModel,
      success: true,
      duration,
      inputTokens: usage?.input_tokens,
      outputTokens: usage?.output_tokens,
      costUsd: cost,
      cached: result.data.cached,
      attempts: result.attempts,
      timestamp: Date.now(),
    });

    return { suggestion };
  } catch (error: any) {
    const duration = Date.now() - operationStart;

    await recordAIOperation({
      operation: 'budget-optimization',
      model,
      success: false,
      duration,
      errorType:
        error instanceof CircuitBreakerError ? 'circuit_breaker' : error?.type || 'unknown',
      timestamp: Date.now(),
    });

    console.error('Budget optimization AI error:', error);

    if (error instanceof CircuitBreakerError) {
      throw new Error('AI assistant is temporarily unavailable. Please try again in a moment.');
    }

    throw new Error('Failed to generate budget optimization tips. Please try again.');
  }
}

export type AtlasRichContext = {
  trip: Pick<
    Trip,
    | 'id'
    | 'destination'
    | 'startDate'
    | 'endDate'
    | 'budgetPerPerson'
    | 'groupSize'
    | 'status'
    | 'isLocked'
  >;
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
  const operationStart = Date.now();
  const model = AI_MODELS.SUGGESTIONS;

  try {
    const cacheInputs = {
      operation: 'conversational_planning',
      userMessage,
      tripId: params.tripId,
      completionPercentage: context.progress.completionPercentage,
    };

    const result = await retryWithBackoff(
      async () => {
        return await aiCircuitBreakers.suggestions.execute(async () => {
          // Don't cache conversational responses - they're highly contextual
          return await cachedAICall(
            cacheInputs,
            async () => {
              const { trip, progress, behavior, detectedIssues } = context;

              const issuesList =
                detectedIssues && detectedIssues.length > 0
                  ? detectedIssues.map((i) => `- ${i}`).join('\n')
                  : '- None detected from metrics above. Focus on what the user is asking.';

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
- Current spend: $${progress.totalExpenses} (${progress.overBudget ? `OVER budget by $${progress.overAmount}` : 'under budget'})

TRIP PROGRESS:
- Itinerary items: ${progress.itineraryItems} across ${progress.daysWithActivities + progress.daysWithoutActivities} days (${progress.daysWithoutActivities} days empty)
- Expenses: ${expenses.length} tracked
- Votes: ${progress.activeVotes} active, ${progress.stuckVotes} stuck (ties)
- Completion: ${progress.completionPercentage}%

GROUP & MEMBERS:
- Total members: ${members.length}
- Confirmed: ${progress.confirmedMembers}, Pending: ${progress.pendingMembers}

USER BEHAVIOR:
- Current page: ${behavior.currentPage ?? 'unknown'}
- Time on page: ${behavior.timeOnPage ?? 0} seconds
- Last action: ${behavior.lastAction ?? 'unknown'}
${behavior.inactivityTime && behavior.inactivityTime > 30 ? `- User inactive for ${behavior.inactivityTime}s (may be stuck)` : ''}

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
                .map(
                  (i) =>
                    `- Day ${i.dayNumber} ${i.time} ${i.type}: ${i.name} @ ${i.location} ($${i.pricePerPerson}/person)`
                )
                .join('\n');

              const userPrompt = `USER MESSAGE:
"${userMessage}"

SNAPSHOT OF ITINERARY (first ${Math.min(items.length, 10)} items):
${recentItemsSummary || '- No items yet; itinerary is empty.'}

INSTRUCTIONS:
- Respond in a warm, confident tone.
- Focus on one primary suggestion plus (optionally) 1–2 follow‑ups.
- If an obvious quick fix exists (e.g. fill empty days, reduce budget overrun, resolve stuck vote), propose it directly.
- At the very end of your message, add a line of the form:
  ACTION: add_item | edit_item | optimize_budget | resolve_vote | none
Choose the single best action type for the app to take given the situation.`;

              const message = await anthropic.messages.create({
                model,
                max_tokens: 256,
                system: systemPrompt,
                messages: [{ role: 'user', content: userPrompt }],
              });

              const content = message.content[0];
              const text = content.type === 'text' ? content.text.trim() : '';
              const actionMatch = text.match(/ACTION:\s*(\w+)/i);
              const action = actionMatch ? actionMatch[1].toLowerCase() : 'none';
              const suggestion = text.replace(/\n*ACTION:\s*\w+.*$/i, '').trim();

              return {
                suggestion: suggestion || 'Noted. You can add or edit items in the Itinerary tab.',
                action,
                usage: message.usage,
                model,
              };
            },
            {
              ttl: 0, // Don't cache conversational responses
              namespace: 'conversational-planning',
            }
          );
        });
      },
      { maxRetries: 3, baseDelay: 500 }
    );

    const responseData = result.data;
    const actualData = responseData.cached ? responseData.data : responseData;
    const {
      suggestion,
      action,
      usage,
      model: usedModel,
    } = actualData as { suggestion: string; action: string; usage: any; model: string };

    // Record metrics
    const duration = Date.now() - operationStart;
    const cost = usage ? calculateCost(usedModel, usage.input_tokens, usage.output_tokens) : 0;

    await recordAIOperation({
      operation: 'conversational-planning',
      model: usedModel,
      success: true,
      duration,
      inputTokens: usage?.input_tokens,
      outputTokens: usage?.output_tokens,
      costUsd: cost,
      cached: result.data.cached,
      attempts: result.attempts,
      timestamp: Date.now(),
    });

    return { suggestion, action };
  } catch (error: any) {
    const duration = Date.now() - operationStart;

    await recordAIOperation({
      operation: 'conversational-planning',
      model,
      success: false,
      duration,
      errorType:
        error instanceof CircuitBreakerError ? 'circuit_breaker' : error?.type || 'unknown',
      timestamp: Date.now(),
    });

    console.error('Conversational planning AI error:', error);

    if (error instanceof CircuitBreakerError) {
      throw new Error('AI assistant is temporarily unavailable. Please try again in a moment.');
    }

    throw new Error('Failed to process your request. Please try again.');
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
  const operationStart = Date.now();
  const model = AI_MODELS.CONTENT_GENERATION;

  try {
    const cacheInputs = {
      operation: 'trip_recap',
      destination,
      startDate,
      endDate,
      hasSummary: !!itinerarySummary,
      hasPhotos: !!photoCaptions?.length,
    };

    const result = await retryWithBackoff(
      async () => {
        return await aiCircuitBreakers.suggestions.execute(async () => {
          return await cachedAICall(
            cacheInputs,
            async () => {
              const prompt = `Write a short, warm trip recap (2-4 paragraphs) for a group trip to ${destination} (${startDate} to ${endDate}). ${itinerarySummary ? `Itinerary summary: ${itinerarySummary}.` : ''} ${photoCaptions?.length ? `Photo moments: ${photoCaptions.join('; ')}.` : ''} Sound personal and celebratory. No JSON, just prose.`;

              const message = await anthropic.messages.create({
                model,
                max_tokens: 1024,
                messages: [{ role: 'user', content: prompt }],
              });

              const content = message.content[0];
              const text = content.type === 'text' ? content.text.trim() : '';

              return {
                recap: text || `An unforgettable trip to ${destination}.`,
                usage: message.usage,
                model,
              };
            },
            {
              ttl: getSmartTTL('trip_recap', cacheInputs),
              namespace: 'trip-recap',
            }
          );
        });
      },
      { maxRetries: 3, baseDelay: 500 }
    );

    const responseData = result.data;
    const actualData = responseData.cached ? responseData.data : responseData;
    const {
      recap,
      usage,
      model: usedModel,
    } = actualData as { recap: string; usage: any; model: string };

    const duration = Date.now() - operationStart;
    const cost = usage ? calculateCost(usedModel, usage.input_tokens, usage.output_tokens) : 0;

    await recordAIOperation({
      operation: 'trip-recap',
      model: usedModel,
      success: true,
      duration,
      inputTokens: usage?.input_tokens,
      outputTokens: usage?.output_tokens,
      costUsd: cost,
      cached: result.data.cached,
      attempts: result.attempts,
      timestamp: Date.now(),
    });

    return { recap };
  } catch (error: any) {
    const duration = Date.now() - operationStart;

    await recordAIOperation({
      operation: 'trip-recap',
      model,
      success: false,
      duration,
      errorType:
        error instanceof CircuitBreakerError ? 'circuit_breaker' : error?.type || 'unknown',
      timestamp: Date.now(),
    });

    console.error('Trip recap AI error:', error);

    if (error instanceof CircuitBreakerError) {
      throw new Error('AI assistant is temporarily unavailable. Please try again in a moment.');
    }

    throw new Error('Failed to generate trip recap. Please try again.');
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
  const operationStart = Date.now();
  const model = AI_MODELS.CONTENT_GENERATION;

  try {
    const cacheInputs = {
      operation: 'packing_list',
      destination,
      tripType: tripType || 'general',
      duration: Math.ceil(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
      ),
    };

    const result = await retryWithBackoff(
      async () => {
        return await aiCircuitBreakers.extraction.execute(async () => {
          return await cachedAICall(
            cacheInputs,
            async () => {
              const prompt = `Generate a practical packing list for a ${groupSize}-person trip to ${destination} from ${startDate} to ${endDate}.${tripType ? ` Trip type: ${tripType}.` : ''}
Return ONLY a JSON array of strings, e.g. ["Passport", "Sunscreen", "Swimwear"]. 15-25 items. No other text.`;

              const message = await anthropic.messages.create({
                model,
                max_tokens: 512,
                messages: [{ role: 'user', content: prompt }],
              });

              const content = message.content[0];
              let text = content.type === 'text' ? content.text.trim() : '';
              const jsonMatch = text.match(/\[[\s\S]*\]/);
              if (jsonMatch) text = jsonMatch[0];
              const items = JSON.parse(text) as string[];

              return {
                items: Array.isArray(items) ? items : [],
                usage: message.usage,
                model,
              };
            },
            {
              ttl: getSmartTTL('packing_list', cacheInputs),
              namespace: 'packing-list',
            }
          );
        });
      },
      { maxRetries: 3, baseDelay: 500 }
    );

    const responseData = result.data;
    const actualData = responseData.cached ? responseData.data : responseData;
    const {
      items,
      usage,
      model: usedModel,
    } = actualData as { items: string[]; usage: any; model: string };

    const duration = Date.now() - operationStart;
    const cost = usage ? calculateCost(usedModel, usage.input_tokens, usage.output_tokens) : 0;

    await recordAIOperation({
      operation: 'packing-list',
      model: usedModel,
      success: true,
      duration,
      inputTokens: usage?.input_tokens,
      outputTokens: usage?.output_tokens,
      costUsd: cost,
      cached: result.data.cached,
      attempts: result.attempts,
      timestamp: Date.now(),
    });

    return { items };
  } catch (error: any) {
    const duration = Date.now() - operationStart;

    await recordAIOperation({
      operation: 'packing-list',
      model,
      success: false,
      duration,
      errorType:
        error instanceof CircuitBreakerError ? 'circuit_breaker' : error?.type || 'unknown',
      timestamp: Date.now(),
    });

    console.error('Packing list AI error:', error);

    if (error instanceof CircuitBreakerError) {
      throw new Error('AI assistant is temporarily unavailable. Please try again in a moment.');
    }

    throw new Error('Failed to generate packing list. Please try again.');
  }
}

/** Parse confirmation email text and suggest itinerary items. */
export async function parseEmailForItinerary(params: {
  emailText: string;
  destination?: string;
}): Promise<{
  suggestions: {
    name: string;
    description: string;
    location: string;
    type: string;
    dayNumber: number;
    time: string;
    pricePerPerson?: number;
  }[];
}> {
  const { emailText, destination } = params;
  const operationStart = Date.now();
  const model = AI_MODELS.EXTRACTION;

  try {
    // Don't cache email parsing - content is always unique
    const result = await retryWithBackoff(
      async () => {
        return await aiCircuitBreakers.extraction.execute(async () => {
          const prompt = `Extract travel booking details from this email. For each flight, hotel, activity, or reservation mentioned, output one line in this exact format (one per line):
NAME|DESCRIPTION|LOCATION|TYPE|DAY|TIME|PRICE
Where TYPE is one of: flight, hotel, dining, activity. DAY is 1-31. TIME is HH:MM. PRICE is number or 0.
Destination context: ${destination || 'unknown'}.
Email:
---
${emailText.slice(0, 6000)}
---
Reply with only the lines, no other text. If nothing found, reply with a single line: NONE`;

          const message = await anthropic.messages.create({
            model,
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }],
          });

          const content = message.content[0];
          const text = content.type === 'text' ? content.text.trim() : '';

          if (!text || text.startsWith('NONE')) {
            return { suggestions: [], usage: message.usage, model };
          }

          const lines = text.split('\n').filter((l) => l.includes('|'));
          const suggestions = lines.slice(0, 20).map((line) => {
            const parts = line.split('|');
            return {
              name: parts[0]?.trim() || 'Item',
              description: parts[1]?.trim() || '',
              location: parts[2]?.trim() || destination || '',
              type: ['flight', 'hotel', 'dining', 'activity'].includes(parts[3]?.trim() || '')
                ? parts[3].trim()!
                : 'activity',
              dayNumber: Math.min(31, Math.max(1, parseInt(parts[4] || '1', 10) || 1)),
              time: /^\d{1,2}:\d{2}$/.test(parts[5]?.trim() || '') ? parts[5].trim()! : '12:00',
              pricePerPerson: parseInt(parts[6] || '0', 10) || 0,
            };
          });

          return { suggestions, usage: message.usage, model };
        });
      },
      { maxRetries: 3, baseDelay: 500 }
    );

    const { suggestions, usage, model: usedModel } = result.data;
    const duration = Date.now() - operationStart;
    const cost = usage ? calculateCost(usedModel, usage.input_tokens, usage.output_tokens) : 0;

    await recordAIOperation({
      operation: 'email-parsing',
      model: usedModel,
      success: true,
      duration,
      inputTokens: usage?.input_tokens,
      outputTokens: usage?.output_tokens,
      costUsd: cost,
      cached: false,
      attempts: result.attempts,
      timestamp: Date.now(),
    });

    return { suggestions };
  } catch (error: any) {
    const duration = Date.now() - operationStart;

    await recordAIOperation({
      operation: 'email-parsing',
      model,
      success: false,
      duration,
      errorType:
        error instanceof CircuitBreakerError ? 'circuit_breaker' : error?.type || 'unknown',
      timestamp: Date.now(),
    });

    console.error('Parse email error:', error);

    if (error instanceof CircuitBreakerError) {
      throw new Error('AI assistant is temporarily unavailable. Please try again in a moment.');
    }

    throw new Error('Failed to parse email. Please try again.');
  }
}
