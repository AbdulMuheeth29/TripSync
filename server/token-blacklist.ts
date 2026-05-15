import { appLogger } from './logger';
import { cache, CacheKeys } from './cache';

/**
 * Token Blacklist Service
 * Handles JWT token revocation for logout and account security
 *
 * IMPLEMENTATION NOTES:
 * - Uses Redis for storage (with in-memory fallback)
 * - Tokens are identified by their JTI (JWT ID) or full token
 * - Expired tokens automatically removed by Redis TTL
 * - Falls back to in-memory storage if Redis unavailable
 */

interface BlacklistedToken {
  token: string;
  userId: string;
  blacklistedAt: Date;
  expiresAt: Date;
  reason: 'logout' | 'security' | 'password_change' | 'manual';
}

class TokenBlacklistService {
  private fallbackBlacklist: Map<string, BlacklistedToken>;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.fallbackBlacklist = new Map();
    this.startCleanupJob();

    appLogger.debug('Token blacklist service initialized (Redis with in-memory fallback)');
  }

  /**
   * Add a token to the blacklist
   */
  async blacklistToken(
    token: string,
    userId: string,
    expiresAt: Date,
    reason: BlacklistedToken['reason'] = 'logout'
  ): Promise<void> {
    const blacklistedToken: BlacklistedToken = {
      token,
      userId,
      blacklistedAt: new Date(),
      expiresAt,
      reason,
    };

    // Calculate TTL in seconds
    const now = new Date();
    const ttl = Math.max(Math.floor((expiresAt.getTime() - now.getTime()) / 1000), 1);

    // Try Redis first
    const cached = await cache.set(CacheKeys.tokenBlacklist(token), blacklistedToken, ttl);

    // Fallback to in-memory if Redis unavailable
    if (!cached) {
      this.fallbackBlacklist.set(token, blacklistedToken);
    }

    appLogger.debug('Token blacklisted', {
      event: 'token_blacklisted',
      userId,
      reason,
      expiresAt: expiresAt.toISOString(),
      storage: cached ? 'redis' : 'in-memory',
    });
  }

  /**
   * Check if a token is blacklisted
   */
  async isBlacklisted(token: string): Promise<boolean> {
    // Try Redis first
    const blacklistedToken = await cache.get<BlacklistedToken>(CacheKeys.tokenBlacklist(token));

    if (blacklistedToken) {
      return true;
    }

    // Fallback to in-memory
    const fallbackToken = this.fallbackBlacklist.get(token);

    if (!fallbackToken) {
      return false;
    }

    // Check if token has expired naturally
    const now = new Date();
    if (now > fallbackToken.expiresAt) {
      // Token expired, remove from fallback blacklist
      this.fallbackBlacklist.delete(token);
      return false;
    }

    return true;
  }

  /**
   * Revoke all tokens for a user
   * Useful for: password change, account compromise, forced logout
   *
   * Note: This marks a timestamp when all tokens before this time are invalid.
   * Individual token blacklisting still works as usual.
   */
  async revokeAllUserTokens(userId: string, reason: BlacklistedToken['reason'] = 'security'): Promise<number> {
    const now = new Date();
    const revokeTimestamp = now.getTime();

    // Store a "revoked_before" timestamp for this user
    // Any token issued before this timestamp is considered revoked
    // TTL: 7 days (typical JWT expiration)
    await cache.set(`user:${userId}:revoked_before`, revokeTimestamp, 7 * 24 * 60 * 60);

    // Also check fallback storage
    let count = 0;
    for (const [token, data] of Array.from(this.fallbackBlacklist.entries())) {
      if (data.userId === userId && now <= data.expiresAt) {
        this.fallbackBlacklist.set(token, {
          ...data,
          reason,
          blacklistedAt: now,
        });
        count++;
      }
    }

    appLogger.debug('All user tokens revoked', {
      event: 'all_user_tokens_revoked',
      userId,
      count,
      reason,
    });
    return count;
  }

  /**
   * Remove a token from the blacklist (rare, for testing/admin)
   */
  async removeFromBlacklist(token: string): Promise<boolean> {
    const redisDeleted = await cache.del(CacheKeys.tokenBlacklist(token));
    const fallbackExisted = this.fallbackBlacklist.has(token);
    this.fallbackBlacklist.delete(token);

    const existed = redisDeleted || fallbackExisted;

    if (existed) {
      appLogger.debug('Token removed from blacklist', { token: token.substring(0, 10) + '...' });
    }

    return existed;
  }

  /**
   * Get blacklist statistics
   */
  async getStats(): Promise<{
    totalBlacklisted: number;
    activeBlacklisted: number;
    expiredTokens: number;
    storage: 'redis' | 'in-memory' | 'mixed';
  }> {
    const now = new Date();
    let active = 0;
    let expired = 0;

    // Check fallback storage
    for (const token of Array.from(this.fallbackBlacklist.values())) {
      if (now <= token.expiresAt) {
        active++;
      } else {
        expired++;
      }
    }

    // Note: Redis automatically handles expiration via TTL
    // so we don't need to track expired tokens there
    const storage = cache.isEnabled()
      ? (this.fallbackBlacklist.size > 0 ? 'mixed' : 'redis')
      : 'in-memory';

    return {
      totalBlacklisted: this.fallbackBlacklist.size,
      activeBlacklisted: active,
      expiredTokens: expired,
      storage,
    };
  }

  /**
   * Clean up expired tokens (only needed for fallback storage)
   * Redis handles expiration automatically via TTL
   */
  private async cleanup(): Promise<number> {
    const now = new Date();
    let cleaned = 0;

    // Only clean fallback storage (Redis auto-expires)
    for (const [token, data] of Array.from(this.fallbackBlacklist.entries())) {
      if (now > data.expiresAt) {
        this.fallbackBlacklist.delete(token);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      appLogger.debug('Cleaned up expired blacklisted tokens from fallback storage', { count: cleaned });
    }

    return cleaned;
  }

  /**
   * Start periodic cleanup job (runs every 5 minutes)
   */
  private startCleanupJob(): void {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(async () => {
      try {
        await this.cleanup();
      } catch (error) {
        appLogger.error(
          error instanceof Error ? error : new Error(String(error)),
          { context: 'token_blacklist_cleanup' }
        );
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Stop cleanup job (for graceful shutdown)
   */
  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    await this.cleanup();
    appLogger.debug('Token blacklist service shut down');
  }

  /**
   * Clear all blacklisted tokens (testing/admin only)
   */
  async clear(): Promise<void> {
    // Clear Redis pattern
    await cache.delPattern('blacklist:*');

    // Clear fallback storage
    this.fallbackBlacklist.clear();

    appLogger.warn('Token blacklist cleared', { context: 'admin' });
  }
}

// Export singleton instance
export const tokenBlacklist = new TokenBlacklistService();

/**
 * Enhanced authentication middleware that checks blacklist
 * Use this instead of requireAuth for enhanced security
 */
import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from './auth';

export function requireAuthWithBlacklist(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
  }

  const token = authHeader.substring(7);

  // Async authentication checks
  (async () => {
    // Verify token signature and expiration first
    const payload = verifyToken(token);

    if (!payload) {
      return res.status(401).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN',
      });
    }

    // Check if this specific token is blacklisted
    const isBlacklisted = await tokenBlacklist.isBlacklisted(token);

    if (isBlacklisted) {
      appLogger.warn('Blacklisted token used', {
        userId: payload.userId,
        token: token.substring(0, 10) + '...',
      });

      return res.status(401).json({
        error: 'Token has been revoked. Please log in again.',
        code: 'TOKEN_REVOKED',
      });
    }

    // Check if all user tokens were revoked after this token was issued
    const revokedBefore = await cache.get<number>(`user:${payload.userId}:revoked_before`);

    if (revokedBefore && payload.iat && payload.iat * 1000 < revokedBefore) {
      appLogger.warn('Token issued before revocation timestamp', {
        userId: payload.userId,
        tokenIat: payload.iat,
        revokedBefore,
      });

      return res.status(401).json({
        error: 'All sessions have been revoked. Please log in again.',
        code: 'TOKEN_REVOKED',
      });
    }

    // Attach user info and token to request
    (req as any).userId = payload.userId;
    (req as any).userEmail = payload.email;
    (req as any).token = token;

    next();
  })().catch((error) => {
    appLogger.error(error instanceof Error ? error : new Error(String(error)), {
      context: 'auth_blacklist_check',
    });

    return res.status(500).json({
      error: 'Authentication check failed',
      code: 'SERVER_ERROR',
    });
  });
}

/**
 * Utility: Get token from request
 */
export function getTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.substring(7);
}
