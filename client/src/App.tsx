import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import SongGenerator from "@/pages/song-generator";
import NotFound from "@/pages/not-found";
import AuthForm from "@/components/auth-form";
import PaymentForm from "@/components/payment-form";
import { useAuth } from "@/hooks/use-auth";

function Router() {
  const { user, login, logout, updateUser, isAuthenticated, isLoading } = useAuth();
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
          updateUser({ plan: "pro" });
          setShowPayment(false);
        }}
        onCancel={() => setShowPayment(false)}
      />
    );
  }

  if (!isAuthenticated) {
    return <AuthForm onAuthSuccess={login} />;
  }

  return (
    <Switch>
      <Route path="/">
        <SongGenerator 
          user={user}
          onUpgrade={() => setShowPayment(true)}
          onLogout={logout}
        />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
