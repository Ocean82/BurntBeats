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
import { isAuthenticated } from "./replitAuth";
import { validateEnvironmentVariables } from "./env-check";
import {
  musicErrorHandler,
  validateMusicGenerationInput,
  validateVoiceInput
} from './middleware/music-error-handler';

// Import auth middleware from index
import { requireAuth, optionalAuth } from "./index";

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export function registerRoutes(app: express.Application): http.Server {

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

  // Music Generation API Routes (protected in production)
  app.post("/api/music/generate", optionalAuth, validateMusicGenerationInput, MusicAPI.generateSong);
  app.post("/api/music/ai-generate", optionalAuth, validateMusicGenerationInput, MusicAPI.generateAIMusic);
  app.post("/api/music/demo", optionalAuth, MusicAPI.generateMusic21Demo);
  app.get("/api/music/:id", MusicAPI.getSong);
  app.get("/api/music", optionalAuth, MusicAPI.getUserSongs);

  // Legacy music routes for compatibility
  app.post("/api/songs/generate", optionalAuth, validateMusicGenerationInput, MusicAPI.generateSong);
  app.post("/api/generate", optionalAuth, validateMusicGenerationInput, MusicAPI.generateSong); // Main generate endpoint
  app.post("/api/generate-ai-music", optionalAuth, validateMusicGenerationInput, MusicAPI.generateAIMusic);
  app.post("/api/demo-music21", optionalAuth, MusicAPI.generateMusic21Demo);
  app.get("/api/songs/single/:id", MusicAPI.getSong);
  app.get("/api/songs", optionalAuth, MusicAPI.getUserSongs);

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

  // Voice and Audio API Routes
  app.post("/api/voice/upload", VoiceAPI.uploadMiddleware, VoiceAPI.uploadVoiceSample);
  app.get("/api/voice/samples", VoiceAPI.getVoiceSamples);
  app.post("/api/voice/tts", VoiceAPI.generateTTS);
  app.post("/api/voice/clone", VoiceAPI.cloneVoice);

  // Pricing and Plans API Routes
  app.get("/api/pricing/plans", PricingAPI.getPricingPlans);
  app.post("/api/pricing/check-limitations", PricingAPI.checkPlanLimitations);
  app.post("/api/pricing/upgrade", PricingAPI.upgradePlan);
  app.get("/api/pricing/subscription/:userId", PricingAPI.getUserSubscription);

  // AI Chat API Routes
  app.post("/api/ai-chat", AIChatService.handleChat);
  app.get("/api/ai-advice", AIChatService.getRandomAdvice);

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

  // Download endpoint after successful payment
  app.get("/api/download/:downloadType", async (req: Request, res: Response) => {
    try {
      const { downloadType } = req.params;

      // File paths for different quality downloads
      const downloadPaths = {
        'mp3_standard': '/uploads/songs/sample-128.mp3',
        'mp3_hq': '/uploads/songs/sample-320.mp3',
        'wav_cd': '/uploads/songs/sample-cd.wav',
        'wav_studio': '/uploads/songs/sample-studio.wav'
      };

      const filePath = downloadPaths[downloadType as keyof typeof downloadPaths];

      if (!filePath) {
        return res.status(404).json({ message: "Download not found" });
      }

      // Set headers for download
      res.setHeader('Content-Disposition', `attachment; filename="burnt-beats-${downloadType}.${downloadType.includes('wav') ? 'wav' : 'mp3'}"`);
      res.setHeader('Content-Type', downloadType.includes('wav') ? 'audio/wav' : 'audio/mpeg');

      // Return download URL - you'll integrate with actual file storage
      res.json({
        downloadUrl: filePath,
        message: "Payment successful - download ready",
        expiresIn: "24 hours"
      });

    } catch (error: any) {
      res.status(500).json({ message: "Download error: " + error.message });
    }
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

      // Handle successful payment completion
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const clientReferenceId = session.client_reference_id;

        if (clientReferenceId) {
          // Parse the client reference ID to get purchase details
          const [songId, tier, songTitle] = clientReferenceId.split('_');

          // Generate the appropriate file based on tier
          await generateFileForTier(songId, tier, songTitle);

          // Send download link to customer (you could email this or store in database)
          console.log(`Payment completed for song ${songId}, tier ${tier}`);
          console.log(`Customer email: ${session.customer_details?.email}`);

          // Store purchase record in database
          await storePurchaseRecord({
            sessionId: session.id,
            songId,
            tier,
            songTitle,
            customerEmail: session.customer_details?.email,
            amount: session.amount_total,
            currency: session.currency,
            paymentStatus: session.payment_status
          });
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Webhook processing failed:", error);
      res.status(400).json({ error: "Webhook processing failed" });
    }
  });

  // File delivery endpoint after successful payment
  app.get("/api/download/:sessionId/:tier", async (req: Request, res: Response) => {
    try {
      const { sessionId, tier } = req.params;

      // Verify the session exists and payment was successful
      const purchase = await verifyPurchaseSession(sessionId);

      if (!purchase) {
        return res.status(404).json({ error: "Purchase not found or payment not completed" });
      }

      // Validate purchase for clean track access
      const canAccessClean = WatermarkService.validatePurchaseForCleanTrack(sessionId, tier);

      if (!canAccessClean) {
        return res.status(403).json({ error: "Purchase validation failed" });
      }

      // Generate appropriate version based on tier and purchase
      const originalPath = getOriginalFilePath(purchase.songId);
      let filePath: string;

      if (tier === 'bonus') {
        // Bonus tier includes watermark but is still purchasable
        filePath = WatermarkService.generateWatermarkedTrack(originalPath, purchase.songId, purchase.songTitle);
      } else {
        // Base and Top tiers get clean versions
        filePath = WatermarkService.generateCleanTrack(originalPath, tier, purchase.songId);
      }

      if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).json({ error: "Audio file not found" });
      }

      // Set download headers
      const fileExtension = tier === 'top' ? 'wav' : 'mp3';
      const filename = tier === 'bonus'
        ? `${purchase.songTitle}_demo.${fileExtension}`
        : `${purchase.songTitle}_${tier}_clean.${fileExtension}`;

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', tier === 'top' ? 'audio/wav' : 'audio/mpeg');

      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

    } catch (error: any) {
      console.error("Download error:", error);
      res.status(500).json({ error: "Download failed: " + error.message });
    }
  });

  // Preview endpoint - always serves watermarked version
  app.get("/api/preview/:songId", async (req: Request, res: Response) => {
    try {
      const { songId } = req.params;

      // Get original file path
      const originalPath = getOriginalFilePath(songId);

      if (!fs.existsSync(originalPath)) {
        return res.status(404).json({ error: "Song not found" });
      }

      // Always serve watermarked version for preview
      const watermarkedPath = WatermarkService.generateWatermarkedTrack(originalPath, songId, 'Preview');

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=3600');

      const fileStream = fs.createReadStream(watermarkedPath);
      fileStream.pipe(res);

    } catch (error: any) {
      console.error("Preview error:", error);
      res.status(500).json({ error: "Preview failed: " + error.message });
    }
  });

  // API Documentation Route
  app.get("/api/docs", (req: Request, res: Response) => {
    const apiDocs = {
      title: "Burnt Beats API Documentation",
      version: "1.0.0",
      description: "AI Music Generation Platform API",
      baseUrl: "/api",
      endpoints: {
        health: {
          "GET /health": "Basic health check",
          "GET /system-status": "Detailed system status",
          "GET /api-status": "API endpoints status"
        },
        authentication: {
          "POST /auth/login": "User login",
          "POST /auth/register": "User registration",
          "GET /auth/user": "Get current user",
          "POST /auth/logout": "User logout"
        },
        music: {
          "POST /music/generate": "Generate basic song",
          "POST /music/ai-generate": "Generate AI-enhanced music",
          "POST /music/demo": "Run Music21 demo",
          "GET /music/:id": "Get single song",
          "GET /music": "Get user songs"
        },
        voice: {
          "POST /voice/upload": "Upload voice sample",
          "GET /voice/samples": "Get voice samples",
          "POST /voice/tts": "Text-to-speech generation",
          "POST /voice/clone": "Voice cloning"
        },
        pricing: {
          "GET /pricing/plans": "Get pricing plans",
          "POST /pricing/check-limitations": "Check plan limitations",
          "POST /pricing/upgrade": "Upgrade plan",
          "GET /pricing/subscription/:userId": "Get user subscription"
        }
      }
    };

    res.json(apiDocs);
  });

  // API Routes listing
  app.get("/api", (req: Request, res: Response) => {
    const routes = {
      message: "Welcome to Burnt Beats API",
      version: "1.0.0",
      documentation: "/api/docs",
      status: "/api/health",
      categories: {
        health: "/api/health",
        auth: "/api/auth/*",
        music: "/api/music/*",
        voice: "/api/voice/*",
        pricing: "/api/pricing/*",
        audio: "/api/audio/*"
      },
      timestamp: new Date().toISOString()
    };

    res.json(routes);
  });

  const voiceCloningService = new VoiceCloningService();
  const textToSpeechService = new TextToSpeechService();
  const enhancedVoicePipeline = new EnhancedVoicePipeline();

  // Enhanced Voice Pipeline endpoints
  app.post("/api/voice/generate-enhanced", authenticateOptional, async (req, res) => {
    try {
      const { lyrics, voiceSample, melody, options } = req.body;

      const enhancedVoice = await enhancedVoicePipeline.generateVoiceWithPipeline(
        lyrics,
        voiceSample,
        melody,
        {
          quality: options.quality || 'high',
          realTimeProcessing: options.realTimeProcessing || false,
          neuralEnhancement: options.neuralEnhancement || true,
          spectralCorrection: options.spectralCorrection || true,
          adaptiveFiltering: options.adaptiveFiltering || true,
          ...options
        }
      );

      res.json({
        success: true,
        voice: enhancedVoice,
        message: "Enhanced voice generation completed successfully"
      });
    } catch (error: any) {
      console.error("Enhanced voice generation error:", error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Voice quality analysis endpoint
  app.post("/api/voice/analyze-quality", authenticateOptional, async (req, res) => {
    try {
      const { voiceSample } = req.body;

      // Create pipeline instance for analysis
      const pipeline = new EnhancedVoicePipeline();
      const analysis = await (pipeline as any).analyzeVoiceInput(voiceSample, {});

      res.json({
        success: true,
        analysis,
        message: "Voice quality analysis completed"
      });
    } catch (error: any) {
      console.error("Voice analysis error:", error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Real-time voice processing endpoint
  app.post("/api/voice/process-realtime", authenticateOptional, async (req, res) => {
    try {
      const { audioChunk, processingOptions } = req.body;

      // Process audio chunk in real-time
      const pipeline = new EnhancedVoicePipeline();
      const processed = await (pipeline as any).applyRealTimeEnhancements(audioChunk, processingOptions);

      res.json({
        success: true,
        processedAudio: processed,
        message: "Real-time processing completed"
      });
    } catch (error: any) {
      console.error("Real-time processing error:", error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Voice cloning endpoints
  app.post("/api/voice-clone/generate", authenticateOptional, async (req, res) => {
    // Implementation for voice cloning
    res.status(501).json({ error: "Not implemented" });
  });

  // Audio API Routes temporarily disabled

  // Create HTTP server
  const server = http.createServer(app);

  return server;
}

// Helper functions for Stripe webhook processing
async function generateFileForTier(songId: string, tier: string, songTitle: string) {
  try {
    console.log(`Generating ${tier} quality file for song ${songId}`);

    const qualityMap = {
      'bonus': 'MP3 128kbps',
      'base': 'MP3 320kbps',
      'top': 'WAV 24-bit/96kHz'
    };

    console.log(`File generation requested: ${qualityMap[tier as keyof typeof qualityMap]} for "${songTitle}"`);

    // In a real implementation, you'd:
    // 1. Get the original song file
    // 2. Convert/encode it to the appropriate quality
    // 3. Save it with a unique filename
    // 4. Return the file path

    return `uploads/generated_${songId}_${tier}.${tier === 'top' ? 'wav' : 'mp3'}`;
  } catch (error) {
    console.error('File generation failed:', error);
    throw error;
  }
}

async function storePurchaseRecord(purchaseData: any) {
  try {
    console.log('Storing purchase record:', {
      sessionId: purchaseData.sessionId,
      songId: purchaseData.songId,
      tier: purchaseData.tier,
      customerEmail: purchaseData.customerEmail,
      amount: purchaseData.amount / 100, // Convert from cents
      timestamp: new Date().toISOString()
    });

    const purchaseRecord = {
      id: purchaseData.sessionId,
      ...purchaseData,
      createdAt: new Date().toISOString(),
      downloadCount: 0,
      downloadExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    };

    return purchaseRecord;
  } catch (error) {
    console.error('Failed to store purchase record:', error);
    throw error;
  }
}

async function verifyPurchaseSession(sessionId: string) {
  try {
    console.log(`Verifying purchase session: ${sessionId}`);

    return {
      sessionId,
      songId: 'demo_song',
      songTitle: 'Demo Song',
      tier: 'bonus',
      verified: true,
      downloadExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
  } catch (error) {
    console.error('Purchase verification failed:', error);
    return null;
  }
}

function getFilePathForTier(tier: string, songId: string) {
  const uploadsDir = path.join(process.cwd(), "uploads");

  const fileMap = {
    'bonus': path.join(uploadsDir, `${songId}_bonus_demo.mp3`),
    'base': path.join(uploadsDir, `${songId}_base_clean.mp3`),
    'top': path.join(uploadsDir, `${songId}_top_clean.wav`)
  };

  return fileMap[tier as keyof typeof fileMap] || null;
}

function getOriginalFilePath(songId: string) {
  const uploadsDir = path.join(process.cwd(), "uploads");
  return path.join(uploadsDir, `generated_${songId}.mp3`);
}

export default app;