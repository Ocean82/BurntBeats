import numpy as np
import matplotlib.pyplot as plt
from dataclasses import dataclass
from typing import List, Dict, Optional
import json
import time

@dataclass
class MusicConfig:
    """Configuration for music generation"""
    lyrics: str = ""
    title: str = "Untitled Song"
    genre: str = "pop"
    vocals: str = "male_lead"
    theme: str = "love"
    mood: str = "happy"
    tempo: int = 120
    energy: int = 70
    duration: int = 180
    creativity: int = 75

class MusicGenerator:
    """AI Music Generator - Python Backend"""
    
    def __init__(self):
        self.genres = [
            "pop", "rock", "hip_hop", "electronic", "jazz", 
            "classical", "country", "rnb", "reggae", "folk"
        ]
        
        self.vocals = [
            "male_lead", "female_lead", "choir", "rap", "whisper",
            "powerful", "soft", "raspy", "auto_tuned", "no_vocals"
        ]
        
        self.themes = [
            "love", "heartbreak", "adventure", "party", "motivation",
            "nostalgia", "freedom", "dreams", "friendship", "success"
        ]
        
        self.generated_songs = []
    
    def analyze_lyrics(self, lyrics: str) -> Dict:
        """Analyze lyrics for sentiment and structure"""
        word_count = len(lyrics.split())
        line_count = len(lyrics.split('\n'))
        
        # Simple sentiment analysis (in real app, use proper NLP)
        positive_words = ['love', 'happy', 'joy', 'amazing', 'beautiful', 'wonderful']
        negative_words = ['sad', 'pain', 'hurt', 'broken', 'lonely', 'dark']
        
        pos_score = sum(1 for word in lyrics.lower().split() if word in positive_words)
        neg_score = sum(1 for word in lyrics.lower().split() if word in negative_words)
        
        sentiment = "positive" if pos_score > neg_score else "negative" if neg_score > pos_score else "neutral"
        
        return {
            "word_count": word_count,
            "line_count": line_count,
            "sentiment": sentiment,
            "complexity": "high" if word_count > 100 else "medium" if word_count > 50 else "low"
        }
    
    def generate_audio_features(self, config: MusicConfig) -> Dict:
        """Generate audio features based on configuration"""
        # Simulate audio feature generation
        features = {
            "tempo": config.tempo,
            "key": np.random.choice(['C', 'D', 'E', 'F', 'G', 'A', 'B']),
            "time_signature": "4/4",
            "energy_level": config.energy / 100,
            "danceability": np.random.uniform(0.3, 0.9),
            "valence": np.random.uniform(0.2, 0.8),
            "acousticness": np.random.uniform(0.1, 0.7),
            "instrumentalness": 0.0 if config.vocals != "no_vocals" else 0.8
        }
        
        # Adjust features based on genre
        genre_adjustments = {
            "electronic": {"energy_level": 0.8, "danceability": 0.9, "acousticness": 0.1},
            "jazz": {"tempo": 100, "acousticness": 0.7, "energy_level": 0.6},
            "classical": {"acousticness": 0.9, "energy_level": 0.4, "tempo": 80},
            "hip_hop": {"energy_level": 0.8, "danceability": 0.8, "tempo": 90}
        }
        
        if config.genre in genre_adjustments:
            features.update(genre_adjustments[config.genre])
        
        return features
    
    def create_song_structure(self, config: MusicConfig) -> List[Dict]:
        """Create song structure based on genre and duration"""
        structures = {
            "pop": ["intro", "verse", "chorus", "verse", "chorus", "bridge", "chorus", "outro"],
            "rock": ["intro", "verse", "chorus", "verse", "chorus", "solo", "chorus", "outro"],
            "hip_hop": ["intro", "verse", "hook", "verse", "hook", "bridge", "hook", "outro"],
            "electronic": ["intro", "buildup", "drop", "breakdown", "buildup", "drop", "outro"]
        }
        
        base_structure = structures.get(config.genre, structures["pop"])
        
        # Calculate section durations
        total_sections = len(base_structure)
        avg_section_duration = config.duration / total_sections
        
        song_structure = []
        current_time = 0
        
        for section in base_structure:
            duration = avg_section_duration + np.random.uniform(-5, 5)
            song_structure.append({
                "section": section,
                "start_time": current_time,
                "duration": duration,
                "end_time": current_time + duration
            })
            current_time += duration
        
        return song_structure
    
    def generate_music(self, config: MusicConfig) -> Dict:
        """Main music generation function"""
        print(f"🎵 Generating '{config.title}'...")
        print(f"Genre: {config.genre.title()}, Vocals: {config.vocals.replace('_', ' ').title()}")
        
        # Analyze input
        lyrics_analysis = self.analyze_lyrics(config.lyrics)
        print(f"📝 Lyrics Analysis: {lyrics_analysis['sentiment']} sentiment, {lyrics_analysis['word_count']} words")
        
        # Generate audio features
        audio_features = self.generate_audio_features(config)
        print(f"🎼 Audio Features: {audio_features['key']} key, {config.tempo} BPM")
        
        # Create song structure
        song_structure = self.create_song_structure(config)
        print(f"🏗️  Song Structure: {len(song_structure)} sections")
        
        # Simulate generation time
        for i in range(3):
            time.sleep(1)
            print(f"⏳ Processing... {(i+1)*33}%")
        
        # Create result
        result = {
            "id": f"song_{len(self.generated_songs) + 1}",
            "title": config.title,
            "config": config,
            "lyrics_analysis": lyrics_analysis,
            "audio_features": audio_features,
            "song_structure": song_structure,
            "file_path": f"generated/{config.title.lower().replace(' ', '_')}.wav",
            "generated_at": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        self.generated_songs.append(result)
        
        print(f"✅ Successfully generated '{config.title}'!")
        return result
    
    def visualize_song_structure(self, song_data: Dict):
        """Visualize the generated song structure"""
        structure = song_data["song_structure"]
        
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 8))
        
        # Song structure timeline
        sections = [s["section"] for s in structure]
        start_times = [s["start_time"] for s in structure]
        durations = [s["duration"] for s in structure]
        
        colors = plt.cm.Set3(np.linspace(0, 1, len(set(sections))))
        section_colors = {section: colors[i] for i, section in enumerate(set(sections))}
        
        for i, (section, start, duration) in enumerate(zip(sections, start_times, durations)):
            ax1.barh(0, duration, left=start, height=0.5, 
                    color=section_colors[section], alpha=0.7, 
                    label=section if section not in [s["section"] for s in structure[:i]] else "")
            ax1.text(start + duration/2, 0, section, ha='center', va='center', fontweight='bold')
        
        ax1.set_xlim(0, max(start_times) + max(durations))
        ax1.set_ylim(-0.5, 0.5)
        ax1.set_xlabel('Time (seconds)')
        ax1.set_title(f'Song Structure: {song_data["title"]}')
        ax1.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
        
        # Audio features radar chart
        features = song_data["audio_features"]
        feature_names = ['Energy', 'Danceability', 'Valence', 'Acousticness']
        feature_values = [
            features["energy_level"],
            features["danceability"], 
            features["valence"],
            features["acousticness"]
        ]
        
        angles = np.linspace(0, 2 * np.pi, len(feature_names), endpoint=False)
        feature_values += feature_values[:1]  # Complete the circle
        angles = np.concatenate((angles, [angles[0]]))
        
        ax2 = plt.subplot(2, 1, 2, projection='polar')
        ax2.plot(angles, feature_values, 'o-', linewidth=2, color='purple')
        ax2.fill(angles, feature_values, alpha=0.25, color='purple')
        ax2.set_xticks(angles[:-1])
        ax2.set_xticklabels(feature_names)
        ax2.set_ylim(0, 1)
        ax2.set_title('Audio Features Profile')
        
        plt.tight_layout()
        plt.show()
    
    def save_project(self, filename: str):
        """Save all generated songs to a JSON file"""
        with open(filename, 'w') as f:
            # Convert dataclass to dict for JSON serialization
            songs_data = []
            for song in self.generated_songs:
                song_copy = song.copy()
                song_copy['config'] = {
                    'lyrics': song['config'].lyrics,
                    'title': song['config'].title,
                    'genre': song['config'].genre,
                    'vocals': song['config'].vocals,
                    'theme': song['config'].theme,
                    'mood': song['config'].mood,
                    'tempo': song['config'].tempo,
                    'energy': song['config'].energy,
                    'duration': song['config'].duration,
                    'creativity': song['config'].creativity
                }
                songs_data.append(song_copy)
            
            json.dump(songs_data, f, indent=2)
        print(f"💾 Project saved to {filename}")

# Example usage and testing
if __name__ == "__main__":
    # Initialize the generator
    generator = MusicGenerator()
    
    # Create a sample song configuration
    config = MusicConfig(
        title="Digital Dreams",
        lyrics="""Walking through the neon lights tonight
        Feeling like I'm flying so high
        Digital dreams are calling to me
        This is how I want to thrive""",
        genre="electronic",
        vocals="female_lead",
        theme="freedom",
        mood="energetic",
        tempo=128,
        energy=85,
        duration=200,
        creativity=90
    )
    
    # Generate the song
    song_result = generator.generate_music(config)
    
    # Display results
    print("\n" + "="*50)
    print("🎉 GENERATION COMPLETE!")
    print("="*50)
    print(f"Song ID: {song_result['id']}")
    print(f"Title: {song_result['title']}")
    print(f"Key: {song_result['audio_features']['key']}")
    print(f"Tempo: {song_result['audio_features']['tempo']} BPM")
    print(f"Sections: {len(song_result['song_structure'])}")
    
    # Visualize the results
    generator.visualize_song_structure(song_result)
    
    # Save the project
    generator.save_project("enhanced_music_project.json")
    
    print("\n🚀 Enhanced Music Generator is ready!")
    print("✅ Backend configured successfully")
