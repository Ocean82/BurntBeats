import express from 'express';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Generate melody preview
router.post('/generate', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { lyrics, genre, tempo, key } = req.body;

    if (!lyrics || typeof lyrics !== 'string') {
      return res.status(400).json({ success: false, message: 'Lyrics are required' });
    }

    const { MelodyGenerator } = await import('../melody-generator');
    const melodyGenerator = MelodyGenerator.getInstance();

    const result = await melodyGenerator.generateMelodyFromLyrics({
      lyrics,
      genre: genre || 'pop',
      mood: 'happy',
      tempo: tempo || 120,
      key: key || 'C'
    });

    res.json({
      success: true,
      data: {
        melodyPath: result.audioData?.audioPath || '/uploads/default-melody.wav',
        duration: result.audioData?.metadata?.duration || 60,
        key: result.audioData?.metadata?.key || 'C',
        tempo: result.audioData?.metadata?.tempo || 120,
        structure: result.phrases || [],
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Melody generation error:', error);
    res.status(500).json({ success: false, message: 'Melody generation failed' });
  }
});

// Get melody analysis
router.get('/analyze/:melodyId', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { melodyId } = req.params;
    
    const { MusicTheoryAnalyzer } = await import('../music-theory-analyzer');
    const analyzer = new MusicTheoryAnalyzer();

    const analysis = await analyzer.analyzeMelody(melodyId);

    res.json({
      success: true,
      data: {
        harmony: analysis.harmony,
        rhythm: analysis.rhythm,
        structure: analysis.structure,
        suggestions: analysis.suggestions
      }
    });
  } catch (error) {
    console.error('Melody analysis error:', error);
    res.status(500).json({ success: false, message: 'Melody analysis failed' });
  }
});

export default router;