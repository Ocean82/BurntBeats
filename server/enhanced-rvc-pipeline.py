
#!/usr/bin/env python3
"""
Enhanced RVC Pipeline for MIDI to Vocal Conversion
Integrates with Ocean82's RVC fork for voice conversion
"""

import sys
import os
import argparse
import json
import subprocess
import tempfile
import shutil
from pathlib import Path
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class EnhancedRVCPipeline:
    def __init__(self, rvc_path=None):
        self.rvc_path = rvc_path or os.path.join(os.getcwd(), 'Retrieval-based-Voice-Conversion-WebUI')
        self.temp_dir = tempfile.mkdtemp()
        
        # Verify RVC installation
        if not os.path.exists(self.rvc_path):
            raise FileNotFoundError(f"RVC not found at {self.rvc_path}")
            
        # Required model paths
        self.hubert_model = os.path.join(self.rvc_path, 'assets', 'hubert', 'hubert_base.pt')
        self.rmvpe_model = os.path.join(self.rvc_path, 'assets', 'rmvpe', 'rmvpe.pt')
        
    def __del__(self):
        # Cleanup temp directory
        if hasattr(self, 'temp_dir') and os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)
    
    def check_dependencies(self):
        """Check if all required dependencies are available"""
        required_models = [
            self.hubert_model,
            self.rmvpe_model
        ]
        
        missing = []
        for model in required_models:
            if not os.path.exists(model):
                missing.append(model)
        
        if missing:
            logger.warning(f"Missing required models: {missing}")
            logger.info("Please run the model download script first")
            return False
            
        return True
    
    def generate_base_audio(self, midi_path, lyrics, output_path, **kwargs):
        """Generate base audio from MIDI and lyrics"""
        try:
            # Use existing music generator
            cmd = [
                'python', 'server/music-generator.py',
                '--title', kwargs.get('title', 'RVC Source'),
                '--lyrics', lyrics,
                '--genre', kwargs.get('genre', 'pop'),
                '--tempo', str(kwargs.get('tempo', 120)),
                '--key', kwargs.get('key', 'C'),
                '--duration', str(kwargs.get('duration', 30)),
                '--output_path', output_path
            ]
            
            logger.info(f"Generating base audio: {' '.join(cmd)}")
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
            
            if result.returncode != 0:
                raise Exception(f"Base audio generation failed: {result.stderr}")
                
            logger.info("Base audio generated successfully")
            return output_path
            
        except Exception as e:
            logger.error(f"Base audio generation error: {e}")
            raise
    
    def convert_voice(self, input_audio, output_audio, model_path, **options):
        """Convert voice using RVC"""
        try:
            # RVC inference command
            cmd = [
                'python', os.path.join(self.rvc_path, 'tools', 'infer_cli.py'),
                '--input_path', input_audio,
                '--output_path', output_audio,
                '--model_path', model_path,
                '--transpose', str(options.get('pitch_shift', 0)),
                '--index_rate', str(options.get('index_rate', 0.75)),
                '--filter_radius', str(options.get('filter_radius', 3)),
                '--rms_mix_rate', str(options.get('rms_threshold', 0.25)),
                '--protect', str(options.get('protect_voiceless', 0.33)),
                '--f0method', options.get('method', 'rmvpe')
            ]
            
            logger.info(f"Converting voice: {' '.join(cmd)}")
            
            result = subprocess.run(
                cmd, 
                capture_output=True, 
                text=True, 
                timeout=300,
                cwd=self.rvc_path
            )
            
            if result.returncode != 0:
                raise Exception(f"Voice conversion failed: {result.stderr}")
                
            logger.info("Voice conversion completed successfully")
            return output_audio
            
        except Exception as e:
            logger.error(f"Voice conversion error: {e}")
            raise
    
    def process_midi_to_vocal(self, midi_path, model_path, lyrics, output_path, **options):
        """Complete pipeline: MIDI -> Base Audio -> RVC Conversion"""
        try:
            logger.info("Starting MIDI to vocal conversion pipeline")
            
            # Step 1: Generate base audio
            base_audio_path = os.path.join(self.temp_dir, 'base_audio.wav')
            self.generate_base_audio(midi_path, lyrics, base_audio_path, **options)
            
            # Step 2: Convert voice using RVC
            final_output = self.convert_voice(base_audio_path, output_path, model_path, **options)
            
            # Step 3: Post-process (normalize, enhance)
            self.post_process_audio(final_output, **options)
            
            logger.info(f"Pipeline completed successfully: {final_output}")
            return final_output
            
        except Exception as e:
            logger.error(f"Pipeline error: {e}")
            raise
    
    def post_process_audio(self, audio_path, **options):
        """Post-process the generated audio"""
        try:
            # Normalize audio levels
            if options.get('normalize', True):
                self.normalize_audio(audio_path)
            
            # Apply noise reduction
            if options.get('denoise', True):
                self.denoise_audio(audio_path)
                
        except Exception as e:
            logger.warning(f"Post-processing warning: {e}")
    
    def normalize_audio(self, audio_path):
        """Normalize audio levels"""
        try:
            cmd = [
                'ffmpeg', '-i', audio_path,
                '-af', 'loudnorm=I=-23:LRA=7:tp=-2',
                '-y', f"{audio_path}.normalized"
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                os.replace(f"{audio_path}.normalized", audio_path)
                logger.info("Audio normalized successfully")
            else:
                logger.warning("Audio normalization failed")
                
        except Exception as e:
            logger.warning(f"Normalization error: {e}")
    
    def denoise_audio(self, audio_path):
        """Apply noise reduction"""
        try:
            cmd = [
                'ffmpeg', '-i', audio_path,
                '-af', 'afftdn=nf=-25',
                '-y', f"{audio_path}.denoised"
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                os.replace(f"{audio_path}.denoised", audio_path)
                logger.info("Audio denoised successfully")
            else:
                logger.warning("Audio denoising failed")
                
        except Exception as e:
            logger.warning(f"Denoising error: {e}")
    
    def batch_convert(self, batch_config):
        """Process multiple conversions in batch"""
        results = []
        
        for i, config in enumerate(batch_config):
            try:
                logger.info(f"Processing batch item {i+1}/{len(batch_config)}")
                
                output_path = config.get('output_path', f'batch_output_{i+1}.wav')
                result = self.process_midi_to_vocal(
                    config['midi_path'],
                    config['model_path'],
                    config['lyrics'],
                    output_path,
                    **config.get('options', {})
                )
                
                results.append({
                    'index': i,
                    'status': 'success',
                    'output_path': result
                })
                
            except Exception as e:
                results.append({
                    'index': i,
                    'status': 'failed',
                    'error': str(e)
                })
        
        return results

def main():
    parser = argparse.ArgumentParser(description='Enhanced RVC Pipeline for MIDI to Vocal Conversion')
    parser.add_argument('--midi_path', required=True, help='Path to MIDI file')
    parser.add_argument('--model_path', required=True, help='Path to RVC model')
    parser.add_argument('--lyrics', required=True, help='Lyrics text')
    parser.add_argument('--output_path', required=True, help='Output audio path')
    parser.add_argument('--pitch_shift', type=int, default=0, help='Pitch shift in semitones')
    parser.add_argument('--index_rate', type=float, default=0.75, help='Index rate')
    parser.add_argument('--method', default='rmvpe', choices=['harvest', 'pm', 'crepe', 'rmvpe'])
    parser.add_argument('--genre', default='pop', help='Music genre')
    parser.add_argument('--tempo', type=int, default=120, help='Tempo in BPM')
    parser.add_argument('--duration', type=int, default=30, help='Duration in seconds')
    parser.add_argument('--normalize', action='store_true', help='Normalize audio output')
    parser.add_argument('--denoise', action='store_true', help='Apply noise reduction')
    parser.add_argument('--rvc_path', help='Custom RVC installation path')
    
    args = parser.parse_args()
    
    try:
        # Initialize pipeline
        pipeline = EnhancedRVCPipeline(args.rvc_path)
        
        # Check dependencies
        if not pipeline.check_dependencies():
            logger.error("Missing required dependencies")
            sys.exit(1)
        
        # Process conversion
        options = {
            'pitch_shift': args.pitch_shift,
            'index_rate': args.index_rate,
            'method': args.method,
            'genre': args.genre,
            'tempo': args.tempo,
            'duration': args.duration,
            'normalize': args.normalize,
            'denoise': args.denoise
        }
        
        result = pipeline.process_midi_to_vocal(
            args.midi_path,
            args.model_path,
            args.lyrics,
            args.output_path,
            **options
        )
        
        print(f"SUCCESS: {result}")
        
        # Generate metadata
        metadata = {
            'input_midi': args.midi_path,
            'output_audio': result,
            'model_used': args.model_path,
            'lyrics': args.lyrics,
            'options': options,
            'pipeline': 'enhanced_rvc_pipeline'
        }
        
        metadata_path = result.replace('.wav', '_metadata.json')
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"Metadata saved: {metadata_path}")
        
    except Exception as e:
        logger.error(f"Pipeline failed: {e}")
        print(f"ERROR: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
