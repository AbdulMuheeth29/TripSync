import { Request, Response, NextFunction } from 'express';
import { cache } from './cache';
import { appLogger } from './logger';

/**
 * Rate Limiting Middleware
 * Uses Redis for distributed rate limiting with fallback to in-memory storage
 *
 * Features:
 * - Per-IP and per-user rate limiting
 * - Configurable window and max attempts
 * - Redis-backed for production (distributed)
 * - In-memory fallback for development
 * - Standard RateLimit headers (X-RateLimit-*)
 */

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum requests per window
  message?: string; // Error message
  keyPrefix: string; // Redis key prefix (e.g., "ratelimit:login")
  skipFailedRequests?: boolean; // Don't count failed requests
  skipSuccessfulRequests?: boolean; // Don't count successful requests
}

// In-memory fallback store (used when Redis unavailable)
const inMemoryStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Clean up expired in-memory rate limit entries
 */
function cleanupInMemoryStore() {
  const now = Date.now();
  for (const [key, value] of Array.from(inMemoryStore.entries())) {
    if (value.resetAt < now) {
      inMemoryStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupInMemoryStore, 5 * 60 * 1000);

/**
 * Get rate limit key for request
 * Uses user ID if authenticated, otherwise uses IP address
 */
function getRateLimitKey(req: Request, keyPrefix: string): string {
  const userId = (req as any).userId;

  if (userId) {
    return `${keyPrefix}:user:${userId}`;
  }

  // Get IP address (handles proxies)
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    'unknown';

  return `${keyPrefix}:ip:${ip}`;
}

/**
 * Increment rate limit counter
 * Returns current count or null if operation failed
 */
async function incrementRateLimit(key: string, windowSeconds: number): Promise<number | null> {
  // Try Redis first
  if (cache.isEnabled()) {
    try {
      const count = await cache.incr(key, windowSeconds);
      return count;
    } catch (error) {
      appLogger.error(error instanceof Error ? error : new Error(String(error)), {
        context: 'rate_limit_redis_incr',
        key,
      });
    }
  }

  // Fallback to in-memory store
  const now = Date.now();
  const resetAt = now + windowSeconds * 1000;

  const existing = inMemoryStore.get(key);

  if (existing && existing.resetAt > now) {
    existing.count++;
    return existing.count;
  }

  inMemoryStore.set(key, { count: 1, resetAt });
  return 1;
}

/**
 * Get current rate limit count
 */
async function getRateLimitCount(key: string): Promise<number> {
  // Try Redis first
  if (cache.isEnabled()) {
    try {
      const value = await cache.get<string>(key);
      return value ? parseInt(value, 10) : 0;
    } catch (error) {
      appLogger.error(error instanceof Error ? error : new Error(String(error)), {
        context: 'rate_limit_get_count',
        key,
      });
    }
  }

  // Fallback to in-memory store
  const now = Date.now();
  const existing = inMemoryStore.get(key);

  if (existing && existing.resetAt > now) {
    return existing.count;
  }

  return 0;
}

/**
 * Reset rate limit for a specific key
 */
export async function resetRateLimit(key: string): Promise<void> {
  if (cache.isEnabled()) {
    await cache.del(key);
  }
  inMemoryStore.delete(key);
}

/**
 * Create rate limiter middleware
 */
export function createRateLimiter(config: RateLimitConfig) {
  const windowSeconds = Math.floor(config.windowMs / 1000);

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = getRateLimitKey(req, config.keyPrefix);

      // Get current count before incrementing
      const currentCount = await getRateLimitCount(key);

      // Check if already over limit
      if (currentCount >= config.max) {
        const retryAfter = windowSeconds;

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', config.max);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', Date.now() + windowSeconds * 1000);
        res.setHeader('Retry-After', retryAfter);

        appLogger.warn('Rate limit exceeded', {
          key,
          limit: config.max,
          window: config.windowMs,
          ip: req.ip,
          path: req.path,
        });

        return res.status(429).json({
          error: config.message || 'Too many requests, please try again later',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: retryAfter,
        });
      }

      // Increment counter
      const count = await incrementRateLimit(key, windowSeconds);

      if (count === null) {
        // Rate limiting unavailable, log warning but allow request
        appLogger.warn('Rate limiting unavailable', { key });
        return next();
      }

      // Set rate limit headers
      const remaining = Math.max(0, config.max - count);
      res.setHeader('X-RateLimit-Limit', config.max);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', Date.now() + windowSeconds * 1000);

      // If this is a rate-limited request, reset counter on successful completion
      if (config.skipSuccessfulRequests) {
        const originalSend = res.json.bind(res);
        res.json = function (body: any) {
          if (res.statusCode < 400) {
            resetRateLimit(key).catch((error) => {
              appLogger.error(error instanceof Error ? error : new Error(String(error)), {
                context: 'rate_limit_reset_on_success',
              });
            });
          }
          return originalSend(body);
        };
      }

      next();
    } catch (error) {
      appLogger.error(error instanceof Error ? error : new Error(String(error)), {
        context: 'rate_limiter_middleware',
        path: req.path,
      });
      // Don't block request if rate limiting fails
      next();
    }
  };
}

/**
 * Pre-configured rate limiters for common use cases
 */

// Login rate limiter: 5 attempts per 15 minutes
export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many login attempts. Please try again in 15 minutes.',
  keyPrefix: 'ratelimit:login',
});

// Registration rate limiter: 3 accounts per hour
export const registerRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many registration attempts. Please try again in 1 hour.',
  keyPrefix: 'ratelimit:register',
});

// Password reset request: 3 attempts per hour
export const passwordResetRequestRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many password reset requests. Please try again in 1 hour.',
  keyPrefix: 'ratelimit:password-reset-request',
});

// Password reset submission: 5 attempts per hour
export const passwordResetSubmitRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many password reset attempts. Please try again in 1 hour.',
  keyPrefix: 'ratelimit:password-reset-submit',
});

// AI generation rate limiter: 20 requests per hour (user-specific)
export const aiGenerationRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: 'AI generation limit reached. Please try again in 1 hour.',
  keyPrefix: 'ratelimit:ai-generation',
});

// File upload rate limiter: 10 uploads per hour
export const fileUploadRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many file uploads. Please try again in 1 hour.',
  keyPrefix: 'ratelimit:file-upload',
});
