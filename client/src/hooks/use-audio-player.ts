import { useState, useRef, useCallback, useEffect } from 'react';

export interface AudioPlayerConfig {
  preload?: 'none' | 'metadata' | 'auto';
  crossOrigin?: 'anonymous' | 'use-credentials';
  volume?: number;
}

export interface AudioSection {
  id: string;
  type: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro';
  startTime: number;
  endTime: number;
  lyrics?: string;
}

interface UseAudioPlayerProps {
  songId?: number;
  audioUrl?: string;
  config?: AudioPlayerConfig;
  onAnalytics?: (event: string, data: any) => void;
}

export function useAudioPlayer({ 
  songId,
  audioUrl,
  config = {},
  onAnalytics
}: UseAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const sessionId = useRef(Date.now().toString());
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(config.volume || 1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock sections for now - will be populated from backend later
  const sections: AudioSection[] = [];

  const logAnalytics = useCallback((event: string, data: any = {}) => {
    if (onAnalytics) {
      onAnalytics(event, { ...data, songId, currentTime, duration });
    }
  }, [onAnalytics, songId, currentTime, duration]);

  // Initialize audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    const handleLoadStart = () => setIsLoading(true);
    const handleLoadedData = () => setIsLoading(false);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      logAnalytics('metadata_loaded');
    };
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setIsPlaying(false);
      logAnalytics('song_ended');
    };
    const handleError = () => {
      setError('Failed to load audio');
      setIsLoading(false);
      logAnalytics('error', { error: 'load_failed' });
    };

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl, logAnalytics]);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      await audio.play();
      setIsPlaying(true);
      setError(null);
      logAnalytics('play_started');
    } catch (err) {
      setError('Failed to play audio');
      logAnalytics('error', { error: 'play_failed' });
    }
  }, [logAnalytics]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    setIsPlaying(false);
    logAnalytics('paused');
  }, [logAnalytics]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = time;
    setCurrentTime(time);
    logAnalytics('seeked', { seekTime: time });
  }, [logAnalytics]);

  const setVolumeLevel = useCallback((newVolume: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = newVolume;
    setVolume(newVolume);
    logAnalytics('volume_changed', { volume: newVolume });
  }, [logAnalytics]);

  const jumpToSection = useCallback((section: AudioSection) => {
    seek(section.startTime);
    logAnalytics('section_jumped', { section: section.type });
  }, [seek, logAnalytics]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return {
    audioRef,
    isPlaying,
    currentTime,
    duration,
    volume,
    isLoading,
    error,
    progress,
    sections,
    play,
    pause,
    seek,
    setVolume: setVolumeLevel,
    jumpToSection
  };
}