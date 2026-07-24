# TripSync API Documentation

**Version**: 1.0.0
**Base URL**: `https://tripsync.app/api` (or `http://localhost:3000/api` for development)
**Last Updated**: 2026-05-15

---

## Table of Contents

- [Authentication](#authentication)
- [Health & Status](#health--status)
- [User](#user)
- [Trips](#trips)
- [Itinerary](#itinerary)
- [Expenses](#expenses)
- [Members & Invites](#members--invites)
- [Chat](#chat)
- [Files](#files)
- [Polls & Voting](#polls--voting)
- [Packing List](#packing-list)
- [Transportation](#transportation)
- [Documents](#documents)
- [Emergency Contacts](#emergency-contacts)
- [Mood Board](#mood-board)
- [AI Features](#ai-features)
- [Push Notifications](#push-notifications)
- [Analytics](#analytics)
- [Stripe & Billing](#stripe--billing)
- [Error Handling](#error-handling)

---

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### POST `/auth/register`

Register a new user account.

**Rate Limit**: 5 requests per 15 minutes per IP

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "username": "john_doe"
}
```

**Response 201:**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "john_doe",
    "subscriptionTier": "free",
    "createdAt": "2026-05-15T12:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**

- `400`: Missing required fields or invalid format
- `409`: Email already registered
- `429`: Rate limit exceeded

---

### POST `/auth/login`

Log in to an existing account.

**Rate Limit**: 10 requests per 15 minutes per IP

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response 200:**

```json
{
  "user": {
    /* user object */
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**

- `400`: Missing credentials
- `401`: Invalid credentials
- `429`: Rate limit exceeded

---

### POST `/auth/logout`

🔒 **Requires Authentication**

Log out and blacklist current token.

**Response 200:**

```json
{
  "message": "Logged out successfully"
}
```

---

### POST `/auth/revoke-all-sessions`

🔒 **Requires Authentication**

Invalidate all tokens for the user (logout everywhere).

**Response 200:**

```json
{
  "message": "All sessions revoked"
}
```

---

### GET `/auth/me`

🔒 **Requires Authentication**

Get current user profile.

**Response 200:**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "john_doe",
  "subscriptionTier": "pro",
  "subscriptionExpiresAt": "2027-01-01T00:00:00.000Z",
  "createdAt": "2026-05-15T12:00:00.000Z"
}
```

---

### POST `/auth/forgot-password`

Request a password reset email.

**Rate Limit**: 5 requests per hour per IP

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response 200:**

```json
{
  "message": "Password reset email sent"
}
```

**Note**: Always returns success even if email doesn't exist (security best practice).

---

### POST `/auth/reset-password`

Reset password using token from email.

**Rate Limit**: 5 requests per 15 minutes per IP

**Request Body:**

```json
{
  "token": "reset-token-from-email",
  "newPassword": "newSecurePassword123"
}
```

**Response 200:**

```json
{
  "message": "Password reset successful"
}
```

**Errors:**

- `400`: Invalid or expired token
- `429`: Rate limit exceeded

---

### GET `/auth/validate-reset-token/:token`

Validate a password reset token before showing reset form.

**Response 200:**

```json
{
  "valid": true
}
```

**Response 400:**

```json
{
  "valid": false,
  "error": "Token expired or invalid"
}
```

---

## Health & Status

### GET `/health`

Public health check endpoint.

**Query Parameters:**

- `detailed` (optional): Set to `true` for detailed service status

**Response 200 (Basic):**

```json
{
  "ok": true,
  "storage": "pg"
}
```

**Response 200 (Detailed):**

```json
{
  "ok": true,
  "storage": "pg",
  "timestamp": "2026-05-15T12:00:00.000Z",
  "uptime": 123456,
  "services": {
    "database": { "status": "ok" },
    "redis": { "status": "ok" },
    "storage": { "status": "ok" },
    "email": { "status": "ok" },
    "sentry": { "status": "unavailable" },
    "stripe": { "status": "unavailable" },
    "ai": { "status": "ok" }
  }
}
```

---

## User

### GET `/subscription/status`

🔒 **Requires Authentication**

Get current user's subscription details.

**Response 200:**

```json
{
  "tier": "pro",
  "expiresAt": "2027-01-01T00:00:00.000Z",
  "limits": {
    "maxTrips": -1,
    "maxMembersPerTrip": 25,
    "aiGenerationsPerMonth": 100
  }
}
```

---

### GET `/users/:userId/insights`

🔒 **Requires Authentication**

Get AI-powered travel insights for a user.

**Response 200:**

```json
{
  "totalTrips": 12,
  "favoriteDestinations": ["Paris", "Tokyo", "New York"],
  "travelStyle": "adventure",
  "preferences": {
    "budget": "medium",
    "accommodation": "hotel"
  }
}
```

---

## Trips

### GET `/trips`

🔒 **Requires Authentication**

List all trips for the current user.

**Query Parameters:**

- `status` (optional): `upcoming` | `ongoing` | `past` | `all` (default: `all`)
- `limit` (optional): Max results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response 200:**

```json
{
  "trips": [
    {
      "id": "trip-uuid",
      "destination": "Paris, France",
      "startDate": "2026-07-01",
      "endDate": "2026-07-07",
      "status": "upcoming",
      "memberCount": 4,
      "role": "organizer",
      "coverPhoto": "https://...",
      "createdAt": "2026-05-15T12:00:00.000Z"
    }
  ],
  "total": 12,
  "limit": 50,
  "offset": 0
}
```

---

### POST `/trips`

🔒 **Requires Authentication**

Create a new trip.

**Rate Limit**: 10 AI generations per hour (if using AI)

**Request Body:**

```json
{
  "destination": "Paris, France",
  "startDate": "2026-07-01",
  "endDate": "2026-07-07",
  "description": "Summer vacation in Paris",
  "budget": 5000,
  "budgetCurrency": "EUR",
  "generateWithAI": true
}
```

**Response 201:**

```json
{
  "trip": {
    "id": "trip-uuid",
    "destination": "Paris, France",
    "startDate": "2026-07-01",
    "endDate": "2026-07-07",
    "description": "Summer vacation in Paris",
    "budget": 5000,
    "budgetCurrency": "EUR",
    "status": "upcoming",
    "shareCode": "ABC123",
    "createdAt": "2026-05-15T12:00:00.000Z"
  },
  "itinerary": [
    /* AI-generated itinerary items if generateWithAI: true */
  ]
}
```

**Errors:**

- `400`: Invalid dates or missing required fields
- `402`: Subscription limits exceeded
- `429`: Rate limit exceeded
- `503`: AI service unavailable

---

### GET `/trips/:id`

🔒 **Requires Authentication** + **Trip Access**

Get detailed trip information.

**Response 200:**

```json
{
  "trip": {
    "id": "trip-uuid",
    "destination": "Paris, France",
    "startDate": "2026-07-01",
    "endDate": "2026-07-07",
    "description": "Summer vacation",
    "budget": 5000,
    "budgetCurrency": "EUR",
    "status": "upcoming",
    "shareCode": "ABC123",
    "coverPhoto": "https://...",
    "createdAt": "2026-05-15T12:00:00.000Z"
  },
  "members": [
    {
      "id": "member-uuid",
      "userId": "user-uuid",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "organizer",
      "joinedAt": "2026-05-15T12:00:00.000Z"
    }
  ],
  "itinerary": [
    {
      "id": "item-uuid",
      "title": "Visit Eiffel Tower",
      "description": "Must-see landmark",
      "date": "2026-07-02",
      "startTime": "10:00",
      "endTime": "12:00",
      "type": "activity",
      "location": "Eiffel Tower, Paris",
      "cost": 25,
      "currency": "EUR",
      "votes": 3,
      "status": "confirmed",
      "createdBy": "user-uuid",
      "createdAt": "2026-05-15T12:00:00.000Z"
    }
  ],
  "expenses": [
    {
      "id": "expense-uuid",
      "description": "Hotel booking",
      "amount": 500,
      "currency": "EUR",
      "paidBy": "user-uuid",
      "splitAmong": ["user-uuid-1", "user-uuid-2"],
      "date": "2026-07-01",
      "isSettled": false,
      "receiptImageUrl": "https://...",
      "createdAt": "2026-05-15T12:00:00.000Z"
    }
  ]
}
```

---

### PATCH `/trips/:id`

🔒 **Requires Authentication** + **Trip Access** + **Planner Role**

Update trip details.

**Request Body** (all fields optional):

```json
{
  "destination": "Updated destination",
  "startDate": "2026-07-02",
  "endDate": "2026-07-08",
  "description": "Updated description",
  "budget": 6000,
  "coverPhoto": "https://new-photo-url"
}
```

**Response 200:**

```json
{
  "trip": {
    /* updated trip object */
  }
}
```

---

### DELETE `/trips/:id`

🔒 **Requires Authentication** + **Trip Access** + **Organizer Role**

Delete a trip permanently.

**Response 200:**

```json
{
  "message": "Trip deleted successfully"
}
```

---

### POST `/trips/:id/cancel`

🔒 **Requires Authentication** + **Trip Access** + **Organizer Role**

Cancel a trip (keeps data but marks as cancelled).

**Response 200:**

```json
{
  "trip": {
    /* trip object with status: "cancelled" */
  }
}
```

---

### POST `/trips/:id/regenerate-itinerary`

🔒 **Requires Authentication** + **Trip Access** + **Planner Role**

**Rate Limit**: 10 AI generations per hour

Regenerate the trip itinerary using AI.

**Request Body:**

```json
{
  "preferences": {
    "travelStyle": "relaxed",
    "budget": "medium",
    "interests": ["culture", "food", "history"]
  }
}
```

**Response 200:**

```json
{
  "itinerary": [
    /* new AI-generated itinerary items */
  ]
}
```

---

### GET `/trips/join/:code/info`

Public endpoint to get trip information before joining.

**Response 200:**

```json
{
  "trip": {
    "destination": "Paris, France",
    "startDate": "2026-07-01",
    "endDate": "2026-07-07",
    "memberCount": 4
  },
  "organizer": {
    "username": "john_doe"
  }
}
```

**Errors:**

- `404`: Invalid or expired join code

---

### POST `/trips/join/:code`

🔒 **Requires Authentication**

Join a trip using a share code.

**Response 200:**

```json
{
  "trip": {
    /* full trip object */
  },
  "member": {
    /* new member object */
  }
}
```

**Errors:**

- `404`: Invalid join code
- `409`: Already a member
- `402`: Trip is full

---

### GET `/public/trips/:shareCode`

Public endpoint to view trip details (read-only).

**Response 200:**

```json
{
  "trip": {
    /* public trip info */
  },
  "itinerary": [
    /* itinerary items */
  ]
}
```

---

## Itinerary

### POST `/trips/:tripId/items`

🔒 **Requires Authentication** + **Trip Access** + **Planner Role**

Add an item to the itinerary.

**Request Body:**

```json
{
  "title": "Visit Louvre Museum",
  "description": "World's largest art museum",
  "date": "2026-07-02",
  "startTime": "14:00",
  "endTime": "17:00",
  "type": "activity",
  "location": "Louvre Museum, Paris",
  "cost": 17,
  "currency": "EUR",
  "url": "https://www.louvre.fr"
}
```

**Response 201:**

```json
{
  "item": {
    /* new itinerary item */
  }
}
```

---

### PATCH `/trips/:tripId/items/:itemId`

🔒 **Requires Authentication** + **Trip Access**

Update an itinerary item.

**Request Body** (all fields optional):

```json
{
  "title": "Updated title",
  "startTime": "15:00",
  "status": "confirmed"
}
```

**Response 200:**

```json
{
  "item": {
    /* updated item */
  }
}
```

---

### DELETE `/trips/:tripId/items/:itemId`

🔒 **Requires Authentication** + **Trip Access** + **Planner Role**

Delete an itinerary item.

**Response 200:**

```json
{
  "message": "Item deleted successfully"
}
```

---

### POST `/trips/:tripId/itinerary/reorder`

🔒 **Requires Authentication** + **Trip Access** + **Planner Role**

Reorder itinerary items.

**Request Body:**

```json
{
  "itemIds": ["item-1-uuid", "item-2-uuid", "item-3-uuid"]
}
```

**Response 200:**

```json
{
  "message": "Itinerary reordered successfully"
}
```

---

### POST `/trips/:tripId/items/:itemId/vote`

🔒 **Requires Authentication** + **Trip Access**

Vote on an itinerary item.

**Request Body:**

```json
{
  "vote": "up" // or "down"
}
```

**Response 200:**

```json
{
  "votes": 5,
  "userVote": "up"
}
```

---

### POST `/trips/:tripId/items/:itemId/comments`

🔒 **Requires Authentication** + **Trip Access**

Add a comment to an itinerary item.

**Request Body:**

```json
{
  "content": "This looks great! Let's definitely do this."
}
```

**Response 201:**

```json
{
  "comment": {
    "id": "comment-uuid",
    "content": "This looks great!",
    "userId": "user-uuid",
    "username": "john_doe",
    "createdAt": "2026-05-15T12:00:00.000Z"
  }
}
```

---

### DELETE `/trips/:tripId/items/:itemId/comments/:commentId`

🔒 **Requires Authentication** + **Trip Access**

Delete a comment (only comment author or trip organizer).

**Response 200:**

```json
{
  "message": "Comment deleted"
}
```

---

## Expenses

### POST `/trips/:tripId/expenses`

🔒 **Requires Authentication** + **Trip Access**

Add an expense to the trip.

**Request Body:**

```json
{
  "description": "Restaurant dinner",
  "amount": 120,
  "currency": "EUR",
  "paidBy": "user-uuid",
  "splitAmong": ["user-1-uuid", "user-2-uuid", "user-3-uuid"],
  "date": "2026-07-02",
  "category": "food",
  "location": "Le Jules Verne",
  "receiptImageUrl": "https://...",
  "itemId": "itinerary-item-uuid" // optional: link to itinerary item
}
```

**Response 201:**

```json
{
  "expense": {
    /* new expense object */
  }
}
```

---

### PATCH `/trips/:tripId/expenses/:expenseId`

🔒 **Requires Authentication** + **Trip Access**

Update an expense.

**Request Body** (all fields optional):

```json
{
  "amount": 130,
  "isSettled": true
}
```

**Response 200:**

```json
{
  "expense": {
    /* updated expense */
  }
}
```

---

### DELETE `/trips/:tripId/expenses/:expenseId`

🔒 **Requires Authentication** + **Trip Access**

Delete an expense (only creator or organizer).

**Response 200:**

```json
{
  "message": "Expense deleted"
}
```

---

### POST `/trips/:tripId/budget-optimize`

🔒 **Requires Authentication** + **Trip Access**

**Rate Limit**: 10 AI generations per hour

Get AI-powered budget optimization suggestions.

**Response 200:**

```json
{
  "currentSpending": 2500,
  "budget": 5000,
  "remaining": 2500,
  "suggestions": [
    {
      "category": "accommodation",
      "suggestion": "Consider Airbnb instead of hotels to save ~30%",
      "potentialSavings": 300
    }
  ]
}
```

---

## Members & Invites

### GET `/trips/:tripId/invites`

🔒 **Requires Authentication** + **Trip Access**

List all pending invites for a trip.

**Response 200:**

```json
{
  "invites": [
    {
      "id": "invite-uuid",
      "email": "friend@example.com",
      "role": "member",
      "status": "pending",
      "expiresAt": "2026-05-22T12:00:00.000Z",
      "createdAt": "2026-05-15T12:00:00.000Z"
    }
  ]
}
```

---

### POST `/trips/:tripId/invites`

🔒 **Requires Authentication** + **Trip Access**

Invite someone to the trip via email.

**Request Body:**

```json
{
  "email": "friend@example.com",
  "role": "member", // or "planner"
  "message": "Join me for Paris!" // optional
}
```

**Response 201:**

```json
{
  "invite": {
    /* invite object */
  }
}
```

**Errors:**

- `400`: Invalid email or already a member
- `402`: Trip member limit reached

---

### GET `/invites/:inviteId`

Get invite details (public, no auth required).

**Response 200:**

```json
{
  "invite": {
    "tripId": "trip-uuid",
    "destination": "Paris, France",
    "organizerName": "John Doe",
    "role": "member",
    "expiresAt": "2026-05-22T12:00:00.000Z"
  }
}
```

---

### POST `/invites/:inviteId/respond`

Accept or decline a trip invitation.

**Request Body:**

```json
{
  "accept": true, // or false to decline
  "userId": "user-uuid" // required if logged in
}
```

**Response 200 (accepted):**

```json
{
  "trip": {
    /* trip object */
  },
  "member": {
    /* new member object */
  }
}
```

**Response 200 (declined):**

```json
{
  "message": "Invitation declined"
}
```

---

### PATCH `/trips/:tripId/members/:memberId`

🔒 **Requires Authentication** + **Trip Access**

Update member preferences or role.

**Request Body:**

```json
{
  "preferences": {
    "diet": "vegetarian",
    "accommodation": "hotel"
  }
}
```

**Response 200:**

```json
{
  "member": {
    /* updated member */
  }
}
```

---

### PATCH `/trips/:tripId/members/:memberId/role`

🔒 **Requires Authentication** + **Trip Access** + **Organizer Role**

Change a member's role.

**Request Body:**

```json
{
  "role": "planner" // or "member"
}
```

**Response 200:**

```json
{
  "member": {
    /* updated member */
  }
}
```

---

### DELETE `/trips/:tripId/members/:memberId`

🔒 **Requires Authentication** + **Trip Access** + **Organizer Role**

Remove a member from the trip.

**Response 200:**

```json
{
  "message": "Member removed"
}
```

---

## Chat

### GET `/trips/:tripId/chat`

🔒 **Requires Authentication** + **Trip Access**

Get chat messages for a trip.

**Query Parameters:**

- `limit` (optional): Max messages (default: 100)
- `before` (optional): Get messages before this ID (pagination)

**Response 200:**

```json
{
  "messages": [
    {
      "id": "message-uuid",
      "content": "What time should we meet at the Eiffel Tower?",
      "userId": "user-uuid",
      "username": "john_doe",
      "createdAt": "2026-05-15T12:00:00.000Z"
    }
  ]
}
```

**Note**: Chat is currently in-memory and will be lost on server restart. Database migration planned for v1.1.

---

### POST `/trips/:tripId/chat`

🔒 **Requires Authentication** + **Trip Access**

Send a chat message.

**Request Body:**

```json
{
  "content": "Let's meet at 10am at the tower entrance"
}
```

**Response 201:**

```json
{
  "message": {
    /* new message object */
  }
}
```

---

## Files

### GET `/trips/:tripId/photos`

🔒 **Requires Authentication** + **Trip Access**

List all photos for a trip.

**Response 200:**

```json
{
  "photos": [
    {
      "id": "photo-uuid",
      "url": "https://...",
      "caption": "Sunset at Eiffel Tower",
      "uploadedBy": "user-uuid",
      "uploadedAt": "2026-07-02T20:30:00.000Z"
    }
  ]
}
```

---

### POST `/trips/:tripId/photos`

🔒 **Requires Authentication** + **Trip Access**

**Requires**: S3/R2 storage configured

Add a photo to the trip.

**Request Body:**

```json
{
  "url": "https://storage.../photo.jpg",
  "caption": "Beautiful sunset!",
  "takenAt": "2026-07-02T20:00:00.000Z"
}
```

**Response 201:**

```json
{
  "photo": {
    /* new photo object */
  }
}
```

**Note**: Use `/api/upload/photo` endpoint first to upload the file and get the URL.

---

### DELETE `/trips/:tripId/photos/:photoId`

🔒 **Requires Authentication** + **Trip Access**

Delete a photo (only uploader or organizer).

**Response 200:**

```json
{
  "message": "Photo deleted"
}
```

---

## Polls & Voting

### POST `/trips/:tripId/polls`

🔒 **Requires Authentication** + **Trip Access**

Create a poll for group decisions.

**Request Body:**

```json
{
  "question": "Where should we have dinner on Day 2?",
  "options": ["Italian Restaurant", "French Bistro", "Asian Fusion"],
  "multipleChoice": false,
  "expiresAt": "2026-06-01T00:00:00.000Z"
}
```

**Response 201:**

```json
{
  "poll": {
    "id": "poll-uuid",
    "question": "Where should we have dinner?",
    "options": [
      { "id": "option-1", "text": "Italian Restaurant", "votes": 0 },
      { "id": "option-2", "text": "French Bistro", "votes": 0 },
      { "id": "option-3", "text": "Asian Fusion", "votes": 0 }
    ],
    "multipleChoice": false,
    "expiresAt": "2026-06-01T00:00:00.000Z",
    "createdAt": "2026-05-15T12:00:00.000Z"
  }
}
```

---

### POST `/trips/:tripId/polls/:pollId/vote`

🔒 **Requires Authentication** + **Trip Access**

Vote on a poll.

**Request Body:**

```json
{
  "optionIds": ["option-1"] // array to support multiple choice
}
```

**Response 200:**

```json
{
  "poll": {
    /* updated poll with vote counts */
  }
}
```

---

### DELETE `/trips/:tripId/polls/:pollId`

🔒 **Requires Authentication** + **Trip Access**

Delete a poll (only creator or organizer).

**Response 200:**

```json
{
  "message": "Poll deleted"
}
```

---

## Packing List

### POST `/trips/:tripId/packing`

🔒 **Requires Authentication** + **Trip Access**

Add an item to the packing list.

**Request Body:**

```json
{
  "name": "Passport",
  "quantity": 1,
  "packed": false,
  "assignedTo": "user-uuid" // optional
}
```

**Response 201:**

```json
{
  "item": {
    "id": "packing-item-uuid",
    "name": "Passport",
    "quantity": 1,
    "packed": false,
    "assignedTo": "user-uuid",
    "createdAt": "2026-05-15T12:00:00.000Z"
  }
}
```

---

### PATCH `/trips/:tripId/packing/:itemId`

🔒 **Requires Authentication** + **Trip Access**

Update a packing list item (typically to mark as packed).

**Request Body:**

```json
{
  "packed": true
}
```

**Response 200:**

```json
{
  "item": {
    /* updated packing item */
  }
}
```

---

### DELETE `/trips/:tripId/packing/:itemId`

🔒 **Requires Authentication** + **Trip Access**

Delete a packing list item.

**Response 200:**

```json
{
  "message": "Packing item deleted"
}
```

---

### POST `/trips/:tripId/generate-packing-list`

🔒 **Requires Authentication** + **Trip Access**

**Rate Limit**: 10 AI generations per hour

Generate a packing list using AI based on trip details.

**Request Body** (optional):

```json
{
  "preferences": {
    "climate": "cold",
    "activities": ["hiking", "photography"],
    "duration": 7
  }
}
```

**Response 200:**

```json
{
  "items": [
    { "name": "Passport", "quantity": 1 },
    { "name": "Warm jacket", "quantity": 1 },
    { "name": "Hiking boots", "quantity": 1 }
  ]
}
```

---

## Transportation

### POST `/trips/:tripId/transportation`

🔒 **Requires Authentication** + **Trip Access**

Add transportation details (flights, trains, etc.).

**Request Body:**

```json
{
  "type": "flight",
  "departure": {
    "location": "JFK Airport, New York",
    "time": "2026-07-01T08:00:00.000Z"
  },
  "arrival": {
    "location": "CDG Airport, Paris",
    "time": "2026-07-01T20:30:00.000Z"
  },
  "provider": "Air France",
  "confirmationNumber": "ABC123XYZ",
  "cost": 850,
  "currency": "USD",
  "notes": "Check-in opens 24h before"
}
```

**Response 201:**

```json
{
  "entry": {
    /* transportation entry */
  }
}
```

---

### PATCH `/trips/:tripId/transportation/:entryId`

🔒 **Requires Authentication** + **Trip Access**

Update transportation details.

**Response 200:**

```json
{
  "entry": {
    /* updated entry */
  }
}
```

---

### DELETE `/trips/:tripId/transportation/:entryId`

🔒 **Requires Authentication** + **Trip Access**

Delete transportation entry.

**Response 200:**

```json
{
  "message": "Transportation entry deleted"
}
```

---

## Documents

### GET `/trips/:tripId/documents`

🔒 **Requires Authentication** + **Trip Access**

List all documents for a trip.

**Response 200:**

```json
{
  "documents": [
    {
      "id": "doc-uuid",
      "name": "Hotel Confirmation.pdf",
      "url": "https://storage.../doc.pdf",
      "type": "confirmation",
      "uploadedBy": "user-uuid",
      "uploadedAt": "2026-05-15T12:00:00.000Z"
    }
  ]
}
```

---

### POST `/trips/:tripId/documents`

🔒 **Requires Authentication** + **Trip Access**

**Requires**: S3/R2 storage configured

Add a document to the trip.

**Request Body:**

```json
{
  "name": "Hotel Confirmation",
  "url": "https://storage.../document.pdf",
  "type": "confirmation"
}
```

**Response 201:**

```json
{
  "document": {
    /* new document */
  }
}
```

---

### PATCH `/trips/:tripId/documents/:docId`

Update document metadata.

**Response 200:**

```json
{
  "document": {
    /* updated document */
  }
}
```

---

### DELETE `/trips/:tripId/documents/:docId`

Delete a document.

**Response 200:**

```json
{
  "message": "Document deleted"
}
```

---

## Emergency Contacts

### GET `/trips/:tripId/emergency-contacts`

🔒 **Requires Authentication** + **Trip Access**

List emergency contacts for the trip.

**Response 200:**

```json
{
  "contacts": [
    {
      "id": "contact-uuid",
      "name": "John's Mom",
      "relationship": "family",
      "phone": "+1-555-0123",
      "email": "mom@example.com",
      "createdAt": "2026-05-15T12:00:00.000Z"
    }
  ]
}
```

---

### POST `/trips/:tripId/emergency-contacts`

Add an emergency contact.

**Request Body:**

```json
{
  "name": "John's Mom",
  "relationship": "family",
  "phone": "+1-555-0123",
  "email": "mom@example.com"
}
```

**Response 201:**

```json
{
  "contact": {
    /* new contact */
  }
}
```

---

### PATCH `/trips/:tripId/emergency-contacts/:contactId`

Update emergency contact.

**Response 200:**

```json
{
  "contact": {
    /* updated contact */
  }
}
```

---

### DELETE `/trips/:tripId/emergency-contacts/:contactId`

Delete emergency contact.

**Response 200:**

```json
{
  "message": "Contact deleted"
}
```

---

## Mood Board

### POST `/trips/:tripId/mood-board`

🔒 **Requires Authentication** + **Trip Access**

Add inspiration items to trip mood board.

**Request Body:**

```json
{
  "type": "image",
  "url": "https://...",
  "title": "Inspiration for Paris cafe",
  "description": "This aesthetic!"
}
```

**Response 201:**

```json
{
  "item": {
    /* mood board item */
  }
}
```

---

### DELETE `/trips/:tripId/mood-board/:itemId`

Delete mood board item.

**Response 200:**

```json
{
  "message": "Mood board item deleted"
}
```

---

## AI Features

### POST `/trips/:tripId/generate-recap`

🔒 **Requires Authentication** + **Trip Access**

**Rate Limit**: 10 AI generations per hour

Generate an AI trip recap/summary.

**Response 200:**

```json
{
  "recap": {
    "summary": "You spent 7 amazing days in Paris...",
    "highlights": ["Eiffel Tower visit", "Louvre Museum tour"],
    "statistics": {
      "totalCost": 2500,
      "activitiesCompleted": 15,
      "photosTaken": 142
    }
  }
}
```

---

### POST `/trips/:tripId/planning-chat`

🔒 **Requires Authentication** + **Trip Access**

**Rate Limit**: 10 AI generations per hour

Chat with Atlas AI about trip planning.

**Request Body:**

```json
{
  "message": "What's the best way to get from hotel to Eiffel Tower?"
}
```

**Response 200:**

```json
{
  "response": "The best way to get from your hotel to the Eiffel Tower is by taking Metro Line 6...",
  "suggestions": [
    {
      "type": "transportation",
      "title": "Add metro ticket to budget",
      "action": "create_expense"
    }
  ]
}
```

---

### POST `/trips/:tripId/atlas/conversation`

🔒 **Requires Authentication** + **Trip Access**

**Rate Limit**: 10 AI generations per hour

Start or continue an Atlas AI conversation.

**Request Body:**

```json
{
  "message": "Help me plan activities for Day 3"
}
```

**Response 200:**

```json
{
  "response": "For Day 3, I recommend...",
  "conversationId": "conversation-uuid"
}
```

---

### GET `/trips/:tripId/atlas/conversation`

Get Atlas AI conversation history.

**Response 200:**

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Help me plan Day 3",
      "timestamp": "2026-05-15T12:00:00.000Z"
    },
    {
      "role": "assistant",
      "content": "For Day 3, I recommend...",
      "timestamp": "2026-05-15T12:00:05.000Z"
    }
  ]
}
```

---

### POST `/trips/:tripId/ai-suggestions`

🔒 **Requires Authentication** + **Trip Access**

**Rate Limit**: 10 AI generations per hour

Get AI suggestions for trip improvements.

**Response 200:**

```json
{
  "suggestions": [
    {
      "type": "itinerary",
      "priority": "high",
      "title": "Add museum day pass",
      "description": "Save 40% with Paris Museum Pass",
      "action": "add_item",
      "data": {
        /* suggested item */
      }
    }
  ]
}
```

---

### POST `/trips/:tripId/suggest-resolution`

🔒 **Requires Authentication** + **Trip Access**

**Rate Limit**: 10 AI generations per hour

Get AI help for resolving conflicts or disagreements.

**Request Body:**

```json
{
  "issue": "Half the group wants to visit museums, half wants shopping"
}
```

**Response 200:**

```json
{
  "suggestions": [
    "Split into two groups for the morning, meet for lunch",
    "Alternate days - museums Day 2, shopping Day 3"
  ]
}
```

---

### POST `/trips/:tripId/parse-email`

🔒 **Requires Authentication** + **Trip Access** + **Planner Role** + **Pro Tier**

**Rate Limit**: 10 AI generations per hour

Parse booking confirmation email and extract details.

**Request Body:**

```json
{
  "emailContent": "Your booking is confirmed...[full email text]"
}
```

**Response 200:**

```json
{
  "type": "hotel_booking",
  "details": {
    "name": "Hotel Paris",
    "checkIn": "2026-07-01",
    "checkOut": "2026-07-07",
    "confirmationNumber": "ABC123",
    "cost": 500,
    "currency": "EUR"
  },
  "suggestedActions": [
    {
      "type": "add_to_itinerary",
      "data": {
        /* suggested itinerary item */
      }
    }
  ]
}
```

---

## Push Notifications

### GET `/push/vapid-public`

Get public VAPID key for push notifications.

**Response 200:**

```json
{
  "publicKey": "BME1A2B3C4D5..."
}
```

---

### POST `/trips/:tripId/push/subscribe`

🔒 **Requires Authentication** + **Trip Access**

Subscribe to push notifications for a trip.

**Request Body:**

```json
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  }
}
```

**Response 200:**

```json
{
  "message": "Subscribed to push notifications"
}
```

---

## Analytics

### GET `/trips/:tripId/analytics`

🔒 **Requires Authentication** + **Trip Access**

Get trip analytics and statistics.

**Response 200:**

```json
{
  "summary": {
    "totalCost": 2500,
    "costPerPerson": 625,
    "daysUntilTrip": 45,
    "completionPercentage": 75
  },
  "expenses": {
    "byCategory": {
      "accommodation": 1000,
      "food": 800,
      "activities": 500,
      "transportation": 200
    }
  },
  "engagement": {
    "messagesCount": 142,
    "photosCount": 89,
    "votesCount": 23
  }
}
```

---

## Stripe & Billing

### POST `/stripe/checkout`

🔒 **Requires Authentication**

Create a Stripe checkout session for subscription upgrade.

**Request Body:**

```json
{
  "tier": "pro", // or "teams"
  "isAnnual": true
}
```

**Response 200:**

```json
{
  "sessionUrl": "https://checkout.stripe.com/..."
}
```

---

### POST `/stripe/portal`

🔒 **Requires Authentication**

Create a Stripe billing portal session for managing subscription.

**Response 200:**

```json
{
  "portalUrl": "https://billing.stripe.com/..."
}
```

---

### POST `/stripe/webhook`

**Internal endpoint** - Called by Stripe for subscription events.

**Note**: Requires `STRIPE_WEBHOOK_SECRET` to verify signature.

---

## Error Handling

All API endpoints follow standard HTTP status codes and return errors in this format:

**Error Response:**

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE_IDENTIFIER",
  "details": {
    /* optional additional context */
  }
}
```

### Common Status Codes

| Status | Meaning               | Example                    |
| ------ | --------------------- | -------------------------- |
| 200    | OK                    | Success                    |
| 201    | Created               | Resource created           |
| 400    | Bad Request           | Invalid input              |
| 401    | Unauthorized          | Missing or invalid token   |
| 402    | Payment Required      | Subscription limit reached |
| 403    | Forbidden             | No permission for resource |
| 404    | Not Found             | Resource doesn't exist     |
| 409    | Conflict              | Resource already exists    |
| 429    | Too Many Requests     | Rate limit exceeded        |
| 500    | Internal Server Error | Server error               |
| 503    | Service Unavailable   | External service down      |

### Common Error Codes

- `INVALID_CREDENTIALS` - Login failed
- `EMAIL_IN_USE` - Email already registered
- `TRIP_NOT_FOUND` - Trip doesn't exist or no access
- `INSUFFICIENT_PERMISSIONS` - Need higher role
- `SUBSCRIPTION_LIMIT_REACHED` - Upgrade required
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `AI_SERVICE_UNAVAILABLE` - AI features disabled
- `UPLOAD_UNAVAILABLE` - Storage not configured
- `INVALID_TOKEN` - JWT expired or malformed

---

## Rate Limits

| Endpoint Pattern        | Limit        | Window     |
| ----------------------- | ------------ | ---------- |
| `/auth/register`        | 5 requests   | 15 minutes |
| `/auth/login`           | 10 requests  | 15 minutes |
| `/auth/forgot-password` | 5 requests   | 1 hour     |
| `/auth/reset-password`  | 5 requests   | 15 minutes |
| AI endpoints            | 10 requests  | 1 hour     |
| All other endpoints     | 100 requests | 15 minutes |

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1620000000
```

---

## Pagination

Endpoints that return lists support pagination:

**Query Parameters:**

- `limit`: Max items per page (default: 50, max: 100)
- `offset`: Number of items to skip (default: 0)

**Response includes:**

```json
{
  "data": [
    /* items */
  ],
  "total": 250,
  "limit": 50,
  "offset": 0,
  "hasMore": true
}
```

---

## Versioning

Current API version: `v1`

The API is not versioned in the URL for v1. Future breaking changes will use `/api/v2/` prefix.

---

## Support

- **GitHub Issues**: https://github.com/AbdulMuheeth29/TripSync/issues
- **Email**: abdulmuheethmd29@gmail.com
- **Documentation**: See project README

---

**Last Updated**: 2026-05-15
**Version**: 1.0.0
