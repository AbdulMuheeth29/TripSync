# Database Transactions Guide

## Overview

Database transactions ensure that multiple database operations either all succeed or all fail together. This prevents partial updates that could leave your data in an inconsistent state.

## When to Use Transactions

Use transactions when you need to:

1. **Create parent and child records together**
   - Example: Trip + Members, Itinerary Item + Votes

2. **Update multiple related tables**
   - Example: User subscription + Subscription record + Stripe data

3. **Delete records with dependencies**
   - Example: Trip cascade delete (trip + members + items + expenses)

4. **Transfer data between records**
   - Example: Move expense from one trip to another

5. **Bulk operations that must be atomic**
   - Example: Settle all expenses for a trip

## Basic Usage

```typescript
import { withTransaction } from './transaction';

// Simple transaction
const result = await withTransaction(async (tx) => {
  await tx.insert(trips).values(tripData);
  await tx.insert(tripMembers).values(memberData);
  return tripData.id;
});
```

## Transaction Patterns

### 1. Create Trip with Members

```typescript
import { createTripWithMembers } from './transaction';

const tripId = await createTripWithMembers(
  {
    id: uuid(),
    name: 'Tokyo Adventure',
    organizerId: userId,
    // ... other trip fields
  },
  [
    { id: uuid(), tripId, userId: user1, role: 'organizer' },
    { id: uuid(), tripId, userId: user2, role: 'member' },
  ]
);
```

**Why:** If member insertion fails, the trip shouldn't exist either.

### 2. Delete Trip Cascade

```typescript
import { deleteTripCascade } from './transaction';

await deleteTripCascade(tripId);
```

**Why:** Deleting a trip should remove all related data atomically. Partial deletion would leave orphaned records.

### 3. Update Subscription

```typescript
import { updateUserSubscription } from './transaction';

await updateUserSubscription(
  userId,
  {
    id: subId,
    tier: 'pro',
    status: 'active',
    stripeSubscriptionId: 'sub_xxx',
  },
  {
    subscriptionTier: 'pro',
    subscriptionExpiresAt: new Date('2024-12-31'),
    stripeCustomerId: 'cus_xxx',
  }
);
```

**Why:** User tier and subscription record must be in sync.

### 4. Create Itinerary Item with Initial Votes

```typescript
import { createItineraryItemWithVotes } from './transaction';

const itemId = await createItineraryItemWithVotes(
  {
    id: uuid(),
    tripId,
    name: 'Tokyo Tower',
    // ... other item fields
  },
  [
    { id: uuid(), itemId, userId: user1, voteType: 'upvote' },
    { id: uuid(), itemId, userId: user2, voteType: 'upvote' },
  ]
);
```

**Why:** Initial votes should be created with the item atomically.

### 5. Custom Transaction

```typescript
import { withTransaction } from './transaction';

const result = await withTransaction(async (tx) => {
  // Multiple operations that must succeed together
  const [trip] = await tx.insert(trips).values(tripData).returning();

  await tx.insert(tripMembers).values([
    { tripId: trip.id, userId: user1, role: 'organizer' },
    { tripId: trip.id, userId: user2, role: 'member' },
  ]);

  await tx.insert(memberPreferences).values([
    { tripId: trip.id, userId: user1, budget: 'mid' },
    { tripId: trip.id, userId: user2, budget: 'low' },
  ]);

  return trip;
});
```

## Error Handling

Transactions automatically rollback on error:

```typescript
try {
  await withTransaction(async (tx) => {
    await tx.insert(trips).values(tripData);

    // This error will rollback the trip insertion
    throw new Error('Something went wrong');

    await tx.insert(tripMembers).values(memberData); // Won't execute
  });
} catch (error) {
  // Trip was NOT created
  console.error('Transaction failed:', error);
}
```

## Real-World Examples

### Example 1: Payment Processing

```typescript
async function processPayment(userId: string, amount: number) {
  return withTransaction(async (tx) => {
    // 1. Charge Stripe
    const charge = await stripe.charges.create({ amount, customer: userId });

    // 2. Update user subscription
    await tx
      .update(users)
      .set({ subscriptionTier: 'pro', subscriptionExpiresAt: newDate })
      .where(eq(users.id, userId));

    // 3. Record payment
    await tx.insert(payments).values({
      userId,
      amount,
      stripeChargeId: charge.id,
      status: 'succeeded',
    });

    return charge;
  });
}
```

If Stripe succeeds but database fails, the transaction rolls back and you can refund the charge.

### Example 2: Trip Import

```typescript
async function importTrip(importData: any) {
  return withTransaction(async (tx) => {
    // Create trip
    await tx.insert(trips).values(importData.trip);

    // Import all members
    await tx.insert(tripMembers).values(importData.members);

    // Import all itinerary items
    await tx.insert(itineraryItems).values(importData.items);

    // Import all expenses
    await tx.insert(expenses).values(importData.expenses);

    // Import all photos
    await tx.insert(photos).values(importData.photos);

    return importData.trip.id;
  });
}
```

Either everything imports successfully, or nothing imports.

### Example 3: Expense Settlement

```typescript
async function settleAllExpenses(tripId: string) {
  return withTransaction(async (tx) => {
    // Calculate who owes whom
    const settlements = await calculateSettlements(tripId);

    // Create settlement records for all transfers
    for (const settlement of settlements) {
      await tx.insert(expenseSettlements).values({
        fromUserId: settlement.from,
        toUserId: settlement.to,
        amount: settlement.amount,
        tripId,
        status: 'pending',
      });
    }

    // Mark all expenses as settled
    await tx.update(expenses).set({ settled: true }).where(eq(expenses.tripId, tripId));

    return settlements;
  });
}
```

All expenses marked as settled, or none are.

## Common Mistakes to Avoid

### ❌ Forgetting to await

```typescript
// Wrong
withTransaction(async (tx) => {
  tx.insert(trips).values(tripData); // Missing await!
  return;
});
```

### ❌ External API calls in transactions

```typescript
// Wrong - don't call external APIs inside transactions
withTransaction(async (tx) => {
  await tx.insert(trips).values(tripData);
  await stripe.charges.create({ ... }); // Don't do this!
  await tx.insert(payments).values(paymentData);
});

// Right - call external APIs first
const charge = await stripe.charges.create({ ... });
await withTransaction(async (tx) => {
  await tx.insert(trips).values(tripData);
  await tx.insert(payments).values({ stripeChargeId: charge.id });
});
```

### ❌ Mixing transaction and non-transaction operations

```typescript
// Wrong
await withTransaction(async (tx) => {
  await tx.insert(trips).values(tripData);
  await storage.createMember(memberData); // Uses different connection!
});

// Right
await withTransaction(async (tx) => {
  await tx.insert(trips).values(tripData);
  await tx.insert(tripMembers).values(memberData); // Same connection
});
```

## Performance Considerations

### Keep Transactions Short

```typescript
// Bad - transaction held too long
await withTransaction(async (tx) => {
  await tx.insert(trips).values(tripData);

  await generateAIItinerary(); // Slow AI call!
  await sendWelcomeEmail(); // Slow email send!

  await tx.insert(itineraryItems).values(items);
});

// Good - minimize transaction time
const tripId = await withTransaction(async (tx) => {
  await tx.insert(trips).values(tripData);
  return tripData.id;
});

// Do slow operations outside transaction
await generateAIItinerary(tripId);
await sendWelcomeEmail(tripId);
```

### Avoid Nested Transactions

Drizzle doesn't support nested transactions. If you need nested logic, flatten it:

```typescript
// Instead of nesting, combine operations in one transaction
await withTransaction(async (tx) => {
  await tx.insert(trips).values(tripData);
  await tx.insert(tripMembers).values(memberData);
  await tx.insert(memberPreferences).values(prefData);
});
```

## Testing Transactions

### Unit Tests

```typescript
describe('createTripWithMembers', () => {
  it('should create trip and members atomically', async () => {
    const tripId = await createTripWithMembers(tripData, memberData);

    // Verify both exist
    const trip = await storage.getTrip(tripId);
    const members = await storage.getTripMembers(tripId);

    expect(trip).toBeDefined();
    expect(members).toHaveLength(2);
  });

  it('should rollback on member insertion failure', async () => {
    // This test requires test database
    await expect(createTripWithMembers(tripData, invalidMemberData)).rejects.toThrow();

    // Verify trip was not created
    const trip = await storage.getTrip(tripData.id);
    expect(trip).toBeNull();
  });
});
```

## Migration Guide

### Converting Existing Code

Before (no transaction):

```typescript
async function createTrip(tripData, memberData) {
  const trip = await storage.createTrip(tripData);
  await storage.addMember(memberData);
  return trip.id;
}
```

After (with transaction):

```typescript
async function createTrip(tripData, memberData) {
  return createTripWithMembers(tripData, memberData);
}
```

## Monitoring

Transactions are automatically logged:

```json
{
  "level": "debug",
  "message": "Transaction started",
  "timestamp": "2024-06-01T12:00:00Z"
}

{
  "level": "debug",
  "message": "Transaction committed",
  "timestamp": "2024-06-01T12:00:01Z"
}
```

Failed transactions are logged as errors:

```json
{
  "level": "error",
  "message": "Transaction rolled back",
  "error": "Foreign key constraint violation",
  "context": "transaction_rollback"
}
```

## Best Practices Checklist

- ✅ Use transactions for multi-table operations
- ✅ Keep transactions as short as possible
- ✅ Avoid external API calls inside transactions
- ✅ Always await database operations
- ✅ Use typed transaction patterns from `transaction.ts`
- ✅ Test rollback scenarios
- ✅ Log transaction start/commit/rollback
- ✅ Handle errors gracefully
- ❌ Don't nest transactions
- ❌ Don't do long-running work in transactions
- ❌ Don't mix transactional and non-transactional operations

---

**Last Updated**: 2026-05-11
