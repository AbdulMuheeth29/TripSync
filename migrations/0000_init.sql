CREATE TABLE "chat_messages" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"trip_id" varchar(36) NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"content" text NOT NULL,
	"item_id" varchar(36),
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"item_id" varchar(36) NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"trip_id" varchar(36) NOT NULL,
	"paid_by_user_id" varchar(36) NOT NULL,
	"amount" integer NOT NULL,
	"description" text NOT NULL,
	"location" text,
	"split_among" json NOT NULL,
	"is_settled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "itinerary_items" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"trip_id" varchar(36) NOT NULL,
	"day_number" integer NOT NULL,
	"type" text NOT NULL,
	"time" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"location" text NOT NULL,
	"price_per_person" integer NOT NULL,
	"booking_url_hint" text,
	"booking_url" text,
	"booking_status" text DEFAULT 'suggested' NOT NULL,
	"confirmation_number" text,
	"confirmation_image_url" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_preferences" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"trip_id" varchar(36) NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"diet" text,
	"budget_flexibility" text,
	"must_do_activities" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_invites" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"trip_id" varchar(36) NOT NULL,
	"email" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_members" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"trip_id" varchar(36) NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"joined_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"organizer_id" varchar(36) NOT NULL,
	"destination" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"budget_per_person" integer NOT NULL,
	"group_size" integer NOT NULL,
	"vibes" text[] NOT NULL,
	"accommodation_pref" text NOT NULL,
	"dining_pref" text NOT NULL,
	"status" text DEFAULT 'planning' NOT NULL,
	"is_locked" boolean DEFAULT false,
	"share_code" varchar(12),
	"vote_deadline" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"item_id" varchar(36) NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"vote_type" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
