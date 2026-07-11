# Changelog

All notable changes to TripSync will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.0] - 2026-05-15

### 🎉 Initial Release

**Features:**
- AI-powered trip itinerary generation with Claude Sonnet 4.5
- Collaborative trip planning with role-based permissions (Organizer, Planner, Member)
- Democratic voting on activities and destinations
- Smart expense splitting with multiple currencies
- Real-time chat for trip members
- PWA support (works offline, installable)
- Push notifications for trip updates
- Photo and document uploads (with S3/R2)
- Packing list generator
- Transportation tracking
- Emergency contacts
- Mood board for trip inspiration
- Atlas AI travel assistant
- Email confirmation parsing (Pro tier)
- Public trip sharing
- Stripe billing integration (Pro and Teams tiers)

**Tech Stack:**
- React 19 + TypeScript + Vite
- Node.js + Express
- PostgreSQL + Drizzle ORM
- Redis caching
- Anthropic Claude AI
- Cloudflare R2 / AWS S3
- Docker deployment

**Known Limitations:**
- Chat is in-memory (will be migrated to database in v1.1)
- AI features require API key configuration
- File uploads require S3/R2 setup
- No mobile apps yet (PWA only)

See KNOWN-ISSUES.md for complete list.

---

## [Unreleased]

### Planned for v1.1
- Chat database migration
- Flight price tracking
- Hotel booking integration
- Weather forecasts
- Calendar sync (Google, Apple)

---
