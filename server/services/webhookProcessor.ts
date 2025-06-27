
import Stripe from 'stripe';
import { WebhookEventLogger } from './webhookLogger';
import { EventQueue } from '../queues/eventQueue';
import { RetryPolicy } from '../types';

interface WebhookEventProcessorConfig {
  stripe: Stripe;
  logger: WebhookEventLogger;
  retryPolicy: RetryPolicy;
}

export class WebhookEventProcessor {
  private stripe: Stripe;
  private logger: WebhookEventLogger;
  private queue: EventQueue;
  private retryPolicy: RetryPolicy;

  constructor(config: WebhookEventProcessorConfig) {
    this.stripe = config.stripe;
    this.logger = config.logger;
    this.retryPolicy = config.retryPolicy;
    this.queue = new EventQueue({
      concurrency: 5,
      logger: this.logger,
    });
  }

  async processWithRetry(event: Stripe.Event): Promise<void> {
    try {
      await this.queue.add(async () => {
        await this.processEventWithRetryLogic(event);
      });
    } catch (error) {
      this.logger.logError({
        error: error as Error,
        context: {
          eventId: event.id,
          type: 'queue_error',
        },
      });
      throw error;
    }
  }

  private async processEventWithRetryLogic(
    event: Stripe.Event,
    attempt = 1
  ): Promise<void> {
    try {
      await this.processEvent(event);
    } catch (error) {
      if (attempt >= this.retryPolicy.maxRetries) {
        throw error;
      }

      const delay = this.retryPolicy.delayMs * attempt;
      this.logger.logRetryAttempt({
        eventId: event.id,
        attempt,
        maxAttempts: this.retryPolicy.maxRetries,
        delay,
        error: error as Error,
      });

      await new Promise(resolve => setTimeout(resolve, delay));
      return this.processEventWithRetryLogic(event, attempt + 1);
    }
  }

  private async processEvent(event: Stripe.Event): Promise<void> {
    try {
      this.logger.logProcessingStart(event.id);

      // Handle different Stripe webhook events
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event);
          break;
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event);
          break;
        case 'charge.refunded':
          await this.handleChargeRefunded(event);
          break;
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCanceled(event);
          break;
        default:
          this.logger.logUnhandledEvent(event);
      }

      this.logger.logProcessingComplete(event.id);
    } catch (error) {
      this.logger.logProcessingError({
        eventId: event.id,
        error: error as Error,
      });
      throw error;
    }
  }

  private async handleCheckoutCompleted(event: Stripe.Event): Promise<void> {
    const session = event.data.object as Stripe.Checkout.Session;
    const clientReferenceId = session.client_reference_id;

    if (clientReferenceId) {
      // Parse the client reference ID to get purchase details
      const [songId, tier, songTitle] = clientReferenceId.split('_');
      
      console.log(`Payment completed for song ${songId}, tier ${tier}`);
      console.log(`Customer email: ${session.customer_details?.email}`);
      
      // Store purchase record in database (implement based on your storage system)
      // await this.storePurchaseRecord({...});
    }
  }

  private async handlePaymentIntentSucceeded(event: Stripe.Event): Promise<void> {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    console.log('Payment intent succeeded:', paymentIntent.id);
    // Add your business logic here
  }

  private async handlePaymentIntentFailed(event: Stripe.Event): Promise<void> {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    console.log('Payment intent failed:', paymentIntent.id);
    // Add your business logic here
  }

  private async handleChargeRefunded(event: Stripe.Event): Promise<void> {
    const charge = event.data.object as Stripe.Charge;
    console.log('Charge refunded:', charge.id);
    // Add your business logic here
  }

  private async handleSubscriptionUpdate(event: Stripe.Event): Promise<void> {
    const subscription = event.data.object as Stripe.Subscription;
    console.log('Subscription updated:', subscription.id);
    // Add your business logic here
  }

  private async handleSubscriptionCanceled(event: Stripe.Event): Promise<void> {
    const subscription = event.data.object as Stripe.Subscription;
    console.log('Subscription canceled:', subscription.id);
    // Add your business logic here
  }
}
