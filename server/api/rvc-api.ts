
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { RVCIntegrationService } from '../services/rvc-integration-service';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Initialize RVC service
const rvcService = RVCIntegrationService.getInstance();

// Convert voice using RVC
router.post('/convert', authenticate, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const {
      modelPath,
      pitchShift = 0,
      indexRate = 0.75,
      filterRadius = 3,
      rmsThreshold = 0.25,
      protectVoiceless = 0.33,
      method = 'rmvpe'
    } = req.body;

    if (!modelPath) {
      return res.status(400).json({ error: 'Model path is required' });
    }

    const inputPath = req.file.path;
    const outputPath = path.join('uploads', `rvc_output_${Date.now()}.wav`);

    const result = await rvcService.convertVoice({
      inputAudioPath: inputPath,
      outputAudioPath: outputPath,
      modelPath,
      pitchShift: parseInt(pitchShift),
      indexRate: parseFloat(indexRate),
      filterRadius: parseInt(filterRadius),
      rmsThreshold: parseFloat(rmsThreshold),
      protectVoiceless: parseFloat(protectVoiceless),
      method
    });

    // Clean up input file
    await fs.unlink(inputPath).catch(() => {});

    res.json({
      success: true,
      outputPath: result,
      downloadUrl: `/api/rvc/download/${path.basename(result)}`
    });

  } catch (error) {
    logger.error('RVC conversion error:', error);
    res.status(500).json({ error: 'Voice conversion failed' });
  }
});

// Convert MIDI to vocal using RVC
router.post('/midi-to-vocal', authenticate, upload.single('midi'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No MIDI file provided' });
    }

    const { modelPath, lyrics, pitchShift = 0 } = req.body;

    if (!modelPath || !lyrics) {
      return res.status(400).json({ error: 'Model path and lyrics are required' });
    }

    const midiPath = req.file.path;
    const result = await rvcService.convertMIDIToVocal(
      midiPath,
      modelPath,
      lyrics,
      { pitchShift: parseInt(pitchShift) }
    );

    // Clean up MIDI file
    await fs.unlink(midiPath).catch(() => {});

    res.json({
      success: true,
      outputPath: result,
      downloadUrl: `/api/rvc/download/${path.basename(result)}`
    });

  } catch (error) {
    logger.error('MIDI to vocal conversion error:', error);
    res.status(500).json({ error: 'MIDI to vocal conversion failed' });
  }
});

// Train new voice model
router.post('/train', authenticate, upload.single('training_data'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No training data provided' });
    }

    const { modelName, epochs = 10000, batchSize = 7 } = req.body;

    if (!modelName) {
      return res.status(400).json({ error: 'Model name is required' });
    }

    const trainingDataPath = req.file.path;
    
    // Start training (this will take a long time)
    rvcService.trainVoiceModel(trainingDataPath, modelName, {
      epochs: parseInt(epochs),
      batchSize: parseInt(batchSize)
    }).then(modelPath => {
      logger.info(`Voice model training completed: ${modelPath}`);
    }).catch(error => {
      logger.error('Voice model training failed:', error);
    });

    res.json({
      success: true,
      message: 'Voice model training started',
      modelName,
      status: 'training_started'
    });

  } catch (error) {
    logger.error('Voice model training error:', error);
    res.status(500).json({ error: 'Failed to start voice model training' });
  }
});

// List available models
router.get('/models', authenticate, async (req, res) => {
  try {
    const models = await rvcService.listAvailableModels();
    res.json({ models });
  } catch (error) {
    logger.error('Failed to list models:', error);
    res.status(500).json({ error: 'Failed to list available models' });
  }
});

// Download converted audio
router.get('/download/:filename', authenticate, async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join('uploads', filename);

    const exists = await fs.access(filePath).then(() => true).catch(() => false);
    
    if (!exists) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const stream = require('fs').createReadStream(filePath);
    stream.pipe(res);

  } catch (error) {
    logger.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

export default router;
