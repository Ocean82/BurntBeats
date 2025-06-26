import { useMemo } from 'react';
import { useAuth } from './use-auth';

type PlanType = 'free' | 'basic' | 'pro' | 'enterprise';

interface CreationLimits {
  canCreateSongs: boolean;
  requiresPayment: boolean;
  maxSongLength: number; // in minutes
  downloadQuality: 'demo' | 'standard' | 'high' | 'studio';
  hasWatermark: boolean;
}

const DEFAULT_LIMITS: CreationLimits = {
  canCreateSongs: true, // Everyone can create songs
  requiresPayment: true, // Payment required for downloads
  maxSongLength: 10, // Generous song length for all users
  downloadQuality: 'demo',
  hasWatermark: true,
};

export const usePlanRestrictions = () => {
  const { user } = useAuth();

  const currentPlan = useMemo(() => {
    if (!user) return 'free';
    return user.plan as PlanType;
  }, [user]);

  const limits = useMemo(() => {
    return DEFAULT_LIMITS;
  }, []);

  // Everyone can use all features - payment is per download
  const canUseFeature = useMemo(() => ({
    voiceCloning: true,
    textToSpeech: true,
    analytics: true,
    versionControl: true,
    collaboration: true,
    musicTheory: true,
  }), []);

  // Everyone can create songs - no monthly limits
  const canCreateSong = useMemo(() => {
    return true;
  }, []);

  const remainingSongs = useMemo(() => {
    return Infinity; // No limits on song creation
  }, []);

  const getUpgradeMessage = useMemo(() => (feature: string) => {
    return `Pay per song - no subscriptions required! Generate unlimited songs and pay only for downloads.`;
  }, []);

  const getPurchaseOptions = useMemo(() => () => {
    return [
      { tier: 'bonus', price: 0.99, quality: 'demo', hasWatermark: true },
      { tier: 'base', price: 1.99, quality: 'standard', hasWatermark: false },
      { tier: 'premium', price: 4.99, quality: 'high', hasWatermark: false },
      { tier: 'ultra', price: 8.99, quality: 'studio', hasWatermark: false },
      { tier: 'full_license', price: 10.00, quality: 'studio', hasWatermark: false, fullRights: true },
    ];
  }, []);

  return {
    currentPlan,
    limits,
    canUseFeature,
    canCreateSong,
    remainingSongs,
    getUpgradeMessage,
    getPurchaseOptions,
  };
};