import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from './use-toast';
import { useErrorHandler } from './use-error-handler';

interface EnhancedVoiceRequest {
  text: string;
  voiceId: string;
  quality: 'studio' | 'high' | 'medium' | 'fast';
  speed?: number;
  pitch?: number;
  emotion?: string;
  style?: string;
}

interface EnhancedVoiceResponse {
  id: string;
  audioUrl: string;
  status: 'processing' | 'completed' | 'failed';
  metadata: {
    duration: number;
    quality: string;
    fileSize: number;
    adaptiveFilteringApplied?: boolean;
    enhancementLevel?: string;
  };
}

const apiRequest = async (method: string, url: string, data?: any) => {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response;
};

export const useEnhancedVoicePipeline = () => {
  const { toast } = useToast();
  const { handleError } = useErrorHandler();

  // Enhanced voice synthesis mutation
  const enhancedVoiceMutation = useMutation({
    mutationFn: async (request: EnhancedVoiceRequest): Promise<EnhancedVoiceResponse> => {
      const response = await apiRequest('POST', '/api/voice/enhanced-synthesis', request);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Voice synthesis completed",
        description: "Your enhanced audio is ready to play.",
      });
    },
    onError: (error) => {
      handleError(error as Error, 'Enhanced voice synthesis failed');
    },
  });

  // Get voice processing status
  const useVoiceProcessing = (processId: string) => {
    return useQuery({
      queryKey: ['voice-processing', processId],
      queryFn: async (): Promise<EnhancedVoiceResponse> => {
        const response = await apiRequest('GET', `/api/voice/processing/${processId}`);
        return response.json();
      },
      enabled: !!processId,
      refetchInterval: (data) => {
        return data?.status === 'processing' ? 2000 : false;
      },
    });
  };

  // Get available voice models
  const useVoiceModels = () => {
    return useQuery({
      queryKey: ['voice-models'],
      queryFn: async () => {
        const response = await apiRequest('GET', '/api/voice/models');
        return response.json();
      },
    });
  };

  // Voice quality analysis
  const analyzeVoiceQualityMutation = useMutation({
    mutationFn: async (audioFile: File) => {
      const formData = new FormData();
      formData.append('audio', audioFile);

      const response = await fetch('/api/voice/analyze-quality', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Quality analysis failed');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Voice analysis completed",
        description: "Quality analysis results are ready.",
      });
    },
    onError: (error) => {
      handleError(error as Error, 'Voice quality analysis failed');
    },
  });

  return {
    enhanceVoice: enhancedVoiceMutation.mutate,
    isEnhancing: enhancedVoiceMutation.isPending,
    useVoiceProcessing,
    useVoiceModels,
    analyzeVoiceQuality: analyzeVoiceQualityMutation.mutate,
    isAnalyzing: analyzeVoiceQualityMutation.isPending,
  };
};