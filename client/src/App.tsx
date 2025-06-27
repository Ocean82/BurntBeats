import React from "react";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import SongGenerator from "./pages/song-generator";
import NotFound from "./pages/not-found";
import PurchaseSuccess from "./pages/purchase-success";

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Switch>
        <Route path="/" component={SongGenerator} />
        <Route path="/purchase-success" component={PurchaseSuccess} />
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </div>
  );
}

export default App;