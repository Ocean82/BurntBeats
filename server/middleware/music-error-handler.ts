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

export const validateMusicGenerationInput = (req: Request, res: Response, next: NextFunction) => {
  const { title, lyrics, genre, tempo, duration } = req.body;

  // Basic validation
  if (!title || !lyrics) {
    return res.status(400).json({ 
      error: "Title and lyrics are required",
      code: "MISSING_REQUIRED_FIELDS"
    });
  }

  if (typeof title !== 'string' || typeof lyrics !== 'string') {
    return res.status(400).json({
      error: "Title and lyrics must be strings",
      code: "INVALID_INPUT_TYPE"
    });
  }

  // Validate title length
  if (title.length > 100) {
    return res.status(400).json({
      error: "Title must be less than 100 characters",
      code: "TITLE_TOO_LONG"
    });
  }

  // Validate lyrics length
  if (lyrics.length > 5000) {
    return res.status(400).json({
      error: "Lyrics must be less than 5000 characters",
      code: "LYRICS_TOO_LONG"
    });
  }

  if (tempo && (isNaN(tempo) || tempo < 60 || tempo > 200)) {
    return res.status(400).json({
      error: "Tempo must be between 60 and 200 BPM",
      code: "INVALID_TEMPO"
    });
  }

  if (duration && (isNaN(duration) || duration < 5 || duration > 300)) {
    return res.status(400).json({
      error: "Duration must be between 5 and 300 seconds",
      code: "INVALID_DURATION"
    });
  }

  // Validate genre
  const validGenres = ['pop', 'rock', 'jazz', 'classical', 'electronic', 'hip-hop', 'country', 'r&b'];
  if (genre && !validGenres.includes(genre.toLowerCase())) {
    return res.status(400).json({
      error: `Genre must be one of: ${validGenres.join(', ')}`,
      code: "INVALID_GENRE"
    });
  }

  // Add user ID if available from session
  if (req.user?.id) {
    req.body.userId = req.user.id;
  }

  next();
};

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