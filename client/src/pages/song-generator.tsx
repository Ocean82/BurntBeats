import React, { useState, useCallback, useMemo } from "react";
import Sidebar from "@/components/sidebar";
import SongForm from "@/components/song-form";
import AudioPlayer from "@/components/audio-player";
import GenerationProgress from "@/components/generation-progress";
import DownloadOptions from "@/components/download-options";
import SongEditor from "@/components/song-editor";
import SongLibrary from "@/components/song-library";
import AnalyticsDashboard from "@/components/analytics-dashboard";
import VersionControl from "@/components/version-control";
import CollaborationTools from "@/components/collaboration-tools";
import MusicTheoryTools from "@/components/music-theory-tools";
import SocialFeatures from "@/components/social-features";
import StripeTieredCheckout from "@/components/stripe-tiered-checkout";
import { WatermarkNotice } from "@/components/watermark-indicator";
import VoiceRecorder from "@/components/voice-recorder";
import AdvancedVoiceCloning from "@/components/advanced-voice-cloning";
import EnhancedTextToSpeech from "@/components/enhanced-text-to-speech";
import PricingPlans from "@/components/pricing-plans";
import SizeBasedCheckout from "@/components/size-based-checkout";
import SassyAIChat from "@/components/sassy-ai-chat";
import StyleReferenceUpload from "@/components/style-reference-upload";
import MusicTheoryUpload from "@/components/music-theory-upload";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Music, HelpCircle, Settings, User, Crown, LogOut, Download } from "lucide-react";
import type { Song } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { useSongGeneration } from "@/hooks/use-song-generation";
import { useMainContent } from "@/hooks/use-main-content";
import { useSteps } from "@/hooks/use-steps";
import { useMenuState } from "@/hooks/use-menu-state";
import MusicAnalyticsVisualizer from "@/components/music-analytics-visualizer"; // Added import

interface SongGeneratorProps {
  user: {
    id?: number;
    username?: string;
    plan?: 'free' | 'basic' | 'pro' | 'enterprise';
    songsThisMonth?: number;
  };
  onUpgrade: () => void;
  onLogout: () => void;
}

export default function SongGenerator({ user, onLogout }: SongGeneratorProps) {
  const [generatingSong, setGeneratingSong] = useState<Song | null>(null);
  const [completedSong, setCompletedSong] = useState<Song | null>(null);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  // Use custom hooks for state management
  const { currentStep, setCurrentStep, steps, goToStep, resetSteps } = useSteps({
    initialStep: 1,
    persistKey: 'songGenerator'
  });

  const { activeMenu, setActiveMenu, clearMenuState } = useMenuState("New Song");

  // No plans needed - everyone can create, pay only for downloads

  const handleSongGenerated = (song: Song) => {
    setGeneratingSong(song);
  };

  const handleGenerationComplete = (song: Song) => {
    setGeneratingSong(null);
    setCompletedSong(song);
    setCurrentStep(3);
  };

  const handleSongUpdated = (song: Song) => {
    setCompletedSong(song);
  };

  const handleMenuClick = (menuKey: string) => {
    switch (menuKey) {
      case "new-song":
        setActiveMenu("New Song");
        resetSteps();
        setGeneratingSong(null);
        setCompletedSong(null);
        setEditingSong(null);
        break;
      case "library":
        setActiveMenu("Song Library");
        break;
      case "recent":
        setActiveMenu("Recent Creations");
        break;
      case "voice":
        setActiveMenu("Voice Samples");
        break;
      case "voice-cloning":
        setActiveMenu("Voice Cloning");
        break;
      case "text-to-speech":
        setActiveMenu("Text-to-Speech");
        break;
      case "analytics":
        setActiveMenu("Analytics");
        break;
      case "version":
        setActiveMenu("Version Control");
        break;
      case "collaboration":
        setActiveMenu("Collaboration");
        break;
      case "theory":
        setActiveMenu("Music Theory");
        break;
      case "social":
        setActiveMenu("Social Hub");
        break;
      case "ai-chat":
        setActiveMenu("AI Chat");
        break;
      case "downloads":
        setActiveMenu("Downloads");
        break;
      case "pricing":
        setActiveMenu("Pricing");
        break;
      case "insights":
        setActiveMenu("Insights"); //Added menu
        break;
    }
  };

  const handleEditSong = (song: Song) => {
    setEditingSong(song);
    setCompletedSong(song); // Ensure the song is available for player
    setActiveMenu("Song Editor");

    // Force step 3 to ensure player/edit UI is visible
    goToStep(3);
  };



  const renderUpgradePrompt = (title: string, description: string, requiredPlan: string, price: string) => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-400 mb-4">{description}</p>
        <Button onClick={onUpgrade} className="bg-yellow-500 hover:bg-yellow-600">
          Upgrade to {requiredPlan} - {price}
        </Button>
      </div>
    </div>
  );

  const renderMainContent = () => {
    switch (activeMenu) {
      case "Song Library":
        return <SongLibrary userId={user?.id || 1} onEditSong={handleEditSong} />;
      case "Recent Creations":
        return <SongLibrary userId={user?.id || 1} onEditSong={handleEditSong} />;
      case "Voice Samples":
        return <VoiceRecorder userId={user?.id || 1} />;
      case "Voice Cloning":
        return <AdvancedVoiceCloning userId={user?.id || 1} />;
      case "Text-to-Speech":
        return <EnhancedTextToSpeech userId={user?.id || 1} />;
      case "Analytics":
        return <AnalyticsDashboard />;
      case "Version Control":
        return completedSong ? (
          <VersionControl song={completedSong} />
        ) : (
          <div className="text-center text-gray-400">No songs available for version control</div>
        );
      case "Collaboration":
        return completedSong && user?.id && user?.username ? (
          <CollaborativeWorkspace 
            song={completedSong} 
            currentUser={{ id: user.id, username: user.username }} 
            onSongUpdate={handleSongUpdated} 
          />
        ) : (
          <div className="text-center text-gray-400">No songs available for collaboration</div>
        );
      case "Music Theory":
        return <MusicTheoryTools />;
      case "Social Hub":
        return <SocialFeatures userId={user?.id || 1} />;
      case "Downloads":
        return completedSong ? (
          <StripeTieredCheckout 
            songId={completedSong.id.toString()}
            songTitle={completedSong.title}
            onPurchaseComplete={(tier) => {
              console.log(`Purchased ${tier} tier for song: ${completedSong.title}`);
              toast({
                title: "Purchase Successful!",
                description: `Your ${tier} quality download will be available shortly.`,
              });
            }}
          />
        ) : (
          <div className="text-center text-gray-400">No songs available for download</div>
        );
      case "Song Editor":
        return editingSong ? (
          <SongEditor song={editingSong} onSongUpdated={handleSongUpdated} />
        ) : (
          <div className="text-center text-gray-400">No song selected for editing</div>
        );
      case "Pricing":
        return <StripeTieredCheckout songId="demo" songTitle="Choose Your Plan" />;
      case "Insights":
        return completedSong ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AudioPlayer
              song={completedSong}
              autoPlay={false}
              className="lg:col-span-1"
            />
            <MusicAnalyticsVisualizer
              song={completedSong}
              className="lg:col-span-1"
            />
          </div>
        ) : (
          <div className="text-center text-gray-400">No song selected for analysis</div>
        );
      default:
        return (
          <div className="h-full p-8 overflow-auto">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-3xl font-bold text-white">Create Your Next Hit</h1>
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline" className="text-green-400 border-green-400">
                      All Features Unlocked
                    </Badge>
                    <Button onClick={() => setActiveMenu("Downloads")} className="bg-gradient-to-r from-green-400 to-green-600">
                      <Download className="w-4 h-4 mr-2" />
                      Download Options
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-8">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 ${
                          step.active 
                            ? 'bg-spotify-green text-white' 
                            : step.completed 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }`}
                        onClick={() => goToStep(step.id)}
                        title={step.description}
                      >
                        {step.id}
                      </div>
                      <div className="ml-3">
                        <span className={`block ${step.active ? 'text-white' : 'text-gray-400'}`}>
                          {step.name}
                        </span>
                        {step.description && (
                          <span className="text-xs text-gray-500 block">
                            {step.description}
                          </span>
                        )}
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`w-16 h-0.5 mx-4 ${
                          step.completed ? 'bg-green-600' : 'bg-gray-600'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {generatingSong ? (
                <GenerationProgress
                  generationProgress={generatingSong.generationProgress || 0}
                  generationStage="Generating..."
                />
              ) : currentStep === 1 ? (
                <SongForm
                  onSongGenerated={handleGenerationComplete}
                  user={user}
                />
              ) : currentStep === 3 && completedSong ? (
                <div className="space-y-6">
                  <AudioPlayer song={completedSong} />
                  <SongEditor song={completedSong} onSongUpdated={handleSongUpdated} />
                  <DownloadOptions song={completedSong} />
                </div>
              ) : (
                <div className="space-y-6">
                  <StyleReferenceUpload onStyleExtracted={(style) => {
                    console.log('Style extracted:', style);
                  }} />
                  <MusicTheoryUpload user={user} />
                  <SassyAIChat user={user} />
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header with Logo */}
      <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <img 
              src="/burnt-beats-logo.jpeg" 
              alt="Burnt Beats" 
              className="w-10 h-10 rounded-lg"
            />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                Burnt Beats
              </h1>
              <p className="text-sm text-gray-400">AI Music Generation Platform</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
    <div className="h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex">
      <Sidebar onMenuClick={handleMenuClick} activeMenu={activeMenu} />
      <div className="flex-1 overflow-auto">
        {renderMainContent()}
      </div>

      <div className="w-20 bg-dark-card border-l border-gray-700 p-3 flex flex-col items-center space-y-3">
        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 text-gray-400 hover:text-green-400 hover:bg-green-400/10 transition-all duration-200 rounded-lg"
          onClick={() => setActiveMenu("Downloads")}
          title="Download Options"
        >
          <Download className="w-6 h-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 transition-all duration-200 rounded-lg"
          title="Help & Support"
        >
          <HelpCircle className="w-6 h-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-all duration-200 rounded-lg"
          title="Settings"
        >
          <Settings className="w-6 h-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 text-gray-400 hover:text-green-400 hover:bg-green-400/10 transition-all duration-200 rounded-lg"
          title="Profile"
        >
          <User className="w-6 h-6" />
        </Button>
        <div className="flex-1" />
        <div className="border-t border-gray-700 pt-3 w-full flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200 rounded-lg"
            onClick={onLogout}
            title="Logout"
          >
            <LogOut className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}