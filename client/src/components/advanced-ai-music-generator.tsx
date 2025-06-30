
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { AlertCircle, Brain, Music, Waveform, Download, Play, Pause } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { useToast } from '../hooks/use-toast';

interface AdvancedGenerationOptions {
  title: string;
  lyrics: string;
  genre: string;
  tempo: number;
  key: string;
  duration: number;
  aiEnhanced: boolean;
  complexityLevel: 'simple' | 'medium' | 'complex';
  outputFormat: 'midi' | 'audio' | 'both';
  emotionalProfile?: string;
  styleReference?: string;
}

interface AIInsights {
  musicalAnalysis: any;
  aiEnhancements: any;
  qualityMetrics: any;
  recommendations: any;
}

export default function AdvancedAIMusicGenerator() {
  const [options, setOptions] = useState<AdvancedGenerationOptions>({
    title: '',
    lyrics: '',
    genre: 'pop',
    tempo: 120,
    key: 'C',
    duration: 60,
    aiEnhanced: true,
    complexityLevel: 'medium',
    outputFormat: 'both'
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [activeTab, setActiveTab] = useState('generate');
  const [isPlaying, setIsPlaying] = useState(false);

  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!options.title || !options.lyrics) {
      toast({
        title: "Missing Information",
        description: "Please provide both title and lyrics",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setResult(null);
    setAiInsights(null);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + Math.random() * 15, 90));
      }, 1000);

      const response = await fetch('/api/generate-advanced-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options)
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const data = await response.json();
      
      if (data.success) {
        setResult(data.song);
        setAiInsights(data.aiInsights);
        setActiveTab('results');
        
        toast({
          title: "🎵 Generation Complete!",
          description: "Your advanced AI music has been generated successfully",
        });
      } else {
        throw new Error(data.error || 'Generation failed');
      }

    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // Audio playback logic would go here
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-500" />
            Advanced AI Music Generator
          </CardTitle>
          <CardDescription>
            Generate sophisticated music using cutting-edge AI technology with Music21 integration
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="results" disabled={!result}>Results</TabsTrigger>
          <TabsTrigger value="insights" disabled={!aiInsights}>AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Song Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={options.title}
                    onChange={(e) => setOptions(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter song title"
                  />
                </div>

                <div>
                  <Label htmlFor="lyrics">Lyrics</Label>
                  <Textarea
                    id="lyrics"
                    value={options.lyrics}
                    onChange={(e) => setOptions(prev => ({ ...prev, lyrics: e.target.value }))}
                    placeholder="Enter your lyrics here..."
                    rows={6}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="genre">Genre</Label>
                    <Select value={options.genre} onValueChange={(value) => setOptions(prev => ({ ...prev, genre: value }))}>
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

                  <div>
                    <Label htmlFor="key">Key</Label>
                    <Select value={options.key} onValueChange={(value) => setOptions(prev => ({ ...prev, key: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(key => (
                          <SelectItem key={key} value={key}>{key}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Advanced Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Advanced Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tempo">Tempo (BPM)</Label>
                    <Input
                      id="tempo"
                      type="number"
                      min="60"
                      max="200"
                      value={options.tempo}
                      onChange={(e) => setOptions(prev => ({ ...prev, tempo: parseInt(e.target.value) }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="duration">Duration (seconds)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="10"
                      max="300"
                      value={options.duration}
                      onChange={(e) => setOptions(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="complexity">Complexity Level</Label>
                  <Select value={options.complexityLevel} onValueChange={(value: any) => setOptions(prev => ({ ...prev, complexityLevel: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="complex">Complex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="outputFormat">Output Format</Label>
                  <Select value={options.outputFormat} onValueChange={(value: any) => setOptions(prev => ({ ...prev, outputFormat: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="midi">MIDI Only</SelectItem>
                      <SelectItem value="audio">Audio Only</SelectItem>
                      <SelectItem value="both">Both MIDI & Audio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="aiEnhanced"
                    checked={options.aiEnhanced}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, aiEnhanced: checked }))}
                  />
                  <Label htmlFor="aiEnhanced">Enable AI Enhancement</Label>
                  <Badge variant="secondary">Recommended</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Generation Progress */}
          {isGenerating && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Generating Advanced AI Music...</span>
                    <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Brain className="h-4 w-4 animate-pulse" />
                    {progress < 30 && "Analyzing lyrics with AI..."}
                    {progress >= 30 && progress < 60 && "Generating musical structure..."}
                    {progress >= 60 && progress < 90 && "Creating advanced composition..."}
                    {progress >= 90 && "Finalizing and processing..."}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generate Button */}
          <Card>
            <CardContent className="pt-6">
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !options.title || !options.lyrics}
                size="lg"
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Brain className="mr-2 h-4 w-4 animate-pulse" />
                    Generating with AI...
                  </>
                ) : (
                  <>
                    <Music className="mr-2 h-4 w-4" />
                    Generate Advanced AI Music
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {result && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5" />
                    {result.title}
                  </CardTitle>
                  <CardDescription>
                    Generated with Advanced AI • {result.genre} • {formatDuration(result.duration)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Button onClick={handlePlayPause} variant="outline">
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {isPlaying ? 'Pause' : 'Play'}
                    </Button>
                    
                    {result.generatedAudioPath && (
                      <Button variant="outline" asChild>
                        <a href={`/api/audio/${result.id}`} download>
                          <Download className="mr-2 h-4 w-4" />
                          Download Audio
                        </a>
                      </Button>
                    )}
                    
                    {result.midiPath && (
                      <Button variant="outline" asChild>
                        <a href={result.midiPath} download>
                          <Waveform className="mr-2 h-4 w-4" />
                          Download MIDI
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Generation Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Genre</Label>
                      <p className="text-sm text-muted-foreground capitalize">{result.genre}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Tempo</Label>
                      <p className="text-sm text-muted-foreground">{result.tempo} BPM</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Key</Label>
                      <p className="text-sm text-muted-foreground">{result.key}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Duration</Label>
                      <p className="text-sm text-muted-foreground">{formatDuration(result.duration)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {aiInsights && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI Analysis & Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round(aiInsights.qualityMetrics?.melodicCoherence * 100)}%
                      </div>
                      <div className="text-sm text-blue-800">Melodic Coherence</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round(aiInsights.qualityMetrics?.harmonicRichness * 100)}%
                      </div>
                      <div className="text-sm text-green-800">Harmonic Richness</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.round(aiInsights.qualityMetrics?.rhythmicComplexity * 100)}%
                      </div>
                      <div className="text-sm text-purple-800">Rhythmic Complexity</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {Math.round(aiInsights.qualityMetrics?.overallQuality * 100)}%
                      </div>
                      <div className="text-sm text-orange-800">Overall Quality</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Musical Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label className="font-medium">Emotional Content</Label>
                        <p className="text-sm text-muted-foreground">
                          Dominant emotion: {aiInsights.musicalAnalysis?.emotionalMapping?.dominantEmotion}
                        </p>
                      </div>
                      <div>
                        <Label className="font-medium">Structure</Label>
                        <p className="text-sm text-muted-foreground">
                          {aiInsights.musicalAnalysis?.structuralAnalysis?.estimatedSections?.length} sections detected
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {aiInsights.recommendations?.improvements?.slice(0, 3).map((suggestion: string, index: number) => (
                        <Alert key={index}>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            {suggestion}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
