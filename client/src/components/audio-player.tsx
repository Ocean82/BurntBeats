"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
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
import type { Song, SongSection } from "@shared/schema"
import { formatTime } from "@/lib/utils"
import WatermarkIndicator from "./watermark-indicator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useHotkeys } from "react-hotkeys-hook"

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
  onPurchaseRequired?: (songId: number) => void;
  purchaseStatus?: 'none' | 'pending' | 'completed';
}

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export default function AudioPlayer({ 
  song, 
  className = "", 
  onUpgrade,
  autoPlay = false,
  loop = false,
  onTrackEnd,
  onNext,
  onPrevious,
  onPurchaseRequired,
  purchaseStatus = 'none'
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(song.duration || 0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [currentSection, setCurrentSection] = useState('');
  const [showSectionList, setShowSectionList] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<typeof PLAYBACK_RATES[number]>(1);
  const [isDragging, setIsDragging] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Memoize audio URL to prevent unnecessary recalculations
  const audioUrl = useMemo(() => {
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

  // Initialize audio element and event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

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
  }, [audioUrl, autoPlay, loop, onTrackEnd, hasUserInteracted, isDragging]);

  // Update current section
  const updateCurrentSection = useCallback((time: number) => {
    if (!song.sections?.length) return;

    const section = song.sections.find(s => 
      time >= s.startTime && time < s.endTime
    );
    setCurrentSection(section?.type || '');
  }, [song.sections]);

  // Play/pause toggle with better error handling
  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    setHasUserInteracted(true);

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await handlePlay();
      }
    } catch (err) {
      setError('Failed to play audio. Try interacting with the page first.');
      console.error('Playback error:', err);
    }
  }, [isPlaying]);

  const handlePlay = async () => {
    if (audioRef.current) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        trackPlayAnalytics();
      } catch (err) {
        if (err instanceof Error && err.name === 'NotAllowedError') {
          setError('Playback blocked. Please interact with the page first.');
        }
      }
    }
  };

  // Track play analytics with payment status
  const trackPlayAnalytics = useCallback(async () => {
    try {
      const sessionId = sessionStorage.getItem('sessionId') || 
        crypto.randomUUID();
      sessionStorage.setItem('sessionId', sessionId);

      // Check if this is a paid/purchased track
      const isPurchased = await fetch(`/api/verify-purchase/${song.id}`, {
        method: 'GET',
        credentials: 'include'
      }).then(res => res.ok).catch(() => false);

      const response = await fetch(`/api/play/${song.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          sessionId,
          userId: null, // Add user ID if you have auth
          isPurchased,
          playType: isPurchased ? 'purchased' : 'preview'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to track play');
      }
    } catch (error) {
      console.warn('Failed to track play:', error);
      // Implement retry logic here if needed
    }
  }, [song.id]);

  // Handle seeking with debouncing
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

  // Volume control with persistence
  const handleVolumeChange = useCallback(([value]: number[]) => {
    const newVolume = Math.min(Math.max(value, 0), 1);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);

    const audio = audioRef.current;
    if (audio) {
      audio.volume = newVolume;
    }

    // Persist volume preference
    localStorage.setItem('audioPlayerVolume', newVolume.toString());
  }, []);

  // Initialize volume from localStorage
  useEffect(() => {
    const savedVolume = localStorage.getItem('audioPlayerVolume');
    if (savedVolume) {
      const volumeValue = parseFloat(savedVolume);
      if (!isNaN(volumeValue)) {
        setVolume(volumeValue);
        setIsMuted(volumeValue === 0);
      }
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

  // Playback speed cycling
  const changePlaybackRate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const currentIndex = PLAYBACK_RATES.indexOf(playbackRate);
    const newIndex = (currentIndex + 1) % PLAYBACK_RATES.length;
    const newRate = PLAYBACK_RATES[newIndex];

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

  // Keyboard shortcuts
  useHotkeys('space', (e) => {
    e.preventDefault();
    togglePlay();
  }, [togglePlay]);

  useHotkeys('arrowright', skipForward, [skipForward]);
  useHotkeys('arrowleft', skipBackward, [skipBackward]);
  useHotkeys('m', toggleMute, [toggleMute]);
  useHotkeys('r', changePlaybackRate, [changePlaybackRate]);

  // Download handler with payment verification
  const handleDownload = useCallback(async () => {
    if (!audioUrl || !song?.id) return;

    setIsDownloading(true);
    try {
      // First verify if user has purchased this song
      const verifyResponse = await fetch(`/api/verify-purchase/${song.id}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!verifyResponse.ok) {
        // If not purchased, trigger payment flow
        if (onUpgrade) {
          onUpgrade(); // This should open the payment modal
          setError('Purchase required to download this song');
          return;
        } else {
          setError('Download not available - payment required');
          return;
        }
      }

      const purchaseData = await verifyResponse.json();
      if (!purchaseData.verified) {
        setError('Purchase verification failed - please contact support');
        return;
      }

      // If verified, proceed with download using the secure endpoint
      const downloadResponse = await fetch(`/api/download/secure/${song.id}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${purchaseData.sessionId}`,
        }
      });

      if (!downloadResponse.ok) {
        throw new Error('Download failed - server error');
      }

      const blob = await downloadResponse.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${song.title.replace(/[^a-z0-9]/gi, '_')}_${purchaseData.tier}.${purchaseData.format || 'mp3'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      // Track successful download
      trackPlayAnalytics();
    } catch (err) {
      console.error('Download failed:', err);
      setError('Failed to download audio - please try again');
    } finally {
      setIsDownloading(false);
    }
  }, [audioUrl, song, onUpgrade]);

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

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-md p-3 text-sm text-red-300">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            </div>
          )}

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
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onPrevious}
                    className="h-10 w-10"
                    aria-label="Previous track"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Previous Track</TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              <TooltipContent>{isPlaying ? "Pause" : "Play"}</TooltipContent>
            </Tooltip>

            {onNext && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onNext}
                    className="h-10 w-10"
                    aria-label="Next track"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Next Track</TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Secondary Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Tooltip>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                <TooltipContent>{isMuted ? "Unmute" : "Mute"}</TooltipContent>
              </Tooltip>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.05}
                onValueChange={handleVolumeChange}
                className="w-24"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={skipBackward}
                    className="text-xs"
                    aria-label="Skip backward 15 seconds"
                  >
                    -15s
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Skip Backward 15s</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                <TooltipContent>Playback Speed ({playbackRate}x)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={skipForward}
                    className="text-xs"
                    aria-label="Skip forward 15 seconds"
                  >
                    +15s
                  </Button>
                </TooltipTrigger>
                <
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={skipForward}
                        className="text-xs"
                        aria-label="Skip forward 15 seconds"
                      >
                        +15s
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Skip Forward 15s</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="text-xs flex items-center"
                        aria-label={song.watermark ? "Purchase to download" : "Download audio"}
                      >
                        {isDownloading ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Download className="h-3 w-3 mr-1" />
                        )}
                        {song.watermark ? "Buy" : "Download"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {song.watermark ? "Purchase required for download" : "Download Audio File"}
                    </TooltipContent>
                  </Tooltip>
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

                  {/* Upgrade Prompt */}
                  {onUpgrade && (
                  <div className="border-t border-white/10 pt-4 text-center">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={onUpgrade}
                    className="w-full"
                  >
                    Upgrade for Full Features
                  </Button>
                  </div>
                  )}
                  </div>
                  </CardContent>
                  </Card>
                  );
                  }
