import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Crown, Check, X, Music, Mic, BarChart3, GitBranch, Users, Settings, Star, Zap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import StripeCheckout from "./stripe-checkout";


interface PricingPlansProps {
  userId: number;
  currentPlan: string;
  onUpgrade: (plan: string) => void;
  user?: {
    id?: number;
    username?: string;
    plan?: 'free' | 'basic' | 'pro' | 'enterprise';
    songsThisMonth?: number;
    monthlyLimit?: number;
  };
}

export default function PricingPlans({ userId, currentPlan, onUpgrade, user }: PricingPlansProps) {
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");

  const { data: plans, isLoading } = useQuery({
    queryKey: ["/api/pricing/plans"],
  });

  const { data: usage } = useQuery({
    queryKey: ["/api/pricing/usage", userId],
  });

  const handleUpgrade = (planName: string) => {
    if (planName === "free" || planName === currentPlan) {
      onUpgrade(planName);
    } else {
      setSelectedPlan(planName);
      setShowCheckout(true);
    }
  };

  const handlePaymentSuccess = () => {
    setShowCheckout(false);
    onUpgrade(selectedPlan);
  };

  const handlePaymentCancel = () => {
    setShowCheckout(false);
    setSelectedPlan("");
  };

  const getButtonText = (planName: string) => {
    if (currentPlan === planName) return "Current Plan";
    if (planName === "free") return "Downgrade";
    return `Upgrade to ${planName.charAt(0).toUpperCase() + planName.slice(1)}`;
  };

  const getButtonVariant = (planName: string) => {
    if (currentPlan === planName) return "secondary";
    if (planName === "enterprise") return "default";
    return "outline";
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case "free": return <Music className="w-5 h-5" />;
      case "basic": return <Mic className="w-5 h-5" />;
      case "pro": return <BarChart3 className="w-5 h-5" />;
      case "enterprise": return <Crown className="w-5 h-5 text-yellow-400" />;
      default: return <Music className="w-5 h-5" />;
    }
  };

  const getPlanBadge = (planName: string) => {
    switch (planName) {
      case "basic": return <Badge variant="secondary">Most Popular</Badge>;
      case "pro": return <Badge className="bg-gradient-to-r from-vibrant-orange to-orange-600 text-white">Best Value</Badge>;
      case "enterprise": return <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black">Professional</Badge>;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const planOrder = ["free", "basic", "pro", "enterprise"];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <img 
            src={bangerGptLogo} 
            alt="Burnt Beats Logo" 
            className="w-12 h-12 mr-3 rounded-lg object-cover"
          />
          <h2 className="text-3xl font-bold">Choose Your Plan</h2>
        </div>
        <p className="text-gray-400 mb-4">Unlock powerful AI music creation features</p>
        {usage && typeof usage === 'object' && 'songsThisMonth' in usage && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg">
            <span className="text-sm text-gray-300">Current usage:</span>
            <span className="font-semibold text-vibrant-orange">
              {(usage as any).songsThisMonth}/{(usage as any).monthlyLimit === 999999 ? "∞" : (usage as any).monthlyLimit} songs
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {planOrder.map((planName) => {
          const plan = plans && typeof plans === 'object' ? (plans as any)[planName] : null;
          if (!plan) return null;

          const isCurrentPlan = currentPlan === planName;
          const isPopular = planName === "basic";
          const isBestValue = planName === "pro";
          const isProfessional = planName === "enterprise";

          return (
            <Card 
              key={planName}
              className={`relative ${isCurrentPlan ? "ring-2 ring-vibrant-orange" : ""} ${
                isProfessional ? "border-yellow-400/50" : ""
              }`}
            >
              {getPlanBadge(planName) && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  {getPlanBadge(planName)}
                </div>
              )}

              <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {getPlanIcon(planName)}
                  <CardTitle className="capitalize">{planName} Plan</CardTitle>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold">
                    {plan.pricing.displayPrice}
                  </div>
                  {planName !== "free" && (
                    <CardDescription className="text-sm text-gray-400">
                      per month, billed monthly
                    </CardDescription>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Songs per month</span>
                    <span className="font-semibold">
                      {plan.songsPerMonth === -1 ? "Unlimited" : plan.songsPerMonth}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Song length</span>
                    <span className="font-semibold">Full length</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Storage</span>
                    <span className="font-semibold">
                      {plan.storage?.unlimited ? "Unlimited" : 
                       plan.storage?.maxSongs === 0 ? "No storage" : 
                       `${plan.storage?.maxSongs} songs`}
                    </span>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Core Features</h4>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {plan.features.audioPlayer ? 
                          <Check className="w-4 h-4 text-green-400" /> : 
                          <X className="w-4 h-4 text-gray-500" />
                        }
                        <span className="text-sm">Audio Player</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {plan.features.songLibrary ? 
                          <Check className="w-4 h-4 text-green-400" /> : 
                          <X className="w-4 h-4 text-gray-500" />
                        }
                        <span className="text-sm">Song Library</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {plan.features.basicEditing ? 
                          <Check className="w-4 h-4 text-green-400" /> : 
                          <X className="w-4 h-4 text-gray-500" />
                        }
                        <span className="text-sm">Basic Editing</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {plan.features.advancedEditing ? 
                          <Check className="w-4 h-4 text-green-400" /> : 
                          <X className="w-4 h-4 text-gray-500" />
                        }
                        <span className="text-sm">Advanced Editing</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Voice Features</h4>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {plan.features.voiceCloning ? 
                          <Check className="w-4 h-4 text-green-400" /> : 
                          <X className="w-4 h-4 text-gray-500" />
                        }
                        <span className="text-sm">
                          Voice Cloning {plan.voiceCloning?.maxSamples > 0 ? 
                            `(${plan.voiceCloning.maxSamples === -1 ? "unlimited" : plan.voiceCloning.maxSamples} sample${plan.voiceCloning.maxSamples !== 1 ? "s" : ""})` : 
                            ""}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {plan.features.textToSpeech ? 
                          <Check className="w-4 h-4 text-green-400" /> : 
                          <X className="w-4 h-4 text-gray-500" />
                        }
                        <span className="text-sm">
                          Text-to-Speech {plan.voiceCloning?.advanced ? "(Advanced)" : "(Basic)"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Professional Tools</h4>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {plan.features.analytics ? 
                          <Check className="w-4 h-4 text-green-400" /> : 
                          <X className="w-4 h-4 text-gray-500" />
                        }
                        <span className="text-sm">Analytics Dashboard</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {plan.features.versionControl ? 
                          <Check className="w-4 h-4 text-green-400" /> : 
                          <X className="w-4 h-4 text-gray-500" />
                        }
                        <span className="text-sm">Version Control</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {plan.features.collaboration ? 
                          <Check className="w-4 h-4 text-green-400" /> : 
                          <X className="w-4 h-4 text-gray-500" />
                        }
                        <span className="text-sm">Collaboration</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {plan.features.downloadOptions ? 
                          <Check className="w-4 h-4 text-green-400" /> : 
                          <X className="w-4 h-4 text-gray-500" />
                        }
                        <span className="text-sm">Download Options</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Enterprise Features</h4>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {plan.features.commercialUse ? 
                          <Check className="w-4 h-4 text-green-400" /> : 
                          <X className="w-4 h-4 text-gray-500" />
                        }
                        <span className="text-sm">Commercial Use</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {plan.features.prioritySupport ? 
                          <Check className="w-4 h-4 text-green-400" /> : 
                          <X className="w-4 h-4 text-gray-500" />
                        }
                        <span className="text-sm">Priority Support</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {plan.features.apiAccess ? 
                          <Check className="w-4 h-4 text-green-400" /> : 
                          <X className="w-4 h-4 text-gray-500" />
                        }
                        <span className="text-sm">API Access</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {plan.features.musicTheoryTools ? 
                          <Check className="w-4 h-4 text-green-400" /> : 
                          <X className="w-4 h-4 text-gray-500" />
                        }
                        <span className="text-sm">Music Theory Tools</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Audio Quality</h4>
                    <div className="space-y-1">
                      {Object.entries(plan.audioQuality).map(([format, available]) => (
                        <div key={format} className="flex items-center gap-2">
                          {available ? 
                            <Check className="w-4 h-4 text-green-400" /> : 
                            <X className="w-4 h-4 text-gray-500" />
                          }
                          <span className="text-sm">{format.replace('_', ' ').toUpperCase()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Available Genres</h4>
                    <div className="text-sm text-gray-400">
                      {plan.genres.length} genres: {plan.genres.slice(0, 3).join(", ")}
                      {plan.genres.length > 3 && "..."}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => handleUpgrade(planName)}
                  variant={getButtonVariant(planName)}
                  className={`w-full ${
                    isProfessional ? "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:from-yellow-500 hover:to-yellow-700" :
                    isBestValue ? "bg-gradient-to-r from-vibrant-orange to-orange-600 hover:from-orange-500 hover:to-orange-700" :
                    ""
                  }`}
                  disabled={isCurrentPlan}
                >
                  {getButtonText(planName)}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center text-sm text-gray-400">
        <p>All plans include secure payment processing and 24/7 support</p>
        <p>Enterprise customers get priority support and custom integrations</p>
      </div>

      {/* Stripe Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="sm:max-w-[600px] bg-dark-bg border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">
              Complete Your Subscription
            </DialogTitle>
          </DialogHeader>
          <StripeCheckout
            plan={selectedPlan}
            onSuccess={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}