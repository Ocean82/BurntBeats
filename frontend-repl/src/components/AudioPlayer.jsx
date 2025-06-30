import React, { useState, useRef, useEffect } from 'react';

export default function AudioPlayer({ src }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };

    const setAudioTime = () => setCurrentTime(audio.currentTime);

    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);

    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
    };
  }, [src]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    const clickX = e.nativeEvent.offsetX;
    const width = e.currentTarget.offsetWidth;
    const newTime = (clickX / width) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="audio-player">
      <audio
        ref={audioRef}
        src={src}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      
      <div className="player-controls">
        <button 
          className="play-button"
          onClick={togglePlayPause}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        
        <div className="time-display">
          {formatTime(currentTime)}
        </div>
        
        <div className="progress-container" onClick={handleSeek}>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        
        <div className="time-display">
          {formatTime(duration)}
        </div>
      </div>
      
      <div className="audio-info">
        <span className="audio-source">🎵 Generated Audio</span>
      </div>
    </div>
  );
}