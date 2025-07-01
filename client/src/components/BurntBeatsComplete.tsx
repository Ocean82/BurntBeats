"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mic, Play, Pause, Download, Share2, Heart, MoreHorizontal, Flame, Eye, EyeOff, Upload, Volume2, VolumeX, Settings, User, Music, Headphones } from "lucide-react"

export default function BurntBeatsComplete() {
  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loginForm, setLoginForm] = useState({ email: "", password: "" })
  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  // Music generation states
  const [songTitle, setSongTitle] = useState("")
  const [lyrics, setLyrics] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("pop")
  const [selectedVoice, setSelectedVoice] = useState("default")
  const [tempo, setTempo] = useState([120])
  const [duration, setDuration] = useState([180])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  // Voice cloning states
  const [voiceFile, setVoiceFile] = useState<File | null>(null)
  const [voiceName, setVoiceName] = useState("")
  const [isVoiceCloning, setIsVoiceCloning] = useState(false)
  const [voiceCloneProgress, setVoiceCloneProgress] = useState(0)
  const [clonedVoices, setClonedVoices] = useState<any[]>([])

  // UI states
  const [activeTab, setActiveTab] = useState("create")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedLogo, setSelectedLogo] = useState("/burnt-beats-logo.jpeg")
  const [showAI, setShowAI] = useState(true)
  const [aiMessages, setAiMessages] = useState(["Welcome to Burnt Beats! Ready to create some fire? 🔥"])

  // Advanced mixing states
  const [stems, setStems] = useState({
    vocals: { volume: 75, muted: false },
    drums: { volume: 80, muted: false },
    bass: { volume: 70, muted: false },
    melody: { volume: 85, muted: false },
  })

  // Available options
  const genres = [
    { value: "pop", label: "Pop" },
    { value: "rock", label: "Rock" },
    { value: "jazz", label: "Jazz" },
    { value: "electronic", label: "Electronic" },
    { value: "classical", label: "Classical" },
    { value: "hip-hop", label: "Hip-Hop" },
    { value: "country", label: "Country" },
    { value: "r&b", label: "R&B" }
  ]

  const voiceStyles = [
    { value: "default", label: "Default Voice" },
    { value: "smooth", label: "Smooth" },
    { value: "powerful", label: "Powerful" },
    { value: "melodic", label: "Melodic" },
    { value: "raspy", label: "Raspy" }
  ]

  // Mock generated songs
  const [generatedSongs, setGeneratedSongs] = useState([
    { id: 1, title: "Midnight Vibes", genre: "pop", duration: "3:24", status: "completed" },
    { id: 2, title: "Electric Dreams", genre: "electronic", duration: "4:12", status: "completed" },
    { id: 3, title: "Country Roads", genre: "country", duration: "3:45", status: "completed" }
  ])

  // Sassy AI responses
  const sassyResponses = [
    "That beat is more basic than a pumpkin spice latte 🎃",
    "I've heard elevator music with more soul than this...",
    "Are you trying to make music or summon demons? Because this ain't it chief 😈",
    "Your lyrics are so fire... said no one ever 🔥❄️",
    "This track has less energy than a dead battery 🔋",
    "I'm not saying your music is bad, but my circuits are crying 🤖😭"
  ]

  // Handle login/register
  const handleAuth = () => {
    if (isLogin) {
      if (loginForm.email && loginForm.password) {
        setIsLoggedIn(true)
        addAIMessage("Welcome back! Ready to make some beats? 🎵")
      }
    } else {
      if (registerForm.username && registerForm.email && registerForm.password && registerForm.password === registerForm.confirmPassword) {
        setIsLoggedIn(true)
        addAIMessage("Welcome to Burnt Beats! Let's create something amazing! 🚀")
      }
    }
  }

  // Handle song generation
  const handleGenerateSong = async () => {
    if (!songTitle || !lyrics) {
      addAIMessage("Hold up! You need a title and lyrics before we can cook up some magic ✨")
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)

    // Simulate generation progress
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          setIsGenerating(false)

          // Add new song to library
          const newSong = {
            id: Date.now(),
            title: songTitle,
            genre: selectedGenre,
            duration: `${Math.floor(duration[0] / 60)}:${(duration[0] % 60).toString().padStart(2, '0')}`,
            status: "completed"
          }
          setGeneratedSongs(prev => [newSong, ...prev])

          addAIMessage("🔥 Song generated! That's actually not terrible... I'm impressed!")
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 500)
  }

  // Handle voice cloning
  const handleVoiceClone = async () => {
    if (!voiceFile || !voiceName) {
      addAIMessage("Upload a voice sample and give it a name, genius! 🎤")
      return
    }

    setIsVoiceCloning(true)
    setVoiceCloneProgress(0)

    // Simulate cloning progress
    const progressInterval = setInterval(() => {
      setVoiceCloneProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          setIsVoiceCloning(false)

          // Add cloned voice
          const newVoice = {
            id: Date.now(),
            name: voiceName,
            file: voiceFile.name,
            quality: Math.floor(Math.random() * 20) + 80
          }
          setClonedVoices(prev => [...prev, newVoice])

          setVoiceFile(null)
          setVoiceName("")
          addAIMessage("Voice cloned successfully! Now you can sound terrible in multiple ways! 😏")
          return 100
        }
        return prev + Math.random() * 12
      })
    }, 600)
  }

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setVoiceFile(file)
      addAIMessage("Voice sample uploaded! Let's see what we're working with... 🎧")
    }
  }

  // Add AI message
  const addAIMessage = (message: string) => {
    setAiMessages(prev => [...prev, message])
  }

  // Handle stem volume changes
  const handleStemVolumeChange = (stem: string, value: number[]) => {
    setStems(prev => ({
      ...prev,
      [stem]: { ...prev[stem as keyof typeof prev], volume: value[0] }
    }))
  }

  // Handle stem mute
  const handleStemMute = (stem: string) => {
    setStems(prev => ({
      ...prev,
      [stem]: { ...prev, [stem]: { ...prev[stem as keyof typeof prev], muted: !prev[stem as keyof typeof prev].muted } } as typeof prev
    }))
  }

  // Login/Register Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800/90 border-purple-500/20 backdrop-blur">
          <CardHeader className="text-center">
            <img 
              src={selectedLogo} 
              alt="Burnt Beats" 
              className="w-20 h-20 mx-auto mb-4 rounded-full"
            />
            <CardTitle className="text-2xl font-bold text-white">
              {isLogin ? "Welcome Back" : "Join Burnt Beats"}
            </CardTitle>
            <p className="text-gray-400">
              {isLogin ? "Sign in to create amazing music" : "Create your account and start making beats"}
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, username: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={isLogin ? loginForm.email : registerForm.email}
                onChange={(e) => {
                  if (isLogin) {
                    setLoginForm(prev => ({ ...prev, email: e.target.value }))
                  } else {
                    setRegisterForm(prev => ({ ...prev, email: e.target.value }))
                  }
                }}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={isLogin ? loginForm.password : registerForm.password}
                  onChange={(e) => {
                    if (isLogin) {
                      setLoginForm(prev => ({ ...prev, password: e.target.value }))
                    } else {
                      setRegisterForm(prev => ({ ...prev, password: e.target.value }))
                    }
                  }}
                  className="bg-gray-700 border-gray-600 text-white pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            <Button 
              onClick={handleAuth}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isLogin ? "Sign In" : "Create Account"}
            </Button>

            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => setIsLogin(!isLogin)}
                className="text-purple-400 hover:text-purple-300"
              >
                {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main App Interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={selectedLogo} alt="Burnt Beats" className="w-10 h-10 rounded-full" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Burnt Beats
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsLoggedIn(false)}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800 mb-6">
            <TabsTrigger value="create" className="text-white">Create</TabsTrigger>
            <TabsTrigger value="voices" className="text-white">Voices</TabsTrigger>
            <TabsTrigger value="library" className="text-white">Library</TabsTrigger>
            <TabsTrigger value="mixer" className="text-white">Mixer</TabsTrigger>
          </TabsList>

          {/* Create Tab */}
          <TabsContent value="create">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Song Creation Form */}
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Music className="w-5 h-5 text-purple-400" />
                      Create Your Track
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Song Title</Label>
                        <Input
                          placeholder="Enter song title"
                          value={songTitle}
                          onChange={(e) => setSongTitle(e.target.value)}
                          className="bg-gray-700 border-gray-600"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Genre</Label>
                        <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                          <SelectTrigger className="bg-gray-700 border-gray-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {genres.map(genre => (
                              <SelectItem key={genre.value} value={genre.value}>
                                {genre.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Voice Style</Label>
                      <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                        <SelectTrigger className="bg-gray-700 border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {voiceStyles.map(voice => (
                            <SelectItem key={voice.value} value={voice.value}>
                              {voice.label}
                            </SelectItem>
                          ))}
                          {clonedVoices.map(voice => (
                            <SelectItem key={voice.id} value={voice.id.toString()}>
                              {voice.name} (Cloned)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Lyrics</Label>
                      <Textarea
                        placeholder="Write your lyrics here..."
                        value={lyrics}
                        onChange={(e) => setLyrics(e.target.value)}
                        className="bg-gray-700 border-gray-600 min-h-32"
                      />
                    </div>

                    {/* Advanced Controls */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Advanced Settings</Label>
                        <Switch
                          checked={showAdvanced}
                          onCheckedChange={setShowAdvanced}
                        />
                      </div>

                      {showAdvanced && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-700/30 rounded-lg">
                          <div className="space-y-2">
                            <Label>Tempo: {tempo[0]} BPM</Label>
                            <Slider
                              value={tempo}
                              onValueChange={setTempo}
                              max={200}
                              min={60}
                              step={1}
                              className="w-full"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Duration: {Math.floor(duration[0] / 60)}:{(duration[0] % 60).toString().padStart(2, '0')}</Label>
                            <Slider
                              value={duration}
                              onValueChange={setDuration}
                              max={300}
                              min={30}
                              step={15}
                              className="w-full"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Generation Progress */}
                    {isGenerating && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Generating your track...</Label>
                          <span className="text-sm text-gray-400">{Math.round(generationProgress)}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${generationProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <Button 
                      onClick={handleGenerateSong}
                      disabled={isGenerating}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      <Flame className="w-4 h-4 mr-2" />
                      {isGenerating ? "Generating..." : "Generate Track"}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* AI Chat Sidebar */}
              <div className="space-y-6">
                {showAI && (
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>AI Assistant</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAI(false)}
                        >
                          ×
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {aiMessages.map((message, index) => (
                          <div key={index} className="p-3 bg-gray-700/50 rounded-lg text-sm">
                            {message}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Voice Cloning Tab */}
          <TabsContent value="voices">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="w-5 h-5 text-purple-400" />
                    Clone Your Voice
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Voice Sample</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="audio/*"
                        onChange={handleFileUpload}
                        className="bg-gray-700 border-gray-600"
                      />
                      <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
                    {voiceFile && (
                      <p className="text-sm text-green-400">
                        Uploaded: {voiceFile.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Voice Name</Label>
                    <Input
                      placeholder="Name your voice clone"
                      value={voiceName}
                      onChange={(e) => setVoiceName(e.target.value)}
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>

                  {isVoiceCloning && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Cloning voice...</Label>
                        <span className="text-sm text-gray-400">{Math.round(voiceCloneProgress)}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${voiceCloneProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={handleVoiceClone}
                    disabled={isVoiceCloning}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {isVoiceCloning ? "Cloning..." : "Clone Voice"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle>Your Voice Library</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {clonedVoices.length === 0 ? (
                      <p className="text-gray-400 text-center py-8">
                        No cloned voices yet. Upload a sample to get started!
                      </p>
                    ) : (
                      clonedVoices.map(voice => (
                        <div key={voice.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                          <div>
                            <h4 className="font-medium">{voice.name}</h4>
                            <p className="text-sm text-gray-400">Quality: {voice.quality}%</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Play className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Library Tab */}
          <TabsContent value="library">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-purple-400" />
                  Your Music Library
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {generatedSongs.map(song => (
                    <div key={song.id} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsPlaying(!isPlaying)}
                        >
                          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        </Button>
                        <div>
                          <h4 className="font-medium">{song.title}</h4>
                          <p className="text-sm text-gray-400">{song.genre} • {song.duration}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Heart className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {generatedSongs.length === 0 && (
                    <p className="text-gray-400 text-center py-8">
                      No songs yet. Create your first track to get started!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mixer Tab */}
          <TabsContent value="mixer">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-400" />
                  Advanced Mixer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Object.entries(stems).map(([stem, settings]) => (
                    <div key={stem} className="space-y-4 p-4 bg-gray-700/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium capitalize">{stem}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStemMute(stem)}
                        >
                          {settings.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label>Volume: {settings.volume}%</Label>
                        <Slider
                          value={[settings.volume]}
                          onValueChange={(value) => handleStemVolumeChange(stem, value)}
                          max={100}
                          min={0}
                          step={1}
                          className="w-full"
                          disabled={settings.muted}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}