# TripSync - AI-Powered Group Trip Planning

## Overview

TripSync is an AI-powered group trip planning application that helps groups plan trips in minutes instead of hours. It combines AI itinerary generation, collaborative decision-making, booking coordination, and expense tracking in one platform.

## Tech Stack

- **Frontend**: React with TypeScript, Tailwind CSS, Shadcn/UI components
- **Backend**: Node.js/Express
- **Database**: In-memory storage (MemStorage) - easily swappable to PostgreSQL
- **AI**: Anthropic Claude API via Replit AI Integrations
- **Routing**: Wouter (frontend), Express (backend)
- **State Management**: TanStack React Query

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components (landing, dashboard, etc.)
│   │   ├── lib/            # Context providers, utilities
│   │   └── hooks/          # Custom React hooks
├── server/                 # Backend Express server
│   ├── routes.ts           # API endpoints
│   ├── storage.ts          # Data storage layer
│   └── ai-service.ts       # Anthropic Claude integration
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Drizzle schema and TypeScript types
```

## Key Features

1. **Landing Page** - Hero section, features, pricing (Free tier, $19/month Pro)
2. **Trip Creation Wizard** - 4-step flow (details, vibe, accommodation, dining)
3. **AI Itinerary Generation** - Uses Claude to create detailed 3-day itineraries
4. **Group Collaboration** - Share links, vote on activities, leave comments
5. **Booking Coordination** - Deep links to Google Flights, Booking.com, OpenTable
6. **Expense Tracking** - Log expenses, split bills, settle up

## Demo Data

Pre-seeded with two sample trips:

- **Miami Bachelorette Party** - 6 people, $1500/person, May 15-18, 2026
- **Austin Food Weekend** - 4 people, $800/person, June 8-10, 2026

## Authentication

Simple email-only auth for demo purposes - no passwords required. User data stored in localStorage.

## API Endpoints

- `POST /api/auth/login` - Login/register with email and name
- `GET /api/trips` - Get user's trips
- `POST /api/trips` - Create new trip (triggers AI generation)
- `GET /api/trips/:id` - Get trip details with itinerary
- `PATCH /api/trips/:id` - Update trip (lock/unlock)
- `POST /api/trips/:tripId/items/:itemId/vote` - Vote on item
- `POST /api/trips/:tripId/items/:itemId/comments` - Add comment
- `POST /api/trips/:tripId/expenses` - Add expense

## Design System

- **Primary Color**: Teal (173 hue)
- **Secondary Color**: Coral/Orange (16 hue)
- **Theme**: Light/Dark mode support
- **Font**: Inter

## Development

The application runs on port 5000 with the `npm run dev` command.

## Environment Variables

- `AI_INTEGRATIONS_ANTHROPIC_API_KEY` - Auto-configured by Replit
- `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` - Auto-configured by Replit

## Recent Changes

- Initial MVP implementation with full trip planning workflow
- AI-powered itinerary generation with Anthropic Claude
- Group collaboration features (voting, comments, share links)
- Expense tracking with split calculations
- Responsive design for mobile/tablet/desktop
