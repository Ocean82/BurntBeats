import { useState } from "react";
import Sidebar from "@/components/sidebar";
import SongForm from "@/components/song-form";
import AudioPlayer from "@/components/audio-player";
import GenerationProgress from "@/components/generation-progress";
import DownloadOptions from "@/components/download-options";
import SongEditor from "@/components/song-editor";
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

  const steps = [
    { id: 1, name: "Lyrics & Style", active: currentStep === 1 },
    { id: 2, name: "Voice & Audio", active: currentStep === 2 },
    { id: 3, name: "Generate & Edit", active: currentStep === 3 },
  ];

  return (
    <div className="flex h-screen bg-dark-bg text-white">
      <Sidebar />
      
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
                    <span className={`text-sm font-medium ${
                      step.active ? 'text-spotify-green' : 'text-gray-400'
                    }`}>
                      {step.name}
                    </span>
                  </div>
                ))}
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-spotify-green h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / 3) * 100}%` }}
                />
              </div>
            </div>

            {currentStep <= 2 && (
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
              <>
                <AudioPlayer song={completedSong} />
                <SongEditor 
                  song={completedSong} 
                  userPlan={userPlan}
                  onSongUpdated={handleSongUpdated}
                  onUpgrade={onUpgrade}
                />
                <DownloadOptions song={completedSong} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
