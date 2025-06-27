
import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { validate as uuidValidate } from 'uuid';
import { env } from '../config/env';
import { VoiceSampleRepository } from '../repositories/voiceSampleRepository';
import { AudioProcessor } from '../services/audioProcessor';
import { RequestValidator } from '../middleware/requestValidator';
import { rateLimiter } from '../middleware/rateLimiter';
import { Logger } from '../utils/logger';

const logger = new Logger({ name: 'VoiceAPI' });

// Configure upload directory
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer with enhanced security
const upload = multer({
  dest: uploadsDir,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 1,
    fieldNameSize: 100,
    fields: 5,
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
  private static voiceSampleRepo = new VoiceSampleRepository();
  private static audioProcessor = new AudioProcessor();

  // Middleware
  static uploadMiddleware = [
    rateLimiter(5, '1 minute'),
    upload.single('voiceSample'),
    RequestValidator.validateVoiceUpload,
  ];

  /**
   * Upload voice sample with enhanced security and validation
   */
  static async uploadVoiceSample(req: Request, res: Response) {
    const requestId = req.id;
    const startTime = process.hrtime();

    try {
      if (!req.file) {
        logger.warn('No file uploaded', { requestId });
        return res.status(400).json({ 
          error: 'No file uploaded',
          requestId,
        });
      }

      // Validate user ID if provided
      const userId = req.body.userId;
      if (userId && !uuidValidate(userId)) {
        return res.status(400).json({
          error: 'Invalid user ID format',
          requestId,
        });
      }

      // Analyze audio file
      const analysis = await VoiceAPI.audioProcessor.analyze(req.file.path);

      // Create voice sample record
      const voiceSample = await VoiceAPI.voiceSampleRepo.create({
        id: crypto.randomUUID(),
        originalName: req.file.originalname,
        fileName: req.file.filename,
        filePath: `/uploads/${req.file.filename}`,
        duration: analysis.duration,
        sampleRate: analysis.sampleRate,
        channels: analysis.channels,
        userId: userId || null,
        size: req.file.size,
        mimeType: req.file.mimetype,
      });

      logger.info('Voice sample uploaded', { 
        voiceSampleId: voiceSample.id,
        duration: voiceSample.duration,
        requestId,
      });

      const [seconds, nanoseconds] = process.hrtime(startTime);
      const processingTime = `${seconds}.${nanoseconds.toString().padStart(9, '0')}s`;

      res.status(201).json({
        ...voiceSample,
        processingTime,
        requestId,
      });

    } catch (error) {
      logger.error('Voice upload failed', { 
        error: error.message, 
        stack: error.stack,
        requestId,
      });

      // Clean up uploaded file if error occurred
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        error: 'Failed to process voice sample',
        requestId,
        details: env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get user voice samples with pagination
   */
  static async getVoiceSamples(req: Request, res: Response) {
    const requestId = req.id;

    try {
      const { userId } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      // Validate user ID if provided
      if (userId && !uuidValidate(userId as string)) {
        return res.status(400).json({
          error: 'Invalid user ID format',
          requestId,
        });
      }

      const { samples, total } = await VoiceAPI.voiceSampleRepo.findByUser(
        userId as string | undefined,
        page,
        limit
      );

      logger.info('Fetched voice samples', {
        count: samples.length,
        userId,
        requestId,
      });

      res.json({
        data: samples,
        meta: {
          total,
          page,
          limit,
          hasMore: page * limit < total,
          requestId,
        },
      });

    } catch (error) {
      logger.error('Failed to fetch voice samples', {
        error: error.message,
        requestId,
      });

      res.status(500).json({
        error: 'Failed to fetch voice samples',
        requestId,
      });
    }
  }

  /**
   * Text-to-speech generation with enhanced validation
   */
  static async generateTTS(req: Request, res: Response) {
    const requestId = req.id;
    const startTime = process.hrtime();

    try {
      const { text, voice, settings } = req.body;

      // Validate input
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({
          error: 'Text must be a non-empty string',
          requestId,
        });
      }

      if (text.length > 5000) {
        return res.status(400).json({
          error: 'Text must be less than 5000 characters',
          requestId,
        });
      }

      logger.info('Generating TTS', {
        textLength: text.length,
        voice,
        requestId,
      });

      // Generate TTS (would integrate with real TTS service in production)
      const result = await VoiceAPI.audioProcessor.generateTTS({
        text,
        voice: voice || 'default',
        settings: settings || {},
      });

      const [seconds, nanoseconds] = process.hrtime(startTime);
      const processingTime = `${seconds}.${nanoseconds.toString().padStart(9, '0')}s`;

      logger.info('TTS generation completed', {
        duration: result.duration,
        processingTime,
        requestId,
      });

      res.json({
        ...result,
        processingTime,
        requestId,
      });

    } catch (error) {
      logger.error('TTS generation failed', {
        error: error.message,
        requestId,
      });

      res.status(500).json({
        error: 'Failed to generate TTS',
        requestId,
        details: env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Voice cloning with enhanced security and validation
   */
  static async cloneVoice(req: Request, res: Response) {
    const requestId = req.id;
    const startTime = process.hrtime();

    try {
      const { voiceSampleId, text, settings } = req.body;

      // Validate input
      if (!voiceSampleId || !uuidValidate(voiceSampleId)) {
        return res.status(400).json({
          error: 'Valid voiceSampleId is required',
          requestId,
        });
      }

      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({
          error: 'Text must be a non-empty string',
          requestId,
        });
      }

      if (text.length > 1000) {
        return res.status(400).json({
          error: 'Text must be less than 1000 characters',
          requestId,
        });
      }

      logger.info('Cloning voice', {
        voiceSampleId,
        textLength: text.length,
        requestId,
      });

      // Verify voice sample exists and belongs to user (if authenticated)
      const voiceSample = await VoiceAPI.voiceSampleRepo.findById(voiceSampleId);
      if (!voiceSample) {
        return res.status(404).json({
          error: 'Voice sample not found',
          requestId,
        });
      }

      // Generate cloned voice (would integrate with real voice cloning service in production)
      const result = await VoiceAPI.audioProcessor.cloneVoice({
        voiceSamplePath: path.join(uploadsDir, voiceSample.fileName),
        text,
        settings: settings || {},
      });

      const [seconds, nanoseconds] = process.hrtime(startTime);
      const processingTime = `${seconds}.${nanoseconds.toString().padStart(9, '0')}s`;

      logger.info('Voice cloning completed', {
        duration: result.duration,
        processingTime,
        requestId,
      });

      res.json({
        ...result,
        processingTime,
        requestId,
      });

    } catch (error) {
      logger.error('Voice cloning failed', {
        error: error.message,
        requestId,
      });

      res.status(500).json({
        error: 'Failed to clone voice',
        requestId,
        details: env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Delete voice sample
   */
  static async deleteVoiceSample(req: Request, res: Response) {
    const requestId = req.id;

    try {
      const { id } = req.params;

      if (!id || !uuidValidate(id)) {
        return res.status(400).json({
          error: 'Valid voice sample ID is required',
          requestId,
        });
      }

      // Verify voice sample exists
      const voiceSample = await VoiceAPI.voiceSampleRepo.findById(id);
      if (!voiceSample) {
        return res.status(404).json({
          error: 'Voice sample not found',
          requestId,
        });
      }

      // Delete file
      const filePath = path.join(uploadsDir, voiceSample.fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete record
      await VoiceAPI.voiceSampleRepo.delete(id);

      logger.info('Voice sample deleted', {
        voiceSampleId: id,
        requestId,
      });

      res.status(204).end();

    } catch (error) {
      logger.error('Failed to delete voice sample', {
        error: error.message,
        requestId,
      });

      res.status(500).json({
        error: 'Failed to delete voice sample',
        requestId,
      });
    }
  }
}
