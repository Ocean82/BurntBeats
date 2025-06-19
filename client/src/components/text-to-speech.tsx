import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Download, Volume2, Music } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TextToSpeechProps {
  userId: number;
}

const sampleTexts = {
  singing: `Hello, I'm testing my voice for singing. 
La la la, do re mi fa sol la ti do.
This voice will be used to create beautiful songs.
Testing different notes and vocal ranges now.`,
  
  reading: `This is a sample text for natural voice reading.
I can read articles, books, and any written content.
My voice sounds clear and natural for text-to-speech.
Perfect for audiobooks and narration projects.`
};

const voiceSettings = {
  pitch: [
    { value: "low", label: "Low Pitch" },
    { value: "normal", label: "Normal Pitch" }, 
    { value: "high", label: "High Pitch" }
  ],
  speed: [
    { value: "slow", label: "Slow" },
    { value: "normal", label: "Normal" },
    { value: "fast", label: "Fast" }
  ],
  tone: [
    { value: "warm", label: "Warm" },
    { value: "neutral", label: "Neutral" },
    { value: "bright", label: "Bright" }
  ]
};

export default function TextToSpeech({ userId }: TextToSpeechProps) {
  const [text, setText] = useState(sampleTexts.singing);
  const [voiceType, setVoiceType] = useState("singing");
  const [pitch, setPitch] = useState("normal");
  const [speed, setSpeed] = useState("normal");
  const [tone, setTone] = useState("warm");
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();

  const generateVoiceMutation = useMutation({
    mutationFn: async () => {
      // Mock voice generation - in real app would call TTS API
      await new Promise(resolve => setTimeout(resolve, 3000));
      return { audioUrl: "/mock-generated-voice.mp3", success: true };
    },
    onSuccess: () => {
      toast({
        title: "Voice generated successfully",
        description: "Your text has been converted to speech.",
      });
    },
    onError: () => {
      toast({
        title: "Generation failed",
        description: "Failed to generate voice. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveVoiceMutation = useMutation({
    mutationFn: async () => {
      // Mock saving to voice samples
      const formData = new FormData();
      formData.append("name", `${voiceType === "singing" ? "Singing" : "Reading"} Voice Sample`);
      formData.append("userId", userId.toString());
      formData.append("voiceType", voiceType);
      formData.append("settings", JSON.stringify({ pitch, speed, tone }));
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Voice sample saved",
        description: "Your generated voice has been added to your samples.",
      });
    }
  });

  const handleVoiceTypeChange = (type: string) => {
    setVoiceType(type);
    setText(sampleTexts[type as keyof typeof sampleTexts]);
  };

  return (
    <Card className="bg-dark-card border-gray-800 mt-6">
      <CardHeader>
        <CardTitle className="text-lg font-poppins font-semibold text-white">
          Text-to-Speech Voice Creator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Voice Type Selection */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Voice Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={voiceType === "singing" ? "default" : "outline"}
                className={voiceType === "singing" ? "bg-spotify-green hover:bg-spotify-green" : ""}
                onClick={() => handleVoiceTypeChange("singing")}
              >
                <Music className="w-4 h-4 mr-2" />
                Singing Voice
              </Button>
              <Button
                type="button"
                variant={voiceType === "reading" ? "default" : "outline"}
                className={voiceType === "reading" ? "bg-spotify-green hover:bg-spotify-green" : ""}
                onClick={() => handleVoiceTypeChange("reading")}
              >
                <Volume2 className="w-4 h-4 mr-2" />
                Reading Voice
              </Button>
            </div>
          </div>

          {/* Text Input */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Sample Text
            </label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full h-32 bg-gray-800 border-gray-600 text-white resize-none"
              placeholder="Enter text to convert to speech..."
            />
          </div>

          {/* Voice Settings */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Pitch</label>
              <Select value={pitch} onValueChange={setPitch}>
                <SelectTrigger className="bg-gray-800 border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {voiceSettings.pitch.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Speed</label>
              <Select value={speed} onValueChange={setSpeed}>
                <SelectTrigger className="bg-gray-800 border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {voiceSettings.speed.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Tone</label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="bg-gray-800 border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {voiceSettings.tone.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={() => generateVoiceMutation.mutate()}
              disabled={generateVoiceMutation.isPending || !text.trim()}
              className="flex-1 bg-vibrant-orange hover:bg-orange-600"
            >
              <Play className="w-4 h-4 mr-2" />
              {generateVoiceMutation.isPending ? "Generating..." : "Generate Voice"}
            </Button>
            
            <Button
              onClick={() => saveVoiceMutation.mutate()}
              disabled={saveVoiceMutation.isPending}
              variant="outline"
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              {saveVoiceMutation.isPending ? "Saving..." : "Save Sample"}
            </Button>
          </div>

          {/* Info Text */}
          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-400">
              {voiceType === "singing" 
                ? "This will create a voice sample that can sing your lyrics with musical expression."
                : "This will create a natural-sounding voice for reading text aloud, perfect for audiobooks and narration."
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}