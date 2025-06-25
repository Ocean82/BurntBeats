
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { BarChart, TrendingUp, Activity, Zap, Heart, Music, Brain } from 'lucide-react';
import type { Song } from '@shared/schema';

interface MusicAnalyticsVisualizerProps {
  song: Song;
  className?: string;
}

interface EnergyProfile {
  energy: number;
  danceability: number;
  valence: number;
  acousticness: number;
  instrumentalness: number;
  tempo: number;
}

interface LyricHeatmap {
  sections: Array<{
    type: string;
    startTime: number;
    endTime: number;
    emotionalIntensity: number;
    wordCount: number;
    sentiment: 'positive' | 'negative' | 'neutral';
    keywords: string[];
  }>;
  overallSentiment: number;
  emotionalArc: number[];
}

export default function MusicAnalyticsVisualizer({ song, className = "" }: MusicAnalyticsVisualizerProps) {
  const [energyProfile, setEnergyProfile] = useState<EnergyProfile | null>(null);
  const [lyricHeatmap, setLyricHeatmap] = useState<LyricHeatmap | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (song) {
      generateAnalytics();
    }
  }, [song]);

  const generateAnalytics = async () => {
    setIsLoading(true);
    try {
      // Generate mock analytics based on song data
      const mockEnergyProfile = generateEnergyProfile(song);
      const mockLyricHeatmap = generateLyricHeatmap(song);
      
      setEnergyProfile(mockEnergyProfile);
      setLyricHeatmap(mockLyricHeatmap);
    } catch (error) {
      console.error('Error generating analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateEnergyProfile = (song: Song): EnergyProfile => {
    // Generate realistic energy profile based on genre and mood
    const genreModifiers = getGenreModifiers(song.genre);
    const moodModifiers = getMoodModifiers(song.mood);
    
    return {
      energy: Math.min(1, Math.max(0, genreModifiers.energy + moodModifiers.energy + (Math.random() * 0.2 - 0.1))),
      danceability: Math.min(1, Math.max(0, genreModifiers.danceability + moodModifiers.danceability + (Math.random() * 0.2 - 0.1))),
      valence: Math.min(1, Math.max(0, genreModifiers.valence + moodModifiers.valence + (Math.random() * 0.2 - 0.1))),
      acousticness: Math.min(1, Math.max(0, genreModifiers.acousticness + (Math.random() * 0.3 - 0.15))),
      instrumentalness: Math.min(1, Math.max(0, genreModifiers.instrumentalness + (Math.random() * 0.2 - 0.1))),
      tempo: song.tempo || 120
    };
  };

  const generateLyricHeatmap = (song: Song): LyricHeatmap => {
    if (!song.sections || !Array.isArray(song.sections)) {
      return {
        sections: [],
        overallSentiment: 0.5,
        emotionalArc: []
      };
    }

    const sections = song.sections.map((section: any, index: number) => {
      const lyrics = section.lyrics || '';
      const wordCount = lyrics.split(/\s+/).filter(word => word.length > 0).length;
      
      // Simple sentiment analysis based on keywords
      const sentiment = analyzeSentiment(lyrics);
      const emotionalIntensity = calculateEmotionalIntensity(lyrics, song.mood);
      const keywords = extractKeywords(lyrics);

      return {
        type: section.type || `Section ${index + 1}`,
        startTime: section.startTime || index * 30,
        endTime: section.endTime || (index + 1) * 30,
        emotionalIntensity,
        wordCount,
        sentiment,
        keywords
      };
    });

    const overallSentiment = sections.reduce((acc, section) => {
      const sentimentValue = section.sentiment === 'positive' ? 1 : section.sentiment === 'negative' ? 0 : 0.5;
      return acc + sentimentValue;
    }, 0) / sections.length;

    const emotionalArc = sections.map(section => section.emotionalIntensity);

    return { sections, overallSentiment, emotionalArc };
  };

  const getGenreModifiers = (genre: string) => {
    const modifiers = {
      'electronic': { energy: 0.8, danceability: 0.9, valence: 0.7, acousticness: 0.1, instrumentalness: 0.6 },
      'rock': { energy: 0.9, danceability: 0.6, valence: 0.6, acousticness: 0.2, instrumentalness: 0.3 },
      'pop': { energy: 0.7, danceability: 0.8, valence: 0.8, acousticness: 0.3, instrumentalness: 0.2 },
      'jazz': { energy: 0.5, danceability: 0.5, valence: 0.6, acousticness: 0.7, instrumentalness: 0.4 },
      'classical': { energy: 0.4, danceability: 0.2, valence: 0.5, acousticness: 0.9, instrumentalness: 0.8 },
      'hip-hop': { energy: 0.8, danceability: 0.9, valence: 0.6, acousticness: 0.1, instrumentalness: 0.1 },
      'country': { energy: 0.6, danceability: 0.6, valence: 0.7, acousticness: 0.6, instrumentalness: 0.2 },
      'r&b': { energy: 0.6, danceability: 0.8, valence: 0.7, acousticness: 0.4, instrumentalness: 0.2 }
    };
    
    return modifiers[genre.toLowerCase()] || modifiers['pop'];
  };

  const getMoodModifiers = (mood: string) => {
    const modifiers = {
      'happy': { energy: 0.1, danceability: 0.1, valence: 0.2 },
      'sad': { energy: -0.2, danceability: -0.1, valence: -0.3 },
      'energetic': { energy: 0.2, danceability: 0.2, valence: 0.1 },
      'calm': { energy: -0.3, danceability: -0.2, valence: 0.0 },
      'aggressive': { energy: 0.3, danceability: 0.0, valence: -0.1 },
      'romantic': { energy: -0.1, danceability: 0.1, valence: 0.2 }
    };
    
    return modifiers[mood.toLowerCase()] || { energy: 0, danceability: 0, valence: 0 };
  };

  const analyzeSentiment = (text: string): 'positive' | 'negative' | 'neutral' => {
    const positiveWords = ['love', 'happy', 'joy', 'beautiful', 'amazing', 'wonderful', 'great', 'good', 'smile', 'dream'];
    const negativeWords = ['sad', 'pain', 'hurt', 'cry', 'broken', 'lost', 'alone', 'dark', 'hate', 'angry'];
    
    const words = text.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(word => positiveWords.some(pw => word.includes(pw))).length;
    const negativeCount = words.filter(word => negativeWords.some(nw => word.includes(nw))).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  };

  const calculateEmotionalIntensity = (text: string, mood: string): number => {
    const intensityWords = ['very', 'so', 'really', 'extremely', 'completely', 'totally', 'absolutely'];
    const words = text.toLowerCase().split(/\s+/);
    const intensityCount = words.filter(word => intensityWords.some(iw => word.includes(iw))).length;
    
    const baseMoodIntensity = {
      'energetic': 0.8,
      'aggressive': 0.9,
      'romantic': 0.7,
      'sad': 0.6,
      'happy': 0.7,
      'calm': 0.3
    };
    
    const moodIntensity = baseMoodIntensity[mood.toLowerCase()] || 0.5;
    const textIntensity = Math.min(1, intensityCount * 0.2);
    
    return Math.min(1, moodIntensity + textIntensity);
  };

  const extractKeywords = (text: string): string[] => {
    const words = text.toLowerCase().split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['the', 'and', 'but', 'for', 'you', 'are', 'not', 'this', 'that', 'with'].includes(word));
    
    // Count word frequency and return top keywords
    const wordCount = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  };

  const getIntensityColor = (intensity: number): string => {
    if (intensity >= 0.8) return 'bg-red-500';
    if (intensity >= 0.6) return 'bg-orange-500';
    if (intensity >= 0.4) return 'bg-yellow-500';
    if (intensity >= 0.2) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getSentimentColor = (sentiment: 'positive' | 'negative' | 'neutral'): string => {
    switch (sentiment) {
      case 'positive': return 'text-green-400';
      case 'negative': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <Card className={`bg-white/5 border-white/10 backdrop-blur-lg ${className}`}>
        <CardContent className="p-6">
          <div className="text-center text-white/60">
            <Activity className="h-8 w-8 animate-pulse mx-auto mb-2" />
            <p>Analyzing musical patterns...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-white/5 border-white/10 backdrop-blur-lg ${className}`}>
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Brain className="h-5 w-5 mr-2 text-purple-400" />
          Music Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="energy" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/10">
            <TabsTrigger value="energy" className="text-white data-[state=active]:bg-purple-500">
              Energy Profile
            </TabsTrigger>
            <TabsTrigger value="lyrics" className="text-white data-[state=active]:bg-purple-500">
              Lyric Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="energy" className="space-y-4">
            {energyProfile && (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60 flex items-center">
                      <Zap className="h-4 w-4 mr-1" />
                      Energy
                    </span>
                    <span className="text-sm text-white">{Math.round(energyProfile.energy * 100)}%</span>
                  </div>
                  <Progress value={energyProfile.energy * 100} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60 flex items-center">
                      <Activity className="h-4 w-4 mr-1" />
                      Danceability
                    </span>
                    <span className="text-sm text-white">{Math.round(energyProfile.danceability * 100)}%</span>
                  </div>
                  <Progress value={energyProfile.danceability * 100} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60 flex items-center">
                      <Heart className="h-4 w-4 mr-1" />
                      Valence (Positivity)
                    </span>
                    <span className="text-sm text-white">{Math.round(energyProfile.valence * 100)}%</span>
                  </div>
                  <Progress value={energyProfile.valence * 100} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60 flex items-center">
                      <Music className="h-4 w-4 mr-1" />
                      Acousticness
                    </span>
                    <span className="text-sm text-white">{Math.round(energyProfile.acousticness * 100)}%</span>
                  </div>
                  <Progress value={energyProfile.acousticness * 100} className="h-2" />
                </div>

                <div className="mt-4 p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Tempo</span>
                    <span className="text-white font-medium">{energyProfile.tempo} BPM</span>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="lyrics" className="space-y-4">
            {lyricHeatmap && (
              <>
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-white">Overall Sentiment</h4>
                  <div className="flex items-center space-x-2">
                    <Progress value={lyricHeatmap.overallSentiment * 100} className="flex-1 h-2" />
                    <span className="text-sm text-white">{Math.round(lyricHeatmap.overallSentiment * 100)}%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-white">Emotional Intensity by Section</h4>
                  {lyricHeatmap.sections.map((section, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/60">{section.type}</span>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className={getSentimentColor(section.sentiment)}>
                            {section.sentiment}
                          </Badge>
                          <span className="text-xs text-white/60">{section.wordCount} words</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`h-2 rounded-full ${getIntensityColor(section.emotionalIntensity)}`} 
                             style={{ width: `${section.emotionalIntensity * 100}%` }} />
                        <span className="text-xs text-white/60">
                          {Math.round(section.emotionalIntensity * 100)}% intensity
                        </span>
                      </div>
                      {section.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {section.keywords.map((keyword, kidx) => (
                            <Badge key={kidx} variant="outline" className="text-xs text-white/60">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-white/5 rounded-lg">
                  <h4 className="text-sm font-medium text-white mb-2">Emotional Arc</h4>
                  <div className="flex items-end space-x-1 h-16">
                    {lyricHeatmap.emotionalArc.map((intensity, index) => (
                      <div
                        key={index}
                        className={`w-full rounded-t ${getIntensityColor(intensity)}`}
                        style={{ height: `${intensity * 100}%` }}
                        title={`${lyricHeatmap.sections[index]?.type}: ${Math.round(intensity * 100)}% intensity`}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-4 pt-4 border-t border-white/10">
          <Button
            onClick={generateAnalytics}
            variant="ghost"
            size="sm"
            className="text-white/60 hover:text-white"
            disabled={isLoading}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Refresh Analytics
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
