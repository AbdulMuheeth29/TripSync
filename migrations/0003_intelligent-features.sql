CREATE TABLE "group_availability" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"trip_id" varchar(36) NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"available_dates" json NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "packing_items" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"trip_id" varchar(36) NOT NULL,
	"name" text NOT NULL,
	"assigned_to_user_id" varchar(36),
	"notes" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poll_votes" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"poll_id" varchar(36) NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"option_index" integer NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "polls" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"trip_id" varchar(36) NOT NULL,
	"created_by_user_id" varchar(36) NOT NULL,
	"question" text NOT NULL,
	"options" json NOT NULL,
	"deadline" text,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transportation_entries" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"trip_id" varchar(36) NOT NULL,
	"day_number" integer NOT NULL,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"driver_user_id" varchar(36),
	"passenger_user_ids" json,
	"notes" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "member_preferences" ADD COLUMN "accessibility" text;--> statement-breakpoint
ALTER TABLE "trip_members" ADD COLUMN "rsvp_status" text DEFAULT 'pending' NOT NULL;