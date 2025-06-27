
import { Router } from "express";
import { melodyGenerator } from "../melody-generator";

const router = Router();

// GET /api/example-track - Get example track data
router.get("/", async (req, res) => {
  try {
    console.log("🎵 Generating example track...");
    
    // Generate example melody using the melody generator
    const exampleMelody = await melodyGenerator.generateMelodyFromLyrics({
      lyrics: "This is a test song\nWith multiple lines\nTo generate melody from",
      genre: "pop",
      mood: "happy", 
      tempo: 120,
      complexity: 0.7
    });

    // Return example track data
    const exampleTrack = {
      id: "example-track-1",
      title: "AI Generated Demo Track",
      lyrics: "This is a test song\nWith multiple lines\nTo generate melody from",
      genre: "pop",
      mood: "happy",
      tempo: 120,
      key: exampleMelody.audioFeatures.key,
      duration: Math.round(exampleMelody.totalDuration),
      noteCount: exampleMelody.noteCount,
      phrases: exampleMelody.phrases.length,
      audioPath: exampleMelody.audioPath,
      audioUrl: exampleMelody.audioPath,
      previewUrl: exampleMelody.audioPath,
      melody: exampleMelody,
      settings: {
        complexity: 0.7,
        generationMethod: "lyrics-informed"
      },
      metadata: {
        isExample: true,
        generatedAt: new Date().toISOString(),
        description: "This example demonstrates how our AI melody generator creates music from lyrics using advanced algorithmic composition techniques."
      }
    };

    console.log(`✅ Example track generated: ${exampleTrack.noteCount} notes, ${exampleTrack.duration}s`);
    
    res.json({
      success: true,
      track: exampleTrack,
      generationInfo: {
        method: "Advanced Melody Generator",
        noteCount: exampleMelody.noteCount,
        duration: exampleMelody.totalDuration,
        key: exampleMelody.audioFeatures.key,
        phrases: exampleMelody.phrases.length
      }
    });

  } catch (error) {
    console.error("Example track generation failed:", error);
    
    // Return fallback example data
    res.json({
      success: true,
      track: {
        id: "example-track-fallback",
        title: "AI Generated Demo Track",
        lyrics: "This is a test song\nWith multiple lines\nTo generate melody from",
        genre: "pop",
        mood: "happy",
        tempo: 120,
        key: "C",
        duration: 30,
        noteCount: 24,
        phrases: 3,
        audioPath: "/uploads/generated/example_fallback.wav",
        audioUrl: "/uploads/generated/example_fallback.wav",
        previewUrl: "/uploads/generated/example_fallback.wav",
        settings: {
          complexity: 0.7,
          generationMethod: "fallback"
        },
        metadata: {
          isExample: true,
          isFallback: true,
          generatedAt: new Date().toISOString(),
          description: "This is a fallback example track. The full AI generator creates much more sophisticated melodies."
        }
      },
      generationInfo: {
        method: "Fallback Example",
        noteCount: 24,
        duration: 30,
        key: "C",
        phrases: 3
      }
    });
  }
});

export default router;
