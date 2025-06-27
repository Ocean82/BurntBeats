import { Request, Response } from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import { exec } from 'child_process';
import crypto from 'crypto';
import { validate as uuidValidate } from 'uuid';
import { env } from '../config/env';
import { Logger } from '../utils/logger';
import { SongRepository } from '../repositories/songRepository';
import { AudioGenerator } from '../services/audioGenerator';
import { Music21Service } from '../services/music21Service';
import { AIMusicService } from '../services/aiMusicService';
import { RequestValidator } from '../middleware/requestValidator';
import { rateLimiter } from '../middleware/rateLimiter';
import { validateSongRequest, validateMusic21Request } from '../validators/musicValidators';

const logger = new Logger({ name: 'MusicAPI' });
const execAsync = promisify(exec);

export class MusicAPI {
  private static uploadsDir = path.join(process.cwd(), 'uploads');
  private static songRepo = new SongRepository();
  private static audioGenerator = new AudioGenerator();
  private static music21Service = new Music21Service();
  private static aiMusicService = new AIMusicService();

  // Middleware
  static generateSongMiddleware = [
    rateLimiter(3, '1 minute'),
    validateSongRequest,
  ];

  static generateAIMusicMiddleware = [
    rateLimiter(2, '1 minute'),
    validateMusic21Request,
  ];

  /**
   * Generate a song with comprehensive validation and processing
   */
  static async generateSong(req: Request, res: Response) {
    const requestId = req.id;
    const startTime = process.hrtime();

    try {
      const songData = req.body;
      const user = (req as any).user;

      logger.info('Generating song', {
        title: songData.title,
        genre: songData.genre,
        requestId,
      });

      // Check user's generation limits
      const canGenerate = await pricingService.canGenerateSong(user?.id);
      if (!canGenerate) {
        return res.status(403).json({
          error: 'Song generation limit reached',
          requestId,
          upgradeUrl: '/pricing',
        });
      }

      // Generate song using MusicGenerator
      const { MusicGenerator } = await import('../music-generator');
      const generationResult = await MusicGenerator.generateSong({
        title: songData.title,
        lyrics: songData.lyrics,
        genre: songData.genre,
        tempo: songData.tempo,
        key: songData.key,
        duration: songData.duration,
        mood: songData.mood,
        vocalStyle: songData.vocalStyle,
        singingStyle: songData.singingStyle,
        tone: songData.tone,
        userId: user?.id
      });

      if (!generationResult || generationResult.status === 'failed') {
        logger.error('Song generation failed', {
          error: generationResult?.error || 'Unknown error',
          requestId,
        });
        return res.status(400).json({
          error: 'Song generation failed',
          details: generationResult?.error || 'Unknown error',
          requestId,
        });
      }

      // Store song in database
      const storedSong = await MusicAPI.songRepo.create({
        title: generationResult.title,
        lyrics: generationResult.lyrics,
        genre: generationResult.genre,
        tempo: generationResult.tempo,
        key: generationResult.key,
        duration: generationResult.duration,
        generatedAudioPath: generationResult.generatedAudioPath,
        userId: user?.id?.toString() || generationResult.userId,
        status: 'completed',
        generationProgress: 100
      });

      // Calculate processing time
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const processingTime = `${seconds}.${nanoseconds.toString().padStart(9, '0')}s`;

      logger.info('Song generated successfully', {
        songId: storedSong.id,
        duration: storedSong.duration,
        processingTime,
        requestId,
      });

      res.status(201).json({
        ...storedSong,
        processingTime,
        requestId,
      });

    } catch (error) {
      logger.error('Song generation error', {
        error: error.message,
        stack: error.stack,
        requestId,
      });

      res.status(500).json({
        error: 'Failed to generate song',
        requestId,
        details: env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Generate AI-enhanced music with comprehensive validation
   */
  static async generateAIMusic(req: Request, res: Response) {
    const requestId = req.id;
    const startTime = process.hrtime();

    try {
      const { title, lyrics, genre, tempo, key, duration } = req.body;
      const user = (req as any).user;

      logger.info('Generating AI music', {
        title,
        genre,
        requestId,
      });

      // Check AI generation limits
      const canGenerateAI = await pricingService.canGenerateAIMusic(user?.id);
      if (!canGenerateAI) {
        return res.status(403).json({
          error: 'AI music generation limit reached',
          requestId,
          upgradeUrl: '/pricing',
        });
      }

      // Generate AI music
      const generationResult = await MusicAPI.aiMusicService.generate({
        title,
        lyrics,
        genre: genre || 'pop',
        tempo: tempo || 120,
        key: key || 'C',
        duration: duration || 30,
        userId: user?.id,
      });

      if (!generationResult.success) {
        logger.error('AI music generation failed', {
          error: generationResult.error,
          requestId,
        });
        return res.status(400).json({
          error: 'AI music generation failed',
          details: generationResult.error,
          requestId,
        });
      }

      // Store in database
      const storedSong = await MusicAPI.songRepo.create({
        ...generationResult.song,
        generationType: 'ai',
        userId: user?.id,
        status: 'completed',
      });

      // Calculate processing time
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const processingTime = `${seconds}.${nanoseconds.toString().padStart(9, '0')}s`;

      logger.info('AI music generated successfully', {
        songId: storedSong.id,
        duration: storedSong.duration,
        processingTime,
        requestId,
      });

      res.status(201).json({
        ...storedSong,
        processingTime,
        requestId,
        aiFeatures: generationResult.aiFeatures,
      });

    } catch (error) {
      logger.error('AI music generation error', {
        error: error.message,
        stack: error.stack,
        requestId,
      });

      res.status(500).json({
        error: 'Failed to generate AI music',
        requestId,
        details: env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Generate Music21 demo with comprehensive validation
   */
  static async generateMusic21Demo(req: Request, res: Response) {
    const requestId = req.id;
    const startTime = process.hrtime();

    try {
      const { demoType = 'basic' } = req.body;

      logger.info('Generating Music21 demo', {
        demoType,
        requestId,
      });

      // Generate demo
      const demoResult = await MusicAPI.music21Service.generateDemo({
        demoType,
        userId: (req as any).user?.id,
      });

      if (!demoResult.success) {
        logger.error('Music21 demo failed', {
          error: demoResult.error,
          requestId,
        });
        return res.status(400).json({
          error: 'Music21 demo failed',
          details: demoResult.error,
          requestId,
        });
      }

      // Calculate processing time
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const processingTime = `${seconds}.${nanoseconds.toString().padStart(9, '0')}s`;

      logger.info('Music21 demo generated successfully', {
        demoType,
        processingTime,
        requestId,
      });

      res.status(201).json({
        ...demoResult,
        processingTime,
        requestId,
      });

    } catch (error) {
      logger.error('Music21 demo error', {
        error: error.message,
        stack: error.stack,
        requestId,
      });

      res.status(500).json({
        error: 'Failed to generate Music21 demo',
        requestId,
        details: env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get song by ID with comprehensive validation
   */
  static async getSong(req: Request, res: Response) {
    const requestId = req.id;

    try {
      const songId = req.params.id;

      if (!uuidValidate(songId)) {
        return res.status(400).json({
          error: 'Invalid song ID format',
          requestId,
        });
      }

      logger.info('Fetching song', {
        songId,
        requestId,
      });

      const song = await MusicAPI.songRepo.findById(songId);

      if (!song) {
        return res.status(404).json({
          error: 'Song not found',
          requestId,
        });
      }

      // Check permissions
      const user = (req as any).user;
      if (song.userId && user?.id !== song.userId) {
        return res.status(403).json({
          error: 'Unauthorized to access this song',
          requestId,
        });
      }

      logger.info('Song fetched successfully', {
        songId,
        requestId,
      });

      res.json({
        ...song,
        requestId,
      });

    } catch (error) {
      logger.error('Error fetching song', {
        error: error.message,
        requestId,
      });

      res.status(500).json({
        error: 'Failed to fetch song',
        requestId,
        details: env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get user songs with pagination and filtering
   */
  static async getUserSongs(req: Request, res: Response) {
    const requestId = req.id;

    try {
      const userId = (req as any).user?.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const filter = req.query.filter as string || 'all';

      if (!userId) {
        return res.status(401).json({
          error: 'Authentication required',
          requestId,
        });
      }

      logger.info('Fetching user songs', {
        userId,
        page,
        limit,
        filter,
        requestId,
      });

      const { songs, total } = await MusicAPI.songRepo.findByUser(
        userId,
        page,
        limit,
        filter
      );

      logger.info('User songs fetched successfully', {
        count: songs.length,
        total,
        requestId,
      });

      res.json({
        data: songs,
        meta: {
          total,
          page,
          limit,
          hasMore: page * limit < total,
          requestId,
        },
      });

    } catch (error) {
      logger.error('Error fetching user songs', {
        error: error.message,
        requestId,
      });

      res.status(500).json({
        error: 'Failed to fetch user songs',
        requestId,
        details: env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Helper method to generate audio from MIDI with fallback
   */
  private static async generateAudioFromMidi(midiPath: string): Promise<string> {
    const audioPath = midiPath.replace('.mid', '.wav');

    try {
      // Try using Timidity first
      await execAsync(`timidity "${midiPath}" -Ow -o "${audioPath}"`);
      return audioPath;
    } catch (timidityError) {
      logger.warn('Timidity failed, trying FFmpeg', {
        error: timidityError.message,
      });

      try {
        // Fallback to FFmpeg
        await execAsync(`ffmpeg -i "${midiPath}" "${audioPath}"`);
        return audioPath;
      } catch (ffmpegError) {
        logger.warn('FFmpeg failed, using silent audio', {
          error: ffmpegError.message,
        });

        // Final fallback to silent audio
        const silentPath = path.join(MusicAPI.uploadsDir, 'silence.wav');
        await MusicAPI.audioGenerator.generateSilentAudio(silentPath);
        await fs.copyFile(silentPath, audioPath);
        return audioPath;
      }
    }
  }
}
