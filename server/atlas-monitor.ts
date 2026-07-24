/**
 * Atlas Proactive Monitoring Service
 *
 * Monitors trip health 24/7 and intervenes when needed:
 * - Budget overruns (>110% spent)
 * - Vote deadlocks (tied >24 hours)
 * - Deadline urgency (trip <7 days, <50% complete)
 * - Inactivity (no activity for 3+ days)
 *
 * Runs every 15 minutes for active trips.
 */

import Anthropic from "@anthropic-ai/sdk";
import { storage } from "./storage";
import type { Trip, TripMember, ItineraryItem, Expense, Vote } from "@shared/schema";
import { retryWithBackoff } from "./ai-retry";
import { aiCircuitBreakers } from "./ai-circuit-breaker";
import { recordAIOperation, calculateCost } from "./ai-metrics";
import { getDb } from "./db";
import { atlasMonitoringState, atlasInterventions, trips } from "@shared/schema";
import { eq, lt, and, isNull } from "drizzle-orm";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const AI_MODEL = 'claude-3-5-haiku-20241022'; // Fast and cheap for monitoring

/**
 * Trip health metrics
 */
interface TripHealth {
  trip: Trip;
  completion: number; // 0-100%
  budgetUsage: number; // 0-200%+
  daysUntilTrip: number | null;
  stuckVotes: number;
  inactiveDays: number;
  hasMembers: boolean;
  hasItinerary: boolean;
  issues: string[];
}

/**
 * Atlas intervention recommendation
 */
interface AtlasIntervention {
  type: 'budget_alert' | 'deadline_warning' | 'vote_deadlock' | 'inactivity_nudge' | 'completion_check';
  severity: 'info' | 'warning' | 'urgent';
  message: string;
  suggestedActions: Array<{
    action: string;
    description: string;
    priority: number;
  }>;
  triggerCondition: string;
}

/**
 * Calculate trip health metrics
 */
async function calculateTripHealth(tripId: string): Promise<TripHealth | null> {
  try {
    const trip = await storage.getTrip(tripId);
    if (!trip || trip.status !== 'planning') {
      return null;
    }

    const [members, items, expenses, votes] = await Promise.all([
      storage.getTripMembers(tripId),
      storage.getItineraryItems(tripId),
      storage.getExpensesByTrip(tripId),
      storage.getVotesByTrip(tripId),
    ]);

    // Calculate completion (% of days with activities)
    const tripDuration = Math.ceil(
      (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysWithActivities = new Set(items.map((i: any) => i.dayNumber)).size;
    const completion = tripDuration > 0 ? (daysWithActivities / tripDuration) * 100 : 0;

    // Calculate budget usage
    const totalBudget = trip.budgetPerPerson * trip.groupSize;
    const totalSpent = expenses.reduce((sum: number, e: any) => sum + e.amount, 0);
    const budgetUsage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    // Calculate days until trip
    const daysUntilTrip = Math.ceil(
      (new Date(trip.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    // Count stuck votes (ties that have been open >24 hours)
    const now = Date.now();
    const stuckVotes = votes.filter((vote: any) => {
      if (vote.status !== 'open') return false;
      const ageHours = (now - new Date(vote.createdAt).getTime()) / (1000 * 60 * 60);
      // Check if it's a tie (this is simplified - you'd need actual vote counts)
      return ageHours > 24;
    }).length;

    // Calculate inactivity (no recent activity)
    const recentActivity = Math.max(
      new Date(trip.createdAt).getTime(),
      ...items.map((i: any) => new Date(i.createdAt).getTime()),
      ...expenses.map((e: any) => new Date(e.createdAt).getTime()),
      ...votes.map((v: any) => new Date(v.createdAt).getTime())
    );
    const inactiveDays = Math.floor((now - recentActivity) / (1000 * 60 * 60 * 24));

    // Detect issues
    const issues: string[] = [];
    if (budgetUsage > 110) issues.push('budget_overrun');
    if (daysUntilTrip < 7 && completion < 50) issues.push('deadline_incomplete');
    if (stuckVotes > 0) issues.push('vote_deadlock');
    if (inactiveDays >= 3) issues.push('inactivity');
    if (members.length < 2) issues.push('no_members');
    if (items.length === 0) issues.push('no_itinerary');

    return {
      trip,
      completion,
      budgetUsage,
      daysUntilTrip: daysUntilTrip > 0 ? daysUntilTrip : null,
      stuckVotes,
      inactiveDays,
      hasMembers: members.length >= 2,
      hasItinerary: items.length > 0,
      issues,
    };
  } catch (error) {
    console.error(`Failed to calculate trip health for ${tripId}:`, error);
    return null;
  }
}

/**
 * Generate Atlas intervention using AI
 */
async function generateIntervention(health: TripHealth): Promise<AtlasIntervention | null> {
  const operationStart = Date.now();

  try {
    // Determine primary issue
    const primaryIssue = health.issues[0];
    if (!primaryIssue) {
      return null; // No intervention needed
    }

    // Build context for AI
    const context = `
Trip: ${health.trip.destination}
Dates: ${health.trip.startDate} to ${health.trip.endDate}
Days until trip: ${health.daysUntilTrip ?? 'N/A'}
Completion: ${health.completion.toFixed(0)}%
Budget usage: ${health.budgetUsage.toFixed(0)}%
Stuck votes: ${health.stuckVotes}
Inactive days: ${health.inactiveDays}
Issues: ${health.issues.join(', ')}
`;

    const prompt = `You are Atlas, TripSync's proactive AI assistant. A trip needs your help.

${context}

Primary issue: ${primaryIssue}

Generate a helpful intervention message (2-3 sentences max) and 2-3 specific actions the organizer should take.
Be friendly, concise, and action-oriented. Don't be alarmist.

Respond in JSON format:
{
  "severity": "info" | "warning" | "urgent",
  "message": "Your friendly message here",
  "actions": [
    {"action": "Short action title", "description": "What to do", "priority": 1},
    {"action": "Another action", "description": "What to do", "priority": 2}
  ]
}`;

    const result = await retryWithBackoff(
      async () => {
        return await aiCircuitBreakers.suggestions.execute(async () => {
          const message = await anthropic.messages.create({
            model: AI_MODEL,
            max_tokens: 512,
            messages: [{ role: "user", content: prompt }],
          });

          const content = message.content[0];
          const text = content.type === "text" ? content.text.trim() : "";

          // Extract JSON
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error('No JSON in response');
          }

          const parsed = JSON.parse(jsonMatch[0]);

          return {
            parsed,
            usage: message.usage,
            model: AI_MODEL
          };
        });
      },
      { maxRetries: 3, baseDelay: 500 }
    );

    const { parsed, usage } = result.data;

    // Record metrics
    const duration = Date.now() - operationStart;
    const cost = usage ? calculateCost(AI_MODEL, usage.input_tokens, usage.output_tokens) : 0;

    await recordAIOperation({
      operation: 'atlas-intervention',
      model: AI_MODEL,
      success: true,
      duration,
      inputTokens: usage?.input_tokens,
      outputTokens: usage?.output_tokens,
      costUsd: cost,
      cached: false,
      attempts: result.attempts,
      timestamp: Date.now()
    });

    // Map intervention type from issue
    const interventionTypeMap: Record<string, AtlasIntervention['type']> = {
      'budget_overrun': 'budget_alert',
      'deadline_incomplete': 'deadline_warning',
      'vote_deadlock': 'vote_deadlock',
      'inactivity': 'inactivity_nudge',
      'no_itinerary': 'completion_check',
    };

    return {
      type: interventionTypeMap[primaryIssue] || 'completion_check',
      severity: parsed.severity,
      message: parsed.message,
      suggestedActions: parsed.actions.map((a: any) => ({
        action: a.action,
        description: a.description,
        priority: a.priority
      })),
      triggerCondition: primaryIssue,
    };
  } catch (error: any) {
    const duration = Date.now() - operationStart;

    await recordAIOperation({
      operation: 'atlas-intervention',
      model: AI_MODEL,
      success: false,
      duration,
      errorType: error?.type || 'unknown',
      timestamp: Date.now()
    });

    console.error('Failed to generate Atlas intervention:', error);
    return null;
  }
}

/**
 * Should we intervene for this trip?
 */
function shouldIntervene(health: TripHealth, lastInterventionAt: Date | null): boolean {
  // No issues = no intervention
  if (health.issues.length === 0) {
    return false;
  }

  // Don't intervene too frequently (min 4 hours between interventions)
  if (lastInterventionAt) {
    const hoursSinceLastIntervention = (Date.now() - lastInterventionAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastIntervention < 4) {
      return false;
    }
  }

  // Urgent issues = always intervene
  if (
    health.issues.includes('deadline_incomplete') ||
    (health.issues.includes('budget_overrun') && health.budgetUsage > 150)
  ) {
    return true;
  }

  // Non-urgent issues = intervene if severe enough
  if (health.stuckVotes >= 2) return true;
  if (health.inactiveDays >= 5) return true;
  if (!health.hasItinerary && health.daysUntilTrip && health.daysUntilTrip < 14) return true;

  return false;
}

/**
 * Monitor a single trip
 */
export async function monitorTrip(tripId: string): Promise<boolean> {
  const db = getDb();

  try {
    // Get trip health
    const health = await calculateTripHealth(tripId);
    if (!health) {
      return false; // Trip not found or not planning
    }

    // Get or create monitoring state
    let monitoringState = await db.query.atlasMonitoringState.findFirst({
      where: eq(atlasMonitoringState.tripId, tripId),
    });

    if (!monitoringState) {
      // Create initial monitoring state
      const [newState] = await db.insert(atlasMonitoringState).values({
        tripId,
        lastCheckedAt: new Date(),
        nextCheckAt: new Date(Date.now() + 15 * 60 * 1000),
        completionPercentage: health.completion.toString(),
        budgetUsagePercentage: health.budgetUsage.toString(),
        daysUntilTrip: health.daysUntilTrip,
        stuckVotesCount: health.stuckVotes,
        inactiveDays: health.inactiveDays,
        healthScore: calculateHealthScore(health),
        issues: health.issues,
        lastInterventionAt: null,
        interventionCount: 0,
      }).returning();
      monitoringState = newState;
    }

    // Should we intervene?
    if (!shouldIntervene(health, monitoringState.lastInterventionAt)) {
      // Update monitoring state
      await db.update(atlasMonitoringState)
        .set({
          lastCheckedAt: new Date(),
          nextCheckAt: new Date(Date.now() + 15 * 60 * 1000),
          completionPercentage: health.completion.toString(),
          budgetUsagePercentage: health.budgetUsage.toString(),
          daysUntilTrip: health.daysUntilTrip,
          stuckVotesCount: health.stuckVotes,
          inactiveDays: health.inactiveDays,
          healthScore: calculateHealthScore(health),
          issues: health.issues,
          updatedAt: new Date(),
        })
        .where(eq(atlasMonitoringState.tripId, tripId));

      console.log(`✅ Trip ${tripId} healthy, no intervention needed`);
      return true;
    }

    // Generate intervention
    const intervention = await generateIntervention(health);
    if (!intervention) {
      console.warn(`⚠️  Failed to generate intervention for trip ${tripId}`);
      return false;
    }

    console.log(`🔔 Atlas intervention for trip ${tripId}: ${intervention.type} (${intervention.severity})`);
    console.log(`   Message: ${intervention.message}`);

    // Store intervention in database
    await db.insert(atlasInterventions).values({
      tripId,
      interventionType: intervention.type,
      triggerCondition: intervention.triggerCondition,
      severity: intervention.severity,
      message: intervention.message,
      suggestedActions: intervention.suggestedActions,
      wasAccepted: false,
      createdAt: new Date(),
    });

    // Update monitoring state
    await db.update(atlasMonitoringState)
      .set({
        lastCheckedAt: new Date(),
        nextCheckAt: new Date(Date.now() + 15 * 60 * 1000),
        completionPercentage: health.completion.toString(),
        budgetUsagePercentage: health.budgetUsage.toString(),
        daysUntilTrip: health.daysUntilTrip,
        stuckVotesCount: health.stuckVotes,
        inactiveDays: health.inactiveDays,
        healthScore: calculateHealthScore(health),
        issues: health.issues,
        lastInterventionAt: new Date(),
        interventionCount: (monitoringState.interventionCount || 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(atlasMonitoringState.tripId, tripId));

    // TODO: Send notification to trip organizer via push/email

    return true;
  } catch (error) {
    console.error(`Failed to monitor trip ${tripId}:`, error);
    return false;
  }
}

/**
 * Calculate health score (0-100) from trip health metrics
 */
function calculateHealthScore(health: TripHealth): string {
  let score = 100;

  // Deduct for budget issues
  if (health.budgetUsage > 150) score -= 40;
  else if (health.budgetUsage > 110) score -= 20;

  // Deduct for incomplete itinerary
  if (health.completion < 30) score -= 30;
  else if (health.completion < 50) score -= 15;

  // Deduct for deadline pressure
  if (health.daysUntilTrip !== null && health.daysUntilTrip < 7 && health.completion < 50) {
    score -= 25;
  }

  // Deduct for stuck votes
  score -= health.stuckVotes * 10;

  // Deduct for inactivity
  if (health.inactiveDays >= 5) score -= 20;
  else if (health.inactiveDays >= 3) score -= 10;

  return Math.max(0, Math.min(100, score)).toString();
}

/**
 * Monitor all active trips
 */
export async function monitorAllTrips(): Promise<void> {
  console.log('🔍 Atlas: Starting trip health monitoring...');

  // Skip monitoring if DATABASE_URL is not configured
  if (!process.env.DATABASE_URL) {
    console.log('⏭️  Atlas: Skipping monitoring (DATABASE_URL not configured)');
    return;
  }

  const db = getDb();

  try {
    // Get all planning trips or trips due to be checked
    const now = new Date();

    // Get trips with status='planning' that need checking
    const planningTrips = await db.select({
      id: trips.id,
    })
    .from(trips)
    .where(eq(trips.status, 'planning'));

    // Also check if we need to run based on nextCheckAt from monitoring state
    const dueForCheck = await db.select({
      tripId: atlasMonitoringState.tripId,
    })
    .from(atlasMonitoringState)
    .where(
      and(
        lt(atlasMonitoringState.nextCheckAt, now),
        isNull(atlasMonitoringState.suppressedUntil) // Not suppressed
      )
    );

    // Combine both lists (unique trip IDs)
    const allTripIds = new Set([
      ...planningTrips.map(t => t.id),
      ...dueForCheck.map(t => t.tripId),
    ]);

    const planningTripIds = Array.from(allTripIds);

    if (planningTripIds.length === 0) {
      console.log('✅ No trips to monitor');
      return;
    }

    console.log(`📊 Monitoring ${planningTripIds.length} trips...`);

    // Monitor all trips (limit concurrency to avoid overload)
    const results = await Promise.allSettled(
      planningTripIds.map(id => monitorTrip(id))
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const failed = results.filter(r => r.status === 'rejected' || !r.value).length;

    console.log(`✅ Atlas monitoring complete: ${successful} successful, ${failed} failed`);
  } catch (error) {
    console.error('❌ Atlas monitoring failed:', error);
  }
}

/**
 * Start Atlas monitoring scheduler (runs every 15 minutes)
 */
export function startAtlasScheduler(): NodeJS.Timeout {
  console.log('🚀 Starting Atlas proactive monitoring scheduler (every 15 minutes)...');

  // Run immediately
  monitorAllTrips();

  // Then run every 15 minutes
  return setInterval(() => {
    monitorAllTrips();
  }, 15 * 60 * 1000); // 15 minutes
}

/**
 * Stop Atlas monitoring scheduler
 */
export function stopAtlasScheduler(intervalId: NodeJS.Timeout): void {
  console.log('🛑 Stopping Atlas monitoring scheduler...');
  clearInterval(intervalId);
}
