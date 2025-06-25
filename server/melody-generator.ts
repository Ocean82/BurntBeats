import type { GeneratedMelody, MelodyNote, MelodyPhrase, AudioFeatures } from "../shared/schema";
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export interface MelodyGenerationConfig {
  lyrics: string;
  genre: string;
  mood: string;
  tempo: number;
  structure?: string[];
}

export interface LyricsAnalysis {
  lines: string[];
  emotionalArc: number[];
  syllableCounts: number[];
  totalSyllables: number;
  rhymeScheme: string[];
}

export interface MelodyOutputResult {
  audioPath: string;
  midiPath?: string;
  metadata: {
    key: string;
    tempo: number;
    duration: number;
    noteCount: number;
    generatedAt: string;
  };
}

export class MelodyGenerator {
  // Musical scales and modes
  private scales = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
    pentatonic_major: [0, 2, 4, 7, 9],
    pentatonic_minor: [0, 3, 5, 7, 10],
    blues: [0, 3, 5, 6, 7, 10],
  };

  // Emotion to musical parameter mapping
  private emotionMappings = {
    happy: { scale: "major", tempoMod: 1.1, energy: 0.8 },
    sad: { scale: "minor", tempoMod: 0.9, energy: 0.4 },
    energetic: { scale: "mixolydian", tempoMod: 1.2, energy: 0.9 },
    calm: { scale: "pentatonic_major", tempoMod: 0.8, energy: 0.3 },
    mysterious: { scale: "dorian", tempoMod: 0.95, energy: 0.5 },
    uplifting: { scale: "major", tempoMod: 1.05, energy: 0.7 },
  };

  // Emotional word weights for lyrics analysis
  private emotionWeights: Record<string, number> = {
    // Positive emotions
    love: 0.9, joy: 0.8, happy: 0.7, beautiful: 0.6,
    amazing: 0.7, wonderful: 0.8, perfect: 0.6, dream: 0.5,
    sunshine: 0.7, freedom: 0.6, hope: 0.5, smile: 0.6,
    dance: 0.7, fly: 0.6, soar: 0.8, bright: 0.5,

    // Negative emotions
    sad: -0.7, pain: -0.8, hurt: -0.6, broken: -0.7,
    lonely: -0.6, dark: -0.5, tears: -0.6, goodbye: -0.5,
    lost: -0.6, empty: -0.7, cold: -0.4, fear: -0.6,

    // Neutral/contextual
    time: 0.0, day: 0.1, night: -0.2, way: 0.0,
    life: 0.2, world: 0.1, heart: 0.3, soul: 0.2,
  };

  // Syllable stress patterns for common words
  private stressPatterns: Record<string, boolean[]> = {
    beautiful: [true, false, false],
    amazing: [false, true, false],
    wonderful: [true, false, false],
    together: [false, true, false],
    forever: [false, true, false],
    remember: [false, true, false],
    believe: [false, true],
    freedom: [true, false],
    sunshine: [true, false],
  };

  async generateMelodyFromLyrics(config: MelodyGenerationConfig): Promise<GeneratedMelody> {
    console.log(`🎵 Generating melody from lyrics using Python backend...`);
    console.log(`Genre: ${config.genre}, Mood: ${config.mood}, Tempo: ${config.tempo}`);

    // Analyze lyrics structure first
    const lyricsAnalysis = this.analyzeLyricsStructure(config.lyrics);

    // Generate audio file using Python music generator
    const audioResult = await this.generateAudioFile(config);

    // Create melody structure from analysis and audio result
    const melodyPhrases = this.createMelodyPhrasesFromLyrics(lyricsAnalysis, config.tempo);

    const audioFeatures: AudioFeatures = {
      tempo: config.tempo,
      key: audioResult.metadata.key,
      timeSignature: "4/4",
      energy: this.calculateEnergyFromMood(config.mood),
      valence: this.calculateValenceFromMood(config.mood),
      danceability: this.calculateDanceabilityFromGenre(config.genre),
      acousticness: this.calculateAcousticnessFromGenre(config.genre),
      instrumentalness: 0.8, // High since it's generated instrumental
    };

    const melody: GeneratedMelody = {
      phrases: melodyPhrases,
      audioFeatures: audioFeatures,
      structure: lyricsAnalysis,
      totalDuration: audioResult.metadata.duration,
      noteCount: audioResult.metadata.noteCount,
      audioPath: audioResult.audioPath,
      midiPath: audioResult.midiPath,
    };

    console.log(`✅ Melody generated: ${melody.noteCount} notes, ${melody.totalDuration.toFixed(1)}s`);
    console.log(`🎵 Audio file: ${melody.audioPath}`);
    return melody;
  }

  private async generateAudioFile(config: MelodyGenerationConfig): Promise<MelodyOutputResult> {
    const timestamp = Date.now();
    const sanitizedTitle = `melody_${timestamp}`;
    const outputPath = path.join('uploads', `${sanitizedTitle}.wav`);

    // Ensure uploads directory exists
    await fs.mkdir('uploads', { recursive: true });

    // Determine musical key from mood and genre
    const key = this.getKeyFromMoodAndGenre(config.mood, config.genre);
    const duration = Math.min(60, Math.max(20, config.lyrics.split('\n').length * 8)); // Estimate duration

    try {
      // Call Python music generator
      const args = [
        'server/music-generator.py',
        '--title', `"Generated Melody"`,
        '--lyrics', `"${config.lyrics.replace(/"/g, '\\"')}"`,
        '--genre', config.genre,
        '--tempo', config.tempo.toString(),
        '--key', key,
        '--duration', duration.toString(),
        '--output_path', outputPath
      ];

      console.log('🐍 Executing Python music generator...');
      const { stdout, stderr } = await execAsync(`python3 ${args.join(' ')}`);

      if (stderr && !stderr.includes('UserWarning')) {
        console.warn('Python generator warnings:', stderr);
      }

      // Verify the file was created
      const fileExists = await fs.access(outputPath).then(() => true).catch(() => false);
      if (!fileExists) {
        throw new Error('Audio file was not generated');
      }

      const stats = await fs.stat(outputPath);
      const estimatedNoteCount = Math.floor(duration * config.tempo / 60 * 2); // Rough estimate

      return {
        audioPath: `/uploads/${path.basename(outputPath)}`,
        metadata: {
          key: key,
          tempo: config.tempo,
          duration: duration,
          noteCount: estimatedNoteCount,
          generatedAt: new Date().toISOString(),
        }
      };

    } catch (error) {
      console.error('Python music generation failed:', error);

      // Fallback: create a simple audio file using ffmpeg
      console.log('🔧 Using fallback audio generation...');
      return await this.generateFallbackAudio(outputPath, config, key, duration);
    }
  }

  private async generateFallbackAudio(
    outputPath: string, 
    config: MelodyGenerationConfig, 
    key: string, 
    duration: number
  ): Promise<MelodyOutputResult> {
    try {
      const baseFreq = this.getFrequencyFromKey(key);
      const melodyFreq = baseFreq * 1.5;
      const harmonyFreq = baseFreq * 1.25;

      // Generate a simple melody using ffmpeg
      const ffmpegCommand = [
        'ffmpeg',
        '-f', 'lavfi',
        '-i', `sine=frequency=${baseFreq}:duration=${duration}`,
        '-f', 'lavfi', 
        '-i', `sine=frequency=${melodyFreq}:duration=${duration}`,
        '-f', 'lavfi',
        '-i', `sine=frequency=${harmonyFreq}:duration=${duration}`,
        '-filter_complex', '[0:a]volume=0.3[base];[1:a]volume=0.6[melody];[2:a]volume=0.2[harmony];[base][melody][harmony]amix=inputs=3:duration=first[out]',
        '-map', '[out]',
        '-ar', '44100',
        '-ac', '2',
        '-t', duration.toString(),
        outputPath,
        '-y'
      ].join(' ');

      await execAsync(ffmpegCommand);

      return {
        audioPath: `/uploads/${path.basename(outputPath)}`,
        metadata: {
          key: key,
          tempo: config.tempo,
          duration: duration,
          noteCount: Math.floor(duration * 4), // Fallback estimate
          generatedAt: new Date().toISOString(),
        }
      };

    } catch (ffmpegError) {
      console.error('Fallback audio generation failed:', ffmpegError);

      // Last resort: create a silent file
      const silentBuffer = Buffer.alloc(44100 * 2 * duration); // 2 bytes per sample, stereo
      await fs.writeFile(outputPath, silentBuffer);

      return {
        audioPath: `/uploads/${path.basename(outputPath)}`,
        metadata: {
          key: key,
          tempo: config.tempo,
          duration: duration,
          noteCount: 0,
          generatedAt: new Date().toISOString(),
        }
      };
    }
  }

  private analyzeLyricsStructure(lyrics: string): LyricsAnalysis {
    const lines = lyrics.split("\n").filter((line) => line.trim());

    const analysis: LyricsAnalysis = {
      lines: lines,
      emotionalArc: [],
      syllableCounts: [],
      totalSyllables: 0,
      rhymeScheme: [],
    };

    for (const line of lines) {
      // Emotional analysis
      const words = line.toLowerCase().split(/\s+/);
      const lineEmotion =
        words.reduce((sum, word) => {
          return sum + (this.emotionWeights[word] || 0);
        }, 0) / words.length;

      analysis.emotionalArc.push(lineEmotion);

      // Syllable counting
      const syllableCount = words.reduce((count, word) => {
        const vowels = word.match(/[aeiou]/g);
        return count + Math.max(1, vowels ? vowels.length : 1);
      }, 0);

      analysis.syllableCounts.push(syllableCount);
      analysis.totalSyllables += syllableCount;
    }

    return analysis;
  }

  private analyzeLineSyllables(line: string): Array<{
    word: string;
    syllableCount: number;
    stressPattern: boolean[];
    emotionWeight: number;
  }> {
    const words = line.toLowerCase().split(/\s+/);

    return words.map((word) => {
      // Estimate syllable count
      const vowels = word.match(/[aeiou]/g);
      const syllableCount = Math.max(1, vowels ? vowels.length : 1);

      // Get stress pattern
      let stressPattern = this.stressPatterns[word];
      if (!stressPattern || stressPattern.length !== syllableCount) {
        // Generate default stress pattern
        if (syllableCount === 1) {
          stressPattern = [true];
        } else if (syllableCount === 2) {
          stressPattern = [true, false]; // Most 2-syllable words are trochaic
        } else {
          // Alternate pattern for longer words
          stressPattern = Array.from({ length: syllableCount }, (_, i) => i % 2 === 0);
        }
      }

      // Get emotional weight
      const emotionWeight = this.emotionWeights[word] || 0.0;

      return {
        word,
        syllableCount,
        stressPattern,
        emotionWeight,
      };
    });
  }

  private async generatePhraseFromLine(
    line: string,
    syllableData: ReturnType<typeof this.analyzeLineSyllables>,
    emotionWeight: number,
    rootNote: number,
    scaleName: keyof typeof this.scales,
    startTime: number,
    tempo: number,
  ): Promise<MelodyPhrase> {
    const scaleNotes = this.scales[scaleName];
    const notes: MelodyNote[] = [];
    let currentPitch = rootNote + 12; // Start an octave above root
    let currentTime = startTime;

    for (const wordData of syllableData) {
      const { word, stressPattern, emotionWeight: wordEmotion } = wordData;

      for (let sylIdx = 0; sylIdx < stressPattern.length; sylIdx++) {
        const isStressed = stressPattern[sylIdx];

        // Calculate pitch change based on stress and emotion
        let pitchChange = isStressed ? 2 : -1;
        pitchChange += Math.round(wordEmotion * 2); // Emotion influence
        pitchChange += Math.floor(Math.random() * 3) - 1; // Random variation

        currentPitch += pitchChange;

        // Constrain to scale
        const scaleDegree = (((currentPitch - rootNote) % 12) + 12) % 12;
        const nearestScaleNote = scaleNotes.reduce((nearest, note) => {
          return Math.abs(scaleDegree - note) < Math.abs(scaleDegree - nearest) ? note : nearest;
        });

        const finalPitch = rootNote + nearestScaleNote + Math.floor((currentPitch - rootNote) / 12) * 12;

        // Calculate duration based on stress and tempo
        let duration = isStressed ? 0.75 : 0.5;
        duration += Math.abs(wordEmotion) * 0.25; // Emotional words get longer
        duration = duration * (120 / tempo); // Normalize to tempo

        // Calculate velocity
        let velocity = isStressed ? 90 : 70;
        velocity += Math.round(Math.abs(wordEmotion) * 20);
        velocity = Math.max(40, Math.min(127, velocity));

        // Create syllable text
        const syllableText = stressPattern.length > 1 ? `${word}[${sylIdx}]` : word;

        const note: MelodyNote = {
          pitch: finalPitch,
          duration: duration,
          velocity: velocity,
          syllable: syllableText,
          timestamp: currentTime,
        };

        notes.push(note);
        currentTime += duration;
      }
    }

    return {
      notes,
      startTime,
      emotionWeight,
      lyricLine: line,
    };
  }

  private determineKeyAndScale(emotionalArc: number[], mood: string): [number, keyof typeof this.scales] {
    const avgEmotion =
      emotionalArc.length > 0 ? emotionalArc.reduce((sum, val) => sum + val, 0) / emotionalArc.length : 0;

    // Use mood mapping if available
    const moodLower = mood.toLowerCase() as keyof typeof this.emotionMappings;
    let scaleName: keyof typeof this.scales;

    if (this.emotionMappings[moodLower]) {
      scaleName = this.emotionMappings[moodLower].scale as keyof typeof this.scales;
    } else {
      // Choose scale based on average emotion
      if (avgEmotion > 0.3) {
        scaleName = "major";
      } else if (avgEmotion < -0.3) {
        scaleName = "minor";
      } else if (avgEmotion > 0) {
        scaleName = "mixolydian";
      } else {
        scaleName = "dorian";
      }
    }

    // Choose root note based on emotion
    let rootNote: number;
    if (avgEmotion > 0.5) {
      rootNote = [60, 62, 64, 67][Math.floor(Math.random() * 4)]; // C, D, E, G (brighter keys)
    } else if (avgEmotion < -0.5) {
      rootNote = [57, 59, 61, 65][Math.floor(Math.random() * 4)]; // A, B, C#, F (darker keys)
    } else {
      rootNote = [60, 62, 65, 67][Math.floor(Math.random() * 4)]; // C, D, F, G (neutral)
    }

    return [rootNote, scaleName];
  }

  private generateAudioFeatures(
    genre: string,
    mood: string,
    tempo: number,
    rootNote: number,
    scaleName: string,
  ): AudioFeatures {
    // Base features
    const features: AudioFeatures = {
      tempo: tempo,
      key: this.midiToNoteName(rootNote),
      timeSignature: "4/4",
      energy: 0.7,
      valence: 0.5,
      danceability: 0.6,
      acousticness: 0.3,
      instrumentalness: 0.1,
    };

    // Adjust based on mood
    const moodLower = mood.toLowerCase() as keyof typeof this.emotionMappings;
    if (this.emotionMappings[moodLower]) {
      const moodConfig = this.emotionMappings[moodLower];
      features.energy = moodConfig.energy;
      features.valence = moodConfig.energy > 0.6 ? 0.8 : 0.3;
    }

    // Adjust based on genre
    const genreAdjustments: Record<string, Partial<AudioFeatures>> = {
      pop: { danceability: 0.8, energy: 0.7, acousticness: 0.2 },
      rock: { energy: 0.9, acousticness: 0.1, danceability: 0.6 },
      electronic: { danceability: 0.9, energy: 0.8, acousticness: 0.05 },
      folk: { acousticness: 0.8, energy: 0.4, danceability: 0.3 },
      jazz: { acousticness: 0.6, energy: 0.5, danceability: 0.4 },
      hip_hop: { danceability: 0.8, energy: 0.7, acousticness: 0.1 },
    };

    const genreAdj = genreAdjustments[genre.toLowerCase()];
    if (genreAdj) {
      Object.assign(features, genreAdj);
    }

    return features;
  }

  private midiToNoteName(midiNote: number): string {
    const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const octave = Math.floor(midiNote / 12) - 1;
    const note = noteNames[midiNote % 12];
    return `${note}${octave}`;
  }

  private createMelodyPhrasesFromLyrics(analysis: LyricsAnalysis, tempo: number): MelodyPhrase[] {
    const phrases: MelodyPhrase[] = [];
    let currentTime = 0.0;

    for (let i = 0; i < analysis.lines.length; i++) {
      const line = analysis.lines[i];
      if (!line.trim()) continue;

      const syllableCount = analysis.syllableCounts[i];
      const emotionWeight = analysis.emotionalArc[i];
      const notes: MelodyNote[] = [];

      // Create notes for each syllable
      for (let j = 0; j < syllableCount; j++) {
        const duration = 60 / tempo; // One beat per syllable
        const pitch = 60 + Math.floor(emotionWeight * 12) + (j % 7); // C4 base with emotional and melodic variation

        notes.push({
          pitch: pitch,
          duration: duration,
          velocity: 70 + Math.floor(Math.abs(emotionWeight) * 30),
          syllable: `syl_${j}`,
          timestamp: currentTime,
        });

        currentTime += duration;
      }

      phrases.push({
        notes: notes,
        startTime: phrases.length > 0 ? phrases[phrases.length - 1].startTime + phrases[phrases.length - 1].notes.reduce((sum, n) => sum + n.duration, 0) : 0,
        emotionWeight: emotionWeight,
        lyricLine: line,
      });
    }

    return phrases;
  }

  private getKeyFromMoodAndGenre(mood: string, genre: string): string {
    const moodKeys: Record<string, string> = {
      'happy': 'C',
      'sad': 'Am',
      'energetic': 'G',
      'calm': 'F',
      'mysterious': 'Dm',
      'uplifting': 'D',
    };

    const genreKeys: Record<string, string> = {
      'pop': 'C',
      'rock': 'E',
      'jazz': 'F',
      'electronic': 'Am',
      'classical': 'C',
      'hip-hop': 'Cm',
      'country': 'G',
      'r&b': 'Bb'
    };

    return moodKeys[mood.toLowerCase()] || genreKeys[genre.toLowerCase()] || 'C';
  }

  private getFrequencyFromKey(key: string): number {
    const frequencies: Record<string, number> = {
      'C': 261.63, 'C#': 277.18, 'Db': 277.18,
      'D': 293.66, 'D#': 311.13, 'Eb': 311.13,
      'E': 329.63,
      'F': 349.23, 'F#': 369.99, 'Gb': 369.99,
      'G': 392.00, 'G#': 415.30, 'Ab': 415.30,
      'A': 440.00, 'A#': 466.16, 'Bb': 466.16,
      'B': 493.88,
      'Am': 220.00, 'Cm': 261.63, 'Dm': 293.66,
      'Em': 329.63, 'Fm': 349.23, 'Gm': 392.00
    };
    return frequencies[key] || 261.63;
  }

  private calculateEnergyFromMood(mood: string): number {
    const energyMap: Record<string, number> = {
      'happy': 0.8, 'sad': 0.3, 'energetic': 0.9,
      'calm': 0.2, 'mysterious': 0.5, 'uplifting': 0.7
    };
    return energyMap[mood.toLowerCase()] || 0.6;
  }

  private calculateValenceFromMood(mood: string): number {
    const valenceMap: Record<string, number> = {
      'happy': 0.9, 'sad': 0.1, 'energetic': 0.8,
      'calm': 0.6, 'mysterious': 0.3, 'uplifting': 0.8
    };
    return valenceMap[mood.toLowerCase()] || 0.5;
  }

  private calculateDanceabilityFromGenre(genre: string): number {
    const danceMap: Record<string, number> = {
      'pop': 0.8, 'rock': 0.6, 'electronic': 0.9,
      'jazz': 0.4, 'classical': 0.2, 'hip-hop': 0.8,
      'country': 0.5, 'r&b': 0.7
    };
    return danceMap[genre.toLowerCase()] || 0.6;
  }

  private calculateAcousticnessFromGenre(genre: string): number {
    const acousticMap: Record<string, number> = {
      'pop': 0.3, 'rock': 0.1, 'electronic': 0.05,
      'jazz': 0.6, 'classical': 0.9, 'hip-hop': 0.1,
      'country': 0.7, 'r&b': 0.4
    };
    return acousticMap[genre.toLowerCase()] || 0.3;
  }

  // Legacy method for backward compatibility
  async generateMelody(genre: string, mood: string, tempo: number, duration?: number): Promise<any> {
    console.log("⚠️  Using legacy generateMelody method. Consider using generateMelodyFromLyrics for better results.");

    // Generate a basic melody without lyrics
    const basicLyrics = "La la la la la\nDa da da da da\nNa na na na na\nHa ha ha ha ha";

    const melody = await this.generateMelodyFromLyrics({
      lyrics: basicLyrics,
      genre,
      mood,
      tempo,
    });

    // Add legacy structure for backward compatibility
    return {
      ...melody,
      phraseStructure: {
        phraseLength: melody.totalDuration / melody.phrases.length,
        phraseCount: melody.phrases.length
      },
      chordProgression: this.generateChordProgression(genre),
      melodicContour: {
        direction: this.determineMelodicDirection(melody.phrases),
        intervalPattern: this.extractIntervalPattern(melody.phrases)
      }
    };
  }

  private generateChordProgression(genre: string): string[] {
    // Genre-specific chord progressions - comprehensive coverage
  const genreChords: { [key: string]: string[][] } = {
    'pop': [['C', 'Am', 'F', 'G'], ['Am', 'F', 'C', 'G'], ['F', 'G', 'C', 'Am']],
    'rock': [['E', 'A', 'B', 'E'], ['A', 'D', 'E', 'A'], ['B', 'E', 'A', 'D']],
    'jazz': [['Cmaj7', 'Am7', 'Dm7', 'G7'], ['Am7', 'D7', 'Gmaj7', 'Cmaj7'], ['Fmaj7', 'Bm7b5', 'Em7', 'Am7']],
    'classical': [['C', 'F', 'G', 'C'], ['Am', 'Dm', 'G', 'C'], ['F', 'C', 'G', 'Am']],
    'electronic': [['Am', 'F', 'C', 'G'], ['Dm', 'Bb', 'F', 'C'], ['Em', 'C', 'G', 'D']],
    'hip-hop': [['Am', 'F', 'G', 'Em'], ['Dm', 'Bb', 'F', 'C'], ['Cm', 'Ab', 'Bb', 'Fm']],
    'country': [['G', 'C', 'D', 'G'], ['C', 'G', 'Am', 'F'], ['D', 'G', 'C', 'D']],
    'r&b': [['Am', 'Dm', 'G', 'C'], ['F', 'G', 'Em', 'Am'], ['Dm', 'G', 'C', 'F']]
  };

  // Safe genre access with logging
  const getGenreChords = (genre: string): string[][] => {
    const normalizedGenre = genre.toLowerCase();
    if (!genreChords[normalizedGenre]) {
      console.warn(`⚠️ Genre "${genre}" not found in chord progressions, falling back to pop`);
      return genreChords['pop'];
    }
    return genreChords[normalizedGenre];
  };
    return getGenreChords(genre)[0];
  }

  private determineMelodicDirection(phrases: MelodyPhrase[]): string {
    if (phrases.length === 0) return 'stable';

    const firstNote = phrases[0].notes[0]?.pitch || 60;
    const lastNote = phrases[phrases.length - 1].notes.slice(-1)[0]?.pitch || 60;

    if (lastNote > firstNote + 5) return 'ascending';
    if (lastNote < firstNote - 5) return 'descending';
    return 'wave';
  }

  private extractIntervalPattern(phrases: MelodyPhrase[]): number[] {
    const intervals: number[] = [];

    phrases.forEach(phrase => {
      for (let i = 1; i < phrase.notes.length; i++) {
        const interval = phrase.notes[i].pitch - phrase.notes[i-1].pitch;
        intervals.push(interval);
      }
    });

    return intervals.slice(0, 8); // Return first 8 intervals as pattern
  }

  private extractLyricLine(lyrics: string, phraseIndex: number): string {
    const lines = lyrics.split('\n').filter(line => line.trim());
    return lines[phraseIndex % lines.length] || '';
  }

  private async generateMelodyAudio(phrases: any[], chordProgression: string[], tempo: number, genre: string): Promise<string | null> {
    try {
      const timestamp = Date.now();
      const filename = `melody_${timestamp}.mp3`;
      const outputPath = path.join('uploads', filename);

      // Ensure uploads directory exists
      await fs.mkdir('uploads', { recursive: true });

      // Generate audio using the phrases
      const baseFreq = this.getGenreBaseFrequency(genre);
      const noteDurations = phrases.flatMap(phrase => 
        phrase.notes.map((note: any) => ({
          frequency: this.midiToFrequency(note.pitch),
          duration: note.duration,
          time: note.absoluteTime
        }))
      );

      // Create simple audio composition
      const audioLayers = noteDurations.map((note, i) => 
        `sine=frequency=${note.frequency}:duration=${note.duration}`
      ).join(',');

      const ffmpegCmd = `ffmpeg -f lavfi -i "${audioLayers}" -t ${phrases[phrases.length - 1].endTime} -ar 44100 -ac 2 -b:a 128k "${outputPath}" -y`;

      const { execAsync } = await import('./music-generator');
      await execAsync(ffmpegCmd);

      console.log(`🎵 Generated melody audio: ${outputPath}`);
      return `/${outputPath}`;
    } catch (error) {
      console.warn('Failed to generate melody audio:', error);
      return null;
    }
  }

  private midiToFrequency(midiNote: number): number {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  }

  private getGenreBaseFrequency(genre: string): number {
    const genreFreqs: Record<string, number> = {
      'pop': 261.63, 'rock': 329.63, 'jazz': 349.23,
      'classical': 392.00, 'electronic': 261.63, 'hip-hop': 261.63,
      'country': 392.00, 'r&b': 261.63
    };
    return genreFreqs[genre.toLowerCase()] || 261.63;
  }

  private toPythonMusic21Format(phrases: any[], chordProgression: string[], tempo: number, genre: string): any {
    return {
      title: "Generated Melody",
      composer: "AI Melody Generator",
      tempo: tempo,
      timeSignature: "4/4",
      keySignature: "C",
      genre: genre,
      parts: [
        {
          partName: "Melody",
          instrument: "Piano",
          measures: phrases.map((phrase, index) => ({
            number: index + 1,
            chord: phrase.chord,
            notes: phrase.notes.map((note: any) => ({
              pitch: note.pitch,
              duration: note.duration,
              velocity: note.velocity,
              offset: note.time
            }))
          }))
        }
      ],
      chordProgression: chordProgression,
      structure: {
        sections: phrases.map((phrase, index) => ({
          name: `Phrase ${index + 1}`,
          startTime: phrase.startTime,
          endTime: phrase.endTime,
          chord: phrase.chord
        }))
      }
    };
  }

  private toMidiFormat(phrases: any[], tempo: number): any {
    return {
      header: {
        format: 1,
        tracks: 2,
        ticksPerQuarter: 480
      },
      tempo: tempo,
      tracks: [
        {
          name: "Melody Track",
          channel: 0,
          program: 0, // Piano
          events: phrases.flatMap(phrase => 
            phrase.notes.map((note: any) => ({
              type: "noteOn",
              pitch: note.pitch,
              velocity: note.velocity,
              time: Math.round(note.absoluteTime * 480), // Convert to ticks
              duration: Math.round(note.duration * 480)
            }))
          )
        }
      ]
    };
  }

  // Export the class instance
  static getInstance(): MelodyGenerator {
    return new MelodyGenerator();
  }

   private getChordTones(chord: string): number[] {
    const chordMap: Record<string, number[]> = {
      'C': [0, 4, 7],    // C major
      'Am': [9, 0, 4],   // A minor
      'F': [5, 9, 0],    // F major
      'G': [7, 11, 2],   // G major
      'E': [4, 7, 11],   // E major
      'D': [2, 6, 9],    // D major
      'Bb': [10, 1, 5],  // Bb major
      'Cm': [3, 7, 10],  // C minor
      'Dm': [2, 5, 9],   // D minor
      'Em': [4, 7, 11],  // E minor
      'Cmaj7': [0, 4, 7, 11],
      'Am7': [9, 0, 4, 7],
      'Dm7': [2, 5, 9, 0],
      'G7': [7, 11, 2, 5],
      'Fmaj7': [5, 9, 0, 4],
      'Bm7b5': [11, 2, 5, 9]
    };

    return chordMap[chord] || [0, 4, 7]; // Default to C major
  }

  private analyzeMelodicContour(phrases: any[]): string {
    if (phrases.length === 0) return 'stable';

    const firstNote = phrases[0].notes[0]?.pitch || 60;
    const lastNote = phrases[phrases.length - 1].notes.slice(-1)[0]?.pitch || 60;

    if (lastNote > firstNote + 5) return 'ascending';
    if (lastNote < firstNote - 5) return 'descending';
    return 'wave';
  }

  private analyzeRhythmicStructure(phrases: any[]): number[] {
    const rhythms: number[] = [];

    phrases.forEach(phrase => {
      phrase.notes.forEach((note: any) => {
        rhythms.push(note.duration);
      });
    });

    return rhythms.slice(0, 16); // Get first 16 rhythms
  }

  private generateDynamicMarkings(phrases: any[]): string[] {
    const dynamics = ['pp', 'p', 'mp', 'mf', 'f', 'ff'];
    return phrases.map(() => dynamics[Math.floor(Math.random() * dynamics.length)]);
  }

  // Legacy generate melody
  async generateLegacyMelody(genre: string, mood: string, tempo: number, duration: number, lyrics: string): Promise<any> {
    // Comprehensive genre motifs
    const genreMotifs: { [key: string]: any[] } = {
      'pop': [
        { pattern: [0, 2, 4, 2], rhythm: [0.5, 0.5, 1, 1] },
        { pattern: [0, -1, 2, 0], rhythm: [1, 0.5, 0.5, 1] }
      ],
      'rock': [
        { pattern: [0, 0, 2, 4], rhythm: [0.5, 0.5, 0.5, 1.5] },
        { pattern: [4, 2, 0, -1], rhythm: [1, 0.5, 0.5, 1] }
      ],
      'jazz': [
        { pattern: [0, 2, 4, 6, 4], rhythm: [0.25, 0.25, 0.5, 0.5, 0.5] },
        { pattern: [0, 3, 2, 4, 1], rhythm: [0.5, 0.25, 0.25, 0.5, 0.5] }
      ],
      'classical': [
        { pattern: [0, 2, 4, 5, 4, 2], rhythm: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5] },
        { pattern: [0, 1, 2, 3, 2, 1], rhythm: [0.25, 0.25, 0.25, 0.25, 0.5, 0.5] }
      ],
      'electronic': [
        { pattern: [0, 4, 0, 4], rhythm: [0.25, 0.25, 0.25, 0.25] },
        { pattern: [0, 2, 4, 7], rhythm: [0.5, 0.5, 0.5, 0.5] }
      ],
      'hip-hop': [
        { pattern: [0, 0, 2, 0], rhythm: [0.5, 0.25, 0.25, 1] },
        { pattern: [0, 3, 0, 2], rhythm: [0.25, 0.5, 0.25, 1] }
      ],
      'country': [
        { pattern: [0, 2, 4, 2, 0], rhythm: [0.5, 0.5, 0.5, 0.5, 1] },
        { pattern: [0, -2, 0, 2], rhythm: [1, 0.5, 0.5, 1] }
      ],
      'r&b': [
        { pattern: [0, 1, 2, 1, 0], rhythm: [0.5, 0.25, 0.25, 0.5, 0.5] },
        { pattern: [0, 2, 3, 2], rhythm: [0.75, 0.25, 0.5, 0.5] }
      ]
    };

    // Safe genre access with logging
    const getGenreMotifs = (genre: string): any[] => {
      const normalizedGenre = genre.toLowerCase();
      if (!genreMotifs[normalizedGenre]) {
        console.warn(`⚠️ Genre "${genre}" not found in motifs, falling back to pop`);
        return genreMotifs['pop'];
      }
      return genreMotifs[normalizedGenre];
    };

    // Comprehensive genre chords
    const genreChordsUsed = {
      'pop': ['C', 'Am', 'F', 'G'],
      'rock': ['G', 'C', 'D', 'G'],
      'jazz': ['Am7', 'D7', 'Gmaj7', 'Cmaj7'],
      'electronic': ['Am', 'F', 'C', 'G'],
      'classical': ['Am', 'Dm', 'G', 'C'],
      'hip-hop': ['Am', 'F', 'G', 'Em'],
      'country': ['G', 'C', 'D', 'G'],
      'r&b': ['Am', 'Dm', 'G', 'C']
    };

    const getGenreChordsUsed = (genre: string): string[] => {
      const normalizedGenre = genre.toLowerCase();
      if (!genreChordsUsed[normalizedGenre]) {
        console.warn(`⚠️ Genre "${genre}" not found in chords, falling back to pop`);
        return genreChordsUsed['pop'];
      }
      return genreChordsUsed[normalizedGenre];
    };

    const selectedProgression = getGenreChordsUsed(genre);
    let currentTime = 0;

    const phrases = [];
    const phraseDuration = duration / 4;

    for (let i = 0; i < 4; i++) {
      const chord = selectedProgression[i % selectedProgression.length];
      const chordTones = this.getChordTones(chord);
      const selectedMotif = getGenreMotifs(genre)[Math.floor(Math.random() * getGenreMotifs(genre).length)];

      const phraseNotes = [];
      let phraseTime = 0;
      let noteCount = Math.floor(phraseDuration * 2);

      for (let j = 0; j < noteCount; j++) {
        const motifIndex = j % selectedMotif.pattern.length;
        const intervalPattern = selectedMotif.pattern[motifIndex];
        const rhythmPattern = selectedMotif.rhythm[motifIndex];

        const baseNote = chordTones[0] + 60;
        const pitch = baseNote + intervalPattern;

        phraseNotes.push({
          pitch: pitch,
          duration: rhythmPattern,
          velocity: 80 + Math.random() * 20,
          time: phraseTime,
          absoluteTime: currentTime + phraseTime
        });
        phraseTime += rhythmPattern;
      }

      phrases.push({
        id: i,
        chord: chord,
        notes: phraseNotes,
        chordTones: chordTones,
        lyricLine: this.extractLyricLine(lyrics, i),
        startTime: currentTime,
        endTime: currentTime + phraseDuration,
        duration: phraseDuration
      });
      currentTime += phraseDuration;
    }

    const audioPath = await this.generateMelodyAudio(phrases, selectedProgression, tempo, genre);

    // Python music21 compatible
    const melodyData = {
      phrases: phrases,
      chordProgression: selectedProgression,
      genre: genre,
      tempo: tempo,
      mood: mood,
      duration: duration,
      totalDuration: currentTime,
      melodicContour: this.analyzeMelodicContour(phrases),
      rhythmicStructure: this.analyzeRhythmicStructure(phrases),
      motifs: getGenreMotifs(genre),
      dynamicMarkings: this.generateDynamicMarkings(phrases),
      audioPath: audioPath,
      pythonFormat: this.toPythonMusic21Format(phrases, selectedProgression, tempo, genre),
      midiFormat: this.toMidiFormat(phrases, tempo)
    };

    return melodyData;
  }
}

// Export default instance
export const melodyGenerator = new MelodyGenerator();