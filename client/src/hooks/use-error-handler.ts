import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseErrorHandlerOptions {
  showToast?: boolean;
  logErrors?: boolean;
}

export const useErrorHandler = (options: UseErrorHandlerOptions = {}) => {
  const { showToast = true, logErrors = true } = options;
  const { toast } = useToast();
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleError = useCallback((error: Error | string, title?: string) => {
    const errorObj = error instanceof Error ? error : new Error(error);
    setError(errorObj);
    
    if (logErrors) {
      console.error('Error handled by useErrorHandler:', errorObj);
    }

    if (showToast) {
      toast({
        title: title || "Error",
        description: errorObj.message,
        variant: "destructive"
      });
    }
  }, [toast, showToast, logErrors]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleAsync = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options?: { 
      loadingState?: boolean;
      errorTitle?: string;
      successMessage?: string;
    }
  ): Promise<T | null> => {
    try {
      if (options?.loadingState) {
        setIsLoading(true);
      }
      clearError();
      
      const result = await asyncFn();
      
      if (options?.successMessage) {
        toast({
          title: "Success",
          description: options.successMessage,
        });
      }
      
      return result;
    } catch (error) {
      handleError(error as Error, options?.errorTitle);
      return null;
    } finally {
      if (options?.loadingState) {
        setIsLoading(false);
      }
    }
  }, [handleError, clearError, toast]);

  return { 
    error, 
    isLoading,
    handleError, 
    clearError,
    handleAsync
  };
};