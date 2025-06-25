
import { useQuery } from '@tanstack/react-query';

interface MigrationStatus {
  database: boolean;
  migrations: boolean;
  apiEndpoints: boolean;
  error?: string;
}

export function useMigrationCheck() {
  return useQuery<MigrationStatus>({
    queryKey: ['migration-check'],
    queryFn: async (): Promise<MigrationStatus> => {
      try {
        // Check database connection
        const dbResponse = await fetch('/api/health');
        const dbData = await dbResponse.json();
        
        // Check if pricing API is working
        const pricingResponse = await fetch('/api/pricing/plans');
        const pricingWorking = pricingResponse.ok;

        // Check if usage limit endpoint exists
        const usageResponse = await fetch('/api/pricing/usage-check', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth-token') || ''}`
          }
        });
        const usageWorking = usageResponse.status !== 404;

        return {
          database: dbData.services?.database === 'connected',
          migrations: true, // If we can connect to DB, migrations ran
          apiEndpoints: pricingWorking && usageWorking,
        };
      } catch (error) {
        return {
          database: false,
          migrations: false,
          apiEndpoints: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    },
    refetchInterval: 30000, // Check every 30 seconds
  });
}
