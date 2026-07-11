# TripSync - Complete System Architecture Diagram

**Version**: 1.0.0
**Last Updated**: 2026-05-15

---

## Complete System Architecture

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│                             END USERS (Clients)                                │
│                                                                                 │
│    ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐           │
│    │  Chrome  │     │  Safari  │     │ Firefox  │     │  Mobile  │           │
│    │  Desktop │     │  Desktop │     │  Desktop │     │   PWA    │           │
│    └─────┬────┘     └─────┬────┘     └─────┬────┘     └─────┬────┘           │
│          │                │                │                │                  │
│          └────────────────┴────────────────┴────────────────┘                  │
│                                   │                                            │
│                              HTTPS/WSS                                         │
│                                   │                                            │
└───────────────────────────────────┼────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
┌───────────────────┼───────────────────────────────┼───────────────────────────┐
│                   │   NGINX Reverse Proxy         │                            │
│                   │   - SSL/TLS Termination       │                            │
│                   │   - Static File Serving       │                            │
│                   │   - Rate Limiting             │                            │
│                   │   - Gzip Compression          │                            │
└───────────────────┼───────────────────────────────┼───────────────────────────┘
                    │                               │
        ┌───────────┴───────────┐       ┌───────────┴───────────┐
        │                       │       │                       │
┌───────▼─────────────────┐     │       │     ┌─────────────────▼───────┐
│                         │     │       │     │                         │
│   React 19 Frontend     │     │       │     │  Node.js + Express API  │
│   (Static Assets)       │     │       │     │      (TypeScript)       │
│                         │     │       │     │                         │
│  • Components           │     │       │     │  • REST API Routes      │
│  • Pages                │     │       │     │  • WebSocket Server     │
│  • Service Worker       │     │       │     │  • Authentication       │
│  • Offline Cache        │     │       │     │  • Business Logic       │
│  • Push Notifications   │     │       │     │  • File Uploads         │
│                         │     │       │     │                         │
└─────────────────────────┘     │       │     └───────────┬─────────────┘
                                │       │                 │
                                │       │                 │
    ┌───────────────────────────┼───────┼─────────────────┼────────────────────┐
    │                           │       │                 │                    │
    │                           │       │                 │                    │
┌───▼─────────┐   ┌─────────────▼──┐ ┌─▼─────────────┐ ┌─▼────────────────┐  │
│             │   │                │ │               │ │                  │  │
│ PostgreSQL  │   │  Redis Cache   │ │  Anthropic   │ │ Cloudflare R2 /  │  │
│  Database   │   │                │ │   Claude AI   │ │    AWS S3        │  │
│             │   │                │ │               │ │                  │  │
│  • Users    │   │  • Sessions    │ │  • Itinerary │ │  • Photos        │  │
│  • Trips    │   │  • Token       │ │    Generation │ │  • Documents     │  │
│  • Items    │   │    Blacklist   │ │  • Atlas AI  │ │  • Trip Files    │  │
│  • Expenses │   │  • Rate Limits │ │  • Packing   │ │                  │  │
│  • Members  │   │  • Query Cache │ │    Lists     │ │                  │  │
│             │   │                │ │  • Email     │ │                  │  │
│  Port: 5432 │   │  Port: 6379    │ │    Parsing   │ │                  │  │
│             │   │                │ │               │ │                  │  │
└─────────────┘   └────────────────┘ └───────────────┘ └──────────────────┘  │
│                                                                              │
│                        INFRASTRUCTURE SERVICES                               │
└──────────────────────────────────────────────────────────────────────────────┘
     │                 │                  │                │
     │                 │                  │                │
┌────▼─────┐   ┌───────▼───────┐  ┌──────▼──────┐  ┌─────▼─────────┐
│          │   │               │  │             │  │               │
│  Sentry  │   │     SMTP      │  │   Stripe    │  │  UptimeRobot  │
│          │   │   (Email)     │  │  (Billing)  │  │  (Monitoring) │
│          │   │               │  │             │  │               │
│  • Error │   │  • SendGrid   │  │  • Pro Plan │  │  • Health     │
│    Track │   │  • Gmail      │  │  • Teams    │  │    Checks     │
│  • Perf  │   │  • AWS SES    │  │    Plan     │  │  • Uptime     │
│    Mon   │   │               │  │  • Webhooks │  │    Alerts     │
│  • Logs  │   │  • Invites    │  │             │  │               │
│          │   │  • Password   │  │             │  │               │
│          │   │    Resets     │  │             │  │               │
│          │   │               │  │             │  │               │
└──────────┘   └───────────────┘  └─────────────┘  └───────────────┘


EXTERNAL SERVICES & INTEGRATIONS
─────────────────────────────────

┌──────────────────────────────────────────────────────────────────────┐
│  Analytics & Monitoring                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │  PostHog    │  │   Sentry    │  │ UptimeRobot │                  │
│  │  (Product)  │  │   (Errors)  │  │  (Uptime)   │                  │
│  └─────────────┘  └─────────────┘  └─────────────┘                  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Examples

### 1. User Registration Flow

```
User Browser                API Server              Database           Email Service
     │                          │                      │                    │
     │  POST /api/auth/register │                      │                    │
     ├─────────────────────────>│                      │                    │
     │                          │  Validate data       │                    │
     │                          │  Hash password       │                    │
     │                          │                      │                    │
     │                          │  INSERT INTO users   │                    │
     │                          ├─────────────────────>│                    │
     │                          │      User ID         │                    │
     │                          │<─────────────────────┤                    │
     │                          │                      │                    │
     │                          │  Generate JWT token  │                    │
     │                          │                      │                    │
     │                          │  Send welcome email  │                    │
     │                          ├──────────────────────────────────────────>│
     │                          │                      │      Email sent    │
     │                          │                      │                    │
     │    200 OK + JWT token    │                      │                    │
     │<─────────────────────────┤                      │                    │
     │                          │                      │                    │
```

### 2. AI Trip Generation Flow

```
User Browser        API Server       Claude AI      Database        Sentry
     │                  │                │              │              │
     │  POST /trips     │                │              │              │
     │  + AI request    │                │              │              │
     ├─────────────────>│                │              │              │
     │                  │ Check feature  │              │              │
     │                  │ flag (AI)      │              │              │
     │                  │                │              │              │
     │                  │ Verify tier    │              │              │
     │                  │ limits         │              │              │
     │                  │                │              │              │
     │                  │ CREATE trip    │              │              │
     │                  ├───────────────────────────────>│              │
     │                  │                │              │              │
     │                  │ Call AI API    │              │              │
     │                  ├───────────────>│              │              │
     │                  │                │              │              │
     │                  │  Itinerary     │              │              │
     │                  │<───────────────┤              │              │
     │                  │                │              │              │
     │                  │ Parse & save   │              │              │
     │                  │ items          │              │              │
     │                  ├───────────────────────────────>│              │
     │                  │                │              │              │
     │  Trip + Items    │                │              │              │
     │<─────────────────┤                │              │              │
     │                  │                │              │              │
     │                  │ (if error)     │              │              │
     │                  ├────────────────────────────────────────────>│
     │                  │                │              │  Log error   │
```

### 3. File Upload Flow

```
User Browser        API Server     Feature Flags    S3/R2       Database
     │                  │                │            │             │
     │  POST /photos    │                │            │             │
     ├─────────────────>│                │            │             │
     │                  │ Check feature  │            │             │
     │                  │ flag           │            │             │
     │                  ├───────────────>│            │             │
     │                  │ Enabled?       │            │             │
     │                  │<───────────────┤            │             │
     │                  │                │            │             │
     │                  │ Verify trip    │            │             │
     │                  │ access         │            │             │
     │                  │                │            │             │
     │                  │ Check tier     │            │             │
     │                  │ limits         │            │             │
     │                  │                │            │             │
     │                  │ Upload file    │            │             │
     │                  ├────────────────────────────>│             │
     │                  │                │  File URL  │             │
     │                  │<────────────────────────────┤             │
     │                  │                │            │             │
     │                  │ Save metadata  │            │             │
     │                  ├─────────────────────────────────────────>│
     │                  │                │            │             │
     │  200 OK + URL    │                │            │             │
     │<─────────────────┤                │            │             │
```

---

## Security Architecture

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Authentication                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
         ┌───────────────────────────────────┐
         │  POST /api/auth/login             │
         │  { email, password }              │
         └───────────────┬───────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │  Validate Email Format            │
         └───────────────┬───────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │  Query Database for User          │
         └───────────────┬───────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │  Compare Password Hash (bcrypt)   │
         └───────────────┬───────────────────┘
                         │
                    ┌────┴────┐
                    │         │
                 MATCH?    NO MATCH
                    │         │
                    ▼         ▼
         ┌──────────────┐  ┌──────────────┐
         │ Generate JWT │  │ Return 401   │
         │ Token        │  │ Unauthorized │
         └──────┬───────┘  └──────────────┘
                │
                ▼
         ┌───────────────────────────────────┐
         │  Set HttpOnly Cookie              │
         │  (Production: Secure + SameSite)  │
         └───────────────┬───────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │  Return 200 OK + User Data        │
         └───────────────────────────────────┘
```

### Authorization Middleware Chain

```
┌──────────────────────────────────────────────────────────────┐
│  Incoming Request to Protected Endpoint                       │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │  requireAuth                      │
         │  - Check JWT token                │
         │  - Validate signature             │
         │  - Check not expired              │
         │  - Check not blacklisted (Redis)  │
         └───────────────┬───────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │  requireFeature (if applicable)   │
         │  - Check feature flag enabled     │
         │  - Return 503 if disabled         │
         └───────────────┬───────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │  requireTripAccess                │
         │  - Verify user is trip member     │
         │  - Check role permissions         │
         └───────────────┬───────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │  requirePlanner / requireOrganizer│
         │  (if needed)                      │
         │  - Check specific role            │
         └───────────────┬───────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │  Rate Limiter                     │
         │  - Check Redis for rate limit     │
         │  - Increment counter              │
         │  - Return 429 if exceeded         │
         └───────────────┬───────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │  Route Handler                    │
         │  - Execute business logic         │
         │  - Return response                │
         └───────────────────────────────────┘
```

---

## Deployment Architecture

### Development Environment

```
┌────────────────────────────────────────────────┐
│  Developer Machine (localhost)                 │
│                                                 │
│  ┌──────────────┐         ┌─────────────────┐ │
│  │  Vite Dev    │         │  Node.js Server │ │
│  │  Server      │         │  (tsx watch)    │ │
│  │  Port: 5173  │         │  Port: 3000     │ │
│  └──────────────┘         └─────────────────┘ │
│                                                 │
│  In-Memory Storage (No Database Required)      │
└────────────────────────────────────────────────┘
```

### Staging Environment

```
┌─────────────────────────────────────────────────────────────┐
│  Docker Compose - Staging (localhost)                       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  PostgreSQL  │  │    Redis     │  │   Node App   │     │
│  │  Port: 5433  │  │  Port: 6380  │  │  Port: 3001  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  Test services with staging credentials                     │
└─────────────────────────────────────────────────────────────┘
```

### Production Environment

```
┌───────────────────────────────────────────────────────────────┐
│  VPS / Cloud Server (e.g., DigitalOcean, AWS, Hetzner)        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  NGINX (Port 80/443)                                    │  │
│  │  - SSL/TLS Certificates (Let's Encrypt)                │  │
│  │  - Reverse Proxy to App                                │  │
│  │  - Static File Serving                                 │  │
│  └────────────────────┬────────────────────────────────────┘  │
│                       │                                        │
│  ┌────────────────────┴────────────────────────────────────┐  │
│  │  Docker Compose Production                             │  │
│  │                                                          │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │  │
│  │  │ PostgreSQL   │  │    Redis     │  │   TripSync   │ │  │
│  │  │   (Volume)   │  │   (Volume)   │  │     App      │ │  │
│  │  │  Port: 5432  │  │  Port: 6379  │  │  Port: 3000  │ │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  External Services:                                            │
│  - Cloudflare R2 / AWS S3 (File Storage)                      │
│  - Anthropic Claude API (AI Features)                         │
│  - Sentry (Error Tracking)                                    │
│  - UptimeRobot (Uptime Monitoring)                            │
│  - SendGrid / Gmail SMTP (Email)                              │
│  - Stripe (Payments)                                          │
└───────────────────────────────────────────────────────────────┘
```

---

## Scaling Strategy (Future)

### Phase 1: Current (v1.0) - Single Server
- **Capacity**: 1,000-5,000 concurrent users
- **Architecture**: Monolithic (all services on one server)
- **Database**: Single PostgreSQL instance
- **Caching**: Redis on same server

### Phase 2: Horizontal Scaling (v1.5+)
```
┌─────────────────────────────────────────────────────────┐
│  Load Balancer (NGINX / AWS ALB)                        │
└──────────┬─────────────┬─────────────┬──────────────────┘
           │             │             │
     ┌─────▼────┐  ┌─────▼────┐  ┌────▼─────┐
     │ App      │  │ App      │  │ App      │
     │ Server 1 │  │ Server 2 │  │ Server 3 │
     └─────┬────┘  └─────┬────┘  └────┬─────┘
           │             │             │
           └─────────────┴─────────────┘
                         │
            ┌────────────┴────────────┐
            │                         │
      ┌─────▼────┐              ┌─────▼────┐
      │ Primary  │──────────────│ Replica  │
      │   DB     │   Streaming  │    DB    │
      │          │  Replication │ (Read)   │
      └──────────┘              └──────────┘
```

### Phase 3: Microservices (v2.0+)
```
                 ┌──────────────┐
                 │ API Gateway  │
                 └──────┬───────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
   │  Auth   │    │  Trips  │    │   AI    │
   │ Service │    │ Service │    │ Service │
   └─────────┘    └─────────┘    └─────────┘
```

---

## Feature Flags System

```
┌──────────────────────────────────────────────────────┐
│  Feature Flags (Emergency Disable)                   │
└──────────────────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
    │   AI    │    │  Files  │    │ Stripe  │
    │ ENABLED │    │ ENABLED │    │ ENABLED │
    └─────────┘    └─────────┘    └─────────┘

┌──────────────────────────────────────────────────────┐
│  Usage in Routes                                     │
└──────────────────────────────────────────────────────┘

  Request → requireAuth → requireAI → Route Handler
                              │
                              ▼
                       ┌──────────────┐
                       │ Feature Flag │
                       │   Enabled?   │
                       └──────┬───────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                 YES                   NO
                    │                   │
                    ▼                   ▼
            ┌───────────────┐   ┌──────────────┐
            │ Continue to   │   │ Return 503   │
            │ Handler       │   │ Feature      │
            │               │   │ Disabled     │
            └───────────────┘   └──────────────┘
```

---

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19 + TypeScript | UI components and state |
| | Vite | Build tool and dev server |
| | TailwindCSS | Styling |
| | Radix UI | Accessible components |
| | TanStack Query | Server state management |
| **Backend** | Node.js 20 + Express | API server |
| | TypeScript | Type safety |
| | JWT | Authentication |
| **Database** | PostgreSQL 16 | Primary data store |
| | Drizzle ORM | Type-safe queries |
| **Cache** | Redis 7 | Sessions, rate limiting |
| **AI** | Anthropic Claude Sonnet 4.5 | Trip generation, chat |
| **Storage** | Cloudflare R2 / AWS S3 | File uploads |
| **Email** | SMTP (SendGrid/Gmail) | Transactional emails |
| **Payments** | Stripe | Subscriptions |
| **Monitoring** | Sentry | Error tracking |
| | UptimeRobot | Uptime monitoring |
| | PostHog / GA | Product analytics |
| **Deployment** | Docker + Compose | Containerization |
| | NGINX | Reverse proxy |
| | Let's Encrypt | SSL certificates |

---

**Last Updated**: 2026-05-15
**Maintained By**: TripSync Team
