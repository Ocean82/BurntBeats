import express, { type Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import http from "http";

// Import mini APIs
import { AuthAPI } from "./api/auth-api";
import { MusicAPI } from "./api/music-api";
import { VoiceAPI } from "./api/voice-api";
import { PricingAPI } from "./api/pricing-api";
import { AIChatService } from "./ai-chat-service";
import { HealthAPI } from "./api/health-api";
// Audio service imports removed temporarily
import { VocalGenerator } from "./vocal-generator";
import { VoiceCloningService } from "./voice-cloning-service";
import { TextToSpeechService } from "./text-to-speech-service";
import { EnhancedVoicePipeline } from "./enhanced-voice-pipeline";
import { WatermarkService } from "./watermark-service";

// Initialize voice services
const voiceCloningService = new VoiceCloningService();
const textToSpeechService = new TextToSpeechService();
const enhancedVoicePipeline = new EnhancedVoicePipeline();
import { isAuthenticated } from "./replitAuth";
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

// Import auth middleware from index
import { requireAuth, optionalAuth } from "./index";

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();

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


if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export function registerRoutes(app: express.Application): http.Server {

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
        const feedbackData = await fs.readFile(feedbackPath, 'utf8');
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
                mood: feedbackData.analysis.mood,
                genre: feedbackData.analysis.genre
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
  app.get("/api/auth/user", AuthAPI.getCurrentUser);
  app.post("/api/auth/logout", AuthAPI.logout);

  // Legacy auth routes for compatibility
  app.get("/api/user", AuthAPI.getCurrentUser);
  app.get("/api/login", (req, res) => res.redirect("/?auth=success"));
  app.get("/api/logout", (req, res) => res.redirect("/"));

  // Define rate limiters
  const generalRateLimit = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 20,
    message: "Too many requests, please try again later."
  });

  const musicGenerationRateLimit = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    message: "Too many music generation requests, please try again later."
  });

  // API v1 Routes with versioning
  const v1Router = express.Router();

  // Music Generation API Routes (v1)
  v1Router.post("/songs/generate", musicGenerationRateLimit, optionalAuth, checkPlanQuota('free'), validateMusicGenerationInput, MusicAPI.generateSong);
  v1Router.post("/songs/ai-generate", musicGenerationRateLimit, optionalAuth, requireFeature('neuralSynthesis'), validateMusicGenerationInput, MusicAPI.generateAIMusic);
  v1Router.post("/music21/demo", generalRateLimit, optionalAuth, MusicAPI.generateMusic21Demo);
  v1Router.get("/songs/:id", generalRateLimit, MusicAPI.getSong);
  v1Router.get("/songs", generalRateLimit, optionalAuth, MusicAPI.getUserSongs);

  // Mount v1 routes
  app.use("/api/v1", v1Router);

  // Legacy routes for backward compatibility
  app.post("/api/music/generate", musicGenerationRateLimit, optionalAuth, validateMusicGenerationInput, MusicAPI.generateSong);
  app.post("/api/music/ai-generate", musicGenerationRateLimit, optionalAuth, validateMusicGenerationInput, MusicAPI.generateAIMusic);
  app.post("/api/music/demo", generalRateLimit, optionalAuth, MusicAPI.generateMusic21Demo);
  app.get("/api/music/:id", generalRateLimit, MusicAPI.getSong);
  app.get("/api/music", generalRateLimit, optionalAuth, MusicAPI.getUserSongs);

  // Legacy music routes for compatibility
  app.post("/api/songs/generate", requireAuth, checkPlanQuota(), validateMusicGenerationInput, MusicAPI.generateSong);
  app.post("/api/generate", requireAuth, checkPlanQuota(), validateMusicGenerationInput, MusicAPI.generateSong); // Main generate endpoint
  app.post("/api/generate-ai-music", requireAuth, checkPlanQuota(), validateMusicGenerationInput, MusicAPI.generateAIMusic);
  app.post("/api/demo-music21", optionalAuth, MusicAPI.generateMusic21Demo);
  app.get("/api/songs/single/:id", optionalAuth, MusicAPI.getSong);
  app.get("/api/songs", requireAuth, MusicAPI.getUserSongs);

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

      // Clean the path - remove leading slash if present
      const cleanPath = song.generatedAudioPath.startsWith('/')
        ? song.generatedAudioPath.slice(1)
        : song.generatedAudioPath;

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
        const file = fs.createReadStream(previewPath, { start, end });
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'audio/mpeg',
          'X-Preview-Type': isWatermarked ? 'watermarked' : 'clean'
        };
        res.writeHead(206, head);
        file.pipe(res);
      } else {
        const head = {
          'Content-Length': fileSize,
          'Content-Type': 'audio/mpeg',
          'X-Preview-Type': isWatermarked ? 'watermarked' : 'clean'
        };
        res.writeHead(200, head);
        fs.createReadStream(previewPath).pipe(res);
      }
    } catch (error) {
      console.error('Error streaming preview:', error);
      res.status(500).json({ success: false, error: 'Failed to generate preview' });
    }
  });

  // Voice and Audio API Routes
  app.post("/api/voice/upload", generalRateLimit, validateVoiceInput, VoiceAPI.uploadMiddleware, VoiceAPI.uploadVoiceSample);
  app.get("/api/voice/samples", generalRateLimit, VoiceAPI.getVoiceSamples);
  app.post("/api/voice/tts", musicGenerationRateLimit, validateTTSInput, VoiceAPI.generateTTS);
  app.post("/api/voice/clone", musicGenerationRateLimit, validateVoiceInput, VoiceAPI.cloneVoice);

  // Pricing and Plans API Routes
  app.get("/api/pricing/plans", PricingAPI.getPricingPlans);
  app.post("/api/pricing/check-limitations", PricingAPI.checkPlanLimitations);
  app.post("/api/pricing/upgrade", PricingAPI.upgradePlan);
  app.get("/api/pricing/subscription/:userId", PricingAPI.getUserSubscription);

  // AI Chat API Routes with proper middleware
  app.post("/api/ai-chat", aiChatRateLimit, validateAIChatInput, AIChatService.handleChat, aiChatErrorHandler);
  app.get("/api/ai-advice", generalRateLimit, AIChatService.getRandomAdvice);
  app.get("/api/ai-roast", generalRateLimit, AIChatService.getRandomRoast);

  // Size-based download payment (simplified for your Stripe setup)
  app.post("/api/create-payment-intent", async (req: Request, res: Response) => {
    try {
      const { amount, downloadType, songId, features } = req.body;

      // Import Stripe dynamically
      const { default: Stripe } = await import("stripe");

      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('Stripe secret key not configured');
      }

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2023-10-16",
      });

      // Create payment intent with metadata for tracking
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          downloadType: downloadType || 'unknown',
          songId: songId || 'unknown',
          features: features ? features.join(',') : 'none',
          userId: (req as any).user?.id || 'guest'
        },
        description: `Burnt Beats - ${downloadType ? 'Download' : 'Features'}: $${amount}`
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Payment intent creation failed:", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Helper function to verify purchase status
  async function verifyPurchase(songId: string, sessionId: string): Promise<{verified: boolean, songId: string, songTitle: string, tier: string, downloadExpiry: string} | null> {
    try {
      // In a real implementation, this would check a database
      // to confirm the session ID and song ID match a valid purchase.
      console.log(`Verifying purchase for song ${songId} with session ${sessionId}`);

      // Mock purchase verification logic
      const mockPurchase = {
        verified: true,
        songId: songId,
        songTitle: 'Sample Song',
        tier: 'base', // Could be 'bonus', 'base', or 'top'
        downloadExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };

      return mockPurchase; // Replace with actual database lookup
    } catch (error) {
      console.error('Purchase verification failed:', error);
      return null;
    }
  }

  // Download endpoint after successful payment
  // Verify purchase status for a song
  app.get("/api/verify-purchase/:songId", async (req: Request, res: Response) => {
    try {
      const { songId } = req.params;
      const sessionId = req.headers.authorization?.replace('Bearer ', '') || 
                       req.headers['x-session-id'] as string;

      // Check if this is a valid purchase
      const purchaseData = await verifyPurchase(songId, sessionId);

      if (purchaseData) {
        res.json(purchaseData);
      } else {
        res.status(402).json({ 
          verified: false, 
          message: "Payment required",
          purchaseUrl: `/api/create-payment-intent?songId=${songId}`
        });
      }
    } catch (error) {
      console.error('Purchase verification error:', error);
      res.status(500).json({ message: "Verification error" });
    }
  });

  // Secure download endpoint that requires payment verification
  app.get("/api/download/secure/:songId", async (req: Request, res: Response) => {
    try {
      const { songId } = req.params;
      const sessionId = req.headers.authorization?.replace('Bearer ', '');

      if (!sessionId) {
        return res.status(401).json({ message: "Authorization required" });
      }

      // Verify purchase before allowing download
      const purchaseData = await verifyPurchase(songId, sessionId);
      if (!purchaseData?.verified) {
        return res.status(402).json({ message: "Payment required for download" });
      }

      // File paths for different quality downloads based on tier
      const downloadPaths = {
        'bonus': '/uploads/songs/sample-128.mp3',
        'base': '/uploads/songs/sample-320.mp3', 
        'top': '/uploads/songs/sample-studio.wav'
      };

      const filePath = downloadPaths[purchaseData.tier as keyof typeof downloadPaths];

      if (!filePath) {
        return res.status(404).json({ message: "Download not found" });
      }

      // Set headers for secure download
      const fileExtension = filePath.includes('wav') ? 'wav' : 'mp3';
      const filename = `${purchaseData.songTitle.replace(/[^a-z0-9]/gi, '_')}_${purchaseData.tier}.${fileExtension}`;

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', filePath.includes('wav') ? 'audio/wav' : 'audio/mpeg');
      res.setHeader('Cache-Control', 'private, no-cache');

      // In production, serve the actual file
      // For now, return download metadata
      res.json({
        downloadUrl: filePath,
        message: "Download authorized",
        tier: purchaseData.tier,
        format: fileExtension,
        expiresAt: purchaseData.downloadExpiry
      });

    } catch (error: any) {
      res.status(500).json({ message: "Download error: " + error.message });
    }
  });

  // Legacy download endpoint - redirect to secure version
  app.get("/api/download/:downloadType", async (req: Request, res: Response) => {
    res.status(301).redirect(`/api/download/secure/${req.params.downloadType}`);
  });

  // Stripe Payment Routes (existing)
  app.post("/api/stripe/create-payment-intent", async (req: Request, res: Response) => {
    try {
      const { StripeService } = await import("./stripe-service");
      const result = await StripeService.createPaymentIntent(req.body);
      res.json(result);
    } catch (error) {
      console.error("Payment intent creation failed:", error);
      res.status(500).json({ error: "Payment processing failed" });
    }
  });

  app.post("/api/stripe/create-customer", async (req: Request, res: Response) => {
    try {
      const { StripeService } = await import("./stripe-service");
      const { email, name } = req.body;
      const customer = await StripeService.createCustomer(email, name);
      res.json(customer);
    } catch (error) {
      console.error("Customer creation failed:", error);
      res.status(500).json({ error: "Customer creation failed" });
    }
  });

  app.post("/api/stripe/webhook", express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
    try {
      const { default: Stripe } = await import("stripe");

      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('Stripe secret key not configured');
      }

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2023-10-16",
      });

      const signature = req.headers['stripe-signature'] as string;
      let event;

      try {
        // Verify webhook signature (you'll need to set STRIPE_WEBHOOK_SECRET)
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (webhookSecret) {
          event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
        } else {
          // For testing without webhook secret
          event = JSON.parse(req.body.toString());
        }
      } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
          break;
        case 'payment_method.attached':
          const paymentMethod = event.data.object;
          console.log('PaymentMethod was attached to Customer!');
          break;
        case 'customer.subscription.created':
          const subscription = event.data.object;
          console.log(`Subscription created: ${subscription.id}`);
          break;
        case 'customer.subscription.updated':
          const subscriptionUpdated = event.data.object;
          console.log(`Subscription updated: ${subscriptionUpdated.id}`);
          break;
        case 'customer.subscription.deleted':
          const subscriptionDeleted = event.data.object;
          console.log(`Subscription deleted: ${subscriptionDeleted.id}`);
          break;
        default:
          // Unexpected event type
          console.log(`Unhandled event type ${event.type}.`);
      }

      // Acknowledge receipt of the event
      res.json({ received: true });
    } catch (error: any) {
      console.error("Stripe webhook error:", error);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  });

  // Add error reporting routes
  const { healthCheck } = await import("./api/health-api");
  import { reportError, getErrorSummary } from "./api/error-report";

  // Health check endpoint
  app.get("/health", healthCheck);

  // Error reporting endpoints
  app.post("/api/error-report", reportError);
  app.get("/api/error-summary", getErrorSummary);

  return app.listen(3000, () => {
    console.log("Server is running on port 3000");
  });
}