
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export const validateIpAddress = (allowedIps: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip IP filtering in development or if no IPs configured
    if (env.NODE_ENV !== 'production' || allowedIps.length === 0) {
      return next();
    }

    const clientIp = req.ip || req.socket.remoteAddress || req.headers['x-forwarded-for'] as string;
    
    if (!clientIp) {
      return res.status(403).json({
        error: 'Could not verify client IP',
        timestamp: new Date().toISOString(),
      });
    }

    // Extract IP from forwarded header if present
    const actualIp = Array.isArray(clientIp) ? clientIp[0] : clientIp.split(',')[0].trim();

    if (!allowedIps.includes(actualIp)) {
      return res.status(403).json({
        error: 'Access denied',
        clientIp: actualIp,
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
};
