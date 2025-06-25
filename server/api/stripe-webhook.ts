
import { Request, Response } from 'express';
import { StripeService } from '../stripe-service';

export class StripeWebhookAPI {
  static async handleWebhook(req: Request, res: Response) {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const rawBody = req.body;

      if (!signature) {
        return res.status(400).json({ error: 'Missing stripe-signature header' });
      }

      const result = await StripeService.handleWebhook(rawBody, signature);
      res.json(result);
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).json({ error: 'Webhook signature verification failed' });
    }
  }
}
