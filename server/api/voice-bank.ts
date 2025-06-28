import express from 'express';
import multer from 'multer';
import { voiceBankService } from '../services/voice-bank-service';
import { authenticate, authorizeOwnership } from '../middleware/auth';
import { logger } from '../logger';

const router = express.Router();

// Configure multer for voice file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/mpeg', 'audio/x-wav'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only MP3 and WAV files are allowed.'));
    }
  }
});

// Get voice bank statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const stats = voiceBankService.getVoiceBankStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get voice bank stats', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve voice bank statistics'
    });
  }
});

// Get all voice profiles
router.get('/profiles', authenticate, async (req, res) => {
  try {
    const profiles = voiceBankService.getAllVoiceProfiles();
    
    // Remove file paths from response for security
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

    res.json({
      success: true,
      data: sanitizedProfiles
    });
  } catch (error) {
    logger.error('Failed to get voice profiles', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve voice profiles'
    });
  }
});

// Get specific voice profile
router.get('/profiles/:voiceId', authenticate, async (req, res) => {
  try {
    const { voiceId } = req.params;
    const profile = voiceBankService.getVoiceProfile(voiceId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Voice profile not found'
      });
    }

    // Remove file path from response for security
    const sanitizedProfile = {
      id: profile.id,
      name: profile.name,
      fileSize: profile.fileSize,
      duration: profile.duration,
      format: profile.format,
      isDefault: profile.isDefault,
      createdAt: profile.createdAt,
      metadata: profile.metadata
    };

    res.json({
      success: true,
      data: sanitizedProfile
    });
  } catch (error) {
    logger.error('Failed to get voice profile', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve voice profile'
    });
  }
});

// Upload new voice profile
router.post('/profiles', authenticate, upload.single('voiceFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No voice file provided'
      });
    }

    const { name, gender, language, accent } = req.body;
    
    const metadata = {
      gender: gender || 'neutral',
      language: language || 'en',
      accent: accent || 'neutral'
    };

    const profile = await voiceBankService.addVoiceProfile(
      req.file.buffer,
      req.file.originalname,
      metadata
    );

    res.status(201).json({
      success: true,
      message: 'Voice profile uploaded successfully',
      data: {
        id: profile.id,
        name: profile.name,
        fileSize: profile.fileSize,
        format: profile.format,
        metadata: profile.metadata
      }
    });

    logger.info('Voice profile uploaded', { 
      userId: req.user?.id, 
      profileId: profile.id,
      fileName: req.file.originalname
    });

  } catch (error) {
    logger.error('Failed to upload voice profile', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload voice profile'
    });
  }
});

// Analyze voice profile
router.post('/profiles/:voiceId/analyze', authenticate, async (req, res) => {
  try {
    const { voiceId } = req.params;
    const analysis = await voiceBankService.analyzeVoice(voiceId);

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Voice profile not found or analysis failed'
      });
    }

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    logger.error('Failed to analyze voice', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze voice profile'
    });
  }
});

// Generate vocal sample using voice profile
router.post('/profiles/:voiceId/generate', authenticate, async (req, res) => {
  try {
    const { voiceId } = req.params;
    const { text, melody, duration } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required for vocal generation'
      });
    }

    const audioBuffer = await voiceBankService.generateVocalSample(
      voiceId,
      text,
      melody,
      duration
    );

    if (!audioBuffer) {
      return res.status(404).json({
        success: false,
        message: 'Failed to generate vocal sample'
      });
    }

    // Set appropriate headers for audio response
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length.toString(),
      'Content-Disposition': `attachment; filename="vocal-sample-${voiceId}.mp3"`
    });

    res.send(audioBuffer);

    logger.info('Vocal sample generated', { 
      userId: req.user?.id, 
      voiceId,
      textLength: text.length,
      outputSize: audioBuffer.length
    });

  } catch (error) {
    logger.error('Failed to generate vocal sample', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate vocal sample'
    });
  }
});

// Delete voice profile
router.delete('/profiles/:voiceId', authenticate, async (req, res) => {
  try {
    const { voiceId } = req.params;
    const success = await voiceBankService.removeVoiceProfile(voiceId);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Voice profile not found or cannot be deleted'
      });
    }

    res.json({
      success: true,
      message: 'Voice profile deleted successfully'
    });

    logger.info('Voice profile deleted', { 
      userId: req.user?.id, 
      voiceId 
    });

  } catch (error) {
    logger.error('Failed to delete voice profile', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete voice profile'
    });
  }
});

// Get default voice profile
router.get('/default', authenticate, async (req, res) => {
  try {
    const defaultVoice = voiceBankService.getDefaultVoice();

    if (!defaultVoice) {
      return res.status(404).json({
        success: false,
        message: 'No default voice available'
      });
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

    res.json({
      success: true,
      data: sanitizedProfile
    });
  } catch (error) {
    logger.error('Failed to get default voice', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve default voice'
    });
  }
});

export default router;