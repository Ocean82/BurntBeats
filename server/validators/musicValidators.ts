import { Request, Response, NextFunction } from 'express';

export function validateSongRequest(req: Request, res: Response, next: NextFunction) {
  const { title, lyrics, genre } = req.body;
  
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ success: false, error: 'Valid title is required' });
  }
  
  if (!lyrics || typeof lyrics !== 'string') {
    return res.status(400).json({ success: false, error: 'Valid lyrics are required' });
  }
  
  if (!genre || typeof genre !== 'string') {
    return res.status(400).json({ success: false, error: 'Valid genre is required' });
  }
  
  next();
}

export function validateMusic21Request(req: Request, res: Response, next: NextFunction) {
  const { title, lyrics, genre, tempo, key } = req.body;
  
  if (!title || !lyrics || !genre) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields: title, lyrics, genre' 
    });
  }
  
  if (tempo && (typeof tempo !== 'number' || tempo < 60 || tempo > 200)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Tempo must be a number between 60 and 200' 
    });
  }
  
  next();
}