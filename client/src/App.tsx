import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch } from 'wouter';
import { Toaster } from '@/components/ui/toaster';
import AuthForm from '@/components/auth-form';
import SongGenerator from '@/pages/song-generator';
import NotFound from '@/pages/not-found';
import PurchaseSuccess from '@/pages/purchase-success';
import CacheTest from '@/pages/cache-test';
import SongCreationDemo from '@/pages/song-creation-demo';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check for stored user on app load
  useState(() => {
    const storedUser = localStorage.getItem('burntbeats_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (e) {
        localStorage.removeItem('burntbeats_user');
      }
    }
  });

  const handleAuthSuccess = (userData: any) => {
    setUser(userData);
    localStorage.setItem('burntbeats_user', JSON.stringify(userData));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthForm onAuthSuccess={handleAuthSuccess} />
        <Toaster />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-dark">
        <Switch>
          <Route path="/" component={SongGenerator} />
          <Route path="/success" component={PurchaseSuccess} />
          <Route path="/cache-test" component={CacheTest} />
          <Route path="/demo" component={SongCreationDemo} />
          <Route component={NotFound} />
        </Switch>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;