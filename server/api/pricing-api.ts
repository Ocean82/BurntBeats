import { Request, Response } from 'express';
import { pricingService } from '../pricing-service';

export class PricingAPI {
  // Check if user can create new song
  static async checkUsageLimit(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const result = await pricingService.checkUsageLimit(userId);
      res.json(result);
    } catch (error) {
      console.error('Usage limit check error:', error);
      res.status(500).json({ error: 'Failed to check usage limit' });
    }
  }

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

  // Verify license
  static async verifyLicense(req: Request, res: Response) {
    try {
      const { licenseId } = req.params;

      if (!licenseId) {
        return res.status(400).json({ error: 'License ID is required' });
      }

      const isValid = await pricingService.verifyLicense(licenseId);
      
      if (!isValid) {
        return res.status(404).json({ error: 'License not found or invalid' });
      }

      res.json({ 
        valid: true, 
        licenseId,
        message: 'License is valid and active'
      });

    } catch (error) {
      console.error('License verification error:', error);
      res.status(500).json({ error: 'Failed to verify license' });
    }
  }

  // Generate commercial license
  static async generateLicense(req: Request, res: Response) {
    try {
      const { songTitle, userId, tier, userEmail, format } = req.body;

      if (!songTitle || !userId || !tier) {
        return res.status(400).json({ 
          error: 'Song title, user ID, and tier are required' 
        });
      }

      const license = await pricingService.generateCommercialLicense({
        songTitle,
        userId,
        tier,
        userEmail,
        format
      });

      res.json({
        success: true,
        licenseId: license.licenseId,
        textPath: license.textPath,
        pdfPath: license.pdfPath,
        message: 'Commercial license generated successfully'
      });

    } catch (error) {
      console.error('License generation error:', error);
      res.status(500).json({ error: 'Failed to generate license' });
    }
  }
}