"use client"

import React, { useState, useEffect } from "react";
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
import { SassyAIChat } from "./sassy-ai-chat";
import ExampleTrackPlayer from "./example-track-player";
import SongCreationStatusBar, { useSongCreationProgress } from "./song-creation-status-bar";

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
  const [selectedVoice, setSelectedVoice] = useState("");
  const [songLength, setSongLength] = useState("30");
  const [tempo, setTempo] = useState("120");
  
  // Status bar progress management
  const { currentStep, completedSteps, completeStep, goToStep } = useSongCreationProgress();

  const {
    generateSong,
    isGenerating,
    generationProgress,
    generationStage
  } = useSongGeneration();

  // Track form completion status for status bar
  const getSongData = () => ({
    hasLyrics: lyrics.trim().length > 0,
    hasGenre: genre.length > 0,
    hasMelody: style.length > 0 && tempo.length > 0,
    hasVoice: selectedVoice.length > 0 || true, // Default voice available
    hasSettings: songLength.length > 0 && mood.length > 0,
    isGenerated: false,
    canDownload: false
  });

  // Auto-advance steps based on form completion
  React.useEffect(() => {
    const data = getSongData();
    
    if (data.hasLyrics && !completedSteps.includes(1)) {
      completeStep(1);
    }
    if (data.hasGenre && !completedSteps.includes(2)) {
      completeStep(2);
    }
    if (data.hasMelody && !completedSteps.includes(3)) {
      completeStep(3);
    }
    if (data.hasVoice && !completedSteps.includes(4)) {
      completeStep(4);
    }
    if (data.hasSettings && !completedSteps.includes(5)) {
      completeStep(5);
    }
  }, [lyrics, genre, style, tempo, selectedVoice, songLength, mood, completedSteps, completeStep]);

  const getAvailableGenres = () => {
    return ["Pop", "Rock", "Electronic", "Jazz", "Classical", "Hip-Hop", "Country", "R&B"];
  };

  const getUsageInfo = () => {
    if (!user) return null;
    const songsCreated = user.totalSongsCreated || 0;
    return `Songs created: ${songsCreated} (Unlimited)`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      completeStep(6); // Mark generation step as started
      
      await generateSong({
        lyrics: lyrics.trim(),
        style: style || "Upbeat",
        quality: "high",
        tempo: parseInt(tempo) || 120,
        duration: parseInt(songLength) || 30
      });

      // Song generation will trigger completion callback
      goToStep(7); // Move to download step
    } catch (error) {
      console.error("Song generation failed:", error);
    }
  };

  const getPlanBadgeColor = () => {
    return "bg-gradient-to-r from-green-400 to-green-600";
  };

  return (
    <div className="space-y-6">
      {/* Song Creation Status Bar */}
      <SongCreationStatusBar 
        currentStep={currentStep}
        completedSteps={completedSteps}
        songData={getSongData()}
      />

      {/* Example Track Player */}
      <ExampleTrackPlayer 
        onTryNow={() => {
          const lyricsInput = document.getElementById('lyrics');
          if (lyricsInput) {
            lyricsInput.focus();
            lyricsInput.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />

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
                  <SassyAIChat 
                    lyrics={lyrics}
                    onLyricsChange={setLyrics}
                  />
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

            {/* Step 2: Genre Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="genre">🎵 Choose Genre</Label>
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select your musical genre" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableGenres().map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tempo">🎶 Tempo (BPM)</Label>
                <Select value={tempo} onValueChange={setTempo}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Choose tempo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="80">80 BPM - Slow</SelectItem>
                    <SelectItem value="100">100 BPM - Moderate</SelectItem>
                    <SelectItem value="120">120 BPM - Standard</SelectItem>
                    <SelectItem value="140">140 BPM - Fast</SelectItem>
                    <SelectItem value="160">160 BPM - Very Fast</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Step 3: Melody & Style Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="style">🎼 Musical Style</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select musical style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Upbeat">Upbeat & Energetic</SelectItem>
                    <SelectItem value="Mellow">Mellow & Smooth</SelectItem>
                    <SelectItem value="Powerful">Powerful & Bold</SelectItem>
                    <SelectItem value="Emotional">Emotional & Deep</SelectItem>
                    <SelectItem value="Rhythmic">Rhythmic & Groovy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mood">😊 Emotional Mood</Label>
                <Select value={mood} onValueChange={setMood}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select emotional tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Happy">Happy & Uplifting</SelectItem>
                    <SelectItem value="Sad">Sad & Melancholic</SelectItem>
                    <SelectItem value="Romantic">Romantic & Tender</SelectItem>
                    <SelectItem value="Motivational">Motivational & Strong</SelectItem>
                    <SelectItem value="Nostalgic">Nostalgic & Reflective</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Step 4: Voice Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="voice">🎤 Choose Voice</Label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select vocal style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default-male">Default Male Voice</SelectItem>
                    <SelectItem value="default-female">Default Female Voice</SelectItem>
                    <SelectItem value="clone">Upload Voice Clone</SelectItem>
                    <SelectItem value="professional">Professional Studio Voice</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Voice Cloning Available</Label>
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <p className="text-purple-200 text-sm">
                    Upload your voice sample to create personalized vocals for any song
                  </p>
                </div>
              </div>
            </div>

            {/* Step 5: Final Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="length">⏱️ Song Length</Label>
                <Select value={songLength} onValueChange={setSongLength}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Choose duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 seconds - Quick Sample</SelectItem>
                    <SelectItem value="30">30 seconds - Standard</SelectItem>
                    <SelectItem value="60">1 minute - Extended</SelectItem>
                    <SelectItem value="120">2 minutes - Full Song</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Effects & Polish</Label>
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-green-200 text-sm">
                    All effects included: reverb, compression, EQ, and mastering
                  </p>
                </div>
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

            {/* Progress Display */}
            {isGenerating && (
              <GenerationProgress 
                generationProgress={generationProgress}
                generationStage={generationStage}
              />
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