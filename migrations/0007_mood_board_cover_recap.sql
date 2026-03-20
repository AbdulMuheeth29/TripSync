-- Trip cover image and AI recap
ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "cover_image_url" text;
ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "recap_text" text;

-- Mood board items (Pinterest-style)
CREATE TABLE IF NOT EXISTS "mood_board_items" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "trip_id" varchar(36) NOT NULL,
  "url" text NOT NULL,
  "label" text,
  "added_by_user_id" varchar(36) NOT NULL,
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
