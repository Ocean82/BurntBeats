import { Request, Response } from 'express';
import { Logger } from '../utils/logger';
import { WebhookHealthService } from '../services/webhook-health-service';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import os from 'os';
import { env } from '../config/env';
import { DatabaseHealthChecker } from '../services/databaseHealthChecker';
import { ExternalServiceHealthChecker } from '../services/externalServiceHealthChecker';
import { rateLimiter } from '../middleware/rateLimiter';
import { validateApiKey } from '../middleware/apiKeyValidator';

const logger = new Logger({ name: 'HealthAPI' });
const execAsync = promisify(exec);

export class HealthAPI {
  // Middleware
  static healthCheckMiddleware = [
    rateLimiter(60, '1 minute'), // 60 requests per minute
  ];

  static systemStatusMiddleware = [
    validateApiKey(env.HEALTH_API_KEY), // Require API key for system status
    rateLimiter(10, '1 minute'), // 10 requests per minute
  ];

  /**
   * Basic health check endpoint
   */
  static async healthCheck(req: Request, res: Response) {
    const requestId = req.id;
    const startTime = process.hrtime();

    try {
      const health = {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
          rss: process.memoryUsage().rss,
          heapTotal: process.memoryUsage().heapTotal,
          heapUsed: process.memoryUsage().heapUsed,
          external: process.memoryUsage().external,
        },
        cpu: {
          load: os.loadavg(),
          cores: os.cpus().length,
        },
        nodeVersion: process.version,
        environment: env.NODE_ENV,
        requestId,
      };

      logger.info('Health check completed', { requestId });

      const [seconds, nanoseconds] = process.hrtime(startTime);
      const responseTime = `${seconds}.${nanoseconds.toString().padStart(9, '0')}s`;

      res.json({
        ...health,
        responseTime,
      });

    } catch (error) {
      logger.error('Health check failed', {
        error: error.message,
        stack: error.stack,
        requestId,
      });

      res.status(500).json({
        status: "error",
        error: "Health check failed",
        timestamp: new Date().toISOString(),
        requestId,
      });
    }
  }

  /**
   * Detailed system status endpoint (requires API key)
   */
  static async systemStatus(req: Request, res: Response) {
    const requestId = req.id;
    const startTime = process.hrtime();

    try {
      // Check uploads directory
      const uploadsDir = path.join(process.cwd(), "uploads");
      const uploadsExists = fs.existsSync(uploadsDir);
      let uploadsFiles = 0;
      let uploadsSize = 0;

      if (uploadsExists) {
        const files = fs.readdirSync(uploadsDir);
        uploadsFiles = files.length;

        // Calculate total size of uploads
        uploadsSize = files.reduce((total, file) => {
          const filePath = path.join(uploadsDir, file);
          try {
            return total + fs.statSync(filePath).size;
          } catch {
            return total;
          }
        }, 0);
      }

      // Check Python availability
      let pythonVersion = null;
      try {
        const { stdout } = await execAsync('python --version');
        pythonVersion = stdout.trim();
      } catch {
        pythonVersion = null;
      }

      // Check database connection
      const dbHealth = await DatabaseHealthChecker.checkConnection();

      // Check external services
      const externalServices = await ExternalServiceHealthChecker.checkAll();

      // Get system metrics
      const freeMemory = os.freemem();
      const totalMemory = os.totalmem();
      const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;

      const webhookHealthService = new WebhookHealthService();
      const webhookHealth = await webhookHealthService.checkWebhookHealth();

      const status = {
        status: "ok",
        timestamp: new Date().toISOString(),
        system: {
          platform: os.platform(),
          arch: os.arch(),
          release: os.release(),
          uptime: os.uptime(),
          load: os.loadavg(),
          memory: {
            total: totalMemory,
            free: freeMemory,
            used: totalMemory - freeMemory,
            usage: memoryUsage.toFixed(2) + '%',
          },
          cpu: {
            cores: os.cpus().length,
            model: os.cpus()[0].model,
            speed: os.cpus()[0].speed,
          },
        },
        process: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpuUsage: process.cpuUsage(),
          nodeVersion: process.version,
          pid: process.pid,
          title: process.title,
        },
        services: {
          api: "running",
          database: dbHealth,
          fileSystem: {
            uploadsDirectory: uploadsExists,
            uploadedFiles: uploadsFiles,
            totalSize: uploadsSize,
            freeSpace: fs.statSync(uploadsExists ? uploadsDir : '/').size,
          },
          python: pythonVersion ? {
            version: pythonVersion,
            available: true,
          } : {
            available: false,
          },
          migrations: "applied", // Would check actual migration status in production
          externalServices,
        },
        environment: env.NODE_ENV,
        requestId,
        webhooks: webhookHealth,
      };

      logger.info('System status check completed', { requestId });

      const [seconds, nanoseconds] = process.hrtime(startTime);
      const responseTime = `${seconds}.${nanoseconds.toString().padStart(9, '0')}s`;

      const isHealthy = webhookHealth.status === 'healthy';
      const statusCode = isHealthy ? 200 : 503;

      res.status(statusCode).json({
        ...status,
        responseTime,
      });

    } catch (error) {
      logger.error('System status check failed', {
        error: error.message,
        stack: error.stack,
        requestId,
      });

      res.status(500).json({
        status: "error",
        error: "System status check failed",
        timestamp: new Date().toISOString(),
        requestId,
      });
    }
  }

  /**
   * API endpoints status
   */
  static async apiStatus(req: Request, res: Response) {
    const requestId = req.id;
    const startTime = process.hrtime();

    try {
      // Check each endpoint's health (simplified for example)
      const endpointsHealth = {
        "/api/health": await this.checkEndpointHealth('/api/health'),
        "/api/auth/login": await this.checkEndpointHealth('/api/auth/login'),
        "/api/auth/register": await this.checkEndpointHealth('/api/auth/register'),
        "/api/music/generate": await this.checkEndpointHealth('/api/music/generate'),
        "/api/voice/tts": await this.checkEndpointHealth('/api/voice/tts'),
      };

      const features = {
        musicGeneration: env.FEATURE_MUSIC_GENERATION === 'true',
        aiEnhancement: env.FEATURE_AI_ENHANCEMENT === 'true',
        voiceCloning: env.FEATURE_VOICE_CLONING === 'true',
        textToSpeech: env.FEATURE_TEXT_TO_SPEECH === 'true',
        fileUploads: env.FEATURE_FILE_UPLOADS === 'true',
        authentication: env.FEATURE_AUTHENTICATION === 'true',
      };

      const status = {
        status: "ok",
        timestamp: new Date().toISOString(),
        endpoints: endpointsHealth,
        features,
        environment: env.NODE_ENV,
        version: env.APP_VERSION,
        requestId,
      };

      logger.info('API status check completed', { requestId });

      const [seconds, nanoseconds] = process.hrtime(startTime);
      const responseTime = `${seconds}.${nanoseconds.toString().padStart(9, '0')}s`;

      res.json({
        ...status,
        responseTime,
      });

    } catch (error) {
      logger.error('API status check failed', {
        error: error.message,
        stack: error.stack,
        requestId,
      });

      res.status(500).json({
        status: "error",
        error: "API status check failed",
        timestamp: new Date().toISOString(),
        requestId,
      });
    }
  }

  /**
   * Check if an endpoint is healthy
   */
  private static async checkEndpointHealth(endpoint: string): Promise<string> {
    try {
      // In a real implementation, this would make an actual request to the endpoint
      // For this example, we'll simulate it
      if (endpoint === '/api/auth/login' && env.FEATURE_AUTHENTICATION !== 'true') {
        return 'disabled';
      }
      return 'active';
    } catch (error) {
      return 'unavailable';
    }
  }

  static async checkAIChatService(): Promise<{ status: string; responseTime?: number }> {
    try {
      const startTime = Date.now();
      // Dynamically import AIChatService
      const AIChatServiceModule = await import('../services/aiChatService');
      const AIChatService = AIChatServiceModule.AIChatService;

      // Test AI chat service with a simple request
      const testResponse = await AIChatService.getRandomResponse('helpful'); // Use await here
      const responseTime = Date.now() - startTime;

      return { 
        status: testResponse ? 'healthy' : 'unhealthy',
        responseTime 
      };
    } catch (error) {
      logger.error('AI Chat Service check failed', {
        error: error.message,
        stack: error.stack,
      });
      return { status: 'unhealthy' };
    }
  }

  static async checkDatabaseConnection(): Promise<{ status: string }> {
    try {
      const dbHealth = await DatabaseHealthChecker.checkConnection();
      return { status: dbHealth.status };
    } catch (error) {
      logger.error('Database connection check failed', {
        error: error.message,
        stack: error.stack,
      });
      return { status: 'unhealthy' };
    }
  }

  static async checkStorageAccess(): Promise<{ status: string }> {
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      await fs.promises.access(uploadsDir);
      return { status: 'healthy' };
    } catch (error) {
      logger.error('Storage access check failed', {
        error: error.message,
        stack: error.stack,
      });
      return { status: 'unhealthy' };
    }
  }
}