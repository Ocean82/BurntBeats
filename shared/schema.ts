import { pgTable, text, integer, timestamp, boolean, jsonb, decimal, serial, varchar, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from '@paralleldrive/cuid2';

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  username: text("username").unique(),
  password: text("password"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
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

// Songs table
export const songs = pgTable("songs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  lyrics: text("lyrics"),
  style: text("style"),
  mood: text("mood"),
  tempo: text("tempo"),
  voiceSampleId: integer("voice_sample_id").references(() => voiceSamples.id, { onDelete: "set null" }),
  parentSongId: integer("parent_song_id").references(() => songs.id, { onDelete: "set null" }),
  forkedFromId: integer("forked_from_id").references(() => songs.id, { onDelete: "set null" }),
  generatedAudioPath: text("generated_audio_path"),
  status: text("status").default("pending"),
  generationProgress: integer("generation_progress").default(0),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

// Voice samples table
export const voiceSamples = pgTable("voice_samples", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  filePath: text("file_path").notNull(),
  duration: integer("duration"),
  format: text("format"),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

// Voice clones table
export const voiceClones = pgTable("voice_clones", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  originalVoiceId: integer("original_voice_id").references(() => voiceSamples.id, { onDelete: "set null" }),
  clonedVoicePath: text("cloned_voice_path"),
  status: text("status").default("pending"),
  quality: text("quality").default("medium"),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

// Song versions table
export const songVersions = pgTable("song_versions", {
  id: serial("id").primaryKey(),
  songId: integer("song_id").notNull().references(() => songs.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  changes: jsonb("changes"),
  audioPath: text("audio_path"),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

// License Acknowledgments Table
export const licenseAcknowledgments = pgTable("license_acknowledgments", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id").notNull(),
  trackId: text("track_id").notNull(),
  acceptedAt: timestamp("accepted_at").notNull(),
  purchaseId: text("purchase_id"), // Optional Stripe session ID
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Define relations for proper ownership tracking
export const userRelations = relations(users, ({ many }) => ({
  songs: many(songs),
  voiceSamples: many(voiceSamples),
  voiceClones: many(voiceClones),
}));

export const songRelations = relations(songs, ({ one, many }) => ({
  user: one(users, {
    fields: [songs.userId],
    references: [users.id],
  }),
  voiceSample: one(voiceSamples, {
    fields: [songs.voiceSampleId],
    references: [voiceSamples.id],
  }),
  parentSong: one(songs, {
    fields: [songs.parentSongId],
    references: [songs.id],
  }),
  forkedFrom: one(songs, {
    fields: [songs.forkedFromId],
    references: [songs.id],
  }),
  versions: many(songVersions),
}));

export const voiceSampleRelations = relations(voiceSamples, ({ one, many }) => ({
  user: one(users, {
    fields: [voiceSamples.userId],
    references: [users.id],
  }),
  songs: many(songs),
  voiceClones: many(voiceClones),
}));

export const voiceCloneRelations = relations(voiceClones, ({ one }) => ({
  user: one(users, {
    fields: [voiceClones.userId],
    references: [users.id],
  }),
  originalVoice: one(voiceSamples, {
    fields: [voiceClones.originalVoiceId],
    references: [voiceSamples.id],
  }),
}));

export const songVersionRelations = relations(songVersions, ({ one }) => ({
  song: one(songs, {
    fields: [songVersions.songId],
    references: [songs.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type UpsertUser = Partial<InsertUser> & { id: string };

export type Song = typeof songs.$inferSelect;
export type InsertSong = typeof songs.$inferInsert;

export type VoiceSample = typeof voiceSamples.$inferSelect;
export type InsertVoiceSample = typeof voiceSamples.$inferInsert;

export type VoiceClone = typeof voiceClones.$inferSelect;
export type InsertVoiceClone = typeof voiceClones.$inferInsert;

export type SongVersion = typeof songVersions.$inferSelect;
export type InsertSongVersion = typeof songVersions.$inferInsert;

export type LicenseAcknowledgment = typeof licenseAcknowledgments.$inferSelect;
export type InsertLicenseAcknowledgment = typeof licenseAcknowledgments.$inferInsert;

export interface SongSection {
  id: string;
  label: "Intro" | "Verse" | "Chorus" | "Bridge" | "Outro" | "Instrumental";
  start: number; // seconds
  end: number; // seconds
  lyrics?: string;
  key?: string;
  tempo?: number;
  description?: string;
}

export interface AudioFeatures {
  tempo: number;
  key: string;
  energy: number;
  valence: number;
  danceability: number;
}

export interface WatermarkConfig {
  hasWatermark: boolean;
  watermarkType?: 'audio' | 'visual' | 'both';
  intensity?: 'light' | 'medium' | 'heavy';
  position?: 'start' | 'middle' | 'end' | 'throughout';
  text?: string;
}

export interface MelodyPhrase {
  notes: Array<{
    pitch: number;
    duration: number;
    velocity: number;
    startTime: number;
  }>;
  startTime: number;
  duration: number;
  key: string;
  scale: string;
}

export interface GeneratedMelody {
  phrases: MelodyPhrase[];
  audioFeatures: AudioFeatures;
  structure: any;
  totalDuration: number;
  noteCount: number;
  audioPath?: string;
  midiPath?: string;
  metadata?: {
    generationId: string;
    version: string;
    hash: string;
    generatedAt: string;
    key: string;
    tempo: number;
  };
}
import { z } from 'zod';

// User schemas
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string().min(1),
  subscription_tier: z.enum(['free', 'premium', 'pro']).default('free'),
  monthly_songs_generated: z.number().default(0),
  monthly_limit: z.number().default(10),
  created_at: z.date(),
  updated_at: z.date()
});

export const CreateUserSchema = UserSchema.omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

export const UpdateUserSchema = CreateUserSchema.partial();

// Song schemas
export const SongSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  title: z.string().min(1),
  lyrics: z.string().optional(),
  genre: z.string(),
  mood: z.string().optional(),
  style_reference: z.string().optional(),
  status: z.enum(['generating', 'completed', 'failed']).default('generating'),
  file_path: z.string().optional(),
  duration: z.number().optional(),
  file_size: z.number().optional(),
  created_at: z.date(),
  updated_at: z.date()
});

export const CreateSongSchema = SongSchema.omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

export const UpdateSongSchema = CreateSongSchema.partial();

// Voice Sample schemas
export const VoiceSampleSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string().min(1),
  file_path: z.string(),
  status: z.enum(['processing', 'ready', 'failed']).default('processing'),
  metadata: z.record(z.any()).optional(),
  created_at: z.date(),
  updated_at: z.date()
});

export const CreateVoiceSampleSchema = VoiceSampleSchema.omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

export const UpdateVoiceSampleSchema = CreateVoiceSampleSchema.partial();

// Voice Clone schemas
export const VoiceCloneSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string().min(1),
  voice_sample_id: z.string(),
  status: z.enum(['training', 'ready', 'failed']).default('training'),
  model_path: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  created_at: z.date(),
  updated_at: z.date()
});

export const CreateVoiceCloneSchema = VoiceCloneSchema.omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

export const UpdateVoiceCloneSchema = CreateVoiceCloneSchema.partial();

// License Acknowledgment schemas
export const LicenseAcknowledgmentSchema = z.object({
  id: z.string(),
  song_id: z.string(),
  user_id: z.string(),
  license_type: z.string(),
  acknowledgment_text: z.string(),
  created_at: z.date()
});

export const CreateLicenseAcknowledgmentSchema = LicenseAcknowledgmentSchema.omit({ 
  id: true, 
  created_at: true 
});

// Request/Response schemas
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
  error: z.string().optional()
});

export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  total: z.number().optional(),
  totalPages: z.number().optional()
});

// Type exports
export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;

export type Song = z.infer<typeof SongSchema>;
export type CreateSong = z.infer<typeof CreateSongSchema>;
export type UpdateSong = z.infer<typeof UpdateSongSchema>;

export type VoiceSample = z.infer<typeof VoiceSampleSchema>;
export type CreateVoiceSample = z.infer<typeof CreateVoiceSampleSchema>;
export type UpdateVoiceSample = z.infer<typeof UpdateVoiceSampleSchema>;

export type VoiceClone = z.infer<typeof VoiceCloneSchema>;
export type CreateVoiceClone = z.infer<typeof CreateVoiceCloneSchema>;
export type UpdateVoiceClone = z.infer<typeof UpdateVoiceCloneSchema>;

export type LicenseAcknowledgment = z.infer<typeof LicenseAcknowledgmentSchema>;
export type CreateLicenseAcknowledgment = z.infer<typeof CreateLicenseAcknowledgmentSchema>;

export type ApiResponse = z.infer<typeof ApiResponseSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;