import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { validateEnv, env } from "./env";
import { setVapidKeys } from "./push-service";
import { getDb } from "./db";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import net from "net";
import {
  initSentry,
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
  captureException,
} from "./sentry";
import { httpLogger, correlationIdMiddleware, appLogger } from "./logger";
import { startAtlasScheduler, stopAtlasScheduler } from "./atlas-monitor";

const app = express();
const httpServer = createServer(app);

// Initialize Sentry FIRST (before any other middleware)
initSentry(app);

const isProduction = process.env.NODE_ENV === "production";
if (isProduction) {
  app.set("trust proxy", 1);
}

// Security headers (Helmet) and compression (deployment guide)
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());

// Sentry request and tracing handlers (must be before routes)
app.use(sentryRequestHandler());
app.use(sentryTracingHandler());

// Request correlation IDs (before HTTP logger)
app.use(correlationIdMiddleware());

// Structured HTTP request logging
app.use(httpLogger());

// CORS when serving API separately (set CORS_ORIGIN e.g. https://yourdomain.com)
if (env.corsOrigin) {
  app.use(cors({ origin: env.corsOrigin }));
}

app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  if (isProduction) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Body parsing: JSON (10mb limit per deployment guide), URL-encoded
app.use(
  express.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// Legacy log function for backward compatibility
// New code should use appLogger.* methods instead
export function log(message: string, source = "express") {
  appLogger.debug(message, { source });
}

validateEnv();

(async () => {
  // Configure VAPID keys for web push if provided via environment
  if (env.vapidPublicKey && env.vapidPrivateKey) {
    try {
      setVapidKeys(env.vapidPublicKey, env.vapidPrivateKey);
      appLogger.database("VAPID keys configured from environment", { service: "push" });
    } catch (err) {
      appLogger.warn("Failed to configure VAPID keys from environment", {
        service: "push",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Run pending migrations when using PostgreSQL (e.g. in Docker)
  if (process.env.DATABASE_URL) {
    const migrationsDir = path.join(process.cwd(), "migrations");
    if (fs.existsSync(migrationsDir)) {
      try {
        const db = getDb();
        await migrate(db, { migrationsFolder: migrationsDir });
        appLogger.migration("migrations applied");
      } catch (err) {
        appLogger.error(
          err instanceof Error ? err : new Error(String(err)),
          { context: "migration" }
        );
        process.exit(1);
      }
    }
  }

  if (isProduction) {
    try {
      const { default: rateLimit } = await import("express-rate-limit");
      app.use(
        rateLimit({
          windowMs: 15 * 60 * 1000,
          max: 200,
          message: { error: "Too many requests" },
          standardHeaders: true,
          legacyHeaders: false,
        }),
      );
    } catch {
      // express-rate-limit not installed; skip rate limiting
    }
  }
  await registerRoutes(httpServer, app);
  const { registerUploadRoutes } = await import("./upload-routes");
  registerUploadRoutes(app);
  const { registerAdminRoutes } = await import("./admin/admin-routes");
  registerAdminRoutes(app);

  // Sentry error handler (must be before other error handlers)
  app.use(sentryErrorHandler());

  // Custom error handler
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log error with structured logging and capture in Sentry for 500 errors
    if (status >= 500) {
      appLogger.error(err, {
        http: {
          status_code: status,
          method: _req.method,
          url: _req.url,
        },
      });
      captureException(err, {
        http: {
          status_code: status,
          method: _req.method,
          url: _req.url,
        },
      });
    } else {
      appLogger.warn(`HTTP ${status} error`, {
        status,
        method: _req.method,
        url: _req.url,
        message: err.message,
      });
    }

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const host = env.host;
  const preferredPort = env.port;
  const maxPortAttempts = 10;

  function findAvailablePort(startPort: number): Promise<number> {
    return new Promise((resolve, reject) => {
      const tryPort = (port: number, attempt: number) => {
        if (attempt >= maxPortAttempts) {
          reject(
            new Error(
              `No available port found between ${startPort} and ${startPort + maxPortAttempts - 1}`,
            ),
          );
          return;
        }

        const tester = net.createServer();
        tester.once("error", (err: NodeJS.ErrnoException) => {
          if (err.code === "EADDRINUSE") {
            appLogger.warn(`Port ${port} in use, trying ${port + 1}`);
            tryPort(port + 1, attempt + 1);
            return;
          }
          reject(err);
        });
        tester.listen(port, host, () => {
          tester.close(() => resolve(port));
        });
      };

      tryPort(startPort, 0);
    });
  }

  // Periodic cleanup of expired tokens and old data
  function startPeriodicCleanup(): NodeJS.Timeout {
    // Run cleanup every hour
    const interval = setInterval(async () => {
      try {
        const { cleanupExpiredTokens } = await import("./password-reset-service");
        await cleanupExpiredTokens();

        // Also cleanup old Atlas notifications
        const { atlasProactive } = await import("./atlas-proactive-service");
        await atlasProactive.clearOldNotifications();
      } catch (error) {
        appLogger.error(
          error instanceof Error ? error : new Error(String(error)),
          { context: "periodic_cleanup" }
        );
      }
    }, 60 * 60 * 1000); // 1 hour

    appLogger.debug("Periodic cleanup job started");

    // Start Atlas AI monitoring scheduler (every 15 minutes)
    (async () => {
      try {
        if (process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY) {
          atlasScheduler = startAtlasScheduler();
          appLogger.debug("Atlas AI monitoring scheduler started");
        } else {
          appLogger.debug("Skipping Atlas scheduler (AI not configured)");
        }
      } catch (error) {
        appLogger.error(
          error instanceof Error ? error : new Error(String(error)),
          { context: "atlas_scheduler_startup" }
        );
      }
    })();

    return interval;
  }

  // Graceful shutdown handling
  let isShuttingDown = false;
  let cleanupInterval: NodeJS.Timeout | null = null;
  let atlasScheduler: NodeJS.Timeout | null = null;

  function gracefulShutdown(signal: string) {
    if (isShuttingDown) {
      appLogger.warn('Shutdown already in progress');
      return;
    }

    isShuttingDown = true;
    appLogger.warn(`${signal} received, starting graceful shutdown`);

    // Stop accepting new connections
    if (!httpServer.listening) {
      process.exit(0);
      return;
    }

    httpServer.close(async (err) => {
      if (err) {
        appLogger.error(err instanceof Error ? err : new Error(String(err)), {
          context: 'http_server_close',
        });
      } else {
        appLogger.debug('HTTP server closed');
      }

      try {
        // Stop periodic cleanup job
        if (cleanupInterval) {
          clearInterval(cleanupInterval);
          appLogger.debug('Stopped periodic cleanup job');
        }

        // Stop Atlas AI monitoring
        if (atlasScheduler) {
          stopAtlasScheduler(atlasScheduler);
          appLogger.debug('Stopped Atlas AI monitoring');
        }

        // Stop Atlas proactive monitoring
        const { atlasProactive } = await import('./atlas-proactive-service');
        atlasProactive.stopMonitoring();
        appLogger.debug('Stopped Atlas monitoring');

        // Shutdown token blacklist service
        const { tokenBlacklist } = await import('./token-blacklist');
        await tokenBlacklist.shutdown();
        appLogger.debug('Token blacklist shut down');

        // Shutdown Redis cache
        const { cache } = await import('./cache');
        await cache.shutdown();
        appLogger.debug('Redis cache shut down');

        appLogger.warn('Graceful shutdown complete');
        process.exit(0);
      } catch (error) {
        appLogger.error(error instanceof Error ? error : new Error(String(error)), {
          context: 'graceful_shutdown',
        });
        process.exit(1);
      }
    });

    // Force shutdown after 30 seconds if graceful shutdown hangs
    setTimeout(() => {
      appLogger.error(new Error('Graceful shutdown timeout, forcing exit'));
      process.exit(1);
    }, 30000);
  }

  // Register shutdown handlers
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    appLogger.error(error, { context: 'uncaught_exception' });
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason) => {
    appLogger.error(
      reason instanceof Error ? reason : new Error(String(reason)),
      { context: 'unhandled_rejection' }
    );
    gracefulShutdown('UNHANDLED_REJECTION');
  });

  const port = await findAvailablePort(preferredPort);
  httpServer.listen(port, host, () => {
    const displayHost = host === "0.0.0.0" ? "localhost" : host;
    appLogger.startup(displayHost, port);
    cleanupInterval = startPeriodicCleanup();

    // Start Atlas AI proactive monitoring (checks trips every 15 minutes)
    atlasScheduler = startAtlasScheduler();
    appLogger.ai('Atlas monitoring started', { interval: '15 minutes' });
  });
})();
