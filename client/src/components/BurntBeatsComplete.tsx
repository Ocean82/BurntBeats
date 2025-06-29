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
import { Mic, Play, Pause, Download, Share2, Heart, MoreHorizontal, Flame, Eye, EyeOff } from "lucide-react"

export default function BurntBeatsApp() {
  const [selectedLogo, setSelectedLogo] = useState("/logos/demon-logo.jpeg")
  const [showLogoSelector, setShowLogoSelector] = useState(false)
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
  const [lyrics, setLyrics] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [tempo, setTempo] = useState([120])
  const [duration, setDuration] = useState([180])
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSimpleMode, setIsSimpleMode] = useState(true)

  // Advanced features states
  const [totalFileSize, setTotalFileSize] = useState(0)
  const [exportFormat, setExportFormat] = useState("mp3")
  const [draggedFiles, setDraggedFiles] = useState<string[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [showMixer, setShowMixer] = useState(false)
  const [showAI, setShowAI] = useState(true)
  const [aiMessages, setAiMessages] = useState(["Oh look, another 'producer' who thinks they're the next Kanye... 🙄"])
  const [stems, setStems] = useState({
    vocals: { volume: 75, muted: false },
    drums: { volume: 80, muted: false },
    bass: { volume: 70, muted: false },
    melody: { volume: 85, muted: false },
  })

  // Sassy AI responses
  const sassyResponses = [
    "That beat is more basic than a pumpkin spice latte 🎃",
    "I've heard elevator music with more soul than this...",
    "Are you trying to make music or summon demons? Because this ain't it chief 😈",
    "Your lyrics are so fire... said no one ever 🔥❄️",
    "This track has less energy than a dead battery 🔋",
    "I'm not saying your music is bad, but my circuits are crying 🤖😭",
    "That melody is flatter than Earth according to conspiracy theorists 🌍",
    "Your tempo is slower than internet in 1995 📡",
    "This beat hits different... like a wet noodle 🍜",
    "I've analyzed 10 million songs, and this... this is definitely one of them 📊",
  ]

  // Mock file sizes for generated tracks
  const mockFileSizes = {
    "Burnt Nights": 4.2,
    "Fire Dreams": 5.8,
    "Inferno Vibes": 3.9,
    "Blazing Bars": 4.7,
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files).map((file) => file.name)
    setDraggedFiles([...draggedFiles, ...files])

    // Add sassy comment about dropped files
    const newMessage = sassyResponses[Math.floor(Math.random() * sassyResponses.length)]
    setAiMessages((prev) => [...prev, newMessage])
  }

  const addSassyComment = () => {
    const newMessage = sassyResponses[Math.floor(Math.random() * sassyResponses.length)]
    setAiMessages((prev) => [...prev, newMessage])
  }

  // Update the handleGenerate function to include file size calculation
  const handleGenerate = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      // Simulate adding file size
      const newSize = Math.random() * 3 + 2 // Random size between 2-5 MB
      setTotalFileSize((prev) => prev + newSize)

      // Add sassy comment about generation
      addSassyComment()
    }, 3000)
  }

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
    "Blues",
    "Folk",
    "Punk",
    "Metal",
    "Indie",
    "Alternative",
    "Ambient",
  ]

  const voiceTypes = [
    "Male Vocalist",
    "Female Vocalist",
    "Child Voice",
    "Elderly Voice",
    "Robotic",
    "Whisper",
    "Powerful",
    "Soft",
    "Raspy",
    "Smooth",
  ]

  const moods = [
    "Happy",
    "Sad",
    "Energetic",
    "Calm",
    "Romantic",
    "Aggressive",
    "Mysterious",
    "Uplifting",
    "Melancholic",
    "Dreamy",
  ]

  const logoOptions = [
    { id: "demon", src: "/logos/demon-logo.jpeg", name: "Demon Fire" },
    { id: "minimal", src: "/logos/minimal-logo.jpeg", name: "Minimal Dark" },
    { id: "neon", src: "/logos/neon-wolf.jpeg", name: "Neon Wolf" },
    { id: "musical", src: "/logos/musical-note.jpeg", name: "Musical Note" },
    { id: "watermark", src: "/logos/watermark.png", name: "Watermark" },
    { id: "headphone", src: "/logos/headphone-character.png", name: "DJ Character" },
    { id: "fire-girl", src: "/logos/fire-girl.jpeg", name: "Fire Girl" },
    { id: "cute-fox-1", src: "/logos/cute-fox-1.jpeg", name: "Cute Fox" },
    { id: "cute-fox-2", src: "/logos/cute-fox-2.jpeg", name: "Cute Fox Alt" },
  ]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showLogoSelector && !(event.target as Element).closest(".logo-selector")) {
        setShowLogoSelector(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showLogoSelector])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Simulate login
    setIsLoggedIn(true)
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    if (registerForm.password !== registerForm.confirmPassword) {
      alert("Passwords don't match!")
      return
    }
    // Simulate registration
    setIsLoggedIn(true)
  }

  // Login/Register Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-green-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-2xl shadow-green-500/20">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-r from-orange-500 to-red-500 shadow-lg shadow-orange-500/50">
                <img
                  src={selectedLogo || "/placeholder.svg"}
                  alt="Burnt Beats Logo"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-green-400 bg-clip-text text-transparent">
                Burnt Beats
              </h1>
            </div>
            <p className="text-green-300/80">Create fire tracks with AI</p>
          </CardHeader>
          <CardContent>
            <Tabs value={isLogin ? "login" : "register"} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-black/60 border border-green-500/20">
                <TabsTrigger
                  value="login"
                  onClick={() => setIsLogin(true)}
                  className="text-green-300 data-[state=active]:bg-green-500/30 data-[state=active]:text-white"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  onClick={() => setIsLogin(false)}
                  className="text-green-300 data-[state=active]:bg-green-500/30 data-[state=active]:text-white"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label className="text-green-300 mb-2 block">Email</Label>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      className="bg-black/60 border-green-500/30 text-green-100 placeholder:text-green-400/60 focus:border-green-400 focus:ring-green-400/20"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-green-300 mb-2 block">Password</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="bg-black/60 border-green-500/30 text-green-100 placeholder:text-green-400/60 focus:border-green-400 focus:ring-green-400/20 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 text-green-400/60 hover:text-green-300"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-green-500 hover:from-orange-600 hover:via-red-600 hover:to-green-600 text-white font-semibold shadow-lg shadow-green-500/30"
                  >
                    Login
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <Label className="text-green-300 mb-2 block">Username</Label>
                    <Input
                      type="text"
                      placeholder="Choose a username"
                      value={registerForm.username}
                      onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                      className="bg-black/60 border-green-500/30 text-green-100 placeholder:text-green-400/60 focus:border-green-400 focus:ring-green-400/20"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-green-300 mb-2 block">Email</Label>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      className="bg-black/60 border-green-500/30 text-green-100 placeholder:text-green-400/60 focus:border-green-400 focus:ring-green-400/20"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-green-300 mb-2 block">Password</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        className="bg-black/60 border-green-500/30 text-green-100 placeholder:text-green-400/60 focus:border-green-400 focus:ring-green-400/20 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 text-green-400/60 hover:text-green-300"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-green-300 mb-2 block">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                        className="bg-black/60 border-green-500/30 text-green-100 placeholder:text-green-400/60 focus:border-green-400 focus:ring-green-400/20 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 text-green-400/60 hover:text-green-300"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-green-500 hover:from-orange-600 hover:via-red-600 hover:to-green-600 text-white font-semibold shadow-lg shadow-green-500/30"
                  >
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <p className="text-green-400/60 text-sm">
                By signing up, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main Music Generation Interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-green-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className="w-10 h-10 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-green-400 hover:shadow-lg hover:shadow-green-400/50 transition-all"
                onClick={() => setShowLogoSelector(!showLogoSelector)}
              >
                <img
                  src={selectedLogo || "/placeholder.svg"}
                  alt="Burnt Beats Logo"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>

              {showLogoSelector && (
                <div className="logo-selector absolute top-12 left-0 bg-black/90 backdrop-blur-sm border border-green-500/30 rounded-lg p-4 z-50 min-w-[300px] shadow-2xl shadow-green-500/20">
                  <h3 className="text-green-300 font-semibold mb-3">Choose Your Logo</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {logoOptions.map((logo) => (
                      <div
                        key={logo.id}
                        className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          selectedLogo === logo.src
                            ? "border-green-400 ring-2 ring-green-400/50 shadow-lg shadow-green-400/30"
                            : "border-transparent hover:border-green-400/50"
                        }`}
                        onClick={() => {
                          setSelectedLogo(logo.src)
                          setShowLogoSelector(false)
                        }}
                      >
                        <img
                          src={logo.src || "/placeholder.svg"}
                          alt={logo.name}
                          className="w-full h-16 object-cover"
                        />
                        <div className="p-1 bg-black/80">
                          <p className="text-xs text-green-300 text-center truncate">{logo.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-green-400 bg-clip-text text-transparent">
              Burnt Beats
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-green-300/80 text-sm">
              Total: <span className="font-bold text-green-400 glow-text">{totalFileSize.toFixed(1)} MB</span>
            </div>
            <Button
              variant="outline"
              className="text-green-300 border-green-500/30 bg-black/40 hover:bg-green-500/10 hover:border-green-400"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              variant="outline"
              className="text-green-300 border-green-500/30 bg-black/40 hover:bg-green-500/10 hover:border-green-400"
            >
              <Heart className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button
              variant="outline"
              className="text-green-300 border-green-500/30 bg-black/40 hover:bg-green-500/10 hover:border-green-400"
              onClick={() => setIsLoggedIn(false)}
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Simple/Custom Mode Toggle */}
        <div className="flex items-center justify-end mb-4">
          <Label htmlFor="simple-mode" className="text-green-300 mr-2">
            Simple Mode
          </Label>
          <Switch id="simple-mode" checked={isSimpleMode} onCheckedChange={setIsSimpleMode} />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Input Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sassy AI Assistant */}
            <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-2xl shadow-green-500/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-green-300 flex items-center gap-2 text-lg">
                    <span className="animate-pulse">🤖</span>
                    <span className="bg-gradient-to-r from-red-400 via-orange-400 to-green-400 bg-clip-text text-transparent">
                      AI ROAST MASTER
                    </span>
                    <span className="animate-pulse">🔥</span>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAI(!showAI)}
                    className="text-green-300 hover:text-green-100"
                  >
                    {showAI ? "Hide" : "Show"}
                  </Button>
                </div>
              </CardHeader>
              {showAI && (
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {aiMessages.map((message, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-r from-red-900/40 via-black/60 to-green-900/40 border border-green-500/20 rounded-lg p-3 shadow-lg"
                      >
                        <p className="text-green-100 text-sm italic">{message}</p>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={addSassyComment}
                    className="w-full mt-4 bg-gradient-to-r from-red-500 via-orange-500 to-green-500 hover:from-red-600 hover:via-orange-600 hover:to-green-600 text-white font-semibold shadow-lg shadow-green-500/30"
                  >
                    Roast Me Again 🔥💀
                  </Button>
                </CardContent>
              )}
            </Card>

            <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10">
              <CardHeader>
                <CardTitle className="text-green-300 flex items-center gap-2">
                  <Mic className="w-5 h-5 text-orange-400" />
                  Create Your Fire Track
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs defaultValue="lyrics" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-black/60 border border-green-500/20">
                    <TabsTrigger
                      value="lyrics"
                      className="text-green-300 data-[state=active]:bg-green-500/30 data-[state=active]:text-white"
                    >
                      Write Lyrics
                    </TabsTrigger>
                    <TabsTrigger
                      value="description"
                      className="text-green-300 data-[state=active]:bg-green-500/30 data-[state=active]:text-white"
                    >
                      Describe Song
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="lyrics" className="space-y-4">
                    <div>
                      <Label className="text-green-300 mb-2 block">Song Lyrics</Label>
                      <Textarea
                        placeholder="Enter your fire lyrics here... 
                      
[Verse 1]
Burning up the night with these beats so hot
Every single bar hits like a lightning shot
...

[Chorus]
These burnt beats got me feeling alive
..."
                        value={lyrics}
                        onChange={(e) => setLyrics(e.target.value)}
                        className="min-h-[200px] bg-black/60 border-green-500/30 text-green-100 placeholder:text-green-400/60 resize-none focus:border-green-400 focus:ring-green-400/20"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="description" className="space-y-4">
                    <div>
                      <Label className="text-green-300 mb-2 block">Song Description</Label>
                      <Textarea
                        placeholder="Describe the fire track you want to create...

Example: 'A hard-hitting hip-hop track with heavy bass and aggressive vocals about overcoming challenges'"
                        className="min-h-[200px] bg-black/60 border-green-500/30 text-green-100 placeholder:text-green-400/60 resize-none focus:border-green-400 focus:ring-green-400/20"
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-green-300 mb-2 block">Track Title</Label>
                    <Input
                      placeholder="Enter track title..."
                      className="bg-black/60 border-green-500/30 text-green-100 placeholder:text-green-400/60 focus:border-green-400 focus:ring-green-400/20"
                    />
                  </div>
                  <div>
                    <Label className="text-green-300 mb-2 block">Artist Name</Label>
                    <Input
                      placeholder="Enter artist name..."
                      className="bg-black/60 border-green-500/30 text-green-100 placeholder:text-green-400/60 focus:border-green-400 focus:ring-green-400/20"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Drag & Drop Editor */}
            <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10">
              <CardHeader>
                <CardTitle className="text-green-300">Track Editor</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                    isDragOver
                      ? "border-green-400 bg-green-500/10 shadow-lg shadow-green-400/30"
                      : "border-green-500/30 hover:border-green-400/50"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="text-green-400/60 mb-4">
                    <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="text-lg text-green-300">Drop your tracks here to edit</p>
                    <p className="text-sm">Supports MP3, WAV, FLAC, and more</p>
                  </div>

                  {draggedFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-green-400 font-semibold">Loaded Files:</p>
                      {draggedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="bg-black/60 border border-green-500/20 rounded p-2 text-green-100 text-sm"
                        >
                          {file}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Waveform Visualization */}
                <div className="mt-6">
                  <Label className="text-green-300 mb-2 block">Waveform Preview</Label>
                  <div className="bg-black/80 border border-green-500/20 rounded-lg p-4 h-24 flex items-end justify-center gap-1">
                    {Array.from({ length: 50 }, (_, i) => (
                      <div
                        key={i}
                        className="bg-gradient-to-t from-green-500 via-orange-500 to-red-500 rounded-sm shadow-sm shadow-green-500/30"
                        style={{
                          height: `${Math.random() * 80 + 10}%`,
                          width: "3px",
                          opacity: 0.7 + Math.random() * 0.3,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Voice Synthesis */}
            <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10">
              <CardHeader>
                <CardTitle className="text-green-300">Voice Synthesis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-green-300 mb-2 block">Voice Type</Label>
                    <Select>
                      <SelectTrigger className="bg-black/60 border-green-500/30 text-green-100 focus:border-green-400 focus:ring-green-400/20">
                        <SelectValue placeholder="Select voice type" />
                      </SelectTrigger>
                      <SelectContent className="bg-black/90 border-green-500/30">
                        {voiceTypes.map((voice) => (
                          <SelectItem
                            key={voice}
                            value={voice.toLowerCase()}
                            className="text-green-100 focus:bg-green-500/20"
                          >
                            {voice}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-green-300 mb-2 block">Voice Clone</Label>
                    <Button
                      variant="outline"
                      className="w-full text-green-300 border-green-500/30 bg-black/40 hover:bg-green-500/10 hover:border-green-400"
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      Upload Voice Sample
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-green-300">Enable Voice Cloning</Label>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls Panel */}
          <div className="space-y-6">
            <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10">
              <CardHeader>
                <CardTitle className="text-green-300">Beat Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-green-300 mb-2 block">Export Format</Label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger className="bg-black/60 border-green-500/30 text-green-100 focus:border-green-400 focus:ring-green-400/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 border-green-500/30">
                      <SelectItem value="mp3" className="text-green-100 focus:bg-green-500/20">
                        MP3 (Smaller file)
                      </SelectItem>
                      <SelectItem value="wav" className="text-green-100 focus:bg-green-500/20">
                        WAV (High quality)
                      </SelectItem>
                      <SelectItem value="flac" className="text-green-100 focus:bg-green-500/20">
                        FLAC (Lossless)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-green-300 mb-2 block">Genre</Label>
                  <Select>
                    <SelectTrigger className="bg-black/60 border-green-500/30 text-green-100 focus:border-green-400 focus:ring-green-400/20">
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 border-green-500/30">
                      {genres.map((genre) => (
                        <SelectItem
                          key={genre}
                          value={genre.toLowerCase()}
                          className="text-green-100 focus:bg-green-500/20"
                        >
                          {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-green-300 mb-2 block">Mood</Label>
                  <Select>
                    <SelectTrigger className="bg-black/60 border-green-500/30 text-green-100 focus:border-green-400 focus:ring-green-400/20">
                      <SelectValue placeholder="Select mood" />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 border-green-500/30">
                      {moods.map((mood) => (
                        <SelectItem
                          key={mood}
                          value={mood.toLowerCase()}
                          className="text-green-100 focus:bg-green-500/20"
                        >
                          {mood}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-green-300 mb-3 block">
                    Tempo: <span className="text-green-400">{tempo[0]} BPM</span>
                  </Label>
                  <Slider value={tempo} onValueChange={setTempo} max={200} min={60} step={1} className="w-full" />
                </div>

                <div>
                  <Label className="text-green-300 mb-3 block">
                    Duration:{" "}
                    <span className="text-green-400">
                      {Math.floor(duration[0] / 60)}:{(duration[0] % 60).toString().padStart(2, "0")}
                    </span>
                  </Label>
                  <Slider
                    value={duration}
                    onValueChange={setDuration}
                    max={600}
                    min={30}
                    step={15}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-green-300">Instrumental</Label>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-green-300">Add Harmony</Label>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-green-300">Auto-Tune</Label>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-green-300">Stem Separation</Label>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Advanced Mixer */}
            <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-green-300">Advanced Mixer</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMixer(!showMixer)}
                    className="text-green-300 hover:text-green-100"
                  >
                    {showMixer ? "Hide" : "Show"}
                  </Button>
                </div>
              </CardHeader>
              {showMixer && (
                <CardContent className="space-y-4">
                  {Object.entries(stems).map(([stem, settings]) => (
                    <div key={stem} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-green-300 capitalize">{stem}</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setStems((prev) => ({
                              ...prev,
                              [stem]: { ...prev[stem], muted: !prev[stem].muted },
                            }))
                          }
                          className={`text-xs ${settings.muted ? "text-red-400" : "text-green-400"}`}
                        >
                          {settings.muted ? "MUTED" : "ON"}
                        </Button>
                      </div>
                      <Slider
                        value={[settings.volume]}
                        onValueChange={(value) =>
                          setStems((prev) => ({
                            ...prev,
                            [stem]: { ...prev[stem], volume: value[0] },
                          }))
                        }
                        max={100}
                        min={0}
                        step={1}
                        className="w-full"
                        disabled={settings.muted}
                      />
                      <div className="text-xs text-green-400/60">{settings.volume}%</div>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full h-12 bg-gradient-to-r from-orange-500 via-red-500 to-green-500 hover:from-orange-600 hover:via-red-600 hover:to-green-600 text-white font-semibold shadow-lg shadow-green-500/30"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Cooking Up Fire...
                </>
              ) : (
                <>
                  <Flame className="w-4 h-4 mr-2" />
                  Generate Fire Track
                </>
              )}
            </Button>
          </div>

          {/* Generated Results */}
          <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10">
            <CardHeader>
              <CardTitle className="text-green-300">Your Fire Tracks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {Object.entries(mockFileSizes).map(([title, size]) => (
                  <div
                    key={title}
                    className="flex items-center justify-between p-3 bg-black/60 border border-green-500/20 rounded-lg hover:border-green-400/40 transition-all"
                  >
                    <div>
                      <p className="text-green-100 font-medium">{title}</p>
                      <p className="text-green-400/60 text-sm">
                        {exportFormat.toUpperCase()} • {size} MB • 3:24
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-green-300 hover:text-green-100 hover:bg-green-500/10"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-green-300 hover:text-green-100 hover:bg-green-500/10"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-green-300 hover:text-green-100 hover:bg-green-500/10"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10">
            <CardHeader>
              <CardTitle className="text-green-300 text-sm">Session Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-400/60">Tracks Generated:</span>
                <span className="text-green-400">4</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-400/60">Total Duration:</span>
                <span className="text-green-400">14:32</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-400/60">Storage Used:</span>
                <span className="text-green-400">{totalFileSize.toFixed(1)} MB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-400/60">AI Roasts:</span>
                <span className="text-red-400">{aiMessages.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}