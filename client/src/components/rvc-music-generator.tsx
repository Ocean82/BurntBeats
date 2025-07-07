
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Upload, Download, Music, Mic } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RVCMusicGeneratorProps {
  onGenerate?: (result: any) => void;
}

export function RVCMusicGenerator({ onGenerate }: RVCMusicGeneratorProps) {
  const [formData, setFormData] = useState({
    title: '',
    lyrics: '',
    genre: 'pop',
    tempo: 120,
    key: 'C',
    duration: 30,
    pitchShift: 0,
    indexRate: 0.75
  });
  
  const [voiceModel, setVoiceModel] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [mode, setMode] = useState<'complete' | 'instrumental' | 'convert'>('complete');
  
  const { toast } = useToast();

  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleVoiceModelUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.pth')) {
        setVoiceModel(file);
        toast({
          title: "Voice model uploaded",
          description: `Selected: ${file.name}`,
        });
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a .pth voice model file",
          variant: "destructive",
        });
      }
    }
  }, [toast]);

  const generateTrack = useCallback(async () => {
    if (!formData.title || !formData.lyrics) {
      toast({
        title: "Missing information",
        description: "Please provide both title and lyrics",
        variant: "destructive",
      });
      return;
    }

    if (mode === 'complete' && !voiceModel) {
      toast({
        title: "Voice model required",
        description: "Please upload a voice model (.pth file)",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    try {
      const formDataToSend = new FormData();
      
      // Add form data
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value.toString());
      });

      // Add voice model if available
      if (voiceModel) {
        formDataToSend.append('voice_model', voiceModel);
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 1000);

      const endpoint = mode === 'complete' 
        ? '/api/rvc-music/generate-track'
        : '/api/rvc-music/generate-instrumental';

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formDataToSend,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const data = await response.json();
      setResult(data);
      
      if (onGenerate) {
        onGenerate(data);
      }

      toast({
        title: "Generation successful!",
        description: `Your ${mode === 'complete' ? 'complete track' : 'instrumental'} has been generated.`,
      });

    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation failed",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [formData, voiceModel, mode, onGenerate, toast]);

  const downloadResult = useCallback(() => {
    if (result?.downloadUrl) {
      const link = document.createElement('a');
      link.href = result.downloadUrl;
      link.download = `${formData.title}_${mode}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [result, formData.title, mode]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            RVC Music Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode Selection */}
          <div className="space-y-2">
            <Label>Generation Mode</Label>
            <Select value={mode} onValueChange={(value: any) => setMode(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="complete">Complete Track (Instrumental + Vocals)</SelectItem>
                <SelectItem value="instrumental">Instrumental Only</SelectItem>
                <SelectItem value="convert">Convert Existing Audio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter song title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="genre">Genre</Label>
              <Select value={formData.genre} onValueChange={(value) => handleInputChange('genre', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pop">Pop</SelectItem>
                  <SelectItem value="rock">Rock</SelectItem>
                  <SelectItem value="jazz">Jazz</SelectItem>
                  <SelectItem value="classical">Classical</SelectItem>
                  <SelectItem value="electronic">Electronic</SelectItem>
                  <SelectItem value="hip-hop">Hip-Hop</SelectItem>
                  <SelectItem value="country">Country</SelectItem>
                  <SelectItem value="r&b">R&B</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Music Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tempo">Tempo (BPM)</Label>
              <Input
                id="tempo"
                type="number"
                value={formData.tempo}
                onChange={(e) => handleInputChange('tempo', parseInt(e.target.value))}
                min="60"
                max="200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="key">Key</Label>
              <Select value={formData.key} onValueChange={(value) => handleInputChange('key', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select key" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="C">C Major</SelectItem>
                  <SelectItem value="G">G Major</SelectItem>
                  <SelectItem value="D">D Major</SelectItem>
                  <SelectItem value="A">A Major</SelectItem>
                  <SelectItem value="E">E Major</SelectItem>
                  <SelectItem value="F">F Major</SelectItem>
                  <SelectItem value="Bb">Bb Major</SelectItem>
                  <SelectItem value="Eb">Eb Major</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                min="15"
                max="300"
              />
            </div>
          </div>

          {/* Lyrics */}
          {mode !== 'instrumental' && (
            <div className="space-y-2">
              <Label htmlFor="lyrics">Lyrics</Label>
              <Textarea
                id="lyrics"
                value={formData.lyrics}
                onChange={(e) => handleInputChange('lyrics', e.target.value)}
                placeholder="Enter song lyrics..."
                rows={4}
              />
            </div>
          )}

          {/* Voice Model Upload */}
          {mode === 'complete' && (
            <div className="space-y-2">
              <Label htmlFor="voice-model">Voice Model (.pth)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  id="voice-model"
                  type="file"
                  accept=".pth"
                  onChange={handleVoiceModelUpload}
                  className="hidden"
                />
                <label
                  htmlFor="voice-model"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {voiceModel ? voiceModel.name : 'Click to upload voice model'}
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Advanced Settings */}
          {mode === 'complete' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Advanced Settings</h3>
              
              <div className="space-y-2">
                <Label>Pitch Shift: {formData.pitchShift}</Label>
                <Slider
                  value={[formData.pitchShift]}
                  onValueChange={(value) => handleInputChange('pitchShift', value[0])}
                  min={-12}
                  max={12}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Index Rate: {formData.indexRate}</Label>
                <Slider
                  value={[formData.indexRate]}
                  onValueChange={(value) => handleInputChange('indexRate', value[0])}
                  min={0}
                  max={1}
                  step={0.1}
                />
              </div>
            </div>
          )}

          {/* Progress */}
          {isGenerating && (
            <div className="space-y-2">
              <Label>Generation Progress</Label>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-gray-600">
                {progress < 30 ? 'Generating instrumental...' :
                 progress < 70 ? 'Processing vocals...' :
                 progress < 90 ? 'Mixing tracks...' : 'Finalizing...'}
              </p>
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={generateTrack}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Mic className="w-4 h-4 mr-2 animate-pulse" />
                Generating...
              </>
            ) : (
              <>
                <Music className="w-4 h-4 mr-2" />
                Generate {mode === 'complete' ? 'Complete Track' : 'Instrumental'}
              </>
            )}
          </Button>

          {/* Result */}
          {result && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                Generation Complete!
              </h3>
              <p className="text-green-700 mb-4">
                Your {mode === 'complete' ? 'complete track' : 'instrumental'} has been generated successfully.
              </p>
              <Button onClick={downloadResult} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download Audio
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default RVCMusicGenerator;
