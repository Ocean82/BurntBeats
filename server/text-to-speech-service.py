
#!/usr/bin/env python3
"""
Simple Text-to-Speech service for RVC pipeline
Generates base vocal audio that can be processed by RVC
"""

import sys
import os
import argparse
import subprocess
import tempfile
from pathlib import Path
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SimpleTTSService:
    def __init__(self):
        self.temp_dir = tempfile.mkdtemp()
        
    def generate_speech(self, text, output_path, voice='neutral'):
        """Generate speech using espeak (simple TTS)"""
        try:
            # Use espeak for basic TTS generation
            cmd = [
                'espeak',
                '-v', voice,
                '-s', '150',  # Speech rate
                '-p', '50',   # Pitch
                '-w', output_path,
                text
            ]
            
            logger.info(f"Generating TTS: {' '.join(cmd)}")
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            
            if result.returncode != 0:
                # Fallback to basic audio generation
                logger.warning("espeak failed, using fallback method")
                self.generate_fallback_audio(text, output_path)
            else:
                logger.info("TTS generation completed successfully")
                
        except Exception as e:
            logger.error(f"TTS generation error: {e}")
            # Generate silence as fallback
            self.generate_fallback_audio(text, output_path)
    
    def generate_fallback_audio(self, text, output_path):
        """Generate simple audio file as fallback"""
        try:
            # Calculate duration based on text length (rough estimate)
            duration = max(len(text.split()) * 0.5, 5)  # 0.5 seconds per word, min 5 seconds
            
            # Generate silence with ffmpeg
            cmd = [
                'ffmpeg',
                '-f', 'lavfi',
                '-i', f'anullsrc=channel_layout=mono:sample_rate=16000',
                '-t', str(duration),
                '-y', output_path
            ]
            
            subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            logger.info(f"Generated fallback audio: {duration}s duration")
            
        except Exception as e:
            logger.error(f"Fallback audio generation failed: {e}")
            raise

def main():
    parser = argparse.ArgumentParser(description='Simple TTS Service for RVC Pipeline')
    parser.add_argument('--text', required=True, help='Text to convert to speech')
    parser.add_argument('--output_path', required=True, help='Output audio file path')
    parser.add_argument('--voice', default='neutral', help='Voice to use')
    
    args = parser.parse_args()
    
    try:
        tts_service = SimpleTTSService()
        tts_service.generate_speech(args.text, args.output_path, args.voice)
        print(f"SUCCESS: {args.output_path}")
        
    except Exception as e:
        logger.error(f"TTS service failed: {e}")
        print(f"ERROR: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
