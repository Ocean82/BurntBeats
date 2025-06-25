
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  Music, 
  FileText,
  Sparkles,
  Play,
  Crown,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MusicTheoryUploadProps {
  user?: any;
}

interface AnalysisResult {
  success: boolean;
  analysis: any;
  premiumFeatures: boolean;
  upgradeMessage?: string;
}

export default function MusicTheoryUpload({ user }: MusicTheoryUploadProps) {
  const [chordInput, setChordInput] = useState("");
  const [lyricsInput, setLyricsInput] = useState("");
  const [chordAnalysis, setChordAnalysis] = useState<any>(null);
  const [lyricAnalysis, setLyricAnalysis] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const chordAnalysisMutation = useMutation({
    mutationFn: async (chords: string[]) => {
      setUploadProgress(0);
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      try {
        const response = await apiRequest("POST", "/api/music-theory/analyze-chords", {
          chords,
          userPlan: user?.plan || 'free'
        });
        clearInterval(progressInterval);
        setUploadProgress(100);
        return response.json();
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
    },
    onSuccess: (result: AnalysisResult) => {
      setChordAnalysis(result.analysis);
      if (result.upgradeMessage) {
        toast({
          title: "Basic Analysis Complete",
          description: result.upgradeMessage,
        });
      } else {
        toast({
          title: "Premium Analysis Complete!",
          description: "Your chord progression has been analyzed with advanced music theory.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: "Could not analyze your chord progression. Please try again.",
        variant: "destructive",
      });
    }
  });

  const lyricAnalysisMutation = useMutation({
    mutationFn: async (lyrics: string) => {
      setUploadProgress(0);
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 8, 90));
      }, 300);

      try {
        const response = await apiRequest("POST", "/api/music-theory/analyze-lyrics", {
          lyrics,
          userPlan: user?.plan || 'free'
        });
        clearInterval(progressInterval);
        setUploadProgress(100);
        return response.json();
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
    },
    onSuccess: (result: AnalysisResult) => {
      setLyricAnalysis(result.analysis);
      if (result.upgradeMessage) {
        toast({
          title: "Basic Analysis Complete",
          description: result.upgradeMessage,
        });
      } else {
        toast({
          title: "AI Analysis Complete!",
          description: "Your lyrics have been analyzed with advanced AI insights.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: "Could not analyze your lyrics. Please try again.",
        variant: "destructive",
      });
    }
  });

  const parseChords = (input: string): string[] => {
    // Parse chord input - accepts comma, space, or newline separated
    return input
      .split(/[,\s\n]+/)
      .map(chord => chord.trim())
      .filter(chord => chord.length > 0);
  };

  const handleChordAnalysis = () => {
    const chords = parseChords(chordInput);
    if (chords.length < 2) {
      toast({
        title: "More chords needed",
        description: "Please enter at least 2 chords for analysis.",
        variant: "destructive",
      });
      return;
    }
    chordAnalysisMutation.mutate(chords);
  };

  const handleLyricAnalysis = () => {
    if (lyricsInput.trim().length < 20) {
      toast({
        title: "More lyrics needed",
        description: "Please enter at least a few lines for meaningful analysis.",
        variant: "destructive",
      });
      return;
    }
    lyricAnalysisMutation.mutate(lyricsInput);
  };

  const isPremiumUser = user?.plan === 'pro' || user?.plan === 'enterprise';

  return (
    <Card className="bg-dark-card border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center text-lg font-medium text-white">
          <Music className="w-5 h-5 mr-2 text-purple-500" />
          Music Theory Analysis
          {isPremiumUser && (
            <Badge className="ml-2 bg-gradient-to-r from-purple-500 to-pink-500">
              <Crown className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-gray-400">
          Upload your chord progressions or lyrics for professional music theory analysis
        </p>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="chords" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chords">Chord Analysis</TabsTrigger>
            <TabsTrigger value="lyrics">Lyric Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="chords" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Enter Chord Progression
                </label>
                <Input
                  value={chordInput}
                  onChange={(e) => setChordInput(e.target.value)}
                  placeholder="C, Am, F, G  or  C Am F G  or  C-Am-F-G"
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate chords with commas, spaces, or dashes
                </p>
              </div>

              <Button
                onClick={handleChordAnalysis}
                disabled={chordAnalysisMutation.isPending || !chordInput.trim()}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
              >
                {chordAnalysisMutation.isPending ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Music className="w-4 h-4 mr-2" />
                    Analyze Chords
                  </>
                )}
              </Button>

              {chordAnalysisMutation.isPending && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-gray-400 text-center">
                    Analyzing harmonic structure and progressions...
                  </p>
                </div>
              )}

              {chordAnalysis && (
                <div className="bg-gray-800 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-white">Analysis Results</h4>
                    <Badge variant={isPremiumUser ? "default" : "outline"}>
                      {isPremiumUser ? "Premium Analysis" : "Basic Analysis"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Detected Key</p>
                      <p className="font-medium text-white">{chordAnalysis.key}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Complexity</p>
                      <p className="font-medium text-white">
                        {Math.round(chordAnalysis.analysis.complexity * 100)}%
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 mb-2">Roman Numeral Analysis</p>
                    <div className="flex flex-wrap gap-2">
                      {chordAnalysis.chords.map((chord: string, index: number) => (
                        <div key={index} className="bg-gray-700 px-2 py-1 rounded text-sm">
                          <span className="text-white">{chord}</span>
                          <span className="text-gray-400 ml-1">
                            ({chordAnalysis.analysis.romanNumerals[index]})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 mb-2">Suggestions</p>
                    <div className="space-y-1">
                      {chordAnalysis.analysis.suggestions.map((suggestion: string, index: number) => (
                        <div key={index} className="flex items-start space-x-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300">{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="lyrics" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Enter Lyrics
                </label>
                <Textarea
                  value={lyricsInput}
                  onChange={(e) => setLyricsInput(e.target.value)}
                  placeholder="Paste your lyrics here...&#10;&#10;Verse 1:&#10;In the darkness of the night&#10;I can see a distant light&#10;..."
                  className="bg-gray-800 border-gray-700 text-white min-h-[120px]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Paste complete verses or sections for best analysis
                </p>
              </div>

              <Button
                onClick={handleLyricAnalysis}
                disabled={lyricAnalysisMutation.isPending || !lyricsInput.trim()}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500"
              >
                {lyricAnalysisMutation.isPending ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Analyze Lyrics
                  </>
                )}
              </Button>

              {lyricAnalysisMutation.isPending && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-gray-400 text-center">
                    Analyzing structure, sentiment, and musical compatibility...
                  </p>
                </div>
              )}

              {lyricAnalysis && (
                <div className="bg-gray-800 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-white">Lyric Analysis</h4>
                    <Badge variant={isPremiumUser ? "default" : "outline"}>
                      {isPremiumUser ? "AI-Powered" : "Basic Analysis"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Verses</p>
                      <p className="font-medium text-white">{lyricAnalysis.structure.verses}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Choruses</p>
                      <p className="font-medium text-white">{lyricAnalysis.structure.choruses}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Sentiment</p>
                      <p className="font-medium text-white capitalize">{lyricAnalysis.sentiment.overall}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Lines</p>
                      <p className="font-medium text-white">{lyricAnalysis.structure.totalLines}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 mb-2">Musical Suggestions</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-700 p-3 rounded">
                        <p className="text-xs text-gray-400">Suggested Key</p>
                        <p className="font-medium text-white">{lyricAnalysis.suggestions.musicalKey}</p>
                      </div>
                      <div className="bg-gray-700 p-3 rounded">
                        <p className="text-xs text-gray-400">Suggested Tempo</p>
                        <p className="font-medium text-white">{lyricAnalysis.suggestions.tempo} BPM</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 mb-2">Genre Recommendations</p>
                    <div className="flex flex-wrap gap-2">
                      {lyricAnalysis.suggestions.genre.map((genre: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {isPremiumUser && (
                    <div>
                      <p className="text-xs text-gray-400 mb-2">AI Insights</p>
                      <div className="space-y-1">
                        {lyricAnalysis.suggestions.improvements.map((improvement: string, index: number) => (
                          <div key={index} className="flex items-start space-x-2 text-sm">
                            <Sparkles className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-300">{improvement}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {!isPremiumUser && (
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
            <div className="flex items-center space-x-2 mb-2">
              <Crown className="w-5 h-5 text-purple-400" />
              <h4 className="font-medium text-white">Unlock Premium Analysis</h4>
            </div>
            <p className="text-sm text-gray-300 mb-3">
              Get AI-powered insights, advanced music theory analysis, and personalized suggestions
            </p>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
              Upgrade to Pro
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
