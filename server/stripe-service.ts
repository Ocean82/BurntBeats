
import Stripe from 'stripe';
import { storage } from './storage';

// Initialize Stripe - use test key for development
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia' as any,
});

export interface PaymentIntentData {
  amount: number;
  currency: string;
  customerId?: string;
  planType?: string;
  userId: string;
  songId?: string;
  tier?: 'bonus' | 'base' | 'top';
  songTitle?: string;
}

export class StripeService {
  static async createPaymentIntent(data: PaymentIntentData) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: data.amount,
        currency: data.currency,
        customer: data.customerId,
        metadata: {
          planType: data.planType || '',
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
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
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
    const songId = paymentIntent.metadata.songId;
    const tier = paymentIntent.metadata.tier;

    if (userId && planType) {
      // Update user plan in database for subscription payments
      await storage.updateUser(userId, {
        plan: planType,
        updatedAt: new Date()
      });
    }

    if (userId && songId && tier) {
      // Handle song purchase - generate download file
      console.log(`🎵 Song purchase completed: ${songId} - ${tier} tier for user ${userId}`);
      // Here you would trigger file generation for the purchased tier
    }
  }

  private static async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const { client_reference_id, customer_email, amount_total, currency } = session;
    
    if (client_reference_id) {
      // Parse client reference ID: songId_tier_songTitle
      const [songId, tier, ...titleParts] = client_reference_id.split('_');
      const songTitle = titleParts.join('_').replace(/_/g, ' ');
      
      console.log(`🎵 PURCHASE COMPLETED: ${songTitle}`);
      console.log(`💰 Amount: ${amount_total ? amount_total / 100 : 0} ${currency?.toUpperCase()}`);
      console.log(`🎶 Tier: ${tier} | Song ID: ${songId}`);
      console.log(`📧 Customer: ${customer_email}`);
      console.log(`🕒 Timestamp: ${new Date().toISOString()}`);
      console.log(`🔗 Session ID: ${session.id}`);
      
      try {
        // Link purchase to license acknowledgment
        const { db } = await import('./db');
        const { licenseAcknowledgments } = await import('./models/LicenseAcknowledgment');
        const { eq, and } = await import('drizzle-orm');

        // Update existing acknowledgment with purchase ID or create new one
        const existing = await db
          .select()
          .from(licenseAcknowledgments)
          .where(
            and(
              eq(licenseAcknowledgments.userId, songId),
              eq(licenseAcknowledgments.trackId, songId)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          // Update existing acknowledgment with purchase ID
          await db
            .update(licenseAcknowledgments)
            .set({ purchaseId: session.id })
            .where(eq(licenseAcknowledgments.id, existing[0].id));
          
          console.log(`📄 License acknowledgment linked to purchase: ${session.id}`);
        } else {
          // Create new acknowledgment for completed purchase
          await db
            .insert(licenseAcknowledgments)
            .values({
              userId: songId,
              trackId: songId,
              acceptedAt: new Date(),
              purchaseId: session.id
            });
          
          console.log(`📄 New license acknowledgment created for purchase: ${session.id}`);
        }

        // Generate license and file
        const { pricingService } = await import('./pricing-service');
        const license = await pricingService.generateCommercialLicense({
          songTitle,
          userId: songId,
          tier: tier as 'base' | 'top',
          userEmail: customer_email || 'customer@burntbeats.app',
          format: 'both'
        });
        
        console.log(`📄 License generated: ${license.licenseId}`);
        console.log(`📁 Files: ${license.textPath}, ${license.pdfPath}`);
        
        // Log successful delivery
        console.log(`✅ Purchase processing completed successfully`);
        
      } catch (error) {
        console.error(`❌ License processing error:`, error);
      }
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
