
#!/usr/bin/env python3
"""
Bark Text-to-Speech Synthesizer Script
Handles voice profile creation and synthesis for Burnt Beats
"""

import os
import sys
import json
import argparse
import logging
import numpy as np
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

try:
    from bark import SAMPLE_RATE, generate_audio, preload_models
    from bark.generation import SUPPORTED_LANGS
    import scipy.io.wavfile as wav
    import librosa
    BARK_AVAILABLE = True
except ImportError:
    logger.warning("Bark not installed. Install with: pip install git+https://github.com/suno-ai/bark.git")
    BARK_AVAILABLE = False

class BarkSynthesizer:
    def __init__(self):
        self.sample_rate = 22050 if not BARK_AVAILABLE else SAMPLE_RATE
        self.preloaded = False
    
    def preload_models(self):
        """Preload Bark models for faster inference"""
        if not BARK_AVAILABLE:
            raise RuntimeError("Bark not available")
        
        try:
            logger.info("Preloading Bark models...")
            preload_models()
            self.preloaded = True
            logger.info("Bark models preloaded successfully")
        except Exception as e:
            logger.error(f"Failed to preload models: {e}")
            raise
    
    def create_voice_profile(self, audio_path: str, output_path: str) -> str:
        """Create voice profile from audio sample"""
        if not BARK_AVAILABLE:
            # Create mock profile for development
            profile = {
                "type": "bark_voice_profile",
                "speaker_id": "custom_voice",
                "language": "en",
                "characteristics": {
                    "pitch": 0.5,
                    "speed": 1.0,
                    "timbre": "neutral"
                },
                "created_from": audio_path
            }
            
            with open(output_path, 'w') as f:
                json.dump(profile, f, indent=2)
            
            logger.info(f"Mock voice profile created: {output_path}")
            return output_path
        
        try:
            # Load and analyze audio
            audio, sr = librosa.load(audio_path, sr=self.sample_rate)
            
            # Extract voice characteristics (simplified)
            pitch = librosa.yin(audio, fmin=80, fmax=400)
            pitch_mean = np.nanmean(pitch)
            
            # Create voice profile
            profile = {
                "type": "bark_voice_profile",
                "speaker_id": f"custom_{hash(audio_path) % 10000}",
                "language": "en",  # Could be detected
                "characteristics": {
                    "pitch": float(pitch_mean) if not np.isnan(pitch_mean) else 200.0,
                    "speed": 1.0,
                    "timbre": "custom",
                    "audio_length": len(audio) / sr
                },
                "created_from": audio_path,
                "sample_rate": sr
            }
            
            # Save profile
            with open(output_path, 'w') as f:
                json.dump(profile, f, indent=2)
            
            logger.info(f"Voice profile created: {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"Failed to create voice profile: {e}")
            raise
    
    def synthesize(
        self, 
        text: str, 
        voice_profile_path: str, 
        output_path: str,
        speed: float = 1.0,
        emotion: str = "neutral"
    ) -> str:
        """Synthesize speech with voice profile"""
        
        if not BARK_AVAILABLE:
            # Create mock audio for development
            duration = len(text) * 0.08  # Rough estimate
            samples = int(duration * self.sample_rate)
            audio = np.random.normal(0, 0.05, samples).astype(np.float32)
            
            # Save as WAV
            wav.write(output_path, self.sample_rate, (audio * 32767).astype(np.int16))
            logger.info(f"Mock audio generated: {output_path}")
            return output_path
        
        try:
            # Load voice profile
            with open(voice_profile_path, 'r') as f:
                profile = json.load(f)
            
            if not self.preloaded:
                self.preload_models()
            
            # Prepare text with emotion and style
            styled_text = self._apply_style(text, emotion, speed)
            
            # Use speaker from profile
            speaker_id = profile.get("speaker_id", "v2/en_speaker_6")
            
            # Generate audio
            logger.info(f"Generating audio with speaker: {speaker_id}")
            audio_array = generate_audio(styled_text, history_prompt=speaker_id)
            
            # Apply speed modification if needed
            if speed != 1.0:
                audio_array = librosa.effects.time_stretch(audio_array, rate=speed)
            
            # Save audio
            wav.write(output_path, self.sample_rate, audio_array)
            
            logger.info(f"Audio synthesized successfully: {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"Synthesis failed: {e}")
            raise
    
    def _apply_style(self, text: str, emotion: str, speed: float) -> str:
        """Apply emotional and speed styling to text"""
        styled_text = text
        
        # Add emotion markers (Bark understands some of these)
        if emotion == "happy":
            styled_text = f"[happy] {text}"
        elif emotion == "sad":
            styled_text = f"[sad] {text}"
        elif emotion == "angry":
            styled_text = f"[angry] {text}"
        elif emotion == "excited":
            styled_text = f"[excited] {text}!"
        
        # Speed can be indicated with punctuation
        if speed > 1.2:
            styled_text = styled_text.replace(".", "!")
        elif speed < 0.8:
            styled_text = styled_text.replace(".", "...")
        
        return styled_text

def main():
    parser = argparse.ArgumentParser(description="Bark TTS Synthesizer")
    parser.add_argument("--mode", choices=["create", "synthesize"], required=True)
    parser.add_argument("--input", required=True, help="Input audio file for create mode")
    parser.add_argument("--output", required=True, help="Output file path")
    parser.add_argument("--text", help="Text to synthesize (synthesize mode)")
    parser.add_argument("--voice", help="Voice profile path (synthesize mode)")
    parser.add_argument("--speed", type=float, default=1.0, help="Speech speed")
    parser.add_argument("--emotion", default="neutral", help="Emotion style")
    
    args = parser.parse_args()
    
    synthesizer = BarkSynthesizer()
    
    try:
        if args.mode == "create":
            result = synthesizer.create_voice_profile(args.input, args.output)
            print(f"Voice profile created: {result}")
            
        elif args.mode == "synthesize":
            if not args.text or not args.voice:
                raise ValueError("Text and voice profile required for synthesis")
            
            result = synthesizer.synthesize(
                args.text, 
                args.voice, 
                args.output,
                args.speed,
                args.emotion
            )
            print(f"Audio synthesized: {result}")
            
    except Exception as e:
        logger.error(f"Operation failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
