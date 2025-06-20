import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVoiceSampleSchema, insertSongSchema } from "@shared/schema";
import multer from "multer";
import type { Request as ExpressRequest } from "express";
import path from "path";
import fs from "fs";

const upload = multer({ dest: 'uploads/' });

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

      res.json({ id: user.id, username: user.username });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Payment processing routes
  app.post("/api/payments/upgrade", async (req, res) => {
    try {
      const { cardNumber, expiryDate, cvv, cardholderName, billingEmail, plan, amount } = req.body;
      
      // In production, integrate with Stripe or another payment processor
      // For now, simulate successful payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock payment validation
      if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
        return res.status(400).json({ error: "Invalid payment details" });
      }

      // Simulate payment success (replace with real Stripe integration)
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

  // Download route for generated audio
  app.get("/api/download/:songId/:format", async (req, res) => {
    try {
      const songId = parseInt(req.params.songId);
      const format = req.params.format;
      const song = await storage.getSong(songId);
      
      if (!song || !song.generatedAudioPath) {
        return res.status(404).json({ message: "Audio file not found" });
      }

      const filePath = song.generatedAudioPath;
      const fileName = `${song.title}.${format}`;
      
      res.download(filePath, fileName);
    } catch (error) {
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Mock AI music generation function
async function generateSong(songId: number) {
  try {
    const song = await storage.getSong(songId);
    if (!song) return;

    // Update status to generating
    await storage.updateSong(songId, { 
      status: "generating",
      generationProgress: 0 
    });

    // Simulate generation progress
    const steps = [
      { progress: 20, message: "Processing lyrics" },
      { progress: 40, message: "Analyzing style preferences" },
      { progress: 60, message: "Generating audio composition" },
      { progress: 80, message: "Adding vocal synthesis" },
      { progress: 100, message: "Final processing" }
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      await storage.updateSong(songId, { generationProgress: step.progress });
    }

    // Generate mock sections
    const sections = [
      { id: 1, type: "Verse 1", startTime: 0, endTime: 45, lyrics: song.lyrics.split('\n')[0] || "Verse 1 lyrics" },
      { id: 2, type: "Chorus", startTime: 45, endTime: 90, lyrics: song.lyrics.split('\n')[1] || "Chorus lyrics" },
      { id: 3, type: "Verse 2", startTime: 90, endTime: 135, lyrics: song.lyrics.split('\n')[2] || "Verse 2 lyrics" },
      { id: 4, type: "Chorus", startTime: 135, endTime: 180, lyrics: song.lyrics.split('\n')[1] || "Chorus lyrics" },
      { id: 5, type: "Bridge", startTime: 180, endTime: 210, lyrics: song.lyrics.split('\n')[3] || "Bridge lyrics" },
    ];

    // Mark as completed
    await storage.updateSong(songId, {
      status: "completed",
      generationProgress: 100,
      generatedAudioPath: `/uploads/generated_${songId}.mp3`,
      sections: sections
    });

  } catch (error) {
    await storage.updateSong(songId, { status: "failed" });
  }
}
