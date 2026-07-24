/**
 * Asset management utilities
 * Handles static and dynamic asset loading
 */

// Asset base paths
const ASSET_BASE = '/assets';
const CDN_BASE = import.meta.env.VITE_CDN_URL || '';

/**
 * Get asset URL from public directory
 */
export function getAssetUrl(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // Use CDN if configured, otherwise use local assets
  if (CDN_BASE) {
    return `${CDN_BASE}/${cleanPath}`;
  }

  return `${ASSET_BASE}/${cleanPath}`;
}

/**
 * Get brand asset URL
 */
export function getBrandAsset(path: string): string {
  return getAssetUrl(`brand/${path}`);
}

/**
 * Get logo asset with variant
 */
export function getLogoUrl(
  variant: 'primary' | 'white' | 'dark' | 'icon' = 'primary',
  size?: number
): string {
  const sizeStr = size ? `-${size}` : '';
  return getBrandAsset(`logos/logo-${variant}${sizeStr}.png`);
}

/**
 * Location-based image database
 * Maps location identifiers to image sets
 */
export interface LocationImage {
  url: string;
  alt: string;
  credit?: string;
  source?: string;
}

export interface LocationImageSet {
  hero: LocationImage;
  gallery: LocationImage[];
  thumbnail?: LocationImage;
}

// Popular destinations with curated images
const DESTINATION_IMAGES: Record<string, LocationImageSet> = {
  // Cities
  'new-york': {
    hero: {
      url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=2400&q=90',
      alt: 'New York City skyline',
      credit: 'Unsplash',
    },
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=1200&q=85',
        alt: 'Times Square at night',
      },
      {
        url: 'https://images.unsplash.com/photo-1546436836-07a91091f160?w=1200&q=85',
        alt: 'Central Park aerial view',
      },
    ],
  },
  paris: {
    hero: {
      url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=2400&q=90',
      alt: 'Eiffel Tower, Paris',
      credit: 'Unsplash',
    },
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1200&q=85',
        alt: 'Paris skyline',
      },
    ],
  },
  tokyo: {
    hero: {
      url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=2400&q=90',
      alt: 'Tokyo cityscape',
      credit: 'Unsplash',
    },
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1200&q=85',
        alt: 'Tokyo Tower',
      },
    ],
  },
  london: {
    hero: {
      url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=2400&q=90',
      alt: 'London skyline with Big Ben',
      credit: 'Unsplash',
    },
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=1200&q=85',
        alt: 'London Bridge',
      },
    ],
  },
  dubai: {
    hero: {
      url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=2400&q=90',
      alt: 'Dubai skyline at sunset',
      credit: 'Unsplash',
    },
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1200&q=85',
        alt: 'Burj Khalifa',
      },
    ],
  },
  barcelona: {
    hero: {
      url: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=2400&q=90',
      alt: 'Barcelona cityscape',
      credit: 'Unsplash',
    },
    gallery: [],
  },
  rome: {
    hero: {
      url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=2400&q=90',
      alt: 'Colosseum, Rome',
      credit: 'Unsplash',
    },
    gallery: [],
  },
  bali: {
    hero: {
      url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=2400&q=90',
      alt: 'Bali rice terraces',
      credit: 'Unsplash',
    },
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=1200&q=85',
        alt: 'Bali temple',
      },
    ],
  },
  santorini: {
    hero: {
      url: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=2400&q=90',
      alt: 'Santorini white buildings',
      credit: 'Unsplash',
    },
    gallery: [],
  },
  maldives: {
    hero: {
      url: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=2400&q=90',
      alt: 'Maldives overwater bungalows',
      credit: 'Unsplash',
    },
    gallery: [],
  },
};

// Country fallback images
const COUNTRY_IMAGES: Record<string, LocationImage> = {
  US: {
    url: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=2400&q=90',
    alt: 'United States landscape',
  },
  FR: {
    url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=2400&q=90',
    alt: 'France landscape',
  },
  JP: {
    url: 'https://images.unsplash.com/photo-1528164344705-47542687000d?w=2400&q=90',
    alt: 'Japan landscape',
  },
  GB: {
    url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=2400&q=90',
    alt: 'United Kingdom landscape',
  },
  IT: {
    url: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=2400&q=90',
    alt: 'Italy landscape',
  },
  ES: {
    url: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=2400&q=90',
    alt: 'Spain landscape',
  },
  GR: {
    url: 'https://images.unsplash.com/photo-1504548840739-d667c8f4eaa4?w=2400&q=90',
    alt: 'Greece landscape',
  },
  TH: {
    url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=2400&q=90',
    alt: 'Thailand landscape',
  },
};

// Generic category fallbacks
const CATEGORY_IMAGES: Record<string, LocationImage> = {
  beach: {
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=2400&q=90',
    alt: 'Beach destination',
  },
  mountain: {
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2400&q=90',
    alt: 'Mountain destination',
  },
  city: {
    url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=2400&q=90',
    alt: 'City destination',
  },
  nature: {
    url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=2400&q=90',
    alt: 'Nature destination',
  },
  adventure: {
    url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=2400&q=90',
    alt: 'Adventure destination',
  },
  culture: {
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2400&q=90',
    alt: 'Cultural destination',
  },
};

/**
 * Get location-based hero image
 */
export function getLocationImage(location: string, countryCode?: string): LocationImage {
  // Normalize location to slug format
  const slug = location
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Try to find exact destination match
  if (DESTINATION_IMAGES[slug]) {
    return DESTINATION_IMAGES[slug].hero;
  }

  // Try country code fallback
  if (countryCode && COUNTRY_IMAGES[countryCode.toUpperCase()]) {
    return COUNTRY_IMAGES[countryCode.toUpperCase()];
  }

  // Default fallback
  return CATEGORY_IMAGES.city;
}

/**
 * Get location image gallery
 */
export function getLocationGallery(location: string): LocationImage[] {
  const slug = location
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return DESTINATION_IMAGES[slug]?.gallery || [];
}

/**
 * Get category-based destination image
 */
export function getCategoryImage(category: keyof typeof CATEGORY_IMAGES): LocationImage {
  return CATEGORY_IMAGES[category] || CATEGORY_IMAGES.city;
}

/**
 * Add custom location images (for user-defined destinations)
 */
export function addLocationImages(location: string, images: LocationImageSet): void {
  const slug = location
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  DESTINATION_IMAGES[slug] = images;
}

/**
 * Search for location images by keyword
 */
export function searchLocationImages(query: string): string[] {
  const lowerQuery = query.toLowerCase();
  return Object.keys(DESTINATION_IMAGES).filter((key) => key.includes(lowerQuery));
}

/**
 * Get optimized image URL with transformations
 * Useful if you add image optimization service later
 */
export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpg' | 'png';
}

export function getOptimizedImageUrl(url: string, options: ImageTransformOptions = {}): string {
  // If using Unsplash, add optimization params
  if (url.includes('unsplash.com')) {
    const params = new URLSearchParams();
    if (options.width) params.set('w', options.width.toString());
    if (options.height) params.set('h', options.height.toString());
    if (options.quality) params.set('q', options.quality.toString());
    if (options.format === 'webp') params.set('fm', 'webp');

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${params.toString()}`;
  }

  // For other URLs, return as-is (or implement your CDN transformations)
  return url;
}

/**
 * Preload critical images
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Preload multiple images
 */
export async function preloadImages(urls: string[]): Promise<void> {
  await Promise.all(urls.map(preloadImage));
}
