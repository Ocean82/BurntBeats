#!/usr/bin/env python3
"""
Mock music service for Burnt Beats deployment validation
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
import uvicorn
import os
from pathlib import Path
from pydantic import BaseModel

app = FastAPI(title="Burnt Beats Music Service")

# Mock mode when AI models not available
USE_MOCK = not Path("models/music_model.pt").exists()

class SongRequest(BaseModel):
    title: str
    lyrics: str
    genre: str
    tempo: int = 120
    duration: int = 60

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "music", "mock_mode": USE_MOCK}

@app.post("/api/music/generate")
async def generate_music(request: SongRequest):
    """Music generation endpoint with mock response when models unavailable"""
    if USE_MOCK:
        return {
            "success": True,
            "song_id": "mock_song_123",
            "status": "completed",
            "audio_url": "/mock/generated_music.mp3",
            "duration": request.duration,
            "message": "Music generation completed (mock mode)"
        }
    
    # Real implementation would process the music generation
    return {
        "success": True,
        "song_id": f"song_{request.title.lower().replace(' ', '_')}",
        "status": "processing",
        "estimated_time": request.duration * 2
    }

@app.get("/api/music/status/{song_id}")
async def get_generation_status(song_id: str):
    """Get music generation status"""
    if USE_MOCK:
        return {
            "song_id": song_id,
            "status": "completed",
            "progress": 100,
            "audio_url": f"/mock/{song_id}.mp3"
        }
    
    return {
        "song_id": song_id,
        "status": "processing",
        "progress": 75
    }

if __name__ == "__main__":
    port = int(os.environ.get("MUSIC_SERVICE_PORT", "8002"))
    uvicorn.run(app, host="0.0.0.0", port=port)