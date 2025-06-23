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
import { HealthAPI } from "./api/health-api";
// Audio service imports removed temporarily
import { VocalGenerator } from "./vocal-generator";
import { VoiceCloningService } from "./voice-cloning-service";
import { TextToSpeechService } from "./text-to-speech-service";
import { EnhancedVoicePipeline } from "./enhanced-voice-pipeline";
import { isAuthenticated } from "./replitAuth";
import { validateEnvironmentVariables } from "./env-check";

// Add authenticateOptional middleware
const authenticateOptional = (req: any, res: Response, next: NextFunction) => {
  // Optional authentication - doesn't require user to be logged in
  // but adds user info if available
  if (req.session?.user) {
    req.user = req.session.user;
  }
  next();
};

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

  // Music Generation API Routes
  app.post("/api/music/generate", MusicAPI.generateSong);
  app.post("/api/music/ai-generate", MusicAPI.generateAIMusic);
  app.post("/api/music/demo", MusicAPI.generateMusic21Demo);
  app.get("/api/music/:id", MusicAPI.getSong);
  app.get("/api/music", MusicAPI.getUserSongs);

  // Legacy music routes for compatibility
  app.post("/api/songs/generate", MusicAPI.generateSong);
  app.post("/api/generate-ai-music", MusicAPI.generateAIMusic);
  app.post("/api/demo-music21", MusicAPI.generateMusic21Demo);
  app.get("/api/songs/single/:id", MusicAPI.getSong);
  app.get("/api/songs", MusicAPI.getUserSongs);

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

  // Stripe Payment Routes
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
      const { StripeService } = await import("./stripe-service");
      const signature = req.headers['stripe-signature'] as string;
      await StripeService.handleWebhook(req.body, signature);
      res.json({ received: true });
    } catch (error) {
      console.error("Webhook processing failed:", error);
      res.status(400).json({ error: "Webhook processing failed" });
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

export default app;