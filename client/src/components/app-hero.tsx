import { useState, useEffect } from "react";

/**
 * Global hero banner: image-only, no text. Rotates through travel scenes
 * (mountains, beaches, cities) with a smooth crossfade for a floating, dynamic feel.
 */
const HERO_IMAGES = [
  { url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=2400&q=95", label: "Travel" },
  { url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2400&q=95", label: "Mountains" },
  { url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=2400&q=95", label: "Beach" },
  { url: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=2400&q=95", label: "City" },
  { url: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=2400&q=95", label: "Landscape" },
  { url: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=2400&q=95", label: "Lake" },
];

const ROTATE_INTERVAL_MS = 5500;

export function AppHero() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % HERO_IMAGES.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      className="relative w-full aspect-[21/9] min-h-[220px] max-h-[420px] overflow-hidden shrink-0"
      aria-label="Hero imagery"
    >
      <div className="absolute inset-0">
        {HERO_IMAGES.map((img, i) => (
          <div
            key={img.url}
            className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
            style={{
              opacity: i === index ? 1 : 0,
              zIndex: i === index ? 1 : 0,
            }}
          >
            <img
              src={img.url}
              alt=""
              className="w-full h-full object-cover object-center hero-float"
              fetchPriority={i === 0 ? "high" : "low"}
            />
          </div>
        ))}
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50 pointer-events-none"
          aria-hidden
        />
      </div>
    </header>
  );
}
