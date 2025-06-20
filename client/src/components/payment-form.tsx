import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  Lock, 
  Shield, 
  Crown, 
  Check,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PaymentFormProps {
  onUpgradeSuccess: () => void;
  onCancel: () => void;
}

export default function PaymentForm({ onUpgradeSuccess, onCancel }: PaymentFormProps) {
  const [cardData, setCardData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
    billingEmail: "",
  });
  const { toast } = useToast();

  const upgradeMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      // Simulate secure payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const response = await apiRequest("POST", "/api/payments/upgrade", {
        ...paymentData,
        plan: "pro",
        amount: 699, // $6.99 in cents
      });
      return await response.json();
    },
    onSuccess: () => {
      const sassySuccess = [
        "Welcome to the big leagues! You're now Pro!",
        "Finally! Someone who knows quality when they see it.",
        "This is the way. You've unlocked the full power!",
        "Now we're talking! Time to make some real bangers.",
        "You've leveled up! Pro features are now yours to command."
      ];
      const randomSuccess = sassySuccess[Math.floor(Math.random() * sassySuccess.length)];
      
      toast({
        title: randomSuccess,
        description: "All Pro features are now unlocked. Go create something amazing!",
      });
      onUpgradeSuccess();
    },
    onError: () => {
      const sassyErrors = [
        "Houston, we have a payment problem",
        "Your card said 'nope' to this transaction",
        "Payment failed faster than a free plan user's dreams",
        "These aren't the payment details you're looking for"
      ];
      const randomError = sassyErrors[Math.floor(Math.random() * sassyErrors.length)];
      
      toast({
        title: randomError,
        description: "Check your payment details and try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!cardData.cardNumber || !cardData.expiryDate || !cardData.cvv || !cardData.cardholderName) {
      toast({
        title: "Hold up, something's missing",
        description: "Fill out all the payment details and try again.",
        variant: "destructive",
      });
      return;
    }

    upgradeMutation.mutate(cardData);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const proFeatures = [
    "Unlimited songs per month",
    "Full-length tracks (up to 5:30 minutes)",
    "Advanced vocal controls & voice cloning",
    "Professional song editor",
    "Analytics dashboard",
    "Version control & collaboration",
    "High-quality downloads (320kbps, WAV)",
    "All genres and vocal styles"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pro Features */}
        <Card className="bg-dark-card border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-bold text-white">
              <Crown className="w-6 h-6 mr-2 text-yellow-500" />
              BangerGPT Pro
              <Badge className="ml-2 bg-yellow-500/20 text-yellow-400">$6.99/month</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-400">
              Unlock the full power of AI music creation with professional features and unlimited access.
            </p>
            
            <div className="space-y-3">
              {proFeatures.map((feature, index) => (
                <div key={index} className="flex items-center">
                  <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg p-4 border border-green-500/30">
              <p className="text-sm text-green-300">
                <Shield className="w-4 h-4 inline mr-1" />
                <strong>30-day money-back guarantee.</strong> Cancel anytime with no questions asked.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card className="bg-dark-card border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-bold text-white">
              <CreditCard className="w-6 h-6 mr-2 text-blue-500" />
              Secure Payment
              <Lock className="w-4 h-4 ml-2 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-gray-300">Cardholder Name</Label>
                <Input
                  value={cardData.cardholderName}
                  onChange={(e) => setCardData({ ...cardData, cardholderName: e.target.value })}
                  placeholder="John Doe"
                  className="bg-gray-800 border-gray-600"
                />
              </div>

              <div>
                <Label className="text-gray-300">Card Number</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    value={cardData.cardNumber}
                    onChange={(e) => setCardData({ ...cardData, cardNumber: formatCardNumber(e.target.value) })}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className="bg-gray-800 border-gray-600 pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Expiry Date</Label>
                  <Input
                    value={cardData.expiryDate}
                    onChange={(e) => setCardData({ ...cardData, expiryDate: formatExpiryDate(e.target.value) })}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="bg-gray-800 border-gray-600"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">CVV</Label>
                  <Input
                    value={cardData.cvv}
                    onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                    placeholder="123"
                    maxLength={3}
                    className="bg-gray-800 border-gray-600"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-300">Billing Email</Label>
                <Input
                  type="email"
                  value={cardData.billingEmail}
                  onChange={(e) => setCardData({ ...cardData, billingEmail: e.target.value })}
                  placeholder="john@example.com"
                  className="bg-gray-800 border-gray-600"
                />
              </div>

              <div className="space-y-3 pt-4">
                <Button
                  type="submit"
                  disabled={upgradeMutation.isPending}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white py-3"
                >
                  {upgradeMutation.isPending ? (
                    "Processing Payment..."
                  ) : (
                    "Upgrade to Basic - $6.99/month"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="w-full"
                  disabled={upgradeMutation.isPending}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>

              <div className="text-xs text-gray-400 text-center pt-2">
                <Lock className="w-3 h-3 inline mr-1" />
                Your payment information is encrypted and secure. We never store your card details.
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}