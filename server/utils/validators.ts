
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
import { z } from 'zod';

// Validation schemas
export const SongRequestSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters")
    .transform(s => s.trim())
    .optional(),
  
  lyrics: z.string()
    .min(1, "Lyrics are required")
    .max(5000, "Lyrics must be less than 5000 characters")
    .transform(s => s.trim()),
    
  genre: z.enum([
    'pop', 'rock', 'jazz', 'electronic', 'classical', 
    'hip-hop', 'country', 'r&b', 'blues', 'folk', 'reggae'
  ]).default('pop'),
  
  tempo: z.coerce.number()
    .min(60, "Tempo must be at least 60 BPM")
    .max(200, "Tempo must be at most 200 BPM")
    .default(120),
    
  key: z.enum([
    'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
    'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'
  ]).default('C'),
  
  duration: z.coerce.number()
    .min(5, "Duration must be at least 5 seconds")
    .max(300, "Duration must be at most 300 seconds")
    .default(30),
    
  mood: z.enum(['happy', 'sad', 'energetic', 'calm', 'angry', 'mysterious', 'romantic'])
    .default('happy'),
    
  vocalStyle: z.enum(['smooth', 'powerful', 'whispery', 'raspy', 'clear', 'melodic'])
    .default('smooth'),
    
  singingStyle: z.enum(['melodic', 'rhythmic', 'expressive', 'technical', 'emotional'])
    .default('melodic'),
    
  tone: z.enum(['warm', 'bright', 'dark', 'neutral', 'vintage', 'modern'])
    .default('warm'),
    
  userId: z.string().optional()
});

export const Music21RequestSchema = z.object({
  demoType: z.enum(['basic', 'advanced', 'generative']).default('basic'),
  title: z.string().optional(),
  outputFormat: z.enum(['midi', 'musicxml', 'wav']).default('midi')
});

// Validation functions
export function validateSongRequest(data: unknown): { success: true; data: z.infer<typeof SongRequestSchema> } | { success: false; error: string } {
  try {
    const result = SongRequestSchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { success: false, error: `Validation failed: ${errors}` };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}

export function validateMusic21Request(data: unknown): { success: true; data: z.infer<typeof Music21RequestSchema> } | { success: false; error: string } {
  try {
    const result = Music21RequestSchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { success: false, error: `Validation failed: ${errors}` };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}
