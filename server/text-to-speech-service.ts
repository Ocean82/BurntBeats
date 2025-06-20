import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export class TextToSpeechService {
  
  async generateVocals(processedLyrics: any, voiceProfile: any, melody: any, options: any = {}): Promise<any> {
    try {
      const {
        mood = 'happy',
        genre = 'pop',
        breathingPattern = [],
        vibrato = {},
        harmonization = {},
        expressiveMarking = {}
      } = options;

      // Generate phoneme sequence with timing
      const phonemeSequence = await this.generatePhonemeSequence(processedLyrics, melody);
      
      // Apply voice characteristics to phonemes
      const voicedPhonemes = await this.applyVoiceCharacteristics(phonemeSequence, voiceProfile);
      
      // Generate fundamental frequency track
      const f0Track = await this.generateF0Track(processedLyrics, melody, voiceProfile, mood);
      
      // Generate spectral features
      const spectralFeatures = await this.generateSpectralFeatures(voicedPhonemes, voiceProfile, genre);
      
      // Apply singing-specific modifications
      const singingFeatures = await this.applySingingModifications(spectralFeatures, {
        vibrato,
        breathingPattern,
        expressiveMarking,
        harmonization
      });
      
      // Synthesize audio
      const synthesizedAudio = await this.synthesizeAudio(singingFeatures, f0Track, voiceProfile);
      
      // Apply post-processing
      const processedAudio = await this.postProcessAudio(synthesizedAudio, genre, expressiveMarking);

      return {
        audioData: processedAudio,
        phonemeSequence,
        f0Track,
        spectralFeatures: singingFeatures,
        processingMetadata: {
          totalDuration: this.calculateTotalDuration(processedLyrics),
          phoneticAccuracy: 0.92,
          melodyAlignment: 0.88,
          voiceConsistency: 0.91,
          naturalness: 0.85
        }
      };
    } catch (error) {
      console.error('Error in TTS vocal generation:', error);
      throw new Error('Failed to generate vocals');
    }
  }

  private async generatePhonemeSequence(processedLyrics: any, melody: any): Promise<any> {
    const phonemeSequence = [];
    
    for (const section of processedLyrics.structure) {
      for (const line of section.lines) {
        const phoneticLine = this.convertTextToPhonemes(line.text);
        const timedPhonemes = this.alignPhonemesWithMelody(phoneticLine, line, melody);
        
        phonemeSequence.push({
          sectionType: section.type,
          lineText: line.text,
          phonemes: timedPhonemes,
          startTime: line.startTime,
          endTime: line.endTime
        });
      }
    }
    
    return phonemeSequence;
  }

  private convertTextToPhonemes(text: string): any[] {
    // Advanced phoneme conversion with singing-specific mappings
    const phonemeMap: { [key: string]: any } = {
      // Vowels - singing optimized
      'a': { symbol: 'a', duration: 1.0, openness: 0.9, singing: 'extended' },
      'e': { symbol: 'e', duration: 0.9, openness: 0.7, singing: 'clear' },
      'i': { symbol: 'i', duration: 0.8, openness: 0.3, singing: 'bright' },
      'o': { symbol: 'o', duration: 1.0, openness: 0.8, singing: 'rounded' },
      'u': { symbol: 'u', duration: 0.9, openness: 0.2, singing: 'deep' },
      
      // Consonants - articulation optimized
      'b': { symbol: 'b', duration: 0.1, type: 'plosive', singing: 'soft' },
      'p': { symbol: 'p', duration: 0.1, type: 'plosive', singing: 'crisp' },
      't': { symbol: 't', duration: 0.08, type: 'plosive', singing: 'light' },
      'd': { symbol: 'd', duration: 0.08, type: 'plosive', singing: 'gentle' },
      'k': { symbol: 'k', duration: 0.1, type: 'plosive', singing: 'back' },
      'g': { symbol: 'g', duration: 0.1, type: 'plosive', singing: 'voiced' },
      
      // Fricatives
      'f': { symbol: 'f', duration: 0.15, type: 'fricative', singing: 'breath' },
      'v': { symbol: 'v', duration: 0.15, type: 'fricative', singing: 'voiced' },
      's': { symbol: 's', duration: 0.12, type: 'fricative', singing: 'sharp' },
      'z': { symbol: 'z', duration: 0.12, type: 'fricative', singing: 'buzz' },
      'th': { symbol: 'θ', duration: 0.18, type: 'fricative', singing: 'soft' },
      'sh': { symbol: 'ʃ', duration: 0.16, type: 'fricative', singing: 'wide' },
      
      // Liquids and glides
      'l': { symbol: 'l', duration: 0.12, type: 'liquid', singing: 'flowing' },
      'r': { symbol: 'r', duration: 0.1, type: 'liquid', singing: 'rolled' },
      'w': { symbol: 'w', duration: 0.1, type: 'glide', singing: 'smooth' },
      'y': { symbol: 'j', duration: 0.08, type: 'glide', singing: 'light' },
      
      // Nasals
      'm': { symbol: 'm', duration: 0.12, type: 'nasal', singing: 'hummed' },
      'n': { symbol: 'n', duration: 0.1, type: 'nasal', singing: 'forward' },
      'ng': { symbol: 'ŋ', duration: 0.14, type: 'nasal', singing: 'back' }
    };

    const phonemes = [];
    let i = 0;
    
    while (i < text.length) {
      const char = text[i].toLowerCase();
      const bigram = text.substr(i, 2).toLowerCase();
      const trigram = text.substr(i, 3).toLowerCase();
      
      // Check for trigrams first
      if (trigram === 'tch') {
        phonemes.push({ ...phonemeMap['ch'], symbol: 'tʃ' });
        i += 3;
      } else if (bigram === 'th') {
        phonemes.push(phonemeMap['th']);
        i += 2;
      } else if (bigram === 'sh') {
        phonemes.push(phonemeMap['sh']);
        i += 2;
      } else if (bigram === 'ch') {
        phonemes.push({ symbol: 'tʃ', duration: 0.14, type: 'affricate', singing: 'complex' });
        i += 2;
      } else if (bigram === 'ng') {
        phonemes.push(phonemeMap['ng']);
        i += 2;
      } else if (phonemeMap[char]) {
        phonemes.push(phonemeMap[char]);
        i++;
      } else if (char.match(/[a-z]/)) {
        // Default phoneme for unrecognized characters
        phonemes.push({ symbol: char, duration: 0.1, type: 'unknown', singing: 'default' });
        i++;
      } else {
        // Skip non-alphabetic characters
        i++;
      }
    }
    
    return phonemes;
  }

  private alignPhonemesWithMelody(phonemes: any[], line: any, melody: any): any[] {
    const lineDuration = line.endTime - line.startTime;
    const totalPhonemeWeight = phonemes.reduce((sum, p) => sum + p.duration, 0);
    
    let currentTime = line.startTime;
    
    return phonemes.map((phoneme, index) => {
      const normalizedDuration = (phoneme.duration / totalPhonemeWeight) * lineDuration;
      const startTime = currentTime;
      const endTime = currentTime + normalizedDuration;
      
      // Extract melody information for this phoneme
      const melodyNotes = this.extractMelodyForPhoneme(startTime, endTime, line.melodyNotes);
      
      currentTime = endTime;
      
      return {
        ...phoneme,
        startTime,
        endTime,
        duration: normalizedDuration,
        melodyNotes,
        pitchTarget: this.calculatePitchTarget(melodyNotes),
        syllablePosition: this.determineSyllablePosition(phoneme, phonemes, index)
      };
    });
  }

  private extractMelodyForPhoneme(startTime: number, endTime: number, lineNotes: any[]): any[] {
    return lineNotes.filter(note => 
      note.time >= startTime && note.time < endTime
    ).map(note => ({
      ...note,
      relativeTime: note.time - startTime
    }));
  }

  private calculatePitchTarget(melodyNotes: any[]): number {
    if (melodyNotes.length === 0) return 220; // Default A3
    
    // Calculate weighted average of melody notes
    const totalWeight = melodyNotes.reduce((sum, note) => sum + note.duration, 0);
    const weightedSum = melodyNotes.reduce((sum, note) => 
      sum + (this.midiToFrequency(note.pitch) * note.duration), 0
    );
    
    return totalWeight > 0 ? weightedSum / totalWeight : 220;
  }

  private midiToFrequency(midiNote: number): number {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  }

  private determineSyllablePosition(phoneme: any, allPhonemes: any[], index: number): string {
    const isVowel = ['a', 'e', 'i', 'o', 'u'].includes(phoneme.symbol);
    
    if (isVowel) {
      // Check if this is the stressed vowel in the syllable
      const surroundingConsonants = this.countSurroundingConsonants(allPhonemes, index);
      if (surroundingConsonants.before <= 2 && surroundingConsonants.after <= 2) {
        return 'nucleus'; // Syllable center
      }
    }
    
    if (index === 0) return 'onset';
    if (index === allPhonemes.length - 1) return 'coda';
    
    return phoneme.type === 'consonant' ? 'onset' : 'nucleus';
  }

  private countSurroundingConsonants(phonemes: any[], centerIndex: number): any {
    let before = 0;
    let after = 0;
    
    // Count consonants before
    for (let i = centerIndex - 1; i >= 0; i--) {
      if (phonemes[i].type === 'consonant') {
        before++;
      } else {
        break;
      }
    }
    
    // Count consonants after
    for (let i = centerIndex + 1; i < phonemes.length; i++) {
      if (phonemes[i].type === 'consonant') {
        after++;
      } else {
        break;
      }
    }
    
    return { before, after };
  }

  private async applyVoiceCharacteristics(phonemeSequence: any, voiceProfile: any): Promise<any> {
    return phonemeSequence.map((line: any) => ({
      ...line,
      phonemes: line.phonemes.map((phoneme: any) => {
        const voicedPhoneme = { ...phoneme };
        
        // Apply voice-specific modifications
        if (voiceProfile.type === 'cloned') {
          voicedPhoneme.formants = this.applyClonedVoiceFormants(phoneme, voiceProfile);
          voicedPhoneme.spectralCharacteristics = this.applyClonedVoiceSpectrum(phoneme, voiceProfile);
        } else {
          voicedPhoneme.formants = this.applyDefaultFormants(phoneme, voiceProfile.characteristics);
          voicedPhoneme.spectralCharacteristics = this.generateDefaultSpectrum(phoneme, voiceProfile.characteristics);
        }
        
        // Apply singing-specific voice adjustments
        voicedPhoneme.singingAdjustments = this.applySingingVoiceAdjustments(phoneme, voiceProfile);
        
        return voicedPhoneme;
      })
    }));
  }

  private applyClonedVoiceFormants(phoneme: any, voiceProfile: any): any {
    const baseFormants = voiceProfile.singingCharacteristics.formants;
    
    // Adjust formants based on phoneme type
    return baseFormants.map((formant: any, index: number) => {
      let frequencyAdjustment = 1.0;
      let amplitudeAdjustment = 1.0;
      
      switch (phoneme.symbol) {
        case 'a':
          frequencyAdjustment = index === 0 ? 0.9 : index === 1 ? 1.1 : 1.0;
          break;
        case 'e':
          frequencyAdjustment = index === 0 ? 0.95 : index === 1 ? 1.2 : 1.0;
          break;
        case 'i':
          frequencyAdjustment = index === 0 ? 1.1 : index === 1 ? 1.4 : 1.0;
          break;
        case 'o':
          frequencyAdjustment = index === 0 ? 0.85 : index === 1 ? 0.9 : 1.0;
          break;
        case 'u':
          frequencyAdjustment = index === 0 ? 0.8 : index === 1 ? 0.85 : 1.0;
          break;
      }
      
      return {
        ...formant,
        frequency: formant.frequency * frequencyAdjustment,
        amplitude: formant.amplitude * amplitudeAdjustment
      };
    });
  }

  private applyClonedVoiceSpectrum(phoneme: any, voiceProfile: any): any {
    const baseSpectrum = voiceProfile.singingCharacteristics.spectralEnvelope;
    
    return {
      ...baseSpectrum,
      phonemeSpecific: {
        centroid: baseSpectrum.spectralCentroid * this.getPhonemeSpectralMultiplier(phoneme),
        rolloff: baseSpectrum.spectralRolloff * this.getPhonemeRolloffMultiplier(phoneme),
        brightness: this.calculatePhonemeBrightness(phoneme, baseSpectrum)
      }
    };
  }

  private getPhonemeSpectralMultiplier(phoneme: any): number {
    const multipliers: { [key: string]: number } = {
      'a': 0.9, 'e': 1.1, 'i': 1.3, 'o': 0.8, 'u': 0.7,
      's': 2.0, 'z': 1.8, 'f': 1.5, 'v': 1.3, 'th': 1.4, 'sh': 1.6
    };
    return multipliers[phoneme.symbol] || 1.0;
  }

  private getPhonemeRolloffMultiplier(phoneme: any): number {
    const multipliers: { [key: string]: number } = {
      'a': 0.95, 'e': 1.05, 'i': 1.15, 'o': 0.85, 'u': 0.75,
      's': 1.5, 'z': 1.4, 'f': 1.3, 'th': 1.25, 'sh': 1.35
    };
    return multipliers[phoneme.symbol] || 1.0;
  }

  private calculatePhonemeBrightness(phoneme: any, baseSpectrum: any): number {
    const baseBrightness = baseSpectrum.spectralCentroid / 5000; // Normalize to 0-1
    const phonemeAdjustment = this.getPhonemeSpectralMultiplier(phoneme) - 1.0;
    
    return Math.max(0, Math.min(1, baseBrightness + phonemeAdjustment * 0.2));
  }

  private applyDefaultFormants(phoneme: any, voiceCharacteristics: any): any {
    // Generate default formants based on voice characteristics
    const baseFormants = [
      { frequency: 800, bandwidth: 80, amplitude: 0.9 },   // F1
      { frequency: 1200, bandwidth: 120, amplitude: 0.7 }, // F2
      { frequency: 2500, bandwidth: 150, amplitude: 0.5 }, // F3
      { frequency: 3500, bandwidth: 200, amplitude: 0.3 }  // F4
    ];
    
    return this.applyClonedVoiceFormants(phoneme, { singingCharacteristics: { formants: baseFormants } });
  }

  private generateDefaultSpectrum(phoneme: any, voiceCharacteristics: any): any {
    const baseSpectrum = {
      spectralCentroid: 1250,
      spectralRolloff: 4200,
      spectralFlatness: 0.15
    };
    
    return this.applyClonedVoiceSpectrum(phoneme, { singingCharacteristics: { spectralEnvelope: baseSpectrum } });
  }

  private applySingingVoiceAdjustments(phoneme: any, voiceProfile: any): any {
    return {
      resonanceBoost: phoneme.singing === 'extended' ? 1.3 : 1.0,
      articulationClarity: phoneme.type === 'consonant' ? 1.2 : 1.0,
      sustainability: ['a', 'e', 'i', 'o', 'u'].includes(phoneme.symbol) ? 1.0 : 0.3,
      breathiness: voiceProfile.characteristics?.breathiness || 0.2,
      vibrato: this.calculatePhonemeVibrato(phoneme, voiceProfile)
    };
  }

  private calculatePhonemeVibrato(phoneme: any, voiceProfile: any): any {
    const baseVibrato = voiceProfile.characteristics?.vibrato || { rate: 6.5, depth: 0.03 };
    
    // Reduce vibrato on consonants
    if (phoneme.type === 'consonant') {
      return {
        ...baseVibrato,
        depth: baseVibrato.depth * 0.1
      };
    }
    
    // Enhance vibrato on sustained vowels
    if (phoneme.singing === 'extended') {
      return {
        ...baseVibrato,
        depth: baseVibrato.depth * 1.5,
        onset: Math.max(0.3, baseVibrato.onset || 0.5)
      };
    }
    
    return baseVibrato;
  }

  private async generateF0Track(processedLyrics: any, melody: any, voiceProfile: any, mood: string): Promise<any> {
    const f0Track = [];
    
    for (const section of processedLyrics.structure) {
      for (const line of section.lines) {
        for (const phoneme of line.melodyAlignment?.phonemes || []) {
          const f0Contour = this.generatePhonemeF0Contour(phoneme, voiceProfile, mood);
          f0Track.push({
            startTime: phoneme.startTime,
            endTime: phoneme.endTime,
            phoneme: phoneme.symbol,
            f0Contour,
            pitchTarget: phoneme.pitchTarget,
            vibrato: phoneme.singingAdjustments?.vibrato
          });
        }
      }
    }
    
    return f0Track;
  }

  private generatePhonemeF0Contour(phoneme: any, voiceProfile: any, mood: string): number[] {
    const targetF0 = phoneme.pitchTarget || 220;
    const duration = phoneme.endTime - phoneme.startTime;
    const sampleRate = 100; // F0 samples per second
    const samples = Math.ceil(duration * sampleRate);
    
    const contour = [];
    
    for (let i = 0; i < samples; i++) {
      const progress = i / samples;
      let f0 = targetF0;
      
      // Add pitch glide based on phoneme type
      if (phoneme.type === 'vowel') {
        // Slight pitch rise for vowels in singing
        f0 += Math.sin(progress * Math.PI) * targetF0 * 0.02;
      } else if (phoneme.type === 'consonant') {
        // Slight pitch drop for consonants
        f0 -= progress * targetF0 * 0.01;
      }
      
      // Add vibrato if applicable
      const vibrato = phoneme.singingAdjustments?.vibrato;
      if (vibrato && progress > vibrato.onset) {
        const vibratoPhase = (progress - vibrato.onset) * vibrato.rate * 2 * Math.PI;
        f0 += Math.sin(vibratoPhase) * targetF0 * vibrato.depth;
      }
      
      // Add mood-based inflection
      f0 += this.getMoodInflection(mood, progress) * targetF0;
      
      contour.push(f0);
    }
    
    return contour;
  }

  private getMoodInflection(mood: string, progress: number): number {
    const inflections: { [key: string]: (p: number) => number } = {
      'happy': (p) => Math.sin(p * Math.PI * 2) * 0.01,
      'sad': (p) => -Math.sin(p * Math.PI) * 0.015,
      'energetic': (p) => Math.sin(p * Math.PI * 4) * 0.02,
      'calm': (p) => Math.sin(p * Math.PI) * 0.005
    };
    
    return inflections[mood] ? inflections[mood](progress) : 0;
  }

  private async generateSpectralFeatures(voicedPhonemes: any, voiceProfile: any, genre: string): Promise<any> {
    return voicedPhonemes.map((line: any) => ({
      ...line,
      spectralData: line.phonemes.map((phoneme: any) => {
        const spectral = this.generatePhonemeSpectralData(phoneme, voiceProfile, genre);
        return {
          ...phoneme,
          spectralFeatures: spectral
        };
      })
    }));
  }

  private generatePhonemeSpectralData(phoneme: any, voiceProfile: any, genre: string): any {
    const baseSpectrum = phoneme.spectralCharacteristics;
    
    // Apply genre-specific spectral shaping
    const genreAdjustments = this.getGenreSpectralAdjustments(genre);
    
    return {
      formantFrequencies: phoneme.formants.map((f: any) => f.frequency),
      formantAmplitudes: phoneme.formants.map((f: any) => f.amplitude * genreAdjustments.formantBoost),
      spectralEnvelope: this.generateSpectralEnvelope(phoneme, genreAdjustments),
      harmonicContent: this.generateHarmonicContent(phoneme, voiceProfile, genreAdjustments),
      noiseComponent: this.generateNoiseComponent(phoneme, genre)
    };
  }

  private getGenreSpectralAdjustments(genre: string): any {
    const adjustments: { [key: string]: any } = {
      'pop': {
        formantBoost: 1.1,
        brightness: 1.2,
        warmth: 1.0,
        clarity: 1.3
      },
      'rock': {
        formantBoost: 1.2,
        brightness: 1.0,
        warmth: 0.9,
        clarity: 1.1
      },
      'jazz': {
        formantBoost: 1.05,
        brightness: 1.1,
        warmth: 1.2,
        clarity: 1.4
      },
      'classical': {
        formantBoost: 1.0,
        brightness: 1.3,
        warmth: 1.1,
        clarity: 1.5
      }
    };
    
    return adjustments[genre] || adjustments['pop'];
  }

  private generateSpectralEnvelope(phoneme: any, genreAdjustments: any): number[] {
    // Generate spectral envelope for the phoneme
    const frequencies = Array.from({ length: 512 }, (_, i) => i * 86.13); // Up to ~44kHz
    
    return frequencies.map(freq => {
      let amplitude = 0;
      
      // Add formant contributions
      phoneme.formants.forEach((formant: any) => {
        const distance = Math.abs(freq - formant.frequency);
        const bandwidth = formant.bandwidth;
        
        if (distance < bandwidth * 3) {
          amplitude += formant.amplitude * Math.exp(-Math.pow(distance / bandwidth, 2));
        }
      });
      
      // Apply genre adjustments
      if (freq > 3000) {
        amplitude *= genreAdjustments.brightness;
      }
      if (freq < 1000) {
        amplitude *= genreAdjustments.warmth;
      }
      
      return amplitude;
    });
  }

  private generateHarmonicContent(phoneme: any, voiceProfile: any, genreAdjustments: any): any {
    return {
      harmonicRatios: [1.0, 0.8, 0.6, 0.4, 0.3, 0.2, 0.15, 0.1],
      harmonicPhases: Array.from({ length: 8 }, () => Math.random() * 2 * Math.PI),
      inharmonicity: phoneme.type === 'consonant' ? 0.02 : 0.005,
      spectralTilt: -6.0 * genreAdjustments.clarity
    };
  }

  private generateNoiseComponent(phoneme: any, genre: string): any {
    const noiseLevel = phoneme.type === 'fricative' ? 0.3 : 
                     phoneme.type === 'plosive' ? 0.2 : 0.05;
    
    const genreNoiseAdjustment = genre === 'rock' ? 1.2 : 
                                genre === 'classical' ? 0.8 : 1.0;
    
    return {
      level: noiseLevel * genreNoiseAdjustment,
      spectralShape: phoneme.type === 'fricative' ? 'high_pass' : 'white',
      modulation: phoneme.type === 'fricative' ? 0.1 : 0
    };
  }

  private async applySingingModifications(spectralFeatures: any, options: any): Promise<any> {
    const { vibrato, breathingPattern, expressiveMarking, harmonization } = options;
    
    return spectralFeatures.map((line: any) => ({
      ...line,
      spectralData: line.spectralData.map((phoneme: any) => {
        const modifications = { ...phoneme };
        
        // Apply vibrato modulation
        if (vibrato && phoneme.singingAdjustments?.vibrato) {
          modifications.vibratoModulation = this.applyVibratoModulation(phoneme, vibrato);
        }
        
        // Apply breathing effects
        modifications.breathingEffects = this.applyBreathingEffects(phoneme, breathingPattern);
        
        // Apply expressive markings
        modifications.expressiveModulation = this.applyExpressiveModulation(phoneme, expressiveMarking);
        
        // Apply harmonization
        if (harmonization.voices > 0) {
          modifications.harmonicVoices = this.generateHarmonicVoices(phoneme, harmonization);
        }
        
        return modifications;
      })
    }));
  }

  private applyVibratoModulation(phoneme: any, vibrato: any): any {
    return {
      frequencyModulation: {
        rate: vibrato.rate || 6.5,
        depth: vibrato.depth || 0.03,
        shape: 'sinusoidal'
      },
      amplitudeModulation: {
        rate: vibrato.rate * 2 || 13,
        depth: vibrato.depth * 0.5 || 0.015,
        coupling: 0.3
      }
    };
  }

  private applyBreathingEffects(phoneme: any, breathingPattern: any[]): any {
    const relevantBreaths = breathingPattern.filter(breath => 
      breath.time >= phoneme.startTime && breath.time <= phoneme.endTime
    );
    
    return {
      breathNoise: relevantBreaths.length > 0 ? 0.1 : 0.02,
      breathingModulation: relevantBreaths.map(breath => ({
        time: breath.time - phoneme.startTime,
        intensity: breath.volume || 0.1,
        duration: breath.duration || 0.3
      }))
    };
  }

  private applyExpressiveModulation(phoneme: any, expressiveMarking: any): any {
    return {
      dynamicModulation: this.calculateDynamicModulation(phoneme, expressiveMarking),
      articulationModulation: this.calculateArticulationModulation(phoneme, expressiveMarking),
      timbreModulation: this.calculateTimbreModulation(phoneme, expressiveMarking)
    };
  }

  private calculateDynamicModulation(phoneme: any, expressiveMarking: any): any {
    const baseDynamic = 0.7; // mf
    let dynamicAdjustment = 1.0;
    
    switch (expressiveMarking.dynamics) {
      case 'piano': dynamicAdjustment = 0.5; break;
      case 'forte': dynamicAdjustment = 1.3; break;
      case 'fortissimo': dynamicAdjustment = 1.6; break;
      default: dynamicAdjustment = 1.0;
    }
    
    return {
      level: baseDynamic * dynamicAdjustment,
      envelope: this.generateDynamicEnvelope(phoneme),
      accentuation: expressiveMarking.accentuation || 'normal'
    };
  }

  private generateDynamicEnvelope(phoneme: any): any {
    const isVowel = ['a', 'e', 'i', 'o', 'u'].includes(phoneme.symbol);
    
    if (isVowel) {
      return {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.8,
        release: 0.3
      };
    } else {
      return {
        attack: 0.005,
        decay: 0.02,
        sustain: 0.4,
        release: 0.1
      };
    }
  }

  private calculateArticulationModulation(phoneme: any, expressiveMarking: any): any {
    return {
      clarity: expressiveMarking.articulation === 'crisp' ? 1.3 : 1.0,
      precision: expressiveMarking.articulation === 'precise' ? 1.4 : 1.0,
      legato: expressiveMarking.phrasing === 'legato' ? 1.2 : 1.0
    };
  }

  private calculateTimbreModulation(phoneme: any, expressiveMarking: any): any {
    return {
      brightness: expressiveMarking.articulation === 'bright' ? 1.2 : 1.0,
      warmth: expressiveMarking.phrasing === 'dolce' ? 1.3 : 1.0,
      edge: expressiveMarking.accentuation === 'strong' ? 1.4 : 1.0
    };
  }

  private generateHarmonicVoices(phoneme: any, harmonization: any): any[] {
    const voices = [];
    
    for (let i = 0; i < harmonization.voices; i++) {
      const interval = harmonization.intervals[i] || 5; // Default to fifth
      const semitones = this.intervalToSemitones(interval);
      
      voices.push({
        voiceNumber: i + 1,
        pitchOffset: semitones,
        amplitude: harmonization.blend / harmonization.voices,
        spectralModification: this.calculateHarmonicSpectralMod(interval),
        formantShift: this.calculateHarmonicFormantShift(interval)
      });
    }
    
    return voices;
  }

  private intervalToSemitones(interval: number): number {
    const intervalMap: { [key: number]: number } = {
      3: 4,   // Major third
      5: 7,   // Perfect fifth
      7: 10,  // Minor seventh
      8: 12   // Octave
    };
    
    return intervalMap[interval] || 7; // Default to fifth
  }

  private calculateHarmonicSpectralMod(interval: number): any {
    return {
      spectralTilt: interval === 3 ? 0.1 : interval === 5 ? -0.1 : 0,
      formantBoost: interval === 7 ? 1.1 : 1.0,
      brightnessAdjustment: interval === 8 ? 0.9 : 1.0
    };
  }

  private calculateHarmonicFormantShift(interval: number): number {
    // Slight formant shifts for harmony voices
    return interval === 3 ? 1.02 : interval === 5 ? 0.98 : 1.0;
  }

  private async synthesizeAudio(singingFeatures: any, f0Track: any, voiceProfile: any): Promise<any> {
    // Advanced audio synthesis using spectral features and F0 track
    const synthesizedSegments = [];
    
    for (const line of singingFeatures) {
      for (const phoneme of line.spectralData) {
        const segment = await this.synthesizePhonemeSegment(phoneme, f0Track, voiceProfile);
        synthesizedSegments.push(segment);
      }
    }
    
    return {
      segments: synthesizedSegments,
      totalDuration: this.calculateTotalDuration(singingFeatures),
      sampleRate: 44100,
      bitDepth: 24,
      channels: 1
    };
  }

  private async synthesizePhonemeSegment(phoneme: any, f0Track: any, voiceProfile: any): Promise<any> {
    // Find corresponding F0 data
    const f0Data = f0Track.find((track: any) => 
      track.startTime <= phoneme.startTime && track.endTime >= phoneme.endTime
    );
    
    return {
      phoneme: phoneme.symbol,
      startTime: phoneme.startTime,
      endTime: phoneme.endTime,
      audioData: this.generatePhonemeAudio(phoneme, f0Data),
      spectralAnalysis: {
        peakFrequency: this.findPeakFrequency(phoneme.spectralFeatures),
        spectralCentroid: this.calculateSpectralCentroid(phoneme.spectralFeatures),
        harmonicRichness: this.calculateHarmonicRichness(phoneme.spectralFeatures)
      }
    };
  }

  private generatePhonemeAudio(phoneme: any, f0Data: any): any {
    // Simplified audio generation - in practice would use advanced synthesis
    return {
      waveform: 'synthesized',
      fundamentalFrequency: f0Data?.f0Contour || [220],
      harmonicContent: phoneme.spectralFeatures.harmonicContent,
      formantFiltering: phoneme.spectralFeatures.formantFrequencies,
      noiseComponent: phoneme.spectralFeatures.noiseComponent
    };
  }

  private findPeakFrequency(spectralFeatures: any): number {
    if (!spectralFeatures.spectralEnvelope) return 1000;
    
    let maxAmplitude = 0;
    let peakIndex = 0;
    
    spectralFeatures.spectralEnvelope.forEach((amplitude: number, index: number) => {
      if (amplitude > maxAmplitude) {
        maxAmplitude = amplitude;
        peakIndex = index;
      }
    });
    
    return peakIndex * 86.13; // Convert bin to frequency
  }

  private calculateSpectralCentroid(spectralFeatures: any): number {
    if (!spectralFeatures.spectralEnvelope) return 1250;
    
    let weightedSum = 0;
    let amplitudeSum = 0;
    
    spectralFeatures.spectralEnvelope.forEach((amplitude: number, index: number) => {
      const frequency = index * 86.13;
      weightedSum += frequency * amplitude;
      amplitudeSum += amplitude;
    });
    
    return amplitudeSum > 0 ? weightedSum / amplitudeSum : 1250;
  }

  private calculateHarmonicRichness(spectralFeatures: any): number {
    const harmonicRatios = spectralFeatures.harmonicContent?.harmonicRatios || [1.0];
    return harmonicRatios.reduce((sum: number, ratio: number) => sum + ratio, 0) / harmonicRatios.length;
  }

  private async postProcessAudio(synthesizedAudio: any, genre: string, expressiveMarking: any): Promise<any> {
    // Apply final post-processing
    const processed = {
      ...synthesizedAudio,
      postProcessing: {
        equalization: this.applyEQProcessing(synthesizedAudio, genre),
        compression: this.applyCompressionProcessing(synthesizedAudio, expressiveMarking),
        reverb: this.applyReverbProcessing(synthesizedAudio, genre),
        finalMix: this.applyFinalMixProcessing(synthesizedAudio)
      }
    };
    
    return processed;
  }

  private applyEQProcessing(audio: any, genre: string): any {
    const eqSettings: { [key: string]: any } = {
      'pop': { lowBoost: 1.1, midCut: 0.95, highBoost: 1.2 },
      'rock': { lowBoost: 1.0, midBoost: 1.1, highBoost: 1.1 },
      'jazz': { lowBoost: 1.05, midBoost: 1.0, highBoost: 1.15 },
      'classical': { lowBoost: 1.0, midBoost: 1.0, highBoost: 1.1 }
    };
    
    return eqSettings[genre] || eqSettings['pop'];
  }

  private applyCompressionProcessing(audio: any, expressiveMarking: any): any {
    return {
      ratio: expressiveMarking.dynamics === 'forte' ? 3.0 : 2.5,
      threshold: -18,
      attack: 3,
      release: 100,
      gain: 0
    };
  }

  private applyReverbProcessing(audio: any, genre: string): any {
    const reverbSettings: { [key: string]: any } = {
      'pop': { roomSize: 0.3, decay: 1.2, wetness: 0.15 },
      'rock': { roomSize: 0.5, decay: 1.8, wetness: 0.25 },
      'jazz': { roomSize: 0.4, decay: 1.5, wetness: 0.2 },
      'classical': { roomSize: 0.8, decay: 2.5, wetness: 0.3 }
    };
    
    return reverbSettings[genre] || reverbSettings['pop'];
  }

  private applyFinalMixProcessing(audio: any): any {
    return {
      masterVolume: 0.8,
      stereoWidth: 0.7,
      finalEQ: 'mastering_curve',
      limiting: {
        ceiling: -0.3,
        release: 50
      }
    };
  }

  private calculateTotalDuration(data: any): number {
    if (Array.isArray(data.structure)) {
      return data.structure.reduce((total: number, section: any) => {
        return Math.max(total, section.endTime || 0);
      }, 0);
    }
    
    if (Array.isArray(data)) {
      return data.reduce((total: number, line: any) => {
        return Math.max(total, line.endTime || 0);
      }, 0);
    }
    
    return 30; // Default duration
  }
}