import type { GeneratedMelody, MelodyNote, MelodyPhrase, AudioFeatures } from "../shared/schema";
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

const execAsync = promisify(exec);

// Enhanced configuration with JSDoc and runtime validation
export interface MelodyGenerationConfig {
  lyrics: string;
  genre: string;
  mood: string;
  tempo: number;
  structure?: string[];
  key?: string;
  duration?: number;
  complexity?: number;
  instrumentation?: string[];
}

interface LyricsAnalysis {
  lines: string[];
  emotionalArc: number[];
  syllableCounts: number[];
  totalSyllables: number;
  rhymeScheme: string[];
  stressPatterns: boolean[][];
}

interface MelodyOutputResult {
  audioPath: string;
  midiPath?: string;
  metadata: {
    key: string;
    tempo: number;
    duration: number;
    noteCount: number;
    generatedAt: string;
    bpmVariation?: number;
    dynamicRange?: number;
  };
}

export class MelodyGenerator {
  private static instance: MelodyGenerator;
  private scales = this.initScales();
  private emotionMappings = this.initEmotionMappings();
  private emotionWeights = this.initEmotionWeights();
  private stressPatterns = this.initStressPatterns();
  private genrePresets = this.initGenrePresets();

  private constructor() {} // Private for singleton pattern

  /** Singleton accessor */
  static getInstance(): MelodyGenerator {
    if (!MelodyGenerator.instance) {
      MelodyGenerator.instance = new MelodyGenerator();
    }
    return MelodyGenerator.instance;
  }

  // ========================
  // MAIN PUBLIC INTERFACE
  // ========================

  /**
   * Generates a complete melody from lyrics with enhanced musicality
   * @param config - Generation parameters
   * @returns Promise<GeneratedMelody> - The complete melody structure
   */
  async generateMelodyFromLyrics(config: MelodyGenerationConfig): Promise<GeneratedMelody> {
    this.validateConfig(config);

    const lyricsAnalysis = this.analyzeLyrics(config.lyrics);
    const audioResult = await this.generateAudio(config);
    const phrases = this.createMelodyPhrases(lyricsAnalysis, config);
    const features = this.calculateAudioFeatures(config, lyricsAnalysis);

    return {
      phrases,
      audioFeatures: features,
      structure: lyricsAnalysis,
      totalDuration: audioResult.metadata.duration,
      noteCount: audioResult.metadata.noteCount,
      audioPath: audioResult.audioPath,
      midiPath: audioResult.midiPath,
      metadata: {
        ...audioResult.metadata,
        generationId: crypto.randomUUID(),
        version: "2.1",
        hash: this.generateContentHash(config.lyrics)
      }
    };
  }

  // ========================
  // CORE GENERATION METHODS
  // ========================

  private async generateAudio(config: MelodyGenerationConfig): Promise<MelodyOutputResult> {
    const outputDir = path.join('uploads', 'generated');
    await fs.mkdir(outputDir, { recursive: true });

    const timestamp = Date.now();
    const baseFilename = `melody_${timestamp}`;
    const audioPath = path.join(outputDir, `${baseFilename}.wav`);
    const midiPath = path.join(outputDir, `${baseFilename}.mid`);

    try {
      const args = [
        'server/music-generator.py',
        '--lyrics', `"${this.sanitizeInput(config.lyrics)}"`,
        '--genre', config.genre,
        '--mood', config.mood,
        '--tempo', config.tempo.toString(),
        '--key', config.key || this.getKeyFromMoodAndGenre(config.mood, config.genre),
        '--output', audioPath,
        '--midi', midiPath
      ];

      await execAsync(`python3 ${args.join(' ')}`);

      const [audioExists, midiExists] = await Promise.all([
        this.fileExists(audioPath),
        this.fileExists(midiPath)
      ]);

      if (!audioExists) throw new Error('Audio generation failed');

      return {
        audioPath: `/uploads/generated/${path.basename(audioPath)}`,
        midiPath: midiExists ? `/uploads/generated/${path.basename(midiPath)}` : undefined,
        metadata: {
          key: config.key || 'C',
          tempo: config.tempo,
          duration: await this.calculateAudioDuration(audioPath),
          noteCount: midiExists ? await this.countMidiNotes(midiPath) : this.estimateNoteCount(config),
          generatedAt: new Date().toISOString(),
          bpmVariation: this.calculateBpmVariation(config.tempo, config.mood),
          dynamicRange: this.calculateDynamicRange(config.mood)
        }
      };
    } catch (error) {
      console.error('Primary generation failed, using fallback:', error);
      return this.generateFallbackAudio(config, audioPath);
    }
  }

  private createMelodyPhrases(analysis: LyricsAnalysis, config: MelodyGenerationConfig): MelodyPhrase[] {
    const [rootNote, scaleName] = this.determineMusicalKey(analysis.emotionalArc, config.mood);
    const scale = this.scales[scaleName as keyof typeof this.scales];
    let currentTime = 0;

    return analysis.lines.map((line, i) => {
      const syllableData = this.analyzeLineSyllables(line);
      const phrase: MelodyPhrase = {
        notes: [],
        startTime: currentTime,
        lyricLine: line,
        emotionWeight: analysis.emotionalArc[i],
        sectionType: this.determineSectionType(i, analysis.lines.length)
      };

      syllableData.forEach((word, wordIndex) => {
        word.stressPattern.forEach((isStressed, syllableIndex) => {
          const note: MelodyNote = {
            pitch: this.calculateNotePitch({
              rootNote,
              scale,
              isStressed,
              emotion: word.emotionWeight,
              previousNote: phrase.notes[phrase.notes.length - 1]?.pitch,
              position: phrase.notes.length
            }),
            duration: this.calculateNoteDuration({
              isStressed,
              emotion: word.emotionWeight,
              tempo: config.tempo,
              genre: config.genre,
              position: phrase.notes.length
            }),
            velocity: this.calculateNoteVelocity(isStressed, word.emotionWeight),
            syllable: `${word.word}_${syllableIndex}`,
            timestamp: currentTime
          };

          phrase.notes.push(note);
          currentTime += note.duration;
        });
      });

      return phrase;
    });
  }

  // ========================
  // ANALYSIS METHODS
  // ========================

  private analyzeLyrics(lyrics: string): LyricsAnalysis {
    const lines = lyrics.split('\n').filter(line => line.trim());
    const analysis: LyricsAnalysis = {
      lines,
      emotionalArc: [],
      syllableCounts: [],
      totalSyllables: 0,
      rhymeScheme: this.detectRhymeScheme(lines),
      stressPatterns: []
    };

    lines.forEach(line => {
      const syllableData = this.analyzeLineSyllables(line);
      const lineEmotion = syllableData.reduce((sum, word) => sum + word.emotionWeight, 0) / syllableData.length;

      analysis.emotionalArc.push(lineEmotion);
      analysis.syllableCounts.push(syllableData.reduce((count, word) => count + word.syllableCount, 0));
      analysis.totalSyllables += analysis.syllableCounts[analysis.syllableCounts.length - 1];
      analysis.stressPatterns.push(syllableData.flatMap(word => word.stressPattern));
    });

    return analysis;
  }

  private analyzeLineSyllables(line: string): Array<{
    word: string;
    syllableCount: number;
    stressPattern: boolean[];
    emotionWeight: number;
  }> {
    return line.match(/\b[\w']+\b/g)?.map(word => ({
      word,
      syllableCount: this.countSyllables(word),
      stressPattern: this.getWordStressPattern(word),
      emotionWeight: this.getWordEmotion(word)
    })) || [];
  }

  private detectRhymeScheme(lines: string[]): string[] {
    if (lines.length < 2) return [];

    const endings = lines.map(line => {
      const words = line.match(/\b[\w']+\b/g);
      return words?.[words.length - 1]?.toLowerCase() || '';
    });

    const scheme: string[] = [];
    const rhymeGroups: Record<string, string> = {};
    let currentCharCode = 97; // 'a'

    endings.forEach((ending, i) => {
      if (!ending) {
        scheme.push('');
        return;
      }

      const existingGroup = Object.entries(rhymeGroups).find(([word]) => 
        this.wordsRhyme(ending, word)
      )?.[1];

      if (existingGroup) {
        scheme.push(existingGroup);
      } else {
        const newGroup = String.fromCharCode(currentCharCode++);
        rhymeGroups[ending] = newGroup;
        scheme.push(newGroup);
      }
    });

    return scheme;
  }

  // ========================
  // MUSICAL CALCULATIONS
  // ========================

  private calculateNotePitch(params: {
    rootNote: number;
    scale: number[];
    isStressed: boolean;
    emotion: number;
    previousNote?: number;
    position: number;
  }): number {
    const { rootNote, scale, isStressed, emotion, previousNote, position } = params;
    const octave = 4 + Math.floor(position / scale.length);
    let pitchOffset: number;

    if (isStressed) {
      pitchOffset = 2 + Math.floor(emotion * 3);
    } else {
      pitchOffset = -1 - Math.floor(Math.abs(emotion));
    }

    if (previousNote !== undefined) {
      const direction = emotion > 0 ? 1 : -1;
      pitchOffset = previousNote + (direction * (1 + Math.floor(Math.random() * 2)));
    }

    const scaleDegree = (((pitchOffset - rootNote) % 12) + 12) % 12;
    const nearestScaleNote = scale.reduce((nearest, note) => 
      Math.abs(scaleDegree - note) < Math.abs(scaleDegree - nearest) ? note : nearest
    );

    return rootNote + nearestScaleNote + (octave * 12);
  }

  private calculateNoteDuration(params: {
    isStressed: boolean;
    emotion: number;
    tempo: number;
    genre: string;
    position: number;
  }): number {
    const { isStressed, emotion, tempo, genre, position } = params;
    let duration = (60 / tempo) * (isStressed ? 1.5 : 1);
    duration *= 1 + (0.2 * Math.abs(emotion));

    // Genre adjustments
    if (['ballad', 'jazz'].includes(genre)) duration *= 1.2;
    if (['punk', 'metal'].includes(genre)) duration *= 0.8;

    // Prevent too long notes at phrase starts
    if (position < 3) duration = Math.min(duration, 1.2 * (60 / tempo));

    return Math.max(0.1, Math.min(2, duration));
  }

  private calculateNoteVelocity(isStressed: boolean, emotion: number): number {
    let velocity = isStressed ? 90 : 70;
    velocity += Math.round(Math.abs(emotion) * 20);
    return Math.max(40, Math.min(127, velocity));
  }

  // ========================
  // HELPER METHODS
  // ========================

  private async fileExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  private async calculateAudioDuration(audioPath: string): Promise<number> {
    try {
      const { stdout } = await execAsync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`
      );
      return parseFloat(stdout) || 0;
    } catch {
      return 0;
    }
  }

  private async countMidiNotes(midiPath: string): Promise<number> {
    try {
      const { stdout } = await execAsync(
        `python3 server/midi-analyzer.py "${midiPath}"`
      );
      return parseInt(stdout) || 0;
    } catch {
      return 0;
    }
  }

  private estimateNoteCount(config: MelodyGenerationConfig): number {
    const duration = config.duration || this.estimateDurationFromLyrics(config.lyrics);
    return Math.floor((duration * config.tempo) / 60 * 2);
  }

  private estimateDurationFromLyrics(lyrics: string): number {
    const wordCount = lyrics.match(/\b\w+\b/g)?.length || 0;
    return Math.max(30, Math.min(300, wordCount * 0.5));
  }

  private generateContentHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex').slice(0, 12);
  }

  private sanitizeInput(input: string): string {
    return input.replace(/[;"'`$\\]/g, '');
  }

  // ========================
  // INITIALIZATION METHODS
  // ========================

  private initScales() {
    return {
      major: [0, 2, 4, 5, 7, 9, 11],
      minor: [0, 2, 3, 5, 7, 8, 10],
      harmonic_minor: [0, 2, 3, 5, 7, 8, 11],
      melodic_minor: [0, 2, 3, 5, 7, 9, 11],
      dorian: [0, 2, 3, 5, 7, 9, 10],
      phrygian: [0, 1, 3, 5, 7, 8, 10],
      lydian: [0, 2, 4, 6, 7, 9, 11],
      mixolydian: [0, 2, 4, 5, 7, 9, 10],
      locrian: [0, 1, 3, 5, 6, 8, 10],
      pentatonic_major: [0, 2, 4, 7, 9],
      pentatonic_minor: [0, 3, 5, 7, 10],
      blues: [0, 3, 5, 6, 7, 10],
      whole_tone: [0, 2, 4, 6, 8, 10],
      chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    };
  }

  private initEmotionMappings() {
    return {
      happy: { scale: "major", tempoMod: 1.1, energy: 0.8, dynamicRange: 0.7 },
      joyful: { scale: "lydian", tempoMod: 1.15, energy: 0.85 },
      sad: { scale: "minor", tempoMod: 0.85, energy: 0.4, dynamicRange: 0.5 },
      melancholic: { scale: "harmonic_minor", tempoMod: 0.8, energy: 0.45 },
      energetic: { scale: "mixolydian", tempoMod: 1.2, energy: 0.9 },
      angry: { scale: "phrygian", tempoMod: 1.3, energy: 0.95 },
      calm: { scale: "pentatonic_major", tempoMod: 0.75, energy: 0.3 },
      peaceful: { scale: "aeolian", tempoMod: 0.7, energy: 0.25 },
      mysterious: { scale: "locrian", tempoMod: 0.9, energy: 0.5 },
      dreamy: { scale: "dorian", tempoMod: 0.95, energy: 0.6 },
      uplifting: { scale: "major", tempoMod: 1.05, energy: 0.7 },
      romantic: { scale: "melodic_minor", tempoMod: 1.0, energy: 0.65 }
    };
  }

  private initEmotionWeights() {
    return {
      // Positive emotions
      love: 0.9, joy: 0.8, happy: 0.7, beautiful: 0.6,
      amazing: 0.7, wonderful: 0.8, perfect: 0.6, dream: 0.5,
      sunshine: 0.7, freedom: 0.6, hope: 0.5, smile: 0.6,
      dance: 0.7, fly: 0.6, soar: 0.8, bright: 0.5,
      laugh: 0.7, celebrate: 0.8, victory: 0.7, harmony: 0.6,

      // Negative emotions
      sad: -0.7, pain: -0.8, hurt: -0.6, broken: -0.7,
      lonely: -0.6, dark: -0.5, tears: -0.6, goodbye: -0.5,
      lost: -0.6, empty: -0.7, cold: -0.4, fear: -0.6,
      death: -0.9, cry: -0.7, alone: -0.8, despair: -0.9,

      // Neutral/contextual
      time: 0.0, day: 0.1, night: -0.2, way: 0.0,
      life: 0.2, world: 0.1, heart: 0.3, soul: 0.2,
      moon: -0.1, star: 0.3, sky: 0.2, ocean: 0.1,
      fire: 0.4, water: 0.0, earth: 0.1, wind: 0.2
      };
      }

      private initStressPatterns() {
      return {
      beautiful: [true, false, false],
      amazing: [false, true, false],
      wonderful: [true, false, false],
      together: [false, true, false],
      forever: [false, true, false],
      remember: [false, true, false],
      believe: [false, true],
      freedom: [true, false],
      sunshine: [true, false],
      incredible: [false, true, false, false],
      fantastic: [false, true, false],
      impossible: [false, true, false],
      understand: [false, true, false],
      happiness: [true, false, false],
      melancholy: [true, false, false],
      running: [true, false],
      jumping: [true, false],
      singing: [true, false],
      dancing: [true, false]
      };
      }

      private initGenrePresets() {
      return {
      pop: {
        scale: "major",
        tempoRange: [90, 130],
        chordComplexity: 0.6,
        instrumentation: ["piano", "synth", "drums"]
      },
      rock: {
        scale: "mixolydian",
        tempoRange: [100, 150],
        chordComplexity: 0.7,
        instrumentation: ["electric_guitar", "bass", "drums"]
      },
      jazz: {
        scale: "dorian",
        tempoRange: [80, 160],
        chordComplexity: 0.9,
        instrumentation: ["piano", "double_bass", "brass"]
      },
      electronic: {
        scale: "minor",
        tempoRange: [110, 180],
        chordComplexity: 0.5,
        instrumentation: ["synth", "drum_machine", "bass"]
      },
      classical: {
        scale: "major",
        tempoRange: [60, 120],
        chordComplexity: 0.8,
        instrumentation: ["strings", "woodwinds", "piano"]
      },
      hiphop: {
        scale: "pentatonic_minor",
        tempoRange: [70, 100],
        chordComplexity: 0.4,
        instrumentation: ["sampler", "drums", "bass"]
      },
      country: {
        scale: "major",
        tempoRange: [80, 120],
        chordComplexity: 0.5,
        instrumentation: ["acoustic_guitar", "fiddle", "steel_guitar"]
      },
      rnb: {
        scale: "minor",
        tempoRange: [70, 110],
        chordComplexity: 0.7,
        instrumentation: ["electric_piano", "bass", "drums"]
      }
      };
      }

      // ========================
      // VALIDATION METHODS
      // ========================

      private validateConfig(config: MelodyGenerationConfig) {
      if (!config.lyrics || config.lyrics.trim().length < 10) {
      throw new Error("Lyrics must be at least 10 characters long");
      }

      if (!Object.keys(this.emotionMappings).includes(config.mood.toLowerCase())) {
      console.warn(`Unrecognized mood: ${config.mood}. Defaulting to 'happy'`);
      config.mood = 'happy';
      }

      if (config.tempo < 40 || config.tempo > 200) {
      console.warn(`Tempo ${config.tempo} is outside recommended range (40-200). Clamping value`);
      config.tempo = Math.max(40, Math.min(200, config.tempo));
      }

      if (config.complexity && (config.complexity < 0 || config.complexity > 1)) {
      console.warn(`Complexity ${config.complexity} must be between 0 and 1. Defaulting to 0.5`);
      config.complexity = 0.5;
      }
      }

      // ========================
      // MUSICAL CALCULATIONS
      // ========================

      private determineMusicalKey(emotionalArc: number[], mood: string): [number, keyof typeof this.scales] {
      const avgEmotion = emotionalArc.reduce((sum, val) => sum + val, 0) / emotionalArc.length;
      const moodConfig = this.emotionMappings[mood.toLowerCase() as keyof typeof this.emotionMappings];

      const scaleName = moodConfig?.scale || 
      (avgEmotion > 0.3 ? "major" : avgEmotion < -0.3 ? "minor" : "dorian");

      // Select root note based on emotion
      const rootNotes = avgEmotion > 0.5 ? [60, 62, 64, 67] : // C, D, E, G (bright)
                     avgEmotion < -0.5 ? [57, 59, 61, 65] : // A, B, C#, F (dark)
                     [60, 62, 65, 67]; // C, D, F, G (neutral)

      const rootNote = rootNotes[Math.floor(Math.random() * rootNotes.length)];
      return [rootNote, scaleName as keyof typeof this.scales];
      }

      private getWordStressPattern(word: string): boolean[] {
      const lowerWord = word.toLowerCase();
      return this.stressPatterns[lowerWord as keyof typeof this.stressPatterns] || 
           this.generateStressPattern(word, this.countSyllables(word));
      }

      private generateStressPattern(word: string, syllableCount: number): boolean[] {
      if (syllableCount === 1) return [true];
      if (syllableCount === 2) return [true, false]; // Trochaic default
      if (syllableCount === 3) return [true, false, false]; // Dactylic

      // For longer words, alternate stress with stronger first syllable
      return Array.from({length: syllableCount}, (_, i) => i % 2 === 0);
      }

      private countSyllables(word: string): number {
      word = word.toLowerCase();
      if (word.length <= 3) return 1;

      const exceptions: Record<string, number> = {
      'every': 2, 'different': 3, 'family': 3, 'probably': 3,
      'something': 2, 'business': 2, 'actually': 4
      };
      if (exceptions[word]) return exceptions[word];

      const vowels = word.match(/[aeiouy]+/g);
      if (!vowels) return 1;

      let count = vowels.length;
      if (word.endsWith('e')) count--;
      if (word.endsWith('ed') && word.length > 4) count--;
      if (word.endsWith('es') && word.length > 4) count--;

      return Math.max(1, count);
      }

      private getWordEmotion(word: string): number {
      word = word.toLowerCase();

      // Direct match
      if (this.emotionWeights[word as keyof typeof this.emotionWeights] !== undefined) {
      return this.emotionWeights[word as keyof typeof this.emotionWeights];
      }

      // Check for negating prefixes
      const negatingPrefixes = ['un', 'dis', 'non', 'in'];
      for (const prefix of negatingPrefixes) {
      if (word.startsWith(prefix)) {
        const baseWord = word.slice(prefix.length);
        if (this.emotionWeights[baseWord as keyof typeof this.emotionWeights] !== undefined) {
          return -0.5 * this.emotionWeights[baseWord as keyof typeof this.emotionWeights];
        }
      }
      }

      // Check for suffixes
      const suffixes = ['ing', 'ed', 'ly', 'ness', 'ful'];
      for (const suffix of suffixes) {
      if (word.endsWith(suffix)) {
        const baseWord = word.slice(0, -suffix.length);
        if (this.emotionWeights[baseWord as keyof typeof this.emotionWeights] !== undefined) {
          return 0.8 * this.emotionWeights[baseWord as keyof typeof this.emotionWeights];
        }
      }
      }

      return 0; // Neutral
      }

      private wordsRhyme(word1: string, word2: string): boolean {
      if (word1 === word2) return false;

      const endingLength = Math.min(3, word1.length, word2.length);
      return word1.slice(-endingLength) === word2.slice(-endingLength);
      }

      private determineSectionType(lineIndex: number, totalLines: number): string {
      if (lineIndex === 0) return 'intro';
      if (lineIndex === totalLines - 1) return 'outro';
      if (lineIndex % 4 === 0) return 'chorus';
      if (lineIndex % 2 === 0) return 'verse';
      return 'bridge';
      }

      private calculateAudioFeatures(
      config: MelodyGenerationConfig,
      analysis: LyricsAnalysis
      ): AudioFeatures {
      const avgEmotion = analysis.emotionalArc.reduce((sum, val) => sum + val, 0) / analysis.emotionalArc.length;
      const moodConfig = this.emotionMappings[config.mood.toLowerCase() as keyof typeof this.emotionMappings];
      const genrePreset = this.genrePresets[config.genre.toLowerCase() as keyof typeof this.genrePresets] || 
                       this.genrePresets.pop;

      return {
      tempo: config.tempo,
      key: config.key || this.getKeyFromMoodAndGenre(config.mood, config.genre),
      timeSignature: "4/4",
      energy: moodConfig?.energy || 0.7,
      valence: avgEmotion > 0 ? 0.8 : 0.3,
      danceability: genrePreset.tempoRange[1] > 120 ? 0.8 : 0.5,
      acousticness: ['classical', 'jazz', 'country'].includes(config.genre) ? 0.7 : 0.3,
      instrumentalness: 0.8,
      liveness: 0.2,
      speechiness: this.calculateSpeechiness(analysis),
      mode: avgEmotion > 0 ? 1 : 0,
      dynamicRange: moodConfig?.dynamicRange || 0.6
      };
      }

      private calculateSpeechiness(analysis: LyricsAnalysis): number {
      const avgSyllablesPerLine = analysis.totalSyllables / analysis.lines.length;
      return Math.min(0.8, Math.max(0.1, avgSyllablesPerLine / 10));
      }

      private calculateBpmVariation(tempo: number, mood: string): number {
      const moodLower = mood.toLowerCase();
      if (moodLower.includes('calm') || moodLower.includes('sad')) {
      return tempo * 0.02;
      }
      if (moodLower.includes('energetic') || moodLower.includes('angry')) {
      return tempo * 0.05;
      }
      return tempo * 0.03;
      }

      private calculateDynamicRange(mood: string): number {
      const moodLower = mood.toLowerCase();
      if (moodLower.includes('angry') || moodLower.includes('energetic')) {
      return 0.8;
      }
      if (moodLower.includes('calm') || moodLower.includes('peaceful')) {
      return 0.4;
      }
      return 0.6;
      }

      private getKeyFromMoodAndGenre(mood: string, genre: string): string {
      const moodKeys: Record<string, string> = {
      happy: 'C',
      sad: 'Am',
      energetic: 'G',
      calm: 'F',
      mysterious: 'Dm',
      uplifting: 'D',
      angry: 'Em',
      romantic: 'A'
      };

      const genreKeys: Record<string, string> = {
      pop: 'C',
      rock: 'E',
      jazz: 'F',
      electronic: 'Am',
      classical: 'C',
      hiphop: 'Cm',
      country: 'G',
      rnb: 'Bb'
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

      // ========================
      // FALLBACK GENERATION
      // ========================

      private async generateFallbackAudio(
      config: MelodyGenerationConfig,
      outputPath: string
      ): Promise<MelodyOutputResult> {
      const key = config.key || this.getKeyFromMoodAndGenre(config.mood, config.genre);
      const duration = config.duration || this.estimateDurationFromLyrics(config.lyrics);
      const baseFreq = this.getFrequencyFromKey(key);

      try {
      // Create a more musical fallback than simple sine waves
      const ffmpegCommand = [
        'ffmpeg',
        '-f', 'lavfi',
        '-i', `sine=frequency=${baseFreq}:duration=${duration}`,
        '-f', 'lavfi',
        '-i', `sine=frequency=${baseFreq * 1.5}:duration=${duration}`,
        '-f', 'lavfi',
        '-i', `sine=frequency=${baseFreq * 2}:duration=${duration}`,
        '-filter_complex',
        '[0:a]volume=0.3[base];[1:a]volume=0.5[melody];[2:a]volume=0.2[harmony];' +
        '[base][melody][harmony]amix=inputs=3:duration=first[out]',
        '-map', '[out]',
        '-ar', '44100',
        '-ac', '2',
        '-t', duration.toString(),
        '-y',
        outputPath
      ].join(' ');

      await execAsync(ffmpegCommand);

      return {
        audioPath: `/uploads/generated/${path.basename(outputPath)}`,
        metadata: {
          key,
          tempo: config.tempo,
          duration,
          noteCount: this.estimateNoteCount(config),
          generatedAt: new Date().toISOString(),
          bpmVariation: this.calculateBpmVariation(config.tempo, config.mood),
          dynamicRange: this.calculateDynamicRange(config.mood)
        }
      };
      } catch (error) {
      console.error('Fallback generation failed, using silent file:', error);
      return this.generateSilentAudio(outputPath, config, key, duration);
      }
      }

      private async generateSilentAudio(
      outputPath: string,
      config: MelodyGenerationConfig,
      key: string,
      duration: number
      ): Promise<MelodyOutputResult> {
      const silentBuffer = Buffer.alloc(44100 * 2 * duration); // 2 bytes per sample, stereo
      await fs.writeFile(outputPath, silentBuffer);

      return {
      audioPath: `/uploads/generated/${path.basename(outputPath)}`,
      metadata: {
        key,
        tempo: config.tempo,
        duration,
        noteCount: 0,
        generatedAt: new Date().toISOString(),
        bpmVariation: 0,
        dynamicRange: 0
      }
      };
      }

      // ========================
      // LEGACY SUPPORT METHODS
      // ========================

      /**
      * @deprecated Use generateMelodyFromLyrics instead
      */
      async generateLegacyMelody(
      genre: string,
      mood: string,
      tempo: number,
      duration: number,
      lyrics: string
      ): Promise<any> {
      console.warn("⚠️ Legacy method called. Migrate to generateMelodyFromLyrics()");

      const config: MelodyGenerationConfig = {
      lyrics,
      genre,
      mood,
      tempo,
      duration
      };

      const melody = await this.generateMelodyFromLyrics(config);

      // Add legacy fields for backward compatibility
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
      const progressions: Record<string, string[][]> = {
      pop: [['C', 'Am', 'F', 'G'], ['Am', 'F', 'C', 'G'], ['F', 'G', 'C', 'Am']],
      rock: [['E', 'A', 'B', 'E'], ['A
                                    rock: [['E', 'A', 'B', 'E'], ['A', 'D', 'E', 'A'], ['B', 'E', 'A', 'D']],
                                    jazz: [['Cmaj7', 'Am7', 'Dm7', 'G7'], ['Am7', 'D7', 'Gmaj7', 'Cmaj7'], ['Fmaj7', 'Bm7b5', 'Em7', 'Am7']],
                                    electronic: [['Am', 'F', 'C', 'G'], ['Dm', 'Bb', 'F', 'C'], ['Em', 'C', 'G', 'D']],
                                    classical: [['C', 'F', 'G', 'C'], ['Am', 'Dm', 'G', 'C'], ['F', 'C', 'G', 'Am']],
                                    hiphop: [['Am', 'F', 'G', 'Em'], ['Dm', 'Bb', 'F', 'C'], ['Cm', 'Ab', 'Bb', 'Fm']],
                                    country: [['G', 'C', 'D', 'G'], ['C', 'G', 'Am', 'F'], ['D', 'G', 'C', 'D']],
                                    rnb: [['Am', 'Dm', 'G', 'C'], ['F', 'G', 'Em', 'Am'], ['Dm', 'G', 'C', 'F']]
                                    };

                                    const genreLower = genre.toLowerCase();
                                    if (!progressions[genreLower]) {
                                    console.warn(`Unknown genre '${genre}', defaulting to pop progression`);
                                    return progressions.pop[0];
                                    }
                                    return progressions[genreLower][0];
                                    }

                                    private determineMelodicDirection(phrases: MelodyPhrase[]): string {
                                    if (phrases.length === 0) return 'stable';

                                    const firstNote = phrases[0].notes[0]?.pitch || 60;
                                    const lastNote = phrases[phrases.length - 1].notes.slice(-1)[0]?.pitch || 60;
                                    const delta = lastNote - firstNote;

                                    if (delta > 5) return 'ascending';
                                    if (delta < -5) return 'descending';

                                    // Check for wave-like motion
                                    let directionChanges = 0;
                                    let lastDirection = 0;

                                    phrases.forEach(phrase => {
                                    for (let i = 1; i < phrase.notes.length; i++) {
                                      const currentDirection = Math.sign(phrase.notes[i].pitch - phrase.notes[i-1].pitch);
                                      if (currentDirection !== 0 && currentDirection !== lastDirection) {
                                        directionChanges++;
                                        lastDirection = currentDirection;
                                      }
                                    }
                                    });

                                    return directionChanges > phrases.length ? 'wave' : 'stable';
                                    }

                                    private extractIntervalPattern(phrases: MelodyPhrase[]): number[] {
                                    const intervals: number[] = [];

                                    phrases.forEach(phrase => {
                                    for (let i = 1; i < phrase.notes.length; i++) {
                                      intervals.push(phrase.notes[i].pitch - phrase.notes[i-1].pitch);
                                    }
                                    });

                                    // Return the most common 8 intervals
                                    const frequencyMap = intervals.reduce((map, interval) => {
                                    map.set(interval, (map.get(interval) || 0) + 1);
                                    return map;
                                    }, new Map<number, number>());

                                    return Array.from(frequencyMap.entries())
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 8)
                                    .map(([interval]) => interval);
                                    }

                                    // ========================
                                    // UTILITY METHODS
                                    // ========================

                                    private getChordTones(chord: string): number[] {
                                    const chordMap: Record<string, number[]> = {
                                    // Major
                                    'C': [0, 4, 7], 'G': [7, 11, 2], 'D': [2, 6, 9],
                                    'A': [9, 1, 4], 'E': [4, 8, 11], 'B': [11, 3, 6],
                                    'F': [5, 9, 0], 'Bb': [10, 2, 5], 'Eb': [3, 7, 10],
                                    'Ab': [8, 0, 3], 'Db': [1, 5, 8], 'Gb': [6, 10, 1],
                                    // Minor
                                    'Am': [9, 0, 4], 'Em': [4, 7, 11], 'Bm': [11, 2, 6],
                                    'F#m': [6, 9, 1], 'C#m': [1, 4, 8], 'G#m': [8, 11, 3],
                                    'D#m': [3, 6, 10], 'A#m': [10, 1, 5], 'Dm': [2, 5, 9],
                                    'Gm': [7, 10, 2], 'Cm': [0, 3, 7], 'Fm': [5, 8, 0],
                                    // Seventh chords
                                    'C7': [0, 4, 7, 10], 'G7': [7, 11, 2, 5], 'D7': [2, 6, 9, 0],
                                    'A7': [9, 1, 4, 7], 'E7': [4, 8, 11, 2], 'B7': [11, 3, 6, 9],
                                    'F7': [5, 9, 0, 3], 'Bb7': [10, 2, 5, 8], 'Eb7': [3, 7, 10, 1],
                                    'Ab7': [8, 0, 3, 6], 'Db7': [1, 5, 8, 11], 'Gb7': [6, 10, 1, 4],
                                    // Minor seventh
                                    'Am7': [9, 0, 4, 7], 'Em7': [4, 7, 11, 2], 'Bm7': [11, 2, 6, 9],
                                    'F#m7': [6, 9, 1, 4], 'C#m7': [1, 4, 8, 11], 'G#m7': [8, 11, 3, 6],
                                    'D#m7': [3, 6, 10, 1], 'A#m7': [10, 1, 5, 8], 'Dm7': [2, 5, 9, 0],
                                    'Gm7': [7, 10, 2, 5], 'Cm7': [0, 3, 7, 10], 'Fm7': [5, 8, 0, 3],
                                    // Major seventh
                                    'Cmaj7': [0, 4, 7, 11], 'Gmaj7': [7, 11, 2, 6], 'Dmaj7': [2, 6, 9, 1],
                                    'Amaj7': [9, 1, 4, 8], 'Emaj7': [4, 8, 11, 3], 'Bmaj7': [11, 3, 6, 10],
                                    'Fmaj7': [5, 9, 0, 4], 'Bbmaj7': [10, 2, 5, 9], 'Ebmaj7': [3, 7, 10, 2],
                                    'Abmaj7': [8, 0, 3, 7], 'Dbmaj7': [1, 5, 8, 0], 'Gbmaj7': [6, 10, 1, 5]
                                    };

                                    return chordMap[chord] || [0, 4, 7]; // Default to C major
                                    }

                                    private midiToNoteName(midiNote: number): string {
                                    const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
                                    const octave = Math.floor(midiNote / 12) - 1;
                                    return `${noteNames[midiNote % 12]}${octave}`;
                                    }

                                    private generateContentHash(content: string): string {
                                    return crypto.createHash('sha256')
                                    .update(content)
                                    .digest('hex')
                                    .slice(0, 12);
                                    }

                                    // ========================
                                    // EXPORT SINGLETON INSTANCE
                                    // ========================

                                    static getInstance(): MelodyGenerator {
                                    if (!MelodyGenerator.instance) {
                                    MelodyGenerator.instance = new MelodyGenerator();
                                    }
                                    return MelodyGenerator.instance;
                                    }
                                    }

                                    // Export default singleton instance
                                    export const melodyGenerator = MelodyGenerator.getInstance();
