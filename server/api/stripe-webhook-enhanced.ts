
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { db } from '../db';
import { licenseAcknowledgments } from '../db/schema';
import { eq, and } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export class StripeWebhookEnhanced {
  static async handleWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err: any) {
      console.error('⚠️ Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        console.log(`🔔 Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  }

  private static async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    try {
      console.log('🎉 Checkout completed:', session.id);

      // Extract metadata from session
      const { userId, trackId } = session.metadata || {};
      
      if (!userId || !trackId) {
        console.warn('⚠️ Missing userId or trackId in session metadata');
        return;
      export async function handleStripeWebhook(req: Request, res: Response) {
  try {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    let event: Stripe.Event;

    if (webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: any) {
        console.error('❌ Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
    } else {
      event = JSON.parse(req.body.toString());
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'payment_intent.succeeded':
        console.log('✅ Payment succeeded:', event.data.object.id);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    const { userId, trackId } = session.metadata || {};
    
    if (!userId || !trackId) {
      console.warn('⚠️ Missing metadata in checkout session');
      return;
    }

    // Check if license acknowledgment exists
    const existingAck = await db
      .select()
      .from(licenseAcknowledgments)
      .where(
        and(
          eq(licenseAcknowledgments.userId, userId),
          eq(licenseAcknowledgments.trackId, trackId)
        )
      )
      .limit(1);

    if (existingAck.length > 0) {
      // Update existing acknowledgment with purchase ID
      await db
        .update(licenseAcknowledgments)
        .set({ 
          purchaseId: session.id,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(licenseAcknowledgments.userId, userId),
            eq(licenseAcknowledgments.trackId, trackId)
          )
        );

      console.log('✅ Linked purchase to existing license acknowledgment');
    } else {
      // Create new acknowledgment with purchase info
      await db
        .insert(licenseAcknowledgments)
        .values({
          userId,
          trackId,
          acceptedAt: new Date(),
          purchaseId: session.id
        });

      console.log('✅ Created new license acknowledgment with purchase');
    }

    // TODO: Unlock track for download, send receipt email, etc.
    
  } catch (error) {
    console.error('❌ Error handling checkout completed:', error);
  }
}', error);
    }
  }

  private static async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    try {
      console.log('💰 Payment succeeded:', paymentIntent.id);
      
      // Extract metadata if needed
      const { userId, trackId } = paymentIntent.metadata || {};
      
      if (userId && trackId) {
        // Additional processing if needed
        console.log(`✅ Payment confirmed for user ${userId}, track ${trackId}`);
      }
      
    } catch (error) {
      console.error('❌ Error handling payment succeeded:', error);
    }
  }
}
