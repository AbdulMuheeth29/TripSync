# TripSync Architecture

**Version**: 1.0.0
**Last Updated**: 2026-05-15

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Browser    │  │   Mobile     │  │   Desktop    │      │
│  │  (Chrome,    │  │   (PWA)      │  │   (PWA)      │      │
│  │  Safari, FF) │  │              │  │              │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                     React 19 App                             │
│              (TypeScript + Vite + TailwindCSS)              │
│                                                               │
└───────────────────────────┬─────────────────────────────────┘
                            │
                    HTTPS / REST API
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                      APPLICATION LAYER                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Node.js + Express Server                  │ │
│  │                   (TypeScript)                         │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │ │
│  │  │  Routes  │ │   Auth   │ │    AI    │ │  Upload  │ │ │
│  │  │  /api/*  │ │  (JWT)   │ │ Service  │ │  Routes  │ │ │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ │ │
│  │       │            │            │            │        │ │
│  │  ┌────┴────────────┴────────────┴────────────┴─────┐  │ │
│  │  │            Storage Layer (IStorage)            │  │ │
│  │  │  - storage-pg.ts (PostgreSQL Implementation)   │  │ │
│  │  │  - storage.ts (In-Memory Fallback)            │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
└───┬───────────────┬───────────────┬───────────────┬─────────┘
    │               │               │               │
    │               │               │               │
┌───┴───┐      ┌────┴────┐     ┌───┴───┐      ┌────┴────┐
│ DATA  │      │  CACHE  │     │  AI   │      │ STORAGE │
│ LAYER │      │  LAYER  │     │ LAYER │      │  LAYER  │
└───────┘      └─────────┘     └───────┘      └─────────┘
```

---

## Component Breakdown

### 1. **Client Layer** (Frontend)

**Technology**: React 19 + TypeScript + Vite

**Key Components:**
- `App.tsx` - Main application router
- `pages/` - Route pages (Landing, Dashboard, Trip Detail, etc.)
- `components/` - Reusable UI components (Radix UI)
- `lib/` - Utilities (API client, auth context, analytics)
- `hooks/` - Custom React hooks

**Features:**
- Progressive Web App (PWA) with offline support
- Service Worker for caching
- Push notifications
- Dark mode support
- Mobile-first responsive design

**State Management:**
- TanStack Query for server state
- React Context for auth
- Local state with hooks

---

### 2. **Application Layer** (Backend)

**Technology**: Node.js 20 + Express + TypeScript

#### 2.1 **API Routes** (`server/routes.ts`)

**Endpoints**:
- `/api/auth/*` - Authentication (register, login, logout, password reset)
- `/api/trips/*` - Trip CRUD, itinerary, expenses
- `/api/upload/*` - File uploads
- `/api/stripe/*` - Billing webhooks
- `/api/atlas/*` - AI assistant

**Middleware**:
- `requireAuth` - JWT verification
- `requireTripAccess` - Trip permission checking
- `requireRole` - Role-based access (organizer, planner, member)
- Rate limiting (per endpoint)
- Error handling

#### 2.2 **Auth Service** (`server/auth.ts`)

**Features**:
- JWT token generation and verification
- Password hashing (bcrypt)
- Token blacklist (Redis-backed)
- Session management

**Flow**:
```
User → Register/Login → JWT Token → Store in localStorage
                                   → Include in Authorization header
                                   → Verify on each request
```

#### 2.3 **AI Service** (`server/ai-service.ts`)

**Integration**: Anthropic Claude Sonnet 4.5

**Capabilities**:
- Trip itinerary generation
- Atlas AI assistant (conversational)
- Packing list generation
- Budget optimization suggestions
- Email parsing (booking confirmations)
- Conflict resolution suggestions

**Rate Limiting**: 10 requests per hour (configurable)

#### 2.4 **Storage Layer**

**Interface**: `IStorage` (abstract)

**Implementations**:
1. **PostgreSQL** (`server/storage-pg.ts`) - Production
2. **In-Memory** (`server/storage.ts`) - Development/Testing

**Methods**: ~50+ CRUD operations
- Users, Trips, Members, Itinerary
- Expenses, Votes, Comments
- Photos, Documents, Polls
- Preferences, Analytics

**Caching**: Redis-backed with key patterns
- `user:{userId}`
- `trip:{tripId}`
- `trip:{tripId}:members`
- `trip:{tripId}:items`

**Cache Invalidation**: On writes (create, update, delete)

#### 2.5 **File Upload** (`server/upload-routes.ts`, `server/cloud-storage.ts`)

**Support**:
- AWS S3
- Cloudflare R2 (S3-compatible)

**File Types**:
- Photos: JPG, PNG, HEIC, WebP (max 25MB)
- Documents: PDF, JPG, PNG (max 10MB)
- Receipts: JPG, PNG (max 10MB)

**Storage Structure**:
```
bucket/
├── photos/
│   ├── {tripId}/{photoId}.jpg
├── documents/
│   ├── {tripId}/{docId}.pdf
└── receipts/
    ├── {tripId}/{expenseId}.jpg
```

#### 2.6 **Email Service** (`server/email-service.ts`)

**Provider**: Configurable SMTP (Gmail, SendGrid, AWS SES)

**Email Types**:
- Welcome email (registration)
- Password reset
- Trip invitation
- Trip update notifications
- Weekly trip digest

**Templates**: HTML + text fallback

---

### 3. **Data Layer**

**Primary Database**: PostgreSQL 16

**Schema** (`shared/schema.ts`):
- `users` - User accounts
- `trips` - Trip metadata
- `trip_members` - User-trip relationships
- `itinerary_items` - Activities, accommodations
- `expenses` - Expense tracking
- `votes` - Activity voting
- `comments` - Item discussions
- `chat_messages` - In-memory chat (v1.0)
- `trip_photos` - Photo metadata
- `trip_documents` - Document metadata
- `polls` - Group polls
- `packing_items` - Packing lists
- `transportation_entries` - Flights, trains
- `emergency_contacts` - Emergency info
- `mood_board_items` - Trip inspiration
- `atlas_conversations` - AI chat history
- `subscriptions` - Billing data

**ORM**: Drizzle ORM
- Type-safe queries
- Schema-first approach
- Migration generation
- Connection pooling (pg)

**Migrations**: `migrations/` folder
- Version controlled
- Run with `npm run db:migrate`
- Rollback support

---

### 4. **Cache Layer** (Optional)

**Technology**: Redis 7

**Usage**:
- Session storage
- Token blacklist
- API response caching
- Rate limiting counters
- User preferences

**Fallback**: In-memory if Redis unavailable

**TTLs**:
- User sessions: 7 days
- API cache: 5 minutes
- Token blacklist: Until expiry
- Rate limit: 1 hour

---

### 5. **AI Layer**

**Provider**: Anthropic Claude API

**Models**:
- Claude Sonnet 4.5 (primary)
- Configurable model selection

**Prompt Engineering**:
- System prompts for consistency
- Context window: 200K tokens
- Streaming responses (for chat)

**Safety**:
- Input validation
- Output sanitization
- Rate limiting
- Cost monitoring

---

### 6. **Storage Layer** (Files)

**Providers**:
- AWS S3
- Cloudflare R2 (recommended - cheaper)

**Features**:
- Pre-signed URLs (secure access)
- Public URLs (optional)
- Multipart upload (large files)
- Batch operations

**CORS Configuration**: Whitelist app domain

---

### 7. **External Services**

#### Stripe (Optional)
- Checkout sessions
- Subscription webhooks
- Customer portal

#### Web Push (Optional)
- VAPID keys
- Push subscriptions per user
- Notification triggers

#### Sentry (Optional)
- Error tracking
- Performance monitoring
- Release tracking

#### Analytics (Optional)
- PostHog (recommended)
- Google Analytics (fallback)

---

## Data Flow Examples

### Example 1: User Creates a Trip

```
1. User fills out trip form in browser
   └─> POST /api/trips {destination, dates, ...}

2. Express receives request
   └─> requireAuth middleware checks JWT
   └─> Validates input
   └─> Calls storage.createTrip()

3. Storage layer (PostgreSQL)
   └─> INSERT INTO trips VALUES (...)
   └─> INSERT INTO trip_members (user as organizer)
   └─> RETURN trip object

4. If AI enabled:
   └─> Call AI service to generate itinerary
   └─> Store itinerary items in database

5. Cache invalidated:
   └─> Redis: DELETE user:{userId}:trips

6. Response sent to client
   └─> {trip: {...}, itinerary: [...]}

7. Client updates UI
   └─> Redirect to /trip/{id}
```

### Example 2: Member Votes on Activity

```
1. User clicks thumbs-up on activity
   └─> POST /api/items/{itemId}/vote {vote: "up"}

2. Express checks permissions
   └─> requireAuth + requireTripAccess

3. Storage layer
   └─> UPSERT INTO votes (userId, itemId, voteType)
   └─> UPDATE itinerary_items SET votes = votes + 1

4. Cache invalidated
   └─> Redis: DELETE trip:{tripId}:items

5. Websocket (future) or polling
   └─> Notify other users of vote change

6. Response
   └─> {votes: 5, userVote: "up"}
```

### Example 3: AI Trip Generation

```
1. User clicks "Generate Itinerary"
   └─> POST /api/trips/{id}/generate {preferences}

2. Rate limit check
   └─> Redis: INCR ai:user:{userId}:count
   └─> Check < 10 per month (free tier)

3. Gather trip context
   └─> Fetch trip details
   └─> Fetch member preferences
   └─> Compile prompt

4. Call Claude API
   └─> Send structured prompt
   └─> Stream response
   └─> Parse JSON structure

5. Store generated items
   └─> Batch INSERT itinerary_items

6. Return to client
   └─> {itinerary: [...]}
```

---

## Security Architecture

### Authentication Flow

```
┌─────────┐                     ┌─────────┐
│ Browser │                     │ Server  │
└────┬────┘                     └────┬────┘
     │                               │
     │  POST /api/auth/register      │
     │───────────────────────────────>│
     │  {email, password, username}  │
     │                               │
     │                     ┌─────────┴──────────┐
     │                     │ 1. Hash password    │
     │                     │    (bcrypt)         │
     │                     │ 2. INSERT user      │
     │                     │ 3. Generate JWT     │
     │                     │    (HS256, 7d exp) │
     │                     └─────────┬──────────┘
     │                               │
     │  {user: {...}, token: "..."}  │
     │<───────────────────────────────│
     │                               │
     │  Store token in localStorage  │
     │                               │
     │  GET /api/trips               │
     │  Header: Authorization:       │
     │          Bearer {token}       │
     │───────────────────────────────>│
     │                               │
     │                     ┌─────────┴──────────┐
     │                     │ 1. Verify JWT sig   │
     │                     │ 2. Check expiry     │
     │                     │ 3. Check blacklist  │
     │                     │ 4. Extract userId   │
     │                     │ 5. Attach to req    │
     │                     └─────────┬──────────┘
     │                               │
     │  {trips: [...]}               │
     │<───────────────────────────────│
     │                               │
```

### Permission Model

```
User Roles (per trip):
- Organizer (1 per trip)
  - Full control
  - Can delete trip
  - Can remove members
  - Can change member roles

- Planner (0-many per trip)
  - Can edit itinerary
  - Can manage expenses
  - Can invite members
  - Cannot delete trip

- Member (0-many per trip)
  - Can view trip
  - Can vote on activities
  - Can add comments
  - Can add expenses
  - Cannot edit others' items
```

---

## Deployment Architecture

### Development

```
┌────────────────────────────────────────┐
│  docker-compose.yml                    │
├────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐           │
│  │   App    │  │ Postgres │           │
│  │  :3000   │  │  :5432   │           │
│  └──────────┘  └──────────┘           │
└────────────────────────────────────────┘
```

### Staging

```
┌────────────────────────────────────────┐
│  docker-compose.staging.yml            │
├────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌─────┐  │
│  │   App    │  │ Postgres │  │Redis│  │
│  │  :3001   │  │  :5433   │  │6380 │  │
│  └──────────┘  └──────────┘  └─────┘  │
└────────────────────────────────────────┘
```

### Production

```
┌──────────────────────────────────────────────────┐
│  docker-compose.prod.yml + Nginx                 │
├──────────────────────────────────────────────────┤
│                                                   │
│  ┌─────────┐                                     │
│  │  Nginx  │  (Port 80/443, SSL, Rate Limiting) │
│  │  Proxy  │                                     │
│  └────┬────┘                                     │
│       │                                          │
│  ┌────┴────────────┐                            │
│  │   App (Node)    │ (Multiple instances        │
│  │   :3000         │  via Docker scale)         │
│  └─────┬───────────┘                            │
│        │                                         │
│  ┌─────┴──────┐  ┌──────────┐  ┌──────────┐   │
│  │ PostgreSQL │  │  Redis   │  │  S3/R2   │   │
│  │   :5432    │  │  :6379   │  │ (Cloud)  │   │
│  └────────────┘  └──────────┘  └──────────┘   │
│                                                  │
└──────────────────────────────────────────────────┘
         │                      │
         │                      │
    ┌────┴─────┐          ┌────┴─────┐
    │  Sentry  │          │ Anthropic│
    │  (Cloud) │          │   API    │
    └──────────┘          └──────────┘
```

---

## Performance Optimization

### Frontend
- Code splitting (React.lazy)
- Image optimization (WebP, lazy loading)
- Service Worker caching
- TanStack Query caching
- Debounced search/filters

### Backend
- Redis caching (5 min TTL)
- Database connection pooling
- Query optimization (indexes)
- Rate limiting per endpoint
- Gzip compression

### Database
- Indexes on foreign keys
- Composite indexes for common queries
- VACUUM and ANALYZE (weekly)
- Connection limits (max 100)

---

## Scalability Considerations

### Current Limits (Single Server)
- ~500 concurrent users
- ~1000 trips
- ~10,000 itinerary items
- ~5 req/sec per user

### Scaling Strategies (Future)

**Horizontal Scaling**:
- Multiple app instances behind load balancer
- Session stored in Redis (not in-memory)
- Database read replicas

**Vertical Scaling**:
- Increase server resources
- Optimize queries
- Add database indexes

**Service Separation**:
- Separate AI service (dedicated instance)
- Separate file upload service
- Background job queue (Bull + Redis)

---

## Disaster Recovery

**Backups**:
- Database: Daily automated backups
- Files: S3/R2 versioning enabled
- Code: GitHub (version controlled)

**Recovery Time Objective (RTO)**: 1 hour
**Recovery Point Objective (RPO)**: 24 hours

**Procedure**:
1. Restore database from backup
2. Redeploy app from git
3. Verify health check
4. Test critical flows

---

## Monitoring & Observability

**Application**:
- Sentry (errors, performance)
- Health endpoint (/api/health?detailed=true)
- Docker stats (CPU, memory)

**Database**:
- Query performance (pg_stat_statements)
- Connection count
- Disk usage

**Business**:
- PostHog/GA (user behavior)
- Sign-ups, DAU, retention
- Feature usage

---

## Technology Decisions & Rationale

### Why React 19?
- Latest version with improved performance
- Better TypeScript support
- Server Components (future use)

### Why PostgreSQL?
- Robust, ACID-compliant
- Excellent JSON support
- Strong ecosystem

### Why Drizzle ORM?
- Type-safe (better than Prisma for TS)
- Lightweight
- SQL-like syntax

### Why Redis?
- Fast in-memory cache
- Pub/sub for real-time (future)
- Widely supported

### Why Anthropic Claude?
- Best reasoning for complex itineraries
- 200K context window
- Strong safety features
- Cheaper than GPT-4

### Why Docker?
- Consistent environments
- Easy deployment
- Scales horizontally

---

## Future Architecture Changes

**v1.1**:
- Migrate chat to PostgreSQL
- Add WebSocket for real-time chat
- Background job queue (email sending, AI generation)

**v1.2**:
- Separate microservices (AI, Upload)
- Kubernetes deployment
- CDN for static assets

**v2.0**:
- GraphQL API (alongside REST)
- Mobile apps (React Native)
- Multi-tenancy support

---

## References

- **Code**: https://github.com/AbdulMuheeth29/TripSync
- **API Docs**: `API-DOCUMENTATION.md`
- **Database Schema**: `shared/schema.ts`
- **Deployment**: `RUNBOOK.md`

---

**Last Updated**: 2026-05-15
