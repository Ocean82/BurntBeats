
#!/usr/bin/env python3
"""
Enhanced Music21 generator with lyrics-to-melody integration
"""

import sys
import json
import os
from music21 import stream, note, chord, meter, tempo, key, duration, pitch, scale, interval, bar
from music21 import analysis, roman, features, graph, corpus, converter, metadata
from music21.alpha import analysis as alpha_analysis
import random
import re
import math

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
    """Create a melodic phrase based on lyric analysis with proper music21 objects"""
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
    
    # Generate advanced rhythmic patterns based on genre and lyrics
    rhythm_pattern = create_advanced_rhythm_pattern(genre, phrase_data, tempo_bpm)
    
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
            duration = 1.0/3 if remaining_beats >= 1.0/3 else remaining_beats
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
