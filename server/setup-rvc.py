
#!/usr/bin/env python3
"""
Setup script for RVC (Ocean82's fork) integration
Downloads and configures RVC for music generation pipeline
"""

import os
import sys
import subprocess
import urllib.request
import shutil
from pathlib import Path
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def run_command(cmd, cwd=None):
    """Run a shell command"""
    try:
        result = subprocess.run(cmd, shell=True, check=True, cwd=cwd, capture_output=True, text=True)
        return result.stdout
    except subprocess.CalledProcessError as e:
        logger.error(f"Command failed: {cmd}")
        logger.error(f"Error: {e.stderr}")
        raise

def download_file(url, destination):
    """Download a file from URL"""
    try:
        logger.info(f"Downloading {url}")
        urllib.request.urlretrieve(url, destination)
        logger.info(f"Downloaded to {destination}")
    except Exception as e:
        logger.error(f"Download failed: {e}")
        raise

def setup_rvc():
    """Setup RVC environment"""
    print("Setting up RVC (Ocean82's fork)...")
    
    # Clone RVC repository
    if not os.path.exists('Retrieval-based-Voice-Conversion-WebUI'):
        print("Cloning RVC repository...")
        run_command('git clone https://github.com/Ocean82/RVC.git Retrieval-based-Voice-Conversion-WebUI')
    else:
        print("RVC repository already exists")
    
    rvc_path = 'Retrieval-based-Voice-Conversion-WebUI'
    
    # Create required directories
    os.makedirs(os.path.join(rvc_path, 'assets', 'hubert'), exist_ok=True)
    os.makedirs(os.path.join(rvc_path, 'assets', 'rmvpe'), exist_ok=True)
    os.makedirs(os.path.join(rvc_path, 'assets', 'pretrained'), exist_ok=True)
    os.makedirs(os.path.join(rvc_path, 'assets', 'pretrained_v2'), exist_ok=True)
    os.makedirs(os.path.join(rvc_path, 'assets', 'uvr5_weights'), exist_ok=True)
    os.makedirs(os.path.join(rvc_path, 'logs'), exist_ok=True)
    
    # Download required models
    models_to_download = [
        {
            'url': 'https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/hubert_base.pt',
            'path': os.path.join(rvc_path, 'assets', 'hubert', 'hubert_base.pt')
        },
        {
            'url': 'https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/rmvpe.pt',
            'path': os.path.join(rvc_path, 'assets', 'rmvpe', 'rmvpe.pt')
        }
    ]
    
    for model in models_to_download:
        if not os.path.exists(model['path']):
            download_file(model['url'], model['path'])
        else:
            print(f"Model already exists: {model['path']}")
    
    # Install Python dependencies
    print("Installing Python dependencies...")
    try:
        run_command(f'{sys.executable} -m pip install torch torchaudio')
        run_command(f'{sys.executable} -m pip install librosa scipy numpy')
        run_command(f'{sys.executable} -m pip install fairseq')
        run_command(f'{sys.executable} -m pip install praat-parselmouth')
        run_command(f'{sys.executable} -m pip install pyworld')
        run_command(f'{sys.executable} -m pip install torchcrepe')
        run_command(f'{sys.executable} -m pip install faiss-cpu')
    except Exception as e:
        print(f"Warning: Some dependencies may not have installed correctly: {e}")
    
    # Install system dependencies
    print("Installing system dependencies...")
    try:
        # Try to install ffmpeg and espeak
        run_command('which ffmpeg || echo "Please install ffmpeg manually"')
        run_command('which espeak || echo "Please install espeak manually"')
    except:
        print("Warning: Some system dependencies may be missing")
    
    # Create CLI inference script
    create_cli_inference_script(rvc_path)
    
    # Test installation
    print("Testing RVC installation...")
    try:
        test_cmd = f'{sys.executable} -c "import torch; print(f\\"PyTorch version: {{torch.__version__}}\\")"'
        run_command(test_cmd)
        print("✅ RVC setup completed successfully!")
        
        # Print usage instructions
        print("\n" + "="*50)
        print("RVC Setup Complete!")
        print("="*50)
        print("To use RVC voice conversion:")
        print("1. Place your voice model (.pth file) in the logs/ directory")
        print("2. Use the RVC API endpoints for music generation")
        print("3. Check the server/enhanced-rvc-pipeline.py for direct usage")
        print("="*50)
        
    except Exception as e:
        print(f"❌ RVC setup failed: {e}")
        sys.exit(1)

def create_cli_inference_script(rvc_path):
    """Create a CLI inference script for RVC"""
    script_content = '''#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from infer.modules.vc.pipeline import Pipeline
import torch
import librosa
import soundfile as sf
import numpy as np
import argparse

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input_path', required=True)
    parser.add_argument('--output_path', required=True)
    parser.add_argument('--model_path', required=True)
    parser.add_argument('--transpose', type=int, default=0)
    parser.add_argument('--index_rate', type=float, default=0.75)
    parser.add_argument('--filter_radius', type=int, default=3)
    parser.add_argument('--rms_mix_rate', type=float, default=0.25)
    parser.add_argument('--protect', type=float, default=0.33)
    parser.add_argument('--f0method', default='rmvpe')
    
    args = parser.parse_args()
    
    # Load audio
    audio, sr = librosa.load(args.input_path, sr=16000)
    
    # Initialize pipeline
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    # Save converted audio
    sf.write(args.output_path, audio, 16000)
    print(f"Conversion completed: {args.output_path}")

if __name__ == '__main__':
    main()
'''
    
    script_path = os.path.join(rvc_path, 'tools', 'infer_cli.py')
    os.makedirs(os.path.dirname(script_path), exist_ok=True)
    
    with open(script_path, 'w') as f:
        f.write(script_content)
    
    # Make script executable
    os.chmod(script_path, 0o755)
    print(f"Created CLI inference script: {script_path}")

if __name__ == '__main__':
    setup_rvc()
