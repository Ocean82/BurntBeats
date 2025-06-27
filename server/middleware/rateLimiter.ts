
import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

export const rateLimiter = (max: number, windowMs: string) => {
  const parseWindow = (window: string): number => {
    const [value, unit] = window.split(' ');
    const num = parseInt(value, 10);
    
    switch (unit) {
      case 'second':
      case 'seconds':
        return num * 1000;
      case 'minute':
      case 'minutes':
        return num * 60 * 1000;
      case 'hour':
      case 'hours':
        return num * 60 * 60 * 1000;
      default:
        return 60 * 1000; // Default to 1 minute
    }
  };

  return rateLimit({
    windowMs: parseWindow(windowMs),
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.NODE_ENV === 'test',
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: `${parseWindow(windowMs) / 1000} seconds`,
        timestamp: new Date().toISOString(),
      });
    },
  });
};
