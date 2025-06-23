import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Check, X } from "lucide-react";

interface PlanUpgradeProps {
  currentPlan: string;
  onUpgrade?: () => void;
}

export default function PlanUpgrade({ currentPlan, onUpgrade }: PlanUpgradeProps) {
  if (currentPlan === "pro") return null;

  const freeFeatures = [
    { feature: "2 full-length songs per month", included: true },
    { feature: "Basic vocal styles", included: true },
    { feature: "3 genres", included: true },
    { feature: "Standard quality", included: true },
    { feature: "4 songs per month (Basic)", included: false },
    { feature: "Advanced vocal controls", included: false },
    { feature: "Custom voice cloning", included: false },
    { feature: "Song editing tools", included: false },
    { feature: "High-quality downloads", included: false },
    { feature: "All genres & styles", included: false },
  ];

  return (
    <Card className="bg-gradient-to-br from-vibrant-orange/20 to-spotify-green/20 border-vibrant-orange/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-poppins font-semibold text-white flex items-center">
            <Crown className="mr-2 text-vibrant-orange" />
            Upgrade to Pro
          </CardTitle>
          <span className="text-2xl font-bold text-vibrant-orange">$6.99/mo</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mb-6">
          {freeFeatures.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-gray-300">{item.feature}</span>
              {item.included ? (
                <Check className="w-4 h-4 text-spotify-green" />
              ) : (
                <X className="w-4 h-4 text-gray-500" />
              )}
            </div>
          ))}
        </div>
        
        <Button
          onClick={onUpgrade}
          className="w-full bg-gradient-to-r from-vibrant-orange to-orange-600 hover:from-orange-600 hover:to-vibrant-orange text-white font-semibold py-3"
        >
          <Crown className="w-4 h-4 mr-2" />
          Upgrade Now
        </Button>
        
        <p className="text-xs text-gray-400 text-center mt-3">
          Cancel anytime • 7-day free trial
        </p>
      </CardContent>
    </Card>
  );
}