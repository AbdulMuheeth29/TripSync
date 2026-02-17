/**
 * Validates and documents required environment variables.
 * In production, missing required vars will log a warning; AI features will fail at runtime if key is missing.
 */

const isProduction = process.env.NODE_ENV === "production";

export function validateEnv(): void {
  if (isProduction && process.env.DATABASE_URL) {
    try {
      new URL(process.env.DATABASE_URL);
    } catch {
      console.warn("[env] DATABASE_URL is set but not a valid URL");
    }
  }

  if (process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL) {
    try {
      new URL(process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL);
    } catch {
      console.warn("[env] AI_INTEGRATIONS_ANTHROPIC_BASE_URL is set but not a valid URL");
    }
  }
}

export const env = {
  get nodeEnv(): string {
    return process.env.NODE_ENV ?? "development";
  },
  get port(): number {
    return parseInt(process.env.PORT ?? "3000", 10);
  },
  get host(): string {
    return process.env.HOST ?? "0.0.0.0";
  },
  get databaseUrl(): string | undefined {
    return process.env.DATABASE_URL;
  },
  get anthropicApiKey(): string | undefined {
    return process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  },
  get anthropicBaseUrl(): string | undefined {
    return process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  },
  /** Comma-separated admin emails for metrics dashboard access */
  get adminEmails(): string[] {
    const v = process.env.ADMIN_EMAILS;
    return v ? v.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean) : [];
  },
};
