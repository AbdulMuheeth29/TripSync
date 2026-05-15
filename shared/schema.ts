import { pgTable, text, varchar, integer, timestamp, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// Users table - email and password authentication
export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  subscriptionTier: varchar("subscription_tier", { length: 20 }).default("free").notNull(),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Subscriptions table (Stripe-backed)
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  tier: varchar("tier", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Trips table
export const trips = pgTable("trips", {
  id: varchar("id", { length: 36 }).primaryKey(),
  organizerId: varchar("organizer_id", { length: 36 }).notNull(),
  title: text("title"), // Optional; falls back to destination in UI
  destination: text("destination").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  budgetPerPerson: integer("budget_per_person").notNull(),
  groupSize: integer("group_size").notNull(),
  vibes: text("vibes").array().notNull(),
  accommodationPref: text("accommodation_pref").notNull(),
  diningPref: text("dining_pref").notNull(),
  tripType: text("trip_type"), // Template: e.g. beach, city, food_tour
  status: text("status").notNull().default("planning"), // planning | booking | active | completed
  isLocked: boolean("is_locked").default(false),
  shareCode: varchar("share_code", { length: 12 }),
  voteDeadline: text("vote_deadline"), // ISO date when voting locks
  timezone: text("timezone"), // IANA e.g. America/New_York for display
  coverImageUrl: text("cover_image_url"), // Hero/cover from Unsplash
  recapText: text("recap_text"), // AI-generated trip recap
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Trip members (RSVP: pending | accepted | declined)
export const tripMembers = pgTable("trip_members", {
  id: varchar("id", { length: 36 }).primaryKey(),
  tripId: varchar("trip_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  role: text("role").notNull().default("member"),
  rsvpStatus: text("rsvp_status").notNull().default("pending"), // pending | accepted | declined
  joinedAt: timestamp("joined_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Itinerary items (status: proposed | locked | booked | cancelled; bookingStatus: not_started | in_progress | booked | cancelled)
export const itineraryItems = pgTable("itinerary_items", {
  id: varchar("id", { length: 36 }).primaryKey(),
  tripId: varchar("trip_id", { length: 36 }).notNull(),
  dayNumber: integer("day_number").notNull(),
  type: text("type").notNull(),
  time: text("time").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  pricePerPerson: integer("price_per_person").notNull(),
  bookingUrlHint: text("booking_url_hint"),
  bookingUrl: text("booking_url"),
  bookingStatus: text("booking_status").notNull().default("not_started"), // not_started | in_progress | booked | cancelled
  locked: boolean("locked").default(false), // Planner override: item locked regardless of vote
  bookedByUserId: varchar("booked_by_user_id", { length: 36 }), // Who is responsible for / did the booking
  confirmationNumber: text("confirmation_number"),
  confirmationImageUrl: text("confirmation_image_url"),
  endTime: text("end_time"), // Optional end time
  sortOrder: integer("sort_order"), // For drag-and-drop order within day
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Trip invites (email invites)
export const tripInvites = pgTable("trip_invites", {
  id: varchar("id", { length: 36 }).primaryKey(),
  tripId: varchar("trip_id", { length: 36 }).notNull(),
  email: text("email").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Member preferences (per trip: budget band, pace, diet, one must-do)
export const memberPreferences = pgTable("member_preferences", {
  id: varchar("id", { length: 36 }).primaryKey(),
  tripId: varchar("trip_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  budgetBand: text("budget_band"), // low | medium | high
  pace: text("pace"), // chill | packed
  diet: text("diet"),
  budgetFlexibility: text("budget_flexibility"), // Free text fallback
  mustDoActivities: text("must_do_activities"),
  accessibility: text("accessibility"), // Wheelchair access, mobility considerations
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Group chat messages
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id", { length: 36 }).primaryKey(),
  tripId: varchar("trip_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  content: text("content").notNull(),
  itemId: varchar("item_id", { length: 36 }), // Optional: link to itinerary item
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Atlas conversations (per-trip, per-user AI assistant history)
export const atlasConversations = pgTable("atlas_conversations", {
  id: varchar("id", { length: 36 }).primaryKey(),
  tripId: varchar("trip_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  // Stored as JSON array of AtlasMessage-like objects; structure enforced at application layer
  messages: json("messages").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Comments on itinerary items
export const comments = pgTable("comments", {
  id: varchar("id", { length: 36 }).primaryKey(),
  itemId: varchar("item_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Votes on itinerary items
export const votes = pgTable("votes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  itemId: varchar("item_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  voteType: text("vote_type").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Expenses (optional link to itinerary item)
export const expenses = pgTable("expenses", {
  id: varchar("id", { length: 36 }).primaryKey(),
  tripId: varchar("trip_id", { length: 36 }).notNull(),
  paidByUserId: varchar("paid_by_user_id", { length: 36 }).notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  description: text("description").notNull(),
  location: text("location"),
  itemId: varchar("item_id", { length: 36 }), // Optional link to itinerary item
  receiptImageUrl: text("receipt_image_url"), // Receipt photo URL (upload elsewhere, paste link; OCR later)
  splitAmong: json("split_among").$type<string[]>().notNull(),
  isSettled: boolean("is_settled").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Trip recap / shared photo folder
export const tripPhotos = pgTable("trip_photos", {
  id: varchar("id", { length: 36 }).primaryKey(),
  tripId: varchar("trip_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  url: text("url").notNull(),
  caption: text("caption"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Quick polls (binary or multi-choice)
export const polls = pgTable("polls", {
  id: varchar("id", { length: 36 }).primaryKey(),
  tripId: varchar("trip_id", { length: 36 }).notNull(),
  createdByUserId: varchar("created_by_user_id", { length: 36 }).notNull(),
  question: text("question").notNull(),
  options: json("options").$type<string[]>().notNull(), // e.g. ["Beach", "Hiking"]
  deadline: text("deadline"), // ISO date; auto-lock after
  status: text("status").notNull().default("open"), // open | closed
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const pollVotes = pgTable("poll_votes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  pollId: varchar("poll_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  optionIndex: integer("option_index").notNull(), // 0-based
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Shared packing list
export const packingItems = pgTable("packing_items", {
  id: varchar("id", { length: 36 }).primaryKey(),
  tripId: varchar("trip_id", { length: 36 }).notNull(),
  name: text("name").notNull(), // e.g. "Bluetooth speaker", "Cooler"
  assignedToUserId: varchar("assigned_to_user_id", { length: 36 }),
  notes: text("notes"),
  packed: boolean("packed").default(false), // Checkbox: item is packed
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Transportation coordination (who's driving, ride shares)
export const transportationEntries = pgTable("transportation_entries", {
  id: varchar("id", { length: 36 }).primaryKey(),
  tripId: varchar("trip_id", { length: 36 }).notNull(),
  dayNumber: integer("day_number").notNull(),
  type: text("type").notNull(), // drive | rideshare | pickup
  description: text("description").notNull(), // e.g. "Airport pickup"
  driverUserId: varchar("driver_user_id", { length: 36 }),
  passengerUserIds: json("passenger_user_ids").$type<string[]>(),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Group availability (dates that work for everyone - Calendly-style)
export const groupAvailability = pgTable("group_availability", {
  id: varchar("id", { length: 36 }).primaryKey(),
  tripId: varchar("trip_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  availableDates: json("available_dates").$type<string[]>().notNull(), // ["2026-05-15", "2026-05-16", ...]
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Trip documents (boarding passes, confirmations, vaccination records)
export const tripDocuments = pgTable("trip_documents", {
  id: varchar("id", { length: 36 }).primaryKey(),
  tripId: varchar("trip_id", { length: 36 }).notNull(),
  uploadedByUserId: varchar("uploaded_by_user_id", { length: 36 }).notNull(),
  type: text("type").notNull(), // boarding_pass | hotel_confirmation | vaccination | insurance | other
  name: text("name").notNull(),
  url: text("url").notNull(), // Link to stored file (upload elsewhere, paste URL)
  notes: text("notes"),
  expiryDate: text("expiry_date"), // ISO date e.g. 2026-03-15 for expiry warning
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Emergency contacts (embassy, medical, etc.) - shared per trip
export const emergencyContacts = pgTable("emergency_contacts", {
  id: varchar("id", { length: 36 }).primaryKey(),
  tripId: varchar("trip_id", { length: 36 }).notNull(),
  type: text("type").notNull(), // embassy | medical | police | other
  name: text("name").notNull(),
  phone: text("phone"),
  url: text("url"), // Optional link (e.g. embassy page)
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// User learned preferences (AI learns from past trips)
export const userLearnedPreferences = pgTable("user_learned_preferences", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  vibesPreferred: json("vibes_preferred").$type<string[]>(),
  tripTypesPreferred: json("trip_types_preferred").$type<string[]>(),
  budgetBand: text("budget_band"),
  learnedFromTripIds: json("learned_from_trip_ids").$type<string[]>(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Trip satisfaction (per user, for analytics)
export const tripSatisfaction = pgTable("trip_satisfaction", {
  id: varchar("id", { length: 36 }).primaryKey(),
  tripId: varchar("trip_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  score: integer("score").notNull(), // 1-5
  comment: text("comment"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Group mood board (Pinterest-style pins)
export const moodBoardItems = pgTable("mood_board_items", {
  id: varchar("id", { length: 36 }).primaryKey(),
  tripId: varchar("trip_id", { length: 36 }).notNull(),
  url: text("url").notNull(),
  label: text("label"),
  addedByUserId: varchar("added_by_user_id", { length: 36 }).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Real-time location sharing (optional, during trip)
export const locationSharing = pgTable("location_sharing", {
  id: varchar("id", { length: 36 }).primaryKey(),
  tripId: varchar("trip_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  lat: text("lat").notNull(),
  lng: text("lng").notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
});

export const insertTripSchema = createInsertSchema(trips).omit({
  createdAt: true,
  isLocked: true,
  shareCode: true,
  status: true,
});

export const insertTripMemberSchema = createInsertSchema(tripMembers).omit({
  joinedAt: true,
  rsvpStatus: true,
});

export const insertItineraryItemSchema = createInsertSchema(itineraryItems).omit({
  createdAt: true,
  bookingStatus: true,
  locked: true,
  sortOrder: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  createdAt: true,
});

export const insertVoteSchema = createInsertSchema(votes).omit({
  createdAt: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  createdAt: true,
  isSettled: true,
  currency: true,
});

export const insertTripInviteSchema = createInsertSchema(tripInvites).omit({ createdAt: true });
export const insertMemberPreferenceSchema = createInsertSchema(memberPreferences).omit({ createdAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ createdAt: true });
export const insertTripPhotoSchema = createInsertSchema(tripPhotos).omit({ createdAt: true });
export const insertPollSchema = createInsertSchema(polls).omit({ createdAt: true });
export const insertPollVoteSchema = createInsertSchema(pollVotes).omit({ createdAt: true });
export const insertPackingItemSchema = createInsertSchema(packingItems).omit({ createdAt: true });
export const insertTransportationEntrySchema = createInsertSchema(transportationEntries).omit({ createdAt: true });
export const insertGroupAvailabilitySchema = createInsertSchema(groupAvailability).omit({ createdAt: true });
export const insertTripDocumentSchema = createInsertSchema(tripDocuments).omit({ createdAt: true });
export const insertEmergencyContactSchema = createInsertSchema(emergencyContacts).omit({ createdAt: true });
export const insertMoodBoardItemSchema = createInsertSchema(moodBoardItems).omit({ createdAt: true });
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ createdAt: true });
export const insertUserLearnedPreferencesSchema = createInsertSchema(userLearnedPreferences).omit({ updatedAt: true });
export const insertTripSatisfactionSchema = createInsertSchema(tripSatisfaction).omit({ createdAt: true });
export const insertLocationSharingSchema = createInsertSchema(locationSharing).omit({ updatedAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Trip = typeof trips.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type TripMember = typeof tripMembers.$inferSelect;
export type InsertTripMember = z.infer<typeof insertTripMemberSchema>;
export type ItineraryItem = typeof itineraryItems.$inferSelect;
export type InsertItineraryItem = z.infer<typeof insertItineraryItemSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Vote = typeof votes.$inferSelect;
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type TripInvite = typeof tripInvites.$inferSelect;
export type InsertTripInvite = z.infer<typeof insertTripInviteSchema>;
export type MemberPreference = typeof memberPreferences.$inferSelect;
export type InsertMemberPreference = z.infer<typeof insertMemberPreferenceSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type TripPhoto = typeof tripPhotos.$inferSelect;
export type InsertTripPhoto = z.infer<typeof insertTripPhotoSchema>;
export type Poll = typeof polls.$inferSelect;
export type InsertPoll = z.infer<typeof insertPollSchema>;
export type PollVote = typeof pollVotes.$inferSelect;
export type InsertPollVote = z.infer<typeof insertPollVoteSchema>;
export type PackingItem = typeof packingItems.$inferSelect;
export type InsertPackingItem = z.infer<typeof insertPackingItemSchema>;
export type TransportationEntry = typeof transportationEntries.$inferSelect;
export type InsertTransportationEntry = z.infer<typeof insertTransportationEntrySchema>;
export type GroupAvailability = typeof groupAvailability.$inferSelect;
export type InsertGroupAvailability = z.infer<typeof insertGroupAvailabilitySchema>;
export type TripDocument = typeof tripDocuments.$inferSelect;
export type InsertTripDocument = z.infer<typeof insertTripDocumentSchema>;
export type EmergencyContact = typeof emergencyContacts.$inferSelect;
export type InsertEmergencyContact = z.infer<typeof insertEmergencyContactSchema>;
export type MoodBoardItem = typeof moodBoardItems.$inferSelect;
export type InsertMoodBoardItem = z.infer<typeof insertMoodBoardItemSchema>;
export type UserLearnedPreferences = typeof userLearnedPreferences.$inferSelect;
export type InsertUserLearnedPreferences = z.infer<typeof insertUserLearnedPreferencesSchema>;
export type TripSatisfaction = typeof tripSatisfaction.$inferSelect;
export type InsertTripSatisfaction = z.infer<typeof insertTripSatisfactionSchema>;
export type LocationSharing = typeof locationSharing.$inferSelect;
export type InsertLocationSharing = z.infer<typeof insertLocationSharingSchema>;
export type AtlasConversation = typeof atlasConversations.$inferSelect;
export type InsertAtlasConversation = typeof atlasConversations.$inferInsert;

// Wizard form schema
export const tripWizardSchema = z.object({
  destination: z.string().min(2, "Destination is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  budgetPerPerson: z.number().min(100, "Budget must be at least $100"),
  groupSize: z.number().min(2, "Group size must be at least 2"),
  vibes: z.array(z.string()).min(1, "Select at least one vibe"),
  accommodationPref: z.string().min(1, "Select accommodation preference"),
  diningPref: z.string().min(1, "Select dining preference"),
});

export type TripWizardData = z.infer<typeof tripWizardSchema>;

// AI Response types
export interface AIItinerary {
  summary: string;
  total_estimated_cost: number;
  itinerary: {
    day: number;
    date: string;
    items: {
      type: "flight" | "hotel" | "dining" | "activity";
      time: string;
      name: string;
      description: string;
      location: string;
      price_per_person: number;
      booking_url_hint: string;
      booking_url?: string;
    }[];
  }[];
}
