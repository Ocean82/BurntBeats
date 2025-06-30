import React from 'react';
import { CheckCircle, Circle, ArrowRight, Music, Mic, Palette, Play, Download, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  completed: boolean;
  active: boolean;
}

interface SongCreationStatusBarProps {
  currentStep: number;
  completedSteps: number[];
  songData?: {
    hasLyrics: boolean;
    hasGenre: boolean;
    hasMelody: boolean;
    hasVoice: boolean;
    hasSettings: boolean;
    isGenerated: boolean;
    canDownload: boolean;
  };
}

export default function SongCreationStatusBar({ 
  currentStep, 
  completedSteps, 
  songData 
}: SongCreationStatusBarProps) {
  
  const steps: Step[] = [
    {
      id: 'lyrics',
      title: 'Input Lyrics',
      description: 'Write your song lyrics and story',
      icon: Music,
      completed: completedSteps.includes(1) || songData?.hasLyrics || false,
      active: currentStep === 1
    },
    {
      id: 'genre',
      title: 'Choose Genre',
      description: 'Select musical style and tempo',
      icon: Palette,
      completed: completedSteps.includes(2) || songData?.hasGenre || false,
      active: currentStep === 2
    },
    {
      id: 'melody',
      title: 'Choose Melody',
      description: 'Pick chord progression and structure',
      icon: Music,
      completed: completedSteps.includes(3) || songData?.hasMelody || false,
      active: currentStep === 3
    },
    {
      id: 'voice',
      title: 'Choose Voice',
      description: 'Select vocal style and clone',
      icon: Mic,
      completed: completedSteps.includes(4) || songData?.hasVoice || false,
      active: currentStep === 4
    },
    {
      id: 'settings',
      title: 'Final Settings',
      description: 'Length, effects, and polish',
      icon: Play,
      completed: completedSteps.includes(5) || songData?.hasSettings || false,
      active: currentStep === 5
    },
    {
      id: 'generate',
      title: 'Generate',
      description: 'Create your song',
      icon: Play,
      completed: completedSteps.includes(6) || songData?.isGenerated || false,
      active: currentStep === 6
    },
    {
      id: 'download',
      title: 'Pay & Download',
      description: 'Get high-quality version',
      icon: Download,
      completed: completedSteps.includes(7) || songData?.canDownload || false,
      active: currentStep === 7
    }
  ];

  return (
    <div className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 py-4 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Progress Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Song Creation Progress
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Step {currentStep} of {steps.length}: {steps[currentStep - 1]?.title}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {Math.round((completedSteps.length / steps.length) * 100)}% Complete
            </div>
            <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(completedSteps.length / steps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Steps Timeline */}
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-6 left-0 w-full h-0.5 bg-gray-200 dark:bg-gray-700">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
              style={{ width: `${(completedSteps.length / (steps.length - 1)) * 100}%` }}
            />
          </div>

          {/* Step Items */}
          <div className="flex justify-between relative z-10">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isLast = index === steps.length - 1;
              
              return (
                <div key={step.id} className="flex flex-col items-center group">
                  {/* Step Circle */}
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                      step.completed
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 border-purple-500 text-white shadow-lg"
                        : step.active
                        ? "bg-white dark:bg-gray-800 border-purple-500 text-purple-500 shadow-md ring-4 ring-purple-100 dark:ring-purple-900"
                        : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500"
                    )}
                  >
                    {step.completed ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>

                  {/* Step Info */}
                  <div className="mt-3 text-center max-w-24">
                    <div
                      className={cn(
                        "text-xs font-medium transition-colors",
                        step.completed || step.active
                          ? "text-gray-900 dark:text-white"
                          : "text-gray-500 dark:text-gray-400"
                      )}
                    >
                      {step.title}
                    </div>
                    <div
                      className={cn(
                        "text-xs mt-1 transition-colors",
                        step.active
                          ? "text-purple-600 dark:text-purple-400"
                          : "text-gray-400 dark:text-gray-500"
                      )}
                    >
                      {step.description}
                    </div>
                  </div>

                  {/* Arrow Connector */}
                  {!isLast && (
                    <ArrowRight 
                      className={cn(
                        "absolute top-6 w-4 h-4 transition-colors",
                        step.completed 
                          ? "text-purple-500" 
                          : "text-gray-300 dark:text-gray-600"
                      )}
                      style={{ left: `${((index + 1) / steps.length) * 100 - 2}%` }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Step Details */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
              {React.createElement(steps[currentStep - 1]?.icon || Circle, {
                className: "w-4 h-4 text-purple-600 dark:text-purple-400"
              })}
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {steps[currentStep - 1]?.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {getStepGuidance(currentStep)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getStepGuidance(step: number): string {
  const guidance = {
    1: "Start by writing your song lyrics. Tell your story, express your emotions, and create the foundation of your song.",
    2: "Choose the musical genre that best fits your lyrics. This will determine the style, tempo, and overall feel of your song.",
    3: "Select chord progressions and melodic structure. This shapes how your lyrics will be sung and the musical arrangement.",
    4: "Pick a vocal style or upload your own voice sample for cloning. This gives your song its unique vocal character.",
    5: "Fine-tune song length, add effects, and make final adjustments to perfect your creation.",
    6: "Generate your song! Our AI will create a complete musical arrangement with your specifications.",
    7: "Preview your song for free, then choose a download tier for high-quality versions and commercial licensing."
  };
  
  return guidance[step as keyof typeof guidance] || "Complete this step to continue.";
}

// Hook for managing song creation progress
export function useSongCreationProgress() {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [completedSteps, setCompletedSteps] = React.useState<number[]>([]);
  
  const completeStep = (stepNumber: number) => {
    setCompletedSteps(prev => {
      if (prev.includes(stepNumber)) return prev;
      return [...prev, stepNumber];
    });
    if (stepNumber === currentStep && stepNumber < 7) {
      setCurrentStep(stepNumber + 1);
    }
  };
  
  const goToStep = (stepNumber: number) => {
    setCurrentStep(stepNumber);
  };
  
  const resetProgress = () => {
    setCurrentStep(1);
    setCompletedSteps([]);
  };
  
  return {
    currentStep,
    completedSteps,
    completeStep,
    goToStep,
    resetProgress
  };
}