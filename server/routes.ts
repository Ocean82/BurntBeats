import express, { type Request, Response } from "express";
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
        pricing: "/api/pricing/*"
      },
      timestamp: new Date().toISOString()
    };

    res.json(routes);
  });

  // Create HTTP server
  const server = http.createServer(app);

  return server;
}

export default app;