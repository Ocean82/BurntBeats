import { Request, Response } from 'express';
import Stripe from 'stripe';
import { db } from '../db';
import { users, songs } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function handleStripeWebhookEnhanced(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }

  res.json({ received: true });
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);

  // Extract metadata
  const userId = paymentIntent.metadata.userId;
  const songId = paymentIntent.metadata.songId;
  const downloadFormat = paymentIntent.metadata.downloadFormat;

  if (userId && songId) {
    // Update user's download count
    await db.update(users)
      .set({ 
        downloads: db.select({ downloads: users.downloads }).from(users).where(eq(users.id, parseInt(userId))).then(result => (result[0]?.downloads || 0) + 1),
        lastDownloadAt: new Date()
      })
      .where(eq(users.id, parseInt(userId)));

    // Update song download count
    await db.update(songs)
      .set({ 
        downloadCount: db.select({ downloadCount: songs.downloadCount }).from(songs).where(eq(songs.id, parseInt(songId))).then(result => (result[0]?.downloadCount || 0) + 1)
      })
      .where(eq(songs.id, parseInt(songId)));
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment failed:', paymentIntent.id);

  // Log the failure for analytics
  const userId = paymentIntent.metadata.userId;
  if (userId) {
    console.log(`Payment failed for user ${userId}`);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Subscription created:', subscription.id);

  const customerId = subscription.customer as string;
  const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;

  if (customer.email) {
    const user = await db.select().from(users).where(eq(users.email, customer.email)).limit(1);
    if (user.length > 0) {
      await db.update(users)
        .set({ 
          plan: subscription.items.data[0].price.nickname || 'pro',
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: subscription.status
        })
        .where(eq(users.id, user[0].id));
    }
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id);

  await db.update(users)
    .set({ 
      plan: subscription.items.data[0].price.nickname || 'pro',
      subscriptionStatus: subscription.status
    })
    .where(eq(users.stripeSubscriptionId, subscription.id));
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id);

  await db.update(users)
    .set({ 
      plan: 'free',
      subscriptionStatus: 'canceled'
    })
    .where(eq(users.stripeSubscriptionId, subscription.id));
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Invoice payment succeeded:', invoice.id);

  // Update subscription status if needed
  if (invoice.subscription) {
    await db.update(users)
      .set({ subscriptionStatus: 'active' })
      .where(eq(users.stripeSubscriptionId, invoice.subscription as string));
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Invoice payment failed:', invoice.id);

  // Handle failed payment - maybe send notification
  if (invoice.subscription) {
    await db.update(users)
      .set({ subscriptionStatus: 'past_due' })
      .where(eq(users.stripeSubscriptionId, invoice.subscription as string));
  }
}