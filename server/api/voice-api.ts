import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { VoiceCloningService } from '../services/voice-cloning-service';
import { FileStorageService } from '../services/file-storage-service';
import { Logger } from '../utils/logger';
import { rateLimiter } from '../middleware/rateLimiter';

const logger = new Logger({ name: 'VoiceAPI' });

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'audio/wav',
      'audio/mpeg',
      'audio/ogg',
      'audio/webm',
      'audio/aac',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  },
});

export class VoiceAPI {
  private static voiceCloningService = VoiceCloningService.getInstance();
  private static fileStorage = new FileStorageService();

  // Upload middleware
  static uploadMiddleware = [
    rateLimiter(5, '1 minute'),
    upload.single('audio'),
  ];

  /**
   * Clone voice with enhanced features
   */
  static async cloneVoice(req: Request, res: Response) {
    const requestId = req.id || 'unknown';

    try {
      if (!req.file && !req.body.audioUrl) {
        return res.status(400).json({
          error: 'Audio file or URL required',
          requestId,
        });
      }

      const { name = 'My Voice', makePublic = false, sampleText } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          error: 'Authentication required',
          requestId,
        });
      }

      logger.info('Voice cloning request', {
        userId,
        name,
        makePublic,
        hasFile: !!req.file,
        hasUrl: !!req.body.audioUrl,
        requestId,
      });

      const audio = req.file?.buffer || req.body.audioUrl;
      const result = await VoiceAPI.voiceCloningService.cloneVoice(audio, {
        userId,
        name,
        makePublic: makePublic === 'true' || makePublic === true,
        sampleText,
      });

      logger.info('Voice cloning completed', {
        voiceId: result.id,
        userId,
        requestId,
      });

      res.status(201).json({
        ...result,
        requestId,
      });

    } catch (error) {
      logger.error('Voice cloning failed', {
        error: error.message,
        requestId,
      });

      res.status(500).json({
        error: 'Failed to clone voice',
        details: error.message,
        requestId,
      });
    }
  }

  /**
   * Get available voices
   */
  static async getVoices(req: Request, res: Response) {
    const requestId = req.id || 'unknown';

    try {
      const userId = req.user?.id;
      const voices = await VoiceAPI.voiceCloningService.getAvailableVoices(userId);

      logger.info('Voices fetched', {
        count: voices.length,
        userId,
        requestId,
      });

      res.json({
        voices,
        requestId,
      });

    } catch (error) {
      logger.error('Failed to get voices', {
        error: error.message,
        requestId,
      });

      res.status(500).json({
        error: 'Failed to get voices',
        requestId,
      });
    }
  }

  /**
   * Get user's voices
   */
  static async getUserVoices(req: Request, res: Response) {
    const requestId = req.id || 'unknown';

    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          error: 'Authentication required',
          requestId,
        });
      }

      const voices = await VoiceAPI.voiceCloningService.getAvailableVoices(userId);
      const userVoices = voices.filter(voice => voice.userId === userId);

      res.json({
        voices: userVoices,
        requestId,
      });

    } catch (error) {
      logger.error('Failed to get user voices', {
        error: error.message,
        requestId,
      });

      res.status(500).json({
        error: 'Failed to get user voices',
        requestId,
      });
    }
  }

  /**
   * Delete voice
   */
  static async deleteVoice(req: Request, res: Response) {
    const requestId = req.id || 'unknown';

    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          error: 'Authentication required',
          requestId,
        });
      }

      await VoiceAPI.voiceCloningService.deleteVoice(id, userId);

      logger.info('Voice deleted', {
        voiceId: id,
        userId,
        requestId,
      });

      res.status(204).end();

    } catch (error) {
      logger.error('Failed to delete voice', {
        error: error.message,
        requestId,
      });

      res.status(500).json({
        error: 'Failed to delete voice',
        requestId,
      });
    }
  }

  /**
   * Serve voice files
   */
  static async serveFile(req: Request, res: Response) {
    try {
      const { fileName } = req.params;
      const filePath = VoiceAPI.fileStorage.getFilePath(fileName);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
      }

      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        // Support range requests for audio streaming
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'audio/wav',
        };
        res.writeHead(206, head);
        file.pipe(res);
      } else {
        const head = {
          'Content-Length': fileSize,
          'Content-Type': 'audio/wav',
        };
        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res);
      }

    } catch (error) {
      logger.error('Failed to serve file', { error: error.message });
      res.status(500).json({ error: 'Failed to serve file' });
    }
  }
}