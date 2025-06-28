
CREATE TABLE IF NOT EXISTS "license_acknowledgments" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"track_id" text NOT NULL,
	"accepted_at" timestamp NOT NULL,
	"purchase_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_license_user_track" ON "license_acknowledgments" ("user_id", "track_id");
CREATE INDEX IF NOT EXISTS "idx_license_purchase" ON "license_acknowledgments" ("purchase_id");
