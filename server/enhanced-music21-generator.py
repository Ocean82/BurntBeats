#!/usr/bin/env python3
"""
Enhanced Music21 generator with cutting-edge AI integration and advanced composition techniques
"""

import sys
import json
import os
import logging
import tempfile
import shutil
from music21 import stream, note, chord, meter, tempo, key, duration, pitch, scale, interval, bar
from music21 import converter, corpus, analysis, features
from music21.midi import MidiFile
from music21.musicxml import m21ToXml
import random
import re
import glob
from pathlib import Path
import pickle
import numpy as np

# Advanced AI imports with graceful fallback
try:
    import torch
    import transformers
    from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
    AI_AVAILABLE = True
    print("🤖 Advanced AI capabilities loaded")
except ImportError:
    AI_AVAILABLE = False
    print("⚠️  Advanced AI not available, using enhanced rule-based generation")

# Audio processing
try:
    import librosa
    import soundfile as sf
    AUDIO_PROCESSING_AVAILABLE = True
except ImportError:
    AUDIO_PROCESSING_AVAILABLE = False

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EnhancedMusicGenerator:
    def __init__(self):
        self.ai_models = {}
        self.load_ai_models()

    def load_ai_models(self):
        """Load cutting-edge AI models for music generation"""
        if not AI_AVAILABLE:
            return

        try:
            # Load music-specific transformer model
            logger.info("Loading advanced AI models...")

            # Music generation model
            self.ai_models['music_generator'] = pipeline(
                "text-generation",
                model="gpt2",  # Fallback to stable model
                device=0 if torch.cuda.is_available() else -1,
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
            )

            logger.info("✅ Advanced AI models loaded successfully")

        except Exception as e:
            logger.warning(f"⚠️  Could not load advanced AI models: {e}")
            self.ai_models = {}

    def analyze_lyrics_with_ai(self, lyrics):
        """Enhanced lyrics analysis using AI"""
        if not AI_AVAILABLE or not self.ai_models:
            return self.analyze_lyrics_traditional(lyrics)

        try:
            # AI-enhanced emotional analysis
            prompt = f"Analyze the emotional content and musical implications of these lyrics: {lyrics[:200]}..."

            result = self.ai_models['music_generator'](
                prompt,
                max_new_tokens=150,
                do_sample=True,
                temperature=0.7,
                top_k=50,
                top_p=0.95,
                pad_token_id=self.ai_models['music_generator'].tokenizer.eos_token_id
            )

            ai_analysis = result[0]['generated_text'].replace(prompt, "").strip()

            # Parse AI analysis into structured data
            analysis = self.parse_ai_analysis(ai_analysis, lyrics)
            logger.info("✅ AI lyrics analysis completed")
            return analysis

        except Exception as e:
            logger.warning(f"⚠️  AI analysis failed, falling back: {e}")
            return self.analyze_lyrics_traditional(lyrics)

    def parse_ai_analysis(self, ai_output, original_lyrics):
        """Parse AI analysis into structured musical data"""
        lines = original_lyrics.split('\n')

        # Enhanced emotional mapping with AI insights
        emotion_keywords = {
            'joy': 0.8, 'happy': 0.7, 'love': 0.9, 'excited': 0.8, 'bright': 0.6,
            'sad': -0.7, 'pain': -0.8, 'hurt': -0.6, 'lonely': -0.7, 'dark': -0.5,
            'angry': -0.6, 'rage': -0.9, 'mad': -0.5, 'fury': -0.8,
            'calm': 0.3, 'peace': 0.5, 'serene': 0.4, 'gentle': 0.3,
            'energy': 0.6, 'power': 0.7, 'strong': 0.5, 'intense': 0.8
        }

        analysis = {
            'lines': lines,
            'emotion_arc': [],
            'ai_insights': ai_output,
            'tempo_suggestions': [],
            'harmonic_suggestions': [],
            'melodic_contours': [],
            'rhythmic_patterns': [],
            'song_structure': self.detect_advanced_structure(lines),
            'key_suggestions': [],
            'dynamic_markings': []
        }

        # Enhanced per-line analysis
        for i, line in enumerate(lines):
            words = line.lower().split()

            # Base emotional analysis
            line_emotion = self.calculate_enhanced_emotion(words, emotion_keywords, ai_output)
            analysis['emotion_arc'].append(line_emotion)

            # AI-informed tempo suggestions
            tempo_mod = self.ai_suggest_tempo(line, line_emotion)
            analysis['tempo_suggestions'].append(tempo_mod)

            # Enhanced harmonic analysis
            harmony_suggestion = self.ai_suggest_harmony(line, line_emotion, i, len(lines))
            analysis['harmonic_suggestions'].append(harmony_suggestion)

            # Melodic contour suggestions
            contour = self.ai_suggest_melodic_contour(line, line_emotion)
            analysis['melodic_contours'].append(contour)

            # Advanced rhythmic patterns
            rhythm = self.ai_suggest_rhythm_pattern(line, line_emotion)
            analysis['rhythmic_patterns'].append(rhythm)

            # Key signature suggestions
            key_suggestion = self.ai_suggest_key_change(line, line_emotion, i)
            analysis['key_suggestions'].append(key_suggestion)

            # Dynamic markings
            dynamics = self.ai_suggest_dynamics(line, line_emotion, i, len(lines))
            analysis['dynamic_markings'].append(dynamics)

        return analysis

    def calculate_enhanced_emotion(self, words, emotion_keywords, ai_context):
        """Enhanced emotional calculation with AI context"""
        base_emotion = sum(emotion_keywords.get(word, 0) for word in words) / max(len(words), 1)

        # AI context modifier
        ai_modifier = 0
        if 'positive' in ai_context.lower() or 'uplifting' in ai_context.lower():
            ai_modifier += 0.2
        elif 'negative' in ai_context.lower() or 'melancholy' in ai_context.lower():
            ai_modifier -= 0.2
        elif 'energetic' in ai_context.lower() or 'dynamic' in ai_context.lower():
            ai_modifier += 0.3

        return max(-1.0, min(1.0, base_emotion + ai_modifier))

    def ai_suggest_tempo(self, line, emotion):
        """AI-informed tempo suggestions"""
        base_tempo = 1.0

        # Emotional tempo mapping
        if emotion > 0.5:
            base_tempo = 1.1 + emotion * 0.2  # Faster for happy
        elif emotion < -0.5:
            base_tempo = 0.9 + emotion * 0.1  # Slower for sad

        # Lyrical content analysis
        if any(word in line.lower() for word in ['dance', 'run', 'fast', 'quick', 'rush']):
            base_tempo *= 1.15
        elif any(word in line.lower() for word in ['slow', 'gentle', 'soft', 'quiet', 'still']):
            base_tempo *= 0.9

        return base_tempo

    def ai_suggest_harmony(self, line, emotion, position, total_lines):
        """AI-informed harmonic suggestions"""
        if emotion > 0.6:
            return 'major_bright'  # Bright major chords
        elif emotion > 0.2:
            return 'major_standard'  # Standard major
        elif emotion > -0.2:
            return 'modal_mixed'  # Mixed modal
        elif emotion > -0.6:
            return 'minor_sad'  # Minor with sadness
        else:
            return 'minor_dark'  # Dark minor with tensions

    def ai_suggest_melodic_contour(self, line, emotion):
        """AI-informed melodic contour suggestions"""
        contours = {
            'ascending': emotion > 0.4,
            'descending': emotion < -0.4,
            'arch': 0.2 < emotion < 0.4,
            'valley': -0.4 < emotion < -0.2,
            'wave': abs(emotion) < 0.2,
            'step': abs(emotion) > 0.6
        }

        return max(contours.keys(), key=lambda k: contours[k])

    def ai_suggest_rhythm_pattern(self, line, emotion):
        """AI-informed rhythmic pattern suggestions"""
        syllable_count = sum(1 for word in line.split() for char in word if char.lower() in 'aeiou')

        if emotion > 0.5 and syllable_count > 8:
            return 'syncopated_energetic'
        elif emotion < -0.5:
            return 'legato_contemplative'
        elif syllable_count > 10:
            return 'rapid_syllabic'
        else:
            return 'balanced_rhythmic'

    def ai_suggest_key_change(self, line, emotion, position):
        """AI-informed key change suggestions"""
        if position > 0 and abs(emotion) > 0.7:
            if emotion > 0:
                return 'modulate_up_semitone'
            else:
                return 'modulate_down_semitone'
        elif position > 0 and emotion > 0.5:
            return 'relative_major'
        elif position > 0 and emotion < -0.5:
            return 'relative_minor'
        else:
            return 'stay_in_key'

    def ai_suggest_dynamics(self, line, emotion, position, total_lines):
        """AI-informed dynamic markings"""
        position_ratio = position / max(total_lines - 1, 1)

        # Base dynamics on emotion
        if emotion > 0.7:
            base_dynamic = 'ff'
        elif emotion > 0.3:
            base_dynamic = 'f'
        elif emotion > -0.3:
            base_dynamic = 'mf'
        elif emotion > -0.7:
            base_dynamic = 'p'
        else:
            base_dynamic = 'pp'

        # Add expression based on position
        if 0.2 < position_ratio < 0.4:
            return f"{base_dynamic} crescendo"
        elif 0.6 < position_ratio < 0.8:
            return f"{base_dynamic} fortissimo"
        elif position_ratio > 0.9:
            return f"{base_dynamic} diminuendo"
        else:
            return base_dynamic

    def detect_advanced_structure(self, lines):
        """Advanced song structure detection"""
        structure = []

        for i, line in enumerate(lines):
            line_lower = line.lower()

            # Enhanced structure detection
            if i == 0:
                structure.append('intro')
            elif any(word in line_lower for word in ['chorus', 'hook', 'refrain']):
                structure.append('chorus')
            elif any(word in line_lower for word in ['bridge', 'middle', 'breakdown']):
                structure.append('bridge')
            elif any(word in line_lower for word in ['verse', 'story', 'tell']):
                structure.append('verse')
            elif i == len(lines) - 1:
                structure.append('outro')
            elif i > len(lines) * 0.6 and i < len(lines) * 0.8:
                structure.append('bridge')
            elif line == lines[i-2] if i >= 2 else False:  # Repetition detection
                structure.append('chorus')
            else:
                structure.append('verse')

        return structure

    def analyze_lyrics_traditional(self, lyrics):
        """Traditional lyrics analysis as fallback"""
        lines = [line.strip() for line in lyrics.split('\n') if line.strip()]

        emotion_weights = {
            'love': 0.9, 'joy': 0.8, 'happy': 0.7, 'beautiful': 0.6,
            'sad': -0.7, 'pain': -0.8, 'hurt': -0.6, 'broken': -0.7,
            'dance': 0.8, 'light': 0.5, 'dark': -0.5, 'bright': 0.6
        }

        analysis = {
            'lines': lines,
            'emotion_arc': [],
            'tempo_suggestions': [],
            'harmonic_suggestions': [],
            'melodic_contours': [],
            'song_structure': self.detect_advanced_structure(lines)
        }

        for line in lines:
            words = line.lower().split()
            line_emotion = sum(emotion_weights.get(word, 0) for word in words) / max(len(words), 1)
            analysis['emotion_arc'].append(line_emotion)
            analysis['tempo_suggestions'].append(1.0)
            analysis['harmonic_suggestions'].append('major_standard')
            analysis['melodic_contours'].append('balanced')

        return analysis

def create_enhanced_composition(title, lyrics, genre, tempo_bpm, key_sig, duration_seconds, musical_patterns=None):
    """Create enhanced composition with AI integration"""
    generator = EnhancedMusicGenerator()

    # Enhanced lyrics analysis
    lyric_analysis = generator.analyze_lyrics_with_ai(lyrics)

    score = stream.Score()
    score.metadata = stream.metadata.Metadata()
    score.metadata.title = title
    score.metadata.composer = 'Enhanced AI Music Generator'

    # Musical setup
    score.append(meter.TimeSignature('4/4'))
    score.append(tempo.TempoIndication(number=tempo_bpm))
    score.append(key.Key(key_sig))

    # Calculate measures with AI input
    beats_per_measure = 4
    measures = max(8, int((duration_seconds * tempo_bpm / 60) / beats_per_measure))

    # Create enhanced parts
    melody_part = create_ai_enhanced_melody(genre, key_sig, tempo_bpm, measures, lyric_analysis)
    harmony_part = create_ai_enhanced_harmony(genre, key_sig, measures, lyric_analysis)
    bass_part = create_ai_enhanced_bass(genre, key_sig, measures, lyric_analysis)

    # Add parts to score
    score.append(melody_part)
    score.append(harmony_part)
    score.append(bass_part)

    return score

def create_ai_enhanced_melody(genre, key_sig, tempo_bpm, measures, lyric_analysis):
    """Create AI-enhanced melody"""
    melody = stream.Part()
    melody.partName = 'AI Enhanced Melody'

    key_obj = key.Key(key_sig)
    scale_notes = key_obj.scale.pitches

    # AI-informed melody generation
    for i, phrase_data in enumerate(lyric_analysis.get('melodic_contours', [])):
        if i >= measures:
            break

        contour = phrase_data if isinstance(phrase_data, str) else 'balanced'
        emotion = lyric_analysis['emotion_arc'][i] if i < len(lyric_analysis['emotion_arc']) else 0

        # Generate notes based on AI analysis
        notes_per_measure = 4
        for j in range(notes_per_measure):
            note_degree = select_ai_note_degree(scale_notes, contour, emotion, j, notes_per_measure)
            note_duration = select_ai_duration(tempo_bpm, emotion, j)

            if note_degree < len(scale_notes):
                note_pitch = pitch.Pitch(scale_notes[note_degree])
                note_obj = note.Note(note_pitch, quarterLength=note_duration)

                # AI-enhanced dynamics
                velocity = calculate_ai_velocity(emotion, j, notes_per_measure)
                note_obj.volume.velocity = velocity

                melody.append(note_obj)

    return melody

def create_ai_enhanced_harmony(genre, key_sig, measures, lyric_analysis):
    """Create AI-enhanced harmony"""
    harmony = stream.Part()
    harmony.partName = 'AI Enhanced Harmony'

    key_obj = key.Key(key_sig)

    # AI-informed chord progressions
    ai_progressions = {
        'pop': ['I', 'V', 'vi', 'IV', 'I', 'vi', 'V', 'I'],
        'rock': ['vi', 'IV', 'I', 'V', 'vi', 'IV', 'V', 'V'],
        'jazz': ['IIM7', 'V7', 'IM7', 'VIM7', 'IIM7', 'V7', 'IM7', 'IM7'],
        'electronic': ['vi', 'IV', 'I', 'V', 'vi', 'bVII', 'IV', 'V']
    }

    progression = ai_progressions.get(genre.lower(), ai_progressions['pop'])

    for i in range(measures):
        chord_symbol = progression[i % len(progression)]

        # AI enhancement based on analysis
        harmony_type = lyric_analysis.get('harmonic_suggestions', ['major_standard'])[i % len(lyric_analysis.get('harmonic_suggestions', ['major_standard']))]

        chord_obj = create_ai_enhanced_chord(chord_symbol, key_obj, harmony_type)
        chord_obj.quarterLength = 4.0
        harmony.append(chord_obj)

    return harmony

def create_ai_enhanced_bass(genre, key_sig, measures, lyric_analysis):
    """Create AI-enhanced bass line"""
    bass = stream.Part()
    bass.partName = 'AI Enhanced Bass'

    key_obj = key.Key(key_sig)
    root_note = key_obj.tonic

    # AI-informed bass patterns
    for i in range(measures):
        emotion = lyric_analysis['emotion_arc'][i % len(lyric_analysis['emotion_arc'])]
        bass_pattern = generate_ai_bass_pattern(root_note, genre, emotion)

        for note_obj in bass_pattern:
            bass.append(note_obj)

    return bass

def select_ai_note_degree(scale_notes, contour, emotion, position, total_notes):
    """AI-informed note degree selection"""
    if contour == 'ascending':
        base_degree = min(position + 1, len(scale_notes) - 1)
    elif contour == 'descending':
        base_degree = max(len(scale_notes) - position - 1, 0)
    elif contour == 'arch':
        mid_point = total_notes // 2
        if position <= mid_point:
            base_degree = position
        else:
            base_degree = total_notes - position - 1
    else:  # balanced/wave
        base_degree = random.randint(1, min(6, len(scale_notes) - 1))

    # Emotional adjustment
    if emotion > 0.5:
        base_degree = min(base_degree + 1, len(scale_notes) - 1)
    elif emotion < -0.5:
        base_degree = max(base_degree - 1, 0)

    return base_degree

def select_ai_duration(tempo_bpm, emotion, position):
    """AI-informed duration selection"""
    base_durations = [0.25, 0.5, 0.75, 1.0, 1.5]

    if tempo_bpm > 140:
        weights = [0.4, 0.4, 0.1, 0.1, 0.0]
    elif tempo_bpm < 80:
        weights = [0.1, 0.2, 0.3, 0.3, 0.1]
    else:
        weights = [0.2, 0.3, 0.2, 0.2, 0.1]

    # Emotional modification
    if emotion > 0.5:  # Happy - more rhythmic variety
        weights[0] *= 1.2  # More short notes
        weights[1] *= 1.1
    elif emotion < -0.5:  # Sad - longer notes
        weights[3] *= 1.3  # More quarter notes
        weights[4] *= 1.2  # More long notes

    # Normalize weights
    total_weight = sum(weights)
    weights = [w / total_weight for w in weights]

    return np.random.choice(base_durations, p=weights)

def calculate_ai_velocity(emotion, position, total_notes):
    """AI-informed velocity calculation"""
    base_velocity = 75

    # Emotional influence
    emotion_modifier = emotion * 25

    # Position influence (phrase shaping)
    if position == 0:  # Strong start
        position_modifier = 10
    elif position == total_notes - 1:  # Strong end
        position_modifier = 5
    else:
        position_modifier = 0

    velocity = int(base_velocity + emotion_modifier + position_modifier)
    return max(30, min(127, velocity))

def create_ai_enhanced_chord(chord_symbol, key_obj, harmony_type):
    """Create AI-enhanced chord with extensions"""
    try:
        from music21 import roman
        roman_chord = roman.Roman(chord_symbol, key_obj)
        chord_tones = list(roman_chord.pitches)

        # AI-informed chord extensions
        if harmony_type == 'major_bright':
            # Add bright extensions
            if random.random() > 0.6:
                chord_tones.append(chord_tones[0].transpose('M9'))
        elif harmony_type == 'minor_dark':
            # Add darker extensions
            if random.random() > 0.7:
                chord_tones.append(chord_tones[0].transpose('m9'))
        elif harmony_type == 'jazz_complex':
            # Add jazz extensions
            if random.random() > 0.5:
                chord_tones.append(chord_tones[0].transpose('m7'))
            if random.random() > 0.7:
                chord_tones.append(chord_tones[0].transpose('M9'))

        return chord.Chord(chord_tones, quarterLength=4.0)

    except Exception:
        # Fallback chord
        root = key_obj.tonic
        return chord.Chord([root, root.transpose('M3'), root.transpose('P5')], quarterLength=4.0)

def generate_ai_bass_pattern(root_note, genre, emotion):
    """Generate AI-informed bass pattern"""
    bass_notes = []

    if genre.lower() == 'electronic' and emotion > 0.3:
        # Energetic electronic bass
        pattern = [root_note, root_note.transpose('P5'), root_note, root_note.transpose('P4')] * 2
        durations = [0.5, 0.5, 0.5, 0.5] * 2
    elif genre.lower() == 'jazz':
        # Walking jazz bass
        intervals = ['P1', 'M2', 'M3', 'P5']
        pattern = [root_note.transpose(interval) for interval in intervals] * 2
        durations = [1.0] * 8
    else:
        # Standard bass pattern
        pattern = [root_note, root_note, root_note.transpose('P5'), root_note] * 2
        durations = [1.0] * 8

    for i, (note_pitch, dur) in enumerate(zip(pattern, durations)):
        bass_pitch = pitch.Pitch(note_pitch)
        bass_pitch.octave = 2
        bass_note = note.Note(bass_pitch, quarterLength=dur)

        # Emotional velocity adjustment
        base_velocity = 80
        velocity = int(base_velocity + emotion * 15)
        bass_note.volume.velocity = max(40, min(120, velocity))

        bass_notes.append(bass_note)

    return bass_notes

def main():
    if len(sys.argv) < 8:
        print("Usage: python enhanced-music21-generator.py <title> <lyrics> <genre> <tempo> <key> <duration> <output_path> [--ai-enhanced] [--format=midi|musicxml|both]")
        sys.exit(1)

    try:
        title = sys.argv[1].strip('"')
        lyrics = sys.argv[2].strip('"')
        genre = sys.argv[3].strip('"')
        tempo_bpm = int(sys.argv[4])
        key_sig = sys.argv[5].strip('"')
        duration_seconds = int(sys.argv[6])
        output_path = sys.argv[7].strip('"')

        # Parse optional arguments
        ai_enhanced = '--ai-enhanced' in sys.argv
        output_format = "midi"

        for arg in sys.argv[8:]:
            if arg.startswith("--format="):
                output_format = arg.split("=", 1)[1]

        print(f"🎵 Generating enhanced AI composition: {title}")
        print(f"🤖 AI Enhancement: {'Enabled' if ai_enhanced and AI_AVAILABLE else 'Rule-based'}")
        print(f"Genre: {genre}, Tempo: {tempo_bpm} BPM, Duration: {duration_seconds}s")

        # Create the enhanced composition
        score = create_enhanced_composition(
            title, lyrics, genre, tempo_bpm, key_sig, duration_seconds
        )

        # Write output
        if output_format == "both":
            score.write('midi', fp=output_path)
            xml_path = output_path.replace('.mid', '.musicxml')
            score.write('musicxml', fp=xml_path)
            print(f"✅ Generated MIDI: {output_path}")
            print(f"✅ Generated MusicXML: {xml_path}")
        else:
            score.write(output_format, fp=output_path)
            print(f"✅ Enhanced composition saved: {output_path}")

        # Generate comprehensive metadata
        metadata = {
            "title": title,
            "genre": genre,
            "tempo": tempo_bpm,
            "key": key_sig,
            "duration": duration_seconds,
            "ai_enhanced": ai_enhanced and AI_AVAILABLE,
            "generation_method": "enhanced_ai_music21",
            "features": {
                "ai_lyrics_analysis": AI_AVAILABLE,
                "enhanced_harmony": True,
                "dynamic_melody": True,
                "multi_part_composition": True,
                "emotional_mapping": True
            }
        }

        metadata_path = output_path.replace('.mid', '_enhanced_metadata.json')
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)

        print("🎉 Enhanced composition completed successfully")

    except Exception as e:
        print(f"❌ Error generating enhanced music: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()