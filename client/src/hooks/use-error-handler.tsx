
import React, { useState, useEffect, useCallback } from 'react';

interface ErrorInfo {
  message: string;
  stack?: string;
  timestamp: Date;
  component?: string;
  retryCount: number;
}

interface UseErrorHandlerReturn {
  hasError: boolean;
  error: ErrorInfo | null;
  clearError: () => void;
  retry: () => void;
  reportError: (error: Error, component?: string) => void;
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<ErrorInfo | null>(null);

  const reportError = useCallback((err: Error, component?: string) => {
    const errorInfo: ErrorInfo = {
      message: err.message,
      stack: err.stack,
      timestamp: new Date(),
      component,
      retryCount: 0
    };

    setError(errorInfo);
    setHasError(true);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by useErrorHandler:', err);
    }

    // Report to external service in production
    if (process.env.NODE_ENV === 'production') {
      // Send to logging service
      fetch('/api/error-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: errorInfo,
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      }).catch(() => {
        // Silently fail if error reporting fails
      });
    }
  }, []);

  const clearError = useCallback(() => {
    setHasError(false);
    setError(null);
  }, []);

  const retry = useCallback(() => {
    if (error) {
      setError(prev => prev ? { ...prev, retryCount: prev.retryCount + 1 } : null);
    }
    setHasError(false);
    
    // Reload the page if retry count is high
    if (error && error.retryCount >= 3) {
      window.location.reload();
    }
  }, [error]);

  // Global error listener for unhandled errors
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      reportError(new Error(event.message), 'Global');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      reportError(new Error(String(event.reason)), 'Promise');
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [reportError]);

  return {
    hasError,
    error,
    clearError,
    retry,
    reportError
  };
}

// React Error Boundary Component
export function ReplitErrorBoundary({ children }: { children: React.ReactNode }) {
  const { hasError, error, clearError, retry } = useErrorHandler();

  if (hasError && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L5.18 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-800">
                Something went wrong
              </h3>
            </div>
          </div>
          
          <div className="mt-2 text-sm text-gray-600">
            <p>We encountered an error while loading this component.</p>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-2">
                <summary className="cursor-pointer font-medium">Error Details</summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {error.message}
                </pre>
              </details>
            )}
          </div>

          <div className="mt-4 flex space-x-3">
            <button
              onClick={retry}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded text-sm font-medium hover:bg-gray-300 transition-colors"
            >
              Refresh Page
            </button>
          </div>

          {error.retryCount > 0 && (
            <p className="mt-2 text-xs text-gray-500 text-center">
              Retry attempt: {error.retryCount}
            </p>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
