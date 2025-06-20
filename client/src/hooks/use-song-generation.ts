import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { apiRequest } from '@/lib/queryClient';
import type { Song, InsertSong } from '@shared/schema';

interface UseSongGenerationProps {
  onGenerationComplete?: (song: Song) => void;
  onGenerationStart?: (song: Song) => void;
  userId: number;
}

export const useSongGeneration = ({ 
  onGenerationComplete, 
  onGenerationStart,
  userId 
}: UseSongGenerationProps) => {
  const [generatingSong, setGeneratingSong] = useState<Song | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const { toast } = useToast();
  const { handleError } = useErrorHandler();
  const queryClient = useQueryClient();

  // Generate song mutation
  const generateSongMutation = useMutation({
    mutationFn: async (songData: InsertSong) => {
      const response = await apiRequest("POST", "/api/songs", songData);
      return response.json();
    },
    onMutate: (songData) => {
      const tempSong = {
        ...songData,
        id: Date.now(),
        status: "pending" as const,
        generationProgress: 0,
        generatedAudioPath: null,
        sections: null,
        settings: null,
        planRestricted: false,
        playCount: 0,
        likes: 0,
        rating: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Song;
      
      setGeneratingSong(tempSong);
      setGenerationProgress(0);
      onGenerationStart?.(tempSong);
    },
    onSuccess: (song) => {
      setGeneratingSong(song);
      // Start polling for progress
      startProgressPolling(song.id);
      
      toast({
        title: "Song Generation Started",
        description: "Your song is being generated with real musical compositions",
      });
      
      // Invalidate songs cache
      queryClient.invalidateQueries({ queryKey: ["/api/songs", userId] });
    },
    onError: (error) => {
      setGeneratingSong(null);
      setGenerationProgress(0);
      handleError(error as Error, "Generation Failed");
    },
  });

  // Progress polling
  const startProgressPolling = useCallback((songId: number) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await apiRequest("GET", `/api/songs/single/${songId}`);
        const updatedSong = await response.json() as Song;
        
        setGeneratingSong(updatedSong);
        setGenerationProgress(updatedSong.generationProgress || 0);
        
        if (updatedSong.status === "completed") {
          clearInterval(pollInterval);
          setGeneratingSong(null);
          setGenerationProgress(0);
          
          onGenerationComplete?.(updatedSong);
          
          toast({
            title: "Song Generated Successfully",
            description: "Your song with authentic musical composition is ready to play!",
          });
          
          // Invalidate cache
          queryClient.invalidateQueries({ queryKey: ["/api/songs", userId] });
          
        } else if (updatedSong.status === "failed") {
          clearInterval(pollInterval);
          setGeneratingSong(null);
          setGenerationProgress(0);
          
          handleError(new Error("Song generation failed. Please try again."));
        }
      } catch (error) {
        clearInterval(pollInterval);
        setGeneratingSong(null);
        setGenerationProgress(0);
        handleError(error as Error, "Progress Check Failed");
      }
    }, 2000);

    // Cleanup after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 300000);
  }, [onGenerationComplete, handleError, toast, queryClient, userId]);

  const generateSong = useCallback((songData: Omit<InsertSong, 'userId'>) => {
    generateSongMutation.mutate({
      ...songData,
      userId
    });
  }, [generateSongMutation, userId]);

  const cancelGeneration = useCallback(() => {
    setGeneratingSong(null);
    setGenerationProgress(0);
    generateSongMutation.reset();
  }, [generateSongMutation]);

  return { 
    generatingSong,
    generationProgress,
    isGenerating: generateSongMutation.isPending || !!generatingSong,
    generateSong,
    cancelGeneration,
    generationError: generateSongMutation.error
  };
};