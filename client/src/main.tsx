import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// ======================
// 1. ENHANCED LOGGING SYSTEM
// ======================
const log = (message, level = "info") => {
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
      retry: (failureCount, error) => {
        // Don't retry on 404s, but retry others once
        return error?.response?.status !== 404 && failureCount <= 1;
      },
      refetchOnWindowFocus: process.env.NODE_ENV === "production",
      onError: (error) => {
        log(`Query Error: ${error.message}`, "error");
        // TODO: Send to error tracking service
      }
    },
    mutations: {
      onError: (error) => {
        log(`Mutation Error: ${error.message}`, "error");
      }
    }
  }
});

// ======================
// 3. ERROR BOUNDARY (Production-Grade)
// ======================
class RootErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
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
    const { startTransition } = require("react");
    const { reportWebVitals } = require("./utils/vitals");

    reportWebVitals((metric) => {
      log(`Perf: ${metric.name} = ${Math.round(metric.value)}ms`, "debug");
    });
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
          {process.env.NODE_ENV === "development" && (
            <ReactQueryDevtools 
              position="bottom-right" 
              initialIsOpen={false} 
            />
          )}
        </QueryClientProvider>
      </RootErrorBoundary>
    </StrictMode>
  );

  startPerformanceTracking();
  log("Frontend Mounted Successfully", "info");

} catch (error) {
  log(`FATAL: ${error.message}`, "error");

  // Fallback UI if root fails completely
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif;">
      <h1 style="color: #e74c3c;">Burnt Beats Failed to Load</h1>
      <p>${error.message}</p>
      <button 
        style="padding: 10px; background: #e74c3c; color: white; border: none;"
        onclick="window.location.reload()"
      >
        Reload
      </button>
    </div>
  `;
}
