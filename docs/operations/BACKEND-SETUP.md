# Backend setup (get started)

Follow this to run and deploy the TripSync backend. The app will be ready for **Anthropic** and **ChatGPT/OpenAI** APIs when you add keys later.

---

## 1. Prerequisites

- **Node.js 20+**
- **PostgreSQL** (required in production; optional in dev – in-memory storage used if no `DATABASE_URL`)
- **npm** or yarn

```bash
node -v   # v20.x or higher
psql --version
```

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Environment

Copy the example env and set at least the required variables:

```bash
cp .env.example .env
```

**Required for production:**

| Variable       | Description                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`     | `production` in production                                                                                                |
| `DATABASE_URL` | PostgreSQL connection string, e.g. `postgresql://user:password@host:5432/tripsync`                                        |
| `JWT_SECRET`   | Strong random string (min 32 chars). Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

**Optional – AI (Anthropic now, ChatGPT/OpenAI later):**

| Variable                             | Description                                           |
| ------------------------------------ | ----------------------------------------------------- |
| `AI_INTEGRATIONS_ANTHROPIC_API_KEY`  | Anthropic API key (itinerary generation, AI features) |
| `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` | Optional custom Anthropic base URL                    |
| `OPENAI_API_KEY`                     | Reserved for future ChatGPT/OpenAI integration        |
| `OPENAI_BASE_URL`                    | Optional custom OpenAI base URL                       |

See `.env.example` for Stripe, VAPID, Admin, SMTP, and other optional vars.

---

## 4. Build

The project uses a custom build that bundles the server and builds the client:

```bash
npm run build
```

**Output:**

- `dist/index.cjs` – server bundle
- `dist/public/` – client static assets (HTML, JS, CSS)

---

## 5. Database migrations

Migrations run **automatically on startup** when `DATABASE_URL` is set and the `migrations/` folder exists.

To apply migrations without starting the app:

```bash
npm run db:push
# or
npm run db:migrate
```

---

## 6. Run

**Development** (Vite dev server, hot reload):

```bash
npm run dev
```

**Production** (serve from `dist/`):

```bash
npm run start
```

Uses `dist/index.cjs` and serves static files from `dist/public/`. Set `PORT` and `HOST` in `.env` if needed (defaults: `3000`, `0.0.0.0`).

---

## 7. Production behaviour

With `NODE_ENV=production` the server:

- Enables **trust proxy** (for load balancers)
- Adds **Helmet** security headers and **compression**
- Enforces **rate limiting** (200 requests per 15 minutes)
- Sets **HTTPS-related headers** (e.g. HSTS)
- **Requires** `DATABASE_URL` (throws on startup if missing)

---

## 8. Adding Anthropic and ChatGPT APIs later

1. **Anthropic** – set `AI_INTEGRATIONS_ANTHROPIC_API_KEY` (and optionally `AI_INTEGRATIONS_ANTHROPIC_BASE_URL`). Existing AI features use this.
2. **OpenAI/ChatGPT** – set `OPENAI_API_KEY` (and optionally `OPENAI_BASE_URL`). The app already reads these in `server/env.ts`; wire your new AI features to `env.openaiApiKey` and `env.openaiBaseUrl` when you implement them.

No code changes are required for env; only add the keys and implement the AI calls.

---

For full deployment (hosting, DNS, SSL), see [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md).
