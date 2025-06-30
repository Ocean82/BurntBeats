import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, Upload, Settings, Play, Loader2 } from 'lucide-react';
import { useVoicePipeline } from '@/hooks/use-voice-pipeline';
import { Progress } from '@/components/ui/progress';

interface VoicePipelineIntegrationProps {
  onVoiceGenerated?: (audioUrl: string, voiceId?: string) => void;
  text?: string;
  backendUrl: string;
}

export default function VoicePipelineIntegration({ 
  onVoiceGenerated, 
  text = '',
  backendUrl 
}: VoicePipelineIntegrationProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<'rvc' | 'bark'>('bark');
  const [currentRegisteredVoice, setCurrentRegisteredVoice] = useState<string>('');

  const voicePipeline = useVoicePipeline({
    backendUrl,
    model: selectedModel,
    quality: 'high'
  });

  // Handle voice registration
  const handleVoiceUpload = async () => {
    if (!selectedFile) return;
    
    voicePipeline.registerVoice(selectedFile, {
      onSuccess: (data) => {
        setCurrentRegisteredVoice(data.voice_id);
        setSelectedVoiceId(data.voice_id);
        setSelectedFile(null);
      }
    });
  };

  // Handle voice synthesis
  const handleVoiceSynthesis = async () => {
    if (!text.trim()) return;
    
    voicePipeline.synthesizeVoice({
      text,
      voiceId: selectedModel === 'rvc' ? selectedVoiceId : undefined,
      style: 'natural',
      emotion: 'neutral'
    }, {
      onSuccess: (data) => {
        onVoiceGenerated?.(data.audio_url, selectedVoiceId);
      }
    });
  };

  const canUseRVC = selectedModel === 'rvc' && selectedVoiceId;
  const canSynthesize = text.trim() && (selectedModel === 'bark' || canUseRVC);

  return (
    <div className="space-y-6">
      {/* Backend Status */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <span>Voice Engine Status</span>
            <Badge 
              variant={voicePipeline.isBackendHealthy ? "default" : "destructive"}
              className="ml-2"
            >
              {voicePipeline.isBackendHealthy ? "Connected" : "Offline"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {voicePipeline.backendHealth && (
            <div className="text-xs text-gray-400">
              {voicePipeline.backendHealth.service} v{voicePipeline.backendHealth.version}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Model Selection */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Voice Model Selection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={selectedModel === 'bark' ? "default" : "outline"}
              onClick={() => setSelectedModel('bark')}
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <div className="font-medium">Bark AI</div>
              <div className="text-xs text-gray-400 text-center">
                Text-to-speech with natural voices
              </div>
            </Button>
            <Button
              variant={selectedModel === 'rvc' ? "default" : "outline"}
              onClick={() => setSelectedModel('rvc')}
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <div className="font-medium">RVC Clone</div>
              <div className="text-xs text-gray-400 text-center">
                High-quality voice cloning
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Voice Upload (for RVC) */}
      {selectedModel === 'rvc' && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Voice Sample Upload
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
              
              {selectedFile && (
                <div className="text-sm text-gray-400">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}

              <Button 
                onClick={handleVoiceUpload}
                disabled={!selectedFile || voicePipeline.isRegisteringVoice}
                className="w-full"
              >
                {voicePipeline.isRegisteringVoice ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Registering Voice...
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Register Voice Sample
                  </>
                )}
              </Button>

              {currentRegisteredVoice && (
                <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-3">
                  <div className="text-green-400 text-sm font-medium">
                    ✓ Voice Registered Successfully
                  </div>
                  <div className="text-green-300/70 text-xs mt-1">
                    Voice ID: {currentRegisteredVoice.substring(0, 8)}...
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Voices */}
      {voicePipeline.voiceCount > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Available Voices ({voicePipeline.voiceCount})</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => voicePipeline.refreshVoices()}
              >
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {voicePipeline.voices.map((voice) => (
                <div
                  key={voice.voice_id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedVoiceId === voice.voice_id
                      ? 'bg-purple-900/30 border-purple-500'
                      : 'bg-gray-700/30 border-gray-600 hover:bg-gray-600/30'
                  }`}
                  onClick={() => setSelectedVoiceId(voice.voice_id)}
                >
                  <div className="text-sm font-medium">
                    Voice {voice.voice_id.substring(0, 8)}...
                  </div>
                  <div className="text-xs text-gray-400">
                    {(voice.file_size / 1024 / 1024).toFixed(2)} MB
                    {voice.has_embedding && " • Processed"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generation Controls */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle>Generate Voice</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {voicePipeline.isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{voicePipeline.processingStage}</span>
                <span className="text-gray-400">{voicePipeline.processingProgress}%</span>
              </div>
              <Progress value={voicePipeline.processingProgress} />
            </div>
          )}

          <Button 
            onClick={handleVoiceSynthesis}
            disabled={!canSynthesize || voicePipeline.isProcessing}
            className="w-full"
            size="lg"
          >
            {voicePipeline.isSynthesizing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Voice...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Generate with {selectedModel.toUpperCase()}
              </>
            )}
          </Button>

          {selectedModel === 'rvc' && !selectedVoiceId && (
            <p className="text-sm text-yellow-400">
              Upload and register a voice sample to use RVC cloning
            </p>
          )}

          {!text.trim() && (
            <p className="text-sm text-gray-400">
              Enter lyrics or text to generate voice
            </p>
          )}
        </CardContent>
      </Card>

      {/* Last Generated Audio */}
      {voicePipeline.lastSynthesisResult && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>Generated Audio</CardTitle>
          </CardHeader>
          <CardContent>
            <audio 
              controls 
              className="w-full"
              src={voicePipeline.lastSynthesisResult.audio_url}
            >
              Your browser does not support the audio element.
            </audio>
            <div className="text-xs text-gray-400 mt-2">
              Model: {voicePipeline.lastSynthesisResult.model.toUpperCase()}
              {voicePipeline.lastSynthesisResult.voice_id && 
                ` • Voice: ${voicePipeline.lastSynthesisResult.voice_id.substring(0, 8)}...`
              }
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}