
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { apiRequest } from '@/lib/queryClient';

interface AnalyticsData {
  totalSongs: number;
  songsThisMonth: number;
  totalPlays: number;
  averageRating: number;
  genreBreakdown: Record<string, number>;
  monthlyActivity: Array<{ date: string; count: number }>;
  topSongs: Array<{ id: number; title: string; plays: number; rating: number }>;
  userActivity: {
    loginCount: number;
    lastLogin: string;
    generationTime: number;
    favoriteGenres: string[];
  };
}

interface UseAnalyticsProps {
  userId: number;
  enabled?: boolean;
}

export const useAnalytics = ({ userId, enabled = true }: UseAnalyticsProps) => {
  const { handleError } = useErrorHandler();
  const queryClient = useQueryClient();

  // Fetch analytics data
  const {
    data: analytics,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['/api/analytics', userId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/analytics?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json() as Promise<AnalyticsData>;
    },
    enabled: enabled && !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchInterval: 30 * 60 * 1000, // Auto-refresh every 30 minutes
    retry: 2,
    retryDelay: 5000, // 5 second delay between retries
  });

  // Track event mutation
  const trackEventMutation = useMutation({
    mutationFn: async ({ event, data }: { event: string; data?: Record<string, any> }) => {
      const response = await apiRequest('POST', '/api/analytics/track', {
        userId,
        event,
        data,
        timestamp: new Date().toISOString()
      });
      if (!response.ok) throw new Error('Failed to track event');
      return response.json();
    },
    onError: (error) => {
      // Silently handle analytics errors to not interrupt user flow
      console.warn('Analytics tracking failed:', error);
    },
  });

  // Track song play
  const trackSongPlay = (songId: number, duration?: number) => {
    trackEventMutation.mutate({
      event: 'song_play',
      data: { songId, duration }
    });
  };

  // Track song generation
  const trackSongGeneration = (songData: { genre: string; style: string; duration: number }) => {
    trackEventMutation.mutate({
      event: 'song_generation',
      data: songData
    });
  };

  // Track feature usage
  const trackFeatureUsage = (feature: string, metadata?: Record<string, any>) => {
    trackEventMutation.mutate({
      event: 'feature_usage',
      data: { feature, ...metadata }
    });
  };

  // Track user engagement
  const trackEngagement = (action: string, context?: Record<string, any>) => {
    trackEventMutation.mutate({
      event: 'user_engagement',
      data: { action, ...context }
    });
  };

  // Export analytics data
  const exportAnalyticsMutation = useMutation({
    mutationFn: async (format: 'csv' | 'json') => {
      const response = await apiRequest('POST', '/api/analytics/export', {
        userId,
        format
      });
      if (!response.ok) throw new Error('Failed to export analytics');
      return response.blob();
    },
    onError: (error) => {
      handleError(error as Error, 'Export failed');
    },
  });

  const exportAnalytics = (format: 'csv' | 'json') => {
    exportAnalyticsMutation.mutate(format);
  };

  // Computed metrics
  const getGrowthRate = () => {
    if (!analytics?.monthlyActivity || analytics.monthlyActivity.length < 2) return 0;
    
    const thisMonth = analytics.monthlyActivity[analytics.monthlyActivity.length - 1]?.count || 0;
    const lastMonth = analytics.monthlyActivity[analytics.monthlyActivity.length - 2]?.count || 0;
    
    if (lastMonth === 0) return 100;
    return ((thisMonth - lastMonth) / lastMonth) * 100;
  };

  const getEngagementScore = () => {
    if (!analytics) return 0;
    
    // Simple engagement score based on plays, ratings, and song creation
    const playScore = Math.min(analytics.totalPlays / 100, 1) * 40;
    const ratingScore = (analytics.averageRating / 5) * 30;
    const creationScore = Math.min(analytics.totalSongs / 20, 1) * 30;
    
    return Math.round(playScore + ratingScore + creationScore);
  };

  return {
    // Data
    analytics,
    isLoading,
    error,
    
    // Actions
    refetch,
    trackSongPlay,
    trackSongGeneration,
    trackFeatureUsage,
    trackEngagement,
    exportAnalytics,
    
    // Computed metrics
    growthRate: getGrowthRate(),
    engagementScore: getEngagementScore(),
    
    // Status
    isExporting: exportAnalyticsMutation.isPending,
  };
};
