# Burnt Beats Dual-Repl Voice Pipeline Setup

This guide explains how to set up the dual-Repl architecture for Burnt Beats with RVC/Bark voice synthesis integration.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     BURNT BEATS PLATFORM                        │
├─────────────────────────────────────────────────────────────────┤
│  Frontend Repl (React)          Backend Repl (FastAPI)          │
│  ┌─────────────────────┐       ┌──────────────────────────────┐ │
│  │  Song Creation UI   │  ───► │  Voice Engine API            │ │
│  │  Voice Pipeline     │       │  ┌─────────────────────────┐ │ │
│  │  Status Bar         │       │  │  RVC Voice Cloning     │ │ │
│  │  Audio Player       │       │  │  Bark Text-to-Speech   │ │ │
│  └─────────────────────┘       │  │  Voice Embeddings      │ │ │
│                                │  │  Audio Generation       │ │ │
│                                │  └─────────────────────────┘ │ │
│                                └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Step 1: Backend Repl Setup (FastAPI + RVC/Bark)

### Create New Python Repl
1. Go to Replit and create a new Python Repl
2. Name it: `burnt-beats-voice-backend`
3. Copy files from `backend-repl/` directory:
   - `main.py` - FastAPI voice engine
   - `requirements.txt` - Python dependencies

### Install Dependencies
```bash
pip install fastapi uvicorn python-multipart numpy soundfile pydantic python-jose python-dotenv aiofiles
```

### Add RVC Model Integration
To implement actual RVC voice cloning, add these dependencies:
```bash
pip install torch torchaudio librosa scipy transformers
```

### Add Bark Model Integration  
To implement actual Bark text-to-speech, add these dependencies:
```bash
pip install bark-voice-synthesis transformers accelerate
```

### Configure Repl
1. Set the run command: `python main.py`
2. Configure environment variables if needed
3. Note your backend URL: `https://your-username.burnt-beats-voice-backend.repl.co`

## Step 2: Frontend Repl Setup (React)

### Create New Node.js Repl
1. Go to Replit and create a new Node.js Repl  
2. Name it: `burnt-beats-voice-frontend`
3. Copy files from `frontend-repl/` directory:
   - `src/App.jsx` - Main React application
   - `src/components/` - Voice cloning components
   - `src/App.css` - Burnt Beats styling
   - `package.json` - Node.js dependencies

### Install Dependencies
```bash
npm install react react-dom vite @vitejs/plugin-react
```

### Configure Backend URL
In `src/App.jsx`, update the backend URL:
```javascript
const BACKEND_URL = "https://your-username.burnt-beats-voice-backend.repl.co";
```

### Configure Repl
1. Set the run command: `npm run dev`
2. The frontend will be available at: `https://your-username.burnt-beats-voice-frontend.repl.co`

## Step 3: Integration with Main Burnt Beats Platform

### Install Voice Pipeline Hook
Copy `client/src/hooks/use-voice-pipeline.ts` to your main Burnt Beats Repl.

### Install Voice Pipeline Component
Copy `client/src/components/voice-pipeline-integration.tsx` to your main Burnt Beats Repl.

### Integrate with Song Creation
Add to your song creation form:

```typescript
import VoicePipelineIntegration from '@/components/voice-pipeline-integration';

// In your component:
const VOICE_BACKEND_URL = "https://your-username.burnt-beats-voice-backend.repl.co";

<VoicePipelineIntegration
  backendUrl={VOICE_BACKEND_URL}
  text={lyrics}
  onVoiceGenerated={(audioUrl, voiceId) => {
    console.log("Voice generated:", audioUrl);
    // Handle generated voice audio
  }}
/>
```

## Step 4: Testing the Pipeline

### Test Backend API
1. Visit your backend URL to see API docs
2. Test endpoints:
   - `GET /health` - Check if backend is running
   - `POST /register-voice` - Upload voice sample
   - `POST /synthesize-bark` - Generate speech with Bark
   - `POST /synthesize-rvc` - Generate speech with RVC (requires voice)

### Test Frontend Interface
1. Visit your frontend URL
2. Try the voice cloning workflow:
   - Upload a voice sample (WAV file works best)
   - Enter some text
   - Click "Generate Voice"
   - Listen to the result

### Test Integration
1. In your main Burnt Beats platform
2. Go to song creation page
3. Use the integrated voice pipeline component
4. Generate voice for your lyrics

## Step 5: Adding Real RVC/Bark Models

### For RVC Implementation
Replace mock synthesis in `backend-repl/main.py`:

```python
# Add to requirements.txt:
# torch>=2.0.0
# torchaudio>=2.0.0
# librosa>=0.10.0

def synthesize_with_rvc(self, text: str, voice_id: str) -> str:
    # Load RVC model
    # model = load_rvc_model()
    # embedding = np.load(f"{self.embeddings_dir}/{voice_id}.npy")
    # audio = model.infer(text, embedding)
    # sf.write(output_path, audio, 22050)
    pass
```

### For Bark Implementation
Replace mock synthesis in `backend-repl/main.py`:

```python
# Add to requirements.txt:
# bark-voice-synthesis>=1.0.0
# transformers>=4.30.0

from bark import generate_audio, SAMPLE_RATE

def synthesize_with_bark(self, text: str, voice_id: str = None) -> str:
    audio_array = generate_audio(text, history_prompt=voice_id)
    sf.write(output_path, audio_array, SAMPLE_RATE)
    return output_path
```

## Configuration Options

### Environment Variables
- `PORT` - Backend port (default: 8000)
- `CORS_ORIGINS` - Allowed CORS origins
- `MODEL_PATH` - Path to RVC/Bark models
- `MAX_FILE_SIZE` - Maximum upload file size

### Voice Quality Settings
- **High Quality**: 44.1kHz, 24-bit for professional use
- **Medium Quality**: 22.05kHz, 16-bit for demos
- **Low Quality**: 16kHz, 16-bit for fast processing

## Troubleshooting

### Backend Issues
- Check Python dependencies are installed
- Verify FastAPI is running on correct port
- Check CORS configuration for frontend access

### Frontend Issues  
- Verify backend URL is correct
- Check browser console for network errors
- Ensure React dependencies are installed

### Model Issues
- RVC models require GPU for optimal performance
- Bark models are CPU-friendly but slower
- Check model file paths and permissions

## Security Considerations

- Use environment variables for sensitive settings
- Implement rate limiting for production
- Validate all file uploads
- Set appropriate CORS origins
- Consider authentication for production use

## Performance Optimization

- Use GPU acceleration for RVC models
- Implement audio caching
- Add request queuing for multiple users
- Consider model quantization for faster inference
- Use streaming for large audio files