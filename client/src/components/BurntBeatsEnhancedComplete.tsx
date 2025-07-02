import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, Download, Settings, Library, BarChart3, Users, GitBranch, Wand2, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

// Import enhanced components
import EnhancedSongFormWithDragDrop from './enhanced-song-form-with-drag-drop';
import EnhancedSassyAIChat from './enhanced-sassy-ai-chat';
import LogoSelector from './logo-selector';
import { useAuth } from '@/hooks/use-auth';

// Import existing components for other tabs
import SongLibrary from './song-library';
import AnalyticsDashboard from './analytics-dashboard';
import CollaborativeWorkspace from './collaborative-workspace';
import VersionControl from './version-control';
import MusicTheoryTools from './music-theory-tools';

export default function BurntBeatsEnhancedComplete() {
  // Authentication state
  const { user, logout } = useAuth();
  
  // Main app states
  const [activeTab, setActiveTab] = useState("create");
  const [selectedLogo, setSelectedLogo] = useState("/burnt-beats-logo.jpeg");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSong, setCurrentSong] = useState<any>(null);
  const [lyrics, setLyrics] = useState('');
  
  // Generated songs state
  const [songs, setSongs] = useState([
    { id: 1, title: "Burnt Nights", genre: "electronic", duration: "3:42", status: "completed", size: 4.2 },
    { id: 2, title: "Fire Dreams", genre: "pop", duration: "4:15", status: "completed", size: 5.8 },
    { id: 3, title: "Inferno Vibes", genre: "hip-hop", duration: "3:28", status: "completed", size: 3.9 },
  ]);

  // Handle song generation
  const handleSongGeneration = async (formData: any) => {
    setIsGenerating(true);
    
    try {
      // Simulate song generation process
      setTimeout(() => {
        const newSong = {
          id: Date.now(),
          title: formData.lyrics.split('\n')[0]?.substring(0, 20) || 'Untitled Song',
          genre: formData.genre,
          duration: `${Math.floor(formData.duration / 60)}:${(formData.duration % 60).toString().padStart(2, '0')}`,
          status: 'completed',
          size: Math.random() * 5 + 2 // Random size between 2-7 MB
        };
        
        setSongs(prev => [newSong, ...prev]);
        setCurrentSong(newSong);
        setIsGenerating(false);
      }, 3000);
    } catch (error) {
      console.error('Song generation failed:', error);
      setIsGenerating(false);
    }
  };

  // Get current pricing tier based on total file sizes
  const getTotalFileSize = () => {
    return songs.reduce((total, song) => total + song.size, 0);
  };

  const getPricingTier = (size: number) => {
    if (size < 9) return { name: 'Base Song', price: '$1.99', color: 'bg-blue-500' };
    if (size <= 20) return { name: 'Premium Song', price: '$4.99', color: 'bg-purple-500' };
    return { name: 'Ultra Song', price: '$8.99', color: 'bg-orange-500' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-green-900">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-2xl shadow-green-500/20 mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Logo Selector */}
                <LogoSelector
                  selectedLogo={selectedLogo}
                  onLogoChange={setSelectedLogo}
                />
                
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-green-400 bg-clip-text text-transparent">
                    Burnt Beats
                  </h1>
                  <p className="text-green-300/80">Create fire tracks with AI - Pay per download</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* User Info */}
                {user && (
                  <div className="text-right">
                    <p className="text-green-300 font-medium">{user.username}</p>
                    <p className="text-green-400/60 text-sm">Songs Created: {songs.length}</p>
                  </div>
                )}

                {/* Storage Info */}
                <Card className="bg-green-900/20 border-green-500/30 p-3">
                  <div className="text-center">
                    <p className="text-green-300 font-semibold text-sm">Total Size</p>
                    <p className="text-white text-lg">{getTotalFileSize().toFixed(1)} MB</p>
                    <Badge className={getPricingTier(getTotalFileSize()).color + " mt-1"}>
                      {getPricingTier(getTotalFileSize()).name}
                    </Badge>
                  </div>
                </Card>

                <Button
                  variant="ghost"
                  onClick={logout}
                  className="text-green-300 hover:text-green-100"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Enhanced Tab Navigation */}
          <TabsList className="grid w-full grid-cols-6 bg-black/60 border border-green-500/20 p-1">
            <TabsTrigger 
              value="create" 
              className="text-green-300 data-[state=active]:bg-green-500/30 data-[state=active]:text-white"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Create
            </TabsTrigger>
            <TabsTrigger 
              value="library" 
              className="text-green-300 data-[state=active]:bg-green-500/30 data-[state=active]:text-white"
            >
              <Library className="w-4 h-4 mr-2" />
              Library
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="text-green-300 data-[state=active]:bg-green-500/30 data-[state=active]:text-white"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="collaborate" 
              className="text-green-300 data-[state=active]:bg-green-500/30 data-[state=active]:text-white"
            >
              <Users className="w-4 h-4 mr-2" />
              Collaborate
            </TabsTrigger>
            <TabsTrigger 
              value="versions" 
              className="text-green-300 data-[state=active]:bg-green-500/30 data-[state=active]:text-white"
            >
              <GitBranch className="w-4 h-4 mr-2" />
              Versions
            </TabsTrigger>
            <TabsTrigger 
              value="tools" 
              className="text-green-300 data-[state=active]:bg-green-500/30 data-[state=active]:text-white"
            >
              <Settings className="w-4 h-4 mr-2" />
              Tools
            </TabsTrigger>
          </TabsList>

          {/* Song Creation Tab with Enhanced Features */}
          <TabsContent value="create" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Enhanced Song Form with Drag & Drop */}
              <div className="lg:col-span-2">
                <EnhancedSongFormWithDragDrop
                  onSubmit={handleSongGeneration}
                  isGenerating={isGenerating}
                />
              </div>

              {/* Enhanced Sassy AI Chat */}
              <div className="space-y-6">
                <EnhancedSassyAIChat
                  lyrics={lyrics}
                  onLyricsChange={setLyrics}
                  isGenerating={isGenerating}
                />

                {/* Current Song Preview */}
                {currentSong && (
                  <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30">
                    <CardHeader>
                      <CardTitle className="text-green-300">Latest Creation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="text-white font-semibold">{currentSong.title}</h3>
                        <p className="text-green-400/60 text-sm">
                          {currentSong.genre} • {currentSong.duration} • {currentSong.size.toFixed(1)} MB
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Play
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-green-500/30 text-green-300"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          {getPricingTier(currentSong.size).price}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Generation Progress */}
                {isGenerating && (
                  <Card className="bg-black/80 backdrop-blur-sm border border-orange-500/30">
                    <CardContent className="p-6">
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 mx-auto border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
                        <div>
                          <p className="text-white font-semibold">Generating Your Track...</p>
                          <p className="text-orange-400/60 text-sm">This might take a moment</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Song Library Tab */}
          <TabsContent value="library">
            <SongLibrary songs={songs} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>

          {/* Collaboration Tab */}
          <TabsContent value="collaborate">
            <CollaborativeWorkspace />
          </TabsContent>

          {/* Version Control Tab */}
          <TabsContent value="versions">
            <VersionControl />
          </TabsContent>

          {/* Music Theory Tools Tab */}
          <TabsContent value="tools">
            <MusicTheoryTools />
          </TabsContent>
        </Tabs>

        {/* Footer Stats */}
        <Card className="bg-black/60 border-green-500/20 mt-8">
          <CardContent className="p-4">
            <div className="flex justify-between items-center text-sm">
              <div className="flex gap-6">
                <div>
                  <span className="text-green-400/60">Total Songs:</span>
                  <span className="text-green-400 ml-2 font-semibold">{songs.length}</span>
                </div>
                <div>
                  <span className="text-green-400/60">Storage Used:</span>
                  <span className="text-green-400 ml-2 font-semibold">{getTotalFileSize().toFixed(1)} MB</span>
                </div>
                <div>
                  <span className="text-green-400/60">Active AI Chats:</span>
                  <span className="text-red-400 ml-2 font-semibold">1</span>
                </div>
              </div>
              <div className="text-green-400/60">
                🔥 Pay-per-download model • No monthly limits • Unlimited creation
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}