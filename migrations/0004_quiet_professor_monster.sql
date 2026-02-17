CREATE TABLE "emergency_contacts" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"trip_id" varchar(36) NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"url" text,
	"notes" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "location_sharing" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"trip_id" varchar(36) NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"lat" text NOT NULL,
	"lng" text NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_documents" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"trip_id" varchar(36) NOT NULL,
	"uploaded_by_user_id" varchar(36) NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_satisfaction" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"trip_id" varchar(36) NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"score" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_learned_preferences" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"vibes_preferred" json,
	"trip_types_preferred" json,
	"budget_band" text,
	"learned_from_trip_ids" json,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" text NOT NULL;