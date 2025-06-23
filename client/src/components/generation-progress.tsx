import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, Loader2 } from "lucide-react";
import type { Song } from "@shared/schema";

interface GenerationProgressProps {
  generationProgress: number;
  generationStage: string;
}

export default function GenerationProgress({ generationProgress, generationStage }: GenerationProgressProps) {

  const steps = [
    { 
      name: "Processing lyrics", 
      threshold: 20, 
      completed: generationProgress >= 20 
    },
    { 
      name: "Analyzing style preferences", 
      threshold: 40, 
      completed: generationProgress >= 40 
    },
    { 
      name: "Generating audio composition", 
      threshold: 60, 
      completed: generationProgress >= 60 
    },
    { 
      name: "Adding vocal synthesis", 
      threshold: 80, 
      completed: generationProgress >= 80 
    },
    { 
      name: "Final processing", 
      threshold: 100, 
      completed: generationProgress >= 100 
    },
  ];

  const activeStep = steps.findIndex(step => !step.completed);

  return (
    <Card className="bg-dark-card border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-poppins font-semibold text-white">
            Generating Your Song
          </CardTitle>
          <span className="text-sm text-gray-400">
            Est. 2-3 minutes
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.name} className="flex items-center justify-between">
              <span className={`text-sm ${
                step.completed ? 'text-gray-300' : 
                index === activeStep ? 'text-white' : 'text-gray-400'
              }`}>
                {step.name}
              </span>
              <div className="w-6 h-6 flex items-center justify-center">
                {step.completed ? (
                  <CheckCircle className="w-5 h-5 text-spotify-green" />
                ) : index === activeStep ? (
                  <Loader2 className="w-5 h-5 text-spotify-green animate-spin" />
                ) : (
                  <Clock className="w-5 h-5 text-gray-500" />
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6">
          <Progress 
            value={generationProgress} 
            className="h-3"
          />
          <p className="text-sm text-gray-400 mt-2 text-center">
            {generationProgress}% Complete
          </p>
        </div>

        {generationStage === "failed" && (
          <div className="mt-4 p-4 bg-red-900/20 border border-red-900/30 rounded-lg">
            <p className="text-sm text-red-400">
              Generation failed. Please try again with different settings.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
