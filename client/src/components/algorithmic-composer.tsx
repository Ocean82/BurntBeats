
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Download, Play, Pause, RefreshCw, Music, Cpu, Zap } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface AlgorithmicComposerProps {
  onCompositionGenerated?: (composition: any) => void;
}

interface GeneratedFile {
  format: string;
  path: string;
  filename: string;
}

interface CompositionResult {
  files: GeneratedFile[];
  analysis: any;
  metadata: any;
}

export function AlgorithmicComposer({ onCompositionGenerated }: AlgorithmicComposerProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [method, setMethod] = useState('l_system');
  const [key, setKey] = useState('C');
  const [tempo, setTempo] = useState([120]);
  const [length, setLength] = useState([32]);
  const [complexity, setComplexity] = useState([0.5]);
  const [formats, setFormats] = useState(['midi']);
  const [generatedComposition, setGeneratedComposition] = useState<CompositionResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();

  const methods = [
    { value: 'l_system', label: 'L-System', icon: '🌿', description: 'Lindenmayer systems for organic growth' },
    { value: 'random_walk', label: 'Random Walk', icon: '🚶', description: 'Constrained random melodic movement' },
    { value: 'markov_chains', label: 'Markov Chains', icon: '🔗', description: 'Probabilistic chord progressions' },
    { value: 'cellular_automata', label: 'Cellular Automata', icon: '🔬', description: 'Emergent rhythmic patterns' },
    { value: 'fractal_rhythm', label: 'Fractal Rhythm', icon: '❄️', description: 'Self-similar rhythmic structures' }
  ];

  const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'];

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/music/algorithmic-composition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method,
          key,
          tempo: tempo[0],
          length: length[0],
          complexity: complexity[0],
          formats
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Generation failed');
      }

      setGeneratedComposition(result);
      onCompositionGenerated?.(result);

      toast({
        title: '🎼 Composition Generated!',
        description: `Successfully created ${method} composition with ${result.files.length} file(s)`,
      });

    } catch (error) {
      console.error('Algorithmic composition error:', error);
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate composition',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (file: GeneratedFile) => {
    const link = document.createElement('a');
    link.href = file.path;
    link.download = file.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMethodInfo = (methodValue: string) => {
    return methods.find(m => m.value === methodValue);
  };

  const selectedMethod = getMethodInfo(method);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Algorithmic Composer
          </CardTitle>
          <CardDescription>
            Generate music using advanced computational algorithms and mathematical models
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Method Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Algorithmic Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {methods.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    <div className="flex items-center gap-2">
                      <span>{m.icon}</span>
                      <div>
                        <div>{m.label}</div>
                        <div className="text-xs text-muted-foreground">{m.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMethod && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{selectedMethod.icon}</span>
                  <span className="font-medium">{selectedMethod.label}</span>
                </div>
                <p className="text-sm text-muted-foreground">{selectedMethod.description}</p>
              </div>
            )}
          </div>

          {/* Musical Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Key Signature</Label>
              <Select value={key} onValueChange={setKey}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {keys.map((k) => (
                    <SelectItem key={k} value={k}>{k}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Output Formats</Label>
              <Select value={formats[0]} onValueChange={(value) => setFormats([value])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="midi">MIDI</SelectItem>
                  <SelectItem value="musicxml">MusicXML</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                Tempo (BPM)
                <Badge variant="secondary">{tempo[0]}</Badge>
              </Label>
              <Slider
                value={tempo}
                onValueChange={setTempo}
                min={60}
                max={200}
                step={5}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                Length (Notes)
                <Badge variant="secondary">{length[0]}</Badge>
              </Label>
              <Slider
                value={length}
                onValueChange={setLength}
                min={8}
                max={128}
                step={4}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                Complexity
                <Badge variant="secondary">{complexity[0].toFixed(2)}</Badge>
              </Label>
              <Slider
                value={complexity}
                onValueChange={setComplexity}
                min={0}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>

          {/* Generate Button */}
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generating Composition...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Generate Algorithmic Composition
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Composition Results */}
      {generatedComposition && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Generated Composition
            </CardTitle>
            <CardDescription>
              Method: {generatedComposition.metadata.method} | 
              Key: {generatedComposition.metadata.key} | 
              Length: {generatedComposition.metadata.length} notes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Downloads */}
            <div className="space-y-2">
              <Label>Generated Files</Label>
              <div className="space-y-2">
                {generatedComposition.files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Music className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{file.filename}</div>
                        <div className="text-sm text-muted-foreground">
                          {file.format.toUpperCase()} format
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownload(file)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Analysis Data */}
            {generatedComposition.analysis && (
              <div className="space-y-2">
                <Label>Composition Analysis</Label>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Parts</div>
                      <div className="text-muted-foreground">{generatedComposition.analysis.parts}</div>
                    </div>
                    <div>
                      <div className="font-medium">Method</div>
                      <div className="text-muted-foreground">{generatedComposition.analysis.method}</div>
                    </div>
                    <div>
                      <div className="font-medium">Complexity</div>
                      <div className="text-muted-foreground">{generatedComposition.analysis.complexity}</div>
                    </div>
                    <div>
                      <div className="font-medium">Key</div>
                      <div className="text-muted-foreground">{generatedComposition.analysis.key}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
