
import { Request, Response, NextFunction } from 'express';

export interface MusicGenerationError extends Error {
  code?: string;
  statusCode?: number;
  details?: any;
}

export function createMusicError(message: string, code: string, statusCode: number = 500, details?: any): MusicGenerationError {
  const error = new Error(message) as MusicGenerationError;
  error.code = code;
  error.statusCode = statusCode;
  error.details = details;
  return error;
}

export function musicErrorHandler(error: MusicGenerationError, req: Request, res: Response, next: NextFunction) {
  console.error('Music Generation Error:', {
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    details: error.details,
    stack: error.stack
  });

  // Default error response
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';
  let code = error.code || 'UNKNOWN_ERROR';

  // Handle specific error types
  switch (error.code) {
    case 'PYTHON_SCRIPT_ERROR':
      statusCode = 500;
      message = 'Music generation service temporarily unavailable';
      break;
    case 'INVALID_LYRICS':
      statusCode = 400;
      message = 'Invalid lyrics format or content';
      break;
    case 'UNSUPPORTED_GENRE':
      statusCode = 400;
      message = 'Unsupported music genre';
      break;
    case 'TEMPO_OUT_OF_RANGE':
      statusCode = 400;
      message = 'Tempo must be between 60 and 200 BPM';
      break;
    case 'DURATION_OUT_OF_RANGE':
      statusCode = 400;
      message = 'Duration must be between 10 and 300 seconds';
      break;
    case 'VOICE_SAMPLE_NOT_FOUND':
      statusCode = 404;
      message = 'Voice sample not found';
      break;
    case 'VOICE_PROCESSING_ERROR':
      statusCode = 500;
      message = 'Voice processing failed';
      break;
    case 'MELODY_GENERATION_ERROR':
      statusCode = 500;
      message = 'Melody generation failed';
      break;
    case 'VOCAL_GENERATION_ERROR':
      statusCode = 500;
      message = 'Vocal generation failed';
      break;
    case 'AUDIO_EXPORT_ERROR':
      statusCode = 500;
      message = 'Audio file generation failed';
      break;
  }

  res.status(statusCode).json({
    error: {
      message,
      code,
      ...(process.env.NODE_ENV === 'development' && { 
        details: error.details,
        stack: error.stack 
      })
    }
  });
}

export function validateMusicGenerationInput(req: Request, res: Response, next: NextFunction) {
  const { title, lyrics, genre, tempo, duration } = req.body;

  try {
    // Required fields
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw createMusicError('Title is required and must be a non-empty string', 'INVALID_TITLE', 400);
    }

    if (!lyrics || typeof lyrics !== 'string' || lyrics.trim().length === 0) {
      throw createMusicError('Lyrics are required and must be a non-empty string', 'INVALID_LYRICS', 400);
    }

    // Validate genre
    const supportedGenres = ['pop', 'rock', 'jazz', 'electronic', 'classical', 'hip-hop', 'country', 'r&b'];
    if (genre && !supportedGenres.includes(genre.toLowerCase())) {
      throw createMusicError(`Unsupported genre. Supported genres: ${supportedGenres.join(', ')}`, 'UNSUPPORTED_GENRE', 400);
    }

    // Validate tempo
    if (tempo && (isNaN(tempo) || tempo < 60 || tempo > 200)) {
      throw createMusicError('Tempo must be a number between 60 and 200 BPM', 'TEMPO_OUT_OF_RANGE', 400);
    }

    // Validate duration
    if (duration && (isNaN(duration) || duration < 10 || duration > 300)) {
      throw createMusicError('Duration must be a number between 10 and 300 seconds', 'DURATION_OUT_OF_RANGE', 400);
    }

    // Validate lyrics length
    if (lyrics.length > 10000) {
      throw createMusicError('Lyrics must be less than 10,000 characters', 'LYRICS_TOO_LONG', 400);
    }

    // Validate title length
    if (title.length > 200) {
      throw createMusicError('Title must be less than 200 characters', 'TITLE_TOO_LONG', 400);
    }

    next();
  } catch (error) {
    next(error);
  }
}

export function validateVoiceInput(req: Request, res: Response, next: NextFunction) {
  const { text, voiceSampleId } = req.body;

  try {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw createMusicError('Text is required and must be a non-empty string', 'INVALID_TEXT', 400);
    }

    if (text.length > 5000) {
      throw createMusicError('Text must be less than 5,000 characters', 'TEXT_TOO_LONG', 400);
    }

    if (voiceSampleId && (typeof voiceSampleId !== 'number' || voiceSampleId <= 0)) {
      throw createMusicError('Voice sample ID must be a positive number', 'INVALID_VOICE_SAMPLE_ID', 400);
    }

    next();
  } catch (error) {
    next(error);
  }
}
