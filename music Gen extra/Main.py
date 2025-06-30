
#!/usr/bin/env python3
"""
Advanced AI Music Generation System using Transformers and Music21
Integrates multiple AI models for comprehensive music generation
"""

import sys
import os
import json
import logging
import subprocess
from pathlib import Path
import tempfile
import shutil

# Core music generation
from music21 import stream, note, chord, meter, tempo, key, duration, pitch
import random
import numpy as np

# AI/ML imports with graceful fallback
try:
    import torch
    import transformers
    from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
    ML_AVAILABLE = True
    print("🤖 Advanced AI libraries loaded successfully")
except ImportError as e:
    ML_AVAILABLE = False
    print(f"⚠️  ML libraries not available: {e}. Using rule-based generation.")

# Audio processing
try:
    import librosa
    import soundfile as sf
    AUDIO_AVAILABLE = True
except ImportError:
    AUDIO_AVAILABLE = False
    print("⚠️  Audio processing libraries not available")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AdvancedMusicGenerator:
    def __init__(self):
        self.models = {}
        self.temp_files = []
        
        if ML_AVAILABLE:
            self.load_ai_models()
        
    def load_ai_models(self):
        """Load various AI models for music generation"""
        try:
            # Music generation model
            model_name = "nagayama0706/music_generation_model"
            logger.info(f"Loading music generation model: {model_name}")
            
            self.models['tokenizer'] = AutoTokenizer.from_pretrained(model_name)
            self.models['music_pipeline'] = transformers.pipeline(
                "text-generation",
                model=model_name,
                torch_dtype=torch.float16,
                device_map="auto" if torch.cuda.is_available() else None,
                trust_remote_code=True
            )
            
            # Additional models for different aspects
            self.models['text_gen'] = pipeline(
                "text-generation",
                model="gpt2",
                max_length=100,
                do_sample=True,
                temperature=0.7
            )
            
            logger.info("✅ AI models loaded successfully")
            
        except Exception as e:
            logger.error(f"❌ Error loading AI models: {e}")
            self.models = {}
    
    def generate_ai_lyrics(self, theme, genre="pop", length=100):
        """Generate lyrics using AI models"""
        if not ML_AVAILABLE or 'text_gen' not in self.models:
            return self.generate_fallback_lyrics(theme, genre)
        
        try:
            prompt = f"Write a {genre} song about {theme}:"
            
            result = self.models['text_gen'](
                prompt,
                max_new_tokens=length,
                do_sample=True,
                temperature=0.8,
                top_k=50,
                top_p=0.95,
                pad_token_id=self.models['text_gen'].tokenizer.eos_token_id
            )
            
            generated_text = result[0]['generated_text']
            lyrics = generated_text.replace(prompt, "").strip()
            
            # Clean up and format lyrics
            lyrics = self.format_lyrics(lyrics)
            
            logger.info(f"✅ Generated AI lyrics: {len(lyrics)} characters")
            return lyrics
            
        except Exception as e:
            logger.error(f"❌ AI lyrics generation failed: {e}")
            return self.generate_fallback_lyrics(theme, genre)
    
    def generate_ai_music_structure(self, lyrics, genre, tempo=120):
        """Generate music structure using AI analysis"""
        if not ML_AVAILABLE or 'music_pipeline' not in self.models:
            return self.generate_fallback_structure(lyrics, genre)
        
        try:
            # Create musical prompt
            prompt = f"Generate a {genre} song structure with tempo {tempo} BPM for these lyrics: {lyrics[:200]}..."
            
            result = self.models['music_pipeline'](
                prompt,
                max_new_tokens=256,
                do_sample=True,
                temperature=0.7,
                top_k=50,
                top_p=0.95
            )
            
            # Parse AI response into musical structure
            ai_output = result[0]["generated_text"]
            structure = self.parse_ai_music_output(ai_output, genre, tempo)
            
            logger.info("✅ Generated AI music structure")
            return structure
            
        except Exception as e:
            logger.error(f"❌ AI music structure generation failed: {e}")
            return self.generate_fallback_structure(lyrics, genre)
    
    def generate_advanced_midi(self, lyrics, genre="pop", tempo=120, key_sig="C", duration=60, title="AI Generated Song"):
        """Generate advanced MIDI using AI and Music21"""
        logger.info(f"🎵 Generating advanced MIDI: {title}")
        
        # Generate AI-enhanced structure
        music_structure = self.generate_ai_music_structure(lyrics, genre, tempo)
        
        # Create Music21 composition
        score = stream.Score()
        score.metadata = stream.metadata.Metadata()
        score.metadata.title = title
        score.metadata.composer = 'Advanced AI Music Generator'
        
        # Musical setup
        score.append(meter.TimeSignature('4/4'))
        score.append(tempo.TempoIndication(number=tempo))
        score.append(key.Key(key_sig))
        
        # Generate parts using AI-enhanced techniques
        melody_part = self.create_ai_melody(music_structure, key_sig, tempo)
        harmony_part = self.create_ai_harmony(music_structure, key_sig)
        bass_part = self.create_ai_bass(music_structure, key_sig)
        
        # Add parts to score
        score.append(melody_part)
        score.append(harmony_part)
        score.append(bass_part)
        
        return score
    
    def create_ai_melody(self, structure, key_sig, tempo):
        """Create AI-enhanced melody"""
        melody = stream.Part()
        melody.partName = 'AI Enhanced Melody'
        
        key_obj = key.Key(key_sig)
        scale_notes = key_obj.scale.pitches
        
        # AI-informed note selection
        for phrase in structure.get('phrases', []):
            phrase_emotion = phrase.get('emotion', 0.5)
            phrase_length = phrase.get('length', 8)
            
            for i in range(phrase_length):
                # AI-influenced note selection
                note_degree = self.ai_select_note_degree(scale_notes, phrase_emotion, i, phrase_length)
                note_duration = self.ai_select_duration(tempo, phrase_emotion, i)
                
                if note_degree < len(scale_notes):
                    note_pitch = pitch.Pitch(scale_notes[note_degree])
                    note_obj = note.Note(note_pitch, quarterLength=note_duration)
                    
                    # AI-enhanced dynamics
                    velocity = int(75 + phrase_emotion * 30)
                    note_obj.volume.velocity = min(127, max(30, velocity))
                    
                    melody.append(note_obj)
        
        return melody
    
    def create_ai_harmony(self, structure, key_sig):
        """Create AI-enhanced harmony"""
        harmony = stream.Part()
        harmony.partName = 'AI Enhanced Harmony'
        
        key_obj = key.Key(key_sig)
        
        # AI-suggested chord progressions
        chord_progressions = {
            'pop': ['I', 'V', 'vi', 'IV', 'I', 'V', 'I', 'I'],
            'rock': ['vi', 'IV', 'I', 'V', 'vi', 'IV', 'V', 'V'],
            'jazz': ['IIM7', 'V7', 'IM7', 'VIM7', 'IIM7', 'V7', 'IM7', 'IM7'],
            'electronic': ['vi', 'IV', 'I', 'V', 'vi', 'IV', 'I', 'V']
        }
        
        genre = structure.get('genre', 'pop')
        progression = chord_progressions.get(genre, chord_progressions['pop'])
        
        for chord_symbol in progression:
            chord_obj = self.create_enhanced_chord(chord_symbol, key_obj)
            chord_obj.quarterLength = 4.0
            harmony.append(chord_obj)
        
        return harmony
    
    def create_ai_bass(self, structure, key_sig):
        """Create AI-enhanced bass line"""
        bass = stream.Part()
        bass.partName = 'AI Enhanced Bass'
        
        key_obj = key.Key(key_sig)
        root_note = key_obj.tonic
        
        # AI-informed bass patterns
        genre = structure.get('genre', 'pop')
        bass_patterns = {
            'pop': self.create_pop_bass_pattern,
            'rock': self.create_rock_bass_pattern,
            'jazz': self.create_jazz_bass_pattern,
            'electronic': self.create_electronic_bass_pattern
        }
        
        pattern_func = bass_patterns.get(genre, bass_patterns['pop'])
        bass_notes = pattern_func(root_note)
        
        for note_obj in bass_notes:
            bass.append(note_obj)
        
        return bass
    
    def ai_select_note_degree(self, scale_notes, emotion, position, total_length):
        """AI-influenced note degree selection"""
        # Emotional mapping to scale degrees
        if emotion > 0.7:  # Very happy
            preferred_degrees = [0, 2, 4, 6]  # Major scale happy notes
        elif emotion > 0.3:  # Moderately happy
            preferred_degrees = [0, 2, 4, 5, 7]
        elif emotion < -0.3:  # Sad
            preferred_degrees = [0, 1, 3, 5, 6]  # Minor-leaning notes
        else:  # Neutral
            preferred_degrees = list(range(len(scale_notes)))
        
        # Position-based selection with some randomness
        if position == 0:  # Start strong
            return random.choice([0, 2, 4])
        elif position == total_length - 1:  # End strong
            return 0  # Tonic
        else:
            return random.choice(preferred_degrees) % len(scale_notes)
    
    def ai_select_duration(self, tempo, emotion, position):
        """AI-influenced duration selection"""
        base_durations = [0.25, 0.5, 0.75, 1.0, 1.5, 2.0]
        
        # Faster tempos favor shorter notes
        if tempo > 140:
            weights = [0.3, 0.4, 0.2, 0.1, 0.0, 0.0]
        elif tempo < 80:
            weights = [0.1, 0.2, 0.2, 0.3, 0.1, 0.1]
        else:
            weights = [0.2, 0.3, 0.2, 0.2, 0.1, 0.0]
        
        # Emotional influence
        if emotion > 0.5:  # Happy - more rhythmic variety
            weights = [w * 1.2 if i < 3 else w * 0.8 for i, w in enumerate(weights)]
        elif emotion < -0.5:  # Sad - longer, contemplative notes
            weights = [w * 0.8 if i < 2 else w * 1.2 for i, w in enumerate(weights)]
        
        # Normalize weights
        total_weight = sum(weights)
        weights = [w / total_weight for w in weights]
        
        return np.random.choice(base_durations, p=weights)
    
    def create_enhanced_chord(self, chord_symbol, key_obj):
        """Create enhanced chord with extensions"""
        try:
            from music21 import roman
            roman_chord = roman.Roman(chord_symbol, key_obj)
            
            # Add jazz extensions for certain chord types
            chord_pitches = list(roman_chord.pitches)
            
            if '7' in chord_symbol:
                # Already has 7th
                pass
            elif random.random() > 0.7:  # 30% chance to add 7th
                seventh = chord_pitches[0].transpose('m7')
                chord_pitches.append(seventh)
            
            return chord.Chord(chord_pitches, quarterLength=4.0)
            
        except Exception:
            # Fallback to simple triad
            root = key_obj.tonic
            return chord.Chord([root, root.transpose('M3'), root.transpose('P5')], quarterLength=4.0)
    
    def create_pop_bass_pattern(self, root_note):
        """Create pop-style bass pattern"""
        bass_notes = []
        pattern = [root_note, root_note, root_note.transpose('P5'), root_note] * 2
        
        for note_pitch in pattern:
            bass_pitch = pitch.Pitch(note_pitch)
            bass_pitch.octave = 2
            bass_note = note.Note(bass_pitch, quarterLength=1.0)
            bass_note.volume.velocity = 80
            bass_notes.append(bass_note)
        
        return bass_notes
    
    def create_rock_bass_pattern(self, root_note):
        """Create rock-style bass pattern"""
        bass_notes = []
        pattern = [root_note] * 4 + [root_note.transpose('P5')] * 2 + [root_note] * 2
        
        for note_pitch in pattern:
            bass_pitch = pitch.Pitch(note_pitch)
            bass_pitch.octave = 2
            bass_note = note.Note(bass_pitch, quarterLength=0.5)
            bass_note.volume.velocity = 95
            bass_notes.append(bass_note)
        
        return bass_notes
    
    def create_jazz_bass_pattern(self, root_note):
        """Create jazz walking bass pattern"""
        bass_notes = []
        intervals = ['P1', 'M2', 'M3', 'P5', 'M6', 'M7', 'P8']
        
        for i in range(8):
            interval = random.choice(intervals)
            bass_pitch = pitch.Pitch(root_note.transpose(interval))
            bass_pitch.octave = 2
            bass_note = note.Note(bass_pitch, quarterLength=1.0)
            bass_note.volume.velocity = 70
            bass_notes.append(bass_note)
        
        return bass_notes
    
    def create_electronic_bass_pattern(self, root_note):
        """Create electronic-style bass pattern"""
        bass_notes = []
        # Syncopated electronic pattern
        durations = [0.75, 0.25, 0.5, 0.5, 1.0, 0.5, 0.5]
        
        for i, dur in enumerate(durations):
            if i % 3 == 0:
                note_pitch = root_note.transpose('P5')
            else:
                note_pitch = root_note
                
            bass_pitch = pitch.Pitch(note_pitch)
            bass_pitch.octave = 1  # Very low for electronic
            bass_note = note.Note(bass_pitch, quarterLength=dur)
            bass_note.volume.velocity = 90
            bass_notes.append(bass_note)
        
        return bass_notes
    
    def parse_ai_music_output(self, ai_output, genre, tempo):
        """Parse AI output into musical structure"""
        # Simplified parsing - in production, this would be more sophisticated
        structure = {
            'genre': genre,
            'tempo': tempo,
            'phrases': []
        }
        
        # Create phrases based on AI output length and content
        num_phrases = min(8, max(4, len(ai_output) // 50))
        
        for i in range(num_phrases):
            phrase_emotion = random.uniform(-0.5, 0.8)  # Slight positive bias
            phrase_length = random.randint(4, 8)
            
            structure['phrases'].append({
                'emotion': phrase_emotion,
                'length': phrase_length,
                'section': 'verse' if i % 2 == 0 else 'chorus'
            })
        
        return structure
    
    def generate_fallback_lyrics(self, theme, genre):
        """Fallback lyrics generation"""
        templates = {
            'pop': [
                f"I'm thinking about {theme} today\nIt makes me feel so alive\nEverything's gonna be okay\nThis feeling will help me thrive",
                f"Dancing through the night with {theme}\nNothing else matters now\nThis moment feels so right\nI'll make it through somehow"
            ],
            'rock': [
                f"Break down the walls of {theme}\nFight for what you believe\nNever back down, never fall\nIn yourself you must believe",
                f"Thunder and lightning strike\n{theme} burning bright\nStand up and make your mark\nShine your inner light"
            ],
            'jazz': [
                f"Smooth like silk, {theme} flows\nThrough the midnight air\nEvery note the music knows\nTakes away my care",
                f"Blue notes dancing in the night\n{theme} sets the mood\nEverything will be alright\nIn this jazz attitude"
            ]
        }
        
        genre_templates = templates.get(genre, templates['pop'])
        return random.choice(genre_templates)
    
    def generate_fallback_structure(self, lyrics, genre):
        """Fallback structure generation"""
        return {
            'genre': genre,
            'tempo': 120,
            'phrases': [
                {'emotion': 0.5, 'length': 8, 'section': 'verse'},
                {'emotion': 0.7, 'length': 6, 'section': 'chorus'},
                {'emotion': 0.4, 'length': 8, 'section': 'verse'},
                {'emotion': 0.8, 'length': 6, 'section': 'chorus'}
            ]
        }
    
    def format_lyrics(self, lyrics):
        """Format and clean up generated lyrics"""
        lines = lyrics.split('\n')
        formatted_lines = []
        
        for line in lines:
            line = line.strip()
            if line and len(line) > 3 and not line.startswith('['):
                formatted_lines.append(line)
        
        # Ensure we have at least some content
        if len(formatted_lines) < 4:
            formatted_lines.extend([
                "Music flows through my soul",
                "Every beat makes me whole", 
                "This song will never end",
                "The melody is my friend"
            ])
        
        return '\n'.join(formatted_lines[:16])  # Limit to 16 lines
    
    def export_to_file(self, score, output_path, format_type="midi"):
        """Export score to file with error handling"""
        try:
            if format_type == "midi":
                score.write('midi', fp=output_path)
            elif format_type == "musicxml":
                score.write('musicxml', fp=output_path)
            else:
                score.write('midi', fp=output_path)
            
            logger.info(f"✅ Exported {format_type} to: {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"❌ Export failed: {e}")
            raise
    
    def cleanup(self):
        """Clean up temporary files"""
        for temp_file in self.temp_files:
            try:
                if os.path.exists(temp_file):
                    os.remove(temp_file)
            except Exception as e:
                logger.warning(f"Failed to cleanup {temp_file}: {e}")
        self.temp_files.clear()

def main():
    """Main function for command line usage"""
    if len(sys.argv) < 6:
        print("Usage: python Main.py <title> <theme> <genre> <tempo> <output_path> [--ai-lyrics] [--duration=60]")
        print("Example: python Main.py 'My Song' 'love' 'pop' 120 'output.mid' --ai-lyrics --duration=90")
        sys.exit(1)
    
    try:
        title = sys.argv[1]
        theme = sys.argv[2]
        genre = sys.argv[3]
        tempo = int(sys.argv[4])
        output_path = sys.argv[5]
        
        # Parse optional arguments
        ai_lyrics = '--ai-lyrics' in sys.argv
        duration = 60
        for arg in sys.argv:
            if arg.startswith('--duration='):
                duration = int(arg.split('=')[1])
        
        # Initialize generator
        generator = AdvancedMusicGenerator()
        
        try:
            # Generate lyrics
            if ai_lyrics:
                print(f"🤖 Generating AI lyrics for theme: {theme}")
                lyrics = generator.generate_ai_lyrics(theme, genre)
            else:
                print(f"📝 Using fallback lyrics for theme: {theme}")
                lyrics = generator.generate_fallback_lyrics(theme, genre)
            
            print(f"Generated lyrics:\n{lyrics}\n")
            
            # Generate music
            print(f"🎵 Generating advanced music composition...")
            score = generator.generate_advanced_midi(
                lyrics=lyrics,
                genre=genre,
                tempo=tempo,
                key_sig="C",
                duration=duration,
                title=title
            )
            
            # Export to file
            generator.export_to_file(score, output_path, "midi")
            
            # Generate metadata
            metadata = {
                "title": title,
                "theme": theme,
                "genre": genre,
                "tempo": tempo,
                "duration": duration,
                "lyrics": lyrics,
                "ai_enhanced": ML_AVAILABLE,
                "generation_method": "advanced_ai_music_generator",
                "features": {
                    "ai_lyrics": ai_lyrics and ML_AVAILABLE,
                    "ai_structure": ML_AVAILABLE,
                    "music21_integration": True,
                    "multi_part_composition": True
                }
            }
            
            metadata_path = output_path.replace('.mid', '_metadata.json')
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            print(f"✅ Advanced music generation completed!")
            print(f"🎵 MIDI file: {output_path}")
            print(f"📊 Metadata: {metadata_path}")
            
        finally:
            generator.cleanup()
            
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
