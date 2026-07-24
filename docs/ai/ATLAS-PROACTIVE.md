# Atlas Proactive System

## Overview

Atlas is Trip-Sync's intelligent AI assistant that proactively monitors your trips and alerts you to issues before they become problems. Unlike reactive chatbots that only respond when asked, Atlas watches for budget overruns, vote deadlocks, and deadline urgency - then reaches out with helpful suggestions.

**Status**: ✅ Production-ready (Task 11 complete)

## Key Features

### 1. Budget Overrun Alerts 💰

**Triggers when**: Total expenses exceed 110% of trip budget

**Alert example**:

```
💰 Budget Alert

Your trip is $250.00 over budget (112% of planned budget).

Total spent: $2,750.00 / $2,500.00

[Optimize Budget] [Dismiss]
```

**Actions**:

- **Optimize Budget**: Triggers AI-powered budget optimization suggestions
- **Dismiss**: Hide this alert

**Frequency**: Checks every 15 minutes, alerts once per 24 hours per trip

### 2. Vote Deadlock Detection 🗳️

**Triggers when**: Itinerary items have tied or closely split votes for >24 hours

**Criteria**:

- Tied votes (e.g., 5 upvotes, 5 downvotes) with ≥4 total votes
- Controversial votes (e.g., 7 vs 6) with ≥6 total votes

**Alert example**:

```
🗳️ Vote Deadlock

Your group has been stuck on "Snorkeling Tour" for 2 days.
Votes are tied (5 👍 vs 5 👎).

I can suggest a fair compromise - want me to help?

[Suggest Compromise] [Let Group Decide]
```

**Actions**:

- **Suggest Compromise**: AI generates compromise suggestions (e.g., "Morning snorkeling + afternoon beach time")
- **Let Group Decide**: Dismiss and let group resolve naturally

**Frequency**: Checks every 15 minutes, alerts once per 24 hours per item

### 3. Deadline Urgency Alerts ⏰

**Triggers when**: Trip starts in <7 days and completion is <50%

**Completion calculation**:

- 40% weight: Itinerary items per day (2 items/day = 100%)
- 30% weight: Member confirmations (RSVPs)
- 30% weight: Budget planning started (expenses tracked)

**Alert example**:

```
⏰ Trip Deadline Approaching

Your trip starts in 4 days and is only 35% complete!

📋 Itinerary: 8 items planned
👥 RSVPs: 4/6 confirmed
💰 Budget: Not started

[Help Me Finish] [I'm On It]
```

**Actions**:

- **Help Me Finish**: Opens Atlas chat with contextual suggestions
- **I'm On It**: Dismiss alert

**Frequency**: Checks every 15 minutes, alerts once per 48 hours per trip

## Architecture

### Background Monitoring

```typescript
// Runs every 15 minutes
setInterval(
  () => {
    // Check all active trips
    for (const trip of activeTrips) {
      checkBudgetOverrun(trip.id);
      checkVoteDeadlocks(trip.id);
      checkDeadlineUrgency(trip.id);
    }
  },
  15 * 60 * 1000
);
```

### Data Flow

```
┌─────────────────────┐
│  Background Job     │
│  (Every 15 minutes) │
└──────────┬──────────┘
           │
           ├──> Check Budget Overrun
           ├──> Check Vote Deadlocks
           └──> Check Deadline Urgency
                      │
                      ├──> Create Notification
                      │         │
                      │         └──> Store in-memory
                      │                    │
                      │                    └──> GET /api/trips/:id/atlas/notifications
                      │                              │
                      │                              └──> Frontend displays alert
                      │
                      └──> Skip if recent alert exists
```

### Storage

**Current**: In-memory Map (development-friendly)
**Future**: Database table for persistence across server restarts

```typescript
interface AtlasNotification {
  id: string;
  tripId: string;
  userId?: string | null; // null = show to all trip members
  type: 'budget_overrun' | 'vote_deadlock' | 'deadline_urgency';
  title: string;
  message: string;
  actions: Array<{ label: string; action: string; meta?: any }>;
  status: 'unread' | 'read' | 'dismissed' | 'snoozed';
  snoozedUntil?: Date | null;
  metadata?: any;
  createdAt: Date;
}
```

## API Endpoints

### Get Notifications

```http
GET /api/trips/:tripId/atlas/notifications
```

**Authorization**: Required (JWT token)

**Response**:

```json
{
  "notifications": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "tripId": "trip-123",
      "type": "budget_overrun",
      "title": "💰 Budget Alert",
      "message": "Your trip is $250.00 over budget...",
      "actions": [
        {
          "label": "Optimize Budget",
          "action": "optimize_budget",
          "meta": { "tripId": "trip-123" }
        },
        {
          "label": "Dismiss",
          "action": "dismiss"
        }
      ],
      "status": "unread",
      "metadata": {
        "totalExpenses": 2750,
        "totalBudget": 2500,
        "overAmount": 250,
        "budgetPercentage": 110
      },
      "createdAt": "2026-05-14T12:00:00Z"
    }
  ]
}
```

### Mark as Read

```http
POST /api/atlas/notifications/:notificationId/read
```

**Response**: `{ "success": true }`

### Dismiss Notification

```http
POST /api/atlas/notifications/:notificationId/dismiss
```

**Response**: `{ "success": true }`

### Snooze Notification

```http
POST /api/atlas/notifications/:notificationId/snooze
Content-Type: application/json

{
  "duration": 86400000  // milliseconds (24 hours default)
}
```

**Response**: `{ "success": true }`

## Integration Guide

### Frontend Integration

**1. Poll for notifications** (recommended: every 30 seconds on active trip pages)

```typescript
useEffect(() => {
  const fetchNotifications = async () => {
    const res = await fetch(`/api/trips/${tripId}/atlas/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setNotifications(data.notifications);
  };

  fetchNotifications();
  const interval = setInterval(fetchNotifications, 30000); // 30 seconds

  return () => clearInterval(interval);
}, [tripId, token]);
```

**2. Display notification UI** (floating badge, toast, or modal)

```tsx
{
  notifications.length > 0 && (
    <div className="atlas-notification-badge">
      <span className="count">{notifications.length}</span>
      <div className="dropdown">
        {notifications.map((notif) => (
          <div key={notif.id} className="notification-card">
            <h4>{notif.title}</h4>
            <p>{notif.message}</p>
            <div className="actions">
              {notif.actions.map((action) => (
                <button key={action.label} onClick={() => handleAction(notif.id, action)}>
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**3. Handle actions**

```typescript
const handleAction = async (notificationId: string, action: any) => {
  if (action.action === 'dismiss') {
    await fetch(`/api/atlas/notifications/${notificationId}/dismiss`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  } else if (action.action === 'optimize_budget') {
    // Trigger budget optimization flow
    openBudgetOptimizationModal();
    await markAsRead(notificationId);
  } else if (action.action === 'resolve_conflict') {
    // Open conflict resolution for specific item
    openConflictResolution(action.meta.itemId);
    await markAsRead(notificationId);
  } else if (action.action === 'help_complete') {
    // Open Atlas chat with contextual help
    openAtlasChat();
    await markAsRead(notificationId);
  }
};
```

## Configuration

### Monitoring Frequency

Edit `server/atlas-proactive-service.ts`:

```typescript
// Default: 15 minutes
this.monitoringInterval = setInterval(
  async () => {
    await this.checkAllTrips();
  },
  15 * 60 * 1000
); // Change this value
```

### Trigger Thresholds

**Budget threshold** (default: 110%):

```typescript
if (budgetPercentage > 110) {
  // Change this value
  // Create notification
}
```

**Vote deadlock duration** (default: 24 hours):

```typescript
if (itemAge > 24 * 60 * 60 * 1000) {
  // Change this value
  // Create notification
}
```

**Deadline urgency window** (default: 7 days):

```typescript
if (daysUntilStart > 7 || daysUntilStart < 0) return; // Change 7 to desired value
```

**Completion threshold** (default: 50%):

```typescript
if (completionPercentage < 50) {
  // Change this value
  // Create notification
}
```

### Alert Cooldown

Prevent alert spam by configuring cooldown periods:

```typescript
const existingNotification = this.findRecentNotification(
  tripId,
  'budget_overrun',
  24 * 60 * 60 * 1000 // 24 hours - change this value
);
```

## Monitoring & Debugging

### Server Logs

Atlas logs events with `appLogger.debug()`:

```bash
# Enable debug logging
LOG_LEVEL=debug npm start
```

**Log examples**:

```
[DEBUG] Starting Atlas proactive monitoring
[DEBUG] Atlas checking trips { count: 5 }
[DEBUG] Budget overrun alert created { tripId: 'abc', overAmount: 250, budgetPercentage: 110 }
[DEBUG] Vote deadlock alert created { tripId: 'abc', itemId: 'xyz', upvotes: 5, downvotes: 5 }
[DEBUG] Atlas check complete { trips: 5, duration: 127ms }
```

### Statistics Endpoint

Check Atlas statistics:

```typescript
import { atlasProactive } from './atlas-proactive-service';

const stats = await atlasProactive.getStats();
console.log(stats);
// {
//   total: 42,
//   byType: {
//     budget_overrun: 15,
//     vote_deadlock: 18,
//     deadline_urgency: 9
//   },
//   byStatus: {
//     unread: 12,
//     read: 18,
//     dismissed: 10,
//     snoozed: 2
//   }
// }
```

### Manual Triggering (Testing)

```typescript
// Force check a specific trip (bypass 15-minute interval)
import { atlasProactive } from './atlas-proactive-service';

// Access private method via reflection (testing only)
const service = atlasProactive as any;
await service.checkTrip('trip-123');
```

## Performance Considerations

### Database Queries

Each check cycle runs these queries:

- `getTrip(tripId)` - 1 query per trip
- `getExpensesByTrip(tripId)` - 1 query per trip
- `getItineraryItems(tripId)` - 1 query per trip
- `getVotesByItem(itemId)` - N queries (where N = number of items)
- `getTripMembers(tripId)` - 1 query per trip

**Estimated load** (100 active trips):

- Budget check: 200 queries (2 per trip)
- Vote check: 200-500 queries (varies by itinerary size)
- Deadline check: 300 queries (3 per trip)
- **Total: ~700-1000 queries every 15 minutes** (< 1 query/second on average)

### Optimization Strategies

1. **Add indexes** on frequently queried columns:

   ```sql
   CREATE INDEX idx_trips_status ON trips(status);
   CREATE INDEX idx_expenses_trip_id ON expenses(trip_id);
   CREATE INDEX idx_votes_item_id ON votes(item_id);
   ```

2. **Cache trip data** (implemented in Task 9):
   - User cache: 5 minutes
   - Trip cache: 2 minutes
   - Trip members cache: 2 minutes

3. **Batch queries** (future optimization):

   ```typescript
   // Instead of N individual queries
   const trips = await Promise.all(tripIds.map((id) => getTrip(id)));

   // Use bulk fetch
   const trips = await getTrips({ ids: tripIds });
   ```

4. **Skip inactive trips**:
   - Only check trips with `status = 'planning' or 'active'`
   - Skip trips with `startDate` in the past

## Alert Fatigue Prevention

### Built-in Safeguards

1. **Cooldown periods**: Same alert won't fire twice within 24-48 hours
2. **Snooze functionality**: Users can temporarily disable alerts
3. **Dismiss permanently**: Users can hide alerts they don't want
4. **Item-specific tracking**: Vote deadlock alerts track individual items (no spam if multiple items are deadlocked)

### Best Practices

1. **Don't over-alert**:
   - Resist adding new triggers without user research
   - Test with real trips before deploying

2. **Prioritize alerts**:
   - Critical: Budget overruns (financial impact)
   - Important: Deadline urgency (time-sensitive)
   - Moderate: Vote deadlocks (can resolve naturally)

3. **Provide value**:
   - Every alert must have a clear action
   - AI suggestions should save time, not just notify

## Future Enhancements

### Planned (6-12 months)

1. **Database persistence**
   - Migrate from in-memory to PostgreSQL
   - Survive server restarts

2. **Smart frequency adjustment**
   - Increase check frequency as trip start date approaches
   - Reduce frequency for trips with low activity

3. **User preferences**
   - "Don't alert me about budget until 120%"
   - "Only urgent notifications"
   - Per-trip notification settings

4. **Action buttons**
   - "Fix this for me" → Atlas automatically resolves issue
   - Example: Budget overrun → Atlas suggests removing lowest-voted activity

5. **Push notifications**
   - Web push (implemented separately)
   - Email digests for critical alerts

### Experimental Ideas

1. **Confusion signal detection**
   - Track back-button spam, time-on-page
   - Alert: "You seem stuck on Day 3 itinerary. Need help?"

2. **Collaborative suggestions**
   - "3 members want Mexican food. Want me to add a restaurant?"
   - Proactive recommendations based on member preferences

3. **Timeline conflict warnings**
   - "Your flight lands at 4pm but dinner reservation is at 5pm. That's tight!"

4. **Weather-based suggestions**
   - "Rain forecast for Day 2. Want indoor activity suggestions?"

## Troubleshooting

### Notifications Not Appearing

**Check 1**: Is Atlas monitoring running?

```bash
# Look for this log on server startup
[DEBUG] Starting Atlas proactive monitoring
```

**Check 2**: Are trips active?

```typescript
// Trip must have status 'planning' or 'active'
const trip = await storage.getTrip(tripId);
console.log(trip.status); // Should be 'planning' or 'active'
```

**Check 3**: Do thresholds match?

- Budget: Is total expenses > 110% of budget?
- Vote: Are votes tied for >24 hours?
- Deadline: Is trip <7 days away and <50% complete?

**Check 4**: Was notification recently dismissed?

```typescript
const stats = await atlasProactive.getStats();
console.log(stats.byStatus); // Check 'dismissed' count
```

### Notifications Appearing Too Often

**Solution 1**: Increase cooldown period

```typescript
// Change from 24 hours to 48 hours
const existingNotification = this.findRecentNotification(
  tripId,
  'budget_overrun',
  48 * 60 * 60 * 1000 // 48 hours
);
```

**Solution 2**: Adjust thresholds

```typescript
// Budget: Only alert at 120% instead of 110%
if (budgetPercentage > 120) {
  // Create notification
}
```

### Performance Issues

**Check 1**: How many trips are being checked?

```bash
# Look for this log every 15 minutes
[DEBUG] Atlas checking trips { count: X }
```

**Check 2**: Query duration

```bash
# Look for check duration
[DEBUG] Atlas check complete { trips: 100, duration: 2000ms }
```

**If >5 seconds**: Add database indexes or reduce check frequency

---

**Last Updated**: 2026-05-14
**Version**: 1.0
**Status**: ✅ Production Ready
