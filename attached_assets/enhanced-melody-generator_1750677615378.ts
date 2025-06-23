import type { GeneratedMelody, MelodyNote, MelodyPhrase, AudioFeatures } from "@shared/schema"

export interface MelodyGenerationConfig {
  lyrics: string
  genre: string
  mood: string
  tempo: number
  structure?: string[]
}

export interface LyricsAnalysis {
  lines: string[]
  emotionalArc: number[]
  syllableCounts: number[]
  totalSyllables: number
  rhymeScheme: string[]
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
  }

  // Emotion to musical parameter mapping
  private emotionMappings = {
    happy: { scale: "major", tempoMod: 1.1, energy: 0.8 },
    sad: { scale: "minor", tempoMod: 0.9, energy: 0.4 },
    energetic: { scale: "mixolydian", tempoMod: 1.2, energy: 0.9 },
    calm: { scale: "pentatonic_major", tempoMod: 0.8, energy: 0.3 },
    mysterious: { scale: "dorian", tempoMod: 0.95, energy: 0.5 },
    uplifting: { scale: "major", tempoMod: 1.05, energy: 0.7 },
  }

  // Emotional word weights for lyrics analysis
  private emotionWeights: Record<string, number> = {
    // Positive emotions
    love: 0.9,
    joy: 0.8,
    happy: 0.7,
    beautiful: 0.6,
    amazing: 0.7,
    wonderful: 0.8,
    perfect: 0.6,
    dream: 0.5,
    sunshine: 0.7,
    freedom: 0.6,
    hope: 0.5,
    smile: 0.6,
    dance: 0.7,
    fly: 0.6,
    soar: 0.8,
    bright: 0.5,

    // Negative emotions
    sad: -0.7,
    pain: -0.8,
    hurt: -0.6,
    broken: -0.7,
    lonely: -0.6,
    dark: -0.5,
    tears: -0.6,
    goodbye: -0.5,
    lost: -0.6,
    empty: -0.7,
    cold: -0.4,
    fear: -0.6,

    // Neutral/contextual
    time: 0.0,
    day: 0.1,
    night: -0.2,
    way: 0.0,
    life: 0.2,
    world: 0.1,
    heart: 0.3,
    soul: 0.2,
  }

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
  }

  async generateMelodyFromLyrics(config: MelodyGenerationConfig): Promise<GeneratedMelody> {
    console.log(`🎵 Generating melody from lyrics...`)
    console.log(`Genre: ${config.genre}, Mood: ${config.mood}, Tempo: ${config.tempo}`)

    // Analyze lyrics structure
    const lyricsAnalysis = this.analyzeLyricsStructure(config.lyrics)

    // Determine musical parameters
    const [rootNote, scaleName] = this.determineKeyAndScale(lyricsAnalysis.emotionalArc, config.mood)
    const audioFeatures = this.generateAudioFeatures(config.genre, config.mood, config.tempo, rootNote, scaleName)

    console.log(`🎼 Key: ${this.midiToNoteName(rootNote)}, Scale: ${scaleName}`)

    // Generate melody phrases for each lyric line
    const melodyPhrases: MelodyPhrase[] = []
    let currentTime = 0.0

    for (let lineIdx = 0; lineIdx < lyricsAnalysis.lines.length; lineIdx++) {
      const line = lyricsAnalysis.lines[lineIdx]
      if (!line.trim()) continue

      console.log(`🎶 Processing line ${lineIdx + 1}: '${line.substring(0, 40)}...'`)

      // Analyze this specific line
      const lineSyllables = this.analyzeLineSyllables(line)
      const emotionWeight = lyricsAnalysis.emotionalArc[lineIdx]

      // Generate melodic phrase
      const phrase = await this.generatePhraseFromLine(
        line,
        lineSyllables,
        emotionWeight,
        rootNote,
        scaleName,
        currentTime,
        config.tempo,
      )

      melodyPhrases.push(phrase)
      currentTime += phrase.notes.reduce((sum, note) => sum + note.duration, 0)
    }

    // Create final melody object
    const melody: GeneratedMelody = {
      phrases: melodyPhrases,
      audioFeatures: audioFeatures,
      structure: lyricsAnalysis,
      totalDuration: currentTime,
      noteCount: melodyPhrases.reduce((sum, phrase) => sum + phrase.notes.length, 0),
    }

    console.log(`✅ Melody generated: ${melody.noteCount} notes, ${melody.totalDuration.toFixed(1)}s`)
    return melody
  }

  private analyzeLyricsStructure(lyrics: string): LyricsAnalysis {
    const lines = lyrics.split("\n").filter((line) => line.trim())

    const analysis: LyricsAnalysis = {
      lines: lines,
      emotionalArc: [],
      syllableCounts: [],
      totalSyllables: 0,
      rhymeScheme: [],
    }

    for (const line of lines) {
      // Emotional analysis
      const words = line.toLowerCase().split(/\s+/)
      const lineEmotion =
        words.reduce((sum, word) => {
          return sum + (this.emotionWeights[word] || 0)
        }, 0) / words.length

      analysis.emotionalArc.push(lineEmotion)

      // Syllable counting
      const syllableCount = words.reduce((count, word) => {
        const vowels = word.match(/[aeiou]/g)
        return count + Math.max(1, vowels ? vowels.length : 1)
      }, 0)

      analysis.syllableCounts.push(syllableCount)
      analysis.totalSyllables += syllableCount
    }

    return analysis
  }

  private analyzeLineSyllables(line: string): Array<{
    word: string
    syllableCount: number
    stressPattern: boolean[]
    emotionWeight: number
  }> {
    const words = line.toLowerCase().split(/\s+/)

    return words.map((word) => {
      // Estimate syllable count
      const vowels = word.match(/[aeiou]/g)
      const syllableCount = Math.max(1, vowels ? vowels.length : 1)

      // Get stress pattern
      let stressPattern = this.stressPatterns[word]
      if (!stressPattern || stressPattern.length !== syllableCount) {
        // Generate default stress pattern
        if (syllableCount === 1) {
          stressPattern = [true]
        } else if (syllableCount === 2) {
          stressPattern = [true, false] // Most 2-syllable words are trochaic
        } else {
          // Alternate pattern for longer words
          stressPattern = Array.from({ length: syllableCount }, (_, i) => i % 2 === 0)
        }
      }

      // Get emotional weight
      const emotionWeight = this.emotionWeights[word] || 0.0

      return {
        word,
        syllableCount,
        stressPattern,
        emotionWeight,
      }
    })
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
    const scaleNotes = this.scales[scaleName]
    const notes: MelodyNote[] = []
    let currentPitch = rootNote + 12 // Start an octave above root
    let currentTime = startTime

    for (const wordData of syllableData) {
      const { word, stressPattern, emotionWeight: wordEmotion } = wordData

      for (let sylIdx = 0; sylIdx < stressPattern.length; sylIdx++) {
        const isStressed = stressPattern[sylIdx]

        // Calculate pitch change based on stress and emotion
        let pitchChange = isStressed ? 2 : -1
        pitchChange += Math.round(wordEmotion * 2) // Emotion influence
        pitchChange += Math.floor(Math.random() * 3) - 1 // Random variation

        currentPitch += pitchChange

        // Constrain to scale
        const scaleDegree = (((currentPitch - rootNote) % 12) + 12) % 12
        const nearestScaleNote = scaleNotes.reduce((nearest, note) => {
          return Math.abs(scaleDegree - note) < Math.abs(scaleDegree - nearest) ? note : nearest
        })

        const finalPitch = rootNote + nearestScaleNote + Math.floor((currentPitch - rootNote) / 12) * 12

        // Calculate duration based on stress and tempo
        let duration = isStressed ? 0.75 : 0.5
        duration += Math.abs(wordEmotion) * 0.25 // Emotional words get longer
        duration = duration * (120 / tempo) // Normalize to tempo

        // Calculate velocity
        let velocity = isStressed ? 90 : 70
        velocity += Math.round(Math.abs(wordEmotion) * 20)
        velocity = Math.max(40, Math.min(127, velocity))

        // Create syllable text
        const syllableText = stressPattern.length > 1 ? `${word}[${sylIdx}]` : word

        const note: MelodyNote = {
          pitch: finalPitch,
          duration: duration,
          velocity: velocity,
          syllable: syllableText,
          timestamp: currentTime,
        }

        notes.push(note)
        currentTime += duration
      }
    }

    return {
      notes,
      startTime,
      emotionWeight,
      lyricLine: line,
    }
  }

  private determineKeyAndScale(emotionalArc: number[], mood: string): [number, keyof typeof this.scales] {
    const avgEmotion =
      emotionalArc.length > 0 ? emotionalArc.reduce((sum, val) => sum + val, 0) / emotionalArc.length : 0

    // Use mood mapping if available
    const moodLower = mood.toLowerCase() as keyof typeof this.emotionMappings
    let scaleName: keyof typeof this.scales

    if (this.emotionMappings[moodLower]) {
      scaleName = this.emotionMappings[moodLower].scale as keyof typeof this.scales
    } else {
      // Choose scale based on average emotion
      if (avgEmotion > 0.3) {
        scaleName = "major"
      } else if (avgEmotion < -0.3) {
        scaleName = "minor"
      } else if (avgEmotion > 0) {
        scaleName = "mixolydian"
      } else {
        scaleName = "dorian"
      }
    }

    // Choose root note based on emotion
    let rootNote: number
    if (avgEmotion > 0.5) {
      rootNote = [60, 62, 64, 67][Math.floor(Math.random() * 4)] // C, D, E, G (brighter keys)
    } else if (avgEmotion < -0.5) {
      rootNote = [57, 59, 61, 65][Math.floor(Math.random() * 4)] // A, B, C#, F (darker keys)
    } else {
      rootNote = [60, 62, 65, 67][Math.floor(Math.random() * 4)] // C, D, F, G (neutral)
    }

    return [rootNote, scaleName]
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
    }

    // Adjust based on mood
    const moodLower = mood.toLowerCase() as keyof typeof this.emotionMappings
    if (this.emotionMappings[moodLower]) {
      const moodConfig = this.emotionMappings[moodLower]
      features.energy = moodConfig.energy
      features.valence = moodConfig.energy > 0.6 ? 0.8 : 0.3
    }

    // Adjust based on genre
    const genreAdjustments: Record<string, Partial<AudioFeatures>> = {
      pop: { danceability: 0.8, energy: 0.7, acousticness: 0.2 },
      rock: { energy: 0.9, acousticness: 0.1, danceability: 0.6 },
      electronic: { danceability: 0.9, energy: 0.8, acousticness: 0.05 },
      folk: { acousticness: 0.8, energy: 0.4, danceability: 0.3 },
      jazz: { acousticness: 0.6, energy: 0.5, danceability: 0.4 },
      hip_hop: { danceability: 0.8, energy: 0.7, acousticness: 0.1 },
    }

    const genreAdj = genreAdjustments[genre.toLowerCase()]
    if (genreAdj) {
      Object.assign(features, genreAdj)
    }

    return features
  }

  private midiToNoteName(midiNote: number): string {
    const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    const octave = Math.floor(midiNote / 12) - 1
    const note = noteNames[midiNote % 12]
    return `${note}${octave}`
  }

  // Legacy method for backward compatibility
  async generateMelody(genre: string, mood: string, tempo: number): Promise<any> {
    console.log("⚠️  Using legacy generateMelody method. Consider using generateMelodyFromLyrics for better results.")

    // Generate a basic melody without lyrics
    const basicLyrics = "La la la la la\nDa da da da da\nNa na na na na\nHa ha ha ha ha"

    return this.generateMelodyFromLyrics({
      lyrics: basicLyrics,
      genre,
      mood,
      tempo,
    })
  }
}
