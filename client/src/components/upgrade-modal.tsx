import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Crown, Check, X, CreditCard, Shield, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UpgradeModalProps {
  currentPlan: string;
  onUpgrade: () => void;
  children?: React.ReactNode;
}

export default function UpgradeModal({ currentPlan, onUpgrade, children }: UpgradeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const upgradeFeatures = [
    { feature: "Full-length songs (up to 5:30 minutes)", free: false, pro: true },
    { feature: "Advanced vocal controls (style, mood, tone)", free: false, pro: true },
    { feature: "Custom voice cloning & samples", free: false, pro: true },
    { feature: "Text-to-speech voice creation", free: false, pro: true },
    { feature: "Professional song editor", free: false, pro: true },
    { feature: "Analytics dashboard", free: false, pro: true },
    { feature: "Version control & collaboration", free: false, pro: true },
    { feature: "Music theory tools", free: false, pro: true },
    { feature: "High-quality downloads (320kbps, WAV)", free: false, pro: true },
    { feature: "All genres and vocal styles", free: false, pro: true },
    { feature: "30-second songs", free: true, pro: true },
    { feature: "Basic vocal styles", free: true, pro: true },
    { feature: "Standard quality downloads", free: true, pro: true }
  ];

  const upgradeMutation = useMutation({
    mutationFn: async () => {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Welcome to Pro!",
        description: "Your account has been upgraded. Enjoy all premium features!",
      });
      setIsOpen(false);
      onUpgrade?.();
    },
    onError: () => {
      toast({
        title: "Upgrade failed",
        description: "There was an issue processing your payment. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleUpgrade = () => {
    setIsProcessing(true);
    upgradeMutation.mutate();
  };

  if (currentPlan === "pro") return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-gradient-to-r from-vibrant-orange to-orange-600 hover:from-orange-600 hover:to-vibrant-orange">
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to Pro
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-dark-background border-gray-800 text-white max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-poppins font-bold text-center">
            <Crown className="w-6 h-6 inline mr-2 text-vibrant-orange" />
            Upgrade to BangerGPT Pro
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Free Plan */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">Free Plan</CardTitle>
              <div className="text-2xl font-bold text-white">$0/month</div>
            </CardHeader>
            <CardContent className="space-y-3">
              {upgradeFeatures.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">{item.feature}</span>
                  {item.free ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <X className="w-4 h-4 text-gray-500" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="bg-gradient-to-br from-vibrant-orange/20 to-spotify-green/20 border-vibrant-orange">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-white flex items-center">
                  <Crown className="w-5 h-5 mr-2 text-vibrant-orange" />
                  Pro Plan
                </CardTitle>
                <Badge className="bg-vibrant-orange text-white">Most Popular</Badge>
              </div>
              <div className="text-3xl font-bold text-white">$4.99/month</div>
              <p className="text-sm text-gray-300">Everything in Free, plus:</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {upgradeFeatures.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">{item.feature}</span>
                  <Check className="w-4 h-4 text-spotify-green" />
                </div>
              ))}
              
              <div className="pt-4">
                <Button
                  onClick={handleUpgrade}
                  disabled={upgradeMutation.isPending}
                  className="w-full bg-gradient-to-r from-vibrant-orange to-orange-600 hover:from-orange-600 hover:to-vibrant-orange text-white font-semibold py-3"
                >
                  {upgradeMutation.isPending ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Start 7-Day Free Trial
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Section */}
        <div className="bg-gray-800 rounded-lg p-4 mt-6">
          <h3 className="font-semibold text-white mb-3">Why upgrade to Pro?</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start space-x-2">
              <Crown className="w-4 h-4 text-vibrant-orange mt-0.5" />
              <div>
                <p className="font-medium text-white">Professional Quality</p>
                <p className="text-gray-400">Create full-length, high-quality songs with advanced vocal controls</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <Shield className="w-4 h-4 text-spotify-green mt-0.5" />
              <div>
                <p className="font-medium text-white">Advanced Features</p>
                <p className="text-gray-400">Voice cloning, collaboration tools, and analytics dashboard</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <Check className="w-4 h-4 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium text-white">No Commitment</p>
                <p className="text-gray-400">Cancel anytime during your 7-day free trial</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          Secure payment • Cancel anytime • 7-day free trial • No hidden fees
        </p>
      </DialogContent>
    </Dialog>
  );
}