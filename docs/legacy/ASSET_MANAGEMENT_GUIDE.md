# Asset Management Guide

Complete guide for managing static and dynamic assets in Trip-Sync.

---

## Directory Structure

```
client/public/assets/
├── brand/              # Brand assets (logos, videos, marketing)
│   ├── logos/          # Logo variations (primary, white, dark, icon)
│   ├── videos/         # Brand videos, product demos
│   ├── icons/          # App icons, favicons
│   └── marketing/      # Marketing materials, screenshots
│
├── locations/          # Location-based dynamic images
│   ├── cities/         # City-specific hero images
│   ├── countries/      # Country-wide landscapes
│   └── landmarks/      # Famous landmarks and monuments
│
├── destinations/       # Curated destination images by category
│   ├── beaches/        # Beach and coastal destinations
│   ├── mountains/      # Mountain and ski destinations
│   ├── cities/         # Urban destinations
│   └── nature/         # Parks, forests, natural wonders
│
└── ui/                # UI elements and illustrations
    ├── illustrations/  # Custom illustrations
    ├── icons/          # UI icons (non-logo)
    └── backgrounds/    # Background patterns, textures
```

---

## Static Assets

### Brand Logos

Store logo variations in `/assets/brand/logos/`:

```
logo-primary-512.png    # Main logo, 512x512
logo-primary-1024.png   # High-res logo, 1024x1024
logo-white-512.png      # White version for dark backgrounds
logo-dark-512.png       # Dark version for light backgrounds
logo-icon-256.png       # Icon only (no text)
```

**Usage:**

```tsx
import { getLogoUrl } from '@/lib/assets';

// Get logo with variant and size
<img src={getLogoUrl('primary', 512)} alt="TripSync" />
<img src={getLogoUrl('white')} alt="TripSync" />
<img src={getLogoUrl('icon', 256)} alt="TripSync Icon" />
```

### Brand Videos

Store in `/assets/brand/videos/`:

```
demo-1080p.mp4          # Product demo, 1080p
hero-background.webm    # Hero section background video
```

**Usage:**

```tsx
import { getBrandAsset } from '@/lib/assets';

<video src={getBrandAsset('videos/demo-1080p.mp4')} />
```

---

## Dynamic Location-Based Images

### Automatic Location Detection

The system automatically fetches images based on destination:

```tsx
import { LocationImage } from '@/components/optimized-image';

// Automatically loads the right image for the destination
<LocationImage
  location="Paris"
  countryCode="FR"
  width={1200}
  height={600}
  className="rounded-lg"
/>
```

### Using the Hook

```tsx
import { useLocationImage } from '@/hooks/use-location-image';

function TripHero({ destination }: { destination: string }) {
  const { image, loading, error } = useLocationImage(destination);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading image</div>;

  return (
    <div>
      <img src={image.url} alt={image.alt} />
      {image.credit && <p className="text-xs">Photo: {image.credit}</p>}
    </div>
  );
}
```

### Supported Destinations

Currently supported cities:
- New York, Paris, Tokyo, London, Dubai
- Barcelona, Rome, Bali, Santorini, Maldives

Add more in `/client/src/lib/assets.ts` → `DESTINATION_IMAGES`

### Adding Custom Locations

```tsx
import { addLocationImages } from '@/lib/assets';

// Add custom location with images
addLocationImages('Iceland', {
  hero: {
    url: 'https://example.com/iceland-hero.jpg',
    alt: 'Iceland landscape',
    credit: 'Photographer Name',
  },
  gallery: [
    {
      url: 'https://example.com/iceland-1.jpg',
      alt: 'Northern lights',
    },
    {
      url: 'https://example.com/iceland-2.jpg',
      alt: 'Blue lagoon',
    },
  ],
});
```

### Fallback System

If a specific location isn't found, the system uses:

1. **Country fallback** - Country-wide image (if country code provided)
2. **Category fallback** - Generic category image (city, beach, mountain, etc.)
3. **Default fallback** - Generic travel image

---

## Image Optimization

### Client-Side Optimization

Use the `OptimizedImage` component for automatic optimization:

```tsx
import { OptimizedImage } from '@/components/optimized-image';

<OptimizedImage
  src="https://example.com/large-image.jpg"
  alt="Trip photo"
  width={800}          // Resize to max 800px width
  quality={85}         // 85% quality
  format="webp"        // Convert to WebP
  showLoader={true}    // Show loading animation
  className="rounded-lg"
/>
```

**Features:**
- Lazy loading
- Format conversion (WebP, JPEG, PNG)
- Quality adjustment
- Automatic placeholder while loading
- Error fallback image

### Server-Side Optimization

Automatically optimize uploads with the middleware:

```typescript
// In server/upload-routes.ts
import { imageOptimizationMiddleware } from './image-optimizer';

router.post('/api/upload/photo',
  requireAuth,
  upload.single('file'),
  imageOptimizationMiddleware({
    maxWidth: 2400,
    maxHeight: 2400,
    quality: 85,
    format: 'webp',
    stripMetadata: true,  // Remove EXIF data
  }),
  async (req, res) => {
    // Upload optimized image...
  }
);
```

**Requirements:**
```bash
npm install sharp
```

**Benefits:**
- Reduces file size by 50-80%
- Strips sensitive EXIF data
- Auto-rotates based on orientation
- Converts to modern formats (WebP)
- Generates thumbnails

### Responsive Images

Use srcset for different screen sizes:

```tsx
import { ResponsiveImage } from '@/components/optimized-image';

<ResponsiveImage
  src="image-1280.jpg"
  srcSet={{
    sm: 'image-640.jpg',
    md: 'image-768.jpg',
    lg: 'image-1024.jpg',
    xl: 'image-1280.jpg',
  }}
  alt="Responsive trip photo"
  className="w-full"
/>
```

---

## Best Practices

### File Naming

**Logos:**
```
logo-{variant}-{size}.{ext}
Examples: logo-primary-512.png, logo-white-1024.svg
```

**Location Images:**
```
{city-slug}-{descriptor}.{ext}
Examples: new-york-skyline.jpg, paris-eiffel-tower.jpg
```

**UI Assets:**
```
{component}-{state}-{variant}.{ext}
Examples: button-hover-primary.svg, card-background-light.png
```

### Optimization Guidelines

| Asset Type | Format | Max Size | Quality | Notes |
|------------|--------|----------|---------|-------|
| Logos | PNG/SVG | 50KB | 100% | Use SVG when possible |
| Hero Images | WebP | 500KB | 85% | JPEG fallback |
| Thumbnails | WebP | 50KB | 80% | 300x300px max |
| Icons | SVG | 10KB | - | Inline when possible |
| Videos | WebM/MP4 | 10MB | - | Compress for web |
| Documents | PDF | 5MB | - | Compress images inside |

### Performance Tips

1. **Lazy Load**: Use `loading="lazy"` on all images
2. **Preload Critical**: Preload hero/above-fold images
   ```tsx
   import { preloadImage } from '@/lib/assets';

   useEffect(() => {
     preloadImage('/assets/brand/logos/logo-primary-512.png');
   }, []);
   ```
3. **WebP Format**: Always use WebP with JPEG/PNG fallback
4. **Compress**: Target 85% quality for photos
5. **Responsive**: Use srcset for different screen sizes
6. **CDN**: Configure `VITE_CDN_URL` for production

---

## CDN Configuration

### Environment Variables

Add to `.env`:

```bash
# Optional: Use CDN for static assets
VITE_CDN_URL=https://cdn.yoursite.com
```

When configured, all assets will be served from the CDN:

```tsx
getAssetUrl('brand/logos/logo.png')
// Without CDN: /assets/brand/logos/logo.png
// With CDN: https://cdn.yoursite.com/assets/brand/logos/logo.png
```

### Popular CDN Options

- **Cloudflare**: Free tier, global edge network
- **AWS CloudFront**: Integrates with S3
- **Vercel**: Automatic for Vercel deployments
- **Netlify**: Automatic for Netlify deployments

---

## Upload Limits

Current limits (configurable in server):

| Upload Type | Max Size | Max Files | Allowed Formats |
|-------------|----------|-----------|-----------------|
| Photos | 25MB | 50 (batch) | JPEG, PNG, WebP, HEIC |
| Documents | 10MB | 1 | PDF, JPEG, PNG |
| Receipts | 10MB | 1 | JPEG, PNG, PDF |

---

## API Reference

### Asset Utilities

```typescript
// Get asset URL
getAssetUrl(path: string): string

// Get brand asset
getBrandAsset(path: string): string

// Get logo URL
getLogoUrl(variant: 'primary' | 'white' | 'dark' | 'icon', size?: number): string

// Get location image
getLocationImage(location: string, countryCode?: string): LocationImage

// Get location gallery
getLocationGallery(location: string): LocationImage[]

// Get category image
getCategoryImage(category: 'beach' | 'mountain' | 'city' | ...): LocationImage

// Optimize image URL
getOptimizedImageUrl(url: string, options: ImageTransformOptions): string

// Preload images
preloadImage(url: string): Promise<void>
preloadImages(urls: string[]): Promise<void>
```

### React Hooks

```typescript
// Location image hook
useLocationImage(location: string, countryCode?: string): {
  image: LocationImage | null;
  loading: boolean;
  error: Error | null;
}

// Location gallery hook
useLocationGallery(location: string): {
  gallery: LocationImage[];
  loading: boolean;
}

// Category image hook
useCategoryImage(category: string): {
  image: LocationImage | null;
  loading: boolean;
}
```

### Components

```tsx
// Optimized image with lazy loading
<OptimizedImage
  src={string}
  alt={string}
  width={number}
  height={number}
  quality={number}
  format={'webp' | 'jpg' | 'png'}
  fallback={string}
  showLoader={boolean}
/>

// Location-based image
<LocationImage
  location={string}
  countryCode={string}
  type={'hero' | 'thumbnail'}
/>

// Responsive image with srcset
<ResponsiveImage
  src={string}
  srcSet={{ sm, md, lg, xl }}
  alt={string}
/>
```

---

## Troubleshooting

### Images Not Loading

1. Check file exists in `/client/public/assets/`
2. Verify path doesn't start with `/assets/` (use relative path)
3. Check browser console for 404 errors
4. Ensure CDN URL is correct if configured

### Optimization Not Working

1. Check if Sharp is installed: `npm list sharp`
2. Install if missing: `npm install sharp`
3. Check server logs for optimization errors
4. Verify middleware is added to upload routes

### Slow Image Loading

1. Enable lazy loading: `loading="lazy"`
2. Use optimized formats (WebP)
3. Configure CDN for faster delivery
4. Preload critical images
5. Use appropriate image dimensions (don't load 4K for thumbnails)

---

## Examples

### Trip Hero with Location Image

```tsx
import { useLocationImage } from '@/hooks/use-location-image';
import { OptimizedImage } from '@/components/optimized-image';

export function TripHero({ destination, country }: Props) {
  const { image, loading } = useLocationImage(destination, country);

  if (loading) return <Skeleton className="h-96" />;

  return (
    <div className="relative h-96 overflow-hidden rounded-lg">
      <OptimizedImage
        src={image.url}
        alt={image.alt}
        width={1200}
        quality={90}
        format="webp"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <h1 className="absolute bottom-8 left-8 text-4xl font-bold text-white">
        {destination}
      </h1>
    </div>
  );
}
```

### Gallery with Location Images

```tsx
import { useLocationGallery } from '@/hooks/use-location-image';
import { OptimizedImage } from '@/components/optimized-image';

export function DestinationGallery({ location }: Props) {
  const { gallery, loading } = useLocationGallery(location);

  if (loading) return <div>Loading gallery...</div>;
  if (gallery.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-4">
      {gallery.map((image, index) => (
        <OptimizedImage
          key={index}
          src={image.url}
          alt={image.alt}
          width={400}
          height={300}
          className="rounded-lg object-cover aspect-video"
        />
      ))}
    </div>
  );
}
```

---

## Migration from Old System

If you have existing images:

1. **Move files** to new structure:
   ```bash
   mv client/src/assets/logo.png client/public/assets/brand/logos/logo-primary-512.png
   ```

2. **Update imports**:
   ```tsx
   // Old
   import logoUrl from "@/assets/logo.png";

   // New
   import { getLogoUrl } from '@/lib/assets';
   const logoUrl = getLogoUrl('primary', 512);
   ```

3. **Update image tags**:
   ```tsx
   // Old
   <img src="/logo.png" alt="Logo" />

   // New
   <OptimizedImage src={getLogoUrl('primary')} alt="Logo" />
   ```

---

## Summary

- ✅ Organized asset structure
- ✅ Dynamic location-based images
- ✅ Automatic image optimization
- ✅ Lazy loading & modern formats
- ✅ CDN support
- ✅ React hooks & components
- ✅ Server-side compression
- ✅ Responsive images

For questions or issues, see `/docs/` or contact the development team.
