
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

// Generate complete track with RVC vocals
router.post('/generate-track', authenticate, upload.single('voice_model'), async (req, res) => {
  try {
    const {
      title,
      lyrics,
      genre = 'pop',
      tempo = 120,
      key = 'C',
      duration = 30,
      pitchShift = 0,
      indexRate = 0.75
    } = req.body;

    if (!title || !lyrics) {
      return res.status(400).json({ error: 'Title and lyrics are required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Voice model file is required' });
    }

    const voiceModelPath = req.file.path;

    const musicParams = {
      title,
      lyrics,
      genre,
      tempo: parseInt(tempo),
      key,
      duration: parseInt(duration)
    };

    const rvcOptions = {
      pitchShift: parseInt(pitchShift),
      indexRate: parseFloat(indexRate)
    };

    const result = await rvcService.generateCompleteTrack(
      musicParams,
      voiceModelPath,
      rvcOptions
    );

    // Clean up uploaded voice model
    await fs.unlink(voiceModelPath).catch(() => {});

    res.json({
      success: true,
      outputPath: result,
      downloadUrl: `/api/rvc-music/download/${path.basename(result)}`,
      metadata: {
        title,
        genre,
        tempo,
        key,
        duration,
        generatedWith: 'RVC Pipeline'
      }
    });

  } catch (error) {
    logger.error('RVC track generation error:', error);
    res.status(500).json({ error: 'Track generation failed' });
  }
});

// Generate instrumental track only
router.post('/generate-instrumental', authenticate, async (req, res) => {
  try {
    const {
      title,
      genre = 'pop',
      tempo = 120,
      key = 'C',
      duration = 30
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const outputPath = path.join('uploads', `instrumental_${Date.now()}.wav`);

    const musicParams = {
      title,
      lyrics: '', // Empty for instrumental
      genre,
      tempo: parseInt(tempo),
      key,
      duration: parseInt(duration)
    };

    // Generate instrumental track
    await rvcService.generateInstrumentalTrack(musicParams, outputPath);

    res.json({
      success: true,
      outputPath,
      downloadUrl: `/api/rvc-music/download/${path.basename(outputPath)}`,
      metadata: {
        title,
        genre,
        tempo,
        key,
        duration,
        type: 'instrumental'
      }
    });

  } catch (error) {
    logger.error('Instrumental generation error:', error);
    res.status(500).json({ error: 'Instrumental generation failed' });
  }
});

// Convert existing vocals with RVC
router.post('/convert-vocals', authenticate, upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'voice_model', maxCount: 1 }
]), async (req, res) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (!files.audio || !files.voice_model) {
      return res.status(400).json({ error: 'Both audio and voice model files are required' });
    }

    const audioPath = files.audio[0].path;
    const voiceModelPath = files.voice_model[0].path;

    const {
      pitchShift = 0,
      indexRate = 0.75,
      filterRadius = 3,
      rmsThreshold = 0.25,
      protectVoiceless = 0.33,
      method = 'rmvpe'
    } = req.body;

    const outputPath = path.join('uploads', `rvc_converted_${Date.now()}.wav`);

    const result = await rvcService.convertVoice({
      inputAudioPath: audioPath,
      outputAudioPath: outputPath,
      modelPath: voiceModelPath,
      pitchShift: parseInt(pitchShift),
      indexRate: parseFloat(indexRate),
      filterRadius: parseInt(filterRadius),
      rmsThreshold: parseFloat(rmsThreshold),
      protectVoiceless: parseFloat(protectVoiceless),
      method
    });

    // Clean up uploaded files
    await fs.unlink(audioPath).catch(() => {});
    await fs.unlink(voiceModelPath).catch(() => {});

    res.json({
      success: true,
      outputPath: result,
      downloadUrl: `/api/rvc-music/download/${path.basename(result)}`
    });

  } catch (error) {
    logger.error('RVC vocal conversion error:', error);
    res.status(500).json({ error: 'Vocal conversion failed' });
  }
});

// Download generated audio
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
