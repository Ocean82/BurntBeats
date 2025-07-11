#!/usr/bin/env python3
import sys
import json
import argparse
import os
import math
import random
from pathlib import Path

def generate_music(title, lyrics, genre, tempo, key, duration, output_path, instrumental_only=False):
    """Generate real musical composition with melody, harmony, and rhythm"""
    print(f"🎵 Generating music: {title}")
    print(f"Genre: {genre}, Tempo: {tempo}, Key: {key}, Duration: {duration}s")

    # Generate UUID-based filename if using default
    if output_path == 'output.mp3' or os.path.basename(output_path) == 'output.mp3':
        import uuid
        import time
        timestamp = int(time.time())
        unique_id = str(uuid.uuid4())[:8]
        safe_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).rstrip()[:20]
        filename = f"{safe_title}_{timestamp}_{unique_id}.wav"
        output_path = os.path.join(os.path.dirname(output_path) or 'uploads', filename)
        print(f"🎯 Auto-generated unique filename: {output_path}")

    # Ensure we're working with .wav extension
    if output_path.endswith('.mp3'):
        output_path = output_path.replace('.mp3', '.wav')
        print(f"🔄 Converting output to WAV format: {output_path}")

    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # Get musical parameters
    root_freq = get_base_frequency(key)
    scale_notes = get_scale_frequencies(root_freq, genre)
    chord_progression = get_chord_progression(genre, root_freq)

    # Audio parameters
    sample_rate = 44100
    duration_samples = int(sample_rate * duration)

    # Generate complex musical composition
    audio_data = generate_composition(
        scale_notes, chord_progression, tempo, duration_samples, sample_rate, genre, lyrics, instrumental_only
    )

    # Write stereo WAV file
    write_stereo_wav(output_path, audio_data, sample_rate)

    # Embed lyrics metadata in the audio file
    embed_lyrics_metadata(output_path, title, lyrics, genre, tempo, key)

    # Optionally convert to MP3 for smaller file size
    mp3_path = convert_to_mp3(output_path, title, lyrics)

    return {
        "wav_path": output_path,
        "mp3_path": mp3_path,
        "metadata": {
            "title": title,
            "genre": genre,
            "tempo": tempo,
            "key": key,
            "duration": duration,
            "lyrics_included": bool(lyrics),
            "format": "stereo_wav_with_mp3_option"
        }
    }

def generate_composition(scale_notes, chord_progression, tempo, duration_samples, sample_rate, genre, lyrics, instrumental_only):
    """Generate a complete musical composition with multiple layers"""

    # Initialize stereo audio data
    left_channel = [0.0] * duration_samples
    right_channel = [0.0] * duration_samples

    # Time parameters
    beats_per_second = tempo / 60.0
    samples_per_beat = int(sample_rate / beats_per_second)
    total_beats = int(duration_samples / samples_per_beat)

    # Generate melody line
    melody = generate_melody(scale_notes, total_beats, samples_per_beat, genre, lyrics)

    # Generate bass line
    bass = generate_bass_line(chord_progression, total_beats, samples_per_beat, genre)

    # Generate chord accompaniment
    chords = generate_chord_accompaniment(chord_progression, total_beats, samples_per_beat, genre)

    # Generate drums/percussion
    drums = generate_drum_pattern(total_beats, samples_per_beat, genre)

    # Mix all elements together
    for i in range(duration_samples):
        # Combine all musical elements with appropriate volumes
        melody_volume = 0.4 if not instrumental_only else 0.6
        left_sample = (
            melody[i] * melody_volume +           # Lead melody
            bass[i] * 0.3 +             # Bass line
            chords[i] * 0.2 +           # Chord accompaniment
            drums[i] * 0.1              # Percussion
        )

        right_sample = (
            melody[i] * (melody_volume - 0.05) +          # Slightly different mix for stereo
            bass[i] * 0.3 +
            chords[i] * 0.25 +
            drums[i] * 0.1
        )

        # Apply gentle compression and limiting
        left_channel[i] = max(-1.0, min(1.0, left_sample * 0.8))
        right_channel[i] = max(-1.0, min(1.0, right_sample * 0.8))

    return left_channel, right_channel

def generate_melody(scale_notes, total_beats, samples_per_beat, genre, lyrics):
    """Generate an expressive melody line with lyrics-driven phrasing"""
    melody = [0.0] * (total_beats * samples_per_beat)

    # Analyze lyrics for melodic inspiration
    words = lyrics.lower().split() if lyrics else ['la', 'la', 'la', 'la']
    emotional_weight = analyze_emotional_content(lyrics)

    # Syllable-based phrasing
    syllable_counts = [count_syllables(word) for word in words]
    phrase_structure = analyze_lyric_phrases(lyrics)

    current_note_index = 0
    note_duration = 2 if genre == 'ballad' else 1  # Longer notes for ballads

    print(f"🎼 Melody generation with {len(words)} words, {sum(syllable_counts)} syllables")

    for beat in range(0, total_beats, note_duration):
        # Choose note based on song structure and emotion
        if beat < total_beats * 0.25:  # Intro/verse
            note_range = scale_notes[:5]
        elif beat < total_beats * 0.75:  # Chorus
            note_range = scale_notes[2:7]
        else:  # Bridge/outro
            note_range = scale_notes[1:6]

        # Select note with some musical intelligence
        if current_note_index < len(words):
            word = words[current_note_index]
            note_freq = choose_note_for_word(word, note_range, emotional_weight)
            current_note_index += 1
        else:
            note_freq = random.choice(note_range)

        # Generate note with vibrato and expression
        start_sample = beat * samples_per_beat
        end_sample = min((beat + note_duration) * samples_per_beat, len(melody))

        for i in range(start_sample, end_sample):
            t = (i - start_sample) / samples_per_beat

            # Add vibrato (slight frequency modulation)
            vibrato = 1.0 + 0.02 * math.sin(2 * math.pi * 5 * t)

            # Add envelope (attack, sustain, release)
            envelope = calculate_envelope(t, note_duration)

            # Generate the note
            melody[i] = envelope * 0.6 * math.sin(2 * math.pi * note_freq * vibrato * t / samples_per_beat)

    return melody

def generate_bass_line(chord_progression, total_beats, samples_per_beat, genre):
    """Generate a rhythmic bass line"""
    bass = [0.0] * (total_beats * samples_per_beat)

    chord_duration = 4  # Each chord lasts 4 beats
    bass_pattern = get_bass_pattern(genre)

    for beat in range(total_beats):
        chord_index = (beat // chord_duration) % len(chord_progression)
        bass_freq = chord_progression[chord_index] / 2  # Bass octave

        pattern_index = beat % len(bass_pattern)
        if bass_pattern[pattern_index]:  # Play bass note
            start_sample = beat * samples_per_beat
            end_sample = start_sample + samples_per_beat

            for i in range(start_sample, min(end_sample, len(bass))):
                t = (i - start_sample) / samples_per_beat
                envelope = max(0, 1 - t * 2)  # Quick decay
                bass[i] = envelope * 0.8 * math.sin(2 * math.pi * bass_freq * t)

    return bass

def generate_chord_accompaniment(chord_progression, total_beats, samples_per_beat, genre):
    """Generate chord accompaniment"""
    chords = [0.0] * (total_beats * samples_per_beat)

    chord_duration = 4
    strum_pattern = get_strum_pattern(genre)

    for beat in range(total_beats):
        chord_index = (beat // chord_duration) % len(chord_progression)
        root_freq = chord_progression[chord_index]

        pattern_index = beat % len(strum_pattern)
        if strum_pattern[pattern_index]:
            start_sample = beat * samples_per_beat
            end_sample = start_sample + samples_per_beat // 2

            # Generate major triad
            frequencies = [root_freq, root_freq * 1.25, root_freq * 1.5]  # Root, third, fifth

            for i in range(start_sample, min(end_sample, len(chords))):
                t = (i - start_sample) / samples_per_beat
                envelope = max(0, 1 - t * 3)

                chord_sample = 0
                for freq in frequencies:
                    chord_sample += 0.3 * math.sin(2 * math.pi * freq * t)

                chords[i] = envelope * chord_sample

    return chords

def generate_drum_pattern(total_beats, samples_per_beat, genre):
    """Generate basic drum pattern"""
    drums = [0.0] * (total_beats * samples_per_beat)

    kick_pattern, snare_pattern = get_drum_patterns(genre)

    for beat in range(total_beats):
        start_sample = beat * samples_per_beat

        # Kick drum
        if kick_pattern[beat % len(kick_pattern)]:
            for i in range(start_sample, min(start_sample + samples_per_beat // 4, len(drums))):
                t = (i - start_sample) / samples_per_beat
                envelope = max(0, 1 - t * 8)
                drums[i] += envelope * 0.5 * math.sin(2 * math.pi * 60 * t)  # Low frequency kick

        # Snare drum
        if snare_pattern[beat % len(snare_pattern)]:
            for i in range(start_sample, min(start_sample + samples_per_beat // 6, len(drums))):
                t = (i - start_sample) / samples_per_beat
                envelope = max(0, 1 - t * 10)
                # Snare = filtered noise + tone
                noise = random.uniform(-1, 1) * 0.3
                tone = 0.2 * math.sin(2 * math.pi * 200 * t)
                drums[i] += envelope * (noise + tone)

    return drums

def get_scale_frequencies(root_freq, genre):
    """Get scale frequencies based on genre"""
    # Major scale ratios
    major_ratios = [1.0, 1.125, 1.25, 1.333, 1.5, 1.667, 1.875, 2.0]

    if genre in ['blues', 'jazz']:
        # Add blue notes
        ratios = [1.0, 1.125, 1.2, 1.25, 1.333, 1.4, 1.5, 1.667, 1.8, 1.875, 2.0]
    elif genre == 'minor':
        # Natural minor scale
        ratios = [1.0, 1.125, 1.2, 1.333, 1.5, 1.6, 1.8, 2.0]
    else:
        ratios = major_ratios

    return [root_freq * ratio for ratio in ratios]

def get_chord_progression(genre, root_freq):
    """Get chord progression based on genre"""
    progressions = {
        'pop': [1.0, 0.75, 1.125, 1.0],      # I-vi-V-I
        'rock': [1.0, 1.333, 0.75, 1.0],     # I-IV-vi-I  
        'blues': [1.0, 1.333, 1.0, 1.0],     # I-IV-I-I
        'jazz': [1.0, 0.75, 1.125, 1.0],     # I-vi-ii-V
        'country': [1.0, 1.333, 1.125, 1.0], # I-IV-V-I
    }

    ratios = progressions.get(genre, progressions['pop'])
    return [root_freq * ratio for ratio in ratios]

def get_bass_pattern(genre):
    """Get bass playing pattern"""
    patterns = {
        'pop': [True, False, True, False],
        'rock': [True, False, False, True],
        'blues': [True, False, True, True],
        'jazz': [True, True, False, True],
    }
    return patterns.get(genre, patterns['pop'])

def get_strum_pattern(genre):
    """Get chord strumming pattern"""
    patterns = {
        'pop': [True, False, True, False],
        'rock': [True, True, False, True],
        'blues': [True, False, False, True],
        'ballad': [True, False, False, False],
    }
    return patterns.get(genre, patterns['pop'])

def get_drum_patterns(genre):
    """Get kick and snare patterns"""
    patterns = {
        'pop': ([True, False, False, False], [False, False, True, False]),
        'rock': ([True, False, True, False], [False, True, False, True]),
        'blues': ([True, False, True, True], [False, False, True, False]),
    }
    return patterns.get(genre, patterns['pop'])

def analyze_emotional_content(lyrics):
    """Simple emotional analysis of lyrics"""
    if not lyrics:
        return 0.5

    positive_words = ['love', 'happy', 'joy', 'bright', 'beautiful', 'amazing', 'wonderful', 'dream', 'hope']
    negative_words = ['sad', 'cry', 'pain', 'dark', 'lost', 'broken', 'hurt', 'alone', 'fear']

    words = lyrics.lower().split()
    positive_count = sum(1 for word in words if word in positive_words)
    negative_count = sum(1 for word in words if word in negative_words)

    return (positive_count + 0.5) / (positive_count + negative_count + 1)

def count_syllables(word):
    """Count syllables in a word for rhythmic phrasing"""
    word = word.lower().strip(".,!?;:")
    if not word:
        return 1

    vowels = "aeiouy"
    syllable_count = 0
    prev_was_vowel = False

    for char in word:
        if char in vowels:
            if not prev_was_vowel:
                syllable_count += 1
            prev_was_vowel = True
        else:
            prev_was_vowel = False

    # Handle silent 'e' and minimum syllable rules
    if word.endswith('e') and syllable_count > 1:
        syllable_count -= 1

    return max(1, syllable_count)

def analyze_lyric_phrases(lyrics):
    """Analyze lyric structure for verse/chorus detection"""
    if not lyrics:
        return {"verses": [], "chorus": [], "bridge": []}

    lines = [line.strip() for line in lyrics.split('\n') if line.strip()]

    # Simple structure detection based on repetition and rhyme
    phrase_structure = {
        "verses": [],
        "chorus": [],
        "bridge": [],
        "total_lines": len(lines),
        "estimated_sections": max(1, len(lines) // 4)
    }

    # Detect repeated lines (likely chorus)
    line_counts = {}
    for line in lines:
        line_counts[line] = line_counts.get(line, 0) + 1

    repeated_lines = [line for line, count in line_counts.items() if count > 1]

    for i, line in enumerate(lines):
        if line in repeated_lines:
            phrase_structure["chorus"].append({"line": line, "position": i})
        elif i < len(lines) * 0.6:  # First 60% likely verses
            phrase_structure["verses"].append({"line": line, "position": i})
        else:  # Later lines might be bridge
            phrase_structure["bridge"].append({"line": line, "position": i})

    return phrase_structure

def choose_note_for_word(word, note_range, emotional_weight):
    """Choose musical note based on word characteristics"""
    # Simple mapping based on word length and vowels
    vowel_count = sum(1 for char in word.lower() if char in 'aeiou')
    word_length = len(word)

    # Higher notes for positive emotions and more vowels
    note_index = int((vowel_count / max(word_length, 1) + emotional_weight) * len(note_range))
    note_index = max(0, min(note_index, len(note_range) - 1))

    return note_range[note_index]

def calculate_envelope(t, note_duration):
    """Calculate note envelope (attack, sustain, release)"""
    attack_time = 0.1
    release_time = 0.3

    if t < attack_time:
        return t / attack_time
    elif t > note_duration - release_time:
        return (note_duration - t) / release_time
    else:
        return 1.0

def write_stereo_wav(output_path, audio_data, sample_rate):
    """Write stereo WAV file"""
    left_channel, right_channel = audio_data
    duration_samples = len(left_channel)

    with open(output_path, 'wb') as f:
        # WAV header for stereo
        f.write(b'RIFF')
        f.write((36 + duration_samples * 4).to_bytes(4, 'little'))  # 4 bytes per sample (stereo)
        f.write(b'WAVE')
        f.write(b'fmt ')
        f.write((16).to_bytes(4, 'little'))
        f.write((1).to_bytes(2, 'little'))   # PCM
        f.write((2).to_bytes(2, 'little'))   # Stereo
        f.write(sample_rate.to_bytes(4, 'little'))
        f.write((sample_rate * 4).to_bytes(4, 'little'))
        f.write((4).to_bytes(2, 'little'))
        f.write((16).to_bytes(2, 'little'))
        f.write(b'data')
        f.write((duration_samples * 4).to_bytes(4, 'little'))

        # Write interleaved stereo samples
        for i in range(duration_samples):
            left_sample = int(32767 * max(-1, min(1, left_channel[i])))
            right_sample = int(32767 * max(-1, min(1, right_channel[i])))
            f.write(left_sample.to_bytes(2, 'little', signed=True))
            f.write(right_sample.to_bytes(2, 'little', signed=True))

def get_base_frequency(key):
    """Get base frequency for musical key"""
    key_frequencies = {
        'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13,
        'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
        'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
    }
    return key_frequencies.get(key.upper(), 261.63)

def embed_lyrics_metadata(wav_path, title, lyrics, genre, tempo, key):
    """Embed lyrics and metadata into the WAV file"""
    try:
        # Create a simple metadata JSON file alongside the WAV
        metadata = {
            "title": title,
            "lyrics": lyrics,
            "genre": genre,
            "tempo": tempo,
            "key": key,
            "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "syllable_count": sum(count_syllables(word) for word in lyrics.split()) if lyrics else 0
        }

        metadata_path = wav_path.replace('.wav', '_metadata.json')
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)

        print(f"📝 Metadata saved: {metadata_path}")
    except Exception as e:
        print(f"⚠️ Could not embed metadata: {e}")

def convert_to_mp3(wav_path, title, lyrics):
    """Convert WAV to MP3 for smaller file size"""
    try:
        mp3_path = wav_path.replace('.wav', '.mp3')

        # Try using ffmpeg for conversion
        import subprocess
        cmd = [
            'ffmpeg', '-i', wav_path,
            '-codec:a', 'libmp3lame',
            '-b:a', '192k',
            '-metadata', f'title={title}',
            '-metadata', f'comment={lyrics[:100]}...' if len(lyrics) > 100 else lyrics,
            mp3_path, '-y'
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode == 0:
            print(f"🎵 MP3 conversion successful: {mp3_path}")
            return mp3_path
        else:
            print(f"⚠️ MP3 conversion failed: {result.stderr}")
            return None

    except Exception as e:
        print(f"⚠️ MP3 conversion not available: {e}")
        return None

def main():
    parser = argparse.ArgumentParser(description='Enhanced Music Generator')
    parser.add_argument('--title', required=True, help='Song title')
    parser.add_argument('--lyrics', required=True, help='Song lyrics')
    parser.add_argument('--genre', default='pop', help='Music genre')
    parser.add_argument('--tempo', type=int, default=120, help='Tempo in BPM')
    parser.add_argument('--key', default='C', help='Musical key')
    parser.add_argument('--duration', type=int, default=30, help='Duration in seconds')
    parser.add_argument('--output_path', required=True, help='Output file path')
    parser.add_argument('--instrumental_only', action='store_true', help='Generate instrumental only')

    args = parser.parse_args()

    try:
        import uuid
        import time

        result = generate_music(
            args.title, args.lyrics, args.genre, 
            args.tempo, args.key, args.duration, args.output_path, args.instrumental_only
        )

        if isinstance(result, dict):
            print("✅ Music generated successfully:")
            print(f"WAV: {result['wav_path']}")
            if result.get('mp3_path'):
                print(f"MP3: {result['mp3_path']}")
            print(f"SUCCESS: {result['wav_path']}")
        else:
            # Fallback for old return format
            print("✅ Music generated:", args.output_path)
            print(f"SUCCESS: {args.output_path}")

    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()