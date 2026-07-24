/**
 * Unsplash Image Service
 *
 * Fetches destination-specific, high-quality travel images from Unsplash API.
 * Free tier: 50 requests/hour.
 *
 * Features:
 * - Search by destination, activity, or landmark
 * - Caching to minimize API calls
 * - Fallback to curated travel collection
 * - International destination support
 */

import { cache } from './cache';

interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  links: {
    html: string;
    download_location: string;
  };
  user: {
    name: string;
    username: string;
  };
  description?: string;
  alt_description?: string;
}

interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const UNSPLASH_API_URL = 'https://api.unsplash.com';

// Default travel images to use when API is not configured - US destinations only
const DEFAULT_TRAVEL_IMAGES = [
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&q=80', // Scenic landscape
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80', // Yosemite
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&q=80', // Lake Tahoe
  'https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=1600&q=80', // Grand Canyon
  'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1600&q=80', // Yellowstone
];

/**
 * Search for images related to a query
 */
async function searchPhotos(query: string, perPage = 5): Promise<UnsplashPhoto[]> {
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn('[unsplash] No API key configured, using default images');
    return [];
  }

  try {
    const url = new URL(`${UNSPLASH_API_URL}/search/photos`);
    url.searchParams.set('query', query);
    url.searchParams.set('per_page', String(perPage));
    url.searchParams.set('orientation', 'landscape');
    url.searchParams.set('content_filter', 'high'); // Family-friendly

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = (await response.json()) as UnsplashSearchResponse;
    return data.results || [];
  } catch (error) {
    console.error('[unsplash] Search failed:', error);
    return [];
  }
}

/**
 * Get a photo by ID
 */
async function getPhoto(photoId: string): Promise<UnsplashPhoto | null> {
  if (!UNSPLASH_ACCESS_KEY) return null;

  try {
    const url = `${UNSPLASH_API_URL}/photos/${photoId}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    return (await response.json()) as UnsplashPhoto;
  } catch (error) {
    console.error('[unsplash] Get photo failed:', error);
    return null;
  }
}

/**
 * Get images for a destination
 *
 * @param destination - City, country, or place name (e.g., "Paris, France", "Tokyo", "Grand Canyon")
 * @param count - Number of images to return
 * @returns Array of image URLs
 */
export async function getDestinationImages(destination: string, count = 3): Promise<string[]> {
  if (!destination) return getRandomDefaultImages(count);

  // Check cache first
  const cacheKey = `unsplash:destination:${destination.toLowerCase()}:${count}`;
  const cached = await cache.get<string[]>(cacheKey);
  if (cached) {
    console.log(`[unsplash] Cache hit for destination: ${destination}`);
    return cached;
  }

  // Search Unsplash
  const photos = await searchPhotos(destination, count);

  if (photos.length === 0) {
    console.warn(`[unsplash] No photos found for ${destination}, using defaults`);
    return getRandomDefaultImages(count);
  }

  // Extract image URLs (using 'regular' size for good quality/performance balance)
  const imageUrls = photos.map((photo) => `${photo.urls.regular}&w=1600&q=80`);

  // Cache for 7 days
  await cache.set(cacheKey, imageUrls, 604800);

  console.log(`[unsplash] Found ${imageUrls.length} images for ${destination}`);
  return imageUrls;
}

/**
 * Get an image for a specific activity or place type
 *
 * @param activityType - Type of activity (e.g., "restaurant", "hotel", "museum", "hiking")
 * @param destination - Optional destination for context
 * @returns Image URL
 */
export async function getActivityImage(
  activityType: string,
  destination?: string
): Promise<string> {
  // Build search query
  const query = destination ? `${activityType} ${destination}` : activityType;

  // Check cache
  const cacheKey = `unsplash:activity:${query.toLowerCase()}`;
  const cached = await cache.get<string>(cacheKey);
  if (cached) {
    console.log(`[unsplash] Cache hit for activity: ${query}`);
    return cached;
  }

  // Search Unsplash
  const photos = await searchPhotos(query, 1);

  if (photos.length === 0) {
    console.warn(`[unsplash] No photo found for ${query}, using default`);
    return getRandomDefaultImages(1)[0];
  }

  const imageUrl = `${photos[0].urls.regular}&w=1200&q=80`;

  // Cache for 7 days
  await cache.set(cacheKey, imageUrl, 604800);

  console.log(`[unsplash] Found image for ${query}`);
  return imageUrl;
}

/**
 * Get images for multiple activities in a trip
 *
 * @param activities - Array of {type, name, destination} objects
 * @returns Array of image URLs matching the input array
 */
export async function getBatchActivityImages(
  activities: Array<{ type: string; name: string; destination?: string }>
): Promise<string[]> {
  return Promise.all(
    activities.map(async (activity) => {
      // Try to search by activity name first (e.g., "Eiffel Tower")
      if (activity.name && !activity.name.toLowerCase().includes('tbd')) {
        const nameImage = await getActivityImage(activity.name, activity.destination);
        if (nameImage !== getRandomDefaultImages(1)[0]) {
          return nameImage;
        }
      }

      // Fall back to activity type
      return getActivityImage(activity.type, activity.destination);
    })
  );
}

/**
 * Get a cover image for a trip
 *
 * @param destination - Trip destination
 * @param vibes - Optional array of vibes/interests to influence image selection
 * @returns Cover image URL
 */
export async function getTripCoverImage(destination: string, vibes?: string[]): Promise<string> {
  // Build search query with vibes
  const query =
    vibes && vibes.length > 0
      ? `${destination} ${vibes[0]}` // Use first vibe for better matching
      : destination;

  const images = await getDestinationImages(query, 1);
  return images[0] || getRandomDefaultImages(1)[0];
}

/**
 * Get random default images when API fails or is not configured
 */
function getRandomDefaultImages(count: number): string[] {
  const shuffled = [...DEFAULT_TRAVEL_IMAGES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Clear image cache for a destination (useful for testing or cache invalidation)
 */
export async function clearDestinationCache(destination: string): Promise<void> {
  const cacheKey = `unsplash:destination:${destination.toLowerCase()}`;
  await cache.del(cacheKey);
  console.log(`[unsplash] Cleared cache for ${destination}`);
}

/**
 * Get image URL with specific size parameters
 */
export function getOptimizedImageUrl(baseUrl: string, width: number, quality: number = 80): string {
  // If already has parameters, replace them
  const url = new URL(baseUrl);
  url.searchParams.set('w', String(width));
  url.searchParams.set('q', String(quality));
  url.searchParams.set('fit', 'crop');
  url.searchParams.set('crop', 'entropy'); // Smart crop
  return url.toString();
}

/**
 * Check if Unsplash API is configured and working
 */
export async function isUnsplashAvailable(): Promise<boolean> {
  if (!UNSPLASH_ACCESS_KEY) {
    return false;
  }

  try {
    // Try a simple API call
    const url = `${UNSPLASH_API_URL}/photos/random?count=1`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}

// Export a simple test function
export async function testUnsplashService(): Promise<void> {
  console.log('[unsplash] Testing Unsplash service...');

  const available = await isUnsplashAvailable();
  console.log(`[unsplash] API available: ${available}`);

  if (available) {
    const images = await getDestinationImages('Paris, France', 2);
    console.log(`[unsplash] Sample images for Paris:`, images);

    const activityImage = await getActivityImage('restaurant', 'Tokyo');
    console.log(`[unsplash] Sample restaurant image:`, activityImage);
  }
}
