import React, { useState, useRef } from 'react';
import VoiceCloning from './components/VoiceCloning';
import AudioPlayer from './components/AudioPlayer';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [voiceId, setVoiceId] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('voice-clone');
  
  // Backend URL for local development
  const BACKEND_URL = "http://0.0.0.0:5000";

  const handleUpload = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch(`${BACKEND_URL}/register-voice`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      setVoiceId(data.voice_id);
      console.log("Voice registered:", data);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSynthesize = async (model = 'bark') => {
    if (!text) return;
    
    setIsProcessing(true);
    try {
      const endpoint = model === 'rvc' ? '/synthesize-rvc' : '/synthesize-bark';
      const requestBody = model === 'rvc' ? {
        text: text,
        voice_id: voiceId,
        style: 'natural',
        emotion: 'neutral'
      } : {
        text: text,
        voice_id: voiceId,
        speed: 1.0,
        pitch: 1.0,
        quality: 'high'
      };

      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      setAudioUrl(`${BACKEND_URL}${data.audio_url}`);
      console.log("Synthesis completed:", data);
    } catch (error) {
      console.error("Synthesis failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🔥 Burnt Beats Voice Engine</h1>
        <p>Advanced AI Voice Cloning & Text-to-Speech</p>
      </header>

      <nav className="tab-nav">
        <button 
          className={`tab ${activeTab === 'voice-clone' ? 'active' : ''}`}
          onClick={() => setActiveTab('voice-clone')}
        >
          Voice Cloning
        </button>
        <button 
          className={`tab ${activeTab === 'text-to-speech' ? 'active' : ''}`}
          onClick={() => setActiveTab('text-to-speech')}
        >
          Text-to-Speech
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'voice-clone' && (
          <VoiceCloning 
            file={file}
            setFile={setFile}
            text={text}
            setText={setText}
            voiceId={voiceId}
            isProcessing={isProcessing}
            onUpload={handleUpload}
            onSynthesize={() => handleSynthesize('rvc')}
          />
        )}

        {activeTab === 'text-to-speech' && (
          <div className="section">
            <h2>Text-to-Speech with Bark</h2>
            <div className="input-group">
              <label>Enter Text:</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type what you want the AI voice to say..."
                rows={4}
              />
            </div>
            
            <button 
              className="primary-button"
              onClick={() => handleSynthesize('bark')}
              disabled={isProcessing || !text}
            >
              {isProcessing ? 'Generating...' : 'Generate Speech'}
            </button>
          </div>
        )}

        {audioUrl && (
          <div className="result-section">
            <h2>Generated Audio:</h2>
            <AudioPlayer src={audioUrl} />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Powered by RVC & Bark AI Models</p>
        <div className="status">
          <span className={`status-indicator ${voiceId ? 'active' : 'inactive'}`}>
            Voice: {voiceId ? 'Registered' : 'Not Registered'}
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;