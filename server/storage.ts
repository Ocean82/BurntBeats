import {
  users,
  voiceSamples,
  voiceClones,
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
import { eq, and } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Voice sample operations
  createVoiceSample(voiceSample: InsertVoiceSample): Promise<VoiceSample>;
  getVoiceSamplesByUser(userId: string): Promise<VoiceSample[]>;
  getVoiceSample(id: number): Promise<VoiceSample | undefined>;
  deleteVoiceSample(id: number): Promise<boolean>;

  // Voice clone operations
  getVoiceClone(id: number): Promise<any | undefined>;

  // Song operations
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
  async getVoiceSamples(userId: string, includeDeleted = false): Promise<VoiceSample[]> {
    const whereClause = includeDeleted 
      ? eq(voiceSamples.userId, userId)
      : and(eq(voiceSamples.userId, userId), eq(voiceSamples.isDeleted, false));

    return db.select().from(voiceSamples).where(whereClause);
  }

  async softDeleteVoiceSample(sampleId: number, userId: string): Promise<void> {
    await db.update(voiceSamples)
      .set({ 
        isDeleted: true, 
        deletedAt: new Date() 
      })
      .where(and(eq(voiceSamples.id, sampleId), eq(voiceSamples.userId, userId)));
  }

  async restoreVoiceSample(sampleId: number, userId: string): Promise<void> {
    await db.update(voiceSamples)
      .set({ 
        isDeleted: false, 
        deletedAt: null 
      })
      .where(and(eq(voiceSamples.id, sampleId), eq(voiceSamples.userId, userId)));
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
  async getSongs(userId: string, includeDeleted = false): Promise<Song[]> {
    const whereClause = includeDeleted 
      ? eq(songs.userId, userId)
      : and(eq(songs.userId, userId), eq(songs.isDeleted, false));

    return db.select().from(songs).where(whereClause);
  }

  async getSongWithRemixes(songId: number): Promise<Song & { remixes?: Song[] }> {
    const [song] = await db.select().from(songs).where(eq(songs.id, songId));
    if (!song) throw new Error('Song not found');

    const remixes = await db.select().from(songs)
      .where(and(eq(songs.parentSongId, songId), eq(songs.isDeleted, false)));

    return { ...song, remixes };
  }

  async softDeleteSong(songId: number, userId: string): Promise<void> {
    await db.update(songs)
      .set({ 
        isDeleted: true, 
        deletedAt: new Date() 
      })
      .where(and(eq(songs.id, songId), eq(songs.userId, userId)));
  }

  async restoreSong(songId: number, userId: string): Promise<void> {
    await db.update(songs)
      .set({ 
        isDeleted: false, 
        deletedAt: null 
      })
      .where(and(eq(songs.id, songId), eq(songs.userId, userId)));
  }

  async getSongVersions(songId: number): Promise<any[]> {
    return await db.select().from(songVersions).where(eq(songVersions.songId, songId));
  }

  // Voice clone operations
  async getVoiceClone(id: number): Promise<any | undefined> {
    const [voiceClone] = await db.select().from(voiceClones).where(eq(voiceClones.id, id));
    return voiceClone;
  }
}

export const storage = new DatabaseStorage();