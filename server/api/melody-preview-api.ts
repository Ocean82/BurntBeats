
import { Router } from 'express';
import { MelodyPreviewService } from '../services/melody-preview-service';
import { auth } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Generate a single melody preview
router.post('/generate', auth, rateLimiter, async (req, res) => {
  try {
    const { melodyId, genre, mood, tempo, key, sampleLyrics } = req.body;

    // Validate required fields
    if (!melodyId || !genre || !mood || !tempo || !key) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: melodyId, genre, mood, tempo, key'
      });
    }

    // Validate tempo range
    if (tempo < 40 || tempo > 200) {
      return res.status(400).json({
        success: false,
        error: 'Tempo must be between 40 and 200 BPM'
      });
    }

    const config = {
      melodyId,
      genre,
      mood,
      tempo: parseInt(tempo),
      key,
      sampleLyrics,
      duration: 7 // 7 seconds for previews
    };

    console.log(`🎵 Generating melody preview for ${genre} style...`);
    const preview = await MelodyPreviewService.generateMelodyPreview(config);

    res.json({
      success: true,
      preview: {
        id: preview.id,
        audioUrl: preview.audioUrl,
        lyrics: preview.lyrics,
        genre: preview.genre,
        mood: preview.mood,
        tempo: preview.tempo,
        key: preview.key,
        duration: preview.duration,
        metadata: preview.metadata
      }
    });

  } catch (error) {
    console.error('Melody preview generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate melody preview'
    });
  }
});

// Generate multiple melody previews for different genres
router.post('/generate-batch', auth, rateLimiter, async (req, res) => {
  try {
    const { baseConfig, genres } = req.body;

    if (!baseConfig || !genres || !Array.isArray(genres)) {
      return res.status(400).json({
        success: false,
        error: 'Missing baseConfig or genres array'
      });
    }

    const configs = genres.map((genre: string, index: number) => ({
      melodyId: `${baseConfig.melodyId}_${genre}_${index}`,
      genre,
      mood: baseConfig.mood || 'happy',
      tempo: baseConfig.tempo || 120,
      key: baseConfig.key || 'C',
      sampleLyrics: baseConfig.sampleLyrics,
      duration: 7
    }));

    console.log(`🎵 Generating ${configs.length} melody previews...`);
    const previews = await MelodyPreviewService.generateMultiplePreviews(configs);

    res.json({
      success: true,
      previews: previews.map(preview => ({
        id: preview.id,
        audioUrl: preview.audioUrl,
        lyrics: preview.lyrics,
        genre: preview.genre,
        mood: preview.mood,
        tempo: preview.tempo,
        key: preview.key,
        duration: preview.duration,
        metadata: preview.metadata
      })),
      generated: previews.length,
      requested: configs.length
    });

  } catch (error) {
    console.error('Batch melody preview generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate melody previews'
    });
  }
});

// Get available genres and their sample lyrics
router.get('/genres', async (req, res) => {
  try {
    const genres = {
      pop: {
        description: 'Catchy, mainstream melodies with broad appeal',
        sampleLyrics: 'Dancing through the night, feeling so alive',
        vocalStyle: 'smooth',
        singingStyle: 'melodic'
      },
      rock: {
        description: 'Powerful, energetic melodies with strong rhythms',
        sampleLyrics: 'Breaking down the walls with electric fire',
        vocalStyle: 'powerful',
        singingStyle: 'powerful'
      },
      jazz: {
        description: 'Sophisticated melodies with complex harmonies',
        sampleLyrics: 'Midnight blues and saxophone dreams',
        vocalStyle: 'smooth',
        singingStyle: 'melodic'
      },
      electronic: {
        description: 'Digital soundscapes with synthetic textures',
        sampleLyrics: 'Pulse of the city, neon lights glow',
        vocalStyle: 'smooth',
        singingStyle: 'rhythmic'
      },
      classical: {
        description: 'Elegant melodies with traditional orchestration',
        sampleLyrics: 'Graceful notes dance through the air',
        vocalStyle: 'smooth',
        singingStyle: 'melodic'
      },
      hiphop: {
        description: 'Rhythmic melodies with strong beats',
        sampleLyrics: 'Beats drop heavy, rhythm in my soul',
        vocalStyle: 'powerful',
        singingStyle: 'rhythmic'
      },
      country: {
        description: 'Traditional melodies with storytelling focus',
        sampleLyrics: 'Down the dusty road with my guitar',
        vocalStyle: 'warm',
        singingStyle: 'melodic'
      },
      rnb: {
        description: 'Smooth melodies with soulful expression',
        sampleLyrics: 'Smooth vocals floating on silk',
        vocalStyle: 'smooth',
        singingStyle: 'melodic'
      }
    };

    res.json({
      success: true,
      genres
    });

  } catch (error) {
    console.error('Error fetching genres:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch genre information'
    });
  }
});

// Cleanup old preview files
router.post('/cleanup', auth, async (req, res) => {
  try {
    await MelodyPreviewService.cleanupOldPreviews();
    
    res.json({
      success: true,
      message: 'Old preview files cleaned up'
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup preview files'
    });
  }
});

export default router;
