
#!/usr/bin/env python3
"""
Musical Analysis and Manipulation Module
Provides advanced analysis and transformation capabilities
"""

import sys
import json
from music21 import stream, note, chord, meter, tempo, key, duration, pitch, scale
from music21 import analysis, roman, features, graph, corpus, converter
from music21.alpha import analysis as alpha_analysis
import random

class MusicalAnalyzer:
    def __init__(self):
        self.analyzers = {
            'key': analysis.discrete.KrumhanslSchmuckler(),
            'meter': analysis.metrical.TimeSignatureAnalyzer(),
            'harmony': analysis.roman.RomanNumeralAnalyzer()
        }
    
    def analyze_composition(self, composition_stream):
        """Comprehensive analysis of musical composition"""
        analysis_results = {}
        
        # Key analysis
        try:
            detected_key = self.analyzers['key'].getSolution(composition_stream)
            analysis_results['key_analysis'] = {
                'detected_key': str(detected_key),
                'confidence': detected_key.correlationCoefficient if hasattr(detected_key, 'correlationCoefficient') else 0.8
            }
        except:
            analysis_results['key_analysis'] = {'detected_key': 'C major', 'confidence': 0.5}
        
        # Harmonic analysis
        harmony_analysis = self.analyze_harmonic_content(composition_stream)
        analysis_results['harmony'] = harmony_analysis
        
        # Rhythmic analysis
        rhythm_analysis = self.analyze_rhythmic_patterns(composition_stream)
        analysis_results['rhythm'] = rhythm_analysis
        
        # Melodic analysis
        melody_analysis = self.analyze_melodic_content(composition_stream)
        analysis_results['melody'] = melody_analysis
        
        # Structural analysis
        structure_analysis = self.analyze_musical_structure(composition_stream)
        analysis_results['structure'] = structure_analysis
        
        return analysis_results
    
    def analyze_harmonic_content(self, composition_stream):
        """Analyze harmonic content and progressions"""
        chords_found = []
        chord_qualities = {}
        
        for element in composition_stream.flat:
            if isinstance(element, chord.Chord):
                chord_symbol = element.pitchedCommonName
                chords_found.append(chord_symbol)
                
                # Analyze chord quality
                quality = self.get_chord_quality(element)
                chord_qualities[chord_symbol] = quality
        
        # Analyze progression patterns
        progression_strength = self.analyze_progression_strength(chords_found)
        
        return {
            'chord_sequence': chords_found,
            'chord_qualities': chord_qualities,
            'progression_strength': progression_strength,
            'harmonic_rhythm': len(chords_found),
            'unique_chords': len(set(chords_found))
        }
    
    def analyze_rhythmic_patterns(self, composition_stream):
        """Analyze rhythmic patterns and complexity"""
        durations = []
        rhythmic_patterns = []
        
        for element in composition_stream.flat.notesAndRests:
            if hasattr(element, 'quarterLength'):
                durations.append(element.quarterLength)
        
        # Calculate rhythmic complexity
        unique_durations = len(set(durations))
        rhythmic_density = len(durations) / composition_stream.duration.quarterLength if composition_stream.duration.quarterLength > 0 else 0
        
        # Identify common patterns
        pattern_analysis = self.identify_rhythmic_patterns(durations)
        
        return {
            'total_events': len(durations),
            'unique_durations': unique_durations,
            'rhythmic_density': rhythmic_density,
            'complexity_score': unique_durations * rhythmic_density,
            'common_patterns': pattern_analysis
        }
    
    def analyze_melodic_content(self, composition_stream):
        """Analyze melodic characteristics"""
        notes_found = []
        intervals = []
        
        previous_pitch = None
        for element in composition_stream.flat.notes:
            if isinstance(element, note.Note):
                current_pitch = element.pitch
                notes_found.append(str(current_pitch))
                
                if previous_pitch:
                    interval_obj = interval.Interval(previous_pitch, current_pitch)
                    intervals.append(interval_obj.semitones)
                
                previous_pitch = current_pitch
        
        # Calculate melodic statistics
        melodic_range = max(intervals) - min(intervals) if intervals else 0
        avg_interval = sum(intervals) / len(intervals) if intervals else 0
        
        # Analyze melodic contour
        contour = self.analyze_melodic_contour(intervals)
        
        return {
            'total_notes': len(notes_found),
            'melodic_range': melodic_range,
            'average_interval': avg_interval,
            'contour_analysis': contour,
            'pitch_variety': len(set(notes_found))
        }
    
    def analyze_musical_structure(self, composition_stream):
        """Analyze overall musical structure"""
        measures = composition_stream.getElementsByClass('Measure')
        parts = composition_stream.getElementsByClass('Part')
        
        structure_info = {
            'total_measures': len(measures),
            'total_parts': len(parts),
            'duration_quarters': composition_stream.duration.quarterLength,
            'time_signatures': [],
            'key_signatures': [],
            'tempo_markings': []
        }
        
        # Collect structural elements
        for element in composition_stream.flat:
            if isinstance(element, meter.TimeSignature):
                structure_info['time_signatures'].append(str(element))
            elif isinstance(element, key.KeySignature):
                structure_info['key_signatures'].append(str(element))
            elif isinstance(element, tempo.TempoIndication):
                structure_info['tempo_markings'].append(element.number)
        
        return structure_info
    
    def get_chord_quality(self, chord_obj):
        """Determine chord quality (major, minor, diminished, etc.)"""
        try:
            return chord_obj.quality
        except:
            # Fallback analysis
            intervals = []
            root = chord_obj.root()
            for pitch_obj in chord_obj.pitches[1:]:
                interval_obj = interval.Interval(root, pitch_obj)
                intervals.append(interval_obj.semitones)
            
            if 4 in intervals and 7 in intervals:
                return 'major'
            elif 3 in intervals and 7 in intervals:
                return 'minor'
            elif 3 in intervals and 6 in intervals:
                return 'diminished'
            else:
                return 'unknown'
    
    def analyze_progression_strength(self, chord_sequence):
        """Analyze the strength of harmonic progressions"""
        strong_progressions = ['V-I', 'IV-I', 'ii-V', 'vi-IV']
        progression_score = 0
        
        for i in range(len(chord_sequence) - 1):
            current_chord = chord_sequence[i]
            next_chord = chord_sequence[i + 1]
            progression = f"{current_chord}-{next_chord}"
            
            if any(strong in progression for strong in strong_progressions):
                progression_score += 1
        
        return progression_score / max(len(chord_sequence) - 1, 1)
    
    def identify_rhythmic_patterns(self, durations):
        """Identify common rhythmic patterns"""
        patterns = {}
        
        # Look for repeated duration sequences
        for i in range(len(durations) - 2):
            pattern = tuple(durations[i:i+3])  # 3-note patterns
            patterns[pattern] = patterns.get(pattern, 0) + 1
        
        # Return most common patterns
        sorted_patterns = sorted(patterns.items(), key=lambda x: x[1], reverse=True)
        return sorted_patterns[:5]  # Top 5 patterns
    
    def analyze_melodic_contour(self, intervals):
        """Analyze melodic contour (ascending, descending, wave-like)"""
        if not intervals:
            return {'type': 'static', 'direction_changes': 0}
        
        direction_changes = 0
        ascending_count = sum(1 for i in intervals if i > 0)
        descending_count = sum(1 for i in intervals if i < 0)
        
        # Count direction changes
        for i in range(len(intervals) - 1):
            if (intervals[i] > 0) != (intervals[i + 1] > 0):
                direction_changes += 1
        
        # Determine overall contour type
        if ascending_count > descending_count * 1.5:
            contour_type = 'ascending'
        elif descending_count > ascending_count * 1.5:
            contour_type = 'descending'
        else:
            contour_type = 'wave-like'
        
        return {
            'type': contour_type,
            'direction_changes': direction_changes,
            'ascending_ratio': ascending_count / len(intervals),
            'descending_ratio': descending_count / len(intervals)
        }
    
    def manipulate_composition(self, composition_stream, transformations):
        """Apply various transformations to the composition"""
        manipulated = composition_stream.copy()
        
        for transformation in transformations:
            if transformation == 'transpose':
                manipulated = manipulated.transpose(random.randint(-5, 5))
            elif transformation == 'retrograde':
                manipulated = self.apply_retrograde(manipulated)
            elif transformation == 'inversion':
                manipulated = self.apply_inversion(manipulated)
            elif transformation == 'augmentation':
                manipulated = self.apply_augmentation(manipulated, 2.0)
            elif transformation == 'diminution':
                manipulated = self.apply_augmentation(manipulated, 0.5)
        
        return manipulated
    
    def apply_retrograde(self, composition_stream):
        """Apply retrograde (reverse) transformation"""
        reversed_stream = stream.Score()
        
        # Copy metadata
        for element in composition_stream.flat:
            if isinstance(element, (key.KeySignature, meter.TimeSignature, tempo.TempoIndication)):
                reversed_stream.append(element)
        
        # Reverse the notes
        all_notes = list(composition_stream.flat.notesAndRests)
        for note_obj in reversed(all_notes):
            reversed_stream.append(note_obj)
        
        return reversed_stream
    
    def apply_inversion(self, composition_stream):
        """Apply melodic inversion"""
        inverted_stream = composition_stream.copy()
        
        # Get the first note as reference
        first_note = None
        for element in inverted_stream.flat.notes:
            if isinstance(element, note.Note):
                first_note = element.pitch
                break
        
        if first_note:
            for element in inverted_stream.flat.notes:
                if isinstance(element, note.Note):
                    interval_from_first = interval.Interval(first_note, element.pitch)
                    inverted_interval = interval_from_first.reverse()
                    element.pitch = first_note.transpose(inverted_interval)
        
        return inverted_stream
    
    def apply_augmentation(self, composition_stream, factor):
        """Apply rhythmic augmentation/diminution"""
        augmented_stream = composition_stream.copy()
        
        for element in augmented_stream.flat.notesAndRests:
            if hasattr(element, 'quarterLength'):
                element.quarterLength *= factor
        
        return augmented_stream

def main():
    if len(sys.argv) < 3:
        print("Usage: python musical-analyzer.py <input_midi> <output_analysis>")
        sys.exit(1)
    
    try:
        input_path = sys.argv[1]
        output_path = sys.argv[2]
        
        print(f"🔬 Analyzing musical composition: {input_path}")
        
        # Load composition
        composition = converter.parse(input_path)
        
        # Analyze
        analyzer = MusicalAnalyzer()
        analysis_results = analyzer.analyze_composition(composition)
        
        # Save analysis
        with open(output_path, 'w') as f:
            json.dump(analysis_results, f, indent=2)
        
        print(f"✅ Analysis completed: {output_path}")
        
        # Print summary
        print("\n📊 Analysis Summary:")
        print(f"Key: {analysis_results['key_analysis']['detected_key']}")
        print(f"Harmonic complexity: {analysis_results['harmony']['unique_chords']} unique chords")
        print(f"Rhythmic complexity: {analysis_results['rhythm']['complexity_score']:.2f}")
        print(f"Melodic range: {analysis_results['melody']['melodic_range']} semitones")
        
    except Exception as e:
        print(f"❌ Error in musical analysis: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
