"use client"

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Star, Crown, Check, Sparkles } from "lucide-react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'stripe-buy-button': {
        'buy-button-id': string;
        'publishable-key': string;
        'client-reference-id'?: string;
      };
      'stripe-pricing-table': {
        'pricing-table-id': string;
        'publishable-key': string;
        'client-reference-id'?: string;
        'customer-email'?: string;
      };
    }
  }
}

interface StripeCheckoutProps {
  songId: string;
  songTitle: string;
  onPurchaseComplete?: (tier: string) => void;
}

const PRICING_TIERS = [
  {
    id: 'bonus',
    name: '🎵 Bonus Track',
    description: 'Demo quality with watermark. Perfect for previews and sharing.',
    price: 0.99,
    priceWithTax: 1.09,
    stripeProductId: 'prod_bonus_track',
    stripePriceId: 'price_bonus_track',
    buyButtonId: 'buy_btn_bonus_track',
    features: [
      'Demo quality MP3',
      'Contains watermark',
      'Perfect for previews',
      'Instant download'
    ],
    metadata: {
      tier: 'bonus',
      quality: 'demo',
      hasWatermark: true
    },
    icon: <Music className="h-6 w-6" />,
    popular: false,
    badge: 'Demo'
  },
  {
    id: 'base',
    name: '🔉 Base Song',
    description: 'Tracks under 9MB. Great for quick loops or intros.',
    price: 1.99,
    priceWithTax: 2.19,
    stripeProductId: 'prod_base_song',
    stripePriceId: 'price_base_song',
    buyButtonId: 'buy_btn_base_song',
    features: [
      'Tracks under 9MB',
      'Great for loops & intros',
      'No watermarks',
      'Instant download'
    ],
    metadata: {
      tier: 'base',
      quality: 'standard',
      maxSize: '9MB',
      hasWatermark: false
    },
    icon: <Star className="h-6 w-6" />,
    popular: false,
    badge: 'Quick & Clean'
  },
  {
    id: 'premium',
    name: '🎧 Premium Song',
    description: 'Tracks between 9MB and 20MB. Crisp quality with depth.',
    price: 4.99,
    priceWithTax: 5.49,
    stripeProductId: 'prod_premium_song',
    stripePriceId: 'price_premium_song',
    buyButtonId: 'buy_btn_premium_song',
    features: [
      'Tracks 9MB-20MB',
      'Crisp quality with depth',
      'No watermarks',
      'Professional quality'
    ],
    metadata: {
      tier: 'premium',
      quality: 'high',
      sizeRange: '9MB-20MB',
      hasWatermark: false
    },
    icon: <Star className="h-6 w-6" />,
    popular: true,
    badge: 'Most Popular'
  },
  {
    id: 'ultra',
    name: '💽 Ultra Song',
    description: 'Tracks over 20MB. Ideal for complex, layered creations.',
    price: 8.99,
    priceWithTax: 9.89,
    stripeProductId: 'prod_ultra_song',
    stripePriceId: 'price_ultra_song',
    buyButtonId: 'buy_btn_ultra_song',
    features: [
      'Tracks over 20MB',
      'Complex layered creations',
      'Studio quality',
      'No watermarks',
      'Maximum file size'
    ],
    metadata: {
      tier: 'ultra',
      quality: 'studio',
      sizeRange: '20MB+',
      hasWatermark: false
    },
    icon: <Crown className="h-6 w-6" />,
    popular: false,
    badge: 'Ultra Quality'
  },
  {
    id: 'full_license',
    name: '📜 Full License',
    description: 'Complete commercial rights package with all formats.',
    price: 10.00,
    priceWithTax: 11.00,
    stripeProductId: 'prod_full_license',
    stripePriceId: 'price_full_license',
    buyButtonId: 'buy_btn_full_license',
    features: [
      'All file formats included',
      'Complete commercial rights',
      'Unlimited usage license',
      'Resale rights included',
      'Broadcasting rights'
    ],
    metadata: {
      tier: 'full_license',
      quality: 'all',
      hasWatermark: false
    },
    icon: <Crown className="h-6 w-6" />,
    popular: false,
    badge: 'Full Rights'
  }
];

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51RbydVP5PtizRku72FvE6o5dl2H1sDOVaDQMkM8Kq2AC7lYYKXMgPKJNpWb6bMDwb00MvbyE4Xf9lnUxEcn5FSa600sibwIAB9';

export default function StripeTieredCheckout({ songId, songTitle, onPurchaseComplete }: StripeCheckoutProps) {
  const [selectedTier, setSelectedTier] = useState<string>('premium');

  const handlePurchase = async (tier: any) => {
    try {
      console.log(`Initiating purchase for ${tier.name} - ${songTitle}`);
      
      // In a real implementation, you would:
      // 1. Create a Stripe checkout session
      // 2. Redirect to Stripe checkout
      // 3. Handle webhook for successful payment
      // 4. Generate and deliver the purchased file
      
      if (onPurchaseComplete) {
        onPurchaseComplete(tier.id);
      }
    } catch (error) {
      console.error('Purchase failed:', error);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">
          Download "{songTitle}"
        </h2>
        <p className="text-gray-400 text-lg">
          Choose your perfect quality and licensing option
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {PRICING_TIERS.map((tier) => (
          <Card 
            key={tier.id}
            className={`relative bg-gray-900 border-gray-700 transition-all duration-200 hover:border-orange-500/50 cursor-pointer ${
              selectedTier === tier.id ? 'border-orange-500 ring-2 ring-orange-500/20' : ''
            } ${tier.popular ? 'ring-2 ring-blue-500/30 border-blue-500' : ''}`}
            onClick={() => setSelectedTier(tier.id)}
          >
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-white px-3 py-1">
                  {tier.badge}
                </Badge>
              </div>
            )}

            {!tier.popular && tier.badge && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge variant="outline" className="bg-gray-800 border-gray-600 text-gray-300">
                  {tier.badge}
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-2">
                <div className={`p-3 rounded-full ${tier.popular ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                  {tier.icon}
                </div>
              </div>
              <CardTitle className="text-xl text-white mb-2">
                {tier.name}
              </CardTitle>
              <p className="text-gray-400 text-sm mb-4">
                {tier.description}
              </p>
              
              <div className="text-center">
                <div className="text-sm text-gray-500 line-through">
                  ${tier.priceWithTax.toFixed(2)}
                </div>
                <div className="text-3xl font-bold text-white">
                  ${tier.price.toFixed(2)}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <ul className="space-y-2 mb-6">
                {tier.features.map((feature: string, index: number) => (
                  <li key={index} className="flex items-center text-sm text-gray-300">
                    <Check className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handlePurchase(tier)}
                className={`w-full ${
                  tier.popular 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                }`}
                disabled={false}
              >
                Download ${tier.name} - ${tier.price.toFixed(2)}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20 max-w-2xl mx-auto">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Sparkles className="w-6 h-6 text-orange-400" />
              <span className="text-xl font-semibold text-orange-200">100% Ownership Guarantee</span>
            </div>
            <p className="text-orange-200/80">
              Every download comes with complete ownership rights. Use commercially, remix, resell - 
              it's yours forever with zero royalties or restrictions.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}