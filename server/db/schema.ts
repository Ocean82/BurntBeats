
import { pgTable, serial, text, timestamp, integer, boolean, jsonb, uuid } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  plan: text('plan').default('free'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Songs table
export const songs = pgTable('songs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  title: text('title').notNull(),
  lyrics: text('lyrics'),
  style: text('style'),
  mood: text('mood'),
  tempo: text('tempo'),
  generatedAudioPath: text('generated_audio_path'),
  status: text('status').default('pending'),
  generationProgress: integer('generation_progress').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Voice samples table
export const voiceSamples = pgTable('voice_samples', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  name: text('name').notNull(),
  filePath: text('file_path').notNull(),
  duration: integer('duration'),
  format: text('format'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Voice clones table
export const voiceClones = pgTable('voice_clones', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  name: text('name').notNull(),
  voiceSampleId: integer('voice_sample_id').references(() => voiceSamples.id),
  modelPath: text('model_path'),
  status: text('status').default('training'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Song versions table
export const songVersions = pgTable('song_versions', {
  id: serial('id').primaryKey(),
  songId: integer('song_id').references(() => songs.id),
  version: integer('version').notNull(),
  changes: jsonb('changes'),
  audioPath: text('audio_path'),
  createdAt: timestamp('created_at').defaultNow(),
});

// License Acknowledgments Table
export const licenseAcknowledgments = pgTable('license_acknowledgments', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull(),
  trackId: text('track_id').notNull(),
  acceptedAt: timestamp('accepted_at').notNull(),
  purchaseId: text('purchase_id'), // Optional Stripe session ID
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Song = typeof songs.$inferSelect;
export type NewSong = typeof songs.$inferInsert;
export type VoiceSample = typeof voiceSamples.$inferSelect;
export type NewVoiceSample = typeof voiceSamples.$inferInsert;
export type VoiceClone = typeof voiceClones.$inferSelect;
export type NewVoiceClone = typeof voiceClones.$inferInsert;
export type SongVersion = typeof songVersions.$inferSelect;
export type NewSongVersion = typeof songVersions.$inferInsert;
export type LicenseAcknowledgment = typeof licenseAcknowledgments.$inferSelect;
export type NewLicenseAcknowledgment = typeof licenseAcknowledgments.$inferInsert;
