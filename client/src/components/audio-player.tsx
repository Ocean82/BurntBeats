import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  RotateCcw, 
  Edit3,
  Play as PlaySection
} from "lucide-react";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import type { Song } from "@shared/schema";
import SimpleAudioTest from "./simple-audio-test";

interface AudioPlayerProps {
  song: Song;
}

export default function AudioPlayer({ song }: AudioPlayerProps) {
  const [volume, setVolume] = useState([70]);
  const audioUrl = song.generatedAudioPath || undefined;
  
  // Debug logging
  console.log('AudioPlayer song:', {
    id: song.id,
    title: song.title,
    generatedAudioPath: song.generatedAudioPath,
    status: song.status
  });
  
  const { 
    isPlaying, 
    currentTime, 
    duration, 
    togglePlayback, 
    isLoading, 
    error, 
    seekTo, 
    setVolume: setAudioVolume 
  } = useAudioPlayer(audioUrl);

  const sections = song.sections as any[] || [
    { 
      id: 1, 
      type: "Verse 1", 
      startTime: 0, 
      endTime: 45, 
      lyrics: "Walking down the street tonight, Stars are shining bright..." 
    },
    { 
      id: 2, 
      type: "Chorus", 
      startTime: 45, 
      endTime: 90, 
      lyrics: "We're dancing through the night, Everything's gonna be alright..." 
    },
  ];

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="bg-dark-card border-gray-800 mt-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-poppins font-semibold text-white">
            Preview & Edit
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-1" />
              Regenerate Section
            </Button>
            <Button variant="outline" size="sm" className="bg-vibrant-orange hover:bg-orange-600 border-vibrant-orange">
              <Edit3 className="w-4 h-4 mr-1" />
              Edit Lyrics
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Audio Player Interface */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center space-x-4 mb-4">
            <img 
              src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=80&h=80" 
              alt="Generated song artwork" 
              className="w-20 h-20 rounded-lg object-cover" 
            />
            <div className="flex-1">
              <h4 className="font-poppins font-semibold text-white">
                {song.title}
              </h4>
              <p className="text-gray-400 text-sm">
                {song.genre} • {formatTime(duration)} • {song.tempo} BPM
                {isLoading && <span className="ml-2 text-blue-400">Loading...</span>}
                {error && <span className="ml-2 text-red-400">Audio Error</span>}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-xs bg-spotify-green px-2 py-1 rounded-full">
                  AI Generated
                </span>
                <span className="text-xs bg-gray-700 px-2 py-1 rounded-full">
                  High Quality
                </span>
              </div>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-6">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <SkipBack className="w-5 h-5" />
              </Button>
              <Button
                onClick={togglePlayback}
                className="w-12 h-12 bg-spotify-green hover:bg-green-600 rounded-full"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <SkipForward className="w-5 h-5" />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center space-x-3">
              <span className="text-xs text-gray-400">{formatTime(currentTime)}</span>
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={1}
                className="flex-1"
                onValueChange={(value) => seekTo(value[0])}
              />
              <span className="text-xs text-gray-400">{formatTime(duration)}</span>
            </div>

            {/* Volume Control */}
            <div className="flex items-center space-x-3">
              <Volume2 className="w-4 h-4 text-gray-400" />
              <Slider
                value={volume}
                onValueChange={(value) => {
                  setVolume(value);
                  setAudioVolume(value[0]);
                }}
                max={100}
                step={1}
                className="flex-1"
              />
            </div>
          </div>
        </div>

        {/* Debug Audio Test */}
        {audioUrl && (
          <SimpleAudioTest audioUrl={audioUrl} />
        )}

        {/* Section Editor */}
        <div className="mt-6 space-y-4">
          <h4 className="font-medium text-gray-300">Song Sections</h4>
          
          {sections.map((section, index) => (
            <div 
              key={section.id}
              className={`bg-gray-800 rounded-lg p-4 border-l-4 ${
                index === 0 ? 'border-spotify-green' : 'border-vibrant-orange'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-white">
                    {section.type}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatTime(section.startTime)} - {formatTime(section.endTime)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <PlaySection className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-vibrant-orange">
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-300">{section.lyrics}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
