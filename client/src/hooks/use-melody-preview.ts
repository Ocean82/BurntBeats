
import { useState, useCallback } from 'react';
import { toast } from '../components/ui/toast';

interface MelodyPreview {
  id: string;
  audioUrl: string;
  lyrics: string;
  genre: string;
  mood: string;
  tempo: number;
  key: string;
  duration: number;
  metadata: {
    generatedAt: string;
    noteCount: number;
    vocalStyle: string;
    quality: string;
  };
}

interface MelodyPreviewConfig {
  melodyId: string;
  genre: string;
  mood: string;
  tempo: number;
  key: string;
  sampleLyrics?: string;
}

interface UseMelodyPreviewReturn {
  previews: MelodyPreview[];
  isGenerating: boolean;
  error: string | null;
  generatePreview: (config: MelodyPreviewConfig) => Promise<MelodyPreview | null>;
  generateBatchPreviews: (baseConfig: Omit<MelodyPreviewConfig, 'genre'>, genres: string[]) => Promise<MelodyPreview[]>;
  clearPreviews: () => void;
  removePreview: (previewId: string) => void;
}

export function useMelodyPreview(): UseMelodyPreviewReturn {
  const [previews, setPreviews] = useState<MelodyPreview[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePreview = useCallback(async (config: MelodyPreviewConfig): Promise<MelodyPreview | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/melody-preview/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate melody preview');
      }

      const newPreview = data.preview;
      setPreviews(prev => [...prev, newPreview]);

      toast({
        title: "Preview Generated",
        description: `${config.genre} melody preview is ready to play!`,
      });

      return newPreview;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate preview';
      setError(errorMessage);
      
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive"
      });

      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generateBatchPreviews = useCallback(async (
    baseConfig: Omit<MelodyPreviewConfig, 'genre'>, 
    genres: string[]
  ): Promise<MelodyPreview[]> => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/melody-preview/generate-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          baseConfig,
          genres
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate melody previews');
      }

      const newPreviews = data.previews;
      setPreviews(prev => [...prev, ...newPreviews]);

      toast({
        title: "Previews Generated",
        description: `Generated ${newPreviews.length} out of ${genres.length} requested previews`,
      });

      return newPreviews;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate previews';
      setError(errorMessage);
      
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive"
      });

      return [];
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const clearPreviews = useCallback(() => {
    setPreviews([]);
    setError(null);
  }, []);

  const removePreview = useCallback((previewId: string) => {
    setPreviews(prev => prev.filter(p => p.id !== previewId));
  }, []);

  return {
    previews,
    isGenerating,
    error,
    generatePreview,
    generateBatchPreviews,
    clearPreviews,
    removePreview
  };
}

// Hook for fetching available genres
export function useGenres() {
  const [genres, setGenres] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchGenres = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/melody-preview/genres');
      const data = await response.json();
      
      if (data.success) {
        setGenres(data.genres);
      }
    } catch (error) {
      console.error('Failed to fetch genres:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    genres,
    isLoading,
    fetchGenres
  };
}
