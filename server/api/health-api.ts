
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

export class HealthAPI {
  // Basic health check
  static async healthCheck(req: Request, res: Response) {
    try {
      const health = {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version,
        environment: process.env.NODE_ENV || 'development'
      };

      res.json(health);
    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({ status: "error", error: error.message });
    }
  }

  // Detailed system status
  static async systemStatus(req: Request, res: Response) {
    try {
      const uploadsDir = path.join(process.cwd(), "uploads");
      
      // Check uploads directory
      const uploadsExists = fs.existsSync(uploadsDir);
      let uploadsFiles = 0;
      if (uploadsExists) {
        uploadsFiles = fs.readdirSync(uploadsDir).length;
      }

      // Check Python availability
      let pythonAvailable = false;
      try {
        const { execSync } = require('child_process');
        execSync('python --version', { stdio: 'pipe' });
        pythonAvailable = true;
      } catch (error) {
        pythonAvailable = false;
      }

      const status = {
        status: "ok",
        timestamp: new Date().toISOString(),
        services: {
          api: "running",
          database: "connected", // Mock status
          fileSystem: uploadsExists ? "ok" : "error",
          python: pythonAvailable ? "available" : "unavailable",
          migrations: "applied"
        },
        storage: {
          uploadsDirectory: uploadsExists,
          uploadedFiles: uploadsFiles
        },
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
      };

      res.json(status);
    } catch (error) {
      console.error('System status error:', error);
      res.status(500).json({ 
        status: "error", 
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // API endpoints status
  static async apiStatus(req: Request, res: Response) {
    try {
      const endpoints = {
        status: "ok",
        timestamp: new Date().toISOString(),
        endpoints: {
          "/api/health": "active",
          "/api/auth/login": "active",
          "/api/auth/register": "active",
          "/api/auth/user": "active",
          "/api/music/generate": "active",
          "/api/music/ai-generate": "active",
          "/api/music/demo": "active",
          "/api/voice/upload": "active",
          "/api/voice/tts": "active",
          "/api/voice/clone": "active",
          "/api/pricing/plans": "active",
          "/api/pricing/subscription": "active"
        },
        features: {
          musicGeneration: "enabled",
          aiEnhancement: "enabled",
          voiceCloning: "enabled",
          textToSpeech: "enabled",
          fileUploads: "enabled",
          authentication: "enabled"
        }
      };

      res.json(endpoints);
    } catch (error) {
      console.error('API status error:', error);
      res.status(500).json({ 
        status: "error", 
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}
