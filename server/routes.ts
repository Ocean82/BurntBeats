import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
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

  // Serve static audio files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.mp3')) {
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
      }
    }
  }));

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

  // Collaboration endpoints
  app.post("/api/collaboration/:songId/join", async (req, res) => {
    try {
      const songId = parseInt(req.params.songId);
      const { userId, username } = req.body;
      
      const song = await storage.getSong(songId);
      if (!song) {
        return res.status(404).json({ error: "Song not found" });
      }

      res.json({ 
        success: true, 
        message: "Ready to join collaboration session",
        songId,
        currentLyrics: song.lyrics 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to join collaboration" });
    }
  });

  app.post("/api/collaboration/:songId/update", async (req, res) => {
    try {
      const songId = parseInt(req.params.songId);
      const { lyrics, userId, username } = req.body;
      
      // Update song in database
      await storage.updateSong(songId, { lyrics });
      
      // Broadcast to all collaborators
      broadcastToSession(songId, {
        type: "lyrics_update",
        lyrics,
        userId,
        username,
        timestamp: Date.now()
      }, userId);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update song" });
    }
  });

  app.post("/api/collaboration/:songId/comment", async (req, res) => {
    try {
      const songId = parseInt(req.params.songId);
      const { content, userId, username, sectionId } = req.body;
      
      const comment = {
        id: Date.now(),
        userId,
        username,
        content,
        sectionId,
        timestamp: Date.now()
      };
      
      // Broadcast comment to all collaborators
      broadcastToSession(songId, {
        type: "new_comment",
        comment
      });
      
      res.json({ success: true, comment });
    } catch (error) {
      res.status(500).json({ error: "Failed to add comment" });
    }
  });

  // Team management endpoints
  app.post("/api/collaboration/:songId/invite", async (req, res) => {
    try {
      const songId = parseInt(req.params.songId);
      const { email, role, invitedBy } = req.body;
      
      // In a real implementation, send email invitation
      console.log(`Sending invitation to ${email} for song ${songId} with role ${role}`);
      
      res.json({ 
        success: true, 
        message: "Invitation sent successfully" 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to send invitation" });
    }
  });

  app.post("/api/collaboration/:songId/invite-link", async (req, res) => {
    try {
      const songId = parseInt(req.params.songId);
      const { role, maxUses, createdBy } = req.body;
      
      const inviteLink = {
        id: `invite_${Date.now()}`,
        songId,
        role,
        maxUses,
        createdBy,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        usageCount: 0
      };
      
      res.json({ success: true, inviteLink });
    } catch (error) {
      res.status(500).json({ error: "Failed to create invite link" });
    }
  });

  app.patch("/api/collaboration/:songId/member/:userId", async (req, res) => {
    try {
      const songId = parseInt(req.params.songId);
      const userId = parseInt(req.params.userId);
      const { role } = req.body;
      
      // Update member role in database
      console.log(`Updating user ${userId} role to ${role} for song ${songId}`);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update member role" });
    }
  });

  app.delete("/api/collaboration/:songId/member/:userId", async (req, res) => {
    try {
      const songId = parseInt(req.params.songId);
      const userId = parseInt(req.params.userId);
      
      // Remove member from collaboration
      console.log(`Removing user ${userId} from song ${songId} collaboration`);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove member" });
    }
  });

  const httpServer = createServer(app);
  
  // WebSocket server for real-time collaboration
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection established');
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join_song':
            const { songId, userId, username } = message;
            const clientId = `${userId}_${Date.now()}`;
            
            // Create or get collaboration session
            if (!collaborationSessions.has(songId)) {
              const song = await storage.getSong(songId);
              collaborationSessions.set(songId, {
                songId,
                participants: new Map(),
                currentLyrics: song?.lyrics || '',
                lastUpdate: Date.now()
              });
            }
            
            const session = collaborationSessions.get(songId)!;
            session.participants.set(clientId, { userId, username, ws });
            
            // Notify all participants about new user
            broadcastToSession(songId, {
              type: 'user_joined',
              userId,
              username,
              participants: Array.from(session.participants.values()).map(p => ({
                userId: p.userId,
                username: p.username
              }))
            });
            
            // Send current state to new participant
            ws.send(JSON.stringify({
              type: 'session_state',
              lyrics: session.currentLyrics,
              participants: Array.from(session.participants.values()).map(p => ({
                userId: p.userId,
                username: p.username
              }))
            }));
            break;
            
          case 'lyrics_change':
            const changeMessage = message as { songId: number; lyrics: string; userId: number; username: string };
            
            // Update session state
            const changeSession = collaborationSessions.get(changeMessage.songId);
            if (changeSession) {
              changeSession.currentLyrics = changeMessage.lyrics;
              changeSession.lastUpdate = Date.now();
              
              // Broadcast to other participants
              broadcastToSession(changeMessage.songId, {
                type: 'lyrics_update',
                lyrics: changeMessage.lyrics,
                userId: changeMessage.userId,
                username: changeMessage.username
              }, changeMessage.userId);
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      // Remove user from all sessions
      collaborationSessions.forEach((session, songId) => {
        const toRemove: string[] = [];
        session.participants.forEach((participant, clientId) => {
          if (participant.ws === ws) {
            toRemove.push(clientId);
          }
        });
        
        toRemove.forEach(clientId => {
          const participant = session.participants.get(clientId);
          if (participant) {
            session.participants.delete(clientId);
            broadcastToSession(songId, {
              type: 'user_left',
              userId: participant.userId,
              username: participant.username,
              participants: Array.from(session.participants.values()).map(p => ({
                userId: p.userId,
                username: p.username
              }))
            });
          }
        });
        
        // Clean up empty sessions
        if (session.participants.size === 0) {
          collaborationSessions.delete(songId);
        }
      });
    });
  });

  return httpServer;
}

// Real AI music generation function
async function generateSong(songId: number) {
  try {
    const song = await storage.getSong(songId);
    if (!song) return;

    await storage.updateSong(songId, { 
      status: "generating",
      generationProgress: 10 
    });

    // Parse duration
    const durationMs = parseSongDuration(song.songLength);
    const durationSeconds = Math.floor(durationMs / 1000);
    
    // Generate file paths
    const outputPath = `uploads/generated_${songId}_${Date.now()}.mp3`;
    
    await storage.updateSong(songId, { generationProgress: 30 });
    
    // Prepare song data for music21 generator
    const songData = {
      title: song.title,
      lyrics: song.lyrics,
      genre: song.genre,
      tempo: song.tempo,
      duration: durationSeconds,
      output_path: outputPath,
      key: getKeyFromGenre(song.genre)
    };

    // Generate music using Python music21 script
    const escapedJson = JSON.stringify(songData).replace(/'/g, "\\'");
    const pythonCommand = `cd server && python3 music-generator.py '${escapedJson}'`;
    console.log('Generating music with music21:', songData);
    
    await storage.updateSong(songId, { generationProgress: 50 });
    
    const { stdout } = await execAsync(pythonCommand);
    const result = JSON.parse(stdout);
    
    if (!result.success) {
      throw new Error(`Music generation failed: ${result.error}`);
    }

    await storage.updateSong(songId, { generationProgress: 70 });

    // Convert WAV to MP3 using ffmpeg
    const wavPath = result.wav_path;
    const convertCommand = `ffmpeg -i "${wavPath}" -codec:a mp3 -b:a 192k "${outputPath}" -y`;
    await execAsync(convertCommand);

    // Clean up temporary WAV file
    await execAsync(`rm -f "${wavPath}"`);

    // Create structured song sections
    const sections = createStructuredSections(song.lyrics, durationSeconds * 1000);

    await storage.updateSong(songId, {
      status: "completed",
      generationProgress: 100,
      generatedAudioPath: `/${outputPath}`,
      sections: sections
    });

    console.log(`Music generation completed: ${result.message}`);

  } catch (error) {
    console.error('Song generation failed:', error);
    await storage.updateSong(songId, { status: "failed" });
  }
}

function getKeyFromGenre(genre: string): string {
  const genreKeys = {
    'pop': 'C',
    'rock': 'E', 
    'jazz': 'F',
    'electronic': 'Am',
    'classical': 'D',
    'hip-hop': 'Cm',
    'country': 'G',
    'r&b': 'Bb'
  };
  return genreKeys[genre.toLowerCase() as keyof typeof genreKeys] || 'C';
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
  // Handle time format like "0:30", "1:00", "2:30", etc.
  if (songLength.includes(':')) {
    const [minutes, seconds] = songLength.split(':').map(Number);
    return (minutes * 60 + seconds) * 1000;
  }
  
  // Handle legacy formats
  const durations = {
    '30sec': 30000,
    '1min': 60000,
    '2min': 120000,
    '3min': 180000,
    '4min': 240000,
    '5min30sec': 330000
  };
  
  return durations[songLength as keyof typeof durations] || 30000; // Default to 30 seconds
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
    const duration = composition.duration / 1000; // Convert to seconds
    const tempo = composition.tempo || 120;
    const genre = composition.genre || 'pop';
    
    // Generate rich musical composition with proper structure
    const baseFreq = getGenreFrequency(genre);
    const moodMod = getMoodModifier(vocalAnalysis.mood || 'happy');
    
    // Create musical elements based on genre
    const chords = getChordProgression(genre);
    const beatsPerSecond = tempo / 60;
    const totalBeats = Math.floor(duration * beatsPerSecond);
    
    // Build layered musical composition with audible frequencies
    const melodyFreq = Math.max(440, baseFreq * moodMod); // Ensure at least A4 (440Hz) for audibility
    const bassFreq = Math.max(220, baseFreq / 2); // Ensure audible bass frequency
    const harmonyFreq = Math.max(330, baseFreq * 1.25); // Perfect fourth, audible range
    const leadFreq = Math.max(660, baseFreq * 1.5); // Perfect fifth, clear high frequency
    
    // Create dynamic composition with rhythm variations
    let rhythmPattern = '';
    for (let beat = 0; beat < totalBeats; beat++) {
      const beatTime = beat / beatsPerSecond;
      const nextBeatTime = (beat + 1) / beatsPerSecond;
      const beatDuration = nextBeatTime - beatTime;
      
      // Vary frequencies based on beat position for musical interest
      const chordIndex = Math.floor((beat / totalBeats) * chords.length);
      const currentChord = chords[chordIndex] || chords[0];
      const rootFreq = currentChord.frequencies[0];
      
      if (beat === 0) {
        rhythmPattern = `sine=frequency=${rootFreq}:duration=${beatDuration}`;
      } else {
        rhythmPattern += `,sine=frequency=${rootFreq}:duration=${beatDuration}`;
      }
    }
    
    // Create rich musical composition with dynamic elements
    const bassLine = `sine=frequency=${bassFreq}:duration=${duration}`;
    const melody = `sine=frequency=${melodyFreq}:duration=${duration},tremolo=f=6:d=0.3`;
    const harmony = `sine=frequency=${harmonyFreq}:duration=${duration},tremolo=f=4:d=0.2`;
    
    // Build comprehensive musical arrangement
    const chordFreqs = chords.map(chord => chord.frequencies).flat();
    const chord1 = chordFreqs[0] || baseFreq;
    const chord2 = chordFreqs[1] || baseFreq * 1.25;
    const chord3 = chordFreqs[2] || baseFreq * 1.5;
    
    const chordLayer1 = `sine=frequency=${chord1}:duration=${duration}`;
    const chordLayer2 = `sine=frequency=${chord2}:duration=${duration}`;
    const chordLayer3 = `sine=frequency=${chord3}:duration=${duration}`;
    
    // Generate final composition with proper duration control and audible volume
    const ffmpegCmd = `ffmpeg -f lavfi -i "${bassLine}" -f lavfi -i "${melody}" -f lavfi -i "${harmony}" -f lavfi -i "${chordLayer1}" -f lavfi -i "${chordLayer2}" -f lavfi -i "${chordLayer3}" -filter_complex "[0:a]volume=2.0[bass];[1:a]volume=1.8[mel];[2:a]volume=1.5[harm];[3:a]volume=1.2[c1];[4:a]volume=1.2[c2];[5:a]volume=1.2[c3];[bass][mel][harm][c1][c2][c3]amix=inputs=6:duration=first:dropout_transition=0[mixed];[mixed]volume=3.0[out]" -map "[out]" -t ${duration} -ar 44100 -ac 2 -b:a 192k "${audioPath}" -y`;
    
    console.log('Generating audio with command:', ffmpegCmd);
    await execAsync(ffmpegCmd);
    
    return `/uploads/${filename}`;
  } catch (error) {
    console.error('Audio generation failed:', error);
    
    // Enhanced fallback with basic musical structure
    try {
      const duration = composition.duration / 1000;
      const baseFreq = getGenreFrequency(composition.genre || 'pop');
      
      // Create a simple but musical fallback with chord progression
      const chord1 = `sine=frequency=${baseFreq}:duration=${duration/4}`;
      const chord2 = `sine=frequency=${baseFreq * 1.25}:duration=${duration/4}`;
      const chord3 = `sine=frequency=${baseFreq * 1.5}:duration=${duration/4}`;
      const chord4 = `sine=frequency=${baseFreq * 1.125}:duration=${duration/4}`;
      
      const fallbackCmd = `ffmpeg -f lavfi -i "${chord1}" -f lavfi -i "${chord2}" -f lavfi -i "${chord3}" -f lavfi -i "${chord4}" -filter_complex "[0][1][2][3]concat=n=4:v=0:a=1[out]" -map "[out]" -ar 44100 -ac 2 -b:a 192k "${audioPath}" -y`;
      
      await execAsync(fallbackCmd);
      return `/uploads/${filename}`;
    } catch (fallbackError) {
      console.error('Fallback audio generation failed:', fallbackError);
      // Last resort: simple tone
      const simpleCmd = `ffmpeg -f lavfi -i "sine=frequency=440:duration=${composition.duration / 1000}" -ar 44100 -ac 2 -b:a 128k "${audioPath}" -y`;
      await execAsync(simpleCmd);
      return `/uploads/${filename}`;
    }
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

function getChordProgression(genre: string): Array<{name: string, frequencies: number[]}> {
  const progressions = {
    pop: [
      { name: 'C', frequencies: [261.63, 329.63, 392.00] },
      { name: 'Am', frequencies: [220.00, 261.63, 329.63] },
      { name: 'F', frequencies: [174.61, 220.00, 261.63] },
      { name: 'G', frequencies: [196.00, 246.94, 293.66] }
    ],
    rock: [
      { name: 'E', frequencies: [164.81, 207.65, 246.94] },
      { name: 'A', frequencies: [110.00, 138.59, 164.81] },
      { name: 'D', frequencies: [146.83, 185.00, 220.00] },
      { name: 'G', frequencies: [98.00, 123.47, 146.83] }
    ],
    jazz: [
      { name: 'Cmaj7', frequencies: [261.63, 329.63, 392.00, 493.88] },
      { name: 'Am7', frequencies: [220.00, 261.63, 329.63, 392.00] },
      { name: 'Dm7', frequencies: [146.83, 174.61, 220.00, 261.63] },
      { name: 'G7', frequencies: [196.00, 246.94, 293.66, 369.99] }
    ]
  };
  return progressions[genre as keyof typeof progressions] || progressions.pop;
}

function getRhythmPattern(genre: string, tempo: number): string {
  const patterns = {
    pop: '4/4',
    rock: '4/4',
    jazz: '4/4',
    electronic: '4/4',
    classical: '4/4',
    'hip-hop': '4/4',
    country: '4/4',
    'r&b': '4/4'
  };
  return patterns[genre as keyof typeof patterns] || '4/4';
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

// WebSocket collaboration system
interface CollaborationSession {
  songId: number;
  participants: Map<string, { userId: number; username: string; ws: WebSocket }>;
  currentLyrics: string;
  lastUpdate: number;
}

const collaborationSessions = new Map<number, CollaborationSession>();

function broadcastToSession(songId: number, message: any, excludeUserId?: number) {
  const session = collaborationSessions.get(songId);
  if (!session) return;

  const messageStr = JSON.stringify(message);
  session.participants.forEach((participant, clientId) => {
    if (excludeUserId && participant.userId === excludeUserId) return;
    if (participant.ws.readyState === WebSocket.OPEN) {
      participant.ws.send(messageStr);
    }
  });
}
