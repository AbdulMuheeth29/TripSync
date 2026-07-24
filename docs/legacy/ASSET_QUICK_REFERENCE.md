# Asset Management - Quick Reference

## 🚀 Quick Start

### Add a Brand Logo

```bash
# 1. Add file to directory
cp my-logo.png client/public/assets/brand/logos/logo-primary-512.png

# 2. Use in code
import { getLogoUrl } from '@/lib/assets';
<img src={getLogoUrl('primary', 512)} alt="Logo" />
```

### Use Location-Based Images

```tsx
import { LocationImage } from '@/components/optimized-image';

<LocationImage location="Paris" countryCode="FR" width={1200} className="rounded-lg" />;
```

### Optimize Any Image

```tsx
import { OptimizedImage } from '@/components/optimized-image';

<OptimizedImage
  src="https://example.com/photo.jpg"
  alt="Photo"
  width={800}
  quality={85}
  format="webp"
/>;
```

---

## 📁 Directory Structure

```
client/public/assets/
├── brand/
│   ├── logos/          # Brand logos
│   ├── videos/         # Marketing videos
│   └── icons/          # App icons
├── locations/
│   ├── cities/         # City images
│   └── countries/      # Country images
└── ui/
    └── illustrations/  # UI graphics
```

---

## 🎯 Common Tasks

### Task 1: Add New Destination Images

```tsx
import { addLocationImages } from '@/lib/assets';

addLocationImages('Bali', {
  hero: {
    url: 'https://example.com/bali.jpg',
    alt: 'Bali rice terraces',
  },
  gallery: [
    { url: 'https://example.com/bali-1.jpg', alt: 'Temple' },
    { url: 'https://example.com/bali-2.jpg', alt: 'Beach' },
  ],
});
```

### Task 2: Get Image for Any Location

```tsx
import { useLocationImage } from '@/hooks/use-location-image';

function MyComponent({ destination }) {
  const { image, loading } = useLocationImage(destination);

  return <img src={image?.url} alt={image?.alt} />;
}
```

### Task 3: Optimize Upload Images (Server)

```typescript
// Add to your upload route
import { imageOptimizationMiddleware } from './image-optimizer';

router.post(
  '/api/upload',
  upload.single('file'),
  imageOptimizationMiddleware({ quality: 85 }),
  uploadHandler
);
```

### Task 4: Preload Critical Images

```tsx
import { preloadImages } from '@/lib/assets';

useEffect(() => {
  preloadImages(['/assets/brand/logos/logo.png', '/assets/ui/hero-bg.jpg']);
}, []);
```

---

## 🛠 API Cheat Sheet

### Functions

```typescript
// Asset URLs
getAssetUrl(path); // Get any asset URL
getBrandAsset(path); // Get brand asset
getLogoUrl(variant, size); // Get logo

// Location Images
getLocationImage(location, country); // Get hero image
getLocationGallery(location); // Get gallery array
getCategoryImage(category); // Get category image

// Optimization
getOptimizedImageUrl(url, options); // Optimize URL
preloadImage(url); // Preload single
preloadImages(urls); // Preload multiple
```

### Hooks

```typescript
useLocationImage(location, country); // Returns: { image, loading, error }
useLocationGallery(location); // Returns: { gallery, loading }
useCategoryImage(category); // Returns: { image, loading }
```

### Components

```tsx
<OptimizedImage src={} alt={} width={} quality={} format={} />
<LocationImage location={} countryCode={} />
<ResponsiveImage src={} srcSet={{}} alt={} />
```

---

## 📊 File Size Limits

| Type      | Max Size | Format    |
| --------- | -------- | --------- |
| Logo      | 50KB     | PNG/SVG   |
| Hero      | 500KB    | WebP/JPEG |
| Thumbnail | 50KB     | WebP      |
| Video     | 10MB     | WebM/MP4  |
| Upload    | 25MB     | Any image |

---

## 🎨 Supported Destinations

**Cities:** New York, Paris, Tokyo, London, Dubai, Barcelona, Rome, Bali, Santorini, Maldives

**Categories:** beach, mountain, city, nature, adventure, culture

**Add More:** Edit `/client/src/lib/assets.ts` → `DESTINATION_IMAGES`

---

## ⚡ Performance Tips

1. **Always use WebP** for photos
2. **Lazy load** everything below fold
3. **Preload** hero images
4. **Compress** to 85% quality
5. **Use srcset** for responsive
6. **Enable CDN** in production

---

## 🔧 Installation

### Required

Already installed ✅

### Optional (for server optimization)

```bash
npm install sharp
```

Then images will auto-optimize on upload!

---

## 🐛 Troubleshooting

**Images not loading?**

- Check path: `/assets/` not `/public/assets/`
- Verify file exists
- Check browser console

**Optimization not working?**

- Install Sharp: `npm install sharp`
- Check server logs
- Restart server

**Slow loading?**

- Use WebP format
- Set proper width/height
- Enable lazy loading
- Configure CDN

---

## 📝 Examples

### Hero Section

```tsx
<LocationImage
  location={trip.destination}
  countryCode={trip.country}
  className="w-full h-96 object-cover"
/>
```

### Gallery

```tsx
const { gallery } = useLocationGallery(destination);

{
  gallery.map((img) => <OptimizedImage key={img.url} src={img.url} alt={img.alt} />);
}
```

### Logo

```tsx
<img src={getLogoUrl('white', 512)} alt="TripSync" />
```

---

For full documentation, see `/docs/ASSET_MANAGEMENT_GUIDE.md`
