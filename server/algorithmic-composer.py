
#!/usr/bin/env python3
"""
Advanced Algorithmic Composition Module using Music21
Implements various algorithmic composition techniques including:
- L-Systems for melodic generation
- Random walks with constraints
- Markov chains for chord progressions
- Fractal-based rhythmic patterns
"""

import sys
import json
from music21 import stream, note, chord, meter, tempo, key, duration, pitch, scale, interval
from music21 import roman, analysis, features
import random
import math
import numpy as np

class AlgorithmicComposer:
    def __init__(self, key_sig='C', time_sig='4/4', tempo_bpm=120):
        self.key = key.Key(key_sig)
        self.time_signature = meter.TimeSignature(time_sig)
        self.tempo = tempo.TempoIndication(number=tempo_bpm)
        self.scale_notes = self.key.scale.pitches
        
    def generate_l_system_melody(self, axiom='F', rules=None, iterations=3, length=16):
        """Generate melody using L-System (Lindenmayer System)"""
        if rules is None:
            rules = {
                'F': 'F+G-F',  # Forward, up, forward, down, forward
                'G': 'G-F+G',  # Up, forward, down, up
                '+': '+',      # Move up in scale
                '-': '-'       # Move down in scale
            }
        
        # Generate L-system string
        current = axiom
        for _ in range(iterations):
            next_string = ''
            for char in current:
                next_string += rules.get(char, char)
            current = next_string
        
        # Convert L-system to melody
        melody_notes = []
        current_degree = 1  # Start on tonic
        
        for i, symbol in enumerate(current[:length]):
            if symbol == 'F':  # Forward - add note
                if 1 <= current_degree <= len(self.scale_notes):
                    note_pitch = pitch.Pitch(self.scale_notes[current_degree - 1])
                    note_duration = self.get_rhythmic_duration(i, length)
                    melody_notes.append(note.Note(note_pitch, quarterLength=note_duration))
            elif symbol == '+':  # Move up
                current_degree = min(current_degree + 1, len(self.scale_notes))
            elif symbol == '-':  # Move down
                current_degree = max(current_degree - 1, 1)
            elif symbol == 'G':  # Add grace note or ornament
                if 1 <= current_degree <= len(self.scale_notes):
                    grace_pitch = pitch.Pitch(self.scale_notes[current_degree - 1])
                    grace_note = note.Note(grace_pitch, quarterLength=0.25)
                    melody_notes.append(grace_note)
        
        return melody_notes
    
    def generate_random_walk_melody(self, length=16, step_size_range=(1, 3), 
                                  direction_change_prob=0.3):
        """Generate melody using constrained random walk"""
        melody_notes = []
        current_degree = random.randint(3, 5)  # Start in middle range
        direction = random.choice([-1, 1])  # Start direction
        
        for i in range(length):
            # Ensure we stay within scale bounds
            current_degree = max(1, min(current_degree, len(self.scale_notes)))
            
            # Create note
            note_pitch = pitch.Pitch(self.scale_notes[current_degree - 1])
            note_duration = self.get_rhythmic_duration(i, length)
            melody_notes.append(note.Note(note_pitch, quarterLength=note_duration))
            
            # Calculate next step
            if random.random() < direction_change_prob:
                direction *= -1  # Change direction
            
            step_size = random.randint(*step_size_range)
            current_degree += direction * step_size
            
            # Boundary reflection
            if current_degree > len(self.scale_notes):
                current_degree = len(self.scale_notes) - (current_degree - len(self.scale_notes))
                direction = -1
            elif current_degree < 1:
                current_degree = 1 + (1 - current_degree)
                direction = 1
        
        return melody_notes
    
    def generate_markov_chord_progression(self, length=8, order=1):
        """Generate chord progression using Markov chains"""
        # Define chord transition probabilities (simplified)
        chord_transitions = {
            'I': {'V': 0.3, 'vi': 0.25, 'IV': 0.25, 'ii': 0.1, 'iii': 0.1},
            'ii': {'V': 0.5, 'vi': 0.2, 'IV': 0.15, 'I': 0.15},
            'iii': {'vi': 0.4, 'IV': 0.3, 'I': 0.2, 'V': 0.1},
            'IV': {'I': 0.3, 'V': 0.3, 'vi': 0.2, 'ii': 0.2},
            'V': {'I': 0.4, 'vi': 0.3, 'IV': 0.2, 'ii': 0.1},
            'vi': {'IV': 0.3, 'I': 0.25, 'V': 0.25, 'ii': 0.2}
        }
        
        progression = ['I']  # Start with tonic
        
        for _ in range(length - 1):
            current_chord = progression[-1]
            transitions = chord_transitions.get(current_chord, {'I': 1.0})
            
            # Weighted random selection
            chords = list(transitions.keys())
            weights = list(transitions.values())
            next_chord = np.random.choice(chords, p=weights)
            progression.append(next_chord)
        
        return self.roman_to_chords(progression)
    
    def generate_fractal_rhythm(self, base_pattern=[1, 0, 1, 0], iterations=2):
        """Generate rhythmic pattern using fractal subdivision"""
        pattern = base_pattern.copy()
        
        for _ in range(iterations):
            new_pattern = []
            for beat in pattern:
                if beat == 1:  # On beat - subdivide
                    new_pattern.extend([1, 0])
                else:  # Off beat - maintain
                    new_pattern.extend([0, 0])
            pattern = new_pattern
        
        # Convert to duration objects
        durations = []
        beat_duration = 4.0 / len(pattern)  # Fill one measure
        
        for beat in pattern:
            if beat == 1:
                durations.append(duration.Duration(quarterLength=beat_duration))
            else:
                durations.append(duration.Duration(quarterLength=beat_duration))
        
        return durations
    
    def get_rhythmic_duration(self, position, total_length):
        """Get contextual rhythmic duration based on position"""
        # Create rhythmic interest with varied durations
        if position == 0 or position == total_length - 1:
            return 1.0  # Strong beats at beginning and end
        elif position % 4 == 0:
            return 0.75  # Syncopated strong beats
        elif position % 2 == 0:
            return 0.5   # Medium beats
        else:
            return 0.25  # Weak beats
    
    def roman_to_chords(self, roman_numerals):
        """Convert Roman numeral analysis to actual chords"""
        chords = []
        for numeral in roman_numerals:
            try:
                roman_chord = roman.Roman(numeral, self.key)
                chord_obj = chord.Chord(roman_chord.pitches, quarterLength=4.0)
                chords.append(chord_obj)
            except:
                # Fallback to simple triad
                root = self.scale_notes[0]  # Tonic
                triad = chord.Chord([root, root.transpose('M3'), root.transpose('P5')], 
                                  quarterLength=4.0)
                chords.append(triad)
        return chords
    
    def analyze_and_enhance_melody(self, melody_notes):
        """Analyze melody and add musical enhancements"""
        enhanced_melody = []
        
        for i, note_obj in enumerate(melody_notes):
            enhanced_melody.append(note_obj)
            
            # Add passing tones occasionally
            if i < len(melody_notes) - 1 and random.random() < 0.2:
                current_pitch = note_obj.pitch
                next_pitch = melody_notes[i + 1].pitch
                
                # Calculate interval and add passing tone
                interval_size = interval.Interval(current_pitch, next_pitch).semitones
                if abs(interval_size) > 2:  # Larger than whole step
                    passing_pitch = current_pitch.transpose(interval_size // 2)
                    passing_note = note.Note(passing_pitch, quarterLength=0.25)
                    enhanced_melody.append(passing_note)
        
        return enhanced_melody
    
    def create_harmonic_rhythm(self, chord_progression, melody_rhythm):
        """Create sophisticated harmonic rhythm patterns"""
        harmonic_parts = []
        
        for i, chord_obj in enumerate(chord_progression):
            # Vary chord voicings and inversions
            if i % 2 == 1:  # Alternate inversions
                inverted_chord = chord_obj.inversion(1)
                harmonic_parts.append(inverted_chord)
            else:
                harmonic_parts.append(chord_obj)
            
            # Add arpeggiated patterns occasionally
            if random.random() < 0.3:
                arpeggio = self.create_arpeggio_pattern(chord_obj)
                harmonic_parts.extend(arpeggio)
        
        return harmonic_parts
    
    def create_arpeggio_pattern(self, chord_obj):
        """Create arpeggio pattern from chord"""
        arpeggio_notes = []
        chord_tones = chord_obj.pitches
        
        # Create ascending arpeggio
        for tone in chord_tones:
            arp_note = note.Note(tone, quarterLength=0.25)
            arpeggio_notes.append(arp_note)
        
        return arpeggio_notes
    
    def compose_algorithmic_piece(self, method='l_system', length=32):
        """Main composition method combining all techniques"""
        composition = stream.Score()
        
        # Add metadata
        composition.append(self.key)
        composition.append(self.time_signature)
        composition.append(self.tempo)
        
        # Generate melody using specified method
        if method == 'l_system':
            melody_notes = self.generate_l_system_melody(length=length)
        elif method == 'random_walk':
            melody_notes = self.generate_random_walk_melody(length=length)
        else:
            melody_notes = self.generate_l_system_melody(length=length)
        
        # Enhance melody
        enhanced_melody = self.analyze_and_enhance_melody(melody_notes)
        
        # Create melody part
        melody_part = stream.Part()
        melody_part.partName = 'Algorithmic Melody'
        for note_obj in enhanced_melody:
            melody_part.append(note_obj)
        
        # Generate harmonic progression
        chord_progression = self.generate_markov_chord_progression(length=length//4)
        
        # Create harmony part
        harmony_part = stream.Part()
        harmony_part.partName = 'Algorithmic Harmony'
        for chord_obj in chord_progression:
            harmony_part.append(chord_obj)
        
        # Generate fractal rhythm for percussion
        fractal_rhythm = self.generate_fractal_rhythm()
        
        # Add parts to composition
        composition.append(melody_part)
        composition.append(harmony_part)
        
        return composition

def main():
    if len(sys.argv) < 6:
        print("Usage: python algorithmic-composer.py <key> <tempo> <method> <length> <output_path>")
        sys.exit(1)
    
    try:
        key_sig = sys.argv[1]
        tempo_bpm = int(sys.argv[2])
        method = sys.argv[3]  # 'l_system' or 'random_walk'
        length = int(sys.argv[4])
        output_path = sys.argv[5]
        
        print(f"🎼 Generating algorithmic composition using {method}")
        
        composer = AlgorithmicComposer(key_sig, '4/4', tempo_bpm)
        composition = composer.compose_algorithmic_piece(method, length)
        
        # Write MIDI file
        composition.write('midi', fp=output_path)
        print(f"✅ Algorithmic composition saved: {output_path}")
        
        # Generate analysis
        analysis_data = {
            "method": method,
            "key": key_sig,
            "tempo": tempo_bpm,
            "length": length,
            "parts": len(composition.parts),
            "algorithmic_features": {
                "l_system_rules": method == 'l_system',
                "markov_chains": True,
                "fractal_rhythms": True,
                "random_walks": method == 'random_walk'
            }
        }
        
        analysis_path = output_path.replace('.mid', '_analysis.json')
        with open(analysis_path, 'w') as f:
            json.dump(analysis_data, f, indent=2)
        
        print("🔬 Algorithmic analysis completed")
        
    except Exception as e:
        print(f"❌ Error in algorithmic composition: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
