# TripSync

AI-powered group trip planning: create trips, invite friends, capture preferences, generate itineraries, vote on activities, track expenses, and chat in one place.

## Features

- **Roles:** Planner (create trip, set deadlines, lock decisions, manage bookings/expenses) and Participant (preference quiz, vote, comment, add expenses).
- **Trip creation:** Title, location, dates, group size, trip type/template; invite via link and email.
- **Planner dashboard:** Invited vs joined counts, who completed preference quiz, trip status (planning, booking, active, completed).
- **Preference quiz:** Budget band (low/medium/high), pace (chill/packed), diet, one must-do; planner sees individual responses.
- **AI itinerary:** Generate day-by-day plan; planner can regenerate with group preferences; items have category, time, cost, booking links.
- **Voting & locking:** Per-item upvote/downvote/abstain; comment threads; planner can lock/unlock trip or individual items; optional vote deadline on trip.
- **Itinerary workspace:** Day-by-day timeline; status tags (Not started, In progress, Booked, Cancelled, Locked); assign “who’s booking” per item.
- **Collaboration:** Item-level comments; trip-level chat; Activity tab (recent expenses + chat).
- **Booking:** Outbound links, booking status, optional assignee, confirmation number/image; “Booked” badge.
- **Expenses:** Who paid, amount, currency, description, optional link to itinerary item, split among participants; settlement summary (who owes whom); export CSV.
- **Notifications:** Placeholder for future email/push (invites, quiz reminder, poll closing, day locked, expense, digest).

### MVP 1 feature checklist

**Pre-trip:** Group trip creation (destination, dates, budget) · Email/link invites · Preference quiz (diet, budget, must-dos) · AI itinerary (Claude) · Group voting/approval · Group chat with itinerary · Deep links to booking sites · Manual booking confirmation (screenshot URL, confirmation #) · Booking status tracking · Day-by-day timeline.

**During trip:** Daily itinerary view (“Today” tab when within trip dates) · Event reminders (in-app list; push “coming soon”) · Expense logging · Expense split calculator · Receipt photo URL (paste link; OCR planned) · Push notifications (placeholder).

**Post-trip:** Settlement summary · Venmo/Zelle deep links (Pay with Venmo + Zelle note) · Trip recap & shared photo folder · Weather link for trip dates.

**Infrastructure:** Budget vs actual card · Calendar export (.ics for Google/iCal/Outlook) · Maps (Get directions per item) · Weather (link to forecast) · Time zone (schema: `trip.timezone`; UI display optional) · Offline (planned; PWA/service worker) · Push (placeholder).

## Stack

- **Backend:** Node.js, Express 5, TypeScript
- **Frontend:** React 18, Vite, Tailwind CSS
- **Database:** PostgreSQL (Drizzle ORM) or in-memory (dev/demo)
- **AI:** Anthropic Claude (optional) for itinerary generation

## Environment variables

Create a `.env` file in the project root (or set in your host). Example:

```bash
# Server
PORT=3000
HOST=0.0.0.0
NODE_ENV=production

# Database (required in production for persistent data)
DATABASE_URL=postgresql://user:password@host:5432/tripsync

# AI itinerary generation (optional; without it, AI features are disabled)
AI_INTEGRATIONS_ANTHROPIC_API_KEY=sk-ant-...
# Optional: custom API base URL
# AI_INTEGRATIONS_ANTHROPIC_BASE_URL=https://...
```

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default `3000`) |
| `HOST` | No | Bind address (default `0.0.0.0`) |
| `NODE_ENV` | No | `development` or `production` |
| `DATABASE_URL` | **Yes in production** | PostgreSQL connection string. If unset, app uses in-memory storage (data lost on restart). |
| `AI_INTEGRATIONS_ANTHROPIC_API_KEY` | No | Anthropic API key for AI itinerary generation |

## Local development

1. **Install and run (no DB):**
   ```bash
   npm install
   npm run dev
   ```
   App runs at http://localhost:3000 with in-memory storage.

2. **With PostgreSQL:**
   - Create a database and set `DATABASE_URL`.
   - Apply migrations:
     ```bash
     npm run db:migrate
     ```
   - Then `npm run dev`.

## Database

- **Generate migrations** after schema changes:
  ```bash
  npm run db:generate
  ```
- **Apply migrations** (production or local PG):
  ```bash
  npm run db:migrate
  ```
- **Push schema** without migration files (dev only):
  ```bash
  npm run db:push
  ```

## Production build

```bash
npm run build
npm start
```

Serves the app from `dist/`: server at `dist/index.cjs`, client at `dist/public/`.

## Docker

Build and run:

```bash
docker build -t tripsync .
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:password@host:5432/tripsync \
  -e AI_INTEGRATIONS_ANTHROPIC_API_KEY=sk-ant-... \
  tripsync
```

The app runs pending Drizzle migrations automatically on startup when `DATABASE_URL` is set and a `migrations` folder is present (e.g. in the Docker image). You can also run migrations manually with `npm run db:migrate` before starting.

## Health check

- **GET /api/health** — Returns `{ "ok": true, "storage": "pg" | "memory" }`. Use for load balancers and monitoring.

## Security

- Rate limiting (production): 200 requests per 15 minutes per IP when `NODE_ENV=production`.
- Headers: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`; `Strict-Transport-Security` in production when behind TLS.

## License

MIT
