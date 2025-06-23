
"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Play, Download, FileMusic, BarChart3, Loader2 } from 'lucide-react';

interface DemoResult {
  success: boolean;
  demoType: string;
  audioUrl: string;
  midiUrl: string;
  analysisUrl?: string;
  analysis?: {
    basic_info: {
      title: string;
      parts: number;
      measures: number;
      total_notes: number;
      duration_quarters: number;
    };
    musical_analysis: {
      detected_key: string;
      key_confidence?: number;
    };
    structure: Array<{
      name: string;
      notes: number;
      range: {
        lowest: number;
        highest: number;
        range_semitones: number;
      };
      instrument: string;
    }>;
  };
  concepts: {
    note_objects: boolean;
    chord_objects: boolean;
    rest_objects: boolean;
    stream_organization: boolean;
    generative_algorithms: boolean;
    export_capabilities: boolean;
  };
}

export default function Music21ConceptsDemo() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [demoType, setDemoType] = useState<string>('basic');
  const [result, setResult] = useState<DemoResult | null>(null);
  const [error, setError] = useState<string>('');

  const runDemo = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/demo-music21', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ demoType }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setResult(data);
      } else {
        throw new Error(data.error || 'Demo generation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Music21 demo error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const playAudio = () => {
    if (result?.audioUrl) {
      const audio = new Audio(result.audioUrl);
      audio.play().catch(e => console.error('Audio play error:', e));
    }
  };

  const getDemoDescription = (type: string) => {
    switch (type) {
      case 'basic':
        return 'Demonstrates Note, Chord, Rest objects and Stream organization';
      case 'generative':
        return 'Shows algorithmic composition with intervals, Roman numerals, and counterpoint';
      case 'advanced':
        return 'Combines all concepts: elements, structures, algorithms, and export';
      default:
        return 'Music21 concepts demonstration';
    }
  };

  const getConceptBadges = (concepts: DemoResult['concepts']) => {
    const conceptLabels = {
      note_objects: 'Note Objects',
      chord_objects: 'Chord Objects', 
      rest_objects: 'Rest Objects',
      stream_organization: 'Stream Organization',
      generative_algorithms: 'Generative Algorithms',
      export_capabilities: 'Export Capabilities'
    };

    return Object.entries(concepts)
      .filter(([_, enabled]) => enabled)
      .map(([key, _]) => (
        <Badge key={key} variant="secondary" className="text-xs">
          {conceptLabels[key as keyof typeof conceptLabels]}
        </Badge>
      ));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileMusic className="h-6 w-6" />
          Music21 Concepts Demo
        </CardTitle>
        <CardDescription>
          Explore Music21 core concepts: musical elements, organization, algorithms, and export
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Demo Type Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Demo Type</label>
          <Select value={demoType} onValueChange={setDemoType}>
            <SelectTrigger>
              <SelectValue placeholder="Select demo type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Basic Elements</SelectItem>
              <SelectItem value="generative">Generative Algorithms</SelectItem>
              <SelectItem value="advanced">Advanced (All Concepts)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {getDemoDescription(demoType)}
          </p>
        </div>

        {/* Generate Button */}
        <Button 
          onClick={runDemo} 
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Music21 Demo...
            </>
          ) : (
            <>
              <FileMusic className="mr-2 h-4 w-4" />
              Run Music21 Demo
            </>
          )}
        </Button>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Concepts Used */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Music21 Concepts Demonstrated</h3>
              <div className="flex flex-wrap gap-1">
                {getConceptBadges(result.concepts)}
              </div>
            </div>

            {/* Audio Player */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Generated Audio</h3>
              <div className="flex gap-2">
                <Button onClick={playAudio} variant="outline" size="sm">
                  <Play className="mr-2 h-4 w-4" />
                  Play Audio
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a href={result.audioUrl} download>
                    <Download className="mr-2 h-4 w-4" />
                    Download Audio
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a href={result.midiUrl} download>
                    <Download className="mr-2 h-4 w-4" />
                    Download MIDI
                  </a>
                </Button>
              </div>
            </div>

            {/* Musical Analysis */}
            {result.analysis && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Musical Analysis
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Basic Info */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Composition Details</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs space-y-1">
                      <p><strong>Title:</strong> {result.analysis.basic_info.title}</p>
                      <p><strong>Parts:</strong> {result.analysis.basic_info.parts}</p>
                      <p><strong>Measures:</strong> {result.analysis.basic_info.measures}</p>
                      <p><strong>Total Notes:</strong> {result.analysis.basic_info.total_notes}</p>
                      <p><strong>Duration:</strong> {result.analysis.basic_info.duration_quarters} quarters</p>
                    </CardContent>
                  </Card>

                  {/* Musical Analysis */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Musical Features</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs space-y-1">
                      <p><strong>Key:</strong> {result.analysis.musical_analysis.detected_key}</p>
                      {result.analysis.musical_analysis.key_confidence && (
                        <p><strong>Key Confidence:</strong> {(result.analysis.musical_analysis.key_confidence * 100).toFixed(1)}%</p>
                      )}
                      <p><strong>Demo Type:</strong> {result.demoType}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Parts Structure */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Parts Structure</h4>
                  <div className="space-y-2">
                    {result.analysis.structure.map((part, index) => (
                      <Card key={index}>
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm">{part.name}</p>
                              <p className="text-xs text-muted-foreground">{part.instrument}</p>
                            </div>
                            <div className="text-right text-xs">
                              <p><strong>{part.notes}</strong> notes</p>
                              <p>Range: {part.range.range_semitones} semitones</p>
                              <p>MIDI: {part.range.lowest}-{part.range.highest}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Analysis File Link */}
                {result.analysisUrl && (
                  <Button asChild variant="outline" size="sm">
                    <a href={result.analysisUrl} download>
                      <Download className="mr-2 h-4 w-4" />
                      Download Full Analysis
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
