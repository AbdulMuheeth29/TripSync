ALTER TABLE "itinerary_items" ALTER COLUMN "booking_status" SET DEFAULT 'not_started';--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "currency" text DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "item_id" varchar(36);--> statement-breakpoint
ALTER TABLE "itinerary_items" ADD COLUMN "locked" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "itinerary_items" ADD COLUMN "booked_by_user_id" varchar(36);--> statement-breakpoint
ALTER TABLE "itinerary_items" ADD COLUMN "end_time" text;--> statement-breakpoint
ALTER TABLE "itinerary_items" ADD COLUMN "sort_order" integer;--> statement-breakpoint
ALTER TABLE "member_preferences" ADD COLUMN "budget_band" text;--> statement-breakpoint
ALTER TABLE "member_preferences" ADD COLUMN "pace" text;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "trip_type" text;