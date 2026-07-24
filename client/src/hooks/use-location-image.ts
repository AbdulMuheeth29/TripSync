import { useState, useEffect } from 'react';
import {
  getLocationImage,
  getLocationGallery,
  getCategoryImage,
  preloadImage,
  type LocationImage,
} from '@/lib/assets';

/**
 * Hook to get location-based hero image
 */
export function useLocationImage(location: string, countryCode?: string) {
  const [image, setImage] = useState<LocationImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!location) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const locationImage = getLocationImage(location, countryCode);
      setImage(locationImage);

      // Preload the image
      preloadImage(locationImage.url)
        .then(() => setLoading(false))
        .catch((err) => {
          setError(err);
          setLoading(false);
        });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load image'));
      setLoading(false);
    }
  }, [location, countryCode]);

  return { image, loading, error };
}

/**
 * Hook to get location image gallery
 */
export function useLocationGallery(location: string) {
  const [gallery, setGallery] = useState<LocationImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!location) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const images = getLocationGallery(location);
    setGallery(images);
    setLoading(false);
  }, [location]);

  return { gallery, loading };
}

/**
 * Hook to get category-based image
 */
export function useCategoryImage(
  category: 'beach' | 'mountain' | 'city' | 'nature' | 'adventure' | 'culture'
) {
  const [image, setImage] = useState<LocationImage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const categoryImage = getCategoryImage(category);
    setImage(categoryImage);

    preloadImage(categoryImage.url)
      .then(() => setLoading(false))
      .catch(() => setLoading(false));
  }, [category]);

  return { image, loading };
}
