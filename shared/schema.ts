import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const voiceSamples = pgTable("voice_samples", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  filePath: text("file_path").notNull(),
  duration: integer("duration"), // in seconds
  createdAt: timestamp("created_at").defaultNow(),
});

export const songs = pgTable("songs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  lyrics: text("lyrics").notNull(),
  genre: text("genre").notNull(),
  vocalStyle: text("vocal_style").notNull(),
  tempo: integer("tempo").notNull(),
  songLength: text("song_length").notNull(),
  voiceSampleId: integer("voice_sample_id").references(() => voiceSamples.id),
  generatedAudioPath: text("generated_audio_path"),
  status: text("status").notNull().default("pending"), // pending, generating, completed, failed
  generationProgress: integer("generation_progress").default(0),
  sections: jsonb("sections"), // Array of song sections with timestamps
  settings: jsonb("settings"), // Advanced settings like intro/outro, harmonies, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
