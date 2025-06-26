
import { Request, Response } from 'express';

export class AuthAPI {
  // Login endpoint
  static async login(req: Request, res: Response) {
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
}
