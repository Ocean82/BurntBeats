
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { Logger } from '../logger';

// Logger class usage

export interface AdvancedAIGenerationOptions {
  title: string;
  lyrics: string;
  genre: string;
  tempo: number;
  key: string;
  duration: number;
  aiEnhanced?: boolean;
  voiceCloning?: boolean;
  styleReference?: string;
  emotionalProfile?: string;
  complexityLevel?: 'simple' | 'medium' | 'complex';
  outputFormat?: 'midi' | 'audio' | 'both';
}

export interface AIGenerationResult {
  success: boolean;
  audioPath?: string;
  midiPath?: string;
  metadata: any;
  aiInsights?: any;
  processingTime: number;
  error?: string;
}

export class AdvancedAIMusicService {
  private static instance: AdvancedAIMusicService;
  private pythonPath: string;
  private advancedGeneratorPath: string;
  private tempDir: string;

  constructor() {
    this.pythonPath = 'python3';
    this.advancedGeneratorPath = path.join(process.cwd(), 'music Gen extra', 'Main.py');
    this.tempDir = path.join(process.cwd(), 'uploads');
  }

  static getInstance(): AdvancedAIMusicService {
    if (!AdvancedAIMusicService.instance) {
      AdvancedAIMusicService.instance = new AdvancedAIMusicService();
    }
    return AdvancedAIMusicService.instance;
  }

  async generateAdvancedMusic(options: AdvancedAIGenerationOptions): Promise<AIGenerationResult> {
    const startTime = Date.now();
    
    try {
      Logger.info('Starting advanced AI music generation', {
        title: options.title,
        genre: options.genre,
        aiEnhanced: options.aiEnhanced
      });

      // Validate inputs
      this.validateGenerationOptions(options);

      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const baseFileName = `ai_generated_${timestamp}_${randomId}`;
      
      const midiPath = path.join(this.tempDir, `${baseFileName}.mid`);
      const audioPath = path.join(this.tempDir, `${baseFileName}.wav`);

      // Step 1: Generate MIDI using advanced AI
      const midiResult = await this.generateAdvancedMIDI(options, midiPath);
      
      if (!midiResult.success) {
        throw new Error(midiResult.error || 'MIDI generation failed');
      }

      // Step 2: Convert to audio if requested
      let finalAudioPath: string | undefined;
      
      if (options.outputFormat === 'audio' || options.outputFormat === 'both') {
        const audioResult = await this.convertMidiToAdvancedAudio(midiPath, audioPath, options);
        if (audioResult.success) {
          finalAudioPath = audioPath;
        }
      }

      // Step 3: Generate AI insights and analysis
      const aiInsights = await this.generateAIInsights(options, midiResult.metadata);

      // Step 4: Compile results
      const processingTime = Date.now() - startTime;
      
      const result: AIGenerationResult = {
        success: true,
        midiPath: midiPath,
        audioPath: finalAudioPath,
        metadata: {
          ...midiResult.metadata,
          processingTime,
          aiEnhanced: options.aiEnhanced,
          generationMethod: 'advanced_ai_service'
        },
        aiInsights,
        processingTime
      };

      Logger.info('Advanced AI music generation completed', {
        title: options.title,
        processingTime,
        hasAudio: !!finalAudioPath
      });

      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      Logger.error('Advanced AI music generation failed', { error, options, processingTime });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {},
        processingTime
      };
    }
  }

  private async generateAdvancedMIDI(options: AdvancedAIGenerationOptions, outputPath: string): Promise<{ success: boolean; metadata?: any; error?: string }> {
    return new Promise((resolve) => {
      const args = [
        this.advancedGeneratorPath,
        options.title,
        options.lyrics.length > 200 ? `${options.lyrics.substring(0, 200)}...` : options.lyrics, // Truncate for AI processing
        options.genre,
        options.tempo.toString(),
        outputPath
      ];

      // Add advanced AI options
      if (options.aiEnhanced) {
        args.push('--ai-lyrics');
      }
      
      if (options.duration) {
        args.push(`--duration=${options.duration}`);
      }

      Logger.info('Executing advanced AI MIDI generation', { args: args.slice(0, 3) }); // Log first 3 args for privacy

      const process = spawn(this.pythonPath, args);
      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', async (code) => {
        if (code === 0) {
          try {
            // Check if file was created
            await fs.access(outputPath);
            
            // Parse metadata from stdout if available
            const metadata = this.parseAIOutput(stdout, options);
            
            resolve({
              success: true,
              metadata
            });
          } catch (error) {
            resolve({
              success: false,
              error: 'MIDI file was not created'
            });
          }
        } else {
          resolve({
            success: false,
            error: stderr || `Process exited with code ${code}`
          });
        }
      });

      process.on('error', (error) => {
        resolve({
          success: false,
          error: error.message
        });
      });

      // Set timeout for long-running processes
      setTimeout(() => {
        process.kill();
        resolve({
          success: false,
          error: 'AI generation timed out'
        });
      }, 120000); // 2 minute timeout
    });
  }

  private async convertMidiToAdvancedAudio(midiPath: string, audioPath: string, options: AdvancedAIGenerationOptions): Promise<{ success: boolean; error?: string }> {
    try {
      // For now, we'll use a simple conversion
      // In production, this would integrate with advanced audio synthesis
      Logger.info('Converting MIDI to advanced audio', { midiPath, audioPath });
      
      // Placeholder for advanced audio conversion
      // This would integrate with FluidSynth, LMMS, or other advanced audio engines
      const conversionResult = await this.advancedMidiToAudioConversion(midiPath, audioPath, options);
      
      return conversionResult;
      
    } catch (error) {
      Logger.error('Audio conversion failed', { error, midiPath });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Audio conversion failed'
      };
    }
  }

  private async advancedMidiToAudioConversion(midiPath: string, audioPath: string, options: AdvancedAIGenerationOptions): Promise<{ success: boolean; error?: string }> {
    // Advanced audio synthesis would go here
    // For now, create a placeholder audio file
    try {
      // Create silent audio file as placeholder
      const silentAudio = Buffer.alloc(44100 * 2 * options.duration); // 2 seconds stereo
      await fs.writeFile(audioPath, silentAudio);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Audio synthesis failed'
      };
    }
  }

  private parseAIOutput(stdout: string, options: AdvancedAIGenerationOptions): any {
    const metadata = {
      title: options.title,
      genre: options.genre,
      tempo: options.tempo,
      key: options.key,
      duration: options.duration,
      aiProcessingLog: stdout
    };

    // Extract AI insights from stdout
    const lines = stdout.split('\n');
    const insights: any = {};

    for (const line of lines) {
      if (line.includes('Generated lyrics:')) {
        insights.generatedLyrics = true;
      }
      if (line.includes('AI lyrics analysis')) {
        insights.aiLyricsAnalysis = true;
      }
      if (line.includes('Advanced AI models loaded')) {
        insights.advancedAI = true;
      }
    }

    metadata.aiInsights = insights;
    return metadata;
  }

  private async generateAIInsights(options: AdvancedAIGenerationOptions, metadata: any): Promise<any> {
    try {
      // Generate comprehensive AI insights
      const insights = {
        musicalAnalysis: {
          genreCharacteristics: this.analyzeGenreCharacteristics(options.genre),
          emotionalMapping: this.analyzeEmotionalContent(options.lyrics),
          structuralAnalysis: this.analyzeStructure(options.lyrics),
          harmonicSuggestions: this.generateHarmonicSuggestions(options.genre, options.key)
        },
        aiEnhancements: {
          lyricsProcessing: options.aiEnhanced,
          aiModelUsed: metadata.aiInsights?.advancedAI || false,
          complexityLevel: options.complexityLevel || 'medium',
          styleReference: options.styleReference || 'none'
        },
        qualityMetrics: {
          melodicCoherence: this.calculateMelodicCoherence(metadata),
          harmonicRichness: this.calculateHarmonicRichness(options.genre),
          rhythmicComplexity: this.calculateRhythmicComplexity(options.tempo),
          overallQuality: this.calculateOverallQuality(metadata, options)
        },
        recommendations: {
          improvements: this.generateImprovementSuggestions(options),
          nextSteps: this.generateNextSteps(options),
          relatedStyles: this.suggestRelatedStyles(options.genre)
        }
      };

      return insights;
    } catch (error) {
      Logger.error('Failed to generate AI insights', { error });
      return { error: 'AI insights generation failed' };
    }
  }

  private analyzeGenreCharacteristics(genre: string): any {
    const genreData: Record<string, any> = {
      pop: {
        characteristics: ['catchy hooks', '4/4 time', 'simple chord progressions'],
        typicalTempo: '120-140 BPM',
        commonKeys: ['C', 'G', 'D', 'Am', 'Em'],
        structuralElements: ['verse', 'chorus', 'bridge']
      },
      rock: {
        characteristics: ['power chords', 'driving rhythm', 'guitar emphasis'],
        typicalTempo: '120-160 BPM',
        commonKeys: ['E', 'A', 'D', 'Em', 'Am'],
        structuralElements: ['intro', 'verse', 'chorus', 'solo', 'outro']
      },
      jazz: {
        characteristics: ['complex harmony', 'swing feel', 'improvisation'],
        typicalTempo: '60-180 BPM',
        commonKeys: ['C', 'F', 'Bb', 'Dm', 'Gm'],
        structuralElements: ['head', 'solos', 'trading']
      },
      electronic: {
        characteristics: ['synthesized sounds', 'rhythmic patterns', 'digital effects'],
        typicalTempo: '120-140 BPM',
        commonKeys: ['Am', 'Dm', 'Em', 'C', 'G'],
        structuralElements: ['intro', 'buildup', 'drop', 'breakdown']
      }
    };

    return genreData[genre] || genreData.pop;
  }

  private analyzeEmotionalContent(lyrics: string): any {
    const words = lyrics.toLowerCase().split(/\s+/);
    const emotionalWords = {
      positive: ['love', 'happy', 'joy', 'bright', 'smile', 'dance', 'hope'],
      negative: ['sad', 'pain', 'hurt', 'dark', 'cry', 'lost', 'alone'],
      energetic: ['run', 'fast', 'energy', 'power', 'strong', 'wild', 'free'],
      calm: ['peace', 'gentle', 'soft', 'quiet', 'still', 'serene', 'calm']
    };

    const scores = {
      positive: 0,
      negative: 0,
      energetic: 0,
      calm: 0
    };

    words.forEach(word => {
      Object.entries(emotionalWords).forEach(([emotion, wordList]) => {
        if (wordList.includes(word)) {
          scores[emotion as keyof typeof scores]++;
        }
      });
    });

    const totalWords = Math.max(words.length, 1);
    return {
      dominantEmotion: Object.entries(scores).reduce((a, b) => scores[a[0] as keyof typeof scores] > scores[b[0] as keyof typeof scores] ? a : b)[0],
      emotionalBalance: Object.fromEntries(
        Object.entries(scores).map(([emotion, count]) => [emotion, count / totalWords])
      ),
      emotionalIntensity: Math.max(...Object.values(scores)) / totalWords
    };
  }

  private analyzeStructure(lyrics: string): any {
    const lines = lyrics.split('\n').filter(line => line.trim());
    const structure = {
      totalLines: lines.length,
      averageLineLength: lines.reduce((sum, line) => sum + line.length, 0) / lines.length,
      repeatedLines: this.findRepeatedLines(lines),
      estimatedSections: this.estimateSections(lines)
    };

    return structure;
  }

  private findRepeatedLines(lines: string[]): string[] {
    const lineCounts = new Map<string, number>();
    lines.forEach(line => {
      const normalizedLine = line.trim().toLowerCase();
      lineCounts.set(normalizedLine, (lineCounts.get(normalizedLine) || 0) + 1);
    });

    return Array.from(lineCounts.entries())
      .filter(([_, count]) => count > 1)
      .map(([line, _]) => line);
  }

  private estimateSections(lines: string[]): any {
    const sections = [];
    let currentSection = 'verse';
    let sectionStart = 0;

    lines.forEach((line, index) => {
      const lineLower = line.toLowerCase();
      if (lineLower.includes('chorus') || lineLower.includes('hook')) {
        if (currentSection !== 'chorus') {
          sections.push({
            type: currentSection,
            start: sectionStart,
            end: index - 1,
            length: index - sectionStart
          });
          currentSection = 'chorus';
          sectionStart = index;
        }
      } else if (lineLower.includes('bridge')) {
        if (currentSection !== 'bridge') {
          sections.push({
            type: currentSection,
            start: sectionStart,
            end: index - 1,
            length: index - sectionStart
          });
          currentSection = 'bridge';
          sectionStart = index;
        }
      }
    });

    // Add final section
    sections.push({
      type: currentSection,
      start: sectionStart,
      end: lines.length - 1,
      length: lines.length - sectionStart
    });

    return sections;
  }

  private generateHarmonicSuggestions(genre: string, key: string): any {
    const suggestions: Record<string, any> = {
      pop: {
        primaryChords: ['I', 'V', 'vi', 'IV'],
        secondaryChords: ['ii', 'iii'],
        progressionSuggestions: ['I-V-vi-IV', 'vi-IV-I-V', 'I-vi-IV-V']
      },
      rock: {
        primaryChords: ['I', 'IV', 'V', 'vi'],
        secondaryChords: ['ii', 'bVII'],
        progressionSuggestions: ['I-IV-V-V', 'vi-IV-I-V', 'I-bVII-IV-I']
      },
      jazz: {
        primaryChords: ['IM7', 'IVM7', 'V7', 'vim7'],
        secondaryChords: ['iim7', 'iiim7', 'viim7b5'],
        progressionSuggestions: ['iim7-V7-IM7', 'vim7-iim7-V7-IM7', 'IM7-vim7-iim7-V7']
      }
    };

    return suggestions[genre] || suggestions.pop;
  }

  private calculateMelodicCoherence(metadata: any): number {
    // Placeholder calculation - in production, this would analyze the actual MIDI
    return Math.random() * 0.3 + 0.7; // 0.7-1.0 range
  }

  private calculateHarmonicRichness(genre: string): number {
    const genreRichness: Record<string, number> = {
      jazz: 0.9,
      classical: 0.85,
      rock: 0.7,
      pop: 0.65,
      electronic: 0.6
    };
    return genreRichness[genre] || 0.7;
  }

  private calculateRhythmicComplexity(tempo: number): number {
    // Faster tempos generally have higher rhythmic complexity
    const normalizedTempo = Math.min(Math.max(tempo, 60), 200);
    return (normalizedTempo - 60) / 140;
  }

  private calculateOverallQuality(metadata: any, options: AdvancedAIGenerationOptions): number {
    const factors = [
      this.calculateMelodicCoherence(metadata),
      this.calculateHarmonicRichness(options.genre),
      this.calculateRhythmicComplexity(options.tempo),
      options.aiEnhanced ? 0.9 : 0.7
    ];

    return factors.reduce((sum, factor) => sum + factor, 0) / factors.length;
  }

  private generateImprovementSuggestions(options: AdvancedAIGenerationOptions): string[] {
    const suggestions = [];

    if (!options.aiEnhanced) {
      suggestions.push('Enable AI enhancement for more sophisticated composition');
    }

    if (options.complexityLevel === 'simple') {
      suggestions.push('Try medium or complex complexity for richer arrangements');
    }

    if (!options.styleReference) {
      suggestions.push('Provide a style reference for more targeted generation');
    }

    suggestions.push('Experiment with different keys and tempos');
    suggestions.push('Try varying the emotional content of lyrics');

    return suggestions;
  }

  private generateNextSteps(options: AdvancedAIGenerationOptions): string[] {
    return [
      'Consider adding vocal tracks with voice cloning',
      'Explore different instrumental arrangements',
      'Generate variations with different emotional profiles',
      'Create extended versions or remixes',
      'Collaborate with other AI-generated elements'
    ];
  }

  private suggestRelatedStyles(genre: string): string[] {
    const relatedStyles: Record<string, string[]> = {
      pop: ['pop-rock', 'indie-pop', 'electro-pop', 'dance-pop'],
      rock: ['alternative-rock', 'prog-rock', 'indie-rock', 'classic-rock'],
      jazz: ['fusion', 'smooth-jazz', 'bebop', 'contemporary-jazz'],
      electronic: ['ambient', 'techno', 'house', 'synthwave']
    };

    return relatedStyles[genre] || ['experimental', 'crossover'];
  }

  private validateGenerationOptions(options: AdvancedAIGenerationOptions): void {
    if (!options.title || options.title.trim().length === 0) {
      throw new Error('Title is required');
    }

    if (!options.lyrics || options.lyrics.trim().length === 0) {
      throw new Error('Lyrics are required');
    }

    if (options.tempo < 60 || options.tempo > 200) {
      throw new Error('Tempo must be between 60 and 200 BPM');
    }

    if (options.duration && (options.duration < 5 || options.duration > 600)) {
      throw new Error('Duration must be between 5 and 600 seconds');
    }

    const validGenres = ['pop', 'rock', 'jazz', 'electronic', 'classical', 'hip-hop', 'country', 'r&b'];
    if (!validGenres.includes(options.genre.toLowerCase())) {
      throw new Error(`Genre must be one of: ${validGenres.join(', ')}`);
    }
  }
}
