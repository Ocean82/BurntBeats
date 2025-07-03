
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

interface ApiHealthStatus {
  endpoint: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  lastChecked: Date;
}

export const useApiHealth = () => {
  const [healthStatus, setHealthStatus] = useState<ApiHealthStatus[]>([]);

  const criticalEndpoints = [
    '/api/health',
    '/api/generate-song',
    '/api/voice/synthesize',
    '/api/auth/login',
    '/api/pricing'
  ];

  const checkEndpointHealth = async (endpoint: string): Promise<ApiHealthStatus> => {
    const startTime = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(endpoint, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);
      const responseTime = performance.now() - startTime;

      return {
        endpoint,
        status: response.ok ? 
          (responseTime < 1000 ? 'healthy' : 'degraded') : 'down',
        responseTime,
        lastChecked: new Date()
      };
    } catch (error) {
      clearTimeout(timeoutId);
      return {
        endpoint,
        status: 'down',
        responseTime: performance.now() - startTime,
        lastChecked: new Date()
      };
    }
  };

  const { data: overallHealth, refetch } = useQuery({
    queryKey: ['api-health'],
    queryFn: async () => {
      const healthChecks = await Promise.all(
        criticalEndpoints.map(endpoint => checkEndpointHealth(endpoint))
      );
      setHealthStatus(healthChecks);
      return healthChecks;
    },
    refetchInterval: 60000, // Check every minute
    staleTime: 30000, // Consider stale after 30 seconds
    retry: 1,
  });

  const getOverallStatus = () => {
    if (!healthStatus.length) return 'unknown';
    
    const downServices = healthStatus.filter(s => s.status === 'down').length;
    const degradedServices = healthStatus.filter(s => s.status === 'degraded').length;
    
    if (downServices > 0) return 'down';
    if (degradedServices > 0) return 'degraded';
    return 'healthy';
  };

  const getAverageResponseTime = () => {
    if (!healthStatus.length) return 0;
    const total = healthStatus.reduce((sum, status) => sum + status.responseTime, 0);
    return Math.round(total / healthStatus.length);
  };

  return {
    healthStatus,
    overallStatus: getOverallStatus(),
    averageResponseTime: getAverageResponseTime(),
    refetch,
    isLoading: !overallHealth,
  };
};
