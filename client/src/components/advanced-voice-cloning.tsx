
import { useState, useRef, useCallback } from "react";
import { Wand2, Mic, Layers, Music, Download, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Constants
const NATIONAL_ANTHEM_TEXT = "Oh say can you see, by the dawn's early light, What so proudly we hailed at the twilight's last gleaming...";

const genreOptions = [
  { value: "pop", label: "Pop" },
  { value: "rock", label: "Rock" },
  { value: "hiphop", label: "Hip Hop" },
  { value: "jazz", label: "Jazz" },
  { value: "classical", label: "Classical" }
];

const styleOptions = [
  { value: "smooth", label: "Smooth" },
  { value: "raw", label: "Raw" },
  { value: "energetic", label: "Energetic" },
  { value: "mellow", label: "Mellow" }
];

interface VoiceSample {
  id: string;
  userId: string;
  name: string;
  audioUrl: string;
  anthemUrl?: string;
  sampleUrl?: string;
  isPublic: boolean;
  characteristics?: any;
  createdAt: Date;
}

interface VoiceCloningProps {
  userId: number;
}

export default function AdvancedVoiceCloning({ userId }: VoiceCloningProps) {
  const [selectedVoiceSample, setSelectedVoiceSample] = useState<string | null>(null);
  const [voiceName, setVoiceName] = useState<string>("");
  const [makePublic, setMakePublic] = useState<boolean>(false);
  const [genre, setGenre] = useState<string>("pop");
  const [style, setStyle] = useState<string>("smooth");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [clonedVoice, setClonedVoice] = useState<VoiceSample | null>(null);
  const [processingStep, setProcessingStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available voices
  const { data: availableVoices, refetch: refetchVoices } = useQuery<VoiceSample[]>({
    queryKey: ['voices'],
    queryFn: async () => {
      const response = await fetch('/api/voice-cloning/voices', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch voices');
      return response.json().then(data => data.voices || []);
    }
  });

  // Enhanced recording functions
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType: 'audio/webm;codecs=opus' 
      });
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(chunks, { type: "audio/webm;codecs=opus" });
          setRecordedBlob(blob);
          setSelectedVoiceSample(null);
        } catch (error) {
          toast({
            title: "Recording Processing Failed",
            description: "Could not process the recording",
            variant: "destructive"
          });
        } finally {
          stream.getTracks().forEach(track => track.stop());
          setIsRecording(false);
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Speak clearly for 10-30 seconds for best results",
      });
    } catch (error) {
      toast({
        title: "Recording Failed",
        description: "Microphone access denied or unavailable",
        variant: "destructive"
      });
    }
  }, [toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Voice cloning mutation
  const voiceCloningMutation = useMutation({
    mutationFn: async () => {
      if (!selectedVoiceSample && !recordedBlob) {
        throw new Error("Please select a voice sample or record a new one");
      }

      const formData = new FormData();
      
      if (recordedBlob) {
        formData.append("audio", recordedBlob, "voice_sample.webm");
      } else if (selectedVoiceSample) {
        formData.append("audioUrl", selectedVoiceSample);
      }
      
      formData.append("name", voiceName || `My Voice ${new Date().toLocaleString()}`);
      formData.append("makePublic", makePublic.toString());
      formData.append("sampleText", NATIONAL_ANTHEM_TEXT);

      const response = await fetch('/api/voice-cloning/clone', {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Voice cloning failed");
      }

      return response.json();
    },
    onSuccess: (result) => {
      setClonedVoice(result);
      setProcessingStep(0);
      setIsProcessing(false);
      
      queryClient.invalidateQueries({ queryKey: ['voices'] });
      
      toast({
        title: "🎤 Voice Cloned Successfully!",
        description: "Your custom voice and anthem sample are ready!",
      });
    },
    onError: (error) => {
      setProcessingStep(0);
      setIsProcessing(false);
      
      toast({
        title: "Voice Cloning Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  });

  // Process voice clone with steps
  const processVoiceClone = useCallback(async () => {
    if (!selectedVoiceSample && !recordedBlob) {
      toast({
        title: "No Voice Sample",
        description: "Please select a voice sample or record a new one",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProcessingStep(0);

    const processingSteps = [
      "Analyzing voice characteristics with neural embedding",
      "Extracting spectral features and formants",
      "Applying genre-specific voice adaptation",
      "Preserving original timbre characteristics", 
      "Generating national anthem sample",
      "Creating voice model for synthesis"
    ];

    // Simulate processing steps
    for (let step = 0; step < processingSteps.length; step++) {
      setProcessingStep(step);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // Execute the actual cloning
    voiceCloningMutation.mutate();
  }, [selectedVoiceSample, recordedBlob, voiceCloningMutation, toast]);

  // Delete voice mutation
  const deleteVoiceMutation = useMutation({
    mutationFn: async (voiceId: string) => {
      const response = await fetch(`/api/voice-cloning/voices/${voiceId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete voice');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voices'] });
      toast({
        title: "Voice Deleted",
        description: "Voice has been removed from your collection",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Could not delete voice",
        variant: "destructive"
      });
    }
  });

  const processingSteps = [
    "Analyzing voice characteristics with neural embedding",
    "Extracting spectral features and formants", 
    "Applying genre-specific voice adaptation",
    "Preserving original timbre characteristics",
    "Generating national anthem sample",
    "Creating voice model for synthesis"
  ];

  return (
    <Card className="bg-dark-card border-gray-800 mt-6">
      <CardHeader>
        <CardTitle className="text-lg font-poppins font-semibold text-white flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-spotify-green" />
          Advanced Voice Cloning for Song Generation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="clone" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="clone" className="text-gray-300">Clone Voice</TabsTrigger>
            <TabsTrigger value="result" className="text-gray-300">Results</TabsTrigger>
            <TabsTrigger value="library" className="text-gray-300">Voice Library</TabsTrigger>
          </TabsList>

          <TabsContent value="clone" className="space-y-4 mt-4">
            {/* Voice Sample Selection */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Select Existing Voice Sample
              </label>
              <Select 
                value={selectedVoiceSample || ""}
                onValueChange={(value) => {
                  setSelectedVoiceSample(value);
                  setRecordedBlob(null);
                }}
              >
                <SelectTrigger className="bg-gray-800 border-gray-600">
                  <SelectValue placeholder="Select a voice sample" />
                </SelectTrigger>
                <SelectContent>
                  {availableVoices?.map((sample) => (
                    <SelectItem key={sample.id} value={sample.audioUrl}>
                      {sample.name} {sample.isPublic && "(Public)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Voice Name Input */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Voice Name
              </label>
              <input
                type="text"
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                placeholder="Enter a name for your voice"
                className="flex h-10 w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-spotify-green focus:ring-offset-2 focus:ring-offset-gray-900"
              />
            </div>

            {/* Public Toggle */}
            <div className="flex items-center space-x-2">
              <Switch 
                id="make-public" 
                checked={makePublic}
                onCheckedChange={setMakePublic}
              />
              <Label htmlFor="make-public" className="text-gray-300">
                Make this voice public (contribute to voice bank)
              </Label>
            </div>

            {/* Genre and Style Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Genre
                </label>
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger className="bg-gray-800 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {genreOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Style
                </label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger className="bg-gray-800 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {styleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Recording Interface */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Record New Voice Sample
              </label>
              <div className="flex items-center space-x-4">
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-16 h-16 rounded-full ${
                    isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-vibrant-orange hover:bg-orange-600'
                  }`}
                >
                  {isRecording ? (
                    <Layers className="w-6 h-6" />
                  ) : (
                    <Mic className="w-6 h-6" />
                  )}
                </Button>
                <div className="flex-1">
                  <p className="text-sm text-gray-400">
                    {isRecording ? "Recording... Click to stop" : "Click to start recording"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Speak clearly for 10-30 seconds for best results
                  </p>
                </div>
              </div>
            </div>

            {/* Recorded Blob Preview */}
            {recordedBlob && (
              <div className="mt-4">
                <p className="text-sm text-gray-400 mb-2">Your Recording:</p>
                <audio controls src={URL.createObjectURL(recordedBlob)} className="w-full" />
              </div>
            )}

            {/* Processing UI */}
            {isProcessing && (
              <div className="mt-6 p-4 bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-spotify-green"></div>
                  <span className="text-gray-300">Processing Voice Clone...</span>
                </div>
                
                <Progress value={(processingStep / processingSteps.length) * 100} className="mb-2" />
                
                <p className="text-sm text-gray-400">
                  {processingSteps[processingStep] || "Finalizing..."}
                </p>
              </div>
            )}

            {/* Clone Button */}
            <Button
              onClick={processVoiceClone}
              disabled={isProcessing || (!selectedVoiceSample && !recordedBlob)}
              className="w-full bg-spotify-green hover:bg-green-600 text-black font-semibold"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              {isProcessing ? "Processing..." : "Clone Voice"}
            </Button>
          </TabsContent>

          <TabsContent value="result" className="mt-4">
            {clonedVoice ? (
              <div className="space-y-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Music className="w-5 h-5 text-spotify-green" />
                      {clonedVoice.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Original Voice Sample:</p>
                      <audio controls src={clonedVoice.audioUrl} className="w-full" />
                    </div>
                    
                    {clonedVoice.sampleUrl && (
                      <div>
                        <p className="text-sm text-gray-400 mb-2">Demo Sample:</p>
                        <audio controls src={clonedVoice.sampleUrl} className="w-full" />
                      </div>
                    )}
                    
                    {clonedVoice.anthemUrl && (
                      <div>
                        <p className="text-sm text-gray-400 mb-2">National Anthem Demo (10-15s):</p>
                        <audio controls src={clonedVoice.anthemUrl} className="w-full" />
                      </div>
                    )}

                    {clonedVoice.characteristics && (
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="space-y-1">
                          <span className="text-gray-400">Voice Quality:</span>
                          <p className="text-white font-medium">
                            {Math.round(clonedVoice.characteristics.clarity * 100)}%
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-gray-400">Naturalness:</span>
                          <p className="text-white font-medium">
                            {Math.round(clonedVoice.characteristics.naturalness * 100)}%
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12">
                <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No voice clone generated yet</p>
                <p className="text-gray-500 text-sm">Complete the cloning process first</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="library" className="mt-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Your Voice Collection</h3>
                <Button onClick={() => refetchVoices()} variant="outline" size="sm">
                  Refresh
                </Button>
              </div>
              
              <div className="grid gap-4">
                {availableVoices?.filter(voice => voice.userId === userId.toString()).map((voice) => (
                  <Card key={voice.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{voice.name}</h4>
                          <p className="text-sm text-gray-400">
                            Created: {new Date(voice.createdAt).toLocaleDateString()}
                          </p>
                          {voice.isPublic && (
                            <span className="inline-block px-2 py-1 bg-green-600 text-white text-xs rounded mt-1">
                              Public
                            </span>
                          )}
                        </div>
                        <Button
                          onClick={() => deleteVoiceMutation.mutate(voice.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="mt-3 space-y-2">
                        <audio controls src={voice.audioUrl} className="w-full" />
                        {voice.anthemUrl && (
                          <audio controls src={voice.anthemUrl} className="w-full" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {availableVoices?.filter(voice => voice.userId === userId.toString()).length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No voices in your collection yet</p>
                    <p className="text-gray-500 text-sm">Create your first voice clone to get started</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
