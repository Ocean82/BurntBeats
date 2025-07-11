
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Play, Download, Mic, Music } from 'lucide-react';

interface RVCVoiceConverterProps {
  onConversionComplete?: (audioUrl: string) => void;
}

export default function RVCVoiceConverter({ onConversionComplete }: RVCVoiceConverterProps) {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [midiFile, setMidiFile] = useState<File | null>(null);
  const [lyrics, setLyrics] = useState('');
  const [modelPath, setModelPath] = useState('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [conversionOptions, setConversionOptions] = useState({
    pitchShift: 0,
    indexRate: 0.75,
    filterRadius: 3,
    rmsThreshold: 0.25,
    protectVoiceless: 0.33,
    method: 'rmvpe'
  });
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ audioUrl: string; downloadUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'audio' | 'midi'>('audio');

  const audioRef = useRef<HTMLInputElement>(null);
  const midiRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    loadAvailableModels();
  }, []);

  const loadAvailableModels = async () => {
    try {
      const response = await fetch('/api/rvc/models');
      const data = await response.json();
      setAvailableModels(data.models || []);
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setError(null);
    }
  };

  const handleMidiUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setMidiFile(file);
      setError(null);
    }
  };

  const handleConvert = async () => {
    if (!modelPath) {
      setError('Please select a voice model');
      return;
    }

    if (mode === 'audio' && !audioFile) {
      setError('Please upload an audio file');
      return;
    }

    if (mode === 'midi' && (!midiFile || !lyrics)) {
      setError('Please upload a MIDI file and provide lyrics');
      return;
    }

    setIsConverting(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      
      if (mode === 'audio') {
        formData.append('audio', audioFile!);
      } else {
        formData.append('midi', midiFile!);
        formData.append('lyrics', lyrics);
      }

      formData.append('modelPath', modelPath);
      formData.append('pitchShift', conversionOptions.pitchShift.toString());
      formData.append('indexRate', conversionOptions.indexRate.toString());
      formData.append('filterRadius', conversionOptions.filterRadius.toString());
      formData.append('rmsThreshold', conversionOptions.rmsThreshold.toString());
      formData.append('protectVoiceless', conversionOptions.protectVoiceless.toString());
      formData.append('method', conversionOptions.method);

      const endpoint = mode === 'audio' ? '/api/rvc/convert' : '/api/rvc/midi-to-vocal';
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error(`Conversion failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setResult({
          audioUrl: data.downloadUrl,
          downloadUrl: data.downloadUrl
        });
        
        if (onConversionComplete) {
          onConversionComplete(data.downloadUrl);
        }
      } else {
        throw new Error(data.error || 'Conversion failed');
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Conversion failed');
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (result?.downloadUrl) {
      window.open(result.downloadUrl, '_blank');
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="w-5 h-5" />
          RVC Voice Converter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mode Selection */}
        <div className="space-y-2">
          <Label>Conversion Mode</Label>
          <Select value={mode} onValueChange={(value: 'audio' | 'midi') => setMode(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="audio">Audio to Voice</SelectItem>
              <SelectItem value="midi">MIDI to Vocal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* File Upload */}
        <div className="space-y-4">
          {mode === 'audio' ? (
            <div className="space-y-2">
              <Label>Audio File</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  ref={audioRef}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => audioRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {audioFile ? audioFile.name : 'Upload Audio'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>MIDI File</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".mid,.midi"
                    onChange={handleMidiUpload}
                    ref={midiRef}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => midiRef.current?.click()}
                    className="flex items-center gap-2"
                  >
                    <Music className="w-4 h-4" />
                    {midiFile ? midiFile.name : 'Upload MIDI'}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Lyrics</Label>
                <Textarea
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  placeholder="Enter lyrics for the song..."
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <Label>Voice Model</Label>
          <Select value={modelPath} onValueChange={setModelPath}>
            <SelectTrigger>
              <SelectValue placeholder="Select a voice model" />
            </SelectTrigger>
            <SelectContent>
              {availableModels.map((model) => (
                <SelectItem key={model} value={model}>
                  {model.split('/').pop()?.replace('.pth', '')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Conversion Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Pitch Shift: {conversionOptions.pitchShift}</Label>
            <Slider
              value={[conversionOptions.pitchShift]}
              onValueChange={(value) => setConversionOptions(prev => ({ ...prev, pitchShift: value[0] }))}
              min={-12}
              max={12}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label>Index Rate: {conversionOptions.indexRate}</Label>
            <Slider
              value={[conversionOptions.indexRate]}
              onValueChange={(value) => setConversionOptions(prev => ({ ...prev, indexRate: value[0] }))}
              min={0}
              max={1}
              step={0.05}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label>Filter Radius: {conversionOptions.filterRadius}</Label>
            <Slider
              value={[conversionOptions.filterRadius]}
              onValueChange={(value) => setConversionOptions(prev => ({ ...prev, filterRadius: value[0] }))}
              min={0}
              max={7}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label>F0 Method</Label>
            <Select
              value={conversionOptions.method}
              onValueChange={(value) => setConversionOptions(prev => ({ ...prev, method: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rmvpe">RMVPE (Recommended)</SelectItem>
                <SelectItem value="harvest">Harvest</SelectItem>
                <SelectItem value="pm">PM</SelectItem>
                <SelectItem value="crepe">Crepe</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Convert Button */}
        <Button 
          onClick={handleConvert} 
          disabled={isConverting || !modelPath || (mode === 'audio' && !audioFile) || (mode === 'midi' && (!midiFile || !lyrics))}
          className="w-full"
        >
          {isConverting ? 'Converting...' : 'Convert Voice'}
        </Button>

        {/* Progress */}
        {isConverting && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-gray-600 text-center">
              Converting voice... {progress}%
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Voice conversion completed successfully!
              </AlertDescription>
            </Alert>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleDownload}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Result
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
