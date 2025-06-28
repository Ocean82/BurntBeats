import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';

interface PaymentIntent {
  clientSecret: string;
  amount: number;
  currency: string;
  downloadType: string;
  songId: string;
}

interface UsePaymentProps {
  onPaymentSuccess?: (downloadType: string, songId: string) => void;
  onPaymentError?: (error: Error) => void;
}

export const usePayment = ({ onPaymentSuccess, onPaymentError }: UsePaymentProps = {}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);

  const { toast } = useToast();
  const { handleError } = useErrorHandler();
  const { user } = useAuth();

  // Create payment intent for song download
  const createPaymentIntentMutation = useMutation({
    mutationFn: async ({ 
      downloadType, 
      amount, 
      songId 
    }: { 
      downloadType: string; 
      amount: number; 
      songId: string; 
    }) => {
      const response = await apiRequest('POST', '/api/create-payment-intent', {
        downloadType,
        amount,
        songId,
        currency: 'usd',
        userEmail: user?.email || 'guest@example.com'
      });

      if (!response.ok) throw new Error('Failed to create payment intent');
      return response.json() as Promise<PaymentIntent>;
    },
    onSuccess: (intent) => {
      setPaymentIntent(intent);
      toast({
        title: "Payment initialized",
        description: `Ready to purchase ${intent.downloadType} download for $${(intent.amount / 100).toFixed(2)}`,
      });
    },
    onError: (error) => {
      handleError(error as Error, 'Payment initialization failed');
      onPaymentError?.(error as Error);
    },
  });

  // Confirm download payment
  const confirmPaymentMutation = useMutation({
    mutationFn: async ({ paymentIntentId, paymentMethodId }: { 
      paymentIntentId: string; 
      paymentMethodId: string; 
    }) => {
      const response = await apiRequest('POST', '/api/payments/confirm-download', {
        paymentIntentId,
        paymentMethodId,
        userEmail: user?.email || 'guest@example.com'
      });

      if (!response.ok) throw new Error('Payment confirmation failed');
      return response.json();
    },
    onSuccess: (result) => {
      if (result.status === 'succeeded') {
        toast({
          title: "Download purchased!",
          description: `Your ${result.downloadType} is ready for download`,
        });

        onPaymentSuccess?.(result.downloadType, result.songId);
        setPaymentIntent(null);
      } else {
        throw new Error('Payment requires additional authentication');
      }
    },
    onError: (error) => {
      handleError(error as Error, 'Download payment failed');
      onPaymentError?.(error as Error);
    },
  });

  // Cancel payment
  const cancelPaymentMutation = useMutation({
    mutationFn: async (paymentIntentId: string) => {
      const response = await apiRequest('POST', '/api/payments/cancel', {
        paymentIntentId
      });

      if (!response.ok) throw new Error('Failed to cancel payment');
      return response.json();
    },
    onSuccess: () => {
      setPaymentIntent(null);
      toast({
        title: "Payment cancelled",
        description: "Your payment has been cancelled successfully",
      });
    },
    onError: (error) => {
      handleError(error as Error, 'Cancellation failed');
    },
  });

  // Get purchase history
  const getPurchaseHistoryMutation = useMutation({
    mutationFn: async () => {
      if (!user?.email) throw new Error('User not authenticated');

      const response = await apiRequest('GET', `/api/purchases/history?userEmail=${user.email}`);
      if (!response.ok) throw new Error('Failed to get purchase history');
      return response.json();
    },
    onError: (error) => {
      handleError(error as Error, 'Failed to get purchase history');
    },
  });

  // High-level payment functions
  const initializeDownloadPayment = useCallback((downloadType: string, amount: number, songId: string) => {
    setIsProcessing(true);
    createPaymentIntentMutation.mutate({ downloadType, amount, songId });
  }, [createPaymentIntentMutation]);

  const processDownloadPayment = useCallback(async (paymentMethodId: string) => {
    if (!paymentIntent) throw new Error('No payment intent available');

    setIsProcessing(true);
    try {
      await confirmPaymentMutation.mutateAsync({
        paymentIntentId: paymentIntent.clientSecret.split('_secret_')[0],
        paymentMethodId
      });
    } finally {
      setIsProcessing(false);
    }
  }, [paymentIntent, confirmPaymentMutation]);

  const cancelPayment = useCallback(() => {
    if (!paymentIntent) return;

    const paymentIntentId = paymentIntent.clientSecret.split('_secret_')[0];
    cancelPaymentMutation.mutate(paymentIntentId);
  }, [paymentIntent, cancelPaymentMutation]);

  const getPurchaseHistory = useCallback(() => {
    return getPurchaseHistoryMutation.mutateAsync();
  }, [getPurchaseHistoryMutation]);

  return {
    // State
    isProcessing,
    paymentIntent,

    // Actions
    initializeDownloadPayment,
    processDownloadPayment,
    cancelPayment,
    getPurchaseHistory,

    // Status
    isCreatingIntent: createPaymentIntentMutation.isPending,
    isConfirming: confirmPaymentMutation.isPending,
    isCancelling: cancelPaymentMutation.isPending,
    isLoadingHistory: getPurchaseHistoryMutation.isPending,

    // Data
    purchaseHistory: getPurchaseHistoryMutation.data,
  };
};