import { useState, useEffect } from 'react';

/**
 * Global hero banner: Rotates through stunning cinematic shots of popular US destinations
 * for a dynamic, inspiring feel that showcases where users can plan trips.
 */
const HERO_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=2400&q=95',
    label: 'New York City',
  },
  {
    url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=2400&q=95',
    label: 'San Francisco',
  },
  {
    url: 'https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=2400&q=95',
    label: 'Grand Canyon',
  },
  {
    url: 'https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?w=2400&q=95',
    label: 'Miami Beach',
  },
  {
    url: 'https://images.unsplash.com/photo-1556883324-5c26c8f800f2?w=2400&q=95',
    label: 'Seattle',
  },
  {
    url: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=2400&q=95',
    label: 'Austin',
  },
  {
    url: 'https://images.unsplash.com/photo-1605833556294-ea5c7a74f8b0?w=2400&q=95',
    label: 'Las Vegas',
  },
  {
    url: 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=2400&q=95',
    label: 'Chicago',
  },
  {
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2400&q=95',
    label: 'Yosemite',
  },
  {
    url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=2400&q=95',
    label: 'Yellowstone',
  },
];

const ROTATE_INTERVAL_MS = 5500;

export function AppHero() {
  const [index, setIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Preload all images to prevent blank screens during transitions
  useEffect(() => {
    const imagePromises = HERO_IMAGES.map((img) => {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(img.url);
        image.onerror = () => reject(new Error(`Failed to load ${img.label}`));
        image.src = img.url;
      });
    });

    Promise.all(imagePromises)
      .then(() => setImagesLoaded(true))
      .catch((err) => {
        console.warn('Some images failed to preload:', err);
        // Still allow rotation even if some images fail
        setImagesLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (!imagesLoaded) return;

    const id = setInterval(() => {
      setPrevIndex(index);
      setIndex((i) => (i + 1) % HERO_IMAGES.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [imagesLoaded, index]);

  return (
    <header
      className="relative w-full aspect-[21/9] min-h-[220px] max-h-[420px] overflow-hidden shrink-0"
      aria-label="Hero imagery"
    >
      <div className="absolute inset-0">
        {/* Previous image stays visible in background */}
        <div className="absolute inset-0" style={{ zIndex: 0 }}>
          <img
            src={HERO_IMAGES[prevIndex].url}
            alt=""
            className="w-full h-full object-cover object-center hero-float"
          />
        </div>

        {/* Current image crossfades in on top */}
        <div
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{
            zIndex: 1,
            opacity: imagesLoaded ? 1 : 0,
          }}
        >
          <img
            src={HERO_IMAGES[index].url}
            alt=""
            className="w-full h-full object-cover object-center hero-float"
            fetchPriority="high"
          />
        </div>

        <div
          className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50 pointer-events-none"
          style={{ zIndex: 2 }}
          aria-hidden
        />
      </div>
    </header>
  );
}
