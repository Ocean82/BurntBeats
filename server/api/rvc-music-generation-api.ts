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

// Process uploaded MIDI file
router.post('/process-midi', authenticate, upload.single('midi_file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'MIDI file is required' });
    }

    const midiPath = req.file.path;

    // Analyze MIDI file
    const analysis = await rvcService.processMIDIFile(midiPath);

    res.json({
      success: true,
      analysis,
      midiPath: path.basename(midiPath),
      message: 'MIDI file processed successfully'
    });

  } catch (error) {
    logger.error('MIDI processing error:', error);
    res.status(500).json({ error: 'MIDI processing failed' });
  }
});

// Convert MIDI to vocal with RVC
router.post('/midi-to-vocal', authenticate, upload.fields([
  { name: 'midi_file', maxCount: 1 },
  { name: 'voice_model', maxCount: 1 }
]), async (req, res) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!files.midi_file || !files.voice_model) {
      return res.status(400).json({ error: 'Both MIDI file and voice model are required' });
    }

    const {
      lyrics,
      pitchShift = 0,
      indexRate = 0.75
    } = req.body;

    if (!lyrics) {
      return res.status(400).json({ error: 'Lyrics are required for vocal conversion' });
    }

    const midiPath = files.midi_file[0].path;
    const voiceModelPath = files.voice_model[0].path;

    const rvcOptions = {
      pitchShift: parseInt(pitchShift),
      indexRate: parseFloat(indexRate)
    };

    const result = await rvcService.convertMIDIToVocal(
      midiPath,
      voiceModelPath,
      lyrics,
      rvcOptions
    );

    // Clean up uploaded files
    await fs.unlink(midiPath).catch(() => {});
    await fs.unlink(voiceModelPath).catch(() => {});

    res.json({
      success: true,
      outputPath: result,
      downloadUrl: `/api/rvc-music/download/${path.basename(result)}`,
      message: 'MIDI to vocal conversion completed successfully'
    });

  } catch (error) {
    logger.error('MIDI to vocal conversion error:', error);
    res.status(500).json({ error: 'MIDI to vocal conversion failed' });
  }
});

// Get available MIDI templates
router.get('/midi-templates', authenticate, async (req, res) => {
  try {
    const midiFiles = await rvcService.listAvailableMIDIFiles();
    
    res.json({
      success: true,
      templates: midiFiles,
      count: midiFiles.length
    });

  } catch (error) {
    logger.error('MIDI templates listing error:', error);
    res.status(500).json({ error: 'Failed to list MIDI templates' });
  }
});

// Generate from MIDI template
router.post('/generate-from-template', authenticate, upload.single('voice_model'), async (req, res) => {
  try {
    const {
      midiTemplate,
      lyrics,
      preserveMelody = true,
      adaptTempo = false,
      customKey,
      pitchShift = 0,
      indexRate = 0.75
    } = req.body;

    if (!midiTemplate || !lyrics) {
      return res.status(400).json({ error: 'MIDI template and lyrics are required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Voice model file is required' });
    }

    const voiceModelPath = req.file.path;

    const options = {
      preserveMelody: preserveMelody === 'true',
      adaptTempo: adaptTempo === 'true',
      customKey,
      pitchShift: parseInt(pitchShift),
      indexRate: parseFloat(indexRate)
    };

    const result = await rvcService.generateFromMIDITemplate(
      midiTemplate,
      voiceModelPath,
      lyrics,
      options
    );

    // Clean up uploaded voice model
    await fs.unlink(voiceModelPath).catch(() => {});

    res.json({
      success: true,
      outputPath: result,
      downloadUrl: `/api/rvc-music/download/${path.basename(result)}`,
      metadata: {
        sourceTemplate: path.basename(midiTemplate),
        lyrics,
        options,
        generatedWith: 'RVC MIDI Template'
      }
    });

  } catch (error) {
    logger.error('MIDI template generation error:', error);
    res.status(500).json({ error: 'MIDI template generation failed' });
  }
});

// Create melody variation
router.post('/create-variation', authenticate, async (req, res) => {
  try {
    const {
      originalTemplate,
      variationStyle = 'jazz'
    } = req.body;

    if (!originalTemplate) {
      return res.status(400).json({ error: 'Original MIDI template is required' });
    }

    const outputPath = path.join('uploads', `variation_${variationStyle}_${Date.now()}.mid`);

    const result = await rvcService.createMelodyVariation(
      originalTemplate,
      variationStyle,
      outputPath
    );

    res.json({
      success: true,
      variationPath: result,
      downloadUrl: `/api/rvc-music/download/${path.basename(result)}`,
      metadata: {
        originalTemplate: path.basename(originalTemplate),
        style: variationStyle,
        type: 'melody_variation'
      }
    });

  } catch (error) {
    logger.error('Melody variation error:', error);
    res.status(500).json({ error: 'Melody variation failed' });
  }
});

// Download generated audio
router.get('/download/:filename', authenticate, async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join('uploads', filename);

    if (!await fs.access(filePath).then(() => true).catch(() => false)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(filePath);
  } catch (error) {
    logger.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

export default router;