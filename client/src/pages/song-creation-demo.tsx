import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, RotateCcw } from 'lucide-react';
import SongCreationStatusBar, { useSongCreationProgress } from '@/components/song-creation-status-bar';

export default function SongCreationDemo() {
  const { currentStep, completedSteps, completeStep, goToStep, resetProgress } = useSongCreationProgress();
  const [demoSongData, setDemoSongData] = useState({
    hasLyrics: false,
    hasGenre: false,
    hasMelody: false,
    hasVoice: false,
    hasSettings: false,
    isGenerated: false,
    canDownload: false
  });

  const simulateStep = (stepNumber: number) => {
    completeStep(stepNumber);
    
    // Update demo song data to reflect completed steps
    const updates: any = {};
    if (stepNumber >= 1) updates.hasLyrics = true;
    if (stepNumber >= 2) updates.hasGenre = true;
    if (stepNumber >= 3) updates.hasMelody = true;
    if (stepNumber >= 4) updates.hasVoice = true;
    if (stepNumber >= 5) updates.hasSettings = true;
    if (stepNumber >= 6) updates.isGenerated = true;
    if (stepNumber >= 7) updates.canDownload = true;
    
    setDemoSongData(prev => ({ ...prev, ...updates }));
  };

  const handleReset = () => {
    resetProgress();
    setDemoSongData({
      hasLyrics: false,
      hasGenre: false,
      hasMelody: false,
      hasVoice: false,
      hasSettings: false,
      isGenerated: false,
      canDownload: false
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Song Creation Progress Demo</h1>
          <p className="text-gray-400">
            Interactive demonstration of the step-by-step song creation process
          </p>
        </div>

        {/* Status Bar */}
        <SongCreationStatusBar 
          currentStep={currentStep}
          completedSteps={completedSteps}
          songData={demoSongData}
        />

        {/* Demo Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Step Simulation */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Play className="w-5 h-5" />
                <span>Simulate Steps</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => simulateStep(1)}
                  disabled={completedSteps.includes(1)}
                  variant={completedSteps.includes(1) ? "secondary" : "default"}
                  className="w-full"
                >
                  Complete Lyrics
                </Button>
                <Button 
                  onClick={() => simulateStep(2)}
                  disabled={completedSteps.includes(2)}
                  variant={completedSteps.includes(2) ? "secondary" : "default"}
                  className="w-full"
                >
                  Choose Genre
                </Button>
                <Button 
                  onClick={() => simulateStep(3)}
                  disabled={completedSteps.includes(3)}
                  variant={completedSteps.includes(3) ? "secondary" : "default"}
                  className="w-full"
                >
                  Set Melody
                </Button>
                <Button 
                  onClick={() => simulateStep(4)}
                  disabled={completedSteps.includes(4)}
                  variant={completedSteps.includes(4) ? "secondary" : "default"}
                  className="w-full"
                >
                  Select Voice
                </Button>
                <Button 
                  onClick={() => simulateStep(5)}
                  disabled={completedSteps.includes(5)}
                  variant={completedSteps.includes(5) ? "secondary" : "default"}
                  className="w-full"
                >
                  Final Settings
                </Button>
                <Button 
                  onClick={() => simulateStep(6)}
                  disabled={completedSteps.includes(6)}
                  variant={completedSteps.includes(6) ? "secondary" : "default"}
                  className="w-full"
                >
                  Generate Song
                </Button>
              </div>
              
              <div className="pt-4 border-t border-gray-700">
                <Button 
                  onClick={handleReset}
                  variant="outline"
                  className="w-full"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Demo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Step Details */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Current Step Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-900 p-4 rounded-lg">
                  <h3 className="font-medium text-purple-400 mb-2">
                    Step {currentStep}: {getStepName(currentStep)}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {getStepDescription(currentStep)}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-300">Progress Summary:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className={`p-2 rounded ${demoSongData.hasLyrics ? 'bg-green-900 text-green-200' : 'bg-gray-700 text-gray-400'}`}>
                      Lyrics: {demoSongData.hasLyrics ? '✓' : '○'}
                    </div>
                    <div className={`p-2 rounded ${demoSongData.hasGenre ? 'bg-green-900 text-green-200' : 'bg-gray-700 text-gray-400'}`}>
                      Genre: {demoSongData.hasGenre ? '✓' : '○'}
                    </div>
                    <div className={`p-2 rounded ${demoSongData.hasMelody ? 'bg-green-900 text-green-200' : 'bg-gray-700 text-gray-400'}`}>
                      Melody: {demoSongData.hasMelody ? '✓' : '○'}
                    </div>
                    <div className={`p-2 rounded ${demoSongData.hasVoice ? 'bg-green-900 text-green-200' : 'bg-gray-700 text-gray-400'}`}>
                      Voice: {demoSongData.hasVoice ? '✓' : '○'}
                    </div>
                    <div className={`p-2 rounded ${demoSongData.hasSettings ? 'bg-green-900 text-green-200' : 'bg-gray-700 text-gray-400'}`}>
                      Settings: {demoSongData.hasSettings ? '✓' : '○'}
                    </div>
                    <div className={`p-2 rounded ${demoSongData.isGenerated ? 'bg-green-900 text-green-200' : 'bg-gray-700 text-gray-400'}`}>
                      Generated: {demoSongData.isGenerated ? '✓' : '○'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Overview */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>Song Creation Status Bar Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-purple-400 mb-3">Visual Progress Tracking</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Real-time completion percentage</li>
                  <li>• Interactive step indicators with icons</li>
                  <li>• Color-coded progress states</li>
                  <li>• Smooth animations and transitions</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-purple-400 mb-3">Smart Step Management</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Auto-advance when steps complete</li>
                  <li>• Context-aware guidance messages</li>
                  <li>• Form validation integration</li>
                  <li>• Navigation between steps</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getStepName(step: number): string {
  const names = {
    1: "Input Lyrics",
    2: "Choose Genre", 
    3: "Choose Melody",
    4: "Choose Voice",
    5: "Final Settings",
    6: "Generate",
    7: "Pay & Download"
  };
  return names[step as keyof typeof names] || "Unknown";
}

function getStepDescription(step: number): string {
  const descriptions = {
    1: "Write your song lyrics with verses, choruses, and bridges. The AI will analyze your content for musical structure.",
    2: "Select the musical genre that fits your vision. This determines the style, tempo, and instrumental arrangement.",
    3: "Choose chord progressions and melodic structure. This shapes how your lyrics will be sung and the overall flow.",
    4: "Pick a vocal style or upload your own voice for cloning. This gives your song its unique vocal character.",
    5: "Set song length, effects, and final polish options. Fine-tune the details for your perfect creation.",
    6: "Generate your complete song with AI. The system creates a full musical arrangement based on your choices.",
    7: "Preview for free, then download high-quality versions. Choose from demo, clean, or studio-quality exports."
  };
  return descriptions[step as keyof typeof descriptions] || "Complete this step to continue.";
}