
-- Add enhanced voice sample fields
ALTER TABLE "voice_samples" 
ADD COLUMN "sample_rate" integer DEFAULT 44100,
ADD COLUMN "bit_depth" integer DEFAULT 16,
ADD COLUMN "file_size" integer,
ADD COLUMN "is_processed" boolean DEFAULT false,
ADD COLUMN "is_deleted" boolean DEFAULT false,
ADD COLUMN "deleted_at" timestamp;

-- Add song remix and soft deletion fields
ALTER TABLE "songs"
ADD COLUMN "parent_song_id" integer REFERENCES "songs"("id"),
ADD COLUMN "forked_from_id" integer REFERENCES "songs"("id"),
ADD COLUMN "is_remix" boolean DEFAULT false,
ADD COLUMN "is_deleted" boolean DEFAULT false,
ADD COLUMN "deleted_at" timestamp;

-- Add soft deletion to song versions
ALTER TABLE "song_versions"
ADD COLUMN "is_deleted" boolean DEFAULT false,
ADD COLUMN "deleted_at" timestamp;

-- Create indexes for performance
CREATE INDEX "idx_voice_samples_not_deleted" ON "voice_samples" ("is_deleted") WHERE "is_deleted" = false;
CREATE INDEX "idx_songs_not_deleted" ON "songs" ("is_deleted") WHERE "is_deleted" = false;
CREATE INDEX "idx_songs_remixes" ON "songs" ("parent_song_id") WHERE "parent_song_id" IS NOT NULL;
CREATE INDEX "idx_songs_forks" ON "songs" ("forked_from_id") WHERE "forked_from_id" IS NOT NULL;
CREATE INDEX "idx_song_versions_not_deleted" ON "song_versions" ("is_deleted") WHERE "is_deleted" = false;
