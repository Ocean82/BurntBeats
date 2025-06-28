import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Configure multer for voice file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'voice-samples');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `voice-sample-${timestamp}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid audio file type'));
    }
  }
});

// Voice cloning endpoint
router.post('/clone', authenticate, upload.single('audioFile'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Audio file is required' });
    }

    const { VoiceCloningService } = await import('../voice-cloning-service');
    const voiceCloningService = new VoiceCloningService();

    // Process the uploaded voice sample
    const result = await voiceCloningService.cloneVoice(req.file.path, {
      userId: req.user?.id,
      quality: 'high',
      processStages: ['embedding', 'similarity', 'spectral', 'timbre', 'formant', 'generation']
    });

    res.json({
      success: true,
      data: {
        voiceId: result.voiceId,
        similarity: result.similarity,
        processingTime: result.processingTime,
        stages: result.stages,
        audioPath: result.audioPath
      }
    });
  } catch (error) {
    console.error('Voice cloning error:', error);
    res.status(500).json({ success: false, message: 'Voice cloning failed' });
  }
});

// Text-to-speech endpoint
router.post('/synthesize', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { text, voiceId, settings } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, message: 'Text is required' });
    }

    const { TextToSpeechService } = await import('../text-to-speech-service');
    const ttsService = new TextToSpeechService();

    const result = await ttsService.synthesizeSpeech(text, {
      voiceId: voiceId || 'default',
      speed: settings?.speed || 1.0,
      pitch: settings?.pitch || 1.0,
      tone: settings?.tone || 'neutral',
      quality: settings?.quality || 'high'
    });

    res.json({
      success: true,
      data: {
        audioPath: result.audioPath,
        duration: result.duration,
        voiceUsed: result.voiceUsed,
        processingStages: result.stages
      }
    });
  } catch (error) {
    console.error('TTS synthesis error:', error);
    res.status(500).json({ success: false, message: 'Speech synthesis failed' });
  }
});

// Enhanced voice processing endpoint
router.post('/enhance', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { audioPath, settings } = req.body;

    if (!audioPath) {
      return res.status(400).json({ success: false, message: 'Audio path is required' });
    }

    const { EnhancedVoicePipeline } = await import('../enhanced-voice-pipeline');
    const pipeline = new EnhancedVoicePipeline();

    const result = await pipeline.processVoice(audioPath, {
      quality: settings?.quality || 'studio',
      adaptiveFiltering: settings?.adaptiveFiltering !== false,
      realTimeProcessing: settings?.realTime || false
    });

    res.json({
      success: true,
      data: {
        processedAudioPath: result.audioPath,
        qualityScore: result.qualityScore,
        processingTime: result.processingTime,
        metadata: result.metadata
      }
    });
  } catch (error) {
    console.error('Voice enhancement error:', error);
    res.status(500).json({ success: false, message: 'Voice enhancement failed' });
  }
});

export default router;