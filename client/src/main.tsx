import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ======================
// 1. ENHANCED LOGGING SYSTEM
// ======================
const log = (message: string, level: "info" | "error" | "debug" = "info") => {
  const styles = {
    info: "color: #4CAF50; font-weight: bold",
    error: "color: #F44336; font-weight: bold",
    debug: "color: #2196F3; font-weight: bold"
  };
  console.log(`%c[Burnt Beats] ${message}`, styles[level]);
};

log("Frontend Initializing...", "info");

// ======================
// 2. QUERY CLIENT CONFIG
// ======================
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 404s, but retry others once
        return error?.response?.status !== 404 && failureCount <= 1;
      },
      refetchOnWindowFocus: process.env.NODE_ENV === "production"
    }
  }
});

// ======================
// 3. ERROR BOUNDARY (Production-Grade)
// ======================
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class RootErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    log(`CRITICAL: ${error.toString()}`, "error");
    console.error("Error Stack:", errorInfo.componentStack);
    // TODO: Send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 text-red-900">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="mb-4">{this.state.error?.message}</p>
          <button 
            className="px-4 py-2 bg-red-500 text-white rounded"
            onClick={() => window.location.reload()}
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ======================
// 4. PERFORMANCE MONITORING
// ======================
const startPerformanceTracking = () => {
  if (process.env.NODE_ENV === "development") {
    // Basic performance tracking without external dependencies
    try {
      if (typeof window.performance !== 'undefined') {
        window.addEventListener('load', () => {
          const loadTime = performance.now();
          log(`Page Load: ${Math.round(loadTime)}ms`, "debug");
        });
      }
    } catch (error) {
      log(`Performance tracking error: ${error.message}`, "debug");
    }
  }
};

// ======================
// 5. MAIN RENDER FUNCTION
// ======================
try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element '#root' not found in DOM");
  }

  const root = createRoot(rootElement);

  root.render(
    <StrictMode>
      <RootErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </RootErrorBoundary>
    </StrictMode>
  );

  startPerformanceTracking();
  log("Frontend Mounted Successfully", "info");

} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  log(`FATAL: ${errorMessage}`, "error");

  // Fallback UI if root fails completely
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif;">
      <h1 style="color: #e74c3c;">Burnt Beats Failed to Load</h1>
      <p>${errorMessage}</p>
      <button 
        style="padding: 10px; background: #e74c3c; color: white; border: none;"
        onclick="window.location.reload()"
      >
        Reload
      </button>
    </div>
  `;
}
