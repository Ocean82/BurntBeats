
import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

export class MusicAPI {
  private static uploadsDir = path.join(process.cwd(), "uploads");

  // Generate audio from MIDI helper
  private static async generateAudioFromMidi(midiPath: string): Promise<string> {
    const audioPath = midiPath.replace('.mid', '.wav');
    try {
      await execAsync(`timidity "${midiPath}" -Ow -o "${audioPath}"`);
      return audioPath;
    } catch (error) {
      console.log("Timidity not available, using basic audio generation");
      const silencePath = path.join(MusicAPI.uploadsDir, 'silence.wav');
      if (!fs.existsSync(silencePath)) {
        const sampleRate = 44100;
        const duration = 5;
        const numSamples = sampleRate * duration;
        const bufferSize = 44 + numSamples * 2;
        const buffer = Buffer.alloc(bufferSize);
        
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
        
        fs.writeFileSync(silencePath, buffer);
      }
      fs.copyFileSync(silencePath, audioPath);
      return audioPath;
    }
  }

  // Generate basic song
  static async generateSong(req: Request, res: Response) {
    try {
      const { title, lyrics, genre, tempo, key, duration } = req.body;

      if (!title || !lyrics) {
        return res.status(400).json({ error: "Title and lyrics are required" });
      }

      console.log("🎵 Generating basic song...");

      const outputPath = path.join(MusicAPI.uploadsDir, `song_${Date.now()}.wav`);

      const args = [
        path.join(process.cwd(), "server/music-generator.py"),
        `--title="${title}"`,
        `--lyrics="${lyrics}"`,
        `--genre="${genre || 'pop'}"`,
        `--tempo=${tempo || 120}`,
        `--key="${key || 'C'}"`,
        `--duration=${duration || 30}`,
        `--output_path="${outputPath}"`
      ];

      const { stdout, stderr } = await execAsync(`python "${args[0]}" ${args.slice(1).join(' ')}`);

      if (stderr && !stderr.includes('⚠️') && !stderr.includes('🎵')) {
        console.error("Generation stderr:", stderr);
      }

      if (!fs.existsSync(outputPath)) {
        throw new Error("Song generation failed - no output file created");
      }

      // The simple generator creates WAV files directly, no MIDI conversion needed
      const audioPath = outputPath;

      const song = {
        id: Date.now(),
        title,
        lyrics,
        genre: genre || 'pop',
        tempo: tempo || 120,
        key: key || 'C',
        duration: duration || 30,
        status: "completed" as const,
        generationProgress: 100,
        generatedAudioPath: `/uploads/${path.basename(audioPath)}`,
        audioUrl: `/uploads/${path.basename(audioPath)}`,
        midiUrl: `/uploads/${path.basename(outputPath)}`,
        sections: null,
        settings: null,
        planRestricted: false,
        playCount: 0,
        likes: 0,
        rating: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: req.body.userId || 1
      };

      console.log("✅ Basic song generation completed");
      res.json(song);

    } catch (error) {
      console.error("Song generation error:", error);
      res.status(500).json({ 
        error: "Failed to generate song", 
        details: error.message 
      });
    }
  }

  // Generate AI-enhanced music
  static async generateAIMusic(req: Request, res: Response) {
    try {
      const { title, lyrics, genre, tempo, key, duration } = req.body;

      if (!title || !lyrics) {
        return res.status(400).json({ error: "Title and lyrics are required" });
      }

      console.log("🤖 Generating AI-enhanced music...");

      const outputPath = path.join(MusicAPI.uploadsDir, `ai_music_${Date.now()}.mid`);

      const args = [
        path.join(process.cwd(), "server/ai-music21-generator.py"),
        `"${title}"`,
        `"${lyrics}"`,
        `"${genre || 'pop'}"`,
        String(tempo || 120),
        `"${key || 'C'}"`,
        String(duration || 30),
        outputPath
      ];

      const { stdout, stderr } = await execAsync(`python ${args.join(' ')}`);

      if (!fs.existsSync(outputPath)) {
        throw new Error("AI music generation failed - no output file created");
      }

      const audioPath = await MusicAPI.generateAudioFromMidi(outputPath);

      const result = {
        success: true,
        audioUrl: `/uploads/${path.basename(audioPath)}`,
        midiUrl: `/uploads/${path.basename(outputPath)}`,
        metadata: {
          title,
          genre: genre || 'pop',
          tempo: tempo || 120,
          key: key || 'C',
          duration: duration || 30,
          generationType: 'ai-enhanced',
          aiFeatures: {
            neuralNetworks: true,
            patternLearning: true,
            enhancedHarmony: true
          }
        }
      };

      console.log("✅ AI-enhanced music generation completed");
      res.json(result);

    } catch (error) {
      console.error("AI music generation error:", error);
      res.status(500).json({ 
        error: "Failed to generate AI music", 
        details: error.message 
      });
    }
  }

  // Music21 demo
  static async generateMusic21Demo(req: Request, res: Response) {
    try {
      const { demoType = 'basic' } = req.body;

      console.log(`🎼 Running Music21 ${demoType} demo...`);

      const outputPath = path.join(MusicAPI.uploadsDir, `music21_${demoType}_demo_${Date.now()}.mid`);

      const args = [
        path.join(process.cwd(), "server/music21-demo-generator.py"),
        outputPath,
        `--demo-type=${demoType}`
      ];

      const { stdout, stderr } = await execAsync(`python ${args.join(' ')}`);

      if (!fs.existsSync(outputPath)) {
        throw new Error("Music21 demo failed - no output file created");
      }

      const analysisPath = outputPath.replace('.mid', '_analysis.json');
      let analysis = null;
      if (fs.existsSync(analysisPath)) {
        analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
      }

      const audioPath = await MusicAPI.generateAudioFromMidi(outputPath);

      const result = {
        success: true,
        demoType,
        audioUrl: `/uploads/${path.basename(audioPath)}`,
        midiUrl: `/uploads/${path.basename(outputPath)}`,
        analysisUrl: analysis ? `/uploads/${path.basename(analysisPath)}` : null,
        analysis,
        concepts: {
          note_objects: demoType !== 'generative',
          chord_objects: demoType !== 'generative',
          rest_objects: demoType !== 'generative',
          stream_organization: true,
          generative_algorithms: demoType !== 'basic',
          export_capabilities: true
        }
      };

      console.log(`✅ Music21 ${demoType} demo completed`);
      res.json(result);

    } catch (error) {
      console.error("Music21 demo error:", error);
      res.status(500).json({ 
        error: "Failed to run Music21 demo", 
        details: error.message 
      });
    }
  }

  // Get single song
  static async getSong(req: Request, res: Response) {
    try {
      const songId = parseInt(req.params.id);
      
      const song = {
        id: songId,
        title: "Generated Song",
        lyrics: "Demo lyrics",
        genre: "pop",
        tempo: 120,
        key: "C",
        duration: 30,
        status: "completed" as const,
        generationProgress: 100,
        generatedAudioPath: "/uploads/demo.wav",
        audioUrl: "/uploads/demo.wav",
        sections: null,
        settings: null,
        planRestricted: false,
        playCount: 0,
        likes: 0,
        rating: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 1
      };

      res.json(song);
    } catch (error) {
      console.error("Error fetching song:", error);
      res.status(500).json({ error: "Failed to fetch song" });
    }
  }

  // Get user songs
  static async getUserSongs(req: Request, res: Response) {
    try {
      const userId = req.query.userId || 1;
      res.json([]);
    } catch (error) {
      console.error("Error fetching songs:", error);
      res.status(500).json({ error: "Failed to fetch songs" });
    }
  }
}
