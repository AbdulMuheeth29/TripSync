# Admin Metrics Dashboard

Separate admin module for tracking app metrics (Web, iOS, Android).

## Access

- **URL:** `/admin/metrics` (must be signed in)
- **Auth:** Set `ADMIN_EMAILS` in your server environment (comma-separated emails). Only these users can load metrics.

## Setup

```bash
# .env or environment
ADMIN_EMAILS=your@email.com
```

## API

- `GET /api/admin/metrics?userId=<id>&platform=web|ios|android`
- Returns 403 if the user's email is not in `ADMIN_EMAILS`

## Extending

- Platform-specific analytics (GA, Mixpanel, etc.) can be wired in `admin-routes.ts` via `platformMetrics`.
- Client toggle already supports Web, iOS, Android; backend returns aggregate data until platform sources are added.
