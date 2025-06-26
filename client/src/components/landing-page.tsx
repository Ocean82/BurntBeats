import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Sparkles, Zap, Crown, Star, Mic } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function LandingPage() {
  const { login } = useAuth();

  const handleLogin = () => {
    login();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <img 
              src="/burnt-beats-logo.jpeg" 
              alt="Burnt Beats Logo" 
              className="w-16 h-16 mr-4 rounded-lg object-cover"
            />
            <h1 className="text-6xl font-bold bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent">
              Burnt Beats
            </h1>
          </div>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Create professional music with AI. No subscriptions, no limits - pay only for what you generate.
          </p>
          <Button 
            onClick={handleLogin}
            size="lg" 
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-8 py-4 text-lg"
          >
            Start Creating Music
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="text-center">
              <Music className="w-12 h-12 mx-auto mb-4 text-orange-500" />
              <CardTitle className="text-white">AI Music Generation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-center">
                Generate complete songs with lyrics, melodies, and professional mixing using advanced AI
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="text-center">
              <Mic className="w-12 h-12 mx-auto mb-4 text-purple-500" />
              <CardTitle className="text-white">Voice Cloning</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-center">
                Clone any voice and have it sing your generated songs with realistic vocal synthesis
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="text-center">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-blue-500" />
              <CardTitle className="text-white">Multiple Formats</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-center">
                Download in MP3, WAV, FLAC with different quality options and commercial licensing
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Simple, Fair Pricing</h2>
          <p className="text-xl text-gray-300 mb-8">
            No subscriptions. No monthly fees. Pay only for the music you generate.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-5 gap-6 mb-16">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-center">🧪 Bonus Track</CardTitle>
              <div className="text-center">
                <span className="text-3xl font-bold text-white">$0.99</span>
                <span className="text-gray-400 block">Watermarked demo</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-gray-300">
                <li>• Demo quality</li>
                <li>• Perfect for testing</li>
                <li>• Instant download</li>
              </ul>
              <Button onClick={handleLogin} variant="outline" className="w-full">
                Get Started
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-center">🔉 Base Song</CardTitle>
              <div className="text-center">
                <span className="text-3xl font-bold text-white">$1.99</span>
                <span className="text-gray-400 block">Under 9MB</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-gray-300">
                <li>• No watermarks</li>
                <li>• Great for loops</li>
                <li>• High quality MP3</li>
              </ul>
              <Button onClick={handleLogin} variant="outline" className="w-full">
                Create Music
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 relative">
            <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500">
              Most Popular
            </Badge>
            <CardHeader>
              <CardTitle className="text-white text-center">🎧 Premium Song</CardTitle>
              <div className="text-center">
                <span className="text-3xl font-bold text-white">$4.99</span>
                <span className="text-gray-400 block">9MB-20MB</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-gray-300">
                <li>• Professional quality</li>
                <li>• Multiple formats</li>
                <li>• Commercial use</li>
              </ul>
              <Button onClick={handleLogin} className="w-full bg-blue-500 hover:bg-blue-600">
                Start Creating
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-center">💽 Ultra Song</CardTitle>
              <div className="text-center">
                <span className="text-3xl font-bold text-white">$8.99</span>
                <span className="text-gray-400 block">Over 20MB</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-gray-300">
                <li>• Studio quality</li>
                <li>• Complex compositions</li>
                <li>• All formats</li>
              </ul>
              <Button onClick={handleLogin} variant="outline" className="w-full">
                Go Premium
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 relative">
            <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black">
              Full Rights
            </Badge>
            <CardHeader>
              <CardTitle className="text-white text-center">🪪 Full License</CardTitle>
              <div className="text-center">
                <span className="text-3xl font-bold text-white">$10.00</span>
                <span className="text-gray-400 block">Complete ownership</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-gray-300">
                <li>• Full commercial rights</li>
                <li>• Resale allowed</li>
                <li>• No royalties ever</li>
              </ul>
              <Button onClick={handleLogin} className="w-full bg-yellow-500 text-black hover:bg-yellow-600">
                Own It
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to create your next hit?</h3>
          <p className="text-gray-300 mb-6">
            Join thousands of creators making professional music with AI
          </p>
          <Button 
            onClick={handleLogin}
            size="lg" 
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-8 py-4 text-lg"
          >
            Start Creating Now
          </Button>
        </div>
      </div>
    </div>
  );
}