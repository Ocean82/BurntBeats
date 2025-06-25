import { useState, useCallback, useEffect } from 'react';
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

// Add default props support
const DEFAULT_PROPS: UseSongGenerationProps = {
  userId: 1,
  onGenerationComplete: () => {},
  onGenerationStart: () => {}
};

export const useSongGeneration = ({ 
  onGenerationComplete, 
  onGenerationStart,
  userId 
}: UseSongGenerationProps) => {
  // Global error handler for unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      setGeneratingSong(null);
      setGenerationProgress(0);
      event.preventDefault();
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
  const [generatingSong, setGeneratingSong] = useState<Song | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const { toast } = useToast();
  const { handleError } = useErrorHandler();
  const queryClient = useQueryClient();

  // Generate song mutation
  const generateSongMutation = useMutation({
    mutationFn: async (songData: InsertSong) => {
      const response = await fetch("/api/songs/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(songData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate song');
      }
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
        rating: '4',
        createdAt: new Date(),
        updatedAt: new Date()
      } as Song;

      setGeneratingSong(tempSong);
      setGenerationProgress(0);
      onGenerationStart?.(tempSong);
    },
    onSuccess: (song) => {
      // Check if song is already completed (immediate generation)
      if (song.status === "completed") {
        setGeneratingSong(null);
        setGenerationProgress(100);
        
        onGenerationComplete?.(song);
        
        toast({
          title: "Song Generated Successfully",
          description: "Your song with authentic musical composition is ready to play!",
        });
      } else {
        // Song is still processing, start polling
        setGeneratingSong(song);
        startProgressPolling(song.id);
        
        toast({
          title: "Song Generation Started",
          description: "Your song is being generated with real musical compositions",
        });
      }

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
      userId: String(userId)
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
    generationStage: 'Ready',
    isGenerating: generateSongMutation.isPending || !!generatingSong,
    generateSong,
    cancelGeneration,
    generationError: generateSongMutation.error
  };
};