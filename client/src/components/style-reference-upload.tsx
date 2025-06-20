import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Music, 
  X, 
  Play, 
  Pause,
  RotateCcw,
  Sparkles,
  Volume2,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StyleReferenceUploadProps {
  onStyleExtracted: (styleData: any) => void;
  userPlan: string;
}

interface AnalyzedStyle {
  tempo: number;
  key: string;
  genre: string;
  mood: string;
  energy: number;
  instruments: string[];
  confidence: number;
}

export default function StyleReferenceUpload({ onStyleExtracted, userPlan }: StyleReferenceUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analyzedStyle, setAnalyzedStyle] = useState<AnalyzedStyle | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const analyzeStyleMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsAnalyzing(true);
      setAnalysisProgress(0);
      
      // Check for overly complex analysis requests (file too long or complex)
      if (file.size > 40 * 1024 * 1024) { // 40MB+ = complex request
        throw new Error("too_complex_file");
      }
      
      // Simulate AI analysis with sassy commentary
      const steps = [
        { progress: 20, message: "Listening to your reference track... not bad taste!" },
        { progress: 40, message: "Analyzing the vibe... I can work with this" },
        { progress: 60, message: "Extracting the secret sauce..." },
        { progress: 80, message: "Almost done cooking up the analysis..." },
        { progress: 100, message: "Style decoded! Ready to make magic happen" }
      ];

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setAnalysisProgress(step.progress);
        if (step.progress < 100) {
          toast({
            title: "Analyzing...",
            description: step.message,
          });
        }
      }

      // Mock analysis results
      const mockAnalysis: AnalyzedStyle = {
        tempo: 128,
        key: "A minor",
        genre: "Electronic Pop",
        mood: "Energetic",
        energy: 8.5,
        instruments: ["Synth Lead", "808 Drums", "Bass", "Pad"],
        confidence: 94
      };

      return mockAnalysis;
    },
    onSuccess: (analysis) => {
      setAnalyzedStyle(analysis);
      setIsAnalyzing(false);
      onStyleExtracted(analysis);
      toast({
        title: "Style analysis complete!",
        description: `Found a ${analysis.genre} vibe with ${analysis.confidence}% confidence. Now let's make something even better!`,
      });
    },
    onError: (error: any) => {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      
      if (error.message === "too_complex_file") {
        const complexFileResponses = [
          "Bro, this isn't that kinda app",
          "You must be confusing me with one of those high dollar apps",
          "I don't feel like it right now",
          "These aren't the audio files you're looking for",
          "That file is thicc... too thicc for my taste",
          "Sir, this is a music app, not NASA"
        ];
        const randomResponse = complexFileResponses[Math.floor(Math.random() * complexFileResponses.length)];
        
        toast({
          title: randomResponse,
          description: "Try something under 40MB and I'll work my magic.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Analysis failed",
          description: "Hmm, that file gave me trouble. Try a different format?",
          variant: "destructive",
        });
      }
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast({
        title: "Not an audio file",
        description: "I need music, not a selfie. Upload an audio file please!",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      toast({
        title: "File too large",
        description: "Whoa there! Keep it under 50MB. I'm fast but not that fast.",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    analyzeStyleMutation.mutate(file);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const fakeEvent = { target: { files: [file] } } as any;
      handleFileUpload(fakeEvent);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setAnalyzedStyle(null);
    setAnalysisProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (userPlan === "free") {
    return (
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-white">
            Style Reference Upload (Pro Feature)
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">What did you expect from the free plan?</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
            I'd love to analyze your style reference, but you've got to take me somewhere that doesn't involve a value meal first. This AI magic costs more than free!
          </p>
          <Button className="bg-gradient-to-r from-vibrant-orange to-orange-600 hover:from-orange-600 hover:to-vibrant-orange">
            Upgrade to Basic - $6.99/mo
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-dark-card border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center text-lg font-medium text-white">
          <Music className="w-5 h-5 mr-2 text-blue-500" />
          Style Reference Upload
          <Badge className="ml-2 bg-blue-500/20 text-blue-400">AI Analysis</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!uploadedFile ? (
          <div
            className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-gray-500 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Drop your reference track</h3>
            <p className="text-sm text-gray-400 mb-4">
              Upload any song and I'll analyze its style to create something similar (but legal)
            </p>
            <p className="text-xs text-gray-500">
              Supports MP3, WAV, M4A • Max 50MB • 30 seconds minimum
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* File Info */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded flex items-center justify-center">
                    <Music className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{uploadedFile.name}</p>
                    <p className="text-xs text-gray-400">
                      {(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsPlaying(!isPlaying)}>
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleRemoveFile}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Analysis Progress */}
            {isAnalyzing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">Analyzing style...</span>
                  <span className="text-sm text-gray-400">{analysisProgress}%</span>
                </div>
                <Progress value={analysisProgress} className="h-2" />
              </div>
            )}

            {/* Analysis Results */}
            {analyzedStyle && (
              <div className="bg-gray-800 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-white">Style Analysis</h4>
                  <Badge className="bg-green-500/20 text-green-400">
                    {analyzedStyle.confidence}% confidence
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-400">Tempo</p>
                    <p className="font-medium text-white">{analyzedStyle.tempo} BPM</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Key</p>
                    <p className="font-medium text-white">{analyzedStyle.key}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Genre</p>
                    <p className="font-medium text-white">{analyzedStyle.genre}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Energy</p>
                    <p className="font-medium text-white">{analyzedStyle.energy}/10</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-400 mb-2">Detected Instruments</p>
                  <div className="flex flex-wrap gap-2">
                    {analyzedStyle.instruments.map((instrument, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {instrument}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    className="bg-spotify-green hover:bg-green-600"
                    onClick={() => {
                      toast({
                        title: "Style applied!",
                        description: "Now let's create something fire with this vibe!",
                      });
                    }}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Use This Style
                  </Button>
                  <Button variant="outline" onClick={() => analyzeStyleMutation.mutate(uploadedFile)}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Re-analyze
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}