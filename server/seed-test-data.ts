/**
 * Comprehensive Test Data Seed Script for Trip-Sync
 *
 * This script creates realistic test data for QA testing all features including:
 * - Multiple users with different roles
 * - Trips in various states (planning, active, completed)
 * - All 7 integrated modal features (Packing, Transportation, Documents, Polls, Availability, Photos, Recap)
 * - Complete itineraries, expenses, comments, votes
 * - Chat messages, preferences, location sharing
 * - Emergency contacts, mood boards, satisfaction ratings
 */

import { getDb } from './db';
import * as bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

// Helper to create dates relative to today
const daysFromNow = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

const hoursFromNow = (hours: number) => {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date.toISOString();
};

async function seedTestData() {
  console.log('🌱 Starting comprehensive test data seed...\n');

  const db = getDb() as any; // Using any for Prisma-style API (this seed script needs migration to Drizzle)

  try {
    // ============================================================================
    // 1. CREATE TEST USERS
    // ============================================================================
    console.log('👥 Creating test users...');

    const hashedPassword = await bcrypt.hash('password123', SALT_ROUNDS);

    const users = await Promise.all([
      // Organizer/Admin user
      db.user.create({
        data: {
          email: 'alice@tripsync.com',
          name: 'Alice Anderson',
          passwordHash: hashedPassword,
          subscriptionTier: 'pro',
          subscriptionStatus: 'active',
        },
      }),
      // Regular members
      db.user.create({
        data: {
          email: 'bob@tripsync.com',
          name: 'Bob Brown',
          passwordHash: hashedPassword,
          subscriptionTier: 'free',
          subscriptionStatus: 'active',
        },
      }),
      db.user.create({
        data: {
          email: 'charlie@tripsync.com',
          name: 'Charlie Chen',
          passwordHash: hashedPassword,
          subscriptionTier: 'free',
          subscriptionStatus: 'active',
        },
      }),
      db.user.create({
        data: {
          email: 'diana@tripsync.com',
          name: 'Diana Davis',
          passwordHash: hashedPassword,
          subscriptionTier: 'pro',
          subscriptionStatus: 'active',
        },
      }),
      db.user.create({
        data: {
          email: 'evan@tripsync.com',
          name: 'Evan Edwards',
          passwordHash: hashedPassword,
          subscriptionTier: 'free',
          subscriptionStatus: 'active',
        },
      }),
    ]);

    console.log(`✅ Created ${users.length} test users\n`);

    // ============================================================================
    // 2. CREATE TEST TRIPS
    // ============================================================================
    console.log('🌍 Creating test trips...');

    // TRIP 1: UPCOMING TRIP - Tokyo Adventure (Full featured)
    const tokyoTrip = await db.trip.create({
      data: {
        name: 'Tokyo Adventure 2026',
        destination: 'Tokyo, Japan',
        startDate: daysFromNow(30),
        endDate: daysFromNow(37),
        budgetPerPerson: 2500,
        groupSize: 4,
        organizerId: users[0].id,
        status: 'planning',
        voteDeadline: daysFromNow(15),
        shareCode: 'TOKYO2026',
        recapText: null,
        aiPreferencesLearned: true,
      },
    });

    // TRIP 2: ACTIVE TRIP - Paris Getaway (Currently happening)
    const parisTrip = await db.trip.create({
      data: {
        name: 'Paris Romantic Getaway',
        destination: 'Paris, France',
        startDate: daysFromNow(-2),
        endDate: daysFromNow(3),
        budgetPerPerson: 3000,
        groupSize: 2,
        organizerId: users[1].id,
        status: 'in_progress',
        voteDeadline: daysFromNow(-5),
        shareCode: 'PARIS2026',
        recapText: null,
        aiPreferencesLearned: false,
      },
    });

    // TRIP 3: COMPLETED TRIP - Barcelona Beach Week (With recap)
    const barcelonaTrip = await db.trip.create({
      data: {
        name: 'Barcelona Beach Week',
        destination: 'Barcelona, Spain',
        startDate: daysFromNow(-30),
        endDate: daysFromNow(-23),
        budgetPerPerson: 1800,
        groupSize: 5,
        organizerId: users[0].id,
        status: 'completed',
        voteDeadline: daysFromNow(-45),
        shareCode: 'BCN2025',
        recapText:
          "What an incredible week in Barcelona! We started with tapas at La Boqueria market - the jamón ibérico was unforgettable. Spent lazy afternoons at Barceloneta Beach, evenings exploring Gothic Quarter's winding streets. Gaudí's Sagrada Familia left us speechless. Late-night paella by the beach, spontaneous flamenco show, and that magical sunset from Park Güell. The group chemistry was perfect - lots of laughs, zero drama. Already planning our return trip!",
        aiPreferencesLearned: true,
      },
    });

    console.log(`✅ Created 3 test trips\n`);

    // ============================================================================
    // 3. CREATE TRIP MEMBERS
    // ============================================================================
    console.log('👫 Adding trip members...');

    // Tokyo Trip Members (4 people)
    await Promise.all([
      db.tripMember.create({
        data: {
          tripId: tokyoTrip.id,
          userId: users[0].id,
          role: 'organizer',
          rsvpStatus: 'accepted',
          joinedAt: hoursFromNow(-720),
        },
      }),
      db.tripMember.create({
        data: {
          tripId: tokyoTrip.id,
          userId: users[1].id,
          role: 'member',
          rsvpStatus: 'accepted',
          joinedAt: hoursFromNow(-700),
        },
      }),
      db.tripMember.create({
        data: {
          tripId: tokyoTrip.id,
          userId: users[2].id,
          role: 'member',
          rsvpStatus: 'accepted',
          joinedAt: hoursFromNow(-680),
        },
      }),
      db.tripMember.create({
        data: {
          tripId: tokyoTrip.id,
          userId: users[3].id,
          role: 'member',
          rsvpStatus: 'pending',
          joinedAt: hoursFromNow(-660),
        },
      }),
    ]);

    // Paris Trip Members (2 people)
    await Promise.all([
      db.tripMember.create({
        data: {
          tripId: parisTrip.id,
          userId: users[1].id,
          role: 'organizer',
          rsvpStatus: 'accepted',
          joinedAt: hoursFromNow(-480),
        },
      }),
      db.tripMember.create({
        data: {
          tripId: parisTrip.id,
          userId: users[3].id,
          role: 'member',
          rsvpStatus: 'accepted',
          joinedAt: hoursFromNow(-470),
        },
      }),
    ]);

    // Barcelona Trip Members (5 people)
    await Promise.all([
      db.tripMember.create({
        data: {
          tripId: barcelonaTrip.id,
          userId: users[0].id,
          role: 'organizer',
          rsvpStatus: 'accepted',
          joinedAt: hoursFromNow(-1200),
        },
      }),
      db.tripMember.create({
        data: {
          tripId: barcelonaTrip.id,
          userId: users[1].id,
          role: 'member',
          rsvpStatus: 'accepted',
          joinedAt: hoursFromNow(-1190),
        },
      }),
      db.tripMember.create({
        data: {
          tripId: barcelonaTrip.id,
          userId: users[2].id,
          role: 'member',
          rsvpStatus: 'accepted',
          joinedAt: hoursFromNow(-1180),
        },
      }),
      db.tripMember.create({
        data: {
          tripId: barcelonaTrip.id,
          userId: users[3].id,
          role: 'member',
          rsvpStatus: 'accepted',
          joinedAt: hoursFromNow(-1170),
        },
      }),
      db.tripMember.create({
        data: {
          tripId: barcelonaTrip.id,
          userId: users[4].id,
          role: 'member',
          rsvpStatus: 'accepted',
          joinedAt: hoursFromNow(-1160),
        },
      }),
    ]);

    console.log(`✅ Added trip members\n`);

    // ============================================================================
    // 4. CREATE ITINERARY ITEMS (Tokyo Trip - Detailed 7-day itinerary)
    // ============================================================================
    console.log('📅 Creating itinerary items...');

    const itineraryItems = await Promise.all([
      // Day 1
      db.itineraryItem.create({
        data: {
          tripId: tokyoTrip.id,
          dayNumber: 1,
          time: '10:00',
          name: 'Arrival at Narita Airport',
          description: 'Flight lands at NRT. Take Narita Express to Tokyo Station.',
          location: 'Narita International Airport',
          type: 'flight',
          pricePerPerson: 0,
          bookingStatus: 'booked',
          bookingUrl: 'https://example.com/flight',
          createdByUserId: users[0].id,
        },
      }),
      db.itineraryItem.create({
        data: {
          tripId: tokyoTrip.id,
          dayNumber: 1,
          time: '15:00',
          name: 'Check-in at Hotel Gracery Shinjuku',
          description: 'Godzilla-themed hotel in the heart of Shinjuku',
          location: '1 Chome-19-1 Kabukicho, Shinjuku City, Tokyo',
          type: 'hotel',
          pricePerPerson: 150,
          bookingStatus: 'booked',
          bookingUrl: 'https://example.com/hotel',
          createdByUserId: users[0].id,
        },
      }),
      db.itineraryItem.create({
        data: {
          tripId: tokyoTrip.id,
          dayNumber: 1,
          time: '19:00',
          name: 'Dinner at Ichiran Ramen',
          description: 'Famous solo dining ramen experience',
          location: 'Shinjuku, Tokyo',
          type: 'dining',
          pricePerPerson: 12,
          bookingStatus: 'not_started',
          createdByUserId: users[1].id,
        },
      }),
      // Day 2
      db.itineraryItem.create({
        data: {
          tripId: tokyoTrip.id,
          dayNumber: 2,
          time: '09:00',
          name: 'Visit Senso-ji Temple',
          description: "Tokyo's oldest temple in Asakusa",
          location: '2 Chome-3-1 Asakusa, Taito City, Tokyo',
          type: 'activity',
          pricePerPerson: 0,
          bookingStatus: 'not_started',
          createdByUserId: users[0].id,
        },
      }),
      db.itineraryItem.create({
        data: {
          tripId: tokyoTrip.id,
          dayNumber: 2,
          time: '14:00',
          name: 'TeamLab Borderless Digital Art Museum',
          description: 'Immersive digital art experience',
          location: 'Odaiba, Tokyo',
          type: 'activity',
          pricePerPerson: 35,
          bookingStatus: 'in_progress',
          bookingUrl: 'https://borderless.teamlab.art/',
          createdByUserId: users[2].id,
        },
      }),
      // Day 3
      db.itineraryItem.create({
        data: {
          tripId: tokyoTrip.id,
          dayNumber: 3,
          time: '08:00',
          name: 'Tsukiji Outer Market Food Tour',
          description: 'Fresh sushi breakfast and street food',
          location: 'Tsukiji Market, Tokyo',
          type: 'dining',
          pricePerPerson: 50,
          bookingStatus: 'not_started',
          createdByUserId: users[1].id,
        },
      }),
      db.itineraryItem.create({
        data: {
          tripId: tokyoTrip.id,
          dayNumber: 3,
          time: '13:00',
          name: 'Meiji Shrine & Yoyogi Park',
          description: 'Peaceful shrine and people watching',
          location: 'Shibuya City, Tokyo',
          type: 'activity',
          pricePerPerson: 0,
          bookingStatus: 'not_started',
          createdByUserId: users[0].id,
        },
      }),
      db.itineraryItem.create({
        data: {
          tripId: tokyoTrip.id,
          dayNumber: 3,
          time: '18:00',
          name: 'Shibuya Crossing Experience',
          description: 'Iconic scramble crossing + shopping',
          location: 'Shibuya, Tokyo',
          type: 'activity',
          pricePerPerson: 0,
          bookingStatus: 'not_started',
          createdByUserId: users[2].id,
        },
      }),
      // Day 4
      db.itineraryItem.create({
        data: {
          tripId: tokyoTrip.id,
          dayNumber: 4,
          time: 'Full Day',
          name: 'Day Trip to Mount Fuji & Hakone',
          description: 'Guided tour with ropeway and lake cruise',
          location: 'Mount Fuji, Hakone',
          type: 'activity',
          pricePerPerson: 120,
          bookingStatus: 'booked',
          bookingUrl: 'https://example.com/fuji-tour',
          createdByUserId: users[0].id,
        },
      }),
      // Day 5
      db.itineraryItem.create({
        data: {
          tripId: tokyoTrip.id,
          dayNumber: 5,
          time: '10:00',
          name: 'Akihabara Electric Town',
          description: 'Anime, manga, and electronics shopping',
          location: 'Akihabara, Tokyo',
          type: 'activity',
          pricePerPerson: 0,
          bookingStatus: 'not_started',
          createdByUserId: users[2].id,
        },
      }),
      db.itineraryItem.create({
        data: {
          tripId: tokyoTrip.id,
          dayNumber: 5,
          time: '19:00',
          name: 'Robot Restaurant Show',
          description: 'Wild robot performance and dinner',
          location: 'Shinjuku, Tokyo',
          type: 'activity',
          pricePerPerson: 80,
          bookingStatus: 'in_progress',
          createdByUserId: users[1].id,
        },
      }),
      // Day 6
      db.itineraryItem.create({
        data: {
          tripId: tokyoTrip.id,
          dayNumber: 6,
          time: '11:00',
          name: 'Harajuku Takeshita Street',
          description: 'Youth fashion and crepes',
          location: 'Harajuku, Tokyo',
          type: 'activity',
          pricePerPerson: 0,
          bookingStatus: 'not_started',
          createdByUserId: users[3].id,
        },
      }),
      db.itineraryItem.create({
        data: {
          tripId: tokyoTrip.id,
          dayNumber: 6,
          time: '20:00',
          name: 'Farewell Dinner at Gonpachi',
          description: 'Kill Bill restaurant with traditional ambiance',
          location: 'Nishi-Azabu, Tokyo',
          type: 'dining',
          pricePerPerson: 75,
          bookingStatus: 'not_started',
          createdByUserId: users[0].id,
        },
      }),
      // Day 7
      db.itineraryItem.create({
        data: {
          tripId: tokyoTrip.id,
          dayNumber: 7,
          time: '14:00',
          name: 'Departure from Narita',
          description: 'Return flight to home',
          location: 'Narita International Airport',
          type: 'flight',
          pricePerPerson: 0,
          bookingStatus: 'booked',
          bookingUrl: 'https://example.com/return-flight',
          createdByUserId: users[0].id,
        },
      }),
    ]);

    console.log(`✅ Created ${itineraryItems.length} itinerary items\n`);

    // ============================================================================
    // 5. CREATE VOTES ON ITINERARY ITEMS
    // ============================================================================
    console.log('👍 Creating votes on itinerary items...');

    const votes = await Promise.all([
      // TeamLab Museum votes
      db.vote.create({ data: { itemId: itineraryItems[4].id, userId: users[0].id, vote: 'up' } }),
      db.vote.create({ data: { itemId: itineraryItems[4].id, userId: users[1].id, vote: 'up' } }),
      db.vote.create({ data: { itemId: itineraryItems[4].id, userId: users[2].id, vote: 'up' } }),
      // Fuji tour votes
      db.vote.create({ data: { itemId: itineraryItems[8].id, userId: users[0].id, vote: 'up' } }),
      db.vote.create({ data: { itemId: itineraryItems[8].id, userId: users[1].id, vote: 'up' } }),
      db.vote.create({ data: { itemId: itineraryItems[8].id, userId: users[2].id, vote: 'down' } }),
      // Robot Restaurant votes
      db.vote.create({ data: { itemId: itineraryItems[10].id, userId: users[1].id, vote: 'up' } }),
      db.vote.create({ data: { itemId: itineraryItems[10].id, userId: users[2].id, vote: 'up' } }),
    ]);

    console.log(`✅ Created ${votes.length} votes\n`);

    // ============================================================================
    // 6. CREATE COMMENTS ON ITEMS
    // ============================================================================
    console.log('💬 Creating comments...');

    const comments = await Promise.all([
      db.comment.create({
        data: {
          itemId: itineraryItems[4].id,
          userId: users[1].id,
          content: 'This place looks amazing! I saw it on Instagram. Definitely a must-do!',
        },
      }),
      db.comment.create({
        data: {
          itemId: itineraryItems[4].id,
          userId: users[0].id,
          content: 'Agreed! Should we book tickets now? They sell out fast.',
        },
      }),
      db.comment.create({
        data: {
          itemId: itineraryItems[8].id,
          userId: users[2].id,
          content: "I'm worried about motion sickness on the bus ride. Maybe I'll skip this one?",
        },
      }),
      db.comment.create({
        data: {
          itemId: itineraryItems[10].id,
          userId: users[0].id,
          content: 'This might be too touristy. What if we do a traditional izakaya instead?',
        },
      }),
    ]);

    console.log(`✅ Created ${comments.length} comments\n`);

    // ============================================================================
    // 7. CREATE EXPENSES (Tokyo Trip)
    // ============================================================================
    console.log('💰 Creating expenses...');

    const expenses = await Promise.all([
      db.expense.create({
        data: {
          tripId: tokyoTrip.id,
          amount: 1200,
          currency: 'USD',
          description: 'Round-trip flights to Tokyo',
          location: 'Narita Airport',
          paidByUserId: users[0].id,
          itemId: itineraryItems[0].id,
          splitMemberIds: [users[0].id, users[1].id, users[2].id, users[3].id],
          receiptImageUrl: null,
        },
      }),
      db.expense.create({
        data: {
          tripId: tokyoTrip.id,
          amount: 900,
          currency: 'USD',
          description: 'Hotel Gracery Shinjuku (6 nights)',
          location: 'Shinjuku, Tokyo',
          paidByUserId: users[0].id,
          itemId: itineraryItems[1].id,
          splitMemberIds: [users[0].id, users[1].id, users[2].id, users[3].id],
          receiptImageUrl: null,
        },
      }),
      db.expense.create({
        data: {
          tripId: tokyoTrip.id,
          amount: 48,
          currency: 'USD',
          description: 'Dinner at Ichiran Ramen',
          location: 'Shinjuku, Tokyo',
          paidByUserId: users[1].id,
          itemId: itineraryItems[2].id,
          splitMemberIds: [users[0].id, users[1].id, users[2].id, users[3].id],
          receiptImageUrl: null,
        },
      }),
      db.expense.create({
        data: {
          tripId: tokyoTrip.id,
          amount: 140,
          currency: 'USD',
          description: 'TeamLab Borderless tickets',
          location: 'Odaiba, Tokyo',
          paidByUserId: users[2].id,
          itemId: itineraryItems[4].id,
          splitMemberIds: [users[0].id, users[1].id, users[2].id, users[3].id],
          receiptImageUrl: null,
        },
      }),
      db.expense.create({
        data: {
          tripId: tokyoTrip.id,
          amount: 200,
          currency: 'USD',
          description: 'Tsukiji Market food tour',
          location: 'Tsukiji, Tokyo',
          paidByUserId: users[0].id,
          splitMemberIds: [users[0].id, users[1].id, users[2].id, users[3].id],
          receiptImageUrl: null,
        },
      }),
      db.expense.create({
        data: {
          tripId: tokyoTrip.id,
          amount: 480,
          currency: 'USD',
          description: 'Mount Fuji day tour',
          location: 'Mount Fuji',
          paidByUserId: users[0].id,
          itemId: itineraryItems[8].id,
          splitMemberIds: [users[0].id, users[1].id, users[2].id, users[3].id],
          receiptImageUrl: null,
        },
      }),
      db.expense.create({
        data: {
          tripId: tokyoTrip.id,
          amount: 85,
          currency: 'USD',
          description: '7-day JR Pass',
          location: 'Tokyo',
          paidByUserId: users[1].id,
          splitMemberIds: [users[0].id, users[1].id, users[2].id],
          receiptImageUrl: null,
        },
      }),
    ]);

    console.log(`✅ Created ${expenses.length} expenses\n`);

    // ============================================================================
    // 8. CREATE PACKING LIST ITEMS (Modal Feature #1)
    // ============================================================================
    console.log('🎒 Creating packing list items...');

    const packingItems = await Promise.all([
      // Essentials
      db.packingItem.create({
        data: {
          tripId: tokyoTrip.id,
          name: 'Passport',
          category: 'essentials',
          packed: true,
          assignedToUserId: users[0].id,
          notes: 'Check expiry date',
        },
      }),
      db.packingItem.create({
        data: {
          tripId: tokyoTrip.id,
          name: 'Wallet & Credit Cards',
          category: 'essentials',
          packed: true,
          assignedToUserId: users[0].id,
        },
      }),
      db.packingItem.create({
        data: {
          tripId: tokyoTrip.id,
          name: 'Phone & Charger',
          category: 'electronics',
          packed: false,
          assignedToUserId: users[1].id,
        },
      }),
      // Clothing
      db.packingItem.create({
        data: {
          tripId: tokyoTrip.id,
          name: 'Comfortable Walking Shoes',
          category: 'clothing',
          packed: false,
          assignedToUserId: users[0].id,
          notes: "We'll walk 10+ miles per day",
        },
      }),
      db.packingItem.create({
        data: {
          tripId: tokyoTrip.id,
          name: 'Light Jacket',
          category: 'clothing',
          packed: false,
          assignedToUserId: users[1].id,
          notes: 'For evening chill',
        },
      }),
      db.packingItem.create({
        data: {
          tripId: tokyoTrip.id,
          name: 'Casual Outfits (7 days)',
          category: 'clothing',
          packed: false,
          assignedToUserId: users[2].id,
        },
      }),
      // Toiletries
      db.packingItem.create({
        data: {
          tripId: tokyoTrip.id,
          name: 'Travel-size Toiletries',
          category: 'toiletries',
          packed: true,
          assignedToUserId: users[0].id,
          notes: 'TSA approved sizes',
        },
      }),
      db.packingItem.create({
        data: {
          tripId: tokyoTrip.id,
          name: 'Sunscreen SPF 50',
          category: 'toiletries',
          packed: false,
          assignedToUserId: users[1].id,
        },
      }),
      // Electronics
      db.packingItem.create({
        data: {
          tripId: tokyoTrip.id,
          name: 'Camera',
          category: 'electronics',
          packed: false,
          assignedToUserId: users[2].id,
          notes: "Don't forget extra batteries",
        },
      }),
      db.packingItem.create({
        data: {
          tripId: tokyoTrip.id,
          name: 'Power Bank',
          category: 'electronics',
          packed: false,
          assignedToUserId: users[0].id,
        },
      }),
      db.packingItem.create({
        data: {
          tripId: tokyoTrip.id,
          name: 'Universal Adapter',
          category: 'electronics',
          packed: true,
          assignedToUserId: users[1].id,
          notes: 'Japan uses Type A plugs',
        },
      }),
      // Documents
      db.packingItem.create({
        data: {
          tripId: tokyoTrip.id,
          name: 'Printed Hotel Confirmations',
          category: 'documents',
          packed: false,
          assignedToUserId: users[0].id,
        },
      }),
      db.packingItem.create({
        data: {
          tripId: tokyoTrip.id,
          name: 'Travel Insurance Card',
          category: 'documents',
          packed: true,
          assignedToUserId: users[0].id,
        },
      }),
      // Medication
      db.packingItem.create({
        data: {
          tripId: tokyoTrip.id,
          name: 'Motion Sickness Pills',
          category: 'medication',
          packed: false,
          assignedToUserId: users[2].id,
          notes: 'For Mount Fuji bus ride',
        },
      }),
      db.packingItem.create({
        data: {
          tripId: tokyoTrip.id,
          name: 'First Aid Kit',
          category: 'medication',
          packed: false,
          assignedToUserId: users[0].id,
        },
      }),
      // Entertainment
      db.packingItem.create({
        data: {
          tripId: tokyoTrip.id,
          name: 'Kindle / Books',
          category: 'entertainment',
          packed: false,
          assignedToUserId: users[1].id,
          notes: 'For long flights',
        },
      }),
      db.packingItem.create({
        data: {
          tripId: tokyoTrip.id,
          name: 'Noise-canceling Headphones',
          category: 'entertainment',
          packed: true,
          assignedToUserId: users[2].id,
        },
      }),
      // Other
      db.packingItem.create({
        data: {
          tripId: tokyoTrip.id,
          name: 'Reusable Water Bottle',
          category: 'other',
          packed: false,
          assignedToUserId: users[0].id,
          notes: 'Stay hydrated!',
        },
      }),
      db.packingItem.create({
        data: {
          tripId: tokyoTrip.id,
          name: 'Small Backpack for Day Trips',
          category: 'other',
          packed: false,
          assignedToUserId: users[1].id,
        },
      }),
      db.packingItem.create({
        data: {
          tripId: tokyoTrip.id,
          name: 'Japanese Phrasebook',
          category: 'other',
          packed: false,
          notes: 'Basic phrases are helpful',
        },
      }),
    ]);

    console.log(`✅ Created ${packingItems.length} packing items\n`);

    // ============================================================================
    // 9. CREATE TRANSPORTATION ENTRIES (Modal Feature #2)
    // ============================================================================
    console.log('🚗 Creating transportation entries...');

    const transportEntries = await Promise.all([
      // Day 1
      db.transportationEntry.create({
        data: {
          tripId: tokyoTrip.id,
          dayNumber: 1,
          type: 'flight',
          description: 'International flight to Narita',
          notes: 'Departs 10:00 AM, arrives 2:00 PM next day (local time)',
        },
      }),
      db.transportationEntry.create({
        data: {
          tripId: tokyoTrip.id,
          dayNumber: 1,
          type: 'train',
          description: 'Narita Express to Tokyo Station',
          driverUserId: null,
          passengerUserIds: [users[0].id, users[1].id, users[2].id, users[3].id],
          notes: 'Takes ~60 minutes, ¥3,070 per person',
        },
      }),
      db.transportationEntry.create({
        data: {
          tripId: tokyoTrip.id,
          dayNumber: 1,
          type: 'train',
          description: 'Tokyo Station to Shinjuku Hotel',
          passengerUserIds: [users[0].id, users[1].id, users[2].id, users[3].id],
          notes: 'JR Chuo Line',
        },
      }),
      // Day 2
      db.transportationEntry.create({
        data: {
          tripId: tokyoTrip.id,
          dayNumber: 2,
          type: 'train',
          description: 'Shinjuku to Asakusa (Senso-ji Temple)',
          passengerUserIds: [users[0].id, users[1].id, users[2].id],
          notes: 'Ginza Line, ~35 minutes',
        },
      }),
      db.transportationEntry.create({
        data: {
          tripId: tokyoTrip.id,
          dayNumber: 2,
          type: 'train',
          description: 'Asakusa to Odaiba (TeamLab)',
          passengerUserIds: [users[0].id, users[1].id, users[2].id],
          notes: 'Transfer at Shimbashi',
        },
      }),
      // Day 4
      db.transportationEntry.create({
        data: {
          tripId: tokyoTrip.id,
          dayNumber: 4,
          type: 'rideshare',
          description: 'Hotel pickup for Mount Fuji tour',
          driverUserId: null,
          passengerUserIds: [users[0].id, users[1].id, users[3].id],
          notes: 'Tour bus departs at 7:00 AM sharp',
        },
      }),
      // Day 5
      db.transportationEntry.create({
        data: {
          tripId: tokyoTrip.id,
          dayNumber: 5,
          type: 'train',
          description: 'Shinjuku to Akihabara',
          passengerUserIds: [users[0].id, users[2].id],
          notes: 'JR Yamanote Line',
        },
      }),
      // Day 7
      db.transportationEntry.create({
        data: {
          tripId: tokyoTrip.id,
          dayNumber: 7,
          type: 'pickup',
          description: 'Hotel to Narita Airport',
          driverUserId: null,
          passengerUserIds: [users[0].id, users[1].id, users[2].id, users[3].id],
          notes: 'Limousine bus - book in advance',
        },
      }),
    ]);

    console.log(`✅ Created ${transportEntries.length} transportation entries\n`);

    // ============================================================================
    // 10. CREATE TRIP DOCUMENTS (Modal Feature #3)
    // ============================================================================
    console.log('📄 Creating trip documents...');

    const documents = await Promise.all([
      db.tripDocument.create({
        data: {
          tripId: tokyoTrip.id,
          type: 'boarding_pass',
          name: 'United Airlines Boarding Pass - Outbound',
          url: 'https://placehold.co/600x400/png?text=Boarding+Pass',
          notes: 'Gate closes 30 min before departure',
          expiryDate: daysFromNow(30),
          uploadedByUserId: users[0].id,
        },
      }),
      db.tripDocument.create({
        data: {
          tripId: tokyoTrip.id,
          type: 'boarding_pass',
          name: 'United Airlines Boarding Pass - Return',
          url: 'https://placehold.co/600x400/png?text=Return+Flight',
          notes: 'Check in 24 hours before',
          expiryDate: daysFromNow(37),
          uploadedByUserId: users[0].id,
        },
      }),
      db.tripDocument.create({
        data: {
          tripId: tokyoTrip.id,
          type: 'hotel_confirmation',
          name: 'Hotel Gracery Shinjuku Reservation',
          url: 'https://placehold.co/600x400/png?text=Hotel+Confirmation',
          notes: 'Confirmation #HGS12345. Check-in after 3 PM',
          uploadedByUserId: users[0].id,
        },
      }),
      db.tripDocument.create({
        data: {
          tripId: tokyoTrip.id,
          type: 'insurance',
          name: 'Travel Insurance Policy - World Nomads',
          url: 'https://placehold.co/600x400/png?text=Insurance+Policy',
          notes: 'Policy covers medical, cancellation, and luggage',
          expiryDate: daysFromNow(37),
          uploadedByUserId: users[0].id,
        },
      }),
      db.tripDocument.create({
        data: {
          tripId: tokyoTrip.id,
          type: 'vaccination',
          name: 'COVID-19 Vaccination Card',
          url: 'https://placehold.co/600x400/png?text=Vaccination+Card',
          notes: 'Keep both physical and digital copy',
          uploadedByUserId: users[1].id,
        },
      }),
      db.tripDocument.create({
        data: {
          tripId: tokyoTrip.id,
          type: 'rental',
          name: 'Pocket WiFi Rental Confirmation',
          url: 'https://placehold.co/600x400/png?text=WiFi+Rental',
          notes: 'Pick up at airport. Return before departure',
          uploadedByUserId: users[0].id,
        },
      }),
      db.tripDocument.create({
        data: {
          tripId: tokyoTrip.id,
          type: 'other',
          name: 'Mount Fuji Tour Voucher',
          url: 'https://placehold.co/600x400/png?text=Tour+Voucher',
          notes: 'Present at hotel lobby for pickup',
          expiryDate: daysFromNow(34),
          uploadedByUserId: users[0].id,
        },
      }),
      db.tripDocument.create({
        data: {
          tripId: tokyoTrip.id,
          type: 'visa',
          name: 'Japan Entry Requirements',
          url: 'https://placehold.co/600x400/png?text=Visa+Info',
          notes: 'US citizens get 90-day visa waiver',
          uploadedByUserId: users[0].id,
        },
      }),
    ]);

    console.log(`✅ Created ${documents.length} trip documents\n`);

    // ============================================================================
    // 11. CREATE POLLS (Modal Feature #4)
    // ============================================================================
    console.log('📊 Creating group polls...');

    const polls = await Promise.all([
      // Active poll 1
      db.poll.create({
        data: {
          tripId: tokyoTrip.id,
          question: 'What time should we meet for breakfast on Day 2?',
          options: ['7:00 AM (early birds)', '8:30 AM (moderate)', '10:00 AM (sleep in)'],
          deadline: daysFromNow(20),
          status: 'open',
          voteCounts: [1, 2, 1],
          createdByUserId: users[0].id,
        },
      }),
      // Active poll 2
      db.poll.create({
        data: {
          tripId: tokyoTrip.id,
          question: 'Where should we have our farewell dinner?',
          options: [
            'Gonpachi (Kill Bill restaurant)',
            'Tsukiji Fish Market',
            'Robot Restaurant',
            'Traditional Kaiseki',
          ],
          deadline: daysFromNow(25),
          status: 'open',
          voteCounts: [3, 1, 0, 2],
          createdByUserId: users[1].id,
        },
      }),
      // Active poll 3
      db.poll.create({
        data: {
          tripId: tokyoTrip.id,
          question: 'Should we buy JR Passes or pay as we go?',
          options: ['Buy JR Pass (unlimited trains)', 'Pay per ride (more flexibility)'],
          deadline: daysFromNow(10),
          status: 'open',
          voteCounts: [3, 0],
          createdByUserId: users[0].id,
        },
      }),
      // Closed poll
      db.poll.create({
        data: {
          tripId: tokyoTrip.id,
          question: 'Which day should we do the Mount Fuji tour?',
          options: ['Day 3', 'Day 4', 'Day 5'],
          deadline: daysFromNow(-5),
          status: 'closed',
          voteCounts: [0, 4, 0],
          createdByUserId: users[0].id,
        },
      }),
    ]);

    console.log(`✅ Created ${polls.length} polls\n`);

    // ============================================================================
    // 12. CREATE GROUP AVAILABILITY (Modal Feature #5)
    // ============================================================================
    console.log('📅 Creating group availability...');

    const availability = await Promise.all([
      db.groupAvailability.create({
        data: {
          tripId: tokyoTrip.id,
          userId: users[0].id,
          availableDates: [
            daysFromNow(30),
            daysFromNow(31),
            daysFromNow(32),
            daysFromNow(33),
            daysFromNow(34),
            daysFromNow(35),
            daysFromNow(36),
            daysFromNow(37),
          ],
        },
      }),
      db.groupAvailability.create({
        data: {
          tripId: tokyoTrip.id,
          userId: users[1].id,
          availableDates: [
            daysFromNow(30),
            daysFromNow(31),
            daysFromNow(32),
            daysFromNow(33),
            daysFromNow(34),
            daysFromNow(35),
            daysFromNow(36),
            daysFromNow(37),
          ],
        },
      }),
      db.groupAvailability.create({
        data: {
          tripId: tokyoTrip.id,
          userId: users[2].id,
          availableDates: [
            daysFromNow(30),
            daysFromNow(31),
            daysFromNow(32),
            daysFromNow(33),
            daysFromNow(34),
            daysFromNow(35),
          ],
        },
      }),
      db.groupAvailability.create({
        data: {
          tripId: tokyoTrip.id,
          userId: users[3].id,
          availableDates: [
            daysFromNow(31),
            daysFromNow(32),
            daysFromNow(33),
            daysFromNow(34),
            daysFromNow(35),
            daysFromNow(36),
            daysFromNow(37),
          ],
        },
      }),
    ]);

    console.log(`✅ Created ${availability.length} availability entries\n`);

    // ============================================================================
    // 13. CREATE TRIP PHOTOS (Modal Feature #6)
    // ============================================================================
    console.log('📸 Creating trip photos...');

    const photos = await Promise.all([
      // Barcelona trip photos (completed trip)
      db.tripPhoto.create({
        data: {
          tripId: barcelonaTrip.id,
          userId: users[0].id,
          url: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
          caption: 'Sagrada Familia at sunset - absolutely breathtaking!',
        },
      }),
      db.tripPhoto.create({
        data: {
          tripId: barcelonaTrip.id,
          userId: users[1].id,
          url: 'https://images.unsplash.com/photo-1564221710304-0b37c8b9d729?w=800',
          caption: 'Fresh seafood paella at Barceloneta Beach 🦐',
        },
      }),
      db.tripPhoto.create({
        data: {
          tripId: barcelonaTrip.id,
          userId: users[2].id,
          url: 'https://images.unsplash.com/photo-1511527661048-7fe73d85e9a4?w=800',
          caption: 'Park Güell mosaic tiles - Gaudí was a genius',
        },
      }),
      db.tripPhoto.create({
        data: {
          tripId: barcelonaTrip.id,
          userId: users[3].id,
          url: 'https://images.unsplash.com/photo-1562883676-8c7feb83f09b?w=800',
          caption: 'Gothic Quarter at night',
        },
      }),
      db.tripPhoto.create({
        data: {
          tripId: barcelonaTrip.id,
          userId: users[0].id,
          url: 'https://images.unsplash.com/photo-1558642084-fd07fae5282e?w=800',
          caption: 'Group photo at La Rambla!',
        },
      }),
      // Paris trip photos (active trip)
      db.tripPhoto.create({
        data: {
          tripId: parisTrip.id,
          userId: users[1].id,
          url: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800',
          caption: 'Eiffel Tower sparkling at night ✨',
        },
      }),
      db.tripPhoto.create({
        data: {
          tripId: parisTrip.id,
          userId: users[3].id,
          url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
          caption: 'Croissants and coffee at a corner café',
        },
      }),
      db.tripPhoto.create({
        data: {
          tripId: parisTrip.id,
          userId: users[1].id,
          url: 'https://images.unsplash.com/photo-1550340499-a6c60fc8287c?w=800',
          caption: 'Louvre Museum - so much to see!',
        },
      }),
    ]);

    console.log(`✅ Created ${photos.length} trip photos\n`);

    // ============================================================================
    // 14. CREATE EMERGENCY CONTACTS
    // ============================================================================
    console.log('🆘 Creating emergency contacts...');

    const emergencyContacts = await Promise.all([
      db.emergencyContact.create({
        data: {
          tripId: tokyoTrip.id,
          type: 'embassy',
          name: 'US Embassy Tokyo',
          phone: '+81-3-3224-5000',
          url: 'https://jp.usembassy.gov/',
          notes: '24/7 emergency services for US citizens',
        },
      }),
      db.emergencyContact.create({
        data: {
          tripId: tokyoTrip.id,
          type: 'medical',
          name: 'Tokyo Medical & Surgical Clinic',
          phone: '+81-3-3436-3028',
          url: 'https://www.tmsc.jp/',
          notes: 'English-speaking doctors',
        },
      }),
      db.emergencyContact.create({
        data: {
          tripId: tokyoTrip.id,
          type: 'police',
          name: 'Tokyo Metropolitan Police',
          phone: '110',
          notes: 'Emergency police number in Japan',
        },
      }),
      db.emergencyContact.create({
        data: {
          tripId: tokyoTrip.id,
          type: 'other',
          name: 'Hotel Front Desk - Gracery Shinjuku',
          phone: '+81-3-6833-1111',
          notes: 'Call for any hotel-related issues',
        },
      }),
    ]);

    console.log(`✅ Created ${emergencyContacts.length} emergency contacts\n`);

    // ============================================================================
    // 15. CREATE CHAT MESSAGES
    // ============================================================================
    console.log('💬 Creating chat messages...');

    const chatMessages = await Promise.all([
      db.chatMessage.create({
        data: {
          tripId: tokyoTrip.id,
          userId: users[0].id,
          content:
            "Hey everyone! So excited for this trip. Let's finalize the itinerary this week!",
        },
      }),
      db.chatMessage.create({
        data: {
          tripId: tokyoTrip.id,
          userId: users[1].id,
          content: "@Alice Anderson I booked the TeamLab tickets! We're all set for Day 2.",
        },
      }),
      db.chatMessage.create({
        data: {
          tripId: tokyoTrip.id,
          userId: users[2].id,
          content:
            'Quick question - does anyone know if we need cash for the temples? Or do they take cards?',
        },
      }),
      db.chatMessage.create({
        data: {
          tripId: tokyoTrip.id,
          userId: users[0].id,
          content: 'Most temples only take cash. We should hit an ATM when we land.',
        },
      }),
      db.chatMessage.create({
        data: {
          tripId: tokyoTrip.id,
          userId: users[3].id,
          content: "I'm bringing my DSLR! Can't wait to photograph everything 📸",
        },
      }),
      db.chatMessage.create({
        data: {
          tripId: tokyoTrip.id,
          userId: users[1].id,
          content: 'Should we create a shared Google Photos album for all our pics?',
        },
      }),
    ]);

    console.log(`✅ Created ${chatMessages.length} chat messages\n`);

    // ============================================================================
    // 16. CREATE USER PREFERENCES
    // ============================================================================
    console.log('⚙️ Creating user preferences...');

    const preferences = await Promise.all([
      db.userPreference.create({
        data: {
          tripId: tokyoTrip.id,
          userId: users[0].id,
          budgetBand: 'mid',
          pace: 'moderate',
          diet: 'vegetarian',
          budgetFlexibility: 'somewhat',
          mustDoActivities: 'Temples, traditional food, Mount Fuji',
          accessibility: 'Can walk long distances',
        },
      }),
      db.userPreference.create({
        data: {
          tripId: tokyoTrip.id,
          userId: users[1].id,
          budgetBand: 'luxury',
          pace: 'relaxed',
          diet: 'pescatarian',
          budgetFlexibility: 'flexible',
          mustDoActivities: 'TeamLab, sushi, shopping',
          accessibility: 'No restrictions',
        },
      }),
      db.userPreference.create({
        data: {
          tripId: tokyoTrip.id,
          userId: users[2].id,
          budgetBand: 'budget',
          pace: 'packed',
          diet: 'none',
          budgetFlexibility: 'strict',
          mustDoActivities: 'Anime shops, arcades, street food',
          accessibility: 'Prefer activities with seating options',
        },
      }),
    ]);

    console.log(`✅ Created ${preferences.length} user preferences\n`);

    // ============================================================================
    // 17. CREATE MOOD BOARD ITEMS
    // ============================================================================
    console.log('🎨 Creating mood board items...');

    const moodBoard = await Promise.all([
      db.moodBoardItem.create({
        data: {
          tripId: tokyoTrip.id,
          url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400',
          label: 'Tokyo Street Vibes',
          addedByUserId: users[0].id,
        },
      }),
      db.moodBoardItem.create({
        data: {
          tripId: tokyoTrip.id,
          url: 'https://images.unsplash.com/photo-1542931287-023b922fa89b?w=400',
          label: 'Traditional Ramen',
          addedByUserId: users[1].id,
        },
      }),
      db.moodBoardItem.create({
        data: {
          tripId: tokyoTrip.id,
          url: 'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=400',
          label: 'Cherry Blossoms',
          addedByUserId: users[2].id,
        },
      }),
      db.moodBoardItem.create({
        data: {
          tripId: tokyoTrip.id,
          url: 'https://images.unsplash.com/photo-1492571350019-22de08371fd3?w=400',
          label: 'Mount Fuji',
          addedByUserId: users[0].id,
        },
      }),
    ]);

    console.log(`✅ Created ${moodBoard.length} mood board items\n`);

    // ============================================================================
    // 18. CREATE SATISFACTION RATINGS (for Barcelona - completed trip)
    // ============================================================================
    console.log('⭐ Creating satisfaction ratings...');

    const satisfaction = await Promise.all([
      db.satisfactionRating.create({
        data: {
          tripId: barcelonaTrip.id,
          userId: users[0].id,
          rating: 5,
          feedback:
            'Best trip ever! Everything was perfect. The group was amazing and Barcelona exceeded expectations.',
        },
      }),
      db.satisfactionRating.create({
        data: {
          tripId: barcelonaTrip.id,
          userId: users[1].id,
          rating: 5,
          feedback:
            "Loved every moment! The food, the beaches, the architecture. Can't wait for the next trip!",
        },
      }),
      db.satisfactionRating.create({
        data: {
          tripId: barcelonaTrip.id,
          userId: users[2].id,
          rating: 4,
          feedback: 'Great trip overall. Only wish we had more time at the beach!',
        },
      }),
      db.satisfactionRating.create({
        data: {
          tripId: barcelonaTrip.id,
          userId: users[3].id,
          rating: 5,
          feedback: '10/10 would do again. Already missing the tapas and sangria!',
        },
      }),
    ]);

    console.log(`✅ Created ${satisfaction.length} satisfaction ratings\n`);

    // ============================================================================
    // 19. CREATE INVITES
    // ============================================================================
    console.log('✉️ Creating trip invites...');

    const invites = await Promise.all([
      db.tripInvite.create({
        data: {
          tripId: tokyoTrip.id,
          email: 'frank@example.com',
          invitedByUserId: users[0].id,
          status: 'pending',
        },
      }),
      db.tripInvite.create({
        data: {
          tripId: parisTrip.id,
          email: 'grace@example.com',
          invitedByUserId: users[1].id,
          status: 'pending',
        },
      }),
    ]);

    console.log(`✅ Created ${invites.length} trip invites\n`);

    // ============================================================================
    // SUMMARY
    // ============================================================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST DATA SEED COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60) + '\n');

    console.log('📊 Summary of Created Test Data:\n');
    console.log(`  👥 Users: ${users.length}`);
    console.log(`  🌍 Trips: 3 (Upcoming, Active, Completed)`);
    console.log(`  📅 Itinerary Items: ${itineraryItems.length}`);
    console.log(`  👍 Votes: ${votes.length}`);
    console.log(`  💬 Comments: ${comments.length}`);
    console.log(`  💰 Expenses: ${expenses.length}`);
    console.log(`  🎒 Packing Items: ${packingItems.length}`);
    console.log(`  🚗 Transportation Entries: ${transportEntries.length}`);
    console.log(`  📄 Documents: ${documents.length}`);
    console.log(`  📊 Polls: ${polls.length}`);
    console.log(`  📅 Availability Entries: ${availability.length}`);
    console.log(`  📸 Photos: ${photos.length}`);
    console.log(`  🆘 Emergency Contacts: ${emergencyContacts.length}`);
    console.log(`  💬 Chat Messages: ${chatMessages.length}`);
    console.log(`  ⚙️ User Preferences: ${preferences.length}`);
    console.log(`  🎨 Mood Board Items: ${moodBoard.length}`);
    console.log(`  ⭐ Satisfaction Ratings: ${satisfaction.length}`);
    console.log(`  ✉️ Trip Invites: ${invites.length}\n`);

    console.log('🔑 Test User Credentials:\n');
    users.forEach((user: any) => {
      console.log(`  📧 ${user.email}`);
      console.log(`     Password: password123`);
      console.log(`     Name: ${user.name}`);
      console.log(`     Tier: ${user.subscriptionTier}\n`);
    });

    console.log('🎯 Test Trips Created:\n');
    console.log(`  1. ${tokyoTrip.name} (${tokyoTrip.status})`);
    console.log(`     ${tokyoTrip.destination} • ${tokyoTrip.groupSize} people`);
    console.log(`     ${tokyoTrip.startDate} to ${tokyoTrip.endDate}\n`);

    console.log(`  2. ${parisTrip.name} (${parisTrip.status})`);
    console.log(`     ${parisTrip.destination} • ${parisTrip.groupSize} people`);
    console.log(`     ${parisTrip.startDate} to ${parisTrip.endDate}\n`);

    console.log(`  3. ${barcelonaTrip.name} (${barcelonaTrip.status})`);
    console.log(`     ${barcelonaTrip.destination} • ${barcelonaTrip.groupSize} people`);
    console.log(`     ${barcelonaTrip.startDate} to ${barcelonaTrip.endDate}\n`);
  } catch (error) {
    console.error('\n❌ ERROR during seed:', error);
    throw error;
  }
}

// Run the seed
seedTestData()
  .catch(console.error)
  .finally(() => process.exit());
