
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { apiRequest } from '@/lib/queryClient';
import type { Song, InsertSong } from '@shared/schema';

interface UseSongsProps {
  userId: number;
  enabled?: boolean;
}

export const useSongs = ({ userId, enabled = true }: UseSongsProps) => {
  const { toast } = useToast();
  const { handleError } = useErrorHandler();
  const queryClient = useQueryClient();

  // Fetch all songs for user
  const {
    data: songs = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['/api/songs', userId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/songs?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch songs');
      return response.json() as Promise<Song[]>;
    },
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch single song
  const getSong = async (songId: number): Promise<Song | null> => {
    try {
      const response = await apiRequest('GET', `/api/songs/single/${songId}`);
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      handleError(error as Error, 'Failed to fetch song');
      return null;
    }
  };

  // Delete song mutation
  const deleteSongMutation = useMutation({
    mutationFn: async (songId: number) => {
      const response = await apiRequest('DELETE', `/api/songs/${songId}`);
      if (!response.ok) throw new Error('Failed to delete song');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Song deleted",
        description: "The song has been removed from your library",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/songs', userId] });
    },
    onError: (error) => {
      handleError(error as Error, 'Delete failed');
    },
  });

  // Update song mutation
  const updateSongMutation = useMutation({
    mutationFn: async ({ songId, updates }: { songId: number; updates: Partial<Song> }) => {
      const response = await apiRequest('PUT', `/api/songs/${songId}`, updates);
      if (!response.ok) throw new Error('Failed to update song');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Song updated",
        description: "Your changes have been saved",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/songs', userId] });
    },
    onError: (error) => {
      handleError(error as Error, 'Update failed');
    },
  });

  // Favorite song mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (songId: number) => {
      const response = await apiRequest('POST', `/api/songs/${songId}/favorite`);
      if (!response.ok) throw new Error('Failed to toggle favorite');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/songs', userId] });
    },
    onError: (error) => {
      handleError(error as Error, 'Failed to update favorite');
    },
  });

  // Get songs by status
  const getSongsByStatus = (status: Song['status']) => {
    return songs.filter(song => song.status === status);
  };

  // Get favorite songs
  const getFavoriteSongs = () => {
    return songs.filter(song => song.likes > 0);
  };

  // Get recent songs
  const getRecentSongs = (limit = 10) => {
    return songs
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  };

  return {
    // Data
    songs,
    isLoading,
    error,
    
    // Actions
    getSong,
    refetch,
    deleteSong: deleteSongMutation.mutate,
    updateSong: updateSongMutation.mutate,
    toggleFavorite: toggleFavoriteMutation.mutate,
    
    // Derived data
    getSongsByStatus,
    getFavoriteSongs,
    getRecentSongs,
    
    // Status
    isDeleting: deleteSongMutation.isPending,
    isUpdating: updateSongMutation.isPending,
    isToggling: toggleFavoriteMutation.isPending,
  };
};
