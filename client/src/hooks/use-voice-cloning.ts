import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { useToast } from './use-toast';
import { useErrorHandler } from './use-error-handler';

interface VoiceCloneRequest {
  name: string;
  audioFile: File;
  description?: string;
}

interface VoiceCloneResponse {
  id: string;
  name: string;
  status: 'processing' | 'ready' | 'failed';
  audioUrl?: string;
  previewUrl?: string;
  createdAt: string;
  metadata?: {
    duration: number;
    quality: string;
    language: string;
  };
}

interface VoiceCloneProgress {
  progress: number;
  stage: string;
  estimatedTimeRemaining?: number;
}

const apiRequest = async (method: string, url: string, data?: any, isFormData = false) => {
  const headers: Record<string, string> = {};

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method,
    headers,
    body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response;
};

export const useVoiceCloning = () => {
  const [cloningProgress, setCloningProgress] = useState(0);
  const [cloningStage, setCloningStage] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { handleError } = useErrorHandler();

  // Create voice clone mutation
  const createVoiceCloneMutation = useMutation({
    mutationFn: async (request: VoiceCloneRequest): Promise<VoiceCloneResponse> => {
      setIsCloning(true);
      setCloningProgress(0);
      setCloningStage('Uploading audio...');

      const formData = new FormData();
      formData.append('name', request.name);
      formData.append('audioFile', request.audioFile);
      if (request.description) {
        formData.append('description', request.description);
      }

      const response = await apiRequest('POST', '/api/voice/clone', formData, true);
      const result = await response.json();

      // Start polling for progress
      if (result.id) {
        pollCloningProgress(result.id);
      }

      return result;
    },
    onSuccess: (data) => {
      toast({
        title: "Voice cloning started",
        description: "Your voice is being processed. This may take a few minutes.",
      });
      queryClient.invalidateQueries({ queryKey: ['voice-clones'] });
    },
    onError: (error) => {
      setIsCloning(false);
      setCloningProgress(0);
      setCloningStage('');
      handleError(error as Error, 'Voice cloning failed');
    },
  });

  // Poll cloning progress
  const pollCloningProgress = useCallback(async (voiceId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await apiRequest('GET', `/api/voice/clone/${voiceId}/progress`);
        const progress: VoiceCloneProgress = await response.json();

        setCloningProgress(progress.progress);
        setCloningStage(progress.stage);

        if (progress.progress >= 100) {
          clearInterval(pollInterval);
          setIsCloning(false);

          // Refresh voice clone data
          queryClient.invalidateQueries({ queryKey: ['voice-clones'] });
          queryClient.invalidateQueries({ queryKey: ['voice-clone', voiceId] });

          toast({
            title: "Voice clone ready!",
            description: "Your voice has been successfully cloned and is ready to use.",
          });
        }
      } catch (error) {
        clearInterval(pollInterval);
        setIsCloning(false);
        handleError(error as Error, 'Failed to get cloning progress');
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [queryClient, toast, handleError]);

  // Get voice clone by ID
  const useVoiceClone = (voiceId: string) => {
    return useQuery({
      queryKey: ['voice-clone', voiceId],
      queryFn: async (): Promise<VoiceCloneResponse> => {
        const response = await apiRequest('GET', `/api/voice/clone/${voiceId}`);
        return response.json();
      },
      enabled: !!voiceId,
    });
  };

  // Get user's voice clones
  const useVoiceClones = () => {
    return useQuery({
      queryKey: ['voice-clones'],
      queryFn: async (): Promise<VoiceCloneResponse[]> => {
        const response = await apiRequest('GET', '/api/voice/clones');
        return response.json();
      },
    });
  };

  // Delete voice clone mutation
  const deleteVoiceCloneMutation = useMutation({
    mutationFn: async (voiceId: string) => {
      const response = await apiRequest('DELETE', `/api/voice/clone/${voiceId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice-clones'] });
      toast({
        title: "Voice clone deleted",
        description: "The voice clone has been removed from your library.",
      });
    },
    onError: (error) => {
      handleError(error as Error, 'Failed to delete voice clone');
    },
  });

  // Test voice clone mutation
  const testVoiceCloneMutation = useMutation({
    mutationFn: async ({ text, voiceId }: { text: string; voiceId: string }) => {
      // Voice synthesis timeout (2 minutes)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      try {
        const response = await apiRequest('POST', `/api/voice/clone/${voiceId}/test`, { text });
        clearTimeout(timeoutId);
        return response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Test audio generated",
        description: "Your test audio is ready to play.",
      });
    },
    onError: (error) => {
      handleError(error as Error, 'Failed to generate test audio');
    },
  });

  return {
    createVoiceClone: createVoiceCloneMutation.mutate,
    isCloning,
    cloningProgress,
    cloningStage,
    useVoiceClone,
    useVoiceClones,
    deleteVoiceClone: deleteVoiceCloneMutation.mutate,
    testVoiceClone: testVoiceCloneMutation.mutate,
    isDeleting: deleteVoiceCloneMutation.isPending,
    isTesting: testVoiceCloneMutation.isPending,
  };
};