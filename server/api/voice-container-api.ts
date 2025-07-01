
import { Router } from 'express';
import multer from 'multer';
import { VoiceCloningContainer } from '../services/voice-cloning-container';
import { authenticate } from '../middleware/auth';
import { Logger } from '../utils/logger';
import path from 'path';
import fs from 'fs/promises';

const router = Router();
const logger = new Logger({ name: 'VoiceContainerAPI' });
const voiceContainer = VoiceCloningContainer.getInstance();

// Configure multer for audio uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/wav', 'audio/mp3', 'audio/m4a', 'audio/ogg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid audio file type'));
    }
  }
});

/**
 * Register new voice model
 */
router.post('/register', authenticate, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Audio file is required'
      });
    }

    const { name, type = 'rvc' } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Voice name is required'
      });
    }

    logger.info('Registering voice model', {
      userId: req.user?.id,
      name,
      type,
      fileSize: req.file.size
    });

    const voiceModel = await voiceContainer.registerVoiceModel(
      req.file.buffer,
      name,
      type as 'rvc' | 'bark'
    );

    res.json({
      success: true,
      data: {
        voiceModel: {
          id: voiceModel.id,
          name: voiceModel.name,
          type: voiceModel.type,
          characteristics: voiceModel.characteristics
        }
      }
    });

  } catch (error) {
    logger.error('Voice model registration failed', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Voice model registration failed',
      details: error.message
    });
  }
});

/**
 * Clone voice with text
 */
router.post('/clone', authenticate, async (req, res) => {
  try {
    const {
      text,
      voiceModelId,
      style = {},
      outputFormat = 'wav'
    } = req.body;

    if (!text || !voiceModelId) {
      return res.status(400).json({
        success: false,
        error: 'Text and voice model ID are required'
      });
    }

    logger.info('Voice cloning request', {
      userId: req.user?.id,
      voiceModelId,
      textLength: text.length,
      outputFormat
    });

    const result = await voiceContainer.cloneVoice({
      text,
      voiceModelId,
      style: {
        emotion: style.emotion || 'neutral',
        speed: style.speed || 1.0,
        pitch: style.pitch || 0
      },
      outputFormat
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Voice cloning failed', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Voice cloning failed',
      details: error.message
    });
  }
});

/**
 * Get available voice models
 */
router.get('/models', authenticate, async (req, res) => {
  try {
    const models = voiceContainer.getAvailableModels();

    res.json({
      success: true,
      data: {
        models: models.map(model => ({
          id: model.id,
          name: model.name,
          type: model.type,
          characteristics: model.characteristics
        }))
      }
    });

  } catch (error) {
    logger.error('Failed to get voice models', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get voice models'
    });
  }
});

/**
 * Delete voice model
 */
router.delete('/models/:modelId', authenticate, async (req, res) => {
  try {
    const { modelId } = req.params;

    await voiceContainer.deleteVoiceModel(modelId);

    logger.info('Voice model deleted', {
      modelId,
      userId: req.user?.id
    });

    res.json({
      success: true,
      message: 'Voice model deleted successfully'
    });

  } catch (error) {
    logger.error('Failed to delete voice model', {
      error: error.message,
      modelId: req.params.modelId,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to delete voice model',
      details: error.message
    });
  }
});

/**
 * Health check for voice container
 */
router.get('/health', async (req, res) => {
  try {
    const health = await voiceContainer.healthCheck();

    res.json({
      success: true,
      data: health
    });

  } catch (error) {
    logger.error('Voice container health check failed', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

/**
 * Serve generated audio files
 */
router.get('/outputs/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), 'storage', 'voice-outputs', filename);

    // Verify file exists
    await fs.access(filePath);

    // Set appropriate headers
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    // Send file
    res.sendFile(filePath);

  } catch (error) {
    logger.error('Failed to serve audio file', {
      error: error.message,
      filename: req.params.filename
    });

    res.status(404).json({
      success: false,
      error: 'Audio file not found'
    });
  }
});

export default router;
