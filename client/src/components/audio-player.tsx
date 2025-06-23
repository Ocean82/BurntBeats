"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Play, Pause, Volume2, VolumeX } from "lucide-react"
import type { Song } from "@shared/schema"
import { formatTime } from "@/lib/utils"

interface AudioPlayerProps {
  song: Song;
  className?: string;
}

export default function AudioPlayer({ song, className = "" }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const audioUrl = song?.generatedAudioPath ? song.generatedAudioPath : undefined;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Error playing audio:', error);
      }
    }
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
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

  if (!audioUrl) {
    return (
      <Card className={`bg-white/5 border-white/10 backdrop-blur-lg ${className}`}>
        <CardContent className="p-6">
          <div className="text-center text-white/60">
            No audio available for this song
          </div>
        </CardContent>
      </Card>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Card className={`bg-white/5 border-white/10 backdrop-blur-lg ${className}`}>
      <CardContent className="p-6">
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
        />
        
        <div className="space-y-4">
          {/* Song Info */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white">{song.title}</h3>
            <p className="text-sm text-white/60 capitalize">{song.genre}</p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-white/60">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Seek Slider */}
          <Slider
            value={[currentTime]}
            max={duration}
            step={1}
            onValueChange={handleSeek}
            className="w-full"
          />

          {/* Controls */}
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlay}
              className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white"
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </Button>
          </div>

          {/* Volume Control */}
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
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}