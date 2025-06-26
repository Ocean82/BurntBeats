#!/usr/bin/env python3
"""
Enhanced Musical Analysis and Manipulation Module
Provides comprehensive analysis and advanced transformation capabilities
"""

import sys
import json
import random
from typing import Dict, List, Tuple, Optional, Union
from dataclasses import dataclass
from music21 import stream, note, chord, meter, tempo, key, duration, pitch, scale, interval
from music21 import analysis, roman, features, graph, corpus, converter
from music21.alpha import analysis as alpha_analysis
import numpy as np
from scipy import stats

@dataclass
class AnalysisConfig:
    """Configuration for musical analysis"""
    analyze_harmony: bool = True
    analyze_rhythm: bool = True
    analyze_melody: bool = True
    analyze_structure: bool = True
    detailed_chord_analysis: bool = False
    extended_metrics: bool = False

class MusicalAnalyzer:
    def __init__(self, config: AnalysisConfig = AnalysisConfig()):
        self.config = config
        self.analyzers = {
            'key': analysis.discrete.KrumhanslSchmuckler(),
            'meter': analysis.metrical.TimeSignatureAnalyzer(),
            'harmony': analysis.roman.RomanNumeralAnalyzer(),
            'melodic': analysis.discrete.MelodicIntervalDiversity(),
            'contour': analysis.contour.Contour()
        }

    def analyze_composition(self, composition_stream: stream.Stream) -> Dict:
        """Comprehensive analysis of musical composition with configurable options"""
        analysis_results = {
            'metadata': {
                'source': 'Enhanced Musical Analyzer',
                'version': '2.0'
            }
        }

        # Key analysis (always performed)
        analysis_results['key_analysis'] = self._analyze_key(composition_stream)

        # Optional analyses based on configuration
        if self.config.analyze_harmony:
            analysis_results['harmony'] = self.analyze_harmonic_content(composition_stream)

        if self.config.analyze_rhythm:
            analysis_results['rhythm'] = self.analyze_rhythmic_patterns(composition_stream)

        if self.config.analyze_melody:
            analysis_results['melody'] = self.analyze_melodic_content(composition_stream)

        if self.config.analyze_structure:
            analysis_results['structure'] = self.analyze_musical_structure(composition_stream)

        # Extended metrics if enabled
        if self.config.extended_metrics:
            analysis_results['extended_metrics'] = self._calculate_extended_metrics(composition_stream)

        return analysis_results

    def _analyze_key(self, composition_stream: stream.Stream) -> Dict:
        """Internal method for key analysis with enhanced error handling"""
        try:
            detected_key = self.analyzers['key'].getSolution(composition_stream)
            return {
                'detected_key': str(detected_key),
                'confidence': float(detected_key.correlationCoefficient) if hasattr(detected_key, 'correlationCoefficient') else 0.8,
                'alternate_keys': self._find_alternate_keys(composition_stream)
            }
        except Exception as e:
            return {
                'detected_key': 'C major',
                'confidence': 0.5,
                'error': str(e)
            }

    def _find_alternate_keys(self, composition_stream: stream.Stream) -> List[Dict]:
        """Find possible alternate key interpretations"""
        try:
            key_analysis = analysis.windowed.KeyAnalysis(composition_stream)
            return [
                {
                    'key': str(alt_key),
                    'confidence': float(alt_key.correlationCoefficient),
                    'measure_range': (alt_key.measureStart, alt_key.measureEnd)
                }
                for alt_key in key_analysis.alternateInterpretations[:3]  # Top 3 alternatives
            ]
        except:
            return []

    def analyze_harmonic_content(self, composition_stream: stream.Stream) -> Dict:
        """Enhanced harmonic content analysis with roman numeral analysis"""
        chords_found = []
        chord_qualities = {}
        roman_numerals = []

        for element in composition_stream.flat:
            if isinstance(element, chord.Chord):
                chord_symbol = element.pitchedCommonName
                chords_found.append(chord_symbol)

                # Enhanced chord quality analysis
                quality = self._get_enhanced_chord_quality(element)
                chord_qualities[chord_symbol] = quality

                # Roman numeral analysis if detailed
                if self.config.detailed_chord_analysis:
                    try:
                        rn = roman.romanNumeralFromChord(element, composition_stream.analyze('key'))
                        roman_numerals.append({
                            'roman': str(rn),
                            'figure': rn.figure,
                            'function': rn.function
                        })
                    except:
                        pass

        # Enhanced progression analysis
        progression_analysis = self._analyze_progressions(chords_found)

        return {
            'chord_sequence': chords_found,
            'chord_qualities': chord_qualities,
            'roman_numerals': roman_numerals if self.config.detailed_chord_analysis else None,
            'progression_analysis': progression_analysis,
            'harmonic_rhythm': len(chords_found),
            'unique_chords': len(set(chords_found)),
            'cadence_points': self._find_cadence_points(composition_stream)
        }

    def _get_enhanced_chord_quality(self, chord_obj: chord.Chord) -> Dict:
        """Detailed chord quality analysis"""
        try:
            return {
                'quality': chord_obj.quality,
                'inversion': chord_obj.inversion(),
                'root': str(chord_obj.root()),
                'bass': str(chord_obj.bass()),
                'tensions': [str(p) for p in chord_obj.pitches if p not in chord_obj.tertiates]
            }
        except:
            return {'quality': 'unknown'}

    def _analyze_progressions(self, chord_sequence: List[str]) -> Dict:
        """Enhanced progression analysis with statistical measures"""
        if not chord_sequence:
            return {}

        # Calculate transition matrix
        unique_chords = sorted(set(chord_sequence))
        transition_matrix = np.zeros((len(unique_chords), len(unique_chords)))

        chord_to_idx = {ch: i for i, ch in enumerate(unique_chords)}

        for i in range(len(chord_sequence) - 1):
            current = chord_to_idx[chord_sequence[i]]
            next_chord = chord_to_idx[chord_sequence[i + 1]]
            transition_matrix[current][next_chord] += 1

        # Normalize rows to get probabilities
        row_sums = transition_matrix.sum(axis=1, keepdims=True)
        transition_matrix = np.divide(
            transition_matrix, 
            row_sums, 
            out=np.zeros_like(transition_matrix), 
            where=row_sums!=0
        )

        # Find most common progressions
        common_progressions = []
        for i in range(transition_matrix.shape[0]):
            for j in range(transition_matrix.shape[1]):
                if transition_matrix[i][j] > 0.3:  # Threshold for significant transitions
                    common_progressions.append({
                        'from': unique_chords[i],
                        'to': unique_chords[j],
                        'probability': float(transition_matrix[i][j]),
                        'count': int(transition_matrix[i][j] * row_sums[i][0])
                    })

        return {
            'transition_matrix': transition_matrix.tolist(),
            'common_progressions': sorted(
                common_progressions, 
                key=lambda x: x['probability'], 
                reverse=True
            )[:10],  # Top 10 progressions
            'entropy': float(stats.entropy(transition_matrix.flatten()))
        }

    def _find_cadence_points(self, composition_stream: stream.Stream) -> List[Dict]:
        """Identify cadence points in the composition"""
        try:
            cadences = analysis.cadence.detectCadences(composition_stream)
            return [
                {
                    'type': cadence.type,
                    'measure': cadence.measureNumber,
                    'strength': cadence.strength,
                    'chords': [str(c) for c in cadence.chords]
                }
                for cadence in cadences
            ]
        except:
            return []

    def analyze_rhythmic_patterns(self, composition_stream: stream.Stream) -> Dict:
        """Enhanced rhythmic analysis with pattern recognition"""
        durations = []
        onset_times = []
        current_time = 0.0

        for element in composition_stream.flat.notesAndRests:
            if hasattr(element, 'quarterLength'):
                durations.append(element.quarterLength)
                onset_times.append(current_time)
                current_time += element.quarterLength

        # Calculate advanced rhythmic statistics
        duration_stats = {
            'mean': float(np.mean(durations)),
            'std_dev': float(np.std(durations)),
            'skewness': float(stats.skew(durations)),
            'kurtosis': float(stats.kurtosis(durations))
        }

        # Calculate syncopation score
        syncopation_score = self._calculate_syncopation(durations, onset_times)

        return {
            'total_events': len(durations),
            'unique_durations': len(set(durations)),
            'rhythmic_density': len(durations) / composition_stream.duration.quarterLength if composition_stream.duration.quarterLength > 0 else 0,
            'duration_statistics': duration_stats,
            'syncopation_score': syncopation_score,
            'common_patterns': self._identify_rhythmic_patterns(durations),
            'onset_distribution': self._analyze_onset_distribution(onset_times)
        }

    def _calculate_syncopation(self, durations: List[float], onset_times: List[float]) -> float:
        """Calculate syncopation score using Longuet-Higgins & Lee method"""
        if len(durations) < 3:
            return 0.0

        # Find beats where notes start on offbeats
        beat_positions = np.arange(0, max(onset_times) + 1, 0.25)  # Assume 4/4 for simplicity
        syncopation_count = 0

        for onset in onset_times:
            # Check if onset is not on a beat
            if not any(np.isclose(onset, beat_positions, atol=0.01)):
                syncopation_count += 1

        return syncopation_count / len(onset_times)

    def _analyze_onset_distribution(self, onset_times: List[float]) -> Dict:
        """Analyze distribution of note onsets"""
        if not onset_times:
            return {}

        # Bin onsets by beat position (0-1)
        beat_positions = [t % 1 for t in onset_times]
        hist, bin_edges = np.histogram(beat_positions, bins=8, range=(0, 1))

        return {
            'histogram': hist.tolist(),
            'bin_edges': bin_edges.tolist(),
            'preference_ratio': float(max(hist)) / min(hist) if min(hist) > 0 else float('inf')
        }

    def analyze_melodic_content(self, composition_stream: stream.Stream) -> Dict:
        """Enhanced melodic analysis with contour classification"""
        notes_found = []
        intervals = []
        contours = []

        previous_pitch = None
        for element in composition_stream.flat.notes:
            if isinstance(element, note.Note):
                current_pitch = element.pitch
                notes_found.append({
                    'pitch': str(current_pitch),
                    'midi': current_pitch.midi,
                    'duration': element.duration.quarterLength
                })

                if previous_pitch:
                    interval_obj = interval.Interval(previous_pitch, current_pitch)
                    intervals.append(interval_obj.semitones)
                    contours.append(1 if interval_obj.semitones > 0 else (-1 if interval_obj.semitones < 0 else 0))

                previous_pitch = current_pitch

        # Calculate advanced melodic statistics
        if intervals:
            interval_stats = {
                'mean': float(np.mean(np.abs(intervals))),
                'std_dev': float(np.std(intervals)),
                'direction_changes': sum(1 for i in range(len(contours)-1) if contours[i] != contours[i+1])
            }
        else:
            interval_stats = {}

        return {
            'total_notes': len(notes_found),
            'pitch_range': {
                'lowest': min(n['midi'] for n in notes_found) if notes_found else 0,
                'highest': max(n['midi'] for n in notes_found) if notes_found else 0,
                'span': (max(n['midi'] for n in notes_found) - min(n['midi'] for n in notes_found)) if notes_found else 0
            },
            'interval_statistics': interval_stats,
            'contour_analysis': self._classify_melodic_contour(contours),
            'pitch_class_distribution': self._analyze_pitch_classes(notes_found),
            'motif_analysis': self._identify_melodic_motifs(notes_found)
        }

    def _classify_melodic_contour(self, contours: List[int]) -> Dict:
        """Classify melodic contour using machine learning approach"""
        if not contours:
            return {'type': 'static'}

        from sklearn.cluster import KMeans

        try:
            # Convert contour to feature vectors (windowed approach)
            window_size = 5
            features = []
            for i in range(len(contours) - window_size + 1):
                features.append(contours[i:i+window_size])

            if len(features) > 3:  # Need enough data for clustering
                kmeans = KMeans(n_clusters=3, random_state=42)
                clusters = kmeans.fit_predict(features)

                # Analyze cluster characteristics
                contour_types = []
                for cluster_id in range(3):
                    cluster_contours = [f for f, c in zip(features, clusters) if c == cluster_id]
                    if cluster_contours:
                        avg_contour = np.mean(cluster_contours, axis=0)
                        if np.mean(avg_contour) > 0.5:
                            contour_type = 'ascending'
                        elif np.mean(avg_contour) < -0.5:
                            contour_type = 'descending'
                        else:
                            contour_type = 'wave-like'

                        contour_types.append({
                            'type': contour_type,
                            'prevalence': len(cluster_contours) / len(features),
                            'pattern': avg_contour.tolist()
                        })

                return {
                    'primary_type': max(contour_types, key=lambda x: x['prevalence'])['type'],
                    'contour_patterns': contour_types
                }
        except:
            pass

        # Fallback to simple analysis
        return self.analyze_melodic_contour(contours)

    def _analyze_pitch_classes(self, notes: List[Dict]) -> Dict:
        """Analyze distribution of pitch classes"""
        if not notes:
            return {}

        pitch_classes = [n['midi'] % 12 for n in notes]
        hist, bin_edges = np.histogram(pitch_classes, bins=12, range=(0, 12))

        return {
            'histogram': hist.tolist(),
            'most_common': int(np.argmax(hist)),
            'least_common': int(np.argmin(hist)),
            'entropy': float(stats.entropy(hist))
        }

    def _identify_melodic_motifs(self, notes: List[Dict], min_length: int = 3, max_length: int = 6) -> List[Dict]:
        """Identify recurring melodic motifs using sliding window"""
        if len(notes) < min_length:
            return []

        # Convert notes to interval sequences
        intervals = []
        for i in range(1, len(notes)):
            intervals.append(notes[i]['midi'] - notes[i-1]['midi'])

        # Find repeating patterns
        motifs = {}
        for length in range(min_length, min(max_length, len(intervals))):
            for i in range(len(intervals) - length + 1):
                pattern = tuple(intervals[i:i+length])
                motifs[pattern] = motifs.get(pattern, 0) + 1

        # Filter and return significant motifs
        significant_motifs = [
            {
                'intervals': list(pattern),
                'count': count,
                'length': len(pattern)
            }
            for pattern, count in motifs.items() 
            if count > 1  # At least 2 occurrences
        ]

        return sorted(significant_motifs, key=lambda x: (-x['count'], -x['length']))

    def analyze_musical_structure(self, composition_stream: stream.Stream) -> Dict:
        """Enhanced structural analysis with form detection"""
        measures = composition_stream.getElementsByClass('Measure')
        parts = composition_stream.getElementsByClass('Part')

        structure_info = {
            'total_measures': len(measures),
            'total_parts': len(parts),
            'duration_quarters': composition_stream.duration.quarterLength,
            'time_signatures': [],
            'key_signatures': [],
            'tempo_markings': [],
            'section_analysis': self._analyze_sections(composition_stream)
        }

        # Collect structural elements with measure numbers
        for element in composition_stream.flat:
            if isinstance(element, meter.TimeSignature):
                measure_num = element.getContextByClass('Measure').measureNumber
                structure_info['time_signatures'].append({
                    'signature': str(element),
                    'measure': measure_num
                })
            elif isinstance(element, key.KeySignature):
                measure_num = element.getContextByClass('Measure').measureNumber
                structure_info['key_signatures'].append({
                    'signature': str(element),
                    'measure': measure_num
                })
            elif isinstance(element, tempo.TempoIndication):
