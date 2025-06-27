import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { MelodyGenerator } from './melody-generator';
import { VocalGenerator } from './vocal-generator';

const execAsync = promisify(exec);

export class MusicGenerator {
  static async generateSong(songData: any): Promise<any> {
    console.log('🎵 Starting song generation...', {
      title: songData.title,
      genre: songData.genre,
      mood: songData.mood
    });

    try {
      // Validate input
      if (!songData.lyrics || !songData.title) {
        throw new Error('Lyrics and title are required');
      }

      // Generate song using Node.js Music Generator
      console.log('Generating song with Node.js engine...');
      const { NodeMusicGenerator } = await import('./services/node-music-generator');
      const finalSong = await NodeMusicGenerator.generateSong({
        title: songData.title,
        lyrics: songData.lyrics,
        genre: songData.genre || 'pop',
        tempo: parseInt(songData.tempo?.toString() || '120'),
        key: songData.key,
        duration: songData.duration || 30,
        mood: songData.mood,
        vocalStyle: songData.vocalStyle,
        userId: songData.userId
      });

      console.log('✅ Song generation completed:', finalSong.title);
      return finalSong;

    } catch (error) {
      console.error('Song generation failed:', error);
      throw new Error(`Song generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static extractPhonemesFromLyrics(lyrics: string): string[] {
    // Simple phoneme extraction - replace with proper implementation later
    return lyrics.toLowerCase().split(/\s+/).flatMap(word => 
      word.split('').filter(char => /[aeiou]/.test(char))
    );
  }

  private static createVocalTiming(melody: any): any[] {
    // Create basic vocal timing from melody
    let currentTime = 0;
    const timing: any[] = [];

    melody.phrases?.forEach((phrase: any) => {
      phrase.notes?.forEach((note: any) => {
        timing.push({
          startTime: currentTime,
          duration: note.duration,
          pitch: note.pitch,
          syllable: note.syllable
        });
        currentTime += note.duration;
      });
    });

    return timing;
  }

  private static createSongSections(lyrics: string): any {
    const lines = lyrics.split('\n').filter(line => line.trim());
    const sections: any = {};

    // Simple section detection
    let currentSection = 'verse';
    let sectionIndex = 1;

    lines.forEach((line, index) => {
      const lineLower = line.toLowerCase();
      if (lineLower.includes('chorus') || lineLower.includes('hook')) {
        currentSection = 'chorus';
      } else if (lineLower.includes('bridge')) {
        currentSection = 'bridge';
      } else if (lineLower.includes('verse')) {
        currentSection = 'verse';
        sectionIndex++;
      }

      const sectionKey = `${currentSection}_${sectionIndex}`;
      if (!sections[sectionKey]) {
        sections[sectionKey] = [];
      }
      sections[sectionKey].push(line);
    });

    return sections;
  }

  private static async generateAudioFile(songData: any, melody: any, vocals: any): Promise<string> {
    // If melody already has an audio path from the melody generator, use it
    if (melody.audioPath) {
      console.log('🎵 Using audio file from melody generator:', melody.audioPath);
      return melody.audioPath;
    }

    // Check if we can use the new Python-compatible format
    if (melody.pythonFormat) {
      console.log('🎼 Generating audio from Python composition data...');
      return await this.generateFromPythonData(songData, melody, vocals);
    }

    // Fallback to direct audio generation
    console.log('🎧 Generating audio using fallback method...');
    return await this.generateBasicAudio(songData);
  }

  private static async generateFromPythonData(songData: any, melody: any, vocals: any): Promise<string> {
    const outputFileName = `song_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3`;
    const outputPath = path.join(process.cwd(), 'uploads', outputFileName);

    try {
      const pythonScript = path.join(process.cwd(), 'server', 'music-generator.py');

      const command = `python3 "${pythonScript}" ` +
        `--title "${songData.title}" ` +
        `--lyrics "${songData.lyrics.replace(/"/g, '\\"')}" ` +
        `--genre "${songData.genre}" ` +
        `--tempo ${songData.tempo} ` +
        `--duration ${songData.songLength} ` +
        `--output "${outputPath}"`;

      console.log('🐍 Executing Python music generation...');
      const { stdout, stderr } = await execAsync(command, { timeout: 30000 });

      if (stderr && !stderr.includes('warning')) {
        console.warn('Python stderr:', stderr);
      }

      console.log('✅ Python generation completed');
      return outputPath;

    } catch (error) {
      console.error('Python generation failed:', error);
      throw new Error(`Music generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async generateBasicAudio(songData: any): Promise<string> {
    // Basic audio generation as fallback
    const outputFileName = `song_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3`;
    const outputPath = path.join(process.cwd(), 'uploads', outputFileName);

    // Create a simple audio file
    const audioBuffer = Buffer.alloc(1024 * 1024, 0); // 1MB of silence
    await fs.writeFile(outputPath, audioBuffer);

    return outputPath;
  }

  private static generateSongSections(songData: any): any[] {
    const defaultSections = [
      { type: 'intro', duration: 8, lyrics: '' },
      { type: 'verse', duration: 16, lyrics: songData.lyrics.substring(0, 100) },
      { type: 'chorus', duration: 12, lyrics: 'Chorus section' },
      { type: 'verse', duration: 16, lyrics: songData.lyrics.substring(100, 200) },
      { type: 'chorus', duration: 12, lyrics: 'Chorus section' },
      { type: 'outro', duration: 8, lyrics: '' }
    ];

    return songData.sections || defaultSections;
  }
}