
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
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Brain, Zap, Music, Settings, Info, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

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
  vocalStyle?: string;
  mood?: string;
}

interface GenerationResult {
  success: boolean;
  audioPath: string;
  metadata: {
    title: string;
    duration: number;
    aiEnhanced: boolean;
    modelUsed: boolean;
    processingTime: number;
    features: {
      lstmGenerated: boolean;
      enhancedHarmony: boolean;
      trainingDataUsed: boolean;
    };
  };
  error?: string;
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
    temperature: 0.8,
    vocalStyle: 'neutral',
    mood: 'happy'
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [capabilities, setCapabilities] = useState<AICapabilities | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch AI capabilities on component mount
  useEffect(() => {
    const fetchAICapabilities = async () => {
      try {
        const response = await fetch('/api/ai-capabilities');
        if (!response.ok) throw new Error('Failed to fetch capabilities');
        const data = await response.json();
        setCapabilities(data);
      } catch (err) {
        console.error('Failed to fetch AI capabilities:', err);
        toast.error('Failed to load AI capabilities');
      }
    };

    fetchAICapabilities();
  }, []);

  const handleInputChange = (field: keyof AIGenerationOptions, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear previous results/errors when form changes
    if (result) setResult(null);
    if (error) setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      toast.error('Please enter a song title');
      return false;
    }
    if (!formData.lyrics.trim()) {
      toast.error('Please enter lyrics');
      return false;
    }
    if (formData.duration < 10 || formData.duration > 300) {
      toast.error('Duration must be between 10 and 300 seconds');
      return false;
    }
    return true;
  };

  const generateAIMusic = async () => {
    if (!validateForm()) return;
    if (!capabilities?.available) {
      toast.error('AI service is currently unavailable');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setResult(null);
    setError(null);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        const increment = prev < 50 ? 10 : 5; // Faster progress at start
        return Math.min(prev + increment, 90);
      });
    }, 500);

    try {
      const response = await fetch('/api/generate-ai-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Generation failed');
      }

      const data: GenerationResult = await response.json();

      if (data.success) {
        setResult(data);
        setGenerationProgress(100);
        toast.success('AI music generated successfully!');
      } else {
        throw new Error(data.error || 'Unknown error during generation');
      }
    } catch (err) {
      console.error('AI generation failed:', err);
      setError(err instanceof Error ? err.message : 'Generation failed');
      toast.error('Failed to generate music');
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
    }
  };

  const trainAIModel = async () => {
    if (!capabilities?.available) {
      toast.error('AI service is currently unavailable');
      return;
    }

    setIsTraining(true);
    toast.info('Starting AI model training...');

    try {
      const response = await fetch('/api/train-ai-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainingDataPath: 'training_data',
          epochs: 20
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Training failed');
      }

      const data = await response.json();

      if (data.success) {
        toast.success('AI model trained successfully!');
        // Refresh capabilities
        const capabilitiesResponse = await fetch('/api/ai-capabilities');
        setCapabilities(await capabilitiesResponse.json());
      } else {
        throw new Error(data.error || 'Unknown error during training');
      }
    } catch (err) {
      console.error('Training failed:', err);
      toast.error('Failed to train AI model');
    } finally {
      setIsTraining(false);
    }
  };

  // Available options for dropdowns
  const genreOptions = [
    'pop', 'rock', 'jazz', 'electronic', 'classical', 
    'hip-hop', 'country', 'r&b', 'metal', 'folk'
  ];

  const keyOptions = [
    'C', 'G', 'D', 'A', 'E', 'F', 'B', 'Cm', 'Gm', 'Dm', 'Am', 'Em', 'Fm', 'Bm'
  ];

  const vocalStyleOptions = [
    'neutral', 'soft', 'powerful', 'breathy', 'raspy', 
    'smooth', 'gravelly', 'falsetto', 'vibrato'
  ];

  const moodOptions = [
    'happy', 'sad', 'angry', 'energetic', 'calm',
    'romantic', 'mysterious', 'dreamy', 'melancholic'
  ];

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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 rounded-lg bg-blue-50">
              <div className="text-2xl font-bold text-blue-600">
                {capabilities?.available ? '✓' : '✗'}
              </div>
              <div className="text-sm text-gray-600">AI Available</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-green-50">
              <div className="text-2xl font-bold text-green-600">
                {capabilities?.modelTrained ? '✓' : '✗'}
              </div>
              <div className="text-sm text-gray-600">Model Trained</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-purple-50">
              <div className="text-2xl font-bold text-purple-600">
                {capabilities ? Object.values(capabilities.features).filter(Boolean).length : 0}
              </div>
              <div className="text-sm text-gray-600">AI Features</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-orange-50">
              <Button
                onClick={trainAIModel}
                disabled={isTraining || !capabilities?.available}
                size="sm"
                variant="outline"
                className="w-full"
              >
                {isTraining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Training...
                  </>
                ) : (
                  'Train Model'
                )}
              </Button>
            </div>
          </div>

          {capabilities && (
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(capabilities.features).map(([feature, enabled]) => (
                <Badge 
                  key={feature} 
                  variant={enabled ? "default" : "secondary"}
                  className={enabled ? "bg-green-100 text-green-800" : ""}
                >
                  {feature.replace(/_/g, ' ')}
                  {enabled && <Sparkles className="ml-1 h-3 w-3" />}
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
              <Label htmlFor="title">Song Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter song title..."
              />
            </div>
            <div>
              <Label htmlFor="genre">Genre *</Label>
              <Select
                value={formData.genre}
                onValueChange={(value) => handleInputChange('genre', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {genreOptions.map(genre => (
                    <SelectItem key={genre} value={genre}>
                      {genre.charAt(0).toUpperCase() + genre.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="lyrics">Lyrics *</Label>
            <Textarea
              id="lyrics"
              value={formData.lyrics}
              onChange={(e) => handleInputChange('lyrics', e.target.value)}
              placeholder="Enter your lyrics here..."
              rows={6}
              className="min-h-[120px]"
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
                max={300}
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
                  {keyOptions.map(key => (
                    <SelectItem key={key} value={key}>
                      {key.includes('m') ? `${key.toUpperCase()} Minor` : `${key} Major`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Options */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Advanced Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vocalStyle">Vocal Style</Label>
                  <Select
                    value={formData.vocalStyle}
                    onValueChange={(value) => handleInputChange('vocalStyle', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {vocalStyleOptions.map(style => (
                        <SelectItem key={style} value={style}>
                          {style.charAt(0).toUpperCase() + style.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="mood">Mood</Label>
                  <Select
                    value={formData.mood}
                    onValueChange={(value) => handleInputChange('mood', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {moodOptions.map(mood => (
                        <SelectItem key={mood} value={mood}>
                          {mood.charAt(0).toUpperCase() + mood.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

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
                {generationProgress < 30 && "Initializing AI model..."}
                {generationProgress >= 30 && generationProgress < 70 && "Analyzing musical patterns..."}
                {generationProgress >= 70 && "Finalizing composition..."}
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
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating AI Music...
          </>
        ) : (
          <>
            <Brain className="mr-2 h-4 w-4" />
            Generate AI Music
          </>
        )}
      </Button>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Generation Error</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {result && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Generation Complete!
            </CardTitle>
            <CardDescription>
              Your AI-enhanced song has been generated successfully
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <Button
                  onClick={() =>window.open(result.audioPath, '_blank')}
                    variant="outline"
                    >
                    Download Song
                    </Button>
                    <Button
                    onClick={() => navigator.clipboard.writeText(result.audioPath)}
                    variant="ghost"
                    size="sm"
                    >
                    Copy Link
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
                    {result.metadata.features.trainingDataUsed && (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Trained Model
                      </Badge>
                    )}
                    </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-medium">
                      {Math.floor(result.metadata.duration / 60)}m {Math.floor(result.metadata.duration % 60)}s
                    </p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-500">Processing Time</p>
                    <p className="font-medium">
                      {(result.metadata.processingTime / 1000).toFixed(1)} seconds
                    </p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-500">AI Features Used</p>
                    <p className="font-medium">
                      {Object.entries(result.metadata.features)
                        .filter(([_, used]) => used)
                        .map(([feature]) => feature.replace('_', ' '))
                        .join(', ')}
                    </p>
                    </div>
                    </div>

                    <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                    Want to generate another variation? Adjust the creativity slider and try again!
                    </AlertDescription>
                    </Alert>
                    </div>
                    </CardContent>
                    </Card>
                    )}
                    </div>
                    );
                    }
