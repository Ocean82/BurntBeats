
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Brain, Zap, Music, Settings, Info } from 'lucide-react';

interface AICapabilities {
  available: boolean;
  modelTrained: boolean;
  features: {
    lstm_generation: boolean;
    pattern_learning: boolean;
    style_transfer: boolean;
    harmony_enhancement: boolean;
    rhythm_variation: boolean;
  };
}

interface AIGenerationOptions {
  title: string;
  lyrics: string;
  genre: string;
  tempo: number;
  key: string;
  duration: number;
  useAI: boolean;
  temperature: number;
}

export function AIMusicGenerator() {
  const [formData, setFormData] = useState<AIGenerationOptions>({
    title: '',
    lyrics: '',
    genre: 'pop',
    tempo: 120,
    key: 'C',
    duration: 30,
    useAI: true,
    temperature: 0.8
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [capabilities, setCapabilities] = useState<AICapabilities | null>(null);
  const [isTraining, setIsTraining] = useState(false);

  useEffect(() => {
    fetchAICapabilities();
  }, []);

  const fetchAICapabilities = async () => {
    try {
      const response = await fetch('/api/ai-capabilities');
      const data = await response.json();
      setCapabilities(data);
    } catch (error) {
      console.error('Failed to fetch AI capabilities:', error);
    }
  };

  const handleInputChange = (field: keyof AIGenerationOptions, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateAIMusic = async () => {
    if (!formData.title || !formData.lyrics) {
      alert('Please fill in title and lyrics');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setResult(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    try {
      const response = await fetch('/api/generate-ai-song', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        setGenerationProgress(100);
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (error) {
      console.error('AI generation failed:', error);
      alert(`Generation failed: ${error.message}`);
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
      setTimeout(() => setGenerationProgress(0), 2000);
    }
  };

  const trainAIModel = async () => {
    setIsTraining(true);
    try {
      const response = await fetch('/api/train-ai-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trainingDataPath: 'training_data',
          epochs: 20
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('AI model training completed successfully!');
        fetchAICapabilities(); // Refresh capabilities
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Training failed:', error);
      alert(`Training failed: ${error.message}`);
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Music Generation
          </CardTitle>
          <CardDescription>
            Generate music using advanced AI and machine learning techniques
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {capabilities?.available ? '✓' : '✗'}
              </div>
              <div className="text-sm text-gray-600">AI Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {capabilities?.modelTrained ? '✓' : '✗'}
              </div>
              <div className="text-sm text-gray-600">Model Trained</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {capabilities ? Object.values(capabilities.features).filter(Boolean).length : 0}
              </div>
              <div className="text-sm text-gray-600">AI Features</div>
            </div>
            <div className="text-center">
              <Button
                onClick={trainAIModel}
                disabled={isTraining || !capabilities?.available}
                size="sm"
                variant="outline"
              >
                {isTraining ? 'Training...' : 'Train Model'}
              </Button>
            </div>
          </div>

          {capabilities && (
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(capabilities.features).map(([feature, enabled]) => (
                <Badge key={feature} variant={enabled ? "default" : "secondary"}>
                  {feature.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Song Generation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Song Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter song title..."
              />
            </div>
            <div>
              <Label htmlFor="genre">Genre</Label>
              <Select
                value={formData.genre}
                onValueChange={(value) => handleInputChange('genre', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pop">Pop</SelectItem>
                  <SelectItem value="rock">Rock</SelectItem>
                  <SelectItem value="jazz">Jazz</SelectItem>
                  <SelectItem value="electronic">Electronic</SelectItem>
                  <SelectItem value="classical">Classical</SelectItem>
                  <SelectItem value="hip-hop">Hip-Hop</SelectItem>
                  <SelectItem value="country">Country</SelectItem>
                  <SelectItem value="r&b">R&B</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="lyrics">Lyrics</Label>
            <Textarea
              id="lyrics"
              value={formData.lyrics}
              onChange={(e) => handleInputChange('lyrics', e.target.value)}
              placeholder="Enter your lyrics here..."
              rows={6}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Tempo: {formData.tempo} BPM</Label>
              <Slider
                value={[formData.tempo]}
                onValueChange={(value) => handleInputChange('tempo', value[0])}
                min={60}
                max={200}
                step={5}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Duration: {formData.duration}s</Label>
              <Slider
                value={[formData.duration]}
                onValueChange={(value) => handleInputChange('duration', value[0])}
                min={15}
                max={180}
                step={15}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="key">Key</Label>
              <Select
                value={formData.key}
                onValueChange={(value) => handleInputChange('key', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="C">C Major</SelectItem>
                  <SelectItem value="G">G Major</SelectItem>
                  <SelectItem value="D">D Major</SelectItem>
                  <SelectItem value="A">A Major</SelectItem>
                  <SelectItem value="E">E Major</SelectItem>
                  <SelectItem value="F">F Major</SelectItem>
                  <SelectItem value="Am">A Minor</SelectItem>
                  <SelectItem value="Em">E Minor</SelectItem>
                  <SelectItem value="Cm">C Minor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* AI-Specific Controls */}
          <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings className="h-4 w-4" />
                AI Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="useAI">Enable AI Enhancement</Label>
                  <p className="text-sm text-gray-600">Use machine learning for generation</p>
                </div>
                <Switch
                  id="useAI"
                  checked={formData.useAI}
                  onCheckedChange={(checked) => handleInputChange('useAI', checked)}
                />
              </div>

              {formData.useAI && (
                <div>
                  <Label>Creativity: {formData.temperature.toFixed(1)}</Label>
                  <p className="text-sm text-gray-600 mb-2">
                    Lower = more predictable, Higher = more creative
                  </p>
                  <Slider
                    value={[formData.temperature]}
                    onValueChange={(value) => handleInputChange('temperature', value[0])}
                    min={0.1}
                    max={2.0}
                    step={0.1}
                    className="mt-2"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Generation Progress */}
      {isGenerating && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Generating AI Music...</span>
                <span className="text-sm text-gray-600">{generationProgress}%</span>
              </div>
              <Progress value={generationProgress} />
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Zap className="h-4 w-4 animate-pulse" />
                AI is analyzing patterns and generating your song...
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Button */}
      <Button
        onClick={generateAIMusic}
        disabled={isGenerating || !capabilities?.available}
        className="w-full"
        size="lg"
      >
        {isGenerating ? (
          <>
            <Zap className="mr-2 h-4 w-4 animate-pulse" />
            Generating AI Music...
          </>
        ) : (
          <>
            <Brain className="mr-2 h-4 w-4" />
            Generate AI Music
          </>
        )}
      </Button>

      {/* Results */}
      {result && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="text-green-800">AI Generation Complete!</CardTitle>
            <CardDescription>
              Your AI-enhanced song has been generated successfully
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => window.open(result.audioPath, '_blank')}
                  variant="outline"
                >
                  Download Song
                </Button>
                <div className="flex gap-2">
                  {result.metadata.aiEnhanced && (
                    <Badge variant="default" className="bg-purple-100 text-purple-800">
                      AI Enhanced
                    </Badge>
                  )}
                  {result.metadata.modelUsed && (
                    <Badge variant="default" className="bg-blue-100 text-blue-800">
                      LSTM Generated
                    </Badge>
                  )}
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Processing time: {(result.metadata.processingTime / 1000).toFixed(1)}s
                  {result.metadata.features.lstmGenerated && " • Used neural network"}
                  {result.metadata.features.enhancedHarmony && " • Enhanced harmony"}
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
