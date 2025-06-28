import { useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Music } from "lucide-react";
import SongForm from "@/components/song-form";
import SongLibrary from "@/components/song-library";
import AnalyticsDashboard from "@/components/analytics-dashboard";
import VersionControl from "@/components/version-control";
import CollaborativeWorkspace from "@/components/collaborative-workspace";
import MusicTheoryTools from "@/components/music-theory-tools";
import SocialFeatures from "@/components/social-features";
import VoiceRecorder from "@/components/voice-recorder";
import TextToSpeech from "@/components/text-to-speech";
import SongEditor from "@/components/song-editor";
import DownloadOptions from "@/components/download-options";
import GenerationProgress from "@/components/generation-progress";
import AudioPlayer from "@/components/audio-player";
import type { Song } from '@shared/schema';

interface MainContentProps {
  activeMenu: string;
  user: any;
  completedSong: Song | null;
  editingSong: Song | null;
  generatingSong: Song | null;
  handleEditSong: (song: Song) => void;
  handleSongUpdated: (song: Song) => void;
  handleSongGenerated: (song: Song) => void;
  userPlan: string;
  onUpgrade: () => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  steps: Array<{ id: number; name: string; active: boolean }>;
}

export const useMainContent = ({
  activeMenu,
  user,
  completedSong,
  editingSong,
  generatingSong,
  handleEditSong,
  handleSongUpdated,
  handleSongGenerated,
  userPlan,
  onUpgrade,
  currentStep,
  setCurrentStep,
  steps,
}: MainContentProps) => {
  const mainContent = useMemo(() => {
    switch (activeMenu) {
      case "Song Library":
      case "Recent Creations":
        return <SongLibrary userId={user?.id || 1} onEditSong={handleEditSong} />;

      case "Voice Samples":
        return <VoiceRecorder userId={user?.id || 1} />;

      case "Analytics":
        // Analytics available to all users - they can see their download history and spending
        return <AnalyticsDashboard userId={user?.id || 1} />;

      case "Version Control":
        // Version control available to all users for their songs
        return completedSong ? (
          <VersionControl song={completedSong} userId={user?.id || 1} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">Select a song to view version history</p>
          </div>
        );

      case "Collaborative Workspace":
        // Collaboration available to all users
        return completedSong ? (
          <CollaborativeWorkspace 
            song={completedSong} 
            currentUser={{ id: user?.id || 1, username: user?.username || "User" }}
            onSongUpdate={handleSongUpdated}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">Select a song to start collaborative editing</p>
          </div>
        );

      case "Music Theory":
        // Music theory tools available to all users
        return <MusicTheoryTools />;

      case "Social Hub":
        return <SocialFeatures userId={user?.id || 1} currentSong={completedSong} />;

      case "Downloads":
        return completedSong ? (
          <DownloadOptions song={completedSong} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Music className="w-16 h-16 text-orange-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Generate a Song First</h3>
              <p className="text-gray-400 mb-4">Create your music, then choose from our download options</p>
              <div className="text-sm text-gray-500 space-y-1">
                <p>💿 Bonus Track - $0.99 (Watermarked demo)</p>
                <p>🔉 Base Song - $1.99 (Under 9MB, clean)</p>
                <p>🎧 Premium Song - $4.99 (9MB-20MB, high quality)</p>
                <p>💽 Ultra Song - $8.99 (Over 20MB, studio quality)</p>
                <p>🪪 Full License - $10.00 (Complete ownership)</p>
              </div>
            </div>
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

            {/* Main Content Based on Step */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Create Your Music</h2>
                  <p className="text-gray-400">Generate unlimited songs for free. Pay only when you download.</p>
                </div>
                <SongForm
                  onSongGenerated={handleSongGenerated}
                  currentStep={currentStep}
                  setCurrentStep={setCurrentStep}
                  user={user}
                  onUpgrade={onUpgrade}
                />
              </div>
            )}

            {currentStep === 2 && generatingSong && (
              <GenerationProgress
                song={generatingSong}
                onComplete={handleSongGenerated}
              />
            )}

            {currentStep === 3 && completedSong && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Your Song is Ready!</h2>
                  <p className="text-gray-400">Listen first, then choose your download option.</p>
                </div>
                <AudioPlayer song={completedSong} />
                <DownloadOptions song={completedSong} />
              </div>
            )}
          </>
        );
    }
  }, [
    activeMenu,
    user,
    completedSong,
    editingSong,
    generatingSong,
    handleEditSong,
    handleSongUpdated,
    handleSongGenerated,
    userPlan,
    onUpgrade,
    currentStep,
    setCurrentStep,
    steps,
  ]);

  return mainContent;
};