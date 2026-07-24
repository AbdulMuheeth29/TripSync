# TripSync - Complete Technical Specifications

**Version:** 1.0
**Last Updated:** 2026-01-31
**Purpose:** Comprehensive technical specifications, business rules, and edge cases for all features

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Data Models & Relationships](#data-models--relationships)
3. [Authentication & Authorization](#authentication--authorization)
4. [Trip Management](#trip-management)
5. [Itinerary Management](#itinerary-management)
6. [Voting System](#voting-system)
7. [Comments & Chat](#comments--chat)
8. [Member Management](#member-management)
9. [Expense Tracking & Settlement](#expense-tracking--settlement)
10. [Booking Management](#booking-management)
11. [Packing Lists](#packing-lists)
12. [Transportation](#transportation)
13. [Documents & Emergency Contacts](#documents--emergency-contacts)
14. [Photos & Memories](#photos--memories)
15. [Polls & Quick Decisions](#polls--quick-decisions)
16. [Weather Integration](#weather-integration)
17. [AI Features](#ai-features)
18. [Analytics & Insights](#analytics--insights)
19. [Global Business Rules](#global-business-rules)
20. [Error Handling Standards](#error-handling-standards)

---

## System Overview

### Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS + Shadcn/ui
- **Backend:** Node.js + Express 5 + TypeScript
- **Database:** PostgreSQL + Drizzle ORM
- **AI:** Anthropic Claude API (Sonnet 4.5)
- **External APIs:** Open-Meteo (weather)

### Architecture Principles

- RESTful API design
- Stateless authentication (JWT)
- Database-first validation
- Optimistic UI updates where safe
- Real-time features via polling (WebSocket optional)

---

## Data Models & Relationships

### Core Entities

#### `users`

```typescript
{
  id: UUID (PK)
  email: string (unique, lowercase, max 255)
  name: string (max 255)
  passwordHash: string (bcrypt, 12 rounds) // TODO: Add this field
  createdAt: timestamp
}
```

**Relationships:**

- One-to-many: `tripMembers`, `expenses`, `votes`, `comments`, `chatMessages`

**Business Rules:**

- Email must be unique (case-insensitive)
- Email format validated via Zod
- Name required, min 1 char, max 255
- Password min 8 chars (when implemented)

---

#### `trips`

```typescript
{
  id: UUID (PK)
  organizerId: UUID (FK → users.id)
  title: string (max 200)
  destination: string (max 200)
  startDate: date
  endDate: date
  budgetPerPerson: decimal (min 0)
  groupSize: integer (min 1, max 50)
  vibes: string[] (array of preferences)
  accommodationPref: enum ('hotel', 'airbnb', 'mix')
  diningPref: enum ('fine_dining', 'casual', 'mix')
  tripType: enum ('leisure', 'business', 'adventure', 'other')
  status: enum ('planning', 'booking', 'active', 'completed', 'cancelled')
  isLocked: boolean (default false)
  shareCode: string (unique, 8 chars)
  voteDeadline: timestamp (nullable)
  timezone: string (IANA timezone, default 'UTC')
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Relationships:**

- Many-to-one: `users` (organizer)
- One-to-many: `tripMembers`, `itineraryItems`, `expenses`, `chatMessages`, `polls`

**Business Rules:**

- `startDate` must be before `endDate`
- `endDate` must be after `startDate` (at least 1 day gap)
- `budgetPerPerson` cannot be negative
- `groupSize` must match actual member count or be greater (invites pending)
- `shareCode` auto-generated on creation (unique, alphanumeric)
- Only organizer can lock/unlock trip
- Locked trips prevent non-organizer edits to itinerary
- Status transitions: planning → booking → active → completed (one-way only)
- Cancelled status can be set from any state (organizer only)

**Status Business Rules:**

- `planning`: Default state, all features available
- `booking`: Vote deadline passed or organizer manually set
- `active`: Trip startDate reached
- `completed`: Trip endDate passed
- `cancelled`: Manual cancellation by organizer

---

#### `tripMembers`

```typescript
{
  id: UUID (PK)
  tripId: UUID (FK → trips.id, cascade delete)
  userId: UUID (FK → users.id, cascade delete)
  role: enum ('planner', 'member')
  rsvpStatus: enum ('pending', 'accepted', 'declined')
  invitedAt: timestamp
  joinedAt: timestamp (nullable)
}
```

**Relationships:**

- Many-to-one: `trips`, `users`
- One-to-one: `memberPreferences`

**Business Rules:**

- Composite unique constraint: (tripId, userId)
- Trip organizer automatically added as 'planner' with 'accepted' status
- Only planners can invite new members
- Only planners can change member roles
- Cannot remove trip organizer
- Cannot downgrade organizer to 'member'
- When user declines, remove from trip but keep invite record
- `joinedAt` set when rsvpStatus changes to 'accepted'

---

#### `tripInvites`

```typescript
{
  id: UUID (PK)
  tripId: UUID (FK → trips.id, cascade delete)
  email: string (lowercase, max 255)
  invitedBy: UUID (FK → users.id)
  status: enum ('pending', 'accepted', 'expired')
  token: string (unique)
  expiresAt: timestamp
  createdAt: timestamp
}
```

**Business Rules:**

- Token valid for 7 days
- Expired invites cannot be accepted
- Email can have multiple pending invites (different trips)
- Same email cannot have >1 pending invite for same trip
- When accepted, create `tripMember` record and update status
- Send email notification when invite created

---

#### `memberPreferences`

```typescript
{
  id: UUID (PK)
  tripMemberId: UUID (FK → tripMembers.id, cascade delete, unique)
  dietaryRestrictions: string[] (max 500 chars combined)
  budgetFlexibility: enum ('strict', 'moderate', 'flexible')
  mustDoActivities: text (max 1000 chars)
  accessibilityNeeds: text (max 1000 chars)
  preferredPace: enum ('relaxed', 'moderate', 'packed')
  accommodationPreference: string (max 500)
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Business Rules:**

- One preference record per trip member
- Used by AI for itinerary generation
- Organizer can view all preferences
- Members can only edit their own preferences
- Optional fields (all can be null)

---

#### `itineraryItems`

```typescript
{
  id: UUID (PK)
  tripId: UUID (FK → trips.id, cascade delete)
  dayNumber: integer (1-indexed, min 1)
  time: time (24-hour format)
  type: enum ('flight', 'hotel', 'dining', 'activity', 'transport', 'free_time')
  name: string (max 200)
  description: text (max 2000)
  location: string (max 500, nullable)
  pricePerPerson: decimal (min 0, nullable)
  duration: integer (minutes, nullable)
  bookingUrl: string (URL, max 1000, nullable)
  bookingUrlHint: string (max 200, nullable) // "Google Flights", "Booking.com"
  bookingStatus: enum ('not_started', 'in_progress', 'booked', 'cancelled')
  locked: boolean (default false)
  bookedByUserId: UUID (FK → users.id, nullable)
  confirmationNumber: string (max 100, nullable)
  confirmationImageUrl: string (URL, max 1000, nullable)
  sortOrder: integer (for drag-and-drop within day)
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Relationships:**

- Many-to-one: `trips`
- One-to-many: `votes`, `comments`

**Business Rules:**

- `dayNumber` must be between 1 and trip duration (endDate - startDate + 1)
- Items within same day ordered by `time`, then `sortOrder`
- Locked items cannot be edited/deleted (except by organizer)
- Cannot delete items with `bookingStatus` = 'booked' without confirmation
- `bookedByUserId` required when `bookingStatus` = 'booked'
- Price validation: if null, treated as $0 in budget calculations
- Type-specific validation:
  - `flight`: Must have location (origin/destination)
  - `hotel`: Must have location (address)
  - `dining`: Should have location
  - `activity`: Should have duration
- Time conflicts within same day should warn user (not block)
- Cannot add items if trip is locked (unless organizer/planner)

---

#### `votes`

```typescript
{
  id: UUID (PK)
  itemId: UUID (FK → itineraryItems.id, cascade delete)
  userId: UUID (FK → users.id, cascade delete)
  voteType: enum ('up', 'down', 'abstain')
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Relationships:**

- Many-to-one: `itineraryItems`, `users`

**Business Rules:**

- Composite unique constraint: (itemId, userId)
- Only trip members can vote
- Can change vote (update voteType)
- Vote counts: upvotes - downvotes (abstain = 0)
- Locked items still allow voting (feedback for organizer)
- Deleted items cascade delete all votes

---

#### `comments`

```typescript
{
  id: UUID (PK)
  itemId: UUID (FK → itineraryItems.id, cascade delete)
  userId: UUID (FK → users.id, cascade delete)
  content: text (max 2000)
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Business Rules:**

- Only trip members can comment
- Content must be non-empty after trimming
- XSS prevention: sanitize before display
- Can edit own comments within 15 minutes of posting
- Cannot edit after someone replies (future feature)
- Deleted items cascade delete all comments

---

#### `chatMessages`

```typescript
{
  id: UUID (PK)
  tripId: UUID (FK → trips.id, cascade delete)
  userId: UUID (FK → users.id, cascade delete)
  content: text (max 2000)
  itemId: UUID (FK → itineraryItems.id, nullable) // Optional context
  createdAt: timestamp
}
```

**Business Rules:**

- Only trip members can send messages
- Content must be non-empty after trimming
- @mentions: Parse content for @username patterns
- Highlight messages where current user is mentioned
- Cannot edit messages (simplicity)
- Cannot delete messages (audit trail)
- Soft real-time: Poll every 5 seconds when chat tab active
- Max 100 messages loaded initially, infinite scroll for more

---

#### `expenses`

```typescript
{
  id: UUID (PK)
  tripId: UUID (FK → trips.id, cascade delete)
  paidByUserId: UUID (FK → users.id, cascade delete)
  amount: decimal (min 0)
  currency: string (ISO 4217, default 'USD')
  description: string (max 500)
  category: enum ('transport', 'food', 'accommodation', 'activity', 'other')
  location: string (max 500, nullable)
  date: date (default current date)
  itemId: UUID (FK → itineraryItems.id, nullable) // Link to itinerary
  receiptImageUrl: string (URL, max 1000, nullable)
  splitAmong: UUID[] (array of user IDs)
  isSettled: boolean (default false)
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Business Rules:**

- `paidByUserId` must be trip member
- All users in `splitAmong` must be trip members
- `splitAmong` cannot be empty
- If `itemId` provided, must belong to same trip
- Amount split evenly among `splitAmong` users
- Settlement calculation:
  - User's balance = (total paid) - (total owed)
  - Positive = overpaid (should receive)
  - Negative = underpaid (should pay)
- Cannot delete expenses if `isSettled` = true without confirmation
- Date must be between trip startDate and endDate (or within 7 days after)
- Currency conversion: Store in original currency, convert for display

**Split Algorithm:**

```
amountPerPerson = amount / splitAmong.length
For each user in splitAmong:
  if (user == paidByUserId):
    netChange = amount - amountPerPerson // They paid full but owe their share
  else:
    netChange = -amountPerPerson // They owe this amount
```

---

#### `packingItems`

```typescript
{
  id: UUID (PK)
  tripId: UUID (FK → trips.id, cascade delete)
  name: string (max 200)
  category: enum ('clothing', 'toiletries', 'electronics', 'documents', 'other')
  quantity: integer (min 1, default 1)
  assignedTo: UUID (FK → users.id, nullable)
  isPacked: boolean (default false)
  notes: string (max 500, nullable)
  createdAt: timestamp
}
```

**Business Rules:**

- All trip members can add items
- Items can be assigned to specific member or shared (assignedTo = null)
- Only assigned user can mark as packed (or organizer)
- Duplicate item names allowed (different categories/assignees)
- Auto-suggest common items based on destination/trip type (future)

---

#### `transportationEntries`

```typescript
{
  id: UUID (PK)
  tripId: UUID (FK → trips.id, cascade delete)
  type: enum ('driver', 'passenger', 'ride_share')
  driverId: UUID (FK → users.id, nullable)
  passengers: UUID[] (array of user IDs)
  vehicleInfo: string (max 200, nullable)
  departureLocation: string (max 500)
  arrivalLocation: string (max 500)
  departureTime: timestamp
  notes: text (max 1000, nullable)
  createdAt: timestamp
}
```

**Business Rules:**

- All referenced users must be trip members
- Driver cannot also be in passengers array
- If type = 'driver', driverId must be set
- If type = 'ride_share', driverId should be null
- Cannot have overlapping transportation for same user at same time
- Validate departure/arrival times are within trip dates

---

#### `tripDocuments`

```typescript
{
  id: UUID (PK)
  tripId: UUID (FK → trips.id, cascade delete)
  uploadedBy: UUID (FK → users.id, cascade delete)
  documentType: enum ('passport', 'visa', 'boarding_pass', 'hotel_confirmation',
                      'vaccination', 'insurance', 'other')
  title: string (max 200)
  fileUrl: string (URL, max 1000)
  expiryDate: date (nullable)
  belongsToUserId: UUID (FK → users.id, nullable) // Whose passport?
  createdAt: timestamp
}
```

**Business Rules:**

- File uploads must be validated (type, size)
- Allowed types: PDF, JPG, PNG (max 10MB)
- Store in secure cloud storage (S3/R2) with private ACL
- Generate signed URLs for viewing (expire in 1 hour)
- Documents with expiryDate show warning if <30 days
- Only uploader or organizer can delete
- Sensitive documents (passport, visa) require extra confirmation to view

---

#### `emergencyContacts`

```typescript
{
  id: UUID (PK)
  tripId: UUID (FK → trips.id, cascade delete)
  userId: UUID (FK → users.id, cascade delete) // Contact belongs to this member
  name: string (max 200)
  relationship: string (max 100)
  phone: string (max 20)
  email: string (max 255, nullable)
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Business Rules:**

- Each trip member can add their own emergency contacts
- Only contact owner and organizer can view/edit
- Phone number required, email optional
- Encrypt phone numbers in database
- Show to all trip members only in emergency (future: emergency mode)

---

#### `tripPhotos`

```typescript
{
  id: UUID (PK)
  tripId: UUID (FK → trips.id, cascade delete)
  uploadedBy: UUID (FK → users.id, cascade delete)
  imageUrl: string (URL, max 1000)
  caption: string (max 500, nullable)
  takenAt: timestamp (nullable) // From EXIF data
  location: string (max 500, nullable) // From EXIF data
  createdAt: timestamp
}
```

**Business Rules:**

- Only trip members can upload
- Image validation: JPG, PNG, HEIC (max 25MB)
- Auto-extract EXIF data (date, location) if available
- Store in CDN for fast loading
- Generate thumbnails (200x200, 800x800)
- Allow batch upload (up to 50 at once)
- Photos grouped by day (based on takenAt or upload date)

---

#### `polls`

```typescript
{
  id: UUID (PK)
  tripId: UUID (FK → trips.id, cascade delete)
  createdBy: UUID (FK → users.id, cascade delete)
  question: string (max 500)
  options: string[] (array, 2-10 options, max 200 chars each)
  allowMultiple: boolean (default false)
  expiresAt: timestamp (nullable)
  createdAt: timestamp
}
```

**Relationships:**

- One-to-many: `pollVotes`

**Business Rules:**

- Minimum 2 options, maximum 10
- Only trip members can create polls
- Options must be unique within poll
- Cannot edit poll after first vote
- Cannot delete poll (archive instead - future feature)
- Expired polls show results but don't accept votes

---

#### `pollVotes`

```typescript
{
  id: UUID (PK)
  pollId: UUID (FK → polls.id, cascade delete)
  userId: UUID (FK → users.id, cascade delete)
  selectedOptions: integer[] (array of option indices)
  createdAt: timestamp
}
```

**Business Rules:**

- Composite unique constraint: (pollId, userId)
- If poll.allowMultiple = false, selectedOptions.length must be 1
- Option indices must be valid (< options.length)
- Can change vote before poll expires
- Results show vote count per option + percentages

---

#### `groupAvailability`

```typescript
{
  id: UUID (PK)
  tripId: UUID (FK → trips.id, cascade delete)
  userId: UUID (FK → users.id, cascade delete)
  availableDates: date[] (array of available dates)
  unavailableDates: date[] (array of unavailable dates)
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Business Rules:**

- Used during trip creation for date selection
- Show calendar with highlighted dates (green = most available)
- Calculate best dates (most members available)
- Dates cannot be both available and unavailable

---

#### `userLearnedPreferences`

```typescript
{
  id: UUID (PK)
  userId: UUID (FK → users.id, cascade delete)
  preferenceType: enum ('activity', 'budget', 'pace', 'food', 'accommodation')
  preferenceValue: string (max 500)
  confidence: decimal (0.0 to 1.0) // How sure AI is
  learnedFrom: UUID[] (array of trip IDs)
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Business Rules:**

- AI populates this after trip completion
- Examples:
  - type='activity', value='museums', confidence=0.85 (visited 5/6 museums)
  - type='pace', value='relaxed', confidence=0.70 (added buffer time frequently)
- Used to pre-populate future trip preferences
- User can view and delete (reset AI learning)

---

#### `tripSatisfaction`

```typescript
{
  id: UUID (PK)
  tripId: UUID (FK → trips.id, cascade delete)
  userId: UUID (FK → users.id, cascade delete)
  overallRating: integer (1-5)
  itineraryRating: integer (1-5, nullable)
  budgetRating: integer (1-5, nullable)
  groupDynamicsRating: integer (1-5, nullable)
  comments: text (max 2000, nullable)
  createdAt: timestamp
}
```

**Business Rules:**

- Only trip members can rate
- Can only rate after trip status = 'completed'
- Composite unique constraint: (tripId, userId)
- Aggregate ratings shown to organizer only
- Individual ratings private unless shared

---

#### `locationSharing` (Optional Feature)

```typescript
{
  id: UUID (PK)
  tripId: UUID (FK → trips.id, cascade delete)
  userId: UUID (FK → users.id, cascade delete)
  latitude: decimal (precision 8, scale 6)
  longitude: decimal (precision 9, scale 6)
  accuracy: decimal (meters, nullable)
  isSharing: boolean (default false)
  lastUpdated: timestamp
}
```

**Business Rules:**

- Opt-in only (privacy-sensitive)
- Location deleted after trip ends + 1 day
- Only visible to trip members
- Update frequency: max every 5 minutes (battery saving)
- Cannot be forced by organizer

---

### Database Indexes

**Critical for Performance:**

```sql
-- Trips
CREATE INDEX idx_trips_organizer ON trips(organizerId);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_dates ON trips(startDate, endDate);
CREATE INDEX idx_trips_share_code ON trips(shareCode);

-- Trip Members
CREATE INDEX idx_trip_members_trip ON tripMembers(tripId);
CREATE INDEX idx_trip_members_user ON tripMembers(userId);
CREATE UNIQUE INDEX idx_trip_members_composite ON tripMembers(tripId, userId);

-- Itinerary Items
CREATE INDEX idx_itinerary_trip ON itineraryItems(tripId);
CREATE INDEX idx_itinerary_day ON itineraryItems(tripId, dayNumber, time);

-- Expenses
CREATE INDEX idx_expenses_trip ON expenses(tripId);
CREATE INDEX idx_expenses_paid_by ON expenses(paidByUserId);
CREATE INDEX idx_expenses_date ON expenses(date);

-- Chat Messages
CREATE INDEX idx_chat_trip ON chatMessages(tripId, createdAt DESC);

-- Votes
CREATE UNIQUE INDEX idx_votes_composite ON votes(itemId, userId);
```

---

## Authentication & Authorization

### Feature: User Registration

**Frontend:**

- Route: `/register`
- Form fields:
  - Name (text input, required)
  - Email (email input, required)
  - Password (password input, required, show strength indicator)
  - Confirm Password (password input, required)
- Validation:
  - Real-time email format check
  - Password strength: min 8 chars, 1 uppercase, 1 number, 1 special char
  - Passwords must match
  - Show validation errors inline

**API Endpoint:**

```
POST /api/auth/register
Body: { name, email, password }
Response: { token, user: { id, email, name } }
```

**Backend Logic:**

1. Validate input with Zod schema
2. Check if email already exists (case-insensitive)
3. Hash password with bcrypt (12 rounds)
4. Create user record
5. Generate JWT token (expires in 7 days)
6. Return token + user data (exclude password hash)

**Business Rules:**

- Email must be unique (case-insensitive comparison)
- Convert email to lowercase before storage
- Password min 8 chars, max 128 chars
- Name required, max 255 chars
- No special characters validation on name (support international names)

**Edge Cases:**

- Email already exists → 409 Conflict "Email already registered"
- Weak password → 400 Bad Request "Password too weak"
- Name contains only whitespace → 400 "Name required"
- Database error during creation → 500 Internal Server Error
- Email format invalid → 400 "Invalid email format"

**Security:**

- Rate limit: 5 registrations per IP per hour
- Captcha on frontend (future: hCaptcha/Turnstile)
- Email verification required before full access (Tier 2 security)

---

### Feature: User Login

**Frontend:**

- Route: `/login`
- Form fields:
  - Email (email input, required)
  - Password (password input, required)
  - Remember me (checkbox, optional)
- Forgot password link (future feature)

**API Endpoint:**

```
POST /api/auth/login
Body: { email, password }
Response: { token, user: { id, email, name } }
```

**Backend Logic:**

1. Validate input
2. Find user by email (case-insensitive)
3. Verify password with bcrypt.compare()
4. Generate JWT token
5. Log audit event
6. Return token + user data

**Business Rules:**

- Generic error message "Invalid credentials" (don't reveal if email exists)
- Token expires in 7 days (or 30 days if "remember me")
- Failed login doesn't lock account (rate limiting handles abuse)

**Edge Cases:**

- Email not found → 401 "Invalid credentials"
- Wrong password → 401 "Invalid credentials"
- Account locked (future) → 403 "Account locked"
- Too many attempts → 429 "Too many attempts, try again in 15 minutes"

**Security:**

- Rate limit: 5 attempts per IP per 15 minutes
- Rate limit: 3 attempts per email per 15 minutes (prevent targeted attacks)
- Log all login attempts (successful + failed)
- Implement account lockout after 10 failed attempts in 1 hour (future)

---

### Feature: Authentication Middleware

**Implementation:**

```typescript
// server/middleware/auth.ts

export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Attach user to request
  req.userId = payload.userId;
  next();
}
```

**Business Rules:**

- All protected routes must use this middleware
- Token in Authorization header: `Bearer <token>`
- Expired tokens → 401 Unauthorized
- Invalid tokens → 401 Unauthorized
- Missing tokens → 401 Unauthorized

---

### Feature: Trip Access Authorization

**Implementation:**

```typescript
export async function requireTripAccess(req, res, next) {
  const { tripId } = req.params;
  const userId = req.userId;

  const membership = await db.query.tripMembers.findFirst({
    where: and(
      eq(tripMembers.tripId, tripId),
      eq(tripMembers.userId, userId),
      eq(tripMembers.rsvpStatus, 'accepted')
    ),
  });

  if (!membership) {
    return res.status(403).json({ error: 'Access denied' });
  }

  req.tripMembership = membership; // Attach for later use
  next();
}
```

**Business Rules:**

- Only accepted members can access trip data
- Pending/declined members cannot access
- Non-members get 403 Forbidden
- Use on ALL trip-related endpoints

**Edge Cases:**

- User removed from trip mid-session → 403 on next request
- Trip deleted → 404 Not Found (checked before this middleware)
- User never invited → 403 Access denied

---

### Feature: Organizer/Planner Authorization

**Implementation:**

```typescript
export async function requirePlannerRole(req, res, next) {
  const membership = req.tripMembership; // From requireTripAccess

  if (membership.role !== 'planner') {
    return res.status(403).json({ error: 'Planner access required' });
  }

  next();
}
```

**Business Rules:**

- Use for actions like: lock trip, delete items, assign tasks
- Organizer automatically has planner role
- Regular members cannot perform planner actions

---

## Trip Management

### Feature: Create Trip

**Frontend:**

- Route: `/create`
- Multi-step wizard (5 steps):
  1. Basic info (destination, dates, budget, group size)
  2. Trip vibes (checkboxes: relaxing, adventure, foodie, nightlife, culture)
  3. Accommodation preference (radio: hotel, airbnb, mix)
  4. Dining preference (radio: fine_dining, casual, mix)
  5. Invite members (email list input)

**API Endpoint:**

```
POST /api/trips
Body: {
  title: string
  destination: string
  startDate: ISO date
  endDate: ISO date
  budgetPerPerson: number
  groupSize: number
  vibes: string[]
  accommodationPref: string
  diningPref: string
  inviteEmails: string[] (optional)
  voteDeadline: ISO timestamp (optional)
  timezone: string (optional, default UTC)
}
Response: { tripId, shareCode }
```

**Backend Logic:**

1. Validate all fields with Zod
2. Check date logic (end > start)
3. Generate unique shareCode (8 chars, alphanumeric)
4. Create trip record
5. Create tripMember for organizer (role='planner', rsvpStatus='accepted')
6. If inviteEmails provided, create tripInvites
7. Trigger AI itinerary generation (background job)
8. Return tripId and shareCode

**Business Rules:**

- startDate must be today or future
- endDate must be after startDate
- budgetPerPerson min 0, max 1,000,000
- groupSize min 1, max 50
- vibes can be empty or 1-5 selections
- accommodationPref required
- diningPref required
- shareCode must be globally unique
- inviteEmails validated (email format)
- Duplicate emails in inviteEmails ignored
- Cannot invite organizer's own email

**Edge Cases:**

- startDate in past → 400 "Start date must be today or later"
- endDate before startDate → 400 "End date must be after start date"
- Same day trip (start = end) → Allow (1 day trip valid)
- budgetPerPerson = 0 → Allow (free trip)
- groupSize < inviteEmails.length → Warn but allow (can add more later)
- shareCode collision (rare) → Regenerate and retry
- Invalid email in invites → Skip invalid, create rest
- AI generation fails → Create trip anyway, set itinerary to empty

**AI Integration:**

- After trip created, enqueue AI itinerary generation
- Input: destination, dates, budget, vibes, preferences
- If fails, user can manually regenerate later
- Status check endpoint to poll generation progress

---

### Feature: View Trip Dashboard

**Frontend:**

- Route: `/dashboard`
- Display:
  - Upcoming trips (startDate >= today, status != completed)
  - Past trips (endDate < today or status = completed)
  - Trip cards show: destination, dates, budget, members, progress

**API Endpoint:**

```
GET /api/trips
Query params: ?status=upcoming|past|all (default: all)
Response: { trips: Trip[] }
```

**Backend Logic:**

1. Get all trips where user is a member (rsvpStatus='accepted')
2. Filter by status if provided
3. Include: member count, booking progress, budget spent
4. Order by startDate (upcoming: ASC, past: DESC)

**Business Rules:**

- Only show trips where user is accepted member
- Booking progress = (booked items / total items) \* 100
- Budget spent = sum(expenses.amount) / (budgetPerPerson _ groupSize) _ 100
- Upcoming = startDate >= today AND status != 'completed'
- Past = endDate < today OR status = 'completed'

**Edge Cases:**

- No trips → Show empty state with "Create Trip" CTA
- Trip deleted while viewing dashboard → Disappears on next refresh
- Very old trips → Paginate (future: load more)

---

### Feature: View Trip Detail

**Frontend:**

- Route: `/trip/:id`
- Tabs: Overview, Itinerary, Team, Expenses, Chat, More
- Overview shows: header, members, share code, status, quick stats

**API Endpoint:**

```
GET /api/trips/:tripId
Response: {
  trip: Trip
  members: TripMember[]
  stats: {
    bookingProgress: number
    budgetSpent: number
    daysUntilTrip: number
    votingProgress: number
  }
}
```

**Middleware:**

- requireAuth
- requireTripAccess

**Backend Logic:**

1. Fetch trip by ID
2. Fetch all members with user info
3. Calculate stats:
   - bookingProgress = booked items / total items
   - budgetSpent = expenses sum / total budget
   - daysUntilTrip = startDate - today
   - votingProgress = items with >50% votes / total items
4. Return combined data

**Business Rules:**

- Only accessible by trip members
- Stats calculated in real-time
- Share code visible to all members
- Edit buttons shown only to organizer/planners

**Edge Cases:**

- Trip not found → 404
- User not member → 403
- Trip deleted mid-view → 404 on next request
- No itinerary items → Show "Generate Itinerary" button

---

### Feature: Edit Trip

**Frontend:**

- Modal/page for editing basic trip info
- Fields: title, destination, dates, budget, vibes, preferences
- Cannot edit: shareCode, organizer, creation date

**API Endpoint:**

```
PATCH /api/trips/:tripId
Body: { (any of the editable fields) }
Response: { trip: Trip }
```

**Middleware:**

- requireAuth
- requireTripAccess
- requirePlannerRole

**Business Rules:**

- Only organizer/planners can edit
- Cannot change shareCode
- Cannot change organizer
- Date changes must maintain end > start
- If dates change, validate itinerary items still in range
- Editing locked trip requires unlock first

**Edge Cases:**

- Changing dates invalidates itinerary items → Warn user
- Reducing budget below current expenses → Warn but allow
- Changing destination → Offer to regenerate itinerary
- Trip already started (status='active') → Warn "Trip in progress"

---

### Feature: Delete Trip

**Frontend:**

- Danger zone button in settings
- Confirmation modal: "Type trip name to confirm"
- Shows impact: "Will delete all itinerary, expenses, chat"

**API Endpoint:**

```
DELETE /api/trips/:tripId
Body: { confirmation: string } // Trip title
Response: { success: true }
```

**Middleware:**

- requireAuth
- requireTripAccess
- Organizer only (custom check)

**Business Rules:**

- Only organizer can delete
- Must type trip title exactly to confirm
- Cascade deletes: all members, items, expenses, chat, photos
- Cannot undo (permanent)
- Audit log deletion event

**Edge Cases:**

- Trip already started → Extra confirmation required
- Trip has expenses → Show settlement summary, require confirmation
- Trip deleted while member is viewing → 404 on next action

---

### Feature: Lock/Unlock Trip

**Frontend:**

- Toggle in trip header
- Icon changes (locked/unlocked)
- Tooltip explains: "Locked trips prevent member edits to itinerary"

**API Endpoint:**

```
PATCH /api/trips/:tripId/lock
Body: { locked: boolean }
Response: { trip: Trip }
```

**Middleware:**

- requireAuth
- requireTripAccess
- requirePlannerRole

**Business Rules:**

- Only planners can lock/unlock
- Locked = members cannot add/edit/delete itinerary items
- Locked = members CAN still vote and comment
- Locked = members CAN still add expenses
- Used to finalize itinerary before booking

**Edge Cases:**

- Locking with pending votes → Allowed
- Unlocking during active trip → Allowed
- Multiple planners toggling simultaneously → Last write wins

---

### Feature: Share Trip

**Frontend:**

- Share button → modal with options:
  - Share code (8 chars, copy button)
  - Email invites (input list)
  - Share link (copy full URL with code)

**API Endpoints:**

```
GET /api/trips/:tripId/share-code
Response: { shareCode: string, shareUrl: string }

POST /api/trips/:tripId/invite
Body: { emails: string[] }
Response: { invited: number, failed: string[] }
```

**Business Rules:**

- Share code never expires
- Anyone with code can join (if they have account)
- Email invites send notification
- Cannot re-invite already accepted members
- Can re-invite declined members

**Edge Cases:**

- Share code → anyone can join (privacy risk: use with caution)
- Invalid emails in bulk invite → Skip invalid, invite rest
- Inviting existing member → Return "Already a member"
- Trip at capacity (groupSize reached) → 400 "Trip full"

---

### Feature: Join Trip via Share Code

**Frontend:**

- Route: `/join/:shareCode` or `/join?code=XXX`
- Shows trip preview: destination, dates, organizer, member count
- "Join Trip" button (requires login)

**API Endpoint:**

```
POST /api/trips/join
Body: { shareCode: string }
Response: { trip: Trip }
```

**Middleware:**

- requireAuth

**Backend Logic:**

1. Find trip by shareCode
2. Check if user already a member
3. Check if trip at capacity
4. Create tripMember (role='member', rsvpStatus='accepted')
5. Return trip details

**Business Rules:**

- Must be logged in to join
- Cannot join if already a member
- Cannot join if declined previously (must be re-invited)
- Joining counts toward groupSize
- Auto-redirect to trip detail page after join

**Edge Cases:**

- Invalid code → 404 "Trip not found"
- Already a member → 400 "Already a member"
- Trip full → 400 "Trip is full"
- Trip cancelled → 400 "Trip is cancelled"

---

## Itinerary Management

### Feature: View Itinerary

**Frontend:**

- Route: `/trip/:id` → Itinerary tab
- Display: Day-by-day timeline
- Each item shows: time, type badge, name, description, location, price, votes, booking status
- Today indicator if trip active
- Drag-and-drop to reorder (planner only)

**API Endpoint:**

```
GET /api/trips/:tripId/itinerary
Response: {
  items: ItineraryItem[]
  groupedByDay: { [dayNumber: number]: ItineraryItem[] }
  currentDay: number (if trip active)
}
```

**Middleware:**

- requireAuth
- requireTripAccess

**Backend Logic:**

1. Fetch all itinerary items for trip
2. Order by dayNumber, time, sortOrder
3. Group by day for frontend convenience
4. Calculate currentDay if trip active (today - startDate + 1)

**Business Rules:**

- Items sorted by: dayNumber ASC, time ASC, sortOrder ASC
- Free time blocks shown as gaps
- Locked items have lock icon
- Booking status color-coded

**Edge Cases:**

- No items → Show "Generate Itinerary" or "Add Item" button
- Trip not started → Don't show "Today" indicator
- Items span multiple days (e.g., hotel) → Show on check-in day
- Same time multiple items → Order by sortOrder (manual reorder)

---

### Feature: Add Itinerary Item

**Frontend:**

- Button: "Add Activity"
- Modal with form:
  - Day (select: 1 to trip duration)
  - Time (time picker)
  - Type (select: flight, hotel, dining, activity, transport, free_time)
  - Name (text)
  - Description (textarea, optional)
  - Location (text, optional)
  - Price per person (number, optional)
  - Duration (number in minutes, optional)
  - Booking URL (text, optional)

**API Endpoint:**

```
POST /api/trips/:tripId/itinerary
Body: {
  dayNumber: number
  time: string (HH:MM)
  type: string
  name: string
  description?: string
  location?: string
  pricePerPerson?: number
  duration?: number
  bookingUrl?: string
  bookingUrlHint?: string
}
Response: { item: ItineraryItem }
```

**Middleware:**

- requireAuth
- requireTripAccess
- If trip locked: requirePlannerRole

**Backend Logic:**

1. Validate all fields
2. Check dayNumber in valid range (1 to trip duration)
3. Calculate sortOrder (max + 1 for that day)
4. Create item
5. Return created item

**Business Rules:**

- dayNumber must be 1 to (endDate - startDate + 1)
- time in 24-hour format (HH:MM)
- pricePerPerson min 0
- duration min 0 (in minutes)
- If trip locked, only planners can add
- Auto-calculate trip duration on save

**Edge Cases:**

- Day number out of range → 400 "Invalid day number"
- Negative price → 400 "Price cannot be negative"
- Invalid time format → 400 "Invalid time"
- Overlapping times → Allow (just warn in UI)
- Trip locked + non-planner → 403 "Trip is locked"

---

### Feature: Edit Itinerary Item

**Frontend:**

- Click item → Edit modal (same as add)
- Pre-filled with current values
- Save button updates item

**API Endpoint:**

```
PATCH /api/trips/:tripId/itinerary/:itemId
Body: { (any editable fields) }
Response: { item: ItineraryItem }
```

**Middleware:**

- requireAuth
- requireTripAccess
- If trip locked: requirePlannerRole
- If item locked: requirePlannerRole

**Business Rules:**

- Cannot edit if trip locked (unless planner)
- Cannot edit if item locked (unless planner)
- Changing day recalculates sortOrder
- Editing doesn't reset votes/comments

**Edge Cases:**

- Item locked → 403 unless planner
- Item booked → Warn "Item is booked, changes may affect confirmation"
- Moving to invalid day → 400
- Deleting location when type=hotel → Warn but allow

---

### Feature: Delete Itinerary Item

**Frontend:**

- Delete button/icon on item
- Confirmation dialog if item has votes or is booked

**API Endpoint:**

```
DELETE /api/trips/:tripId/itinerary/:itemId
Body: { confirm: boolean } (required if booked)
Response: { success: true }
```

**Middleware:**

- requireAuth
- requireTripAccess
- If trip locked: requirePlannerRole
- If item locked: requirePlannerRole

**Business Rules:**

- Cascade deletes: all votes, comments for this item
- If booked, require explicit confirmation
- If has votes, show confirmation with count

**Edge Cases:**

- Item locked → 403 unless planner
- Item booked without confirmation → 400 "Confirmation required"
- Last item on day → Allowed (empty day valid)
- Item referenced in expenses → Unlink but don't block delete

---

### Feature: Lock/Unlock Itinerary Item

**Frontend:**

- Lock icon on item (planner only)
- Tooltip: "Locked items prevent member edits"

**API Endpoint:**

```
PATCH /api/trips/:tripId/itinerary/:itemId/lock
Body: { locked: boolean }
Response: { item: ItineraryItem }
```

**Middleware:**

- requireAuth
- requireTripAccess
- requirePlannerRole

**Business Rules:**

- Only planners can lock/unlock
- Locked items prevent edit/delete by members
- Locked items still allow voting/commenting
- Used to finalize specific items while allowing others to be edited

---

### Feature: Reorder Itinerary Items

**Frontend:**

- Drag-and-drop within day (planner only)
- Visual feedback during drag
- Auto-save on drop

**API Endpoint:**

```
PATCH /api/trips/:tripId/itinerary/reorder
Body: {
  itemId: string
  newDayNumber: number
  newSortOrder: number
}
Response: { item: ItineraryItem }
```

**Middleware:**

- requireAuth
- requireTripAccess
- requirePlannerRole (if trip locked)

**Business Rules:**

- Can drag within same day or across days
- sortOrder recalculated for all items on affected days
- Time doesn't auto-update (manual edit if needed)
- Locked items cannot be reordered (unless by planner)

**Edge Cases:**

- Dragging to invalid day → 400
- Simultaneous reorders → Last write wins (rare)
- Reordering locked item → 403 unless planner

---

### Feature: Generate AI Itinerary

**Frontend:**

- Button: "Generate AI Itinerary" (shows if no items or explicitly clicked)
- Loading state: "AI is planning your trip..."
- Progress indicator (if background job)

**API Endpoint:**

```
POST /api/trips/:tripId/generate-itinerary
Body: { regenerate: boolean } // If true, delete existing items
Response: { jobId: string } or { items: ItineraryItem[] } (if sync)

GET /api/trips/:tripId/generate-itinerary/status/:jobId
Response: { status: 'pending' | 'processing' | 'completed' | 'failed', items?: ItineraryItem[] }
```

**Middleware:**

- requireAuth
- requireTripAccess
- requirePlannerRole

**Backend Logic:**

1. Get trip details + member preferences
2. Build Claude prompt with all context
3. Call Claude API (can take 10-30 seconds)
4. Parse response JSON (validate structure)
5. Create itinerary items from AI response
6. Handle failures gracefully

**Business Rules:**

- Only planners can generate
- If items exist, require confirmation to regenerate
- Regenerate = delete all items first
- AI generation rate limited (1 per trip per hour)
- Fallback to template if AI fails
- Member preferences influence AI output

**Edge Cases:**

- AI API timeout → 503 "AI service unavailable, try again"
- Invalid AI response → Use fallback template
- Regenerate with existing bookings → Warn "Booked items will be deleted"
- No member preferences → AI uses trip settings only
- Rate limit hit → 429 "Too many generations, wait 1 hour"

**AI Prompt Structure:**

```
You are a travel planning expert. Generate a day-by-day itinerary.

TRIP DETAILS:
- Destination: {destination}
- Dates: {startDate} to {endDate} ({duration} days)
- Budget: ${budgetPerPerson} per person
- Group size: {groupSize}
- Vibes: {vibes}
- Accommodation: {accommodationPref}
- Dining: {diningPref}

MEMBER PREFERENCES:
{foreach member:
  - {name}: Diet: {dietary}, Budget: {flexibility}, Must-do: {activities}, Pace: {pace}
}

Generate a JSON array of itinerary items:
[
  {
    "dayNumber": 1-{duration},
    "time": "HH:MM",
    "type": "flight|hotel|dining|activity|transport|free_time",
    "name": "Activity name",
    "description": "Details",
    "location": "Address or area",
    "pricePerPerson": 0,
    "duration": 120 (minutes),
    "bookingUrlHint": "Where to book"
  }
]

RULES:
- Day 1 starts with flight (if international)
- Include hotel check-in/check-out
- 3-4 activities per day max
- Balance budget across days
- Consider group preferences
- Add free time for flexibility
- Realistic times (account for transit)
```

---

## Voting System

### Feature: Vote on Itinerary Item

**Frontend:**

- Vote buttons on each item: 👍 Upvote | 👎 Downvote | ⚪ Abstain
- Active button highlighted
- Vote count shown: "+5 / -2" or net "+3"
- Can change vote

**API Endpoint:**

```
POST /api/trips/:tripId/itinerary/:itemId/vote
Body: { voteType: 'up' | 'down' | 'abstain' }
Response: { vote: Vote, voteCounts: { up: number, down: number, abstain: number, net: number } }
```

**Middleware:**

- requireAuth
- requireTripAccess

**Backend Logic:**

1. Check if user already voted
2. If yes, update existing vote
3. If no, create new vote
4. Calculate vote counts for item
5. Return vote + counts

**Business Rules:**

- One vote per user per item
- Can change vote anytime (before deadline if set)
- Abstain = neutral (doesn't affect count)
- Net votes = upvotes - downvotes
- Locked items still allow voting (feedback for organizer)
- Vote deadline: if set, cannot vote after deadline

**Edge Cases:**

- Voting on deleted item → 404
- Voting after deadline → 400 "Vote deadline passed"
- Changing vote rapidly → Debounce on frontend, last write wins
- User removed from trip → Votes remain (historical)

---

### Feature: View Vote Summary

**Frontend:**

- Vote counts on each item
- Vote breakdown modal: shows who voted what
- Highlight items with consensus (>75% approval)
- Highlight items with conflict (<25% approval)

**API Endpoint:**

```
GET /api/trips/:tripId/itinerary/:itemId/votes
Response: {
  votes: Vote[] (with user info)
  counts: { up: number, down: number, abstain: number, net: number }
  consensus: boolean (>75% up)
  conflict: boolean (<25% up)
}
```

**Middleware:**

- requireAuth
- requireTripAccess

**Business Rules:**

- Consensus = (upvotes / (upvotes + downvotes)) > 0.75
- Conflict = (upvotes / (upvotes + downvotes)) < 0.25
- Abstain votes excluded from percentage calc
- Anonymous voting option (future feature)

---

### Feature: Vote Deadline

**Frontend:**

- Countdown timer on trip detail
- Notification when deadline approaching
- Disable voting after deadline

**Backend Logic:**

- Set deadline when creating/editing trip
- Validate voteDeadline < startDate (must vote before trip)
- Background job: send reminders 3 days, 1 day, 1 hour before deadline
- After deadline, voting endpoints return 400

**Business Rules:**

- Deadline must be before trip startDate
- After deadline, votes are locked
- Organizer can extend deadline
- Items added after deadline have no voting (or extend deadline)

**Edge Cases:**

- Deadline in past → 400 when setting
- Extending deadline → Notify members
- Deadline passes mid-vote → Accept in-flight request, reject new

---

## Comments & Chat

### Feature: Comment on Itinerary Item

**Frontend:**

- Comments section below each item
- Text input + "Post" button
- Display: avatar, name, timestamp, comment text
- Edit own comments (15 min window)

**API Endpoint:**

```
POST /api/trips/:tripId/itinerary/:itemId/comments
Body: { content: string }
Response: { comment: Comment }

GET /api/trips/:tripId/itinerary/:itemId/comments
Response: { comments: Comment[] }
```

**Middleware:**

- requireAuth
- requireTripAccess

**Backend Logic:**

1. Validate content (non-empty, max 2000 chars)
2. Sanitize for XSS
3. Create comment
4. Return with user info

**Business Rules:**

- Content max 2000 chars
- No empty comments (after trim)
- Can edit own comments within 15 minutes
- Cannot delete comments (audit trail)
- Markdown support (future: bold, links)

**Edge Cases:**

- Empty content → 400 "Comment cannot be empty"
- XSS attempt → Sanitized before save
- Commenting on deleted item → 404
- Editing after 15 min → 403 "Edit window expired"

---

### Feature: Trip-Level Chat

**Frontend:**

- Route: `/trip/:id` → Chat tab
- Real-time message list (poll every 5s when active)
- Text input with "Send" button
- @mention autocomplete
- Highlight messages where user is mentioned

**API Endpoint:**

```
GET /api/trips/:tripId/chat
Query: ?limit=100&offset=0
Response: { messages: ChatMessage[], hasMore: boolean }

POST /api/trips/:tripId/chat
Body: { content: string, itemId?: string }
Response: { message: ChatMessage }
```

**Middleware:**

- requireAuth
- requireTripAccess

**Backend Logic:**

1. GET: Fetch messages ordered by createdAt DESC, paginate
2. POST: Validate content, sanitize, create message
3. Parse @mentions (optional: notify mentioned users)
4. Return message with user info

**Business Rules:**

- Content max 2000 chars
- Poll every 5 seconds for new messages
- Load 100 messages initially, infinite scroll for more
- @mention: @username highlights for that user
- Cannot edit or delete messages (simplicity)
- itemId optional: link message to specific itinerary item

**Edge Cases:**

- Empty message → 400
- @mention non-member → Allowed (no notification)
- Rapid message sending → Rate limit (10 per minute)
- Very long message → Truncate at 2000 chars
- Special characters in @mention → Parse carefully

---

### Feature: Message Notifications

**Frontend:**

- Badge on Chat tab when new messages
- Desktop notification if @mentioned (opt-in)
- Mark as read when tab opened

**Backend Logic:**

- Track last read message per user (new table: chat_read_status)
- Count unread = messages after last read
- Send push notification if @mentioned (Tier 2 feature)

**Business Rules:**

- Unread count resets when tab viewed
- @mention triggers notification (if enabled)
- Mute chat option (future)

---

## Member Management

### Feature: Invite Members

**Frontend:**

- "Invite Members" button on Team tab
- Modal: email input (comma-separated or multi-entry)
- Shows pending invites

**API Endpoint:**

```
POST /api/trips/:tripId/invite
Body: { emails: string[] }
Response: {
  invited: string[] (successfully invited)
  failed: { email: string, reason: string }[]
}
```

**Middleware:**

- requireAuth
- requireTripAccess
- requirePlannerRole

**Backend Logic:**

1. Validate emails
2. Check each email:
   - Already a member? → Skip
   - Existing user? → Create tripMember directly
   - New user? → Create tripInvite, send email
3. Generate invite tokens (expire in 7 days)
4. Send invitation emails
5. Return summary

**Business Rules:**

- Only planners can invite
- Max 50 members per trip
- Invite expires in 7 days
- Can re-invite declined members
- Cannot invite organizer

**Edge Cases:**

- Invalid email format → Add to failed list
- Already member → Skip silently
- Trip at capacity → 400 "Trip full"
- Email service down → Create invite but fail email, notify planner

---

### Feature: Accept/Decline Invite

**Frontend:**

- Email contains link: `/join/:inviteToken`
- Shows trip preview
- Buttons: "Accept" | "Decline"

**API Endpoint:**

```
POST /api/trips/invites/:token/accept
Response: { trip: Trip }

POST /api/trips/invites/:token/decline
Response: { success: true }
```

**Middleware:**

- requireAuth (must login/register first)

**Backend Logic:**

1. Verify token validity (not expired)
2. Find invite
3. Accept: Create tripMember (rsvpStatus='accepted'), update invite
4. Decline: Update invite status, optionally delete tripMember
5. Redirect to trip or dashboard

**Business Rules:**

- Token expires in 7 days
- Must be logged in to accept/decline
- Cannot accept if trip full
- Declining removes from trip
- Can be re-invited after decline

**Edge Cases:**

- Expired token → 400 "Invite expired"
- Already accepted → 400 "Already a member"
- Trip full → 400 "Trip is full"
- Trip deleted → 404

---

### Feature: View Members

**Frontend:**

- Team tab shows all members
- Avatar, name, role, RSVP status
- Pending invites shown separately
- Organizer badge on organizer

**API Endpoint:**

```
GET /api/trips/:tripId/members
Response: {
  members: TripMember[] (accepted)
  pending: TripInvite[]
}
```

**Middleware:**

- requireAuth
- requireTripAccess

**Business Rules:**

- Show accepted members first
- Pending invites shown separately
- Organizer always listed first
- Display email for pending invites

---

### Feature: Remove Member

**Frontend:**

- Remove button next to member (planner only)
- Confirmation dialog
- Cannot remove organizer

**API Endpoint:**

```
DELETE /api/trips/:tripId/members/:userId
Response: { success: true }
```

**Middleware:**

- requireAuth
- requireTripAccess
- requirePlannerRole

**Backend Logic:**

1. Check if target is organizer → Block
2. Check if target is self → Allow (leave trip)
3. Delete tripMember record
4. Optionally notify removed user

**Business Rules:**

- Cannot remove organizer
- Planners can remove members
- Members can leave voluntarily
- Removing member keeps their votes/comments (historical)
- Removing member keeps their expenses (financial audit)

**Edge Cases:**

- Removing organizer → 403 "Cannot remove organizer"
- Removing self → Allowed (leave trip)
- Last member leaving → Trip remains (organizer always stays)

---

### Feature: Change Member Role

**Frontend:**

- Role dropdown on member card (organizer only)
- Confirm promotion to planner

**API Endpoint:**

```
PATCH /api/trips/:tripId/members/:userId/role
Body: { role: 'planner' | 'member' }
Response: { member: TripMember }
```

**Middleware:**

- requireAuth
- requireTripAccess
- Organizer only (stricter than planner)

**Business Rules:**

- Only organizer can change roles
- Cannot demote organizer
- Planners have edit access to itinerary, members, settings
- Members have view + vote + comment access

---

### Feature: Member Preferences

**Frontend:**

- Preference form on Team tab (each member completes for self)
- Fields: dietary restrictions, budget flexibility, must-do activities, accessibility needs, pace
- Used by AI for itinerary generation

**API Endpoint:**

```
GET /api/trips/:tripId/members/:userId/preferences
Response: { preferences: MemberPreferences }

POST /api/trips/:tripId/members/me/preferences
Body: { (preference fields) }
Response: { preferences: MemberPreferences }
```

**Middleware:**

- requireAuth
- requireTripAccess

**Backend Logic:**

1. GET: Organizer can view all, members can view own
2. POST: Members can only edit their own preferences
3. Upsert (create or update)

**Business Rules:**

- Each member has one preference record per trip
- Optional fields (all can be empty)
- Preferences influence AI itinerary generation
- Organizer can view all preferences (transparency)

---

## Expense Tracking & Settlement

### Feature: Add Expense

**Frontend:**

- "Add Expense" button on Expenses tab
- Form:
  - Amount (number, required)
  - Description (text, required)
  - Category (select: transport, food, accommodation, activity, other)
  - Date (date picker, default today)
  - Paid by (select member, default current user)
  - Split among (multi-select members, default all)
  - Receipt photo (file upload, optional)
  - Link to itinerary item (optional)

**API Endpoint:**

```
POST /api/trips/:tripId/expenses
Body: {
  amount: number
  description: string
  category: string
  date: ISO date
  paidByUserId: UUID
  splitAmong: UUID[]
  receiptImageUrl?: string
  itemId?: UUID
}
Response: { expense: Expense }
```

**Middleware:**

- requireAuth
- requireTripAccess

**Backend Logic:**

1. Validate all fields
2. Verify paidByUserId is trip member
3. Verify all splitAmong users are trip members
4. Validate itemId belongs to trip (if provided)
5. Create expense record
6. Calculate balances (for display)

**Business Rules:**

- Amount min 0, max 1,000,000
- Description max 500 chars
- Date should be within trip dates (warn if outside)
- Paid by must be trip member
- Split among must be non-empty array
- Split among members must all be trip members
- Equal split: amount / splitAmong.length
- Cannot add expenses for cancelled trips

**Edge Cases:**

- Amount = 0 → Allowed (free item, tracking only)
- Date before trip start → Allow with warning
- Date >7 days after trip end → Warn "Add during trip"
- Split among not including payer → Allowed (someone else paid for them)
- Invalid itemId → 400 "Item not found"
- Receipt upload fails → Save expense anyway, allow re-upload

---

### Feature: Edit Expense

**Frontend:**

- Edit button on expense card
- Same form as add (pre-filled)
- Cannot edit if settled (flag)

**API Endpoint:**

```
PATCH /api/trips/:tripId/expenses/:expenseId
Body: { (any editable fields) }
Response: { expense: Expense }
```

**Middleware:**

- requireAuth
- requireTripAccess

**Backend Logic:**

1. Check if expense belongs to trip
2. Check if settled → Block or require confirmation
3. Update fields
4. Recalculate balances

**Business Rules:**

- Can edit own expenses anytime
- Organizer can edit any expense
- Cannot edit settled expenses (require unsettling first)
- Editing recalculates split amounts

**Edge Cases:**

- Editing settled expense → 400 "Cannot edit settled expense"
- Changing split amount → Recalculate balances
- Removing user from split → Must have at least 1 user

---

### Feature: Delete Expense

**Frontend:**

- Delete button with confirmation
- Extra confirmation if settled

**API Endpoint:**

```
DELETE /api/trips/:tripId/expenses/:expenseId
Body: { confirm: boolean } (required if settled)
Response: { success: true }
```

**Middleware:**

- requireAuth
- requireTripAccess

**Business Rules:**

- Can delete own expenses
- Organizer can delete any expense
- Deleting settled expense requires confirmation
- Recalculate balances after delete

---

### Feature: Calculate Settlement

**Frontend:**

- Settlement summary card on Expenses tab
- Shows: who owes whom, exact amounts
- Suggests optimal transactions (minimize # of payments)
- Export summary as CSV

**API Endpoint:**

```
GET /api/trips/:tripId/expenses/settlement
Response: {
  balances: { userId: string, balance: number }[]
  transactions: { from: userId, to: userId, amount: number }[]
  totalSpent: number
  perPerson: number
}
```

**Middleware:**

- requireAuth
- requireTripAccess

**Backend Logic:**

1. Calculate each user's balance:
   - For each expense:
     - Payer: +amount
     - Splitters: -(amount / splitAmong.length)
2. Sum balances per user
3. Optimize transactions (debt simplification algorithm):
   - Sort users by balance (debtors, creditors)
   - Match largest debtor with largest creditor
   - Create transaction for min(debtor, creditor)
   - Repeat until all settled

**Settlement Algorithm:**

```javascript
function calculateSettlement(expenses) {
  const balances = {};

  // Calculate balances
  expenses.forEach((exp) => {
    const amountPerPerson = exp.amount / exp.splitAmong.length;
    balances[exp.paidByUserId] = (balances[exp.paidByUserId] || 0) + exp.amount;
    exp.splitAmong.forEach((userId) => {
      balances[userId] = (balances[userId] || 0) - amountPerPerson;
    });
  });

  // Separate debtors and creditors
  const debtors = Object.entries(balances)
    .filter(([_, b]) => b < 0)
    .map(([id, b]) => ({ id, amount: -b }));
  const creditors = Object.entries(balances)
    .filter(([_, b]) => b > 0)
    .map(([id, b]) => ({ id, amount: b }));

  // Optimize transactions
  const transactions = [];
  let i = 0,
    j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debt = debtors[i].amount;
    const credit = creditors[j].amount;
    const amount = Math.min(debt, credit);

    transactions.push({ from: debtors[i].id, to: creditors[j].id, amount });

    debtors[i].amount -= amount;
    creditors[j].amount -= amount;

    if (debtors[i].amount === 0) i++;
    if (creditors[j].amount === 0) j++;
  }

  return { balances, transactions };
}
```

**Business Rules:**

- Balance = total paid - total owed
- Positive balance = overpaid (should receive)
- Negative balance = underpaid (should pay)
- Round to 2 decimal places
- Optimize to minimize # of transactions

**Edge Cases:**

- No expenses → Empty settlement
- Perfect split → All balances = 0
- One person paid everything → Others owe them
- Floating point precision → Round carefully
- Currency conversion → Convert all to trip currency first

---

### Feature: Mark Expenses as Settled

**Frontend:**

- Checkbox on settlement summary
- "Mark as Settled" button (organizer only)
- Settled expenses grayed out

**API Endpoint:**

```
POST /api/trips/:tripId/expenses/settle
Body: { expenseIds: UUID[] }
Response: { settled: number }
```

**Middleware:**

- requireAuth
- requireTripAccess
- requirePlannerRole

**Business Rules:**

- Only organizer can mark settled
- Settled expenses locked from editing
- Can unsettle if needed (undo)

---

### Feature: Export Expenses

**Frontend:**

- "Export CSV" button
- Downloads expense report

**API Endpoint:**

```
GET /api/trips/:tripId/expenses/export
Response: CSV file download
```

**CSV Format:**

```
Date,Description,Category,Amount,Paid By,Split Among,Balance
2024-09-15,Dinner at Le Bernardin,food,240.00,John,John;Sarah;Alex,-80.00
...
```

**Business Rules:**

- Include all expenses (settled + unsettled)
- Calculate running balance per user
- Include settlement summary at end

---

## Booking Management

### Feature: Update Booking Status

**Frontend:**

- Status dropdown on itinerary item
- Options: not_started, in_progress, booked, cancelled
- Color-coded badges

**API Endpoint:**

```
PATCH /api/trips/:tripId/itinerary/:itemId/booking
Body: {
  bookingStatus: string
  bookedByUserId?: UUID
  confirmationNumber?: string
  confirmationImageUrl?: string
}
Response: { item: ItineraryItem }
```

**Middleware:**

- requireAuth
- requireTripAccess

**Backend Logic:**

1. Validate status enum
2. If status = 'booked', require bookedByUserId
3. Update item
4. Calculate booking progress for trip

**Business Rules:**

- When status → 'booked': bookedByUserId required
- Confirmation number optional but recommended
- Status transitions: not_started → in_progress → booked
- Can skip to booked directly
- Cancelled status allowed from any state

**Edge Cases:**

- Marking booked without bookedBy → 400 "User required"
- Cancelling booked item → Allowed
- Re-booking cancelled item → Allowed

---

### Feature: Upload Confirmation

**Frontend:**

- File upload on booking status form
- Accepts: images (JPG, PNG), PDFs
- Shows thumbnail if uploaded

**API Endpoint:**

```
POST /api/trips/:tripId/itinerary/:itemId/booking/upload
Body: FormData (file)
Response: { url: string }
```

**Backend Logic:**

1. Validate file type (images, PDF only)
2. Validate file size (max 10MB)
3. Upload to cloud storage (S3/R2)
4. Generate secure URL
5. Return URL to save in confirmationImageUrl

**Business Rules:**

- Max 10MB per file
- Allowed types: JPG, PNG, PDF
- Store in private bucket
- Generate signed URLs for viewing

**Edge Cases:**

- Invalid file type → 400 "Invalid file type"
- File too large → 413 "File too large"
- Upload fails → 500 "Upload failed, try again"

---

### Feature: Assign Booking Task

**Frontend:**

- "Assign to" dropdown on item
- Assigns member to handle booking
- Notification sent to assignee

**API Endpoint:**

```
PATCH /api/trips/:tripId/itinerary/:itemId/assign
Body: { assignedTo: UUID }
Response: { item: ItineraryItem }
```

**Business Rules:**

- Can assign to any trip member
- Assignee gets notification
- Doesn't enforce (just a suggestion)
- Can reassign anytime

---

## Packing Lists

### Feature: Add Packing Item

**Frontend:**

- "Add Item" button on packing list
- Form: name, category, quantity, assign to, notes

**API Endpoint:**

```
POST /api/trips/:tripId/packing
Body: {
  name: string
  category: string
  quantity: number
  assignedTo?: UUID
  notes?: string
}
Response: { item: PackingItem }
```

**Middleware:**

- requireAuth
- requireTripAccess

**Business Rules:**

- Name max 200 chars
- Quantity min 1
- assignedTo must be trip member (or null for shared)
- Auto-suggest common items based on destination/season (future AI)

---

### Feature: Mark Item as Packed

**Frontend:**

- Checkbox next to item
- Only assignee can check (or organizer)

**API Endpoint:**

```
PATCH /api/trips/:tripId/packing/:itemId/pack
Body: { isPacked: boolean }
Response: { item: PackingItem }
```

**Middleware:**

- requireAuth
- requireTripAccess

**Backend Logic:**

1. Check if current user = assignedTo OR organizer
2. Update isPacked
3. Return item

**Business Rules:**

- Only assigned user can mark packed (exception: organizer)
- Can uncheck if needed
- Progress bar: packed / total items

---

## Transportation

### Feature: Add Transportation Entry

**Frontend:**

- Form: type (driver/passenger/ride_share), driver, passengers, vehicle, locations, time

**API Endpoint:**

```
POST /api/trips/:tripId/transportation
Body: {
  type: string
  driverId?: UUID
  passengers: UUID[]
  vehicleInfo?: string
  departureLocation: string
  arrivalLocation: string
  departureTime: ISO timestamp
  notes?: string
}
Response: { entry: TransportationEntry }
```

**Business Rules:**

- All users must be trip members
- If type=driver, driverId required
- Driver cannot be in passengers
- Departure time should be within trip dates

**Edge Cases:**

- Driver in passengers → 400 "Driver cannot be passenger"
- Invalid user IDs → 400 "User not found"

---

## Documents & Emergency Contacts

### Feature: Upload Document

**Frontend:**

- File upload with type selection
- Optional: expiry date, belongs to user

**API Endpoint:**

```
POST /api/trips/:tripId/documents
Body: FormData {
  file: File
  documentType: string
  title: string
  expiryDate?: ISO date
  belongsToUserId?: UUID
}
Response: { document: TripDocument }
```

**Business Rules:**

- Max 10MB, PDF/JPG/PNG only
- Store in private storage
- Expiry warning if <30 days
- Sensitive docs (passport) require extra auth to view

---

### Feature: Add Emergency Contact

**Frontend:**

- Form: name, relationship, phone, email

**API Endpoint:**

```
POST /api/trips/:tripId/emergency-contacts
Body: { name, relationship, phone, email? }
Response: { contact: EmergencyContact }
```

**Business Rules:**

- Phone required, email optional
- Encrypt phone in database
- Only owner + organizer can view
- Used in emergencies only

---

## Photos & Memories

### Feature: Upload Photos

**Frontend:**

- Batch upload (up to 50 at once)
- Auto-extract EXIF (date, location)
- Optional caption

**API Endpoint:**

```
POST /api/trips/:tripId/photos
Body: FormData (multiple files)
Response: { photos: TripPhoto[] }
```

**Business Rules:**

- Max 25MB per photo
- Auto-generate thumbnails
- Extract EXIF data
- Group by day in display

---

## Polls & Quick Decisions

### Feature: Create Poll

**Frontend:**

- Form: question, 2-10 options, allow multiple, expiry

**API Endpoint:**

```
POST /api/trips/:tripId/polls
Body: {
  question: string
  options: string[]
  allowMultiple: boolean
  expiresAt?: ISO timestamp
}
Response: { poll: Poll }
```

**Business Rules:**

- 2-10 options required
- Options must be unique
- Cannot edit after first vote

---

### Feature: Vote on Poll

**Frontend:**

- Radio buttons (single) or checkboxes (multiple)
- Results shown after voting

**API Endpoint:**

```
POST /api/trips/:tripId/polls/:pollId/vote
Body: { selectedOptions: number[] }
Response: { vote: PollVote, results: { option: string, count: number }[] }
```

**Business Rules:**

- If allowMultiple=false, selectedOptions.length must be 1
- Can change vote before expiry
- Show percentages in results

---

## Weather Integration

### Feature: View Weather Forecast

**Frontend:**

- Weather card on each day in itinerary
- Hourly breakdown (scrollable)
- Icons for conditions

**API Endpoint:**

```
GET /api/trips/:tripId/weather
Response: {
  forecast: {
    [dayNumber]: {
      hourly: { time, temp, weatherCode, precipProb }[]
    }
  }
}
```

**Backend Logic:**

1. Get trip destination
2. Geocode to lat/lng (Open-Meteo API)
3. Fetch hourly forecast for trip dates
4. Map WMO weather codes to icons
5. Return forecast by day

**Business Rules:**

- Only fetch for trips starting within 16 days (API limit)
- Cache forecast for 6 hours
- Show warning if forecast unavailable

---

## AI Features

### Feature: Budget Optimization

**API Endpoint:**

```
POST /api/trips/:tripId/ai/optimize-budget
Response: {
  suggestions: {
    itemId: UUID
    action: 'downgrade' | 'remove' | 'swap'
    description: string
    savings: number
    reasoning: string
  }[]
  totalSavings: number
}
```

**Backend Logic:**

1. Get all itinerary items + expenses + preferences
2. Build Claude prompt with context
3. Call Claude API
4. Parse structured JSON response
5. Return suggestions

**Business Rules:**

- Rate limit: 10 AI calls per user per hour
- Consider member preferences (don't suggest removing must-dos)
- Provide realistic alternatives

---

### Feature: Conflict Detection

**Backend Logic (runs automatically on itinerary changes):**

1. Get all items for each day
2. Calculate time gaps
3. Detect issues:
   - Flight landing → activity gap <2hr
   - Different locations → transit time missing
   - Hotel check-in before 3pm
4. Call Claude for suggestions
5. Store conflicts in DB
6. Show warnings in UI

---

### Feature: Smart Expense Splitting

**Backend Logic:**

1. OCR receipt (Google Vision API)
2. Parse items and prices
3. Get member context (dietary restrictions)
4. Call Claude to suggest split
5. Return split with reasoning

---

## Analytics & Insights

### Feature: Trip Analytics

**Frontend:**

- Analytics dashboard (More tab)
- Charts: budget breakdown, activity types, booking progress

**API Endpoint:**

```
GET /api/trips/:tripId/analytics
Response: {
  budgetBreakdown: { category: string, amount: number }[]
  activityTypes: { type: string, count: number }[]
  bookingProgress: number
  votingParticipation: number
}
```

**Business Rules:**

- Budget breakdown by category
- Activity types distribution
- Booking progress percentage
- Voting participation rate

---

### Feature: Learned Preferences

**Backend Logic (runs after trip completion):**

1. Analyze user's behavior:
   - Which activities rated highly
   - Which activities skipped
   - Budget patterns
   - Pace preferences
2. Call Claude to extract patterns
3. Store in userLearnedPreferences
4. Use for future trip suggestions

---

## Global Business Rules

### Trip Lifecycle

1. **Planning** → **Booking** → **Active** → **Completed**
2. Transitions:
   - Planning → Booking: Vote deadline passed or manual
   - Booking → Active: startDate reached (automatic)
   - Active → Completed: endDate passed (automatic)
3. Cancelled status can be set from any state (organizer only)

### Permission Hierarchy

1. **Organizer:** Full access (create, edit, delete, lock, assign roles)
2. **Planner:** Edit itinerary, manage members, view all data
3. **Member:** View, vote, comment, add expenses, chat

### Rate Limits

- **Auth endpoints:** 5 attempts per 15 minutes per IP
- **AI features:** 10 calls per hour per user
- **File uploads:** 50 photos per batch, 10MB per file
- **Chat messages:** 10 per minute per user
- **API calls:** 200 per 15 minutes per user (global)

### Data Privacy

- **Emergency contacts:** Encrypted, owner + organizer only
- **Documents:** Private storage, signed URLs
- **Location sharing:** Opt-in, deleted after trip
- **Trip data:** Only members can access
- **GDPR:** Data export + deletion endpoints required

### Data Retention

- **Active trips:** Indefinite
- **Completed trips:** Indefinite (user can delete)
- **Cancelled trips:** 30 days then auto-delete (configurable)
- **Location data:** Delete 1 day after trip ends
- **Audit logs:** 1 year retention

### Financial Rules

- **Currency:** Default USD, support multi-currency (future)
- **Rounding:** 2 decimal places
- **Settlement:** Optimize for minimum transactions
- **Expenses:** Cannot be negative

### Validation Standards

- **Emails:** RFC 5322 format, lowercase storage
- **UUIDs:** v4 format
- **Dates:** ISO 8601 format
- **URLs:** Valid HTTP/HTTPS
- **Text fields:** XSS sanitization required

---

## Error Handling Standards

### HTTP Status Codes

- **200 OK:** Successful GET/PATCH
- **201 Created:** Successful POST
- **204 No Content:** Successful DELETE
- **400 Bad Request:** Validation errors, invalid input
- **401 Unauthorized:** Missing or invalid auth token
- **403 Forbidden:** Insufficient permissions
- **404 Not Found:** Resource doesn't exist
- **409 Conflict:** Duplicate resource (e.g., email exists)
- **413 Payload Too Large:** File upload too large
- **429 Too Many Requests:** Rate limit exceeded
- **500 Internal Server Error:** Unexpected server error
- **503 Service Unavailable:** External API failure (AI, email)

### Error Response Format

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "details": {} // Optional: field-level errors
}
```

### Error Codes

- `AUTH_REQUIRED`: Missing authentication
- `INVALID_TOKEN`: Expired/invalid JWT
- `ACCESS_DENIED`: Insufficient permissions
- `TRIP_NOT_FOUND`: Trip doesn't exist
- `TRIP_FULL`: Cannot join, at capacity
- `TRIP_LOCKED`: Cannot edit locked trip
- `VALIDATION_ERROR`: Input validation failed
- `RATE_LIMITED`: Too many requests
- `AI_ERROR`: AI service failure
- `UPLOAD_FAILED`: File upload failure

### Frontend Error Handling

- **Network errors:** Retry with exponential backoff
- **Validation errors:** Show inline on form fields
- **Permission errors:** Redirect to trip list
- **Rate limits:** Show countdown timer
- **AI failures:** Show fallback UI

---

## Edge Cases Summary

### Authentication

- Token expires mid-session → Redirect to login
- Multiple tabs logged in → Sync auth state
- Login from different device → Allow (multi-device)

### Trip Management

- Organizer leaves trip → Cannot leave (must delete trip or transfer ownership)
- All members decline invite → Trip exists with only organizer
- Trip starts while editing → Changes saved if valid
- Trip deleted while member viewing → 404 on next action

### Itinerary

- Adding item to past day → Allow with warning
- Deleting booked item → Require confirmation
- Simultaneous edits → Last write wins (no conflict resolution)
- Drag-drop across days → Recalculate day boundaries

### Voting

- Voting after deadline → Block with error
- Changing vote rapidly → Debounce, last vote wins
- Item deleted with votes → Cascade delete votes

### Expenses

- Deleting user with expenses → Keep expenses, mark user as "[Removed User]"
- Editing settled expenses → Require unsettling first
- Floating point rounding → Always round to 2 decimals
- Multi-currency → Convert to trip currency (use historical rates)

### Chat

- Message during network outage → Queue locally, send when back online
- @mentioning removed user → Allowed (no notification)
- Very long messages → Truncate at 2000 chars

### Files

- Upload timeout → Retry with smaller chunks
- Corrupt file → Validate on server, return error
- Missing file (deleted from storage) → Show placeholder

### AI

- API timeout → 30s timeout, return error
- Invalid response → Use fallback logic
- Rate limit → Show "Try again in X minutes"

---

## Testing Requirements

### Unit Tests

- All business logic functions
- Input validation (Zod schemas)
- Settlement algorithm
- AI prompt builders

### Integration Tests

- Auth flow (register, login, token)
- Trip CRUD operations
- Itinerary management
- Expense calculations

### E2E Tests

- Complete trip creation flow
- Invite + accept flow
- Voting on items
- Settlement calculation

### Security Tests

- SQL injection attempts
- XSS payloads
- Authorization bypass attempts
- Rate limit enforcement

---

## Performance Requirements

### API Response Times

- GET endpoints: <200ms (95th percentile)
- POST endpoints: <500ms (95th percentile)
- AI endpoints: <30s (timeout after)
- File uploads: <10s for 10MB

### Database Queries

- Single trip fetch: <50ms
- Itinerary list: <100ms
- Settlement calculation: <200ms
- Use indexes on all foreign keys

### Frontend Performance

- First contentful paint: <1.5s
- Time to interactive: <3s
- Bundle size: <500KB (gzipped)

---

## Deployment Checklist

### Pre-Launch

- [ ] All Tier 0 security implemented (HTTPS, auth, encryption)
- [ ] Environment variables secured
- [ ] Rate limiting configured
- [ ] Error logging (Sentry)
- [ ] Database backups automated
- [ ] SSL certificates installed
- [ ] CORS configured
- [ ] Health check endpoint (/health)

### Post-Launch

- [ ] Monitor error rates
- [ ] Track API response times
- [ ] Monitor database performance
- [ ] Set up alerts (downtime, errors)
- [ ] User feedback collection

---

**End of Technical Specifications**

This document should be updated as features evolve. All developers must reference this before implementing features.
