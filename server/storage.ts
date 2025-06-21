import {
  users,
  voiceSamples,
  songs,
  songVersions,
  type User,
  type UpsertUser,
  type VoiceSample,
  type InsertVoiceSample,
  type Song,
  type InsertSong,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  createVoiceSample(voiceSample: InsertVoiceSample): Promise<VoiceSample>;
  getVoiceSamplesByUser(userId: string): Promise<VoiceSample[]>;
  getVoiceSample(id: number): Promise<VoiceSample | undefined>;
  deleteVoiceSample(id: number): Promise<boolean>;
  
  createSong(song: InsertSong): Promise<Song>;
  getSongsByUser(userId: string): Promise<Song[]>;
  getSong(id: number): Promise<Song | undefined>;
  updateSong(id: number, updates: Partial<Song>): Promise<Song | undefined>;
  deleteSong(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Voice sample operations
  async createVoiceSample(insertVoiceSample: InsertVoiceSample): Promise<VoiceSample> {
    const [voiceSample] = await db
      .insert(voiceSamples)
      .values(insertVoiceSample)
      .returning();
    return voiceSample;
  }

  async getVoiceSamplesByUser(userId: string): Promise<VoiceSample[]> {
    return await db.select().from(voiceSamples).where(eq(voiceSamples.userId, userId));
  }

  async getVoiceSample(id: number): Promise<VoiceSample | undefined> {
    const [voiceSample] = await db.select().from(voiceSamples).where(eq(voiceSamples.id, id));
    return voiceSample;
  }

  async deleteVoiceSample(id: number): Promise<boolean> {
    const result = await db.delete(voiceSamples).where(eq(voiceSamples.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Song operations
  async createSong(insertSong: InsertSong): Promise<Song> {
    const [song] = await db
      .insert(songs)
      .values(insertSong)
      .returning();
    return song;
  }

  async getSongsByUser(userId: string): Promise<Song[]> {
    return await db.select().from(songs).where(eq(songs.userId, userId));
  }

  async getSong(id: number): Promise<Song | undefined> {
    const [song] = await db.select().from(songs).where(eq(songs.id, id));
    return song;
  }

  async updateSong(id: number, updates: Partial<Song>): Promise<Song | undefined> {
    const [song] = await db
      .update(songs)
      .set(updates)
      .where(eq(songs.id, id))
      .returning();
    return song;
  }

  async deleteSong(id: number): Promise<boolean> {
    const result = await db.delete(songs).where(eq(songs.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getSongVersions(songId: number): Promise<any[]> {
    return await db.select().from(songVersions).where(eq(songVersions.songId, songId));
  }
}

export const storage = new DatabaseStorage();