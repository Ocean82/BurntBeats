
import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';

const logger = new Logger({ name: 'ApiKeyValidator' });

export const validateApiKey = (validKey: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    if (!apiKey) {
      logger.warn('API key missing', { path: req.path });
      return res.status(401).json({ 
        error: 'API key required',
        timestamp: new Date().toISOString(),
      });
    }

    if (apiKey !== validKey) {
      logger.warn('Invalid API key attempt', { path: req.path });
      return res.status(403).json({ 
        error: 'Invalid API key',
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
};
