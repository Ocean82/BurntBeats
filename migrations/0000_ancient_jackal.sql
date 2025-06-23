CREATE TABLE "song_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"song_id" integer,
	"version" integer NOT NULL,
	"changes" jsonb,
	"audio_path" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "songs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"title" text NOT NULL,
	"lyrics" text,
	"genre" text,
	"vocal_style" text,
	"tempo" integer,
	"song_length" integer,
	"voice_sample_id" integer,
	"generated_audio_path" text,
	"status" text DEFAULT 'pending',
	"generation_progress" integer DEFAULT 0,
	"sections" jsonb,
	"settings" jsonb,
	"plan_restricted" boolean DEFAULT false,
	"play_count" integer DEFAULT 0,
	"likes" integer DEFAULT 0,
	"rating" numeric,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password" text,
	"plan" text DEFAULT 'free',
	"songs_generated" integer DEFAULT 0,
	"max_songs" integer DEFAULT 3,
	"stripe_customer_id" text,
	"subscription_id" text,
	"subscription_status" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "voice_samples" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"file_path" text NOT NULL,
	"duration" numeric,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "song_versions" ADD CONSTRAINT "song_versions_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "songs" ADD CONSTRAINT "songs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "songs" ADD CONSTRAINT "songs_voice_sample_id_voice_samples_id_fk" FOREIGN KEY ("voice_sample_id") REFERENCES "public"."voice_samples"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_samples" ADD CONSTRAINT "voice_samples_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;