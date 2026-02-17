/**
 * Admin metrics dashboard – separate from main app.
 * Access restricted via ADMIN_EMAILS env var (comma-separated).
 */

import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { env } from "../env";

export type MetricsPlatform = "web" | "ios" | "android";

export interface AdminMetricsResponse {
  platform: MetricsPlatform;
  totalUsers: number;
  totalTrips: number;
  totalItineraryItems: number;
  totalChatMessages: number;
  totalMembers: number;
  /** Placeholder for platform-specific analytics (GA, Mixpanel, etc.) */
  platformMetrics?: Record<string, number>;
}

function isAdmin(email: string): boolean {
  const admins = env.adminEmails;
  if (!admins.length) return false;
  return admins.includes(email.trim().toLowerCase());
}

export function registerAdminRoutes(app: Express): void {
  app.get("/api/admin/metrics", async (req: Request, res: Response) => {
    try {
      const userId = (req.query.userId as string) || (req.headers["x-user-id"] as string);
      const platform = ((req.query.platform as string) || "web") as MetricsPlatform;
      const validPlatforms: MetricsPlatform[] = ["web", "ios", "android"];
      const metricsPlatform = validPlatforms.includes(platform) ? platform : "web";

      if (!userId) {
        return res.status(401).json({ error: "userId required" });
      }

      const user = await storage.getUser(userId);
      if (!user || !isAdmin(user.email)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const counts = await storage.getAdminMetricsCounts();

      const response: AdminMetricsResponse = {
        platform: metricsPlatform,
        ...counts,
      };

      // Future: plug in platform-specific analytics (GA, Mixpanel) here
      // response.platformMetrics = await fetchPlatformAnalytics(metricsPlatform);

      res.json(response);
    } catch (err) {
      console.error("Admin metrics error:", err);
      res.status(500).json({ error: "Failed to load metrics" });
    }
  });
}
