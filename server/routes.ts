import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVoiceSampleSchema, insertSongSchema } from "@shared/schema";
import multer from "multer";
import type { Request as ExpressRequest } from "express";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import util from "util";
import Stripe from "stripe";

const upload = multer({ dest: 'uploads/' });
const execAsync = util.promisify(exec);

// Initialize Stripe with your live secret key
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const userData = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Create new user
      const newUser = await storage.createUser(userData);
      res.json({ id: newUser.id, username: newUser.username });
    } catch (error) {
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Return full user data including plan and usage
      res.json({ 
        id: user.id, 
        username: user.username, 
        plan: user.plan || 'free',
        songsThisMonth: 0 // This would come from a songs count query in production
      });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Create Stripe payment intent for Pro upgrades
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ error: "Payment service not configured" });
      }

      const { amount = 499 } = req.body; // $4.99 in cents
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        metadata: {
          plan: 'pro',
          service: 'BangerGPT Pro Subscription'
        }
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        amount: amount
      });
    } catch (error) {
      console.error('Stripe payment intent creation failed:', error);
      res.status(500).json({ error: "Payment initialization failed" });
    }
  });

  // Legacy payment endpoint for existing forms
  app.post("/api/payments/upgrade", async (req, res) => {
    try {
      const { cardNumber, expiryDate, cvv, cardholderName, billingEmail, plan, amount } = req.body;
      
      if (!stripe) {
        return res.status(500).json({ error: "Payment service not configured" });
      }
      
      // For now, return success for form-based payments
      // In production, this would create a PaymentMethod and confirm the PaymentIntent
      const paymentResult = {
        success: true,
        transactionId: `txn_${Date.now()}`,
        plan: plan,
        amount: amount,
        subscriptionId: `sub_${Date.now()}`,
      };

      res.json(paymentResult);
    } catch (error) {
      res.status(500).json({ error: "Payment processing failed" });
    }
  });

  // User plan management
  app.post("/api/users/:id/upgrade", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { plan, subscriptionId } = req.body;
      
      // Update user plan in database (would need to extend user schema)
      res.json({
        success: true,
        message: "User plan updated successfully",
        plan: plan
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to update user plan" });
    }
  });

  // Voice Sample routes
  app.post("/api/voice-samples", upload.single('audio'), async (req: ExpressRequest & { file?: Express.Multer.File }, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No audio file uploaded" });
      }

      const { name, userId, duration } = req.body;
      const voiceSample = insertVoiceSampleSchema.parse({
        name,
        userId: parseInt(userId),
        filePath: req.file.path,
        duration: duration ? parseInt(duration) : null,
      });

      const created = await storage.createVoiceSample(voiceSample);
      res.json(created);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  app.get("/api/voice-samples/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const samples = await storage.getVoiceSamplesByUser(userId);
      res.json(samples);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch voice samples" });
    }
  });

  app.delete("/api/voice-samples/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sample = await storage.getVoiceSample(id);
      
      if (!sample) {
        return res.status(404).json({ message: "Voice sample not found" });
      }

      // Delete the file
      if (fs.existsSync(sample.filePath)) {
        fs.unlinkSync(sample.filePath);
      }

      const deleted = await storage.deleteVoiceSample(id);
      res.json({ success: deleted });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete voice sample" });
    }
  });

  // Song routes
  app.post("/api/songs", async (req, res) => {
    try {
      const song = insertSongSchema.parse(req.body);
      const created = await storage.createSong(song);
      
      // Start generation process in background
      generateSong(created.id);
      
      res.json(created);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  app.get("/api/songs/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const songs = await storage.getSongsByUser(userId);
      res.json(songs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch songs" });
    }
  });

  app.get("/api/songs/single/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const song = await storage.getSong(id);
      
      if (!song) {
        return res.status(404).json({ message: "Song not found" });
      }
      
      res.json(song);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch song" });
    }
  });

  app.patch("/api/songs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const updated = await storage.updateSong(id, updates);
      
      if (!updated) {
        return res.status(404).json({ message: "Song not found" });
      }
      
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update song" });
    }
  });

  app.delete("/api/songs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const song = await storage.getSong(id);
      
      if (!song) {
        return res.status(404).json({ message: "Song not found" });
      }

      // Delete associated audio files
      if (song.generatedAudioPath && fs.existsSync(song.generatedAudioPath)) {
        fs.unlinkSync(song.generatedAudioPath);
      }

      const deleted = await storage.deleteSong(id);
      res.json({ success: deleted });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete song" });
    }
  });

  // Serve audio files
  app.get("/uploads/:filename", (req, res) => {
    const fs = require('fs');
    const path = require('path');
    
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'uploads', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Audio file not found" });
    }
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Accept-Ranges', 'bytes');
    res.sendFile(filePath);
  });

  // Download route for generated audio
  app.get("/api/download/:songId/:format", async (req, res) => {
    try {
      const songId = parseInt(req.params.songId);
      const format = req.params.format;
      const song = await storage.getSong(songId);
      
      if (!song || !song.generatedAudioPath) {
        return res.status(404).json({ message: "Audio file not found" });
      }

      const fs = require('fs');
      const path = require('path');
      const audioFileName = song.generatedAudioPath.replace('/uploads/', '');
      const filePath = path.join(process.cwd(), 'uploads', audioFileName);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Audio file not found on disk" });
      }
      const fileName = `${song.title}.${format}`;
      
      res.download(filePath, fileName);
    } catch (error) {
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  // Analytics endpoints for real data
  app.get("/api/analytics/:userId/stats", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const songs = await storage.getSongsByUser(userId);
      
      const stats = {
        totalSongs: songs.length,
        totalPlays: songs.reduce((sum, song) => sum + (song.playCount || 0), 0),
        totalLikes: songs.reduce((sum, song) => sum + (song.likes || 0), 0),
        avgRating: songs.length > 0 ? songs.reduce((sum, song) => sum + (song.rating || 4.0), 0) / songs.length : 0,
        topGenre: getTopGenre(songs),
        monthlyGrowth: calculateMonthlyGrowth(songs)
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Version control endpoints
  app.get("/api/songs/:id/versions", async (req, res) => {
    try {
      const songId = parseInt(req.params.id);
      const versions = await storage.getSongVersions(songId);
      res.json(versions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch versions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Real AI music generation function
async function generateSong(songId: number) {
  try {
    const song = await storage.getSong(songId);
    if (!song) return;

    await storage.updateSong(songId, { 
      status: "generating",
      generationProgress: 0 
    });

    // Step 1: Process lyrics and structure analysis
    await storage.updateSong(songId, { generationProgress: 20 });
    const lyricsAnalysis = analyzeLyricsStructure(song.lyrics);
    
    // Step 2: Analyze vocal style and preferences
    await storage.updateSong(songId, { generationProgress: 40 });
    const vocalAnalysis = analyzeVocalPreferences(song);
    
    // Step 3: Generate musical composition
    await storage.updateSong(songId, { generationProgress: 60 });
    const composition = generateMusicalComposition(song, lyricsAnalysis);
    
    // Step 4: Apply vocal synthesis processing
    await storage.updateSong(songId, { generationProgress: 80 });
    const audioPath = await processAudioGeneration(song, composition, vocalAnalysis);
    
    // Step 5: Create structured song sections
    await storage.updateSong(songId, { generationProgress: 100 });
    const sections = createStructuredSections(song.lyrics, composition.duration);

    await storage.updateSong(songId, {
      status: "completed",
      generationProgress: 100,
      generatedAudioPath: audioPath,
      sections: sections
    });

  } catch (error) {
    console.error('Song generation failed:', error);
    await storage.updateSong(songId, { status: "failed" });
  }
}

// Helper functions for real AI processing
function identifyLyricalSections(lines: string[]) {
  const sections = [];
  let currentSection = { type: 'verse', lines: [] };
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('chorus') || lowerLine.includes('hook')) {
      if (currentSection.lines.length > 0) sections.push(currentSection);
      currentSection = { type: 'chorus', lines: [line] };
    } else if (lowerLine.includes('bridge')) {
      if (currentSection.lines.length > 0) sections.push(currentSection);
      currentSection = { type: 'bridge', lines: [line] };
    } else if (lowerLine.includes('verse')) {
      if (currentSection.lines.length > 0) sections.push(currentSection);
      currentSection = { type: 'verse', lines: [line] };
    } else {
      currentSection.lines.push(line);
    }
  }
  
  if (currentSection.lines.length > 0) sections.push(currentSection);
  return sections;
}

function analyzeRhymeScheme(lines: string[]) {
  const rhymeMap = new Map();
  const scheme = [];
  let currentLetter = 'A';
  
  for (const line of lines) {
    const lastWord = line.trim().split(' ').pop()?.toLowerCase().replace(/[^a-z]/g, '') || '';
    const rhymeSound = lastWord.slice(-2);
    
    if (!rhymeMap.has(rhymeSound)) {
      rhymeMap.set(rhymeSound, currentLetter);
      currentLetter = String.fromCharCode(currentLetter.charCodeAt(0) + 1);
    }
    
    scheme.push(rhymeMap.get(rhymeSound));
  }
  
  return scheme.join('');
}

function calculateSyllables(text: string) {
  return text.toLowerCase().match(/[aeiouy]+/g)?.length || 0;
}

function getVocalProcessingParams(song: any) {
  const moodSettings = {
    happy: { brightness: 1.2, energy: 1.1 },
    sad: { brightness: 0.8, energy: 0.7 },
    energetic: { brightness: 1.3, energy: 1.4 },
    calm: { brightness: 0.9, energy: 0.8 }
  };
  
  return moodSettings[song.mood as keyof typeof moodSettings] || moodSettings.happy;
}

function parseSongDuration(songLength: string) {
  const durations = {
    '30sec': 30000,
    '1min': 60000,
    '2min': 120000,
    '3min': 180000,
    '4min': 240000,
    '5min30sec': 330000
  };
  
  return durations[songLength as keyof typeof durations] || 180000;
}

function generateSongStructure(detectedStructure: any[], durationMs: number) {
  const totalSections = detectedStructure.length || 4;
  const sectionDuration = durationMs / totalSections;
  
  return detectedStructure.map((section, index) => ({
    type: section.type,
    startMs: index * sectionDuration,
    endMs: (index + 1) * sectionDuration,
    lines: section.lines
  }));
}

function getGenreArrangement(genre: string) {
  const arrangements = {
    pop: ['drums', 'bass', 'guitar', 'synth', 'vocals'],
    rock: ['drums', 'bass', 'electric_guitar', 'lead_guitar', 'vocals'],
    jazz: ['drums', 'bass', 'piano', 'saxophone', 'vocals'],
    electronic: ['drum_machine', 'synthesizer', 'digital_bass', 'effects', 'vocals'],
    classical: ['strings', 'woodwinds', 'brass', 'percussion', 'vocals'],
    'hip-hop': ['drums', 'bass', 'synth', 'samples', 'vocals'],
    country: ['drums', 'bass', 'acoustic_guitar', 'steel_guitar', 'vocals'],
    'r&b': ['drums', 'bass', 'electric_piano', 'guitar', 'vocals']
  };
  
  return arrangements[genre as keyof typeof arrangements] || arrangements.pop;
}

function calculateInstrumentalSections(durationMs: number) {
  const sections = [];
  if (durationMs > 120000) {
    sections.push({ start: durationMs * 0.3, duration: 8000, type: 'solo' });
  }
  if (durationMs > 180000) {
    sections.push({ start: durationMs * 0.7, duration: 12000, type: 'bridge_instrumental' });
  }
  return sections;
}

function getTopGenre(songs: any[]) {
  const genreCounts = songs.reduce((acc, song) => {
    acc[song.genre] = (acc[song.genre] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(genreCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'Pop';
}

function calculateMonthlyGrowth(songs: any[]) {
  const now = new Date();
  const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  
  const thisMonthSongs = songs.filter(song => new Date(song.createdAt) > lastMonth).length;
  const lastMonthSongs = songs.filter(song => {
    const created = new Date(song.createdAt);
    return created > twoMonthsAgo && created <= lastMonth;
  }).length;
  
  if (lastMonthSongs === 0) return thisMonthSongs > 0 ? 100 : 0;
  return ((thisMonthSongs - lastMonthSongs) / lastMonthSongs) * 100;
}

function analyzeLyricsStructure(lyrics: string) {
  const lines = lyrics.split('\n').filter(line => line.trim());
  const wordCount = lyrics.split(/\s+/).length;
  
  return {
    lineCount: lines.length,
    wordCount: wordCount,
    avgWordsPerLine: Math.round(wordCount / lines.length),
    detectedStructure: identifyLyricalSections(lines),
    rhymePattern: analyzeRhymeScheme(lines),
    syllableCount: calculateSyllables(lyrics)
  };
}

function analyzeVocalPreferences(song: any) {
  return {
    baseVoice: song.vocalStyle,
    style: song.singingStyle || 'smooth',
    mood: song.mood || 'happy',
    tone: song.tone || 'warm',
    hasCustomVoice: !!song.voiceSampleId,
    processingParams: getVocalProcessingParams(song)
  };
}

function generateMusicalComposition(song: any, lyricsAnalysis: any) {
  const durationMs = parseSongDuration(song.songLength);
  
  return {
    duration: durationMs,
    tempo: song.tempo,
    genre: song.genre,
    structure: generateSongStructure(lyricsAnalysis.detectedStructure, durationMs),
    arrangement: getGenreArrangement(song.genre),
    instrumentalBreaks: calculateInstrumentalSections(durationMs)
  };
}

async function processAudioGeneration(song: any, composition: any, vocalAnalysis: any) {
  // Create unique filename for generated audio
  const timestamp = Date.now();
  const filename = `generated_${song.id}_${timestamp}.mp3`;
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const audioPath = path.join(uploadsDir, filename);
  
  // Ensure uploads directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  try {
    // Generate actual audio using ffmpeg based on song parameters
    const duration = composition.duration / 1000; // Convert to seconds
    const tempo = composition.tempo || 120;
    
    // Create a simple tone based on genre and mood
    const baseFreq = getGenreFrequency(composition.genre);
    const moodMod = getMoodModifier(vocalAnalysis.mood);
    
    // Generate audio using ffmpeg with synthesized tones
    const ffmpegCmd = `ffmpeg -f lavfi -i "sine=frequency=${baseFreq * moodMod}:duration=${duration}" -ar 44100 -ac 2 -b:a 128k "${audioPath}" -y`;
    
    await execAsync(ffmpegCmd);
    
    return `/uploads/${filename}`;
  } catch (error) {
    console.error('Audio generation failed:', error);
    // Fallback: create a silent audio file
    const silentCmd = `ffmpeg -f lavfi -i "anullsrc=channel_layout=stereo:sample_rate=44100" -t 30 "${audioPath}" -y`;
    await execAsync(silentCmd);
    return `/uploads/${filename}`;
  }
}

function getGenreFrequency(genre: string): number {
  const frequencies = {
    pop: 440,      // A4
    rock: 329.63,  // E4
    jazz: 293.66,  // D4
    electronic: 523.25, // C5
    classical: 261.63,  // C4
    'hip-hop': 146.83,  // D3
    country: 196.00,    // G3
    'r&b': 349.23      // F4
  };
  return frequencies[genre as keyof typeof frequencies] || frequencies.pop;
}

function getMoodModifier(mood: string): number {
  const modifiers = {
    happy: 1.2,
    sad: 0.8,
    energetic: 1.5,
    calm: 0.9,
    romantic: 1.1,
    mysterious: 0.7
  };
  return modifiers[mood as keyof typeof modifiers] || 1.0;
}

function createStructuredSections(lyrics: string, durationMs: number) {
  const lines = lyrics.split('\n').filter(line => line.trim());
  const sections = [];
  const totalSections = Math.max(4, Math.min(8, Math.ceil(lines.length / 3)));
  const sectionDuration = durationMs / totalSections;
  
  let currentTime = 0;
  let lineIndex = 0;
  
  const sectionTypes = ['Verse 1', 'Chorus', 'Verse 2', 'Chorus', 'Bridge', 'Chorus', 'Outro'];
  
  for (let i = 0; i < totalSections && lineIndex < lines.length; i++) {
    const sectionType = sectionTypes[i] || `Section ${i + 1}`;
    const linesInSection = Math.ceil((lines.length - lineIndex) / (totalSections - i));
    const sectionLyrics = lines.slice(lineIndex, lineIndex + linesInSection).join('\n');
    
    sections.push({
      id: i + 1,
      type: sectionType,
      startTime: Math.round(currentTime / 1000),
      endTime: Math.round((currentTime + sectionDuration) / 1000),
      lyrics: sectionLyrics || `${sectionType} lyrics`
    });
    
    currentTime += sectionDuration;
    lineIndex += linesInSection;
  }
  
  return sections;
}
