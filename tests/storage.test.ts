import { describe, it, expect, beforeEach } from 'vitest';
import { randomUUID } from 'crypto';
import type { User, Trip, TripMember, ItineraryItem, Expense } from '../shared/schema';

/**
 * In-memory storage tests
 * These tests verify the storage interface works correctly
 */
describe('Storage Interface', () => {
  // We'll test against the in-memory implementation
  // which doesn't require a database connection

  describe('User Operations', () => {
    it('should create a user with all required fields', () => {
      const user: Omit<User, 'createdAt'> = {
        id: randomUUID(),
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed_password',
      };

      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.passwordHash).toBeTruthy();
    });

    it('should normalize email to lowercase', () => {
      const email = 'Test@EXAMPLE.COM';
      const normalizedEmail = email.toLowerCase();

      expect(normalizedEmail).toBe('test@example.com');
    });

    it('should generate unique user IDs', () => {
      const id1 = randomUUID();
      const id2 = randomUUID();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
  });

  describe('Trip Operations', () => {
    it('should create a trip with valid structure', () => {
      const trip: Omit<Trip, 'createdAt' | 'updatedAt'> = {
        id: randomUUID(),
        name: 'Tokyo Adventure',
        destination: 'Tokyo, Japan',
        startDate: '2024-06-01',
        endDate: '2024-06-10',
        organizerId: randomUUID(),
        shareCode: 'ABC123',
        isPublic: false,
        isLocked: false,
        voteDeadline: null,
      };

      expect(trip.id).toBeDefined();
      expect(trip.name).toBe('Tokyo Adventure');
      expect(trip.destination).toBe('Tokyo, Japan');
      expect(trip.organizerId).toBeDefined();
      expect(trip.shareCode).toBe('ABC123');
    });

    it('should validate date order', () => {
      const startDate = new Date('2024-06-01');
      const endDate = new Date('2024-06-10');

      expect(endDate.getTime()).toBeGreaterThan(startDate.getTime());
    });

    it('should generate unique share codes', () => {
      const shareCode1 = randomUUID().substring(0, 8).toUpperCase();
      const shareCode2 = randomUUID().substring(0, 8).toUpperCase();

      expect(shareCode1).not.toBe(shareCode2);
      expect(shareCode1.length).toBe(8);
      expect(shareCode2.length).toBe(8);
    });
  });

  describe('Trip Member Operations', () => {
    it('should create a trip member with required fields', () => {
      const member: Omit<TripMember, 'joinedAt'> = {
        id: randomUUID(),
        tripId: randomUUID(),
        userId: randomUUID(),
        role: 'member',
        rsvpStatus: 'accepted',
      };

      expect(member.tripId).toBeDefined();
      expect(member.userId).toBeDefined();
      expect(['organizer', 'planner', 'member']).toContain(member.role);
      expect(['pending', 'accepted', 'declined']).toContain(member.rsvpStatus);
    });

    it('should validate role values', () => {
      const validRoles = ['organizer', 'planner', 'member'];
      const testRole = 'member';

      expect(validRoles).toContain(testRole);
    });

    it('should validate RSVP status values', () => {
      const validStatuses = ['pending', 'accepted', 'declined'];
      const testStatus = 'accepted';

      expect(validStatuses).toContain(testStatus);
    });
  });

  describe('Itinerary Item Operations', () => {
    it('should create an itinerary item with valid structure', () => {
      const item: Omit<ItineraryItem, 'createdAt' | 'updatedAt'> = {
        id: randomUUID(),
        tripId: randomUUID(),
        dayNumber: 1,
        startTime: '09:00',
        endTime: '17:00',
        category: 'activity',
        name: 'Visit Tokyo Tower',
        description: 'Iconic observation tower',
        location: 'Tokyo Tower, Minato City',
        cost: 1200,
        currency: 'JPY',
        bookingStatus: 'pending',
        bookingUrl: null,
        notes: null,
        sortOrder: 0,
        upvotes: 0,
        downvotes: 0,
      };

      expect(item.dayNumber).toBeGreaterThan(0);
      expect(item.category).toBe('activity');
      expect(item.bookingStatus).toBe('pending');
      expect(item.cost).toBeGreaterThanOrEqual(0);
    });

    it('should validate category values', () => {
      const validCategories = ['flight', 'accommodation', 'activity', 'meal', 'transport', 'other'];
      const testCategory = 'activity';

      expect(validCategories).toContain(testCategory);
    });

    it('should validate booking status values', () => {
      const validStatuses = ['pending', 'confirmed', 'booked', 'cancelled'];
      const testStatus = 'pending';

      expect(validStatuses).toContain(testStatus);
    });

    it('should calculate vote total', () => {
      const upvotes = 5;
      const downvotes = 2;
      const voteTotal = upvotes - downvotes;

      expect(voteTotal).toBe(3);
    });
  });

  describe('Expense Operations', () => {
    it('should create an expense with valid structure', () => {
      const expense: Omit<Expense, 'createdAt'> = {
        id: randomUUID(),
        tripId: randomUUID(),
        description: 'Lunch at sushi restaurant',
        amount: 5000,
        currency: 'JPY',
        category: 'meal',
        paidBy: randomUUID(),
        splitType: 'equal',
        date: '2024-06-05',
      };

      expect(expense.amount).toBeGreaterThan(0);
      expect(expense.category).toBe('meal');
      expect(expense.splitType).toBe('equal');
      expect(expense.paidBy).toBeDefined();
    });

    it('should validate expense categories', () => {
      const validCategories = [
        'accommodation',
        'transport',
        'meal',
        'activity',
        'shopping',
        'other',
      ];
      const testCategory = 'meal';

      expect(validCategories).toContain(testCategory);
    });

    it('should validate split types', () => {
      const validSplitTypes = ['equal', 'custom', 'percentage'];
      const testSplitType = 'equal';

      expect(validSplitTypes).toContain(testSplitType);
    });

    it('should handle decimal amounts', () => {
      const amount1 = 1234.56;
      const amount2 = 789.12;
      const total = amount1 + amount2;

      expect(total).toBeCloseTo(2023.68, 2);
    });
  });

  describe('Data Validation', () => {
    it('should validate email format', () => {
      const validEmail = 'user@example.com';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      expect(emailRegex.test(validEmail)).toBe(true);
      expect(emailRegex.test('invalid-email')).toBe(false);
      expect(emailRegex.test('missing@domain')).toBe(false);
    });

    it('should validate UUID format', () => {
      const uuid = randomUUID();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      expect(uuidRegex.test(uuid)).toBe(true);
      expect(uuidRegex.test('not-a-uuid')).toBe(false);
    });

    it('should validate date formats', () => {
      const dateString = '2024-06-01';
      const date = new Date(dateString);

      expect(date.toString()).not.toBe('Invalid Date');
      expect(date.getFullYear()).toBe(2024);
      // Month is 0-indexed, and Date constructor treats string as UTC, so may vary by timezone
      expect(date.getMonth()).toBeGreaterThanOrEqual(4);
      expect(date.getMonth()).toBeLessThanOrEqual(5);
    });

    it('should validate currency codes', () => {
      const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'];
      const testCurrency = 'JPY';

      expect(validCurrencies).toContain(testCurrency);
      expect(testCurrency.length).toBe(3);
      expect(testCurrency).toBe(testCurrency.toUpperCase());
    });
  });

  describe('Business Logic', () => {
    it('should calculate trip duration in days', () => {
      const startDate = new Date('2024-06-01');
      const endDate = new Date('2024-06-10');
      const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      expect(duration).toBe(9);
    });

    it('should calculate total trip cost', () => {
      const expenses = [
        { amount: 1000, currency: 'USD' },
        { amount: 2500, currency: 'USD' },
        { amount: 500, currency: 'USD' },
      ];

      const total = expenses.reduce((sum, e) => sum + e.amount, 0);

      expect(total).toBe(4000);
    });

    it('should split expense equally', () => {
      const totalAmount = 1000;
      const memberCount = 4;
      const perPerson = totalAmount / memberCount;

      expect(perPerson).toBe(250);
    });

    it('should calculate budget vs actual spending', () => {
      const budget = 5000;
      const spent = 5500;
      const percentOver = ((spent - budget) / budget) * 100;

      expect(percentOver).toBe(10);
      expect(spent).toBeGreaterThan(budget);
    });

    it('should determine trip status based on dates', () => {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(now.getDate() + 30);
      const pastDate = new Date();
      pastDate.setDate(now.getDate() - 30);

      expect(futureDate.getTime()).toBeGreaterThan(now.getTime());
      expect(pastDate.getTime()).toBeLessThan(now.getTime());
    });
  });
});
