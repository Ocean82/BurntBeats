
#!/usr/bin/env python3
"""
Test script for music21 data loading and analysis capabilities
"""

import sys
import os
from pathlib import Path

# Add the current directory to Python path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from music21 import corpus, converter
    print("🎵 Music21 successfully imported")
    
    # Test corpus access
    print("\n📚 Testing corpus access...")
    bach_chorales = corpus.search('bach')
    print(f"Found {len(bach_chorales)} Bach pieces in corpus")
    
    # Load a sample piece for analysis
    if bach_chorales:
        sample_piece = corpus.parse(bach_chorales[0])
        print(f"✅ Successfully loaded: {bach_chorales[0]}")
        print(f"   Parts: {len(sample_piece.parts)}")
        print(f"   Measures: {len(sample_piece.flat.getElementsByClass('Measure'))}")
        
        # Test file output
        output_path = "test_output.mid"
        sample_piece.write('midi', fp=output_path)
        print(f"✅ Successfully wrote MIDI: {output_path}")
        
        # Clean up
        if os.path.exists(output_path):
            os.remove(output_path)
            print("🧹 Cleaned up test file")
    
    print("\n🎼 Testing MusicXML capabilities...")
    # Create a simple score and test XML output
    from music21 import stream, note, meter, tempo
    
    test_score = stream.Score()
    test_score.append(meter.TimeSignature('4/4'))
    test_score.append(tempo.TempoIndication(number=120))
    
    test_part = stream.Part()
    test_part.append(note.Note('C4', quarterLength=1))
    test_part.append(note.Note('D4', quarterLength=1))
    test_part.append(note.Note('E4', quarterLength=1))
    test_part.append(note.Note('F4', quarterLength=1))
    
    test_score.append(test_part)
    
    # Test XML output
    xml_output = "test_output.xml"
    test_score.write('musicxml', fp=xml_output)
    print(f"✅ Successfully wrote MusicXML: {xml_output}")
    
    # Clean up
    if os.path.exists(xml_output):
        os.remove(xml_output)
        print("🧹 Cleaned up test XML file")
    
    print("\n🚀 All music21 data loading and output tests passed!")
    
except ImportError as e:
    print(f"❌ Error importing music21: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error during testing: {e}")
    sys.exit(1)
