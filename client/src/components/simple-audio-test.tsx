import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface SimpleAudioTestProps {
  audioUrl: string;
}

export default function SimpleAudioTest({ audioUrl }: SimpleAudioTestProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = async () => {
    if (!audioRef.current) return;
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
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
      <audio 
        ref={audioRef}
        controls 
        className="w-full mt-4" 
        src={audioUrl}
        onEnded={() => setIsPlaying(false)}
      >
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}