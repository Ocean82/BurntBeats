"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Crown, Music, Sparkles } from "lucide-react";
import { useSongGeneration } from "@/hooks/use-song-generation";
import GenerationProgress from "./generation-progress";
import UpgradeModal from "./upgrade-modal";
import SassyAIChat from "./sassy-ai-chat";

interface SongFormProps {
  onSongGenerated: (song: any) => void;
  user?: {
    id?: number;
    totalSongsCreated?: number;
  };
}

export default function SongForm({ onSongGenerated, user }: SongFormProps) {
  const [lyrics, setLyrics] = useState("");
  const [genre, setGenre] = useState("");
  const [style, setStyle] = useState("");
  const [mood, setMood] = useState("");

  const {
    generateSong,
    isGenerating,
    generationProgress,
    generationStage,
    generationError
  } = useSongGeneration({
    onGenerationComplete: (song) => {
      console.log("🎵 Song generation completed with audio:", {
        title: song.title,
        generatedAudioPath: song.generatedAudioPath,
        status: song.status,
        sections: song.sections ? Object.keys(song.sections).length : 0
      });

      // Set the completed song for the audio player
      onSongGenerated(song);

      // Auto-advance to next step if using step system
      // if (typeof currentStep !== 'undefined' && currentStep < 4) {
      //   setTimeout(() => {
      //     // Allow time for user to see completion
      //     console.log("Auto-advancing to audio player step");
      //   }, 1000);
      // }
    },
    userId: user?.id || 1
  });

  // Define available options based on plan
  const getAvailableGenres = () => {
    // All genres available to everyone
    return ["Pop", "Rock", "Electronic", "Jazz", "Classical", "Hip-Hop", "Country", "R&B"];
  };

  const getUsageInfo = () => {
    if (!user) return null;
    const songsCreated = user.totalSongsCreated || 0;
    return `Songs created: ${songsCreated} (Unlimited)`;
  };

  // Everyone can generate unlimited songs - no restrictions

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // No limits - everyone can generate unlimited songs

    try {
      await generateSong({
        title: `${genre || "Pop"} Song`,
        lyrics: lyrics.trim(),
        genre: genre || "Pop",
        vocalStyle: style || "Upbeat",
        mood: mood || "Happy",
        tempo: 120,
        duration: 30,
        singingStyle: "melodic",
        tone: "warm"
      });

      // Song will be handled by onGenerationComplete callback
      setLyrics("");
      setGenre("");
      setStyle("");
      setMood("");
    } catch (error) {
      console.error("Song generation failed:", error);
    }
  };

  const getPlanBadgeColor = () => {
    return "bg-gradient-to-r from-green-400 to-green-600";
  };

  return (
    <div className="space-y-6">
      {/* Status */}
      <Card className="bg-dark-card border-gray-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Badge className={`${getPlanBadgeColor()} text-white`}>
                All Features Unlocked
              </Badge>
              <span className="text-sm text-gray-400">{getUsageInfo()}</span>
            </div>
            <span className="text-sm text-green-400 font-medium">
              Pay only to download
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Song Generation Form */}
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Music className="w-5 h-5" />
            <span>Create Your Song</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Lyrics Input with AI Chat */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Lyrics Input */}
              <div className="space-y-2">
                <Label htmlFor="lyrics">Enter Your Lyrics</Label>
                <Textarea
                  id="lyrics"
                  placeholder="Enter your song lyrics here... (e.g., 'Verse 1: Walking down the street...')"
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  className="min-h-[200px] bg-gray-800 border-gray-700 text-white"
                  required
                />
                <p className="text-sm text-gray-400">
                  Tip: Structure your lyrics with verses, choruses, and bridges for best results
                </p>
              </div>

              {/* Sassy AI Chat */}
              <div className="space-y-2">
                <Label>AI Assistant with Attitude 🤖</Label>
                <div className="h-[240px] border border-gray-700 rounded-lg">
                  <SassyAIChat user={user} />
                </div>
                <p className="text-sm text-gray-400">
                  Get real-time feedback and roasts on your lyrics
                </p>
              </div>
            </div>

            {/* Generate Button */}
            <div className="pt-2">
              <Button 
                type="submit" 
                disabled={isGenerating || !lyrics.trim()}
                className="w-full bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Song...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Song (Free)
                  </>
                )}
              </Button>
            </div>

            {/* Advanced Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="genre">Genre</Label>
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select genre" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableGenres().map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="style">Style</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Upbeat">Upbeat</SelectItem>
                    <SelectItem value="Mellow">Mellow</SelectItem>
                    <SelectItem value="Energetic">Energetic</SelectItem>
                    <SelectItem value="Calm">Calm</SelectItem>
                    <SelectItem value="Aggressive">Aggressive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mood">Mood</Label>
                <Select value={mood} onValueChange={setMood}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select mood" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Happy">Happy</SelectItem>
                    <SelectItem value="Sad">Sad</SelectItem>
                    <SelectItem value="Romantic">Romantic</SelectItem>
                    <SelectItem value="Motivational">Motivational</SelectItem>
                    <SelectItem value="Nostalgic">Nostalgic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Burnt Beats Ownership Promotion */}
            <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Sparkles className="w-5 h-5 text-orange-400" />
                  <span className="text-orange-200 font-medium">Create, Own, Profit</span>
                </div>
                <p className="text-orange-200/80 text-sm">
                  Every song you generate is 100% yours forever. No royalties, no licensing fees - just pure ownership and creative freedom.
                </p>
              </CardContent>
            </Card>

            {/* Error Display */}
            {generationError && (
              <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg">
                <p className="text-red-400 text-sm">{generationError?.message || 'Generation failed'}</p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Progress Display */}
      {isGenerating && (
        <GenerationProgress 
          generationProgress={generationProgress} 
          generationStage={generationStage} 
        />
      )}
    </div>
  );
}