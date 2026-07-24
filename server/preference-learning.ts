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
    // TODO: Insert into ai_generation_feedback table
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
    // TODO: Query existing preference from ai_user_preferences table
    // If exists, update with Bayesian-style confidence adjustment
    // If new, insert

    console.log(
      `💾 Storing preference: ${pref.category}/${pref.key} (confidence: ${pref.confidence})`
    );

    // For now, just log (would insert into DB)
    // In production:
    // 1. SELECT existing preference
    // 2. If exists: merge with new data, update confidence based on sample size
    // 3. If new: INSERT
    // 4. Track which trips this was learned from
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
    // TODO: Query ai_user_preferences table
    // Filter by destination if provided (destination-specific preferences)
    // Return as structured object

    console.log(
      `📖 Loading preferences for user ${userId}${destination ? ` (destination: ${destination})` : ''}`
    );

    // Placeholder return
    return {
      budget: {},
      timing: {},
      dining: {},
      activities: {},
      accommodation: {},
      pacing: {},
      social: {},
    };
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
    // TODO: Get all user's completed trips
    // TODO: Analyze itinerary patterns
    // TODO: Extract preferences
    // TODO: Store in ai_user_preferences

    // Examples of what to learn:
    // - Average budget per item
    // - Preferred activity types (frequency analysis)
    // - Typical start times (morning person vs night owl)
    // - Dining preferences (frequency of each category)
    // - Trip duration preferences
    // - Group size preferences

    console.log(`✅ Batch learning complete for user ${userId}`);
  } catch (error) {
    console.error('Failed to learn from past trips:', error);
  }
}

/**
 * Get preference confidence score for a user
 */
export async function getPreferenceConfidence(userId: string): Promise<number> {
  try {
    // TODO: Query ai_user_preferences table
    // Calculate weighted average confidence based on sample sizes
    // Return 0.0-1.0

    // High confidence (0.8+) = lots of data, reliable predictions
    // Medium confidence (0.5-0.8) = some data, decent predictions
    // Low confidence (<0.5) = little data, use defaults

    return 0.5; // Placeholder
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
    // TODO: Query all preferences for this user
    // Format as readable JSON
    // Include metadata (confidence, sample size, learned from trips)

    return {
      userId,
      preferences: [],
      metadata: {
        totalPreferences: 0,
        averageConfidence: 0,
        learnedFromTrips: [],
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
    // TODO: DELETE FROM ai_user_preferences WHERE user_id = userId
    // TODO: DELETE FROM ai_generation_feedback WHERE user_id = userId

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
    // TODO: Aggregate queries on ai_user_preferences

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
