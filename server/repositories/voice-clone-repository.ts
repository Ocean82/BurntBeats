
import { db } from '../db';
import { eq, and, or } from 'drizzle-orm';
import { voiceClones } from '../../shared/schema';
import { Logger } from '../utils/logger';

const logger = new Logger({ name: 'VoiceCloneRepository' });

export interface VoiceCloneData {
  id: string;
  userId: string;
  name: string;
  audioPath: string;
  anthemPath?: string;
  samplePath?: string;
  characteristics?: any;
  isPublic: boolean;
}

export interface VoiceClone extends VoiceCloneData {
  createdAt: Date;
  updatedAt: Date;
}

export class VoiceCloneRepository {
  async create(data: VoiceCloneData): Promise<VoiceClone> {
    try {
      const [voice] = await db.insert(voiceClones).values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      logger.info('Voice clone created', { id: voice.id, userId: data.userId });
      return voice;
    } catch (error) {
      logger.error('Failed to create voice clone', { error: error.message, data });
      throw new Error('Failed to create voice clone');
    }
  }

  async findById(id: string): Promise<VoiceClone | null> {
    try {
      const [voice] = await db.select().from(voiceClones).where(eq(voiceClones.id, id));
      return voice || null;
    } catch (error) {
      logger.error('Failed to find voice by ID', { error: error.message, id });
      return null;
    }
  }

  async findByName(name: string): Promise<VoiceClone | null> {
    try {
      const [voice] = await db.select().from(voiceClones).where(eq(voiceClones.name, name));
      return voice || null;
    } catch (error) {
      logger.error('Failed to find voice by name', { error: error.message, name });
      return null;
    }
  }

  async findAvailable(userId?: string): Promise<VoiceClone[]> {
    try {
      const conditions = userId 
        ? or(eq(voiceClones.isPublic, true), eq(voiceClones.userId, userId))
        : eq(voiceClones.isPublic, true);

      const voices = await db.select().from(voiceClones).where(conditions);
      return voices;
    } catch (error) {
      logger.error('Failed to find available voices', { error: error.message, userId });
      throw new Error('Failed to find available voices');
    }
  }

  async findByUser(userId: string): Promise<VoiceClone[]> {
    try {
      const voices = await db.select().from(voiceClones).where(eq(voiceClones.userId, userId));
      return voices;
    } catch (error) {
      logger.error('Failed to find voices by user', { error: error.message, userId });
      throw new Error('Failed to find user voices');
    }
  }

  async update(id: string, data: Partial<VoiceCloneData>): Promise<VoiceClone | null> {
    try {
      const [voice] = await db.update(voiceClones)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(voiceClones.id, id))
        .returning();

      logger.info('Voice clone updated', { id });
      return voice || null;
    } catch (error) {
      logger.error('Failed to update voice clone', { error: error.message, id, data });
      throw new Error('Failed to update voice clone');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await db.delete(voiceClones).where(eq(voiceClones.id, id));
      logger.info('Voice clone deleted', { id });
    } catch (error) {
      logger.error('Failed to delete voice clone', { error: error.message, id });
      throw new Error('Failed to delete voice clone');
    }
  }
}
