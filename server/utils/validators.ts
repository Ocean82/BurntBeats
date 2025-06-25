import { z } from 'zod';

// Enhanced request validation with comprehensive schema definitions
export class RequestValidator {
  static validateRequest(schema: z.ZodSchema, data: unknown) {
    try {
      return { success: true, data: schema.parse(data) };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        return { success: false, error: `Validation failed: ${errors}` };
      }
      return { success: false, error: 'Unknown validation error' };
    }
  }

  static validateSongRequest(data: unknown) {
    return this.validateRequest(SongRequestSchema, data);
  }

  static validateVoiceRequest(data: unknown) {
    return this.validateRequest(VoiceRequestSchema, data);
  }

  static validateMusic21Request(data: unknown) {
    return this.validateRequest(Music21RequestSchema, data);
  }
}

// Validation schemas
export const SongRequestSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  lyrics: z.string()
    .min(1, "Lyrics are required")
    .max(10000, "Lyrics must be less than 10,000 characters"),
  genre: z.enum(['pop', 'rock', 'jazz', 'classical', 'electronic', 'hip-hop', 'country', 'r&b'])
    .default('pop'),
  vocalStyle: z.enum(['male_lead', 'female_lead', 'choir', 'instrumental'])
    .default('male_lead'),
  tempo: z.number()
    .min(60, "Tempo must be at least 60 BPM")
    .max(200, "Tempo must be less than 200 BPM")
    .default(120),
  songLength: z.number()
    .min(15, "Song must be at least 15 seconds")
    .max(300, "Song must be less than 5 minutes")
    .default(60),
  voiceSampleId: z.number().optional(),
  userId: z.number().optional(),
  sections: z.array(z.object({
    type: z.enum(['verse', 'chorus', 'bridge', 'intro', 'outro']),
    lyrics: z.string(),
    duration: z.number().min(5).max(60)
  })).optional(),
  settings: z.object({
    autoTune: z.boolean().default(false),
    reverb: z.number().min(0).max(1).default(0.3),
    compression: z.number().min(0).max(1).default(0.5)
  }).optional()
});

export const VoiceRequestSchema = z.object({
  name: z.string().min(1, "Voice sample name is required"),
  audioData: z.string().min(1, "Audio data is required"),
  duration: z.number().min(1).max(300),
  userId: z.number()
});

export const Music21RequestSchema = z.object({
  title: z.string().min(1),
  lyrics: z.string().min(1),
  genre: z.enum(['pop', 'rock', 'jazz', 'classical', 'electronic', 'hip-hop', 'country', 'r&b']),
  tempo: z.number().min(60).max(200),
  key: z.string().default('C'),
  duration: z.number().min(15).max(300)
});

// Export validation functions
export const validateVoiceRequest = (data: unknown) => RequestValidator.validateVoiceRequest(data);

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