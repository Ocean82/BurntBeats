import { Router, Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import crypto from 'crypto';
import express from 'express';
import { env } from '../config/env';
import { WebhookEventLogger } from '../services/webhookLogger';
import { validateIpAddress } from '../middleware/ipFilter';
import { rateLimiter } from '../middleware/rateLimiter';
import { WebhookEventProcessor } from '../services/webhookProcessor';
import { requestTracer } from '../middleware/requestTracer';
import { validateApiVersion } from '../middleware/apiVersioning';

const router = Router();

// Configure Stripe with enhanced settings
const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-08-16',
  typescript: true,
  timeout: 10000,
  maxNetworkRetries: 2,
  telemetry: true,
});

// Initialize services with dependency injection
const webhookLogger = new WebhookEventLogger({
  logLevel: env.LOG_LEVEL,
  serviceName: 'stripe-webhook',
});

const eventProcessor = new WebhookEventProcessor({
  stripe,
  logger: webhookLogger,
  retryPolicy: {
    maxRetries: 3,
    delayMs: 1000,
  },
});

/**
 * Health check endpoint with comprehensive diagnostics
 */
router.get('/webhook/stripe',
  rateLimiter(10, '1 minute'),
  validateApiVersion('2023-08-16'),
  (req: Request, res: Response) => {
    const healthCheck = {
      status: "operational",
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        env: env.NODE_ENV,
      },
      service: {
        name: "Stripe Webhook Handler",
        version: env.APP_VERSION,
        stripeApiVersion: stripe.apiVersion,
        lastEventProcessed: webhookLogger.getLastEventTime(),
      },
      timestamp: new Date().toISOString(),
    };

    webhookLogger.logHealthCheck(healthCheck);
    res
      .set('X-Request-ID', req.id)
      .status(200)
      .json(healthCheck);
  }
);

/**
 * Webhook endpoint with comprehensive security and processing
 */
router.post('/webhook/stripe',
  express.raw({ type: 'application/json' }),
  requestTracer(),
  validateIpAddress(env.STRIPE_WHITELISTED_IPS),
  rateLimiter(5, '30 seconds'),
  validateApiVersion('2023-08-16'),
  async (req: Request, res: Response, next: NextFunction) => {
    const startTime = process.hrtime();

    try {
      const signature = req.headers['stripe-signature'];
      const payload = req.body;

      if (!signature) {
        webhookLogger.logSecurityEvent({
          type: 'missing_signature',
          ip: req.ip || 'unknown',
          requestId: req.id,
        });
        return res.status(403).json({ 
          error: 'Invalid request signature',
          docs: 'https://stripe.com/docs/webhooks/signatures',
        });
      }

      // Verify and parse the event with enhanced validation
      let event: Stripe.Event;

      if (env.STRIPE_WEBHOOK_SECRET) {
        event = stripe.webhooks.constructEvent(
          payload,
          signature,
          env.STRIPE_WEBHOOK_SECRET,
          300 // Tolerance window (5 minutes)
        );
      } else {
        // For development without webhook secret
        event = JSON.parse(payload.toString());
      }

      // Enhanced event logging with metadata
      webhookLogger.logIncomingEvent({
        event,
        metadata: {
          ip: req.ip || 'unknown',
          userAgent: req.headers['user-agent'],
          requestId: req.id,
        },
      });

      // Process event with retry capabilities
      await eventProcessor.processWithRetry(event);

      const [seconds, nanoseconds] = process.hrtime(startTime);
      const processingTime = `${seconds}.${nanoseconds.toString().padStart(9, '0')}`;

      res.status(200).json({
        status: 'processed',
        eventId: event.id,
        processingTime: `${processingTime}s`,
        timestamp: new Date().toISOString(),
        requestId: req.id,
      });

    } catch (err: any) {
      const errorId = crypto.randomUUID();
      const errorDetails = {
        errorId,
        error: err.message,
        stack: env.NODE_ENV === 'development' ? err.stack : undefined,
        requestId: req.id,
        timestamp: new Date().toISOString(),
      };

      webhookLogger.logError({
        error: err,
        context: {
          requestId: req.id,
          errorId,
          ip: req.ip || 'unknown',
        },
      });

      if (err instanceof Stripe.errors.StripeError) {
        return res.status(400).json({
          ...errorDetails,
          type: 'stripe_error',
          docs: 'https://stripe.com/docs/error-codes',
        });
      }

      next(err);
    }
  }
);

// Centralized error handling
router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const errorId = crypto.randomUUID();

  webhookLogger.logError({
    error: err,
    context: {
      requestId: req.id,
      errorId,
      ip: req.ip || 'unknown',
    },
  });

  res.status(500).json({
    error: 'Internal server error',
    errorId,
    requestId: req.id,
    timestamp: new Date().toISOString(),
    supportContact: env.SUPPORT_EMAIL,
  });
});

export default router;