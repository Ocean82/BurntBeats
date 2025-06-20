import { useState } from "react";
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
import VoiceRecorder from "@/components/voice-recorder";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Music, HelpCircle, Settings, User, Crown, LogOut } from "lucide-react";
import type { Song } from "@shared/schema";

interface SongGeneratorProps {
  user: any;
  onUpgrade: () => void;
  onLogout: () => void;
}

export default function SongGenerator({ user, onUpgrade, onLogout }: SongGeneratorProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [generatingSong, setGeneratingSong] = useState<Song | null>(null);
  const [completedSong, setCompletedSong] = useState<Song | null>(null);
  const [activeMenu, setActiveMenu] = useState("New Song");
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const userPlan = user?.plan || "free";

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
        setCurrentStep(1);
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
      case "downloads":
        setActiveMenu("Downloads");
        break;
    }
  };

  const handleEditSong = (song: Song) => {
    setEditingSong(song);
    setActiveMenu("Song Editor");
  };

  const steps = [
    { id: 1, name: "Lyrics & Style", active: currentStep === 1 },
    { id: 2, name: "Voice & Audio", active: currentStep === 2 },
    { id: 3, name: "Generate & Edit", active: currentStep === 3 },
  ];

  const renderMainContent = () => {
    switch (activeMenu) {
      case "Song Library":
        return <SongLibrary userId={user?.id || 1} onEditSong={handleEditSong} />;
      case "Recent Creations":
        return <SongLibrary userId={user?.id || 1} onEditSong={handleEditSong} />;
      case "Voice Samples":
        return <VoiceRecorder userId={user?.id || 1} />;
      case "Analytics":
        return userPlan === "pro" ? (
          <AnalyticsDashboard userId={user?.id || 1} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Pro Feature</h3>
              <p className="text-gray-400 mb-4">Analytics dashboard is available with Pro subscription</p>
              <Button onClick={onUpgrade} className="bg-gradient-to-r from-vibrant-orange to-orange-600">
                Upgrade to Pro
              </Button>
            </div>
          </div>
        );
      case "Version Control":
        return userPlan === "pro" ? (
          completedSong ? (
            <VersionControl song={completedSong} userId={user?.id || 1} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400">Select a song to view version history</p>
            </div>
          )
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Pro Feature</h3>
              <p className="text-gray-400 mb-4">Version control is available with Pro subscription</p>
              <Button onClick={onUpgrade} className="bg-gradient-to-r from-vibrant-orange to-orange-600">
                Upgrade to Pro
              </Button>
            </div>
          </div>
        );
      case "Collaboration":
        return userPlan === "pro" ? (
          completedSong ? (
            <CollaborationTools song={completedSong} userId={user?.id || 1} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400">Select a song to collaborate</p>
            </div>
          )
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Pro Feature</h3>
              <p className="text-gray-400 mb-4">Collaboration tools are available with Pro subscription</p>
              <Button onClick={onUpgrade} className="bg-gradient-to-r from-vibrant-orange to-orange-600">
                Upgrade to Pro
              </Button>
            </div>
          </div>
        );
      case "Music Theory":
        return userPlan === "pro" ? (
          <MusicTheoryTools />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Pro Feature</h3>
              <p className="text-gray-400 mb-4">Music theory tools are available with Pro subscription</p>
              <Button onClick={onUpgrade} className="bg-gradient-to-r from-vibrant-orange to-orange-600">
                Upgrade to Pro
              </Button>
            </div>
          </div>
        );
      case "Social Hub":
        return <SocialFeatures userId={user?.id || 1} currentSong={completedSong} />;
      case "Downloads":
        return completedSong ? (
          <DownloadOptions song={completedSong} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">Generate a song to access downloads</p>
          </div>
        );
      case "Song Editor":
        return editingSong ? (
          <SongEditor
            song={editingSong}
            userPlan={userPlan}
            onSongUpdated={handleSongUpdated}
            onUpgrade={onUpgrade}
          />
        ) : null;
      default:
        return (
          <>
            {/* Step Indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step.active ? 'bg-spotify-green' : 'bg-gray-600'
                    }`}>
                      {step.id}
                    </div>
                    <span className={`text-sm ${step.active ? 'text-white' : 'text-gray-400'}`}>
                      {step.name}
                    </span>
                    {index < steps.length - 1 && (
                      <div className="w-16 h-px bg-gray-600"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Song Form */}
              <div className="lg:col-span-2">
                {!generatingSong && !completedSong && (
                  <SongForm
                    onSongGenerated={handleSongGenerated}
                    currentStep={currentStep}
                    setCurrentStep={setCurrentStep}
                    user={user}
                    onUpgrade={onUpgrade}
                  />
                )}

                {generatingSong && (
                  <GenerationProgress
                    song={generatingSong}
                    onComplete={handleGenerationComplete}
                  />
                )}

                {completedSong && (
                  <SongEditor
                    song={completedSong}
                    userPlan={userPlan}
                    onSongUpdated={handleSongUpdated}
                    onUpgrade={onUpgrade}
                  />
                )}
              </div>

              {/* Right Column - Audio Player & Downloads */}
              <div className="lg:col-span-1">
                {completedSong && (
                  <div className="space-y-6">
                    <AudioPlayer song={completedSong} />
                    <DownloadOptions song={completedSong} />
                  </div>
                )}
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="flex h-screen bg-dark-bg text-white">
      <Sidebar onMenuClick={handleMenuClick} activeMenu={activeMenu} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-dark-card px-8 py-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-spotify-green to-green-600 rounded-full flex items-center justify-center">
                <Music className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-poppins font-semibold">BangerGPT</h2>
                <p className="text-sm text-gray-400">Create New Song</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-white text-sm font-medium">{user?.username}</p>
                  <div className="flex items-center space-x-2">
                    <Badge className={userPlan === "pro" ? "bg-yellow-500/20 text-yellow-400" : "bg-gray-500/20 text-gray-400"}>
                      {userPlan === "pro" ? (
                        <>
                          <Crown className="w-3 h-3 mr-1" />
                          Pro
                        </>
                      ) : (
                        "Free"
                      )}
                    </Badge>
                    {userPlan === "free" && (
                      <span className="text-xs text-gray-400">
                        {user?.songsThisMonth || 0}/3 songs
                      </span>
                    )}
                  </div>
                </div>
                
                {userPlan === "free" && (
                  <Button
                    onClick={onUpgrade}
                    className="bg-gradient-to-r from-vibrant-orange to-orange-600 hover:from-orange-600 hover:to-vibrant-orange text-white px-3 py-1 text-sm"
                    size="sm"
                  >
                    <Crown className="w-3 h-3 mr-1" />
                    Upgrade
                  </Button>
                )}
                
                <Button
                  onClick={onLogout}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {renderMainContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
