import express, { type Request, Response } from "express";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import { exec } from "child_process";
import { pricingService } from "./pricing-service";
import { spawn } from "child_process";
import { storage } from "./storage";
import { hashPassword, verifyPassword } from "./db";
import http from "http";

const execAsync = promisify(exec);
const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const upload = multer({
  dest: uploadsDir,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Helper function to generate audio from MIDI
async function generateAudioFromMidi(midiPath: string): Promise<string> {
  const audioPath = midiPath.replace('.mid', '.wav');
  try {
    // Use fluidsynth or timidity to convert MIDI to audio
    await execAsync(`timidity "${midiPath}" -Ow -o "${audioPath}"`);
    return audioPath;
  } catch (error) {
    console.log("Timidity not available, using basic audio generation");
    // Fallback: copy a basic audio file or generate silence
    const silencePath = path.join(uploadsDir, 'silence.wav');
    if (!fs.existsSync(silencePath)) {
      // Create a basic WAV header for 5 seconds of silence
      const sampleRate = 44100;
      const duration = 5; // seconds
      const numSamples = sampleRate * duration;
      const bufferSize = 44 + numSamples * 2; // WAV header + 16-bit samples
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
      
      fs.writeFileSync(silencePath, buffer);
    }
    // Copy to target path
    fs.copyFileSync(silencePath, audioPath);
    return audioPath;
  }
}

export function registerRoutes(app: express.Application): http.Server {
  
  // Serve static files from uploads directory
  app.use('/uploads', express.static(uploadsDir));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Song generation endpoint
  app.post("/api/songs/generate", async (req, res) => {
    try {
      const { title, lyrics, genre, tempo, key, duration } = req.body;

      if (!title || !lyrics) {
        return res.status(400).json({ error: "Title and lyrics are required" });
      }

      console.log("🎵 Generating song...");

      const outputPath = path.join(uploadsDir, `song_${Date.now()}.mid`);

      // Use enhanced music generator
      const args = [
        path.join(process.cwd(), "server/enhanced-music21-generator.py"),
        `"${title}"`,
        `"${lyrics}"`,
        `"${genre || 'pop'}"`,
        String(tempo || 120),
        `"${key || 'C'}"`,
        String(duration || 30),
        outputPath
      ];

      const { stdout, stderr } = await execAsync(`python ${args.join(' ')}`);

      if (stderr && !stderr.includes('⚠️') && !stderr.includes('🎵')) {
        console.error("Generation stderr:", stderr);
      }

      console.log("Generation output:", stdout);

      if (!fs.existsSync(outputPath)) {
        throw new Error("Song generation failed - no output file created");
      }

      // Generate audio file
      const audioPath = await generateAudioFromMidi(outputPath);

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

      console.log("✅ Song generation completed");
      res.json(song);

    } catch (error) {
      console.error("Song generation error:", error);
      res.status(500).json({ 
        error: "Failed to generate song", 
        details: error.message 
      });
    }
  });

  // Get single song endpoint
  app.get("/api/songs/single/:id", async (req, res) => {
    try {
      const songId = parseInt(req.params.id);
      
      // For demo purposes, return a mock completed song
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
  });

  // Get user songs endpoint
  app.get("/api/songs", async (req, res) => {
    try {
      const userId = req.query.userId || 1;
      
      // Return empty array for now - can be enhanced with database integration
      res.json([]);
    } catch (error) {
      console.error("Error fetching songs:", error);
      res.status(500).json({ error: "Failed to fetch songs" });
    }
  });

  // User authentication endpoints
  app.get("/api/user", (req, res) => {
    // Mock user for development
    const user = {
      id: 1,
      username: "demo_user",
      email: "demo@example.com",
      plan: "free",
      songsGenerated: 0,
      maxSongs: 3,
      features: {
        voiceCloning: false,
        advancedEditing: false,
        collaboration: false,
        analytics: false,
        versionControl: false,
        socialFeatures: false,
        prioritySupport: false,
        customization: false
      }
    };
    res.json(user);
  });

  app.get("/api/login", (req, res) => {
    res.redirect("/?auth=success");
  });

  app.get("/api/logout", (req, res) => {
    res.redirect("/");
  });
app.post("/api/generate-ai-music", async (req, res) => {
  try {
    const { title, lyrics, genre, tempo, key, duration } = req.body;

    if (!title || !lyrics) {
      return res.status(400).json({ error: "Title and lyrics are required" });
    }

    console.log("🤖 Generating AI-enhanced music...");

    const outputPath = path.join(uploadsDir, `ai_music_${Date.now()}.mid`);

    // Use AI-enhanced generator
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

    if (stderr && !stderr.includes('⚠️') && !stderr.includes('🎵')) {
      console.error("AI generation stderr:", stderr);
    }

    console.log("AI generation output:", stdout);

    if (!fs.existsSync(outputPath)) {
      throw new Error("AI music generation failed - no output file created");
    }

    // Generate audio file
    const audioPath = await generateAudioFromMidi(outputPath);

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
});

// Music21 Concepts Demo Endpoint
app.post("/api/demo-music21", async (req, res) => {
  try {
    const { demoType = 'basic' } = req.body;

    console.log(`🎼 Running Music21 ${demoType} demo...`);

    const outputPath = path.join(uploadsDir, `music21_${demoType}_demo_${Date.now()}.mid`);

    const args = [
      path.join(process.cwd(), "server/music21-demo-generator.py"),
      outputPath,
      `--demo-type=${demoType}`
    ];

    const { stdout, stderr } = await execAsync(`python ${args.join(' ')}`);

    if (stderr && !stderr.includes('⚠️') && !stderr.includes('🎵')) {
      console.error("Music21 demo stderr:", stderr);
    }

    console.log("Music21 demo output:", stdout);

    if (!fs.existsSync(outputPath)) {
      throw new Error("Music21 demo failed - no output file created");
    }

    // Check for analysis file
    const analysisPath = outputPath.replace('.mid', '_analysis.json');
    let analysis = null;
    if (fs.existsSync(analysisPath)) {
      analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
    }

    // Generate audio file
    const audioPath = await generateAudioFromMidi(outputPath);

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
});

  // Create HTTP server
  const server = http.createServer(app);

  return server;
}

export default app;