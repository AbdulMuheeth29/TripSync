import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

/**
 * Middleware to check if the user has access to a trip
 * Requires requireAuth to be called first
 */
export async function requireTripAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const userId = (req as any).userId;
  const tripIdParam = req.params.tripId || req.params.id;
  const tripId = Array.isArray(tripIdParam) ? tripIdParam[0] : tripIdParam;

  if (!userId) {
    return res.status(401).json({
      error: "Authentication required",
      code: "AUTH_REQUIRED"
    });
  }

  if (!tripId) {
    return res.status(400).json({
      error: "Trip ID required",
      code: "TRIP_ID_REQUIRED"
    });
  }

  try {
    // Check if trip exists
    const trip = await storage.getTrip(tripId);
    if (!trip) {
      return res.status(404).json({
        error: "Trip not found",
        code: "TRIP_NOT_FOUND"
      });
    }

    // Check if user is organizer (always has access)
    if (trip.organizerId === userId) {
      // Attach trip info to request
      (req as any).trip = trip;
      (req as any).isOrganizer = true;
      (req as any).isPlanner = true;
      // Create a mock membership for organizer
      (req as any).membership = { userId, role: "organizer", rsvpStatus: "accepted" };
      return next();
    }

    // Check if user is a member
    const members = await storage.getTripMembers(tripId);
    const membership = members.find(
      m => m.userId === userId && m.rsvpStatus === "accepted"
    );

    if (!membership) {
      return res.status(403).json({
        error: "Access denied. You are not a member of this trip.",
        code: "ACCESS_DENIED"
      });
    }

    // Attach trip and membership info to request
    (req as any).trip = trip;
    (req as any).membership = membership;
    (req as any).isOrganizer = trip.organizerId === userId;
    (req as any).isPlanner = membership.role === "planner" || trip.organizerId === userId;

    next();
  } catch (error) {
    console.error("Trip access check error:", error);
    res.status(500).json({
      error: "Failed to verify trip access",
      code: "ACCESS_CHECK_FAILED"
    });
  }
}

/**
 * Middleware to check if the user is the trip organizer
 * Requires requireTripAccess to be called first
 */
export function requireOrganizer(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const isOrganizer = (req as any).isOrganizer;

  if (!isOrganizer) {
    return res.status(403).json({
      error: "Only the trip organizer can perform this action",
      code: "ORGANIZER_REQUIRED"
    });
  }

  next();
}

/**
 * Middleware to check if the user is a planner (organizer or planner role)
 * Requires requireTripAccess to be called first
 */
export function requirePlanner(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const isPlanner = (req as any).isPlanner;

  if (!isPlanner) {
    return res.status(403).json({
      error: "Planner access required",
      code: "PLANNER_REQUIRED"
    });
  }

  next();
}

/**
 * Middleware to check if trip is not locked (or user is planner)
 * Requires requireTripAccess to be called first
 */
export function requireUnlocked(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const trip = (req as any).trip;
  const isPlanner = (req as any).isPlanner;

  if (trip.isLocked && !isPlanner) {
    return res.status(403).json({
      error: "Trip is locked. Only planners can make changes.",
      code: "TRIP_LOCKED"
    });
  }

  next();
}

/**
 * Middleware to check if vote deadline has not passed
 * Requires requireTripAccess to be called first
 */
export function requireBeforeVoteDeadline(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const trip = (req as any).trip;

  if (trip.voteDeadline) {
    const deadline = new Date(trip.voteDeadline);
    const now = new Date();

    if (now > deadline) {
      return res.status(400).json({
        error: "Vote deadline has passed",
        code: "VOTE_DEADLINE_PASSED"
      });
    }
  }

  next();
}
