import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Download, Music, Star, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Declare Stripe buy button type for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'stripe-buy-button': {
        'buy-button-id': string;
        'publishable-key': string;
        'client-reference-id'?: string;
      };
    }
  }
}

interface StripeCheckoutProps {
  songId: string;
  songTitle: string;
  onPurchaseComplete?: (tier: string) => void;
}

const pricingTiers = [
  {
    id: 'bonus',
    name: 'Bonus',
    description: 'Demo version with watermark - perfect for samples',
    price: 2.99,
    priceWithTax: 3.29, // Assuming ~10% tax
    stripeProductId: 'prod_bonus_demo_tier',
    stripePriceId: 'price_1RdOETP5PtizRku7GPX5AMSF_bonus',
    buyButtonId: 'buy_btn_1RdOETP5PtizRku7GPX5AMSF_bonus',
    features: [
      'MP3 128kbps',
      'Contains Burnt Beats watermark',
      'Perfect for demos & samples',
      'Instant download',
      'Same great music quality'
    ],
    metadata: {
      tier: 'bonus',
      quality: 'demo',
      format: 'mp3',
      bitrate: '128',
      hasWatermark: true
    },
    icon: <Music className="h-6 w-6" />,
    popular: false,
    badge: 'Demo Version'
  },
  {
    id: 'base',
    name: 'Base',
    description: 'Clean version - no watermarks, high quality',
    price: 4.99,
    priceWithTax: 5.49, // Assuming ~10% tax
    stripeProductId: 'prod_base_clean_tier',
    stripePriceId: 'price_1RdOETP5PtizRku7GPX5AMSF_base',
    buyButtonId: 'buy_btn_1RdOETP5PtizRku7GPX5AMSF_base',
    features: [
      'MP3 320kbps',
      'NO watermarks or overlays',
      'Crystal clear audio',
      'Instant download',
      'Personal use license'
    ],
    metadata: {
      tier: 'base',
      quality: 'high',
      format: 'mp3',
      bitrate: '320',
      hasWatermark: false
    },
    icon: <Star className="h-6 w-6" />,
    popular: true,
    badge: 'Most Popular'
  },
  {
    id: 'top',
    name: 'Top',
    description: 'Premium studio quality - completely clean',
    price: 9.99,
    priceWithTax: 10.99, // Assuming ~10% tax
    stripeProductId: 'prod_top_studio_tier',
    stripePriceId: 'price_1RdOETP5PtizRku7GPX5AMSF_top',
    buyButtonId: 'buy_btn_1RdOETP5PtizRku7GPX5AMSF_top',
    features: [
      'WAV 24-bit/96kHz',
      'NO watermarks - studio clean',
      'Professional studio quality',
      'Instant download',
      'Commercial use license',
      'Multitrack stems included'
    ],
    metadata: {
      tier: 'top',
      quality: 'studio',
      format: 'wav',
      bitrate: '24bit96khz',
      hasWatermark: false
    },
    icon: <Crown className="h-6 w-6" />,
    popular: false,
    badge: 'Pro Studio'
  }
];

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51RbydVP5PtizRku72FvE6o5dl2H1sDOVaDQMkM8Kq2AC7lYYKXMgPKJNpWb6bMDwb00MvbyE4Xf9lnUxEcn5FSa600sibwIAB9';

export default function StripeTieredCheckout({ songId, songTitle, onPurchaseComplete }: StripeCheckoutProps) {
  const [isStripeLoaded, setIsStripeLoaded] = useState(false);

  useEffect(() => {
    // Load Stripe Buy Button script
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/buy-button.js';
    script.async = true;
    script.onload = () => setIsStripeLoaded(true);
    document.head.appendChild(script);

    // Store purchase metadata in localStorage for webhook processing
    const purchaseMetadata = {
      songId,
      songTitle,
      userId: 'demo_user', // Get from auth context
      timestamp: Date.now()
    };
    localStorage.setItem('currentPurchase', JSON.stringify(purchaseMetadata));

    return () => {
      document.head.removeChild(script);
    };
  }, [songId, songTitle]);

  const getPurchaseUrl = (tier: typeof pricingTiers[0]) => {
    // For now, all tiers use the same payment link with different client reference IDs
    const baseUrl = 'https://buy.stripe.com/test_cNifZj2op8KC2KK0JbaR200';
    const clientRefId = `${songId}_${tier.id}_${Date.now()}`;
    return `${baseUrl}?client_reference_id=${encodeURIComponent(clientRefId)}`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Choose Your Download Quality</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Get your song "{songTitle}" in the perfect quality for your needs
        </p>
        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <p className="text-amber-800 dark:text-amber-200 text-sm font-medium">
            🎵 All free previews include a watermark. Purchase Base or Top tier for completely clean versions!
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {pricingTiers.map((tier) => (
          <Card 
            key={tier.id} 
            className={`relative transition-all duration-300 hover:shadow-lg ${
              tier.popular ? 'ring-2 ring-blue-500 scale-105' : ''
            }`}
          >
            {tier.badge && (
              <Badge className={`absolute -top-3 left-1/2 transform -translate-x-1/2 ${
                tier.popular ? 'bg-blue-500' : 
                tier.id === 'bonus' ? 'bg-orange-500' :
                'bg-purple-500'
              }`}>
                {tier.badge}
              </Badge>
            )}
            
            <CardHeader className="text-center pb-4">
              <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
                tier.id === 'bonus' ? 'bg-green-100 text-green-600' :
                tier.id === 'base' ? 'bg-blue-100 text-blue-600' :
                'bg-purple-100 text-purple-600'
              }`}>
                {tier.icon}
              </div>
              
              <CardTitle className="text-2xl">{tier.name}</CardTitle>
              <CardDescription className="text-sm">{tier.description}</CardDescription>
              
              <div className="mt-4">
                <div className="text-3xl font-bold">
                  ${tier.priceWithTax}
                </div>
                <div className="text-sm text-gray-500">
                  (${tier.price} + tax)
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <ul className="space-y-3 mb-6">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {isStripeLoaded ? (
                <div className="w-full">
                  <stripe-buy-button
                    buy-button-id={tier.buyButtonId}
                    publishable-key={STRIPE_PUBLISHABLE_KEY}
                    client-reference-id={`${songId}_${tier.id}_${songTitle.replace(/\s+/g, '_')}`}
                  />
                </div>
              ) : (
                <Button 
                  disabled
                  className="w-full bg-gray-400"
                >
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Loading Checkout...
                  </div>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Secure checkout powered by Stripe • Instant download after payment</p>
        <p>All purchases include a 30-day satisfaction guarantee</p>
      </div>
    </div>
  );
}