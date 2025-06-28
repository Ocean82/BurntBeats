import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { useToast } from './use-toast';
import { useErrorHandler } from './use-error-handler';

interface SongGenerationRequest {
  lyrics: string;
  style: string;
  voiceId?: string;
  quality: 'studio' | 'high' | 'medium' | 'fast';
  tempo?: number;
  key?: string;
  duration?: number;
}

interface SongGenerationResponse {
  id: string;
  audioUrl: string;
  title: string;
  status: 'generating' | 'completed' | 'failed';
  progress: number;
  stage: string;
  metadata?: {
    duration: number;
    fileSize: number;
    quality: string;
  };
}

interface GenerationProgress {
  progress: number;
  stage: string;
  estimatedTimeRemaining?: number;
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

export const useSongGeneration = () => {
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { handleError } = useErrorHandler();

  // Generate song mutation
  const generateSongMutation = useMutation({
    mutationFn: async (request: SongGenerationRequest): Promise<SongGenerationResponse> => {
      setIsGenerating(true);
      setGenerationProgress(0);
      setGenerationStage('Initializing...');

      const response = await apiRequest('POST', '/api/music/generate', request);
      const result = await response.json();

      // Start polling for progress
      if (result.id) {
        pollGenerationProgress(result.id);
      }

      return result;
    },
    onSuccess: (data) => {
      toast({
        title: "Song generation started",
        description: "Your song is being generated. This may take a few minutes.",
      });
      queryClient.invalidateQueries({ queryKey: ['songs'] });
    },
    onError: (error) => {
      setIsGenerating(false);
      setGenerationProgress(0);
      setGenerationStage('');
      handleError(error as Error, 'Song generation failed');
    },
  });

  // Poll generation progress
  const pollGenerationProgress = useCallback(async (songId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await apiRequest('GET', `/api/music/generate/${songId}/progress`);
        const progress: GenerationProgress = await response.json();

        setGenerationProgress(progress.progress);
        setGenerationStage(progress.stage);

        if (progress.progress >= 100) {
          clearInterval(pollInterval);
          setIsGenerating(false);

          // Refresh song data
          queryClient.invalidateQueries({ queryKey: ['songs'] });
          queryClient.invalidateQueries({ queryKey: ['song', songId] });

          toast({
            title: "Song generated successfully!",
            description: "Your song is ready to listen to.",
          });
        }
      } catch (error) {
        clearInterval(pollInterval);
        setIsGenerating(false);
        handleError(error as Error, 'Failed to get generation progress');
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [queryClient, toast, handleError]);

  // Get song by ID
  const useSong = (songId: string) => {
    return useQuery({
      queryKey: ['song', songId],
      queryFn: async (): Promise<SongGenerationResponse> => {
        const response = await apiRequest('GET', `/api/music/songs/${songId}`);
        return response.json();
      },
      enabled: !!songId,
    });
  };

  // Get user's songs
  const useSongs = () => {
    return useQuery({
      queryKey: ['songs'],
      queryFn: async (): Promise<SongGenerationResponse[]> => {
        const response = await apiRequest('GET', '/api/music/songs');
        return response.json();
      },
    });
  };

  // Delete song mutation
  const deleteSongMutation = useMutation({
    mutationFn: async (songId: string) => {
      const response = await apiRequest('DELETE', `/api/music/songs/${songId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      toast({
        title: "Song deleted",
        description: "The song has been removed from your library.",
      });
    },
    onError: (error) => {
      handleError(error as Error, 'Failed to delete song');
    },
  });

  return {
    generateSong: generateSongMutation.mutate,
    isGenerating,
    generationProgress,
    generationStage,
    useSong,
    useSongs,
    deleteSong: deleteSongMutation.mutate,
    isDeleting: deleteSongMutation.isPending,
  };
};