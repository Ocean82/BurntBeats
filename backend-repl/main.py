from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import uuid
from pathlib import Path
import numpy as np
import soundfile as sf
from fastapi.staticfiles import StaticFiles
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Burnt Beats Voice Engine", version="1.0.0")

# Allow CORS for frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextToSpeechRequest(BaseModel):
    text: str
    voice_id: str = None
    speed: float = 1.0
    pitch: float = 1.0
    quality: str = "high"

class VoiceCloneRequest(BaseModel):
    text: str
    voice_id: str
    style: str = "natural"
    emotion: str = "neutral"

# Enhanced Voice Engine for Burnt Beats
class BurntBeatsVoiceEngine:
    def __init__(self):
        self.voices_dir = "voices"
        self.embeddings_dir = "embeddings"
        self.outputs_dir = "outputs"
        os.makedirs(self.voices_dir, exist_ok=True)
        os.makedirs(self.embeddings_dir, exist_ok=True)
        os.makedirs(self.outputs_dir, exist_ok=True)
        logger.info("Burnt Beats Voice Engine initialized")

    def create_voice_embedding(self, audio_path: str, voice_id: str) -> str:
        """Create voice embedding for RVC/Bark integration"""
        try:
            embedding_path = f"{self.embeddings_dir}/{voice_id}.npy"
            # TODO: Replace with actual RVC embedding extraction
            # For now, create mock embedding - replace with:
            # embedding = rvc_model.extract_features(audio_path)
            embedding = np.random.rand(256)  # Mock embedding
            np.save(embedding_path, embedding)
            logger.info(f"Voice embedding created for {voice_id}")
            return embedding_path
        except Exception as e:
            logger.error(f"Failed to create embedding: {e}")
            raise HTTPException(500, f"Embedding creation failed: {e}")

    def synthesize_with_bark(self, text: str, voice_id: str = None) -> str:
        """Synthesize speech using Bark model"""
        try:
            output_path = f"{self.outputs_dir}/{uuid.uuid4()}.wav"
            # TODO: Replace with actual Bark synthesis
            # from bark import SAMPLE_RATE, generate_audio
            # audio_array = generate_audio(text, history_prompt=voice_id)
            # sf.write(output_path, audio_array, SAMPLE_RATE)
            
            # Mock audio generation - replace with real Bark
            duration = len(text) * 0.1  # Rough estimate
            sample_rate = 22050
            samples = int(duration * sample_rate)
            audio = np.random.normal(0, 0.1, samples).astype(np.float32)
            sf.write(output_path, audio, sample_rate)
            
            logger.info(f"Bark synthesis completed: {output_path}")
            return output_path
        except Exception as e:
            logger.error(f"Bark synthesis failed: {e}")
            raise HTTPException(500, f"Synthesis failed: {e}")

    def synthesize_with_rvc(self, text: str, voice_id: str) -> str:
        """Synthesize speech using RVC model"""
        try:
            output_path = f"{self.outputs_dir}/{uuid.uuid4()}.wav"
            # TODO: Replace with actual RVC inference
            # Load the RVC model and voice embedding
            # embedding_path = f"{self.embeddings_dir}/{voice_id}.npy"
            # embedding = np.load(embedding_path)
            # audio = rvc_model.infer(text, embedding)
            # sf.write(output_path, audio, 22050)
            
            # Mock audio generation - replace with real RVC
            duration = len(text) * 0.08  # RVC is typically faster
            sample_rate = 44100  # Higher quality for RVC
            samples = int(duration * sample_rate)
            audio = np.random.normal(0, 0.05, samples).astype(np.float32)
            sf.write(output_path, audio, sample_rate)
            
            logger.info(f"RVC synthesis completed: {output_path}")
            return output_path
        except Exception as e:
            logger.error(f"RVC synthesis failed: {e}")
            raise HTTPException(500, f"RVC synthesis failed: {e}")

engine = BurntBeatsVoiceEngine()

@app.get("/")
async def root():
    return {"message": "Burnt Beats Voice Engine API", "status": "operational"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Burnt Beats Voice Engine",
        "version": "1.0.0"
    }

@app.post("/register-voice")
async def register_voice(file: UploadFile = File(...)):
    """Register a new voice sample for cloning"""
    try:
        voice_id = str(uuid.uuid4())
        file_path = f"{engine.voices_dir}/{voice_id}.wav"
        
        # Save uploaded file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Create voice embedding
        embedding_path = engine.create_voice_embedding(file_path, voice_id)
        
        logger.info(f"Voice registered successfully: {voice_id}")
        return {
            "voice_id": voice_id,
            "embedding_path": embedding_path,
            "file_size": len(content),
            "status": "registered"
        }
    
    except Exception as e:
        logger.error(f"Voice registration failed: {e}")
        raise HTTPException(500, f"Voice registration failed: {e}")

@app.post("/synthesize-bark")
async def synthesize_bark(request: TextToSpeechRequest):
    """Synthesize speech using Bark model"""
    try:
        output_path = engine.synthesize_with_bark(request.text, request.voice_id)
        file_name = Path(output_path).name
        
        return {
            "audio_url": f"/outputs/{file_name}",
            "text": request.text,
            "voice_id": request.voice_id,
            "model": "bark",
            "status": "completed"
        }
    except Exception as e:
        logger.error(f"Bark synthesis failed: {e}")
        raise HTTPException(500, str(e))

@app.post("/synthesize-rvc")
async def synthesize_rvc(request: VoiceCloneRequest):
    """Synthesize speech using RVC model with voice cloning"""
    try:
        output_path = engine.synthesize_with_rvc(request.text, request.voice_id)
        file_name = Path(output_path).name
        
        return {
            "audio_url": f"/outputs/{file_name}",
            "text": request.text,
            "voice_id": request.voice_id,
            "model": "rvc",
            "style": request.style,
            "emotion": request.emotion,
            "status": "completed"
        }
    except Exception as e:
        logger.error(f"RVC synthesis failed: {e}")
        raise HTTPException(500, str(e))

@app.post("/synthesize")
async def synthesize_legacy(text: str, voice_id: str = None, model: str = "bark"):
    """Legacy synthesis endpoint for backward compatibility"""
    try:
        if model == "rvc" and voice_id:
            output_path = engine.synthesize_with_rvc(text, voice_id)
        else:
            output_path = engine.synthesize_with_bark(text, voice_id)
            
        file_name = Path(output_path).name
        return {"audio_url": f"/outputs/{file_name}"}
    except Exception as e:
        logger.error(f"Legacy synthesis failed: {e}")
        raise HTTPException(500, str(e))

@app.get("/voices")
async def list_voices():
    """List all registered voices"""
    try:
        voices = []
        for file_path in Path(engine.voices_dir).glob("*.wav"):
            voice_id = file_path.stem
            embedding_exists = Path(f"{engine.embeddings_dir}/{voice_id}.npy").exists()
            voices.append({
                "voice_id": voice_id,
                "has_embedding": embedding_exists,
                "file_size": file_path.stat().st_size
            })
        return {"voices": voices, "count": len(voices)}
    except Exception as e:
        logger.error(f"Failed to list voices: {e}")
        raise HTTPException(500, str(e))

# Serve static files (audio outputs)
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

# For Replit deployment
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)