import { getDb } from './db';
import { appLogger } from './logger';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

/**
 * Database Transaction Utilities
 * Provides atomic operations for complex multi-step database operations
 */

export type TransactionCallback<T> = (tx: NodePgDatabase<Record<string, never>>) => Promise<T>;

/**
 * Execute a function within a database transaction
 * Automatically commits on success, rolls back on error
 *
 * @example
 * ```typescript
 * const result = await withTransaction(async (tx) => {
 *   // All operations in this block are atomic
 *   await tx.insert(trips).values(tripData);
 *   await tx.insert(tripMembers).values(memberData);
 *   return tripData.id;
 * });
 * ```
 */
export async function withTransaction<T>(callback: TransactionCallback<T>): Promise<T> {
  const db = getDb();

  try {
    return await db.transaction(async (tx) => {
      appLogger.debug('Transaction started');
      const result = await callback(tx as any);
      appLogger.debug('Transaction committed');
      return result;
    });
  } catch (error) {
    appLogger.error(
      error instanceof Error ? error : new Error(String(error)),
      { context: 'transaction_rollback' }
    );
    throw error; // Re-throw after logging
  }
}

/**
 * Example transaction patterns for common operations
 */

/**
 * Create a trip with members atomically
 */
export async function createTripWithMembers(
  tripData: any,
  memberData: any[]
): Promise<string> {
  return withTransaction(async (tx) => {
    // Import tables inside transaction to avoid circular dependencies
    const { trips, tripMembers } = await import('../shared/schema');

    // Insert trip
    await tx.insert(trips).values(tripData);

    // Insert all members
    if (memberData.length > 0) {
      await tx.insert(tripMembers).values(memberData);
    }

    return tripData.id;
  });
}

/**
 * Transfer money between expense accounts atomically
 * (Example for future expense settlement feature)
 */
export async function settleExpenses(
  transactions: Array<{ from: string; to: string; amount: number }>
): Promise<void> {
  return withTransaction(async (tx) => {
    // All transfers happen atomically
    // Either all succeed or all fail
    for (const transaction of transactions) {
      // Implementation would update expense_settlements table
      appLogger.debug('Processing expense settlement', transaction);
    }
  });
}

/**
 * Delete trip and all related data atomically
 */
export async function deleteTripCascade(tripId: string): Promise<void> {
  return withTransaction(async (tx) => {
    const {
      trips,
      tripMembers,
      itineraryItems,
      expenses,
      polls,
      chatMessages,
      memberPreferences,
      votes,
      tripPhotos,
      tripDocuments,
      emergencyContacts,
      moodBoardItems,
      atlasConversations,
      subscriptions,
    } = await import('../shared/schema');

    const { eq } = await import('drizzle-orm');

    // Delete in order to respect foreign key constraints
    // (or rely on ON DELETE CASCADE if configured)

    appLogger.debug('Deleting trip cascade', { tripId });

    // Delete all related records
    await tx.delete(atlasConversations).where(eq(atlasConversations.tripId, tripId));
    // Note: votes are related to itinerary items, not trips directly
    // They will be cascade deleted when itinerary items are deleted
    await tx.delete(chatMessages).where(eq(chatMessages.tripId, tripId));
    await tx.delete(polls).where(eq(polls.tripId, tripId));
    await tx.delete(expenses).where(eq(expenses.tripId, tripId));
    await tx.delete(itineraryItems).where(eq(itineraryItems.tripId, tripId));
    await tx.delete(memberPreferences).where(eq(memberPreferences.tripId, tripId));
    await tx.delete(tripPhotos).where(eq(tripPhotos.tripId, tripId));
    await tx.delete(tripDocuments).where(eq(tripDocuments.tripId, tripId));
    await tx.delete(emergencyContacts).where(eq(emergencyContacts.tripId, tripId));
    await tx.delete(moodBoardItems).where(eq(moodBoardItems.tripId, tripId));
    await tx.delete(tripMembers).where(eq(tripMembers.tripId, tripId));

    // Finally delete the trip itself
    await tx.delete(trips).where(eq(trips.id, tripId));

    appLogger.debug('Trip cascade delete completed', { tripId });
  });
}

/**
 * Update user subscription and related data atomically
 */
export async function updateUserSubscription(
  userId: string,
  subscriptionData: any,
  userData: any
): Promise<void> {
  return withTransaction(async (tx) => {
    const { users, subscriptions } = await import('../shared/schema');
    const { eq } = await import('drizzle-orm');

    // Update user's subscription tier and expiration
    await tx
      .update(users)
      .set({
        subscriptionTier: userData.subscriptionTier,
        subscriptionExpiresAt: userData.subscriptionExpiresAt,
        stripeCustomerId: userData.stripeCustomerId,
      })
      .where(eq(users.id, userId));

    // Insert or update subscription record
    if (subscriptionData.id) {
      // Update existing subscription
      await tx
        .update(subscriptions)
        .set(subscriptionData)
        .where(eq(subscriptions.id, subscriptionData.id));
    } else {
      // Insert new subscription
      await tx.insert(subscriptions).values(subscriptionData);
    }

    appLogger.debug('User subscription updated', { userId, tier: userData.subscriptionTier });
  });
}

/**
 * Create itinerary item with votes atomically
 */
export async function createItineraryItemWithVotes(
  itemData: any,
  initialVotes: any[]
): Promise<string> {
  return withTransaction(async (tx) => {
    const { itineraryItems, votes } = await import('../shared/schema');

    // Insert itinerary item
    await tx.insert(itineraryItems).values(itemData);

    // Insert initial votes if any
    if (initialVotes.length > 0) {
      await tx.insert(votes).values(initialVotes);
    }

    return itemData.id;
  });
}

/**
 * Move expense to different trip atomically
 * (Example for future expense transfer feature)
 */
export async function moveExpenseToTrip(
  expenseId: string,
  fromTripId: string,
  toTripId: string
): Promise<void> {
  return withTransaction(async (tx) => {
    const { expenses } = await import('../shared/schema');
    const { eq } = await import('drizzle-orm');

    // Update expense trip
    await tx
      .update(expenses)
      .set({ tripId: toTripId })
      .where(eq(expenses.id, expenseId));

    // Note: expenseShares table doesn't exist yet
    // Uncomment this when expenseShares table is added:
    // await tx
    //   .update(expenseShares)
    //   .set({ tripId: toTripId })
    //   .where(eq(expenseShares.expenseId, expenseId));

    appLogger.debug('Expense moved to different trip', {
      expenseId,
      fromTripId,
      toTripId,
    });
  });
}

/**
 * Bulk update operation with transaction
 */
export async function bulkUpdateItems<T>(
  updates: Array<{ id: string; data: Partial<T> }>,
  table: any,
  updateFn: (tx: any, id: string, data: Partial<T>) => Promise<void>
): Promise<void> {
  return withTransaction(async (tx) => {
    for (const { id, data } of updates) {
      await updateFn(tx, id, data);
    }
    appLogger.debug('Bulk update completed', { count: updates.length });
  });
}
