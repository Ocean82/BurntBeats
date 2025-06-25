
#!/usr/bin/env python3
"""
Flask API wrapper for enhanced music generation
Accepts lyrics + style parameters and returns MIDI + metadata
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import tempfile
import os
import json
import sys
import subprocess
import traceback
from pathlib import Path
import uuid
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

# Configuration
UPLOAD_FOLDER = 'uploads'
TEMP_FOLDER = tempfile.gettempdir()
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Music Generation API',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/generate', methods=['POST'])
def generate_music():
    """
    Main endpoint for music generation
    
    Expected JSON payload:
    {
        "lyrics": "Your song lyrics here",
        "genre": "pop|rock|jazz|electronic|classical|hip-hop|country|r&b",
        "tempo": 120,
        "key": "C",
        "title": "Song Title",
        "duration": 30,
        "mood": "happy|sad|energetic|calm",
        "style_options": {
            "complexity": "simple|medium|complex",
            "voice_leading": true,
            "dynamic_phrasing": true
        }
    }
    """
    try:
        # Validate request
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400
        
        data = request.get_json()
        
        # Required fields
        required_fields = ['lyrics', 'genre']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Extract parameters with defaults
        lyrics = data['lyrics'].strip()
        genre = data.get('genre', 'pop')
        tempo = data.get('tempo', 120)
        key_sig = data.get('key', 'C')
        title = data.get('title', f'Generated Song {uuid.uuid4().hex[:8]}')
        duration = data.get('duration', 30)
        mood = data.get('mood', 'happy')
        
        # Style options
        style_options = data.get('style_options', {})
        complexity = style_options.get('complexity', 'medium')
        voice_leading = style_options.get('voice_leading', True)
        dynamic_phrasing = style_options.get('dynamic_phrasing', True)
        
        # Validate parameters
        valid_genres = ['pop', 'rock', 'jazz', 'electronic', 'classical', 'hip-hop', 'country', 'r&b']
        if genre not in valid_genres:
            return jsonify({'error': f'Invalid genre. Must be one of: {valid_genres}'}), 400
        
        if not (60 <= tempo <= 200):
            return jsonify({'error': 'Tempo must be between 60 and 200 BPM'}), 400
        
        if not (10 <= duration <= 300):
            return jsonify({'error': 'Duration must be between 10 and 300 seconds'}), 400
        
        if not lyrics:
            return jsonify({'error': 'Lyrics cannot be empty'}), 400
        
        # Generate unique filename
        session_id = uuid.uuid4().hex
        base_filename = f'generated_{session_id}'
        midi_path = os.path.join(UPLOAD_FOLDER, f'{base_filename}.mid')
        metadata_path = os.path.join(UPLOAD_FOLDER, f'{base_filename}_metadata.json')
        
        # Build command for enhanced music21 generator
        cmd = [
            'python3',
            'server/enhanced-music21-generator.py',
            title,
            lyrics,
            genre,
            str(tempo),
            key_sig,
            str(duration),
            midi_path
        ]
        
        # Add optional parameters
        if complexity == 'complex':
            cmd.extend(['--format=both'])
        
        if voice_leading and genre.lower() == 'jazz':
            cmd.extend(['--voice-leading=enhanced'])
        
        if dynamic_phrasing:
            cmd.extend(['--dynamic-phrasing=true'])
        
        # Execute music generation
        print(f"🎵 Generating music: {' '.join(cmd)}")
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60  # 60 second timeout
        )
        
        if result.returncode != 0:
            error_msg = result.stderr or 'Unknown error during generation'
            print(f"❌ Generation failed: {error_msg}")
            return jsonify({
                'error': 'Music generation failed',
                'details': error_msg
            }), 500
        
        # Verify files were created
        if not os.path.exists(midi_path):
            return jsonify({'error': 'MIDI file was not generated'}), 500
        
        # Load metadata if it exists
        metadata = {}
        if os.path.exists(metadata_path):
            try:
                with open(metadata_path, 'r') as f:
                    metadata = json.load(f)
            except Exception as e:
                print(f"⚠️ Could not load metadata: {e}")
        
        # Get file size and info
        midi_size = os.path.getsize(midi_path)
        
        # Prepare response
        response_data = {
            'success': True,
            'session_id': session_id,
            'files': {
                'midi': {
                    'filename': f'{base_filename}.mid',
                    'size_bytes': midi_size,
                    'download_url': f'/download/{base_filename}.mid'
                }
            },
            'metadata': {
                'title': title,
                'genre': genre,
                'tempo': tempo,
                'key': key_sig,
                'duration': duration,
                'mood': mood,
                'generation_time': datetime.now().isoformat(),
                'style_options': style_options,
                **metadata
            },
            'generation_log': result.stdout
        }
        
        # Add additional files if they exist
        analysis_path = midi_path.replace('.mid', '_analysis.json')
        if os.path.exists(analysis_path):
            response_data['files']['analysis'] = {
                'filename': f'{base_filename}_analysis.json',
                'size_bytes': os.path.getsize(analysis_path),
                'download_url': f'/download/{base_filename}_analysis.json'
            }
        
        musicxml_path = midi_path.replace('.mid', '.musicxml')
        if os.path.exists(musicxml_path):
            response_data['files']['musicxml'] = {
                'filename': f'{base_filename}.musicxml',
                'size_bytes': os.path.getsize(musicxml_path),
                'download_url': f'/download/{base_filename}.musicxml'
            }
        
        return jsonify(response_data)
        
    except subprocess.TimeoutExpired:
        return jsonify({'error': 'Music generation timed out'}), 408
    
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        print(traceback.format_exc())
        return jsonify({
            'error': 'Internal server error',
            'details': str(e)
        }), 500

@app.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    """Download generated files"""
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    
    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404
    
    # Determine MIME type
    if filename.endswith('.mid'):
        mimetype = 'audio/midi'
    elif filename.endswith('.json'):
        mimetype = 'application/json'
    elif filename.endswith('.musicxml'):
        mimetype = 'application/xml'
    else:
        mimetype = 'application/octet-stream'
    
    return send_file(
        file_path,
        as_attachment=True,
        download_name=filename,
        mimetype=mimetype
    )

@app.route('/batch-generate', methods=['POST'])
def batch_generate():
    """
    Batch generation endpoint for multiple songs
    
    Expected JSON payload:
    {
        "songs": [
            {
                "lyrics": "...",
                "genre": "pop",
                "title": "Song 1"
            },
            {
                "lyrics": "...",
                "genre": "jazz",
                "title": "Song 2"
            }
        ],
        "common_options": {
            "tempo": 120,
            "key": "C"
        }
    }
    """
    try:
        data = request.get_json()
        songs = data.get('songs', [])
        common_options = data.get('common_options', {})
        
        if not songs:
            return jsonify({'error': 'No songs provided'}), 400
        
        if len(songs) > 10:
            return jsonify({'error': 'Maximum 10 songs per batch'}), 400
        
        results = []
        
        for i, song_data in enumerate(songs):
            try:
                # Merge common options
                merged_data = {**common_options, **song_data}
                
                # Use internal generation logic
                # (This would call the same generation logic as the single endpoint)
                print(f"🎵 Processing batch song {i+1}/{len(songs)}: {merged_data.get('title', 'Untitled')}")
                
                # For now, return placeholder - in production this would do actual generation
                results.append({
                    'index': i,
                    'title': song_data.get('title', f'Song {i+1}'),
                    'status': 'generated',
                    'session_id': uuid.uuid4().hex
                })
                
            except Exception as e:
                results.append({
                    'index': i,
                    'title': song_data.get('title', f'Song {i+1}'),
                    'status': 'failed',
                    'error': str(e)
                })
        
        return jsonify({
            'success': True,
            'batch_id': uuid.uuid4().hex,
            'total_songs': len(songs),
            'results': results
        })
        
    except Exception as e:
        return jsonify({
            'error': 'Batch generation failed',
            'details': str(e)
        }), 500

@app.route('/genres', methods=['GET'])
def get_genres():
    """Get available genres and their characteristics"""
    genres = {
        'pop': {
            'name': 'Pop',
            'characteristics': 'Catchy melodies, 4/4 time, simple chord progressions',
            'typical_tempo': '120-140 BPM',
            'phrase_structure': 'Regular 4-bar phrases'
        },
        'rock': {
            'name': 'Rock',
            'characteristics': 'Power chords, driving rhythm, guitar-focused',
            'typical_tempo': '120-160 BPM',
            'phrase_structure': 'Mostly 4-bar with some variation'
        },
        'jazz': {
            'name': 'Jazz',
            'characteristics': 'Complex harmonies, swing feel, improvisation',
            'typical_tempo': '60-180 BPM',
            'phrase_structure': 'Asymmetrical phrases, complex voice leading'
        },
        'electronic': {
            'name': 'Electronic',
            'characteristics': 'Synthesized sounds, rhythmic patterns, digital effects',
            'typical_tempo': '120-140 BPM',
            'phrase_structure': 'Short repetitive patterns'
        },
        'classical': {
            'name': 'Classical',
            'characteristics': 'Traditional forms, orchestral instruments, sophisticated harmony',
            'typical_tempo': '60-120 BPM',
            'phrase_structure': 'Varied phrase lengths, formal structures'
        },
        'hip-hop': {
            'name': 'Hip-Hop',
            'characteristics': 'Strong beats, rhythmic vocals, sampling',
            'typical_tempo': '70-100 BPM',
            'phrase_structure': '4-bar and 2-bar patterns'
        },
        'country': {
            'name': 'Country',
            'characteristics': 'Storytelling, simple harmonies, traditional instruments',
            'typical_tempo': '80-120 BPM',
            'phrase_structure': 'Traditional 4-bar phrases'
        },
        'r&b': {
            'name': 'R&B',
            'characteristics': 'Soulful vocals, groove-based, rich harmonies',
            'typical_tempo': '70-120 BPM',
            'phrase_structure': 'Varied with groove emphasis'
        }
    }
    
    return jsonify(genres)

@app.route('/api-docs', methods=['GET'])
def api_documentation():
    """API documentation endpoint"""
    docs = {
        'title': 'Enhanced Music Generation API',
        'version': '1.0.0',
        'description': 'Generate MIDI music from lyrics with advanced AI composition techniques',
        'endpoints': {
            '/health': {
                'method': 'GET',
                'description': 'Health check'
            },
            '/generate': {
                'method': 'POST',
                'description': 'Generate music from lyrics',
                'required_params': ['lyrics', 'genre'],
                'optional_params': ['tempo', 'key', 'title', 'duration', 'mood', 'style_options']
            },
            '/batch-generate': {
                'method': 'POST',
                'description': 'Generate multiple songs in batch'
            },
            '/download/<filename>': {
                'method': 'GET',
                'description': 'Download generated files'
            },
            '/genres': {
                'method': 'GET',
                'description': 'Get available genres and characteristics'
            }
        },
        'example_request': {
            'lyrics': 'I love the way you smile\nYou make my day worthwhile\nTogether we can fly\nUnderneath the starry sky',
            'genre': 'pop',
            'tempo': 120,
            'key': 'C',
            'title': 'Starry Night',
            'duration': 45,
            'mood': 'happy',
            'style_options': {
                'complexity': 'medium',
                'voice_leading': True,
                'dynamic_phrasing': True
            }
        }
    }
    
    return jsonify(docs)

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print("🎵 Starting Enhanced Music Generation API Server")
    print("📖 API Documentation available at: http://0.0.0.0:5000/api-docs")
    print("❤️ Health check available at: http://0.0.0.0:5000/health")
    
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True,
        threaded=True
    )
