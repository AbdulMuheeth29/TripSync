# TripSync End‑to‑End Test Data Guide

This file contains **concrete test data** and flows you can use to exercise **every major feature** of the TripSync prototype end‑to‑end.

Use this in **test / staging** only. Do **not** reuse these emails or Stripe test cards in production.

---

## 1. Global Test Configuration

### 1.1 Test Environment

- **App URL (local):** `http://localhost:3000`
- **App URL (prod/stage):** `https://tripsync.app` (or your staging URL)

### 1.2 Stripe Test Setup

In `.env` / hosting config, set:

- `STRIPE_SECRET_KEY=sk_test_...`
- `STRIPE_WEBHOOK_SECRET=whsec_...`
- `STRIPE_PRICE_PRO_MONTHLY=price_...`
- `STRIPE_PRICE_PRO_ANNUAL=price_...`
- `STRIPE_PRICE_TEAMS_MONTHLY=price_...`
- `STRIPE_PRICE_TEAMS_ANNUAL=price_...`
- `APP_URL=http://localhost:3000` (for local tests)

**Stripe Test Card (standard success):**

- Card: `4242 4242 4242 4242`
- Expiry: Any future month/year (e.g. `12 / 34`)
- CVC: `123`
- ZIP: `12345`

Use additional Stripe test cards (3D Secure, insufficient funds, etc.) as needed from Stripe’s docs.

---

## 2. Test Accounts

You’ll use **three users** for realistic flows: organizer, friend, and travel‑pro.

### 2.1 Demo Organizer (Free → Pro)

- **Email:** `demo@tripsync.com`
- **Password:** `password123`

This account already works with the built‑in “Sign in with Demo account” button on the login page.

Use this to test:

- Landing → Login → Dashboard
- Free plan limits (trips/members/photos)
- Upgrade flows (Pro) and billing portal

### 2.2 Friend / Invitee

- **Email:** `friend.tester+1@example.com`
- **Password:** `TestPass!23`
- **Name:** `Friend Tester`

Flow:

1. Register via `/login` → **Register** tab with the above details.
2. Accept invitations sent by the Organizer (see Trips below).

### 2.3 Travel Pro (Teams)

- **Email:** `agent.tester+teams@example.com`
- **Password:** `AgentPro!23`
- **Name:** `Travel Agent Tester`

Use this account to:

- Purchase **Teams** subscription.
- Create multiple client workspaces/trips.
- Validate analytics / admin behaviors.

> Tip: Use the **“redirect”** query param on `/login` when you want to land on a specific trip or pricing page after auth (e.g. `/login?redirect=/pricing?checkout=pro`).

---

## 3. Trips & Itinerary Test Data

Create the following trips under the **demo organizer** account to cover features.

### 3.1 Trip A – Austin Food & Music (Core Features)

- **Destination:** `Austin, TX`
- **Trip name/title:** `Austin Food & Music Weekend`
- **Dates:**
  - Start: `2026-06-12`
  - End: `2026-06-15`
- **Budget per person:** `800`
- **Group size:** `4`
- **Vibes / Preferences:**
  - Vibes: `foodie`, `nightlife`, `live music`
  - Accommodation: `Airbnb`
  - Dining: `mix` (casual + nicer dinners)

Add itinerary items:

1. **Day 1**
   - Flight: `Flight to Austin` (09:00, `Austin-Bergstrom International Airport`, `180`/person)
   - Lodging: `Downtown Loft Check-in` (12:00, `Downtown Austin`, `100`/person)
   - Activity: `South Congress Stroll` (16:00, `South Congress Ave`)
   - Dinner: `Franklin Barbecue` (19:00, `900 E 11th St, Austin`, `40`/person)

2. **Day 2**
   - Brunch: `Breakfast at Paperboy` (10:00, `1203 E 11th St, Austin`, `25`/person)
   - Activity: `Kayaking on Lady Bird Lake` (13:00, `Lady Bird Lake`, `40`/person)
   - Dinner: `Uchi` (19:30, `801 S Lamar Blvd, Austin`, `80`/person)

3. **Day 3**
   - Activity: `Barton Springs Pool` (10:00, `Barton Springs`, `15`/person)
   - Flight: `Flight Home` (15:00, `Austin-Bergstrom`, `180`/person)

Use this trip to test:

- **Dashboard → Trip detail** navigation.
- **TripDestinationHero** imagery and map.
- **Weather** cards for Austin.
- **AI itinerary refinement**: run AI to add/rearrange items.
- **Group chat, comments, polls, votes**.
- **Expense tracking**:
  - Add shared expenses (see Section 4).
- **Photos**:
  - Upload at least **6 photos** to hit the free limit and trigger Pro upgrade prompts.
- **Emergency contacts**:
  - Add embassy/police/medical contacts for Austin.

### 3.2 Trip B – Miami Beach Getaway (Photos & Map)

- **Destination:** `Miami, FL`
- **Trip name:** `Miami Beach Getaway`
- **Dates:** `2026-07-03` → `2026-07-06`
- **Budget per person:** `1200`
- **Group size:** `6`

Key actions:

- Add 2–3 **map-rich** items (e.g., `South Beach`, `Wynwood Walls`, `Little Havana`).
- Use the **map view** (Pro feature) and verify upgrade prompts on free tier.
- Upload **5 photos**, then attempt a 6th to test free vs Pro behavior.

### 3.3 Trip C – Yosemite Camping (Offline / Packing / Weather)

- **Destination:** `Yosemite National Park, CA`
- **Trip name:** `Yosemite Camping & Hiking`
- **Dates:** `2026-09-01` → `2026-09-05`
- **Budget per person:** `500`
- **Group size:** `4`

Use this to test:

- **Packing list generator**.
- **Weather forecast** and “Best times to visit” / local tips.
- AI suggestions for outdoor / park activities.

### 3.4 Trip D – Over-Limit Trips (Upgrade Flow)

Create enough trips on the **Free** plan to exceed the free limit:

- Free plan limit: **3 active trips**.
- Create **4+ active trips** (e.g., `London City Break`, `Tokyo Week`, `Denver Ski Trip`, etc.).

Expected:

- On Dashboard:
  - “Upgrade for more trips” CTA.
- On create attempt beyond limit:
  - 403 or upgrade message with link to `/pricing?checkout=pro`.

---

## 4. Expenses & Splitting Test Data

Use **Trip A – Austin Food & Music Weekend** to fully exercise expenses and splitting.

### 4.1 Participants

Define these members for the Austin trip:

- **Organizer:** `demo@tripsync.com` (Demo User)
- **Friend 1:** `friend.tester+1@example.com`
- **Friend 2:** `friend.tester+2@example.com`
- **Friend 3:** `friend.tester+3@example.com`

Make sure each friend has:

- A TripSync account (register via `/login` → Register)
- Joined the trip via invite (see Section 5)

### 4.2 Sample Expenses

Enter these expenses in the **Expenses** section for Trip A:

1. **Airbnb – Downtown Loft**
   - Amount: `1200`
   - Currency: `USD`
   - Paid by: Organizer (`demo@tripsync.com`)
   - Split between: All 4 members (equal split)
   - Category: `Lodging`
   - Notes: `3 nights, cleaning fee included`
   - Attach receipt image (optional) to test **receipt OCR**.

2. **Franklin Barbecue Dinner**
   - Amount: `220`
   - Paid by: Friend 1
   - Split between: All 4 members
   - Category: `Food & Drink`
   - Notes: `Dinner Day 1, including tip`

3. **Kayak Rental – Lady Bird Lake**
   - Amount: `160`
   - Paid by: Friend 2
   - Split between: All 4 members
   - Category: `Activities`
   - Notes: `2-hour rental`

4. **Rideshare – Airport → Downtown**
   - Amount: `60`
   - Paid by: Friend 3
   - Split between: All 4 members
   - Category: `Transport`
   - Notes: `Arrival ride`

5. **Groceries & Snacks**
   - Amount: `120`
   - Paid by: Organizer
   - Split between: All 4 members
   - Category: `Food & Drink`
   - Notes: `Snacks for Airbnb`

### 4.3 What to Verify

- That each member’s **net balance** (who owes whom) is computed correctly.
- Filtering expenses by **category**.
- Receipt upload and **thumbnail display**.
- CSV export (if available).

---

## 5. Invites, Roles, and Collaboration

Use Trip A (Austin) and Trip C (Yosemite) to test invites and permissions.

### 5.1 Invite Flows

From Trip A:

1. Go to **Members / Invites**.
2. Send invites to:
   - `friend.tester+1@example.com`
   - `friend.tester+2@example.com`
   - `friend.tester+3@example.com`
3. As each friend:
   - Open invite link (from email or `/invite/:inviteId` route in test).
   - Accept the invite.

Verify:

- Invite status changes from **Pending** → **Accepted**.
- Member list updated with correct emails and roles.
- Unauthorized user (another email) **cannot** accept an invite addressed to someone else.

### 5.2 Roles & Permissions

Use the organizer and Friend 1 roles to test:

- Organizer can:
  - Edit trip details, dates, budget.
  - Lock/unlock the trip.
  - Delete the trip.
  - Remove members.
- Regular member can:
  - Add comments, votes, expenses, and photos.
  - Cannot delete the entire trip.

Use the **lock trip** button and verify:

- When locked, regular members cannot add or edit itinerary items (should see a message).

### 5.3 Chat, Comments, and Votes

Within Trip A:

1. **Chat:**
   - Send at least 5 messages between demo + Friend 1.
   - Test @mentions if supported (e.g., `@Friend Tester`).

2. **Comments on items:**
   - Add comments to:
     - The Franklin Barbecue item.
     - The Kayaking item.

3. **Polls / Voting:**
   - Create a poll: “Saturday Dinner?”
   - Options: `Franklin Barbecue`, `Loro`, `Uchi`
   - Each member votes differently.
   - Verify vote counts, winning option, and tie‑handling if applicable.

---

## 6. AI Features Test Data

Test AI functionality on **three different trips**.

### 6.1 AI Itinerary Generation – Austin

On Trip A:

- Use AI to:
  - Generate a full 3‑day itinerary from scratch (if feature supports regen).
  - Ask AI to “optimize for more live music venues” and verify it swaps/adds items.

Prompts you can use:

- “Regenerate the itinerary to include at least one live music venue every night.”
- “Add a brunch spot to Day 2 near South Congress.”

### 6.2 AI for Yosemite – Outdoor Focus

On Trip C:

- Prompt AI for:
  - “Add a sunrise hike on Day 2 with an easy–moderate difficulty level.”
  - “Suggest an alternative campground if Upper Pines is fully booked.”

Verify:

- That AI avoids obviously irrelevant city activities.
- That AI suggestions save correctly as itinerary items.

### 6.3 AI Packing List & Recap

On Trip C:

- Use AI to generate:
  - A **packing list** for camping and day hikes (jackets, boots, headlamp, etc.).
  - A **trip recap** after marking the trip as completed (if supported).

Check:

- Packing list categories (clothing, gear, toiletries, documents).
- Recap summarizes main destinations and activities.

---

## 7. Photos, Mood Boards, and Media

Use Trips A and B.

### 7.1 Photo Upload Limits (Free vs Pro)

On **Free** plan:

1. In Trip A, upload **5 photos** (e.g., dummy Unsplash downloads).
2. Attempt to upload a **6th** photo.

Expected:

- Either:
  - A clear error/toast describing the free limit, and
  - An **“Upgrade to Pro”** CTA linking to `/pricing?checkout=pro`.

After upgrading to **Pro** (see Section 8), try uploading again and verify the limit is lifted.

### 7.2 Mood Board (if present)

If your build includes a **mood board**:

- Pin 4–6 images to the mood board for Trip A.
- Reorder pins (drag‑and‑drop).
- Remove a pin.

Verify:

- New order persists after refresh.
- Removed pins do not reappear.

---

## 8. Subscription & Billing Test Data

### 8.1 Upgrade to Pro

From any “Upgrade” entry point:

- Dashboard CTA: “Upgrade for more trips”
- Trip detail CTAs: “Upgrade to Pro for more photos”, “Upgrade for map view”
- Pricing page: “Start Free Trial” on Pro card or bottom CTA “Start Pro Trial”

Steps:

1. Log in as **demo organizer**.
2. Navigate to **Pricing** (`/pricing`).
3. Choose Pro plan, Annual or Monthly.
4. Run through Stripe Checkout using test card `4242 4242 4242 4242`.

Verify:

- On success, redirect to `/dashboard?upgrade=success`.
- User’s account shows **Pro** tier (check Billing page and/or any Pro badges).
- Free limits are lifted (more than 3 trips, more photos, map view, AI usage).

### 8.2 Upgrade to Teams (Travel Pro account)

1. Log in as **Travel Agent Tester** (`agent.tester+teams@example.com`).
2. Go to `/pricing?checkout=teams` to jump straight to Teams checkout.
3. Complete checkout via Stripe test card.

Verify:

- Account shows **Teams** tier.
- Any Teams‑only features (multi‑workspace, analytics, admin controls) are visible.

### 8.3 Billing Portal

From **Billing page** (`/dashboard/billing`):

1. Click **“Manage billing” / “Open billing portal”**.
2. Ensure you’re redirected to Stripe’s **customer portal**.
3. Test:
   - Viewing invoices.
   - Editing payment method.
   - Canceling subscription (in test mode).

After canceling:

- Webhook should downgrade user to **Free** at the end of the period.
- App should reflect `subscriptionTier: "free"` and restrict Pro/Teams features again.

---

## 9. Admin & Metrics (If Enabled)

Log in as an **admin user** (configured via `ADMIN_EMAILS` env) and test `/admin/metrics`:

- **Admin email:** e.g. `admin.tester@example.com` (must match `ADMIN_EMAILS`).

Verify:

- Access **allowed** for admin email, **403** for non‑admin.
- Metric toggles (Web / iOS / Android) filter charts correctly.
- Per‑metric toggles hide/show curves.
- Date range or cohort selectors (if present) update charts.

---

## 10. Legal & Compliance Features

### 10.1 Cookie Banner

In a fresh browser / incognito:

1. Load `/`.
2. Confirm **cookie consent banner** appears.
3. Test buttons:
   - **Accept all** – banner disappears, consent stored.
   - Clear localStorage key `tripsync_cookie_consent_v1`, reload, banner returns.
   - **Reject optional** – banner disappears; analytics/preferences disabled (as per your implementation).
   - **Customize** → change toggles, **Save preferences**.

### 10.2 Legal Pages & Footer

- Confirm the footer on all main pages includes:
  - Product links (Features, Pricing, Dashboard)
  - Legal (Privacy, Terms)
  - Support (Contact)
- Verify:
  - `/privacy` content loads and no placeholders remain.
  - `/terms` content loads and no placeholders remain.
  - `/contact` form works (see Sections 3–4).

---

This `TEST-DATA.md` now includes concrete users, trips, expenses, invites, AI flows, subscription tests, admin checks, and legal/compliance checks so you can validate **all major TripSync features** end‑to‑end. Adjust names/emails as needed for your environment.
