import { Router, Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { env } from '../config/env';
import { WebhookEventLogger } from '../services/webhookLogger';
import { validateIpAddress } from '../middleware/ipFilter';
import { rateLimiter } from '../middleware/rateLimiter';
import { WebhookEventProcessor } from '../services/webhookProcessor';

const router = Router();

// Stripe configuration with TypeScript
const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-08-16',
  typescript: true,
  timeout: 10000, // 10s timeout
});

// Initialize services
const webhookLogger = new WebhookEventLogger();
const eventProcessor = new WebhookEventProcessor();

/**
 * Health check endpoint for webhook verification
 */
router.get('/webhook/stripe', 
  rateLimiter(10, '1 minute'), // 10 requests per minute
  (req: Request, res: Response) => {
    const healthCheck = {
      status: "operational",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      apiVersion: stripe.apiVersion,
      memoryUsage: process.memoryUsage(),
    };

    webhookLogger.logHealthCheck(healthCheck);
    res.status(200).json(healthCheck);
  }
);

/**
 * Stripe webhook endpoint with security middleware
 */
router.post('/webhook/stripe',
  express.raw({ type: 'application/json' }), // Raw body for signature verification
  validateIpAddress(env.STRIPE_WHITELISTED_IPS), // IP filtering
  rateLimiter(5, '30 seconds'), // 5 requests per 30 seconds
  async (req: Request, res: Response, next: NextFunction) => {
    const startTime = process.hrtime();

    try {
      const signature = req.headers['stripe-signature'];
      const payload = req.body;

      if (!signature) {
        webhookLogger.logSecurityEvent('missing_signature', req.ip);
        return res.status(403).json({ 
          error: 'Invalid request signature' 
        });
      }

      // Verify and parse the event
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );

      // Log reception
      webhookLogger.logIncomingEvent(event);

      // Process event asynchronously to avoid timeout
      eventProcessor.queueEvent(event);

      // Immediate response to Stripe
      const responseTime = process.hrtime(startTime);
      res.status(200).json({
        status: 'processed',
        eventId: event.id,
        processingTime: `${responseTime[0]}.${responseTime[1]}s`,
        queuedAt: new Date().toISOString()
      });

    } catch (err: any) {
      const errorId = crypto.randomUUID();

      if (err instanceof Stripe.errors.StripeError) {
        webhookLogger.logError(errorId, err, req);
        return res.status(400).json({
          error: 'Invalid webhook signature',
          errorId,
          docs: 'https://stripe.com/docs/webhooks'
        });
      }

      webhookLogger.logError(errorId, err, req);
      next(err);
    }
  }
);

// Error handling middleware
router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  webhookLogger.logError('server_error', err, req);
  res.status(500).json({
    error: 'Internal server error',
    referenceId: req.id,
    timestamp: new Date().toISOString()
  });
});

export default router;
