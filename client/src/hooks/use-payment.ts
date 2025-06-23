
import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';

interface PaymentIntent {
  clientSecret: string;
  amount: number;
  currency: string;
  planType: string;
}

interface UsePaymentProps {
  onPaymentSuccess?: (planType: string) => void;
  onPaymentError?: (error: Error) => void;
}

export const usePayment = ({ onPaymentSuccess, onPaymentError }: UsePaymentProps = {}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  
  const { toast } = useToast();
  const { handleError } = useErrorHandler();
  const { user, updateUser } = useAuth();

  // Create payment intent
  const createPaymentIntentMutation = useMutation({
    mutationFn: async ({ planType, amount }: { planType: string; amount: number }) => {
      if (!user) throw new Error('User not authenticated');
      
      const response = await apiRequest('POST', '/api/payments/create-intent', {
        planType,
        amount,
        userId: user.id,
        currency: 'usd'
      });
      
      if (!response.ok) throw new Error('Failed to create payment intent');
      return response.json() as Promise<PaymentIntent>;
    },
    onSuccess: (intent) => {
      setPaymentIntent(intent);
      toast({
        title: "Payment initialized",
        description: "Please complete your payment to upgrade your plan",
      });
    },
    onError: (error) => {
      handleError(error as Error, 'Payment initialization failed');
      onPaymentError?.(error as Error);
    },
  });

  // Confirm payment
  const confirmPaymentMutation = useMutation({
    mutationFn: async ({ paymentIntentId, paymentMethodId }: { 
      paymentIntentId: string; 
      paymentMethodId: string; 
    }) => {
      if (!user) throw new Error('User not authenticated');
      
      const response = await apiRequest('POST', '/api/payments/confirm', {
        paymentIntentId,
        paymentMethodId,
        userId: user.id
      });
      
      if (!response.ok) throw new Error('Payment confirmation failed');
      return response.json();
    },
    onSuccess: (result) => {
      if (result.status === 'succeeded') {
        toast({
          title: "Payment successful!",
          description: `Welcome to ${result.planType} plan! Your account has been upgraded.`,
        });
        
        // Update user plan
        updateUser({ 
          plan: result.planType as 'free' | 'pro'
        });
        
        onPaymentSuccess?.(result.planType);
        setPaymentIntent(null);
      } else {
        throw new Error('Payment requires additional authentication');
      }
    },
    onError: (error) => {
      handleError(error as Error, 'Payment failed');
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

  // Get subscription status
  const getSubscriptionMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const response = await apiRequest('GET', `/api/payments/subscription?userId=${user.id}`);
      if (!response.ok) throw new Error('Failed to get subscription');
      return response.json();
    },
    onError: (error) => {
      handleError(error as Error, 'Failed to get subscription status');
    },
  });

  // Create customer portal session
  const createPortalSessionMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const response = await apiRequest('POST', '/api/payments/portal', {
        userId: user.id,
        returnUrl: window.location.origin
      });
      
      if (!response.ok) throw new Error('Failed to create portal session');
      return response.json();
    },
    onSuccess: (result) => {
      window.location.href = result.url;
    },
    onError: (error) => {
      handleError(error as Error, 'Failed to open billing portal');
    },
  });

  // High-level payment functions
  const initializePayment = useCallback((planType: string, amount: number) => {
    setIsProcessing(true);
    createPaymentIntentMutation.mutate({ planType, amount });
  }, [createPaymentIntentMutation]);

  const processPayment = useCallback(async (paymentMethodId: string) => {
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

  const openBillingPortal = useCallback(() => {
    createPortalSessionMutation.mutate();
  }, [createPortalSessionMutation]);

  const getSubscriptionStatus = useCallback(() => {
    return getSubscriptionMutation.mutateAsync();
  }, [getSubscriptionMutation]);

  return {
    // State
    isProcessing,
    paymentIntent,
    
    // Actions
    initializePayment,
    processPayment,
    cancelPayment,
    openBillingPortal,
    getSubscriptionStatus,
    
    // Status
    isCreatingIntent: createPaymentIntentMutation.isPending,
    isConfirming: confirmPaymentMutation.isPending,
    isCancelling: cancelPaymentMutation.isPending,
    isLoadingPortal: createPortalSessionMutation.isPending,
    isLoadingSubscription: getSubscriptionMutation.isPending,
    
    // Data
    subscriptionData: getSubscriptionMutation.data,
  };
};
