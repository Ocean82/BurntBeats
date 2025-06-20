import { storage } from "./storage";
import type { User } from "@shared/schema";

export interface PlanLimits {
  songsPerMonth: number;
  maxSongLength: string;
  features: {
    voiceCloning: boolean;
    textToSpeech: boolean;
    analytics: boolean;
    versionControl: boolean;
    collaboration: boolean;
    realTimeCollaboration: boolean;
    musicTheoryTools: boolean;
    socialFeatures: boolean;
    advancedEditing: boolean;
    multipleVoiceSamples: boolean;
    commercialUse: boolean;
    prioritySupport: boolean;
    apiAccess: boolean;
    customIntegrations: boolean;
  };
  audioQuality: {
    mp3_128: boolean;
    mp3_320: boolean;
    wav: boolean;
    flac: boolean;
  };
  genres: string[];
  pricing: {
    monthly: number;
    displayPrice: string;
  };
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    songsPerMonth: 3,
    maxSongLength: "0:30",
    features: {
      voiceCloning: false,
      textToSpeech: false,
      analytics: false,
      versionControl: false,
      collaboration: false,
      realTimeCollaboration: false,
      musicTheoryTools: false,
      socialFeatures: false,
      advancedEditing: false,
      multipleVoiceSamples: false,
      commercialUse: false,
      prioritySupport: false,
      apiAccess: false,
      customIntegrations: false,
    },
    audioQuality: {
      mp3_128: true,
      mp3_320: false,
      wav: false,
      flac: false,
    },
    genres: ["Pop", "Rock", "Electronic"],
    pricing: {
      monthly: 0,
      displayPrice: "Free",
    },
  },
  basic: {
    songsPerMonth: 3,
    maxSongLength: "5:30",
    features: {
      voiceCloning: true,
      textToSpeech: true,
      analytics: false,
      versionControl: false,
      collaboration: false,
      realTimeCollaboration: false,
      musicTheoryTools: false,
      socialFeatures: false,
      advancedEditing: true,
      multipleVoiceSamples: false,
      commercialUse: false,
      prioritySupport: false,
      apiAccess: false,
      customIntegrations: false,
    },
    audioQuality: {
      mp3_128: true,
      mp3_320: true,
      wav: false,
      flac: false,
    },
    genres: ["Pop", "Rock", "Electronic", "Jazz", "Classical"],
    pricing: {
      monthly: 6.99,
      displayPrice: "$6.99/month",
    },
  },
  pro: {
    songsPerMonth: 50,
    maxSongLength: "5:30",
    features: {
      voiceCloning: true,
      textToSpeech: true,
      analytics: true,
      versionControl: true,
      collaboration: true,
      realTimeCollaboration: false,
      musicTheoryTools: false,
      socialFeatures: false,
      advancedEditing: true,
      multipleVoiceSamples: true,
      commercialUse: false,
      prioritySupport: false,
      apiAccess: false,
      customIntegrations: false,
    },
    audioQuality: {
      mp3_128: true,
      mp3_320: true,
      wav: true,
      flac: false,
    },
    genres: ["Pop", "Rock", "Electronic", "Jazz", "Classical", "Hip-Hop", "Country", "R&B"],
    pricing: {
      monthly: 12.99,
      displayPrice: "$12.99/month",
    },
  },
  enterprise: {
    songsPerMonth: -1, // unlimited
    maxSongLength: "5:30",
    features: {
      voiceCloning: true,
      textToSpeech: true,
      analytics: true,
      versionControl: true,
      collaboration: true,
      realTimeCollaboration: true,
      musicTheoryTools: true,
      socialFeatures: true,
      advancedEditing: true,
      multipleVoiceSamples: true,
      commercialUse: true,
      prioritySupport: true,
      apiAccess: true,
      customIntegrations: true,
    },
    audioQuality: {
      mp3_128: true,
      mp3_320: true,
      wav: true,
      flac: true,
    },
    genres: ["Pop", "Rock", "Electronic", "Jazz", "Classical", "Hip-Hop", "Country", "R&B"],
    pricing: {
      monthly: 39.99,
      displayPrice: "$39.99/month",
    },
  },
};

export class PricingService {
  async checkUsageLimit(userId: number): Promise<{ canCreate: boolean; reason?: string }> {
    const user = await storage.getUser(userId);
    if (!user) {
      return { canCreate: false, reason: "User not found" };
    }

    const planLimits = PLAN_LIMITS[user.plan];
    if (!planLimits) {
      return { canCreate: false, reason: "Invalid plan" };
    }

    // Reset monthly usage if it's a new month
    await this.resetMonthlyUsageIfNeeded(user);

    // Check if unlimited (enterprise)
    if (planLimits.songsPerMonth === -1) {
      return { canCreate: true };
    }

    // Check monthly limit
    if ((user.songsThisMonth || 0) >= planLimits.songsPerMonth) {
      return { 
        canCreate: false, 
        reason: `Monthly limit reached (${planLimits.songsPerMonth} songs per month on ${user.plan} plan)` 
      };
    }

    return { canCreate: true };
  }

  async incrementUsage(userId: number): Promise<void> {
    const user = await storage.getUser(userId);
    if (!user) return;

    await storage.updateUser(userId, {
      songsThisMonth: (user.songsThisMonth || 0) + 1,
    });
  }

  async resetMonthlyUsageIfNeeded(user: User): Promise<void> {
    const now = new Date();
    const lastReset = user.lastUsageReset ? new Date(user.lastUsageReset) : new Date(0);
    
    // Check if it's a new month
    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
      await storage.updateUser(user.id, {
        songsThisMonth: 0,
        lastUsageReset: now,
      });
    }
  }

  hasFeatureAccess(userPlan: string, feature: keyof PlanLimits['features']): boolean {
    const planLimits = PLAN_LIMITS[userPlan];
    return planLimits?.features[feature] || false;
  }

  getAvailableGenres(userPlan: string): string[] {
    const planLimits = PLAN_LIMITS[userPlan];
    return planLimits?.genres || [];
  }

  getMaxSongLength(userPlan: string): string {
    const planLimits = PLAN_LIMITS[userPlan];
    return planLimits?.maxSongLength || "0:30";
  }

  getAudioQualityOptions(userPlan: string): string[] {
    const planLimits = PLAN_LIMITS[userPlan];
    if (!planLimits) return ["mp3_128"];

    const options: string[] = [];
    if (planLimits.audioQuality.mp3_128) options.push("MP3 128kbps");
    if (planLimits.audioQuality.mp3_320) options.push("MP3 320kbps");
    if (planLimits.audioQuality.wav) options.push("WAV");
    if (planLimits.audioQuality.flac) options.push("FLAC");

    return options;
  }

  getPlanLimits(userPlan: string): PlanLimits | null {
    return PLAN_LIMITS[userPlan] || null;
  }

  getUpgradeMessage(currentPlan: string, requiredFeature: string): string {
    const messages: Record<string, string> = {
      free: "This feature is available starting with Basic plan ($6.99/month)",
      basic: "This feature is available with Pro plan ($12.99/month)",
      pro: "This feature is available with Enterprise plan ($39.99/month)",
    };

    // Special cases for specific features
    if (requiredFeature === "voiceCloning" || requiredFeature === "textToSpeech") {
      return "Voice features are available starting with Basic plan ($6.99/month)";
    }
    if (requiredFeature === "analytics" || requiredFeature === "versionControl" || requiredFeature === "collaboration") {
      return "Advanced tools are available with Pro plan ($12.99/month)";
    }
    if (requiredFeature === "realTimeCollaboration" || requiredFeature === "musicTheoryTools" || requiredFeature === "socialFeatures") {
      return "Professional features are available with Enterprise plan ($39.99/month)";
    }

    return messages[currentPlan] || "Upgrade required for this feature";
  }
}

export const pricingService = new PricingService();