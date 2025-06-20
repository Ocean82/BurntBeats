import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, CreditCard, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Initialize Stripe with your public key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

interface CheckoutFormProps {
  plan: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function CheckoutForm({ plan, onSuccess, onCancel }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const planDetails = {
    basic: { 
      name: "Basic", 
      price: "$6.99", 
      amount: 699,
      features: ["Voice cloning", "Full-length songs", "Advanced editing", "5 genres"]
    },
    pro: { 
      name: "Pro", 
      price: "$12.99", 
      amount: 1299,
      features: ["50 songs/month", "Analytics", "Version control", "Collaboration", "All genres"]
    },
    enterprise: { 
      name: "Enterprise", 
      price: "$39.99", 
      amount: 3999,
      features: ["Unlimited songs", "Real-time collaboration", "Music theory tools", "API access", "Priority support"]
    }
  };

  const selectedPlan = planDetails[plan as keyof typeof planDetails];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment intent on your server
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        plan: plan,
        amount: selectedPlan.amount
      });
      
      const { clientSecret } = await response.json();

      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        }
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (paymentIntent.status === 'succeeded') {
        toast({
          title: "Payment Successful!",
          description: `Welcome to ${selectedPlan.name}! Your subscription is now active.`,
        });
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center">
              <Crown className="w-5 h-5 mr-2 text-vibrant-orange" />
              {selectedPlan.name} Plan
            </div>
            <Badge className="bg-vibrant-orange text-white">
              {selectedPlan.price}/month
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-300">
            {selectedPlan.features.map((feature, index) => (
              <li key={index} className="flex items-center">
                <span className="w-2 h-2 bg-vibrant-orange rounded-full mr-3"></span>
                {feature}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <CreditCard className="w-5 h-5 mr-2" />
            Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 border border-gray-600 rounded-lg bg-gray-800">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#ffffff',
                    '::placeholder': {
                      color: '#9ca3af',
                    },
                  },
                },
              }}
            />
          </div>
          
          <div className="flex items-center mt-4 text-sm text-gray-400">
            <Lock className="w-4 h-4 mr-2" />
            Secure payment powered by Stripe
          </div>
        </CardContent>
      </Card>

      <div className="flex space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 bg-gradient-to-r from-vibrant-orange to-orange-600 hover:from-orange-600 hover:to-vibrant-orange"
        >
          {isProcessing ? "Processing..." : `Subscribe to ${selectedPlan.name}`}
        </Button>
      </div>
    </form>
  );
}

interface StripeCheckoutProps {
  plan: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function StripeCheckout({ plan, onSuccess, onCancel }: StripeCheckoutProps) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm plan={plan} onSuccess={onSuccess} onCancel={onCancel} />
    </Elements>
  );
}