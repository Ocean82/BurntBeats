import { storage } from "./storage";
import { pricingService } from "./pricing-service";
import { Request, Response } from "express";

interface ChordProgression {
  chords: string[];
  key: string;
  analysis: {
    romanNumerals: string[];
    functions: string[];
    complexity: number;
    suggestions: string[];
  };
}

interface LyricAnalysis {
  structure: {
    verses: number;
    choruses: number;
    bridges: number;
    totalLines: number;
  };
  rhymeScheme: string[];
  sentiment: {
    overall: 'positive' | 'negative' | 'neutral';
    score: number;
    emotions: string[];
  };
  suggestions: {
    musicalKey: string;
    tempo: number;
    genre: string[];
    improvements: string[];
  };
}

export class MusicTheoryAnalyzer {
  private static chordMappings = {
    'C': { roman: 'I', function: 'Tonic', mood: 'Stable' },
    'Dm': { roman: 'ii', function: 'Subdominant', mood: 'Gentle' },
    'Em': { roman: 'iii', function: 'Mediant', mood: 'Bright Minor' },
    'F': { roman: 'IV', function: 'Subdominant', mood: 'Lifting' },
    'G': { roman: 'V', function: 'Dominant', mood: 'Tension' },
    'Am': { roman: 'vi', function: 'Submediant', mood: 'Melancholic' },
    'Bdim': { roman: 'viio', function: 'Leading Tone', mood: 'Unstable' }
  };

  private static keySignatures = {
    'C': { sharps: 0, flats: 0, relativeMinor: 'Am' },
    'G': { sharps: 1, flats: 0, relativeMinor: 'Em' },
    'D': { sharps: 2, flats: 0, relativeMinor: 'Bm' },
    'A': { sharps: 3, flats: 0, relativeMinor: 'F#m' },
    'E': { sharps: 4, flats: 0, relativeMinor: 'C#m' },
    'F': { sharps: 0, flats: 1, relativeMinor: 'Dm' },
    'Bb': { sharps: 0, flats: 2, relativeMinor: 'Gm' },
    'Eb': { sharps: 0, flats: 3, relativeMinor: 'Cm' },
    'Ab': { sharps: 0, flats: 4, relativeMinor: 'Fm' }
  };

  static async analyzeChordProgression(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { chords, userPlan } = req.body;
      const user = (req as any).user;

      if (!chords || !Array.isArray(chords)) {
        res.status(400).json({ error: 'Valid chord progression required' });
        return;
      }

      // Basic analysis for all users
      const basicAnalysis = this.performBasicChordAnalysis(chords);
      
      // Enhanced analysis for premium users or license holders
      let enhancedAnalysis = null;
      if (userPlan === 'enterprise' || userPlan === 'pro') {
        enhancedAnalysis = await this.performEnhancedChordAnalysis(chords, user?.id);
      }

      const result: ChordProgression = {
        chords,
        key: basicAnalysis.key,
        analysis: {
          romanNumerals: basicAnalysis.romanNumerals,
          functions: basicAnalysis.functions,
          complexity: basicAnalysis.complexity,
          suggestions: enhancedAnalysis?.suggestions || basicAnalysis.basicSuggestions
        }
      };

      // Store analysis for premium users
      if (user?.id && enhancedAnalysis) {
        await this.storeAnalysis(user.id, 'chord_progression', result);
      }

      res.json({
        success: true,
        analysis: result,
        premiumFeatures: !!enhancedAnalysis,
        upgradeMessage: !enhancedAnalysis ? 
          "Upgrade to Pro or Enterprise for advanced music theory analysis!" : undefined
      });

    } catch (error) {
      console.error('Chord analysis error:', error);
      res.status(500).json({ error: 'Analysis failed' });
    }
  }

  static async analyzeLyrics(req: Request, res: Response): Promise<void> {
    try {
      const { lyrics, userPlan } = req.body;
      const user = (req as any).user;

      if (!lyrics || typeof lyrics !== 'string') {
        res.status(400).json({ error: 'Valid lyrics required' });
        return;
      }

      const basicAnalysis = this.performBasicLyricAnalysis(lyrics);
      
      let enhancedAnalysis = null;
      if (userPlan === 'enterprise' || userPlan === 'pro') {
        enhancedAnalysis = await this.performEnhancedLyricAnalysis(lyrics, user?.id);
      }

      const result: LyricAnalysis = {
        structure: basicAnalysis.structure,
        rhymeScheme: basicAnalysis.rhymeScheme,
        sentiment: basicAnalysis.sentiment,
        suggestions: enhancedAnalysis?.suggestions || basicAnalysis.basicSuggestions
      };

      if (user?.id && enhancedAnalysis) {
        await this.storeAnalysis(user.id, 'lyrics', result);
      }

      res.json({
        success: true,
        analysis: result,
        premiumFeatures: !!enhancedAnalysis,
        upgradeMessage: !enhancedAnalysis ? 
          "Get Pro or Enterprise for AI-powered lyric analysis and suggestions!" : undefined
      });

    } catch (error) {
      console.error('Lyric analysis error:', error);
      res.status(500).json({ error: 'Analysis failed' });
    }
  }

  private static performBasicChordAnalysis(chords: string[]) {
    const detectedKey = this.detectKey(chords);
    const romanNumerals = chords.map(chord => 
      this.chordMappings[chord as keyof typeof this.chordMappings]?.roman || '?'
    );
    const functions = chords.map(chord => 
      this.chordMappings[chord as keyof typeof this.chordMappings]?.function || 'Unknown'
    );

    const complexity = this.calculateChordComplexity(chords);
    const basicSuggestions = this.getBasicChordSuggestions(chords, detectedKey);

    return {
      key: detectedKey,
      romanNumerals,
      functions,
      complexity,
      basicSuggestions
    };
  }

  private static async performEnhancedChordAnalysis(chords: string[], userId?: string) {
    // Advanced music theory analysis
    const voiceLeading = this.analyzeVoiceLeading(chords);
    const modalInterchange = this.detectModalInterchange(chords);
    const substitutions = this.suggestChordSubstitutions(chords);
    
    const suggestions = [
      ...this.getAdvancedProgressionSuggestions(chords),
      ...substitutions,
      `Voice leading quality: ${voiceLeading.quality}`,
      modalInterchange.detected ? `Modal interchange detected: ${modalInterchange.analysis}` : null
    ].filter(Boolean);

    return { suggestions };
  }

  private static performBasicLyricAnalysis(lyrics: string) {
    const lines = lyrics.split('\n').filter(line => line.trim());
    const structure = this.analyzeLyricStructure(lines);
    const rhymeScheme = this.detectRhymeScheme(lines);
    const sentiment = this.analyzeSentiment(lyrics);

    const basicSuggestions = {
      musicalKey: sentiment.overall === 'positive' ? 'C major' : 'A minor',
      tempo: sentiment.score > 0.5 ? 120 : 80,
      genre: sentiment.overall === 'positive' ? ['Pop', 'Rock'] : ['Ballad', 'Folk'],
      improvements: [
        'Consider adding more imagery',
        'Vary your rhyme scheme',
        'Add emotional depth'
      ]
    };

    return { structure, rhymeScheme, sentiment, basicSuggestions };
  }

  private static async performEnhancedLyricAnalysis(lyrics: string, userId?: string) {
    // AI-powered analysis would go here
    const thematicAnalysis = this.analyzeThemes(lyrics);
    const metaphorDetection = this.detectMetaphors(lyrics);
    const flowAnalysis = this.analyzeFlow(lyrics);
    
    const suggestions = {
      musicalKey: this.suggestOptimalKey(lyrics),
      tempo: this.suggestOptimalTempo(lyrics),
      genre: this.suggestGenres(lyrics),
      improvements: [
        ...this.getAdvancedLyricSuggestions(lyrics),
        `Thematic consistency: ${thematicAnalysis.score}%`,
        `Metaphor usage: ${metaphorDetection.count} detected`,
        `Flow rating: ${flowAnalysis.rating}/10`
      ]
    };

    return { suggestions };
  }

  private static detectKey(chords: string[]): string {
    // Simple key detection based on chord frequency
    const chordCounts = chords.reduce((acc, chord) => {
      acc[chord] = (acc[chord] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostFrequent = Object.keys(chordCounts).reduce((a, b) => 
      chordCounts[a] > chordCounts[b] ? a : b
    );

    // Basic logic: if most frequent chord is major, it's likely the key
    return mostFrequent.includes('m') ? mostFrequent.replace('m', '') + ' minor' : mostFrequent + ' major';
  }

  private static calculateChordComplexity(chords: string[]): number {
    const uniqueChords = new Set(chords);
    const hasSevenths = chords.some(chord => chord.includes('7'));
    const hasExtensions = chords.some(chord => chord.includes('9') || chord.includes('11') || chord.includes('13'));
    
    let complexity = uniqueChords.size * 0.1;
    if (hasSevenths) complexity += 0.2;
    if (hasExtensions) complexity += 0.3;
    
    return Math.min(Math.max(complexity, 0), 1);
  }

  private static getBasicChordSuggestions(chords: string[], key: string): string[] {
    return [
      'Try adding a dominant seventh for more tension',
      'Consider a vi-IV-I-V progression for familiarity',
      `In ${key}, you could use modal interchange`,
      'Add passing chords for smoother transitions'
    ];
  }

  private static analyzeLyricStructure(lines: string[]) {
    // Basic structure detection
    const verses = Math.ceil(lines.length / 8); // Assuming 8 lines per verse
    const choruses = Math.floor(verses / 2); // Rough estimate
    const bridges = verses > 3 ? 1 : 0;

    return {
      verses,
      choruses,
      bridges,
      totalLines: lines.length
    };
  }

  private static detectRhymeScheme(lines: string[]): string[] {
    // Simplified rhyme scheme detection
    const scheme = [];
    let currentLetter = 'A';
    
    for (let i = 0; i < Math.min(lines.length, 8); i++) {
      scheme.push(currentLetter);
      if (i % 2 === 1) {
        currentLetter = String.fromCharCode(currentLetter.charCodeAt(0) + 1);
      }
    }
    
    return scheme;
  }

  private static analyzeSentiment(lyrics: string) {
    const positiveWords = ['love', 'happy', 'joy', 'beautiful', 'amazing', 'wonderful', 'bright', 'shine'];
    const negativeWords = ['sad', 'pain', 'hurt', 'broken', 'dark', 'lonely', 'tears', 'lost'];
    
    const words = lyrics.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    
    const score = (positiveCount - negativeCount) / words.length + 0.5;
    const overall = score > 0.6 ? 'positive' : score < 0.4 ? 'negative' : 'neutral';
    
    const emotions = [];
    if (positiveCount > 0) emotions.push('joy', 'love');
    if (negativeCount > 0) emotions.push('melancholy', 'longing');
    
    return { overall, score, emotions };
  }

  // Enhanced analysis methods
  private static analyzeVoiceLeading(chords: string[]) {
    return { quality: 'smooth', recommendations: ['Use common tones', 'Avoid parallel fifths'] };
  }

  private static detectModalInterchange(chords: string[]) {
    return { detected: false, analysis: 'No modal interchange detected' };
  }

  private static suggestChordSubstitutions(chords: string[]): string[] {
    return [
      'Try substituting vi for I for a deceptive resolution',
      'Use ii7 instead of ii for more color',
      'Consider tritone substitution for V7'
    ];
  }

  private static getAdvancedProgressionSuggestions(chords: string[]): string[] {
    return [
      'Add chromatic passing chords',
      'Use secondary dominants for more interest',
      'Try a Neapolitan sixth chord for drama'
    ];
  }

  private static analyzeThemes(lyrics: string) {
    return { score: 85, themes: ['love', 'growth', 'relationships'] };
  }

  private static detectMetaphors(lyrics: string) {
    return { count: 3, examples: ['heart of gold', 'burning bridges'] };
  }

  private static analyzeFlow(lyrics: string) {
    return { rating: 7.5, suggestions: ['Vary syllable counts', 'Add internal rhymes'] };
  }

  async analyzeMelody(melodyId: string): Promise<any> {
    try {
      // Fetch melody data from storage
      const melody = await storage.getMelodyById(melodyId);
      
      if (!melody) {
        throw new Error('Melody not found');
      }

      // Analyze melody structure
      const analysis = {
        key: melody.key || 'C',
        tempo: melody.tempo || 120,
        duration: melody.duration || 0,
        complexity: this.calculateMelodyComplexity(melody),
        harmonicAnalysis: this.analyzeHarmonicContent(melody),
        rhythmicAnalysis: this.analyzeRhythmicPattern(melody),
        recommendations: this.generateMelodyRecommendations(melody)
      };

      return analysis;
    } catch (error) {
      console.error('Melody analysis failed:', error);
      throw new Error('Failed to analyze melody');
    }
  }

  private calculateMelodyComplexity(melody: any): number {
    // Basic complexity calculation based on note count and range
    const noteCount = melody.notes?.length || 0;
    const complexityScore = Math.min(noteCount / 100, 1.0);
    return Math.round(complexityScore * 100) / 100;
  }

  private analyzeHarmonicContent(melody: any): any {
    return {
      keyStability: 0.85,
      modulations: [],
      chordProgression: ['I', 'V', 'vi', 'IV'],
      harmonicRhythm: 'moderate'
    };
  }

  private analyzeRhythmicPattern(melody: any): any {
    return {
      complexity: 0.7,
      syncopation: 0.3,
      timeSignature: '4/4',
      rhythmicVariety: 0.6
    };
  }

  private generateMelodyRecommendations(melody: any): string[] {
    return [
      'Consider adding more rhythmic variation',
      'Try modulating to the relative minor',
      'Add melodic sequences for development',
      'Use stepwise motion for smoother phrases'
    ];
  }

  private static suggestOptimalKey(lyrics: string): string {
    return 'E major'; // AI would determine this
  }

  private static suggestOptimalTempo(lyrics: string): number {
    return 110; // AI would determine this
  }

  private static suggestGenres(lyrics: string): string[] {
    return ['Pop', 'Rock', 'Alternative']; // AI would determine this
  }

  private static getAdvancedLyricSuggestions(lyrics: string): string[] {
    return [
      'Consider using more concrete imagery',
      'The emotional arc could be strengthened',
      'Add sensory details to engage listeners'
    ];
  }

  private static async storeAnalysis(userId: string, type: string, analysis: any): Promise<void> {
    try {
      // Store in database for future reference
      console.log(`Storing ${type} analysis for user ${userId}:`, analysis);
      // Implementation would store in your database
    } catch (error) {
      console.error('Failed to store analysis:', error);
    }
  }

  // Premium feature unlock after purchase
  static async unlockPremiumAnalysis(userId: string, purchaseType: string): Promise<void> {
    try {
      const user = await storage.getUser(userId);
      if (!user) return;

      // Grant premium analysis features based on purchase
      const features = {
        'license_basic': ['chord_analysis'],
        'license_premium': ['chord_analysis', 'lyric_analysis', 'composition_tools'],
        'subscription_pro': ['chord_analysis', 'lyric_analysis'],
        'subscription_enterprise': ['chord_analysis', 'lyric_analysis', 'composition_tools', 'ai_feedback']
      };

      const grantedFeatures = features[purchaseType as keyof typeof features] || [];
      
      await storage.updateUser(userId, {
        premiumFeatures: [...(user.premiumFeatures || []), ...grantedFeatures]
      });

      console.log(`Unlocked premium analysis features for user ${userId}:`, grantedFeatures);
    } catch (error) {
      console.error('Failed to unlock premium analysis:', error);
    }
  }
}
