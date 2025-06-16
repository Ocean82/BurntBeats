import { users, voiceSamples, songs, type User, type InsertUser, type VoiceSample, type InsertVoiceSample, type Song, type InsertSong } from "@shared/schema";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private voiceSamples: Map<number, VoiceSample>;
  private songs: Map<number, Song>;
  private currentUserId: number;
  private currentVoiceSampleId: number;
  private currentSongId: number;

  constructor() {
    this.users = new Map();
    this.voiceSamples = new Map();
    this.songs = new Map();
    this.currentUserId = 1;
    this.currentVoiceSampleId = 1;
    this.currentSongId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createVoiceSample(insertVoiceSample: InsertVoiceSample): Promise<VoiceSample> {
    const id = this.currentVoiceSampleId++;
    const voiceSample: VoiceSample = {
      ...insertVoiceSample,
      id,
      createdAt: new Date(),
    };
    this.voiceSamples.set(id, voiceSample);
    return voiceSample;
  }

  async getVoiceSamplesByUser(userId: number): Promise<VoiceSample[]> {
    return Array.from(this.voiceSamples.values()).filter(
      (sample) => sample.userId === userId,
    );
  }

  async getVoiceSample(id: number): Promise<VoiceSample | undefined> {
    return this.voiceSamples.get(id);
  }

  async deleteVoiceSample(id: number): Promise<boolean> {
    return this.voiceSamples.delete(id);
  }

  async createSong(insertSong: InsertSong): Promise<Song> {
    const id = this.currentSongId++;
    const song: Song = {
      ...insertSong,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.songs.set(id, song);
    return song;
  }

  async getSongsByUser(userId: number): Promise<Song[]> {
    return Array.from(this.songs.values()).filter(
      (song) => song.userId === userId,
    );
  }

  async getSong(id: number): Promise<Song | undefined> {
    return this.songs.get(id);
  }

  async updateSong(id: number, updates: Partial<Song>): Promise<Song | undefined> {
    const song = this.songs.get(id);
    if (!song) return undefined;
    
    const updatedSong = { ...song, ...updates, updatedAt: new Date() };
    this.songs.set(id, updatedSong);
    return updatedSong;
  }

  async deleteSong(id: number): Promise<boolean> {
    return this.songs.delete(id);
  }
}

export const storage = new MemStorage();
