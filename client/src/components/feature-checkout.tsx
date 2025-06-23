import { useState } from "react";
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CreditCard, Shield, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface Feature {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: React.ReactNode;
}

interface FeatureCheckoutProps {
  features: Feature[];
  total: number;
  onBack: () => void;
  onSuccess: () => void;
}

const CheckoutForm = ({ features, total, onBack, onSuccess }: FeatureCheckoutProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
        },
      });

      if (error) {
        toast({
          title: "Payment failed faster than your music career",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment successful!",
          description: "Now let's see if your music is worth what you paid...",
        });
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Even our payment system has better rhythm than most users",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {features.map(feature => (
              <div key={feature.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {feature.icon}
                  <span className="text-white">{feature.name}</span>
                </div>
                <Badge variant="secondary" className="bg-green-900 text-green-400">
                  ${feature.price}
                </Badge>
              </div>
            ))}
            
            <Separator className="bg-gray-600" />
            
            <div className="flex items-center justify-between font-bold text-lg">
              <span className="text-white">Total</span>
              <span className="text-green-400">${total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Payment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement />
            
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Shield className="w-4 h-4" />
              <span>Secured by Stripe. Your payment info is encrypted and safe.</span>
            </div>

            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={isProcessing}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Cart
              </Button>
              
              <Button
                type="submit"
                disabled={!stripe || isProcessing}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              >
                {isProcessing ? (
                  <div className="flex items-center">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Pay ${total.toFixed(2)}
                  </div>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="text-center text-gray-400 text-sm">
        <p>After payment, you'll be redirected to create your song with the selected features.</p>
        <p className="mt-1">No refunds if your song sounds like nails on a chalkboard.</p>
      </div>
    </div>
  );
};

export default function FeatureCheckout({ features, total, onBack, onSuccess }: FeatureCheckoutProps) {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useState(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await apiRequest("POST", "/api/create-payment-intent", { 
          amount: total,
          features: features.map(f => f.id)
        });
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error('Failed to create payment intent:', error);
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-300">Setting up your payment...</p>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Failed to initialize payment</p>
          <Button onClick={onBack} variant="outline">
            Back to Cart
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          💳 Checkout
        </h1>
        <p className="text-gray-300 text-lg">
          Time to put your money where your mouth is
        </p>
      </div>

      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <CheckoutForm 
          features={features} 
          total={total} 
          onBack={onBack} 
          onSuccess={onSuccess} 
        />
      </Elements>
    </div>
  );
}