
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
    basicEditing: boolean;
    songLibrary: boolean;
    audioPlayer: boolean;
    downloadOptions: boolean;
  };
  audioQuality: {
    mp3_128: boolean;
    mp3_320: boolean;
    wav: boolean;
    flac: boolean;
  };
  genres: string[];
  storage: {
    maxSongs: number;
    unlimited: boolean;
  };
  voiceCloning: {
    maxSamples: number;
    advanced: boolean;
  };
  pricing: {
    monthly: number;
    displayPrice: string;
  };
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    songsPerMonth: 2,
    maxSongLength: "5:30", // Full length songs
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
      basicEditing: false,
      songLibrary: false,
      audioPlayer: true, // Basic audio player included
      downloadOptions: false,
    },
    audioQuality: {
      mp3_128: true,
      mp3_320: false,
      wav: false,
      flac: false,
    },
    genres: ["Pop", "Rock", "Electronic"],
    storage: {
      maxSongs: 0, // No storage
      unlimited: false,
    },
    voiceCloning: {
      maxSamples: 0,
      advanced: false,
    },
    pricing: {
      monthly: 0,
      displayPrice: "Free",
    },
  },
  basic: {
    songsPerMonth: 4,
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
      advancedEditing: false,
      multipleVoiceSamples: false,
      commercialUse: false,
      prioritySupport: false,
      apiAccess: false,
      customIntegrations: false,
      basicEditing: true,
      songLibrary: true,
      audioPlayer: true,
      downloadOptions: false,
    },
    audioQuality: {
      mp3_128: true,
      mp3_320: true,
      wav: false,
      flac: false,
    },
    genres: ["Pop", "Rock", "Electronic", "Jazz", "Classical"],
    storage: {
      maxSongs: 5,
      unlimited: false,
    },
    voiceCloning: {
      maxSamples: 1,
      advanced: false,
    },
    pricing: {
      monthly: 6.99,
      displayPrice: "$6.99/month",
    },
  },
  pro: {
    songsPerMonth: -1, // Unlimited
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
      basicEditing: true,
      songLibrary: true,
      audioPlayer: true,
      downloadOptions: true,
    },
    audioQuality: {
      mp3_128: true,
      mp3_320: true,
      wav: true,
      flac: false,
    },
    genres: ["Pop", "Rock", "Electronic", "Jazz", "Classical", "Hip-Hop", "Country", "R&B"],
    storage: {
      maxSongs: 50,
      unlimited: false,
    },
    voiceCloning: {
      maxSamples: 5,
      advanced: true,
    },
    pricing: {
      monthly: 12.99,
      displayPrice: "$12.99/month",
    },
  },
  enterprise: {
    songsPerMonth: -1, // Unlimited
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
      basicEditing: true,
      songLibrary: true,
      audioPlayer: true,
      downloadOptions: true,
    },
    audioQuality: {
      mp3_128: true,
      mp3_320: true,
      wav: true,
      flac: true,
    },
    genres: ["Pop", "Rock", "Electronic", "Jazz", "Classical", "Hip-Hop", "Country", "R&B"],
    storage: {
      maxSongs: -1, // Unlimited
      unlimited: true,
    },
    voiceCloning: {
      maxSamples: -1, // Unlimited
      advanced: true,
    },
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

    // Check if unlimited (pro/enterprise)
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
    return planLimits?.maxSongLength || "5:30";
  }

  getStorageLimit(userPlan: string): { maxSongs: number; unlimited: boolean } {
    const planLimits = PLAN_LIMITS[userPlan];
    return planLimits?.storage || { maxSongs: 0, unlimited: false };
  }

  getVoiceCloningLimits(userPlan: string): { maxSamples: number; advanced: boolean } {
    const planLimits = PLAN_LIMITS[userPlan];
    return planLimits?.voiceCloning || { maxSamples: 0, advanced: false };
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
    if (requiredFeature === "voiceCloning" || requiredFeature === "textToSpeech" || requiredFeature === "basicEditing") {
      return "Basic features are available starting with Basic plan ($6.99/month) - includes voice cloning, text-to-speech, and editing tools";
    }
    if (requiredFeature === "analytics" || requiredFeature === "versionControl" || requiredFeature === "collaboration" || requiredFeature === "advancedEditing") {
      return "Advanced tools are available with Pro plan ($12.99/month) - includes unlimited songs, analytics, version control, and advanced editing";
    }
    if (requiredFeature === "realTimeCollaboration" || requiredFeature === "musicTheoryTools" || requiredFeature === "socialFeatures") {
      return "Professional features are available with Enterprise plan ($39.99/month) - includes real-time collaboration, music theory tools, and social features";
    }
    if (requiredFeature === "commercialUse" || requiredFeature === "prioritySupport" || requiredFeature === "apiAccess") {
      return "Business features are available with Enterprise plan ($39.99/month) - includes commercial use license, priority support, and API access";
    }

    return messages[currentPlan] || "Upgrade required for this feature";
  }
}

export const pricingService = new PricingService();
