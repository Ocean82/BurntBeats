"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Music, Sparkles } from "lucide-react"

interface EnhancedSongFormProps {
  onSongGenerated: (songData: any) => void
  editingSong?: any
  user: any
  onUpgrade: () => void
}

export default function EnhancedSongForm({ onSongGenerated, editingSong, user, onUpgrade }: EnhancedSongFormProps) {
  const [formData, setFormData] = useState({
    title: editingSong?.title || "",
    lyrics: editingSong?.lyrics || "",
    genre: editingSong?.genre || "pop",
    mood: editingSong?.mood || "happy",
    tempo: editingSong?.tempo || [120],
    vocals: editingSong?.vocals || "male_lead",
    duration: editingSong?.duration || [180],
    creativity: [75],
    energy: [70],
  })

  const genres = [
    "Pop",
    "Rock",
    "Hip Hop",
    "Electronic",
    "Jazz",
    "Classical",
    "Country",
    "R&B",
    "Reggae",
    "Folk",
    "Blues",
    "Funk",
  ]

  const moods = [
    "Happy",
    "Sad",
    "Energetic",
    "Calm",
    "Romantic",
    "Mysterious",
    "Uplifting",
    "Dark",
    "Playful",
    "Intense",
    "Dreamy",
    "Peaceful",
  ]

  const vocals = ["Male Lead", "Female Lead", "Choir", "Rap", "Whisper", "Powerful", "Soft", "Auto-tuned", "No Vocals"]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const songData = {
      ...formData,
      tempo: formData.tempo[0],
      duration: formData.duration[0],
      creativity: formData.creativity[0],
      energy: formData.energy[0],
      userId: user.id,
      createdAt: new Date().toISOString(),
    }

    onSongGenerated(songData)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Music className="w-6 h-6 mr-2 text-purple-400" />
            {editingSong ? "Edit Song" : "Create New Song"}
          </CardTitle>
          <CardDescription className="text-gray-400">
            Use AI to transform your lyrics into professional music
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white/10">
                <TabsTrigger value="basic" className="text-white">
                  Basic Info
                </TabsTrigger>
                <TabsTrigger value="style" className="text-white">
                  Style & Mood
                </TabsTrigger>
                <TabsTrigger value="advanced" className="text-white">
                  Advanced
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-white">
                      Song Title
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter your song title..."
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="genre" className="text-white">
                      Genre
                    </Label>
                    <Select
                      value={formData.genre}
                      onValueChange={(value) => setFormData({ ...formData, genre: value })}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {genres.map((genre) => (
                          <SelectItem key={genre} value={genre.toLowerCase()}>
                            {genre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lyrics" className="text-white">
                    Lyrics
                  </Label>
                  <Textarea
                    id="lyrics"
                    value={formData.lyrics}
                    onChange={(e) => setFormData({ ...formData, lyrics: e.target.value })}
                    placeholder="Enter your lyrics here... Each line will be analyzed for melody generation."
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 min-h-32"
                    required
                  />
                  <p className="text-xs text-gray-400">
                    Tip: Use clear, emotional language for better melody generation
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="style" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Mood</Label>
                    <Select value={formData.mood} onValueChange={(value) => setFormData({ ...formData, mood: value })}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {moods.map((mood) => (
                          <SelectItem key={mood} value={mood.toLowerCase()}>
                            {mood}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Vocals</Label>
                    <Select
                      value={formData.vocals}
                      onValueChange={(value) => setFormData({ ...formData, vocals: value })}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {vocals.map((vocal) => (
                          <SelectItem key={vocal} value={vocal.toLowerCase().replace(" ", "_")}>
                            {vocal}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white flex items-center justify-between">
                      Tempo: {formData.tempo[0]} BPM
                      <Badge variant="secondary" className="text-xs">
                        {formData.tempo[0] < 90 ? "Slow" : formData.tempo[0] < 120 ? "Medium" : "Fast"}
                      </Badge>
                    </Label>
                    <Slider
                      value={formData.tempo}
                      onValueChange={(value) => setFormData({ ...formData, tempo: value })}
                      max={180}
                      min={60}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Energy Level: {formData.energy[0]}%</Label>
                    <Slider
                      value={formData.energy}
                      onValueChange={(value) => setFormData({ ...formData, energy: value })}
                      max={100}
                      min={0}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white">
                      Duration: {Math.floor(formData.duration[0] / 60)}:
                      {(formData.duration[0] % 60).toString().padStart(2, "0")}
                    </Label>
                    <Slider
                      value={formData.duration}
                      onValueChange={(value) => setFormData({ ...formData, duration: value })}
                      max={300}
                      min={30}
                      step={15}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">AI Creativity: {formData.creativity[0]}%</Label>
                    <Slider
                      value={formData.creativity}
                      onValueChange={(value) => setFormData({ ...formData, creativity: value })}
                      max={100}
                      min={0}
                      step={5}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-400">Higher creativity adds more unique musical elements</p>
                  </div>
                </div>

                {user.plan !== "pro" && (
                  <Card className="bg-yellow-500/10 border-yellow-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-5 h-5 text-yellow-400" />
                        <span className="text-yellow-200 font-medium">Pro Features Available</span>
                      </div>
                      <p className="text-yellow-200/80 text-sm mt-1">
                        Unlock voice cloning, longer songs, and advanced AI settings
                      </p>
                      <Button
                        type="button"
                        onClick={onUpgrade}
                        size="sm"
                        className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-black"
                      >
                        Upgrade Now
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium py-3"
              disabled={!formData.title || !formData.lyrics}
            >
              <Music className="w-5 h-5 mr-2" />
              {editingSong ? "Update Song" : "Generate Song"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
