
import { Request, Response } from 'express';
import { pricingService } from '../pricing-service';

export class PricingAPI {
  // Get pricing plans
  static async getPricingPlans(req: Request, res: Response) {
    try {
      const plans = pricingService.getPlans();
      res.json(plans);
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
      res.status(500).json({ error: 'Failed to fetch pricing plans' });
    }
  }

  // Check plan limitations
  static async checkPlanLimitations(req: Request, res: Response) {
    try {
      const { userId, planType } = req.body;

      if (!userId || !planType) {
        return res.status(400).json({ error: 'User ID and plan type are required' });
      }

      const limitations = pricingService.checkLimitations(planType, {
        songsGenerated: 0, // Would come from database
        storageUsed: 0
      });

      res.json(limitations);
    } catch (error) {
      console.error('Error checking plan limitations:', error);
      res.status(500).json({ error: 'Failed to check plan limitations' });
    }
  }

  // Upgrade plan
  static async upgradePlan(req: Request, res: Response) {
    try {
      const { userId, newPlan, paymentMethod } = req.body;

      if (!userId || !newPlan) {
        return res.status(400).json({ error: 'User ID and new plan are required' });
      }

      // Mock plan upgrade
      const upgrade = {
        success: true,
        userId,
        previousPlan: 'free',
        newPlan,
        effectiveDate: new Date(),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        paymentMethod
      };

      console.log(`✅ Plan upgraded: ${userId} -> ${newPlan}`);
      res.json(upgrade);

    } catch (error) {
      console.error('Plan upgrade error:', error);
      res.status(500).json({ 
        error: 'Failed to upgrade plan', 
        details: error.message 
      });
    }
  }

  // Get user subscription
  static async getUserSubscription(req: Request, res: Response) {
    try {
      const userId = req.params.userId;

      // Mock subscription data
      const subscription = {
        userId: parseInt(userId),
        plan: 'free',
        status: 'active',
        billingCycle: 'monthly',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        features: {
          songsPerMonth: 3,
          maxSongLength: 30,
          voiceCloning: false,
          advancedEditing: false,
          collaboration: false,
          analytics: false,
          versionControl: false,
          socialFeatures: false,
          prioritySupport: false,
          customization: false
        },
        usage: {
          songsGenerated: 0,
          storageUsed: 0
        }
      };

      res.json(subscription);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      res.status(500).json({ error: 'Failed to fetch subscription' });
    }
  }
}
