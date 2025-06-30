import React from 'react';

export default function VoiceCloning({ 
  file, 
  setFile, 
  text, 
  setText, 
  voiceId, 
  isProcessing, 
  onUpload, 
  onSynthesize 
}) {
  return (
    <div className="voice-cloning">
      <div className="section">
        <h2>🎤 Voice Cloning with RVC</h2>
        <p className="description">
          Upload a voice sample to clone and generate speech with that voice
        </p>
      </div>

      <div className="section">
        <h3>Step 1: Upload Voice Sample</h3>
        <div className="upload-area">
          <input 
            type="file" 
            accept="audio/*" 
            onChange={(e) => setFile(e.target.files[0])}
            className="file-input"
            id="voice-upload"
          />
          <label htmlFor="voice-upload" className="file-label">
            {file ? file.name : 'Choose audio file (WAV, MP3, etc.)'}
          </label>
        </div>
        
        <button 
          className="secondary-button"
          onClick={onUpload}
          disabled={isProcessing || !file}
        >
          {isProcessing ? 'Processing...' : 'Register Voice'}
        </button>
        
        {voiceId && (
          <div className="success-message">
            ✅ Voice registered successfully! ID: {voiceId.substring(0, 8)}...
          </div>
        )}
      </div>

      <div className="section">
        <h3>Step 2: Enter Text for Voice Cloning</h3>
        <div className="input-group">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter the text you want to speak with the cloned voice..."
            rows={4}
            className="text-input"
          />
        </div>
      </div>

      <div className="section">
        <h3>Step 3: Generate Cloned Voice</h3>
        <button 
          className="primary-button"
          onClick={onSynthesize}
          disabled={isProcessing || !text || !voiceId}
        >
          {isProcessing ? 'Cloning Voice...' : 'Generate with RVC'}
        </button>
        
        {!voiceId && (
          <p className="warning">
            Please upload and register a voice sample first
          </p>
        )}
      </div>

      <div className="features-list">
        <h4>RVC Features:</h4>
        <ul>
          <li>✨ High-quality voice cloning</li>
          <li>🎯 Precise voice similarity</li>
          <li>⚡ Fast inference</li>
          <li>🔊 Natural speech synthesis</li>
        </ul>
      </div>
    </div>
  );
}