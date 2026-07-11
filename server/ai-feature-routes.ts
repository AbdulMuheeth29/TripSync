/**
 * AI-Only Feature API Routes
 *
 * Advanced AI features that differentiate TripSync from competitors:
 * - Smart activity scheduling optimization
 * - Trip success prediction
 * - Dynamic pricing intelligence
 * - Personalized recommendations
 */

import { Router } from 'express';
import { requireAuth } from './auth';
import { requireTripAccess } from './middleware';
import { storage } from './storage';
import {
  optimizeActivitySchedule,
  predictTripSuccess,
  analyzePricingTrends,
  generatePersonalizedRecommendations
} from './ai-only-features';
import { canUseAIGeneration } from './subscription-gates';

const router = Router();

/**
 * POST /api/trips/:tripId/ai/optimize-schedule
 * Optimize activity scheduling for a specific day
 */
router.post('/:tripId/ai/optimize-schedule', requireAuth, requireTripAccess, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { dayNumber } = req.body;
    const userId = (req as any).userId;

    if (!dayNumber || typeof dayNumber !== 'number') {
      return res.status(400).json({ error: 'Day number is required' });
    }

    // Check AI generation limits
    const aiCheck = await canUseAIGeneration(userId, String(tripId));
    if (!aiCheck.allowed) {
      return res.status(403).json({ error: aiCheck.reason, upgradeUrl: '/pricing' });
    }

    const trip = await storage.getTrip(String(tripId));
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const items = await storage.getItineraryItems(String(tripId));
    const optimizedSchedule = await optimizeActivitySchedule(trip, items, dayNumber);

    if (!optimizedSchedule) {
      return res.status(400).json({ error: 'No activities to optimize for this day' });
    }

    res.json({
      success: true,
      data: optimizedSchedule
    });
  } catch (error: any) {
    console.error('Failed to optimize schedule:', error);
    res.status(500).json({
      error: error?.message || 'Failed to optimize schedule'
    });
  }
});

/**
 * GET /api/trips/:tripId/ai/success-prediction
 * Predict trip success score
 */
router.get('/:tripId/ai/success-prediction', requireAuth, requireTripAccess, async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await storage.getTrip(String(tripId));
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const [members, items, expenses, votes] = await Promise.all([
      storage.getTripMembers(String(tripId)),
      storage.getItineraryItems(String(tripId)),
      storage.getExpensesByTrip(String(tripId)),
      storage.getVotesByTrip(String(tripId))
    ]);

    const prediction = await predictTripSuccess(trip, members, items, expenses, votes);

    res.json({
      success: true,
      data: prediction
    });
  } catch (error: any) {
    console.error('Failed to predict trip success:', error);
    res.status(500).json({
      error: error?.message || 'Failed to predict trip success'
    });
  }
});

/**
 * POST /api/trips/:tripId/ai/pricing-analysis
 * Analyze pricing trends for an itinerary item
 */
router.post('/:tripId/ai/pricing-analysis', requireAuth, requireTripAccess, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({ error: 'Item ID is required' });
    }

    const trip = await storage.getTrip(String(tripId));
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const items = await storage.getItineraryItems(String(tripId));
    const item = items.find(i => i.id === itemId);
    if (!item || item.tripId !== tripId) {
      return res.status(404).json({ error: 'Itinerary item not found' });
    }

    const pricingAnalysis = await analyzePricingTrends(trip, item);

    res.json({
      success: true,
      data: pricingAnalysis
    });
  } catch (error: any) {
    console.error('Failed to analyze pricing:', error);
    res.status(500).json({
      error: error?.message || 'Failed to analyze pricing trends'
    });
  }
});

/**
 * POST /api/trips/:tripId/ai/personalized-recommendations
 * Generate personalized activity recommendations
 */
router.post('/:tripId/ai/personalized-recommendations', requireAuth, requireTripAccess, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { dayNumber } = req.body;
    const userId = (req as any).userId;

    if (!dayNumber || typeof dayNumber !== 'number') {
      return res.status(400).json({ error: 'Day number is required' });
    }

    // Check AI generation limits
    const aiCheck = await canUseAIGeneration(userId, String(tripId));
    if (!aiCheck.allowed) {
      return res.status(403).json({ error: aiCheck.reason, upgradeUrl: '/pricing' });
    }

    const trip = await storage.getTrip(String(tripId));
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const members = await storage.getTripMembers(String(tripId));
    const recommendations = await generatePersonalizedRecommendations(trip, members, dayNumber);

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error: any) {
    console.error('Failed to generate recommendations:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate personalized recommendations'
    });
  }
});

export default router;
