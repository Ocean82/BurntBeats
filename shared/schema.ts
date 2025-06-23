import { pgTable, text, integer, timestamp, boolean, jsonb, decimal, serial } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password"),
  plan: text("plan").default("free"),
  songsGenerated: integer("songs_generated").default(0),
  maxSongs: integer("max_songs").default(3),
  songsThisMonth: integer("songs_this_month").default(0),
  lastUsageReset: timestamp("last_usage_reset").defaultNow(),
  stripeCustomerId: text("stripe_customer_id"),
  subscriptionId: text("subscription_id"),
  subscriptionStatus: text("subscription_status"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const voiceSamples = pgTable("voice_samples", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  name: text("name").notNull(),
  filePath: text("file_path").notNull(),
  duration: decimal("duration"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const songs = pgTable("songs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  title: text("title").notNull(),
  lyrics: text("lyrics"),
  genre: text("genre"),
  vocalStyle: text("vocal_style"),
  tempo: integer("tempo"),
  songLength: integer("song_length"),
  voiceSampleId: integer("voice_sample_id").references(() => voiceSamples.id),
  generatedAudioPath: text("generated_audio_path"),
  status: text("status").default("pending"),
  generationProgress: integer("generation_progress").default(0),
  sections: jsonb("sections"),
  settings: jsonb("settings"),
  planRestricted: boolean("plan_restricted").default(false),
  playCount: integer("play_count").default(0),
  likes: integer("likes").default(0),
  rating: decimal("rating"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const songVersions = pgTable("song_versions", {
  id: serial("id").primaryKey(),
  songId: integer("song_id").references(() => songs.id),
  version: integer("version").notNull(),
  changes: jsonb("changes"),
  audioPath: text("audio_path"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type UpsertUser = Partial<InsertUser> & { id: string };

export type VoiceSample = typeof voiceSamples.$inferSelect;
export type InsertVoiceSample = typeof voiceSamples.$inferInsert;

export type Song = typeof songs.$inferSelect;
export type InsertSong = typeof songs.$inferInsert;