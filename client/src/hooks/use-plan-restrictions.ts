
import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';

type PlanType = 'free' | 'basic' | 'pro' | 'enterprise';

interface PlanLimits {
  songsPerMonth: number;
  maxSongLength: number; // in minutes
  voiceCloning: boolean;
  textToSpeech: boolean;
  analytics: boolean;
  versionControl: boolean;
  collaboration: boolean;
  musicTheory: boolean;
  downloadQuality: 'standard' | 'high' | 'studio';
  concurrentGenerations: number;
}

const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    songsPerMonth: 3,
    maxSongLength: 1,
    voiceCloning: false,
    textToSpeech: false,
    analytics: false,
    versionControl: false,
    collaboration: false,
    musicTheory: false,
    downloadQuality: 'standard',
    concurrentGenerations: 1,
  },
  basic: {
    songsPerMonth: 15,
    maxSongLength: 1,
    voiceCloning: true,
    textToSpeech: true,
    analytics: false,
    versionControl: false,
    collaboration: false,
    musicTheory: false,
    downloadQuality: 'high',
    concurrentGenerations: 2,
  },
  pro: {
    songsPerMonth: 50,
    maxSongLength: 5,
    voiceCloning: true,
    textToSpeech: true,
    analytics: true,
    versionControl: true,
    collaboration: true,
    musicTheory: false,
    downloadQuality: 'studio',
    concurrentGenerations: 3,
  },
  enterprise: {
    songsPerMonth: 200,
    maxSongLength: 10,
    voiceCloning: true,
    textToSpeech: true,
    analytics: true,
    versionControl: true,
    collaboration: true,
    musicTheory: true,
    downloadQuality: 'studio',
    concurrentGenerations: 5,
  },
};

const PLAN_PRICES = {
  basic: 6.99,
  pro: 12.99,
  enterprise: 39.99,
};

export const usePlanRestrictions = () => {
  const { user } = useAuth();
  
  const currentPlan = useMemo(() => {
    if (!user) return 'free';
    return user.plan as PlanType;
  }, [user]);

  const limits = useMemo(() => {
    return PLAN_LIMITS[currentPlan];
  }, [currentPlan]);

  const canUseFeature = useMemo(() => ({
    voiceCloning: limits.voiceCloning,
    textToSpeech: limits.textToSpeech,
    analytics: limits.analytics,
    versionControl: limits.versionControl,
    collaboration: limits.collaboration,
    musicTheory: limits.musicTheory,
  }), [limits]);

  const canCreateSong = useMemo(() => {
    if (!user) return false;
    return user.songsThisMonth < limits.songsPerMonth;
  }, [user, limits]);

  const remainingSongs = useMemo(() => {
    if (!user) return 0;
    return Math.max(0, limits.songsPerMonth - user.songsThisMonth);
  }, [user, limits]);

  const getUpgradeRequirement = (feature: keyof typeof canUseFeature) => {
    if (canUseFeature[feature]) return null;
    
    // Find the minimum plan that supports this feature
    for (const [plan, planLimits] of Object.entries(PLAN_LIMITS)) {
      if (planLimits[feature] && plan !== 'free') {
        return {
          plan: plan as PlanType,
          price: PLAN_PRICES[plan as keyof typeof PLAN_PRICES],
        };
      }
    }
    return null;
  };

  const getFeatureRestrictionMessage = (feature: keyof typeof canUseFeature) => {
    const upgrade = getUpgradeRequirement(feature);
    if (!upgrade) return null;
    
    const featureNames = {
      voiceCloning: 'Voice Cloning',
      textToSpeech: 'Text-to-Speech',
      analytics: 'Analytics Dashboard',
      versionControl: 'Version Control',
      collaboration: 'Collaboration Tools',
      musicTheory: 'Music Theory Tools',
    };
    
    return `${featureNames[feature]} requires ${upgrade.plan.charAt(0).toUpperCase() + upgrade.plan.slice(1)} plan ($${upgrade.price}/month)`;
  };

  return {
    currentPlan,
    limits,
    canUseFeature,
    canCreateSong,
    remainingSongs,
    getUpgradeRequirement,
    getFeatureRestrictionMessage,
    planPrices: PLAN_PRICES,
  };
};
