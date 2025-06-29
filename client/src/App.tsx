import React, { useState, useEffect } from "react";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { NavigationControls } from "@/components/NavigationControls";
import SongGenerator from "./pages/song-generator";
import NotFound from "./pages/not-found";
import PurchaseSuccess from "./pages/purchase-success";
import CacheTestPage from "./pages/cache-test";
import { Button } from "@/components/ui/button";
import { Music } from "lucide-react";

function App() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try to get user data from API or set default user
    const initializeUser = async () => {
      try {
        const response = await fetch('/api/auth/user');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // Set default user for now
          setUser({
            id: 1,
            username: 'demo-user',
            plan: 'free',
            songsThisMonth: 0
          });
        }
      } catch (error) {
        // Fallback to demo user
        setUser({
          id: 1,
          username: 'demo-user',
          plan: 'free',
          songsThisMonth: 0
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, []);

  const handleLogout = () => {
    setUser(null);
    window.location.href = '/api/logout';
  };

  const handleUpgrade = () => {
    console.log('Upgrade clicked');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <Music className="h-12 w-12 mx-auto mb-4 animate-pulse" />
          <p>Loading Burnt Beats...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to Burnt Beats</h1>
          <p className="text-lg mb-6">AI-Powered Music Creation Platform</p>
          <Button onClick={() => window.location.href = '/api/login'}>
            Get Started
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-2">
          <NavigationControls showDebugInfo={process.env.NODE_ENV === 'development'} />
        </div>
      </div>
      <Switch>
        <Route path="/">
          <SongGenerator 
            user={user} 
            onUpgrade={handleUpgrade}
            onLogout={handleLogout}
          />
        </Route>
        <Route path="/purchase-success" component={PurchaseSuccess} />
        <Route path="/cache-test" component={CacheTestPage} />
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </div>
  );
}

export default App;