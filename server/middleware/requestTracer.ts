
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Extend the Request interface to include id
declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

export const requestTracer = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Generate unique request ID
    req.id = crypto.randomUUID();
    
    // Add request ID to response headers
    res.setHeader('X-Request-ID', req.id);
    
    // Log request start
    console.log(`[${req.id}] ${req.method} ${req.url} - ${req.ip}`);
    
    next();
  };
};
