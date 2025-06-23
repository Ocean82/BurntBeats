
import Stripe from 'stripe';
import { storage } from './storage';

// Initialize Stripe - use test key for development
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_...', {
  apiVersion: '2024-12-18.acacia',
});

export interface PaymentIntentData {
  amount: number;
  currency: string;
  customerId?: string;
  planType: string;
  userId: string;
}

export class StripeService {
  static async createPaymentIntent(data: PaymentIntentData) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: data.amount,
        currency: data.currency,
        customer: data.customerId,
        metadata: {
          planType: data.planType,
          userId: data.userId,
          appName: 'Burnt Beats'
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      };
    } catch (error) {
      console.error('Stripe payment intent creation failed:', error);
      throw error;
    }
  }

  static async createCustomer(email: string, name: string) {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          source: 'Burnt Beats'
        }
      });

      return customer;
    } catch (error) {
      console.error('Stripe customer creation failed:', error);
      throw error;
    }
  }

  static async createSubscription(customerId: string, priceId: string) {
    try {
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      return subscription;
    } catch (error) {
      console.error('Stripe subscription creation failed:', error);
      throw error;
    }
  }

  static async handleWebhook(rawBody: string, signature: string) {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!endpointSecret) {
      throw new Error('Stripe webhook secret not configured');
    }

    try {
      const event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
          break;
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      throw error;
    }
  }

  private static async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    const userId = paymentIntent.metadata.userId;
    const planType = paymentIntent.metadata.planType;

    if (userId && planType) {
      // Update user plan in database
      await storage.updateUser(userId, {
        plan: planType,
        updatedAt: new Date()
      });
    }
  }

  private static async handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;
    // Handle subscription updates
    console.log('Subscription updated:', subscription.id);
  }

  private static async handleSubscriptionCanceled(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;
    // Handle subscription cancellation
    console.log('Subscription canceled:', subscription.id);
  }
}
