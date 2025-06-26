"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Download, 
  AlertCircle, 
  Loader2, 
  Gauge,
  ListMusic,
  SkipBack,
  SkipForward
} from "lucide-react"
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
  onPrevious?: () => void;
  showSections?: boolean;
}

export default function AudioPlayer({ 
  song, 
  className = "", 
  onUpgrade,
  autoPlay = false,
  loop = false,
  onTrackEnd,
  onNext,
  onPrevious
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [currentSection, setCurrentSection] = useState('');
  const [showSectionList, setShowSectionList] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  // Get valid audio URL
  const getAudioUrl = useCallback(() => {
    if (!song?.audioUrl && !song?.generatedAudioPath) return null;

    const url = song.audioUrl || song.generatedAudioPath;

    try {
      // Handle relative URLs
      if (url.startsWith('/')) {
        return `${window.location.origin}${url}`;
      }

      // Validate absolute URLs
      new URL(url);
      return url;
    } catch {
      console.warn('Invalid audio URL:', url);
      return null;
    }
  }, [song]);

  const audioUrl = getAudioUrl();

  // Initialize audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    const handleEvents = () => {
      const handleLoadStart = () => {
        setIsLoading(true);
        setError(null);
      };

      const handleLoadedMetadata = () => {
        setDuration(audio.duration || 0);
        setIsReady(true);
        setIsLoading(false);

        // Attempt autoplay if enabled and user has interacted
        if (autoPlay && hasUserInteracted) {
          audio.play().catch(err => {
            console.log('Autoplay blocked:', err);
          });
        }
      };

      const handleTimeUpdate = () => {
        if (!isDragging && !isNaN(audio.duration)) {
          setCurrentTime(audio.currentTime);
          updateCurrentSection(audio.currentTime);
        }
      };

      const handleEnded = () => {
        setIsPlaying(false);
        if (loop) {
          audio.currentTime = 0;
          audio.play().catch(console.error);
        } else {
          onTrackEnd?.();
        }
      };

      const handleError = () => {
        const errorMessages = {
          1: 'Playback aborted',
          2: 'Network error',
          3: 'Decoding error',
          4: 'Unsupported format'
        };
        setError(errorMessages[audio.error?.code || 0] || 'Playback error');
        setIsLoading(false);
      };

      audio.addEventListener('loadstart', handleLoadStart);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);

      return () => {
        audio.removeEventListener('loadstart', handleLoadStart);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
      };
    };

    handleEvents();
  }, [audioUrl, autoPlay, loop, onTrackEnd, hasUserInteracted, isDragging]);

  // Update current section
  const updateCurrentSection = useCallback((time: number) => {
    if (!song.sections?.length) return;

    const section = song.sections.find(s => 
      time >= s.startTime && time < s.endTime
    );
    setCurrentSection(section?.type || '');
  }, [song.sections]);

  // Play/pause toggle
  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    setHasUserInteracted(true);

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
        setError(null);
      }
    } catch (err) {
      setError('Failed to play audio. Try interacting with the page first.');
    }
  }, [isPlaying]);

  // Handle seeking
  const handleSeekStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleSeekEnd = useCallback(() => {
    setIsDragging(false);
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = currentTime;
    }
  }, [currentTime]);

  const handleSeek = useCallback(([value]: number[]) => {
    setCurrentTime(Math.min(Math.max(value, 0), duration));
  }, [duration]);

  // Volume control
  const handleVolumeChange = useCallback(([value]: number[]) => {
    const newVolume = Math.min(Math.max(value, 0), 1);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);

    const audio = audioRef.current;
    if (audio) {
      audio.volume = newVolume;
    }
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  // Playback speed
  const changePlaybackRate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const newRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];

    audio.playbackRate = newRate;
    setPlaybackRate(newRate);
  }, [playbackRate]);

  // Section navigation
  const jumpToSection = useCallback((startTime: number) => {
    const audio = audioRef.current;
    if (!audio || !isReady) return;

    setHasUserInteracted(true);
    audio.currentTime = startTime;
    setCurrentTime(startTime);
    updateCurrentSection(startTime);

    if (!isPlaying) {
      togglePlay();
    }
  }, [isPlaying, isReady, togglePlay, updateCurrentSection]);

  // Skip forward/backward
  const skipForward = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.min(audio.currentTime + 15, duration);
  }, [duration]);

  const skipBackward = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(audio.currentTime - 15, 0);
  }, []);

  if (!audioUrl) {
    return (
      <Card className={`bg-white/5 border-white/10 backdrop-blur-lg ${className}`}>
        <CardContent className="p-6">
          <div className="text-center text-white/60 flex items-center justify-center space-x-2">
            <AlertCircle className="h-5 w-5" />
            <span>Audio unavailable for this song</span>
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
            {song.watermark && <WatermarkIndicator />}
          </div>

          {/* Progress Display */}
          {showFullControls && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-white/60">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <Slider
                value={[currentTime]}
                max={duration}
                step={0.1}
                onValueChange={handleSeek}
                onPointerDown={handleSeekStart}
                onPointerUp={handleSeekEnd}
                className="w-full"
              />
            </div>
          )}

          {/* Main Controls */}
          <div className="flex items-center justify-center space-x-4">
            {onPrevious && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onPrevious}
                className="h-10 w-10"
                aria-label="Previous track"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlay}
              disabled={!isReady || isLoading}
              className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </Button>

            {onNext && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onNext}
                className="h-10 w-10"
                aria-label="Next track"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Secondary Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute" : "Mute"}
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
                step={0.05}
                onValueChange={handleVolumeChange}
                className="w-24"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={skipBackward}
                className="text-xs"
                aria-label="Skip backward 15 seconds"
              >
                -15s
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={changePlaybackRate}
                className="text-xs flex items-center"
                aria-label={`Playback speed (${playbackRate}x)`}
              >
                <Gauge className="h-3 w-3 mr-1" />
                {playbackRate}x
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={skipForward}
                className="text-xs"
                aria-label="Skip forward 15 seconds"
              >
                +15s
              </Button>
            </div>
          </div>

          {/* Section Navigation */}
          {showFullControls && song.sections?.length > 0 && (
            <div className="space-y-3 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">
                  Current: {currentSection || 'Intro'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSectionList(!showSectionList)}
                  className="text-xs flex items-center"
                  aria-label={showSectionList ? "Hide sections" : "Show sections"}
                >
                  <ListMusic className="h-3 w-3 mr-1" />
                  {showSectionList ? 'Hide' : 'Show'} Sections
                </Button>
              </div>

              {/* Visual Timeline */}
              <div className="relative h-8 bg-white/5 rounded-lg overflow-hidden">
                {song.sections.map((section, index) => {
                  const sectionWidth = ((section.endTime - section.startTime) / duration) * 100;
                  const sectionLeft = (section.startTime / duration) * 100;
                  const isCurrent = currentTime >= section.startTime && currentTime < section.endTime;

                  return (
                    <button
                      key={index}
                      onClick={() => jumpToSection(section.startTime)}
                      className={`absolute h-full text-xs transition-all ${
                        isCurrent 
                          ? 'bg-purple-500/80 text-white' 
                          : 'bg-white/20 text-white/70 hover:bg-white/30'
                      }`}
                      style={{
                        left: `${sectionLeft}%`,
                        width: `${sectionWidth}%`,
                      }}
                      aria-label={`Jump to ${section.type}`}
                    >
                      <span className="px-1 truncate">{section.type}</span>
                    </button>
                  );
                })}
                <div 
                  className="absolute top-0 h-full bg-purple-500/30 pointer-events-none"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Detailed Section List */}
              {showSectionList && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {song.sections.map((section, index) => (
                    <div 
                      key={index}
                      className={`flex items-center justify-between p-2 rounded-md ${
                        currentSection === section.type 
                          ? 'bg-purple-500/20 border border-purple-500/40' 
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-medium">{section.type}</div>
                        <div className="text-xs text-white/60">
                          {formatTime(section.startTime)} - {formatTime(section.endTime)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => jumpToSection(section.startTime)}
                        aria-label={`Jump to ${section.type}`}
                      >
                        Jump
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
