
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
  const [midiFile, setMidiFile] = useState<File | null>(null);
  const [midiAnalysis, setMidiAnalysis] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [mode, setMode] = useState<'complete' | 'instrumental' | 'convert' | 'midi' | 'template'>('complete');
  const [midiTemplates, setMidiTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [melodyOptions, setMelodyOptions] = useState({
    preserveMelody: true,
    adaptTempo: false,
    customKey: ''
  });
  
  const { toast } = useToast();

  // Load MIDI templates on component mount
  React.useEffect(() => {
    const loadMidiTemplates = async () => {
      try {
        const response = await fetch('/api/rvc-music/midi-templates');
        if (response.ok) {
          const data = await response.json();
          setMidiTemplates(data.templates);
        }
      } catch (error) {
        console.error('Failed to load MIDI templates:', error);
      }
    };

    loadMidiTemplates();
  }, []);

  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleMelodyOptionChange = useCallback((field: string, value: any) => {
    setMelodyOptions(prev => ({ ...prev, [field]: value }));
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

  const handleMidiUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.mid') || file.name.endsWith('.midi')) {
        setMidiFile(file);
        
        // Analyze MIDI file
        const formData = new FormData();
        formData.append('midi_file', file);
        
        try {
          const response = await fetch('/api/rvc-music/process-midi', {
            method: 'POST',
            body: formData,
          });
          
          if (response.ok) {
            const data = await response.json();
            setMidiAnalysis(data.analysis);
            setFormData(prev => ({
              ...prev,
              title: data.analysis.title || prev.title,
              tempo: data.analysis.tempo || prev.tempo,
              key: data.analysis.key || prev.key,
              duration: Math.round(data.analysis.duration) || prev.duration
            }));
            
            toast({
              title: "MIDI file analyzed",
              description: `${data.analysis.title} - ${data.analysis.tempo} BPM`,
            });
          }
        } catch (error) {
          console.error('MIDI analysis error:', error);
        }
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a .mid or .midi file",
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

    if ((mode === 'complete' || mode === 'template') && !voiceModel) {
      toast({
        title: "Voice model required",
        description: "Please upload a voice model (.pth file)",
        variant: "destructive",
      });
      return;
    }

    if (mode === 'template' && !selectedTemplate) {
      toast({
        title: "Template required",
        description: "Please select a MIDI template",
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

      // Add template-specific data
      if (mode === 'template') {
        formDataToSend.append('midiTemplate', selectedTemplate);
        formDataToSend.append('preserveMelody', melodyOptions.preserveMelody.toString());
        formDataToSend.append('adaptTempo', melodyOptions.adaptTempo.toString());
        if (melodyOptions.customKey) {
          formDataToSend.append('customKey', melodyOptions.customKey);
        }
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 1000);

      const endpoint = mode === 'complete' 
        ? '/api/rvc-music/generate-track'
        : mode === 'template'
        ? '/api/rvc-music/generate-from-template'
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
                <SelectItem value="midi">MIDI to Vocal</SelectItem>
                <SelectItem value="template">Generate from MIDI Template</SelectItem>
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

          {/* MIDI File Upload */}
          {mode === 'midi' && (
            <div className="space-y-2">
              <Label htmlFor="midi-file">MIDI File (.mid/.midi)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  id="midi-file"
                  type="file"
                  accept=".mid,.midi"
                  onChange={handleMidiUpload}
                  className="hidden"
                />
                <label
                  htmlFor="midi-file"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Music className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {midiFile ? midiFile.name : 'Click to upload MIDI file'}
                  </span>
                </label>
              </div>
              {midiAnalysis && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm font-medium">MIDI Analysis:</p>
                  <p className="text-sm">Duration: {Math.round(midiAnalysis.duration)}s</p>
                  <p className="text-sm">Tempo: {midiAnalysis.tempo} BPM</p>
                  <p className="text-sm">Key: {midiAnalysis.key}</p>
                  <p className="text-sm">Tracks: {midiAnalysis.track_count}</p>
                </div>
              )}
            </div>
          )}

          {/* MIDI Template Selection */}
          {mode === 'template' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="midi-template">Select MIDI Template</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a melody template" />
                  </SelectTrigger>
                  <SelectContent>
                    {midiTemplates.map((template) => (
                      <SelectItem key={template.path} value={template.path}>
                        <div className="flex items-center gap-2">
                          <Music className="w-4 h-4" />
                          {template.title}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Melody Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Melody Options</h3>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="preserve-melody"
                    checked={melodyOptions.preserveMelody}
                    onChange={(e) => handleMelodyOptionChange('preserveMelody', e.target.checked)}
                  />
                  <Label htmlFor="preserve-melody">Preserve Original Melody</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="adapt-tempo"
                    checked={melodyOptions.adaptTempo}
                    onChange={(e) => handleMelodyOptionChange('adaptTempo', e.target.checked)}
                  />
                  <Label htmlFor="adapt-tempo">Adapt Tempo to Lyrics</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-key">Custom Key (optional)</Label>
                  <Select value={melodyOptions.customKey} onValueChange={(value) => handleMelodyOptionChange('customKey', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Keep original key" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Keep Original</SelectItem>
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
              </div>
            </div>
          )}

          {/* Voice Model Upload */}
          {(mode === 'complete' || mode === 'midi' || mode === 'template') && (
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
                Generate {mode === 'complete' ? 'Complete Track' : mode === 'template' ? 'From Template' : 'Instrumental'}
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
