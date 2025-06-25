
import { Request, Response, NextFunction } from 'express';
import { pricingService } from '../pricing-service';

export interface PlanRequirement {
  minPlan?: 'free' | 'basic' | 'pro' | 'enterprise';
  feature?: string;
  quotaType?: 'songsPerMonth' | 'storage' | 'duration';
}

export function checkPlanAccess(requirement: PlanRequirement) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      
      if (!user) {
        // Allow guest access for free tier features
        if (requirement.minPlan && requirement.minPlan !== 'free') {
          return res.status(401).json({ 
            error: "Authentication required",
            upgrade: pricingService.getUpgradeMessage('free', requirement.feature || 'authentication')
          });
        }
        return next();
      }

      const userPlan = user.plan || 'free';

      // Check minimum plan requirement
      if (requirement.minPlan) {
        const planHierarchy = ['free', 'basic', 'pro', 'enterprise'];
        const userPlanIndex = planHierarchy.indexOf(userPlan);
        const requiredPlanIndex = planHierarchy.indexOf(requirement.minPlan);

        if (userPlanIndex < requiredPlanIndex) {
          return res.status(403).json({
            error: "Plan upgrade required",
            currentPlan: userPlan,
            requiredPlan: requirement.minPlan,
            upgrade: pricingService.getUpgradeMessage(userPlan, requirement.feature || 'access')
          });
        }
      }

      // Check feature access
      if (requirement.feature) {
        const hasAccess = pricingService.hasFeatureAccess(userPlan, requirement.feature as any);
        if (!hasAccess) {
          return res.status(403).json({
            error: `Feature '${requirement.feature}' not available on ${userPlan} plan`,
            upgrade: pricingService.getUpgradeMessage(userPlan, requirement.feature)
          });
        }
      }

      // Check quota limits
      if (requirement.quotaType) {
        const usageCheck = await pricingService.checkUsageLimit(user.id);
        if (!usageCheck.canCreate) {
          return res.status(429).json({
            error: "Usage quota exceeded",
            details: usageCheck.reason,
            upgrade: pricingService.getUpgradeMessage(userPlan, 'quota')
          });
        }
      }

      next();
    } catch (error) {
      console.error('Plan enforcement error:', error);
      res.status(500).json({ error: "Failed to check plan access" });
    }
  };
}

import { Request, Response, NextFunction } from 'express';
import { pricingService } from '../pricing-service';
import { ErrorHandler } from '../utils/error-handler';

export function checkPlanQuota(minimumPlan: string = 'free') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      
      if (!user) {
        // Allow guest users for free tier
        if (minimumPlan === 'free') {
          return next();
        }
        return ErrorHandler.handleUnauthorized(res, 'Authentication required');
      }

      const usageCheck = await pricingService.checkUsageLimit(user.id.toString());
      
      if (!usageCheck.canCreate) {
        return res.status(429).json({
          error: 'Usage limit exceeded',
          details: usageCheck.reason,
          upgradeRequired: true,
          currentPlan: user.plan || 'free'
        });
      }

      next();
    } catch (error) {
      ErrorHandler.handleError(res, error, 'Failed to check plan quota');
    }
  };
}

export function requireFeature(feature: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const userPlan = user?.plan || 'free';
      
      const hasAccess = pricingService.hasFeatureAccess(userPlan, feature as any);
      
      if (!hasAccess) {
        const upgradeMessage = pricingService.getUpgradeMessage(userPlan, feature);
        return res.status(403).json({
          error: 'Feature not available',
          details: upgradeMessage,
          requiredFeature: feature,
          currentPlan: userPlan,
          upgradeRequired: true
        });
      }

      next();
    } catch (error) {
      ErrorHandler.handleError(res, error, 'Failed to check feature access');
    }
  };
}

export function requirePlan(minimumPlan: 'free' | 'basic' | 'pro' | 'enterprise') {
  const planHierarchy = { free: 0, basic: 1, pro: 2, enterprise: 3 };
  
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const userPlan = user?.plan || 'free';
      
      const userPlanLevel = planHierarchy[userPlan as keyof typeof planHierarchy] || 0;
      const requiredPlanLevel = planHierarchy[minimumPlan];
      
      if (userPlanLevel < requiredPlanLevel) {
        const upgradeMessage = pricingService.getUpgradeMessage(userPlan, minimumPlan);
        return res.status(403).json({
          error: 'Plan upgrade required',
          details: upgradeMessage,
          currentPlan: userPlan,
          requiredPlan: minimumPlan,
          upgradeRequired: true
        });
      }

      next();
    } catch (error) {
      ErrorHandler.handleError(res, error, 'Failed to check plan requirements');
    }
  };
}
