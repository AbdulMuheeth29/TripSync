import { appLogger } from './logger';
import { storage } from './storage';
import { suggestBudgetOptimization, suggestConflictResolution } from './ai-service';

/**
 * Atlas Proactive System
 *
 * Monitors trips and triggers proactive alerts for:
 * - Budget overruns (>110% of budget)
 * - Vote deadlocks (tied votes >24 hours)
 * - Deadline urgency (trip starting <7 days, <50% complete)
 *
 * Background job runs every 15 minutes to check all active trips.
 */

// In-memory storage for notifications (will be migrated to database)
interface AtlasNotification {
  id: string;
  tripId: string;
  userId?: string | null; // null = show to all trip members
  type: 'budget_overrun' | 'vote_deadlock' | 'deadline_urgency';
  title: string;
  message: string;
  actions: Array<{ label: string; action: string; meta?: any }>;
  status: 'unread' | 'read' | 'dismissed' | 'snoozed';
  snoozedUntil?: Date | null;
  metadata?: any;
  createdAt: Date;
}

class AtlasProactiveService {
  private notifications: Map<string, AtlasNotification> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private lastCheckTime: Map<string, Date> = new Map(); // Track when we last checked each trip

  /**
   * Start background monitoring (runs every 15 minutes)
   */
  startMonitoring() {
    if (this.monitoringInterval) {
      appLogger.warn('Atlas monitoring already running');
      return;
    }

    appLogger.debug('Starting Atlas proactive monitoring');

    // Run immediately on startup
    this.checkAllTrips().catch((error) => {
      appLogger.error(error instanceof Error ? error : new Error(String(error)), {
        context: 'atlas_initial_check',
      });
    });

    // Then run every 15 minutes
    this.monitoringInterval = setInterval(
      async () => {
        try {
          await this.checkAllTrips();
        } catch (error) {
          appLogger.error(error instanceof Error ? error : new Error(String(error)), {
            context: 'atlas_monitoring',
          });
        }
      },
      15 * 60 * 1000
    ); // 15 minutes
  }

  /**
   * Stop background monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      appLogger.debug('Atlas proactive monitoring stopped');
    }
  }

  /**
   * Check all active trips for proactive triggers
   */
  private async checkAllTrips() {
    const startTime = Date.now();

    try {
      // Note: getTrips() method doesn't exist in IStorage interface
      // This proactive checking would need to be triggered per-trip instead of globally
      // For now, return early to avoid errors
      appLogger.warn('Atlas proactive check skipped - requires per-trip triggering');
      return;

      // Original code commented out (unreachable):
      // const allTrips = await storage.getTrips?.() || [];
      // const activeTrips = allTrips.filter(
      //   (trip: any) => trip.status === 'planning' || trip.status === 'active'
      // );
      // appLogger.debug('Atlas checking trips', { count: activeTrips.length });
      // for (const trip of activeTrips) {
      //   await this.checkTrip(trip.id);
      // }
      // const duration = Date.now() - startTime;
      // appLogger.debug('Atlas check complete', { trips: activeTrips.length, duration });
    } catch (error) {
      appLogger.error(error instanceof Error ? error : new Error(String(error)), {
        context: 'atlas_check_all_trips',
      });
    }
  }

  /**
   * Check a single trip for all proactive triggers
   */
  private async checkTrip(tripId: string) {
    try {
      // Check each trigger
      await this.checkBudgetOverrun(tripId);
      await this.checkVoteDeadlocks(tripId);
      await this.checkDeadlineUrgency(tripId);

      this.lastCheckTime.set(tripId, new Date());
    } catch (error) {
      appLogger.error(error instanceof Error ? error : new Error(String(error)), {
        context: 'atlas_check_trip',
        tripId,
      });
    }
  }

  /**
   * Trigger 1: Budget Overrun Alert
   * Fires when total expenses exceed 110% of trip budget
   */
  private async checkBudgetOverrun(tripId: string) {
    try {
      const trip = await storage.getTrip(tripId);
      if (!trip || !trip.budgetPerPerson) return;

      const expenses = await storage.getExpensesByTrip(tripId);
      const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      const totalBudget = trip.budgetPerPerson * trip.groupSize;

      const budgetPercentage = (totalExpenses / totalBudget) * 100;

      // Only alert if over 110% and no recent notification
      if (budgetPercentage > 110) {
        const existingNotification = this.findRecentNotification(
          tripId,
          'budget_overrun',
          24 * 60 * 60 * 1000 // 24 hours
        );

        if (!existingNotification) {
          const overAmount = totalExpenses - totalBudget;

          await this.createNotification({
            tripId,
            type: 'budget_overrun',
            title: '💰 Budget Alert',
            message: `Your trip is $${overAmount.toFixed(2)} over budget (${budgetPercentage.toFixed(0)}% of planned budget).\n\nTotal spent: $${totalExpenses.toFixed(2)} / $${totalBudget.toFixed(2)}`,
            actions: [
              {
                label: 'Optimize Budget',
                action: 'optimize_budget',
                meta: { tripId },
              },
              {
                label: 'Dismiss',
                action: 'dismiss',
              },
            ],
            metadata: {
              totalExpenses,
              totalBudget,
              overAmount,
              budgetPercentage,
            },
          });

          appLogger.debug('Budget overrun alert created', { tripId, overAmount, budgetPercentage });
        }
      }
    } catch (error) {
      appLogger.error(error instanceof Error ? error : new Error(String(error)), {
        context: 'atlas_check_budget_overrun',
        tripId,
      });
    }
  }

  /**
   * Trigger 2: Vote Deadlock Detection
   * Fires when itinerary items or polls have tied votes for >24 hours
   */
  private async checkVoteDeadlocks(tripId: string) {
    try {
      const items = await storage.getItineraryItems(tripId);
      const now = Date.now();

      for (const item of items) {
        const votes = await storage.getVotesByItem(item.id);

        // Count upvotes and downvotes
        const upvotes = votes.filter((v) => v.voteType === 'upvote').length;
        const downvotes = votes.filter((v) => v.voteType === 'downvote').length;

        // Check if deadlocked (tied or controversial)
        const isDeadlocked = upvotes === downvotes && votes.length >= 4; // At least 4 votes to be meaningful
        const isControversial = Math.abs(upvotes - downvotes) <= 1 && votes.length >= 6; // Close split

        if (isDeadlocked || isControversial) {
          // Check if deadlock has persisted for >24 hours
          const itemAge = now - new Date(item.createdAt || now).getTime();

          if (itemAge > 24 * 60 * 60 * 1000) {
            const existingNotification = this.findRecentNotification(
              tripId,
              'vote_deadlock',
              24 * 60 * 60 * 1000, // 24 hours
              item.id
            );

            if (!existingNotification) {
              const daysStuck = Math.floor(itemAge / (24 * 60 * 60 * 1000));

              await this.createNotification({
                tripId,
                type: 'vote_deadlock',
                title: '🗳️ Vote Deadlock',
                message: `Your group has been stuck on "${item.name}" for ${daysStuck} day${daysStuck > 1 ? 's' : ''}. Votes are ${isDeadlocked ? 'tied' : 'split'} (${upvotes} 👍 vs ${downvotes} 👎).\n\nI can suggest a fair compromise - want me to help?`,
                actions: [
                  {
                    label: 'Suggest Compromise',
                    action: 'resolve_conflict',
                    meta: { itemId: item.id, tripId },
                  },
                  {
                    label: 'Let Group Decide',
                    action: 'dismiss',
                  },
                ],
                metadata: {
                  itemId: item.id,
                  itemName: item.name,
                  upvotes,
                  downvotes,
                  daysStuck,
                },
              });

              appLogger.debug('Vote deadlock alert created', {
                tripId,
                itemId: item.id,
                upvotes,
                downvotes,
                daysStuck,
              });
            }
          }
        }
      }
    } catch (error) {
      appLogger.error(error instanceof Error ? error : new Error(String(error)), {
        context: 'atlas_check_vote_deadlocks',
        tripId,
      });
    }
  }

  /**
   * Trigger 3: Deadline Urgency Alert
   * Fires when trip starts <7 days and <50% complete
   */
  private async checkDeadlineUrgency(tripId: string) {
    try {
      const trip = await storage.getTrip(tripId);
      if (!trip || !trip.startDate) return;

      const now = Date.now();
      const startDate = new Date(trip.startDate).getTime();
      const daysUntilStart = Math.floor((startDate - now) / (24 * 60 * 60 * 1000));

      // Only alert if trip starts in <7 days
      if (daysUntilStart > 7 || daysUntilStart < 0) return;

      // Calculate completion percentage
      const items = await storage.getItineraryItems(tripId);
      const members = await storage.getTripMembers(tripId);
      const expenses = await storage.getExpensesByTrip(tripId);

      const totalDays = Math.ceil(
        (new Date(trip.endDate!).getTime() - new Date(trip.startDate).getTime()) /
          (24 * 60 * 60 * 1000)
      );

      // Rough completion estimate:
      // - 40% weight on itinerary items per day
      // - 30% weight on member confirmations
      // - 30% weight on budget planning (expenses or estimates)
      const itemsScore = Math.min(100, (items.length / (totalDays * 2)) * 100); // Assume 2 items per day is "complete"
      const confirmedMembers = members.filter((m) => m.rsvpStatus === 'accepted').length;
      const membersScore = (confirmedMembers / members.length) * 100;
      const budgetScore = expenses.length > 0 ? 100 : 0; // Simple: have they started tracking?

      const completionPercentage = Math.round(
        itemsScore * 0.4 + membersScore * 0.3 + budgetScore * 0.3
      );

      // Alert if <50% complete
      if (completionPercentage < 50) {
        const existingNotification = this.findRecentNotification(
          tripId,
          'deadline_urgency',
          48 * 60 * 60 * 1000 // 48 hours (don't spam daily)
        );

        if (!existingNotification) {
          await this.createNotification({
            tripId,
            type: 'deadline_urgency',
            title: '⏰ Trip Deadline Approaching',
            message: `Your trip starts in ${daysUntilStart} day${daysUntilStart > 1 ? 's' : ''} and is only ${completionPercentage}% complete!\n\n📋 Itinerary: ${items.length} items planned\n👥 RSVPs: ${confirmedMembers}/${members.length} confirmed\n💰 Budget: ${expenses.length > 0 ? 'Started' : 'Not started'}`,
            actions: [
              {
                label: 'Help Me Finish',
                action: 'help_complete',
                meta: { tripId },
              },
              {
                label: "I'm On It",
                action: 'dismiss',
              },
            ],
            metadata: {
              daysUntilStart,
              completionPercentage,
              itemsCount: items.length,
              confirmedMembers,
              totalMembers: members.length,
            },
          });

          appLogger.debug('Deadline urgency alert created', {
            tripId,
            daysUntilStart,
            completionPercentage,
          });
        }
      }
    } catch (error) {
      appLogger.error(error instanceof Error ? error : new Error(String(error)), {
        context: 'atlas_check_deadline_urgency',
        tripId,
      });
    }
  }

  /**
   * Create a new notification
   */
  private async createNotification(data: Omit<AtlasNotification, 'id' | 'status' | 'createdAt'>) {
    const notification: AtlasNotification = {
      ...data,
      id: crypto.randomUUID(),
      status: 'unread',
      createdAt: new Date(),
    };

    this.notifications.set(notification.id, notification);

    return notification;
  }

  /**
   * Find a recent notification of a given type for a trip
   */
  private findRecentNotification(
    tripId: string,
    type: AtlasNotification['type'],
    withinMs: number,
    itemId?: string
  ): AtlasNotification | null {
    const now = Date.now();

    for (const notification of Array.from(this.notifications.values())) {
      if (
        notification.tripId === tripId &&
        notification.type === type &&
        notification.status !== 'dismissed' &&
        now - notification.createdAt.getTime() < withinMs
      ) {
        // If checking for specific item, match itemId
        if (itemId && notification.metadata?.itemId !== itemId) {
          continue;
        }

        return notification;
      }
    }

    return null;
  }

  /**
   * Get all unread notifications for a trip
   */
  async getNotifications(tripId: string, userId?: string): Promise<AtlasNotification[]> {
    const now = Date.now();

    const notifications = Array.from(this.notifications.values())
      .filter((n) => {
        // Filter by trip
        if (n.tripId !== tripId) return false;

        // Filter by user (if notification is user-specific)
        if (n.userId && n.userId !== userId) return false;

        // Filter out dismissed
        if (n.status === 'dismissed') return false;

        // Filter out snoozed (if snooze hasn't expired)
        if (n.status === 'snoozed' && n.snoozedUntil && now < n.snoozedUntil.getTime()) {
          return false;
        }

        return true;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return notifications;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    const notification = this.notifications.get(notificationId);

    if (notification) {
      notification.status = 'read';
      return true;
    }

    return false;
  }

  /**
   * Dismiss notification
   */
  async dismissNotification(notificationId: string): Promise<boolean> {
    const notification = this.notifications.get(notificationId);

    if (notification) {
      notification.status = 'dismissed';
      return true;
    }

    return false;
  }

  /**
   * Snooze notification for a duration
   */
  async snoozeNotification(notificationId: string, durationMs: number): Promise<boolean> {
    const notification = this.notifications.get(notificationId);

    if (notification) {
      notification.status = 'snoozed';
      notification.snoozedUntil = new Date(Date.now() + durationMs);
      return true;
    }

    return false;
  }

  /**
   * Get notification statistics
   */
  async getStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    const stats = {
      total: this.notifications.size,
      byType: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
    };

    for (const notification of Array.from(this.notifications.values())) {
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
      stats.byStatus[notification.status] = (stats.byStatus[notification.status] || 0) + 1;
    }

    return stats;
  }

  /**
   * Clear old notifications (cleanup job)
   */
  async clearOldNotifications(olderThanMs: number = 30 * 24 * 60 * 60 * 1000) {
    const now = Date.now();
    let cleared = 0;

    for (const [id, notification] of Array.from(this.notifications.entries())) {
      if (now - notification.createdAt.getTime() > olderThanMs) {
        this.notifications.delete(id);
        cleared++;
      }
    }

    if (cleared > 0) {
      appLogger.debug('Cleared old Atlas notifications', { count: cleared });
    }

    return cleared;
  }
}

// Export singleton instance
export const atlasProactive = new AtlasProactiveService();

// Export types
export type { AtlasNotification };
