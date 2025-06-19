import { useState } from "react";
import Sidebar from "@/components/sidebar";
import SongForm from "@/components/song-form";
import AudioPlayer from "@/components/audio-player";
import GenerationProgress from "@/components/generation-progress";
import DownloadOptions from "@/components/download-options";
import SongEditor from "@/components/song-editor";
import { Music, HelpCircle, Settings, User } from "lucide-react";
import type { Song } from "@shared/schema";

export default function SongGenerator() {
  const [currentStep, setCurrentStep] = useState(1);
  const [generatingSong, setGeneratingSong] = useState<Song | null>(null);
  const [completedSong, setCompletedSong] = useState<Song | null>(null);
  const [userPlan] = useState("free"); // Mock user plan - would come from auth context

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
            <h2 className="text-xl font-poppins font-semibold">Create New Song</h2>
            <div className="flex items-center space-x-4">
              <button className="text-gray-400 hover:text-white transition-colors">
                <HelpCircle className="w-5 h-5" />
              </button>
              <button className="text-gray-400 hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 bg-spotify-green rounded-full flex items-center justify-center">
                <User className="w-4 h-4" />
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
