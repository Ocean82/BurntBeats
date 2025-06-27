
import { Request, Response, NextFunction } from 'express';
import { createRateLimiter } from './music-error-handler';

// AI Chat specific rate limiter
export const aiChatRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per IP
  message: "Too many AI chat requests, please slow down."
});

// Validate AI chat input
export const validateAIChatInput = (req: Request, res: Response, next: NextFunction) => {
  const { message, context, user } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ 
      error: 'Message is required and must be a string',
      code: 'INVALID_MESSAGE'
    });
  }

  if (message.length > 500) {
    return res.status(400).json({ 
      error: 'Message too long (max 500 characters)',
      code: 'MESSAGE_TOO_LONG'
    });
  }

  if (message.trim().length === 0) {
    return res.status(400).json({ 
      error: 'Message cannot be empty',
      code: 'EMPTY_MESSAGE'
    });
  }

  // Sanitize message
  req.body.message = message.trim();
  req.body.context = context || 'general';
  req.body.user = user || 'Anonymous';

  next();
};

// AI Chat error handler
export const aiChatErrorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('AI Chat Error:', error);

  if (error.message.includes('timeout')) {
    return res.status(504).json({
      error: 'AI is thinking too hard, try again',
      reply: "Sorry, my brain is buffering. Give me another shot!",
      code: 'AI_TIMEOUT'
    });
  }

  if (error.message.includes('rate limit')) {
    return res.status(429).json({
      error: 'Slow down there, speed racer',
      reply: "Whoa! You're chatting faster than I can roast. Chill for a sec!",
      code: 'RATE_LIMIT'
    });
  }

  res.status(500).json({
    error: 'AI is having a moment',
    reply: "My circuits are fried from trying to process your last message. Give me a sec to recover!",
    code: 'AI_ERROR'
  });
};
