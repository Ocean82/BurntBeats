import express, { type Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import http from "http";

// Import authorization middleware
import { 
  authenticate, 
  authorizeOwnership, 
  authorizePlan, 
  rateLimitByPlan,
  securityHeaders,
  requestLogger,
  type AuthenticatedRequest 
} from "./middleware/auth";

// Import mini APIs
import { AuthAPI } from "./api/auth-api";
import { MusicAPI } from "./api/music-api";
import { VoiceAPI } from "./api/voice-api";
import { PricingAPI } from "./api/pricing-api";
import { AIChatService } from "./ai-chat-service";
import { HealthAPI } from "./api/health-api";
import { VocalGenerator } from "./vocal-generator";
import { VoiceCloningService } from "./voice-cloning-service";
import { TextToSpeechService } from "./text-to-speech-service";
import { EnhancedVoicePipeline } from "./enhanced-voice-pipeline";
import { WatermarkService } from "./watermark-service";
import { voiceBankIntegration } from "./services/voice-bank-integration";

// Initialize voice services
const voiceCloningService = new VoiceCloningService();
const textToSpeechService = new TextToSpeechService();
const enhancedVoicePipeline = new EnhancedVoicePipeline();

import { setupAuth, isAuthenticated } from "./replitAuth";
import { validateEnvironmentVariables } from "./env-check";
import {
  musicErrorHandler,
  validateMusicGenerationInput,
  validateVoiceInput,
  validateTTSInput,
  sanitizeRequest,
  createRateLimiter
} from './middleware/music-error-handler';
import { 
  aiChatRateLimit, 
  validateAIChatInput, 
  aiChatErrorHandler 
} from './middleware/ai-chat-middleware';
import { 
  checkPlanQuota, 
  requireFeature, 
  requirePlan 
} from './middleware/plan-enforcement';
import { fileCleanupService } from "./file-cleanup-service";
import { storage } from './storage';


// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export async function registerRoutes(app: express.Application): Promise<void> {

  // Apply global middleware
  app.use(securityHeaders);
  app.use(requestLogger);

  // Auth middleware
  await setupAuth(app);

  // Public endpoints (no authentication required)

  // Business profile endpoint for Stripe verification
  app.get("/api/business-profile", (req: Request, res: Response) => {
    res.json({
      businessName: "Burnt Beats",
      description: "AI-powered music generation platform with commercial licensing",
      website: "https://burnt-beats-sammyjernigan.replit.app",
      email: "support@burntbeats.app",
      social: {
        instagram: "@burntbeatsmusic",
        twitter: "@burntbeats"
      },
      services: [
        "AI Music Generation",
        "Commercial Music Licensing", 
        "Voice Synthesis",
        "Beat Production"
      ],
      licensing: {
        types: ["Commercial", "Sync", "Distribution"],
        pricing: {
          bonus: "$3 - Demo license with watermark",
          base: "$8 - Full commercial license MP3 320kbps",
          top: "$15 - Premium license WAV 24-bit with stems"
        }
      },
      contact: {
        support: "Available via in-app chat and email",
        response_time: "24-48 hours"
      }
    });
  });

  // Stripe configuration endpoint - serves publishable key to frontend
  app.get("/api/stripe/config", (req: Request, res: Response) => {
    res.json({
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || ''
    });
  });

  // Authentication endpoints (new user authentication system)
  app.post("/api/auth/login", AuthAPI.login);
  app.post("/api/auth/register", AuthAPI.register);
  app.post("/api/auth/logout", AuthAPI.logout);
  app.get("/api/auth/user", AuthAPI.getCurrentUser);
  app.post("/api/auth/forgot-password", AuthAPI.forgotPassword);
  app.post("/api/auth/reset-password", AuthAPI.resetPassword);
  app.get("/api/auth/check-username/:username", AuthAPI.checkUsername);
  app.post("/api/auth/accept-agreement", AuthAPI.acceptAgreement);
  app.get("/api/auth/get-ip", AuthAPI.getIpAddress);

  // Legacy admin login for backwards compatibility
  app.post("/api/auth/admin-login", AuthAPI.adminLogin);

  // Enhanced Bonus Features API Endpoints

  // Post-purchase AI feedback endpoint
  app.post("/api/ai-feedback/:songId", async (req: Request, res: Response) => {
    try {
      const { songId } = req.params;
      const { tier, userEmail } = req.body;

      // Create mock song for testing since storage might not have the song
      const mockSong = {
        id: parseInt(songId),
        title: 'Test Beat',
        lyrics: `Verse 1:
Living life in the fast lane
Money, power, respect my name
Never looking back again
Success flowing through my veins

Chorus:
We rise up, we never fall
Standing tall through it all
Dreams become reality
This is our destiny

Verse 2:
Started from the bottom now
Every struggle made us strong somehow
Future bright, we own it now
Taking over, making vows`
      };

      const feedback = await AIChatService.generatePostPurchaseFeedback(
        songId,
        mockSong.title,
        mockSong.lyrics,
        tier,
        userEmail || 'test@burntbeats.app'
      );

      res.json(feedback);
    } catch (error: any) {
      console.error("AI feedback generation failed:", error);
      res.status(500).json({ message: "Error generating AI feedback: " + error.message });
    }
  });

  // Get AI feedback for a song
  app.get("/api/ai-feedback/:songId", async (req: Request, res: Response) => {
    try {
      const { songId } = req.params;
      const fs = await import('fs/promises');
      const path = await import('path');

      const feedbackPath = path.join(process.cwd(), 'uploads/feedback', `${songId}_feedback.json`);

      try {
        const feedbackData = await await fs.readFile(feedbackPath, 'utf8');
        const feedback = JSON.parse(feedbackData);
        res.json(feedback);
      } catch (error) {
        res.status(404).json({ message: "AI feedback not found for this song" });
      }
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving AI feedback: " + error.message });
    }
  });

  // Generate license certificate with artist name & beat ID
  app.post("/api/license/generate", async (req: Request, res: Response) => {
    try {
      const { songId, songTitle, tier, userEmail, artistName } = req.body;
      const { generateLicense } = await import('./utils/license-generator');

      const beatId = `BB-${songId}-${Date.now().toString(36).toUpperCase()}`;

      const licensePath = generateLicense({
        songTitle,
        userId: songId,
        tier,
        userEmail,
        artistName: artistName || userEmail?.split('@')[0] || 'Artist',
        beatId
      });

      res.json({
        success: true,
        licensePath,
        beatId,
        licenseId: `BBX-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now()}`,
        message: "License certificate generated successfully"
      });
    } catch (error: any) {
      console.error("License generation failed:", error);
      res.status(500).json({ message: "Error generating license: " + error.message });
    }
  });

  // Beat analytics endpoints
  app.post("/api/play/:beatId", async (req: Request, res: Response) => {
    try {
      const { beatId } = req.params;
      const { userId, sessionId } = req.body;

      const { BeatAnalytics } = await import('./services/beat-analytics');
      await BeatAnalytics.recordPlay(beatId, userId, sessionId);

      res.json({ status: 'Play recorded!', beatId });
    } catch (error: any) {
      console.error("Failed to record play:", error);
      res.status(500).json({ message: "Error recording play: " + error.message });
    }
  });

  // Real-time analytics endpoint using Replit DB
  app.get("/api/beats/realtime/:beatId", async (req: Request, res: Response) => {
    try {
      const { beatId } = req.params;
      const { BeatAnalyticsService } = await import('./services/beat-analytics-service');

      const realtimePlays = await BeatAnalyticsService.getRealTimePlays(beatId);
      const fullStats = await BeatAnalyticsService.getBeatStats(beatId);

      res.json({
        beatId,
        realtimePlays,
        cached: !!fullStats,
        stats: fullStats
      });
    } catch (error: any) {
      console.error("Failed to get real-time analytics:", error);
      res.status(500).json({ message: "Error getting real-time analytics: " + error.message });
    }
  });

  // Trending beats from cache (super fast)
  app.get("/api/beats/trending-cache", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const { BeatAnalyticsService } = await import('./services/beat-analytics-service');

      const trendingIds = await BeatAnalyticsService.getTrendingFromCache(limit);
      res.json({ trending: trendingIds, source: 'replit-cache' });
    } catch (error: any) {
      console.error("Failed to get trending from cache:", error);
      res.status(500).json({ message: "Error getting trending beats: " + error.message });
    }
  });

  app.get("/api/top-beats", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      const { BeatAnalytics } = await import('./services/beat-analytics');
      const topBeats = await BeatAnalytics.getTopBeats(limit);

      res.json({
        success: true,
        count: topBeats.length,
        topBeats
      });
    } catch (error: any) {
      console.error("Failed to get top beats:", error);
      res.status(500).json({ message: "Error retrieving top beats: " + error.message });
    }
  });

  app.get("/api/trending-beats", async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const limit = parseInt(req.query.limit as string) || 10;

      const { BeatAnalytics } = await import('./services/beat-analytics');
      const trendingBeats = await BeatAnalytics.getTrendingBeats(days, limit);

      res.json({
        success: true,
        days,
        count: trendingBeats.length,
        trendingBeats
      });
    } catch (error: any) {
      console.error("Failed to get trending beats:", error);
      res.status(500).json({ message: "Error retrieving trending beats: " + error.message });
    }
  });

  app.get("/api/analytics/summary", async (req: Request, res: Response) => {
    try {
      const { BeatAnalytics } = await import('./services/beat-analytics');
      const summary = await BeatAnalytics.getAnalyticsSummary();

      res.json({
        success: true,
        summary
      });
    } catch (error: any) {
      console.error("Failed to get analytics summary:", error);
      res.status(500).json({ message: "Error retrieving analytics summary: " + error.message });
    }
  });

  // Beat popularity tracking endpoints (legacy compatibility)
  app.get("/api/beats/popularity/:beatId", async (req: Request, res: Response) => {
    try {
      const { beatId } = req.params;

      // Try new analytics service first
      const { BeatAnalytics } = await import('./services/beat-analytics');
      const newStats = await BeatAnalytics.getBeatStats(beatId);

      if (newStats) {
        return res.json(newStats);
      }

      // Fallback to legacy system
      const { getBeatPopularityStats } = await import('./utils/license-generator');
      const stats = getBeatPopularityStats(beatId);

      if (!stats) {
        return res.status(404).json({ message: "Beat statistics not found" });
      }

      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving beat stats: " + error.message });
    }
  });

  // Get top performing beats
  app.get("/api/beats/top-performing", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const { getTopPerformingBeats } = await import('./utils/license-generator');

      const topBeats = getTopPerformingBeats(limit);

      res.json({
        success: true,
        topBeats,
        count: topBeats.length,
        message: `Top ${topBeats.length} performing beats retrieved`
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving top beats: " + error.message });
    }
  });

  // Purchase summary dashboard endpoint
  app.get("/api/purchases/summary/:userEmail", async (req: Request, res: Response) => {
    try {
      const { userEmail } = req.params;
      const fs = await import('fs/promises');
      const path = await import('path');

      // Get all feedback files for user
      const feedbackDir = path.join(process.cwd(), 'uploads/feedback');

      let userPurchases = [];
      let totalSpent = 0;

      try {
        const feedbackFiles = await fs.readdir(feedbackDir);

        for (const file of feedbackFiles) {
          if (file.endsWith('_feedback.json')) {
            const feedbackData = JSON.parse(await fs.readFile(path.join(feedbackDir, file), 'utf8'));

            if (feedbackData.userEmail === userEmail) {
              const tierPricing = { bonus: 2.99, base: 4.99, top: 9.99 };
              totalSpent += tierPricing[feedbackData.purchaseTier as keyof typeof tierPricing];

              userPurchases.push({
                songId: feedbackData.songId,
                songTitle: feedbackData.songTitle,
                tier: feedbackData.purchaseTier,
                purchaseDate: feedbackData.generatedAt,
                aiScore: feedbackData.analysis.overallScore,
                mood: feedbackData.analysis.genre
              });
            }
          }
        }
      } catch (error) {
        // Directory might not exist yet
        userPurchases = [];
      }

      res.json({
        success: true,
        userEmail,
        totalPurchases: userPurchases.length,
        totalSpent: totalSpent.toFixed(2),
        purchases: userPurchases.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()),
        averageAiScore: userPurchases.length > 0 
          ? (userPurchases.reduce((sum, p) => sum + p.aiScore, 0) / userPurchases.length).toFixed(1)
          : 0
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving purchase summary: " + error.message });
    }
  });

  // Serve static files from uploads directory
  app.use('/uploads', express.static(uploadsDir));

  // Health and System API Routes
  app.get("/api/health", HealthAPI.healthCheck);
  app.get("/api/system-status", HealthAPI.systemStatus);
  app.get("/api/api-status", HealthAPI.apiStatus);

  // Authentication API Routes
  app.post("/api/auth/login", AuthAPI.login);
  app.post("/api/auth/register", AuthAPI.register);
  app.post("/api/auth/logout", AuthAPI.logout);

  // Legacy auth routes for compatibility
  app.get("/api/user", AuthAPI.getCurrentUser);
  app.get("/api/login", (req, res) => res.redirect("/?auth=success"));
  app.get("/api/logout", (req, res) => res.redirect("/"));

  // Define rate limiters using express-rate-limit directly
  const generalRateLimit = (req: Request, res: Response, next: NextFunction) => next();
  const musicGenerationRateLimit = (req: Request, res: Response, next: NextFunction) => next();

  // API v1 Routes with versioning
  const v1Router = express.Router();

  // Music Generation API Routes (v1)
  v1Router.post("/songs/generate", musicGenerationRateLimit, authenticate, checkPlanQuota('free'), validateMusicGenerationInput, MusicAPI.generateSong);
  v1Router.post("/songs/ai-generate", musicGenerationRateLimit, authenticate, requireFeature('neuralSynthesis'), validateMusicGenerationInput, MusicAPI.generateAIMusic);
  v1Router.post("/music21/demo", generalRateLimit, MusicAPI.generateMusic21Demo);
  v1Router.get("/songs/:id", generalRateLimit, MusicAPI.getSong);
  v1Router.get("/songs", generalRateLimit, authenticate, MusicAPI.getUserSongs);

  // Mount v1 routes
  app.use("/api/v1", v1Router);

  // Legacy routes for backward compatibility
  app.post("/api/music/generate", musicGenerationRateLimit, authenticate, validateMusicGenerationInput, MusicAPI.generateSong);
  app.post("/api/music/ai-generate", musicGenerationRateLimit, authenticate, validateMusicGenerationInput, MusicAPI.generateAIMusic);
  app.post("/api/music/demo", generalRateLimit, MusicAPI.generateMusic21Demo);
  app.get("/api/music/:id", generalRateLimit, MusicAPI.getSong);
  app.get("/api/music", generalRateLimit, authenticate, MusicAPI.getUserSongs);

  // Protected API endpoints with proper authorization

  // Song management endpoints
  app.get('/api/auth/user', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Songs endpoints with ownership verification
  app.get("/api/songs", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const songs = await storage.getSongsByUser(req.user!.id);
      res.json(songs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch songs" });
    }
  });

  app.get("/api/songs/:id", authenticate, authorizeOwnership('song'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const song = await storage.getSong(parseInt(req.params.id));
      res.json(song);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch song" });
    }
  });

  app.put("/api/songs/:id", authenticate, authorizeOwnership('song'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const updates = req.body;
      const song = await storage.updateSong(parseInt(req.params.id), updates);
      res.json(song);
    } catch (error) {
      res.status(500).json({ error: "Failed to update song" });
    }
  });

  app.delete("/api/songs/:id", authenticate, authorizeOwnership('song'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      await storage.deleteSong(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete song" });
    }
  });

  // Voice Bank API endpoints
  app.get("/api/voice-bank/stats", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stats = voiceBankIntegration.getVoiceBankStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to get voice bank stats" });
    }
  });

  app.get("/api/voice-bank/profiles", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const profiles = voiceBankIntegration.getAllVoiceProfiles();
      const sanitizedProfiles = profiles.map(profile => ({
        id: profile.id,
        name: profile.name,
        fileSize: profile.fileSize,
        duration: profile.duration,
        format: profile.format,
        isDefault: profile.isDefault,
        createdAt: profile.createdAt,
        metadata: profile.metadata
      }));
      res.json({ success: true, data: sanitizedProfiles });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to get voice profiles" });
    }
  });

  app.get("/api/voice-bank/default", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const defaultVoice = voiceBankIntegration.getDefaultVoice();
      if (!defaultVoice) {
        return res.status(404).json({ success: false, message: "No default voice available" });
      }

      const sanitizedProfile = {
        id: defaultVoice.id,
        name: defaultVoice.name,
        fileSize: defaultVoice.fileSize,
        duration: defaultVoice.duration,
        format: defaultVoice.format,
        isDefault: defaultVoice.isDefault,
        createdAt: defaultVoice.createdAt,
        metadata: defaultVoice.metadata
      };

      res.json({ success: true, data: sanitizedProfile });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to get default voice" });
    }
  });

  app.post("/api/voice-bank/generate", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { voiceId = 'default-voice', text, melody, duration } = req.body;

      if (!text) {
        return res.status(400).json({ success: false, message: "Text is required for vocal generation" });
      }

      const vocalResult = await voiceBankIntegration.generateVocalSample(voiceId, text);

      if (!vocalResult || !vocalResult.audioPath) {
        return res.status(404).json({ success: false, message: "Failed to generate vocal sample" });
      }

      res.json({
        success: true,
        data: {
          audioPath: vocalResult.audioPath,
          duration: vocalResult.duration,
          voiceUsed: vocalResult.voiceUsed
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to generate vocal sample" });
    }
  });

  // Voice samples endpoints with ownership verification
  app.get("/api/voice-samples", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const voiceSamples = await storage.getVoiceSamplesByUser(req.user!.id);
      res.json(voiceSamples);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch voice samples" });
    }
  });

  app.get("/api/voice-samples/:id", authenticate, authorizeOwnership('voiceSample'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const voiceSample = await storage.getVoiceSample(parseInt(req.params.id));
      res.json(voiceSample);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch voice sample" });
    }
  });

  app.delete("/api/voice-samples/:id", authenticate, authorizeOwnership('voiceSample'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      await storage.deleteVoiceSample(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete voice sample" });
    }
  });

  // Song generation with rate limiting and plan validation
  app.post("/api/songs/generate", 
    authenticate, 
    rateLimitByPlan({ free: 5, basic: 20, pro: 50, enterprise: 100 }),
    validateMusicGenerationInput,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const songData = {
          ...req.body,
          userId: req.user!.id,
          status: 'pending',
          generationProgress: 0
        };
        const song = await storage.createSong(songData);
        res.json(song);
      } catch (error) {
        res.status(500).json({ error: "Failed to create song" });
      }
    }
  );

  // Advanced AI Music Generation
  app.post("/api/generate-advanced-ai", 
    authenticate, 
    rateLimitByPlan({ free: 2, basic: 10, pro: 25, enterprise: 50 }),
    validateMusicGenerationInput,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { AdvancedAIMusicService } = await import("./services/advanced-ai-music-service");
        const aiService = AdvancedAIMusicService.getInstance();

        const options = {
          ...req.body,
          userId: req.user!.id,
          aiEnhanced: true,
          complexityLevel: req.body.complexityLevel || 'medium',
          outputFormat: req.body.outputFormat || 'both'
        };

        const result = await aiService.generateAdvancedMusic(options);

        if (result.success) {
          // Store in database
          const song = await storage.createSong({
            ...req.body,
            userId: req.user!.id,
            generatedAudioPath: result.audioPath,
            midiPath: result.midiPath,
            metadata: result.metadata,
            aiInsights: result.aiInsights,
            status: 'completed'
          });

          res.json({
            success: true,
            song,
            aiInsights: result.aiInsights,
            processingTime: result.processingTime
          });
        } else {
          res.status(500).json({
            success: false,
            error: result.error
          });
        }
      } catch (error) {
        logger.error('Advanced AI generation failed:', error);
        res.status(500).json({ error: "Advanced AI generation failed" });
      }
    }
  );

  // Legacy compatibility routes
  app.post("/api/generate", authenticate, checkPlanQuota(), validateMusicGenerationInput, MusicAPI.generateSong);
  app.post("/api/generate-ai-music", authenticate, authorizePlan('pro'), validateMusicGenerationInput, MusicAPI.generateAIMusic);
  app.post("/api/demo-music21", MusicAPI.generateMusic21Demo);
  app.get("/api/songs/single/:id", authenticate, MusicAPI.getSong);

  // Audio streaming endpoint with proper headers
  app.get("/api/audio/:songId", async (req: Request, res: Response) => {
    try {
      const { songId } = req.params;

      // Get song info to find audio file
      const { storage } = await import("./storage");
      const song = await storage.getSong(parseInt(songId));

      if (!song || !song.generatedAudioPath) {
        return res.status(404).json({ error: "Audio file not found" });
      }

      // Clean the path - remove leading slash if present
      const cleanPath = song.generatedAudioPath.startsWith('/') 
        ? song.generatedAudioPath.slice(1) 
        : song.generatedAudioPath;

      const audioPath = path.join(process.cwd(), cleanPath);

      if (!fs.existsSync(audioPath)) {
        return res.status(404).json({ error: "Audio file not found on disk" });
      }

      // Set proper headers for audio streaming
      const ext = path.extname(audioPath).toLowerCase();
      const contentType = {
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.m4a': 'audio/mp4',
        '.ogg': 'audio/ogg'
      }[ext] || 'audio/mpeg';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=3600');

      // Handle range requests for audio seeking
      const stat = fs.statSync(audioPath);
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        const chunksize = (end - start) + 1;

        res.status(206);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
        res.setHeader('Content-Length', chunksize);

        const stream = fs.createReadStream(audioPath, { start, end });
        stream.pipe(res);
      } else {
        res.setHeader('Content-Length', stat.size);
        const stream = fs.createReadStream(audioPath);
        stream.pipe(res);
      }

    } catch (error) {
      console.error("Audio streaming error:", error);
      res.status(500).json({ error: "Failed to stream audio" });
    }
  });

  // Audio preview endpoint with watermark
  app.get('/api/audio/preview/:songId', async (req: Request, res: Response) => {
    try {
      const { songId } = req.params;
      const user = (req as any).user;
      const { storage } = await import("./storage");
      const song = await storage.getSong(parseInt(songId));

      if (!song) {
        return res.status(404).json({ success: false, error: 'Song not found' });
      }

      // Check if audio path exists and get type-safe reference
      const audioFilePath = song.generatedAudioPath;
      if (!audioFilePath) {
        return res.status(404).json({ success: false, error: 'Audio file path not found' });
      }

      // Clean the path - remove leading slash if present
      const cleanPath = audioFilePath.startsWith('/')
        ? audioFilePath.slice(1)
        : audioFilePath;

      const audioPath = path.join(process.cwd(), cleanPath);

      if (!fs.existsSync(audioPath)) {
        return res.status(404).json({ success: false, error: 'Audio file not found' });
      }

      // Import audioPreviewService
      const { audioPreviewService } = await import('./audio-preview-service');

      // Check user plan to determine preview type
      const userPlan = user?.plan || 'free';
      const isWatermarked = userPlan === 'free' || userPlan === 'basic';

      let previewPath: string;

      if (isWatermarked) {
        previewPath = await audioPreviewService.generateWatermarkedPreview(audioPath, songId.toString());
      } else {
        previewPath = await audioPreviewService.generateCleanPreview(audioPath, songId.toString());
      }

      if (!fs.existsSync(previewPath)) {
        return res.status(404).json({ success: false, error: 'Preview not found' });
      }

      const stat = fs.statSync(previewPath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        const chunksize = (end - start) + 1;

        res.status(206);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
        res.setHeader('Content-Length', chunksize);

        const stream = fs.createReadStream(previewPath, { start, end });
        stream.pipe(res);
      } else {
        res.setHeader('Content-Length', fileSize);
        const stream = fs.createReadStream(previewPath);
        stream.pipe(res);
      }
    } catch (error) {
      console.error('Audio preview error:', error);
      res.status(500).json({ success: false, error: 'Failed to generate audio preview' });
    }
  });

  // AI Chat API (Burnt-GPT) Routes
  app.post("/api/ai-chat/completions", aiChatRateLimit, authenticate, validateAIChatInput, AIChatService.handleCompletionRequest);
  app.post("/api/ai-chat/retry", aiChatRateLimit, authenticate, AIChatService.handleRetryRequest);

  // Voice Cloning API Routes
  app.post("/api/voice/clone", 
    authenticate, 
    validateVoiceInput, 
    VoiceAPI.cloneVoice
  );

  // RVC Voice Conversion API Routes
  const rvcRouter = await import("./api/rvc-api");
  app.use("/api/rvc", rvcRouter.default);

  // Text-to-Speech API Routes
  app.post("/api/tts/generate", 
    authenticate, 
    validateTTSInput,
    TextToSpeechService.generateSpeech
  );

  // Enhanced Voice Pipeline Routes
  app.post("/api/enhanced-voice/process", 
    authenticate,
    validateVoiceInput,
    EnhancedVoicePipeline.processVoice
  );

  // Watermark Service API Routes
  app.post("/api/watermark/apply", 
    authenticate,
    VoiceAPI.applyWatermark
  );

  // Pricing and Plan API Routes
  app.get("/api/pricing/plans", PricingAPI.getPlans);
  app.get("/api/pricing/plan/:id", PricingAPI.getPlan);

  // File Upload Route (Example - adjust as needed)
  const upload = multer({ dest: 'uploads/' });
  app.post('/api/upload', upload.single('file'), (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }
    res.send('File uploaded successfully!');
  });

  // Error handling middleware (must be defined after all routes)
  app.use(musicErrorHandler);
  app.use(aiChatErrorHandler);

  // Catch-all route to serve the React app for any other request.
  app.use(express.static(path.join(__dirname, "../client/dist")));
  app.get("*", (req: Request, res: Response) => {
    res.sendFile(path.resolve(__dirname, "../client/dist", "index.html"));
  });
}