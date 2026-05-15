/**
 * Validates and documents required environment variables.
 * In production, missing required vars will log a warning; AI features will fail at runtime if key is missing.
 */

const isProduction = process.env.NODE_ENV === "production";

const DEFAULT_JWT_SECRET = "your-secret-key-change-this-in-production";

export function validateEnv(): void {
  if (isProduction && process.env.DATABASE_URL) {
    try {
      new URL(process.env.DATABASE_URL);
    } catch {
      console.warn("[env] DATABASE_URL is set but not a valid URL");
    }
  }

  if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET === DEFAULT_JWT_SECRET)) {
    console.warn("[env] JWT_SECRET should be a strong random string in production. Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"");
  }

  if (process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL) {
    try {
      new URL(process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL);
    } catch {
      console.warn("[env] AI_INTEGRATIONS_ANTHROPIC_BASE_URL is set but not a valid URL");
    }
  }

  if (isProduction && (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY)) {
    console.warn("[env] VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY not set; web push reminders will use ephemeral keys and may break across restarts.");
  }

  if (isProduction && !process.env.SENTRY_DSN) {
    console.warn("[env] SENTRY_DSN not set; error tracking disabled. Recommended for production monitoring.");
  }

  const hasSmtp = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
  if (isProduction && !hasSmtp) {
    console.warn("[env] SMTP not configured; email features (password reset, invites) will be disabled. Set SMTP_* variables to enable.");
  }

  if (isProduction && !process.env.REDIS_URL) {
    console.warn("[env] REDIS_URL not set; using in-memory cache. Redis recommended for production for better performance and session management.");
  }

  const hasAwsS3 = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET;
  const hasR2 = process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME;

  if (isProduction && !hasAwsS3 && !hasR2) {
    console.warn("[env] Cloud storage (S3 or R2) not configured; file uploads will be disabled. Set AWS_* or R2_* variables to enable.");
  }

  const hasStripe = process.env.STRIPE_SECRET_KEY &&
                    process.env.STRIPE_WEBHOOK_SECRET &&
                    process.env.STRIPE_PRICE_PRO_MONTHLY &&
                    process.env.STRIPE_PRICE_PRO_ANNUAL;

  if (isProduction && !hasStripe) {
    console.warn("[env] Stripe not fully configured; billing features will be disabled. Set STRIPE_* variables to enable.");
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
  /** Anthropic (Claude) – used for itinerary generation and AI features */
  get anthropicApiKey(): string | undefined {
    return process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  },
  get anthropicBaseUrl(): string | undefined {
    return process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  },
  /** OpenAI (ChatGPT) – reserved for future AI-heavy features */
  get openaiApiKey(): string | undefined {
    return process.env.OPENAI_API_KEY;
  },
  get openaiBaseUrl(): string | undefined {
    return process.env.OPENAI_BASE_URL;
  },
  /** Comma-separated admin emails for metrics dashboard access */
  get adminEmails(): string[] {
    const v = process.env.ADMIN_EMAILS;
    return v ? v.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean) : [];
  },
  /** VAPID keys for web push notifications (optional, but recommended in production) */
  get vapidPublicKey(): string | undefined {
    return process.env.VAPID_PUBLIC_KEY;
  },
  get vapidPrivateKey(): string | undefined {
    return process.env.VAPID_PRIVATE_KEY;
  },
  /** Stripe (optional; pricing/checkout disabled when not set) */
  get stripeSecretKey(): string | undefined {
    return process.env.STRIPE_SECRET_KEY;
  },
  get stripeWebhookSecret(): string | undefined {
    return process.env.STRIPE_WEBHOOK_SECRET;
  },
  get stripePriceIdProMonthly(): string | undefined {
    return process.env.STRIPE_PRICE_PRO_MONTHLY;
  },
  get stripePriceIdProAnnual(): string | undefined {
    return process.env.STRIPE_PRICE_PRO_ANNUAL;
  },
  get stripePriceIdTeamsMonthly(): string | undefined {
    return process.env.STRIPE_PRICE_TEAMS_MONTHLY;
  },
  get stripePriceIdTeamsAnnual(): string | undefined {
    return process.env.STRIPE_PRICE_TEAMS_ANNUAL;
  },
  get appUrl(): string {
    return process.env.APP_URL ?? (process.env.NODE_ENV === "production" ? "https://tripsync.app" : "http://localhost:3000");
  },
  /** CORS origin when serving API separately (e.g. https://yourdomain.com). If unset, CORS is not applied. */
  get corsOrigin(): string | undefined {
    return process.env.CORS_ORIGIN;
  },
  /** SMTP (email notifications for invites, password resets) */
  get smtpHost(): string | undefined {
    return process.env.SMTP_HOST;
  },
  get smtpPort(): number {
    return parseInt(process.env.SMTP_PORT ?? "587", 10);
  },
  get smtpUser(): string | undefined {
    return process.env.SMTP_USER;
  },
  get smtpPass(): string | undefined {
    return process.env.SMTP_PASS;
  },
  get smtpFrom(): string {
    return process.env.SMTP_FROM ?? "noreply@tripsync.app";
  },
  /** Where to receive contact form submissions (e.g. support@tripsync.app). If set with SMTP, contact form sends email here. */
  get contactEmail(): string | undefined {
    return process.env.CONTACT_EMAIL;
  },
  /** AWS S3 (future: file storage) */
  get awsAccessKeyId(): string | undefined {
    return process.env.AWS_ACCESS_KEY_ID;
  },
  get awsSecretAccessKey(): string | undefined {
    return process.env.AWS_SECRET_ACCESS_KEY;
  },
  get awsS3Bucket(): string | undefined {
    return process.env.AWS_S3_BUCKET;
  },
  get awsRegion(): string {
    return process.env.AWS_REGION ?? "us-east-1";
  },
  /** Cloudflare R2 (S3-compatible alternative) */
  get r2AccountId(): string | undefined {
    return process.env.R2_ACCOUNT_ID;
  },
  get r2AccessKeyId(): string | undefined {
    return process.env.R2_ACCESS_KEY_ID;
  },
  get r2SecretAccessKey(): string | undefined {
    return process.env.R2_SECRET_ACCESS_KEY;
  },
  get r2BucketName(): string | undefined {
    return process.env.R2_BUCKET_NAME;
  },
  get r2PublicUrl(): string | undefined {
    return process.env.R2_PUBLIC_URL;
  },
  /** Redis (caching and session management) */
  get redisUrl(): string | undefined {
    return process.env.REDIS_URL;
  },
  /** Sentry (error tracking and performance monitoring) */
  get sentryDsn(): string | undefined {
    return process.env.SENTRY_DSN;
  },
  /** Feature flags for emergency disable */
  isFeatureEnabled(key: string): boolean {
    const value = process.env[key];
    if (value === undefined) return true; // Default enabled
    return value.toLowerCase() === "true" || value === "1";
  },
  get isAiEnabled(): boolean {
    return this.isFeatureEnabled("FEATURE_AI_ENABLED");
  },
  get isFileUploadsEnabled(): boolean {
    return this.isFeatureEnabled("FEATURE_FILE_UPLOADS_ENABLED");
  },
  get isStripeEnabled(): boolean {
    return this.isFeatureEnabled("FEATURE_STRIPE_ENABLED");
  },
  get isChatEnabled(): boolean {
    return this.isFeatureEnabled("FEATURE_CHAT_ENABLED");
  },
  get isPushEnabled(): boolean {
    return this.isFeatureEnabled("FEATURE_PUSH_ENABLED");
  },
  /** Check if email is admin */
  isAdmin(email: string): boolean {
    return this.adminEmails.includes(email.toLowerCase());
  },
};
