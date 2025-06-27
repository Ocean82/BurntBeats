import { Request, Response, NextFunction } from 'express';

export class RequestValidator {
  static validateSongRequest(req: Request, res: Response, next: NextFunction) {
    const { title, lyrics, genre } = req.body;
    
    if (!title || !lyrics || !genre) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, lyrics, genre'
      });
    }
    
    next();
  }

  static validateUserInput(req: Request, res: Response, next: NextFunction) {
    const userAgent = req.headers['user-agent'];
    
    if (!userAgent) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request'
      });
    }
    
    next();
  }
}