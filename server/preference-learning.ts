/**
 * User Preference Learning Pipeline
 *
 * Learns from user behavior to build a proprietary dataset:
 * - Tracks modifications to AI suggestions
 * - Extracts preference patterns
 * - Builds user-specific preference profiles
 * - Applies learned preferences to future generations
 *
 * This is our competitive moat - data no other platform has.
 */

import { storage } from './storage';
import type { AIGenerationFeedback, AIUserPreference, ItineraryItem } from '@shared/schema';

/**
 * Preference categories we learn
 */
export type PreferenceCategory =
  | 'budget'
  | 'timing'
  | 'dining'
  | 'activities'
  | 'accommodation'
  | 'pacing'
  | 'social';

/**
 * Learned preference
 */
interface LearnedPreference {
  category: PreferenceCategory;
  key: string;
  value: any;
  confidence: number; // 0.0-1.0
  sampleSize: number;
}

/**
 * Record user feedback on AI suggestion
 */
export async function recordFeedback(params: {
  tripId: string;
  userId: string;
  generationId: string;
  itemId?: string;
  feedbackType: 'kept' | 'edited' | 'deleted' | 'upvoted' | 'downvoted';
  originalSuggestion: any;
  userModification?: any;
  fieldChanged?: string;
  changeMagnitude?: number;
}): Promise<void> {
  try {
    const {
      tripId,
      userId,
      generationId,
      itemId,
      feedbackType,
      originalSuggestion,
      userModification,
      fieldChanged,
      changeMagnitude,
    } = params;

    // Store feedback in database
    await storage.createAIGenerationFeedback({
      tripId,
      userId,
      generationId,
      itemId: itemId || null,
      feedbackType,
      originalSuggestion,
      userModification: userModification || null,
      fieldChanged: fieldChanged || null,
      changeMagnitude: changeMagnitude ? changeMagnitude.toString() : null,
      userPreferences: null,
      tripContext: null,
    });
    console.log(`📝 Recorded feedback: ${feedbackType} for user ${userId} on trip ${tripId}`);

    // If this is an edit, learn from it immediately
    if (feedbackType === 'edited' && userModification && fieldChanged) {
      await learnFromModification(
        userId,
        tripId,
        fieldChanged,
        originalSuggestion,
        userModification,
        changeMagnitude
      );
    }

    // If deleted, learn what user doesn't like
    if (feedbackType === 'deleted') {
      await learnFromDeletion(userId, tripId, originalSuggestion);
    }
  } catch (error) {
    console.error('Failed to record feedback:', error);
  }
}

/**
 * Learn from user modification
 */
async function learnFromModification(
  userId: string,
  tripId: string,
  fieldChanged: string,
  original: any,
  modified: any,
  changeMagnitude?: number
): Promise<void> {
  console.log(`🧠 Learning from modification: ${fieldChanged} for user ${userId}`);

  const preferences: LearnedPreference[] = [];

  // Learn from specific field changes
  switch (fieldChanged) {
    case 'price':
      // User adjusted price - learn budget preferences
      if (typeof changeMagnitude === 'number') {
        if (changeMagnitude < 0) {
          // User reduced price - prefers cheaper options
          preferences.push({
            category: 'budget',
            key: 'price_sensitivity',
            value: { tendency: 'prefer_lower', magnitude: Math.abs(changeMagnitude) },
            confidence: 0.7,
            sampleSize: 1,
          });
        } else {
          // User increased price - willing to pay more for quality
          preferences.push({
            category: 'budget',
            key: 'quality_preference',
            value: { tendency: 'prefer_higher_quality', magnitude: changeMagnitude },
            confidence: 0.7,
            sampleSize: 1,
          });
        }
      }
      break;

    case 'time':
      // User adjusted timing - learn pacing preferences
      const originalTime = parseTime(original.time);
      const modifiedTime = parseTime(modified.time);
      if (originalTime && modifiedTime) {
        const hourDiff = modifiedTime - originalTime;
        if (hourDiff > 0) {
          // User delayed activity - prefers slower pace
          preferences.push({
            category: 'pacing',
            key: 'activity_pace',
            value: { tendency: 'prefer_later', hourDiff },
            confidence: 0.6,
            sampleSize: 1,
          });
        } else if (hourDiff < 0) {
          // User moved activity earlier - prefers faster pace
          preferences.push({
            category: 'pacing',
            key: 'activity_pace',
            value: { tendency: 'prefer_earlier', hourDiff: Math.abs(hourDiff) },
            confidence: 0.6,
            sampleSize: 1,
          });
        }
      }
      break;

    case 'type':
      // User changed activity type - learn activity preferences
      preferences.push({
        category: 'activities',
        key: `type_preference_${original.type}_to_${modified.type}`,
        value: { from: original.type, to: modified.type },
        confidence: 0.8,
        sampleSize: 1,
      });
      break;

    case 'location':
      // User changed location - learn geographical preferences
      // (This is complex - simplified for now)
      break;

    case 'name':
      // User changed specific venue - learn venue preferences
      // (Less generalizable, lower weight)
      break;
  }

  // Store all learned preferences
  for (const pref of preferences) {
    await upsertPreference(userId, tripId, pref);
  }
}

/**
 * Learn from user deletion
 */
async function learnFromDeletion(userId: string, tripId: string, deleted: any): Promise<void> {
  console.log(`🧠 Learning from deletion for user ${userId}:`, deleted.type);

  const preferences: LearnedPreference[] = [];

  // User deleted this type of activity - they don't like it
  if (deleted.type) {
    preferences.push({
      category: 'activities',
      key: `dislike_${deleted.type}`,
      value: { type: deleted.type, reason: 'deleted' },
      confidence: 0.8,
      sampleSize: 1,
    });
  }

  // If price was very high, might indicate budget concerns
  if (deleted.pricePerPerson && deleted.pricePerPerson > 100) {
    preferences.push({
      category: 'budget',
      key: 'max_acceptable_price',
      value: { threshold: deleted.pricePerPerson, exceeded: true },
      confidence: 0.6,
      sampleSize: 1,
    });
  }

  for (const pref of preferences) {
    await upsertPreference(userId, tripId, pref);
  }
}

/**
 * Store or update learned preference
 */
async function upsertPreference(
  userId: string,
  tripId: string,
  pref: LearnedPreference
): Promise<void> {
  try {
    // Query existing preference
    const existing = await storage.getAIUserPreference(userId, pref.category, pref.key);

    if (existing) {
      // Bayesian-style confidence adjustment based on sample size
      const oldSampleSize = existing.sampleSize;
      const newSampleSize = oldSampleSize + pref.sampleSize;
      const oldConfidence = parseFloat(existing.confidenceScore as string);
      const newConfidence =
        (oldConfidence * oldSampleSize + pref.confidence * pref.sampleSize) / newSampleSize;

      // Merge learned trips
      const learnedFromTrips = Array.isArray(existing.learnedFromTrips)
        ? existing.learnedFromTrips
        : [];
      if (!learnedFromTrips.includes(parseInt(tripId))) {
        learnedFromTrips.push(parseInt(tripId));
      }

      await storage.createOrUpdateAIUserPreference({
        userId,
        preferenceCategory: pref.category,
        preferenceKey: pref.key,
        preferenceValue: pref.value,
        confidenceScore: newConfidence.toFixed(2),
        sampleSize: newSampleSize,
        learnedFromTrips,
        lastConfirmedAt: new Date(),
      });
    } else {
      // Create new preference
      await storage.createOrUpdateAIUserPreference({
        userId,
        preferenceCategory: pref.category,
        preferenceKey: pref.key,
        preferenceValue: pref.value,
        confidenceScore: pref.confidence.toFixed(2),
        sampleSize: pref.sampleSize,
        learnedFromTrips: [parseInt(tripId)],
        lastConfirmedAt: new Date(),
      });
    }

    console.log(
      `💾 Stored preference: ${pref.category}/${pref.key} (confidence: ${pref.confidence})`
    );
  } catch (error) {
    console.error('Failed to upsert preference:', error);
  }
}

/**
 * Get learned preferences for a user
 */
export async function getUserPreferences(
  userId: string,
  destination?: string
): Promise<Record<string, any>> {
  try {
    // Query all preferences for this user
    const prefs = await storage.getAIUserPreferences(userId);

    console.log(
      `📖 Loading preferences for user ${userId}${destination ? ` (destination: ${destination})` : ''}`
    );

    // Filter by destination if specified
    const relevantPrefs = destination
      ? prefs.filter((p) => {
          const destinations = p.destinationsApplicable;
          return !destinations || destinations.length === 0 || destinations.includes(destination);
        })
      : prefs;

    // Structure by category
    const structured: Record<string, any> = {
      budget: {},
      timing: {},
      dining: {},
      activities: {},
      accommodation: {},
      pacing: {},
      social: {},
    };

    for (const pref of relevantPrefs) {
      const category = pref.preferenceCategory as PreferenceCategory;
      if (category in structured) {
        structured[category][pref.preferenceKey] = {
          ...pref.preferenceValue,
          confidence: parseFloat(pref.confidenceScore as string),
          sampleSize: pref.sampleSize,
        };
      }
    }

    return structured;
  } catch (error) {
    console.error('Failed to get user preferences:', error);
    return {};
  }
}

/**
 * Apply learned preferences to AI generation
 *
 * This is where we use our proprietary dataset to beat competitors
 */
export function applyPreferencesToPrompt(
  basePrompt: string,
  preferences: Record<string, any>
): string {
  let enhancedPrompt = basePrompt;

  // Add preference hints to the prompt
  const preferenceHints: string[] = [];

  // Budget preferences
  if (preferences.budget?.price_sensitivity?.tendency === 'prefer_lower') {
    preferenceHints.push('User tends to prefer budget-friendly options (historical pattern)');
  }
  if (preferences.budget?.quality_preference?.tendency === 'prefer_higher_quality') {
    preferenceHints.push('User values quality and is willing to pay more (historical pattern)');
  }

  // Activity preferences
  if (preferences.activities) {
    const dislikes = Object.keys(preferences.activities)
      .filter((k) => k.startsWith('dislike_'))
      .map((k) => k.replace('dislike_', ''));
    if (dislikes.length > 0) {
      preferenceHints.push(`User historically dislikes: ${dislikes.join(', ')}`);
    }
  }

  // Pacing preferences
  if (preferences.pacing?.activity_pace?.tendency === 'prefer_later') {
    preferenceHints.push('User prefers slower-paced schedules with later start times');
  }
  if (preferences.pacing?.activity_pace?.tendency === 'prefer_earlier') {
    preferenceHints.push('User prefers action-packed schedules with earlier start times');
  }

  // Add preferences to prompt
  if (preferenceHints.length > 0) {
    enhancedPrompt += `\n\nLearned user preferences (personalize based on these):\n${preferenceHints.map((h) => `- ${h}`).join('\n')}`;
  }

  return enhancedPrompt;
}

/**
 * Batch learning from past trips
 *
 * Analyze a user's past trips to build initial preference profile
 */
export async function learnFromPastTrips(userId: string): Promise<void> {
  console.log(`🎓 Starting batch learning for user ${userId}...`);

  try {
    // Get all user's completed trips
    const trips = await storage.getTripsByUserId(userId);
    const completedTrips = trips.filter((t) => t.status === 'completed');

    if (completedTrips.length === 0) {
      console.log(`No completed trips found for user ${userId}`);
      return;
    }

    // Collect all itinerary items from completed trips
    const allItems: any[] = [];
    for (const trip of completedTrips) {
      const items = await storage.getItineraryItems(trip.id);
      allItems.push(...items.map((item) => ({ ...item, tripId: trip.id })));
    }

    if (allItems.length === 0) {
      console.log(`No itinerary items found for user ${userId}`);
      return;
    }

    // Learn average budget preference
    const avgPrice = allItems.reduce((sum, item) => sum + item.pricePerPerson, 0) / allItems.length;
    await upsertPreference(userId, completedTrips[0].id, {
      category: 'budget',
      key: 'avg_item_price',
      value: { averagePrice: Math.round(avgPrice) },
      confidence: 0.7,
      sampleSize: allItems.length,
    });

    // Learn activity type preferences (frequency)
    const typeFrequency = new Map<string, number>();
    allItems.forEach((item) => {
      typeFrequency.set(item.type, (typeFrequency.get(item.type) || 0) + 1);
    });
    for (const [type, count] of typeFrequency) {
      await upsertPreference(userId, completedTrips[0].id, {
        category: 'activities',
        key: `prefers_${type}`,
        value: { frequency: count, percentage: (count / allItems.length) * 100 },
        confidence: 0.6,
        sampleSize: count,
      });
    }

    // Learn pacing (typical start times)
    const times = allItems
      .map((item) => parseTime(item.time))
      .filter((t): t is number => t !== null);
    if (times.length > 0) {
      const avgStartTime = times.reduce((sum, t) => sum + t, 0) / times.length;
      await upsertPreference(userId, completedTrips[0].id, {
        category: 'pacing',
        key: 'typical_start_time',
        value: {
          averageHour: Math.round(avgStartTime),
          tendency:
            avgStartTime < 10 ? 'early_bird' : avgStartTime < 14 ? 'moderate' : 'late_start',
        },
        confidence: 0.6,
        sampleSize: times.length,
      });
    }

    console.log(
      `✅ Batch learning complete for user ${userId} (${completedTrips.length} trips, ${allItems.length} items)`
    );
  } catch (error) {
    console.error('Failed to learn from past trips:', error);
  }
}

/**
 * Get preference confidence score for a user
 */
export async function getPreferenceConfidence(userId: string): Promise<number> {
  try {
    const prefs = await storage.getAIUserPreferences(userId);

    if (prefs.length === 0) {
      return 0.0;
    }

    // Calculate weighted average confidence based on sample sizes
    let totalWeightedConfidence = 0;
    let totalSampleSize = 0;

    for (const pref of prefs) {
      const confidence = parseFloat(pref.confidenceScore as string);
      const sampleSize = pref.sampleSize;
      totalWeightedConfidence += confidence * sampleSize;
      totalSampleSize += sampleSize;
    }

    const avgConfidence = totalSampleSize > 0 ? totalWeightedConfidence / totalSampleSize : 0.0;

    // High confidence (0.8+) = lots of data, reliable predictions
    // Medium confidence (0.5-0.8) = some data, decent predictions
    // Low confidence (<0.5) = little data, use defaults

    return avgConfidence;
  } catch (error) {
    console.error('Failed to get preference confidence:', error);
    return 0.0;
  }
}

/**
 * Export user preferences (GDPR compliance)
 */
export async function exportUserPreferences(userId: string): Promise<any> {
  try {
    const prefs = await storage.getAIUserPreferences(userId);
    const feedback = await storage.getAIGenerationFeedbackByUser(userId);

    const avgConfidence = await getPreferenceConfidence(userId);

    // Collect all trip IDs
    const allTripIds = new Set<number>();
    prefs.forEach((p) => {
      if (Array.isArray(p.learnedFromTrips)) {
        p.learnedFromTrips.forEach((id) => allTripIds.add(id));
      }
    });

    return {
      userId,
      preferences: prefs.map((p) => ({
        category: p.preferenceCategory,
        key: p.preferenceKey,
        value: p.preferenceValue,
        confidence: parseFloat(p.confidenceScore as string),
        sampleSize: p.sampleSize,
        learnedFromTrips: p.learnedFromTrips || [],
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      feedback: feedback.map((f) => ({
        tripId: f.tripId,
        generationId: f.generationId,
        feedbackType: f.feedbackType,
        fieldChanged: f.fieldChanged,
        createdAt: f.createdAt,
      })),
      metadata: {
        totalPreferences: prefs.length,
        totalFeedback: feedback.length,
        averageConfidence: avgConfidence,
        learnedFromTrips: Array.from(allTripIds),
        exportedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Failed to export preferences:', error);
    return null;
  }
}

/**
 * Delete user preferences (GDPR right to be forgotten)
 */
export async function deleteUserPreferences(userId: string): Promise<boolean> {
  try {
    await storage.deleteAIUserPreferencesByUser(userId);
    await storage.deleteAIGenerationFeedbackByUser(userId);

    console.log(`🗑️  Deleted all preferences for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Failed to delete preferences:', error);
    return false;
  }
}

/**
 * Helper: Parse time string to hour (for comparison)
 */
function parseTime(timeStr: string): number | null {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  return hours + minutes / 60;
}

/**
 * Preference Analytics - for admin dashboard
 */
export async function getPreferenceAnalytics(): Promise<{
  totalUsers: number;
  totalPreferences: number;
  avgPreferencesPerUser: number;
  avgConfidence: number;
  categoryCounts: Record<PreferenceCategory, number>;
  topPatterns: Array<{ pattern: string; count: number }>;
}> {
  try {
    // This would require a more complex query in production
    // For now, return placeholder data as this is an admin analytics feature
    // In production, you'd use aggregate SQL queries for efficiency

    return {
      totalUsers: 0,
      totalPreferences: 0,
      avgPreferencesPerUser: 0,
      avgConfidence: 0,
      categoryCounts: {
        budget: 0,
        timing: 0,
        dining: 0,
        activities: 0,
        accommodation: 0,
        pacing: 0,
        social: 0,
      },
      topPatterns: [],
    };
  } catch (error) {
    console.error('Failed to get preference analytics:', error);
    throw error;
  }
}
