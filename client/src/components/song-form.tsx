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

interface SongFormProps {
  onSongGenerated: (song: any) => void;
  userPlan: string;
  onUpgrade: () => void;
  user?: {
    id?: number;
    songsThisMonth?: number;
    monthlyLimit?: number;
  };
}

export default function SongForm({ onSongGenerated, userPlan, onUpgrade, user }: SongFormProps) {
  const [lyrics, setLyrics] = useState("");
  const [genre, setGenre] = useState("");
  const [style, setStyle] = useState("");
  const [mood, setMood] = useState("");

  const {
    generateSong,
    isGenerating,
    progress,
    currentStep,
    error: generationError
  } = useSongGeneration();

  // Define available options based on plan
  const getAvailableGenres = () => {
    switch (userPlan) {
      case "free":
        return ["Pop", "Rock", "Electronic"];
      case "basic":
        return ["Pop", "Rock", "Electronic", "Jazz", "Classical"];
      case "pro":
      case "enterprise":
        return ["Pop", "Rock", "Electronic", "Jazz", "Classical", "Hip-Hop", "Country", "R&B"];
      default:
        return ["Pop", "Rock", "Electronic"];
    }
  };

  const getUsageInfo = () => {
    if (!user) return null;

    const songsUsed = user.songsThisMonth || 0;
    const monthlyLimit = user.monthlyLimit || 2;

    if (userPlan === "pro" || userPlan === "enterprise") {
      return `Songs this month: ${songsUsed} (Unlimited)`;
    }

    return `Songs this month: ${songsUsed}/${monthlyLimit}`;
  };

  const canGenerateSong = () => {
    if (userPlan === "pro" || userPlan === "enterprise") return true;

    const songsUsed = user?.songsThisMonth || 0;
    const monthlyLimit = userPlan === "basic" ? 4 : 2; // Basic: 4, Free: 2

    return songsUsed < monthlyLimit;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canGenerateSong()) {
      return;
    }

    try {
      const song = await generateSong({
        lyrics: lyrics.trim(),
        genre: genre || "Pop",
        style: style || "Upbeat",
        mood: mood || "Happy"
      });

      if (song) {
        onSongGenerated(song);
        setLyrics("");
        setGenre("");
        setStyle("");
        setMood("");
      }
    } catch (error) {
      console.error("Song generation failed:", error);
    }
  };

  const getPlanBadgeColor = () => {
    switch (userPlan) {
      case "basic": return "bg-blue-500";
      case "pro": return "bg-gradient-to-r from-vibrant-orange to-orange-600";
      case "enterprise": return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Plan Status */}
      <Card className="bg-dark-card border-gray-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Badge className={`${getPlanBadgeColor()} text-white`}>
                {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)} Plan
              </Badge>
              <span className="text-sm text-gray-400">{getUsageInfo()}</span>
            </div>
            {userPlan !== "enterprise" && (
              <UpgradeModal currentPlan={userPlan} onUpgrade={onUpgrade}>
                <Button variant="outline" size="sm">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade
                </Button>
              </UpgradeModal>
            )}
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
            {/* Lyrics Input */}
            <div className="space-y-2">
              <Label htmlFor="lyrics">Enter Your Lyrics</Label>
              <Textarea
                id="lyrics"
                placeholder="Enter your song lyrics here... (e.g., 'Verse 1: Walking down the street...')"
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                className="min-h-[120px] bg-gray-800 border-gray-700 text-white"
                required
              />
              <p className="text-sm text-gray-400">
                Tip: Structure your lyrics with verses, choruses, and bridges for best results
              </p>
            </div>

            {/* Generate Button - Moved directly under lyrics */}
            <div className="pt-2">
              {canGenerateSong() ? (
                <Button 
                  type="submit" 
                  disabled={isGenerating || !lyrics.trim()}
                  className="w-full bg-gradient-to-r from-vibrant-orange to-orange-600 hover:from-orange-600 hover:to-vibrant-orange text-white"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Song...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Song
                    </>
                  )}
                </Button>
              ) : (
                <UpgradeModal currentPlan={userPlan} onUpgrade={onUpgrade}>
                  <Button 
                    type="button"
                    className="w-full bg-gradient-to-r from-vibrant-orange to-orange-600 hover:from-orange-600 hover:to-vibrant-orange text-white"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Monthly Limit Reached - Upgrade to Continue
                  </Button>
                </UpgradeModal>
              )}
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

            {/* Error Display */}
            {generationError && (
              <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg">
                <p className="text-red-400 text-sm">{generationError}</p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Progress Display */}
      {isGenerating && (
        <GenerationProgress 
          progress={progress} 
          currentStep={currentStep} 
        />
      )}
    </div>
  );
}