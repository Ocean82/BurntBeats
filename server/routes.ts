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