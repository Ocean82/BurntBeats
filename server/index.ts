import express from "express";
import session from "express-session";
import cors from "cors";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import bonusFeaturesApi from "./api/bonus-features-api";
import { validateEnvironmentVariables } from "./env-check";
import { applyEnvironmentStubs } from "./env-stubs";
import path from "path";
import fs from "fs";
import rateLimit from "express-rate-limit";
import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import helmet from "helmet";
import compression from "compression";

// Initialize Express app
const app = express();
const port = process.env.NODE_ENV === 'production' 
  ? parseInt(process.env.PORT || '80', 10)
  : parseInt(process.env.PORT || '5000', 10);

// Apply environment stubs for development
if (process.env.NODE_ENV !== 'production') {
  applyEnvironmentStubs();
}

// Validate environment variables
const envStatus = validateEnvironmentVariables();

// ======================
// SECURITY MIDDLEWARE
// ======================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://*.your-domain.com"],
      connectSrc: ["'self'", "ws://localhost:*", "wss://your-domain.com"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Trust proxy for production deployment
app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : false);

// ======================
// CORS CONFIGURATION
// ======================
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
};

app.use(cors(corsOptions));

// ======================
// BODY PARSING
// ======================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ======================
// SESSION CONFIGURATION
// ======================
app.use(session({
  secret: process.env.SESSION_SECRET || 'burnt-beats-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  },
  name: 'burntBeats.sid',
  proxy: process.env.NODE_ENV === 'production'
}));

// ======================
// RATE LIMITING
// ======================
const generationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 generations per 15 minutes per IP
  message: {
    error: "Too many generation requests, please try again later",
    retryAfter: "15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes per IP
  message: {
    error: "Too many requests, please try again later"
  }
});

app.use('/api', apiLimiter);
app.use('/api/music/generate', generationLimiter);
app.use('/api/generate', generationLimiter);

// ======================
// AUTHENTICATION MIDDLEWARE
// ======================
export const requireAuth = (req: any, res: any, next: any) => {
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  if (req.session?.user || req.headers.authorization) {
    return next();
  }

  return res.status(401).json({ 
    error: "Authentication required",
    message: "Please log in to access this feature"
  });
};

export const optionalAuth = (req: any, res: any, next: any) => {
  if (req.session?.user) {
    req.user = req.session.user;
  }
  next();
};

// ======================
// FILE HANDLING
// ======================
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', (req, res, next) => {
  const ext = path.extname(req.path).toLowerCase();
  if (['.mp3', '.wav', '.m4a', '.ogg'].includes(ext)) {
    res.setHeader('Content-Type', `audio/${ext.slice(1)}`);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }
  next();
}, express.static(uploadsDir));

// ======================
// WEBSOCKET SERVER
// ======================
const server = createServer(app);
const wss = new WebSocketServer({ server });
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const CLIENT_TIMEOUT = 60000; // 60 seconds

interface ExtendedWebSocket extends WebSocket {
  isAlive?: boolean;
  lastSeen?: number;
  clientId?: string;
}

wss.on('connection', (ws: ExtendedWebSocket, req: IncomingMessage) => {
  console.log('🔌 WebSocket client connected');

  // Initialize client state
  ws.isAlive = true;
  ws.lastSeen = Date.now();
  ws.clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  ws.send(JSON.stringify({
    type: 'connection_established',
    clientId: ws.clientId,
    heartbeatInterval: HEARTBEAT_INTERVAL
  }));

  ws.on('message', async (message: Buffer) => {
    try {
      ws.lastSeen = Date.now();

      // Validate message format
      let data;
      try {
        data = JSON.parse(message.toString());
      } catch (e) {
        throw new Error('Invalid JSON format');
      }

      if (!data.type) {
        throw new Error('Missing message type');
      }

      // Handle different message types
      switch (data.type) {
        case 'ping':
          ws.send(JSON.stringify({
            type: 'pong',
            timestamp: Date.now()
          }));
          break;

        case 'pong':
          ws.isAlive = true;
          break;

        case 'progress_request':
          ws.send(JSON.stringify({
            type: 'progress_update',
            songId: data.songId,
            progress: 75,
            stage: 'finalizing'
          }));
          break;

        case 'collaboration_event':
          wss.clients.forEach((client: ExtendedWebSocket) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'collaboration_update',
                event: data.event,
                userId: data.userId,
                timestamp: Date.now()
              }));
            }
          });
          break;

        default:
          console.log('Unknown WebSocket message type:', data.type);
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: error.message || 'Invalid message'
      }));
    }
  });

  ws.on('close', () => {
    console.log(`🔌 WebSocket client ${ws.clientId} disconnected`);
  });

  ws.on('error', (error: Error) => {
    console.error(`WebSocket error for client ${ws.clientId}:`, error);
  });

  ws.on('pong', () => {
    ws.isAlive = true;
    ws.lastSeen = Date.now();
  });
});

// Heartbeat mechanism
const heartbeatInterval = setInterval(() => {
  const now = Date.now();

  wss.clients.forEach((ws: ExtendedWebSocket) => {
    if (ws.isAlive === false || (ws.lastSeen && now - ws.lastSeen > CLIENT_TIMEOUT)) {
      console.log(`🔌 Terminating unresponsive client ${ws.clientId}`);
      return ws.terminate();
    }

    ws.isAlive = false;
    try {
      ws.ping();
      ws.send(JSON.stringify({
        type: 'ping',
        timestamp: now
      }));
    } catch (error) {
      console.error(`Failed to ping client ${ws.clientId}:`, error);
      ws.terminate();
    }
  });
}, HEARTBEAT_INTERVAL);

// ======================
// HEALTH CHECK (before other routes)
// ======================
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    port: port,
    websocketClients: wss.clients.size
  });
});

// ======================
// ROUTES AND API ENDPOINTS (ASYNC REGISTRATION)
// ======================
async function initializeRoutes() {
  console.log('🔧 Registering routes...');
  
  // Add a simple test route first
  app.get('/api/test', (req, res) => {
    res.json({ message: 'Test route working', timestamp: new Date().toISOString() });
  });
  console.log('✅ Test route added');
  
  try {
    await registerRoutes(app);
    console.log('✅ Routes registered successfully');
  } catch (error) {
    console.error('❌ Route registration failed:', error);
  }

  console.log('🔧 Adding bonus features API...');
  app.use('/api', bonusFeaturesApi);

  // Webhook test endpoint
  try {
    const webhookTestApi = await import("./api/webhook-test");
    app.use('/', webhookTestApi.default);
  } catch (error) {
    console.warn('⚠️ Webhook test API not available:', error);
  }
}

// ======================
// STATIC FILE SERVING
// ======================
if (process.env.NODE_ENV === 'production') {
  // Try multiple possible frontend build locations
  const possiblePaths = [
    path.join(process.cwd(), 'dist', 'public'),
    path.join(process.cwd(), 'client', 'dist'),
    path.join(process.cwd(), 'dist')
  ];
  
  let frontendPath = null;
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(path.join(possiblePath, 'index.html'))) {
      frontendPath = possiblePath;
      break;
    }
  }
  
  if (frontendPath) {
    app.use(express.static(frontendPath, {
      maxAge: '1y',
      etag: true,
      lastModified: true
    }));
    console.log('🎯 Serving frontend UI from:', frontendPath);

    // SPA fallback - ONLY for frontend routes, not API
    app.get('*', (req, res, next) => {
      // Skip SPA fallback for API routes entirely
      if (req.path.startsWith('/api/')) {
        return next();
      }
      
      const indexPath = path.join(frontendPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Page not found');
      }
    });
  } else {
    console.warn('⚠️ Frontend build not found in any expected location');
    console.warn('Checked paths:', possiblePaths);
  }
} else {
  // Development mode - use Vite middleware
  console.log('🔧 Development mode - using Vite dev server');
}



// ======================
// ERROR HANDLING
// ======================
app.use((err: Error, req: any, res: any, next: any) => {
  console.error('Server error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Initialize voice cloning service and voice bank
import { VoiceCloningService } from './services/voice-cloning-service';
import { Logger } from './utils/logger';

// Initialize voice bank on startup
(async () => {
  try {
    const voiceService = VoiceCloningService.getInstance();
    await voiceService.initializeVoiceBank();
    Logger.info('Voice bank initialized successfully');
  } catch (error) {
    Logger.error('Failed to initialize voice bank', error);
  }
})();

// Enhanced music generation endpoint
app.post('/api/generate', requireAuth, async (req, res) => {
  try {
    const { title, lyrics, genre, tempo, key, duration, mood, vocalStyle, singingStyle, tone } = req.body;
    
    // Simulate song generation with proper response structure
    const songDetails = {
      id: Date.now(),
      title: title || "Generated Song",
      lyrics: lyrics || "",
      genre: genre || "Pop",
      tempo: tempo || 120,
      key: key || "C",
      duration: duration || 30,
      mood: mood || "happy",
      vocalStyle: vocalStyle || "smooth",
      singingStyle: singingStyle || "melodic",
      tone: tone || "warm",
      status: "completed",
      generationProgress: 100,
      generatedAudioPath: "/uploads/demo-song.mp3",
      audioUrl: "/uploads/demo-song.mp3",
      previewUrl: "/uploads/demo-song.mp3",
      sections: {
        intro: { start: 0, end: 5, label: "Intro" },
        verse1: { start: 5, end: 15, label: "Verse 1" },
        chorus: { start: 15, end: 25, label: "Chorus" },
        outro: { start: 25, end: 30, label: "Outro" }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Send back the generated song details
    res.status(200).json(songDetails);

  } catch (error) {
    console.error("Error generating song:", error);
    res.status(500).json({
      error: "Failed to generate song",
      message: error.message
    });
  }
});

// ======================
// ASYNC SERVER STARTUP
// ======================
async function startServer() {
  // Wait for routes to be initialized
  await initializeRoutes();
  
  // Start the server after routes are ready
  server.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Burnt Beats server running on http://0.0.0.0:${port}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`📊 Environment status:`, JSON.stringify(envStatus, null, 2));
    console.log('🎵 Ready to create amazing music!');
  });
}

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// ======================
// GRACEFUL SHUTDOWN
// ======================
function shutdown() {
  console.log('Shutting down gracefully...');

  clearInterval(heartbeatInterval);

  wss.clients.forEach(client => {
    client.close(1001, 'Server shutting down');
  });

  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);