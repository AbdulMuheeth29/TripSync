import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import {
  requireOrganizer,
  requirePlanner,
  requireUnlocked,
  requireBeforeVoteDeadline,
} from '../server/middleware';

describe('Middleware', () => {
  describe('requireOrganizer', () => {
    it('should allow access for organizer', () => {
      const req = { isOrganizer: true } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;
      const next = vi.fn();

      requireOrganizer(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access for non-organizer', () => {
      const req = { isOrganizer: false } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;
      const next = vi.fn();

      requireOrganizer(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'ORGANIZER_REQUIRED',
        })
      );
    });
  });

  describe('requirePlanner', () => {
    it('should allow access for planner', () => {
      const req = { isPlanner: true } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;
      const next = vi.fn();

      requirePlanner(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access for non-planner', () => {
      const req = { isPlanner: false } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;
      const next = vi.fn();

      requirePlanner(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'PLANNER_REQUIRED',
        })
      );
    });
  });

  describe('requireUnlocked', () => {
    it('should allow access for unlocked trip', () => {
      const req = {
        trip: { isLocked: false },
        isPlanner: false,
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;
      const next = vi.fn();

      requireUnlocked(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow planner access to locked trip', () => {
      const req = {
        trip: { isLocked: true },
        isPlanner: true,
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;
      const next = vi.fn();

      requireUnlocked(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny non-planner access to locked trip', () => {
      const req = {
        trip: { isLocked: true },
        isPlanner: false,
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;
      const next = vi.fn();

      requireUnlocked(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'TRIP_LOCKED',
        })
      );
    });
  });

  describe('requireBeforeVoteDeadline', () => {
    it('should allow access when no deadline is set', () => {
      const req = {
        trip: { voteDeadline: null },
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;
      const next = vi.fn();

      requireBeforeVoteDeadline(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow access before deadline', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 days from now

      const req = {
        trip: { voteDeadline: futureDate.toISOString() },
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;
      const next = vi.fn();

      requireBeforeVoteDeadline(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access after deadline', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7); // 7 days ago

      const req = {
        trip: { voteDeadline: pastDate.toISOString() },
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;
      const next = vi.fn();

      requireBeforeVoteDeadline(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'VOTE_DEADLINE_PASSED',
        })
      );
    });
  });
});
