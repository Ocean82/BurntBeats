import { useState } from "react";
import { Button } from "@/components/ui/button";

interface SimpleAudioTestProps {
  audioUrl: string;
}

export default function SimpleAudioTest({ audioUrl }: SimpleAudioTestProps) {
  const [audio] = useState(() => new Audio(audioUrl));
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = async () => {
    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Simple audio test error:', error);
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-white mb-2">Simple Audio Test</h3>
      <p className="text-gray-400 text-sm mb-4">URL: {audioUrl}</p>
      <Button onClick={handlePlay}>
        {isPlaying ? 'Pause' : 'Play'} Test Audio
      </Button>
      <audio controls className="w-full mt-4" src={audioUrl}>
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}