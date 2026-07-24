/**
 * Atlas AI Assistant API Routes
 *
 * Conversational planning and proactive monitoring endpoints
 */

import { Router } from 'express';
import { requireAuth } from './auth';
import { requireTripAccess } from './middleware';
import { storage } from './storage';
import { getDb } from './db';
import { atlasConversations, atlasInterventions, atlasMonitoringState } from '@shared/schema';
import { and, eq, desc } from 'drizzle-orm';
import { conversationalPlanningSuggestion, type AtlasRichContext } from './ai-service';
import { randomUUID } from 'crypto';

const router = Router();

/**
 * GET /api/trips/:tripId/atlas/conversation
 * Get Atlas conversation history for a trip
 */
router.get('/:tripId/atlas/conversation', requireAuth, requireTripAccess, async (req, res) => {
  try {
    const tripId = req.params.tripId as string;
    const userId = (req as any).userId;

    const db = getDb();
    const conversation = await db
      .select()
      .from(atlasConversations)
      .where(and(eq(atlasConversations.tripId, tripId), eq(atlasConversations.userId, userId)))
      .orderBy(desc(atlasConversations.updatedAt))
      .limit(1);

    if (conversation.length === 0) {
      // Create new conversation
      const newConversation = await db
        .insert(atlasConversations)
        .values({
          id: randomUUID(),
          tripId: tripId,
          userId,
          messages: [],
        })
        .returning();

      return res.json({
        success: true,
        data: newConversation[0],
      });
    }

    res.json({
      success: true,
      data: conversation[0],
    });
  } catch (error: any) {
    console.error('Failed to get Atlas conversation:', error);
    res.status(500).json({
      error: 'Failed to load conversation',
    });
  }
});

/**
 * POST /api/trips/:tripId/atlas/message
 * Send a message to Atlas and get AI response
 */
router.post('/:tripId/atlas/message', requireAuth, requireTripAccess, async (req, res) => {
  try {
    const tripId = req.params.tripId as string;
    const { message } = req.body;
    const userId = (req as any).userId;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const db = getDb();

    // Get or create conversation
    let conversation = await db
      .select()
      .from(atlasConversations)
      .where(and(eq(atlasConversations.tripId, tripId), eq(atlasConversations.userId, userId)))
      .limit(1);

    if (conversation.length === 0) {
      const newConversation = await db
        .insert(atlasConversations)
        .values({
          id: randomUUID(),
          tripId: tripId,
          userId,
          messages: [],
        })
        .returning();
      conversation = newConversation;
    }

    // Get trip data for context
    const [trip, items, expenses, votes, members] = await Promise.all([
      storage.getTrip(tripId),
      storage.getItineraryItems(tripId),
      storage.getExpensesByTrip(tripId),
      storage.getVotesByTrip(tripId),
      storage.getTripMembers(tripId),
    ]);

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Build rich context for Atlas
    const tripDuration = Math.ceil(
      (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const daysWithActivities = new Set(items.map((i: any) => i.dayNumber)).size;
    const totalBudget = trip.budgetPerPerson * trip.groupSize;
    const totalSpent = expenses.reduce((sum: number, e: any) => sum + e.amount, 0);
    const daysUntilTrip = Math.ceil(
      (new Date(trip.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    // Calculate stuck votes: items with conflicting vote types
    const votesByItem = new Map<string, any[]>();
    votes.forEach((v: any) => {
      if (!votesByItem.has(v.itemId)) {
        votesByItem.set(v.itemId, []);
      }
      votesByItem.get(v.itemId)!.push(v);
    });

    let stuckVotesCount = 0;
    for (const [itemId, itemVotes] of votesByItem) {
      const voteTypes = new Set(itemVotes.map((v: any) => v.voteType));
      // If there are multiple different vote types, it's stuck (conflicting opinions)
      if (voteTypes.size > 1) {
        stuckVotesCount++;
      }
    }

    const context: AtlasRichContext = {
      trip: {
        id: trip.id,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        budgetPerPerson: trip.budgetPerPerson,
        groupSize: trip.groupSize,
        status: trip.status,
        isLocked: trip.isLocked,
      },
      progress: {
        itineraryItems: items.length,
        daysWithActivities,
        daysWithoutActivities: tripDuration - daysWithActivities,
        totalExpenses: totalSpent,
        totalBudget,
        overBudget: totalSpent > totalBudget,
        overAmount: Math.max(0, totalSpent - totalBudget),
        confirmedMembers: members.filter((m: any) => m.status === 'confirmed').length,
        pendingMembers: members.filter((m: any) => m.status === 'pending').length,
        activeVotes: votes.length,
        stuckVotes: stuckVotesCount,
        completionPercentage: tripDuration > 0 ? (daysWithActivities / tripDuration) * 100 : 0,
        daysUntilTrip: daysUntilTrip > 0 ? daysUntilTrip : null,
      },
      behavior: {
        currentPage: req.body.currentPage,
        timeOnPage: req.body.timeOnPage,
        lastAction: req.body.lastAction,
      },
      group: {
        vibes: trip.vibes,
      },
    };

    // Get AI response
    const { suggestion, action } = await conversationalPlanningSuggestion({
      tripId,
      userMessage: message,
      context,
      fullTrip: trip,
      items,
      expenses,
      votes,
      members: members.map((m: any) => ({
        ...m,
        user: { name: m.user?.fullName || m.user?.email || 'Unknown' },
      })),
    });

    // Update conversation with new messages
    const currentMessages = (conversation[0].messages as any[]) || [];
    const newMessages = [
      ...currentMessages,
      {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      },
      {
        role: 'assistant',
        content: suggestion,
        action,
        timestamp: new Date().toISOString(),
      },
    ];

    await db
      .update(atlasConversations)
      .set({
        messages: newMessages,
        updatedAt: new Date(),
      })
      .where(eq(atlasConversations.id, conversation[0].id));

    res.json({
      success: true,
      data: {
        message: suggestion,
        action,
        context,
      },
    });
  } catch (error: any) {
    console.error('Failed to send Atlas message:', error);
    res.status(500).json({
      error: error?.message || 'Failed to send message',
    });
  }
});

/**
 * DELETE /api/trips/:tripId/atlas/conversation
 * Clear Atlas conversation history
 */
router.delete('/:tripId/atlas/conversation', requireAuth, requireTripAccess, async (req, res) => {
  try {
    const tripId = req.params.tripId as string;
    const userId = (req as any).userId;

    const db = getDb();
    await db
      .delete(atlasConversations)
      .where(and(eq(atlasConversations.tripId, tripId), eq(atlasConversations.userId, userId)));

    res.json({
      success: true,
      message: 'Conversation cleared',
    });
  } catch (error: any) {
    console.error('Failed to clear Atlas conversation:', error);
    res.status(500).json({
      error: 'Failed to clear conversation',
    });
  }
});

/**
 * GET /api/trips/:tripId/atlas/interventions
 * Get Atlas AI interventions for a trip (proactive monitoring)
 */
router.get('/:tripId/atlas/interventions', requireAuth, requireTripAccess, async (req, res) => {
  try {
    const tripId = req.params.tripId as string;
    const limit = parseInt(req.query.limit as string) || 10;

    const db = getDb();
    const interventions = await db
      .select()
      .from(atlasInterventions)
      .where(eq(atlasInterventions.tripId, tripId))
      .orderBy(desc(atlasInterventions.createdAt))
      .limit(limit);

    res.json({
      success: true,
      data: interventions,
    });
  } catch (error: any) {
    console.error('Failed to get interventions:', error);
    res.status(500).json({
      error: 'Failed to load interventions',
    });
  }
});

/**
 * GET /api/trips/:tripId/atlas/health
 * Get trip health score and monitoring state
 */
router.get('/:tripId/atlas/health', requireAuth, requireTripAccess, async (req, res) => {
  try {
    const tripId = req.params.tripId as string;

    const db = getDb();
    const state = await db
      .select()
      .from(atlasMonitoringState)
      .where(eq(atlasMonitoringState.tripId, tripId))
      .limit(1);

    if (state.length === 0) {
      return res.json({
        success: true,
        data: {
          healthScore: 100,
          issues: [],
          lastChecked: null,
        },
      });
    }

    res.json({
      success: true,
      data: {
        healthScore: parseFloat(state[0].healthScore || '100'),
        completionPercentage: parseFloat(state[0].completionPercentage || '0'),
        budgetUsagePercentage: parseFloat(state[0].budgetUsagePercentage || '0'),
        daysUntilTrip: state[0].daysUntilTrip,
        stuckVotesCount: state[0].stuckVotesCount,
        inactiveDays: state[0].inactiveDays,
        issues: state[0].issues || [],
        lastChecked: state[0].lastCheckedAt,
        interventionCount: state[0].interventionCount,
        lastIntervention: state[0].lastInterventionAt,
      },
    });
  } catch (error: any) {
    console.error('Failed to get trip health:', error);
    res.status(500).json({
      error: 'Failed to load trip health',
    });
  }
});

/**
 * POST /api/trips/:tripId/atlas/interventions/:interventionId/dismiss
 * Mark an intervention as seen/dismissed
 */
router.post(
  '/:tripId/atlas/interventions/:interventionId/dismiss',
  requireAuth,
  requireTripAccess,
  async (req, res) => {
    try {
      const interventionId = req.params.interventionId as string;

      const db = getDb();
      await db
        .update(atlasInterventions)
        .set({
          dismissed: true,
          dismissedAt: new Date(),
        })
        .where(eq(atlasInterventions.id, parseInt(interventionId)));

      res.json({
        success: true,
        message: 'Intervention dismissed',
      });
    } catch (error: any) {
      console.error('Failed to dismiss intervention:', error);
      res.status(500).json({
        error: 'Failed to dismiss intervention',
      });
    }
  }
);

export default router;
