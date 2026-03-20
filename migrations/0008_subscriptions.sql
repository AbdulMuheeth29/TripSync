-- Subscription tier and expiry on users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscription_tier" varchar(20) DEFAULT 'free' NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscription_expires_at" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripe_customer_id" varchar(255);

-- Subscriptions table (Stripe)
CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "user_id" varchar(36) NOT NULL,
  "stripe_customer_id" varchar(255),
  "stripe_subscription_id" varchar(255),
  "tier" varchar(20) NOT NULL,
  "status" varchar(20) NOT NULL,
  "current_period_start" timestamp,
  "current_period_end" timestamp,
  "cancel_at_period_end" boolean DEFAULT false,
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
