import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    username?: string;
    plan: string;
  };
}

// Authentication middleware to verify user identity
export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Check for Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Missing or invalid authorization header' 
      });
    }

    // Extract token (in production this would be a JWT)
    const token = authHeader.substring(7);
    
    // For development, we'll use the token as user ID directly
    // In production, you'd verify JWT and extract user ID
    const userId = token;
    
    if (!userId) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Invalid token format' 
      });
    }

    // Fetch user from database
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'User not found' 
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email || undefined,
      username: user.username || undefined,
      plan: user.plan || 'free'
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Authentication failed' 
    });
  }
};

// Authorization middleware to check ownership
export const authorizeOwnership = (resourceType: 'song' | 'voiceSample' | 'voiceClone') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Unauthorized', 
          message: 'User not authenticated' 
        });
      }

      const resourceId = req.params.id;
      if (!resourceId) {
        return res.status(400).json({ 
          error: 'Bad Request', 
          message: 'Resource ID required' 
        });
      }

      let resource;
      
      switch (resourceType) {
        case 'song':
          resource = await storage.getSong(parseInt(resourceId));
          break;
        case 'voiceSample':
          resource = await storage.getVoiceSample(parseInt(resourceId));
          break;
        case 'voiceClone':
          resource = await storage.getVoiceClone(parseInt(resourceId));
          break;
        default:
          return res.status(400).json({ 
            error: 'Bad Request', 
            message: 'Invalid resource type' 
          });
      }

      if (!resource) {
        return res.status(404).json({ 
          error: 'Not Found', 
          message: `${resourceType} not found` 
        });
      }

      // Check ownership
      if (resource.userId !== req.user.id) {
        return res.status(403).json({ 
          error: 'Forbidden', 
          message: `You don't have permission to access this ${resourceType}` 
        });
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'Authorization check failed' 
      });
    }
  };
};

// Plan-based authorization middleware
export const authorizePlan = (requiredPlan: 'free' | 'basic' | 'pro' | 'enterprise') => {
  const planHierarchy = { free: 0, basic: 1, pro: 2, enterprise: 3 };
  
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'User not authenticated' 
      });
    }

    const userPlanLevel = planHierarchy[req.user.plan as keyof typeof planHierarchy] || 0;
    const requiredPlanLevel = planHierarchy[requiredPlan];

    if (userPlanLevel < requiredPlanLevel) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: `This feature requires ${requiredPlan} plan or higher. Current plan: ${req.user.plan}`,
        requiredPlan,
        currentPlan: req.user.plan
      });
    }

    next();
  };
};

// Rate limiting middleware based on user plan
export const rateLimitByPlan = (limits: {
  free: number;
  basic: number;
  pro: number;
  enterprise: number;
}) => {
  const requestCounts = new Map<string, { count: number; resetTime: number }>();
  
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'User not authenticated' 
      });
    }

    const userId = req.user.id;
    const userPlan = req.user.plan as keyof typeof limits;
    const limit = limits[userPlan] || limits.free;
    
    const now = Date.now();
    const hourInMs = 60 * 60 * 1000;
    
    let userRequests = requestCounts.get(userId);
    
    if (!userRequests || now > userRequests.resetTime) {
      userRequests = { count: 0, resetTime: now + hourInMs };
      requestCounts.set(userId, userRequests);
    }
    
    if (userRequests.count >= limit) {
      return res.status(429).json({ 
        error: 'Too Many Requests', 
        message: `Rate limit exceeded. ${limit} requests per hour for ${userPlan} plan`,
        limit,
        resetTime: userRequests.resetTime
      });
    }
    
    userRequests.count++;
    next();
  };
};

// API key validation middleware (for external integrations)
export const validateApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'API key required' 
      });
    }

    // Validate API key format and existence
    if (!apiKey.startsWith('bb_') || apiKey.length < 32) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Invalid API key format' 
      });
    }

    // In production, you'd validate against stored API keys
    // For now, we'll accept any properly formatted key
    next();
  } catch (error) {
    console.error('API key validation error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'API key validation failed' 
    });
  }
};

// CORS and security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const method = req.method;
    const url = req.url;
    const status = res.statusCode;
    const userAgent = req.headers['user-agent'] || 'Unknown';
    
    console.log(`[${new Date().toISOString()}] ${method} ${url} ${status} ${duration}ms - ${userAgent}`);
  });
  
  next();
};