
import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadsDir = path.join(process.cwd(), "uploads");

const upload = multer({
  dest: uploadsDir,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

export class VoiceAPI {
  // Upload voice sample
  static uploadMiddleware = upload.single('voiceSample');

  static async uploadVoiceSample(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const voiceSample = {
        id: Date.now(),
        name: req.body.name || req.file.originalname,
        filePath: `/uploads/${req.file.filename}`,
        duration: 0, // Would need audio analysis to get real duration
        userId: req.body.userId || 1,
        createdAt: new Date()
      };

      console.log('✅ Voice sample uploaded:', voiceSample.name);
      res.json(voiceSample);

    } catch (error) {
      console.error('Voice upload error:', error);
      res.status(500).json({ error: 'Failed to upload voice sample' });
    }
  }

  // Get user voice samples
  static async getVoiceSamples(req: Request, res: Response) {
    try {
      const userId = req.query.userId || 1;
      
      // Return empty array for now - can be enhanced with database integration
      res.json([]);
    } catch (error) {
      console.error('Error fetching voice samples:', error);
      res.status(500).json({ error: 'Failed to fetch voice samples' });
    }
  }

  // Text-to-speech generation
  static async generateTTS(req: Request, res: Response) {
    try {
      const { text, voice, settings } = req.body;

      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      if (typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({ error: 'Text must be a non-empty string' });
      }

      if (text.length > 5000) {
        return res.status(400).json({ error: 'Text must be less than 5000 characters' });
      }

      console.log('🗣️ Generating text-to-speech...');

      // Mock TTS generation
      const audioPath = path.join(uploadsDir, `tts_${Date.now()}.wav`);
      
      // Create a basic audio file for demo
      const sampleRate = 44100;
      const duration = Math.min(text.length * 0.1, 30); // Estimate duration
      const numSamples = Math.floor(sampleRate * duration);
      const bufferSize = 44 + numSamples * 2;
      const buffer = Buffer.alloc(bufferSize);
      
      // Write WAV header
      buffer.write('RIFF', 0);
      buffer.writeUInt32LE(bufferSize - 8, 4);
      buffer.write('WAVE', 8);
      buffer.write('fmt ', 12);
      buffer.writeUInt32LE(16, 16);
      buffer.writeUInt16LE(1, 20);
      buffer.writeUInt16LE(1, 22);
      buffer.writeUInt32LE(sampleRate, 24);
      buffer.writeUInt32LE(sampleRate * 2, 28);
      buffer.writeUInt16LE(2, 32);
      buffer.writeUInt16LE(16, 34);
      buffer.write('data', 36);
      buffer.writeUInt32LE(numSamples * 2, 40);
      
      fs.writeFileSync(audioPath, buffer);

      const result = {
        success: true,
        audioUrl: `/uploads/${path.basename(audioPath)}`,
        duration: duration,
        voice: voice || 'default',
        text: text
      };

      console.log('✅ TTS generation completed');
      res.json(result);

    } catch (error) {
      console.error('TTS generation error:', error);
      res.status(500).json({ 
        error: 'Failed to generate TTS', 
        details: error.message 
      });
    }
  }

  // Voice cloning
  static async cloneVoice(req: Request, res: Response) {
    try {
      const { voiceSampleId, text, settings } = req.body;

      if (!voiceSampleId || !text) {
        return res.status(400).json({ error: 'Voice sample ID and text are required' });
      }

      if (typeof voiceSampleId !== 'number' || voiceSampleId <= 0) {
        return res.status(400).json({ error: 'Voice sample ID must be a positive number' });
      }

      if (typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({ error: 'Text must be a non-empty string' });
      }

      if (text.length > 1000) {
        return res.status(400).json({ error: 'Text for voice cloning must be less than 1000 characters' });
      }

      console.log('🎭 Cloning voice...');

      // Mock voice cloning process
      const audioPath = path.join(uploadsDir, `cloned_voice_${Date.now()}.wav`);
      
      // Create a basic audio file for demo
      const sampleRate = 44100;
      const duration = Math.min(text.length * 0.1, 30);
      const numSamples = Math.floor(sampleRate * duration);
      const bufferSize = 44 + numSamples * 2;
      const buffer = Buffer.alloc(bufferSize);
      
      // Write WAV header
      buffer.write('RIFF', 0);
      buffer.writeUInt32LE(bufferSize - 8, 4);
      buffer.write('WAVE', 8);
      buffer.write('fmt ', 12);
      buffer.writeUInt32LE(16, 16);
      buffer.writeUInt16LE(1, 20);
      buffer.writeUInt16LE(1, 22);
      buffer.writeUInt32LE(sampleRate, 24);
      buffer.writeUInt32LE(sampleRate * 2, 28);
      buffer.writeUInt16LE(2, 32);
      buffer.writeUInt16LE(16, 34);
      buffer.write('data', 36);
      buffer.writeUInt32LE(numSamples * 2, 40);
      
      fs.writeFileSync(audioPath, buffer);

      const result = {
        success: true,
        audioUrl: `/uploads/${path.basename(audioPath)}`,
        duration: duration,
        voiceSampleId: voiceSampleId,
        text: text,
        quality: 'high'
      };

      console.log('✅ Voice cloning completed');
      res.json(result);

    } catch (error) {
      console.error('Voice cloning error:', error);
      res.status(500).json({ 
        error: 'Failed to clone voice', 
        details: error.message 
      });
    }
  }
}
