CREATE TABLE "trip_photos" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"trip_id" varchar(36) NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"url" text NOT NULL,
	"caption" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "receipt_image_url" text;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "timezone" text;