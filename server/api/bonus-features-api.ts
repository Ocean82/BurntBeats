import { Request, Response, Router, NextFunction } from 'express';
import { AIChatService } from '../services/aiChatService';
import { LicenseGenerator } from '../services/licenseGenerator';
import { BeatAnalyticsService } from '../services/beatAnalyticsService';
import { PurchaseService } from '../services/purchaseService';
import { validateApiKey } from '../middleware/apiKeyValidator';
import { rateLimiter } from '../middleware/rateLimiter';
import { RequestValidator } from '../middleware/requestValidator';
import { Logger } from '../utils/logger';
import { env } from '../config/env';

const router = Router();
const logger = new Logger({ name: 'LicensingAPI' });

// Middleware
const validateLicenseRequest = RequestValidator.validate({
  songId: { type: 'string', required: true },
  songTitle: { type: 'string', required: true },
  tier: { type: 'string', enum: ['basic', 'premium', 'exclusive'], required: true },
  userEmail: { type: 'string', format: 'email', required: true },
  artistName: { type: 'string', required: false }
});

/**
 * Generate AI feedback for a purchased song
 */
router.post(
  "/ai-feedback/:songId",
  rateLimiter(5, '1 minute'),
  async (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.id;
    const startTime = process.hrtime();

    try {
      const { songId } = req.params;
      const { tier, userEmail } = req.body;

      // Validate input
      if (!songId || !tier || !userEmail) {
        logger.warn('Missing required parameters', { requestId });
        return res.status(400).json({ 
          error: 'Missing required parameters',
          requestId,
        });
      }

      // Get song details
      const song = await PurchaseService.getSongDetails(songId);
      if (!song) {
        logger.warn('Song not found', { songId, requestId });
        return res.status(404).json({ 
          error: 'Song not found',
          requestId,
        });
      }

      // Generate AI feedback
      const feedback = await AIChatService.generatePostPurchaseFeedback({
        songId,
        songTitle: song.title,
        lyrics: song.lyrics,
        tier,
        userEmail,
        requestId,
      });

      // Calculate processing time
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const processingTime = `${seconds}.${nanoseconds.toString().padStart(9, '0')}s`;

      logger.info('AI feedback generated', { 
        songId, 
        processingTime,
        requestId,
      });

      res.json({
        ...feedback,
        processingTime,
        requestId,
      });

    } catch (error) {
      logger.error('AI feedback generation failed', {
        error: error.message,
        stack: error.stack,
        requestId: req.id,
      });

      next(error);
    }
  }
);

/**
 * Retrieve AI feedback for a song
 */
router.get(
  "/ai-feedback/:songId",
  rateLimiter(10, '1 minute'),
  async (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.id;

    try {
      const { songId } = req.params;

      const feedback = await PurchaseService.getFeedback(songId);
      if (!feedback) {
        logger.warn('Feedback not found', { songId, requestId });
        return res.status(404).json({ 
          error: 'AI feedback not found for this song',
          requestId,
        });
      }

      logger.info('Retrieved AI feedback', { songId, requestId });
      res.json(feedback);

    } catch (error) {
      logger.error('Failed to retrieve AI feedback', {
        error: error.message,
        stack: error.stack,
        requestId,
      });

      next(error);
    }
  }
);

/**
 * Generate license certificate
 */
router.post(
  "/license/generate",
  validateApiKey(env.LICENSE_API_KEY),
  rateLimiter(3, '1 minute'),
  validateLicenseRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.id;
    const startTime = process.hrtime();

    try {
      const { songId, songTitle, tier, userEmail, artistName } = req.body;

      // Generate license
      const license = await LicenseGenerator.generate({
        songId,
        songTitle,
        tier,
        userEmail,
        artistName: artistName || userEmail.split('@')[0] || 'Artist',
        requestId,
      });

      // Calculate processing time
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const processingTime = `${seconds}.${nanoseconds.toString().padStart(9, '0')}s`;

      logger.info('License generated', { 
        licenseId: license.licenseId,
        processingTime,
        requestId,
      });

      res.json({
        success: true,
        ...license,
        processingTime,
        requestId,
      });

    } catch (error) {
      logger.error('License generation failed', {
        error: error.message,
        stack: error.stack,
        requestId,
      });

      next(error);
    }
  }
);

/**
 * Get beat popularity statistics
 */
router.get(
  "/beats/popularity/:beatId",
  rateLimiter(10, '1 minute'),
  async (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.id;

    try {
      const { beatId } = req.params;

      const stats = await BeatAnalyticsService.getBeatStats(beatId);
      if (!stats) {
        logger.warn('Beat stats not found', { beatId, requestId });
        return res.status(404).json({ 
          error: 'Beat statistics not found',
          requestId,
        });
      }

      logger.info('Retrieved beat stats', { beatId, requestId });
      res.json(stats);

    } catch (error) {
      logger.error('Failed to retrieve beat stats', {
        error: error.message,
        stack: error.stack,
        requestId,
      });

      next(error);
    }
  }
);

/**
 * Get top performing beats
 */
router.get(
  "/beats/top-performing",
  rateLimiter(10, '1 minute'),
  async (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.id;

    try {
      const limit = parseInt(req.query.limit as string) || 10;

      const topBeats = await BeatAnalyticsService.getTopBeats(limit);

      logger.info('Retrieved top performing beats', { 
        count: topBeats.length,
        requestId,
      });

      res.json({
        success: true,
        topBeats,
        count: topBeats.length,
        requestId,
      });

    } catch (error) {
      logger.error('Failed to retrieve top beats', {
        error: error.message,
        stack: error.stack,
        requestId,
      });

      next(error);
    }
  }
);

/**
 * Get purchase summary for user
 */
router.get(
  "/purchases/summary/:userEmail",
  rateLimiter(10, '1 minute'),
  async (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.id;

    try {
      const { userEmail } = req.params;

      const summary = await PurchaseService.getUserPurchaseSummary(userEmail);

      logger.info('Retrieved purchase summary', { 
        userEmail,
        purchaseCount: summary.purchases.length,
        requestId,
      });

      res.json({
        ...summary,
        requestId,
      });

    } catch (error) {
      logger.error('Failed to retrieve purchase summary', {
        error: error.message,
        stack: error.stack,
        requestId,
      });

      next(error);
    }
  }
);

// Error handling middleware
router.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  const requestId = req.id;

  logger.error('API error', {
    error: error.message,
    stack: error.stack,
    requestId,
  });

  res.status(500).json({
    error: 'Internal server error',
    requestId,
    details: env.NODE_ENV === 'development' ? error.message : undefined,
  });
});

export default router;
