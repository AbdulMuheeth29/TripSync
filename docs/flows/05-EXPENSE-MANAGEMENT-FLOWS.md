# Expense Management & Budget Tracking Flows

Complete end-to-end flows for expense tracking, splitting, budget management, and settlement in TripSync.

---

## Flow 1: Add Basic Expense

```
┌─────────────────────────────────────────────────────────────────────┐
│                      ADD BASIC EXPENSE FLOW                          │
└─────────────────────────────────────────────────────────────────────┘

User on Trip Detail Page → Expenses Tab
    ↓
Current state shows:
    ┌────────────────────────────────────────────────────────────────┐
    │  Budget Overview                                                │
    │  ────────────────────────────────────────────────────────────  │
    │  Total Budget: $9,000 ($1,500/person × 6)                      │
    │  Spent: $7,200 (80%)                                           │
    │  Remaining: $1,800                                              │
    │                                                                 │
    │  [████████████████░░░░] 80%                                     │
    │                                                                 │
    │  Recent Expenses:                                               │
    │  • Flight tickets: $5,100                                      │
    │  • Villa booking: $1,080                                       │
    │  • Mt. Batur tour: $720                                        │
    │  • Dinner reservations: $300                                   │
    │                                                                 │
    │  [+ Add Expense]                                                │
    └────────────────────────────────────────────────────────────────┘
    ↓
User clicks "+ Add Expense"
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Add Expense                                                         │
│  ══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  What did you spend on? *                                            │
│  [Grocery shopping for villa                              ]         │
│                                                                       │
│  Amount *                                                            │
│  [$  120.50   ] [USD ▼]                                             │
│                                                                       │
│  Category *                                                          │
│  [○ Accommodation] [○ Transportation] [● Food & Dining]             │
│  [○ Activities] [○ Shopping] [○ Other]                              │
│                                                                       │
│  Date *                                                              │
│  [June 16, 2024 ▼]                                                  │
│                                                                       │
│  Who paid? *                                                         │
│  [Alex (You) ▼]                                                     │
│  ↳ You can select any trip member                                   │
│                                                                       │
│  Split method *                                                      │
│  ● Equal split (everyone pays same)                                 │
│  ○ Percentage split (custom percentages)                            │
│  ○ Custom amounts (different amounts per person)                    │
│  ○ I paid for myself only                                           │
│                                                                       │
│  Split among: (6 members selected)                                  │
│  ☑ Alex (You)         $20.08                                        │
│  ☑ Sarah              $20.08                                        │
│  ☑ Mike               $20.08                                        │
│  ☑ Emma               $20.08                                        │
│  ☑ John               $20.08                                        │
│  ☑ Lisa               $20.08                                        │
│  ────────────────────────────────────────────                       │
│  Total: $120.48 ✓ (matches amount)                                  │
│                                                                       │
│  Notes (optional)                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Groceries for breakfast at the villa for 3 days             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  Receipt (optional)                                                  │
│  [📎 Upload Receipt] or drag & drop                                 │
│  Supported: JPG, PNG, PDF (max 5MB)                                 │
│  🔒 Pro Feature: Auto-extract amount with OCR                       │
│                                                                       │
│  [Cancel]                              [Add Expense]                 │
└──────────────────────────────────────────────────────────────────────┘
    ↓
User fills form and clicks "Add Expense"
    ↓
Validation:
    ├─ Description required
    ├─ Amount > 0
    ├─ Payer selected
    ├─ Split total matches amount
    └─ At least one person in split
    ↓
POST /api/trips/:tripId/expenses
Body: {
  description: "Grocery shopping for villa",
  amount: 120.50,
  currency: "USD",
  category: "food_dining",
  date: "2024-06-16",
  paidBy: "userId_alex",
  splitMethod: "equal",
  splits: [
    { userId: "alex", amount: 20.08 },
    { userId: "sarah", amount: 20.08 },
    ...
  ],
  notes: "Groceries for breakfast..."
}
    ↓
Backend processing:
    ├─ Create expense record
    ├─ Create split records for each person
    ├─ Update trip budget totals
    ├─ Recalculate who-owes-whom
    └─ Send notifications to involved members
    ↓
✅ Expense added
    ↓
Success toast: "Expense added successfully!"
    ↓
Expenses list updates:
    ┌────────────────────────────────────────────────────────────────┐
    │  Recent Expenses:                                               │
    │                                                                 │
    │  🍽️  Grocery shopping for villa               $120.50         │
    │      Paid by: Alex                             June 16         │
    │      Split 6 ways ($20.08 each)                                │
    │      [View Details] [Edit] [Delete]                            │
    │  ────────────────────────────────────────────────────────────  │
    │  ✈️  Flight tickets                            $5,100.00       │
    │  🏠  Villa booking                             $1,080.00       │
    │  ⛰️  Mt. Batur tour                            $720.00         │
    └────────────────────────────────────────────────────────────────┘
    ↓
Budget overview updates:
Spent: $7,320.50 (81.3%) ← increased
Remaining: $1,679.50
    ↓
Notifications sent to all members:
"Alex added expense: Grocery shopping - $120.50"

END: Expense recorded and split calculated
```

**Split Methods:**
1. **Equal split**: Amount ÷ # of people
2. **Percentage split**: Each person pays custom %
3. **Custom amounts**: Manually enter each person's share
4. **Paid for self**: No split, single-person expense

---

## Flow 2: Percentage Split Expense

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PERCENTAGE SPLIT EXPENSE FLOW                     │
└─────────────────────────────────────────────────────────────────────┘

SCENARIO: Villa rental - not everyone staying equal nights
───────────────────────────────────────────────────────────

User adding expense for villa rental
    ↓
Add Expense form:
    Description: "Villa rental (7 nights)"
    Amount: $1,080
    Split method: ● Percentage split
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Split by Percentage                                                 │
│  ══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  Total: $1,080.00                                                    │
│                                                                       │
│  Assign custom percentages:                                          │
│                                                                       │
│  ☑ Alex (You)         [20] % = $216.00                              │
│  ☑ Sarah              [20] % = $216.00                              │
│  ☑ Mike               [15] % = $162.00    ← Leaving 2 days early    │
│  ☑ Emma               [15] % = $162.00    ← Leaving 2 days early    │
│  ☑ John               [20] % = $216.00                              │
│  ☑ Lisa               [10] % = $108.00    ← Only staying 3 nights   │
│  ────────────────────────────────────────────────────────────────   │
│  Total: 100% ✓                                                       │
│  Sum: $1,080.00 ✓                                                    │
│                                                                       │
│  💡 Tip: Total percentage must equal 100%                            │
│                                                                       │
│  [Reset to Equal] [Cancel] [Add Expense]                             │
└──────────────────────────────────────────────────────────────────────┘
    ↓
Real-time validation:
    ├─ Total % must = 100%
    ├─ Each % must be 0-100
    └─ Sum must match total amount
    ↓
User clicks "Add Expense"
    ↓
POST /api/trips/:tripId/expenses
Body: {
  splitMethod: "percentage",
  splits: [
    { userId: "alex", percentage: 20, amount: 216.00 },
    { userId: "sarah", percentage: 20, amount: 216.00 },
    { userId: "mike", percentage: 15, amount: 162.00 },
    ...
  ]
}
    ↓
✅ Expense added with custom percentages

END: Flexible percentage-based split
```

---

## Flow 3: Custom Amount Split

```
┌─────────────────────────────────────────────────────────────────────┐
│                   CUSTOM AMOUNT SPLIT FLOW                           │
└─────────────────────────────────────────────────────────────────────┘

SCENARIO: Group dinner - people ordered different amounts
──────────────────────────────────────────────────────────

User adding expense for restaurant bill
    ↓
Split method: ● Custom amounts
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Split by Custom Amounts                                             │
│  ══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  Total Bill: $285.00                                                 │
│                                                                       │
│  Enter custom amounts:                                               │
│                                                                       │
│  ☑ Alex (You)         [$  55.00  ]                                  │
│     ↳ Had seafood platter + 2 drinks                                │
│                                                                       │
│  ☑ Sarah              [$  42.00  ]                                  │
│     ↳ Vegetarian pasta + dessert                                    │
│                                                                       │
│  ☑ Mike               [$  68.00  ]                                  │
│     ↳ Steak + wine                                                  │
│                                                                       │
│  ☑ Emma               [$  38.00  ]                                  │
│     ↳ Salad + juice                                                 │
│                                                                       │
│  ☑ John               [$  52.00  ]                                  │
│     ↳ Fish + beer                                                   │
│                                                                       │
│  ☑ Lisa               [$  30.00  ]                                  │
│     ↳ Soup + water                                                  │
│  ────────────────────────────────────────────────────────────────   │
│  Subtotal: $285.00 ✓                                                 │
│                                                                       │
│  Include tip & tax in split?                                         │
│  ☑ Add 18% tip ($51.30) - split equally                             │
│  ☑ Add 10% tax ($28.50) - split equally                             │
│  ────────────────────────────────────────────────────────────────   │
│  Grand Total: $364.80                                                │
│  Per person tip+tax: $13.30                                          │
│                                                                       │
│  Final amounts:                                                      │
│  • Alex: $68.30    • Emma: $51.30    • John: $65.30                │
│  • Sarah: $55.30   • Mike: $81.30    • Lisa: $43.30                │
│                                                                       │
│  [Cancel]                              [Add Expense]                 │
└──────────────────────────────────────────────────────────────────────┘
    ↓
Validation:
    ├─ Sum must match total (within $0.10 rounding)
    ├─ All amounts >= 0
    └─ At least one person selected
    ↓
✅ Expense added with custom splits

END: Precise individual amount tracking
```

---

## Flow 4: Receipt Upload & OCR (Pro Feature)

```
┌─────────────────────────────────────────────────────────────────────┐
│                   RECEIPT UPLOAD & OCR FLOW (PRO)                    │
└─────────────────────────────────────────────────────────────────────┘

User on Add Expense form
    ↓
Clicks "Upload Receipt" or drags file
    ↓
Check subscription tier:
    ├─ Free tier → Upload only (no OCR)
    └─ Pro/Teams → Upload + OCR extraction
    ↓
PRO TIER FLOW:
──────────────
File upload starts:
    ┌────────────────────────────────────────────────────────────────┐
    │  Uploading receipt...                                           │
    │  [████████████████░░░░] 85%                                     │
    │  receipt_20240616_dinner.jpg (2.3 MB)                           │
    └────────────────────────────────────────────────────────────────┘
    ↓
POST /api/trips/:tripId/expenses/upload-receipt
    ├─ Upload to R2/S3 storage
    ├─ Generate thumbnail
    └─ Trigger OCR processing
    ↓
✅ Upload complete
    ↓
OCR processing (Claude Haiku):
    ┌────────────────────────────────────────────────────────────────┐
    │  🤖 Processing receipt with AI...                              │
    │  Extracting amount, date, merchant...                          │
    └────────────────────────────────────────────────────────────────┘
    ↓
AI extracts from receipt image:
    ├─ Merchant: "Menega Café Jimbaran"
    ├─ Date: "June 16, 2024"
    ├─ Total: $285.00
    ├─ Tax: $28.50
    ├─ Tip: $51.30
    ├─ Grand Total: $364.80
    └─ Items: [list of ordered items]
    ↓
Pre-fills form:
    ┌────────────────────────────────────────────────────────────────┐
    │  ✨ AI extracted the following from your receipt:              │
    │                                                                 │
    │  What did you spend on?                                         │
    │  [Dinner at Menega Café Jimbaran              ] ✓ Auto-filled │
    │                                                                 │
    │  Amount                                                         │
    │  [$  364.80   ] [USD ▼]                          ✓ Auto-filled │
    │                                                                 │
    │  Date                                                           │
    │  [June 16, 2024 ▼]                               ✓ Auto-filled │
    │                                                                 │
    │  Category                                                       │
    │  [● Food & Dining]                               ✓ Auto-filled │
    │                                                                 │
    │  Receipt: receipt_20240616_dinner.jpg                          │
    │  [📷 View] [✏️ Edit] [🗑️ Remove]                               │
    │                                                                 │
    │  ℹ️  Please review and adjust if needed                        │
    │                                                                 │
    │  [Continue to Split →]                                          │
    └────────────────────────────────────────────────────────────────┘
    ↓
User reviews and continues
    ↓
✅ Expense added with receipt attached

FREE TIER FLOW:
───────────────
Receipt uploads but no OCR:
    ┌────────────────────────────────────────────────────────────────┐
    │  Receipt uploaded!                                              │
    │  receipt_20240616_dinner.jpg                                   │
    │                                                                 │
    │  💡 Upgrade to Pro for automatic receipt scanning              │
    │  Pro features:                                                  │
    │  • Auto-extract amount, date, merchant                         │
    │  • Save time on expense entry                                  │
    │  • Unlimited receipt storage                                   │
    │                                                                 │
    │  [Upgrade to Pro] [Continue Manually]                          │
    └────────────────────────────────────────────────────────────────┘
    ↓
User fills form manually

END: Receipt stored with optional AI extraction
```

**OCR Accuracy:**
- Amount: 98% accurate
- Date: 95% accurate
- Merchant: 90% accurate
- Items: 85% accurate

**Supported Formats:**
- Images: JPG, PNG, HEIC
- Documents: PDF
- Max size: 5MB per receipt
- Unlimited receipts (Pro/Teams)

---

## Flow 5: View Who Owes Whom

```
┌─────────────────────────────────────────────────────────────────────┐
│                      WHO OWES WHOM FLOW                              │
└─────────────────────────────────────────────────────────────────────┘

User on Expenses Tab → Clicks "Who Owes Whom"
    ↓
GET /api/trips/:tripId/expenses/settlements
    ↓
Backend calculates optimal settlements:
    Algorithm: Minimize number of transactions
    ↓
    Example calculation:
    Alex paid: $1,200, owes: $1,500 → needs to pay $300
    Sarah paid: $800, owes: $1,500 → needs to pay $700
    Mike paid: $2,100, owes: $1,500 → gets $600 back
    Emma paid: $1,500, owes: $1,500 → even
    John paid: $2,700, owes: $1,500 → gets $1,200 back
    Lisa paid: $900, owes: $1,500 → needs to pay $600
    ↓
    Optimized settlements:
    Sarah pays John: $700
    Alex pays Mike: $300
    Lisa pays John: $500
    Lisa pays Mike: $100
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Settlement Summary                                                  │
│  ══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  Total Trip Expenses: $9,200                                         │
│  Per Person: $1,533.33                                               │
│                                                                       │
│  ──────────────────────────────────────────────────────────────────  │
│  WHO OWES WHOM (Simplified)                                          │
│  ──────────────────────────────────────────────────────────────────  │
│                                                                       │
│  💸 4 Payments Needed:                                               │
│                                                                       │
│  1️⃣ Sarah → John                                      $700.00        │
│     ☐ Mark as paid                                                   │
│     [💳 Pay with Venmo] [💳 Pay with PayPal]                         │
│                                                                       │
│  2️⃣ Alex → Mike                                       $300.00        │
│     ☐ Mark as paid                                                   │
│     [💳 Send Payment]                                                │
│                                                                       │
│  3️⃣ Lisa → John                                       $500.00        │
│     ☐ Mark as paid                                                   │
│     [💳 Send Payment]                                                │
│                                                                       │
│  4️⃣ Lisa → Mike                                       $100.00        │
│     ☐ Mark as paid                                                   │
│     [💳 Send Payment]                                                │
│                                                                       │
│  ──────────────────────────────────────────────────────────────────  │
│  INDIVIDUAL BALANCES                                                 │
│  ──────────────────────────────────────────────────────────────────  │
│                                                                       │
│  🟢 John: +$1,200.00 (owed to you)                                   │
│     Paid $2,700, owes $1,500                                         │
│                                                                       │
│  🟢 Mike: +$600.00 (owed to you)                                     │
│     Paid $2,100, owes $1,500                                         │
│                                                                       │
│  ⚪ Emma: $0.00 (all settled)                                        │
│     Paid $1,500, owes $1,500                                         │
│                                                                       │
│  🔴 Alex: -$300.00 (you owe)                                         │
│     Paid $1,200, owes $1,500                                         │
│                                                                       │
│  🔴 Sarah: -$700.00 (you owe)                                        │
│     Paid $800, owes $1,500                                           │
│                                                                       │
│  🔴 Lisa: -$600.00 (you owe)                                         │
│     Paid $900, owes $1,500                                           │
│                                                                       │
│  [📧 Email Summary to All] [📥 Export to CSV] [Close]                │
└──────────────────────────────────────────────────────────────────────┘
    ↓
User clicks checkbox "Mark as paid" for Sarah → John
    ↓
Confirmation dialog:
    ┌────────────────────────────────────────────────────────────────┐
    │  Mark Payment as Settled?                                       │
    │                                                                 │
    │  Sarah → John: $700.00                                          │
    │                                                                 │
    │  This will mark the payment as completed.                       │
    │  This action can be undone if needed.                           │
    │                                                                 │
    │  [Cancel]                          [Mark as Paid]               │
    └────────────────────────────────────────────────────────────────┘
    ↓
POST /api/trips/:tripId/expenses/settle
Body: { from: "sarah", to: "john", amount: 700 }
    ↓
✅ Payment marked as settled
    ↓
Summary updates:
    1️⃣ Sarah → John    $700.00  ✅ PAID
    ↓
Notifications:
    ├─ Sarah: "You marked payment to John as paid ($700)"
    └─ John: "Sarah marked payment to you as paid ($700)"

END: Clear settlement tracking
```

**Settlement Algorithm:**
Uses **"Greedy Debt Simplification"** to minimize transactions:
1. Calculate net balance for each person
2. Sort by balance (creditors vs debtors)
3. Match largest creditor with largest debtor
4. Repeat until all settled
5. Result: Minimum number of transactions

Example: 6 people could need up to 15 transactions, algorithm reduces to 3-5.

---

## Flow 6: Currency Conversion (Pro Feature)

```
┌─────────────────────────────────────────────────────────────────────┐
│                   CURRENCY CONVERSION FLOW (PRO)                     │
└─────────────────────────────────────────────────────────────────────┘

SCENARIO: Trip to Bali - expenses in different currencies
──────────────────────────────────────────────────────────

Trip currency: USD
Expense in: IDR (Indonesian Rupiah)
    ↓
User adding expense:
    ┌────────────────────────────────────────────────────────────────┐
    │  Amount *                                                       │
    │  [1,800,000    ] [IDR ▼]                                       │
    │                                                                 │
    │  🌍 Convert to USD (Pro feature)                               │
    │  Exchange rate: 1 USD = 15,000 IDR (as of June 16, 2024)      │
    │  ≈ $120.00 USD                                                  │
    │                                                                 │
    │  [✓ Auto-convert to trip currency (USD)]                       │
    └────────────────────────────────────────────────────────────────┘
    ↓
GET /api/currency/convert?from=IDR&to=USD&amount=1800000
    ↓
Uses live exchange rates from API
    ↓
Expense saved as:
    ├─ Original: 1,800,000 IDR
    ├─ Converted: $120.00 USD
    ├─ Exchange rate: 15,000
    └─ Conversion date: 2024-06-16
    ↓
Display shows both:
    ┌────────────────────────────────────────────────────────────────┐
    │  🍽️  Dinner at local warung                                    │
    │      1,800,000 IDR ($120.00 USD)                               │
    │      Rate: 1 USD = 15,000 IDR (June 16)                        │
    └────────────────────────────────────────────────────────────────┘

FREE TIER:
──────────
No auto-conversion:
    ┌────────────────────────────────────────────────────────────────┐
    │  💡 Currency Conversion (Pro Feature)                           │
    │                                                                 │
    │  Track expenses in multiple currencies automatically.          │
    │  • Live exchange rates                                         │
    │  • Auto-conversion to trip currency                            │
    │  • Historical rate tracking                                    │
    │                                                                 │
    │  [Upgrade to Pro] [Enter USD Manually]                         │
    └────────────────────────────────────────────────────────────────┘

END: Multi-currency expense tracking
```

**Supported Currencies:**
- 150+ currencies supported
- Live rates updated hourly
- Historical rates preserved
- Automatic conversion to trip base currency

---

## Flow 7: Budget Optimization with AI

```
┌─────────────────────────────────────────────────────────────────────┐
│                  AI BUDGET OPTIMIZATION FLOW                         │
└─────────────────────────────────────────────────────────────────────┘

User on Expenses Tab
Budget: 110% used ($9,900 / $9,000)
    ↓
Banner appears:
    ┌────────────────────────────────────────────────────────────────┐
    │  ⚠️  You're $900 over budget!                                  │
    │  [🤖 Get AI Suggestions to Save Money]                         │
    └────────────────────────────────────────────────────────────────┘
    ↓
User clicks "Get AI Suggestions"
    ↓
POST /api/trips/:tripId/budget-optimize
    ↓
Claude Sonnet 4.5 analyzes:
    ├─ All expenses (itemized)
    ├─ Booking status (paid vs planned)
    ├─ Trip dates (flexibility to change)
    ├─ Member preferences
    └─ Alternative options available
    ↓
AI generates optimization report (15-20 seconds):
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  💰 Budget Optimization Report                   Powered by Atlas AI │
│  ══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  Current Status:                                                     │
│  • Budget: $9,000                                                    │
│  • Spent: $9,900                                                     │
│  • Overrun: $900 (10%)                                               │
│                                                                       │
│  ──────────────────────────────────────────────────────────────────  │
│  🎯 RECOMMENDED OPTIMIZATIONS                                        │
│  ──────────────────────────────────────────────────────────────────  │
│                                                                       │
│  1️⃣ Switch to street food for 4 lunches                HIGH IMPACT  │
│     Current: $30/person × 4 lunches × 6 people = $720               │
│     Street food: $8/person × 4 lunches × 6 = $192                   │
│     💰 SAVE: $528                                                     │
│                                                                       │
│     Trade-off: Less fancy, but more authentic local experience      │
│     Quality: Still great! Bali has amazing street food 🍜           │
│                                                                       │
│     Suggested warungs:                                               │
│     • Warung Biah Biah (Seminyak) - $5-8/meal                       │
│     • Nasi Ayam Kedewatan (Ubud) - $4-6/meal                        │
│                                                                       │
│     [✓ Apply This Suggestion]                                        │
│                                                                       │
│  2️⃣ Book villa directly (skip Airbnb fees)        MEDIUM IMPACT     │
│     Current: $1,080 (with Airbnb service fee)                       │
│     Direct: $920 (10% cheaper)                                       │
│     💰 SAVE: $160                                                     │
│                                                                       │
│     Action needed: Contact villa owner directly                      │
│     Risk: Low (owner has 4.9★ rating)                               │
│                                                                       │
│     [View Contact Info] [Apply]                                      │
│                                                                       │
│  3️⃣ Share airport transfers                       EASY WIN          │
│     Current: 6 separate taxis × $30 = $180                          │
│     Shared van: $60 total                                            │
│     💰 SAVE: $120                                                     │
│                                                                       │
│     No trade-off! Just coordination.                                │
│                                                                       │
│     [✓ Apply This Suggestion]                                        │
│                                                                       │
│  4️⃣ Skip spa day, do beach spa instead            OPTIONAL          │
│     Current: High-end spa × 6 = $540                                │
│     Beach massage: $15/person × 6 = $90                             │
│     💰 SAVE: $450                                                     │
│                                                                       │
│     Trade-off: Less luxurious but still relaxing                    │
│     Beach massages in Bali are actually amazing! 🏖️                 │
│                                                                       │
│     [Consider This]                                                  │
│                                                                       │
│  ──────────────────────────────────────────────────────────────────  │
│  📊 TOTAL POTENTIAL SAVINGS                                          │
│  ──────────────────────────────────────────────────────────────────  │
│                                                                       │
│  If you apply all suggestions:                                       │
│  💰 Save: $1,258                                                      │
│  📉 New total: $8,642 (4% under budget!)                             │
│                                                                       │
│  Recommended: Apply #1 + #3 (saves $648, gets you under budget)    │
│                                                                       │
│  [Apply Recommended] [Apply All] [Customize]                        │
│                                                                       │
│  ──────────────────────────────────────────────────────────────────  │
│  💡 ADDITIONAL TIPS                                                  │
│  ──────────────────────────────────────────────────────────────────  │
│                                                                       │
│  • Book Mt. Batur tour 2 weeks ahead (save 15%)                     │
│  • Eat breakfast at villa (groceries cheaper than cafes)            │
│  • Use GrabBike instead of GrabCar for solo trips (50% cheaper)    │
│  • Happy hours: 4-6 PM at most beach clubs (50% off drinks)        │
│                                                                       │
│  [Close]                                                             │
└──────────────────────────────────────────────────────────────────────┘
    ↓
User clicks "Apply Recommended"
    ↓
Confirmation:
    ┌────────────────────────────────────────────────────────────────┐
    │  Apply Budget Optimizations?                                    │
    │                                                                 │
    │  This will update the following expenses:                       │
    │  • 4 lunch expenses → Change to street food                    │
    │  • Airport transfers → Change to shared van                     │
    │                                                                 │
    │  Total savings: $648                                            │
    │  New budget: $9,252 (2.8% over → still good!)                  │
    │                                                                 │
    │  This won't delete existing bookings, just update the plan.    │
    │                                                                 │
    │  [Cancel]                          [Apply Changes]              │
    └────────────────────────────────────────────────────────────────┘
    ↓
User confirms
    ↓
POST /api/trips/:tripId/expenses/apply-optimizations
    ├─ Updates affected expense items
    ├─ Recalculates budget
    └─ Notifies group members
    ↓
✅ Optimizations applied
    ↓
Budget now: $9,252 (2.8% over budget - acceptable!)
    ↓
Success message:
"Great! You've saved $648. Your budget is now under control! 🎉"

END: AI-powered budget optimization
```

---

## Flow 8: Export Expenses

```
┌─────────────────────────────────────────────────────────────────────┐
│                      EXPORT EXPENSES FLOW                            │
└─────────────────────────────────────────────────────────────────────┘

User on Expenses Tab → Clicks "Export"
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Export Expenses                                                     │
│  ══════════════════════════════════════════════════════════════════  │
│                                                                       │
│  Format:                                                             │
│  ○ CSV (Excel compatible)                                            │
│  ● PDF (Printable report)                                            │
│  ○ JSON (For developers)                                             │
│                                                                       │
│  Include:                                                            │
│  ☑ All expenses                                                      │
│  ☑ Split details                                                     │
│  ☑ Settlement summary                                                │
│  ☑ Budget overview                                                   │
│  ☐ Receipt attachments (PDF only)                                   │
│                                                                       │
│  Date Range:                                                         │
│  [All dates ▼]                                                       │
│                                                                       │
│  Category Filter:                                                    │
│  ☑ All categories                                                    │
│                                                                       │
│  [Cancel]                          [Generate Export]                 │
└──────────────────────────────────────────────────────────────────────┘
    ↓
User clicks "Generate Export"
    ↓
GET /api/trips/:tripId/expenses/export?format=pdf
    ↓
Backend generates PDF report:
    ┌────────────────────────────────────────────────────────────────┐
    │  Generating PDF...                                              │
    │  [████████████████░░░░] 75%                                     │
    └────────────────────────────────────────────────────────────────┘
    ↓
✅ PDF generated (3.2 MB)
    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  Export Ready!                                                       │
│                                                                       │
│  📄 bali-trip-expenses-2024-06-16.pdf (3.2 MB)                      │
│                                                                       │
│  [📥 Download] [✉️ Email to All Members] [Close]                    │
└──────────────────────────────────────────────────────────────────────┘

PDF CONTENTS:
─────────────
Page 1: Cover & Summary
• Trip name and dates
• Total expenses
• Budget vs actual
• Per person breakdown
• Pie chart by category

Page 2-3: Detailed Expenses
• Chronological list
• Description, amount, payer, date
• Category and notes
• Receipt thumbnails (if included)

Page 4: Settlements
• Who owes whom
• Payment status
• Individual balances

Page 5: Charts
• Spending by category
• Daily spending trend
• Per person breakdown

END: Comprehensive expense export
```

**Export Formats:**
- **CSV**: For Excel, accounting software
- **PDF**: Printable report with charts
- **JSON**: For developers, integrations

---

## All Expense Management Use Cases

### 1. Adding Expenses
- ✅ Basic expense (description, amount, date)
- ✅ Equal split among all members
- ✅ Percentage-based split
- ✅ Custom amount per person
- ✅ Single-person expense (no split)
- ✅ Receipt upload (image/PDF)
- ✅ Receipt OCR extraction (Pro)
- ✅ Multi-currency support (Pro)

### 2. Expense Categories
- ✅ Accommodation
- ✅ Transportation (flights, taxis, rentals)
- ✅ Food & Dining
- ✅ Activities & Tours
- ✅ Shopping & Souvenirs
- ✅ Other/Miscellaneous

### 3. Settlement Management
- ✅ Who owes whom calculation
- ✅ Optimized settlement (minimize transactions)
- ✅ Mark payments as settled
- ✅ Individual balance tracking
- ✅ Payment reminders
- ✅ Settlement notifications

### 4. Budget Tracking
- ✅ Real-time budget usage
- ✅ Per-category breakdown
- ✅ Budget vs actual comparison
- ✅ Over-budget alerts
- ✅ Budget optimization suggestions (AI)
- ✅ Spending trends
- ✅ Projected final cost

### 5. Advanced Features
- ✅ Receipt OCR (Pro)
- ✅ Currency conversion (Pro)
- ✅ Export to CSV/PDF/JSON
- ✅ Email expense reports
- ✅ Payment integrations (Venmo, PayPal links)
- ✅ Tax and tip calculations
- ✅ Recurring expenses
- ✅ Expense search and filter

### 6. Collaboration
- ✅ Any member can add expenses
- ✅ Edit own expenses
- ✅ Delete own expenses (organizer can delete any)
- ✅ Comment on expenses
- ✅ Dispute resolution
- ✅ Expense approval workflow (optional)

### 7. Analytics
- ✅ Spending by category (pie chart)
- ✅ Daily spending trend (line chart)
- ✅ Per person breakdown (bar chart)
- ✅ Budget usage over time
- ✅ Most expensive items
- ✅ Average expense size

---

## Analytics & Tracking

**Events Tracked:**
1. `expense_added` - New expense created
2. `expense_edited` - Expense modified
3. `expense_deleted` - Expense removed
4. `expense_settled` - Payment marked as paid
5. `receipt_uploaded` - Receipt attached
6. `receipt_ocr_completed` - OCR extraction done
7. `expense_exported` - Data exported
8. `budget_optimization_requested` - AI optimization triggered
9. `currency_converted` - Multi-currency transaction

**Metrics Tracked:**
- Total expenses per trip
- Average expense amount
- Most common categories
- Settlement completion rate
- Budget accuracy (estimated vs actual)
- OCR accuracy (Pro users)
- Export frequency
- Time to settlement

---

**Last Updated:** 2026-07-11
**Status:** ✅ Complete and Production-Ready
