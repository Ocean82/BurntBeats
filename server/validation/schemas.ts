
import { z } from 'zod';

// Common validation schemas
export const IdSchema = z.coerce.number().positive().int();
export const EmailSchema = z.string().email().max(255);
export const UsernameSchema = z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/);

// Music generation schemas
export const MusicGenerationSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters")
    .transform(s => s.trim()),
  
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

// Voice API schemas
export const VoiceUploadSchema = z.object({
  name: z.string()
    .min(1, "Voice sample name is required")
    .max(100, "Name must be less than 100 characters")
    .transform(s => s.trim()),
    
  userId: z.string().optional()
});

export const TextToSpeechSchema = z.object({
  text: z.string()
    .min(1, "Text is required")
    .max(1000, "Text must be less than 1000 characters")
    .transform(s => s.trim()),
    
  voiceId: z.coerce.number().positive().int().optional(),
  
  speed: z.coerce.number()
    .min(0.5, "Speed must be at least 0.5x")
    .max(2.0, "Speed must be at most 2.0x")
    .default(1.0),
    
  pitch: z.coerce.number()
    .min(-12, "Pitch must be between -12 and +12 semitones")
    .max(12, "Pitch must be between -12 and +12 semitones")
    .default(0)
});

// Authentication schemas
export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(6, "Password must be at least 6 characters")
});

export const RegisterSchema = z.object({
  username: UsernameSchema,
  email: EmailSchema,
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one lowercase letter, one uppercase letter, and one number")
});

// Payment schemas
export const PaymentIntentSchema = z.object({
  amount: z.coerce.number()
    .positive("Amount must be positive")
    .max(1000, "Amount cannot exceed $1000"),
    
  downloadType: z.enum(['mp3_standard', 'mp3_hq', 'wav_cd', 'wav_studio'])
    .optional(),
    
  songId: z.coerce.number().positive().int().optional(),
  
  features: z.array(z.string()).optional()
});

// Pricing schemas
export const PlanLimitationSchema = z.object({
  userId: z.string(),
  feature: z.string().optional(),
  planType: z.enum(['free', 'basic', 'pro', 'enterprise']).optional()
});

// WebSocket message schemas
export const WebSocketMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('ping'),
    timestamp: z.number().optional()
  }),
  z.object({
    type: z.literal('pong'),
    timestamp: z.number().optional()
  }),
  z.object({
    type: z.literal('progress_request'),
    songId: z.coerce.number().positive().int()
  }),
  z.object({
    type: z.literal('collaboration_event'),
    event: z.string(),
    userId: z.string(),
    data: z.record(z.unknown()).optional()
  })
]);

// Utility validation functions
export function validateAndTransform<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new Error(`Validation error: ${firstError.message} at ${firstError.path.join('.')}`);
    }
    throw error;
  }
}

export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { success: false, error: `Validation failed: ${errors}` };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}
