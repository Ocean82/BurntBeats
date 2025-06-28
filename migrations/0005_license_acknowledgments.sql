
-- Create license acknowledgments table
CREATE TABLE IF NOT EXISTS "license_acknowledgments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"track_id" text NOT NULL,
	"accepted_at" timestamp NOT NULL,
	"purchase_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "license_acknowledgments_user_track_idx" ON "license_acknowledgments" ("user_id", "track_id");
CREATE INDEX IF NOT EXISTS "license_acknowledgments_purchase_idx" ON "license_acknowledgments" ("purchase_id");

-- Add unique constraint
ALTER TABLE "license_acknowledgments" ADD CONSTRAINT "license_acknowledgments_user_track_unique" UNIQUE ("user_id", "track_id");
