import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Play, Download, Volume2, Music, AlertCircle, Save, RotateCcw, Pause } from "lucide-react";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";

interface EnhancedTextToSpeechProps {
  userId: number;
}

export default function EnhancedTextToSpeech({ userId }: EnhancedTextToSpeechProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [sampleName, setSampleName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const {
    text,
    voiceType,
    pitch,
    speed,
    tone,
    generatedAudio,
    processingStage,
    isGenerating,
    isSaving,
    isValidText,
    setText,
    setVoiceType,
    setPitch,
    setSpeed,
    setTone,
    generateVoice,
    saveAsVoiceSample,
    clearGeneratedAudio,
    resetSettings,
    voiceSettings,
    sampleTexts,
    generationError,
    saveError
  } = useTextToSpeech({ userId });

  const getProcessingProgress = () => {
    const stages = [
      'Analyzing text structure...',
      'Extracting phonemes...',
      'Synthesizing voice...',
      'Enhancing audio quality...',
      'Generating final audio...'
    ];
    
    const currentStageIndex = stages.findIndex(stage => stage === processingStage);
    return currentStageIndex >= 0 ? ((currentStageIndex + 1) / stages.length) * 100 : 0;
  };

  const handleSaveVoice = () => {
    if (sampleName.trim()) {
      saveAsVoiceSample(sampleName.trim());
      setShowSaveDialog(false);
      setSampleName("");
    }
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg font-poppins font-semibold text-white flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-spotify-green" />
            Advanced Text-to-Speech
          </CardTitle>
          <p className="text-sm text-gray-400">
            Convert text to high-quality singing or reading voices with genre-specific adaptations
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Voice Type Selection */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Voice Type
            </label>
            <Select value={voiceType} onValueChange={setVoiceType} disabled={isGenerating}>
              <SelectTrigger className="bg-gray-800 border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="singing">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    Singing Voice
                  </div>
                </SelectItem>
                <SelectItem value="reading">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    Reading Voice
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Text Input */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Text Content
            </label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={sampleTexts[voiceType]}
              disabled={isGenerating}
              className="min-h-[120px] bg-gray-800 border-gray-600 resize-none"
            />
            <div className="flex justify-between items-center mt-2 text-xs">
              <span className={`${isValidText ? 'text-gray-400' : 'text-red-400'}`}>
                {text.length}/500 characters
              </span>
              {!isValidText && (
                <span className="text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Text must be 10-500 characters
                </span>
              )}
            </div>
          </div>

          {/* Voice Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Pitch
              </label>
              <Select value={pitch} onValueChange={(value) => setPitch(value as any)} disabled={isGenerating}>
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
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Speed
              </label>
              <Select value={speed} onValueChange={(value) => setSpeed(value as any)} disabled={isGenerating}>
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
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Tone
              </label>
              <Select value={tone} onValueChange={(value) => setTone(value as any)} disabled={isGenerating}>
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

          {/* Processing Status */}
          {isGenerating && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Generating Voice</span>
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

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              onClick={generateVoice}
              disabled={isGenerating || !isValidText}
              className="bg-spotify-green hover:bg-green-600 text-white font-medium"
            >
              <Volume2 className="w-4 h-4 mr-2" />
              {isGenerating ? "Generating..." : "Generate Voice"}
            </Button>

            <Button
              onClick={resetSettings}
              disabled={isGenerating}
              variant="outline"
              className="border-gray-600"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* Error Display */}
          {(generationError || saveError) && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">
                {(generationError || saveError)?.message || "An error occurred"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Voice Result */}
      {generatedAudio && (
        <Card className="bg-dark-card border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg font-poppins font-semibold text-white flex items-center gap-2">
              <Music className="w-5 h-5 text-spotify-green" />
              Generated Voice
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-spotify-green/20 rounded-full flex items-center justify-center">
                  {voiceType === 'singing' ? <Music className="w-6 h-6 text-spotify-green" /> : <Volume2 className="w-6 h-6 text-spotify-green" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {voiceType === 'singing' ? 'Singing' : 'Reading'} Voice - {pitch} pitch, {speed} speed
                  </p>
                  <p className="text-xs text-gray-400">{tone} tone • {text.length} characters</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={togglePlayback}
                  variant="outline"
                  size="sm"
                  className="border-gray-600"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-600"
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => setShowSaveDialog(true)}
                  variant="outline"
                  size="sm"
                  className="border-gray-600"
                  disabled={isSaving}
                >
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Save as Voice Sample Dialog */}
            {showSaveDialog && (
              <div className="p-4 bg-gray-800/50 rounded-lg space-y-3">
                <h4 className="text-sm font-medium text-white">Save as Voice Sample</h4>
                <div className="flex gap-2">
                  <Input
                    value={sampleName}
                    onChange={(e) => setSampleName(e.target.value)}
                    placeholder="Enter sample name..."
                    className="bg-gray-800 border-gray-600"
                    disabled={isSaving}
                  />
                  <Button
                    onClick={handleSaveVoice}
                    disabled={!sampleName.trim() || isSaving}
                    size="sm"
                    className="bg-spotify-green hover:bg-green-600"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowSaveDialog(false);
                      setSampleName("");
                    }}
                    variant="ghost"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="text-center">
              <Button
                onClick={clearGeneratedAudio}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                Generate Another Voice
              </Button>
            </div>

            {/* Hidden audio element for playback */}
            <audio
              src={generatedAudio}
              onEnded={() => setIsPlaying(false)}
              style={{ display: 'none' }}
              ref={(audio) => {
                if (audio) {
                  if (isPlaying) {
                    audio.play();
                  } else {
                    audio.pause();
                  }
                }
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}