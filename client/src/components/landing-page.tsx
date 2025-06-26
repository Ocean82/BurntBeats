import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Sparkles, Zap, Crown, Star, Mic, Disc, Headphones, FileAudio, FileMusic } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const pricingTiers = [
  {
    title: "🧪 Bonus Track",
    price: "$0.99",
    description: "Watermarked demo",
    features: [
      "Demo quality",
      "Perfect for testing",
      "Instant download"
    ],
    buttonVariant: "outline",
    badge: null,
    icon: <FileMusic className="w-6 h-6 text-gray-400" />
  },
  {
    title: "🔉 Base Song",
    price: "$1.99",
    description: "Under 9MB",
    features: [
      "No watermarks",
      "Great for loops",
      "High quality MP3"
    ],
    buttonVariant: "outline",
    badge: null,
    icon: <FileAudio className="w-6 h-6 text-gray-400" />
  },
  {
    title: "🎧 Premium Song",
    price: "$4.99",
    description: "9MB-20MB",
    features: [
      "Professional quality",
      "Multiple formats",
      "Commercial use"
    ],
    buttonVariant: "default",
    badge: "Most Popular",
    badgeColor: "bg-blue-500",
    icon: <Headphones className="w-6 h-6 text-gray-400" />
  },
  {
    title: "💽 Ultra Song",
    price: "$8.99",
    description: "Over 20MB",
    features: [
      "Studio quality",
      "Complex compositions",
      "All formats"
    ],
    buttonVariant: "outline",
    badge: null,
    icon: <Disc className="w-6 h-6 text-gray-400" />
  },
  {
    title: "🪪 Full License",
    price: "$10.00",
    description: "Complete ownership",
    features: [
      "Full commercial rights",
      "Resale allowed",
      "No royalties ever"
    ],
    buttonVariant: "default",
    badge: "Full Rights",
    badgeColor: "bg-yellow-500 text-black",
    icon: <Crown className="w-6 h-6 text-gray-400" />
  }
];

const features = [
  {
    icon: <Music className="w-8 h-8 text-orange-500" />,
    title: "AI Music Generation",
    description: "Generate complete songs with lyrics, melodies, and professional mixing using advanced AI"
  },
  {
    icon: <Mic className="w-8 h-8 text-purple-500" />,
    title: "Voice Cloning",
    description: "Clone any voice and have it sing your generated songs with realistic vocal synthesis"
  },
  {
    icon: <Sparkles className="w-8 h-8 text-blue-500" />,
    title: "Multiple Formats",
    description: "Download in MP3, WAV, FLAC with different quality options and commercial licensing"
  }
];

export default function LandingPage() {
  const { login } = useAuth();
  const [isHovering, setIsHovering] = useState(false);

  const handleLogin = () => {
    login();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center mb-6">
            <motion.img 
              src="/burnt-beats-logo.jpeg" 
              alt="Burnt Beats Logo" 
              className="w-16 h-16 mr-4 rounded-lg object-cover"
              whileHover={{ rotate: 10 }}
            />
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent">
              Burnt Beats
            </h1>
          </div>
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Create professional music with AI. No subscriptions, no limits - pay only for what you generate.
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              onClick={handleLogin}
              size="lg" 
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-8 py-4 text-lg"
            >
              Start Creating Music
            </Button>
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="bg-gray-800/50 border-gray-700 hover:border-orange-500 transition-colors h-full">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-center">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Pricing Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Fair Pricing</h2>
          <p className="text-lg md:text-xl text-gray-300 mb-8">
            No subscriptions. No monthly fees. Pay only for the music you generate.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-16">
          {pricingTiers.map((tier, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <Card className={cn(
                "bg-gray-800/50 border-gray-700 h-full flex flex-col",
                tier.badge === "Most Popular" && "border-orange-500/50"
              )}>
                {tier.badge && (
                  <Badge className={cn(
                    "absolute -top-2 left-1/2 transform -translate-x-1/2",
                    tier.badgeColor
                  )}>
                    {tier.badge}
                  </Badge>
                )}
                <CardHeader>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {tier.icon}
                    <CardTitle className="text-white text-center">{tier.title}</CardTitle>
                  </div>
                  <div className="text-center">
                    <span className="text-3xl font-bold text-white">{tier.price}</span>
                    <CardDescription className="text-gray-400 block">{tier.description}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                  <ul className="space-y-2 text-gray-300">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-orange-500 mr-2">•</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <div className="p-4">
                  <Button 
                    onClick={handleLogin} 
                    variant={tier.buttonVariant as "default" | "outline"} 
                    className={cn(
                      "w-full",
                      tier.badge === "Most Popular" && "bg-orange-500 hover:bg-orange-600",
                      tier.badge === "Full Rights" && "bg-yellow-500 text-black hover:bg-yellow-600"
                    )}
                  >
                    {tier.badge ? "Get Started" : "Choose Plan"}
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h3 className="text-2xl md:text-3xl font-bold mb-4">Ready to create your next hit?</h3>
          <p className="text-gray-300 mb-6 text-lg">
            Join thousands of creators making professional music with AI
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              onClick={handleLogin}
              size="lg" 
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-8 py-4 text-lg"
            >
              Start Creating Now
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
