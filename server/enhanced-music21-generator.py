
#!/usr/bin/env python3
"""
Enhanced Music21 generator with lyrics-to-melody integration
"""

import sys
import json
import os
from music21 import stream, note, chord, meter, tempo, key, duration, pitch, scale, interval, bar
import random
import re

def main():
    if len(sys.argv) < 8:
        print("Usage: python enhanced-music21-generator.py <title> <lyrics> <genre> <tempo> <key> <duration> <output_path>")
        sys.exit(1)
    
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
        
        # Create the composition with lyrics integration
        score = create_enhanced_composition(title, lyrics, genre, tempo_bpm, key_sig, duration_seconds)
        
        # Write MIDI file
        score.write('midi', fp=output_path)
        print(f"✅ Enhanced MIDI file generated: {output_path}")
        
        # Generate comprehensive metadata
        metadata = generate_enhanced_metadata(title, lyrics, genre, tempo_bpm, key_sig, duration_seconds, score)
        
        metadata_path = output_path.replace('.mid', '_metadata.json')
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print("🎉 Enhanced composition completed successfully")
        
    except Exception as e:
        print(f"❌ Error generating enhanced music: {e}", file=sys.stderr)
        sys.exit(1)

def create_enhanced_composition(title, lyrics, genre, tempo_bpm, key_sig, duration_seconds):
    """Create enhanced composition with lyrics integration"""
    score = stream.Score()
    
    # Enhanced metadata
    score.metadata = {}
    score.metadata.title = title
    score.metadata.composer = 'Enhanced Music Generator AI'
    score.metadata.genre = genre
    
    # Musical setup
    score.append(meter.TimeSignature('4/4'))
    score.append(tempo.TempoIndication(number=tempo_bpm))
    score.append(key.KeySignature(key_sig))
    
    # Calculate measures
    beats_per_measure = 4
    measures = max(8, int((duration_seconds * tempo_bpm / 60) / beats_per_measure))
    
    # Analyze lyrics for musical inspiration
    lyric_analysis = analyze_lyrics_for_music(lyrics)
    
    # Create enhanced parts
    melody_part = create_lyrics_informed_melody(genre, key_sig, tempo_bpm, measures, lyric_analysis)
    harmony_part = create_enhanced_harmony(genre, key_sig, measures, lyric_analysis['emotion_arc'])
    bass_part = create_dynamic_bass(genre, key_sig, measures)
    
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

def create_lyrics_informed_melody(genre, key_sig, tempo_bpm, measures, lyric_analysis):
    """Create melody informed by lyrics analysis"""
    melody = stream.Part()
    melody.partName = 'Lyrics-Informed Melody'
    melody.instrument = get_genre_instrument(genre, 'melody')
    
    key_obj = key.Key(key_sig)
    scale_notes = key_obj.scale.pitches
    
    for measure in range(measures):
        phrase_idx = measure % len(lyric_analysis['musical_phrases'])
        phrase_data = lyric_analysis['musical_phrases'][phrase_idx]
        
        melody_phrase = create_melodic_phrase_from_lyrics(
            scale_notes, genre, phrase_data, tempo_bpm
        )
        melody.extend(melody_phrase)
    
    return melody

def create_melodic_phrase_from_lyrics(scale_notes, genre, phrase_data, tempo_bpm):
    """Create a melodic phrase based on lyric analysis"""
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
    
    # Generate notes
    for i, degree in enumerate(pattern):
        if degree <= len(scale_notes):
            note_pitch = scale_notes[degree - 1]
            
            # Rhythm based on syllable complexity
            if phrase_data['suggested_rhythm'] == 'complex':
                note_length = 0.25 if i % 3 == 0 else 0.5
            elif phrase_data['suggested_rhythm'] == 'simple':
                note_length = 1.0
            else:
                note_length = 0.5
            
            # Add expressive rests
            if random.random() < 0.15:  # 15% chance of rest
                phrase.append(note.Rest(quarterLength=note_length))
            else:
                note_obj = note.Note(note_pitch, quarterLength=note_length)
                
                # Dynamic markings based on emotion
                if emotion > 0.3:
                    note_obj.volume.velocity = 90  # Forte
                elif emotion < -0.3:
                    note_obj.volume.velocity = 60  # Piano
                else:
                    note_obj.volume.velocity = 75  # Mezzo
                
                phrase.append(note_obj)
    
    return phrase

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
    """Create chord with emotional coloring"""
    key_obj = key.Key(key_sig)
    root = key_obj.tonic
    
    # Basic triad
    chord_tones = [root, root.transpose('M3'), root.transpose('P5')]
    
    # Add emotional extensions
    if emotion > 0.3:  # Happy - add major 7th or 9th
        if random.random() > 0.5:
            chord_tones.append(root.transpose('M7'))
    elif emotion < -0.3:  # Sad - add minor colors
        chord_tones[1] = root.transpose('m3')  # Make it minor
        if random.random() > 0.5:
            chord_tones.append(root.transpose('m7'))
    
    # Genre-specific voicings
    if genre.lower() == 'jazz':
        chord_tones.append(root.transpose('m7'))  # Always add 7th in jazz
        if random.random() > 0.3:
            chord_tones.append(root.transpose('M9'))  # Add 9th
    elif genre.lower() == 'electronic':
        # Wider voicing for electronic
        chord_tones = [
            root.transpose(-12),  # Bass note
            root,
            root.transpose('M3'),
            root.transpose('P5'),
            root.transpose(12)    # High octave
        ]
    
    return chord.Chord(chord_tones)

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
    """Generate bass pattern based on genre"""
    bass_notes = []
    
    if genre.lower() == 'electronic':
        # Syncopated electronic bass
        pattern = [root_note, None, root_note.transpose('P5'), root_note]
        durations = [0.75, 0.25, 0.5, 1.5]  # Syncopated rhythm
        
        for note_pitch, duration in zip(pattern, durations):
            if note_pitch:
                bass_note = note.Note(note_pitch, quarterLength=duration)
                bass_note.octave = 2
                bass_note.volume.velocity = 85
                bass_notes.append(bass_note)
            else:
                bass_notes.append(note.Rest(quarterLength=duration))
                
    elif genre.lower() == 'rock':
        # Driving rock bass
        pattern = [root_note] * 4  # Four quarter notes
        for note_pitch in pattern:
            bass_note = note.Note(note_pitch, quarterLength=1.0)
            bass_note.octave = 2
            bass_note.volume.velocity = 95
            bass_notes.append(bass_note)
            
    elif genre.lower() == 'jazz':
        # Walking jazz bass
        intervals = ['M2', 'M3', 'P4', 'P5']
        for i in range(4):
            interval_choice = intervals[i % len(intervals)]
            bass_pitch = root_note.transpose(interval_choice)
            bass_note = note.Note(bass_pitch, quarterLength=1.0)
            bass_note.octave = 2
            bass_note.volume.velocity = 75
            bass_notes.append(bass_note)
    else:
        # Standard pop/rock bass
        fifth = root_note.transpose('P5')
        pattern = [root_note, root_note, fifth, root_note]
        for note_pitch in pattern:
            bass_note = note.Note(note_pitch, quarterLength=1.0)
            bass_note.octave = 2
            bass_note.volume.velocity = 80
            bass_notes.append(bass_note)
    
    return bass_notes

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
