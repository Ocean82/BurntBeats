ALTER TABLE "users" ADD COLUMN "songs_this_month" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_usage_reset" timestamp DEFAULT now();