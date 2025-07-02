//USE THIS ONE

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Crown, Check, X, Music, Mic, BarChart3, GitBranch, Users, Settings, Star, Zap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import StripeTieredCheckout from "./stripe-tiered-checkout";

interface PricingPlansProps {
  userId?: number;
  onPurchase?: (tier: string) => void;
  user?: {
    id?: number;
    username?: string;
  };
}

const PRICING_TIERS = [
  {
    id: 'bonus',
    name: '🧪 Bonus Track',
    description: 'Watermarked demo. Test the vibe before buying. Its nothing greath but you get to hear your song before you buy it.',
    price: 0.99,
    icon: <Music className="w-5 h-5" />,
    badge: null,
    features: [
      'Watermarked demo quality',
      'Perfect for testing concepts',
      'Instant download',
      'MP3 format'
    ]
  },
  {
    id: 'base',
    name: '🔉 Base Song',
    description: 'Tracks under 9MB. Great for basic song. fine to play for your mom but I wouldnt use it for your demo track.',
    price: 1.99,
    icon: <Mic className="w-5 h-5" />,
    badge: null,
    features: [
      'Tracks under 9MB',
      'No watermarks',
      'Perfect for hearing dumb songs about how sad you are but not the kind thats going to get you on on that show you think youre good enough for',
      'High quality MP3'
    ]
  },
  {
    id: 'premium',
    name: '🎧 Premium Song',
    description: 'Tracks between 9MB and 20MB. Crisp quality with depth. Think Marvin Gaye.',
    price: 4.99,
    icon: <BarChart3 className="w-5 h-5" />,
    badge: <Badge variant="secondary">Most Popular</Badge>,
    features: [
      'Tracks 9MB-20MB',
      'Crisp quality with depth',
      'Professional grade',
      'Multiple formats available'
    ]
  },
  {
    id: 'ultra',
    name: '💽 Ultra Super Great Amazing Song',
    description: 'Tracks over 20MB. Ideal for complex, layered creations or those tender moments when you might finally...realize why youre alwasy missing one sock.',
    price: 8.99,
    icon: <Star className="w-5 h-5" />,
    badge: <Badge className="bg-gradient-to-r from-vibrant-orange to-orange-600 text-white">Best Value</Badge>,
    features: [
      'Tracks over 20MB',
      'Complex layered creations',
      'Studio quality',
      'All formats included'
    ]
  },
  {
    id: 'full_license',
    name: '🪪 Full License',
    description: 'Grants full ownership. Use, distribute, modify, and monetize your track anywhere—forever. Its yours do what you want with it.',
    price: 10.00,
    icon: <Crown className="w-5 h-5 text-yellow-400" />,
    badge: <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black">Professional</Badge>,
    features: [
      'Complete ownership rights',
      'Commercial use allowed',
      'No royalties ever',
      'Resale rights included',
      'All formats & qualities'
    ]
  }
];

export default function PricingPlans({ userId, onPurchase, user }: PricingPlansProps) {
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedTier, setSelectedTier] = useState("");

  const handlePurchase = (tierName: string) => {
    setSelectedTier(tierName);
    setShowCheckout(true);
  };

  const handlePaymentSuccess = () => {
    setShowCheckout(false);
    if (onPurchase) {
      onPurchase(selectedTier);
    }
  };

  const handlePaymentCancel = () => {
    setShowCheckout(false);
    setSelectedTier("");
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <img 
            src="/burnt-beats-logo.jpeg" 
            alt="Burnt Beats Logo" 
            className="w-12 h-12 mr-3 rounded-lg object-cover"
          />
          <h2 className="text-3xl font-bold">🎶 Pricing</h2>
        </div>
        <p className="text-gray-400 mb-4">
          No subscriptions. No tokens. No limits. Pay only for the music you generate.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {PRICING_TIERS.map((tier) => {
          return (
            <Card 
              key={tier.id}
              className="relative border-gray-700 hover:border-orange-500/50 transition-colors"
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  {tier.badge}
                </div>
              )}

              <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {tier.icon}
                  <CardTitle className="text-lg">{tier.name}</CardTitle>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-purple-400">
                    ${tier.price.toFixed(2)}
                  </div>
                  <CardDescription className="text-sm text-gray-400">
                    per song
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <CardDescription className="text-sm text-gray-300">
                  {tier.description}
                </CardDescription>

                <Separator />

                <div className="space-y-2">
                  {tier.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => handlePurchase(tier.id)}
                  className="w-full bg-gradient-to-r from-vibrant-orange to-orange-600 hover:from-orange-500 hover:to-orange-700"
                >
                  Download ${tier.price.toFixed(2)}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center text-sm text-gray-400 space-y-2">
        <p>💰 No subscriptions • No monthly fees • Pay only for what you download • Publish your creations and see if you have what it takes to compete for TOP TEN SONGS OF THE MONTH</p>
        <p>🎵 100% ownership. Monetize of your own creations • Commercial use allowed • No royalties paid to someone you dont know</p>
        <p>⚡ Fast downloads • Secure payments • Lifetime access</p>
      </div>

      {/* Stripe Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="sm:max-w-[800px] bg-dark-bg border-gray-800 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">
              Complete Your Purchase
            </DialogTitle>
          </DialogHeader>
          <StripeTieredCheckout
            songId="generated-song"
            songTitle="Your Generated Song"
            onPurchaseComplete={handlePaymentSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}