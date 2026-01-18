import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateItinerary } from "./ai-service";
import { randomUUID } from "crypto";
import type { TripWizardData } from "@shared/schema";

// Simple rate limiting for AI generation
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, name } = req.body;
      
      if (!email || !name) {
        return res.status(400).json({ error: "Email and name are required" });
      }

      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        user = await storage.createUser({
          id: randomUUID(),
          email,
          name,
        });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Trips
  app.get("/api/trips", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;
      
      if (!userId) {
        // Return demo trips for unauthenticated users
        const demoTrips = await storage.getTripsByUserId("demo-user-1");
        const tripsWithCounts = await Promise.all(
          demoTrips.map(async (trip) => {
            const items = await storage.getItineraryItems(trip.id);
            const bookedCount = items.filter((i) => i.bookingStatus === "booked").length;
            return { ...trip, bookedCount, totalItems: items.length };
          })
        );
        return res.json(tripsWithCounts);
      }
      
      const trips = await storage.getTripsByUserId(userId);
      const tripsWithCounts = await Promise.all(
        trips.map(async (trip) => {
          const items = await storage.getItineraryItems(trip.id);
          const bookedCount = items.filter((i) => i.bookingStatus === "booked").length;
          return { ...trip, bookedCount, totalItems: items.length };
        })
      );
      
      res.json(tripsWithCounts);
    } catch (error) {
      console.error("Error fetching trips:", error);
      res.status(500).json({ error: "Failed to fetch trips" });
    }
  });

  app.post("/api/trips", async (req: Request, res: Response) => {
    try {
      const tripData = req.body as TripWizardData & { organizerId: string };
      
      if (!tripData.organizerId || !tripData.destination) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check rate limit
      if (!checkRateLimit(tripData.organizerId)) {
        return res.status(429).json({ error: "Rate limit exceeded. Try again later." });
      }

      const tripId = randomUUID();
      const trip = await storage.createTrip({
        id: tripId,
        organizerId: tripData.organizerId,
        destination: tripData.destination,
        startDate: tripData.startDate,
        endDate: tripData.endDate,
        budgetPerPerson: tripData.budgetPerPerson,
        groupSize: tripData.groupSize,
        vibes: tripData.vibes,
        accommodationPref: tripData.accommodationPref,
        diningPref: tripData.diningPref,
        status: "planning",
      });

      // Generate itinerary in background
      generateItinerary(tripId, tripData).catch((error) => {
        console.error("Error generating itinerary:", error);
      });

      res.status(201).json(trip);
    } catch (error) {
      console.error("Error creating trip:", error);
      res.status(500).json({ error: "Failed to create trip" });
    }
  });

  app.get("/api/trips/:id", async (req: Request, res: Response) => {
    try {
      const tripId = req.params.id;
      const trip = await storage.getTrip(tripId);
      
      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }

      const items = await storage.getItineraryItems(tripId);
      const allComments = await storage.getCommentsByTrip(tripId);
      const allVotes = await storage.getVotesByTrip(tripId);
      const members = await storage.getTripMembers(tripId);
      const expenses = await storage.getExpensesByTrip(tripId);

      // Group comments by item
      const comments: Record<string, typeof allComments> = {};
      allComments.forEach((c) => {
        if (!comments[c.itemId]) comments[c.itemId] = [];
        comments[c.itemId].push(c);
      });

      // Group votes by item and calculate counts
      const votes: Record<string, { up: number; down: number; userVote?: string }> = {};
      allVotes.forEach((v) => {
        if (!votes[v.itemId]) votes[v.itemId] = { up: 0, down: 0 };
        if (v.voteType === "up") votes[v.itemId].up++;
        else votes[v.itemId].down++;
      });

      res.json({
        trip,
        items,
        comments,
        votes,
        members: members.map((m) => ({ ...m.user, role: m.role })),
        expenses,
      });
    } catch (error) {
      console.error("Error fetching trip:", error);
      res.status(500).json({ error: "Failed to fetch trip" });
    }
  });

  app.patch("/api/trips/:id", async (req: Request, res: Response) => {
    try {
      const tripId = req.params.id;
      const updates = req.body;
      
      const trip = await storage.updateTrip(tripId, updates);
      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }
      
      res.json(trip);
    } catch (error) {
      console.error("Error updating trip:", error);
      res.status(500).json({ error: "Failed to update trip" });
    }
  });

  // Join trip
  app.get("/api/trips/join/:code/info", async (req: Request, res: Response) => {
    try {
      const shareCode = req.params.code;
      const trip = await storage.getTripByShareCode(shareCode);
      
      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }
      
      res.json({
        destination: trip.destination,
        startDate: trip.startDate,
        groupSize: trip.groupSize,
      });
    } catch (error) {
      console.error("Error fetching trip info:", error);
      res.status(500).json({ error: "Failed to fetch trip info" });
    }
  });

  app.post("/api/trips/join/:code", async (req: Request, res: Response) => {
    try {
      const shareCode = req.params.code;
      const { userId } = req.body;
      
      const trip = await storage.getTripByShareCode(shareCode);
      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }

      const isMember = await storage.isTripMember(trip.id, userId);
      if (isMember) {
        return res.json({ tripId: trip.id, message: "Already a member" });
      }

      await storage.addTripMember({
        id: randomUUID(),
        tripId: trip.id,
        userId,
        role: "member",
      });

      res.json({ tripId: trip.id, message: "Joined successfully" });
    } catch (error) {
      console.error("Error joining trip:", error);
      res.status(500).json({ error: "Failed to join trip" });
    }
  });

  // Itinerary items
  app.patch("/api/trips/:tripId/items/:itemId", async (req: Request, res: Response) => {
    try {
      const { itemId } = req.params;
      const updates = req.body;
      
      const item = await storage.updateItineraryItem(itemId, updates);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      res.json(item);
    } catch (error) {
      console.error("Error updating item:", error);
      res.status(500).json({ error: "Failed to update item" });
    }
  });

  // Votes
  app.post("/api/trips/:tripId/items/:itemId/vote", async (req: Request, res: Response) => {
    try {
      const { itemId } = req.params;
      const { userId, voteType } = req.body;
      
      if (!userId || !voteType) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const vote = await storage.createOrUpdateVote({
        id: randomUUID(),
        itemId,
        userId,
        voteType,
      });

      res.json(vote);
    } catch (error) {
      console.error("Error voting:", error);
      res.status(500).json({ error: "Failed to vote" });
    }
  });

  // Comments
  app.post("/api/trips/:tripId/items/:itemId/comments", async (req: Request, res: Response) => {
    try {
      const { itemId } = req.params;
      const { userId, content } = req.body;
      
      if (!userId || !content) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const comment = await storage.createComment({
        id: randomUUID(),
        itemId,
        userId,
        content,
      });

      res.json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  // Expenses
  app.post("/api/trips/:tripId/expenses", async (req: Request, res: Response) => {
    try {
      const { tripId } = req.params;
      const { paidByUserId, amount, description, location, splitAmong } = req.body;
      
      if (!paidByUserId || !amount || !description) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const expense = await storage.createExpense({
        id: randomUUID(),
        tripId,
        paidByUserId,
        amount,
        description,
        location: location || null,
        splitAmong,
      });

      res.json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      res.status(500).json({ error: "Failed to create expense" });
    }
  });

  app.patch("/api/trips/:tripId/expenses/:expenseId", async (req: Request, res: Response) => {
    try {
      const { expenseId } = req.params;
      const updates = req.body;
      
      const expense = await storage.updateExpense(expenseId, updates);
      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }
      
      res.json(expense);
    } catch (error) {
      console.error("Error updating expense:", error);
      res.status(500).json({ error: "Failed to update expense" });
    }
  });

  return httpServer;
}
