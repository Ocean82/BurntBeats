#!/usr/bin/env python3

import sys
import json
from music21 import stream, note, chord, tempo, key, scale
import pretty_midi
import numpy as np
from scipy.io import wavfile
import os

def generate_chord_progression(song_key, genre):
    """Generate chord progression based on genre and key"""
    progressions = {
        'pop': ['I', 'V', 'vi', 'IV'],
        'rock': ['I', 'VII', 'IV', 'I'],
        'jazz': ['I', 'vi', 'ii', 'V'],
        'electronic': ['vi', 'IV', 'I', 'V'],
        'classical': ['I', 'vi', 'IV', 'V'],
        'hip-hop': ['i', 'VII', 'VI', 'VII'],
        'country': ['I', 'IV', 'V', 'I'],
        'r&b': ['ii', 'V', 'I', 'vi']
    }
    
    progression = progressions.get(genre.lower(), progressions['pop'])
    return progression

def create_melody(song_key, progression, bars=8):
    """Create a melody line based on chord progression"""
    key_obj = key.Key(song_key)
    melody_stream = stream.Stream()
    
    # Define scale for melody
    scale_notes = key_obj.getScale().pitches
    
    for i in range(bars):
        # Create 4 quarter notes per bar
        for beat in range(4):
            # Choose notes from the current chord or scale
            if np.random.random() > 0.3:  # 70% chance of playing a note
                note_choice = np.random.choice(scale_notes[:7])  # Stay in one octave
                note_obj = note.Note(note_choice, quarterLength=1.0)
                melody_stream.append(note_obj)
            else:
                # Rest
                rest = note.Rest(quarterLength=1.0)
                melody_stream.append(rest)
    
    return melody_stream

def create_chord_track(song_key, progression, bars=8):
    """Create chord accompaniment"""
    key_obj = key.Key(song_key)
    chord_stream = stream.Stream()
    
    roman_numerals = {
        'I': 1, 'ii': 2, 'iii': 3, 'IV': 4, 'V': 5, 'vi': 6, 'VII': 7,
        'i': 1, 'bII': 2, 'bIII': 3, 'iv': 4, 'v': 5, 'bVI': 6, 'bVII': 7
    }
    
    for i in range(bars):
        # Get chord for this bar
        chord_numeral = progression[i % len(progression)]
        chord_degree = roman_numerals.get(chord_numeral, 1)
        
        # Create triad
        root = key_obj.getScale().pitches[chord_degree - 1]
        third = key_obj.getScale().pitches[(chord_degree + 1) % 7]
        fifth = key_obj.getScale().pitches[(chord_degree + 3) % 7]
        
        chord_obj = chord.Chord([root, third, fifth], quarterLength=4.0)
        chord_stream.append(chord_obj)
    
    return chord_stream

def create_bass_line(song_key, progression, bars=8):
    """Create bass line following chord progression"""
    key_obj = key.Key(song_key)
    bass_stream = stream.Stream()
    
    roman_numerals = {
        'I': 1, 'ii': 2, 'iii': 3, 'IV': 4, 'V': 5, 'vi': 6, 'VII': 7,
        'i': 1, 'bII': 2, 'bIII': 3, 'iv': 4, 'v': 5, 'bVI': 6, 'bVII': 7
    }
    
    for i in range(bars):
        chord_numeral = progression[i % len(progression)]
        chord_degree = roman_numerals.get(chord_numeral, 1)
        
        # Root note of chord, played in lower octave
        root_note = key_obj.getScale().pitches[chord_degree - 1]
        root_note.octave = 3  # Lower octave for bass
        
        # Create bass pattern (root on beats 1 and 3)
        bass_note1 = note.Note(root_note, quarterLength=2.0)
        bass_note2 = note.Note(root_note, quarterLength=2.0)
        
        bass_stream.append(bass_note1)
        bass_stream.append(bass_note2)
    
    return bass_stream

def generate_song(title, lyrics, genre, tempo_bpm, song_key='C', duration_seconds=210):
    """Generate a complete song with melody, chords, and bass"""
    
    # Calculate number of bars based on duration and tempo
    beats_per_second = tempo_bpm / 60
    total_beats = duration_seconds * beats_per_second
    bars = max(8, int(total_beats / 4))  # 4 beats per bar, minimum 8 bars
    
    # Create main score
    score = stream.Score()
    
    # Add tempo and key signature
    score.append(tempo.TempoIndication(number=tempo_bpm))
    score.append(key.Key(song_key))
    
    # Generate chord progression
    progression = generate_chord_progression(song_key, genre)
    
    # Create musical parts
    melody = create_melody(song_key, progression, bars)
    chords = create_chord_track(song_key, progression, bars)
    bass = create_bass_line(song_key, progression, bars)
    
    # Set instruments
    melody.insert(0, tempo.TempoIndication(number=tempo_bpm))
    chords.insert(0, tempo.TempoIndication(number=tempo_bpm))
    bass.insert(0, tempo.TempoIndication(number=tempo_bpm))
    
    # Add parts to score
    score.append(melody)
    score.append(chords)
    score.append(bass)
    
    return score

def export_to_midi_and_wav(score, output_path):
    """Export music21 score to MIDI and then convert to WAV"""
    
    # Export to MIDI first
    midi_path = output_path.replace('.mp3', '.mid')
    score.write('midi', fp=midi_path)
    
    # Convert MIDI to audio using pretty_midi
    midi_data = pretty_midi.PrettyMIDI(midi_path)
    
    # Synthesize audio
    audio = midi_data.synthesize(fs=44100)
    
    # Normalize audio
    audio = audio / np.max(np.abs(audio)) * 0.7
    
    # Save as WAV
    wav_path = output_path.replace('.mp3', '.wav')
    wavfile.write(wav_path, 44100, (audio * 32767).astype(np.int16))
    
    return wav_path

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python music-generator.py <song_data_json>")
        sys.exit(1)
    
    try:
        song_data = json.loads(sys.argv[1])
        
        # Extract song parameters
        title = song_data.get('title', 'Untitled')
        lyrics = song_data.get('lyrics', '')
        genre = song_data.get('genre', 'pop')
        tempo_bpm = song_data.get('tempo', 120)
        duration = song_data.get('duration', 30)
        output_path = song_data.get('output_path', 'output.mp3')
        song_key = song_data.get('key', 'C')
        
        # Generate the musical score
        score = generate_song(title, lyrics, genre, tempo_bpm, song_key, duration)
        
        # Export to audio file
        wav_path = export_to_midi_and_wav(score, output_path)
        
        print(json.dumps({
            "success": True,
            "wav_path": wav_path,
            "midi_path": output_path.replace('.mp3', '.mid'),
            "message": f"Generated {genre} song in {song_key} major at {tempo_bpm} BPM"
        }))
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))
        sys.exit(1)