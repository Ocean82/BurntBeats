
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

export const checkPlanQuota = (minPlan: 'free' | 'basic' | 'pro' | 'enterprise') => 
  checkPlanAccess({ minPlan, quotaType: 'songsPerMonth' });

export const requireFeature = (feature: string) => 
  checkPlanAccess({ feature });

export const requirePlan = (minPlan: 'free' | 'basic' | 'pro' | 'enterprise') => 
  checkPlanAccess({ minPlan });
