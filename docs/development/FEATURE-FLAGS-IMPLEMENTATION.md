# Simple Feature Flags Implementation

**Priority**: Medium
**Time**: 30 minutes
**Benefit**: Safely disable features without redeployment

---

## Quick Implementation

### 1. Create Feature Flags Config

```bash
# Add to .env
FEATURE_AI_ENABLED=true
FEATURE_FILE_UPLOADS_ENABLED=true
FEATURE_STRIPE_ENABLED=true
FEATURE_CHAT_ENABLED=true
FEATURE_PUSH_ENABLED=true
```

### 2. Add Feature Flag Utility

**Create `server/feature-flags.ts`:**

```typescript
import { env } from './env';

type FeatureFlag = {
  name: string;
  enabled: boolean;
  description: string;
};

class FeatureFlags {
  private flags: Map<string, boolean> = new Map();

  constructor() {
    // Initialize from environment variables
    this.flags.set('ai', env.isFeatureEnabled('FEATURE_AI_ENABLED'));
    this.flags.set('fileUploads', env.isFeatureEnabled('FEATURE_FILE_UPLOADS_ENABLED'));
    this.flags.set('stripe', env.isFeatureEnabled('FEATURE_STRIPE_ENABLED'));
    this.flags.set('chat', env.isFeatureEnabled('FEATURE_CHAT_ENABLED'));
    this.flags.set('push', env.isFeatureEnabled('FEATURE_PUSH_ENABLED'));
  }

  isEnabled(flag: string): boolean {
    return this.flags.get(flag) ?? false;
  }

  getAll(): FeatureFlag[] {
    return Array.from(this.flags.entries()).map(([name, enabled]) => ({
      name,
      enabled,
      description: this.getDescription(name),
    }));
  }

  private getDescription(flag: string): string {
    const descriptions: Record<string, string> = {
      ai: 'AI trip generation and Atlas assistant',
      fileUploads: 'Photo and document uploads',
      stripe: 'Billing and subscriptions',
      chat: 'Real-time chat',
      push: 'Push notifications',
    };
    return descriptions[flag] || '';
  }
}

export const featureFlags = new FeatureFlags();
```

### 3. Update env.ts

```typescript
// Add to server/env.ts
isFeatureEnabled(key: string): boolean {
  const value = process.env[key];
  if (value === undefined) return true; // Default enabled
  return value.toLowerCase() === "true" || value === "1";
}
```

### 4. Use in Routes

**Example - Protect AI endpoint:**

```typescript
// In server/routes.ts
import { featureFlags } from './feature-flags';

app.post('/api/trips/:tripId/generate-itinerary', requireAuth, (req, res) => {
  if (!featureFlags.isEnabled('ai')) {
    return res.status(503).json({
      error: 'AI features temporarily disabled',
      code: 'FEATURE_DISABLED',
    });
  }

  // Normal AI generation code...
});
```

### 5. Add Admin Endpoint to Check Flags

```typescript
// Add to server/routes.ts
app.get('/api/admin/feature-flags', requireAuth, (req, res) => {
  const user = await storage.getUser(req.user!.userId);

  if (!env.isAdmin(user.email)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.json({ flags: featureFlags.getAll() });
});
```

---

## Usage

### Disable a Feature in Emergency

```bash
# Edit .env
FEATURE_AI_ENABLED=false

# Restart app
docker-compose -f docker-compose.prod.yml restart app

# AI endpoints now return 503
```

### Check Feature Status

```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://tripsync.app/api/admin/feature-flags
```

---

## Advanced: Database-Backed Flags (Future)

For v1.1+, consider:

- Store flags in database
- Per-user feature flags (gradual rollout)
- Percentage rollouts (10% of users)
- Use LaunchDarkly or Flagsmith

---

## Don't Over-Engineer

For MVP launch, environment variable flags are sufficient. You can:

- Disable features without code changes
- Re-enable with just a restart
- Control via .env file

This is 80% of what you need for launch safety.
