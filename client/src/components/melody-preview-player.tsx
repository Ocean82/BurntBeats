
import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import { Play, Pause, Volume2, Download, Loader2 } from 'lucide-react';
import { toast } from './ui/toast';

interface MelodyPreview {
  id: string;
  audioUrl: string;
  lyrics: string;
  genre: string;
  mood: string;
  tempo: number;
  key: string;
  duration: number;
  metadata: {
    generatedAt: string;
    noteCount: number;
    vocalStyle: string;
    quality: string;
  };
}

interface MelodyPreviewPlayerProps {
  preview: MelodyPreview;
  onGenerateFullSong?: (preview: MelodyPreview) => void;
  className?: string;
}

export function MelodyPreviewPlayer({ 
  preview, 
  onGenerateFullSong,
  className = "" 
}: MelodyPreviewPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Playback error:', error);
      toast({
        title: "Playback Error",
        description: "Failed to play audio. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const seekTime = (value[0] / 100) * preview.duration;
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const formatTime = (seconds: number) => {
    return `${Math.floor(seconds)}:${Math.floor((seconds % 1) * 10)}`;
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = preview.audioUrl;
    link.download = `melody-preview-${preview.genre}-${preview.id}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download Started",
      description: "Melody preview is downloading...",
    });
  };

  const handleGenerateFullSong = () => {
    if (onGenerateFullSong) {
      onGenerateFullSong(preview);
    }
  };

  const progressPercentage = preview.duration > 0 ? (currentTime / preview.duration) * 100 : 0;

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {preview.genre.charAt(0).toUpperCase() + preview.genre.slice(1)}
              <Badge variant="outline" className="text-xs">
                {preview.key}
              </Badge>
            </CardTitle>
            <CardDescription className="text-sm">
              {preview.mood} • {preview.tempo} BPM • {preview.duration}s
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-xs">
            Preview
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Audio Element */}
        <audio
          ref={audioRef}
          src={preview.audioUrl}
          preload="metadata"
        />

        {/* Lyrics Display */}
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-sm italic text-muted-foreground">
            "{preview.lyrics}"
          </p>
        </div>

        {/* Playback Controls */}
        <div className="space-y-3">
          {/* Progress Bar */}
          <div className="space-y-1">
            <Slider
              value={[progressPercentage]}
              onValueChange={handleSeek}
              max={100}
              step={1}
              className="w-full"
              disabled={isLoading}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(preview.duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={togglePlayback}
                disabled={isLoading}
                className="w-12 h-12"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>

              {/* Volume Control */}
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={[volume]}
                  onValueChange={(value) => setVolume(value[0])}
                  max={100}
                  step={1}
                  className="w-16"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="h-8"
              >
                <Download className="h-3 w-3" />
              </Button>
              {onGenerateFullSong && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleGenerateFullSong}
                  className="h-8"
                >
                  Generate Full Song
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Style:</span>
            <span>{preview.metadata.vocalStyle}</span>
          </div>
          <div className="flex justify-between">
            <span>Notes:</span>
            <span>{preview.metadata.noteCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Quality:</span>
            <span className="capitalize">{preview.metadata.quality}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Component for displaying multiple melody previews
interface MelodyPreviewGridProps {
  previews: MelodyPreview[];
  onGenerateFullSong?: (preview: MelodyPreview) => void;
  className?: string;
}

export function MelodyPreviewGrid({ 
  previews, 
  onGenerateFullSong,
  className = "" 
}: MelodyPreviewGridProps) {
  if (previews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No melody previews available</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {previews.map((preview) => (
        <MelodyPreviewPlayer
          key={preview.id}
          preview={preview}
          onGenerateFullSong={onGenerateFullSong}
        />
      ))}
    </div>
  );
}
