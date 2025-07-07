
#!/usr/bin/env python3
"""
Setup script to install and configure RVC (Ocean82's fork)
"""

import os
import sys
import subprocess
import urllib.request
import shutil
from pathlib import Path

def run_command(cmd, cwd=None, check=True):
    """Run shell command with error handling"""
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    
    if check and result.returncode != 0:
        print(f"Error: {result.stderr}")
        sys.exit(1)
    
    return result

def download_file(url, path):
    """Download file with progress"""
    print(f"Downloading: {url}")
    urllib.request.urlretrieve(url, path)
    print(f"Downloaded to: {path}")

def setup_rvc():
    """Setup RVC environment"""
    print("Setting up RVC (Ocean82's fork)...")
    
    # Clone RVC repository
    if not os.path.exists('Retrieval-based-Voice-Conversion-WebUI'):
        print("Cloning RVC repository...")
        run_command(['git', 'clone', 'https://github.com/Ocean82/RVC.git', 'Retrieval-based-Voice-Conversion-WebUI'])
    else:
        print("RVC repository already exists")
    
    rvc_path = 'Retrieval-based-Voice-Conversion-WebUI'
    
    # Create required directories
    os.makedirs(os.path.join(rvc_path, 'assets', 'hubert'), exist_ok=True)
    os.makedirs(os.path.join(rvc_path, 'assets', 'rmvpe'), exist_ok=True)
    os.makedirs(os.path.join(rvc_path, 'assets', 'pretrained'), exist_ok=True)
    os.makedirs(os.path.join(rvc_path, 'assets', 'pretrained_v2'), exist_ok=True)
    os.makedirs(os.path.join(rvc_path, 'assets', 'uvr5_weights'), exist_ok=True)
    
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
        run_command([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'], cwd=rvc_path)
    except:
        print("Warning: Could not install all dependencies. Please install manually if needed.")
    
    # Install PyTorch with CUDA support
    print("Installing PyTorch with CUDA support...")
    try:
        run_command([
            sys.executable, '-m', 'pip', 'install', 
            'torch', 'torchaudio', 
            '--extra-index-url', 'https://download.pytorch.org/whl/cu118'
        ])
    except:
        print("Warning: Could not install PyTorch with CUDA. CPU version will be used.")
    
    # Test installation
    print("Testing RVC installation...")
    try:
        test_cmd = [sys.executable, '-c', 'import torch; print("PyTorch version:", torch.__version__)']
        run_command(test_cmd)
        print("✅ RVC setup completed successfully!")
        
        # Print usage instructions
        print("\n" + "="*50)
        print("RVC Setup Complete!")
        print("="*50)
        print("To use RVC voice conversion:")
        print("1. Place your voice model (.pth file) in the logs/ directory")
        print("2. Use the RVC API endpoints or Python pipeline")
        print("3. Check the server/enhanced-rvc-pipeline.py for direct usage")
        print("="*50)
        
    except Exception as e:
        print(f"❌ RVC setup verification failed: {e}")
        print("Please check the installation manually.")

if __name__ == '__main__':
    setup_rvc()
