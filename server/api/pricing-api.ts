// NEW PRICING - Pay per download by file size (USE THIS ONE)

import { Request, Response } from 'express';

// Pricing tiers based on file size - no monthly limits
const DOWNLOAD_PRICING_TIERS = [
  {
    id: 'bonus',
    name: '🧪 Bonus Track',
    description: 'Watermarked demo',
    price: 0.99,
    features: ['Demo quality', 'Contains watermark', 'Instant download']
  },
  {
    id: 'base', 
    name: '🔉 Base Song',
    description: 'Tracks under 9MB',
    price: 1.99,
    features: ['Under 9MB', 'No watermarks', 'High quality MP3']
  },
  {
    id: 'premium',
    name: '🎧 Premium Song', 
    description: 'Tracks 9MB-20MB',
    price: 4.99,
    features: ['9MB-20MB', 'Professional quality', 'Multiple formats']
  },
  {
    id: 'ultra',
    name: '💽 Ultra Song',
    description: 'Tracks over 20MB',
    price: 8.99,
    features: ['Over 20MB', 'Studio quality', 'All formats']
  },
  {
    id: 'license',
    name: '🪪 Full License',
    description: 'Complete ownership',
    price: 10.00,
    features: ['Full commercial rights', 'Resale allowed', 'No royalties']
  }
];

export class PricingAPI {
  // Get pay-per-download pricing tiers
  static async getPricingTiers(req: Request, res: Response) {
    try {
      res.json({
        model: 'pay-per-download',
        currency: 'USD',
        tiers: DOWNLOAD_PRICING_TIERS
      });
    } catch (error) {
      console.error('Error fetching pricing tiers:', error);
      res.status(500).json({ error: 'Failed to fetch pricing tiers' });
    }
  }

  // Calculate price based on file size
  static async calculatePrice(req: Request, res: Response) {
    try {
      const { fileSizeBytes } = req.body;
      
      if (!fileSizeBytes) {
        return res.status(400).json({ error: 'File size is required' });
      }

      const fileSizeMB = fileSizeBytes / (1024 * 1024);
      
      let recommendedTier;
      if (fileSizeMB < 9) {
        recommendedTier = DOWNLOAD_PRICING_TIERS.find(t => t.id === 'base');
      } else if (fileSizeMB <= 20) {
        recommendedTier = DOWNLOAD_PRICING_TIERS.find(t => t.id === 'premium');
      } else {
        recommendedTier = DOWNLOAD_PRICING_TIERS.find(t => t.id === 'ultra');
      }

      res.json({
        fileSizeMB: Math.round(fileSizeMB * 100) / 100,
        recommendedTier,
        allTiers: DOWNLOAD_PRICING_TIERS
      });
    } catch (error) {
      console.error('Price calculation error:', error);
      res.status(500).json({ error: 'Failed to calculate price' });
    }
  }

  // No usage limits - unlimited creation
  static async checkUsageLimit(req: Request, res: Response) {
    try {
      res.json({
        unlimited: true,
        canCreate: true,
        message: 'Unlimited song creation - pay only for downloads'
      });
    } catch (error) {
      console.error('Usage check error:', error);
      res.status(500).json({ error: 'Failed to check usage' });
    }
  }
}