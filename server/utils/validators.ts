
import { z } from 'zod';
import { validateAndTransform, safeValidate, MusicGenerationSchema } from '../validation/schemas';

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class RequestValidator {
  static validateSongRequest(data: unknown): ValidationResult<any> {
    const result = safeValidate(MusicGenerationSchema, data);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error
      };
    }

    // Additional business logic validation
    const validatedData = result.data;
    
    // Check for inappropriate content in lyrics
    if (this.containsInappropriateContent(validatedData.lyrics)) {
      return {
        success: false,
        error: "Lyrics contain inappropriate content"
      };
    }

    // Validate genre-specific constraints
    if (!this.validateGenreConstraints(validatedData.genre, validatedData.tempo)) {
      return {
        success: false,
        error: `Tempo ${validatedData.tempo} is not suitable for ${validatedData.genre} genre`
      };
    }

    return {
      success: true,
      data: validatedData
    };
  }

  static validateVoiceRequest(data: unknown): ValidationResult<any> {
    const schema = z.object({
      text: z.string().min(1).max(1000),
      voiceId: z.number().optional(),
      speed: z.number().min(0.5).max(2.0).default(1.0),
      pitch: z.number().min(-12).max(12).default(0)
    });

    const result = safeValidate(schema, data);
    return {
      success: result.success,
      data: result.success ? result.data : undefined,
      error: result.success ? undefined : result.error
    };
  }

  static validateMusic21Request(data: unknown): ValidationResult<any> {
    const schema = z.object({
      demoType: z.enum(['basic', 'advanced', 'generative']).default('basic'),
      complexity: z.enum(['simple', 'medium', 'complex']).optional(),
      outputFormat: z.enum(['midi', 'audio', 'both']).default('midi')
    });

    const result = safeValidate(schema, data);
    return {
      success: result.success,
      data: result.success ? result.data : undefined,
      error: result.success ? undefined : result.error
    };
  }

  private static containsInappropriateContent(lyrics: string): boolean {
    const inappropriateWords = ['explicit1', 'explicit2']; // Add actual inappropriate words
    const lowerLyrics = lyrics.toLowerCase();
    return inappropriateWords.some(word => lowerLyrics.includes(word));
  }

  private static validateGenreConstraints(genre: string, tempo: number): boolean {
    const genreConstraints: Record<string, { minTempo: number; maxTempo: number }> = {
      'classical': { minTempo: 60, maxTempo: 140 },
      'electronic': { minTempo: 110, maxTempo: 180 },
      'jazz': { minTempo: 80, maxTempo: 160 },
      'rock': { minTempo: 100, maxTempo: 180 },
      'pop': { minTempo: 90, maxTempo: 150 },
      'hip-hop': { minTempo: 70, maxTempo: 140 },
      'country': { minTempo: 90, maxTempo: 140 },
      'r&b': { minTempo: 80, maxTempo: 130 }
    };

    const constraints = genreConstraints[genre.toLowerCase()];
    if (!constraints) return true; // Allow unknown genres

    return tempo >= constraints.minTempo && tempo <= constraints.maxTempo;
  }
}

export const validateSongRequest = (data: unknown) => RequestValidator.validateSongRequest(data);
export const validateVoiceRequest = (data: unknown) => RequestValidator.validateVoiceRequest(data);
export const validateMusic21Request = (data: unknown) => RequestValidator.validateMusic21Request(data);
