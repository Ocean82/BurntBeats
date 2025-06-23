
#!/usr/bin/env python3
"""
Advanced music generation using Music21 for Burnt Beats
"""

import sys
import json
import os
from music21 import stream, note, chord, meter, tempo, key, duration, pitch, scale, interval, bar
from music21.midi import MidiFile
import random

def main():
    if len(sys.argv) < 8:
        print("Usage: python music-generator.py <title> <lyrics> <genre> <tempo> <key> <duration> <output_path>")
        sys.exit(1)
    
    try:
        title = sys.argv[1].strip('"')
        lyrics = sys.argv[2].strip('"')
        genre = sys.argv[3].strip('"')
        tempo_bpm = int(sys.argv[4])
        key_sig = sys.argv[5].strip('"')
        duration_seconds = int(sys.argv[6])
        output_path = sys.argv[7].strip('"')
        
        print(f"Generating music: {title} in {genre} at {tempo_bpm} BPM")
        
        # Create the composition
        score = create_composition(title, lyrics, genre, tempo_bpm, key_sig, duration_seconds)
        
        # Write MIDI file
        score.write('midi', fp=output_path)
        print(f"MIDI file generated: {output_path}")
        
        # Generate metadata
        metadata = {
            "title": title,
            "genre": genre,
            "tempo": tempo_bpm,
            "key": key_sig,
            "duration": duration_seconds,
            "structure": analyze_structure(score)
        }
        
        metadata_path = output_path.replace('.mid', '_metadata.json')
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print("Composition completed successfully")
        
    except Exception as e:
        print(f"Error generating music: {e}", file=sys.stderr)
        sys.exit(1)

def create_composition(title, lyrics, genre, tempo_bpm, key_sig, duration_seconds):
    # Create the main score
    score = stream.Score()
    
    # Add metadata
    score.metadata = {}
    score.metadata.title = title
    score.metadata.composer = 'Burnt Beats AI'
    
    # Set time signature and tempo
    score.append(meter.TimeSignature('4/4'))
    score.append(tempo.TempoIndication(number=tempo_bpm))
    score.append(key.KeySignature(key_sig))
    
    # Calculate number of measures based on duration
    beats_per_measure = 4
    measures = max(8, int((duration_seconds * tempo_bpm / 60) / beats_per_measure))
    
    # Create parts
    melody_part = create_melody_part(genre, key_sig, tempo_bpm, measures)
    chord_part = create_chord_part(genre, key_sig, measures)
    bass_part = create_bass_part(genre, key_sig, measures)
    
    # Add parts to score
    score.append(melody_part)
    score.append(chord_part)
    score.append(bass_part)
    
    return score

def create_melody_part(genre, key_sig, tempo_bpm, measures):
    melody = stream.Part()
    melody.partName = 'Melody'
    melody.instrument = get_melody_instrument(genre)
    
    # Get scale for the key
    key_obj = key.Key(key_sig)
    scale_notes = key_obj.scale.pitches
    
    for measure in range(measures):
        # Create melodic phrases
        if measure % 4 == 0:  # Start of phrase
            melody_line = create_melodic_phrase(scale_notes, genre, phrase_type='opening')
        elif measure % 4 == 3:  # End of phrase
            melody_line = create_melodic_phrase(scale_notes, genre, phrase_type='closing')
        else:
            melody_line = create_melodic_phrase(scale_notes, genre, phrase_type='middle')
        
        melody.append(melody_line)
    
    return melody

def create_melodic_phrase(scale_notes, genre, phrase_type='middle'):
    phrase = []
    
    # Genre-specific melodic patterns
    if genre.lower() == 'pop':
        pattern = [1, 3, 2, 5, 4, 3, 1, 1] if phrase_type == 'opening' else [5, 4, 3, 2, 1, 1, 1, 1]
    elif genre.lower() == 'rock':
        pattern = [1, 1, 3, 5, 5, 3, 1, 1] if phrase_type == 'opening' else [5, 5, 3, 1, 1, 3, 5, 1]
    elif genre.lower() == 'jazz':
        pattern = [1, 3, 5, 7, 6, 4, 2, 1] if phrase_type == 'opening' else [7, 5, 3, 1, 2, 4, 6, 1]
    else:
        pattern = [1, 2, 3, 4, 5, 4, 3, 1]
    
    # Convert scale degrees to notes
    for degree in pattern:
        if degree <= len(scale_notes):
            note_pitch = scale_notes[degree - 1]
            note_obj = note.Note(note_pitch, quarterLength=0.5)
            phrase.append(note_obj)
    
    return phrase

def create_chord_part(genre, key_sig, measures):
    chords = stream.Part()
    chords.partName = 'Chords'
    chords.instrument = get_chord_instrument(genre)
    
    # Get chord progression for genre
    progression = get_chord_progression(genre, key_sig)
    
    for measure in range(measures):
        chord_symbol = progression[measure % len(progression)]
        chord_obj = chord.Chord(chord_symbol, quarterLength=4.0)  # Whole note
        chords.append(chord_obj)
    
    return chords

def create_bass_part(genre, key_sig, measures):
    bass = stream.Part()
    bass.partName = 'Bass'
    bass.instrument = get_bass_instrument(genre)
    
    # Get bass line pattern
    key_obj = key.Key(key_sig)
    root_note = key_obj.tonic
    
    for measure in range(measures):
        bass_line = create_bass_line(root_note, genre, measure)
        bass.extend(bass_line)
    
    return bass

def create_bass_line(root_note, genre, measure):
    bass_notes = []
    
    if genre.lower() == 'rock':
        # Rock bass pattern: root, fifth, root, fifth
        fifth = root_note.transpose(interval.Interval('P5'))
        pattern = [root_note, fifth, root_note, fifth]
    elif genre.lower() == 'jazz':
        # Jazz walking bass
        second = root_note.transpose(interval.Interval('M2'))
        third = root_note.transpose(interval.Interval('M3'))
        fifth = root_note.transpose(interval.Interval('P5'))
        pattern = [root_note, third, fifth, second]
    else:  # Pop and other genres
        # Simple root-fifth pattern
        fifth = root_note.transpose(interval.Interval('P5'))
        pattern = [root_note, root_note, fifth, root_note]
    
    for p in pattern:
        bass_note = note.Note(p, quarterLength=1.0)
        bass_note.octave = 2  # Bass octave
        bass_notes.append(bass_note)
    
    return bass_notes

def get_chord_progression(genre, key_sig):
    """Get genre-appropriate chord progressions"""
    
    progressions = {
        'pop': ['C', 'G', 'Am', 'F'],
        'rock': ['Am', 'F', 'C', 'G'],
        'jazz': ['CM7', 'Am7', 'Dm7', 'G7'],
        'classical': ['C', 'F', 'G', 'C'],
        'electronic': ['Am', 'F', 'C', 'G'],
        'hip-hop': ['Am', 'F', 'C', 'G'],
        'country': ['C', 'F', 'G', 'C'],
        'r&b': ['CM7', 'Am7', 'FM7', 'G7']
    }
    
    return progressions.get(genre.lower(), progressions['pop'])

def get_melody_instrument(genre):
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
        'r&b': instrument.Piano()
    }
    
    return instruments.get(genre.lower(), instrument.Piano())

def get_chord_instrument(genre):
    """Get appropriate chord instrument for genre"""
    from music21 import instrument
    
    instruments = {
        'pop': instrument.Piano(),
        'rock': instrument.ElectricGuitar(),
        'jazz': instrument.Piano(),
        'classical': instrument.Piano(),
        'electronic': instrument.Synth(),
        'hip-hop': instrument.Piano(),
        'country': instrument.AcousticGuitar(),
        'r&b': instrument.ElectricPiano()
    }
    
    return instruments.get(genre.lower(), instrument.Piano())

def get_bass_instrument(genre):
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
    """Analyze the musical structure"""
    
    parts = []
    for part in score.parts:
        part_info = {
            'name': part.partName or 'Unknown',
            'instrument': str(part.instrument) if part.instrument else 'Unknown',
            'measures': len([m for m in part.getElementsByClass('Measure')]),
            'notes': len(part.flat.notes)
        }
        parts.append(part_info)
    
    return {
        'parts': parts,
        'total_measures': len([m for m in score.flat.getElementsByClass('Measure')]),
        'key_signature': str(score.analyze('key')),
        'time_signature': str(score.flat.getElementsByClass(meter.TimeSignature)[0]) if score.flat.getElementsByClass(meter.TimeSignature) else '4/4'
    }

if __name__ == '__main__':
    main()
