//old pricing - dont use

import { storage } from "./storage";
import type { User } from "@shared/schema";
import { generateLicense, generatePDFLicense } from "./utils/license-generator";
import { generatePDFLicense as createPDFLicense } from "./utils/pdf-license-generator";

export interface PlanLimits {
  songsPerMonth: number;
  maxSongLength: string;
  storage: number; // number of songs that can be stored
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
    neuralSynthesis: boolean;
    multilingualTTS: boolean;
    realTimePreview: boolean;
    professionalVocoding: boolean;
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
    songsPerMonth: 2,
    maxSongLength: "5:30", // Full length songs for free plan
    storage: 0, // 25 MB storage for free plan (2 songs)
    features: {
      voiceCloning: true,
      textToSpeech: true,
      analytics: true,
      versionControl: true,
      collaboration: false,
      realTimeCollaboration: true,
      musicTheoryTools: true,
      socialFeatures: true,
      advancedEditing: true,
      multipleVoiceSamples: true,
      commercialUse: true,
      prioritySupport: true,
      apiAccess: true,
      customIntegrations: true,
      neuralSynthesis: false,
      multilingualTTS: false,
      realTimePreview: false,
      professionalVocoding: false,
    },
    audioQuality: {
      mp3_128: true,
      mp3_320: true,
      wav: true,
      flac: true,
    },
    genres: ["Pop", "Rock", "Electronic"],
    pricing: {
      monthly: 0,
      displayPrice: "Free",
    },
  },
  basic: {
    songsPerMonth: 4,
    maxSongLength: "5:30",
    storage: 5, // 5 songs storage
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
      neuralSynthesis: false,
      multilingualTTS: false,
      realTimePreview: false,
      professionalVocoding: false,
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
    songsPerMonth: -1, // Unlimited
    maxSongLength: "5:30",
    storage: 50, // 50 songs storage
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
      neuralSynthesis: true,
      multilingualTTS: false,
      realTimePreview: false,
      professionalVocoding: false,
    },
    audioQuality: {
      mp3_128: true,
      mp3_320: true,
      wav: true,
      flac: false,
    },
    genres: [
      "Pop",
      "Rock",
      "Electronic",
      "Jazz",
      "Classical",
      "Hip-Hop",
      "Country",
      "R&B",
    ],
    pricing: {
      monthly: 12.99,
      displayPrice: "$12.99/month",
    },
  },
  enterprise: {
    songsPerMonth: -1, // unlimited
    maxSongLength: "5:30",
    storage: -1, // Unlimited storage
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
      neuralSynthesis: true,
      multilingualTTS: true,
      realTimePreview: true,
      professionalVocoding: true,
    },
    audioQuality: {
      mp3_128: true,
      mp3_320: true,
      wav: true,
      flac: true,
    },
    genres: [
      "Pop",
      "Rock",
      "Electronic",
      "Jazz",
      "Classical",
      "Hip-Hop",
      "Country",
      "R&B",
    ],
    pricing: {
      monthly: 39.99,
      displayPrice: "$39.99/month",
    },
  },
};

export class PricingService {
  async checkUsageLimit(
    userId: string,
  ): Promise<{ canCreate: boolean; reason?: string }> {
    const user = await storage.getUser(userId);
    if (!user) {
      return { canCreate: false, reason: "User not found" };
    }

    const planLimits =
      PLAN_LIMITS[(user.plan as keyof typeof PLAN_LIMITS) || "free"];
    if (!planLimits) {
      return { canCreate: false, reason: "Invalid plan" };
    }

    // Reset monthly usage if it's a new month
    await this.resetMonthlyUsageIfNeeded(user);

    // Check if unlimited (pro and enterprise)
    if (planLimits.songsPerMonth === -1) {
      return { canCreate: true };
    }

    // Check monthly limit
    if ((user.songsThisMonth || 0) >= planLimits.songsPerMonth) {
      return {
        canCreate: false,
        reason: `Monthly limit reached (${planLimits.songsPerMonth} songs per month on ${user.plan} plan)`,
      };
    }

    return { canCreate: true };
  }

  async incrementUsage(userId: string): Promise<void> {
    const user = await storage.getUser(userId);
    if (!user) return;

    await storage.updateUser(userId, {
      songsThisMonth: (user.songsThisMonth || 0) + 1,
    });
  }

  async resetMonthlyUsageIfNeeded(user: User): Promise<void> {
    const now = new Date();
    const lastReset = user.lastUsageReset
      ? new Date(user.lastUsageReset)
      : new Date(0);

    // Check if it's a new month
    if (
      now.getMonth() !== lastReset.getMonth() ||
      now.getFullYear() !== lastReset.getFullYear()
    ) {
      await storage.updateUser(user.id, {
        songsThisMonth: 0,
        lastUsageReset: now,
      });
    }
  }

  hasFeatureAccess(
    userPlan: string,
    feature: keyof PlanLimits["features"],
  ): boolean {
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

  getStorageLimit(userPlan: string): number {
    const planLimits = PLAN_LIMITS[userPlan];
    return planLimits?.storage || 400; // Default to 400 MB for free plan;
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
    if (
      requiredFeature === "voiceCloning" ||
      requiredFeature === "textToSpeech"
    ) {
      return "Voice features are available starting with Basic plan ($6.99/month) - includes voice cloning and text-to-speech";
    }
    if (
      requiredFeature === "analytics" ||
      requiredFeature === "versionControl" ||
      requiredFeature === "collaboration"
    ) {
      return "Advanced tools are available with Free plan - includes unlimited songs, analytics, version control, and collaboration";
    }
    if (
      requiredFeature === "realTimeCollaboration" ||
      requiredFeature === "musicTheoryTools" ||
      requiredFeature === "socialFeatures"
    ) {
      return "Professional features are available with Free plan ($0/month) - includes real-time collaboration, music theory tools, and social features";
    }
    if (
      requiredFeature === "commercialUse" ||
      requiredFeature === "prioritySupport" ||
      requiredFeature === "apiAccess"
    ) {
      return "Business features are available with Enterprise plan ($39.99/month) - includes commercial use license, priority support, and API access";
    }

    return messages[currentPlan] || "Upgrade required for this feature";
  }

  async generateCommercialLicense(options: {
    songTitle: string;
    userId: string;
    tier: "base" | "top";
    userEmail?: string;
    format?: "txt" | "pdf" | "both";
  }): Promise<{ textPath?: string; pdfPath?: string; licenseId: string }> {
    const { songTitle, userId, tier, userEmail, format = "both" } = options;

    const user = await storage.getUser(userId);
    const email = userEmail || user?.email || "user@example.com";

    const licenseId = `BBX-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now()}`;

    const result: { textPath?: string; pdfPath?: string; licenseId: string } = {
      licenseId,
    };

    if (format === "txt" || format === "both") {
      result.textPath = generateLicense({
        songTitle,
        userId,
        licenseId,
        tier,
        userEmail: email,
      });
    }

    if (format === "pdf" || format === "both") {
      result.pdfPath = createPDFLicense({
        songTitle,
        userId,
        licenseId,
        tier,
        userEmail: email,
      });
    }

    // Store license info in database for verification
    await this.storeLicenseInfo(licenseId, {
      songTitle,
      userId,
      tier,
      userEmail: email,
      issuedAt: new Date(),
    });

    return result;
  }

  private async storeLicenseInfo(
    licenseId: string,
    info: {
      songTitle: string;
      userId: string;
      tier: "base" | "top";
      userEmail: string;
      issuedAt: Date;
    },
  ): Promise<void> {
    // In a real implementation, you would store this in your database
    // For now, we'll just log it
    console.log(`📄 License ${licenseId} stored:`, info);
  }

  async verifyLicense(licenseId: string): Promise<boolean> {
    // In a real implementation, you would check your database
    // For now, return true if license ID format is correct
    return /^BBX-[A-Z0-9]{4}-\d+$/.test(licenseId);
  }

  getPlans() {
    return PLAN_LIMITS;
  }

  checkLimitations(
    planType: string,
    currentUsage: { songsGenerated: number; storageUsed: number },
  ) {
    const planLimits = PLAN_LIMITS[planType];
    if (!planLimits) {
      return { error: "Invalid plan type" };
    }

    return {
      songsPerMonth: planLimits.songsPerMonth,
      songsRemaining:
        planLimits.songsPerMonth === -1
          ? -1
          : Math.max(0, planLimits.songsPerMonth - currentUsage.songsGenerated),
      storageLimit: planLimits.storage,
      storageUsed: currentUsage.storageUsed,
      features: planLimits.features,
      audioQuality: planLimits.audioQuality,
      genres: planLimits.genres,
    };
  }
}

export const pricingService = new PricingService();
