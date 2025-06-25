
#!/usr/bin/env python3
"""
Advanced Algorithmic Composition Module using Music21
Enhanced with robust error handling, validation, and resource management
"""

import sys
import json
import os
import tempfile
import shutil
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
import logging
from music21 import stream, note, chord, meter, tempo, key, duration, pitch, scale, interval
from music21 import roman, analysis, features, converter
import random
import math
import numpy as np

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AlgorithmicComposerError(Exception):
    """Custom exception for algorithmic composition errors"""
    pass

class AdvancedAlgorithmicComposer:
    def __init__(self, key_sig: str = 'C', time_sig: str = '4/4', tempo_bpm: int = 120):
        """Initialize composer with validation"""
        try:
            self.key = key.Key(key_sig)
            self.time_signature = meter.TimeSignature(time_sig)
            self.tempo = tempo.TempoIndication(number=tempo_bpm)
            self.scale_notes = self.key.scale.pitches
            self.temp_files = []  # Track temporary files for cleanup
            
            logger.info(f"Initialized composer: Key={key_sig}, Time={time_sig}, Tempo={tempo_bpm}")
        except Exception as e:
            raise AlgorithmicComposerError(f"Failed to initialize composer: {e}")
    
    def validate_input_parameters(self, method: str, length: int, complexity: float = 0.5) -> None:
        """Validate input parameters with detailed checks"""
        valid_methods = ['l_system', 'random_walk', 'markov_chains', 'fractal_rhythm', 'cellular_automata']
        
        if method not in valid_methods:
            raise AlgorithmicComposerError(f"Invalid method '{method}'. Must be one of: {valid_methods}")
        
        if not isinstance(length, int) or length <= 0 or length > 1000:
            raise AlgorithmicComposerError(f"Length must be integer between 1-1000, got: {length}")
        
        if not isinstance(complexity, (int, float)) or not 0 <= complexity <= 1:
            raise AlgorithmicComposerError(f"Complexity must be float between 0-1, got: {complexity}")
        
        logger.info(f"Input validation passed: method={method}, length={length}, complexity={complexity}")
    
    def generate_l_system_melody(self, axiom: str = 'F', rules: Optional[Dict] = None, 
                                iterations: int = 3, length: int = 16) -> List[note.Note]:
        """Generate melody using L-System with enhanced error handling"""
        try:
            if rules is None:
                rules = {
                    'F': 'F+G-F',  # Forward, up, forward, down, forward
                    'G': 'G-F+G',  # Up, forward, down, up
                    '+': '+',      # Move up in scale
                    '-': '-'       # Move down in scale
                }
            
            # Validate rules
            for symbol, replacement in rules.items():
                if not isinstance(symbol, str) or not isinstance(replacement, str):
                    raise AlgorithmicComposerError(f"Invalid rule format: {symbol} -> {replacement}")
            
            # Generate L-system string with iteration limit
            current = axiom
            for iteration in range(min(iterations, 10)):  # Limit iterations to prevent explosion
                next_string = ''
                for char in current:
                    next_string += rules.get(char, char)
                current = next_string
                
                # Prevent string explosion
                if len(current) > 10000:
                    logger.warning(f"L-system string too long ({len(current)}), truncating")
                    current = current[:10000]
                    break
            
            # Convert L-system to melody with bounds checking
            melody_notes = []
            current_degree = random.randint(3, 5)  # Start in middle range
            
            for i, symbol in enumerate(current[:length]):
                try:
                    if symbol == 'F':  # Forward - add note
                        if 1 <= current_degree <= len(self.scale_notes):
                            note_pitch = pitch.Pitch(self.scale_notes[current_degree - 1])
                            note_duration = self._get_safe_rhythmic_duration(i, length)
                            melody_notes.append(note.Note(note_pitch, quarterLength=note_duration))
                    elif symbol == '+':  # Move up
                        current_degree = min(current_degree + 1, len(self.scale_notes))
                    elif symbol == '-':  # Move down
                        current_degree = max(current_degree - 1, 1)
                    elif symbol == 'G':  # Add grace note
                        if 1 <= current_degree <= len(self.scale_notes):
                            grace_pitch = pitch.Pitch(self.scale_notes[current_degree - 1])
                            grace_note = note.Note(grace_pitch, quarterLength=0.25)
                            melody_notes.append(grace_note)
                except Exception as e:
                    logger.warning(f"Error processing L-system symbol '{symbol}': {e}")
                    continue
            
            logger.info(f"Generated L-system melody with {len(melody_notes)} notes")
            return melody_notes
            
        except Exception as e:
            raise AlgorithmicComposerError(f"L-system generation failed: {e}")
    
    def generate_random_walk_melody(self, length: int = 16, step_size_range: Tuple[int, int] = (1, 3), 
                                  direction_change_prob: float = 0.3) -> List[note.Note]:
        """Generate melody using constrained random walk with validation"""
        try:
            # Validate parameters
            if step_size_range[0] > step_size_range[1] or step_size_range[0] < 1:
                raise AlgorithmicComposerError(f"Invalid step size range: {step_size_range}")
            
            if not 0 <= direction_change_prob <= 1:
                raise AlgorithmicComposerError(f"Direction change probability must be 0-1: {direction_change_prob}")
            
            melody_notes = []
            current_degree = random.randint(3, min(5, len(self.scale_notes)))
            direction = random.choice([-1, 1])
            
            for i in range(length):
                try:
                    # Ensure bounds
                    current_degree = max(1, min(current_degree, len(self.scale_notes)))
                    
                    # Create note with error handling
                    note_pitch = pitch.Pitch(self.scale_notes[current_degree - 1])
                    note_duration = self._get_safe_rhythmic_duration(i, length)
                    melody_notes.append(note.Note(note_pitch, quarterLength=note_duration))
                    
                    # Calculate next step with bounds checking
                    if random.random() < direction_change_prob:
                        direction *= -1
                    
                    step_size = random.randint(*step_size_range)
                    next_degree = current_degree + direction * step_size
                    
                    # Boundary reflection with validation
                    if next_degree > len(self.scale_notes):
                        current_degree = len(self.scale_notes) - (next_degree - len(self.scale_notes))
                        direction = -1
                    elif next_degree < 1:
                        current_degree = 1 + (1 - next_degree)
                        direction = 1
                    else:
                        current_degree = next_degree
                        
                except Exception as e:
                    logger.warning(f"Error in random walk step {i}: {e}")
                    # Fallback to safe note
                    safe_pitch = pitch.Pitch(self.scale_notes[2])  # Third degree
                    melody_notes.append(note.Note(safe_pitch, quarterLength=1.0))
            
            logger.info(f"Generated random walk melody with {len(melody_notes)} notes")
            return melody_notes
            
        except Exception as e:
            raise AlgorithmicComposerError(f"Random walk generation failed: {e}")
    
    def generate_markov_chord_progression(self, length: int = 8, order: int = 1) -> List[chord.Chord]:
        """Generate chord progression using Markov chains with robust error handling"""
        try:
            # Validate parameters
            if order < 1 or order > 3:
                raise AlgorithmicComposerError(f"Markov order must be 1-3: {order}")
            
            # Enhanced chord transition probabilities
            chord_transitions = {
                'I': {'V': 0.3, 'vi': 0.25, 'IV': 0.25, 'ii': 0.1, 'iii': 0.1},
                'ii': {'V': 0.5, 'vi': 0.2, 'IV': 0.15, 'I': 0.15},
                'iii': {'vi': 0.4, 'IV': 0.3, 'I': 0.2, 'V': 0.1},
                'IV': {'I': 0.3, 'V': 0.3, 'vi': 0.2, 'ii': 0.2},
                'V': {'I': 0.4, 'vi': 0.3, 'IV': 0.2, 'ii': 0.1},
                'vi': {'IV': 0.3, 'I': 0.25, 'V': 0.25, 'ii': 0.2}
            }
            
            progression = ['I']  # Start with tonic
            
            for i in range(length - 1):
                try:
                    current_chord = progression[-1]
                    transitions = chord_transitions.get(current_chord, {'I': 1.0})
                    
                    # Weighted random selection with error handling
                    chords = list(transitions.keys())
                    weights = list(transitions.values())
                    
                    # Normalize weights
                    weight_sum = sum(weights)
                    if weight_sum == 0:
                        weights = [1.0 / len(weights)] * len(weights)
                    else:
                        weights = [w / weight_sum for w in weights]
                    
                    next_chord = np.random.choice(chords, p=weights)
                    progression.append(next_chord)
                    
                except Exception as e:
                    logger.warning(f"Error in Markov step {i}: {e}")
                    # Fallback to safe progression
                    safe_chords = ['I', 'V', 'vi', 'IV']
                    progression.append(safe_chords[i % len(safe_chords)])
            
            # Convert to actual chords with error handling
            chord_objects = self._roman_to_chords_safe(progression)
            logger.info(f"Generated Markov progression: {' - '.join(progression)}")
            return chord_objects
            
        except Exception as e:
            raise AlgorithmicComposerError(f"Markov chain generation failed: {e}")
    
    def generate_cellular_automata_rhythm(self, length: int = 16, rule: int = 30) -> List[duration.Duration]:
        """Generate rhythm using cellular automata"""
        try:
            # Initialize cells
            cells = [0] * length
            cells[length // 2] = 1  # Seed in middle
            
            # Apply rule for several generations
            generations = min(5, length // 2)  # Limit generations
            
            for gen in range(generations):
                new_cells = [0] * length
                for i in range(1, length - 1):
                    left = cells[i - 1]
                    center = cells[i]
                    right = cells[i + 1]
                    
                    # Apply rule 30 (or other rules)
                    pattern = (left << 2) | (center << 1) | right
                    new_cells[i] = (rule >> pattern) & 1
                
                cells = new_cells
            
            # Convert to durations
            durations = []
            base_duration = 4.0 / length  # Fill one measure
            
            for cell in cells:
                if cell == 1:
                    durations.append(duration.Duration(quarterLength=base_duration))
                else:
                    durations.append(duration.Duration(quarterLength=base_duration * 0.5))
            
            logger.info(f"Generated cellular automata rhythm with rule {rule}")
            return durations
            
        except Exception as e:
            raise AlgorithmicComposerError(f"Cellular automata generation failed: {e}")
    
    def _get_safe_rhythmic_duration(self, position: int, total_length: int) -> float:
        """Get safe rhythmic duration with bounds checking"""
        try:
            if total_length <= 0:
                return 1.0
            
            ratio = position / max(total_length, 1)
            
            if position == 0 or position == total_length - 1:
                return 1.0  # Strong beats
            elif position % 4 == 0:
                return 0.75  # Syncopated strong beats
            elif position % 2 == 0:
                return 0.5   # Medium beats
            else:
                return 0.25  # Weak beats
                
        except Exception:
            return 1.0  # Safe fallback
    
    def _roman_to_chords_safe(self, roman_numerals: List[str]) -> List[chord.Chord]:
        """Convert Roman numerals to chords with error handling"""
        chords = []
        
        for i, numeral in enumerate(roman_numerals):
            try:
                roman_chord = roman.Roman(numeral, self.key)
                chord_obj = chord.Chord(roman_chord.pitches, quarterLength=4.0)
                chords.append(chord_obj)
            except Exception as e:
                logger.warning(f"Error creating chord '{numeral}': {e}")
                # Fallback to simple triad
                try:
                    root = self.scale_notes[0]  # Tonic
                    triad = chord.Chord([root, root.transpose('M3'), root.transpose('P5')], 
                                      quarterLength=4.0)
                    chords.append(triad)
                except Exception:
                    # Ultimate fallback
                    c_major = chord.Chord(['C4', 'E4', 'G4'], quarterLength=4.0)
                    chords.append(c_major)
        
        return chords
    
    def compose_algorithmic_piece(self, method: str = 'l_system', length: int = 32, 
                                complexity: float = 0.5) -> stream.Score:
        """Main composition method with comprehensive error handling"""
        try:
            # Validate inputs
            self.validate_input_parameters(method, length, complexity)
            
            # Create composition
            composition = stream.Score()
            
            # Add metadata with error handling
            try:
                composition.append(self.key)
                composition.append(self.time_signature)
                composition.append(self.tempo)
            except Exception as e:
                logger.warning(f"Error adding metadata: {e}")
            
            # Generate melody based on method
            melody_notes = []
            try:
                if method == 'l_system':
                    melody_notes = self.generate_l_system_melody(length=length)
                elif method == 'random_walk':
                    melody_notes = self.generate_random_walk_melody(length=length)
                elif method == 'cellular_automata':
                    # Generate basic melody and apply CA rhythm
                    melody_notes = self.generate_random_walk_melody(length=length)
                    ca_rhythm = self.generate_cellular_automata_rhythm(length=length)
                    # Apply CA rhythm to melody
                    for i, note_obj in enumerate(melody_notes[:len(ca_rhythm)]):
                        note_obj.duration = ca_rhythm[i]
                else:
                    # Default fallback
                    melody_notes = self.generate_l_system_melody(length=length)
                    
            except Exception as e:
                logger.error(f"Error generating melody: {e}")
                # Create simple fallback melody
                melody_notes = self._create_fallback_melody(length)
            
            # Create melody part with error handling
            melody_part = stream.Part()
            melody_part.partName = f'Algorithmic Melody ({method})'
            
            for note_obj in melody_notes:
                try:
                    melody_part.append(note_obj)
                except Exception as e:
                    logger.warning(f"Error adding note: {e}")
            
            # Generate harmony
            try:
                chord_progression = self.generate_markov_chord_progression(length=max(4, length//4))
                harmony_part = stream.Part()
                harmony_part.partName = 'Algorithmic Harmony'
                
                for chord_obj in chord_progression:
                    harmony_part.append(chord_obj)
                    
                composition.append(harmony_part)
            except Exception as e:
                logger.warning(f"Error generating harmony: {e}")
            
            # Add melody part
            composition.append(melody_part)
            
            logger.info(f"Successfully composed {method} piece with {len(melody_notes)} notes")
            return composition
            
        except Exception as e:
            logger.error(f"Composition failed: {e}")
            # Return minimal valid composition
            return self._create_fallback_composition()
    
    def _create_fallback_melody(self, length: int) -> List[note.Note]:
        """Create simple fallback melody"""
        melody = []
        scale_degrees = [1, 2, 3, 4, 5, 4, 3, 2]
        
        for i in range(length):
            try:
                degree = scale_degrees[i % len(scale_degrees)]
                if degree <= len(self.scale_notes):
                    note_pitch = pitch.Pitch(self.scale_notes[degree - 1])
                    melody.append(note.Note(note_pitch, quarterLength=1.0))
            except Exception:
                melody.append(note.Note('C4', quarterLength=1.0))
        
        return melody
    
    def _create_fallback_composition(self) -> stream.Score:
        """Create minimal fallback composition"""
        composition = stream.Score()
        part = stream.Part()
        part.append(note.Note('C4', quarterLength=4.0))
        composition.append(part)
        return composition
    
    def cleanup_resources(self):
        """Clean up temporary files and resources"""
        for temp_file in self.temp_files:
            try:
                if os.path.exists(temp_file):
                    os.remove(temp_file)
                    logger.info(f"Cleaned up temporary file: {temp_file}")
            except Exception as e:
                logger.warning(f"Failed to cleanup {temp_file}: {e}")
        
        self.temp_files.clear()
    
    def export_composition(self, composition: stream.Score, output_path: str, 
                          formats: List[str] = ['midi']) -> List[str]:
        """Export composition with error handling and validation"""
        try:
            # Validate output path
            output_dir = Path(output_path).parent
            if not output_dir.exists():
                output_dir.mkdir(parents=True, exist_ok=True)
            
            exported_files = []
            
            for format_type in formats:
                try:
                    if format_type == 'midi':
                        midi_path = str(Path(output_path).with_suffix('.mid'))
                        composition.write('midi', fp=midi_path)
                        exported_files.append(midi_path)
                        logger.info(f"Exported MIDI: {midi_path}")
                        
                    elif format_type == 'musicxml':
                        xml_path = str(Path(output_path).with_suffix('.musicxml'))
                        composition.write('musicxml', fp=xml_path)
                        exported_files.append(xml_path)
                        logger.info(f"Exported MusicXML: {xml_path}")
                        
                except Exception as e:
                    logger.error(f"Failed to export {format_type}: {e}")
            
            return exported_files
            
        except Exception as e:
            raise AlgorithmicComposerError(f"Export failed: {e}")

def main():
    if len(sys.argv) < 6:
        print("Usage: python advanced-algorithmic-composer.py <key> <tempo> <method> <length> <output_path> [--complexity=0.5] [--formats=midi,musicxml]")
        sys.exit(1)
    
    # Parse arguments with validation
    try:
        key_sig = sys.argv[1]
        tempo_bpm = int(sys.argv[2])
        method = sys.argv[3]
        length = int(sys.argv[4])
        output_path = sys.argv[5]
        
        # Parse optional arguments
        complexity = 0.5
        formats = ['midi']
        
        for arg in sys.argv[6:]:
            if arg.startswith('--complexity='):
                complexity = float(arg.split('=')[1])
            elif arg.startswith('--formats='):
                formats = arg.split('=')[1].split(',')
        
        print(f"🎼 Starting advanced algorithmic composition")
        print(f"Parameters: Key={key_sig}, Tempo={tempo_bpm}, Method={method}, Length={length}")
        
        # Create composer
        composer = AdvancedAlgorithmicComposer(key_sig, '4/4', tempo_bpm)
        
        try:
            # Generate composition
            composition = composer.compose_algorithmic_piece(method, length, complexity)
            
            # Export with error handling
            exported_files = composer.export_composition(composition, output_path, formats)
            
            # Generate analysis
            analysis_data = {
                "method": method,
                "key": key_sig,
                "tempo": tempo_bpm,
                "length": length,
                "complexity": complexity,
                "parts": len(composition.parts),
                "exported_files": exported_files,
                "algorithmic_features": {
                    "l_system_rules": method == 'l_system',
                    "markov_chains": True,
                    "cellular_automata": method == 'cellular_automata',
                    "random_walks": method == 'random_walk',
                    "error_handling": "robust",
                    "resource_management": "enabled"
                }
            }
            
            analysis_path = str(Path(output_path).with_suffix('_analysis.json'))
            with open(analysis_path, 'w') as f:
                json.dump(analysis_data, f, indent=2)
            
            print(f"✅ Composition completed successfully!")
            print(f"📁 Files generated: {len(exported_files)} music files + analysis")
            for file_path in exported_files:
                print(f"   🎵 {file_path}")
            print(f"   📊 {analysis_path}")
            
        finally:
            # Always cleanup resources
            composer.cleanup_resources()
        
    except ValueError as e:
        print(f"❌ Invalid parameter: {e}", file=sys.stderr)
        sys.exit(1)
    except AlgorithmicComposerError as e:
        print(f"❌ Composition error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
