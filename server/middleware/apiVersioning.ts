
import { Request, Response, NextFunction } from 'express';

export const validateApiVersion = (requiredVersion: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const apiVersion = req.headers['stripe-version'] || req.headers['api-version'];
    
    // Skip validation in development or if no version required
    if (process.env.NODE_ENV !== 'production' || !requiredVersion) {
      return next();
    }
    
    if (apiVersion && apiVersion !== requiredVersion) {
      return res.status(400).json({
        error: 'API version mismatch',
        required: requiredVersion,
        provided: apiVersion,
        timestamp: new Date().toISOString(),
      });
    }
    
    next();
  };
};
