import { eq, and, inArray, asc, desc, sql } from "drizzle-orm";
import type { IStorage } from "./storage";
import { cache, CacheKeys, CacheTTL } from "./cache";
import type {
  User,
  InsertUser,
  Trip,
  InsertTrip,
  TripMember,
  InsertTripMember,
  ItineraryItem,
  InsertItineraryItem,
  Comment,
  InsertComment,
  Vote,
  InsertVote,
  Expense,
  InsertExpense,
  TripInvite,
  InsertTripInvite,
  MemberPreference,
  InsertMemberPreference,
  ChatMessage,
  InsertChatMessage,
  TripPhoto,
  InsertTripPhoto,
  Poll,
  InsertPoll,
  PollVote,
  InsertPollVote,
  PackingItem,
  InsertPackingItem,
  TransportationEntry,
  InsertTransportationEntry,
  GroupAvailability,
  InsertGroupAvailability,
  TripDocument,
  InsertTripDocument,
  EmergencyContact,
  InsertEmergencyContact,
  MoodBoardItem,
  InsertMoodBoardItem,
  UserLearnedPreferences,
  InsertUserLearnedPreferences,
  TripSatisfaction,
  InsertTripSatisfaction,
  LocationSharing,
  InsertLocationSharing,
} from "@shared/schema";
import {
  users,
  trips,
  tripMembers,
  itineraryItems,
  comments,
  votes,
  expenses,
  tripInvites,
  memberPreferences,
  chatMessages,
  tripPhotos,
  polls,
  pollVotes,
  packingItems,
  transportationEntries,
  groupAvailability,
  tripDocuments,
  emergencyContacts,
  moodBoardItems,
  userLearnedPreferences,
  tripSatisfaction,
  locationSharing,
} from "@shared/schema";
import type { Db } from "./db";

export function createPgStorage(db: Db): IStorage {
  return {
    async getUser(id: string) {
      const result = await cache.getOrSet(
        CacheKeys.user(id),
        async () => {
          const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
          return rows[0] as User | undefined;
        },
        CacheTTL.MEDIUM
      );
      return result ?? undefined;
    },

    async getUserById(id: string) {
      const result = await cache.getOrSet(
        CacheKeys.user(id),
        async () => {
          const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
          return rows[0] as User | undefined;
        },
        CacheTTL.MEDIUM
      );
      return result ?? undefined;
    },

    async getUserByEmail(email: string) {
      const result = await cache.getOrSet(
        `user:email:${email}`,
        async () => {
          const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
          return rows[0] as User | undefined;
        },
        CacheTTL.MEDIUM
      );
      return result ?? undefined;
    },

    async createUser(user: InsertUser) {
      const [row] = await db.insert(users).values(user as typeof users.$inferInsert).returning();
      return row as User;
    },

    async updateUser(id: string, updates: Partial<User>) {
      const [row] = await db.update(users).set(updates).where(eq(users.id, id)).returning();

      // Invalidate user cache
      await cache.del(CacheKeys.user(id));
      if (row && row.email) {
        await cache.del(`user:email:${row.email}`);
      }

      return row as User | undefined;
    },

    async getTrip(id: string) {
      const result = await cache.getOrSet(
        CacheKeys.trip(id),
        async () => {
          const rows = await db.select().from(trips).where(eq(trips.id, id)).limit(1);
          return rows[0] as Trip | undefined;
        },
        CacheTTL.SHORT // 2 minutes for trip data
      );
      return result ?? undefined;
    },

    async getTripByShareCode(code: string) {
      const rows = await db.select().from(trips).where(eq(trips.shareCode, code)).limit(1);
      return rows[0] as Trip | undefined;
    },

    async getTripsByUserId(userId: string) {
      const memberRows = await db.select().from(tripMembers).where(eq(tripMembers.userId, userId));
      const memberTripIds = new Set(memberRows.map((m) => m.tripId));
      const allTrips = await db.select().from(trips);
      return allTrips.filter(
        (t) => t.organizerId === userId || memberTripIds.has(t.id)
      ) as Trip[];
    },

    async createTrip(trip: InsertTrip) {
      const shareCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const [tripRow] = await db
        .insert(trips)
        .values({ ...trip, shareCode } as typeof trips.$inferInsert)
        .returning();
      if (!tripRow) throw new Error("Failed to create trip");
      await db.insert(tripMembers).values({
        id: crypto.randomUUID(),
        tripId: tripRow.id,
        userId: trip.organizerId,
        role: "organizer",
        rsvpStatus: "accepted",
      } as typeof tripMembers.$inferInsert);
      return tripRow as Trip;
    },

    async updateTrip(id: string, updates: Partial<Trip>) {
      const [row] = await db.update(trips).set(updates).where(eq(trips.id, id)).returning();

      // Invalidate trip cache
      await cache.del(CacheKeys.trip(id));
      await cache.del(CacheKeys.tripMembers(id));

      return row as Trip | undefined;
    },

    async getTripMembers(tripId: string) {
      const result = await cache.getOrSet(
        CacheKeys.tripMembers(tripId),
        async () => {
          const members = await db.select().from(tripMembers).where(eq(tripMembers.tripId, tripId));
          const userIds = members.map((m) => m.userId);
          if (userIds.length === 0) return [];
          const userRows = await db.select().from(users).where(inArray(users.id, userIds));
          const userMap = new Map(userRows.map((u) => [u.id, u]));
          return members.map((m) => ({
            ...m,
            user: userMap.get(m.userId)!,
          })) as (TripMember & { user: User })[];
        },
        CacheTTL.SHORT // 2 minutes for trip members
      );
      return result ?? [];
    },

    async addTripMember(member: InsertTripMember) {
      const [row] = await db.insert(tripMembers).values({ ...member, rsvpStatus: "accepted" } as typeof tripMembers.$inferInsert).returning();
      if (!row) throw new Error("Failed to add member");

      // Invalidate trip members cache
      await cache.del(CacheKeys.tripMembers(member.tripId));

      return row as TripMember;
    },

    async updateTripMember(id: string, updates: Partial<TripMember>) {
      const [row] = await db.update(tripMembers).set(updates).where(eq(tripMembers.id, id)).returning();

      // Invalidate trip members cache
      if (row) {
        await cache.del(CacheKeys.tripMembers(row.tripId));
      }

      return row as TripMember | undefined;
    },

    async getTripMemberById(id: string) {
      const rows = await db.select().from(tripMembers).where(eq(tripMembers.id, id)).limit(1);
      return rows[0] as TripMember | undefined;
    },

    async deleteTripMember(id: string) {
      const result = await db.delete(tripMembers).where(eq(tripMembers.id, id)).returning();
      if (result[0]) {
        await cache.del(CacheKeys.tripMembers(result[0].tripId));
      }
    },

    async isTripMember(tripId: string, userId: string) {
      const rows = await db
        .select()
        .from(tripMembers)
        .where(and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, userId)))
        .limit(1);
      return rows.length > 0;
    },

    async getItineraryItems(tripId: string) {
      return db.select().from(itineraryItems).where(eq(itineraryItems.tripId, tripId)) as Promise<ItineraryItem[]>;
    },

    async createItineraryItem(item: InsertItineraryItem) {
      const [row] = await db
        .insert(itineraryItems)
        .values({ ...item, bookingStatus: "not_started" } as typeof itineraryItems.$inferInsert)
        .returning();
      if (!row) throw new Error("Failed to create itinerary item");
      return row as ItineraryItem;
    },

    async updateItineraryItem(id: string, updates: Partial<ItineraryItem>) {
      const [row] = await db.update(itineraryItems).set(updates).where(eq(itineraryItems.id, id)).returning();
      return row as ItineraryItem | undefined;
    },

    async deleteItineraryItem(id: string) {
      await db.delete(itineraryItems).where(eq(itineraryItems.id, id));
    },

    async deleteItineraryItemsByTripId(tripId: string) {
      await db.delete(itineraryItems).where(eq(itineraryItems.tripId, tripId));
    },

    async getCommentsByItem(itemId: string) {
      return db.select().from(comments).where(eq(comments.itemId, itemId)) as Promise<Comment[]>;
    },

    async getCommentsByTrip(tripId: string) {
      const items = await db.select({ id: itineraryItems.id }).from(itineraryItems).where(eq(itineraryItems.tripId, tripId));
      const itemIds = items.map((i) => i.id);
      if (itemIds.length === 0) return [];
      return db.select().from(comments).where(inArray(comments.itemId, itemIds)) as Promise<Comment[]>;
    },

    async createComment(comment: InsertComment) {
      const [row] = await db.insert(comments).values(comment as typeof comments.$inferInsert).returning();
      if (!row) throw new Error("Failed to create comment");
      return row as Comment;
    },

    async getCommentById(id: string) {
      const rows = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
      return rows[0] as Comment | undefined;
    },

    async deleteComment(id: string) {
      await db.delete(comments).where(eq(comments.id, id));
    },

    async getVotesByItem(itemId: string) {
      return db.select().from(votes).where(eq(votes.itemId, itemId)) as Promise<Vote[]>;
    },

    async getVotesByTrip(tripId: string) {
      const items = await db.select({ id: itineraryItems.id }).from(itineraryItems).where(eq(itineraryItems.tripId, tripId));
      const itemIds = items.map((i) => i.id);
      if (itemIds.length === 0) return [];
      return db.select().from(votes).where(inArray(votes.itemId, itemIds)) as Promise<Vote[]>;
    },

    async createOrUpdateVote(vote: InsertVote) {
      const existing = await db
        .select()
        .from(votes)
        .where(and(eq(votes.itemId, vote.itemId), eq(votes.userId, vote.userId)))
        .limit(1);
      if (existing.length > 0) {
        const [row] = await db
          .update(votes)
          .set({ voteType: vote.voteType })
          .where(eq(votes.id, existing[0].id))
          .returning();
        return row as Vote;
      }
      const [row] = await db.insert(votes).values(vote as typeof votes.$inferInsert).returning();
      if (!row) throw new Error("Failed to create vote");
      return row as Vote;
    },

    async getExpensesByTrip(tripId: string) {
      return db.select().from(expenses).where(eq(expenses.tripId, tripId)) as Promise<Expense[]>;
    },

    async createExpense(expense: InsertExpense) {
      const [row] = await db.insert(expenses).values({ ...expense, isSettled: false } as typeof expenses.$inferInsert).returning();
      if (!row) throw new Error("Failed to create expense");
      return row as Expense;
    },

    async updateExpense(id: string, updates: Partial<Expense>) {
      const [row] = await db.update(expenses).set(updates).where(eq(expenses.id, id)).returning();
      return row as Expense | undefined;
    },

    async deleteExpense(id: string) {
      const result = await db.delete(expenses).where(eq(expenses.id, id)).returning();
      return result.length > 0;
    },

    async getInvitesByTrip(tripId: string) {
      return db.select().from(tripInvites).where(eq(tripInvites.tripId, tripId)) as Promise<TripInvite[]>;
    },

    async getInviteById(id: string) {
      const [row] = await db.select().from(tripInvites).where(eq(tripInvites.id, id)).limit(1);
      return row as TripInvite | undefined;
    },

    async updateInvite(id: string, updates: Partial<Pick<TripInvite, "status">>) {
      const [row] = await db.update(tripInvites).set(updates).where(eq(tripInvites.id, id)).returning();
      return row as TripInvite | undefined;
    },

    async createInvite(invite: InsertTripInvite) {
      const [row] = await db.insert(tripInvites).values(invite as typeof tripInvites.$inferInsert).returning();
      if (!row) throw new Error("Failed to create invite");
      return row as TripInvite;
    },

    async getPreferencesByTrip(tripId: string) {
      const prefs = await db.select().from(memberPreferences).where(eq(memberPreferences.tripId, tripId));
      if (prefs.length === 0) return [];
      const userIds = prefs.map((p) => p.userId);
      const userRows = await db.select().from(users).where(inArray(users.id, userIds));
      const userMap = new Map(userRows.map((u) => [u.id, u]));
      return prefs.map((p) => ({ ...p, user: userMap.get(p.userId)! })) as (MemberPreference & { user: User })[];
    },

    async getPreference(tripId: string, userId: string) {
      const rows = await db
        .select()
        .from(memberPreferences)
        .where(and(eq(memberPreferences.tripId, tripId), eq(memberPreferences.userId, userId)))
        .limit(1);
      return rows[0] as MemberPreference | undefined;
    },

    async createOrUpdatePreference(pref: InsertMemberPreference) {
      const existing = await db
        .select()
        .from(memberPreferences)
        .where(and(eq(memberPreferences.tripId, pref.tripId), eq(memberPreferences.userId, pref.userId)))
        .limit(1);
      const data = {
        id: existing[0]?.id ?? pref.id,
        tripId: pref.tripId,
        userId: pref.userId,
        budgetBand: pref.budgetBand ?? existing[0]?.budgetBand ?? null,
        pace: pref.pace ?? existing[0]?.pace ?? null,
        diet: pref.diet ?? existing[0]?.diet ?? null,
        budgetFlexibility: pref.budgetFlexibility ?? existing[0]?.budgetFlexibility ?? null,
        mustDoActivities: pref.mustDoActivities ?? existing[0]?.mustDoActivities ?? null,
        accessibility: pref.accessibility ?? existing[0]?.accessibility ?? null,
      };
      if (existing.length > 0) {
        const [row] = await db
          .update(memberPreferences)
          .set(data)
          .where(eq(memberPreferences.id, existing[0].id))
          .returning();
        return row as MemberPreference;
      }
      const [row] = await db.insert(memberPreferences).values(data as typeof memberPreferences.$inferInsert).returning();
      if (!row) throw new Error("Failed to create preference");
      return row as MemberPreference;
    },

    async getChatMessagesByTrip(tripId: string) {
      const messages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.tripId, tripId))
        .orderBy(asc(chatMessages.createdAt));
      if (messages.length === 0) return [];
      const userIds = Array.from(new Set(messages.map((m) => m.userId)));
      const userRows = await db.select().from(users).where(inArray(users.id, userIds));
      const userMap = new Map(userRows.map((u) => [u.id, u]));
      return messages.map((m) => ({ ...m, user: userMap.get(m.userId)! })) as (ChatMessage & { user: User })[];
    },

    async createChatMessage(msg: InsertChatMessage) {
      const [row] = await db.insert(chatMessages).values(msg as typeof chatMessages.$inferInsert).returning();
      if (!row) throw new Error("Failed to create chat message");
      return row as ChatMessage;
    },

    async getPhotosByTrip(tripId: string) {
      const photos = await db.select().from(tripPhotos).where(eq(tripPhotos.tripId, tripId)).orderBy(desc(tripPhotos.createdAt));
      if (photos.length === 0) return [];
      const userIds = Array.from(new Set(photos.map((p) => p.userId)));
      const userRows = await db.select().from(users).where(inArray(users.id, userIds));
      const userMap = new Map(userRows.map((u) => [u.id, u]));
      return photos.map((p) => ({ ...p, user: userMap.get(p.userId)! })) as (TripPhoto & { user: User })[];
    },

    async createTripPhoto(photo: InsertTripPhoto) {
      const [row] = await db.insert(tripPhotos).values(photo as typeof tripPhotos.$inferInsert).returning();
      if (!row) throw new Error("Failed to add photo");
      return row as TripPhoto;
    },

    async deleteTripPhoto(id: string) {
      await db.delete(tripPhotos).where(eq(tripPhotos.id, id));
    },

    async getPollsByTrip(tripId: string) {
      const list = await db.select().from(polls).where(eq(polls.tripId, tripId));
      if (list.length === 0) return [];
      const userIds = Array.from(new Set(list.map((p) => p.createdByUserId)));
      const userRows = await db.select().from(users).where(inArray(users.id, userIds));
      const userMap = new Map(userRows.map((u) => [u.id, u]));
      return list.map((p) => ({ ...p, createdBy: userMap.get(p.createdByUserId)! })) as (Poll & { createdBy: User })[];
    },

    async createPoll(poll: InsertPoll) {
      const [row] = await db.insert(polls).values(poll as typeof polls.$inferInsert).returning();
      if (!row) throw new Error("Failed to create poll");
      return row as Poll;
    },

    async deletePoll(id: string) {
      await db.delete(pollVotes).where(eq(pollVotes.pollId, id));
      await db.delete(polls).where(eq(polls.id, id));
    },

    async getPollVotes(pollId: string) {
      return db.select().from(pollVotes).where(eq(pollVotes.pollId, pollId)) as Promise<PollVote[]>;
    },

    async createOrUpdatePollVote(vote: InsertPollVote) {
      const existing = await db.select().from(pollVotes).where(and(eq(pollVotes.pollId, vote.pollId), eq(pollVotes.userId, vote.userId))).limit(1);
      if (existing.length > 0) {
        const [row] = await db.update(pollVotes).set({ optionIndex: vote.optionIndex }).where(eq(pollVotes.id, existing[0].id)).returning();
        return row as PollVote;
      }
      const [row] = await db.insert(pollVotes).values(vote as typeof pollVotes.$inferInsert).returning();
      if (!row) throw new Error("Failed to vote");
      return row as PollVote;
    },

    async getPackingByTrip(tripId: string) {
      const list = await db.select().from(packingItems).where(eq(packingItems.tripId, tripId));
      if (list.length === 0) return [];
      const userIds = Array.from(new Set(list.map((p) => p.assignedToUserId).filter(Boolean))) as string[];
      if (userIds.length === 0) return list as (PackingItem & { assignedTo?: User })[];
      const userRows = await db.select().from(users).where(inArray(users.id, userIds));
      const userMap = new Map(userRows.map((u) => [u.id, u]));
      return list.map((p) => ({ ...p, assignedTo: p.assignedToUserId ? userMap.get(p.assignedToUserId) : undefined })) as (PackingItem & { assignedTo?: User })[];
    },

    async createPackingItem(item: InsertPackingItem) {
      const [row] = await db.insert(packingItems).values(item as typeof packingItems.$inferInsert).returning();
      if (!row) throw new Error("Failed to add packing item");
      return row as PackingItem;
    },

    async updatePackingItem(id: string, updates: Partial<PackingItem>) {
      const [row] = await db.update(packingItems).set(updates).where(eq(packingItems.id, id)).returning();
      return row as PackingItem | undefined;
    },

    async deletePackingItem(id: string) {
      await db.delete(packingItems).where(eq(packingItems.id, id));
    },

    async getTransportationByTrip(tripId: string) {
      const list = await db.select().from(transportationEntries).where(eq(transportationEntries.tripId, tripId));
      if (list.length === 0) return [];
      const userIds = Array.from(new Set(list.map((t) => t.driverUserId).filter(Boolean))) as string[];
      if (userIds.length === 0) return list as (TransportationEntry & { driver?: User })[];
      const userRows = await db.select().from(users).where(inArray(users.id, userIds));
      const userMap = new Map(userRows.map((u) => [u.id, u]));
      return list.map((t) => ({ ...t, driver: t.driverUserId ? userMap.get(t.driverUserId) : undefined })) as (TransportationEntry & { driver?: User })[];
    },

    async createTransportationEntry(entry: InsertTransportationEntry) {
      const [row] = await db.insert(transportationEntries).values(entry as typeof transportationEntries.$inferInsert).returning();
      if (!row) throw new Error("Failed to add transportation");
      return row as TransportationEntry;
    },

    async updateTransportationEntry(id: string, updates: Partial<TransportationEntry>) {
      const [row] = await db.update(transportationEntries).set(updates).where(eq(transportationEntries.id, id)).returning();
      return row as TransportationEntry | undefined;
    },

    async deleteTransportationEntry(id: string) {
      await db.delete(transportationEntries).where(eq(transportationEntries.id, id));
    },

    async getGroupAvailabilityByTrip(tripId: string) {
      const list = await db.select().from(groupAvailability).where(eq(groupAvailability.tripId, tripId));
      if (list.length === 0) return [];
      const userIds = list.map((a) => a.userId);
      const userRows = await db.select().from(users).where(inArray(users.id, userIds));
      const userMap = new Map(userRows.map((u) => [u.id, u]));
      return list.map((a) => ({ ...a, user: userMap.get(a.userId)! })) as (GroupAvailability & { user: User })[];
    },

    async setUserAvailability(tripId: string, userId: string, availableDates: string[]) {
      const existing = await db.select().from(groupAvailability).where(and(eq(groupAvailability.tripId, tripId), eq(groupAvailability.userId, userId))).limit(1);
      if (existing.length > 0) {
        const [row] = await db.update(groupAvailability).set({ availableDates }).where(eq(groupAvailability.id, existing[0].id)).returning();
        return row as GroupAvailability;
      }
      const id = crypto.randomUUID();
      const [row] = await db.insert(groupAvailability).values({ id, tripId, userId, availableDates } as typeof groupAvailability.$inferInsert).returning();
      if (!row) throw new Error("Failed to set availability");
      return row as GroupAvailability;
    },

    async getDocumentsByTrip(tripId: string) {
      const list = await db.select().from(tripDocuments).where(eq(tripDocuments.tripId, tripId));
      if (list.length === 0) return [];
      const userIds = Array.from(new Set(list.map((d) => d.uploadedByUserId)));
      const userRows = await db.select().from(users).where(inArray(users.id, userIds));
      const userMap = new Map(userRows.map((u) => [u.id, u]));
      return list.map((d) => ({ ...d, uploadedBy: userMap.get(d.uploadedByUserId) })) as (TripDocument & { uploadedBy?: User })[];
    },

    async createTripDocument(doc: InsertTripDocument) {
      const id = doc.id ?? crypto.randomUUID();
      const [row] = await db.insert(tripDocuments).values({ ...doc, id } as typeof tripDocuments.$inferInsert).returning();
      if (!row) throw new Error("Failed to create document");
      return row as TripDocument;
    },

    async updateTripDocument(id: string, updates: Partial<TripDocument>) {
      const [row] = await db.update(tripDocuments).set(updates).where(eq(tripDocuments.id, id)).returning();
      return row as TripDocument | undefined;
    },

    async deleteTripDocument(id: string) {
      await db.delete(tripDocuments).where(eq(tripDocuments.id, id));
    },

    async getEmergencyContactsByTrip(tripId: string) {
      return db.select().from(emergencyContacts).where(eq(emergencyContacts.tripId, tripId)) as Promise<EmergencyContact[]>;
    },

    async createEmergencyContact(contact: InsertEmergencyContact) {
      const id = contact.id ?? crypto.randomUUID();
      const [row] = await db.insert(emergencyContacts).values({ ...contact, id } as typeof emergencyContacts.$inferInsert).returning();
      if (!row) throw new Error("Failed to create emergency contact");
      return row as EmergencyContact;
    },

    async updateEmergencyContact(id: string, updates: Partial<EmergencyContact>) {
      const [row] = await db.update(emergencyContacts).set(updates).where(eq(emergencyContacts.id, id)).returning();
      return row as EmergencyContact | undefined;
    },

    async deleteEmergencyContact(id: string) {
      await db.delete(emergencyContacts).where(eq(emergencyContacts.id, id));
    },

    async getMoodBoardByTrip(tripId: string) {
      const list = await db.select().from(moodBoardItems).where(eq(moodBoardItems.tripId, tripId));
      if (list.length === 0) return [];
      const userIds = Array.from(new Set(list.map((m) => m.addedByUserId)));
      const userRows = await db.select().from(users).where(inArray(users.id, userIds));
      const userMap = new Map(userRows.map((u) => [u.id, u]));
      return list.map((m) => ({ ...m, addedBy: userMap.get(m.addedByUserId) })) as (MoodBoardItem & { addedBy?: User })[];
    },

    async createMoodBoardItem(item: InsertMoodBoardItem) {
      const id = item.id ?? crypto.randomUUID();
      const [row] = await db.insert(moodBoardItems).values({ ...item, id } as typeof moodBoardItems.$inferInsert).returning();
      if (!row) throw new Error("Failed to create mood board item");
      return row as MoodBoardItem;
    },

    async deleteMoodBoardItem(id: string) {
      await db.delete(moodBoardItems).where(eq(moodBoardItems.id, id));
    },

    async getUserLearnedPreferences(userId: string) {
      const [row] = await db.select().from(userLearnedPreferences).where(eq(userLearnedPreferences.userId, userId)).limit(1);
      return row as UserLearnedPreferences | undefined;
    },

    async createOrUpdateUserLearnedPreferences(pref: InsertUserLearnedPreferences) {
      const existing = await db.select().from(userLearnedPreferences).where(eq(userLearnedPreferences.userId, pref.userId)).limit(1);
      const id = existing[0]?.id ?? pref.id ?? crypto.randomUUID();
      const values = { ...pref, id, updatedAt: new Date() };
      if (existing.length > 0) {
        const [row] = await db.update(userLearnedPreferences).set(values).where(eq(userLearnedPreferences.id, existing[0].id)).returning();
        return row as UserLearnedPreferences;
      }
      const [row] = await db.insert(userLearnedPreferences).values(values as typeof userLearnedPreferences.$inferInsert).returning();
      if (!row) throw new Error("Failed to save learned preferences");
      return row as UserLearnedPreferences;
    },

    async getSatisfactionByTrip(tripId: string) {
      const list = await db.select().from(tripSatisfaction).where(eq(tripSatisfaction.tripId, tripId));
      if (list.length === 0) return [];
      const userIds = list.map((s) => s.userId);
      const userRows = await db.select().from(users).where(inArray(users.id, userIds));
      const userMap = new Map(userRows.map((u) => [u.id, u]));
      return list.map((s) => ({ ...s, user: userMap.get(s.userId)! })) as (TripSatisfaction & { user: User })[];
    },

    async createOrUpdateTripSatisfaction(entry: InsertTripSatisfaction) {
      const existing = await db.select().from(tripSatisfaction).where(and(eq(tripSatisfaction.tripId, entry.tripId), eq(tripSatisfaction.userId, entry.userId))).limit(1);
      const id = existing[0]?.id ?? entry.id ?? crypto.randomUUID();
      const values = { ...entry, id };
      if (existing.length > 0) {
        const [row] = await db.update(tripSatisfaction).set({ score: entry.score, comment: entry.comment ?? null }).where(eq(tripSatisfaction.id, existing[0].id)).returning();
        return row as TripSatisfaction;
      }
      const [row] = await db.insert(tripSatisfaction).values(values as typeof tripSatisfaction.$inferInsert).returning();
      if (!row) throw new Error("Failed to save satisfaction");
      return row as TripSatisfaction;
    },

    async getLocationSharingByTrip(tripId: string) {
      const list = await db.select().from(locationSharing).where(eq(locationSharing.tripId, tripId));
      if (list.length === 0) return [];
      const userIds = list.map((l) => l.userId);
      const userRows = await db.select().from(users).where(inArray(users.id, userIds));
      const userMap = new Map(userRows.map((u) => [u.id, u]));
      return list.map((l) => ({ ...l, user: userMap.get(l.userId)! })) as (LocationSharing & { user: User })[];
    },

    async setUserLocation(tripId: string, userId: string, lat: string, lng: string) {
      const existing = await db.select().from(locationSharing).where(and(eq(locationSharing.tripId, tripId), eq(locationSharing.userId, userId))).limit(1);
      const id = existing[0]?.id ?? crypto.randomUUID();
      const values = { id, tripId, userId, lat, lng, updatedAt: new Date() };
      if (existing.length > 0) {
        const [row] = await db.update(locationSharing).set({ lat, lng, updatedAt: new Date() }).where(eq(locationSharing.id, existing[0].id)).returning();
        return row as LocationSharing;
      }
      const [row] = await db.insert(locationSharing).values(values as typeof locationSharing.$inferInsert).returning();
      if (!row) throw new Error("Failed to set location");
      return row as LocationSharing;
    },

    async getAdminMetricsCounts() {
      const [u] = await db.select({ c: sql<number>`cast(count(*) as int)` }).from(users);
      const [t] = await db.select({ c: sql<number>`cast(count(*) as int)` }).from(trips);
      const [i] = await db.select({ c: sql<number>`cast(count(*) as int)` }).from(itineraryItems);
      const [m] = await db.select({ c: sql<number>`cast(count(*) as int)` }).from(chatMessages);
      const [mem] = await db.select({ c: sql<number>`cast(count(*) as int)` }).from(tripMembers);
      return {
        totalUsers: u?.c ?? 0,
        totalTrips: t?.c ?? 0,
        totalItineraryItems: i?.c ?? 0,
        totalChatMessages: m?.c ?? 0,
        totalMembers: mem?.c ?? 0,
      };
    },
  };
}
