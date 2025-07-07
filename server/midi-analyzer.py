
#!/usr/bin/env python3
"""
MIDI File Analyzer for RVC Pipeline
Analyzes MIDI files to extract tempo, key, and other musical information
"""

import sys
import os
import argparse
import json
import mido
from pathlib import Path
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MIDIAnalyzer:
    def __init__(self):
        self.key_signatures = {
            -7: 'Cb', -6: 'Gb', -5: 'Db', -4: 'Ab', -3: 'Eb', -2: 'Bb', -1: 'F',
            0: 'C', 1: 'G', 2: 'D', 3: 'A', 4: 'E', 5: 'B', 6: 'F#', 7: 'C#'
        }
    
    def analyze_midi(self, midi_path):
        """Analyze a MIDI file and extract musical information"""
        try:
            mid = mido.MidiFile(midi_path)
            
            # Initialize analysis results
            analysis = {
                'title': os.path.basename(midi_path).replace('.mid', ''),
                'duration': 0,
                'tempo': 120,  # Default tempo
                'key': 'C',    # Default key
                'track_count': len(mid.tracks),
                'time_signature': '4/4',
                'total_ticks': 0,
                'notes_count': 0
            }
            
            # Calculate duration in seconds
            analysis['duration'] = mid.length
            
            # Analyze each track
            for i, track in enumerate(mid.tracks):
                current_time = 0
                
                for msg in track:
                    current_time += msg.time
                    
                    # Extract tempo
                    if msg.type == 'set_tempo':
                        analysis['tempo'] = mido.tempo2bpm(msg.tempo)
                    
                    # Extract key signature
                    elif msg.type == 'key_signature':
                        key_num = msg.key
                        if key_num in self.key_signatures:
                            analysis['key'] = self.key_signatures[key_num]
                            if msg.mode == 1:  # Minor mode
                                analysis['key'] += 'm'
                    
                    # Extract time signature
                    elif msg.type == 'time_signature':
                        analysis['time_signature'] = f"{msg.numerator}/{msg.denominator}"
                    
                    # Count notes
                    elif msg.type == 'note_on' and msg.velocity > 0:
                        analysis['notes_count'] += 1
                
                analysis['total_ticks'] = max(analysis['total_ticks'], current_time)
            
            # Estimate duration if not available
            if analysis['duration'] == 0 and analysis['total_ticks'] > 0:
                # Use ticks per beat and tempo to estimate duration
                ticks_per_beat = mid.ticks_per_beat
                beats_per_minute = analysis['tempo']
                analysis['duration'] = (analysis['total_ticks'] / ticks_per_beat) * (60 / beats_per_minute)
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing MIDI file: {e}")
            raise

def main():
    parser = argparse.ArgumentParser(description='MIDI File Analyzer for RVC Pipeline')
    parser.add_argument('--midi_path', required=True, help='Path to MIDI file')
    parser.add_argument('--analyze_only', action='store_true', help='Only analyze, don\'t convert')
    
    args = parser.parse_args()
    
    try:
        analyzer = MIDIAnalyzer()
        analysis = analyzer.analyze_midi(args.midi_path)
        
        if args.analyze_only:
            print(json.dumps(analysis, indent=2))
        else:
            # Can add conversion logic here if needed
            print(f"Analysis complete: {analysis}")
            
    except Exception as e:
        logger.error(f"MIDI analysis failed: {e}")
        print(f"ERROR: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
