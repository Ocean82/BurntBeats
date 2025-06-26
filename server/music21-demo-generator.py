#!/usr/bin/env python3
"""
Comprehensive Music21 Demo Generator
Demonstrates all core Music21 concepts:
1. Define musical elements (Note, Chord, Rest objects)
2. Organize into structures (Stream, Part, Score)
3. Apply generative algorithms
4. Export as MIDI/MusicXML
"""

import sys
import json
import os
import logging
import traceback
from pathlib import Path
import time

# Dependency validation with detailed error handling
try:
    from music21 import stream, note, chord, meter, tempo, key, duration, pitch, scale, interval
    from music21 import roman, bar, expressions, dynamics, articulations, instrument
    from music21.midi import MidiFile
    print("✅ Music21 core modules imported successfully")
except ImportError as e:
    print(f"❌ Critical error: Music21 core modules not available: {e}")
    print("Please install music21: pip install music21")
    sys.exit(1)

try:
    import random
    import math
    import numpy as np
    print("✅ Mathematical libraries imported successfully")
except ImportError as e:
    print(f"⚠️ Some mathematical libraries missing: {e}")
    # Continue with basic functionality

# Configure logging for better debugging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('music_generation.log', mode='a')
    ]
)

class Music21DemoGenerator:
    def __init__(self, key_sig='C', time_sig='4/4', tempo_bpm=120):
        """Initialize with basic musical parameters and validation"""
        
        # Validate input parameters
        if not isinstance(key_sig, str) or len(key_sig.strip()) == 0:
            raise ValueError("Key signature must be a non-empty string")
        
        if not isinstance(time_sig, str) or len(time_sig.strip()) == 0:
            raise ValueError("Time signature must be a non-empty string")
        
        if not isinstance(tempo_bpm, (int, float)) or tempo_bpm < 40 or tempo_bpm > 300:
            raise ValueError("Tempo must be a number between 40 and 300 BPM")
        
        try:
            self.key = key.Key(key_sig.strip())
            logging.info(f"Key signature set to: {self.key}")
        except Exception as e:
            raise ValueError(f"Invalid key signature '{key_sig}': {e}")
        
        try:
            self.time_signature = meter.TimeSignature(time_sig.strip())
            logging.info(f"Time signature set to: {self.time_signature}")
        except Exception as e:
            raise ValueError(f"Invalid time signature '{time_sig}': {e}")
        
        try:
            self.tempo = tempo.TempoIndication(number=int(tempo_bpm))
            logging.info(f"Tempo set to: {self.tempo.number} BPM")
        except Exception as e:
            raise ValueError(f"Invalid tempo '{tempo_bpm}': {e}")
        
        try:
            self.scale_notes = self.key.scale.pitches
            if not self.scale_notes or len(self.scale_notes) == 0:
                raise ValueError("Scale notes are empty")
            logging.info(f"Scale notes: {[str(p) for p in self.scale_notes]}")
        except Exception as e:
            raise ValueError(f"Failed to generate scale notes: {e}")
        
        # Validate scale integrity
        if len(self.scale_notes) < 7:
            logging.warning(f"Scale has fewer than 7 notes: {len(self.scale_notes)}")
        
        logging.info("Music21DemoGenerator initialized successfully with all validations passed")
        
    def create_note_objects(self):
        """1. DEFINE MUSICAL ELEMENTS - Create Note objects with specific attributes"""
        print("🎵 Creating Note objects with specific pitch, duration, and attributes...")
        logging.info("Starting note object creation stage")
        
        notes = []
        
        try:
        
        # Create notes with specific pitches using different methods
        note1 = note.Note('C4', quarterLength=1.0)  # String notation
        note1.volume.velocity = 80  # Set velocity (volume)
        note1.articulation = articulations.Staccato()  # Add articulation
        notes.append(note1)
        
        # Using Pitch object for more control
        pitch_obj = pitch.Pitch('D4')
        pitch_obj.octave = 5  # D5
        note2 = note.Note(pitch_obj, quarterLength=0.5)
        note2.volume.velocity = 100  # Louder
        notes.append(note2)
        
        # Create note with specific MIDI number
        note3 = note.Note(midi=67, quarterLength=1.5)  # G4
        note3.volume.velocity = 60  # Softer
        note3.tie = expressions.Tie()  # Add tie
        notes.append(note3)
        
        # Create note with specific frequency
        note4 = note.Note(quarterLength=0.25)
        note4.pitch.frequency = 440.0  # A4
        note4.volume.velocity = 90
        notes.append(note4)
        
        logging.info(f"Successfully created {len(notes)} note objects")
        return notes
        
        except Exception as e:
            logging.error(f"Error creating note objects: {e}")
            raise RuntimeError(f"Note creation failed: {e}")
    
    def create_chord_objects(self):
        """1. DEFINE MUSICAL ELEMENTS - Create Chord objects"""
        print("🎹 Creating Chord objects with various voicings...")
        
        chords = []
        
        # Simple triad using note names
        chord1 = chord.Chord(['C4', 'E4', 'G4'], quarterLength=2.0)
        chord1.volume.velocity = 75
        chords.append(chord1)
        
        # Chord using Pitch objects
        pitches = [pitch.Pitch('F3'), pitch.Pitch('A3'), pitch.Pitch('C4'), pitch.Pitch('E4')]
        chord2 = chord.Chord(pitches, quarterLength=1.0)
        chord2.volume.velocity = 85
        chords.append(chord2)
        
        # Chord with specific inversion
        chord3 = chord.Chord(['G3', 'B3', 'D4'], quarterLength=1.5)
        chord3 = chord3.inversion(1)  # First inversion
        chord3.volume.velocity = 70
        chords.append(chord3)
        
        # Jazz chord with extensions
        chord4 = chord.Chord(['C3', 'E3', 'G3', 'B3', 'D4'], quarterLength=0.5)  # Cmaj7add9
        chord4.volume.velocity = 65
        chords.append(chord4)
        
        return chords
    
    def create_rest_objects(self):
        """1. DEFINE MUSICAL ELEMENTS - Create Rest objects"""
        print("🔇 Creating Rest objects with various durations...")
        
        rests = []
        
        # Quarter rest
        rest1 = note.Rest(quarterLength=1.0)
        rests.append(rest1)
        
        # Eighth rest
        rest2 = note.Rest(quarterLength=0.5)
        rests.append(rest2)
        
        # Half rest
        rest3 = note.Rest(quarterLength=2.0)
        rests.append(rest3)
        
        # Dotted quarter rest
        rest4 = note.Rest(quarterLength=1.5)
        rests.append(rest4)
        
        return rests
    
    def create_complex_durations(self):
        """Create notes with complex duration objects"""
        print("⏱️ Creating complex Duration objects...")
        
        notes = []
        
        # Dotted rhythms
        dotted_quarter = duration.Duration(quarterLength=1.5)
        note1 = note.Note('A4', duration=dotted_quarter)
        notes.append(note1)
        
        # Triplet
        triplet_eighth = duration.Duration(quarterLength=1.0/3)
        note2 = note.Note('B4', duration=triplet_eighth)
        notes.append(note2)
        
        # Compound duration
        compound_dur = duration.Duration(quarterLength=2.5)
        note3 = note.Note('C5', duration=compound_dur)
        notes.append(note3)
        
        return notes
    
    def organize_into_streams(self, musical_elements):
        """2. ORGANIZE INTO STRUCTURES - Create Stream, Part, and Score objects"""
        print("🗂️ Organizing elements into Stream structures...")
        
        # Create a Score (top-level container)
        score = stream.Score()
        
        # Add metadata
        score.metadata = stream.Metadata()
        score.metadata.title = 'Music21 Demo Composition'
        score.metadata.composer = 'Music21 Demo Generator'
        
        # Add time signature, key signature, and tempo
        score.append(self.key)
        score.append(self.time_signature)
        score.append(self.tempo)
        
        # Create separate Parts for different instruments
        melody_part = stream.Part()
        melody_part.partName = 'Melody'
        melody_part.instrument = self.get_instrument('piano')
        
        harmony_part = stream.Part()
        harmony_part.partName = 'Harmony'
        harmony_part.instrument = self.get_instrument('strings')
        
        bass_part = stream.Part()
        bass_part.partName = 'Bass'
        bass_part.instrument = self.get_instrument('bass')
        
        # Distribute elements across parts
        notes, chords, rests, complex_notes = musical_elements
        
        # Add elements to melody part
        for element in notes + complex_notes + rests[:2]:
            melody_part.append(element)
        
        # Add chords to harmony part
        for chord_obj in chords:
            harmony_part.append(chord_obj)
        
        # Create bass line
        bass_notes = self.generate_bass_line(len(chords))
        for bass_note in bass_notes:
            bass_part.append(bass_note)
        
        # Add Parts to Score
        score.append(melody_part)
        score.append(harmony_part)
        score.append(bass_part)
        
        # Create Measures for better organization
        score = self.organize_into_measures(score)
        
        return score
    
    def organize_into_measures(self, score):
        """Organize music into proper measures using Measure objects"""
        print("📏 Organizing into Measure objects...")
        
        # Create new score with measures
        measured_score = stream.Score()
        measured_score.metadata = score.metadata
        
        # Copy time signature, key, tempo
        for element in score.flat:
            if isinstance(element, (key.KeySignature, meter.TimeSignature, tempo.TempoIndication)):
                measured_score.append(element)
                break
        
        for part in score.parts:
            new_part = stream.Part()
            new_part.partName = part.partName
            new_part.instrument = part.instrument
            
            # Group elements into measures
            current_measure = stream.Measure()
            current_length = 0.0
            measure_length = self.time_signature.numerator
            
            for element in part.flat.notesAndRests:
                if current_length + element.duration.quarterLength <= measure_length:
                    current_measure.append(element)
                    current_length += element.duration.quarterLength
                else:
                    # Complete current measure and start new one
                    if current_length < measure_length:
                        # Fill with rest
                        fill_rest = note.Rest(quarterLength=measure_length - current_length)
                        current_measure.append(fill_rest)
                    
                    new_part.append(current_measure)
                    current_measure = stream.Measure()
                    current_measure.append(element)
                    current_length = element.duration.quarterLength
            
            # Add final measure
            if current_length > 0:
                if current_length < measure_length:
                    fill_rest = note.Rest(quarterLength=measure_length - current_length)
                    current_measure.append(fill_rest)
                new_part.append(current_measure)
            
            measured_score.append(new_part)
        
        return measured_score
    
    def apply_generative_algorithms(self):
        """3. APPLY GENERATIVE ALGORITHMS - Use music21 functions for pattern generation"""
        print("🤖 Applying generative algorithms and musical rules...")
        
        # Algorithm 1: Melodic sequence generation using intervals
        melody = self.generate_interval_based_melody()
        
        # Algorithm 2: Harmonic progression using Roman numeral analysis
        harmony = self.generate_roman_numeral_progression()
        
        # Algorithm 3: Rhythmic pattern generation
        rhythm_pattern = self.generate_fractal_rhythm()
        
        # Algorithm 4: Counterpoint generation
        counterpoint = self.generate_simple_counterpoint(melody)
        
        # Combine into a complete composition
        score = self.combine_generated_elements(melody, harmony, counterpoint, rhythm_pattern)
        
        return score
    
    def generate_interval_based_melody(self):
        """Generate melody using interval relationships"""
        melody_notes = []
        current_pitch = pitch.Pitch('C4')
        
        # Define interval patterns (in semitones)
        interval_patterns = [2, 2, -1, 4, -3, 1, -2, 3, -4, 2]  # Mixed intervals
        
        for interval_semitones in interval_patterns:
            # Create note with current pitch
            note_obj = note.Note(current_pitch, quarterLength=random.choice([0.5, 1.0, 1.5]))
            note_obj.volume.velocity = random.randint(60, 100)
            melody_notes.append(note_obj)
            
            # Calculate next pitch using interval
            next_pitch = current_pitch.transpose(interval_semitones)
            
            # Keep within reasonable range
            if next_pitch.midi < 60:  # Below C4
                next_pitch = next_pitch.transpose(12)  # Up an octave
            elif next_pitch.midi > 84:  # Above C6
                next_pitch = next_pitch.transpose(-12)  # Down an octave
            
            current_pitch = next_pitch
        
        return melody_notes
    
    def generate_roman_numeral_progression(self):
        """Generate harmony using Roman numeral analysis"""
        # Common chord progressions
        progressions = [
            ['I', 'V', 'vi', 'IV'],  # Pop progression
            ['ii', 'V', 'I', 'vi'],  # Jazz progression
            ['vi', 'IV', 'I', 'V'],  # Alternative pop
            ['I', 'vi', 'ii', 'V']   # Circle progression
        ]
        
        selected_progression = random.choice(progressions)
        chords = []
        
        for roman_numeral in selected_progression:
            try:
                # Create Roman numeral chord in current key
                roman_chord = roman.Roman(roman_numeral, self.key)
                
                # Convert to actual chord with proper voicing
                chord_pitches = list(roman_chord.pitches)
                
                # Add some voice leading
                if chords:  # Not the first chord
                    chord_pitches = self.apply_voice_leading(chord_pitches, chords[-1].pitches)
                
                chord_obj = chord.Chord(chord_pitches, quarterLength=4.0)
                chord_obj.volume.velocity = 70
                chords.append(chord_obj)
                
            except Exception as e:
                print(f"⚠️ Error creating chord {roman_numeral}: {e}")
                # Fallback to simple triad
                fallback_chord = chord.Chord(['C4', 'E4', 'G4'], quarterLength=4.0)
                chords.append(fallback_chord)
        
        return chords
    
    def apply_voice_leading(self, new_pitches, prev_pitches):
        """Apply voice leading principles to smooth chord transitions"""
        # Simple voice leading: minimize motion between chords
        optimized_pitches = []
        
        for new_pitch in new_pitches:
            best_octave = new_pitch.octave
            min_distance = float('inf')
            
            # Try different octaves to minimize distance from previous chord
            for octave in range(2, 7):
                test_pitch = pitch.Pitch(new_pitch.name)
                test_pitch.octave = octave
                
                # Find minimum distance to any note in previous chord
                min_chord_distance = min(
                    abs(test_pitch.midi - prev_pitch.midi) 
                    for prev_pitch in prev_pitches
                )
                
                if min_chord_distance < min_distance:
                    min_distance = min_chord_distance
                    best_octave = octave
            
            optimal_pitch = pitch.Pitch(new_pitch.name)
            optimal_pitch.octave = best_octave
            optimized_pitches.append(optimal_pitch)
        
        return optimized_pitches
    
    def generate_fractal_rhythm(self):
        """Generate rhythmic patterns using fractal subdivision"""
        # Start with basic pattern
        base_pattern = [1, 0, 1, 0]  # Strong-weak-strong-weak
        
        # Apply fractal subdivision
        for iteration in range(2):
            new_pattern = []
            for beat in base_pattern:
                if beat == 1:  # Strong beat - subdivide
                    new_pattern.extend([1, 0])
                else:  # Weak beat - keep simple
                    new_pattern.extend([0, 1])
            base_pattern = new_pattern
        
        # Convert to Duration objects
        beat_duration = 0.25  # Sixteenth notes
        durations = []
        
        for beat in base_pattern:
            if beat == 1:
                durations.append(duration.Duration(quarterLength=beat_duration))
            else:
                durations.append(duration.Duration(quarterLength=beat_duration))
        
        return durations
    
    def generate_simple_counterpoint(self, melody_notes):
        """Generate simple counterpoint against melody"""
        counterpoint_notes = []
        
        for melody_note in melody_notes:
            # Generate counterpoint using interval rules
            melody_pitch = melody_note.pitch
            
            # Prefer consonant intervals (3rd, 5th, 6th, octave)
            intervals = [-7, -5, -4, -3, 3, 4, 5, 7]  # Consonant intervals
            chosen_interval = random.choice(intervals)
            
            counter_pitch = melody_pitch.transpose(chosen_interval)
            
            # Ensure reasonable range
            if counter_pitch.midi < 48:  # Below C3
                counter_pitch = counter_pitch.transpose(12)
            elif counter_pitch.midi > 72:  # Above C5
                counter_pitch = counter_pitch.transpose(-12)
            
            counter_note = note.Note(counter_pitch, quarterLength=melody_note.duration.quarterLength)
            counter_note.volume.velocity = melody_note.volume.velocity - 20  # Softer than melody
            counterpoint_notes.append(counter_note)
        
        return counterpoint_notes
    
    def combine_generated_elements(self, melody, harmony, counterpoint, rhythm_pattern):
        """Combine all generated elements into a complete Score"""
        score = stream.Score()
        
        # Add metadata and musical setup
        score.metadata = stream.Metadata()
        score.metadata.title = 'Algorithmically Generated Composition'
        score.metadata.composer = 'Music21 Generator AI'
        
        score.append(self.key)
        score.append(self.time_signature)
        score.append(self.tempo)
        
        # Create parts
        melody_part = stream.Part()
        melody_part.partName = 'Generated Melody'
        melody_part.instrument = self.get_instrument('piano')
        
        harmony_part = stream.Part()
        harmony_part.partName = 'Generated Harmony'
        harmony_part.instrument = self.get_instrument('strings')
        
        counterpoint_part = stream.Part()
        counterpoint_part.partName = 'Generated Counterpoint'
        counterpoint_part.instrument = self.get_instrument('flute')
        
        # Add elements to parts
        for note_obj in melody:
            melody_part.append(note_obj)
        
        for chord_obj in harmony:
            harmony_part.append(chord_obj)
        
        for note_obj in counterpoint:
            counterpoint_part.append(note_obj)
        
        # Add parts to score
        score.append(melody_part)
        score.append(harmony_part)
        score.append(counterpoint_part)
        
        return score
    
    def generate_bass_line(self, num_chords):
        """Generate simple bass line"""
        bass_notes = []
        bass_root = pitch.Pitch('C2')  # Low C
        
        for i in range(num_chords):
            # Simple bass pattern: root on strong beats
            bass_note = note.Note(bass_root.transpose(i * 2), quarterLength=4.0)  # Whole note
            bass_note.volume.velocity = 80
            bass_notes.append(bass_note)
        
        return bass_notes
    
    def get_instrument(self, instrument_type):
        """Get appropriate Music21 instrument"""
        from music21 import instrument
        
        instruments = {
            'piano': instrument.Piano(),
            'strings': instrument.StringInstrument(),
            'bass': instrument.ElectricBass(),
            'flute': instrument.Flute(),
            'guitar': instrument.ElectricGuitar()
        }
        
        return instruments.get(instrument_type, instrument.Piano())
    
    def export_music(self, score, base_path, formats=['midi', 'musicxml']):
        """4. EXPORT GENERATED MUSIC - Save as MIDI and MusicXML with retry logic"""
        print("💾 Exporting generated music to files...")
        
        exported_files = []
        max_retries = 3
        
        for format_type in formats:
            success = False
            last_error = None
            
            for attempt in range(max_retries):
                try:
                    if format_type == 'midi':
                        midi_path = base_path.replace('.mid', '.mid')
                        
                        # Validate directory exists
                        os.makedirs(os.path.dirname(midi_path), exist_ok=True)
                        
                        # Validate score before export
                        if not score or len(score.parts) == 0:
                            raise ValueError("Score is empty or invalid")
                        
                        # Network/file operation with timeout simulation
                        score.write('midi', fp=midi_path)
                        
                        # Verify file was created and has content
                        if not os.path.exists(midi_path) or os.path.getsize(midi_path) == 0:
                            raise RuntimeError(f"MIDI file not created or empty: {midi_path}")
                        
                        exported_files.append(midi_path)
                        print(f"✅ MIDI exported: {midi_path} (attempt {attempt + 1})")
                        success = True
                        break
                        
                    elif format_type == 'musicxml':
                        xml_path = base_path.replace('.mid', '.musicxml')
                        
                        # Validate directory exists
                        os.makedirs(os.path.dirname(xml_path), exist_ok=True)
                        
                        # Validate score before export
                        if not score or len(score.parts) == 0:
                            raise ValueError("Score is empty or invalid")
                        
                        score.write('musicxml', fp=xml_path)
                        
                        # Verify file was created
                        if not os.path.exists(xml_path) or os.path.getsize(xml_path) == 0:
                            raise RuntimeError(f"MusicXML file not created or empty: {xml_path}")
                        
                        exported_files.append(xml_path)
                        print(f"✅ MusicXML exported: {xml_path} (attempt {attempt + 1})")
                        success = True
                        break
                        
                except (IOError, OSError) as e:
                    last_error = f"File system error: {e}"
                    logging.warning(f"Export attempt {attempt + 1} failed for {format_type}: {last_error}")
                    
                except ValueError as e:
                    last_error = f"Validation error: {e}"
                    logging.error(f"Export failed for {format_type}: {last_error}")
                    break  # Don't retry validation errors
                    
                except Exception as e:
                    last_error = f"Unexpected error: {e}"
                    logging.warning(f"Export attempt {attempt + 1} failed for {format_type}: {last_error}")
                
                if attempt < max_retries - 1:
                    wait_time = (attempt + 1) * 0.5
                    print(f"⏳ Retrying {format_type} export in {wait_time}s...")
                    time.sleep(wait_time)
            
            if not success:
                print(f"❌ {format_type} export failed after {max_retries} attempts: {last_error}")
                logging.error(f"Final export failure for {format_type}: {last_error}")
        
        return exported_files
    
    def analyze_composition(self, score):
        """Analyze the generated composition"""
        analysis_data = {
            "basic_info": {
                "title": str(score.metadata.title) if score.metadata else "Untitled",
                "parts": len(score.parts),
                "measures": len([m for m in score.flat.getElementsByClass('Measure')]),
                "total_notes": len(score.flat.notes),
                "duration_quarters": float(score.duration.quarterLength)
            },
            "musical_analysis": {},
            "structure": []
        }
        
        try:
            # Analyze key
            analyzed_key = score.analyze('key')
            analysis_data["musical_analysis"]["detected_key"] = str(analyzed_key)
            analysis_data["musical_analysis"]["key_confidence"] = float(analyzed_key.tonalCertainty())
        except:
            analysis_data["musical_analysis"]["detected_key"] = "Analysis failed"
        
        # Analyze each part
        for i, part in enumerate(score.parts):
            part_analysis = {
                "name": part.partName,
                "notes": len(part.flat.notes),
                "range": self.analyze_range(part),
                "instrument": str(part.instrument) if part.instrument else "Unknown"
            }
            analysis_data["structure"].append(part_analysis)
        
        return analysis_data
    
    def analyze_range(self, part):
        """Analyze the pitch range of a part"""
        pitches = []
        for element in part.flat.notes:
            if hasattr(element, 'pitch'):
                pitches.append(element.pitch.midi)
            elif hasattr(element, 'pitches'):  # Chord
                pitches.extend([p.midi for p in element.pitches])
        
        if pitches:
            return {
                "lowest": min(pitches),
                "highest": max(pitches),
                "range_semitones": max(pitches) - min(pitches)
            }
        return {"lowest": 0, "highest": 0, "range_semitones": 0}

def validate_and_prepare_paths(output_path):
    """Validate paths and ensure directories exist"""
    try:
        # Convert to Path object for better handling
        output_path = Path(output_path)
        
        # Ensure output directory exists
        output_dir = output_path.parent
        if not output_dir.exists():
            print(f"📁 Creating output directory: {output_dir}")
            output_dir.mkdir(parents=True, exist_ok=True)
        
        # Validate write permissions
        if not os.access(output_dir, os.W_OK):
            raise PermissionError(f"No write permission for directory: {output_dir}")
        
        # Ensure proper file extension
        if not str(output_path).endswith('.mid'):
            output_path = output_path.with_suffix('.mid')
        
        return str(output_path)
        
    except Exception as e:
        logging.error(f"Path validation failed: {e}")
        raise

def cleanup_resources(temp_files=None, temp_dirs=None):
    """Clean up temporary files and resources"""
    if temp_files:
        for temp_file in temp_files:
            try:
                if os.path.exists(temp_file):
                    os.remove(temp_file)
                    logging.info(f"🧹 Cleaned up temporary file: {temp_file}")
            except Exception as e:
                logging.warning(f"Failed to clean up {temp_file}: {e}")
    
    if temp_dirs:
        for temp_dir in temp_dirs:
            try:
                if os.path.exists(temp_dir) and os.path.isdir(temp_dir):
                    os.rmdir(temp_dir)
                    logging.info(f"🧹 Cleaned up temporary directory: {temp_dir}")
            except Exception as e:
                logging.warning(f"Failed to clean up {temp_dir}: {e}")

def main():
    temp_files = []
    temp_dirs = []
    
    if len(sys.argv) < 3:
        print("Usage: python music21-demo-generator.py <output_path> [--demo-type=<basic|advanced|generative>]")
        sys.exit(1)
    
    try:
        # Validate input data thoroughly
        raw_output_path = sys.argv[1]
        if not raw_output_path or len(raw_output_path.strip()) == 0:
            raise ValueError("Output path cannot be empty")
        
        output_path = validate_and_prepare_paths(raw_output_path.strip())
        demo_type = 'basic'
        
        # Parse demo type with validation
        for arg in sys.argv[2:]:
            if arg.startswith('--demo-type='):
                demo_type = arg.split('=')[1].strip().lower()
                if demo_type not in ['basic', 'advanced', 'generative']:
                    raise ValueError(f"Invalid demo type: {demo_type}. Must be basic, advanced, or generative")
        
        print(f"🎼 Starting Music21 Demo Generator - {demo_type} demo")
        
        # Performance tracking
        start_time = time.time()
        logging.info(f"Starting {demo_type} demo generation")
        
        # Memory usage monitoring (if psutil is available)
        try:
            import psutil
            process = psutil.Process()
            initial_memory = process.memory_info().rss / 1024 / 1024  # MB
            logging.info(f"Initial memory usage: {initial_memory:.2f} MB")
        except ImportError:
            logging.info("psutil not available - memory monitoring disabled")
            initial_memory = None
        
        # Initialize generator with error checking
        try:
            generator = Music21DemoGenerator('C', '4/4', 120)
            logging.info("Music21DemoGenerator initialized successfully")
        except Exception as e:
            logging.error(f"Failed to initialize generator: {e}")
            raise
        
        if demo_type == 'basic':
            # Basic demo: Create and organize musical elements
            print("\n=== BASIC DEMO: Musical Elements ===")
            
            # 1. Define musical elements
            notes = generator.create_note_objects()
            chords = generator.create_chord_objects()
            rests = generator.create_rest_objects()
            complex_notes = generator.create_complex_durations()
            
            # 2. Organize into structures
            score = generator.organize_into_streams([notes, chords, rests, complex_notes])
            
        elif demo_type == 'generative':
            # Generative demo: Apply algorithms
            print("\n=== GENERATIVE DEMO: Algorithmic Composition ===")
            
            # 3. Apply generative algorithms
            score = generator.apply_generative_algorithms()
            
        else:  # advanced
            # Advanced demo: Combine everything
            print("\n=== ADVANCED DEMO: Complete Workflow ===")
            
            # All steps combined
            notes = generator.create_note_objects()
            chords = generator.create_chord_objects()
            rests = generator.create_rest_objects()
            complex_notes = generator.create_complex_durations()
            
            basic_score = generator.organize_into_streams([notes, chords, rests, complex_notes])
            generative_score = generator.apply_generative_algorithms()
            
            # Combine both approaches
            combined_score = stream.Score()
            combined_score.metadata = stream.Metadata()
            combined_score.metadata.title = 'Complete Music21 Demo'
            combined_score.metadata.composer = 'Music21 Demo Generator'
            
            combined_score.append(generator.key)
            combined_score.append(generator.time_signature)
            combined_score.append(generator.tempo)
            
            # Add all parts from both scores
            for part in basic_score.parts:
                combined_score.append(part)
            for part in generative_score.parts:
                combined_score.append(part)
            
            score = combined_score
        
        # 4. Export the music
        exported_files = generator.export_music(score, output_path, ['midi', 'musicxml'])
        
        # Generate analysis
        analysis = generator.analyze_composition(score)
        analysis_path = output_path.replace('.mid', '_analysis.json')
        with open(analysis_path, 'w') as f:
            json.dump(analysis, f, indent=2)
        
        print(f"\n📊 Analysis saved: {analysis_path}")
        # Performance metrics
        end_time = time.time()
        total_time = end_time - start_time
        
        if initial_memory:
            try:
                final_memory = process.memory_info().rss / 1024 / 1024  # MB
                memory_used = final_memory - initial_memory
                logging.info(f"Final memory usage: {final_memory:.2f} MB (used: {memory_used:.2f} MB)")
            except:
                pass
        
        print(f"🎉 Music21 demo completed! Generated {len(exported_files)} files")
        print(f"🎵 Composition contains {analysis['basic_info']['total_notes']} notes across {analysis['basic_info']['parts']} parts")
        print(f"⏱️ Generation time: {total_time:.2f} seconds")
        logging.info(f"Demo completed successfully in {total_time:.2f} seconds")
        
    except ValueError as e:
        error_msg = f"Validation error: {e}"
        print(f"❌ {error_msg}", file=sys.stderr)
        logging.error(error_msg)
        sys.exit(1)
        
    except FileNotFoundError as e:
        error_msg = f"File not found: {e}"
        print(f"❌ {error_msg}", file=sys.stderr)
        logging.error(error_msg)
        sys.exit(1)
        
    except PermissionError as e:
        error_msg = f"Permission denied: {e}"
        print(f"❌ {error_msg}", file=sys.stderr)
        logging.error(error_msg)
        sys.exit(1)
        
    except ImportError as e:
        error_msg = f"Missing dependency: {e}"
        print(f"❌ {error_msg}", file=sys.stderr)
        logging.error(error_msg)
        sys.exit(1)
        
    except Exception as e:
        error_msg = f"Unexpected error in Music21 demo: {e}"
        print(f"❌ {error_msg}", file=sys.stderr)
        logging.error(f"{error_msg}\n{traceback.format_exc()}")
        sys.exit(1)
        
    finally:
        # Clean up any temporary resources
        cleanup_resources(temp_files, temp_dirs)
        logging.info("Resource cleanup completed")

if __name__ == '__main__':
    main()
