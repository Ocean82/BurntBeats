
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface SystemHealthData {
  success: boolean;
  status: {
    timestamp: string;
    uptime: number;
    memory: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    environment: string;
    version: string;
    webhooks: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      endpoints: Array<{
        name: string;
        status: 'up' | 'down';
        responseTime: number;
        error?: string;
      }>;
    };
    services: {
      database: string;
      stripe: string;
      fileStorage: string;
    };
  };
}

export function useSystemHealth() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const { 
    data: healthData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery<SystemHealthData>({
    queryKey: ['system-health'],
    queryFn: async () => {
      const response = await fetch('/api/system-status');
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      return response.json();
    },
    refetchInterval: 30000, // Check every 30 seconds
    retry: 3,
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  const isHealthy = isOnline && 
                   healthData?.success && 
                   healthData?.status?.webhooks?.status === 'healthy';

  const isDegraded = isOnline && 
                    healthData?.success && 
                    healthData?.status?.webhooks?.status === 'degraded';

  return {
    isHealthy,
    isDegraded,
    isUnhealthy: !isHealthy && !isDegraded && isOnline,
    isOffline: !isOnline,
    isLoading,
    error,
    healthData,
    refetch,
    services: healthData?.status?.services || {},
    webhooks: healthData?.status?.webhooks || null,
    uptime: healthData?.status?.uptime || 0,
    memory: healthData?.status?.memory || null
  };
}
