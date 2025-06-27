
import Stripe from 'stripe';
import { Logger } from '../utils/logger';

interface WebhookEventLoggerConfig {
  logLevel: string;
  serviceName: string;
}

export class WebhookEventLogger {
  private logger: Logger;
  private lastEventTime: Date | null = null;

  constructor(config: WebhookEventLoggerConfig) {
    this.logger = new Logger({
      name: config.serviceName,
      level: config.logLevel,
    });
  }

  logIncomingEvent(params: {
    event: Stripe.Event;
    metadata: {
      ip: string;
      userAgent: string | undefined;
      requestId: string;
    };
  }): void {
    this.lastEventTime = new Date();
    this.logger.info('Incoming webhook event', {
      eventId: params.event.id,
      type: params.event.type,
      livemode: params.event.livemode,
      ip: params.metadata.ip,
      userAgent: params.metadata.userAgent,
      requestId: params.metadata.requestId,
    });
  }

  logHealthCheck(data: any): void {
    this.logger.info('Health check performed', data);
  }

  logSecurityEvent(params: {
    type: string;
    ip: string;
    requestId: string;
  }): void {
    this.logger.warn('Security event detected', {
      eventType: params.type,
      ip: params.ip,
      requestId: params.requestId,
      severity: 'high',
    });
  }

  logError(params: {
    error: Error;
    context: {
      requestId?: string;
      errorId?: string;
      ip?: string;
      eventId?: string;
    };
  }): void {
    this.logger.error('Error occurred', {
      error: params.error.message,
      stack: params.error.stack,
      ...params.context,
    });
  }

  logProcessingStart(eventId: string): void {
    this.logger.debug('Event processing started', { eventId });
  }

  logProcessingComplete(eventId: string): void {
    this.logger.debug('Event processing completed', { eventId });
  }

  logProcessingError(params: { eventId: string; error: Error }): void {
    this.logger.error('Event processing failed', {
      eventId: params.eventId,
      error: params.error.message,
    });
  }

  logUnhandledEvent(event: Stripe.Event): void {
    this.logger.warn('Unhandled event type received', {
      eventId: event.id,
      type: event.type,
    });
  }

  logRetryAttempt(params: {
    eventId: string;
    attempt: number;
    maxAttempts: number;
    delay: number;
    error: Error;
  }): void {
    this.logger.warn('Retrying event processing', {
      eventId: params.eventId,
      attempt: params.attempt,
      maxAttempts: params.maxAttempts,
      nextRetryMs: params.delay,
      lastError: params.error.message,
    });
  }

  getLastEventTime(): string | null {
    return this.lastEventTime?.toISOString() ?? null;
  }
}
