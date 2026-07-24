/**
 * Image API Routes
 *
 * Endpoints for fetching destination and activity images dynamically
 */

import { Router } from 'express';
import { getDestinationImages, getActivityImage, getTripCoverImage } from './unsplash-service';

const router = Router();

/**
 * GET /api/images/destination/:destination
 * Get images for a specific destination
 */
router.get('/destination/:destination', async (req, res) => {
  try {
    const { destination } = req.params;
    const count = parseInt(req.query.count as string) || 3;

    if (!destination) {
      return res.status(400).json({ error: 'Destination is required' });
    }

    const images = await getDestinationImages(decodeURIComponent(destination), count);

    res.json({
      success: true,
      destination,
      images,
      count: images.length,
    });
  } catch (error: any) {
    console.error('Failed to fetch destination images:', error);
    res.status(500).json({
      error: 'Failed to fetch images',
      message: error?.message,
    });
  }
});

/**
 * GET /api/images/activity/:type
 * Get image for an activity type
 */
router.get('/activity/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const destination = req.query.destination as string;

    if (!type) {
      return res.status(400).json({ error: 'Activity type is required' });
    }

    const image = await getActivityImage(
      decodeURIComponent(type),
      destination ? decodeURIComponent(destination) : undefined
    );

    res.json({
      success: true,
      type,
      destination: destination || null,
      image,
    });
  } catch (error: any) {
    console.error('Failed to fetch activity image:', error);
    res.status(500).json({
      error: 'Failed to fetch image',
      message: error?.message,
    });
  }
});

/**
 * GET /api/images/trip-cover/:destination
 * Get cover image for a trip
 */
router.get('/trip-cover/:destination', async (req, res) => {
  try {
    const { destination } = req.params;
    const vibes = req.query.vibes as string;

    if (!destination) {
      return res.status(400).json({ error: 'Destination is required' });
    }

    const vibesArray = vibes ? vibes.split(',') : undefined;
    const image = await getTripCoverImage(decodeURIComponent(destination), vibesArray);

    res.json({
      success: true,
      destination,
      vibes: vibesArray,
      image,
    });
  } catch (error: any) {
    console.error('Failed to fetch trip cover image:', error);
    res.status(500).json({
      error: 'Failed to fetch image',
      message: error?.message,
    });
  }
});

export default router;
