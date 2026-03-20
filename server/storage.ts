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
  type TripInvite,
  type InsertTripInvite,
  type MemberPreference,
  type InsertMemberPreference,
  type ChatMessage,
  type InsertChatMessage,
  type TripPhoto,
  type InsertTripPhoto,
  type Poll,
  type InsertPoll,
  type PollVote,
  type InsertPollVote,
  type PackingItem,
  type InsertPackingItem,
  type TransportationEntry,
  type InsertTransportationEntry,
  type GroupAvailability,
  type InsertGroupAvailability,
  type TripDocument,
  type InsertTripDocument,
  type EmergencyContact,
  type InsertEmergencyContact,
  type MoodBoardItem,
  type InsertMoodBoardItem,
  type UserLearnedPreferences,
  type InsertUserLearnedPreferences,
  type TripSatisfaction,
  type InsertTripSatisfaction,
  type LocationSharing,
  type InsertLocationSharing,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Trips
  getTrip(id: string): Promise<Trip | undefined>;
  getTripByShareCode(code: string): Promise<Trip | undefined>;
  getTripsByUserId(userId: string): Promise<Trip[]>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTrip(id: string, updates: Partial<Trip>): Promise<Trip | undefined>;

  // Trip Members
  getTripMembers(tripId: string): Promise<(TripMember & { user: User })[]>;
  getTripMemberById(id: string): Promise<TripMember | undefined>;
  addTripMember(member: InsertTripMember): Promise<TripMember>;
  updateTripMember(id: string, updates: Partial<TripMember>): Promise<TripMember | undefined>;
  deleteTripMember(id: string): Promise<void>;
  isTripMember(tripId: string, userId: string): Promise<boolean>;

  // Itinerary Items
  getItineraryItems(tripId: string): Promise<ItineraryItem[]>;
  createItineraryItem(item: InsertItineraryItem): Promise<ItineraryItem>;
  updateItineraryItem(id: string, updates: Partial<ItineraryItem>): Promise<ItineraryItem | undefined>;
  deleteItineraryItem(id: string): Promise<void>;
  deleteItineraryItemsByTripId(tripId: string): Promise<void>;

  // Comments
  getCommentsByItem(itemId: string): Promise<Comment[]>;
  getCommentsByTrip(tripId: string): Promise<Comment[]>;
  getCommentById(id: string): Promise<Comment | undefined>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: string): Promise<void>;

  // Votes
  getVotesByItem(itemId: string): Promise<Vote[]>;
  getVotesByTrip(tripId: string): Promise<Vote[]>;
  createOrUpdateVote(vote: InsertVote): Promise<Vote>;

  // Expenses
  getExpensesByTrip(tripId: string): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, updates: Partial<Expense>): Promise<Expense | undefined>;
  deleteExpense(id: string): Promise<boolean>;

  // Invites
  getInvitesByTrip(tripId: string): Promise<TripInvite[]>;
  getInviteById(id: string): Promise<TripInvite | undefined>;
  createInvite(invite: InsertTripInvite): Promise<TripInvite>;
  updateInvite(id: string, updates: Partial<Pick<TripInvite, "status">>): Promise<TripInvite | undefined>;

  // Member preferences
  getPreferencesByTrip(tripId: string): Promise<(MemberPreference & { user: User })[]>;
  getPreference(tripId: string, userId: string): Promise<MemberPreference | undefined>;
  createOrUpdatePreference(pref: InsertMemberPreference): Promise<MemberPreference>;

  // Chat
  getChatMessagesByTrip(tripId: string): Promise<(ChatMessage & { user: User })[]>;
  createChatMessage(msg: InsertChatMessage): Promise<ChatMessage>;

  // Trip photos (recap / shared album)
  getPhotosByTrip(tripId: string): Promise<(TripPhoto & { user: User })[]>;
  createTripPhoto(photo: InsertTripPhoto): Promise<TripPhoto>;
  deleteTripPhoto(id: string): Promise<void>;

  // Quick polls
  getPollsByTrip(tripId: string): Promise<(Poll & { createdBy: User })[]>;
  createPoll(poll: InsertPoll): Promise<Poll>;
  deletePoll(id: string): Promise<void>;
  getPollVotes(pollId: string): Promise<PollVote[]>;
  createOrUpdatePollVote(vote: InsertPollVote): Promise<PollVote>;

  // Packing list
  getPackingByTrip(tripId: string): Promise<(PackingItem & { assignedTo?: User })[]>;
  createPackingItem(item: InsertPackingItem): Promise<PackingItem>;
  updatePackingItem(id: string, updates: Partial<PackingItem>): Promise<PackingItem | undefined>;
  deletePackingItem(id: string): Promise<void>;

  // Transportation
  getTransportationByTrip(tripId: string): Promise<(TransportationEntry & { driver?: User })[]>;
  createTransportationEntry(entry: InsertTransportationEntry): Promise<TransportationEntry>;
  updateTransportationEntry(id: string, updates: Partial<TransportationEntry>): Promise<TransportationEntry | undefined>;
  deleteTransportationEntry(id: string): Promise<void>;

  // Group availability
  getGroupAvailabilityByTrip(tripId: string): Promise<(GroupAvailability & { user: User })[]>;
  setUserAvailability(tripId: string, userId: string, availableDates: string[]): Promise<GroupAvailability>;

  // Trip documents
  getDocumentsByTrip(tripId: string): Promise<(TripDocument & { uploadedBy?: User })[]>;
  createTripDocument(doc: InsertTripDocument): Promise<TripDocument>;
  updateTripDocument(id: string, updates: Partial<TripDocument>): Promise<TripDocument | undefined>;
  deleteTripDocument(id: string): Promise<void>;

  // Emergency contacts
  getEmergencyContactsByTrip(tripId: string): Promise<EmergencyContact[]>;
  createEmergencyContact(contact: InsertEmergencyContact): Promise<EmergencyContact>;
  updateEmergencyContact(id: string, updates: Partial<EmergencyContact>): Promise<EmergencyContact | undefined>;
  deleteEmergencyContact(id: string): Promise<void>;

  // Mood board
  getMoodBoardByTrip(tripId: string): Promise<(MoodBoardItem & { addedBy?: User })[]>;
  createMoodBoardItem(item: InsertMoodBoardItem): Promise<MoodBoardItem>;
  deleteMoodBoardItem(id: string): Promise<void>;

  // User learned preferences (preference learning)
  getUserLearnedPreferences(userId: string): Promise<UserLearnedPreferences | undefined>;
  createOrUpdateUserLearnedPreferences(pref: InsertUserLearnedPreferences): Promise<UserLearnedPreferences>;

  // Trip satisfaction (analytics)
  getSatisfactionByTrip(tripId: string): Promise<(TripSatisfaction & { user: User })[]>;
  createOrUpdateTripSatisfaction(entry: InsertTripSatisfaction): Promise<TripSatisfaction>;

  // Location sharing
  getLocationSharingByTrip(tripId: string): Promise<(LocationSharing & { user: User })[]>;
  setUserLocation(tripId: string, userId: string, lat: string, lng: string): Promise<LocationSharing>;

  // Admin metrics (used only by admin dashboard)
  getAdminMetricsCounts(): Promise<{
    totalUsers: number;
    totalTrips: number;
    totalItineraryItems: number;
    totalChatMessages: number;
    totalMembers: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private trips: Map<string, Trip> = new Map();
  private tripMembers: Map<string, TripMember> = new Map();
  private itineraryItems: Map<string, ItineraryItem> = new Map();
  private comments: Map<string, Comment> = new Map();
  private votes: Map<string, Vote> = new Map();
  private expenses: Map<string, Expense> = new Map();
  private tripInvites: Map<string, TripInvite> = new Map();
  private memberPreferences: Map<string, MemberPreference> = new Map();
  private chatMessages: Map<string, ChatMessage> = new Map();
  private tripPhotos: Map<string, TripPhoto> = new Map();
  private polls: Map<string, Poll> = new Map();
  private pollVotes: Map<string, PollVote> = new Map();
  private packingItems: Map<string, PackingItem> = new Map();
  private transportationEntries: Map<string, TransportationEntry> = new Map();
  private groupAvailability: Map<string, GroupAvailability> = new Map();
  private tripDocuments: Map<string, TripDocument> = new Map();
  private emergencyContacts: Map<string, EmergencyContact> = new Map();
  private moodBoardItems: Map<string, MoodBoardItem> = new Map();
  private userLearnedPreferences: Map<string, UserLearnedPreferences> = new Map();
  private tripSatisfaction: Map<string, TripSatisfaction> = new Map();
  private locationSharing: Map<string, LocationSharing> = new Map();

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

  async getUserById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((u) => u.email === email);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      ...user,
      subscriptionTier: (user as Partial<User>).subscriptionTier ?? "free",
      subscriptionExpiresAt: (user as Partial<User>).subscriptionExpiresAt ?? null,
      createdAt: new Date(),
    } as User;
    this.users.set(user.id, newUser);
    return newUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const existing = this.users.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates } as User;
    this.users.set(id, updated);
    return updated;
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
      status: trip.status || "planning",
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
      rsvpStatus: "accepted",
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
      rsvpStatus: "accepted",
      joinedAt: new Date(),
    };
    this.tripMembers.set(member.id, newMember);
    return newMember;
  }

  async getTripMemberById(id: string): Promise<TripMember | undefined> {
    return this.tripMembers.get(id);
  }

  async updateTripMember(id: string, updates: Partial<TripMember>): Promise<TripMember | undefined> {
    const m = this.tripMembers.get(id);
    if (!m) return undefined;
    const updated = { ...m, ...updates };
    this.tripMembers.set(id, updated);
    return updated;
  }

  async deleteTripMember(id: string): Promise<void> {
    this.tripMembers.delete(id);
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
      bookingStatus: "not_started",
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

  async deleteItineraryItem(id: string): Promise<void> {
    this.itineraryItems.delete(id);
    // Also delete related comments and votes
    for (const [commentId, comment] of this.comments.entries()) {
      if (comment.itemId === id) this.comments.delete(commentId);
    }
    for (const [voteId, vote] of this.votes.entries()) {
      if (vote.itemId === id) this.votes.delete(voteId);
    }
  }

  async deleteItineraryItemsByTripId(tripId: string): Promise<void> {
    for (const [id, item] of this.itineraryItems.entries()) {
      if (item.tripId === tripId) {
        await this.deleteItineraryItem(id);
      }
    }
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

  async deleteExpense(id: string): Promise<boolean> {
    return this.expenses.delete(id);
  }

  // Invites
  async getInvitesByTrip(tripId: string): Promise<TripInvite[]> {
    return Array.from(this.tripInvites.values()).filter((i) => i.tripId === tripId);
  }

  async getInviteById(id: string): Promise<TripInvite | undefined> {
    return this.tripInvites.get(id);
  }

  async updateInvite(id: string, updates: Partial<Pick<TripInvite, "status">>): Promise<TripInvite | undefined> {
    const invite = this.tripInvites.get(id);
    if (!invite) return undefined;
    const updated = { ...invite, ...updates };
    this.tripInvites.set(id, updated);
    return updated;
  }

  async createInvite(invite: InsertTripInvite): Promise<TripInvite> {
    const newInvite: TripInvite = {
      ...invite,
      createdAt: new Date(),
    };
    this.tripInvites.set(invite.id, newInvite);
    return newInvite;
  }

  // Member preferences
  async getPreferencesByTrip(tripId: string): Promise<(MemberPreference & { user: User })[]> {
    const prefs = Array.from(this.memberPreferences.values()).filter((p) => p.tripId === tripId);
    return prefs
      .map((p) => ({
        ...p,
        user: this.users.get(p.userId)!,
      }))
      .filter((p) => p.user);
  }

  async getPreference(tripId: string, userId: string): Promise<MemberPreference | undefined> {
    return Array.from(this.memberPreferences.values()).find(
      (p) => p.tripId === tripId && p.userId === userId
    );
  }

  async createOrUpdatePreference(pref: InsertMemberPreference): Promise<MemberPreference> {
    const existing = Array.from(this.memberPreferences.values()).find(
      (p) => p.tripId === pref.tripId && p.userId === pref.userId
    );
    const updated: MemberPreference = {
      ...(existing || pref),
      ...pref,
      id: existing?.id ?? pref.id,
      tripId: pref.tripId,
      userId: pref.userId,
      budgetBand: pref.budgetBand ?? existing?.budgetBand ?? null,
      pace: pref.pace ?? existing?.pace ?? null,
      diet: pref.diet ?? existing?.diet ?? null,
      budgetFlexibility: pref.budgetFlexibility ?? existing?.budgetFlexibility ?? null,
      mustDoActivities: pref.mustDoActivities ?? existing?.mustDoActivities ?? null,
      accessibility: pref.accessibility ?? existing?.accessibility ?? null,
      createdAt: existing?.createdAt ?? new Date(),
    };
    this.memberPreferences.set(updated.id, updated);
    return updated;
  }

  // Chat
  async getChatMessagesByTrip(tripId: string): Promise<(ChatMessage & { user: User })[]> {
    const messages = Array.from(this.chatMessages.values())
      .filter((m) => m.tripId === tripId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return messages
      .map((m) => ({
        ...m,
        user: this.users.get(m.userId)!,
      }))
      .filter((m) => m.user);
  }

  async createChatMessage(msg: InsertChatMessage): Promise<ChatMessage> {
    const newMsg: ChatMessage = {
      ...msg,
      createdAt: new Date(),
    };
    this.chatMessages.set(msg.id, newMsg);
    return newMsg;
  }

  async getPhotosByTrip(tripId: string): Promise<(TripPhoto & { user: User })[]> {
    const photos = Array.from(this.tripPhotos.values()).filter((p) => p.tripId === tripId);
    return photos
      .map((p) => ({ ...p, user: this.users.get(p.userId)! }))
      .filter((p) => p.user)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createTripPhoto(photo: InsertTripPhoto): Promise<TripPhoto> {
    const newPhoto: TripPhoto = { ...photo, createdAt: new Date() };
    this.tripPhotos.set(photo.id, newPhoto);
    return newPhoto;
  }

  async deleteTripPhoto(id: string): Promise<void> {
    this.tripPhotos.delete(id);
  }

  async getPollsByTrip(tripId: string): Promise<(Poll & { createdBy: User })[]> {
    const list = Array.from(this.polls.values()).filter((p) => p.tripId === tripId);
    return list.map((p) => ({ ...p, createdBy: this.users.get(p.createdByUserId)! })).filter((p) => p.createdBy);
  }

  async createPoll(poll: InsertPoll): Promise<Poll> {
    const newPoll: Poll = { ...poll, status: "open", createdAt: new Date() };
    this.polls.set(poll.id, newPoll);
    return newPoll;
  }

  async deletePoll(id: string): Promise<void> {
    this.polls.delete(id);
    Array.from(this.pollVotes.keys()).forEach((k) => {
      const v = this.pollVotes.get(k)!;
      if (v.pollId === id) this.pollVotes.delete(k);
    });
  }

  async getPollVotes(pollId: string): Promise<PollVote[]> {
    return Array.from(this.pollVotes.values()).filter((v) => v.pollId === pollId);
  }

  async createOrUpdatePollVote(vote: InsertPollVote): Promise<PollVote> {
    const existing = Array.from(this.pollVotes.values()).find((v) => v.pollId === vote.pollId && v.userId === vote.userId);
    if (existing) {
      const updated = { ...existing, optionIndex: vote.optionIndex };
      this.pollVotes.set(existing.id, updated);
      return updated;
    }
    const newVote: PollVote = { ...vote, createdAt: new Date() };
    this.pollVotes.set(vote.id, newVote);
    return newVote;
  }

  async getPackingByTrip(tripId: string): Promise<(PackingItem & { assignedTo?: User })[]> {
    const list = Array.from(this.packingItems.values()).filter((p) => p.tripId === tripId);
    return list.map((p) => ({ ...p, assignedTo: p.assignedToUserId ? this.users.get(p.assignedToUserId) : undefined }));
  }

  async createPackingItem(item: InsertPackingItem): Promise<PackingItem> {
    const newItem: PackingItem = { ...item, createdAt: new Date() };
    this.packingItems.set(item.id, newItem);
    return newItem;
  }

  async updatePackingItem(id: string, updates: Partial<PackingItem>): Promise<PackingItem | undefined> {
    const item = this.packingItems.get(id);
    if (!item) return undefined;
    const updated = { ...item, ...updates };
    this.packingItems.set(id, updated);
    return updated;
  }

  async deletePackingItem(id: string): Promise<void> {
    this.packingItems.delete(id);
  }

  async getTransportationByTrip(tripId: string): Promise<(TransportationEntry & { driver?: User })[]> {
    const list = Array.from(this.transportationEntries.values()).filter((t) => t.tripId === tripId);
    return list.map((t) => ({ ...t, driver: t.driverUserId ? this.users.get(t.driverUserId) : undefined }));
  }

  async createTransportationEntry(entry: InsertTransportationEntry): Promise<TransportationEntry> {
    const newEntry: TransportationEntry = { ...entry, createdAt: new Date() };
    this.transportationEntries.set(entry.id, newEntry);
    return newEntry;
  }

  async updateTransportationEntry(id: string, updates: Partial<TransportationEntry>): Promise<TransportationEntry | undefined> {
    const entry = this.transportationEntries.get(id);
    if (!entry) return undefined;
    const updated = { ...entry, ...updates };
    this.transportationEntries.set(id, updated);
    return updated;
  }

  async deleteTransportationEntry(id: string): Promise<void> {
    this.transportationEntries.delete(id);
  }

  async getGroupAvailabilityByTrip(tripId: string): Promise<(GroupAvailability & { user: User })[]> {
    const list = Array.from(this.groupAvailability.values()).filter((a) => a.tripId === tripId);
    return list.map((a) => ({ ...a, user: this.users.get(a.userId)! })).filter((a) => a.user);
  }

  async setUserAvailability(tripId: string, userId: string, availableDates: string[]): Promise<GroupAvailability> {
    const existing = Array.from(this.groupAvailability.values()).find((a) => a.tripId === tripId && a.userId === userId);
    if (existing) {
      const updated = { ...existing, availableDates };
      this.groupAvailability.set(existing.id, updated);
      return updated;
    }
    const id = randomUUID();
    const newAvail: GroupAvailability = { id, tripId, userId, availableDates, createdAt: new Date() };
    this.groupAvailability.set(id, newAvail);
    return newAvail;
  }

  async getDocumentsByTrip(tripId: string): Promise<(TripDocument & { uploadedBy?: User })[]> {
    const list = Array.from(this.tripDocuments.values()).filter((d) => d.tripId === tripId);
    return list.map((d) => ({ ...d, uploadedBy: this.users.get(d.uploadedByUserId) }));
  }

  async createTripDocument(doc: InsertTripDocument): Promise<TripDocument> {
    const id = doc.id ?? randomUUID();
    const newDoc: TripDocument = { ...doc, id, createdAt: new Date() };
    this.tripDocuments.set(id, newDoc);
    return newDoc;
  }

  async updateTripDocument(id: string, updates: Partial<TripDocument>): Promise<TripDocument | undefined> {
    const doc = this.tripDocuments.get(id);
    if (!doc) return undefined;
    const updated = { ...doc, ...updates };
    this.tripDocuments.set(id, updated);
    return updated;
  }

  async deleteTripDocument(id: string): Promise<void> {
    this.tripDocuments.delete(id);
  }

  async getEmergencyContactsByTrip(tripId: string): Promise<EmergencyContact[]> {
    return Array.from(this.emergencyContacts.values()).filter((c) => c.tripId === tripId);
  }

  async createEmergencyContact(contact: InsertEmergencyContact): Promise<EmergencyContact> {
    const id = contact.id ?? randomUUID();
    const newContact: EmergencyContact = { ...contact, id, createdAt: new Date() };
    this.emergencyContacts.set(id, newContact);
    return newContact;
  }

  async updateEmergencyContact(id: string, updates: Partial<EmergencyContact>): Promise<EmergencyContact | undefined> {
    const existing = this.emergencyContacts.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.emergencyContacts.set(id, updated);
    return updated;
  }

  async deleteEmergencyContact(id: string): Promise<void> {
    this.emergencyContacts.delete(id);
  }

  async getMoodBoardByTrip(tripId: string): Promise<(MoodBoardItem & { addedBy?: User })[]> {
    const list = Array.from(this.moodBoardItems.values()).filter((m) => m.tripId === tripId);
    for (const m of list) {
      const u = this.users.get(m.addedByUserId);
      if (u) (m as MoodBoardItem & { addedBy?: User }).addedBy = u;
    }
    return list as (MoodBoardItem & { addedBy?: User })[];
  }

  async createMoodBoardItem(item: InsertMoodBoardItem): Promise<MoodBoardItem> {
    const id = item.id ?? randomUUID();
    const newItem: MoodBoardItem = { ...item, id, createdAt: new Date() } as MoodBoardItem;
    this.moodBoardItems.set(id, newItem);
    return newItem;
  }

  async deleteMoodBoardItem(id: string): Promise<void> {
    this.moodBoardItems.delete(id);
  }

  async getUserLearnedPreferences(userId: string): Promise<UserLearnedPreferences | undefined> {
    return Array.from(this.userLearnedPreferences.values()).find((p) => p.userId === userId);
  }

  async createOrUpdateUserLearnedPreferences(pref: InsertUserLearnedPreferences): Promise<UserLearnedPreferences> {
    const existing = Array.from(this.userLearnedPreferences.values()).find((p) => p.userId === pref.userId);
    const id = existing?.id ?? pref.id ?? randomUUID();
    const updated: UserLearnedPreferences = {
      ...(existing ?? { id, userId: pref.userId, updatedAt: new Date() }),
      ...pref,
      id,
      updatedAt: new Date(),
    };
    this.userLearnedPreferences.set(id, updated);
    return updated;
  }

  async getSatisfactionByTrip(tripId: string): Promise<(TripSatisfaction & { user: User })[]> {
    const list = Array.from(this.tripSatisfaction.values()).filter((s) => s.tripId === tripId);
    return list.map((s) => ({ ...s, user: this.users.get(s.userId)! })).filter((s) => s.user);
  }

  async createOrUpdateTripSatisfaction(entry: InsertTripSatisfaction): Promise<TripSatisfaction> {
    const existing = Array.from(this.tripSatisfaction.values()).find((s) => s.tripId === entry.tripId && s.userId === entry.userId);
    const id = existing?.id ?? entry.id ?? randomUUID();
    const newEntry: TripSatisfaction = { ...entry, id, createdAt: existing?.createdAt ?? new Date() };
    this.tripSatisfaction.set(id, newEntry);
    return newEntry;
  }

  async getLocationSharingByTrip(tripId: string): Promise<(LocationSharing & { user: User })[]> {
    const list = Array.from(this.locationSharing.values()).filter((l) => l.tripId === tripId);
    return list.map((l) => ({ ...l, user: this.users.get(l.userId)! })).filter((l) => l.user);
  }

  async setUserLocation(tripId: string, userId: string, lat: string, lng: string): Promise<LocationSharing> {
    const existing = Array.from(this.locationSharing.values()).find((l) => l.tripId === tripId && l.userId === userId);
    const id = existing?.id ?? randomUUID();
    const updated: LocationSharing = { id, tripId, userId, lat, lng, updatedAt: new Date() };
    this.locationSharing.set(id, updated);
    return updated;
  }

  async getAdminMetricsCounts() {
    return {
      totalUsers: this.users.size,
      totalTrips: this.trips.size,
      totalItineraryItems: this.itineraryItems.size,
      totalChatMessages: this.chatMessages.size,
      totalMembers: this.tripMembers.size,
    };
  }
}

import { getDb } from "./db";
import { createPgStorage } from "./storage-pg";

export const storage: IStorage = process.env.DATABASE_URL
  ? createPgStorage(getDb())
  : new MemStorage();
