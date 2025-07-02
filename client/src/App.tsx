import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch } from 'wouter';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { Toaster } from '@/components/ui/toaster';
import { Loader2 } from 'lucide-react';

// Import pages
import AuthPage from '@/pages/auth-page';
import UserAgreement from '@/components/UserAgreement';
import BurntBeatsEnhancedComplete from './components/BurntBeatsEnhancedComplete';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function AppContent() {
  const { user, isLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-orange-500/50">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-2">
            Burnt Beats
          </h1>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show login page
  if (!user) {
    return <AuthPage />;
  }

  // Authenticated but hasn't accepted agreement - show agreement page
  if (user && !user.agreementAccepted) {
    return (
      <UserAgreement 
        user={{
          id: user.id,
          username: user.username,
          email: user.email
        }}
        onAccepted={() => {
          // Refresh user data to show agreement accepted
          window.location.reload();
        }}
      />
    );
  }

  // Authenticated and agreement accepted - show main app
  return <BurntBeatsEnhancedComplete />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="App">
          <AppContent />
          <Toaster />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;