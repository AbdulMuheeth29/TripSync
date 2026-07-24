import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateItinerary, suggestConflictResolution, conversationalPlanningSuggestion, suggestBudgetOptimization, generateTripRecap, generatePackingList, parseEmailForItinerary, type AtlasRichContext } from "./ai-service";
import { getDb } from "./db";
import { atlasConversations } from "@shared/schema";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { TripWizardData } from "@shared/schema";
import { hashPassword, comparePassword, generateToken, requireAuth, optionalAuth } from "./auth";
import { requireTripAccess, requireOrganizer, requirePlanner, requireUnlocked, requireBeforeVoteDeadline } from "./middleware";
import { emailService } from "./email-service";
import { getVapidPublicKey, addSubscription, startReminderScheduler } from "./push-service";
import { createCheckoutSession, createBillingPortalSession, handleWebhook, isStripeEnabled, getSubscriptionDetails, getInvoices, getPaymentMethod, cancelSubscription, getInvoicePdf } from "./stripe-service";
import { env } from "./env";
import { canCreateTrip, canAddMemberToTrip, canAddPhotoToTrip, canUseAIGeneration, getEffectiveTier } from "./subscription-gates";
import {
  loginRateLimiter,
  registerRateLimiter,
  passwordResetRequestRateLimiter,
  passwordResetSubmitRateLimiter,
  aiGenerationRateLimiter,
} from "./rate-limiter";
import { getParam } from "./route-utils";
import { featureFlags } from "./feature-flags";
import aiAdminRouter from "./ai-admin-routes";
import aiFeatureRouter from "./ai-feature-routes";
import atlasRouter from "./atlas-routes";
import imageRouter from "./image-routes";
import {
  calculateSettlements,
  markExpenseSettled,
  markAllExpensesSettled,
  getUserPairBalance
} from "./expense-settlement-service";
import { processReceiptImage } from "./receipt-ocr-service";

// Rate limiting is now handled by Redis-backed middleware in rate-limiter.ts

async function requirePro(req: Request, res: Response, next: () => void): Promise<void> {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const { tier } = await getEffectiveTier(userId);
    if (tier !== "pro" && tier !== "teams") {
      res.status(403).json({ error: "This feature requires TripSync Pro", upgradeUrl: "/pricing" });
      return;
    }
    next();
  } catch (e) {
    console.error("requirePro error:", e);
    res.status(500).json({ error: "Subscription check failed" });
  }
}

// Feature flag middleware for emergency disable
function requireFeature(featureName: string, featureLabel: string) {
  return (req: Request, res: Response, next: () => void): void => {
    if (!featureFlags.isEnabled(featureName)) {
      res.status(503).json({
        error: `${featureLabel} temporarily disabled for maintenance`,
        code: "FEATURE_DISABLED",
        feature: featureName
      });
      return;
    }
    next();
  };
}

const requireAI = requireFeature("ai", "AI features");
const requireFileUploads = requireFeature("fileUploads", "File uploads");
const requireStripe = requireFeature("stripe", "Billing");
const requireChat = requireFeature("chat", "Chat");
const requirePush = requireFeature("push", "Push notifications");

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Health check (for load balancers and monitoring)
  app.get("/api/health", async (req: Request, res: Response) => {
    const detailed = req.query.detailed === 'true';
    const storage = process.env.DATABASE_URL ? "pg" : "memory";

    // Basic health response (fast)
    if (!detailed) {
      return res.json({ ok: true, storage });
    }

    // Detailed health check with service status
    const services: Record<string, { status: 'ok' | 'unavailable' | 'error'; message?: string }> = {
      database: { status: 'ok' },
      redis: { status: 'unavailable' },
      storage: { status: 'unavailable' },
      email: { status: 'unavailable' },
      sentry: { status: 'unavailable' },
      stripe: { status: 'unavailable' },
      ai: { status: 'unavailable' },
    };

    try {
      // Test database
      if (process.env.DATABASE_URL) {
        const { getDb } = await import('./db');
        const db = getDb();
        await db.execute('SELECT 1');
        services.database = { status: 'ok' };
      }
    } catch (error) {
      services.database = { status: 'error', message: 'Connection failed' };
    }

    // Check Redis
    if (process.env.REDIS_URL) {
      try {
        const { cache } = await import('./cache');
        if (cache.isEnabled()) {
          await cache.get('health_check');
          services.redis = { status: 'ok' };
        }
      } catch (error) {
        services.redis = { status: 'error', message: 'Connection failed' };
      }
    }

    // Check cloud storage
    const hasStorage = (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_S3_BUCKET) ||
                      (process.env.R2_ACCOUNT_ID && process.env.R2_BUCKET_NAME);
    if (hasStorage) {
      const { cloudStorage } = await import('./cloud-storage');
      services.storage = cloudStorage.isAvailable() ? { status: 'ok' } : { status: 'error' };
    }

    // Check email
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      const { emailService } = await import('./email-service');
      services.email = emailService.isEnabled() ? { status: 'ok' } : { status: 'error' };
    }

    // Check Sentry
    if (process.env.SENTRY_DSN) {
      services.sentry = { status: 'ok' };
    }

    // Check Stripe
    if (process.env.STRIPE_SECRET_KEY) {
      const { isStripeEnabled } = await import('./stripe-service');
      services.stripe = isStripeEnabled() ? { status: 'ok' } : { status: 'error' };
    }

    // Check AI
    if (process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY) {
      services.ai = { status: 'ok' };
    }

    const allCriticalOk = services.database.status === 'ok';

    res.json({
      ok: allCriticalOk,
      storage,
      services,
      timestamp: new Date().toISOString(),
    });
  });

  // Admin endpoint to check feature flags status
  app.get("/api/admin/feature-flags", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const user = await storage.getUser(userId);

      if (!user || !env.isAdmin(user.email)) {
        return res.status(403).json({ error: "Admin access required" });
      }

      res.json({
        flags: featureFlags.getAll(),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error fetching feature flags:", error);
      res.status(500).json({ error: "Failed to fetch feature flags" });
    }
  });

  // AI Admin Dashboard Routes (with admin auth check middleware)
  app.use("/api/admin/ai", requireAuth, async (req: Request, res: Response, next) => {
    try {
      const userId = (req as any).userId;
      const user = await storage.getUserById(userId);

      if (!user || !env.isAdmin(user.email)) {
        return res.status(403).json({ error: "Admin access required" });
      }

      next();
    } catch (error) {
      console.error("Error checking admin access:", error);
      res.status(500).json({ error: "Failed to verify admin access" });
    }
  }, aiAdminRouter);

  // AI Advanced Features Routes (smart scheduling, success prediction, etc.)
  app.use("/api/trips", requireAI, aiFeatureRouter);

  // Atlas AI Assistant Routes (conversational planning)
  app.use("/api/trips", requireAI, atlasRouter);

  // Image API Routes (destination and activity images)
  app.use("/api/images", imageRouter);

  // Public, read-only trip preview by share code (no auth)
  app.get("/api/public/trips/:shareCode", async (req: Request, res: Response) => {
    try {
      const shareCode = getParam(req.params.shareCode);
      const trip = await storage.getTripByShareCode(shareCode);
      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }
      const [items] = await Promise.all([
        storage.getItineraryItems(trip.id),
      ]);
      res.json({
        trip,
        items,
      });
    } catch (error) {
      console.error("Error fetching public trip:", error);
      res.status(500).json({ error: "Failed to load trip" });
    }
  });

  // Auth - Register
  app.post("/api/auth/register", registerRateLimiter, async (req: Request, res: Response) => {
    try {
      const { email, name, password } = req.body;

      // Validation
      if (!email || !name || !password) {
        return res.status(400).json({
          error: "Email, name, and password are required",
          code: "VALIDATION_ERROR"
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          error: "Password must be at least 8 characters",
          code: "WEAK_PASSWORD"
        });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email.toLowerCase());
      if (existingUser) {
        return res.status(409).json({
          error: "Email already registered",
          code: "EMAIL_EXISTS"
        });
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      const userId = randomUUID();
      const user = await storage.createUser({
        id: userId,
        email: email.toLowerCase(),
        name,
        passwordHash,
      });

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email,
      });

      // Return user data without password hash (serializable for client)
      const createdAt = user.createdAt instanceof Date ? user.createdAt.toISOString() : String(user.createdAt ?? new Date().toISOString());
      const u = user as { subscriptionTier?: string; subscriptionExpiresAt?: Date | null };
      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt,
          subscriptionTier: u.subscriptionTier ?? "free",
          subscriptionExpiresAt: u.subscriptionExpiresAt ? new Date(u.subscriptionExpiresAt).toISOString() : null,
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Contact form (public; rate limited by IP)
  const contactRateLimitMap = new Map<string, { count: number; resetTime: number }>();
  const CONTACT_RATE_LIMIT = 5;
  const CONTACT_RATE_WINDOW = 60 * 60 * 1000; // 1 hour
  app.post("/api/contact", async (req: Request, res: Response) => {
    try {
      const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
      const now = Date.now();
      const limit = contactRateLimitMap.get(ip);
      if (limit) {
        if (now > limit.resetTime) {
          contactRateLimitMap.set(ip, { count: 1, resetTime: now + CONTACT_RATE_WINDOW });
        } else if (limit.count >= CONTACT_RATE_LIMIT) {
          return res.status(429).json({ error: "Too many messages. Please try again later." });
        } else {
          limit.count++;
        }
      } else {
        contactRateLimitMap.set(ip, { count: 1, resetTime: now + CONTACT_RATE_WINDOW });
      }
      const { name, email, subject, message } = req.body as { name?: string; email?: string; subject?: string; message?: string };
      const fromName = typeof name === "string" ? name.trim().slice(0, 200) : "";
      const fromEmail = typeof email === "string" ? email.trim().toLowerCase().slice(0, 254) : "";
      const subj = typeof subject === "string" ? subject.trim().slice(0, 300) : "Contact form";
      const body = typeof message === "string" ? message.trim().slice(0, 10000) : "";
      if (!fromEmail || !body) {
        return res.status(400).json({ error: "Email and message are required." });
      }
      const contactTo = env.contactEmail;
      if (emailService.isEnabled() && contactTo) {
        const html = `
          <p><strong>From:</strong> ${fromName || "(not given)"} &lt;${fromEmail}&gt;</p>
          <p><strong>Subject:</strong> ${subj}</p>
          <hr/>
          <p>${body.replace(/\n/g, "<br/>")}</p>
        `;
        await emailService.sendEmail({
          to: contactTo,
          subject: `[TripSync Contact] ${subj}`,
          html,
          text: `From: ${fromName || "(not given)"} <${fromEmail}>\nSubject: ${subj}\n\n${body}`,
        });
      }
      res.json({ message: "Thanks for reaching out. We'll get back to you soon." });
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(500).json({ error: "Failed to send message. Please try again or email us directly." });
    }
  });

  // Auth - Forgot password
  app.post("/api/auth/forgot-password", passwordResetRequestRateLimiter, async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          error: "Email required",
          code: "VALIDATION_ERROR"
        });
      }

      // Check if email service is configured
      if (!emailService.isEnabled()) {
        return res.status(503).json({
          error: "Password reset not configured. Email service is disabled.",
          message: "Please contact support or register a new account.",
          code: "SERVICE_UNAVAILABLE"
        });
      }

      // Import password reset service
      const { requestPasswordReset } = await import("./password-reset-service");

      // Request password reset (always returns success to prevent email enumeration)
      await requestPasswordReset(email);

      // Generic success message (don't reveal if email exists)
      res.json({
        message: "If an account exists for this email, you will receive password reset instructions."
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({
        error: "Failed to process request",
        code: "SERVER_ERROR"
      });
    }
  });

  // Auth - Reset password
  app.post("/api/auth/reset-password", passwordResetSubmitRateLimiter, async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body;

      // Validation
      if (!token || !password) {
        return res.status(400).json({
          error: "Token and password are required",
          code: "VALIDATION_ERROR"
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          error: "Password must be at least 8 characters",
          code: "WEAK_PASSWORD"
        });
      }

      // Import password reset service
      const { resetPassword } = await import("./password-reset-service");

      // Attempt to reset password
      const success = await resetPassword(token, password);

      if (!success) {
        return res.status(400).json({
          error: "Invalid or expired reset token",
          code: "INVALID_TOKEN"
        });
      }

      res.json({
        message: "Password reset successful. You can now log in with your new password."
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({
        error: "Failed to reset password",
        code: "SERVER_ERROR"
      });
    }
  });

  // Auth - Validate reset token
  app.get("/api/auth/validate-reset-token/:token", async (req: Request, res: Response) => {
    try {
      const token = getParam(req.params.token);

      if (!token) {
        return res.status(400).json({
          error: "Token required",
          code: "VALIDATION_ERROR"
        });
      }

      // Import password reset service
      const { validateResetToken } = await import("./password-reset-service");

      // Validate token
      const userId = await validateResetToken(token);

      if (!userId) {
        return res.status(400).json({
          valid: false,
          error: "Invalid or expired token",
          code: "INVALID_TOKEN"
        });
      }

      res.json({
        valid: true
      });
    } catch (error) {
      console.error("Validate reset token error:", error);
      res.status(500).json({
        error: "Failed to validate token",
        code: "SERVER_ERROR"
      });
    }
  });

  // Auth - Login
  app.post("/api/auth/login", loginRateLimiter, async (req: Request, res: Response) => {
    try {
      const rawEmail = req.body?.email;
      const rawPassword = req.body?.password;
      const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
      const password = typeof rawPassword === "string" ? rawPassword : "";

      if (!email || !password) {
        return res.status(400).json({
          error: "Email and password are required",
          code: "VALIDATION_ERROR"
        });
      }

      // In development: ensure demo user exists so demo@tripsync.com / password123 always works
      let user = await storage.getUserByEmail(email);
      if (!user && process.env.NODE_ENV === "development" && email === "demo@tripsync.com") {
        const passwordHash = await hashPassword("password123");
        user = await storage.createUser({
          id: randomUUID(),
          email: "demo@tripsync.com",
          name: "Demo User",
          passwordHash,
        });
      }

      if (!user) {
        return res.status(401).json({
          error: "Invalid email or password",
          code: "INVALID_CREDENTIALS"
        });
      }

      // Handle legacy users without passwordHash (for demo/backward compatibility)
      if (!user.passwordHash) {
        if (process.env.NODE_ENV === "development") {
          console.log(`[dev] Legacy user ${user.email} logged in without password hash`);
        } else {
          return res.status(401).json({
            error: "Account needs password reset. Please register again.",
            code: "PASSWORD_RESET_REQUIRED"
          });
        }
      } else {
        // Verify password (only when passwordHash exists)
        try {
          const isValid = await comparePassword(password, user.passwordHash);
          if (!isValid) {
            return res.status(401).json({
              error: "Invalid email or password",
              code: "INVALID_CREDENTIALS"
            });
          }
        } catch (compareErr) {
          console.error("Password compare error:", compareErr);
          return res.status(401).json({
            error: "Invalid email or password",
            code: "INVALID_CREDENTIALS"
          });
        }
      }

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email,
      });

      // Return user data without password hash (ensure serializable for client)
      const createdAt = user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt;
      const u = user as { subscriptionTier?: string; subscriptionExpiresAt?: Date | null };
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: typeof createdAt === "string" ? createdAt : new Date(createdAt).toISOString(),
          subscriptionTier: u.subscriptionTier ?? "free",
          subscriptionExpiresAt: u.subscriptionExpiresAt ? new Date(u.subscriptionExpiresAt).toISOString() : null,
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Auth - Logout
  app.post("/api/auth/logout", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.status(400).json({
          error: "No token provided",
          code: "VALIDATION_ERROR"
        });
      }

      const token = authHeader.substring(7); // Remove "Bearer "

      // Import token blacklist service
      const { tokenBlacklist } = await import("./token-blacklist");
      const { verifyToken } = await import("./auth");

      // Get token expiration
      const payload = verifyToken(token);
      if (!payload) {
        return res.status(400).json({
          error: "Invalid token",
          code: "INVALID_TOKEN"
        });
      }

      // Calculate expiration date (JWT exp is in seconds)
      const expiresAt = new Date((payload as any).exp * 1000);

      // Add token to blacklist
      await tokenBlacklist.blacklistToken(token, userId, expiresAt, 'logout');

      res.json({
        message: "Logged out successfully"
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({
        error: "Logout failed",
        code: "SERVER_ERROR"
      });
    }
  });

  // Auth - Revoke all sessions (security measure)
  app.post("/api/auth/revoke-all-sessions", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;

      // Import token blacklist service
      const { tokenBlacklist } = await import("./token-blacklist");

      // Revoke all tokens for this user
      const count = await tokenBlacklist.revokeAllUserTokens(userId, 'security');

      res.json({
        message: `Revoked ${count} active session(s)`,
        count
      });
    } catch (error) {
      console.error("Revoke sessions error:", error);
      res.status(500).json({
        error: "Failed to revoke sessions",
        code: "SERVER_ERROR"
      });
    }
  });

  // Auth - Quick test account creation (dev only)
  if (process.env.NODE_ENV === "development") {
    app.post("/api/auth/quick-login", async (req: Request, res: Response) => {
      try {
        const { email } = req.body;
        if (!email) {
          return res.status(400).json({ error: "Email required" });
        }

        // Check if user exists
        let user = await storage.getUserByEmail(email.toLowerCase());
        
        if (!user) {
          // Create user with default password "password123"
          const passwordHash = await hashPassword("password123");
          user = await storage.createUser({
            id: randomUUID(),
            email: email.toLowerCase(),
            name: email.split("@")[0],
            passwordHash,
          });
        }

        // Generate token
        const token = generateToken({
          userId: user.id,
          email: user.email,
        });

        res.json({
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt,
          },
          message: user.passwordHash ? "Logged in" : "Account created. Default password: password123",
        });
      } catch (error) {
        console.error("Quick login error:", error);
        res.status(500).json({ error: "Quick login failed" });
      }
    });
  }

  // Auth - Get current user (verify token)
  app.get("/api/auth/me", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const user = await storage.getUserById(userId);

      if (!user) {
        return res.status(404).json({
          error: "User not found",
          code: "USER_NOT_FOUND"
        });
      }

      const createdAt = user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt;
      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt,
        subscriptionTier: (user as { subscriptionTier?: string }).subscriptionTier ?? "free",
        subscriptionExpiresAt: (user as { subscriptionExpiresAt?: Date | null }).subscriptionExpiresAt
          ? new Date((user as { subscriptionExpiresAt: Date }).subscriptionExpiresAt).toISOString()
          : null,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user info" });
    }
  });

  // Subscription status
  app.get("/api/subscription/status", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const user = await storage.getUserById(userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      const u = user as { subscriptionTier?: string; subscriptionExpiresAt?: Date | null };
      const tier = u.subscriptionTier ?? "free";
      const expiresAt = u.subscriptionExpiresAt;
      const isActive = tier !== "free" && (!expiresAt || new Date(expiresAt) > new Date());
      res.json({
        tier,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        isActive: isActive || tier === "free",
        stripeEnabled: isStripeEnabled(),
      });
    } catch (error) {
      console.error("Subscription status error:", error);
      res.status(500).json({ error: "Failed to get subscription status" });
    }
  });

  // Stripe checkout (create session and redirect URL)
  app.post("/api/stripe/checkout", requireAuth, requireStripe, async (req: Request, res: Response) => {
    try {
      if (!isStripeEnabled()) {
        return res.status(503).json({ error: "Payments are not configured", upgradeUrl: "/pricing" });
      }
      const userId = (req as any).userId;
      const user = await storage.getUserById(userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      const { tier, isAnnual } = req.body as { tier?: "pro" | "teams"; isAnnual?: boolean };
      if (!tier || (tier !== "pro" && tier !== "teams")) {
        return res.status(400).json({ error: "tier must be 'pro' or 'teams'" });
      }
      const { url } = await createCheckoutSession({
        tier,
        isAnnual: !!isAnnual,
        userId,
        userEmail: user.email,
      });
      if (!url) return res.status(500).json({ error: "Could not create checkout session" });
      res.json({ url });
    } catch (error) {
      console.error("Stripe checkout error:", error);
      res.status(500).json({ error: "Checkout failed" });
    }
  });

  // Stripe customer portal (manage subscription)
  app.post("/api/stripe/portal", requireAuth, requireStripe, async (req: Request, res: Response) => {
    try {
      if (!isStripeEnabled()) {
        return res.status(503).json({ error: "Payments are not configured" });
      }
      const userId = (req as any).userId;
      const user = await storage.getUserById(userId) as { stripeCustomerId?: string | null };
      if (!user?.stripeCustomerId) {
        return res.status(400).json({ error: "No billing account. Subscribe first from the pricing page." });
      }
      const returnUrl = (req.body?.returnUrl as string) || `${env.appUrl}/dashboard`;
      const { url } = await createBillingPortalSession(user.stripeCustomerId, returnUrl);
      res.json({ url });
    } catch (error) {
      console.error("Stripe portal error:", error);
      res.status(500).json({ error: "Could not open billing portal" });
    }
  });

  // Stripe webhook (raw body required; do not use requireAuth)
  app.post("/api/stripe/webhook", async (req: Request, res: Response) => {
    try {
      const rawBody = (req as any).rawBody as Buffer | undefined;
      const signature = req.headers["stripe-signature"] as string;
      if (!rawBody || !signature) {
        return res.status(400).json({ error: "Missing raw body or stripe-signature" });
      }
      const result = await handleWebhook(rawBody, signature);
      if (!result.received && result.error) {
        return res.status(400).json({ error: result.error });
      }
      res.json({ received: true });
    } catch (error) {
      console.error("Stripe webhook error:", error);
      res.status(500).json({ error: "Webhook failed" });
    }
  });

  // Get subscription details
  app.get("/api/stripe/subscription", requireAuth, requireStripe, async (req: Request, res: Response) => {
    try {
      if (!isStripeEnabled()) {
        return res.status(503).json({ error: "Payments are not configured" });
      }
      const userId = (req as any).userId;
      const user = await storage.getUserById(userId) as { stripeCustomerId?: string | null };
      if (!user?.stripeCustomerId) {
        return res.status(404).json({ error: "No subscription found" });
      }
      const subscription = await getSubscriptionDetails(user.stripeCustomerId);
      if (!subscription) {
        return res.status(404).json({ error: "No subscription found" });
      }
      res.json(subscription);
    } catch (error) {
      console.error("Get subscription error:", error);
      res.status(500).json({ error: "Failed to get subscription details" });
    }
  });

  // Get invoices
  app.get("/api/stripe/invoices", requireAuth, requireStripe, async (req: Request, res: Response) => {
    try {
      if (!isStripeEnabled()) {
        return res.status(503).json({ error: "Payments are not configured" });
      }
      const userId = (req as any).userId;
      const user = await storage.getUserById(userId) as { stripeCustomerId?: string | null };
      if (!user?.stripeCustomerId) {
        return res.status(404).json({ invoices: [] });
      }
      const invoices = await getInvoices(user.stripeCustomerId);
      res.json({ invoices });
    } catch (error) {
      console.error("Get invoices error:", error);
      res.status(500).json({ error: "Failed to get invoices" });
    }
  });

  // Get payment method
  app.get("/api/stripe/payment-method", requireAuth, requireStripe, async (req: Request, res: Response) => {
    try {
      if (!isStripeEnabled()) {
        return res.status(503).json({ error: "Payments are not configured" });
      }
      const userId = (req as any).userId;
      const user = await storage.getUserById(userId) as { stripeCustomerId?: string | null };
      if (!user?.stripeCustomerId) {
        return res.status(404).json({ error: "No payment method found" });
      }
      const paymentMethod = await getPaymentMethod(user.stripeCustomerId);
      if (!paymentMethod) {
        return res.status(404).json({ error: "No payment method found" });
      }
      res.json(paymentMethod);
    } catch (error) {
      console.error("Get payment method error:", error);
      res.status(500).json({ error: "Failed to get payment method" });
    }
  });

  // Cancel subscription
  app.post("/api/stripe/cancel-subscription", requireAuth, requireStripe, async (req: Request, res: Response) => {
    try {
      if (!isStripeEnabled()) {
        return res.status(503).json({ error: "Payments are not configured" });
      }
      const userId = (req as any).userId;
      const user = await storage.getUserById(userId) as { stripeCustomerId?: string | null };
      if (!user?.stripeCustomerId) {
        return res.status(404).json({ error: "No subscription found" });
      }
      await cancelSubscription(user.stripeCustomerId);
      res.json({ success: true });
    } catch (error) {
      console.error("Cancel subscription error:", error);
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  });

  // Get invoice PDF
  app.get("/api/stripe/invoices/:invoiceId/pdf", requireAuth, requireStripe, async (req: Request, res: Response) => {
    try {
      if (!isStripeEnabled()) {
        return res.status(503).json({ error: "Payments are not configured" });
      }
      const invoiceId = getParam(req.params.invoiceId);
      const pdfUrl = await getInvoicePdf(invoiceId);
      if (!pdfUrl) {
        return res.status(404).json({ error: "Invoice PDF not found" });
      }
      // Redirect to the PDF URL
      res.redirect(pdfUrl);
    } catch (error) {
      console.error("Get invoice PDF error:", error);
      res.status(500).json({ error: "Failed to get invoice PDF" });
    }
  });

  // Get user usage statistics
  app.get("/api/user/usage-stats", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;

      // Get all trips where user is a member
      const userTrips = await storage.getTripsByUserId(userId);

      // Count active trips (not completed or cancelled)
      const activeTrips = userTrips.filter((trip: any) =>
        trip.status !== "completed" && trip.status !== "cancelled"
      ).length;

      // Count AI generations (this would require tracking in production)
      // For now, estimate based on trips with AI-generated content
      const aiGenerations = 0; // Placeholder - would need tracking table

      // Count API calls (this would require tracking in production)
      const apiCalls = 0; // Placeholder - would need tracking table

      // Calculate storage used (rough estimate based on photos/documents)
      // In production, this should be tracked in cloud storage
      const storageUsed = 0; // Placeholder in MB

      // Storage limit based on tier
      const user = await storage.getUserById(userId);
      const tier = (user as any)?.subscriptionTier || "free";
      const storageLimit = tier === "free" ? 100 : tier === "pro" ? 1000 : 10000;

      res.json({
        activeTrips,
        aiGenerations,
        apiCalls,
        storageUsed,
        limits: {
          storage: storageLimit,
        },
      });
    } catch (error) {
      console.error("Get usage stats error:", error);
      res.status(500).json({ error: "Failed to get usage statistics" });
    }
  });

  // Demo trip: any authenticated user can view (for "Play AI demo" from dashboard)
  const DEMO_TRIP_ID = "trip-austin-1";
  app.get("/api/demo/trip", requireAuth, async (req: Request, res: Response) => {
    try {
      const trip = await storage.getTrip(DEMO_TRIP_ID);
      if (!trip) {
        return res.status(404).json({ error: "Demo trip not found" });
      }
      const tripId = DEMO_TRIP_ID;
      const items = await storage.getItineraryItems(tripId);
      const allComments = await storage.getCommentsByTrip(tripId);
      const allVotes = await storage.getVotesByTrip(tripId);
      const members = await storage.getTripMembers(tripId);
      const expenses = await storage.getExpensesByTrip(tripId);
      const invites = await storage.getInvitesByTrip(tripId);
      const preferences = await storage.getPreferencesByTrip(tripId);
      const chatMessages = await storage.getChatMessagesByTrip(tripId);
      const photos = await storage.getPhotosByTrip(tripId);
      const pollsList = await storage.getPollsByTrip(tripId);
      const packingList = await storage.getPackingByTrip(tripId);
      const transportationList = await storage.getTransportationByTrip(tripId);
      const groupAvailabilityList = await storage.getGroupAvailabilityByTrip(tripId);
      const documentsList = await storage.getDocumentsByTrip(tripId);
      const emergencyContactsList = await storage.getEmergencyContactsByTrip(tripId);
      const moodBoardList = await storage.getMoodBoardByTrip(tripId);
      const satisfactionList = await storage.getSatisfactionByTrip(tripId);
      const locationSharingList = await storage.getLocationSharingByTrip(tripId);

      const pollVoteCounts: Record<string, number[]> = {};
      for (const poll of pollsList) {
        const pv = await storage.getPollVotes(poll.id);
        const counts = (poll.options as string[]).map((_, i) => pv.filter((v) => v.optionIndex === i).length);
        pollVoteCounts[poll.id] = counts;
      }

      const comments: Record<string, typeof allComments> = {};
      allComments.forEach((c) => {
        if (!comments[c.itemId]) comments[c.itemId] = [];
        comments[c.itemId].push(c);
      });

      const votes: Record<string, { up: number; down: number; abstain: number; userVote?: string }> = {};
      const voteDetails: Record<string, { userId: string; voteType: string; userName: string }[]> = {};
      const userId = req.query.userId as string | undefined;
      const memberMap = new Map(members.map((m) => [m.userId, m.user.name]));
      allVotes.forEach((v) => {
        if (!votes[v.itemId]) votes[v.itemId] = { up: 0, down: 0, abstain: 0 };
        if (v.voteType === "up") votes[v.itemId].up++;
        else if (v.voteType === "down") votes[v.itemId].down++;
        else if (v.voteType === "abstain") votes[v.itemId].abstain++;
        if (userId && v.userId === userId) votes[v.itemId].userVote = v.voteType;
        if (!voteDetails[v.itemId]) voteDetails[v.itemId] = [];
        voteDetails[v.itemId].push({ userId: v.userId, voteType: v.voteType, userName: memberMap.get(v.userId) ?? "Unknown" });
      });

      const effectiveTrip = { ...trip };
      if (trip.voteDeadline && new Date(trip.voteDeadline) <= new Date()) {
        effectiveTrip.isLocked = true;
      }

      res.json({
        trip: effectiveTrip,
        items,
        comments,
        votes,
        voteDetails,
        members: members.map((m) => ({ ...m.user, role: m.role, rsvpStatus: m.rsvpStatus, memberId: m.id })),
        expenses,
        invites,
        preferences: preferences.map((p) => ({ ...p, user: p.user })),
        chatMessages,
        photos,
        polls: pollsList.map((p) => ({ ...p, voteCounts: pollVoteCounts[p.id] ?? [] })),
        packing: packingList,
        transportation: transportationList,
        groupAvailability: groupAvailabilityList,
        documents: documentsList,
        emergencyContacts: emergencyContactsList,
        moodBoard: moodBoardList,
        satisfaction: satisfactionList,
        locationSharing: locationSharingList,
      });
    } catch (error) {
      console.error("Error fetching demo trip:", error);
      res.status(500).json({ error: "Failed to fetch demo trip" });
    }
  });

  // Trips
  app.get("/api/trips", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;

      const trips = await storage.getTripsByUserId(userId);
      const tripsWithCounts = await Promise.all(
        trips.map(async (trip) => {
          const [items, invites, members, preferences] = await Promise.all([
            storage.getItineraryItems(trip.id),
            storage.getInvitesByTrip(trip.id),
            storage.getTripMembers(trip.id),
            storage.getPreferencesByTrip(trip.id),
          ]);
          const bookedCount = items.filter((i) => i.bookingStatus === "booked").length;
          return {
            ...trip,
            bookedCount,
            totalItems: items.length,
            inviteCount: invites.length,
            memberCount: members.length,
            preferenceCompletedCount: preferences.length,
          };
        })
      );

      res.json(tripsWithCounts);
    } catch (error) {
      console.error("Error fetching trips:", error);
      res.status(500).json({ error: "Failed to fetch trips" });
    }
  });

  app.post("/api/trips", requireAuth, requireAI, aiGenerationRateLimiter, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const tripData = req.body as TripWizardData & { title?: string; tripType?: string; voteDeadline?: string };

      if (!tripData.destination) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const createTripCheck = await canCreateTrip(userId);
      if (!createTripCheck.allowed) {
        return res.status(403).json({ error: createTripCheck.reason, upgradeUrl: "/pricing" });
      }

      const tripId = randomUUID();
      const trip = await storage.createTrip({
        id: tripId,
        organizerId: userId,
        title: tripData.title ?? null,
        destination: tripData.destination,
        startDate: tripData.startDate,
        endDate: tripData.endDate,
        budgetPerPerson: tripData.budgetPerPerson,
        groupSize: tripData.groupSize,
        vibes: tripData.vibes,
        accommodationPref: tripData.accommodationPref,
        diningPref: tripData.diningPref,
        tripType: tripData.tripType ?? null,
        voteDeadline: tripData.voteDeadline ?? null,
        timezone: null,
      });

      // Generate itinerary in background
      generateItinerary(tripId, tripData).catch((error) => {
        console.error("Error generating itinerary:", error);
      });

      res.status(201).json(trip);
    } catch (error) {
      console.error("Error creating trip:", error);
      const message = error instanceof Error ? error.message : "Failed to create trip";
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/trips/:id", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.id);
      const trip = (req as any).trip; // Already fetched by requireTripAccess middleware

      const items = await storage.getItineraryItems(tripId);
      const allComments = await storage.getCommentsByTrip(tripId);
      const allVotes = await storage.getVotesByTrip(tripId);
      const members = await storage.getTripMembers(tripId);
      const expenses = await storage.getExpensesByTrip(tripId);
      const invites = await storage.getInvitesByTrip(tripId);
      const preferences = await storage.getPreferencesByTrip(tripId);
      const chatMessages = await storage.getChatMessagesByTrip(tripId);
      const photos = await storage.getPhotosByTrip(tripId);
      const pollsList = await storage.getPollsByTrip(tripId);
      const packingList = await storage.getPackingByTrip(tripId);
      const transportationList = await storage.getTransportationByTrip(tripId);
      const groupAvailabilityList = await storage.getGroupAvailabilityByTrip(tripId);
      const documentsList = await storage.getDocumentsByTrip(tripId);
      const emergencyContactsList = await storage.getEmergencyContactsByTrip(tripId);
      const moodBoardList = await storage.getMoodBoardByTrip(tripId);
      const satisfactionList = await storage.getSatisfactionByTrip(tripId);
      const locationSharingList = await storage.getLocationSharingByTrip(tripId);

      // Poll vote counts per poll
      const pollVoteCounts: Record<string, number[]> = {};
      for (const poll of pollsList) {
        const pv = await storage.getPollVotes(poll.id);
        const counts = (poll.options as string[]).map((_, i) => pv.filter((v) => v.optionIndex === i).length);
        pollVoteCounts[poll.id] = counts;
      }

      // Group comments by item
      const comments: Record<string, typeof allComments> = {};
      allComments.forEach((c) => {
        if (!comments[c.itemId]) comments[c.itemId] = [];
        comments[c.itemId].push(c);
      });

      // Group votes by item and calculate counts (up, down, abstain)
      const votes: Record<string, { up: number; down: number; abstain: number; userVote?: string }> = {};
      const voteDetails: Record<string, { userId: string; voteType: string; userName: string }[]> = {};
      const userId = req.query.userId as string | undefined;
      const memberMap = new Map(members.map((m) => [m.userId, m.user.name]));
      allVotes.forEach((v) => {
        if (!votes[v.itemId]) votes[v.itemId] = { up: 0, down: 0, abstain: 0 };
        if (v.voteType === "up") votes[v.itemId].up++;
        else if (v.voteType === "down") votes[v.itemId].down++;
        else if (v.voteType === "abstain") votes[v.itemId].abstain++;
        if (userId && v.userId === userId) votes[v.itemId].userVote = v.voteType;
        if (!voteDetails[v.itemId]) voteDetails[v.itemId] = [];
        voteDetails[v.itemId].push({ userId: v.userId, voteType: v.voteType, userName: memberMap.get(v.userId) ?? "Unknown" });
      });

      // Decision deadline: treat trip as locked for voting when voteDeadline has passed
      const effectiveTrip = { ...trip };
      if (trip.voteDeadline && new Date(trip.voteDeadline) <= new Date()) {
        effectiveTrip.isLocked = true;
      }

      res.json({
        trip: effectiveTrip,
        items,
        comments,
        votes,
        voteDetails,
        members: members.map((m) => ({ ...m.user, role: m.role, rsvpStatus: m.rsvpStatus, memberId: m.id })),
        expenses,
        invites,
        preferences: preferences.map((p) => ({ ...p, user: p.user })),
        chatMessages,
        photos,
        polls: pollsList.map((p) => ({ ...p, voteCounts: pollVoteCounts[p.id] ?? [] })),
        packing: packingList,
        transportation: transportationList,
        groupAvailability: groupAvailabilityList,
        documents: documentsList,
        emergencyContacts: emergencyContactsList,
        moodBoard: moodBoardList,
        satisfaction: satisfactionList,
        locationSharing: locationSharingList,
      });
    } catch (error) {
      console.error("Error fetching trip:", error);
      res.status(500).json({ error: "Failed to fetch trip" });
    }
  });

  app.patch("/api/trips/:id", requireAuth, requireTripAccess, requirePlanner, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.id);
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

  // Regenerate share code for trip
  app.post("/api/trips/:id/regenerate-code", requireAuth, requireTripAccess, requirePlanner, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.id);

      // Generate new share code (same algorithm as createTrip)
      const shareCode = Math.random().toString(36).substring(2, 10).toUpperCase();

      const trip = await storage.updateTrip(tripId, { shareCode });
      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }

      res.json({ shareCode: trip.shareCode });
    } catch (error) {
      console.error("Error regenerating share code:", error);
      res.status(500).json({ error: "Failed to regenerate share code" });
    }
  });

  // Regenerate itinerary with member preferences
  app.post("/api/trips/:id/regenerate-itinerary", requireAuth, requireAI, requireTripAccess, requirePlanner, aiGenerationRateLimiter, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.id);
      const userId = (req as any).userId;
      const trip = (req as any).trip;
      const aiCheck = await canUseAIGeneration(userId, tripId);
      if (!aiCheck.allowed) {
        return res.status(403).json({ error: aiCheck.reason, upgradeUrl: "/pricing" });
      }
      const preferences = await storage.getPreferencesByTrip(tripId);
      const memberInputs = preferences.map((p) => ({
        userName: p.user.name,
        diet: p.diet,
        budgetFlexibility: p.budgetFlexibility,
        mustDoActivities: p.mustDoActivities,
      }));
      await storage.deleteItineraryItemsByTripId(tripId);
      const tripData: TripWizardData = {
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        budgetPerPerson: trip.budgetPerPerson,
        groupSize: trip.groupSize,
        vibes: trip.vibes,
        accommodationPref: trip.accommodationPref,
        diningPref: trip.diningPref,
      };
      generateItinerary(tripId, tripData, memberInputs).catch((err) => console.error("Regenerate itinerary error:", err));
      res.json({ message: "Itinerary regeneration started" });
    } catch (error) {
      console.error("Error regenerating itinerary:", error);
      res.status(500).json({ error: "Failed to regenerate itinerary" });
    }
  });

  // Join trip
  app.get("/api/trips/join/:code/info", async (req: Request, res: Response) => {
    try {
      const shareCode = getParam(req.params.code);
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

  app.post("/api/trips/join/:code", requireAuth, async (req: Request, res: Response) => {
    try {
      const shareCode = getParam(req.params.code);
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

  // Reorder itinerary items (planner only)
  app.post("/api/trips/:tripId/itinerary/reorder", requireAuth, requireTripAccess, requirePlanner, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.tripId);
      const { itemIds } = req.body as { itemIds: string[] };
      if (!Array.isArray(itemIds) || itemIds.length === 0) {
        return res.status(400).json({ error: "itemIds array required" });
      }
      const items = await storage.getItineraryItems(tripId);
      const idSet = new Set(items.map((i) => i.id));
      for (let i = 0; i < itemIds.length; i++) {
        const id = itemIds[i];
        if (idSet.has(id)) {
          await storage.updateItineraryItem(id, { sortOrder: i });
        }
      }
      res.json({ ok: true });
    } catch (error) {
      console.error("Reorder error:", error);
      res.status(500).json({ error: "Failed to reorder" });
    }
  });

  // Create itinerary item (planner only)
  app.post("/api/trips/:tripId/items", requireAuth, requireTripAccess, requirePlanner, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.tripId);
      const body = req.body as { dayNumber: number; type: string; time: string; name: string; description: string; location: string; pricePerPerson: number; bookingUrl?: string; bookingUrlHint?: string };
      if (!body.dayNumber || !body.type || !body.time || !body.name || !body.description || !body.location || body.pricePerPerson == null) {
        return res.status(400).json({ error: "dayNumber, type, time, name, description, location, pricePerPerson required" });
      }
      const item = await storage.createItineraryItem({
        id: randomUUID(),
        tripId,
        dayNumber: body.dayNumber,
        type: body.type,
        time: body.time,
        name: body.name,
        description: body.description,
        location: body.location,
        pricePerPerson: body.pricePerPerson,
        bookingUrl: body.bookingUrl ?? null,
        bookingUrlHint: body.bookingUrlHint ?? null,
      });
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating item:", error);
      res.status(500).json({ error: "Failed to create item" });
    }
  });

  // Itinerary items
  app.patch("/api/trips/:tripId/items/:itemId", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const itemId = getParam(req.params.itemId);
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
  app.post("/api/trips/:tripId/items/:itemId/vote", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const itemId = getParam(req.params.itemId);
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

  // Bulk vote on multiple items
  app.post("/api/trips/:tripId/items/bulk-vote", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const { itemIds, userId, voteType } = req.body;

      if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
        return res.status(400).json({ error: "itemIds array is required" });
      }

      if (!userId || !voteType) {
        return res.status(400).json({ error: "Missing userId or voteType" });
      }

      // Vote on each item
      const votes = await Promise.all(
        itemIds.map((itemId: string) =>
          storage.createOrUpdateVote({
            id: randomUUID(),
            itemId,
            userId,
            voteType,
          })
        )
      );

      res.json({ success: true, count: votes.length });
    } catch (error) {
      console.error("Error bulk voting:", error);
      res.status(500).json({ error: "Failed to bulk vote" });
    }
  });

  // Bulk delete multiple items
  app.post("/api/trips/:tripId/items/bulk-delete", requireAuth, requireTripAccess, requirePlanner, async (req: Request, res: Response) => {
    try {
      const { itemIds } = req.body;

      if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
        return res.status(400).json({ error: "itemIds array is required" });
      }

      // Delete each item
      await Promise.all(
        itemIds.map((itemId: string) => storage.deleteItineraryItem(itemId))
      );

      res.json({ success: true, count: itemIds.length });
    } catch (error) {
      console.error("Error bulk deleting:", error);
      res.status(500).json({ error: "Failed to bulk delete items" });
    }
  });

  // Comments
  app.post("/api/trips/:tripId/items/:itemId/comments", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const itemId = getParam(req.params.itemId);
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
  app.post("/api/trips/:tripId/expenses", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.tripId);
      const { paidByUserId, amount, currency, description, location, itemId, receiptImageUrl, splitAmong } = req.body;
      
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
        itemId: itemId ?? null,
        receiptImageUrl: receiptImageUrl ?? null,
        splitAmong,
      });

      res.json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      res.status(500).json({ error: "Failed to create expense" });
    }
  });

  app.patch("/api/trips/:tripId/expenses/:expenseId", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const expenseId = getParam(req.params.expenseId);
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

  app.delete("/api/trips/:tripId/expenses/:expenseId", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const expenseId = getParam(req.params.expenseId);
      const ok = await storage.deleteExpense(expenseId);
      if (!ok) return res.status(404).json({ error: "Expense not found" });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting expense:", error);
      res.status(500).json({ error: "Failed to delete expense" });
    }
  });

  // Expense settlements - "Who owes whom" calculation
  app.get("/api/trips/:tripId/expenses/settlements", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.tripId);
      const { settlements, balances } = await calculateSettlements(tripId);
      res.json({ settlements, balances });
    } catch (error) {
      console.error("Error calculating settlements:", error);
      res.status(500).json({ error: "Failed to calculate settlements" });
    }
  });

  // Get balance between two specific users
  app.get("/api/trips/:tripId/expenses/balance/:userId1/:userId2", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.tripId);
      const userId1 = getParam(req.params.userId1);
      const userId2 = getParam(req.params.userId2);
      const balance = await getUserPairBalance(tripId, userId1, userId2);
      res.json(balance);
    } catch (error) {
      console.error("Error getting user pair balance:", error);
      res.status(500).json({ error: "Failed to get balance" });
    }
  });

  // Mark a specific expense as settled
  app.post("/api/trips/:tripId/expenses/:expenseId/settle", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const expenseId = getParam(req.params.expenseId);
      await markExpenseSettled(expenseId);
      res.json({ success: true, message: "Expense marked as settled" });
    } catch (error) {
      console.error("Error settling expense:", error);
      res.status(500).json({ error: "Failed to settle expense" });
    }
  });

  // Mark all trip expenses as settled
  app.post("/api/trips/:tripId/expenses/settle-all", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.tripId);
      await markAllExpensesSettled(tripId);
      res.json({ success: true, message: "All expenses marked as settled" });
    } catch (error) {
      console.error("Error settling all expenses:", error);
      res.status(500).json({ error: "Failed to settle all expenses" });
    }
  });

  // Receipt OCR (Pro feature) - Extract data from receipt image using Claude Haiku
  app.post("/api/receipts/ocr", requireAuth, requirePro, requireAI, async (req: Request, res: Response) => {
    try {
      const { imageUrl } = req.body;

      if (!imageUrl) {
        return res.status(400).json({ error: "imageUrl is required" });
      }

      const receiptData = await processReceiptImage(imageUrl);

      if (!receiptData) {
        return res.status(422).json({
          error: "Could not extract data from receipt",
          message: "The image may be unclear or not a valid receipt. Please try again with a clearer image.",
        });
      }

      res.json(receiptData);
    } catch (error) {
      console.error("Receipt OCR error:", error);
      res.status(500).json({ error: "Failed to process receipt" });
    }
  });

  // AI budget optimization
  app.post("/api/trips/:tripId/budget-optimize", requireAuth, requireAI, requireTripAccess, aiGenerationRateLimiter, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.tripId);
      const trip = (req as any).trip;
      const expenses = await storage.getExpensesByTrip(tripId);
      const items = await storage.getItineraryItems(tripId);
      const itineraryEstimated = items.reduce((sum, i) => sum + i.pricePerPerson * trip.groupSize, 0);
      const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
      const expenseSummary = expenses.slice(-10).map((e) => `${e.description}: $${e.amount}`).join("; ");
      const result = await suggestBudgetOptimization({
        destination: trip.destination,
        budgetPerPerson: trip.budgetPerPerson,
        groupSize: trip.groupSize,
        totalSpent,
        expenseSummary: expenseSummary || undefined,
        itineraryEstimated: itineraryEstimated || undefined,
      });
      res.json(result);
    } catch (error) {
      console.error("Budget optimize error:", error);
      res.status(500).json({ error: "Failed to optimize budget" });
    }
  });

  // Invites
  app.get("/api/trips/:tripId/invites", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const invites = await storage.getInvitesByTrip(getParam(req.params.tripId));
      res.json(invites);
    } catch (error) {
      console.error("Error fetching invites:", error);
      res.status(500).json({ error: "Failed to fetch invites" });
    }
  });

  // Public invite response (token = invite ID)
  app.get("/api/invites/:inviteId", async (req: Request, res: Response) => {
    try {
      const inviteId = getParam(req.params.inviteId);
      const invite = await storage.getInviteById(inviteId);
      if (!invite || invite.status !== "pending") {
        return res.status(404).json({ error: "Invite not found or already responded" });
      }
      const trip = await storage.getTrip(invite.tripId);
      if (!trip) return res.status(404).json({ error: "Trip not found" });
      res.json({ invite, trip });
    } catch (error) {
      console.error("Invite fetch error:", error);
      res.status(500).json({ error: "Failed to fetch invite" });
    }
  });

  app.post("/api/invites/:inviteId/respond", optionalAuth, async (req: Request, res: Response) => {
    try {
      const inviteId = getParam(req.params.inviteId);
      const { action } = req.body as { action: "accept" | "decline" };
      if (!action || !["accept", "decline"].includes(action)) {
        return res.status(400).json({ error: "action must be 'accept' or 'decline'" });
      }
      const invite = await storage.getInviteById(inviteId);
      if (!invite || invite.status !== "pending") {
        return res.status(404).json({ error: "Invite not found or already responded" });
      }
      if (action === "decline") {
        await storage.updateInvite(inviteId, { status: "declined" });
        return res.json({ ok: true, message: "Invite declined" });
      }
      if (action === "accept") {
        const userId = (req as any).userId;
        if (!userId) {
          return res.status(401).json({ error: "Log in to accept. Redirect to /login?invite=" + inviteId });
        }
        const user = await storage.getUser(userId);
        if (!user || user.email.toLowerCase() !== invite.email.toLowerCase()) {
          return res.status(403).json({ error: "You must log in with " + invite.email + " to accept" });
        }
        const existingMembers = await storage.getTripMembers(invite.tripId);
        if (existingMembers.some((m) => m.userId === userId)) {
          await storage.updateInvite(inviteId, { status: "accepted" });
          return res.json({ ok: true, message: "Already a member", tripId: invite.tripId });
        }
        const memberCheck = await canAddMemberToTrip(invite.tripId);
        if (!memberCheck.allowed) {
          return res.status(403).json({ error: memberCheck.reason, upgradeUrl: "/pricing" });
        }
        await storage.addTripMember({
          id: randomUUID(),
          tripId: invite.tripId,
          userId,
          role: "member",
        });
        await storage.updateInvite(inviteId, { status: "accepted" });
        return res.json({ ok: true, message: "Invite accepted", tripId: invite.tripId });
      }
    } catch (error) {
      console.error("Invite respond error:", error);
      res.status(500).json({ error: "Failed to respond to invite" });
    }
  });

  app.post("/api/trips/:tripId/invites", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.tripId);
      const { email } = req.body;
      const userId = (req as any).userId;
      const trip = (req as any).trip;

      if (!email) return res.status(400).json({ error: "Email is required" });

      const invite = await storage.createInvite({
        id: randomUUID(),
        tripId,
        email: email.trim().toLowerCase(),
        status: "pending",
      });

      // Send email notification if service is enabled
      if (emailService.isEnabled()) {
        const inviter = await storage.getUserById(userId);
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
        const startDate = new Date(trip.startDate).toLocaleDateString();
        const endDate = new Date(trip.endDate).toLocaleDateString();

        await emailService.sendTripInvite({
          toEmail: email.trim().toLowerCase(),
          inviterName: inviter?.name || "Someone",
          tripDestination: trip.destination,
          tripDates: `${startDate} - ${endDate}`,
          joinCode: trip.shareCode || "",
          inviteId: invite.id,
          baseUrl,
        }).catch(error => {
          console.error("Failed to send invite email:", error);
          // Don't fail the request if email fails
        });
      }

      res.status(201).json(invite);
    } catch (error) {
      console.error("Error creating invite:", error);
      res.status(500).json({ error: "Failed to create invite" });
    }
  });

  // Member preferences
  app.get("/api/trips/:tripId/preferences", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const preferences = await storage.getPreferencesByTrip(getParam(req.params.tripId));
      res.json(preferences);
    } catch (error) {
      console.error("Error fetching preferences:", error);
      res.status(500).json({ error: "Failed to fetch preferences" });
    }
  });

  app.put("/api/trips/:tripId/preferences", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.tripId);
      const userId = (req as any).userId as string | undefined;
      const { budgetBand, pace, diet, budgetFlexibility, mustDoActivities, accessibility } = req.body;
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const existing = await storage.getPreference(tripId, userId);
      const pref = await storage.createOrUpdatePreference({
        id: existing?.id ?? randomUUID(),
        tripId,
        userId,
        budgetBand: budgetBand ?? null,
        pace: pace ?? null,
        diet: diet ?? null,
        budgetFlexibility: budgetFlexibility ?? null,
        mustDoActivities: mustDoActivities ?? null,
        accessibility: accessibility ?? null,
      });
      res.json(pref);
    } catch (error) {
      console.error("Error saving preferences:", error);
      res.status(500).json({ error: "Failed to save preferences" });
    }
  });

  // Chat
  app.get("/api/trips/:tripId/chat", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const messages = await storage.getChatMessagesByTrip(getParam(req.params.tripId));
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat:", error);
      res.status(500).json({ error: "Failed to fetch chat" });
    }
  });

  app.get("/api/trips/:tripId/photos", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const photos = await storage.getPhotosByTrip(getParam(req.params.tripId));
      res.json(photos);
    } catch (error) {
      console.error("Error fetching photos:", error);
      res.status(500).json({ error: "Failed to fetch photos" });
    }
  });

  app.post("/api/trips/:tripId/photos", requireAuth, requireFileUploads, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.tripId);
      const userId = (req as any).userId as string | undefined;
      const { url, caption } = req.body;
      if (!userId || !url) return res.status(400).json({ error: "url required" });
      const photoCheck = await canAddPhotoToTrip(tripId);
      if (!photoCheck.allowed) {
        return res.status(403).json({ error: photoCheck.reason, upgradeUrl: "/pricing" });
      }
      const photo = await storage.createTripPhoto({
        id: randomUUID(),
        tripId,
        userId,
        url,
        caption: caption ?? null,
      });
      res.status(201).json(photo);
    } catch (error) {
      console.error("Error adding photo:", error);
      res.status(500).json({ error: "Failed to add photo" });
    }
  });

  app.delete("/api/trips/:tripId/photos/:photoId", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const photoId = getParam(req.params.photoId);
      await storage.deleteTripPhoto(photoId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting photo:", error);
      res.status(500).json({ error: "Failed to delete photo" });
    }
  });

  // Trip member RSVP
  app.patch("/api/trips/:tripId/members/:memberId", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const memberId = getParam(req.params.memberId);
      const { rsvpStatus } = req.body;
      if (!rsvpStatus || !["pending", "accepted", "declined"].includes(rsvpStatus)) return res.status(400).json({ error: "Invalid rsvpStatus" });
      const updated = await storage.updateTripMember(memberId, { rsvpStatus });
      if (!updated) return res.status(404).json({ error: "Member not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating member:", error);
      res.status(500).json({ error: "Failed to update member" });
    }
  });

  // Quick polls
  app.post("/api/trips/:tripId/polls", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.tripId);
      const createdByUserId = (req as any).userId as string | undefined;
      const { question, options, deadline } = req.body;
      if (!createdByUserId || !question || !options || !Array.isArray(options) || options.length < 2) return res.status(400).json({ error: "question and options (array of 2+) required" });
      const poll = await storage.createPoll({
        id: randomUUID(),
        tripId,
        createdByUserId,
        question,
        options,
        deadline: deadline ?? null,
        status: "open",
      });
      res.status(201).json(poll);
    } catch (error) {
      console.error("Error creating poll:", error);
      res.status(500).json({ error: "Failed to create poll" });
    }
  });

  app.post("/api/trips/:tripId/polls/:pollId/vote", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const pollId = getParam(req.params.pollId);
      const userId = (req as any).userId as string | undefined;
      const { optionIndex } = req.body;
      if (!userId || optionIndex === undefined) return res.status(400).json({ error: "optionIndex required" });
      const vote = await storage.createOrUpdatePollVote({
        id: randomUUID(),
        pollId,
        userId,
        optionIndex: Number(optionIndex),
      });
      res.json(vote);
    } catch (error) {
      console.error("Error voting:", error);
      res.status(500).json({ error: "Failed to vote" });
    }
  });

  app.delete("/api/trips/:tripId/polls/:pollId", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const pollId = getParam(req.params.pollId);
      await storage.deletePoll(pollId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting poll:", error);
      res.status(500).json({ error: "Failed to delete poll" });
    }
  });

  // Packing list
  app.post("/api/trips/:tripId/packing", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.tripId);
      const { name, assignedToUserId, notes } = req.body;
      if (!name) return res.status(400).json({ error: "name required" });
      const item = await storage.createPackingItem({
        id: randomUUID(),
        tripId,
        name,
        assignedToUserId: assignedToUserId ?? null,
        notes: notes ?? null,
      });
      res.status(201).json(item);
    } catch (error) {
      console.error("Error adding packing item:", error);
      res.status(500).json({ error: "Failed to add packing item" });
    }
  });

  app.patch("/api/trips/:tripId/packing/:itemId", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const itemId = getParam(req.params.itemId);
      const updates = req.body;
      const item = await storage.updatePackingItem(itemId, updates);
      if (!item) return res.status(404).json({ error: "Packing item not found" });
      res.json(item);
    } catch (error) {
      console.error("Error updating packing item:", error);
      res.status(500).json({ error: "Failed to update packing item" });
    }
  });

  app.delete("/api/trips/:tripId/packing/:itemId", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const itemId = getParam(req.params.itemId);
      await storage.deletePackingItem(itemId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting packing item:", error);
      res.status(500).json({ error: "Failed to delete packing item" });
    }
  });

  // Transportation
  app.post("/api/trips/:tripId/transportation", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.tripId);
      const { dayNumber, type, description, driverUserId, passengerUserIds, notes } = req.body;
      if (!dayNumber || !type || !description) return res.status(400).json({ error: "dayNumber, type, description required" });
      const entry = await storage.createTransportationEntry({
        id: randomUUID(),
        tripId,
        dayNumber: Number(dayNumber),
        type,
        description,
        driverUserId: driverUserId ?? null,
        passengerUserIds: passengerUserIds ?? [],
        notes: notes ?? null,
      });
      res.status(201).json(entry);
    } catch (error) {
      console.error("Error adding transportation:", error);
      res.status(500).json({ error: "Failed to add transportation" });
    }
  });

  app.patch("/api/trips/:tripId/transportation/:entryId", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const entryId = getParam(req.params.entryId);
      const updates = req.body;
      const entry = await storage.updateTransportationEntry(entryId, updates);
      if (!entry) return res.status(404).json({ error: "Transportation entry not found" });
      res.json(entry);
    } catch (error) {
      console.error("Error updating transportation:", error);
      res.status(500).json({ error: "Failed to update transportation" });
    }
  });

  app.delete("/api/trips/:tripId/transportation/:entryId", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const entryId = getParam(req.params.entryId);
      await storage.deleteTransportationEntry(entryId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting transportation:", error);
      res.status(500).json({ error: "Failed to delete transportation" });
    }
  });

  // Group availability
  app.put("/api/trips/:tripId/availability", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.tripId);
      const userId = (req as any).userId as string | undefined;
      const { availableDates } = req.body;
      if (!userId || !Array.isArray(availableDates)) return res.status(400).json({ error: "availableDates (array) required" });
      const avail = await storage.setUserAvailability(tripId, userId, availableDates);
      res.json(avail);
    } catch (error) {
      console.error("Error setting availability:", error);
      res.status(500).json({ error: "Failed to set availability" });
    }
  });

  app.post("/api/trips/:tripId/chat", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.tripId);
      const userId = (req as any).userId as string | undefined;
      const { content, itemId } = req.body;
      if (!userId || !content) return res.status(400).json({ error: "Content required" });
      const msg = await storage.createChatMessage({
        id: randomUUID(),
        tripId,
        userId,
        content,
        itemId: itemId || null,
      });
      res.status(201).json(msg);
    } catch (error) {
      console.error("Error posting chat:", error);
      res.status(500).json({ error: "Failed to post message" });
    }
  });

  // Trip documents (boarding passes, confirmations, vaccination)
  app.get("/api/trips/:tripId/documents", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.tripId);
      const list = await storage.getDocumentsByTrip(tripId);
      res.json(list);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.post("/api/trips/:tripId/documents", requireAuth, requireFileUploads, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.tripId);
      const { uploadedByUserId, type, name, url, notes } = req.body;
      if (!uploadedByUserId || !type || !name || !url) return res.status(400).json({ error: "uploadedByUserId, type, name, url required" });
      const doc = await storage.createTripDocument({
        id: randomUUID(),
        tripId,
        uploadedByUserId,
        type,
        name,
        url,
        notes: notes || null,
        expiryDate: req.body.expiryDate || null,
      });
      res.status(201).json(doc);
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(500).json({ error: "Failed to create document" });
    }
  });

  app.patch("/api/trips/:tripId/documents/:docId", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const docId = getParam(req.params.docId);
      const updates = req.body;
      const doc = await storage.updateTripDocument(docId, updates);
      if (!doc) return res.status(404).json({ error: "Document not found" });
      res.json(doc);
    } catch (error) {
      console.error("Error updating document:", error);
      res.status(500).json({ error: "Failed to update document" });
    }
  });

  app.delete("/api/trips/:tripId/documents/:docId", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const docId = getParam(req.params.docId);
      await storage.deleteTripDocument(docId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // Emergency contacts
  app.get("/api/trips/:tripId/emergency-contacts", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.tripId);
      const list = await storage.getEmergencyContactsByTrip(tripId);
      res.json(list);
    } catch (error) {
      console.error("Error fetching emergency contacts:", error);
      res.status(500).json({ error: "Failed to fetch emergency contacts" });
    }
  });

  app.post("/api/trips/:tripId/emergency-contacts", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.tripId);
      const { type, name, phone, url, notes } = req.body;
      if (!type || !name) return res.status(400).json({ error: "type and name required" });
      const contact = await storage.createEmergencyContact({
        id: randomUUID(),
        tripId,
        type,
        name,
        phone: phone || null,
        url: url || null,
        notes: notes || null,
      });
      res.status(201).json(contact);
    } catch (error) {
      console.error("Error creating emergency contact:", error);
      res.status(500).json({ error: "Failed to create emergency contact" });
    }
  });

  app.patch("/api/trips/:tripId/emergency-contacts/:contactId", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const contactId = getParam(req.params.contactId);
      const updates = req.body;
      const updated = await storage.updateEmergencyContact(contactId, updates);
      if (!updated) return res.status(404).json({ error: "Contact not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating emergency contact:", error);
      res.status(500).json({ error: "Failed to update emergency contact" });
    }
  });

  app.delete("/api/trips/:tripId/emergency-contacts/:contactId", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const contactId = getParam(req.params.contactId);
      await storage.deleteEmergencyContact(contactId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting emergency contact:", error);
      res.status(500).json({ error: "Failed to delete emergency contact" });
    }
  });

  // Mood board
  app.post("/api/trips/:tripId/mood-board", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.tripId);
      const userId = (req as any).userId as string;
      const { url, label } = req.body;
      if (!url || typeof url !== "string") return res.status(400).json({ error: "url required" });
      const item = await storage.createMoodBoardItem({
        id: randomUUID(),
        tripId,
        url: url.trim(),
        label: typeof label === "string" ? label.trim() || null : null,
        addedByUserId: userId,
      });
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating mood board item:", error);
      res.status(500).json({ error: "Failed to add to mood board" });
    }
  });

  app.delete("/api/trips/:tripId/mood-board/:itemId", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const itemId = getParam(req.params.itemId);
      await storage.deleteMoodBoardItem(itemId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting mood board item:", error);
      res.status(500).json({ error: "Failed to remove from mood board" });
    }
  });

  // Generate trip recap (AI)
  app.post("/api/trips/:tripId/generate-recap", requireAuth, requireAI, requireTripAccess, aiGenerationRateLimiter, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.tripId);
      const trip = await storage.getTrip(tripId);
      if (!trip) return res.status(404).json({ error: "Trip not found" });
      const items = await storage.getItineraryItems(tripId);
      const photos = await storage.getPhotosByTrip(tripId);
      const itinerarySummary = items.length
        ? items.slice(0, 15).map((i) => `${i.dayNumber}: ${i.name}`).join("; ")
        : undefined;
      const photoCaptions = photos.map((p) => p.caption).filter(Boolean) as string[];
      const { recap } = await generateTripRecap({
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        itinerarySummary,
        photoCaptions,
      });
      await storage.updateTrip(tripId, { recapText: recap });
      res.json({ recap });
    } catch (error) {
      console.error("Error generating recap:", error);
      res.status(500).json({ error: "Failed to generate recap" });
    }
  });

  // Generate packing list (AI)
  app.post("/api/trips/:tripId/generate-packing-list", requireAuth, requireAI, requireTripAccess, aiGenerationRateLimiter, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.tripId);
      const trip = await storage.getTrip(tripId);
      if (!trip) return res.status(404).json({ error: "Trip not found" });
      const { items } = await generatePackingList({
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        tripType: (trip as { tripType?: string }).tripType,
        groupSize: trip.groupSize,
      });
      const userId = (req as any).userId as string;
      const created = [];
      for (const name of items) {
        const item = await storage.createPackingItem({
          id: randomUUID(),
          tripId,
          name,
          assignedToUserId: null,
          notes: null,
        });
        created.push(item);
      }
      res.json({ items: created });
    } catch (error) {
      console.error("Error generating packing list:", error);
      res.status(500).json({ error: "Failed to generate packing list" });
    }
  });

  // Email import: parse confirmation email and suggest itinerary items
  app.post("/api/trips/:tripId/parse-email", requireAuth, requireAI, requireTripAccess, requirePlanner, requirePro, aiGenerationRateLimiter, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.tripId);
      const { emailText } = req.body as { emailText?: string };
      if (!emailText || typeof emailText !== "string") return res.status(400).json({ error: "emailText required" });
      const trip = await storage.getTrip(tripId);
      const { suggestions } = await parseEmailForItinerary({ emailText: emailText.slice(0, 10000), destination: trip?.destination });
      res.json({ suggestions });
    } catch (error) {
      console.error("Parse email error:", error);
      res.status(500).json({ error: "Failed to parse email", suggestions: [] });
    }
  });

  // Place discovery (proxy to avoid CORS; uses Nominatim/Overpass for POIs) — Pro only
  app.get("/api/places/search", requireAuth, requirePro, async (req: Request, res: Response) => {
    try {
      const q = (req.query.q as string)?.trim();
      const near = (req.query.near as string)?.trim();
      if (!q && !near) return res.status(400).json({ error: "q or near required" });
      const query = q || near;
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=15`;
      const resp = await fetch(url, { headers: { "User-Agent": "TripSync/1.0" } });
      if (!resp.ok) throw new Error("Places service unavailable");
      const data = await resp.json();
      const places = (Array.isArray(data) ? data : []).slice(0, 15).map((p: { place_id: number; display_name: string; lat: string; lon: string; type?: string; class?: string }) => ({
        id: String(p.place_id),
        name: p.display_name,
        lat: parseFloat(p.lat),
        lng: parseFloat(p.lon),
        type: p.type || p.class || "place",
      }));
      res.json({ places });
    } catch (error) {
      console.error("Places search error:", error);
      res.status(500).json({ error: "Search failed", places: [] });
    }
  });

  // Trip satisfaction (analytics) — also updates preference learning from this trip
  app.post("/api/trips/:tripId/satisfaction", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.tripId);
      const userId = (req as any).userId as string | undefined;
      const { score, comment } = req.body;
      if (!userId || score == null) return res.status(400).json({ error: "score (1-5) required" });
      const entry = await storage.createOrUpdateTripSatisfaction({
        id: randomUUID(),
        tripId,
        userId,
        score: Math.min(5, Math.max(1, Number(score))),
        comment: comment || null,
      });

      // Preference learning: merge this trip's vibes/tripType into user's learned preferences
      const trip = await storage.getTrip(tripId);
      if (trip) {
        const existing = await storage.getUserLearnedPreferences(userId);
        const vibes = (trip.vibes || []) as string[];
        const tripType = (trip as { tripType?: string }).tripType;
        const vibesPreferred = Array.from(new Set([...(existing?.vibesPreferred ?? []), ...vibes]));
        const tripTypesPreferred = tripType
          ? Array.from(new Set([...(existing?.tripTypesPreferred ?? []), tripType]))
          : (existing?.tripTypesPreferred ?? []);
        const learnedFromTripIds = Array.from(new Set([...(existing?.learnedFromTripIds ?? []), tripId])).slice(-50);
        await storage.createOrUpdateUserLearnedPreferences({
          id: existing?.id ?? randomUUID(),
          userId,
          vibesPreferred: vibesPreferred.length ? vibesPreferred : undefined,
          tripTypesPreferred: tripTypesPreferred.length ? tripTypesPreferred : undefined,
          budgetBand: existing?.budgetBand ?? undefined,
          learnedFromTripIds: learnedFromTripIds.length ? learnedFromTripIds : undefined,
        });
      }

      res.json(entry);
    } catch (error) {
      console.error("Error saving satisfaction:", error);
      res.status(500).json({ error: "Failed to save satisfaction" });
    }
  });

  // Push notifications (VAPID public key - no auth)
  app.get("/api/push/vapid-public", (_req: Request, res: Response) => {
    res.json({ publicKey: getVapidPublicKey() });
  });

  // Push subscription (store for reminders)
  app.post("/api/trips/:tripId/push/subscribe", requireAuth, requirePush, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.tripId);
      const userId = (req as any).userId;
      const subscription = req.body;
      if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
        return res.status(400).json({ error: "Invalid push subscription" });
      }
      addSubscription(userId, tripId, subscription);
      startReminderScheduler();
      res.json({ ok: true });
    } catch (error) {
      console.error("Push subscribe error:", error);
      res.status(500).json({ error: "Failed to subscribe" });
    }
  });

  // Location sharing (optional, during trip)
  app.put("/api/trips/:tripId/location", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.tripId);
      const { userId, lat, lng } = req.body;
      if (!userId || lat == null || lng == null) return res.status(400).json({ error: "userId, lat, lng required" });
      const loc = await storage.setUserLocation(tripId, userId, String(lat), String(lng));
      res.json(loc);
    } catch (error) {
      console.error("Error setting location:", error);
      res.status(500).json({ error: "Failed to set location" });
    }
  });

  // Trip analytics (cost per person, activity breakdown, satisfaction)
  app.get("/api/trips/:tripId/analytics", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.tripId);
      const trip = await storage.getTrip(tripId);
      if (!trip) return res.status(404).json({ error: "Trip not found" });
      const [items, expenses, satisfaction] = await Promise.all([
        storage.getItineraryItems(tripId),
        storage.getExpensesByTrip(tripId),
        storage.getSatisfactionByTrip(tripId),
      ]);
      const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
      const memberCount = (await storage.getTripMembers(tripId)).length;
      const costPerPerson = memberCount > 0 ? Math.round(totalSpent / memberCount) : 0;
      const byType = items.reduce<Record<string, number>>((acc, i) => {
        acc[i.type] = (acc[i.type] ?? 0) + 1;
        return acc;
      }, {});
      const avgSatisfaction = satisfaction.length > 0
        ? satisfaction.reduce((s, e) => s + e.score, 0) / satisfaction.length
        : null;
      res.json({
        costPerPerson,
        totalSpent,
        activityBreakdown: byType,
        satisfactionCount: satisfaction.length,
        averageSatisfaction: avgSatisfaction,
        budgetPerPerson: trip.budgetPerPerson,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Smart conflict resolution (AI suggests compromise for a poll)
  app.post("/api/trips/:tripId/suggest-resolution", requireAuth, requireAI, requireTripAccess, aiGenerationRateLimiter, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.tripId);
      const { question, options, voteCounts } = req.body;
      if (!question || !Array.isArray(options) || !Array.isArray(voteCounts)) return res.status(400).json({ error: "question, options, voteCounts required" });
      const result = await suggestConflictResolution({ question, options, voteCounts });
      res.json(result);
    } catch (error) {
      console.error("Error suggesting resolution:", error);
      res.status(500).json({ error: "Failed to suggest resolution" });
    }
  });

  // Conversational planning (chat interface for quick changes)
  app.post("/api/trips/:tripId/planning-chat", requireAuth, requireAI, requireTripAccess, aiGenerationRateLimiter, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.tripId);
      const { userMessage, currentPage, timeOnPage, lastAction, inactivityTime } = req.body as {
        userMessage?: string;
        currentPage?: string;
        timeOnPage?: number;
        lastAction?: string;
        inactivityTime?: number;
      };
      if (!userMessage) return res.status(400).json({ error: "userMessage required" });

      const trip = await storage.getTrip(tripId);
      if (!trip) return res.status(404).json({ error: "Trip not found" });

      const [membersWithUsers, items, expenses, votes] = await Promise.all([
        storage.getTripMembers(tripId),
        storage.getItineraryItems(tripId),
        storage.getExpensesByTrip(tripId),
        storage.getVotesByTrip(tripId),
      ]);

      const confirmedMembers = membersWithUsers.filter((m) => (m as any).rsvpStatus !== "declined").length;
      const totalMembers = membersWithUsers.length || trip.groupSize || 0;
      const pendingMembers = Math.max(totalMembers - confirmedMembers, 0);

      const totalBudget = (trip.budgetPerPerson || 0) * (trip.groupSize || totalMembers || 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const overBudget = totalBudget > 0 && totalExpenses > totalBudget;
      const overAmount = overBudget ? totalExpenses - totalBudget : 0;

      const dayNumbers = Array.from(new Set(items.map((i) => i.dayNumber))).sort((a, b) => a - b);
      const daysWithActivities = dayNumbers.length;
      const tripStart = new Date(trip.startDate);
      const tripEnd = new Date(trip.endDate);
      const tripDays = Number.isNaN(tripStart.getTime()) || Number.isNaN(tripEnd.getTime())
        ? null
        : Math.max(1, Math.round((tripEnd.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      const daysWithoutActivities = tripDays != null ? Math.max(tripDays - daysWithActivities, 0) : 0;

      const completionBase = tripDays && tripDays > 0 ? tripDays * 3 : 6;
      const completionPercentage = Math.max(
        0,
        Math.min(100, completionBase > 0 ? Math.round((items.length / completionBase) * 100) : 0)
      );

      const daysUntilTrip = Number.isNaN(tripStart.getTime())
        ? null
        : Math.ceil((tripStart.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      const activeVotes = votes.length; // per-item votes; treat any presence as "active"
      const stuckVotes = votes.reduce((count, v) => {
        // Approximate stuck-ness by per-item tallies when tied; reuse getVotesByTrip aggregation later if needed
        return count + 0;
      }, 0);

      const detectedIssues: string[] = [];
      if (overBudget && overAmount > 0) {
        detectedIssues.push(`Budget overrun of $${overAmount}. Total spend $${totalExpenses} vs budget $${totalBudget}.`);
      }
      if (tripDays != null && daysWithoutActivities > 0) {
        detectedIssues.push(`${daysWithoutActivities} of ${tripDays} days have no planned activities.`);
      }
      if (daysUntilTrip != null && daysUntilTrip <= 7 && completionPercentage < 50) {
        detectedIssues.push(
          `Trip starts in ${daysUntilTrip} days but itinerary is only ${completionPercentage}% complete.`
        );
      }
      if (pendingMembers > 0) {
        detectedIssues.push(`${pendingMembers} invited members have not confirmed yet.`);
      }

      const context: AtlasRichContext = {
        trip: {
          id: trip.id,
          destination: trip.destination,
          startDate: trip.startDate,
          endDate: trip.endDate,
          budgetPerPerson: trip.budgetPerPerson,
          groupSize: trip.groupSize,
          status: trip.status,
          isLocked: (trip as any).isLocked ?? false,
        },
        progress: {
          itineraryItems: items.length,
          daysWithActivities,
          daysWithoutActivities,
          totalExpenses,
          totalBudget,
          overBudget,
          overAmount,
          confirmedMembers,
          pendingMembers,
          activeVotes,
          stuckVotes,
          completionPercentage,
          daysUntilTrip,
        },
        behavior: {
          currentPage,
          timeOnPage,
          lastAction,
          inactivityTime,
        },
        group: {
          vibes: trip.vibes,
        },
        detectedIssues,
      };

      const result = await conversationalPlanningSuggestion({
        tripId,
        userMessage: String(userMessage).trim(),
        context,
        fullTrip: trip,
        items,
        expenses,
        votes,
        members: membersWithUsers,
      });
      res.json(result);
    } catch (error) {
      console.error("Error in planning chat:", error);
      res.status(500).json({ error: "Failed to get suggestion" });
    }
  });

  // Atlas: generate additional AI itinerary suggestions for an existing trip
  app.post("/api/trips/:tripId/ai-suggestions", requireAuth, requireAI, requireTripAccess, aiGenerationRateLimiter, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.tripId);
      const trip = await storage.getTrip(tripId);
      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }

      const tripData: TripWizardData = {
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        budgetPerPerson: trip.budgetPerPerson,
        groupSize: trip.groupSize,
        vibes: trip.vibes,
        accommodationPref: trip.accommodationPref,
        diningPref: trip.diningPref,
      };

      await generateItinerary(tripId, tripData);
      res.json({ success: true });
    } catch (error) {
      console.error("Error generating AI suggestions for trip:", error);
      res.status(500).json({ error: "Failed to generate AI suggestions" });
    }
  });

  // Travel insurance helper: return a simple quote URL based on trip budget
  app.get("/api/trips/:tripId/insurance-quote", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.tripId);
      const trip = await storage.getTrip(tripId);
      if (!trip) return res.status(404).json({ error: "Trip not found" });

      const groupSize = trip.groupSize || 0;
      const totalBudget = (trip.budgetPerPerson || 0) * groupSize;
      const url = `https://www.google.com/search?q=${encodeURIComponent(
        `travel insurance for trip costing $${totalBudget} to ${trip.destination}`
      )}`;

      res.json({
        totalBudget,
        groupSize,
        suggestionUrl: url,
      });
    } catch (error) {
      console.error("Error generating insurance quote helper:", error);
      res.status(500).json({ error: "Failed to build insurance suggestion" });
    }
  });

  // Flight price watch stub – records interest in tracking flight prices (can be wired to a provider later)
  app.post("/api/trips/:tripId/flight-watch", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.tripId);
      const { flight } = req.body as { flight?: { from?: string; to?: string; date?: string; airline?: string } };
      if (!flight) {
        return res.status(400).json({ error: "flight payload required" });
      }
      console.log("Flight watch requested", { tripId, flight });
      res.json({ success: true, message: "Flight watch recorded. Price alerts will be available in a future update." });
    } catch (error) {
      console.error("Error recording flight watch:", error);
      res.status(500).json({ error: "Failed to record flight watch" });
    }
  });

  // Atlas conversation memory (per-trip, per-user)
  app.get("/api/trips/:tripId/atlas/conversation", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.tripId);
      const userId = (req as any).userId as string | undefined;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // When using Postgres, persist via atlas_conversations; otherwise fall back to in-memory (non-persistent) map.
      const db = getDb();
      const [row] = await db
        .select()
        .from(atlasConversations)
        .where(and(eq(atlasConversations.tripId, tripId), eq(atlasConversations.userId, userId)))
        .limit(1);

      if (!row) {
        return res.json({ messages: [] });
      }
      res.json({ messages: (row as any).messages ?? [] });
    } catch (error) {
      console.error("Error loading Atlas conversation:", error);
      res.status(500).json({ error: "Failed to load conversation" });
    }
  });

  app.post("/api/trips/:tripId/atlas/conversation", requireAuth, requireAI, requireTripAccess, aiGenerationRateLimiter, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.tripId);
      const { message } = req.body as { message?: unknown };
      const userId = (req as any).userId as string | undefined;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      if (!message) {
        return res.status(400).json({ error: "message required" });
      }

      const db = getDb();
      const existing = await db
        .select()
        .from(atlasConversations)
        .where(and(eq(atlasConversations.tripId, tripId), eq(atlasConversations.userId, userId)))
        .limit(1);

      if (existing.length > 0) {
        const currentMessages = ((existing[0] as any).messages ?? []) as unknown[];
        await db
          .update(atlasConversations)
          .set({
            messages: [...currentMessages, message],
            updatedAt: new Date(),
          } as any)
          .where(eq(atlasConversations.id, (existing[0] as any).id));
      } else {
        await db.insert(atlasConversations).values({
          id: randomUUID(),
          tripId,
          userId,
          messages: [message],
        } as any);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error saving Atlas conversation:", error);
      res.status(500).json({ error: "Failed to save conversation" });
    }
  });

  // Atlas proactive notifications
  app.get("/api/trips/:tripId/atlas/notifications", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.tripId);
      const userId = (req as any).userId;

      const { atlasProactive } = await import('./atlas-proactive-service');
      const notifications = await atlasProactive.getNotifications(tripId, userId);

      res.json({ notifications });
    } catch (error) {
      console.error("Error fetching Atlas notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.post("/api/atlas/notifications/:notificationId/read", requireAuth, async (req: Request, res: Response) => {
    try {
      const notificationId = getParam(req.params.notificationId);

      const { atlasProactive } = await import('./atlas-proactive-service');
      await atlasProactive.markAsRead(notificationId);

      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.post("/api/atlas/notifications/:notificationId/dismiss", requireAuth, async (req: Request, res: Response) => {
    try {
      const notificationId = getParam(req.params.notificationId);

      const { atlasProactive } = await import('./atlas-proactive-service');
      await atlasProactive.dismissNotification(notificationId);

      res.json({ success: true });
    } catch (error) {
      console.error("Error dismissing notification:", error);
      res.status(500).json({ error: "Failed to dismiss notification" });
    }
  });

  app.post("/api/atlas/notifications/:notificationId/snooze", requireAuth, async (req: Request, res: Response) => {
    try {
      const notificationId = getParam(req.params.notificationId);
      const { duration } = req.body; // duration in milliseconds

      const { atlasProactive } = await import('./atlas-proactive-service');
      await atlasProactive.snoozeNotification(notificationId, duration || 24 * 60 * 60 * 1000); // Default 24 hours

      res.json({ success: true });
    } catch (error) {
      console.error("Error snoozing notification:", error);
      res.status(500).json({ error: "Failed to snooze notification" });
    }
  });

  // Group travel insights & trend predictions (from user's past trips)
  app.get("/api/users/:userId/insights", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getParam(req.params.userId);
      const trips = await storage.getTripsByUserId(userId);
      const learned = await storage.getUserLearnedPreferences(userId);
      const vibesCount: Record<string, number> = {};
      const tripTypes: Record<string, number> = {};
      trips.forEach((t) => {
        (t.vibes || []).forEach((v: string) => { vibesCount[v] = (vibesCount[v] ?? 0) + 1; });
        const tt = (t as { tripType?: string }).tripType;
        if (tt) tripTypes[tt] = (tripTypes[tt] ?? 0) + 1;
      });
      // Merge learned preferences (from rated trips) into counts so insights reflect AI learning
      (learned?.vibesPreferred ?? []).forEach((v: string) => { vibesCount[v] = (vibesCount[v] ?? 0) + 1; });
      (learned?.tripTypesPreferred ?? []).forEach((tt: string) => { tripTypes[tt] = (tripTypes[tt] ?? 0) + 1; });
      const topVibes = Object.entries(vibesCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
      const topTypes = Object.entries(tripTypes).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k);
      const insight = topVibes.length > 0 || topTypes.length > 0
        ? `Your group prefers ${topVibes.length ? topVibes.join(", ") + " trips" : ""}${topVibes.length && topTypes.length ? " and " : ""}${topTypes.length ? topTypes.join("/") + " style" : ""}.`
        : "Complete and rate trips to see group travel insights.";
      const trendSuggestion = topTypes.length > 0
        ? `Based on past trips, consider: ${topTypes[0]} destinations for your next trip.`
        : "Try a beach, city, or food tour for your next trip.";
      const learnedFromCount = (learned?.learnedFromTripIds ?? []).length;
      res.json({
        pastTripCount: trips.length,
        learnedPreferences: learned ?? null,
        learnedFromTripCount: learnedFromCount,
        groupInsight: insight,
        trendPrediction: trendSuggestion,
      });
    } catch (error) {
      console.error("Error fetching insights:", error);
      res.status(500).json({ error: "Failed to fetch insights" });
    }
  });

  // DELETE operations

  // Delete a trip (organizer only)
  app.delete("/api/trips/:id", requireAuth, requireTripAccess, requireOrganizer, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.id);

      // Delete all related data (cascade)
      await storage.deleteItineraryItemsByTripId(tripId);
      // Note: In a production app, you'd also delete all related data:
      // - Trip members, invites, preferences
      // - Comments, votes, expenses
      // - Chat messages, photos, polls
      // - Documents, emergency contacts, etc.

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting trip:", error);
      res.status(500).json({ error: "Failed to delete trip" });
    }
  });

  // Delete an itinerary item (planner only)
  app.delete("/api/trips/:tripId/items/:itemId", requireAuth, requireTripAccess, requirePlanner, async (req: Request, res: Response) => {
    try {
      const itemId = getParam(req.params.itemId);

      // Note: This would also delete related comments and votes in production
      await storage.deleteItineraryItem(itemId);

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting itinerary item:", error);
      res.status(500).json({ error: "Failed to delete itinerary item" });
    }
  });

  // Remove a trip member (organizer only, cannot remove self)
  app.delete("/api/trips/:tripId/members/:memberId", requireAuth, requireTripAccess, requireOrganizer, async (req: Request, res: Response) => {
    try {
      const memberId = getParam(req.params.memberId);
      const userId = (req as any).userId;
      const trip = (req as any).trip;

      // Get member details
      const member = await storage.getTripMemberById(memberId);
      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }

      // Cannot remove organizer
      if (member.userId === trip.organizerId) {
        return res.status(400).json({ error: "Cannot remove trip organizer" });
      }

      await storage.deleteTripMember(memberId);

      res.status(204).send();
    } catch (error) {
      console.error("Error removing member:", error);
      res.status(500).json({ error: "Failed to remove member" });
    }
  });

  // Delete a comment (comment author or planner only)
  app.delete("/api/trips/:tripId/items/:itemId/comments/:commentId", requireAuth, requireTripAccess, async (req: Request, res: Response) => {
    try {
      const commentId = getParam(req.params.commentId);
      const userId = (req as any).userId;
      const isPlanner = (req as any).isPlanner;

      const comment = await storage.getCommentById(commentId);
      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }

      // Only comment author or planner can delete
      if (comment.userId !== userId && !isPlanner) {
        return res.status(403).json({ error: "Not authorized to delete this comment" });
      }

      await storage.deleteComment(commentId);

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  // Cancel a trip (organizer only)
  app.post("/api/trips/:id/cancel", requireAuth, requireTripAccess, requireOrganizer, async (req: Request, res: Response) => {
    try {
      const tripId = getParam(req.params.id);

      const trip = await storage.updateTrip(tripId, { status: "cancelled" });
      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }

      res.json(trip);
    } catch (error) {
      console.error("Error cancelling trip:", error);
      res.status(500).json({ error: "Failed to cancel trip" });
    }
  });

  // Update member role (organizer only)
  app.patch("/api/trips/:tripId/members/:memberId/role", requireAuth, requireTripAccess, requireOrganizer, async (req: Request, res: Response) => {
    try {
      const memberId = getParam(req.params.memberId);
      const { role } = req.body;
      const trip = (req as any).trip;

      if (!role || !["member", "planner"].includes(role)) {
        return res.status(400).json({ error: "Invalid role. Must be 'member' or 'planner'" });
      }

      const member = await storage.getTripMemberById(memberId);
      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }

      // Cannot change organizer's role
      if (member.userId === trip.organizerId) {
        return res.status(400).json({ error: "Cannot change organizer's role" });
      }

      const updated = await storage.updateTripMember(memberId, { role });
      res.json(updated);
    } catch (error) {
      console.error("Error updating member role:", error);
      res.status(500).json({ error: "Failed to update member role" });
    }
  });

  return httpServer;
}
