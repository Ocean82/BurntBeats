import express from "express";
import session from "express-session";
import cors from "cors";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { validateEnvironmentVariables } from "./env-check";
import path from "path";
import fs from "fs";
import rateLimit from "express-rate-limit";
import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';

const app = express();
const port = 5000;

// Validate environment variables
const envStatus = validateEnvironmentVariables();

// Initialize file cleanup service in production
if (process.env.NODE_ENV === 'production') {
  const { fileCleanupService } = require('./file-cleanup-service');
  fileCleanupService.start();
}

// Rate limiting for generation endpoints
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

// General API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes per IP
  message: {
    error: "Too many requests, please try again later"
  }
});

// Basic middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Apply rate limiting
app.use('/api', apiLimiter);
app.use('/api/music/generate', generationLimiter);
app.use('/api/generate', generationLimiter);

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'burnt-beats-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Authentication middleware
const requireAuth = (req: any, res: any, next: any) => {
  // For now, allow all requests in development
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  // In production, check for valid session or token
  if (req.session?.user || req.headers.authorization) {
    return next();
  }

  return res.status(401).json({ 
    error: "Authentication required",
    message: "Please log in to access this feature"
  });
};

// Optional auth middleware (doesn't block, just adds user info)
const optionalAuth = (req: any, res: any, next: any) => {
  if (req.session?.user) {
    req.user = req.session.user;
  }
  next();
};

// Static file serving with better error handling
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploads with proper headers
app.use('/uploads', (req, res, next) => {
  // Set appropriate headers for audio files
  const ext = path.extname(req.path).toLowerCase();
  if (['.mp3', '.wav', '.m4a', '.ogg'].includes(ext)) {
    res.setHeader('Content-Type', `audio/${ext.slice(1)}`);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }
  next();
}, express.static(uploadsDir));

// Export middleware for use in routes
export { requireAuth, optionalAuth };

// WebSocket handling for real-time features with heartbeat
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

  // Send welcome message with heartbeat info
  ws.send(JSON.stringify({
    type: 'connection_established',
    clientId: ws.clientId,
    heartbeatInterval: HEARTBEAT_INTERVAL
  }));

  ws.on('message', async (message: Buffer) => {
    try {
      ws.lastSeen = Date.now();

      // Validate WebSocket message
      const { validateWebSocketMessage } = await import('./middleware/music-error-handler');
      const validation = validateWebSocketMessage(message.toString());

      if (!validation.success) {
        ws.send(JSON.stringify({
          type: 'error',
          message: `Message validation failed: ${validation.error}`,
          code: 'INVALID_MESSAGE'
        }));
        return;
      }

      const data = validation.data;

      // Handle different message types
      switch (data.type) {
        case 'ping':
          // Respond to client ping with pong
          ws.send(JSON.stringify({
            type: 'pong',
            timestamp: Date.now()
          }));
          break;

        case 'pong':
          // Client responded to our ping
          ws.isAlive = true;
          break;

        case 'progress_request':
          // Send progress updates for song generation
          ws.send(JSON.stringify({
            type: 'progress_update',
            songId: data.songId,
            progress: 75,
            stage: 'finalizing'
          }));
          break;

        case 'collaboration_event':
          // Broadcast to other clients (future feature)
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
      console.error('WebSocket message parsing error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });

  ws.on('close', () => {
    console.log(`🔌 WebSocket client ${ws.clientId} disconnected`);
  });

  ws.on('error', (error: Error) => {
    console.error(`WebSocket error for client ${ws.clientId}:`, error);
  });

  // Handle pong messages to track client responsiveness
  ws.on('pong', () => {
    ws.isAlive = true;
    ws.lastSeen = Date.now();
  });
});

// Heartbeat mechanism to detect and clean up dead connections
const heartbeatInterval = setInterval(() => {
  const now = Date.now();

  wss.clients.forEach((ws: ExtendedWebSocket) => {
    // Check if client is responsive
    if (ws.isAlive === false || (ws.lastSeen && now - ws.lastSeen > CLIENT_TIMEOUT)) {
      console.log(`🔌 Terminating unresponsive client ${ws.clientId}`);
      return ws.terminate();
    }

    // Send ping to check if client is alive
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

// Clean up heartbeat interval on server shutdown
process.on('SIGTERM', () => {
  clearInterval(heartbeatInterval);
});

process.on('SIGINT', () => {
  clearInterval(heartbeatInterval);
});

// Register routes before starting server
registerRoutes(app);

// Serve static files from dist/public in production or development
const publicPath = path.join(process.cwd(), 'dist', 'public');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
  console.log('📁 Serving static files from:', publicPath);
  
  // Catch-all handler for SPA
  app.get('*', (req, res) => {
    const indexPath = path.join(publicPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Page not found');
    }
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    port: port
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Burnt Beats server running on http://0.0.0.0:${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`📊 Environment status:`, JSON.stringify(envStatus, null, 2));
  console.log('🎵 Ready to create amazing music!');
});