/**
 * AI-Only Enhancement Features
 *
 * Features that ONLY work with AI - cannot have fallbacks.
 * These are our competitive differentiators:
 *
 * 1. Smart Activity Scheduling - AI optimizes timing based on proximity, crowd patterns
 * 2. Predictive Trip Success Scoring - AI predicts if trip will be successful
 * 3. Dynamic Pricing Intelligence - AI tracks price changes and suggests best booking times
 * 4. Conflict-Free Scheduling - AI detects and prevents scheduling conflicts
 * 5. Personalized Recommendations - AI learns and adapts to group dynamics
 */

import Anthropic from "@anthropic-ai/sdk";
import type { Trip, ItineraryItem, TripMember } from "@shared/schema";
import { retryWithBackoff } from "./ai-retry";
import { aiCircuitBreakers } from "./ai-circuit-breaker";
import { recordAIOperation, calculateCost } from "./ai-metrics";
import { getUserPreferences } from "./preference-learning";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const AI_MODEL_COMPLEX = 'claude-sonnet-4-5'; // For complex reasoning
const AI_MODEL_FAST = 'claude-3-5-haiku-20241022'; // For fast operations

// ============================================================================
// 1. SMART ACTIVITY SCHEDULING
// ============================================================================

/**
 * Optimized schedule recommendation
 */
export interface OptimizedSchedule {
  dayNumber: number;
  items: Array<{
    item: ItineraryItem;
    suggestedTime: string;
    reasoning: string;
    conflicts: string[];
    optimizationScore: number; // 0-100
  }>;
  totalTravelTime: number; // minutes
  efficiency: number; // 0-100 (how well optimized)
  warnings: string[];
}

/**
 * Smart Activity Scheduling
 *
 * Uses AI to optimize activity timing based on:
 * - Geographic proximity (minimize travel)
 * - Typical crowd patterns (avoid peak times)
 * - Activity duration estimates
 * - Meal timing (lunch around noon, dinner around 7pm)
 * - Energy levels (intensive activities earlier)
 */
export async function optimizeActivitySchedule(
  trip: Trip,
  items: ItineraryItem[],
  dayNumber: number
): Promise<OptimizedSchedule | null> {
  const operationStart = Date.now();

  try {
    const dayItems = items.filter(i => i.dayNumber === dayNumber);

    if (dayItems.length === 0) {
      return null; // Nothing to optimize
    }

    const itemDescriptions = dayItems.map(i =>
      `${i.time} - ${i.type}: ${i.name} at ${i.location} ($${i.pricePerPerson}/person)`
    ).join('\n');

    const prompt = `You are a travel optimization expert. Optimize this day's schedule for maximum efficiency and enjoyment.

Destination: ${trip.destination}
Day ${dayNumber} activities:
${itemDescriptions}

Optimize for:
1. Minimize travel time between locations
2. Avoid peak crowd times
3. Logical meal timing (breakfast ~9am, lunch ~1pm, dinner ~7pm)
4. Energy management (intensive activities earlier)
5. Realistic activity durations (don't over-schedule)

For each activity, suggest the optimal time and explain why.

Respond in JSON:
{
  "items": [
    {
      "name": "Activity name",
      "originalTime": "HH:MM",
      "suggestedTime": "HH:MM",
      "reasoning": "Why this time is optimal",
      "conflicts": ["Any potential issues"],
      "optimizationScore": 85
    }
  ],
  "totalTravelTime": 45,
  "efficiency": 92,
  "warnings": ["Any warnings about the schedule"]
}`;

    const result = await retryWithBackoff(
      async () => {
        return await aiCircuitBreakers.itineraryGeneration.execute(async () => {
          const message = await anthropic.messages.create({
            model: AI_MODEL_COMPLEX,
            max_tokens: 2048,
            messages: [{ role: "user", content: prompt }],
          });

          const content = message.content[0];
          const text = content.type === "text" ? content.text.trim() : "";

          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error('No JSON in response');
          }

          const parsed = JSON.parse(jsonMatch[0]);

          return {
            parsed,
            usage: message.usage,
            model: AI_MODEL_COMPLEX
          };
        });
      },
      { maxRetries: 3, baseDelay: 1000 }
    );

    const { parsed, usage } = result.data;

    // Record metrics
    const duration = Date.now() - operationStart;
    const cost = usage ? calculateCost(AI_MODEL_COMPLEX, usage.input_tokens, usage.output_tokens) : 0;

    await recordAIOperation({
      operation: 'smart-scheduling',
      model: AI_MODEL_COMPLEX,
      success: true,
      duration,
      inputTokens: usage?.input_tokens,
      outputTokens: usage?.output_tokens,
      costUsd: cost,
      cached: false,
      attempts: result.attempts,
      timestamp: Date.now()
    });

    // Map response to our format
    return {
      dayNumber,
      items: parsed.items.map((ai: any, idx: number) => ({
        item: dayItems[idx],
        suggestedTime: ai.suggestedTime,
        reasoning: ai.reasoning,
        conflicts: ai.conflicts || [],
        optimizationScore: ai.optimizationScore || 50
      })),
      totalTravelTime: parsed.totalTravelTime || 0,
      efficiency: parsed.efficiency || 50,
      warnings: parsed.warnings || []
    };
  } catch (error: any) {
    const duration = Date.now() - operationStart;

    await recordAIOperation({
      operation: 'smart-scheduling',
      model: AI_MODEL_COMPLEX,
      success: false,
      duration,
      errorType: error?.type || 'unknown',
      timestamp: Date.now()
    });

    console.error('Failed to optimize schedule:', error);
    throw new Error('AI scheduling optimization failed. Please try again.');
  }
}

// ============================================================================
// 2. PREDICTIVE TRIP SUCCESS SCORING
// ============================================================================

/**
 * Trip success prediction
 */
export interface TripSuccessPrediction {
  score: number; // 0-100 (likelihood of success)
  confidence: number; // 0-100 (how confident AI is)
  factors: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  recommendations: Array<{
    priority: number;
    action: string;
    impact: number; // How much it would improve score
  }>;
  riskLevel: 'low' | 'medium' | 'high';
}

/**
 * Predict Trip Success
 *
 * AI analyzes trip data to predict success:
 * - Group dynamics (engagement, voting patterns)
 * - Planning completeness (itinerary, bookings)
 * - Budget realism (spending vs budget)
 * - Timeline (enough time to plan)
 * - Member satisfaction indicators
 */
export async function predictTripSuccess(
  trip: Trip,
  members: TripMember[],
  items: ItineraryItem[],
  expenses: any[],
  votes: any[]
): Promise<TripSuccessPrediction> {
  const operationStart = Date.now();

  try {
    // Calculate metrics
    const daysUntilTrip = Math.ceil(
      (new Date(trip.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    const tripDuration = Math.ceil(
      (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    const daysWithActivities = new Set(items.map(i => i.dayNumber)).size;
    const completionRate = tripDuration > 0 ? (daysWithActivities / tripDuration) * 100 : 0;

    const totalBudget = trip.budgetPerPerson * trip.groupSize;
    const totalSpent = expenses.reduce((sum: number, e: any) => sum + e.amount, 0);
    const budgetUsage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    const context = `
Trip to ${trip.destination} (${trip.startDate} to ${trip.endDate})
Group size: ${trip.groupSize} (${members.length} joined)
Days until trip: ${daysUntilTrip}
Trip duration: ${tripDuration} days
Completion: ${completionRate.toFixed(0)}% (${daysWithActivities}/${tripDuration} days planned)
Budget usage: ${budgetUsage.toFixed(0)}% ($${totalSpent}/$${totalBudget})
Total activities: ${items.length}
Active votes: ${votes.filter((v: any) => v.status === 'open').length}
Total expenses tracked: ${expenses.length}
`;

    const prompt = `You are a travel planning success predictor. Analyze this trip's likelihood of success.

${context}

Predict:
1. Success score (0-100): How likely is this trip to be successful and enjoyable?
2. Confidence (0-100): How confident are you in this prediction?
3. Positive factors: What's going well?
4. Negative factors: What needs attention?
5. Top 3 recommendations to improve success score

Respond in JSON:
{
  "score": 75,
  "confidence": 85,
  "positiveFactors": ["Good group engagement", "Realistic budget"],
  "negativeFactors": ["Low completion rate", "Too many open votes"],
  "neutralFactors": ["Adequate planning time"],
  "recommendations": [
    {"priority": 1, "action": "Finalize itinerary for remaining days", "impact": 15},
    {"priority": 2, "action": "Resolve open votes", "impact": 10}
  ],
  "riskLevel": "medium"
}`;

    const result = await retryWithBackoff(
      async () => {
        return await aiCircuitBreakers.suggestions.execute(async () => {
          const message = await anthropic.messages.create({
            model: AI_MODEL_FAST,
            max_tokens: 1024,
            messages: [{ role: "user", content: prompt }],
          });

          const content = message.content[0];
          const text = content.type === "text" ? content.text.trim() : "";

          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error('No JSON in response');
          }

          const parsed = JSON.parse(jsonMatch[0]);

          return {
            parsed,
            usage: message.usage,
            model: AI_MODEL_FAST
          };
        });
      },
      { maxRetries: 3, baseDelay: 500 }
    );

    const { parsed, usage } = result.data;

    // Record metrics
    const duration = Date.now() - operationStart;
    const cost = usage ? calculateCost(AI_MODEL_FAST, usage.input_tokens, usage.output_tokens) : 0;

    await recordAIOperation({
      operation: 'success-prediction',
      model: AI_MODEL_FAST,
      success: true,
      duration,
      inputTokens: usage?.input_tokens,
      outputTokens: usage?.output_tokens,
      costUsd: cost,
      cached: false,
      attempts: result.attempts,
      timestamp: Date.now()
    });

    return {
      score: parsed.score || 50,
      confidence: parsed.confidence || 50,
      factors: {
        positive: parsed.positiveFactors || [],
        negative: parsed.negativeFactors || [],
        neutral: parsed.neutralFactors || []
      },
      recommendations: parsed.recommendations || [],
      riskLevel: parsed.riskLevel || 'medium'
    };
  } catch (error: any) {
    const duration = Date.now() - operationStart;

    await recordAIOperation({
      operation: 'success-prediction',
      model: AI_MODEL_FAST,
      success: false,
      duration,
      errorType: error?.type || 'unknown',
      timestamp: Date.now()
    });

    console.error('Failed to predict trip success:', error);
    throw new Error('AI success prediction failed. Please try again.');
  }
}

// ============================================================================
// 3. DYNAMIC PRICING INTELLIGENCE
// ============================================================================

/**
 * Price trend analysis
 */
export interface PriceTrendAnalysis {
  item: ItineraryItem;
  currentPrice: number;
  estimatedTrend: 'rising' | 'falling' | 'stable';
  confidence: number;
  bookingRecommendation: 'book_now' | 'wait' | 'monitor';
  reasoning: string;
  estimatedSavings?: number;
  bestTimeToBook?: string;
}

/**
 * Analyze Pricing Trends
 *
 * AI analyzes market patterns to predict if prices will rise or fall:
 * - Seasonal patterns for destination
 * - Days until travel (last-minute pricing)
 * - Day of week effects
 * - Historical price patterns
 * - Special events/holidays
 */
export async function analyzePricingTrends(
  trip: Trip,
  item: ItineraryItem
): Promise<PriceTrendAnalysis> {
  const operationStart = Date.now();

  try {
    const daysUntilTrip = Math.ceil(
      (new Date(trip.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    const prompt = `You are a travel pricing expert. Analyze pricing trends for this item.

Item: ${item.type} - ${item.name}
Destination: ${trip.destination}
Current price: $${item.pricePerPerson}/person
Days until trip: ${daysUntilTrip}
Travel date: ${trip.startDate}

Predict:
1. Price trend (rising/falling/stable)
2. Should user book now or wait?
3. Potential savings if they wait
4. Best time to book

Respond in JSON:
{
  "estimatedTrend": "rising",
  "confidence": 80,
  "bookingRecommendation": "book_now",
  "reasoning": "Prices typically rise 2-3 weeks before travel for this destination",
  "estimatedSavings": null,
  "bestTimeToBook": "within next 48 hours"
}`;

    const result = await retryWithBackoff(
      async () => {
        return await aiCircuitBreakers.suggestions.execute(async () => {
          const message = await anthropic.messages.create({
            model: AI_MODEL_FAST,
            max_tokens: 512,
            messages: [{ role: "user", content: prompt }],
          });

          const content = message.content[0];
          const text = content.type === "text" ? content.text.trim() : "";

          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error('No JSON in response');
          }

          const parsed = JSON.parse(jsonMatch[0]);

          return {
            parsed,
            usage: message.usage,
            model: AI_MODEL_FAST
          };
        });
      },
      { maxRetries: 3, baseDelay: 500 }
    );

    const { parsed, usage } = result.data;

    // Record metrics
    const duration = Date.now() - operationStart;
    const cost = usage ? calculateCost(AI_MODEL_FAST, usage.input_tokens, usage.output_tokens) : 0;

    await recordAIOperation({
      operation: 'pricing-intelligence',
      model: AI_MODEL_FAST,
      success: true,
      duration,
      inputTokens: usage?.input_tokens,
      outputTokens: usage?.output_tokens,
      costUsd: cost,
      cached: false,
      attempts: result.attempts,
      timestamp: Date.now()
    });

    return {
      item,
      currentPrice: item.pricePerPerson,
      estimatedTrend: parsed.estimatedTrend || 'stable',
      confidence: parsed.confidence || 50,
      bookingRecommendation: parsed.bookingRecommendation || 'monitor',
      reasoning: parsed.reasoning || 'Insufficient data',
      estimatedSavings: parsed.estimatedSavings,
      bestTimeToBook: parsed.bestTimeToBook
    };
  } catch (error: any) {
    const duration = Date.now() - operationStart;

    await recordAIOperation({
      operation: 'pricing-intelligence',
      model: AI_MODEL_FAST,
      success: false,
      duration,
      errorType: error?.type || 'unknown',
      timestamp: Date.now()
    });

    console.error('Failed to analyze pricing:', error);
    throw new Error('AI pricing analysis failed. Please try again.');
  }
}

// ============================================================================
// 4. PERSONALIZED GROUP RECOMMENDATIONS
// ============================================================================

/**
 * Generate personalized recommendations based on group preferences
 *
 * Uses learned preferences from all group members to suggest activities
 */
export async function generatePersonalizedRecommendations(
  trip: Trip,
  members: TripMember[],
  dayNumber: number
): Promise<Array<{
  type: string;
  name: string;
  description: string;
  location: string;
  pricePerPerson: number;
  matchScore: number; // How well it matches group preferences
  reasoning: string;
}>> {
  const operationStart = Date.now();

  try {
    // Get learned preferences for all members
    const memberPreferences = await Promise.all(
      members.map(async (m) => ({
        userId: m.userId,
        preferences: await getUserPreferences(m.userId, trip.destination)
      }))
    );

    // Build context
    const prefContext = memberPreferences.map(mp =>
      `User ${mp.userId}: ${JSON.stringify(mp.preferences)}`
    ).join('\n');

    const prompt = `Generate 5 personalized activity recommendations for this group on day ${dayNumber}.

Trip: ${trip.destination}
Date: ${trip.startDate}
Budget per person: $${trip.budgetPerPerson}

Group preferences (learned from past behavior):
${prefContext || 'No learned preferences yet'}

Trip vibes: ${trip.vibes.join(', ')}

Generate activities that match the GROUP's collective preferences.

Respond in JSON array:
[
  {
    "type": "activity",
    "name": "Activity name",
    "description": "What you'll do",
    "location": "Where",
    "pricePerPerson": 50,
    "matchScore": 85,
    "reasoning": "Why this matches group preferences"
  }
]`;

    const result = await retryWithBackoff(
      async () => {
        return await aiCircuitBreakers.itineraryGeneration.execute(async () => {
          const message = await anthropic.messages.create({
            model: AI_MODEL_COMPLEX,
            max_tokens: 2048,
            messages: [{ role: "user", content: prompt }],
          });

          const content = message.content[0];
          const text = content.type === "text" ? content.text.trim() : "";

          const jsonMatch = text.match(/\[[\s\S]*\]/);
          if (!jsonMatch) {
            throw new Error('No JSON array in response');
          }

          const parsed = JSON.parse(jsonMatch[0]);

          return {
            parsed,
            usage: message.usage,
            model: AI_MODEL_COMPLEX
          };
        });
      },
      { maxRetries: 3, baseDelay: 1000 }
    );

    const { parsed, usage } = result.data;

    // Record metrics
    const duration = Date.now() - operationStart;
    const cost = usage ? calculateCost(AI_MODEL_COMPLEX, usage.input_tokens, usage.output_tokens) : 0;

    await recordAIOperation({
      operation: 'personalized-recommendations',
      model: AI_MODEL_COMPLEX,
      success: true,
      duration,
      inputTokens: usage?.input_tokens,
      outputTokens: usage?.output_tokens,
      costUsd: cost,
      cached: false,
      attempts: result.attempts,
      timestamp: Date.now()
    });

    return parsed;
  } catch (error: any) {
    const duration = Date.now() - operationStart;

    await recordAIOperation({
      operation: 'personalized-recommendations',
      model: AI_MODEL_COMPLEX,
      success: false,
      duration,
      errorType: error?.type || 'unknown',
      timestamp: Date.now()
    });

    console.error('Failed to generate personalized recommendations:', error);
    throw new Error('AI recommendations failed. Please try again.');
  }
}
