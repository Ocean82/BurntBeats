import { useState, useRef, useEffect, useCallback } from "react";

export function useAudioPlayer(audioUrl?: string) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element when URL changes
  useEffect(() => {
    if (!audioUrl) return;

    console.log('useAudioPlayer: Loading audio URL:', audioUrl);
    setIsLoading(true);
    setError(null);
    
    // Create new audio element
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = 0.7;
    audio.crossOrigin = 'anonymous';
    
    // Set up event listeners
    const handleLoadedMetadata = () => {
      console.log('useAudioPlayer: Audio metadata loaded, duration:', audio.duration);
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = (e: Event) => {
      console.error('useAudioPlayer: Audio error:', e, audio.error);
      setError(`Failed to load audio file: ${audio.error?.message || 'Unknown error'}`);
      setIsLoading(false);
      setIsPlaying(false);
    };

    const handleCanPlayThrough = () => {
      setIsLoading(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);

    // Load the audio file
    audio.src = audioUrl;
    audioRef.current = audio;

    return () => {
      // Cleanup
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.pause();
      audioRef.current = null;
    };
  }, [audioUrl]);

  const togglePlayback = useCallback(async () => {
    if (!audioRef.current || isLoading) {
      console.log('useAudioPlayer: Cannot play - audio not ready:', { hasAudio: !!audioRef.current, isLoading });
      return;
    }

    try {
      if (isPlaying) {
        console.log('useAudioPlayer: Pausing audio');
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        console.log('useAudioPlayer: Attempting to play audio');
        await audioRef.current.play();
        console.log('useAudioPlayer: Audio playing successfully');
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('useAudioPlayer: Failed to play audio:', err);
      setError(`Failed to play audio: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsPlaying(false);
    }
  }, [isPlaying, isLoading]);

  const seekTo = useCallback((time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (!audioRef.current) return;
    audioRef.current.volume = Math.max(0, Math.min(1, volume / 100));
  }, []);

  return {
    isPlaying,
    currentTime,
    duration,
    isLoading,
    error,
    togglePlayback,
    seekTo,
    setVolume,
    setCurrentTime: seekTo,
  };
}
