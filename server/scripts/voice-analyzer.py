
#!/usr/bin/env python3
"""
Voice Analysis Script for Burnt Beats
Analyzes audio samples to extract voice characteristics
"""

import os
import sys
import json
import argparse
import logging
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    import librosa
    import scipy.stats
    ANALYSIS_AVAILABLE = True
except ImportError:
    logger.warning("Audio analysis libraries not available. Install: pip install librosa scipy")
    ANALYSIS_AVAILABLE = False

class VoiceAnalyzer:
    def __init__(self, sample_rate=22050):
        self.sample_rate = sample_rate
    
    def analyze(self, audio_path: str) -> dict:
        """Comprehensive voice analysis"""
        if not ANALYSIS_AVAILABLE:
            # Return mock analysis
            return {
                "fundamental_frequency": 200.0,
                "timbre_classification": "warm",
                "clarity_score": 0.85,
                "detected_language": "en",
                "voice_activity_ratio": 0.75,
                "spectral_centroid": 2000.0,
                "spectral_rolloff": 3500.0,
                "zero_crossing_rate": 0.1,
                "mfcc_features": [0.0] * 13,
                "pitch_stability": 0.8,
                "voice_quality": "good"
            }
        
        try:
            # Load audio
            y, sr = librosa.load(audio_path, sr=self.sample_rate)
            
            # Basic audio properties
            duration = len(y) / sr
            
            # Fundamental frequency (pitch)
            f0 = librosa.yin(y, fmin=80, fmax=400)
            f0_mean = np.nanmean(f0)
            f0_std = np.nanstd(f0)
            
            # Spectral features
            spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
            spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
            zero_crossing_rate = librosa.feature.zero_crossing_rate(y)[0]
            
            # MFCC features
            mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
            mfcc_mean = np.mean(mfccs, axis=1)
            
            # Voice activity detection
            rms = librosa.feature.rms(y=y)[0]
            voice_threshold = np.percentile(rms, 30)
            voice_activity_ratio = np.sum(rms > voice_threshold) / len(rms)
            
            # Classify timbre based on spectral features
            timbre = self._classify_timbre(spectral_centroid, spectral_rolloff, mfccs)
            
            # Calculate clarity score
            clarity = self._calculate_clarity(y, sr)
            
            # Pitch stability
            pitch_stability = 1.0 - (f0_std / f0_mean) if not np.isnan(f0_mean) and f0_mean > 0 else 0.5
            pitch_stability = np.clip(pitch_stability, 0.0, 1.0)
            
            # Overall voice quality assessment
            voice_quality = self._assess_voice_quality(
                clarity, voice_activity_ratio, pitch_stability
            )
            
            return {
                "fundamental_frequency": float(f0_mean) if not np.isnan(f0_mean) else 200.0,
                "timbre_classification": timbre,
                "clarity_score": float(clarity),
                "detected_language": "en",  # Could implement language detection
                "voice_activity_ratio": float(voice_activity_ratio),
                "spectral_centroid": float(np.mean(spectral_centroid)),
                "spectral_rolloff": float(np.mean(spectral_rolloff)),
                "zero_crossing_rate": float(np.mean(zero_crossing_rate)),
                "mfcc_features": [float(x) for x in mfcc_mean],
                "pitch_stability": float(pitch_stability),
                "voice_quality": voice_quality,
                "duration": float(duration),
                "pitch_range": {
                    "min": float(np.nanmin(f0)) if not np.isnan(np.nanmin(f0)) else 100.0,
                    "max": float(np.nanmax(f0)) if not np.isnan(np.nanmax(f0)) else 300.0,
                    "std": float(f0_std) if not np.isnan(f0_std) else 20.0
                }
            }
            
        except Exception as e:
            logger.error(f"Analysis failed: {e}")
            raise
    
    def _classify_timbre(self, spectral_centroid, spectral_rolloff, mfccs) -> str:
        """Classify voice timbre based on spectral features"""
        try:
            avg_centroid = np.mean(spectral_centroid)
            avg_rolloff = np.mean(spectral_rolloff)
            brightness = avg_centroid / avg_rolloff
            
            # Simple timbre classification
            if brightness > 0.6:
                return "bright"
            elif brightness > 0.4:
                return "balanced"
            elif brightness > 0.25:
                return "warm"
            else:
                return "dark"
                
        except Exception:
            return "neutral"
    
    def _calculate_clarity(self, y, sr) -> float:
        """Calculate voice clarity score"""
        try:
            # Use spectral contrast as a proxy for clarity
            contrast = librosa.feature.spectral_contrast(y=y, sr=sr)
            clarity_score = np.mean(contrast) / 10.0  # Normalize
            return np.clip(clarity_score, 0.0, 1.0)
        except Exception:
            return 0.8  # Default value
    
    def _assess_voice_quality(self, clarity: float, voice_activity: float, pitch_stability: float) -> str:
        """Assess overall voice quality"""
        score = (clarity + voice_activity + pitch_stability) / 3.0
        
        if score >= 0.8:
            return "excellent"
        elif score >= 0.6:
            return "good"
        elif score >= 0.4:
            return "fair"
        else:
            return "poor"

def main():
    parser = argparse.ArgumentParser(description="Voice Analysis Tool")
    parser.add_argument("--input", required=True, help="Input audio file")
    parser.add_argument("--output", help="Output JSON file (optional)")
    
    args = parser.parse_args()
    
    analyzer = VoiceAnalyzer()
    
    try:
        analysis = analyzer.analyze(args.input)
        
        if args.output:
            with open(args.output, 'w') as f:
                json.dump(analysis, f, indent=2)
            logger.info(f"Analysis saved to {args.output}")
        else:
            # Print to stdout for container script
            print(json.dumps(analysis))
            
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
