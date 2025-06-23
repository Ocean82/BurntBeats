import numpy as np
import matplotlib.pyplot as plt
import re
from dataclasses import dataclass
from typing import List, Dict, Tuple, Optional
import json

@dataclass
class Note:
    """Represents a musical note"""
    pitch: int  # MIDI note number (60 = middle C)
    duration: float  # Duration in beats
    velocity: int = 80  # Volume (0-127)
    syllable: str = ""  # Associated syllable/word

@dataclass
class Phrase:
    """Represents a musical phrase"""
    notes: List[Note]
    start_beat: float
    emotion_weight: float
    stress_pattern: List[bool]  # True for stressed syllables

class LyricsToMelodyGenerator:
    """Advanced lyrics to melody conversion system"""
    
    def __init__(self):
        # Musical scales and modes
        self.scales = {
            'major': [0, 2, 4, 5, 7, 9, 11],
            'minor': [0, 2, 3, 5, 7, 8, 10],
            'dorian': [0, 2, 3, 5, 7, 9, 10],
            'mixolydian': [0, 2, 4, 5, 7, 9, 10],
            'pentatonic_major': [0, 2, 4, 7, 9],
            'pentatonic_minor': [0, 3, 5, 7, 10],
            'blues': [0, 3, 5, 6, 7, 10]
        }
        
        # Emotion to scale mapping
        self.emotion_scales = {
            'happy': 'major',
            'sad': 'minor',
            'nostalgic': 'dorian',
            'dreamy': 'pentatonic_major',
            'melancholy': 'pentatonic_minor',
            'bluesy': 'blues',
            'uplifting': 'mixolydian'
        }
        
        # Syllable stress patterns for common words
        self.stress_patterns = {
            'beautiful': [True, False, False],
            'amazing': [False, True, False],
            'wonderful': [True, False, False],
            'together': [False, True, False],
            'forever': [False, True, False],
            'remember': [False, True, False],
            'believe': [False, True],
            'freedom': [True, False],
            'sunshine': [True, False]
        }
        
        # Emotional word weights
        self.emotion_weights = {
            # Positive emotions
            'love': 0.9, 'joy': 0.8, 'happy': 0.7, 'beautiful': 0.6,
            'amazing': 0.7, 'wonderful': 0.8, 'perfect': 0.6, 'dream': 0.5,
            'sunshine': 0.7, 'freedom': 0.6, 'hope': 0.5, 'smile': 0.6,
            
            # Negative emotions
            'sad': -0.7, 'pain': -0.8, 'hurt': -0.6, 'broken': -0.7,
            'lonely': -0.6, 'dark': -0.5, 'tears': -0.6, 'goodbye': -0.5,
            'lost': -0.6, 'empty': -0.7, 'cold': -0.4, 'fear': -0.6,
            
            # Neutral/contextual
            'time': 0.0, 'day': 0.1, 'night': -0.2, 'way': 0.0,
            'life': 0.2, 'world': 0.1, 'heart': 0.3, 'soul': 0.2
        }
    
    def analyze_syllables(self, text: str) -> List[Dict]:
        """Analyze syllables in text with stress patterns"""
        # Simple syllable counting (in production, use pyphen or similar)
        words = re.findall(r'\b\w+\b', text.lower())
        syllable_data = []
        
        for word in words:
            # Estimate syllable count
            syllable_count = max(1, len(re.findall(r'[aeiouAEIOU]', word)))
            
            # Get stress pattern
            if word in self.stress_patterns:
                stress = self.stress_patterns[word]
            else:
                # Default stress pattern based on syllable count
                if syllable_count == 1:
                    stress = [True]
                elif syllable_count == 2:
                    stress = [True, False]  # Most 2-syllable words are trochaic
                else:
                    # Alternate pattern for longer words
                    stress = [i % 2 == 0 for i in range(syllable_count)]
            
            # Get emotional weight
            emotion_weight = self.emotion_weights.get(word, 0.0)
            
            syllable_data.append({
                'word': word,
                'syllable_count': syllable_count,
                'stress_pattern': stress,
                'emotion_weight': emotion_weight
            })
        
        return syllable_data
    
    def convert_lyrics_to_melody(self, lyrics: str, genre: str = 'pop', 
                                tempo: int = 120, key_preference: Optional[str] = None) -> Dict:
        """Main function to convert lyrics to melody"""
        print(f"🎵 Converting lyrics to melody...")
        print(f"Genre: {genre}, Tempo: {tempo} BPM")
        
        # Analyze lyrical structure
        lines = [line.strip() for line in lyrics.split('\n') if line.strip()]
        emotional_arc = []
        melody_lines = []
        
        # Determine key and scale
        avg_emotion = 0
        for line in lines:
            words = line.lower().split()
            line_emotion = np.mean([self.emotion_weights.get(word, 0.0) for word in words])
            emotional_arc.append(line_emotion)
            avg_emotion += line_emotion
        
        avg_emotion = avg_emotion / len(lines) if lines else 0
        
        # Choose scale based on emotion
        if avg_emotion > 0.3:
            scale_name = 'major'
        elif avg_emotion < -0.3:
            scale_name = 'minor'
        else:
            scale_name = 'dorian'
        
        # Choose root note
        root_note = np.random.choice([60, 62, 64, 67])  # C, D, E, G
        scale_notes = self.scales[scale_name]
        
        print(f"🎼 Key: {self.midi_to_note_name(root_note)}, Scale: {scale_name}")
        
        # Generate melody for each line
        current_beat = 0
        
        for line_idx, line in enumerate(lines):
            print(f"🎶 Processing line {line_idx + 1}: '{line[:30]}...'")
            
            syllable_data = self.analyze_syllables(line)
            emotion_weight = emotional_arc[line_idx]
            
            # Generate notes for this line
            notes = []
            current_pitch = root_note + 12  # Start an octave above root
            
            for word_data in syllable_data:
                word = word_data['word']
                stress_pattern = word_data['stress_pattern']
                word_emotion = word_data['emotion_weight']
                
                for syl_idx, is_stressed in enumerate(stress_pattern):
                    # Calculate pitch change
                    if is_stressed:
                        pitch_change = 2 + int(word_emotion * 2)
                    else:
                        pitch_change = -1 + int(word_emotion)
                    
                    # Add randomness
                    pitch_change += np.random.choice([-1, 0, 1])
                    current_pitch += pitch_change
                    
                    # Constrain to scale
                    scale_degree = (current_pitch - root_note) % 12
                    if scale_degree not in scale_notes:
                        distances = [abs(scale_degree - note) for note in scale_notes]
                        nearest_idx = distances.index(min(distances))
                        scale_degree = scale_notes[nearest_idx]
                    
                    final_pitch = root_note + scale_degree + ((current_pitch - root_note) // 12) * 12
                    
                    # Calculate duration and velocity
                    duration = 0.75 if is_stressed else 0.5
                    duration = duration * (120 / tempo)  # Adjust for tempo
                    
                    velocity = 90 if is_stressed else 70
                    velocity += int(abs(word_emotion) * 20)
                    velocity = max(40, min(127, velocity))
                    
                    syllable_text = f"{word}[{syl_idx}]" if len(stress_pattern) > 1 else word
                    
                    note = Note(
                        pitch=final_pitch,
                        duration=duration,
                        velocity=velocity,
                        syllable=syllable_text
                    )
                    notes.append(note)
                    current_beat += duration
            
            # Create phrase
            phrase = Phrase(
                notes=notes,
                start_beat=current_beat - sum(n.duration for n in notes),
                emotion_weight=emotion_weight,
                stress_pattern=[n.velocity > 80 for n in notes]
            )
            melody_lines.append(phrase)
        
        result = {
            'lyrics': lyrics,
            'key': root_note,
            'scale': scale_name,
            'tempo': tempo,
            'melody_lines': melody_lines,
            'total_duration': current_beat,
            'note_count': sum(len(phrase.notes) for phrase in melody_lines),
            'emotional_arc': emotional_arc
        }
        
        print(f"✅ Generated melody: {result['note_count']} notes, {result['total_duration']:.1f} beats")
        return result
    
    def midi_to_note_name(self, midi_note: int) -> str:
        """Convert MIDI note number to note name"""
        note_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        octave = (midi_note // 12) - 1
        note = note_names[midi_note % 12]
        return f"{note}{octave}"
    
    def visualize_melody(self, melody_data: Dict):
        """Visualize the generated melody"""
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(15, 10))
        
        # Pitch contour
        all_notes = []
        all_times = []
        current_time = 0
        
        for phrase in melody_data['melody_lines']:
            for note in phrase.notes:
                all_notes.append(note.pitch)
                all_times.append(current_time)
                current_time += note.duration
        
        ax1.plot(all_times, all_notes, 'o-', linewidth=2, markersize=6, color='purple')
        ax1.set_xlabel('Time (beats)')
        ax1.set_ylabel('Pitch (MIDI note)')
        ax1.set_title(f'Melody Contour - Key: {self.midi_to_note_name(melody_data["key"])} {melody_data["scale"]}')
        ax1.grid(True, alpha=0.3)
        
        # Emotional arc
        emotional_arc = melody_data['emotional_arc']
        line_numbers = range(1, len(emotional_arc) + 1)
        
        colors = ['green' if e > 0.2 else 'red' if e < -0.2 else 'gray' for e in emotional_arc]
        ax2.bar(line_numbers, emotional_arc, color=colors, alpha=0.7)
        ax2.axhline(y=0, color='black', linestyle='-', alpha=0.3)
        ax2.set_xlabel('Line Number')
        ax2.set_ylabel('Emotional Weight')
        ax2.set_title('Emotional Arc of Lyrics')
        ax2.set_ylim(-1, 1)
        
        plt.tight_layout()
        plt.show()

# Example usage
if __name__ == "__main__":
    generator = LyricsToMelodyGenerator()
    
    sample_lyrics = """Walking through the neon lights tonight
Feeling like I'm flying so high
Digital dreams are calling my name
Nothing will ever be the same"""
    
    print("🎵 LYRICS TO MELODY GENERATOR")
    print("=" * 50)
    
    # Generate melody
    melody_result = generator.convert_lyrics_to_melody(
        lyrics=sample_lyrics,
        genre='electronic',
        tempo=128
    )
    
    # Display results
    print(f"\n📊 GENERATION RESULTS:")
    print(f"Key: {generator.midi_to_note_name(melody_result['key'])} {melody_result['scale']}")
    print(f"Total Notes: {melody_result['note_count']}")
    print(f"Duration: {melody_result['total_duration']:.1f} beats")
    
    # Visualize
    generator.visualize_melody(melody_result)
    
    print("✅ Lyrics-to-melody system configured!")
