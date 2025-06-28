import { pgTable, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// Users table
export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: text('email').notNull().unique(),
  username: text('username').notNull(),
  subscription_tier: text('subscription_tier').notNull().default('free'),
  monthly_songs_generated: integer('monthly_songs_generated').notNull().default(0),
  monthly_limit: integer('monthly_limit').notNull().default(10),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow()
});

// Songs table
export const songs = pgTable('songs', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  lyrics: text('lyrics'),
  genre: text('genre').notNull(),
  mood: text('mood'),
  style_reference: text('style_reference'),
  status: text('status').notNull().default('generating'),
  file_path: text('file_path'),
  duration: integer('duration'),
  file_size: integer('file_size'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow()
});

// Voice samples table
export const voice_samples = pgTable('voice_samples', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  file_path: text('file_path').notNull(),
  status: text('status').notNull().default('processing'),
  metadata: jsonb('metadata'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow()
});

// Voice clones table
export const voice_clones = pgTable('voice_clones', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  voice_sample_id: text('voice_sample_id').notNull().references(() => voice_samples.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('training'),
  model_path: text('model_path'),
  metadata: jsonb('metadata'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow()
});

// Sessions table
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires_at: timestamp('expires_at').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow()
});

// License acknowledgments table
export const license_acknowledgments = pgTable('license_acknowledgments', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  song_id: text('song_id').notNull().references(() => songs.id, { onDelete: 'cascade' }),
  user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  license_type: text('license_type').notNull(),
  acknowledgment_text: text('acknowledgment_text').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow()
});