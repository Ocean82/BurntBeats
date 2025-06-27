#!/usr/bin/env python3
"""
Mock voice service for Burnt Beats deployment validation
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import uvicorn
import os
from pathlib import Path

app = FastAPI(title="Burnt Beats Voice Service")

# Mock mode when AI models not available
USE_MOCK = not Path("models/voice_model.pt").exists()

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "voice", "mock_mode": USE_MOCK}

@app.post("/api/voice/clone")
async def clone_voice(audio: UploadFile = File(...)):
    """Voice cloning endpoint with mock response when models unavailable"""
    if USE_MOCK:
        return {
            "success": True,
            "voice_id": "mock_voice_123",
            "message": "Voice cloning completed (mock mode)",
            "quality_score": 0.85
        }
    
    # Real implementation would process the audio file
    return {
        "success": True,
        "voice_id": f"voice_{audio.filename}",
        "message": "Voice cloning completed"
    }

@app.post("/api/voice/synthesize")
async def synthesize_speech(text: str, voice_id: str):
    """Text-to-speech synthesis with mock response"""
    if USE_MOCK:
        return {
            "success": True,
            "audio_url": "/mock/synthesized_audio.wav",
            "duration": 5.2
        }
    
    return {
        "success": True,
        "audio_url": f"/audio/synthesized_{voice_id}.wav",
        "duration": len(text) * 0.1
    }

if __name__ == "__main__":
    port = int(os.environ.get("VOICE_SERVICE_PORT", "8001"))
    uvicorn.run(app, host="0.0.0.0", port=port)