import { users, voiceSamples, songs, type User, type InsertUser, type VoiceSample, type InsertVoiceSample, type Song, type InsertSong } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createVoiceSample(voiceSample: InsertVoiceSample): Promise<VoiceSample>;
  getVoiceSamplesByUser(userId: number): Promise<VoiceSample[]>;
  getVoiceSample(id: number): Promise<VoiceSample | undefined>;
  deleteVoiceSample(id: number): Promise<boolean>;
  
  createSong(song: InsertSong): Promise<Song>;
  getSongsByUser(userId: number): Promise<Song[]>;
  getSong(id: number): Promise<Song | undefined>;
  updateSong(id: number, updates: Partial<Song>): Promise<Song | undefined>;
  deleteSong(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createVoiceSample(insertVoiceSample: InsertVoiceSample): Promise<VoiceSample> {
    const [voiceSample] = await db
      .insert(voiceSamples)
      .values(insertVoiceSample)
      .returning();
    return voiceSample;
  }

  async getVoiceSamplesByUser(userId: number): Promise<VoiceSample[]> {
    return await db.select().from(voiceSamples).where(eq(voiceSamples.userId, userId));
  }

  async getVoiceSample(id: number): Promise<VoiceSample | undefined> {
    const [voiceSample] = await db.select().from(voiceSamples).where(eq(voiceSamples.id, id));
    return voiceSample || undefined;
  }

  async deleteVoiceSample(id: number): Promise<boolean> {
    const result = await db.delete(voiceSamples).where(eq(voiceSamples.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async createSong(insertSong: InsertSong): Promise<Song> {
    const [song] = await db
      .insert(songs)
      .values(insertSong)
      .returning();
    return song;
  }

  async getSongsByUser(userId: number): Promise<Song[]> {
    return await db.select().from(songs).where(eq(songs.userId, userId));
  }

  async getSong(id: number): Promise<Song | undefined> {
    const [song] = await db.select().from(songs).where(eq(songs.id, id));
    return song || undefined;
  }

  async updateSong(id: number, updates: Partial<Song>): Promise<Song | undefined> {
    const [updatedSong] = await db
      .update(songs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(songs.id, id))
      .returning();
    return updatedSong || undefined;
  }

  async deleteSong(id: number): Promise<boolean> {
    const result = await db.delete(songs).where(eq(songs.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
}

export const storage = new DatabaseStorage();
