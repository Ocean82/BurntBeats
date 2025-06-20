import { pgTable, text, serial, integer, boolean, timestamp, jsonb, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  plan: text("plan").notNull().default("free"), // free, pro
  planExpiresAt: timestamp("plan_expires_at"),
});

export const voiceSamples = pgTable("voice_samples", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  filePath: text("file_path").notNull(),
  duration: integer("duration"), // in seconds
  voiceType: text("voice_type").notNull().default("custom"), // custom, text-reader
  isProcessed: boolean("is_processed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const songs = pgTable("songs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  lyrics: text("lyrics").notNull(),
  genre: text("genre").notNull(),
  vocalStyle: text("vocal_style").notNull(),
  singingStyle: text("singing_style"), // smooth, powerful, emotional, etc.
  mood: text("mood"), // happy, sad, energetic, calm, etc.
  tone: text("tone"), // warm, bright, deep, light, etc.
  tempo: integer("tempo").notNull(),
  songLength: text("song_length").notNull(),
  voiceSampleId: integer("voice_sample_id").references(() => voiceSamples.id),
  generatedAudioPath: text("generated_audio_path"),
  status: text("status").notNull().default("pending"), // pending, generating, completed, failed
  generationProgress: integer("generation_progress").default(0),
  sections: jsonb("sections"), // Array of song sections with timestamps
  settings: jsonb("settings"), // Advanced settings like intro/outro, harmonies, etc.
  planRestricted: boolean("plan_restricted").default(false), // true for free plan limitations
  playCount: integer("play_count").default(0),
  likes: integer("likes").default(0),
  rating: doublePrecision("rating").default(4.0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const songVersions = pgTable("song_versions", {
  id: serial("id").primaryKey(),
  songId: integer("song_id").references(() => songs.id),
  versionNumber: text("version_number").notNull(),
  title: text("title").notNull(),
  commitMessage: text("commit_message").notNull(),
  changes: jsonb("changes").notNull(),
  createdBy: text("created_by").notNull(),
  isActive: boolean("is_active").default(false),
  size: doublePrecision("size").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertVoiceSampleSchema = createInsertSchema(voiceSamples).omit({
  id: true,
  createdAt: true,
});

export const insertSongSchema = createInsertSchema(songs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertVoiceSample = z.infer<typeof insertVoiceSampleSchema>;
export type VoiceSample = typeof voiceSamples.$inferSelect;

export type InsertSong = z.infer<typeof insertSongSchema>;
export type Song = typeof songs.$inferSelect;
