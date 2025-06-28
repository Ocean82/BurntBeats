import { useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigationCache } from './useNavigationCache';

interface SmartCacheOptions {
  preload?: boolean;
  staleTime?: number;
  cacheTime?: number;
  priority?: 'low' | 'normal' | 'high';
}

interface PreloadRule {
  trigger: string;
  preloadRoutes: string[];
  condition?: () => boolean;
}

class SmartCacheManager {
  private preloadRules: PreloadRule[] = [];
  private queryClient: any;
  private preloadQueue: string[] = [];
  private isPreloading = false;

  setQueryClient(client: any) {
    this.queryClient = client;
  }

  addPreloadRule(rule: PreloadRule) {
    this.preloadRules.push(rule);
  }

  async triggerPreload(currentRoute: string) {
    if (this.isPreloading) return;

    const matchingRules = this.preloadRules.filter(rule => 
      currentRoute.includes(rule.trigger) && 
      (!rule.condition || rule.condition())
    );

    for (const rule of matchingRules) {
      for (const route of rule.preloadRoutes) {
        if (!this.preloadQueue.includes(route)) {
          this.preloadQueue.push(route);
        }
      }
    }

    this.processPreloadQueue();
  }

  private async processPreloadQueue() {
    if (this.isPreloading || this.preloadQueue.length === 0) return;

    this.isPreloading = true;

    while (this.preloadQueue.length > 0) {
      const route = this.preloadQueue.shift();
      if (route && this.queryClient) {
        try {
          // Preload data for the route
          await this.queryClient.prefetchQuery({
            queryKey: [route],
            staleTime: 2 * 60 * 1000, // 2 minutes
          });
        } catch (error) {
          console.warn('Failed to preload route:', route, error);
        }
      }
      
      // Small delay to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isPreloading = false;
  }

  clearPreloadQueue() {
    this.preloadQueue = [];
    this.isPreloading = false;
  }
}

const smartCacheManager = new SmartCacheManager();

export function useSmartCache<T = any>(
  key: string | string[],
  options: SmartCacheOptions = {}
) {
  const queryClient = useQueryClient();
  const navigationCache = useNavigationCache();
  const cacheKeyRef = useRef<string>();

  // Initialize smart cache manager
  useEffect(() => {
    smartCacheManager.setQueryClient(queryClient);
  }, [queryClient]);

  // Generate cache key
  const cacheKey = Array.isArray(key) ? key.join('-') : key;
  cacheKeyRef.current = cacheKey;

  // Setup preload rules for common navigation patterns
  useEffect(() => {
    // Preload song library when user visits create page
    smartCacheManager.addPreloadRule({
      trigger: '/create',
      preloadRoutes: ['/api/songs', '/api/voice-samples'],
      condition: () => true
    });

    // Preload user data when visiting dashboard
    smartCacheManager.addPreloadRule({
      trigger: '/dashboard',
      preloadRoutes: ['/api/auth/user', '/api/pricing/usage'],
      condition: () => true
    });

    // Preload voice bank data when visiting voice cloning
    smartCacheManager.addPreloadRule({
      trigger: '/voice-cloning',
      preloadRoutes: ['/api/voice-bank/profiles', '/api/voice-bank/stats'],
      condition: () => true
    });
  }, []);

  const query = useQuery({
    queryKey: Array.isArray(key) ? key : [key],
    staleTime: options.staleTime || 30000, // 30 seconds default
    gcTime: options.cacheTime || 5 * 60 * 1000, // 5 minutes default
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.message?.includes('401')) return false;
      return failureCount < 2;
    },
  });

  // Cache successful data in navigation cache
  useEffect(() => {
    if (query.data && query.isSuccess && cacheKeyRef.current) {
      navigationCache.set(cacheKeyRef.current, query.data);
    }
  }, [query.data, query.isSuccess, navigationCache]);

  // Intelligent prefetching based on user behavior
  const prefetchRelated = useCallback(async (relatedKeys: string[]) => {
    for (const relatedKey of relatedKeys) {
      try {
        await queryClient.prefetchQuery({
          queryKey: [relatedKey],
          staleTime: 60000, // 1 minute
        });
      } catch (error) {
        console.warn('Failed to prefetch related data:', relatedKey);
      }
    }
  }, [queryClient]);

  // Cache warming for critical paths
  const warmCache = useCallback(async (routes: string[]) => {
    const promises = routes.map(route => 
      queryClient.prefetchQuery({
        queryKey: [route],
        staleTime: 2 * 60 * 1000, // 2 minutes
      })
    );

    try {
      await Promise.allSettled(promises);
    } catch (error) {
      console.warn('Cache warming partially failed:', error);
    }
  }, [queryClient]);

  // Get cached data even when offline
  const getCachedData = useCallback((): T | null => {
    if (cacheKeyRef.current) {
      return navigationCache.get(cacheKeyRef.current) || null;
    }
    return null;
  }, [navigationCache]);

  // Force refresh data
  const forceRefresh = useCallback(async () => {
    const queryKey = Array.isArray(key) ? key : [key];
    await queryClient.invalidateQueries({ queryKey });
    return queryClient.refetchQueries({ queryKey });
  }, [key, queryClient]);

  return {
    ...query,
    prefetchRelated,
    warmCache,
    getCachedData,
    forceRefresh,
    isCached: navigationCache.has(cacheKey),
  };
}

// Hook for managing cache performance
export function useCachePerformance() {
  const queryClient = useQueryClient();
  const navigationCache = useNavigationCache();

  const getPerformanceStats = useCallback(() => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    const stats = {
      totalQueries: queries.length,
      staleQueries: queries.filter(q => q.isStale()).length,
      fetchingQueries: queries.filter(q => q.isFetching()).length,
      errorQueries: queries.filter(q => q.state.status === 'error').length,
      memoryUsage: 0, // Approximate
      cacheHitRate: 0,
    };

    // Calculate approximate memory usage
    try {
      stats.memoryUsage = JSON.stringify(
        queries.map(q => q.state.data)
      ).length;
    } catch {
      stats.memoryUsage = 0;
    }

    return stats;
  }, [queryClient]);

  const optimizeCache = useCallback(() => {
    // Remove stale queries
    queryClient.getQueryCache().getAll()
      .filter(query => query.isStale())
      .forEach(query => {
        queryClient.removeQueries({ queryKey: query.queryKey });
      });

    // Clear old navigation cache
    navigationCache.clear();
  }, [queryClient, navigationCache]);

  const preloadCriticalData = useCallback(async () => {
    const criticalRoutes = [
      '/api/auth/user',
      '/api/songs',
      '/api/voice-bank/stats'
    ];

    const promises = criticalRoutes.map(route =>
      queryClient.prefetchQuery({
        queryKey: [route],
        staleTime: 5 * 60 * 1000, // 5 minutes
      })
    );

    await Promise.allSettled(promises);
  }, [queryClient]);

  return {
    getPerformanceStats,
    optimizeCache,
    preloadCriticalData,
  };
}

export { smartCacheManager };