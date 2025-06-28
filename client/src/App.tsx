import React from "react";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { NavigationControls } from "@/components/NavigationControls";
import SongGenerator from "./pages/song-generator";
import NotFound from "./pages/not-found";
import PurchaseSuccess from "./pages/purchase-success";
import CacheTestPage from "./pages/cache-test";

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-2">
          <NavigationControls showDebugInfo={process.env.NODE_ENV === 'development'} />
        </div>
      </div>
      <Switch>
        <Route path="/" component={SongGenerator} />
        <Route path="/purchase-success" component={PurchaseSuccess} />
        <Route path="/cache-test" component={CacheTestPage} />
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </div>
  );
}

export default App;