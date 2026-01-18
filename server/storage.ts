import {
  type User,
  type InsertUser,
  type Trip,
  type InsertTrip,
  type TripMember,
  type InsertTripMember,
  type ItineraryItem,
  type InsertItineraryItem,
  type Comment,
  type InsertComment,
  type Vote,
  type InsertVote,
  type Expense,
  type InsertExpense,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Trips
  getTrip(id: string): Promise<Trip | undefined>;
  getTripByShareCode(code: string): Promise<Trip | undefined>;
  getTripsByUserId(userId: string): Promise<Trip[]>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTrip(id: string, updates: Partial<Trip>): Promise<Trip | undefined>;

  // Trip Members
  getTripMembers(tripId: string): Promise<(TripMember & { user: User })[]>;
  addTripMember(member: InsertTripMember): Promise<TripMember>;
  isTripMember(tripId: string, userId: string): Promise<boolean>;

  // Itinerary Items
  getItineraryItems(tripId: string): Promise<ItineraryItem[]>;
  createItineraryItem(item: InsertItineraryItem): Promise<ItineraryItem>;
  updateItineraryItem(id: string, updates: Partial<ItineraryItem>): Promise<ItineraryItem | undefined>;

  // Comments
  getCommentsByItem(itemId: string): Promise<Comment[]>;
  getCommentsByTrip(tripId: string): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;

  // Votes
  getVotesByItem(itemId: string): Promise<Vote[]>;
  getVotesByTrip(tripId: string): Promise<Vote[]>;
  createOrUpdateVote(vote: InsertVote): Promise<Vote>;

  // Expenses
  getExpensesByTrip(tripId: string): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, updates: Partial<Expense>): Promise<Expense | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private trips: Map<string, Trip> = new Map();
  private tripMembers: Map<string, TripMember> = new Map();
  private itineraryItems: Map<string, ItineraryItem> = new Map();
  private comments: Map<string, Comment> = new Map();
  private votes: Map<string, Vote> = new Map();
  private expenses: Map<string, Expense> = new Map();

  constructor() {
    this.seedDemoData();
  }

  private seedDemoData() {
    // Create demo user
    const demoUser: User = {
      id: "demo-user-1",
      email: "demo@tripsync.com",
      name: "Demo User",
      createdAt: new Date(),
    };
    this.users.set(demoUser.id, demoUser);

    // Miami Bachelorette Party
    const miamiTrip: Trip = {
      id: "trip-miami-1",
      organizerId: demoUser.id,
      destination: "Miami, FL",
      startDate: "2026-05-15",
      endDate: "2026-05-18",
      budgetPerPerson: 1500,
      groupSize: 6,
      vibes: ["nightlife", "relaxing"],
      accommodationPref: "hotel",
      diningPref: "mix",
      status: "planning",
      isLocked: false,
      shareCode: "MIAMI2026",
      createdAt: new Date(),
    };
    this.trips.set(miamiTrip.id, miamiTrip);

    // Add organizer as member
    const miamiMember: TripMember = {
      id: randomUUID(),
      tripId: miamiTrip.id,
      userId: demoUser.id,
      role: "organizer",
      joinedAt: new Date(),
    };
    this.tripMembers.set(miamiMember.id, miamiMember);

    // Miami itinerary items
    const miamiItems: InsertItineraryItem[] = [
      {
        id: randomUUID(),
        tripId: miamiTrip.id,
        dayNumber: 1,
        type: "flight",
        time: "08:00",
        name: "Flight to Miami",
        description: "Direct flight from your home city to Miami International Airport",
        location: "Miami International Airport",
        pricePerPerson: 250,
        bookingUrlHint: "Google Flights",
      },
      {
        id: randomUUID(),
        tripId: miamiTrip.id,
        dayNumber: 1,
        type: "hotel",
        time: "14:00",
        name: "Check-in at Fontainebleau Miami Beach",
        description: "Iconic beachfront resort with stunning ocean views, pools, and spa",
        location: "4441 Collins Ave, Miami Beach",
        pricePerPerson: 200,
        bookingUrlHint: "Booking.com",
      },
      {
        id: randomUUID(),
        tripId: miamiTrip.id,
        dayNumber: 1,
        type: "dining",
        time: "19:00",
        name: "Dinner at Juvia",
        description: "Rooftop restaurant with stunning views, French-Japanese-Peruvian fusion",
        location: "1111 Lincoln Rd, Miami Beach",
        pricePerPerson: 85,
        bookingUrlHint: "OpenTable",
      },
      {
        id: randomUUID(),
        tripId: miamiTrip.id,
        dayNumber: 1,
        type: "activity",
        time: "22:00",
        name: "LIV Nightclub",
        description: "World-famous nightclub at Fontainebleau, premier nightlife experience",
        location: "Fontainebleau Miami Beach",
        pricePerPerson: 100,
        bookingUrlHint: "LIV Miami website",
      },
      {
        id: randomUUID(),
        tripId: miamiTrip.id,
        dayNumber: 2,
        type: "activity",
        time: "10:00",
        name: "Pool Day & Cabana",
        description: "Relax by the pool with a reserved cabana and bottle service",
        location: "Fontainebleau Pool",
        pricePerPerson: 75,
        bookingUrlHint: "Hotel concierge",
      },
      {
        id: randomUUID(),
        tripId: miamiTrip.id,
        dayNumber: 2,
        type: "dining",
        time: "13:00",
        name: "Brunch at Nikki Beach",
        description: "Famous beach club brunch with DJ and champagne",
        location: "1 Ocean Dr, Miami Beach",
        pricePerPerson: 95,
        bookingUrlHint: "Nikki Beach website",
      },
      {
        id: randomUUID(),
        tripId: miamiTrip.id,
        dayNumber: 2,
        type: "activity",
        time: "16:00",
        name: "Spa Treatment",
        description: "Group spa day with massages and facials",
        location: "Lapis Spa at Fontainebleau",
        pricePerPerson: 150,
        bookingUrlHint: "Hotel spa",
      },
      {
        id: randomUUID(),
        tripId: miamiTrip.id,
        dayNumber: 2,
        type: "dining",
        time: "20:00",
        name: "Dinner at Komodo",
        description: "Celebrity hotspot with Asian-inspired cuisine",
        location: "801 Brickell Ave, Miami",
        pricePerPerson: 110,
        bookingUrlHint: "OpenTable",
      },
      {
        id: randomUUID(),
        tripId: miamiTrip.id,
        dayNumber: 3,
        type: "activity",
        time: "11:00",
        name: "Yacht Charter",
        description: "Private yacht cruise around Miami with champagne and snacks",
        location: "Miami Marina",
        pricePerPerson: 200,
        bookingUrlHint: "GetMyBoat",
      },
      {
        id: randomUUID(),
        tripId: miamiTrip.id,
        dayNumber: 3,
        type: "dining",
        time: "14:00",
        name: "Lunch at The Surf Club",
        description: "Elegant seaside dining at this historic venue",
        location: "9011 Collins Ave, Surfside",
        pricePerPerson: 75,
        bookingUrlHint: "Resy",
      },
      {
        id: randomUUID(),
        tripId: miamiTrip.id,
        dayNumber: 3,
        type: "flight",
        time: "19:00",
        name: "Flight Home",
        description: "Return flight from Miami International Airport",
        location: "Miami International Airport",
        pricePerPerson: 250,
        bookingUrlHint: "Google Flights",
      },
    ];

    miamiItems.forEach((item) => {
      const fullItem: ItineraryItem = {
        ...item,
        bookingStatus: "suggested",
        createdAt: new Date(),
      };
      this.itineraryItems.set(item.id, fullItem);
    });

    // Austin Food Weekend
    const austinTrip: Trip = {
      id: "trip-austin-1",
      organizerId: demoUser.id,
      destination: "Austin, TX",
      startDate: "2026-06-08",
      endDate: "2026-06-10",
      budgetPerPerson: 800,
      groupSize: 4,
      vibes: ["foodie", "adventure"],
      accommodationPref: "airbnb",
      diningPref: "casual",
      status: "planning",
      isLocked: false,
      shareCode: "AUSTIN2026",
      createdAt: new Date(),
    };
    this.trips.set(austinTrip.id, austinTrip);

    // Add organizer as member
    const austinMember: TripMember = {
      id: randomUUID(),
      tripId: austinTrip.id,
      userId: demoUser.id,
      role: "organizer",
      joinedAt: new Date(),
    };
    this.tripMembers.set(austinMember.id, austinMember);

    // Austin itinerary items
    const austinItems: InsertItineraryItem[] = [
      {
        id: randomUUID(),
        tripId: austinTrip.id,
        dayNumber: 1,
        type: "flight",
        time: "09:00",
        name: "Flight to Austin",
        description: "Direct flight to Austin-Bergstrom International Airport",
        location: "Austin-Bergstrom International Airport",
        pricePerPerson: 180,
        bookingUrlHint: "Google Flights",
      },
      {
        id: randomUUID(),
        tripId: austinTrip.id,
        dayNumber: 1,
        type: "hotel",
        time: "12:00",
        name: "Check-in at Downtown Loft",
        description: "Modern 3-bedroom loft in the heart of downtown Austin",
        location: "Downtown Austin",
        pricePerPerson: 100,
        bookingUrlHint: "Airbnb",
      },
      {
        id: randomUUID(),
        tripId: austinTrip.id,
        dayNumber: 1,
        type: "dining",
        time: "13:00",
        name: "Lunch at Franklin Barbecue",
        description: "World-famous Texas BBQ - get there early!",
        location: "900 E 11th St, Austin",
        pricePerPerson: 35,
        bookingUrlHint: "Walk-in (arrive by 11am)",
      },
      {
        id: randomUUID(),
        tripId: austinTrip.id,
        dayNumber: 1,
        type: "activity",
        time: "16:00",
        name: "East Austin Food Tour",
        description: "Walking tour of East Austin's best tacos and craft breweries",
        location: "East Austin",
        pricePerPerson: 60,
        bookingUrlHint: "Viator",
      },
      {
        id: randomUUID(),
        tripId: austinTrip.id,
        dayNumber: 1,
        type: "dining",
        time: "20:00",
        name: "Dinner at Uchi",
        description: "Award-winning Japanese restaurant from Top Chef's Tyson Cole",
        location: "801 S Lamar Blvd, Austin",
        pricePerPerson: 85,
        bookingUrlHint: "Resy",
      },
      {
        id: randomUUID(),
        tripId: austinTrip.id,
        dayNumber: 2,
        type: "dining",
        time: "09:00",
        name: "Breakfast at Loro",
        description: "Asian smokehouse brunch with incredible flavors",
        location: "2115 S Lamar Blvd, Austin",
        pricePerPerson: 25,
        bookingUrlHint: "Walk-in",
      },
      {
        id: randomUUID(),
        tripId: austinTrip.id,
        dayNumber: 2,
        type: "activity",
        time: "11:00",
        name: "Kayaking on Lady Bird Lake",
        description: "Paddle through downtown Austin's scenic waterway",
        location: "Lady Bird Lake",
        pricePerPerson: 40,
        bookingUrlHint: "Rowing Dock",
      },
      {
        id: randomUUID(),
        tripId: austinTrip.id,
        dayNumber: 2,
        type: "dining",
        time: "14:00",
        name: "Tacos at Veracruz All Natural",
        description: "Best migas tacos in Austin",
        location: "1704 E Cesar Chavez St, Austin",
        pricePerPerson: 15,
        bookingUrlHint: "Walk-in",
      },
      {
        id: randomUUID(),
        tripId: austinTrip.id,
        dayNumber: 2,
        type: "activity",
        time: "17:00",
        name: "South Congress Stroll",
        description: "Shop and explore Austin's iconic SoCo district",
        location: "South Congress Ave",
        pricePerPerson: 0,
        bookingUrlHint: "Self-guided",
      },
      {
        id: randomUUID(),
        tripId: austinTrip.id,
        dayNumber: 2,
        type: "dining",
        time: "19:30",
        name: "Dinner at Odd Duck",
        description: "Farm-to-table small plates from local ingredients",
        location: "1201 S Lamar Blvd, Austin",
        pricePerPerson: 70,
        bookingUrlHint: "Resy",
      },
      {
        id: randomUUID(),
        tripId: austinTrip.id,
        dayNumber: 3,
        type: "dining",
        time: "10:00",
        name: "Brunch at Jacoby's",
        description: "Ranch-to-table brunch with outdoor seating",
        location: "3235 E Cesar Chavez St, Austin",
        pricePerPerson: 30,
        bookingUrlHint: "Resy",
      },
      {
        id: randomUUID(),
        tripId: austinTrip.id,
        dayNumber: 3,
        type: "flight",
        time: "15:00",
        name: "Flight Home",
        description: "Return flight from Austin-Bergstrom",
        location: "Austin-Bergstrom International Airport",
        pricePerPerson: 180,
        bookingUrlHint: "Google Flights",
      },
    ];

    austinItems.forEach((item) => {
      const fullItem: ItineraryItem = {
        ...item,
        bookingStatus: "suggested",
        createdAt: new Date(),
      };
      this.itineraryItems.set(item.id, fullItem);
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((u) => u.email === email);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      ...user,
      createdAt: new Date(),
    };
    this.users.set(user.id, newUser);
    return newUser;
  }

  // Trips
  async getTrip(id: string): Promise<Trip | undefined> {
    return this.trips.get(id);
  }

  async getTripByShareCode(code: string): Promise<Trip | undefined> {
    return Array.from(this.trips.values()).find((t) => t.shareCode === code);
  }

  async getTripsByUserId(userId: string): Promise<Trip[]> {
    const memberTripIds = new Set(
      Array.from(this.tripMembers.values())
        .filter((m) => m.userId === userId)
        .map((m) => m.tripId)
    );
    
    return Array.from(this.trips.values()).filter(
      (t) => t.organizerId === userId || memberTripIds.has(t.id)
    );
  }

  async createTrip(trip: InsertTrip): Promise<Trip> {
    const shareCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    const newTrip: Trip = {
      ...trip,
      isLocked: false,
      shareCode,
      createdAt: new Date(),
    };
    this.trips.set(trip.id, newTrip);

    // Add organizer as member
    const member: TripMember = {
      id: randomUUID(),
      tripId: trip.id,
      userId: trip.organizerId,
      role: "organizer",
      joinedAt: new Date(),
    };
    this.tripMembers.set(member.id, member);

    return newTrip;
  }

  async updateTrip(id: string, updates: Partial<Trip>): Promise<Trip | undefined> {
    const trip = this.trips.get(id);
    if (!trip) return undefined;
    
    const updated = { ...trip, ...updates };
    this.trips.set(id, updated);
    return updated;
  }

  // Trip Members
  async getTripMembers(tripId: string): Promise<(TripMember & { user: User })[]> {
    const members = Array.from(this.tripMembers.values()).filter(
      (m) => m.tripId === tripId
    );
    
    return members.map((m) => ({
      ...m,
      user: this.users.get(m.userId)!,
    })).filter((m) => m.user);
  }

  async addTripMember(member: InsertTripMember): Promise<TripMember> {
    const newMember: TripMember = {
      ...member,
      joinedAt: new Date(),
    };
    this.tripMembers.set(member.id, newMember);
    return newMember;
  }

  async isTripMember(tripId: string, userId: string): Promise<boolean> {
    return Array.from(this.tripMembers.values()).some(
      (m) => m.tripId === tripId && m.userId === userId
    );
  }

  // Itinerary Items
  async getItineraryItems(tripId: string): Promise<ItineraryItem[]> {
    return Array.from(this.itineraryItems.values()).filter(
      (i) => i.tripId === tripId
    );
  }

  async createItineraryItem(item: InsertItineraryItem): Promise<ItineraryItem> {
    const newItem: ItineraryItem = {
      ...item,
      bookingStatus: "suggested",
      createdAt: new Date(),
    };
    this.itineraryItems.set(item.id, newItem);
    return newItem;
  }

  async updateItineraryItem(id: string, updates: Partial<ItineraryItem>): Promise<ItineraryItem | undefined> {
    const item = this.itineraryItems.get(id);
    if (!item) return undefined;
    
    const updated = { ...item, ...updates };
    this.itineraryItems.set(id, updated);
    return updated;
  }

  // Comments
  async getCommentsByItem(itemId: string): Promise<Comment[]> {
    return Array.from(this.comments.values()).filter(
      (c) => c.itemId === itemId
    );
  }

  async getCommentsByTrip(tripId: string): Promise<Comment[]> {
    const itemIds = new Set(
      Array.from(this.itineraryItems.values())
        .filter((i) => i.tripId === tripId)
        .map((i) => i.id)
    );
    
    return Array.from(this.comments.values()).filter(
      (c) => itemIds.has(c.itemId)
    );
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const newComment: Comment = {
      ...comment,
      createdAt: new Date(),
    };
    this.comments.set(comment.id, newComment);
    return newComment;
  }

  // Votes
  async getVotesByItem(itemId: string): Promise<Vote[]> {
    return Array.from(this.votes.values()).filter(
      (v) => v.itemId === itemId
    );
  }

  async getVotesByTrip(tripId: string): Promise<Vote[]> {
    const itemIds = new Set(
      Array.from(this.itineraryItems.values())
        .filter((i) => i.tripId === tripId)
        .map((i) => i.id)
    );
    
    return Array.from(this.votes.values()).filter(
      (v) => itemIds.has(v.itemId)
    );
  }

  async createOrUpdateVote(vote: InsertVote): Promise<Vote> {
    // Find existing vote by user for this item
    const existing = Array.from(this.votes.values()).find(
      (v) => v.itemId === vote.itemId && v.userId === vote.userId
    );
    
    if (existing) {
      const updated: Vote = { ...existing, voteType: vote.voteType };
      this.votes.set(existing.id, updated);
      return updated;
    }
    
    const newVote: Vote = {
      ...vote,
      createdAt: new Date(),
    };
    this.votes.set(vote.id, newVote);
    return newVote;
  }

  // Expenses
  async getExpensesByTrip(tripId: string): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(
      (e) => e.tripId === tripId
    );
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const newExpense: Expense = {
      ...expense,
      isSettled: false,
      createdAt: new Date(),
    };
    this.expenses.set(expense.id, newExpense);
    return newExpense;
  }

  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense | undefined> {
    const expense = this.expenses.get(id);
    if (!expense) return undefined;
    
    const updated = { ...expense, ...updates };
    this.expenses.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
