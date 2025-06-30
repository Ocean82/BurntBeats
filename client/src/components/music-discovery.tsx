"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Pause, Heart, Share2, Trophy, Fire, Music, Search, ArrowLeft } from "lucide-react"

export default function MusicDiscovery() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("trending")
  const [playingTrack, setPlayingTrack] = useState<string | null>(null)

  // Mock trending tracks data
  const trendingTracks = [
    {
      id: "1",
      title: "Midnight Inferno",
      artist: "BeatMaster3000",
      genre: "Electronic",
      plays: 125000,
      likes: 8500,
      duration: "3:45",
      thumbnail: "/placeholder.svg",
      isHot: true
    },
    {
      id: "2", 
      title: "Street Symphony",
      artist: "UrbanVibes",
      genre: "Hip Hop",
      plays: 98000,
      likes: 7200,
      duration: "4:12",
      thumbnail: "/placeholder.svg",
      isHot: true
    },
    {
      id: "3",
      title: "Neon Dreams",
      artist: "SynthWave_King",
      genre: "Synthwave",
      plays: 87000,
      likes: 6800,
      duration: "3:28",
      thumbnail: "/placeholder.svg",
      isHot: false
    },
    {
      id: "4",
      title: "Fire Storm",
      artist: "RockLegend99",
      genre: "Rock",
      plays: 76000,
      likes: 5900,
      duration: "4:33",
      thumbnail: "/placeholder.svg",
      isHot: true
    },
    {
      id: "5",
      title: "Digital Sunset",
      artist: "ChillBeats",
      genre: "Ambient",
      plays: 65000,
      likes: 4500,
      duration: "5:15",
      thumbnail: "/placeholder.svg",
      isHot: false
    }
  ]

  const topProducers = [
    { name: "BeatMaster3000", totalPlays: 2500000, tracks: 45, badge: "🔥 Fire Producer" },
    { name: "UrbanVibes", totalPlays: 1800000, tracks: 32, badge: "🎵 Rising Star" },
    { name: "SynthWave_King", totalPlays: 1200000, tracks: 28, badge: "⚡ Electronic Wizard" },
    { name: "RockLegend99", totalPlays: 950000, tracks: 38, badge: "🎸 Rock God" },
    { name: "ChillBeats", totalPlays: 750000, tracks: 22, badge: "🌙 Ambient Master" }
  ]

  const battleArena = [
    {
      id: "battle1",
      title: "🔥 FIRE VS ICE BATTLE 🧊",
      track1: { title: "Blazing Inferno", artist: "HeatWave", votes: 847 },
      track2: { title: "Frozen Beats", artist: "IceCold", votes: 923 },
      timeLeft: "2h 15m",
      isActive: true
    },
    {
      id: "battle2", 
      title: "⚡ ELECTRONIC SHOWDOWN ⚡",
      track1: { title: "Digital Storm", artist: "TechnoKing", votes: 1205 },
      track2: { title: "Cyber Dreams", artist: "ByteBeats", votes: 1189 },
      timeLeft: "45m",
      isActive: true
    },
    {
      id: "battle3",
      title: "🎤 RAP BATTLE ROYALE 👑",
      track1: { title: "Street Crown", artist: "UrbanLegend", votes: 2134 },
      track2: { title: "Concrete Jungle", artist: "CityBeats", votes: 1987 },
      timeLeft: "1h 32m",
      isActive: true
    }
  ]

  const handlePlayTrack = (trackId: string) => {
    setPlayingTrack(playingTrack === trackId ? null : trackId)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-green-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-green-300 hover:text-green-100"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Studio
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
                🏆 THE ARENA 🏆
              </h1>
              <p className="text-green-300/80">Discover fire tracks • Battle for supremacy • Claim your throne</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400/60" />
              <Input
                placeholder="Search tracks, artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-black/60 border-green-500/30 text-green-100 placeholder:text-green-400/60 focus:border-green-400 focus:ring-green-400/20"
              />
            </div>
          </div>
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-black/60 border border-green-500/20 mb-8">
            <TabsTrigger 
              value="trending" 
              className="text-green-300 data-[state=active]:bg-green-500/30 data-[state=active]:text-white"
            >
              🔥 Trending
            </TabsTrigger>
            <TabsTrigger 
              value="battles" 
              className="text-green-300 data-[state=active]:bg-purple-500/30 data-[state=active]:text-white"
            >
              ⚔️ Battles
            </TabsTrigger>
            <TabsTrigger 
              value="leaderboard" 
              className="text-green-300 data-[state=active]:bg-yellow-500/30 data-[state=active]:text-white"
            >
              👑 Leaderboard
            </TabsTrigger>
            <TabsTrigger 
              value="fresh" 
              className="text-green-300 data-[state=active]:bg-blue-500/30 data-[state=active]:text-white"
            >
              ✨ Fresh Drops
            </TabsTrigger>
          </TabsList>

          {/* Trending Tracks */}
          <TabsContent value="trending" className="space-y-6">
            <div className="grid gap-4">
              {trendingTracks.map((track, index) => (
                <Card key={track.id} className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10 hover:shadow-green-500/20 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 via-red-500 to-green-500 rounded-lg shadow-lg flex items-center justify-center">
                            <Music className="w-8 h-8 text-white" />
                          </div>
                          {track.isHot && (
                            <div className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 animate-pulse">
                              <Fire className="w-3 h-3 text-white" />
                            </div>
                          )}
                          <div className="absolute -top-2 -left-2 bg-green-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                            #{index + 1}
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-green-100 font-bold text-lg">{track.title}</h3>
                            {track.isHot && <Badge className="bg-red-500/20 text-red-400 border-red-500/30">🔥 HOT</Badge>}
                          </div>
                          <p className="text-green-300/80 mb-2">by {track.artist}</p>
                          <div className="flex items-center gap-4 text-sm text-green-400/60">
                            <span>🎵 {track.genre}</span>
                            <span>▶️ {formatNumber(track.plays)} plays</span>
                            <span>❤️ {formatNumber(track.likes)} likes</span>
                            <span>⏱️ {track.duration}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-300 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Heart className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-300 hover:text-blue-400 hover:bg-blue-500/10"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handlePlayTrack(track.id)}
                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                        >
                          {playingTrack === track.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Battle Arena */}
          <TabsContent value="battles" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-red-400 mb-2">⚔️ BATTLE ARENA ⚔️</h2>
              <p className="text-green-300/80">Vote for your favorite tracks and watch the battles unfold!</p>
            </div>
            
            <div className="grid gap-6">
              {battleArena.map((battle) => (
                <Card key={battle.id} className="bg-black/80 backdrop-blur-sm border border-red-500/30 shadow-2xl shadow-red-500/20">
                  <CardHeader>
                    <CardTitle className="text-center text-red-400 text-xl">{battle.title}</CardTitle>
                    <div className="text-center text-green-300/80">
                      🕐 Time remaining: <span className="font-bold text-yellow-400">{battle.timeLeft}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Track 1 */}
                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-red-900/40 to-orange-900/40 border border-red-500/30 rounded-lg p-4">
                          <h4 className="text-red-300 font-bold text-lg mb-1">{battle.track1.title}</h4>
                          <p className="text-red-200/80 mb-3">by {battle.track1.artist}</p>
                          <div className="flex items-center justify-between">
                            <div className="text-red-400 font-bold text-xl">
                              🔥 {battle.track1.votes} votes
                            </div>
                            <Button className="bg-red-500 hover:bg-red-600 text-white">
                              Vote Fire 🔥
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* VS Divider */}
                      <div className="hidden md:flex items-center justify-center">
                        <div className="text-4xl font-bold text-purple-400 animate-pulse">VS</div>
                      </div>
                      
                      {/* Track 2 */}
                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-500/30 rounded-lg p-4">
                          <h4 className="text-blue-300 font-bold text-lg mb-1">{battle.track2.title}</h4>
                          <p className="text-blue-200/80 mb-3">by {battle.track2.artist}</p>
                          <div className="flex items-center justify-between">
                            <div className="text-blue-400 font-bold text-xl">
                              🧊 {battle.track2.votes} votes
                            </div>
                            <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                              Vote Ice 🧊
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Battle Progress Bar */}
                    <div className="mt-6">
                      <div className="bg-black/60 rounded-full h-4 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-red-500 to-orange-500 h-full transition-all duration-500"
                          style={{ 
                            width: `${(battle.track1.votes / (battle.track1.votes + battle.track2.votes)) * 100}%` 
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-2 text-sm text-green-300/60">
                        <span>{battle.track1.artist}</span>
                        <span>{battle.track2.artist}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Leaderboard */}
          <TabsContent value="leaderboard" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-yellow-400 mb-2">👑 TOP PRODUCERS 👑</h2>
              <p className="text-green-300/80">The legends who rule the arena</p>
            </div>
            
            <div className="grid gap-4">
              {topProducers.map((producer, index) => (
                <Card key={producer.name} className="bg-black/80 backdrop-blur-sm border border-yellow-500/30 shadow-xl shadow-yellow-500/10">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className={`w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-2xl font-bold ${
                            index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900' :
                            index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-gray-900' :
                            index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-orange-900' :
                            'bg-gradient-to-br from-green-500 to-green-700 text-green-100'
                          }`}>
                            #{index + 1}
                          </div>
                          {index < 3 && (
                            <div className="absolute -top-2 -right-2">
                              <Trophy className={`w-6 h-6 ${
                                index === 0 ? 'text-yellow-400' :
                                index === 1 ? 'text-gray-400' :
                                'text-orange-400'
                              }`} />
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <h3 className="text-green-100 font-bold text-lg">{producer.name}</h3>
                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 mb-2">
                            {producer.badge}
                          </Badge>
                          <div className="flex items-center gap-4 text-sm text-green-400/60">
                            <span>🎵 {producer.tracks} tracks</span>
                            <span>▶️ {formatNumber(producer.totalPlays)} total plays</span>
                          </div>
                        </div>
                      </div>
                      
                      <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                        Follow
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Fresh Drops */}
          <TabsContent value="fresh" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-blue-400 mb-2">✨ FRESH DROPS ✨</h2>
              <p className="text-green-300/80">Brand new fire tracks from the community</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingTracks.slice(0, 6).map((track) => (
                <Card key={track.id} className="bg-black/80 backdrop-blur-sm border border-blue-500/30 shadow-xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all">
                  <CardContent className="p-4">
                    <div className="w-full h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-lg mb-4 flex items-center justify-center">
                      <Music className="w-12 h-12 text-white" />
                    </div>
                    <h3 className="text-green-100 font-bold mb-1">{track.title}</h3>
                    <p className="text-green-300/80 text-sm mb-3">by {track.artist}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-green-400/60">
                        <div>🎵 {track.genre}</div>
                        <div>⏱️ {track.duration}</div>
                      </div>
                      <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
                        <Play className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}