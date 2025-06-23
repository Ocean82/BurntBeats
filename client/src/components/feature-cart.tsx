import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingCart, Trash2, Sparkles, Music, Mic, BarChart3, GitBranch, Users, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Feature {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: React.ReactNode;
  category: 'generation' | 'voice' | 'analytics' | 'collaboration';
}

interface FeatureCartProps {
  onCheckout: (selectedFeatures: Feature[], total: number) => void;
  onCancel: () => void;
}

export default function FeatureCart({ onCheckout, onCancel }: FeatureCartProps) {
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const { toast } = useToast();

  const availableFeatures: Feature[] = [
    {
      id: 'song_generation',
      name: 'Song Generation',
      description: 'Create a complete song with lyrics, melody, and arrangement',
      price: 2.99,
      icon: <Music className="w-5 h-5" />,
      category: 'generation'
    },
    {
      id: 'voice_cloning',
      name: 'Voice Cloning',
      description: 'Upload your voice and convert it to singing vocals',
      price: 4.99,
      icon: <Mic className="w-5 h-5" />,
      category: 'voice'
    },
    {
      id: 'premium_voice',
      name: 'Premium Voice Selection',
      description: 'Access to 20+ professional voice models',
      price: 1.99,
      icon: <Sparkles className="w-5 h-5" />,
      category: 'voice'
    },
    {
      id: 'extended_length',
      name: 'Extended Song Length',
      description: 'Generate songs up to 5 minutes (vs 30 seconds)',
      price: 1.49,
      icon: <Music className="w-5 h-5" />,
      category: 'generation'
    },
    {
      id: 'hq_audio',
      name: 'High Quality Audio',
      description: 'WAV/FLAC export with studio-quality mastering',
      price: 0.99,
      icon: <Crown className="w-5 h-5" />,
      category: 'generation'
    },
    {
      id: 'analytics',
      name: 'Song Analytics',
      description: 'Detailed performance metrics and recommendations',
      price: 1.99,
      icon: <BarChart3 className="w-5 h-5" />,
      category: 'analytics'
    },
    {
      id: 'version_control',
      name: 'Version Control',
      description: 'Save multiple versions and compare changes',
      price: 1.49,
      icon: <GitBranch className="w-5 h-5" />,
      category: 'collaboration'
    },
    {
      id: 'collaboration',
      name: 'Real-time Collaboration',
      description: 'Work with team members on the same song',
      price: 2.49,
      icon: <Users className="w-5 h-5" />,
      category: 'collaboration'
    }
  ];

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures(prev => 
      prev.includes(featureId) 
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  };

  const selectedFeatureObjects = useMemo(() => 
    availableFeatures.filter(feature => selectedFeatures.includes(feature.id)),
    [selectedFeatures]
  );

  const total = useMemo(() =>
    selectedFeatureObjects.reduce((sum, feature) => sum + feature.price, 0),
    [selectedFeatureObjects]
  );

  const groupedFeatures = useMemo(() => {
    const groups: Record<string, Feature[]> = {};
    availableFeatures.forEach(feature => {
      if (!groups[feature.category]) {
        groups[feature.category] = [];
      }
      groups[feature.category].push(feature);
    });
    return groups;
  }, []);

  const categoryNames = {
    generation: 'Song Creation',
    voice: 'Voice Features',
    analytics: 'Analytics & Insights',
    collaboration: 'Collaboration Tools'
  };

  const handleCheckout = () => {
    if (selectedFeatures.length === 0) {
      toast({
        title: "Nothing selected? Really?",
        description: "Pick something or get out of here!",
        variant: "destructive"
      });
      return;
    }

    if (!selectedFeatures.includes('song_generation')) {
      toast({
        title: "Hold up there, genius!",
        description: "You need the actual song generation to... generate a song. Just saying.",
        variant: "destructive"
      });
      return;
    }

    onCheckout(selectedFeatureObjects, total);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            🛒 Feature Cart
          </h1>
          <p className="text-gray-300 text-lg">
            Pick exactly what you need, pay only for what you use
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Features Selection */}
          <div className="lg:col-span-2 space-y-6">
            {Object.entries(groupedFeatures).map(([category, features]) => (
              <Card key={category} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">
                    {categoryNames[category as keyof typeof categoryNames]}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {features.map(feature => (
                    <div key={feature.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors">
                      <Checkbox
                        id={feature.id}
                        checked={selectedFeatures.includes(feature.id)}
                        onCheckedChange={() => toggleFeature(feature.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {feature.icon}
                            <span className="font-medium text-white">{feature.name}</span>
                          </div>
                          <Badge variant="secondary" className="bg-green-900 text-green-400">
                            ${feature.price}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="space-y-6">
            <Card className="bg-gray-800 border-gray-700 sticky top-6">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Your Cart
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedFeatures.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">
                    Your cart is emptier than your wallet will be after this
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedFeatureObjects.map(feature => (
                      <div key={feature.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {feature.icon}
                          <span className="text-sm text-white">{feature.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-green-400">${feature.price}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFeature(feature.id)}
                            className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    <Separator className="bg-gray-600" />
                    
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-white">Total</span>
                      <span className="text-green-400 text-lg">${total.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div className="mt-6 space-y-3">
                  <Button 
                    onClick={handleCheckout}
                    disabled={selectedFeatures.length === 0}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  >
                    Checkout ${total.toFixed(2)}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={onCancel}
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                </div>

                <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-700">
                  <p className="text-xs text-blue-300">
                    💡 <strong>Pro Tip:</strong> Song generation is required for all other features to work. 
                    Don't be that person who buys voice cloning without a song to clone it to.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}