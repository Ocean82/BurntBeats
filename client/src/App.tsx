import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { ReplitErrorBoundary } from '@/hooks/use-error-handler';
import SongGenerator from '@/pages/song-generator';

// Create a query client with proper configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  console.log('Burnt Beats Frontend Loaded');

  return (
    <ReplitErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-900 text-white">
          <SongGenerator />
          <Toaster />
        </div>
      </QueryClientProvider>
    </ReplitErrorBoundary>
  );
}

export default App;