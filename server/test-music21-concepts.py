
#!/usr/bin/env python3
"""
Test script to demonstrate Music21 core concepts
"""

import os
import subprocess
import sys

def test_music21_concepts():
    """Test all Music21 concepts with the demo generator"""
    
    print("🧪 Testing Music21 Core Concepts")
    print("=" * 50)
    
    # Test basic concepts
    print("\n1. Testing Basic Musical Elements...")
    basic_output = "uploads/music21_basic_demo.mid"
    try:
        result = subprocess.run([
            sys.executable, "server/music21-demo-generator.py", 
            basic_output, "--demo-type=basic"
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Basic demo completed successfully")
            print(f"📁 Output: {basic_output}")
        else:
            print(f"❌ Basic demo failed: {result.stderr}")
    except Exception as e:
        print(f"❌ Error running basic demo: {e}")
    
    # Test generative algorithms
    print("\n2. Testing Generative Algorithms...")
    generative_output = "uploads/music21_generative_demo.mid"
    try:
        result = subprocess.run([
            sys.executable, "server/music21-demo-generator.py", 
            generative_output, "--demo-type=generative"
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Generative demo completed successfully")
            print(f"📁 Output: {generative_output}")
        else:
            print(f"❌ Generative demo failed: {result.stderr}")
    except Exception as e:
        print(f"❌ Error running generative demo: {e}")
    
    # Test advanced concepts
    print("\n3. Testing Advanced Concepts...")
    advanced_output = "uploads/music21_advanced_demo.mid"
    try:
        result = subprocess.run([
            sys.executable, "server/music21-demo-generator.py", 
            advanced_output, "--demo-type=advanced"
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Advanced demo completed successfully")
            print(f"📁 Output: {advanced_output}")
        else:
            print(f"❌ Advanced demo failed: {result.stderr}")
    except Exception as e:
        print(f"❌ Error running advanced demo: {e}")
    
    print("\n🎼 Music21 concept testing completed!")
    print("\nGenerated files:")
    for filename in [basic_output, generative_output, advanced_output]:
        if os.path.exists(filename):
            size = os.path.getsize(filename)
            print(f"  📄 {filename} ({size} bytes)")
            
            # Check for analysis file
            analysis_file = filename.replace('.mid', '_analysis.json')
            if os.path.exists(analysis_file):
                print(f"  📊 {analysis_file}")

if __name__ == "__main__":
    test_music21_concepts()
