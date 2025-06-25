
import { useState, useMemo } from 'react';

export interface GenerationStep {
  id: number;
  name: string;
  description?: string;
  active: boolean;
  completed?: boolean;
}

interface UseStepsConfig {
  initialStep?: number;
  persistKey?: string;
}

export const useSteps = (config: UseStepsConfig = {}) => {
  const { initialStep = 1, persistKey } = config;

  // Load from localStorage if persistKey is provided
  const getInitialStep = () => {
    if (persistKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(`steps_${persistKey}`);
      return saved ? parseInt(saved, 10) : initialStep;
    }
    return initialStep;
  };

  const [currentStep, setCurrentStepState] = useState(getInitialStep);

  const setCurrentStep = (step: number) => {
    setCurrentStepState(step);
    if (persistKey && typeof window !== 'undefined') {
      localStorage.setItem(`steps_${persistKey}`, step.toString());
    }
  };

  const steps: GenerationStep[] = useMemo(() => [
    { 
      id: 1, 
      name: "Lyrics & Style", 
      description: "Enter your lyrics and choose musical style",
      active: currentStep === 1,
      completed: currentStep > 1
    },
    { 
      id: 2, 
      name: "Voice & Audio", 
      description: "Configure voice settings and audio preferences",
      active: currentStep === 2,
      completed: currentStep > 2
    },
    { 
      id: 3, 
      name: "Generate & Edit", 
      description: "Generate your song and make refinements",
      active: currentStep === 3,
      completed: currentStep > 3
    },
    // Future steps can be added here
    // { 
    //   id: 4, 
    //   name: "Lyrics Refinement", 
    //   description: "Polish and perfect your lyrics",
    //   active: currentStep === 4,
    //   completed: currentStep > 4
    // },
    // { 
    //   id: 5, 
    //   name: "Mastering Options", 
    //   description: "Fine-tune audio quality and effects",
    //   active: currentStep === 5,
    //   completed: currentStep > 5
    // }
  ], [currentStep]);

  const goToStep = (stepId: number) => {
    setCurrentStep(stepId);
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetSteps = () => {
    setCurrentStep(1);
  };

  return {
    currentStep,
    steps,
    setCurrentStep,
    goToStep,
    nextStep,
    prevStep,
    resetSteps,
    isFirstStep: currentStep === 1,
    isLastStep: currentStep === steps.length
  };
};
