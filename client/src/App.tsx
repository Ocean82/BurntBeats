import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import SongGenerator from "@/pages/song-generator";
import PurchaseSuccess from "@/pages/purchase-success";
import NotFound from "@/pages/not-found";
import LandingPage from "@/components/landing-page";
import PaymentForm from "@/components/payment-form";
import { useAuth } from "@/hooks/useAuth";
import { ReplitErrorBoundary } from "./hooks/use-error-handler";
import { PerformanceMonitor } from "./components/performance-monitor";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [showPayment, setShowPayment] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (showPayment && user) {
    return (
      <PaymentForm
        onUpgradeSuccess={() => {
          setShowPayment(false);
          window.location.reload(); // Reload to get updated user data
        }}
        onCancel={() => setShowPayment(false)}
      />
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return (
    <Switch>
      <Route path="/">
        <SongGenerator 
          user={user}
          onLogout={() => window.location.href = "/api/logout"}
        />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ReplitErrorBoundary>
        <TooltipProvider>
          <Toaster />
          <Router />
          <PerformanceMonitor />
        </TooltipProvider>
      </ReplitErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;