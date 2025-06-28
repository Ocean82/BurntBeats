
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { MelodyGenerator } from '../melody-generator';
import { VocalGenerator } from '../vocal-generator';

const execAsync = promisify(exec);

export interface MelodyPreviewConfig {
  melodyId: string;
  genre: string;
  mood: string;
  tempo: number;
  key: string;
  sampleLyrics: string;
  duration: number; // 5-8 seconds
}

export interface MelodyPreview {
  id: string;
  audioPath: string;
  audioUrl: string;
  lyrics: string;
  genre: string;
  mood: string;
  tempo: number;
  key: string;
  duration: number;
  metadata: {
    generatedAt: string;
    noteCount: number;
    vocalStyle: string;
    quality: string;
  };
}

export class MelodyPreviewService {
  private static readonly PREVIEW_DURATION = 7; // 7 seconds for optimal preview
  private static readonly SAMPLE_LYRICS_BY_GENRE: Record<string, string[]> = {
    pop: [
      "Dancing through the night, feeling so alive",
      "Your love lifts me higher than the stars",
      "We're young and free, nothing's gonna stop us"
    ],
    rock: [
      "Breaking down the walls with electric fire",
      "Rock and roll will never die tonight",
      "Screaming out loud, we're taking control"
    ],
    jazz: [
      "Midnight blues and saxophone dreams",
      "Smooth like velvet, cool as rain",
      "Jazz hands swaying to the rhythm"
    ],
    electronic: [
      "Pulse of the city, neon lights glow",
      "Digital hearts beat in perfect time",
      "Synth waves flowing through the night"
    ],
    classical: [
      "Graceful notes dance through the air",
      "Symphony of dreams and peaceful thoughts",
      "Elegance flows in perfect harmony"
    ],
    hiphop: [
      "Beats drop heavy, rhythm in my soul",
      "Spitting fire with every single word",
      "Hip hop culture, this is how we roll"
    ],
    country: [
      "Down the dusty road with my guitar",
      "Country heart and small town dreams",
      "Sweet home melodies under starlit skies"
    ],
    rnb: [
      "Smooth vocals floating on silk",
      "Your love's got me feeling so right",
      "R&B groove that touches the soul"
    ]
  };

  static async generateMelodyPreview(config: MelodyPreviewConfig): Promise<MelodyPreview> {
    try {
      console.log(`🎵 Generating melody preview for ${config.genre} style...`);

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads', 'previews');
      await fs.mkdir(uploadsDir, { recursive: true });

      // Get sample lyrics for the genre
      const sampleLyrics = config.sampleLyrics || this.getSampleLyricsForGenre(config.genre);

      // Generate melody for preview
      const melodyGenerator = MelodyGenerator.getInstance();
      const melody = await melodyGenerator.generateMelodyFromLyrics({
        lyrics: sampleLyrics,
        genre: config.genre,
        mood: config.mood,
        tempo: config.tempo,
        key: config.key,
        duration: this.PREVIEW_DURATION
      });

      // Generate vocals for the melody
      const vocalGenerator = new VocalGenerator();
      const vocals = await vocalGenerator.generateVocals(
        sampleLyrics,
        null, // No voice sample for previews
        melody,
        {
          vocalStyle: this.getVocalStyleForGenre(config.genre),
          singingStyle: this.getSingingStyleForGenre(config.genre),
          genre: config.genre,
          mood: config.mood,
          quality: 'balanced', // Good quality but fast generation
          previewOnly: false
        }
      );

      // Generate unique filename
      const timestamp = Date.now();
      const previewId = `preview_${config.melodyId}_${timestamp}`;
      const audioFilename = `${previewId}.wav`;
      const audioPath = path.join(uploadsDir, audioFilename);

      // Mix melody and vocals together
      const finalAudioPath = await this.mixMelodyAndVocals(
        melody.audioPath,
        vocals.audioUrl,
        audioPath,
        config
      );

      // Create preview object
      const preview: MelodyPreview = {
        id: previewId,
        audioPath: finalAudioPath,
        audioUrl: `/uploads/previews/${audioFilename}`,
        lyrics: sampleLyrics,
        genre: config.genre,
        mood: config.mood,
        tempo: config.tempo,
        key: config.key,
        duration: this.PREVIEW_DURATION,
        metadata: {
          generatedAt: new Date().toISOString(),
          noteCount: melody.noteCount || 0,
          vocalStyle: this.getVocalStyleForGenre(config.genre),
          quality: 'preview'
        }
      };

      console.log(`✅ Melody preview generated: ${preview.audioUrl}`);
      return preview;

    } catch (error) {
      console.error('❌ Melody preview generation failed:', error);
      throw new Error(`Preview generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async generateMultiplePreviews(configs: MelodyPreviewConfig[]): Promise<MelodyPreview[]> {
    const previews: MelodyPreview[] = [];
    
    for (const config of configs) {
      try {
        const preview = await this.generateMelodyPreview(config);
        previews.push(preview);
      } catch (error) {
        console.error(`Failed to generate preview for ${config.melodyId}:`, error);
        // Continue with other previews even if one fails
      }
    }

    return previews;
  }

  private static getSampleLyricsForGenre(genre: string): string {
    const genreLower = genre.toLowerCase();
    const lyrics = this.SAMPLE_LYRICS_BY_GENRE[genreLower] || this.SAMPLE_LYRICS_BY_GENRE.pop;
    return lyrics[Math.floor(Math.random() * lyrics.length)];
  }

  private static getVocalStyleForGenre(genre: string): string {
    const styleMap: Record<string, string> = {
      pop: 'smooth',
      rock: 'powerful',
      jazz: 'smooth',
      electronic: 'smooth',
      classical: 'smooth',
      hiphop: 'powerful',
      country: 'warm',
      rnb: 'smooth'
    };
    return styleMap[genre.toLowerCase()] || 'smooth';
  }

  private static getSingingStyleForGenre(genre: string): string {
    const styleMap: Record<string, string> = {
      pop: 'melodic',
      rock: 'powerful',
      jazz: 'melodic',
      electronic: 'rhythmic',
      classical: 'melodic',
      hiphop: 'rhythmic',
      country: 'melodic',
      rnb: 'melodic'
    };
    return styleMap[genre.toLowerCase()] || 'melodic';
  }

  private static async mixMelodyAndVocals(
    melodyPath: string,
    vocalsPath: string,
    outputPath: string,
    config: MelodyPreviewConfig
  ): Promise<string> {
    try {
      // Check if ffmpeg is available for mixing
      await execAsync('which ffmpeg');

      // Convert relative paths to absolute paths
      const fullMelodyPath = melodyPath.startsWith('/') ? melodyPath : path.join(process.cwd(), melodyPath);
      const fullVocalsPath = vocalsPath.startsWith('/') ? vocalsPath : path.join(process.cwd(), vocalsPath.replace('/uploads/', 'uploads/'));

      // Mix the audio files using ffmpeg
      const mixCommand = [
        'ffmpeg',
        '-i', `"${fullMelodyPath}"`,
        '-i', `"${fullVocalsPath}"`,
        '-filter_complex',
        '[0:a]volume=0.7[melody];[1:a]volume=0.8[vocals];[melody][vocals]amix=inputs=2:duration=shortest[out]',
        '-map', '[out]',
        '-t', config.duration.toString(),
        '-ar', '44100',
        '-ac', '2',
        '-y',
        `"${outputPath}"`
      ].join(' ');

      await execAsync(mixCommand);
      return outputPath;

    } catch (error) {
      console.warn('FFmpeg mixing failed, using vocals only:', error);
      
      // Fallback: copy vocals file and trim to preview duration
      const vocalsFullPath = vocalsPath.startsWith('/') ? vocalsPath : path.join(process.cwd(), vocalsPath.replace('/uploads/', 'uploads/'));
      
      try {
        const vocalsBuffer = await fs.readFile(vocalsFullPath);
        await fs.writeFile(outputPath, vocalsBuffer);
        return outputPath;
      } catch (copyError) {
        console.error('Failed to copy vocals file:', copyError);
        
        // Last resort: create a basic audio file
        return await this.createBasicPreviewAudio(outputPath, config);
      }
    }
  }

  private static async createBasicPreviewAudio(outputPath: string, config: MelodyPreviewConfig): Promise<string> {
    // Create a basic audio file as fallback
    const sampleRate = 44100;
    const duration = config.duration;
    const numSamples = sampleRate * duration;
    
    // Create WAV header
    const headerSize = 44;
    const bufferSize = headerSize + (numSamples * 2);
    const buffer = Buffer.alloc(bufferSize);

    // Write WAV header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(bufferSize - 8, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(1, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * 2, 28);
    buffer.writeUInt16LE(2, 32);
    buffer.writeUInt16LE(16, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(numSamples * 2, 40);

    // Generate basic melody based on genre and key
    const baseFreq = this.getFrequencyFromKey(config.key);
    const genrePattern = this.getGenrePattern(config.genre);

    for (let i = 0; i < numSamples; i++) {
      const time = i / sampleRate;
      const noteIndex = Math.floor(time * 2); // 2 notes per second
      const freq = baseFreq * genrePattern[noteIndex % genrePattern.length];
      
      // Generate musical waveform with harmonics
      let sample = 0;
      sample += Math.sin(2 * Math.PI * freq * time) * 0.5;
      sample += Math.sin(2 * Math.PI * freq * 2 * time) * 0.2;
      sample += Math.sin(2 * Math.PI * freq * 3 * time) * 0.1;
      
      // Add envelope for more natural sound
      const envelope = Math.sin(Math.PI * time / duration);
      sample *= envelope;
      
      // Convert to 16-bit PCM
      const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
      buffer.writeInt16LE(intSample, headerSize + (i * 2));
    }

    await fs.writeFile(outputPath, buffer);
    return outputPath;
  }

  private static getFrequencyFromKey(key: string): number {
    const frequencies: Record<string, number> = {
      'C': 261.63, 'C#': 277.18, 'Db': 277.18,
      'D': 293.66, 'D#': 311.13, 'Eb': 311.13,
      'E': 329.63,
      'F': 349.23, 'F#': 369.99, 'Gb': 369.99,
      'G': 392.00, 'G#': 415.30, 'Ab': 415.30,
      'A': 440.00, 'A#': 466.16, 'Bb': 466.16,
      'B': 493.88
    };
    return frequencies[key] || 261.63;
  }

  private static getGenrePattern(genre: string): number[] {
    const patterns: Record<string, number[]> = {
      pop: [1.0, 1.25, 1.5, 1.25, 1.0, 1.125, 1.25, 1.0],
      rock: [1.0, 1.2, 1.5, 1.8, 1.5, 1.2, 1.0, 0.8],
      jazz: [1.0, 1.125, 1.25, 1.375, 1.5, 1.375, 1.25, 1.125],
      electronic: [1.0, 1.5, 2.0, 1.5, 1.0, 1.25, 1.5, 1.0],
      classical: [1.0, 1.125, 1.25, 1.375, 1.5, 1.625, 1.75, 1.875],
      hiphop: [1.0, 1.0, 1.25, 1.0, 1.0, 1.125, 1.25, 1.0],
      country: [1.0, 1.25, 1.5, 1.25, 1.0, 1.125, 1.25, 1.0],
      rnb: [1.0, 1.125, 1.25, 1.375, 1.25, 1.125, 1.0, 0.9]
    };
    return patterns[genre.toLowerCase()] || patterns.pop;
  }

  static async cleanupOldPreviews(maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const previewsDir = path.join(process.cwd(), 'uploads', 'previews');
      const files = await fs.readdir(previewsDir);
      const now = Date.now();

      for (const file of files) {
        const filePath = path.join(previewsDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          console.log(`🧹 Cleaned up old preview: ${file}`);
        }
      }
    } catch (error) {
      console.warn('Failed to cleanup old previews:', error);
    }
  }
}
