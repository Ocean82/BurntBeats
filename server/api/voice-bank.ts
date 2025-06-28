import express from 'express';
import { voiceBankIntegration } from '../services/voice-bank-integration';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Voice Bank Stats endpoint
router.get('/stats', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const stats = voiceBankIntegration.getVoiceBankStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Voice bank stats error:', error);
    res.status(500).json({ success: false, message: "Failed to get voice bank stats" });
  }
});

// Voice Bank Profiles endpoint
router.get('/profiles', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const profiles = voiceBankIntegration.getAllVoiceProfiles();
    const sanitizedProfiles = profiles.map(profile => ({
      id: profile.id,
      name: profile.name,
      fileSize: profile.fileSize,
      duration: profile.duration,
      format: profile.format,
      isDefault: profile.isDefault,
      createdAt: profile.createdAt,
      metadata: profile.metadata
    }));
    res.json({ success: true, data: sanitizedProfiles });
  } catch (error) {
    console.error('Voice bank profiles error:', error);
    res.status(500).json({ success: false, message: "Failed to get voice profiles" });
  }
});

// Default Voice endpoint
router.get('/default', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const defaultVoice = voiceBankIntegration.getDefaultVoice();
    if (!defaultVoice) {
      return res.status(404).json({ success: false, message: "No default voice available" });
    }

    const sanitizedProfile = {
      id: defaultVoice.id,
      name: defaultVoice.name,
      fileSize: defaultVoice.fileSize,
      duration: defaultVoice.duration,
      format: defaultVoice.format,
      isDefault: defaultVoice.isDefault,
      createdAt: defaultVoice.createdAt,
      metadata: defaultVoice.metadata
    };
    res.json({ success: true, data: sanitizedProfile });
  } catch (error) {
    console.error('Default voice error:', error);
    res.status(500).json({ success: false, message: "Failed to get default voice" });
  }
});

// Generate Voice endpoint
router.post('/generate', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { text, voiceId } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, message: "Text is required" });
    }

    // Generate vocal sample using voice bank
    const result = await voiceBankIntegration.generateVocalSample(voiceId || 'default-voice-01', text);
    
    if (!result) {
      return res.status(404).json({ 
        success: false, 
        message: "Failed to generate vocal sample - voice profile not found or generation failed" 
      });
    }
    
    res.json({ 
      success: true, 
      data: {
        audioPath: result.audioPath,
        duration: result.duration,
        voiceUsed: result.voiceUsed,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Voice generation error:', error);
    res.status(500).json({ success: false, message: "Failed to generate voice sample" });
  }
});

export default router;