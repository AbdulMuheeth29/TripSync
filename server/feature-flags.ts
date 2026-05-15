import { env } from "./env";

type FeatureFlag = {
  name: string;
  enabled: boolean;
  description: string;
  envVar: string;
};

/**
 * Feature flags system for emergency feature disable without redeployment.
 * Uses environment variables for simple on/off control.
 *
 * Usage in routes:
 *   if (!featureFlags.isEnabled("ai")) {
 *     return res.status(503).json({ error: "AI features temporarily disabled" });
 *   }
 *
 * To disable a feature:
 *   1. Set FEATURE_AI_ENABLED=false in .env
 *   2. Restart app: docker-compose restart app
 */
class FeatureFlags {
  private flags: Map<string, { enabled: boolean; description: string; envVar: string }> = new Map();

  constructor() {
    // Initialize from environment variables
    this.flags.set("ai", {
      enabled: env.isAiEnabled,
      description: "AI trip generation and Atlas assistant",
      envVar: "FEATURE_AI_ENABLED"
    });

    this.flags.set("fileUploads", {
      enabled: env.isFileUploadsEnabled,
      description: "Photo and document uploads",
      envVar: "FEATURE_FILE_UPLOADS_ENABLED"
    });

    this.flags.set("stripe", {
      enabled: env.isStripeEnabled,
      description: "Billing and subscriptions",
      envVar: "FEATURE_STRIPE_ENABLED"
    });

    this.flags.set("chat", {
      enabled: env.isChatEnabled,
      description: "Real-time chat",
      envVar: "FEATURE_CHAT_ENABLED"
    });

    this.flags.set("push", {
      enabled: env.isPushEnabled,
      description: "Push notifications",
      envVar: "FEATURE_PUSH_ENABLED"
    });
  }

  /**
   * Check if a feature is enabled
   */
  isEnabled(flag: string): boolean {
    return this.flags.get(flag)?.enabled ?? false;
  }

  /**
   * Get all feature flags with their status
   */
  getAll(): FeatureFlag[] {
    return Array.from(this.flags.entries()).map(([name, { enabled, description, envVar }]) => ({
      name,
      enabled,
      description,
      envVar
    }));
  }

  /**
   * Get a human-readable status report
   */
  getStatusReport(): string {
    const flags = this.getAll();
    const lines = [
      "Feature Flags Status:",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    ];

    for (const flag of flags) {
      const status = flag.enabled ? "✓ ENABLED " : "✗ DISABLED";
      lines.push(`${status} ${flag.name.padEnd(15)} - ${flag.description}`);
      lines.push(`           ${flag.envVar}=${flag.enabled}`);
    }

    lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    return lines.join("\n");
  }
}

export const featureFlags = new FeatureFlags();

// Log feature flags status on startup
console.log("\n" + featureFlags.getStatusReport() + "\n");
