"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  RotateCcw,
  AudioWaveformIcon as Waveform,
  Music,
} from "lucide-react"

interface Song {
  id: string
  title: string
  audioUrl: string
  genre: string
  mood: string
  tempo: number
  lyrics: string
  duration?: number
}

interface SongSection {
  id: number
  type: string
  startTime: number
  endTime: number
  lyrics: string
}

interface EnhancedAudioPlayerProps {
  song: Song
}

export default function EnhancedAudioPlayer({ song }: EnhancedAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(song.duration || 0)
  const [volume, setVolume] = useState([70])
  const [currentSection, setCurrentSection] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Generate sections with proper typing
  const sections: SongSection[] = [
    { id: 1, type: "Intro", startTime: 0, endTime: 15, lyrics: "Instrumental opening..." },
    { id: 2, type: "Verse 1", startTime: 15, endTime: 45, lyrics: song.lyrics.split("\n")[0] || "First verse..." },
    { id: 3, type: "Chorus", startTime: 45, endTime: 75, lyrics: song.lyrics.split("\n")[1] || "Main chorus..." },
    { id: 4, type: "Verse 2", startTime: 75, endTime: 105, lyrics: song.lyrics.split("\n")[2] || "Second verse..." },
    { id: 5, type: "Outro", startTime: 105, endTime: 120, lyrics: "Instrumental ending..." },
  ]

  // Handle play/pause
  const togglePlayback = useCallback(() => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
        .catch(error => console.error("Playback failed:", error))
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  // Handle volume changes
  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = isMuted ? 0 : volume[0] / 100
  }, [volume, isMuted])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault()
        togglePlayback()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [togglePlayback])

  // Format time display
  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }, [])

  // Handle time updates and section detection
  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current) return

    setCurrentTime(audioRef.current.currentTime)

    // Find current section more efficiently
    const currentSectionIndex = sections.findIndex(
      s => audioRef.current!.currentTime >= s.startTime && 
           audioRef.current!.currentTime < s.endTime
    )
    if (currentSectionIndex >= 0 && currentSectionIndex !== currentSection) {
      setCurrentSection(currentSectionIndex)
    }
  }, [currentSection, sections])

  // Handle seeking
  const handleSeek = useCallback((value: number[]) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = value[0]
    setCurrentTime(value[0])
  }, [])

  // Jump to specific section
  const jumpToSection = useCallback((section: SongSection) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = section.startTime
    setCurrentTime(section.startTime)
  }, [])

  // Skip forward/backward
  const skip = useCallback((seconds: number) => {
    if (!audioRef.current) return
    const newTime = Math.max(0, Math.min(audioRef.current.currentTime + seconds, duration))
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }, [duration])

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted)
  }, [isMuted])

  return (
    <div className="space-y-6">
      {/* Main Player Card */}
      <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-green-300 flex items-center">
                <Music className="w-5 h-5 mr-2 text-green-400" />
                {song.title}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="secondary" className="bg-green-500/20 text-green-300">{song.genre}</Badge>
                <Badge variant="outline" className="text-green-400 border-green-500/30">
                  {song.mood}
                </Badge>
                <Badge variant="outline" className="text-green-400 border-green-500/30">
                  {song.tempo} BPM
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-green-400/60 text-sm">Generated Song</p>
              <p className="text-green-300 font-medium">{formatTime(duration)}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Waveform Visualization */}
          <div className="bg-black/60 rounded-lg p-4 border border-green-500/20">
            <div className="flex items-center justify-center h-20 space-x-1">
              {Array.from({ length: 50 }, (_, i) => (
                <div
                  key={i}
                  className={`w-1 bg-gradient-to-t from-green-500 to-emerald-400 rounded-full transition-all ${
                    i < (currentTime / duration) * 50 ? "opacity-100" : "opacity-30"
                  }`}
                  style={{ height: `${Math.random() * 60 + 20}px` }}
                />
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-green-400/60 w-12">{formatTime(currentTime)}</span>
              <Slider 
                value={[currentTime]} 
                max={duration} 
                step={0.1} 
                onValueChange={handleSeek} 
                className="flex-1" 
              />
              <span className="text-sm text-green-400/60 w-12">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-green-300 hover:bg-green-500/20"
              onClick={() => skip(-15)}
            >
              <SkipBack className="w-5 h-5" />
            </Button>
            <Button
              onClick={togglePlayback}
              size="lg"
              className="w-14 h-14 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 hover:from-green-600 hover:to-emerald-500"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-green-300 hover:bg-green-500/20"
              onClick={() => skip(15)}
            >
              <SkipForward className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-green-300 hover:bg-green-500/20"
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.currentTime = 0
                  setCurrentTime(0)
                }
              }}
            >
              <RotateCcw className="w-5 h-5" />
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-green-400/60 hover:bg-green-500/20"
              onClick={toggleMute}
            >
              <Volume2 className="w-5 h-5" />
            </Button>
            <Slider 
              value={[isMuted ? 0 : volume[0]]} 
              onValueChange={(val) => {
                setVolume(val)
                if (val[0] > 0) setIsMuted(false)
              }} 
              max={100} 
              step={1} 
              className="flex-1 max-w-32" 
            />
            <span className="text-sm text-green-400/60 w-8">
              {isMuted ? "Muted" : `${volume[0]}%`}
            </span>
          </div>

          {/* Hidden Audio Element */}
          <audio
            ref={audioRef}
            src={song.audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={(e) => {
              const audioElement = e.currentTarget
              setDuration(audioElement.duration)
            }}
            onEnded={() => setIsPlaying(false)}
            preload="metadata"
          />
        </CardContent>
      </Card>

      {/* Song Sections */}
      <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10">
        <CardHeader>
          <CardTitle className="text-green-300">Song Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sections.map((section, index) => (
              <div
                key={section.id}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  currentSection === index
                    ? "bg-green-500/20 border-green-500/50"
                    : "bg-black/40 border-green-500/20 hover:bg-green-500/10"
                }`}
                onClick={() => jumpToSection(section)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <Badge variant={currentSection === index ? "default" : "secondary"} 
                           className={currentSection === index ? "bg-green-500 text-black" : "bg-green-500/20 text-green-300"}>
                      {section.type}
                    </Badge>
                    <span className="text-sm text-green-400/60">
                      {formatTime(section.startTime)} - {formatTime(section.endTime)}
                    </span>
                  </div>
                  {currentSection === index && <Waveform className="w-4 h-4 text-green-400" />}
                </div>
                <p className="text-green-300/80 text-sm">{section.lyrics}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}