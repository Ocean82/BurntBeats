
#!/usr/bin/env python3
"""
Example client for testing the Enhanced Music Generation API
"""

import requests
import json
import time

# API Configuration
API_BASE_URL = "http://localhost:5000"

def test_health_check():
    """Test the health check endpoint"""
    print("🏥 Testing health check...")
    response = requests.get(f"{API_BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_music_generation():
    """Test music generation with sample lyrics"""
    print("🎵 Testing music generation...")
    
    payload = {
        "lyrics": """I love the way you smile
You make my day worthwhile
Together we can fly
Underneath the starry sky

Every moment feels so right
Dancing through the endless night
Hand in hand we'll face tomorrow
Leave behind all fear and sorrow""",
        "genre": "jazz",
        "tempo": 110,
        "key": "Dm",
        "title": "Starry Night Jazz",
        "duration": 45,
        "mood": "romantic",
        "style_options": {
            "complexity": "complex",
            "voice_leading": True,
            "dynamic_phrasing": True
        }
    }
    
    response = requests.post(
        f"{API_BASE_URL}/generate",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Generation successful!")
        print(f"Session ID: {result['session_id']}")
        print(f"Files generated: {list(result['files'].keys())}")
        print(f"MIDI file: {result['files']['midi']['filename']}")
        print(f"Download URL: {API_BASE_URL}{result['files']['midi']['download_url']}")
        
        # Test file download
        if 'midi' in result['files']:
            download_url = f"{API_BASE_URL}{result['files']['midi']['download_url']}"
            print(f"\n📥 Testing file download from: {download_url}")
            download_response = requests.get(download_url)
            print(f"Download status: {download_response.status_code}")
            if download_response.status_code == 200:
                print(f"File size: {len(download_response.content)} bytes")
        
    else:
        print("❌ Generation failed!")
        print(f"Error: {response.json()}")
    
    print()

def test_genres_endpoint():
    """Test the genres information endpoint"""
    print("🎼 Testing genres endpoint...")
    response = requests.get(f"{API_BASE_URL}/genres")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        genres = response.json()
        print(f"Available genres: {list(genres.keys())}")
        print(f"Jazz characteristics: {genres['jazz']['characteristics']}")
    
    print()

def test_pop_generation():
    """Test pop music generation with strict 4-bar phrasing"""
    print("🎵 Testing pop generation (should have regular 4-bar phrases)...")
    
    payload = {
        "lyrics": """Sunshine in my heart today
Everything will be okay
Dancing to the rhythm of life
Leaving all my worries behind""",
        "genre": "pop",
        "tempo": 128,
        "key": "C",
        "title": "Sunshine Pop",
        "duration": 30,
        "mood": "happy",
        "style_options": {
            "complexity": "simple",
            "voice_leading": False,
            "dynamic_phrasing": True
        }
    }
    
    response = requests.post(f"{API_BASE_URL}/generate", json=payload)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Pop generation successful!")
        print(f"Session ID: {result['session_id']}")
    else:
        print("❌ Pop generation failed!")
        print(f"Error: {response.json()}")
    
    print()

def main():
    """Run all tests"""
    print("🧪 Enhanced Music Generation API Test Suite")
    print("=" * 50)
    
    try:
        test_health_check()
        test_genres_endpoint()
        test_music_generation()
        test_pop_generation()
        
        print("🎉 All tests completed!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to API server!")
        print("Make sure the server is running on http://localhost:5000")
    except Exception as e:
        print(f"❌ Test failed with error: {e}")

if __name__ == "__main__":
    main()
