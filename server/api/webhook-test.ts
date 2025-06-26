import { Router, Request, Response } from 'express';

const router = Router();

// GET endpoint for webhook verification
router.get('/webhook/stripe', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: "webhook_endpoint_active",
    message: "Stripe webhook endpoint is responsive",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// POST endpoint for webhook testing
router.post('/webhook/stripe', (req: Request, res: Response) => {
  console.log('Webhook test received:', {
    headers: req.headers,
    hasSignature: !!req.headers['stripe-signature'],
    timestamp: new Date().toISOString()
  });
  
  res.status(200).json({ 
    received: true, 
    timestamp: new Date().toISOString(),
    message: "Webhook test successful"
  });
});

export default router;