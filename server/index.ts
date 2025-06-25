import express from "express";
import session from "express-session";
import cors from "cors";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { validateEnvironmentVariables } from "./env-check";
import path from "path";
import fs from "fs";
import rateLimit from "express-rate-limit";

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