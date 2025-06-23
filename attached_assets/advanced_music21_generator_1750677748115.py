#!/usr/bin/env python3
"""
Advanced music generation using Music21 for Enhanced Music Generator
"""

import sys
import json
import os
from music21 import stream, note, chord, meter, tempo, key, duration, pitch, scale, interval, bar
from music21.midi import MidiFile
import random
import numpy as np

def main():
    if len(sys.argv) < 8:
        print("Usage: python advanced_music21_generator.py <title> <lyrics> <genre> <tempo> <key> <duration> <output_path>")
        sys.exit(1)
    
    try:
        title = sys.argv[1].strip('"')
        lyrics = sys.argv[2].strip('"')
        genre = sys.argv[3].strip('"')
        tempo_bpm = int(sys.argv[4])
        key_sig = sys.argv[5].strip('"')
        duration_seconds = int(sys.argv[6])
        output_path = sys.argv[7].strip('"')
        
        print(f"🎵 Generating advanced composition: {title} in {genre} at {tempo_bpm} BPM")
        
        # Create the composition
        score = create_advanced_composition(title, lyrics, genre, tempo_bpm, key_sig, duration_seconds)
        
        # Write MIDI file
        score.write('midi', fp=output_path)
        print(f"✅ MIDI file generated: {output_path}")
        
        # Generate metadata
        metadata = {
            "title": title,
            "genre": genre,
            "tempo": tempo_bpm,
            "key": key_sig,
            "duration": duration_seconds,
            "structure": analyze_structure(score),
            "advanced_features": {
                "melody_complexity": "high",
                "harmonic_richness": "advanced",
                "rhythmic_variation": "dynamic"
            }
        }
        
        metadata_path = output_path.replace('.mid', '_metadata.json')
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print("🎉 Advanced composition completed successfully")
        
    except Exception as e:
        print(f"❌ Error generating music: {e}", file=sys.stderr)
        sys.exit(1)

def create_advanced_composition(title, lyrics, genre, tempo_bpm, key_sig, duration_seconds):
    # Create the main score
    score = stream.Score()
    
    # Add metadata
    score.metadata = {}
    score.metadata.title = title
    score.metadata.composer = 'Enhanced Music Generator AI'
    
    # Set time signature and tempo
    score.append(meter.TimeSignature('4/4'))
    score.append(tempo.TempoIndication(number=tempo_bpm))
    score.append(key.KeySignature(key_sig))
    
    # Calculate number of measures based on duration
    beats_per_measure = 4
    measures = max(8, int((duration_seconds * tempo_bpm / 60) / beats_per_measure))
    
    # Create advanced parts with lyrics integration
    melody_part = create_advanced_melody_part(genre, key_sig, tempo_bpm, measures, lyrics)
    chord_part = create_advanced_chord_part(genre, key_sig, measures)
    bass_part = create_advanced_bass_part(genre, key_sig, measures)
    percussion_part = create_percussion_part(genre, measures)
    
    # Add parts to score
    score.append(melody_part)
    score.append(chord_part)
    score.append(bass_part)
    score.append(percussion_part)
    
    return score

def create_advanced_melody_part(genre, key_sig, tempo_bpm, measures, lyrics):
    melody = stream.Part()
    melody.partName = 'Advanced Melody'
    melody.instrument = get_advanced_melody_instrument(genre)
    
    # Get scale for the key
    key_obj = key.Key(key_sig)
    scale_notes = key_obj.scale.pitches
    
    # Analyze lyrics for melodic inspiration
    lyric_phrases = analyze_lyrics_for_melody(lyrics)
    
    for measure in range(measures):
        # Create melodic phrases based on lyrics and genre
        phrase_type = determine_phrase_type(measure, measures, lyric_phrases)
        melody_line = create_advanced_melodic_phrase(scale_notes, genre, phrase_type, tempo_bpm)
        melody.append(melody_line)
    
    return melody

def analyze_lyrics_for_melody(lyrics):
    """Analyze lyrics to inform melodic structure"""
    lines = [line.strip() for line in lyrics.split('\n') if line.strip()]
    
    phrases = []
    for line in lines:
        words = line.split()
        syllable_count = sum(estimate_syllables(word) for word in words)
        emotional_weight = analyze_emotional_content(line)
        
        phrases.append({
            'text': line,
            'syllable_count': syllable_count,
            'emotional_weight': emotional_weight,
            'word_count': len(words)
        })
    
    return phrases

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

def analyze_emotional_content(line):
    """Analyze emotional content of a lyric line"""
    positive_words = ['love', 'happy', 'joy', 'beautiful', 'amazing', 'wonderful', 'bright', 'smile']
    negative_words = ['sad', 'pain', 'hurt', 'dark', 'lonely', 'broken', 'tears', 'goodbye']
    
    words = line.lower().split()
    positive_count = sum(1 for word in words if any(pos in word for pos in positive_words))
    negative_count = sum(1 for word in words if any(neg in word for neg in negative_words))
    
    return (positive_count - negative_count) / max(1, len(words))

def determine_phrase_type(measure, total_measures, lyric_phrases):
    """Determine the type of musical phrase based on position and lyrics"""
    position_ratio = measure / total_measures
    
    if position_ratio < 0.2:
        return 'intro'
    elif position_ratio < 0.4:
        return 'verse'
    elif position_ratio < 0.6:
        return 'chorus'
    elif position_ratio < 0.8:
        return 'bridge'
    else:
        return 'outro'

def create_advanced_melodic_phrase(scale_notes, genre, phrase_type, tempo_bpm):
    phrase = []
    
    # Advanced genre-specific melodic patterns
    patterns = {
        'pop': {
            'intro': [1, 3, 5, 3, 2, 1, 2, 1],
            'verse': [1, 2, 3, 2, 1, 3, 2, 1],
            'chorus': [5, 6, 5, 4, 3, 4, 5, 1],
            'bridge': [6, 5, 4, 3, 2, 3, 4, 5],
            'outro': [5, 4, 3, 2, 1, 1, 1, 1]
        },
        'rock': {
            'intro': [1, 1, 3, 5, 5, 3, 1, 1],
            'verse': [1, 3, 1, 5, 3, 1, 5, 1],
            'chorus': [5, 5, 6, 5, 3, 1, 3, 5],
            'bridge': [3, 5, 6, 5, 3, 1, 2, 3],
            'outro': [5, 3, 1, 1, 1, 1, 1, 1]
        },
        'electronic': {
            'intro': [1, 1, 2, 2, 3, 3, 5, 5],
            'verse': [1, 3, 1, 3, 5, 3, 1, 3],
            'chorus': [5, 5, 6, 6, 5, 5, 3, 3],
            'bridge': [6, 5, 4, 3, 2, 3, 4, 5],
            'outro': [5, 4, 3, 2, 1, 1, 1, 1]
        },
        'jazz': {
            'intro': [1, 3, 5, 7, 6, 4, 2, 1],
            'verse': [1, 2, 3, 5, 6, 5, 3, 1],
            'chorus': [7, 6, 5, 4, 3, 2, 1, 7],
            'bridge': [2, 4, 6, 7, 5, 3, 1, 2],
            'outro': [7, 5, 3, 1, 1, 1, 1, 1]
        }
    }
    
    pattern = patterns.get(genre.lower(), patterns['pop']).get(phrase_type, [1, 2, 3, 4, 5, 4, 3, 1])
    
    # Convert scale degrees to notes with rhythmic variation
    for i, degree in enumerate(pattern):
        if degree <= len(scale_notes):
            note_pitch = scale_notes[degree - 1]
            
            # Add rhythmic variation based on tempo and genre
            if genre.lower() == 'electronic':
                note_length = 0.25 if i % 2 == 0 else 0.75
            elif genre.lower() == 'jazz':
                note_length = 0.5 if i % 3 != 0 else 1.0
            else:
                note_length = 0.5
            
            # Add occasional rests for musical breathing
            if random.random() < 0.1:  # 10% chance of rest
                rest_obj = note.Rest(quarterLength=note_length)
                phrase.append(rest_obj)
            else:
                note_obj = note.Note(note_pitch, quarterLength=note_length)
                # Add dynamics based on phrase type
                if phrase_type == 'chorus':
                    note_obj.volume.velocity = 100
                elif phrase_type == 'verse':
                    note_obj.volume.velocity = 80
                else:
                    note_obj.volume.velocity = 90
                phrase.append(note_obj)
    
    return phrase

def create_advanced_chord_part(genre, key_sig, measures):
    chords = stream.Part()
    chords.partName = 'Advanced Chords'
    chords.instrument = get_advanced_chord_instrument(genre)
    
    # Get advanced chord progression for genre
    progression = get_advanced_chord_progression(genre, key_sig)
    
    for measure in range(measures):
        chord_symbol = progression[measure % len(progression)]
        
        # Create more complex chords based on genre
        if genre.lower() == 'jazz':
            chord_obj = create_jazz_chord(chord_symbol, key_sig)
        elif genre.lower() == 'electronic':
            chord_obj = create_electronic_chord(chord_symbol, key_sig)
        else:
            chord_obj = create_standard_chord(chord_symbol, key_sig)
        
        chord_obj.quarterLength = 4.0  # Whole note
        chords.append(chord_obj)
    
    return chords

def create_jazz_chord(chord_symbol, key_sig):
    """Create jazz-style extended chords"""
    key_obj = key.Key(key_sig)
    root = key_obj.tonic
    
    # Add 7th, 9th, 11th extensions
    chord_tones = [root, root.transpose('M3'), root.transpose('P5'), root.transpose('m7')]
    if random.random() > 0.5:
        chord_tones.append(root.transpose('M9'))
    
    return chord.Chord(chord_tones)

def create_electronic_chord(chord_symbol, key_sig):
    """Create electronic-style chords with wider voicings"""
    key_obj = key.Key(key_sig)
    root = key_obj.tonic
    
    # Spread chord across multiple octaves
    chord_tones = [
        root.transpose(-12),  # Bass note
        root,
        root.transpose('M3'),
        root.transpose('P5'),
        root.transpose(12)    # High octave
    ]
    
    return chord.Chord(chord_tones)

def create_standard_chord(chord_symbol, key_sig):
    """Create standard triads"""
    key_obj = key.Key(key_sig)
    root = key_obj.tonic
    
    chord_tones = [root, root.transpose('M3'), root.transpose('P5')]
    return chord.Chord(chord_tones)

def create_advanced_bass_part(genre, key_sig, measures):
    bass = stream.Part()
    bass.partName = 'Advanced Bass'
    bass.instrument = get_advanced_bass_instrument(genre)
    
    key_obj = key.Key(key_sig)
    root_note = key_obj.tonic
    
    for measure in range(measures):
        bass_line = create_advanced_bass_line(root_note, genre, measure)
        bass.extend(bass_line)
    
    return bass

def create_advanced_bass_line(root_note, genre, measure):
    bass_notes = []
    
    if genre.lower() == 'rock':
        # Rock bass: driving eighth notes
        eighth_pattern = [root_note, root_note, root_note.transpose('P5'), root_note]
        for note_pitch in eighth_pattern:
            bass_note = note.Note(note_pitch, quarterLength=0.5)
            bass_note.octave = 2
            bass_notes.append(bass_note)
            bass_notes.append(note.Note(note_pitch, quarterLength=0.5))
    
    elif genre.lower() == 'jazz':
        # Jazz walking bass
        intervals = ['M2', 'M3', 'P4', 'P5', 'M6', 'm7']
        for i in range(4):
            interval_choice = random.choice(intervals)
            bass_pitch = root_note.transpose(interval_choice)
            bass_note = note.Note(bass_pitch, quarterLength=1.0)
            bass_note.octave = 2
            bass_notes.append(bass_note)
    
    elif genre.lower() == 'electronic':
        # Electronic bass: syncopated pattern
        pattern = [root_note, None, root_note.transpose('P5'), root_note]
        for note_pitch in pattern:
            if note_pitch:
                bass_note = note.Note(note_pitch, quarterLength=1.0)
                bass_note.octave = 2
                bass_notes.append(bass_note)
            else:
                bass_notes.append(note.Rest(quarterLength=1.0))
    
    else:  # Pop and other genres
        # Standard root-fifth pattern
        fifth = root_note.transpose('P5')
        pattern = [root_note, root_note, fifth, root_note]
        for note_pitch in pattern:
            bass_note = note.Note(note_pitch, quarterLength=1.0)
            bass_note.octave = 2
            bass_notes.append(bass_note)
    
    return bass_notes

def create_percussion_part(genre, measures):
    """Create a basic percussion part"""
    percussion = stream.Part()
    percussion.partName = 'Percussion'
    
    # Simple kick and snare pattern
    for measure in range(measures):
        # Kick on beats 1 and 3
        kick1 = note.Note('C2', quarterLength=1.0)
        kick1.volume.velocity = 100
        percussion.append(kick1)
        
        # Snare on beat 2
        snare = note.Note('D2', quarterLength=1.0)
        snare.volume.velocity = 90
        percussion.append(snare)
        
        # Kick on beat 3
        kick2 = note.Note('C2', quarterLength=1.0)
        kick2.volume.velocity = 100
        percussion.append(kick2)
        
        # Snare on beat 4
        snare2 = note.Note('D2', quarterLength=1.0)
        snare2.volume.velocity = 90
        percussion.append(snare2)
    
    return percussion

def get_advanced_chord_progression(genre, key_sig):
    """Get advanced genre-appropriate chord progressions"""
    
    progressions = {
        'pop': ['I', 'V', 'vi', 'IV', 'I', 'V', 'vi', 'IV'],
        'rock': ['vi', 'IV', 'I', 'V', 'vi', 'IV', 'I', 'V'],
        'jazz': ['IIM7', 'V7', 'IM7', 'VIM7', 'IIM7', 'V7', 'IM7', 'IM7'],
        'classical': ['I', 'vi', 'IV', 'V', 'I', 'vi', 'ii', 'V'],
        'electronic': ['vi', 'IV', 'I', 'V', 'vi', 'IV', 'I', 'V'],
        'hip-hop': ['i', 'bVII', 'bVI', 'bVII', 'i', 'bVII', 'bVI', 'bVII'],
        'country': ['I', 'I', 'IV', 'I', 'V', 'V', 'I', 'I'],
        'r&b': ['IM7', 'VIM7', 'IVM7', 'V7', 'IM7', 'VIM7', 'IVM7', 'V7']
    }
    
    return progressions.get(genre.lower(), progressions['pop'])

def get_advanced_melody_instrument(genre):
    """Get appropriate melody instrument for genre"""
    from music21 import instrument
    
    instruments = {
        'pop': instrument.Piano(),
        'rock': instrument.ElectricGuitar(),
        'jazz': instrument.Saxophone(),
        'classical': instrument.Violin(),
        'electronic': instrument.Synth(),
        'hip-hop': instrument.Synth(),
        'country': instrument.AcousticGuitar(),
        'r&b': instrument.ElectricPiano()
    }
    
    return instruments.get(genre.lower(), instrument.Piano())

def get_advanced_chord_instrument(genre):
    """Get appropriate chord instrument for genre"""
    from music21 import instrument
    
    instruments = {
        'pop': instrument.Piano(),
        'rock': instrument.ElectricGuitar(),
        'jazz': instrument.Piano(),
        'classical': instrument.Piano(),
        'electronic': instrument.Synth(),
        'hip-hop': instrument.ElectricPiano(),
        'country': instrument.AcousticGuitar(),
        'r&b': instrument.ElectricPiano()
    }
    
    return instruments.get(genre.lower(), instrument.Piano())

def get_advanced_bass_instrument(genre):
    """Get appropriate bass instrument for genre"""
    from music21 import instrument
    
    instruments = {
        'pop': instrument.ElectricBass(),
        'rock': instrument.ElectricBass(),
        'jazz': instrument.AcousticBass(),
        'classical': instrument.Cello(),
        'electronic': instrument.Synth(),
        'hip-hop': instrument.ElectricBass(),
        'country': instrument.AcousticBass(),
        'r&b': instrument.ElectricBass()
    }
    
    return instruments.get(genre.lower(), instrument.ElectricBass())

def analyze_structure(score):
    """Analyze the musical structure with advanced metrics"""
    
    parts = []
    for part in score.parts:
        part_info = {
            'name': part.partName or 'Unknown',
            'instrument': str(part.instrument) if part.instrument else 'Unknown',
            'measures': len([m for m in part.getElementsByClass('Measure')]),
            'notes': len(part.flat.notes),
            'complexity': calculate_complexity(part),
            'range': calculate_range(part)
        }
        parts.append(part_info)
    
    return {
        'parts': parts,
        'total_measures': len([m for m in score.flat.getElementsByClass('Measure')]),
        'key_signature': str(score.analyze('key')),
        'time_signature': str(score.flat.getElementsByClass(meter.TimeSignature)[0]) if score.flat.getElementsByClass(meter.TimeSignature) else '4/4',
        'harmonic_complexity': calculate_harmonic_complexity(score),
        'rhythmic_diversity': calculate_rhythmic_diversity(score)
    }

def calculate_complexity(part):
    """Calculate melodic complexity of a part"""
    notes = part.flat.notes
    if len(notes) < 2:
        return 0
    
    intervals = []
    for i in range(len(notes) - 1):
        if hasattr(notes[i], 'pitch') and hasattr(notes[i + 1], 'pitch'):
            interval_size = abs(notes[i + 1].pitch.midi - notes[i].pitch.midi)
            intervals.append(interval_size)
    
    if not intervals:
        return 0
    
    # Complexity based on interval variety and size
    avg_interval = sum(intervals) / len(intervals)
    interval_variety = len(set(intervals)) / len(intervals)
    
    return min(1.0, (avg_interval / 12) * interval_variety)

def calculate_range(part):
    """Calculate pitch range of a part"""
    notes = [n for n in part.flat.notes if hasattr(n, 'pitch')]
    if not notes:
        return 0
    
    pitches = [n.pitch.midi for n in notes]
    return max(pitches) - min(pitches)

def calculate_harmonic_complexity(score):
    """Calculate overall harmonic complexity"""
    chord_parts = [part for part in score.parts if 'chord' in part.partName.lower()]
    if not chord_parts:
        return 0.5
    
    total_complexity = 0
    for part in chord_parts:
        chords = [n for n in part.flat.notes if isinstance(n, chord.Chord)]
        if chords:
            avg_chord_size = sum(len(c.pitches) for c in chords) / len(chords)
            total_complexity += min(1.0, avg_chord_size / 6)  # Normalize to 6-note chords
    
    return total_complexity / len(chord_parts) if chord_parts else 0.5

def calculate_rhythmic_diversity(score):
    """Calculate rhythmic diversity across all parts"""
    all_durations = []
    for part in score.parts:
        durations = [n.quarterLength for n in part.flat.notes]
        all_durations.extend(durations)
    
    if not all_durations:
        return 0.5
    
    unique_durations = len(set(all_durations))
    total_notes = len(all_durations)
    
    return min(1.0, unique_durations / total_notes * 2)  # Scale factor for normalization

if __name__ == '__main__':
    main()
