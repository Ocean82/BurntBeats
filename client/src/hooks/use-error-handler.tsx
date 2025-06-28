import React from 'react';
import { useToast } from './use-toast';

interface ErrorDetails {
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
}

export const useErrorHandler = () => {
  const { toast } = useToast();

  const handleError = React.useCallback((error: Error | ErrorDetails, context?: string) => {
    console.error('Error occurred:', error, 'Context:', context);

    let title = 'An error occurred';
    let description = 'Something went wrong. Please try again.';

    if (typeof error === 'object' && error !== null) {
      if ('message' in error) {
        description = error.message;
      }

      if ('statusCode' in error) {
        switch (error.statusCode) {
          case 401:
            title = 'Authentication required';
            description = 'Please log in to continue.';
            break;
          case 403:
            title = 'Access denied';
            description = 'You don\'t have permission to perform this action.';
            break;
          case 404:
            title = 'Not found';
            description = 'The requested resource was not found.';
            break;
          case 429:
            title = 'Rate limit exceeded';
            description = 'Too many requests. Please wait a moment and try again.';
            break;
          case 500:
            title = 'Server error';
            description = 'Internal server error. Please try again later.';
            break;
        }
      }
    }

    if (context) {
      title = context;
    }

    toast({
      title,
      description,
      variant: 'destructive',
    });
  }, [toast]);

  const handleApiError = React.useCallback(async (response: Response) => {
    try {
      const errorData = await response.json();
      handleError({
        message: errorData.message || 'API request failed',
        statusCode: response.status,
        details: errorData,
      });
    } catch {
      handleError({
        message: `HTTP ${response.status}: ${response.statusText}`,
        statusCode: response.status,
      });
    }
  }, [handleError]);

  return {
    handleError,
    handleApiError,
  };
};

// React Error Boundary Component
export function ReplitErrorBoundary({ children }: { children: React.ReactNode }) {
  const { handleError } = useErrorHandler(); // Modified this line
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState<any>(null);

  React.useEffect(() => {
    const errorHandler = (e: any) => {
      setHasError(true);
      setError(e.error);
      handleError(e.error, "Global Error");
    };

    window.addEventListener('error', errorHandler);
    return () => {
      window.removeEventListener('error', errorHandler);
    };
  }, [handleError]);

  const clearError = () => {
    setHasError(false);
    setError(null);
  };

  const retry = () => {
    clearError();
    window.location.reload();
  };

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
        </div>
      </div>
    );
  }

  return <>{children}</>;
}