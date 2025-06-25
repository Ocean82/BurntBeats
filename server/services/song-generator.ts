
import { generateSong as generateAdvancedSong } from '../music-generator';
import { pricingService } from '../pricing-service';
import { storage } from '../storage';
import { fileCleanupService } from '../file-cleanup-service';
import type { Song } from '../../shared/schema';

export interface SongGenerationOptions {
  type: 'basic' | 'ai-enhanced' | 'music21-demo';
  quality: 'draft' | 'standard' | 'high';
  async?: boolean;
  userId?: string;
  planRestrictions?: boolean;
}

export interface GenerationResult {
  song?: Song;
  jobId?: string;
  status: 'completed' | 'processing' | 'queued' | 'failed';
  error?: string;
  estimatedDuration?: number;
}

export class SongGenerator {
  static async generate(
    songData: any, 
    options: SongGenerationOptions = { type: 'basic', quality: 'standard' }
  ): Promise<GenerationResult> {
    try {
      // Check usage limits if user is provided
      if (options.userId && options.planRestrictions !== false) {
        const usageCheck = await pricingService.checkUsageLimit(options.userId);
        if (!usageCheck.canCreate) {
          return {
            status: 'failed',
            error: usageCheck.reason || 'Usage limit exceeded'
          };
        }
      }

      // Enhance song data with default values
      const enhancedSongData = this.enhanceSongData(songData, options);

      // Route to appropriate generation method
      let song: Song;
      switch (options.type) {
        case 'ai-enhanced':
          song = await this.generateAIEnhanced(enhancedSongData);
          break;
        case 'music21-demo':
          song = await this.generateMusic21Demo(enhancedSongData);
          break;
        case 'basic':
        default:
          song = await this.generateBasic(enhancedSongData);
          break;
      }

      // Store in database if successful
      if (options.userId && song) {
        try {
          const storedSong = await storage.createSong({
            title: song.title,
            lyrics: song.lyrics,
            genre: song.genre,
            tempo: song.tempo,
            key: song.key,
            duration: song.duration,
            generatedAudioPath: song.generatedAudioPath,
            userId: options.userId,
            status: 'completed',
            generationProgress: 100
          });

          song.id = storedSong.id;

          // Increment usage
          await pricingService.incrementUsage(options.userId);
        } catch (dbError) {
          console.warn("Could not store song in database:", dbError);
        }
      }

      // Schedule cleanup for temporary files
      this.scheduleCleanup(song.generatedAudioPath);

      return {
        song,
        status: 'completed'
      };

    } catch (error) {
      console.error('Song generation failed:', error);
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private static enhanceSongData(songData: any, options: SongGenerationOptions): any {
    return {
      ...songData,
      userId: options.userId || 'guest',
      quality: options.quality,
      generationType: options.type,
      songLength: songData.songLength || this.calculateDurationFromLyrics(songData.lyrics),
      mood: songData.mood || 'happy',
      vocalStyle: songData.vocalStyle || 'smooth',
      singingStyle: songData.singingStyle || 'melodic',
      tone: songData.tone || 'warm'
    };
  }

  private static async generateBasic(songData: any): Promise<Song> {
    console.log(`🎵 Generating basic song: ${songData.title}`);
    return await generateAdvancedSong(songData);
  }

  private static async generateAIEnhanced(songData: any): Promise<Song> {
    console.log(`🤖 Generating AI-enhanced song: ${songData.title}`);
    
    // Add AI-specific enhancements
    const aiEnhancedData = {
      ...songData,
      aiFeatures: {
        neuralNetworks: true,
        patternLearning: true,
        enhancedHarmony: true,
        adaptiveStructure: true
      }
    };

    return await generateAdvancedSong(aiEnhancedData);
  }

  private static async generateMusic21Demo(songData: any): Promise<Song> {
    console.log(`🎼 Generating Music21 demo: ${songData.title}`);
    
    // Use Music21-specific generation logic
    const music21Data = {
      ...songData,
      useMusic21: true,
      demoType: songData.demoType || 'basic',
      concepts: {
        note_objects: true,
        chord_objects: true,
        stream_organization: true,
        export_capabilities: true
      }
    };

    return await generateAdvancedSong(music21Data);
  }

  private static calculateDurationFromLyrics(lyrics: string): string {
    if (!lyrics) return '0:30';
    
    const wordCount = lyrics.split(/\s+/).length;
    const estimatedSeconds = Math.max(15, Math.min(300, wordCount * 2)); // 2 seconds per word, 15s min, 5min max
    const minutes = Math.floor(estimatedSeconds / 60);
    const seconds = estimatedSeconds % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private static scheduleCleanup(audioPath: string | undefined): void {
    if (audioPath) {
      // Schedule cleanup after 24 hours
      setTimeout(() => {
        fileCleanupService.cleanupFile(audioPath).catch(console.error);
      }, 24 * 60 * 60 * 1000);
    }
  }

  static async getGenerationStatus(jobId: string): Promise<GenerationResult> {
    // For future job queue implementation
    return {
      status: 'completed',
      error: 'Job queue not implemented yet'
    };
  }

  static async estimateGenerationTime(songData: any): Promise<number> {
    const baseTime = 15; // 15 seconds base
    const lyricsMultiplier = Math.min(songData.lyrics?.length || 100, 1000) / 100;
    const durationMultiplier = (songData.duration || 30) / 30;
    
    return Math.round(baseTime * lyricsMultiplier * durationMultiplier);
  }
}
