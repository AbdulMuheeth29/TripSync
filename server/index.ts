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

const app = express();
const httpServer = createServer(app);

const isProduction = process.env.NODE_ENV === "production";
if (isProduction) {
  app.set("trust proxy", 1);
}

// Security headers (Helmet) and compression (deployment guide)
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());

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

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

validateEnv();

(async () => {
  // Configure VAPID keys for web push if provided via environment
  if (env.vapidPublicKey && env.vapidPrivateKey) {
    try {
      setVapidKeys(env.vapidPublicKey, env.vapidPrivateKey);
      log("VAPID keys configured from environment", "push");
    } catch (err) {
      console.warn("[push] Failed to configure VAPID keys from environment:", err);
    }
  }

  // Run pending migrations when using PostgreSQL (e.g. in Docker)
  if (process.env.DATABASE_URL) {
    const migrationsDir = path.join(process.cwd(), "migrations");
    if (fs.existsSync(migrationsDir)) {
      try {
        const db = getDb();
        await migrate(db, { migrationsFolder: migrationsDir });
        log("migrations applied");
      } catch (err) {
        console.error("Migration failed:", err);
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

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

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

  function tryListen(port: number) {
    httpServer.listen(port, host, () => {
      log(`serving on http://${host === "0.0.0.0" ? "localhost" : host}:${port}`);
    });
  }

  httpServer.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE" && preferredPort === 3000) {
      log(`port ${preferredPort} in use, trying ${preferredPort + 1}`);
      tryListen(preferredPort + 1);
    } else {
      throw err;
    }
  });

  tryListen(preferredPort);
})();
