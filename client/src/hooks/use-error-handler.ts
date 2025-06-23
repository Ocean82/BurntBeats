
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ErrorHandlerOptions {
  errorTitle?: string;
  successMessage?: string;
  showToast?: boolean;
}

export const useErrorHandler = () => {
  const { toast } = useToast();

  const handleError = useCallback((error: Error, title = "An error occurred") => {
    console.error('Error:', error);
    
    // Parse error messages for better UX
    let message = error.message;
    if (message.includes('fetch')) {
      message = 'Network error. Please check your connection.';
    } else if (message.includes('unauthorized')) {
      message = 'Please log in again to continue.';
    } else if (message.includes('rate limit')) {
      message = 'Too many requests. Please wait a moment.';
    }

    toast({
      variant: "destructive",
      title,
      description: message,
    });
  }, [toast]);

  const handleAsync = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options: ErrorHandlerOptions = {}
  ): Promise<T | null> => {
    const { errorTitle = "Operation failed", successMessage, showToast = true } = options;
    
    try {
      const result = await asyncFn();
      
      if (successMessage && showToast) {
        toast({
          title: "Success",
          description: successMessage,
        });
      }
      
      return result;
    } catch (error) {
      if (showToast) {
        handleError(error as Error, errorTitle);
      }
      return null;
    }
  }, [handleError, toast]);

  const handleApiError = useCallback((response: Response, fallbackMessage = "API request failed") => {
    if (!response.ok) {
      const statusMessages: Record<number, string> = {
        400: "Invalid request. Please check your input.",
        401: "Authentication required. Please log in.",
        403: "Permission denied. Upgrade your plan.",
        404: "Resource not found.",
        429: "Too many requests. Please slow down.",
        500: "Server error. Please try again later.",
      };
      
      const message = statusMessages[response.status] || fallbackMessage;
      throw new Error(message);
    }
  }, []);

  return {
    handleError,
    handleAsync,
    handleApiError,
  };
};
