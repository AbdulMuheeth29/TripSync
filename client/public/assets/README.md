# Static Assets Directory

This directory contains all static assets for Trip-Sync.

## Directory Structure

```
assets/
├── brand/          # Brand assets (logos, videos, marketing)
│   ├── logos/      # Logo variations
│   ├── videos/     # Brand videos, demos
│   ├── icons/      # App icons, favicons
│   └── marketing/  # Marketing materials
│
├── locations/      # Location-based dynamic images
│   ├── cities/     # City-specific images
│   ├── countries/  # Country-specific images
│   └── landmarks/  # Famous landmarks
│
├── destinations/   # Popular destination images
│   ├── beaches/    # Beach destinations
│   ├── mountains/  # Mountain destinations
│   ├── cities/     # Urban destinations
│   └── nature/     # Nature/outdoor destinations
│
└── ui/            # UI elements and illustrations
    ├── illustrations/
    ├── icons/
    └── backgrounds/

```

## File Naming Conventions

### Brand Assets
- **Logos**: `logo-{variant}-{size}.{ext}`
  - Example: `logo-primary-512.png`, `logo-white-1024.svg`
- **Videos**: `{name}-{resolution}.{ext}`
  - Example: `demo-1080p.mp4`, `hero-4k.webm`

### Location Assets
- **Cities**: `{city-slug}-{number}.{ext}`
  - Example: `new-york-01.jpg`, `tokyo-skyline.jpg`
- **Countries**: `{country-code}-{descriptor}.{ext}`
  - Example: `us-landscape.jpg`, `jp-culture.jpg`

### Optimization Guidelines

- **Images**: Use WebP format with JPEG fallback
- **Videos**: Use WebM format with MP4 fallback
- **Size limits**:
  - Icons: < 50KB
  - Images: < 500KB (compress to 80% quality)
  - Videos: < 10MB for web playback

## Usage

Static assets in this directory are served from `/assets/` path.

```tsx
// Import from public directory
<img src="/assets/brand/logos/logo-primary-512.png" alt="Logo" />

// Or use asset helper
import { getAssetUrl } from '@/lib/assets';
<img src={getAssetUrl('brand/logos/logo-primary-512.png')} alt="Logo" />
```
