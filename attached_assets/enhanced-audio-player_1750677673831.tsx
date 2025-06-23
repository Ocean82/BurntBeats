"use client"

import { useState, useRef, useEffect } from "react"
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

interface EnhancedAudioPlayerProps {
  song: any
}

export default function EnhancedAudioPlayer({ song }: EnhancedAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState([70])
  const [currentSection, setCurrentSection] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Mock sections based on song structure
  const sections = [
    { id: 1, type: "Intro", startTime: 0, endTime: 15, lyrics: "Instrumental opening..." },
    { id: 2, type: "Verse 1", startTime: 15, endTime: 45, lyrics: song.lyrics.split("\n")[0] || "First verse..." },
    { id: 3, type: "Chorus", startTime: 45, endTime: 75, lyrics: song.lyrics.split("\n")[1] || "Main chorus..." },
    { id: 4, type: "Verse 2", startTime: 75, endTime: 105, lyrics: song.lyrics.split("\n")[2] || "Second verse..." },
    { id: 5, type: "Outro", startTime: 105, endTime: 120, lyrics: "Instrumental ending..." },
  ]

  useEffect(() => {
    const audioElement = audioRef.current
    if (audioElement) {
      if (isPlaying) {
        audioElement.play()
      } else {
        audioElement.pause()
      }
    }
  }, [isPlaying])

  useEffect(() => {
    const audioElement = audioRef.current
    if (audioElement) {
      audioElement.volume = volume[0] / 100
    }
  }, [volume])

  const togglePlayback = () => {
    setIsPlaying(!isPlaying)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const handleTimeUpdate = () => {
    const audioElement = audioRef.current
    if (audioElement) {
      setCurrentTime(audioElement.currentTime)

      // Update current section
      const section = sections.find(
        (s) => audioElement.currentTime >= s.startTime && audioElement.currentTime < s.endTime,
      )
      if (section) {
        setCurrentSection(section.id - 1)
      }
    }
  }

  const handleSeek = (value: number[]) => {
    const audioElement = audioRef.current
    if (audioElement) {
      audioElement.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }

  const jumpToSection = (section: any) => {
    const audioElement = audioRef.current
    if (audioElement) {
      audioElement.currentTime = section.startTime
      setCurrentTime(section.startTime)
    }
  }

  return (
    <div className="space-y-6">
      {/* Main Player Card */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center">
                <Music className="w-5 h-5 mr-2 text-purple-400" />
                {song.title}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="secondary">{song.genre}</Badge>
                <Badge variant="outline" className="text-gray-300">
                  {song.mood}
                </Badge>
                <Badge variant="outline" className="text-gray-300">
                  {song.tempo} BPM
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm">Generated Song</p>
              <p className="text-white font-medium">{formatTime(duration)}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Waveform Visualization (Mock) */}
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-center h-20 space-x-1">
              {Array.from({ length: 50 }, (_, i) => (
                <div
                  key={i}
                  className={`w-1 bg-gradient-to-t from-purple-500 to-blue-500 rounded-full transition-all ${
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
              <span className="text-sm text-gray-400 w-12">{formatTime(currentTime)}</span>
              <Slider value={[currentTime]} max={duration} step={1} onValueChange={handleSeek} className="flex-1" />
              <span className="text-sm text-gray-400 w-12">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center space-x-4">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <SkipBack className="w-5 h-5" />
            </Button>
            <Button
              onClick={togglePlayback}
              size="lg"
              className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <SkipForward className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <RotateCcw className="w-5 h-5" />
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-3">
            <Volume2 className="w-5 h-5 text-gray-400" />
            <Slider value={volume} onValueChange={setVolume} max={100} step={1} className="flex-1 max-w-32" />
            <span className="text-sm text-gray-400 w-8">{volume[0]}%</span>
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
          />
        </CardContent>
      </Card>

      {/* Song Sections */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-white">Song Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sections.map((section, index) => (
              <div
                key={section.id}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  currentSection === index
                    ? "bg-purple-500/20 border-purple-500/50"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                }`}
                onClick={() => jumpToSection(section)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <Badge variant={currentSection === index ? "default" : "secondary"}>{section.type}</Badge>
                    <span className="text-sm text-gray-400">
                      {formatTime(section.startTime)} - {formatTime(section.endTime)}
                    </span>
                  </div>
                  {currentSection === index && <Waveform className="w-4 h-4 text-purple-400" />}
                </div>
                <p className="text-gray-300 text-sm">{section.lyrics}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
