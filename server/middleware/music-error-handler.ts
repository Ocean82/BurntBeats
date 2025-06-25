
import { Request, Response, NextFunction } from 'express';
import { 
  MusicGenerationSchema, 
  VoiceUploadSchema, 
  TextToSpeechSchema,
  WebSocketMessageSchema,
  validateAndTransform,
  safeValidate
} from '../validation/schemas';

// Enhanced music generation validation
export const validateMusicGenerationInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Add user context for better tracking
    if (req.user) {
      req.body.userId = req.user.id;
    } else {
      req.body.userId = 'guest';
    }

    // Validate and transform the request body
    const validation = safeValidate(MusicGenerationSchema, req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: "Validation Error",
        message: validation.error,
        code: "INVALID_INPUT"
      });
    }

    // Replace request body with validated and transformed data
    req.body = validation.data;
    next();

  } catch (error) {
    console.error('Music generation validation error:', error);
    res.status(400).json({
      error: "Validation Error",
      message: error.message,
      code: "VALIDATION_FAILED"
    });
  }
};

// Voice input validation
export const validateVoiceInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user) {
      req.body.userId = req.user.id;
    }

    const validation = safeValidate(VoiceUploadSchema, req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: "Voice Validation Error",
        message: validation.error,
        code: "INVALID_VOICE_INPUT"
      });
    }

    req.body = validation.data;
    next();

  } catch (error) {
    console.error('Voice validation error:', error);
    res.status(400).json({
      error: "Voice Validation Error",
      message: error.message,
      code: "VOICE_VALIDATION_FAILED"
    });
  }
};

// Text-to-Speech validation
export const validateTTSInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = safeValidate(TextToSpeechSchema, req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: "TTS Validation Error",
        message: validation.error,
        code: "INVALID_TTS_INPUT"
      });
    }

    req.body = validation.data;
    next();

  } catch (error) {
    console.error('TTS validation error:', error);
    res.status(400).json({
      error: "TTS Validation Error",
      message: error.message,
      code: "TTS_VALIDATION_FAILED"
    });
  }
};

// WebSocket message validation helper
export const validateWebSocketMessage = (message: string): { success: boolean; data?: any; error?: string } => {
  try {
    const parsed = JSON.parse(message);
    const validation = safeValidate(WebSocketMessageSchema, parsed);
    
    return validation.success 
      ? { success: true, data: validation.data }
      : { success: false, error: validation.error };
      
  } catch (error) {
    return { 
      success: false, 
      error: `Invalid JSON: ${error.message}` 
    };
  }
};

// Global music error handler
export const musicErrorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Music API Error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    user: req.user?.id || 'guest',
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: error.message,
      code: 'VALIDATION_FAILED'
    });
  }

  if (error.message.includes('ENOENT')) {
    return res.status(404).json({
      error: 'File Not Found',
      message: 'Required file or resource not found',
      code: 'FILE_NOT_FOUND'
    });
  }

  if (error.message.includes('timeout')) {
    return res.status(408).json({
      error: 'Request Timeout',
      message: 'Operation took too long to complete',
      code: 'TIMEOUT'
    });
  }

  // Generic server error
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  });
};

// Request sanitization middleware
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sanitize strings in request body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }
    
    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }
    
    next();
  } catch (error) {
    console.error('Request sanitization error:', error);
    res.status(400).json({
      error: 'Invalid Request',
      message: 'Request contains invalid data',
      code: 'SANITIZATION_FAILED'
    });
  }
};

// Helper function to sanitize object properties
function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Remove potential script tags and dangerous HTML
      sanitized[key] = value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

// Rate limiting helper
export const createRateLimiter = (windowMs: number, maxRequests: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.ip || req.user?.id || 'anonymous';
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean up old entries
    for (const [id, data] of requests.entries()) {
      if (data.resetTime < windowStart) {
        requests.delete(id);
      }
    }
    
    // Check current client
    const clientData = requests.get(clientId);
    
    if (!clientData) {
      requests.set(clientId, { count: 1, resetTime: now + windowMs });
      next();
    } else if (clientData.count < maxRequests) {
      clientData.count++;
      next();
    } else {
      res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${Math.ceil(windowMs / 1000)} seconds.`,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
      });
    }
  };
};
