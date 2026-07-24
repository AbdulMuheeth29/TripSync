# TripSync

> **AI-Powered Group Travel Planning Made Simple**

TripSync transforms the chaos of group trip planning into a seamless, collaborative experience. Plan trips together, vote on activities, split expenses, and let AI handle the heavy lifting.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## ✨ Key Features

### 🤖 **AI-Powered Planning**

- **Instant Itinerary Generation** - Create complete day-by-day trip plans in seconds with Claude Sonnet 4.5
- **Atlas AI Assistant** - Your personal travel advisor with contextual trip knowledge
- **Smart Recommendations** - Budget optimization, packing lists, and conflict resolution
- **Email Parsing** - Automatically extract booking details from confirmation emails

### 👥 **Collaborative Tools**

- **Democratic Voting** - Vote on activities, dates, and destinations as a group
- **Real-Time Chat** - Discuss plans with trip members instantly
- **Role-Based Permissions** - Organizers, planners, and members with appropriate access
- **Trip Invitations** - Easy invite system via email or share links

### 💰 **Expense Management**

- **Smart Expense Splitting** - Automatically calculate who owes what
- **Multiple Split Methods** - Equal split, percentage-based, or custom amounts
- **Receipt Tracking** - Upload and attach receipts to expenses
- **Settlement Tracking** - Mark expenses as settled when paid

### 📱 **Modern Experience**

- **Progressive Web App** - Install on any device, works offline
- **Push Notifications** - Stay updated on trip changes and votes
- **Mobile-First Design** - Beautiful UI that works perfectly on any screen
- **Dark Mode** - Easy on the eyes, day or night

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/AbdulMuheeth29/TripSync.git
cd TripSync

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

Visit `http://localhost:3000` and start planning your next adventure! 🎉

---

## 🏗️ Tech Stack

### Frontend

- **React 19** - Modern UI library
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **TailwindCSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Wouter** - Lightweight routing

### Backend

- **Node.js & Express** - Fast, unopinionated server
- **TypeScript** - End-to-end type safety
- **PostgreSQL** - Robust relational database
- **Drizzle ORM** - Type-safe database toolkit
- **Redis** - High-performance caching

### AI & Services

- **Anthropic Claude Sonnet 4.5** - Advanced language model
- **Stripe** - Payment processing & subscriptions
- **Cloudflare R2 / AWS S3** - File storage
- **Sentry** - Error tracking & monitoring
- **SendGrid / SMTP** - Transactional emails

### DevOps

- **Docker & Docker Compose** - Containerization
- **GitHub Actions** - CI/CD pipeline
- **Nginx** - Reverse proxy & load balancing

---

## 📦 Project Structure

```
TripSync/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route pages
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities & helpers
│   └── public/            # Static assets
├── server/                 # Express backend
│   ├── routes.ts          # API route definitions
│   ├── ai-service.ts      # AI integration layer
│   ├── storage.ts         # Data access layer
│   └── ...                # Other services
├── shared/                 # Shared types & schemas
├── migrations/             # Database migrations
├── tests/                  # Test suites
├── scripts/                # Utility scripts
└── docs/                   # Documentation (local only)
```

---

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm start                # Start production server

# Database
npm run db:generate      # Generate new migration
npm run db:migrate       # Run migrations
npm run db:push          # Push schema changes (dev only)

# Testing
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report

# Code Quality
npm run check            # TypeScript type checking
npm run lint             # Lint code with ESLint
npm run format           # Format code with Prettier

# Services
npm run test:services    # Test production services
npm run test:email       # Test email configuration
```

### Environment Variables

Create a `.env` file with the following required variables:

```bash
# Database (Required)
DATABASE_URL=postgresql://user:password@localhost:5432/tripsync

# Authentication (Required)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Email (Required for password reset & invites)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# AI Features (Optional - enables AI trip generation)
AI_INTEGRATIONS_ANTHROPIC_API_KEY=sk-ant-...

# Redis Cache (Optional but recommended)
REDIS_URL=redis://localhost:6379

# File Storage (Optional - enables photo/document uploads)
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=tripsync-uploads

# Monitoring (Optional)
SENTRY_DSN=https://...@sentry.io/...

# Billing (Optional - enables paid tiers)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

See `.env.example` for complete configuration options.

---

## 🐳 Docker Deployment

### Development

```bash
docker-compose up -d
```

### Production

```bash
# Interactive setup
./scripts/setup-production-services.sh

# Deploy
./deploy.sh

# Or manually
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🧪 Testing

TripSync includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Run specific test suites
npm test auth           # Authentication tests
npm test storage        # Database tests
npm test middleware     # Middleware tests

# Generate coverage report
npm run test:coverage
```

**Current Test Stats:**

- ✅ 89 tests passing
- ✅ Zero TypeScript errors
- ✅ End-to-end API tests
- ✅ Integration tests

---

## 📊 Features by Tier

| Feature          | Free     | Pro       | Teams     |
| ---------------- | -------- | --------- | --------- |
| Trips per user   | 3        | Unlimited | Unlimited |
| Members per trip | 8        | 25        | Unlimited |
| AI Generations   | 10/month | 100/month | Unlimited |
| Photo storage    | 100MB    | 10GB      | 50GB      |
| Document uploads | ❌       | ✅        | ✅        |
| Email parsing    | ❌       | ✅        | ✅        |
| Priority support | ❌       | ❌        | ✅        |
| Custom branding  | ❌       | ❌        | ✅        |

---

## 🔒 Security

TripSync takes security seriously:

- ✅ **HTTPS Only** - All traffic encrypted with TLS
- ✅ **Secure Authentication** - JWT tokens with bcrypt password hashing
- ✅ **Rate Limiting** - Protection against brute force attacks
- ✅ **SQL Injection Protection** - Parameterized queries via Drizzle ORM
- ✅ **XSS Protection** - React's built-in escaping + CSP headers
- ✅ **CSRF Protection** - SameSite cookies
- ✅ **Security Headers** - HSTS, X-Frame-Options, X-Content-Type-Options
- ✅ **Data Encryption** - Sensitive data filtered from logs and error tracking
- ✅ **Regular Updates** - Automated dependency updates via Dependabot

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Run tests** (`npm test`)
5. **Commit your changes** (`git commit -m 'Add amazing feature'`)
6. **Push to branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

### Development Guidelines

- Write TypeScript with strict type checking
- Follow existing code style (enforced by ESLint & Prettier)
- Add tests for new features
- Update documentation as needed
- Keep commits atomic and meaningful

---

## 📝 API Documentation

### Authentication

```typescript
POST / api / auth / register;
POST / api / auth / login;
POST / api / auth / logout;
POST / api / auth / password - reset - request;
POST / api / auth / password - reset - submit;
```

### Trips

```typescript
GET    /api/trips                    # List user's trips
POST   /api/trips                    # Create new trip
GET    /api/trips/:id                # Get trip details
PATCH  /api/trips/:id                # Update trip
DELETE /api/trips/:id                # Delete trip
POST   /api/trips/:id/generate       # AI generate itinerary
```

### Itinerary

```typescript
GET    /api/trips/:id/items          # List itinerary items
POST   /api/trips/:id/items          # Add itinerary item
PATCH  /api/items/:id                # Update item
DELETE /api/items/:id                # Delete item
POST   /api/items/:id/vote           # Vote on item
```

### Expenses

```typescript
GET    /api/trips/:id/expenses       # List expenses
POST   /api/trips/:id/expenses       # Add expense
PATCH  /api/expenses/:id             # Update expense
DELETE /api/expenses/:id             # Delete expense
```

See full API documentation in `/docs` (local only).

---

## 🎨 Screenshots

_Coming soon - UI screenshots will be added here_

---

## 🗺️ Roadmap

### ✅ Completed

- [x] Core trip planning functionality
- [x] AI-powered itinerary generation
- [x] Real-time collaboration
- [x] Expense splitting
- [x] PWA support
- [x] Stripe integration
- [x] Email notifications
- [x] Photo & document uploads

### 🚧 In Progress

- [ ] Mobile apps (iOS & Android)
- [ ] Flight price tracking
- [ ] Hotel booking integration
- [ ] Weather forecasts
- [ ] Calendar sync (Google, Apple)

### 🔮 Planned

- [ ] Trip templates & inspiration
- [ ] Social sharing & public trips
- [ ] Travel insurance integration
- [ ] Multi-language support
- [ ] Visa requirement checker
- [ ] Currency converter

---

## 💡 Use Cases

### Family Vacations

Plan your next family trip with everyone's input. Vote on activities, manage budgets, and keep everyone on the same page.

### Friend Getaways

Coordinate weekend trips or extended vacations with friends. Split costs fairly and never miss a detail.

### Corporate Retreats

Organize team-building trips with professional tools. Track expenses, manage large groups, and ensure smooth logistics.

### Bachelor/Bachelorette Parties

Plan the perfect celebration. Handle complex itineraries, coordinate group activities, and split costs seamlessly.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with ❤️ using [Anthropic Claude](https://www.anthropic.com/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Icons from [Lucide](https://lucide.dev/)
- Hosted on [Your Hosting Provider]

---

## 📧 Support

- **Documentation:** Check `/docs` folder (local only)
- **Issues:** [GitHub Issues](https://github.com/AbdulMuheeth29/TripSync/issues)
- **Email:** support@tripsync.app (if configured)
- **Discord:** [Join our community](https://discord.gg/tripsync) (if available)

---

## 🌟 Star History

If you find TripSync useful, please consider giving it a star! ⭐

---

<div align="center">
  <strong>Made with TypeScript, React, and Claude AI</strong>
  <br>
  <sub>Happy travels! ✈️🌍</sub>
</div>
