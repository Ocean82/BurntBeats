#!/usr/bin/env python3
"""
Enhanced Music21 generator with lyrics-to-melody integration and data loading capabilities
"""

import sys
import json
import os
from music21 import stream, note, chord, meter, tempo, key, duration, pitch, scale, interval, bar
from music21 import converter, corpus, analysis, features
from music21.midi import MidiFile
from music21.musicxml import m21ToXml
import random
import re
import glob
from pathlib import Path
import pickle

def main():
    if len(sys.argv) < 8:
        print("Usage: python enhanced-music21-generator.py <title> <lyrics> <genre> <tempo> <key> <duration> <output_path> [--train-data=<path>] [--format=<midi|musicxml|both>]")
        sys.exit(1)

    # Parse additional arguments
    train_data_path = None
    output_format = "midi"

    for arg in sys.argv[8:]:
        if arg.startswith("--train-data="):
            train_data_path = arg.split("=", 1)[1]
        elif arg.startswith("--format="):
            output_format = arg.split("=", 1)[1]

    try:
        title = sys.argv[1].strip('"')
        lyrics = sys.argv[2].strip('"')
        genre = sys.argv[3].strip('"')
        tempo_bpm = int(sys.argv[4])
        key_sig = sys.argv[5].strip('"')
        duration_seconds = int(sys.argv[6])
        output_path = sys.argv[7].strip('"')

        print(f"🎵 Generating enhanced composition: {title}")
        print(f"Genre: {genre}, Tempo: {tempo_bpm} BPM, Duration: {duration_seconds}s")

        # Load and analyze training data if provided
        musical_patterns = None
        if train_data_path:
            print(f"🎼 Loading training data from: {train_data_path}")
            musical_patterns = load_and_analyze_training_data(train_data_path, genre)

        # Create the composition with lyrics integration and training patterns
        score = create_enhanced_composition(title, lyrics, genre, tempo_bpm, key_sig, duration_seconds, musical_patterns)

        # Generate output in specified format(s)
        output_paths = write_enhanced_output(score, output_path, output_format)

        for path in output_paths:
            print(f"✅ Enhanced music file generated: {path}")

        # Generate comprehensive metadata
        metadata = generate_enhanced_metadata(title, lyrics, genre, tempo_bpm, key_sig, duration_seconds, score)

        metadata_path = output_path.replace('.mid', '_metadata.json')
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)

        print("🎉 Enhanced composition completed successfully")

    except Exception as e:
        print(f"❌ Error generating enhanced music: {e}", file=sys.stderr)
        sys.exit(1)

def load_and_analyze_training_data(data_path, target_genre):
    """Load and analyze existing music data for pattern learning"""
    print("📊 Analyzing training data...")

    patterns = {
        'melodic_intervals': [],
        'rhythmic_patterns': [],
        'harmonic_progressions': [],
        'phrase_structures': [],
        'genre_characteristics': {}
    }

    # Support multiple file formats
    supported_formats = ['*.mid', '*.midi', '*.xml', '*.mxl', '*.krn']
    files_found = []

    data_path = Path(data_path)
    if data_path.is_file():
        files_found = [data_path]
    elif data_path.is_dir():
        for pattern in supported_formats:
            files_found.extend(data_path.glob(pattern))
            files_found.extend(data_path.glob(f"**/{pattern}"))  # Recursive search

    print(f"🎵 Found {len(files_found)} training files")

    if not files_found:
        print("⚠️  No compatible music files found in training data path")
        return patterns

    # Analyze each file
    analyzed_count = 0
    for file_path in files_found[:50]:  # Limit to first 50 files for performance
        try:
            # Load music file using music21's converter
            score = converter.parse(str(file_path))
            if score is None:
                continue

            # Extract melodic patterns
            melodic_intervals = extract_melodic_intervals(score)
            patterns['melodic_intervals'].extend(melodic_intervals)

            # Extract rhythmic patterns
            rhythmic_patterns = extract_rhythmic_patterns(score)
            patterns['rhythmic_patterns'].extend(rhythmic_patterns)

            # Extract harmonic progressions
            harmonic_progressions = extract_harmonic_progressions(score)
            patterns['harmonic_progressions'].extend(harmonic_progressions)

            # Extract phrase structures
            phrase_structures = extract_phrase_structures(score)
            patterns['phrase_structures'].extend(phrase_structures)

            analyzed_count += 1

        except Exception as e:
            print(f"⚠️  Could not analyze {file_path}: {e}")
            continue

    print(f"✅ Successfully analyzed {analyzed_count} files")

    # Process and filter patterns
    patterns = process_training_patterns(patterns, target_genre)

    # Save processed patterns for future use
    cache_path = f"training_cache_{target_genre}.pkl"
    try:
        with open(cache_path, 'wb') as f:
            pickle.dump(patterns, f)
        print(f"💾 Training patterns cached to {cache_path}")
    except Exception as e:
        print(f"⚠️  Could not cache patterns: {e}")

    return patterns

def extract_melodic_intervals(score):
    """Extract melodic interval patterns from a score"""
    intervals = []

    for part in score.parts:
        notes = part.flat.notes
        for i in range(len(notes) - 1):
            if hasattr(notes[i], 'pitch') and hasattr(notes[i+1], 'pitch'):
                interval_obj = interval.Interval(notes[i].pitch, notes[i+1].pitch)
                intervals.append({
                    'semitones': interval_obj.semitones,
                    'direction': interval_obj.direction.name,
                    'name': interval_obj.name,
                    'duration_ratio': notes[i+1].duration.quarterLength / max(notes[i].duration.quarterLength, 0.25)
                })

    return intervals

def extract_rhythmic_patterns(score):
    """Extract rhythmic patterns from a score"""
    patterns = []

    for part in score.parts:
        measures = part.getElementsByClass('Measure')
        for measure in measures:
            rhythm_pattern = []
            for element in measure.notesAndRests:
                rhythm_pattern.append({
                    'duration': element.duration.quarterLength,
                    'is_note': element.isNote,
                    'is_rest': element.isRest,
                    'is_chord': element.isChord
                })

            if rhythm_pattern:
                patterns.append(rhythm_pattern)

    return patterns

def extract_harmonic_progressions(score):
    """Extract chord progressions from a score"""
    progressions = []

    try:
        # Use music21's chord analysis
        key_obj = score.analyze('key')
        chords = score.chordify()

        chord_sequence = []
        for element in chords.flat.notes:
            if element.isChord:
                # Get roman numeral analysis
                try:
                    rn = analysis.roman.romanNumeralFromChord(element, key_obj)
                    chord_sequence.append({
                        'roman': str(rn),
                        'duration': element.duration.quarterLength,
                        'root': element.root().name,
                        'quality': element.quality
                    })
                except:
                    # Fallback to basic chord analysis
                    chord_sequence.append({
                        'roman': 'I',  # Default
                        'duration': element.duration.quarterLength,
                        'root': element.root().name if element.root() else 'C',
                        'quality': element.quality if hasattr(element, 'quality') else 'major'
                    })

        if chord_sequence:
            progressions.append(chord_sequence)

    except Exception as e:
        print(f"⚠️  Harmonic analysis failed: {e}")

    return progressions

def extract_phrase_structures(score):
    """Extract phrase and section structures from a score"""
    structures = []

    for part in score.parts:
        measures = part.getElementsByClass('Measure')
        if len(measures) > 0:
            phrase_lengths = []
            current_phrase_length = 0

            for measure in measures:
                current_phrase_length += 1
                # Simple heuristic: phrases often end with longer notes or rests
                last_element = measure.notes[-1] if measure.notes else None
                if last_element and (last_element.duration.quarterLength >= 2.0 or last_element.isRest):
                    phrase_lengths.append(current_phrase_length)
                    current_phrase_length = 0

            if current_phrase_length > 0:
                phrase_lengths.append(current_phrase_length)

            if phrase_lengths:
                structures.append({
                    'phrase_lengths': phrase_lengths,
                    'total_measures': len(measures),
                    'avg_phrase_length': sum(phrase_lengths) / len(phrase_lengths)
                })

    return structures

def process_training_patterns(patterns, target_genre):
    """Process and filter training patterns for the target genre"""
    # Filter most common intervals
    if patterns['melodic_intervals']:
        interval_counts = {}
        for interval_data in patterns['melodic_intervals']:
            key = (interval_data['semitones'], interval_data['direction'])
            interval_counts[key] = interval_counts.get(key, 0) + 1

        # Keep top 20 most common intervals
        common_intervals = sorted(interval_counts.items(), key=lambda x: x[1], reverse=True)[:20]
        patterns['common_intervals'] = [interval for interval, count in common_intervals]

    # Process rhythmic patterns
    if patterns['rhythmic_patterns']:
        # Find most common rhythm patterns (first 4 beats)
        rhythm_signatures = []
        for pattern in patterns['rhythmic_patterns']:
            if len(pattern) >= 2:
                signature = tuple(p['duration'] for p in pattern[:4])
                rhythm_signatures.append(signature)

        rhythm_counts = {}
        for sig in rhythm_signatures:
            rhythm_counts[sig] = rhythm_counts.get(sig, 0) + 1

        patterns['common_rhythms'] = sorted(rhythm_counts.items(), key=lambda x: x[1], reverse=True)[:10]

    # Process harmonic progressions
    if patterns['harmonic_progressions']:
        progression_signatures = []
        for progression in patterns['harmonic_progressions']:
            if len(progression) >= 2:
                sig = tuple(chord['roman'] for chord in progression[:4])
                progression_signatures.append(sig)

        progression_counts = {}
        for sig in progression_signatures:
            progression_counts[sig] = progression_counts.get(sig, 0) + 1

        patterns['common_progressions'] = sorted(progression_counts.items(), key=lambda x: x[1], reverse=True)[:8]

    return patterns

def write_enhanced_output(score, base_output_path, output_format):
    """Write score in multiple enhanced formats"""
    output_paths = []
    base_path = Path(base_output_path)
    base_name = base_path.stem
    base_dir = base_path.parent

    formats_to_write = []
    if output_format == "both":
        formats_to_write = ["midi", "musicxml"]
    else:
        formats_to_write = [output_format]

    for fmt in formats_to_write:
        if fmt == "midi":
            midi_path = base_dir / f"{base_name}.mid"
            try:
                # Enhanced MIDI writing with better instrument assignment
                for i, part in enumerate(score.parts):
                    if not part.instrument:
                        # Assign appropriate instruments based on part name
                        if 'melody' in part.partName.lower():
                            part.instrument = get_genre_instrument('pop', 'melody')
                        elif 'harmony' in part.partName.lower():
                            part.instrument = get_genre_instrument('pop', 'harmony')
                        elif 'bass' in part.partName.lower():
                            part.instrument = get_genre_instrument('pop', 'bass')

                score.write('midi', fp=str(midi_path))
                output_paths.append(str(midi_path))
                print(f"🎵 MIDI file written: {midi_path}")

            except Exception as e:
                print(f"❌ Error writing MIDI: {e}")

        elif fmt == "musicxml":
            xml_path = base_dir / f"{base_name}.musicxml"
            try:
                # Enhanced MusicXML output with metadata
                score.write('musicxml', fp=str(xml_path))
                output_paths.append(str(xml_path))
                print(f"🎼 MusicXML file written: {xml_path}")

            except Exception as e:
                print(f"❌ Error writing MusicXML: {e}")

    # Also create a detailed analysis file
    analysis_path = base_dir / f"{base_name}_analysis.json"
    try:
        analysis_data = generate_detailed_analysis(score)
        with open(analysis_path, 'w') as f:
            json.dump(analysis_data, f, indent=2)
        output_paths.append(str(analysis_path))
        print(f"📊 Analysis file written: {analysis_path}")
    except Exception as e:
        print(f"⚠️  Could not write analysis: {e}")

    return output_paths

def generate_detailed_analysis(score):
    """Generate detailed musical analysis of the composition"""
    analysis_data = {
        "basic_info": {
            "parts": len(score.parts),
            "measures": len(score.flat.getElementsByClass('Measure')),
            "notes": len(score.flat.notes),
            "total_duration": float(score.duration.quarterLength)
        },
        "harmonic_analysis": {},
        "melodic_analysis": {},
        "rhythmic_analysis": {}
    }

    try:
        # Key analysis
        detected_key = score.analyze('key')
        analysis_data["harmonic_analysis"]["key"] = str(detected_key)
        analysis_data["harmonic_analysis"]["key_confidence"] = float(detected_key.tonalCertainty())

        # Tempo analysis
        tempos = score.flat.getElementsByClass(tempo.TempoIndication)
        if tempos:
            analysis_data["basic_info"]["tempo"] = tempos[0].number

        # Melodic analysis for first part
        if score.parts:
            first_part = score.parts[0]
            notes = first_part.flat.notes
            if notes:
                pitches = [n.pitch.midi for n in notes if hasattr(n, 'pitch')]
                if pitches:
                    analysis_data["melodic_analysis"] = {
                        "range_semitones": max(pitches) - min(pitches),
                        "highest_note": max(pitches),
                        "lowest_note": min(pitches),
                        "average_pitch": sum(pitches) / len(pitches)
                    }

        # Rhythmic analysis
        durations = [n.duration.quarterLength for n in score.flat.notes]
        if durations:
            analysis_data["rhythmic_analysis"] = {
                "note_count": len(durations),
                "average_duration": sum(durations) / len(durations),
                "shortest_note": min(durations),
                "longest_note": max(durations)
            }

    except Exception as e:
        analysis_data["error"] = f"Analysis failed: {e}"

    return analysis_data

def create_enhanced_composition(title, lyrics, genre, tempo_bpm, key_sig, duration_seconds, musical_patterns=None):
    """Create enhanced composition with lyrics integration and training patterns"""
    score = stream.Score()

    # Enhanced metadata
    from music21 import metadata
    score.metadata = metadata.Metadata()
    score.metadata.title = title
    score.metadata.composer = 'Enhanced Music Generator AI'
    if hasattr(score.metadata, 'genre'):
        score.metadata.genre = genre

    # Musical setup
    score.append(meter.TimeSignature('4/4'))
    score.append(tempo.TempoIndication(number=tempo_bpm))
    score.append(key.Key(key_sig))

    # Calculate measures
    beats_per_measure = 4
    measures = max(8, int((duration_seconds * tempo_bpm / 60) / beats_per_measure))

    # Analyze lyrics for musical inspiration
    lyric_analysis = analyze_lyrics_for_music(lyrics)

    # Create enhanced parts with training pattern integration
    melody_part = create_lyrics_informed_melody(genre, key_sig, tempo_bpm, measures, lyric_analysis, musical_patterns)
    harmony_part = create_enhanced_harmony(genre, key_sig, measures, lyric_analysis['emotion_arc'], musical_patterns)
    bass_part = create_dynamic_bass(genre, key_sig, measures, musical_patterns)

    # Add parts to score
    score.append(melody_part)
    score.append(harmony_part)
    score.append(bass_part)

    return score

def analyze_lyrics_for_music(lyrics):
    """Enhanced lyrics analysis for musical generation"""
    lines = [line.strip() for line in lyrics.split('\n') if line.strip()]

    # Emotional word mappings
    emotion_weights = {
        'love': 0.9, 'joy': 0.8, 'happy': 0.7, 'beautiful': 0.6,
        'amazing': 0.7, 'wonderful': 0.8, 'dream': 0.5, 'bright': 0.5,
        'sad': -0.7, 'pain': -0.8, 'hurt': -0.6, 'broken': -0.7,
        'dark': -0.5, 'lonely': -0.6, 'tears': -0.6, 'goodbye': -0.5
    }

    analysis = {
        'lines': lines,
        'emotion_arc': [],
        'syllable_counts': [],
        'complexity_levels': [],
        'musical_phrases': []
    }

    for line in lines:
        words = line.lower().split()

        # Emotional analysis
        line_emotion = sum(emotion_weights.get(word, 0.0) for word in words) / max(len(words), 1)
        analysis['emotion_arc'].append(line_emotion)

        # Syllable analysis
        syllable_count = sum(estimate_syllables(word) for word in words)
        analysis['syllable_counts'].append(syllable_count)

        # Complexity analysis
        complexity = 'high' if len(words) > 8 else 'medium' if len(words) > 4 else 'low'
        analysis['complexity_levels'].append(complexity)

        # Musical phrase mapping
        analysis['musical_phrases'].append({
            'text': line,
            'emotion': line_emotion,
            'syllables': syllable_count,
            'suggested_rhythm': get_rhythm_from_syllables(syllable_count),
            'melodic_direction': 'ascending' if line_emotion > 0.3 else 'descending' if line_emotion < -0.3 else 'wave'
        })

    return analysis

def estimate_syllables(word):
    """Estimate syllable count for a word"""
    vowels = 'aeiouAEIOU'
    syllable_count = 0
    prev_was_vowel = False

    for char in word:
        if char in vowels:
            if not prev_was_vowel:
                syllable_count += 1
            prev_was_vowel = True
        else:
            prev_was_vowel = False

    return max(1, syllable_count)

def get_rhythm_from_syllables(syllable_count):
    """Generate rhythm pattern based on syllable count"""
    if syllable_count <= 4:
        return 'simple'
    elif syllable_count <= 8:
        return 'moderate'
    else:
        return 'complex'

def create_lyrics_informed_melody(genre, key_sig, tempo_bpm, measures, lyric_analysis, musical_patterns=None):
    """Create melody informed by lyrics analysis and training patterns"""
    melody = stream.Part()
    melody.partName = 'Lyrics-Informed Melody'
    melody.instrument = get_genre_instrument(genre, 'melody')

    key_obj = key.Key(key_sig)
    scale_notes = key_obj.scale.pitches

    for measure in range(measures):
        phrase_idx = measure % len(lyric_analysis['musical_phrases'])
        phrase_data = lyric_analysis['musical_phrases'][phrase_idx]

        melody_phrase = create_melodic_phrase_from_lyrics(
            scale_notes, genre, phrase_data, tempo_bpm, musical_patterns
        )
        melody.extend(melody_phrase)

    return melody

def create_melodic_phrase_from_lyrics(scale_notes, genre, phrase_data, tempo_bpm, musical_patterns=None):
    """Create a melodic phrase based on lyric analysis with proper music21 objects and training patterns"""
    phrase = []

    # Base patterns influenced by lyrics
    if phrase_data['melodic_direction'] == 'ascending':
        pattern = [1, 2, 3, 4, 5, 4, 3, 2]  # Rising then falling
    elif phrase_data['melodic_direction'] == 'descending':
        pattern = [5, 4, 3, 2, 1, 2, 3, 4]  # Falling then rising
    else:
        pattern = [3, 1, 4, 2, 5, 3, 2, 1]  # Wave-like

    # Adjust pattern based on emotion
    emotion = phrase_data['emotion']
    if emotion > 0.5:  # Very positive
        pattern = [p + 1 if p < 7 else p for p in pattern]  # Shift higher
    elif emotion < -0.5:  # Very negative
        pattern = [p - 1 if p > 1 else p for p in pattern]  # Shift lower

    # Generate advanced rhythmic patterns based on genre, lyrics, and training data
    rhythm_pattern = create_advanced_rhythm_pattern(genre, phrase_data, tempo_bpm, musical_patterns)

    # Apply learned melodic intervals if available
    if musical_patterns and 'common_intervals' in musical_patterns:
        # Use training data intervals with 30% probability
        if random.random() < 0.3:
            common_intervals = musical_patterns['common_intervals']
            if common_intervals:
                # Modify pattern based on learned intervals
                learned_interval = random.choice(common_intervals)
                semitones, direction = learned_interval

                # Apply learned interval pattern
                for i in range(1, len(pattern)):
                    if random.random() < 0.4:  # 40% chance to apply learned interval
                        if direction == 'ASCENDING' and pattern[i] <= 6:
                            pattern[i] = min(7, pattern[i-1] + abs(semitones) // 2)
                        elif direction == 'DESCENDING' and pattern[i] >= 2:
                            pattern[i] = max(1, pattern[i-1] - abs(semitones) // 2)

    # Generate notes with sophisticated rhythm using proper music21 objects
    for i, degree in enumerate(pattern):
        if degree <= len(scale_notes) and i < len(rhythm_pattern):
            rhythm_info = rhythm_pattern[i]

            # Create proper Duration object
            note_duration = duration.Duration(quarterLength=rhythm_info['duration'])

            # Add syncopation and swing based on genre
            if rhythm_info['syncopated'] and genre.lower() in ['jazz', 'r&b', 'hip-hop']:
                swing_length = apply_swing_feel(rhythm_info['duration'], genre)
                note_duration = duration.Duration(quarterLength=swing_length)

            # Add expressive rests using Rest objects with proper Duration
            if rhythm_info['is_rest']:
                rest_obj = note.Rest(quarterLength=note_duration.quarterLength)
                phrase.append(rest_obj)
            else:
                # Create Pitch object for precise pitch control
                note_pitch = pitch.Pitch(scale_notes[degree - 1])

                # Adjust octave based on emotion and genre
                if genre.lower() == 'electronic' and emotion > 0.3:
                    note_pitch.octave = 5  # Higher for electronic happy
                elif genre.lower() == 'jazz':
                    note_pitch.octave = 4  # Standard jazz range
                elif emotion < -0.3:
                    note_pitch.octave = 3  # Lower for sad emotions
                else:
                    note_pitch.octave = 4  # Standard range

                # Create Note object with proper Duration and Pitch
                note_obj = note.Note(note_pitch, quarterLength=note_duration.quarterLength)

                # Dynamic markings based on emotion and rhythm
                if emotion > 0.3:
                    note_obj.volume.velocity = min(127, 90 + rhythm_info['accent'] * 20)
                elif emotion < -0.3:
                    note_obj.volume.velocity = max(30, 60 - rhythm_info['accent'] * 10)
                else:
                    note_obj.volume.velocity = 75 + rhythm_info['accent'] * 15

                # Add articulation using Duration modification for staccato
                if rhythm_info['staccato']:
                    # Create shorter duration for staccato effect
                    staccato_duration = duration.Duration(quarterLength=note_duration.quarterLength * 0.7)
                    note_obj.duration = staccato_duration

                    # Add a rest after the staccato note
                    rest_duration = duration.Duration(quarterLength=note_duration.quarterLength * 0.3)
                    staccato_rest = note.Rest(quarterLength=rest_duration.quarterLength)
                    phrase.append(note_obj)
                    phrase.append(staccato_rest)
                else:
                    phrase.append(note_obj)

    return phrase

def create_advanced_rhythm_pattern(genre, phrase_data, tempo_bpm):
    """Create sophisticated rhythm patterns using music21 concepts"""
    syllable_count = phrase_data['syllables']
    emotion = phrase_data['emotion']

    # Base rhythm patterns by genre
    genre_rhythms = {
        'pop': create_pop_rhythm_pattern(syllable_count, tempo_bpm),
        'rock': create_rock_rhythm_pattern(syllable_count, tempo_bpm),
        'jazz': create_jazz_rhythm_pattern(syllable_count, tempo_bpm),
        'electronic': create_electronic_rhythm_pattern(syllable_count, tempo_bpm),
        'hip-hop': create_hiphop_rhythm_pattern(syllable_count, tempo_bpm),
        'r&b': create_rnb_rhythm_pattern(syllable_count, tempo_bpm),
        'classical': create_classical_rhythm_pattern(syllable_count, tempo_bpm),
        'country': create_country_rhythm_pattern(syllable_count, tempo_bpm)
    }

    base_pattern = genre_rhythms.get(genre.lower(), genre_rhythms['pop'])

    # Modify pattern based on emotion
    if emotion > 0.5:  # Happy - more energetic rhythm
        base_pattern = add_rhythmic_energy(base_pattern)
    elif emotion < -0.5:  # Sad - more contemplative rhythm
        base_pattern = add_rhythmic_contemplation(base_pattern)

    return base_pattern

def create_pop_rhythm_pattern(syllable_count, tempo_bpm):
    """Create pop-style rhythm with steady beat and occasional syncopation"""
    pattern = []
    remaining_beats = 4.0  # One measure

    while remaining_beats > 0 and len(pattern) < syllable_count:
        if random.random() < 0.7:  # 70% straight rhythm
            duration = 0.5 if remaining_beats >= 0.5 else remaining_beats
        else:  # 30% syncopated
            duration = 0.75 if remaining_beats >= 0.75 else remaining_beats

        pattern.append({
            'duration': duration,
            'syncopated': duration == 0.75,
            'accent': random.choice([0, 1, 2]) if duration >= 0.5 else 0,
            'staccato': random.random() < 0.2,
            'is_rest': random.random() < 0.1
        })

        remaining_beats -= duration

    return pattern[:8]  # Limit to 8 notes per phrase

def create_jazz_rhythm_pattern(syllable_count, tempo_bpm):
    """Create jazz-style swing rhythm with complex syncopation"""
    pattern = []
    remaining_beats = 4.0

    while remaining_beats > 0 and len(pattern) < syllable_count:
        # Jazz rhythms favor triplets and swing
        if random.random() < 0.4:  # Triplet feel
            duration = 1.0/3 if remaining_beats >= 1.0/3 else remaining_beats
        elif random.random() < 0.6:  # Syncopated eighths
            duration = 0.25 if remaining_beats >= 0.25 else remaining_beats
        else:  # Quarter notes
            duration = 1.0 if remaining_beats >= 1.0 else remaining_beats

        pattern.append({
            'duration': duration,
            'syncopated': True,  # Jazz is inherently syncopated
            'accent': random.choice([0, 1, 2, 3]),
            'staccato': random.random() < 0.3,
            'is_rest': random.random() < 0.15
        })

        remaining_beats -= duration

    return pattern[:8]

def create_electronic_rhythm_pattern(syllable_count, tempo_bpm):
    """Create electronic-style rhythm with quantized feel"""
    pattern = []
    remaining_beats = 4.0

    # Electronic music often uses sixteenth note subdivisions
    sixteenth_grid = [0.25, 0.25, 0.25, 0.25] * 4  # 16 sixteenth notes

    for i in range(min(syllable_count, 8)):
        if i < len(sixteenth_grid):
            # Combine consecutive sixteenths occasionally
            if random.random() < 0.3 and i < len(sixteenth_grid) - 1:
                duration = sixteenth_grid[i] + sixteenth_grid[i + 1]
                i += 1  # Skip next iteration
            else:
                duration = sixteenth_grid[i]

            pattern.append({
                'duration': duration,
                'syncopated': random.random() < 0.4,
                'accent': 2 if i % 4 == 0 else (1 if i % 2 == 0 else 0),  # Strong beats
                'staccato': random.random() < 0.5,  # Electronic often has sharp attacks
                'is_rest': random.random() < 0.05
            })

    return pattern

def create_rock_rhythm_pattern(syllable_count, tempo_bpm):
    """Create rock-style rhythm with driving beat"""
    pattern = []
    remaining_beats = 4.0

    while remaining_beats > 0 and len(pattern) < syllable_count:
        # Rock favors eighth and quarter notes
        if random.random() < 0.6:
            duration = 0.5  # Eighth note
        else:
            duration = 1.0  # Quarter note

        if duration > remaining_beats:
            duration = remaining_beats

        pattern.append({
            'duration': duration,
            'syncopated': random.random() < 0.2,
            'accent': 2 if len(pattern) % 4 == 0 else 1,  # Strong on beats 1 and 3
            'staccato': random.random() < 0.4,
            'is_rest': random.random() < 0.05
        })

        remaining_beats -= duration

    return pattern

def create_hiphop_rhythm_pattern(syllable_count, tempo_bpm):
    """Create hip-hop style rhythm with emphasis on flow"""
    pattern = []
    remaining_beats = 4.0

    # Hip-hop often has complex subdivision patterns
    while remaining_beats > 0 and len(pattern) < syllable_count:
        if random.random() < 0.5:  # Triplet subdivisions
            duration = 1.0/3 if remainingbeats >= 1.0/3 else remaining_beats
        elif random.random() < 0.7:  # Sixteenth notes
            duration = 0.25 if remaining_beats >= 0.25 else remaining_beats
        else:  # Eighth notes
            duration = 0.5 if remaining_beats >= 0.5 else remaining_beats

        pattern.append({
            'duration': duration,
            'syncopated': random.random() < 0.6,  # High syncopation
            'accent': random.choice([0, 1, 2]),
            'staccato': random.random() < 0.6,  # Crisp delivery
            'is_rest': random.random() < 0.2  # More rests for flow
        })

        remaining_beats -= duration

    return pattern

def create_rnb_rhythm_pattern(syllable_count, tempo_bpm):
    """Create R&B style rhythm with groove and swing"""
    pattern = []
    remaining_beats = 4.0

    while remaining_beats > 0 and len(pattern) < syllable_count:
        # R&B favors syncopated patterns
        if random.random() < 0.4:  # Dotted rhythms
            duration = 0.75 if remaining_beats >= 0.75 else remaining_beats
        elif random.random() < 0.6:  # Eighth notes
            duration = 0.5 if remaining_beats >= 0.5 else remaining_beats
        else:  # Quarter notes
            duration = 1.0 if remaining_beats >= 1.0 else remaining_beats

        pattern.append({
            'duration': duration,
            'syncopated': random.random() < 0.7,
            'accent': random.choice([0, 1, 2, 3]),
            'staccato': random.random() < 0.3,
            'is_rest': random.random() < 0.12
        })

        remaining_beats -= duration

    return pattern

def create_classical_rhythm_pattern(syllable_count, tempo_bpm):
    """Create classical style rhythm with traditional patterns"""
    pattern = []
    remaining_beats = 4.0

    # Classical music often uses traditional note values
    while remaining_beats > 0 and len(pattern) < syllable_count:
        if random.random() < 0.4:  # Quarter notes
            duration = 1.0 if remaining_beats >= 1.0 else remaining_beats
        elif random.random() < 0.7:  # Eighth notes
            duration = 0.5 if remaining_beats >= 0.5 else remaining_beats
        else:  # Half notes
            duration = 2.0 if remaining_beats >= 2.0 else remaining_beats

        pattern.append({
            'duration': duration,
            'syncopated': random.random() < 0.1,  # Less syncopation
            'accent': 2 if len(pattern) % 4 == 0 else 0,  # Strong beats
            'staccato': random.random() < 0.25,
            'is_rest': random.random() < 0.08
        })

        remaining_beats -= duration

    return pattern

def create_country_rhythm_pattern(syllable_count, tempo_bpm):
    """Create country style rhythm with shuffle feel"""
    pattern = []
    remaining_beats = 4.0

    while remaining_beats > 0 and len(pattern) < syllable_count:
        # Country often has a shuffle or swing feel
        if random.random() < 0.6:  # Eighth note patterns
            duration = 0.5 if remaining_beats >= 0.5 else remaining_beats
        else:  # Quarter notes
            duration = 1.0 if remaining_beats >= 1.0 else remaining_beats

        pattern.append({
            'duration': duration,
            'syncopated': random.random() < 0.3,
            'accent': 1 if len(pattern) % 2 == 0 else 0,
            'staccato': random.random() < 0.35,
            'is_rest': random.random() < 0.1
        })

        remaining_beats -= duration

    return pattern

def apply_swing_feel(note_length, genre):
    """Apply swing feel to note durations"""
    if genre.lower() in ['jazz', 'blues']:
        # Jazz swing: eighth notes become long-short pattern
        if note_length == 0.5:  # Eighth note
            return random.choice([0.67, 0.33])  # Swing ratio
    elif genre.lower() in ['r&b', 'hip-hop']:
        # Subtle swing for groove
        if note_length == 0.5:
            return note_length + random.uniform(-0.05, 0.05)

    return note_length

def add_rhythmic_energy(pattern):
    """Increase rhythmic energy for positive emotions"""
    for item in pattern:
        # Shorter note values for energy
        if item['duration'] > 0.5:
            item['duration'] *= 0.75
        # More accents
        item['accent'] = min(3, item['accent'] + 1)
        # Less rests
        if item['is_rest']:
            item['is_rest'] = random.random() < 0.05
    return pattern

def add_rhythmic_contemplation(pattern):
    """Add contemplative rhythm for sad emotions"""
    for item in pattern:
        # Longer note values for contemplation
        if item['duration'] < 1.0:
            item['duration'] *= 1.25
        # Softer accents
        item['accent'] = max(0, item['accent'] - 1)
        # More rests for breathing
        if not item['is_rest'] and random.random() < 0.15:
            item['is_rest'] = True
    return pattern

def create_enhanced_harmony(genre, key_sig, measures, emotion_arc):
    """Create harmony that responds to emotional arc"""
    harmony = stream.Part()
    harmony.partName = 'Enhanced Harmony'
    harmony.instrument = get_genre_instrument(genre, 'harmony')

    # Enhanced chord progressions based on genre and emotion
    progressions = get_enhanced_progressions(genre)
    base_progression = progressions['base']

    for measure in range(measures):
        emotion_idx = measure % len(emotion_arc)
        current_emotion = emotion_arc[emotion_idx]

        # Select chord progression variant based on emotion
        if current_emotion > 0.5:
            progression = progressions.get('happy', base_progression)
        elif current_emotion < -0.5:
            progression = progressions.get('sad', base_progression)
        else:
            progression = base_progression

        chord_symbol = progression[measure % len(progression)]
        chord_obj = create_emotional_chord(chord_symbol, key_sig, current_emotion, genre)
        chord_obj.quarterLength = 4.0
        harmony.append(chord_obj)

    return harmony

def get_enhanced_progressions(genre):
    """Get enhanced chord progressions for different genres"""
    progressions = {
        'pop': {
            'base': ['I', 'V', 'vi', 'IV'],
            'happy': ['I', 'V', 'vi', 'IV', 'I', 'vi', 'V', 'I'],
            'sad': ['vi', 'IV', 'I', 'V', 'vi', 'ii', 'V', 'vi']
        },
        'rock': {
            'base': ['vi', 'IV', 'I', 'V'],
            'happy': ['I', 'V', 'vi', 'IV', 'I', 'V', 'I', 'V'],
            'sad': ['vi', 'IV', 'I', 'V', 'vi', 'IV', 'V', 'vi']
        },
        'electronic': {
            'base': ['vi', 'IV', 'I', 'V'],
            'happy': ['I', 'V', 'vi', 'IV', 'I', 'iii', 'V', 'I'],
            'sad': ['vi', 'IV', 'I', 'V', 'vi', 'ii', 'V', 'vi']
        },
        'jazz': {
            'base': ['ii', 'V', 'I', 'vi'],
            'happy': ['I', 'vi', 'ii', 'V', 'I', 'iii', 'vi', 'V'],
            'sad': ['ii', 'V', 'i', 'vi', 'ii', 'V', 'i', 'i']
        }
    }
    return progressions.get(genre.lower(), progressions['pop'])

def create_emotional_chord(chord_symbol, key_sig, emotion, genre):
    """Create chord with emotional coloring using proper music21 Chord objects"""
    key_obj = key.Key(key_sig)
    root = key_obj.tonic

    # Create Duration object for chord timing
    chord_duration = duration.Duration(quarterLength=4.0)

    # Basic triad using Pitch objects
    root_pitch = pitch.Pitch(root)
    third_pitch = pitch.Pitch(root.transpose('M3'))
    fifth_pitch = pitch.Pitch(root.transpose('P5'))
    chord_tones = [root_pitch, third_pitch, fifth_pitch]

    # Add emotional extensions with proper Pitch objects
    if emotion > 0.3:  # Happy - add major extensions
        if random.random() > 0.5:
            chord_tones.append(pitch.Pitch(root.transpose('M7')))  # Major 7th
        if random.random() > 0.7 and genre.lower() in ['jazz', 'r&b']:
            chord_tones.append(pitch.Pitch(root.transpose('M9')))  # Add 9th
    elif emotion < -0.3:  # Sad - add minor colors
        chord_tones[1] = pitch.Pitch(root.transpose('m3'))  # Make it minor
        if random.random() > 0.5:
            chord_tones.append(pitch.Pitch(root.transpose('m7')))  # Minor 7th
        if random.random() > 0.6:
            chord_tones.append(pitch.Pitch(root.transpose('m6')))  # Add 6th for melancholy

    # Genre-specific voicings with proper octave placement
    if genre.lower() == 'jazz':
        # Jazz voicing with extended harmonies
        chord_tones.append(pitch.Pitch(root.transpose('m7')))  # Dominant 7th
        if random.random() > 0.3:
            chord_tones.append(pitch.Pitch(root.transpose('M9')))  # Add 9th
        if random.random() > 0.5:
            chord_tones.append(pitch.Pitch(root.transpose('P11')))  # Add 11th

    elif genre.lower() == 'electronic':
        # Wide spread voicing for electronic with specific octaves
        bass_pitch = pitch.Pitch(root)
        bass_pitch.octave = 2  # Low bass

        mid_root = pitch.Pitch(root)
        mid_root.octave = 4

        high_root = pitch.Pitch(root)
        high_root.octave = 6  # High octave

        chord_tones = [
            bass_pitch,
            mid_root,
            pitch.Pitch(root.transpose('M3')).transpose(12),  # Third up an octave
            pitch.Pitch(root.transpose('P5')).transpose(12),  # Fifth up an octave
            high_root
        ]

    elif genre.lower() == 'rock':
        # Power chord emphasis with octave doubling
        power_chord = [
            pitch.Pitch(root),
            pitch.Pitch(root.transpose('P5')),
            pitch.Pitch(root.transpose(12))  # Octave
        ]
        chord_tones = power_chord

    # Create Chord object with Duration
    chord_obj = chord.Chord(chord_tones, quarterLength=chord_duration.quarterLength)

    # Add dynamics based on emotion
    if emotion > 0.5:
        chord_obj.volume.velocity = 95  # Bright and loud
    elif emotion < -0.5:
        chord_obj.volume.velocity = 60  # Soft and contemplative
    else:
        chord_obj.volume.velocity = 80  # Moderate

    return chord_obj

def create_dynamic_bass(genre, key_sig, measures):
    """Create dynamic bass line"""
    bass = stream.Part()
    bass.partName = 'Dynamic Bass'
    bass.instrument = get_genre_instrument(genre, 'bass')

    key_obj = key.Key(key_sig)
    root_note = key_obj.tonic

    for measure in range(measures):
        bass_pattern = get_bass_pattern(genre, root_note, measure)
        bass.extend(bass_pattern)

    return bass

def get_bass_pattern(genre, root_note, measure):
    """Generate bass pattern based on genre using proper music21 objects"""
    bass_measure = stream.Measure()
    bass_measure.timeSignature = meter.TimeSignature('4/4')

    if genre.lower() == 'electronic':
        # Syncopated electronic bass with precise Duration objects
        pattern_data = [
            (root_note, 0.75, False),
            (None, 0.25, True),  # Rest
            (root_note.transpose('P5'), 0.5, False),
            (root_note, 1.5, False)
        ]

        for note_data, dur, is_rest in pattern_data:
            note_duration = duration.Duration(quarterLength=dur)

            if is_rest or note_data is None:
                rest_obj = note.Rest(quarterLength=note_duration.quarterLength)
                bass_measure.append(rest_obj)
            else:
                bass_pitch = pitch.Pitch(note_data)
                bass_pitch.octave = 2  # Bass octave
                bass_note = note.Note(bass_pitch, quarterLength=note_duration.quarterLength)
                bass_note.volume.velocity = 85
                bass_measure.append(bass_note)

    elif genre.lower() == 'rock':
        # Driving rock bass with consistent Duration
        quarter_duration = duration.Duration(quarterLength=1.0)

        for i in range(4):  # Four quarter notes
            bass_pitch = pitch.Pitch(root_note)
            bass_pitch.octave = 2
            bass_note = note.Note(bass_pitch, quarterLength=quarter_duration.quarterLength)
            bass_note.volume.velocity = 95

            # Add slight accent on beats 1 and 3
            if i % 2 == 0:
                bass_note.volume.velocity = 105

            bass_measure.append(bass_note)

    elif genre.lower() == 'jazz':
        # Walking jazz bass with smooth voice leading
        intervals = ['M2', 'M3', 'P4', 'P5']
        quarter_duration = duration.Duration(quarterLength=1.0)

        for i in range(4):
            interval_choice = intervals[i % len(intervals)]
            bass_pitch = pitch.Pitch(root_note.transpose(interval_choice))
            bass_pitch.octave = 2

            bass_note = note.Note(bass_pitch, quarterLength=quarter_duration.quarterLength)
            bass_note.volume.velocity = 75

            # Add swing feel to jazz bass
            if i % 2 == 1:  # Slightly shorter on off-beats
                swing_duration = duration.Duration(quarterLength=0.9)
                bass_note.duration = swing_duration

            bass_measure.append(bass_note)

    elif genre.lower() == 'hip-hop':
        # Hip-hop bass with syncopated pattern
        pattern_data = [
            (root_note, 1.0, False),
            (None, 0.5, True),  # Rest for groove
            (root_note.transpose('P5'), 0.75, False),
            (root_note, 0.75, False)
        ]

        for note_data, dur, is_rest in pattern_data:
            note_duration = duration.Duration(quarterLength=dur)

            if is_rest:
                rest_obj = note.Rest(quarterLength=note_duration.quarterLength)
                bass_measure.append(rest_obj)
            else:
                bass_pitch = pitch.Pitch(note_data)
                bass_pitch.octave = 1  # Very low for hip-hop
                bass_note = note.Note(bass_pitch, quarterLength=note_duration.quarterLength)
                bass_note.volume.velocity = 90
                bass_measure.append(bass_note)

    else:
        # Standard pop/rock bass with proper Duration objects
        fifth = root_note.transpose('P5')
        pattern = [root_note, root_note, fifth, root_note]
        quarter_duration = duration.Duration(quarterLength=1.0)

        for note_pitch in pattern:
            bass_pitch = pitch.Pitch(note_pitch)
            bass_pitch.octave = 2
            bass_note = note.Note(bass_pitch, quarterLength=quarter_duration.quarterLength)
            bass_note.volume.velocity = 80
            bass_measure.append(bass_note)

    return bass_measure.notes

def get_genre_instrument(genre, part_type):
    """Get appropriate instrument for genre and part"""
    from music21 import instrument

    instruments = {
        'pop': {
            'melody': instrument.Piano(),
            'harmony': instrument.Piano(),
            'bass': instrument.ElectricBass()
        },
        'rock': {
            'melody': instrument.ElectricGuitar(),
            'harmony': instrument.ElectricGuitar(),
            'bass': instrument.ElectricBass()
        },
        'electronic': {
            'melody': instrument.Synth(),
            'harmony': instrument.Synth(),
            'bass': instrument.Synth()
        },
        'jazz': {
            'melody': instrument.Saxophone(),
            'harmony': instrument.Piano(),
            'bass': instrument.AcousticBass()
        },
        'classical': {
            'melody': instrument.Violin(),
            'harmony': instrument.Piano(),
            'bass': instrument.Cello()
        }
    }

    genre_instruments = instruments.get(genre.lower(), instruments['pop'])
    return genre_instruments.get(part_type, instrument.Piano())

def generate_enhanced_metadata(title, lyrics, genre, tempo_bpm, key_sig, duration_seconds, score):
    """Generate comprehensive metadata"""

    lyric_analysis = analyze_lyrics_for_music(lyrics)

    metadata = {
        "title": title,
        "genre": genre,
        "tempo": tempo_bpm,
        "key": key_sig,
        "duration": duration_seconds,
        "lyrics_analysis": {
            "line_count": len(lyric_analysis['lines']),
            "average_emotion": sum(lyric_analysis['emotion_arc']) / len(lyric_analysis['emotion_arc']),
            "emotional_range": {
                "min": min(lyric_analysis['emotion_arc']),
                "max": max(lyric_analysis['emotion_arc'])
            },
            "complexity": lyric_analysis['complexity_levels'][0] if lyric_analysis['complexity_levels'] else 'medium'
        },
        "musical_features": {
            "melody_complexity": "enhanced",
            "harmonic_richness": "advanced",
            "rhythmic_variation": "dynamic",
            "lyrics_integration": "full"
        },
        "generation_method": "enhanced_music21_with_lyrics",
        "parts": len(score.parts),
        "measures": len([m for m in score.flat.getElementsByClass('Measure')])
    }

    return metadata

if __name__ == '__main__':
    main()