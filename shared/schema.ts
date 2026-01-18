import { pgTable, text, varchar, integer, timestamp, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// Users table - simple email-based auth
export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Trips table
export const trips = pgTable("trips", {
  id: varchar("id", { length: 36 }).primaryKey(),
  organizerId: varchar("organizer_id", { length: 36 }).notNull(),
  destination: text("destination").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  budgetPerPerson: integer("budget_per_person").notNull(),
  groupSize: integer("group_size").notNull(),
  vibes: text("vibes").array().notNull(),
  accommodationPref: text("accommodation_pref").notNull(),
  diningPref: text("dining_pref").notNull(),
  status: text("status").notNull().default("planning"),
  isLocked: boolean("is_locked").default(false),
  shareCode: varchar("share_code", { length: 12 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Trip members
export const tripMembers = pgTable("trip_members", {
  id: varchar("id", { length: 36 }).primaryKey(),
  tripId: varchar("trip_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  role: text("role").notNull().default("member"),
  joinedAt: timestamp("joined_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Itinerary items
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
  bookingStatus: text("booking_status").notNull().default("suggested"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
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

// Expenses
export const expenses = pgTable("expenses", {
  id: varchar("id", { length: 36 }).primaryKey(),
  tripId: varchar("trip_id", { length: 36 }).notNull(),
  paidByUserId: varchar("paid_by_user_id", { length: 36 }).notNull(),
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  location: text("location"),
  splitAmong: json("split_among").$type<string[]>().notNull(),
  isSettled: boolean("is_settled").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
});

export const insertTripSchema = createInsertSchema(trips).omit({
  createdAt: true,
  isLocked: true,
  shareCode: true,
});

export const insertTripMemberSchema = createInsertSchema(tripMembers).omit({
  joinedAt: true,
});

export const insertItineraryItemSchema = createInsertSchema(itineraryItems).omit({
  createdAt: true,
  bookingStatus: true,
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
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
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
    }[];
  }[];
}
