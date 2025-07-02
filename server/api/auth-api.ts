
import { Request, Response } from 'express';
import { 
  login, 
  register, 
  logout, 
  getCurrentUser, 
  forgotPassword, 
  resetPassword, 
  checkUsername 
} from '../auth';

export class AuthAPI {
  // Login endpoint
  static async login(req: Request, res: Response) {
    return await login(req, res);
  }

  // Register endpoint
  static async register(req: Request, res: Response) {
    return await register(req, res);
  }

  // Logout endpoint
  static async logout(req: Request, res: Response) {
    return await logout(req, res);
  }

  // Get current user endpoint
  static async getCurrentUser(req: Request, res: Response) {
    return await getCurrentUser(req, res);
  }

  // Forgot password endpoint
  static async forgotPassword(req: Request, res: Response) {
    return await forgotPassword(req, res);
  }

  // Reset password endpoint  
  static async resetPassword(req: Request, res: Response) {
    return await resetPassword(req, res);
  }

  // Check username availability endpoint
  static async checkUsername(req: Request, res: Response) {
    return await checkUsername(req, res);
  }

  // Legacy admin login for existing tests
  static async adminLogin(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      // Admin backdoor - use environment variables or fallback to defaults
      const adminUsername = process.env.ADMIN_USERNAME || 'burntbeats_admin';
      const adminPassword = process.env.ADMIN_PASSWORD || 'FireTracks2024!';
      
      if (username === adminUsername && password === adminPassword) {
        const adminUser = {
          id: 999,
          username: 'burntbeats_admin',
          email: 'admin@burntbeats.app',
          plan: 'enterprise',
          totalSongsCreated: 0,
          totalDownloads: 0,
          songsThisMonth: 0,
          features: {
            voiceCloning: true,
            advancedEditing: true,
            collaboration: true,
            analytics: true,
            versionControl: true,
            socialFeatures: true,
            musicTheoryTools: true,
            allFeaturesUnlocked: true,
            commercialUse: true,
            prioritySupport: true,
            apiAccess: true,
            customIntegrations: true,
            neuralSynthesis: true,
            multilingualTTS: true,
            realTimePreview: true,
            professionalVocoding: true
          }
        };

        console.log('🔥 Admin login successful');
        return res.json({ success: true, user: adminUser, token: 'admin-token' });
      }

      // For demo purposes, return mock user
      const user = {
        id: 1,
        username: username,
        email: `${username}@example.com`,
        plan: 'free',
        totalSongsCreated: 0,
        totalDownloads: 0,
        songsThisMonth: 0,
        features: {
          voiceCloning: true,
          advancedEditing: true,
          collaboration: true,
          analytics: true,
          versionControl: true,
          socialFeatures: true,
          musicTheoryTools: true,
          allFeaturesUnlocked: true
        }
      };

      res.json({ success: true, user, token: 'demo-token' });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  // Register endpoint
  static async register(req: Request, res: Response) {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      // For demo purposes, return success
      const user = {
        id: Date.now(),
        username,
        email,
        plan: "free",
        songsGenerated: 0,
        maxSongs: 3,
        features: {
          voiceCloning: true,
          advancedEditing: true,
          collaboration: true,
          analytics: true,
          versionControl: true,
          socialFeatures: true,
          musicTheoryTools: true,
          allFeaturesUnlocked: true,
          prioritySupport: false,
          customization: false
        }
      };

      res.json({ success: true, user, token: 'demo-token' });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  // Get current user
  static async getCurrentUser(req: Request, res: Response) {
    try {
      // Mock user for development
      const user = {
        id: 1,
        username: "demo_user",
        email: "demo@example.com",
        totalSongsCreated: 0,
        totalDownloads: 0,
        features: {
          voiceCloning: true,
          advancedEditing: true,
          collaboration: true,
          analytics: true,
          versionControl: true,
          socialFeatures: true,
          musicTheoryTools: true,
          allFeaturesUnlocked: true
        }
      };
      res.json(user);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to get user' });
    }
  }

  // Logout endpoint
  static async logout(req: Request, res: Response) {
    try {
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  }

  // Accept user agreement endpoint
  static async acceptAgreement(req: Request, res: Response) {
    try {
      const { userId, username, email, accepted, acceptedAt, ipAddress, userAgent } = req.body;

      if (!userId || !username || !email || !accepted) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Create compressed record for filing system
      const agreementRecord = {
        id: require('@paralleldrive/cuid2').createId(),
        userId,
        username,
        email,
        acceptedAt,
        ipAddress: ipAddress || 'unknown',
        userAgent: userAgent || 'unknown',
        agreementText: '🔥 Burnt Beats Contributor Acknowledgment & Usage Agreement - User has read and accepted all terms including usage rights, ownership licensing, copyright compliance, indemnification, disclaimers, liability, and arbitration clauses.',
        timestamp: new Date().toISOString()
      };

      // Compress the record using zlib
      const recordString = JSON.stringify(agreementRecord);
      const compressed = require('zlib').gzipSync(recordString);
      const compressedBase64 = compressed.toString('base64');

      // Store in database
      const { db } = await import('../db');
      const { users, userAgreementRecords } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');

      // Update user's agreement status
      await db.update(users)
        .set({ 
          agreementAccepted: true, 
          agreementAcceptedAt: new Date(acceptedAt) 
        })
        .where(eq(users.id, userId));

      // Store compressed record
      await db.insert(userAgreementRecords).values({
        userId,
        username,
        email,
        acceptedAt: new Date(acceptedAt),
        ipAddress: ipAddress || 'unknown',
        userAgent: userAgent || 'unknown',
        compressedRecord: compressedBase64
      });

      res.json({ 
        success: true, 
        message: 'Agreement accepted and recorded successfully',
        recordId: agreementRecord.id
      });
    } catch (error) {
      console.error('Agreement acceptance error:', error);
      res.status(500).json({ error: 'Failed to record agreement acceptance' });
    }
  }

  // Get user IP address for agreement recording
  static async getIpAddress(req: Request, res: Response) {
    try {
      const ip = req.ip || 
                 req.connection.remoteAddress || 
                 req.socket.remoteAddress || 
                 'unknown';
      res.send(ip);
    } catch (error) {
      res.send('unknown');
    }
  }
}
