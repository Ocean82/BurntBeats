
import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { apiRequest } from '@/lib/queryClient';

interface VoicePipelineOptions {
  quality: 'studio' | 'high' | 'medium' | 'fast';
  realTimeProcessing: boolean;
  neuralEnhancement: boolean;
  spectralCorrection: boolean;
  adaptiveFiltering: boolean;
  genre?: string;
  mood?: string;
  vocalStyle?: string;
}

interface VoiceGenerationRequest {
  lyrics: string;
  voiceSample?: any;
  melody?: any;
  options: VoicePipelineOptions;
}

export const useEnhancedVoicePipeline = () => {
  const [processingStage, setProcessingStage] = useState<string>('');
  const [qualityMetrics, setQualityMetrics] = useState<any>(null);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [realTimeMode, setRealTimeMode] = useState<boolean>(false);

  const { toast } = useToast(); const { handleError, handleAsync } = useErrorHandler();


  // Enhanced voice generation with full pipeline
  const generateEnhancedVoiceMutation = useMutation({
    mutationFn: async (request: VoiceGenerationRequest) => {
      const { lyrics, voiceSample, melody, options } = request;

      // Stage tracking
      const stages = [
        'Analyzing voice input...',
        'Applying neural enhancement...',
        'Processing lyrics...',
        'Synthesizing with quality control...',
        'Applying real-time enhancements...',
        'Final mastering...',
        'Quality validation...'
      ];

      let currentStage = 0;
      const stageInterval = setInterval(() => {
        if (currentStage < stages.length) {
          setProcessingStage(stages[currentStage]);
          setProcessingProgress(((currentStage + 1) / stages.length) * 100);
          currentStage++;
        }
      }, 2000);

      try {
        const response = await apiRequest('POST', '/api/voice/generate-enhanced', {
          lyrics,
          voiceSample,
          melody,
          options
        });

        clearInterval(stageInterval);
        setProcessingProgress(100);
        setProcessingStage('Complete');

        const result = await response.json();
        setQualityMetrics(result.voice.qualityMetrics);
        
        return result;
      } catch (error) {
        clearInterval(stageInterval);
        throw error;
      }
    },
    onSuccess: (result) => {
      toast({
        title: "Enhanced Voice Generated",
        description: `High-quality voice generated with ${result.voice.metadata.stagesCompleted} processing stages`,
      });
    },
    onError: (error) => {
      handleError(error as Error, "Enhanced Voice Generation Failed");
      setProcessingStage('');
      setProcessingProgress(0);
    },
  });

  // Voice quality analysis
  const analyzeVoiceQualityMutation = useMutation({
    mutationFn: async (voiceSample: any) => {
      setProcessingStage('Analyzing voice quality...');
      
      const response = await apiRequest('POST', '/api/voice/analyze-quality', {
        voiceSample
      });
      
      return await response.json();
    },
    onSuccess: (result) => {
      setQualityMetrics(result.analysis.qualityMetrics);
      setProcessingStage('');
      
      toast({
        title: "Voice Analysis Complete",
        description: `Quality score: ${(result.analysis.qualityMetrics.overallQuality * 100).toFixed(1)}%`,
      });
    },
    onError: (error) => {
      handleError(error as Error, "Voice Analysis Failed");
      setProcessingStage('');
    },
  });

  // Real-time voice processing
  const processRealTimeMutation = useMutation({
    mutationFn: async ({ audioChunk, processingOptions }: any) => {
      const response = await apiRequest('POST', '/api/voice/process-realtime', {
        audioChunk,
        processingOptions
      });
      
      return await response.json();
    },
    onSuccess: () => {
      // Real-time processing completed
    },
    onError: (error) => {
      console.error('Real-time processing error:', error);
    },
  });

  // Generate enhanced voice with pipeline
  const generateEnhancedVoice = useCallback((request: VoiceGenerationRequest) => {
    generateEnhancedVoiceMutation.mutate(request);
  }, [generateEnhancedVoiceMutation]);

  // Analyze voice quality
  const analyzeVoiceQuality = useCallback((voiceSample: any) => {
    analyzeVoiceQualityMutation.mutate(voiceSample);
  }, [analyzeVoiceQualityMutation]);

  // Process audio in real-time
  const processRealTime = useCallback((audioChunk: any, options: any) => {
    if (realTimeMode) {
      processRealTimeMutation.mutate({ audioChunk, processingOptions: options });
    }
  }, [processRealTimeMutation, realTimeMode]);

  // Toggle real-time mode
  const toggleRealTimeMode = useCallback(() => {
    setRealTimeMode(prev => !prev);
  }, []);

  // Get quality recommendations
  const getQualityRecommendations = useCallback(() => {
    if (!qualityMetrics) return [];
    
    const recommendations = [];
    
    if (qualityMetrics.clarity < 0.8) {
      recommendations.push("Consider using noise reduction");
    }
    
    if (qualityMetrics.naturalness < 0.85) {
      recommendations.push("Try neural enhancement for better naturalness");
    }
    
    if (qualityMetrics.consistency < 0.8) {
      recommendations.push("Use spectral correction for better consistency");
    }
    
    return recommendations;
  }, [qualityMetrics]);

  // Get processing status
  const getProcessingStatus = useCallback(() => {
    return {
      isProcessing: generateEnhancedVoiceMutation.isPending || analyzeVoiceQualityMutation.isPending,
      stage: processingStage,
      progress: processingProgress,
      realTimeActive: realTimeMode
    };
  }, [generateEnhancedVoiceMutation.isPending, analyzeVoiceQualityMutation.isPending, processingStage, processingProgress, realTimeMode]);

  return {
    // State
    processingStage,
    processingProgress,
    qualityMetrics,
    realTimeMode,
    
    // Actions
    generateEnhancedVoice,
    analyzeVoiceQuality,
    processRealTime,
    toggleRealTimeMode,
    
    // Utilities
    getQualityRecommendations,
    getProcessingStatus,
    
    // Status
    isGenerating: generateEnhancedVoiceMutation.isPending,
    isAnalyzing: analyzeVoiceQualityMutation.isPending,
    isProcessingRealTime: processRealTimeMutation.isPending,
    
    // Errors
    generationError: generateEnhancedVoiceMutation.error,
    analysisError: analyzeVoiceQualityMutation.error,
    realTimeError: processRealTimeMutation.error,
  };
};
