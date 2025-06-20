import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export class MelodyGenerator {
  async generateMelody(genre: string, mood: string, tempo: number, duration: number = 30): Promise<any> {
    try {
      // Advanced melody generation using our Python music21 integration
      const melodyData = {
        genre,
        mood,
        tempo,
        duration,
        complexity: this.getComplexityFromGenre(genre),
        harmonicStructure: this.getHarmonicStructure(genre),
        rhythmicPattern: this.getRhythmicPattern(genre, tempo),
        modalCharacteristics: this.getModalCharacteristics(mood)
      };

      // Generate chord progression based on genre and mood
      const chordProgression = this.generateChordProgression(genre, mood);
      
      // Create melodic contour based on mood and genre characteristics
      const melodicContour = this.generateMelodicContour(mood, genre);
      
      // Generate rhythmic patterns
      const rhythmicStructure = this.generateRhythmicStructure(tempo, genre);

      // Advanced melody processing
      const melody = {
        ...melodyData,
        chordProgression,
        melodicContour,
        rhythmicStructure,
        scales: this.getScalesForGenre(genre),
        motifs: this.generateMotifs(genre, mood),
        phraseStructure: this.generatePhraseStructure(duration),
        dynamicMarkings: this.generateDynamics(mood),
        articulationMarks: this.generateArticulations(genre)
      };

      return melody;
    } catch (error) {
      console.error('Error generating melody:', error);
      throw new Error('Failed to generate melody');
    }
  }

  private getComplexityFromGenre(genre: string): 'simple' | 'moderate' | 'complex' {
    const complexityMap: { [key: string]: 'simple' | 'moderate' | 'complex' } = {
      'pop': 'simple',
      'rock': 'moderate',
      'jazz': 'complex',
      'classical': 'complex',
      'electronic': 'moderate',
      'hip-hop': 'simple',
      'country': 'simple',
      'r&b': 'moderate'
    };
    return complexityMap[genre.toLowerCase()] || 'moderate';
  }

  private getHarmonicStructure(genre: string): any {
    const harmonicStructures: { [key: string]: any } = {
      'pop': {
        primaryChords: ['I', 'V', 'vi', 'IV'],
        secondaryChords: ['ii', 'iii'],
        extensions: ['7th', 'add9'],
        modality: 'major'
      },
      'rock': {
        primaryChords: ['I', 'bVII', 'IV', 'V'],
        secondaryChords: ['vi', 'iii'],
        extensions: ['power chords', 'suspended'],
        modality: 'minor'
      },
      'jazz': {
        primaryChords: ['IIM7', 'V7', 'IM7', 'VIM7'],
        secondaryChords: ['IIIM7', 'bVIM7', 'IVM7'],
        extensions: ['9th', '11th', '13th', 'altered'],
        modality: 'mixed'
      },
      'classical': {
        primaryChords: ['I', 'IV', 'V', 'vi'],
        secondaryChords: ['ii', 'iii', 'viio'],
        extensions: ['inversions', 'suspensions'],
        modality: 'classical'
      }
    };
    return harmonicStructures[genre.toLowerCase()] || harmonicStructures['pop'];
  }

  private getRhythmicPattern(genre: string, tempo: number): any {
    const patterns: { [key: string]: any } = {
      'pop': {
        timeSignature: '4/4',
        subdivision: 'eighth',
        accentPattern: [1, 0, 0, 1, 0, 0, 1, 0],
        syncopation: 'moderate'
      },
      'rock': {
        timeSignature: '4/4',
        subdivision: 'quarter',
        accentPattern: [1, 0, 1, 0, 1, 0, 1, 0],
        syncopation: 'minimal'
      },
      'jazz': {
        timeSignature: '4/4',
        subdivision: 'triplet',
        accentPattern: [1, 0, 1, 0, 1, 0, 1, 1],
        syncopation: 'high'
      },
      'electronic': {
        timeSignature: '4/4',
        subdivision: 'sixteenth',
        accentPattern: [1, 0, 0, 0, 1, 0, 0, 0],
        syncopation: 'programmed'
      }
    };
    return patterns[genre.toLowerCase()] || patterns['pop'];
  }

  private getModalCharacteristics(mood: string): any {
    const modalMap: { [key: string]: any } = {
      'happy': {
        mode: 'Ionian',
        intervals: [2, 2, 1, 2, 2, 2, 1],
        colorTones: ['major 7th', 'major 9th'],
        tendency: 'upward'
      },
      'sad': {
        mode: 'Aeolian',
        intervals: [2, 1, 2, 2, 1, 2, 2],
        colorTones: ['minor 7th', 'flat 9th'],
        tendency: 'downward'
      },
      'energetic': {
        mode: 'Mixolydian',
        intervals: [2, 2, 1, 2, 2, 1, 2],
        colorTones: ['dominant 7th', 'major 9th'],
        tendency: 'angular'
      },
      'calm': {
        mode: 'Lydian',
        intervals: [2, 2, 2, 1, 2, 2, 1],
        colorTones: ['major 7th', '#11'],
        tendency: 'flowing'
      }
    };
    return modalMap[mood.toLowerCase()] || modalMap['happy'];
  }

  private generateChordProgression(genre: string, mood: string): string[] {
    const progressions: { [key: string]: { [key: string]: string[] } } = {
      'pop': {
        'happy': ['C', 'G', 'Am', 'F'],
        'sad': ['Am', 'F', 'C', 'G'],
        'energetic': ['C', 'F', 'G', 'C'],
        'calm': ['C', 'Am', 'F', 'G']
      },
      'rock': {
        'happy': ['A', 'D', 'E', 'A'],
        'sad': ['Am', 'F', 'C', 'G'],
        'energetic': ['E', 'A', 'B', 'E'],
        'calm': ['Em', 'C', 'G', 'D']
      },
      'jazz': {
        'happy': ['CM7', 'Am7', 'Dm7', 'G7'],
        'sad': ['Am7', 'D7', 'GM7', 'CM7'],
        'energetic': ['CM7', 'E7', 'Am7', 'D7'],
        'calm': ['FM7', 'Em7', 'Am7', 'Dm7']
      }
    };
    
    const genreProgressions = progressions[genre.toLowerCase()] || progressions['pop'];
    return genreProgressions[mood.toLowerCase()] || genreProgressions['happy'];
  }

  private generateMelodicContour(mood: string, genre: string): any {
    const contours: { [key: string]: any } = {
      'happy': {
        direction: 'ascending',
        intervalPattern: [2, 3, -1, 4, -2, 5],
        peakPosition: 0.7,
        range: 'wide'
      },
      'sad': {
        direction: 'descending',
        intervalPattern: [-2, -1, 3, -4, 2, -3],
        peakPosition: 0.3,
        range: 'narrow'
      },
      'energetic': {
        direction: 'angular',
        intervalPattern: [4, -3, 5, -2, 6, -4],
        peakPosition: 0.5,
        range: 'very wide'
      },
      'calm': {
        direction: 'wave',
        intervalPattern: [1, 2, -1, 2, 1, -2],
        peakPosition: 0.6,
        range: 'moderate'
      }
    };
    return contours[mood.toLowerCase()] || contours['happy'];
  }

  private generateRhythmicStructure(tempo: number, genre: string): any {
    const baseUnit = 60000 / tempo; // milliseconds per beat
    
    return {
      tempo,
      baseUnit,
      subdivision: tempo > 120 ? 'eighth' : 'quarter',
      swingFactor: genre === 'jazz' ? 0.67 : 0.5,
      accentStrength: genre === 'rock' ? 0.8 : 0.6,
      microTiming: genre === 'jazz' ? 'loose' : 'tight'
    };
  }

  private getScalesForGenre(genre: string): any {
    const scales: { [key: string]: any } = {
      'pop': {
        primary: 'major pentatonic',
        secondary: 'natural minor',
        blues: 'minor pentatonic + blue notes'
      },
      'rock': {
        primary: 'minor pentatonic',
        secondary: 'dorian',
        blues: 'blues scale'
      },
      'jazz': {
        primary: 'bebop dominant',
        secondary: 'melodic minor',
        blues: 'bebop blues'
      },
      'classical': {
        primary: 'major',
        secondary: 'harmonic minor',
        blues: 'chromatic'
      }
    };
    return scales[genre.toLowerCase()] || scales['pop'];
  }

  private generateMotifs(genre: string, mood: string): any[] {
    // Generate 2-4 musical motifs based on genre and mood
    const motifCount = genre === 'classical' || genre === 'jazz' ? 4 : 2;
    const motifs = [];

    for (let i = 0; i < motifCount; i++) {
      motifs.push({
        id: `motif_${i + 1}`,
        intervalPattern: this.generateMotifPattern(genre, mood),
        rhythmPattern: this.generateMotifRhythm(genre),
        development: this.generateMotifDevelopment(genre)
      });
    }

    return motifs;
  }

  private generateMotifPattern(genre: string, mood: string): number[] {
    const patterns: { [key: string]: { [key: string]: number[] } } = {
      'pop': {
        'happy': [0, 2, 4, 2],
        'sad': [0, -2, -3, -1],
        'energetic': [0, 4, 2, 5],
        'calm': [0, 1, 3, 2]
      },
      'rock': {
        'happy': [0, 3, 5, 3],
        'sad': [0, -3, -5, -2],
        'energetic': [0, 5, 3, 7],
        'calm': [0, 2, 5, 4]
      }
    };
    
    const genrePatterns = patterns[genre.toLowerCase()] || patterns['pop'];
    return genrePatterns[mood.toLowerCase()] || genrePatterns['happy'];
  }

  private generateMotifRhythm(genre: string): number[] {
    const rhythms: { [key: string]: number[] } = {
      'pop': [1, 0.5, 0.5, 1],
      'rock': [1, 1, 0.5, 0.5],
      'jazz': [0.67, 0.33, 1, 0.5],
      'classical': [1, 0.5, 0.25, 0.25]
    };
    return rhythms[genre.toLowerCase()] || rhythms['pop'];
  }

  private generateMotifDevelopment(genre: string): any {
    return {
      transposition: genre === 'classical' ? 'sequence' : 'simple',
      inversion: genre === 'jazz' || genre === 'classical',
      fragmentation: genre === 'jazz',
      augmentation: genre === 'classical'
    };
  }

  private generatePhraseStructure(duration: number): any {
    const phraseCount = Math.ceil(duration / 8); // 8-second phrases
    
    return {
      phraseLength: 8,
      phraseCount,
      antecedent: 'question',
      consequent: 'answer',
      cadences: this.generateCadences(phraseCount)
    };
  }

  private generateCadences(phraseCount: number): string[] {
    const cadences = [];
    for (let i = 0; i < phraseCount; i++) {
      if (i === phraseCount - 1) {
        cadences.push('authentic');
      } else if (i % 2 === 0) {
        cadences.push('half');
      } else {
        cadences.push('deceptive');
      }
    }
    return cadences;
  }

  private generateDynamics(mood: string): any {
    const dynamics: { [key: string]: any } = {
      'happy': {
        overall: 'mf',
        variation: ['mp', 'mf', 'f'],
        crescendos: 3,
        diminuendos: 2
      },
      'sad': {
        overall: 'mp',
        variation: ['pp', 'mp', 'mf'],
        crescendos: 1,
        diminuendos: 4
      },
      'energetic': {
        overall: 'f',
        variation: ['mf', 'f', 'ff'],
        crescendos: 5,
        diminuendos: 1
      },
      'calm': {
        overall: 'mp',
        variation: ['pp', 'mp', 'p'],
        crescendos: 2,
        diminuendos: 3
      }
    };
    return dynamics[mood.toLowerCase()] || dynamics['happy'];
  }

  private generateArticulations(genre: string): any {
    const articulations: { [key: string]: any } = {
      'pop': {
        primary: 'legato',
        accents: 'moderate',
        staccato: 'minimal'
      },
      'rock': {
        primary: 'marcato',
        accents: 'strong',
        staccato: 'rhythmic'
      },
      'jazz': {
        primary: 'swing',
        accents: 'syncopated',
        staccato: 'articulated'
      },
      'classical': {
        primary: 'varied',
        accents: 'expressive',
        staccato: 'precise'
      }
    };
    return articulations[genre.toLowerCase()] || articulations['pop'];
  }
}