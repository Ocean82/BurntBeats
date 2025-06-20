import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mic, Upload, Wand2, Music, Layers, Play, Pause, Download, Save } from "lucide-react";
import { useVoiceCloning } from "@/hooks/use-voice-cloning";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AdvancedVoiceCloningProps {
  userId: number;
  onVoiceCloned?: (voiceData: any) => void;
}

const genreOptions = [
  { value: "pop", label: "Pop" },
  { value: "rock", label: "Rock" },
  { value: "hiphop", label: "Hip Hop" },
  { value: "electronic", label: "Electronic" },
  { value: "jazz", label: "Jazz" },
  { value: "classical", label: "Classical" },
  { value: "country", label: "Country" },
  { value: "r&b", label: "R&B" }
];

const styleOptions = [
  { value: "smooth", label: "Smooth" },
  { value: "raw", label: "Raw" },
  { value: "energetic", label: "Energetic" },
  { value: "mellow", label: "Mellow" },
  { value: "powerful", label: "Powerful" },
  { value: "emotional", label: "Emotional" }
];

export default function AdvancedVoiceCloning({ userId, onVoiceCloned }: AdvancedVoiceCloningProps) {
  const [selectedVoiceSample, setSelectedVoiceSample] = useState<number | null>(null);
  const [genre, setGenre] = useState<string>("pop");
  const [style, setStyle] = useState<string>("smooth");
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [isPlayingCloned, setIsPlayingCloned] = useState(false);

  const {
    isRecording,
    recordedBlob,
    clonedVoice,
    processingStage,
    isCloning,
    startRecording,
    stopRecording,
    cloneVoice,
    clearRecording,
    clearClonedVoice,
    cloningError
  } = useVoiceCloning({ userId, onVoiceCloned });

  // Fetch existing voice samples
  const { data: voiceSamples = [] } = useQuery({
    queryKey: ['/api/voice-samples', userId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/voice-samples/${userId}`);
      return await response.json();
    }
  });

  const handleCloneVoice = () => {
    cloneVoice({
      genre,
      style,
      voiceSampleId: selectedVoiceSample || undefined,
      audioBlob: recordedBlob || undefined
    });
  };

  const toggleRecordingPlayback = () => {
    setIsPlayingRecording(!isPlayingRecording);
  };

  const toggleClonedPlayback = () => {
    setIsPlayingCloned(!isPlayingCloned);
  };

  const getProcessingProgress = () => {
    const stages = [
      'Extracting voice characteristics...',
      'Analyzing voice similarity...',
      'Applying spectral transfer...',
      'Preserving voice timbre...',
      'Adapting voice for genre and style...',
      'Generating final cloned voice...'
    ];
    
    const currentStageIndex = stages.findIndex(stage => stage === processingStage);
    return currentStageIndex >= 0 ? ((currentStageIndex + 1) / stages.length) * 100 : 0;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg font-poppins font-semibold text-white flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-spotify-green" />
            Advanced Voice Cloning
          </CardTitle>
          <p className="text-sm text-gray-400">
            Create custom singing voices with genre-specific adaptations
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Voice Source Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Existing Voice Samples */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Use Existing Voice Sample
                </label>
                <Select 
                  value={selectedVoiceSample?.toString() || ""} 
                  onValueChange={(value) => setSelectedVoiceSample(Number(value))}
                  disabled={isCloning}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600">
                    <SelectValue placeholder="Select a voice sample" />
                  </SelectTrigger>
                  <SelectContent>
                    {voiceSamples.map((sample: any) => (
                      <SelectItem key={sample.id} value={sample.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Music className="w-4 h-4" />
                          {sample.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Record New Sample */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Record New Voice Sample
                </label>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isCloning}
                    className={`w-16 h-16 rounded-full ${
                      isRecording 
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                        : 'bg-vibrant-orange hover:bg-orange-600'
                    }`}
                  >
                    {isRecording ? (
                      <Layers className="w-6 h-6" />
                    ) : (
                      <Mic className="w-6 h-6" />
                    )}
                  </Button>
                  
                  {recordedBlob && (
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={toggleRecordingPlayback}
                        variant="outline"
                        size="sm"
                        className="border-gray-600"
                      >
                        {isPlayingRecording ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <Button
                        onClick={clearRecording}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                </div>
                
                {isRecording && (
                  <p className="text-xs text-red-400 mt-2 animate-pulse">
                    Recording... Speak clearly for 10-30 seconds
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Genre and Style Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Target Genre
              </label>
              <Select value={genre} onValueChange={setGenre} disabled={isCloning}>
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
              <p className="text-xs text-gray-500 mt-1">
                Voice will be optimized for this genre
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Vocal Style
              </label>
              <Select value={style} onValueChange={setStyle} disabled={isCloning}>
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
              <p className="text-xs text-gray-500 mt-1">
                Defines the emotional character
              </p>
            </div>
          </div>

          {/* Processing Status */}
          {isCloning && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Processing Voice</span>
                <Badge variant="secondary" className="bg-spotify-green/20 text-spotify-green">
                  {Math.round(getProcessingProgress())}%
                </Badge>
              </div>
              <Progress value={getProcessingProgress()} className="h-2" />
              {processingStage && (
                <p className="text-xs text-gray-400">{processingStage}</p>
              )}
            </div>
          )}

          {/* Clone Button */}
          <Button
            onClick={handleCloneVoice}
            disabled={isCloning || (!selectedVoiceSample && !recordedBlob)}
            className="w-full bg-spotify-green hover:bg-green-600 text-white font-medium py-3"
          >
            <Wand2 className="w-5 h-5 mr-2" />
            {isCloning ? "Cloning Voice..." : "Clone Voice"}
          </Button>

          {/* Error Display */}
          {cloningError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{(cloningError as Error).message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cloned Voice Result */}
      {clonedVoice && (
        <Card className="bg-dark-card border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg font-poppins font-semibold text-white flex items-center gap-2">
              <Music className="w-5 h-5 text-spotify-green" />
              Cloned Voice Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-spotify-green/20 rounded-full flex items-center justify-center">
                  <Wand2 className="w-6 h-6 text-spotify-green" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Custom Voice - {genre} {style}</p>
                  <p className="text-xs text-gray-400">Ready for song generation</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={toggleClonedPlayback}
                  variant="outline"
                  size="sm"
                  className="border-gray-600"
                >
                  {isPlayingCloned ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-600"
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-600"
                >
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Hidden audio elements for playback */}
            <audio
              src={clonedVoice}
              onEnded={() => setIsPlayingCloned(false)}
              style={{ display: 'none' }}
              ref={(audio) => {
                if (audio) {
                  if (isPlayingCloned) {
                    audio.play();
                  } else {
                    audio.pause();
                  }
                }
              }}
            />

            <div className="text-center">
              <Button
                onClick={clearClonedVoice}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                Create Another Clone
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden audio element for recorded sample playback */}
      {recordedBlob && (
        <audio
          src={URL.createObjectURL(recordedBlob)}
          onEnded={() => setIsPlayingRecording(false)}
          style={{ display: 'none' }}
          ref={(audio) => {
            if (audio) {
              if (isPlayingRecording) {
                audio.play();
              } else {
                audio.pause();
              }
            }
          }}
        />
      )}
    </div>
  );
}