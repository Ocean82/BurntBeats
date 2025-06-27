import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

interface MusicGenerationRequest {
  title: string;
  lyrics: string;
  genre: string;
  tempo: number;
  key?: string;
  duration: number;
  mood?: string;
  vocalStyle?: string;
  userId?: string;
}

export class NodeMusicGenerator {
  private static readonly SAMPLE_RATE = 44100;
  private static readonly CHANNELS = 2;

  static async generateSong(request: MusicGenerationRequest): Promise<any> {
    console.log('🎵 Starting Node.js music generation...', {
      title: request.title,
      genre: request.genre,
      duration: request.duration
    });

    try {
      // Create unique filename
      const timestamp = Date.now();
      const hash = crypto.createHash('md5').update(request.title + request.lyrics).digest('hex').substring(0, 8);
      const filename = `song_${timestamp}_${hash}.wav`;
      const outputPath = path.join('uploads', 'generated', filename);
      
      // Ensure output directory exists
      await fs.mkdir(path.dirname(outputPath), { recursive: true });

      // Generate musical composition
      const audioData = await this.createMusicalComposition(request);
      
      // Write WAV file
      await this.writeWavFile(outputPath, audioData);

      // Return song data
      return {
        id: timestamp,
        title: request.title,
        lyrics: request.lyrics,
        genre: request.genre,
        tempo: request.tempo,
        key: request.key || 'C',
        duration: request.duration,
        generatedAudioPath: `/uploads/generated/${filename}`,
        audioUrl: `/uploads/generated/${filename}`,
        previewUrl: `/uploads/generated/${filename}`,
        downloadUrl: `/uploads/generated/${filename}`,
        status: 'completed',
        generationProgress: 100,
        userId: request.userId || 'guest',
        createdAt: new Date(),
        updatedAt: new Date(),
        sections: this.analyzeLyricsSections(request.lyrics),
        settings: {
          mood: request.mood,
          vocalStyle: request.vocalStyle
        }
      };

    } catch (error) {
      console.error('Node music generation failed:', error);
      throw new Error(`Music generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async createMusicalComposition(request: MusicGenerationRequest): Promise<Float32Array> {
    const { duration, tempo, genre, lyrics } = request;
    const totalSamples = Math.floor(this.SAMPLE_RATE * duration);
    const audioData = new Float32Array(totalSamples * this.CHANNELS);

    // Musical parameters based on genre
    const genreConfig = this.getGenreConfiguration(genre);
    const baseFreq = this.getKeyFrequency(request.key || 'C');
    
    // Create chord progression
    const chordProgression = this.generateChordProgression(genre, baseFreq);
    
    // Analyze lyrics for phrasing
    const lyricPhrases = this.analyzeLyricsForMelody(lyrics);
    
    // Generate layers
    const melody = this.generateMelodyLayer(totalSamples, tempo, baseFreq, lyricPhrases, genreConfig);
    const harmony = this.generateHarmonyLayer(totalSamples, tempo, chordProgression, genreConfig);
    const bass = this.generateBassLayer(totalSamples, tempo, baseFreq, genreConfig);
    const drums = this.generateDrumLayer(totalSamples, tempo, genreConfig);

    // Mix all layers with stereo panning
    for (let i = 0; i < totalSamples; i++) {
      const leftIdx = i * 2;
      const rightIdx = i * 2 + 1;
      
      // Mix with different stereo positioning
      const melodyAmp = 0.4;
      const harmonyAmp = 0.3;
      const bassAmp = 0.5;
      const drumAmp = 0.3;
      
      audioData[leftIdx] = (
        melody[i] * melodyAmp * 0.8 +  // Melody slightly left
        harmony[i] * harmonyAmp * 1.2 + // Harmony wider
        bass[i] * bassAmp +             // Bass center
        drums[i] * drumAmp * 0.9        // Drums slightly left
      ) * 0.7;
      
      audioData[rightIdx] = (
        melody[i] * melodyAmp * 1.2 +   // Melody slightly right
        harmony[i] * harmonyAmp * 0.8 + // Harmony wider
        bass[i] * bassAmp +             // Bass center
        drums[i] * drumAmp * 1.1        // Drums slightly right
      ) * 0.7;
    }

    return audioData;
  }

  private static getGenreConfiguration(genre: string) {
    const configs: Record<string, { swing: number; harmonicComplexity: number; rhythmVariation: number }> = {
      pop: { swing: 0.0, harmonicComplexity: 0.3, rhythmVariation: 0.4 },
      rock: { swing: 0.1, harmonicComplexity: 0.4, rhythmVariation: 0.6 },
      jazz: { swing: 0.3, harmonicComplexity: 0.8, rhythmVariation: 0.7 },
      electronic: { swing: 0.0, harmonicComplexity: 0.5, rhythmVariation: 0.8 },
      classical: { swing: 0.0, harmonicComplexity: 0.9, rhythmVariation: 0.3 },
      'hip-hop': { swing: 0.2, harmonicComplexity: 0.2, rhythmVariation: 0.9 },
      country: { swing: 0.1, harmonicComplexity: 0.3, rhythmVariation: 0.4 },
      rnb: { swing: 0.2, harmonicComplexity: 0.6, rhythmVariation: 0.7 }
    };
    return configs[genre.toLowerCase()] || configs.pop;
  }

  private static getKeyFrequency(key: string): number {
    const frequencies: Record<string, number> = {
      'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13,
      'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
      'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
    };
    return frequencies[key] || frequencies['C'];
  }

  private static generateChordProgression(genre: string, baseFreq: number): number[][] {
    const progressions: Record<string, number[]> = {
      pop: [1, 5, 6, 4],      // I-V-vi-IV
      rock: [1, 4, 5, 1],     // I-IV-V-I
      jazz: [1, 6, 2, 5],     // I-vi-ii-V
      electronic: [1, 7, 4, 1], // I-VII-IV-I
      classical: [1, 4, 5, 1],   // I-IV-V-I
      'hip-hop': [1, 1, 1, 1],   // Minimal harmony
      country: [1, 4, 1, 5],     // I-IV-I-V
      rnb: [1, 6, 4, 5]          // I-vi-IV-V
    };
    
    const progression = progressions[genre.toLowerCase()] || progressions.pop;
    return progression.map((degree: number) => this.getChordFrequencies(baseFreq, degree));
  }

  private static getChordFrequencies(baseFreq: number, degree: number): number[] {
    const intervals = [0, 4, 7]; // Major triad intervals in semitones
    const rootFreq = baseFreq * Math.pow(2, (degree - 1) * 2 / 12);
    return intervals.map(interval => rootFreq * Math.pow(2, interval / 12));
  }

  private static generateMelodyLayer(samples: number, tempo: number, baseFreq: number, phrases: any[], config: any): Float32Array {
    const melody = new Float32Array(samples);
    const notesPerBeat = 2;
    const beatsPerSecond = tempo / 60;
    const samplesPerNote = this.SAMPLE_RATE / (beatsPerSecond * notesPerBeat);
    
    for (let i = 0; i < samples; i++) {
      const time = i / this.SAMPLE_RATE;
      const noteIndex = Math.floor(i / samplesPerNote) % 8;
      const scale = [0, 2, 4, 5, 7, 9, 11, 12]; // Major scale
      const noteFreq = baseFreq * Math.pow(2, scale[noteIndex] / 12);
      
      const envelope = this.createEnvelope(i % samplesPerNote, samplesPerNote);
      const vibrato = 1 + 0.02 * Math.sin(2 * Math.PI * 5 * time);
      
      melody[i] = 0.3 * envelope * Math.sin(2 * Math.PI * noteFreq * vibrato * time);
    }
    
    return melody;
  }

  private static generateHarmonyLayer(samples: number, tempo: number, chords: number[][], config: any): Float32Array {
    const harmony = new Float32Array(samples);
    const beatsPerSecond = tempo / 60;
    const samplesPerChord = this.SAMPLE_RATE * 2 / beatsPerSecond; // 2 beats per chord
    
    for (let i = 0; i < samples; i++) {
      const time = i / this.SAMPLE_RATE;
      const chordIndex = Math.floor(i / samplesPerChord) % chords.length;
      const chord = chords[chordIndex];
      
      const envelope = this.createEnvelope(i % samplesPerChord, samplesPerChord);
      let chordSum = 0;
      
      for (const freq of chord) {
        chordSum += 0.1 * Math.sin(2 * Math.PI * freq * time);
      }
      
      harmony[i] = envelope * chordSum;
    }
    
    return harmony;
  }

  private static generateBassLayer(samples: number, tempo: number, baseFreq: number, config: any): Float32Array {
    const bass = new Float32Array(samples);
    const bassFreq = baseFreq / 2; // One octave down
    const beatsPerSecond = tempo / 60;
    const samplesPerBeat = this.SAMPLE_RATE / beatsPerSecond;
    
    for (let i = 0; i < samples; i++) {
      const time = i / this.SAMPLE_RATE;
      const beatPhase = (i % samplesPerBeat) / samplesPerBeat;
      
      if (beatPhase < 0.1) { // Attack on beat
        const envelope = this.createEnvelope(i % samplesPerBeat, samplesPerBeat * 0.5);
        bass[i] = 0.4 * envelope * Math.sin(2 * Math.PI * bassFreq * time);
      }
    }
    
    return bass;
  }

  private static generateDrumLayer(samples: number, tempo: number, config: any): Float32Array {
    const drums = new Float32Array(samples);
    const beatsPerSecond = tempo / 60;
    const samplesPerBeat = this.SAMPLE_RATE / beatsPerSecond;
    
    for (let i = 0; i < samples; i++) {
      const beatPhase = (i % samplesPerBeat) / samplesPerBeat;
      
      if (beatPhase < 0.05) { // Kick drum on beat
        const envelope = Math.exp(-10 * beatPhase);
        drums[i] = 0.3 * envelope * (Math.random() - 0.5);
      } else if (beatPhase > 0.45 && beatPhase < 0.55) { // Snare on off-beat
        const envelope = Math.exp(-15 * (beatPhase - 0.5));
        drums[i] = 0.2 * envelope * (Math.random() - 0.5);
      }
    }
    
    return drums;
  }

  private static createEnvelope(sample: number, totalSamples: number): number {
    const phase = sample / totalSamples;
    if (phase < 0.1) return phase / 0.1; // Attack
    if (phase < 0.3) return 1 - 0.3 * (phase - 0.1) / 0.2; // Decay
    if (phase < 0.8) return 0.7; // Sustain
    return 0.7 * (1 - (phase - 0.8) / 0.2); // Release
  }

  private static analyzeLyricsSections(lyrics: string): any[] {
    const lines = lyrics.split('\n').filter(line => line.trim());
    return lines.map((line, index) => ({
      id: index,
      type: index % 4 < 2 ? 'verse' : 'chorus',
      content: line,
      startTime: index * 4,
      duration: 4
    }));
  }

  private static analyzeLyricsForMelody(lyrics: string): any[] {
    return lyrics.split('\n').filter(line => line.trim()).map(line => ({
      text: line,
      syllables: line.split(' ').length,
      emotionalWeight: this.analyzeEmotionalContent(line)
    }));
  }

  private static analyzeEmotionalContent(line: string): number {
    const positive = ['love', 'happy', 'joy', 'amazing', 'wonderful', 'great'];
    const negative = ['sad', 'cry', 'pain', 'hurt', 'lonely', 'broken'];
    
    const words = line.toLowerCase().split(/\s+/);
    let score = 0;
    
    words.forEach(word => {
      if (positive.some(p => word.includes(p))) score += 1;
      if (negative.some(n => word.includes(n))) score -= 1;
    });
    
    return Math.max(-1, Math.min(1, score / words.length));
  }

  private static async writeWavFile(filepath: string, audioData: Float32Array): Promise<void> {
    const channels = this.CHANNELS;
    const sampleRate = this.SAMPLE_RATE;
    const bitsPerSample = 16;
    const samples = audioData.length / channels;
    
    // Convert float to 16-bit PCM
    const pcmData = new Int16Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      pcmData[i] = Math.max(-32768, Math.min(32767, audioData[i] * 32767));
    }
    
    // WAV header
    const header = new ArrayBuffer(44);
    const view = new DataView(header);
    
    // RIFF header
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + pcmData.length * 2, true); // File size
    view.setUint32(8, 0x57415645, false); // "WAVE"
    
    // Format chunk
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true); // Chunk size
    view.setUint16(20, 1, true); // Audio format (PCM)
    view.setUint16(22, channels, true); // Channels
    view.setUint32(24, sampleRate, true); // Sample rate
    view.setUint32(28, sampleRate * channels * bitsPerSample / 8, true); // Byte rate
    view.setUint16(32, channels * bitsPerSample / 8, true); // Block align
    view.setUint16(34, bitsPerSample, true); // Bits per sample
    
    // Data chunk
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, pcmData.length * 2, true); // Data size
    
    // Combine header and audio data
    const wavBuffer = new Uint8Array(header.byteLength + pcmData.byteLength);
    wavBuffer.set(new Uint8Array(header), 0);
    wavBuffer.set(new Uint8Array(pcmData.buffer), header.byteLength);
    
    await fs.writeFile(filepath, wavBuffer);
    console.log(`✅ WAV file written: ${filepath} (${wavBuffer.length} bytes)`);
  }
}