"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Play, Pause, Volume2, VolumeX, Download, AlertCircle, Loader2, Music } from "lucide-react"
import type { Song } from "@shared/schema"
import { formatTime } from "@/lib/utils"
import WatermarkIndicator from "./watermark-indicator"

interface AudioPlayerProps {
  song: Song;
  className?: string;
  onUpgrade?: () => void;
  autoPlay?: boolean;
  loop?: boolean;
  onTrackEnd?: () => void;
  onNext?: () => void;
  showSections?: boolean;
}

export default function AudioPlayer({ 
  song, 
  className = "", 
  onUpgrade,
  autoPlay = false,
  loop = false,
  onTrackEnd,
  onNext 
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [currentSection, setCurrentSection] = useState<string>('');
  const [showSectionList, setShowSectionList] = useState(false);

  // Validate and normalize audio URL
  const audioUrl = validateAudioUrl(song?.audioUrl || song?.generatedAudioPath);

  // Validate audio URL helper function
  function validateAudioUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    
    // Handle relative URLs by making them absolute
    if (url.startsWith('/uploads/') || url.startsWith('/songs/')) {
      const baseUrl = window.location.origin;
      return `${baseUrl}${url}`;
    }
    
    // Validate URL format
    try {
      new URL(url);
      return url;
    } catch {
      console.warn('Invalid audio URL:', url);
      return null;
    }
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    setError(null);
    setIsReady(false);
    setIsLoading(true);

    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsReady(true);
      setIsLoading(false);
      
      // Attempt autoplay if enabled and user has interacted
      if (autoPlay && hasUserInteracted) {
        audio.play().catch(err => {
          console.log('Autoplay blocked by browser:', err);
        });
      }
    };

    const handleLoadedData = () => {
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setCurrentTime(audio.currentTime);
        
        // Update current section based on playback time
        if (song.sections && Array.isArray(song.sections)) {
          const currentSec = song.sections.find(section => 
            audio.currentTime >= section.startTime && audio.currentTime < section.endTime
          );
          if (currentSec && currentSec.type !== currentSection) {
            setCurrentSection(currentSec.type);
          }
        }
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      
      if (loop) {
        audio.currentTime = 0;
        audio.play().catch(console.error);
      } else {
        // Call callbacks for track end
        onTrackEnd?.();
        if (onNext) {
          setTimeout(onNext, 1000); // Small delay before auto-advancing
        }
      }
    };

    const handleError = (e: Event) => {
      const errorTarget = e.target as HTMLAudioElement;
      const errorCode = errorTarget.error?.code;
      
      let errorMessage = 'Failed to load audio';
      switch (errorCode) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage = 'Audio loading was aborted';
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = 'Network error while loading audio';
          break;
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = 'Audio file is corrupted or unsupported';
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'Audio format not supported';
          break;
      }
      
      setError(errorMessage);
      setIsLoading(false);
      setIsReady(false);
      console.error('Audio error:', errorMessage, 'URL:', audioUrl);
    };

    const handleCanPlayThrough = () => {
      setIsReady(true);
      setIsLoading(false);
    };

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
    };
  }, [audioUrl, autoPlay, hasUserInteracted, loop, onTrackEnd, onNext]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !isReady) return;

    // Mark user interaction for autoplay permissions
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
        setError(null);
      } catch (error) {
        const err = error as Error;
        console.error('Error playing audio:', err);
        
        if (err.name === 'NotAllowedError') {
          setError('Playback blocked by browser. Please interact with the page first.');
        } else if (err.name === 'NotSupportedError') {
          setError('Audio format not supported by your browser');
        } else {
          setError('Failed to play audio. Please try again.');
        }
      }
    }
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio || !isReady || !duration) return;
    
    const seekTime = Math.min(Math.max(value[0], 0), duration);
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    const newVolume = value[0];
    
    if (audio) {
      audio.volume = newVolume;
    }
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const jumpToSection = (startTime: number) => {
    const audio = audioRef.current;
    if (!audio || !isReady) return;
    
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
    }
    
    audio.currentTime = startTime;
    setCurrentTime(startTime);
    
    if (!isPlaying) {
      togglePlay();
    }
  };

  if (!audioUrl) {
    return (
      <Card className={`bg-white/5 border-white/10 backdrop-blur-lg ${className}`}>
        <CardContent className="p-6">
          <div className="text-center text-white/60 flex items-center justify-center space-x-2">
            <AlertCircle className="h-5 w-5" />
            <span>No valid audio URL available for this song</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`bg-white/5 border-white/10 backdrop-blur-lg ${className}`}>
        <CardContent className="p-6">
          <div className="text-center text-red-400 flex items-center justify-center space-x-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
          <div className="mt-4 text-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => window.location.reload()}
              className="text-white/60 hover:text-white"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const showFullControls = isReady && duration > 0;

  return (
    <Card className={`bg-white/5 border-white/10 backdrop-blur-lg ${className}`}>
      <CardContent className="p-6">
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          loop={loop}
        />
        
        <div className="space-y-4">
          {/* Song Info */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white flex items-center justify-center">
              {song.title}
              {isLoading && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
            </h3>
            <p className="text-sm text-white/60 capitalize">{song.genre}</p>
            {!isReady && !error && (
              <p className="text-xs text-white/40 mt-1">Loading audio...</p>
            )}
          </div>

          {/* Progress Bar - only show when ready */}
          {showFullControls && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-white/60">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          )}

          {/* Seek Slider - only show when ready */}
          {showFullControls && (
            <Slider
              value={[currentTime]}
              max={duration}
              step={1}
              onValueChange={handleSeek}
              className="w-full"
              disabled={!isReady}
            />
          )}

          {/* Controls */}
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlay}
              disabled={!isReady || isLoading}
              className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </Button>
            
            {/* Next button if callback provided */}
            {onNext && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onNext}
                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <Download className="h-4 w-4 rotate-90" />
              </Button>
            )}
          </div>

          {/* Volume Control - only show when ready */}
          {showFullControls && (
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="text-white/60 hover:text-white"
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.1}
                onValueChange={handleVolumeChange}
                className="flex-1"
                disabled={!isReady}
              />
            </div>
          )}

          {/* Section Navigation */}
          {showFullControls && song.sections && Array.isArray(song.sections) && song.sections.length > 0 && (
            <div className="space-y-3 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Current: {currentSection || 'Loading...'}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSectionList(!showSectionList)}
                  className="text-white/60 hover:text-white text-xs"
                >
                  {showSectionList ? 'Hide' : 'Show'} Sections
                </Button>
              </div>
              
              {showSectionList && (
                <div className="grid grid-cols-2 gap-2">
                  {song.sections.map((section, index) => (
                    <Button
                      key={index}
                      variant={currentSection === section.type ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => jumpToSection(section.startTime)}
                      className="text-xs justify-start text-white/70 hover:text-white hover:bg-white/10"
                      disabled={!isReady}
                    >
                      <span className="truncate">
                        {section.type} ({formatTime(section.startTime)})
                      </span>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-white/30 mt-4 space-y-1">
              <p>Audio URL: {audioUrl}</p>
              <p>Ready: {isReady ? 'Yes' : 'No'} | Duration: {duration}s</p>
              <p>User Interaction: {hasUserInteracted ? 'Yes' : 'No'}</p>
              <p>Sections: {song.sections ? song.sections.length : 0}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}