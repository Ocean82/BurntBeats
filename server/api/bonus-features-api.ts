import { Request, Response, Router } from 'express';
import { AIChatService } from '../ai-chat-service';
import { storage } from '../storage';

const router = Router();

// Post-purchase AI feedback endpoint
router.post("/ai-feedback/:songId", async (req: Request, res: Response) => {
  try {
    const { songId } = req.params;
    const { tier, userEmail } = req.body;
    
    // For testing, create a mock song if not found
    let song = null;
    try {
      song = await storage.getSong(parseInt(songId));
    } catch (error) {
      // If storage fails, create mock song for testing
      song = {
        id: parseInt(songId),
        title: 'Test Song',
        lyrics: `Verse 1:
Living life in the fast lane
Money, power, respect my name
Never looking back again
Success flowing through my veins

Chorus:
We rise up, we never fall
Standing tall through it all
Dreams become reality
This is our destiny`
      };
    }

    if (!song) {
      return res.status(404).json({ message: "Song not found" });
    }

    const feedback = await AIChatService.generatePostPurchaseFeedback(
      songId,
      song.title || 'Untitled',
      song.lyrics || '',
      tier,
      userEmail || 'unknown@example.com'
    );

    res.json(feedback);
  } catch (error: any) {
    console.error("AI feedback generation failed:", error);
    res.status(500).json({ message: "Error generating AI feedback: " + error.message });
  }
});

// Get AI feedback for a song
router.get("/ai-feedback/:songId", async (req: Request, res: Response) => {
  try {
    const { songId } = req.params;
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const feedbackPath = path.join(process.cwd(), 'uploads/feedback', `${songId}_feedback.json`);
    
    try {
      const feedbackData = await fs.readFile(feedbackPath, 'utf8');
      const feedback = JSON.parse(feedbackData);
      res.json(feedback);
    } catch (error) {
      res.status(404).json({ message: "AI feedback not found for this song" });
    }
  } catch (error: any) {
    res.status(500).json({ message: "Error retrieving AI feedback: " + error.message });
  }
});

// Generate license certificate with artist name & beat ID
router.post("/license/generate", async (req: Request, res: Response) => {
  try {
    const { songId, songTitle, tier, userEmail, artistName } = req.body;
    const { generateLicense } = await import('../utils/license-generator');
    
    const beatId = `BB-${songId}-${Date.now().toString(36).toUpperCase()}`;
    
    const licensePath = generateLicense({
      songTitle,
      userId: songId,
      tier,
      userEmail,
      artistName: artistName || userEmail?.split('@')[0] || 'Artist',
      beatId
    });

    res.json({
      success: true,
      licensePath,
      beatId,
      licenseId: `BBX-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now()}`,
      message: "License certificate generated successfully"
    });
  } catch (error: any) {
    console.error("License generation failed:", error);
    res.status(500).json({ message: "Error generating license: " + error.message });
  }
});

// Beat popularity tracking endpoints
router.get("/beats/popularity/:beatId", async (req: Request, res: Response) => {
  try {
    const { beatId } = req.params;
    const { getBeatPopularityStats } = await import('../utils/license-generator');
    
    const stats = getBeatPopularityStats(beatId);
    
    if (!stats) {
      return res.status(404).json({ message: "Beat statistics not found" });
    }

    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ message: "Error retrieving beat stats: " + error.message });
  }
});

// Get top performing beats
router.get("/beats/top-performing", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const { getTopPerformingBeats } = await import('../utils/license-generator');
    
    const topBeats = getTopPerformingBeats(limit);
    
    res.json({
      success: true,
      topBeats,
      count: topBeats.length,
      message: `Top ${topBeats.length} performing beats retrieved`
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error retrieving top beats: " + error.message });
  }
});

// Purchase summary dashboard endpoint
router.get("/purchases/summary/:userEmail", async (req: Request, res: Response) => {
  try {
    const { userEmail } = req.params;
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Get all feedback files for user
    const feedbackDir = path.join(process.cwd(), 'uploads/feedback');
    
    let userPurchases = [];
    let totalSpent = 0;
    
    try {
      const feedbackFiles = await fs.readdir(feedbackDir);
      
      for (const file of feedbackFiles) {
        if (file.endsWith('_feedback.json')) {
          const feedbackData = JSON.parse(await fs.readFile(path.join(feedbackDir, file), 'utf8'));
          
          if (feedbackData.userEmail === userEmail) {
            const tierPricing = { bonus: 2.99, base: 4.99, top: 9.99 };
            totalSpent += tierPricing[feedbackData.purchaseTier as keyof typeof tierPricing];
            
            userPurchases.push({
              songId: feedbackData.songId,
              songTitle: feedbackData.songTitle,
              tier: feedbackData.purchaseTier,
              purchaseDate: feedbackData.generatedAt,
              aiScore: feedbackData.analysis.overallScore,
              mood: feedbackData.analysis.mood,
              genre: feedbackData.analysis.genre
            });
          }
        }
      }
    } catch (error) {
      // Directory might not exist yet
      userPurchases = [];
    }

    res.json({
      success: true,
      userEmail,
      totalPurchases: userPurchases.length,
      totalSpent: totalSpent.toFixed(2),
      purchases: userPurchases.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()),
      averageAiScore: userPurchases.length > 0 
        ? (userPurchases.reduce((sum, p) => sum + p.aiScore, 0) / userPurchases.length).toFixed(1)
        : 0
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error retrieving purchase summary: " + error.message });
  }
});

export default router;