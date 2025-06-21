import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Sparkles, Crown, ArrowRight, Star, Users, Zap } from "lucide-react";
import bangerGptLogo from "@/assets/bangergpt-logo.jpeg";

export default function LandingPage() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <header className="p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <img 
              src={bangerGptLogo} 
              alt="Burnt Beats Logo" 
              className="w-10 h-10 mr-3 rounded-lg object-cover"
            />
            <h1 className="text-2xl font-bold text-white">Burnt Beats</h1>
          </div>
          <Button onClick={handleLogin} className="bg-gradient-to-r from-spotify-green to-green-600">
            Sign in with Replit
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-6">
            Transform Text into
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> Fire Tracks</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            AI-powered music creation with attitude. Generate professional songs, clone voices, and collaborate in real-time.
          </p>
          <Button 
            onClick={handleLogin}
            size="lg"
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-lg px-8 py-4"
          >
            Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <Music className="w-10 h-10 text-purple-400 mb-4" />
              <CardTitle className="text-white">AI Music Generation</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              Professional-quality songs generated from your lyrics using advanced AI and Music21 library.
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <Zap className="w-10 h-10 text-blue-400 mb-4" />
              <CardTitle className="text-white">Voice Cloning</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              Upload voice samples and transform them into singing voices with genre-specific adaptations.
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <Users className="w-10 h-10 text-green-400 mb-4" />
              <CardTitle className="text-white">Real-time Collaboration</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              Work together on songs with live editing, comments, and team management features.
            </CardContent>
          </Card>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-center">Free</CardTitle>
              <div className="text-center">
                <span className="text-3xl font-bold text-white">$0</span>
                <span className="text-gray-400">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-gray-300">
                <li>• 3 songs per month</li>
                <li>• 30-second tracks</li>
                <li>• Basic vocal styles</li>
                <li>• Standard quality downloads</li>
              </ul>
              <Button onClick={handleLogin} variant="outline" className="w-full">
                Get Started
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-b from-orange-900 to-gray-800 border-orange-500 relative">
            <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-vibrant-orange">
              Most Popular
            </Badge>
            <CardHeader>
              <CardTitle className="text-white text-center">Basic</CardTitle>
              <div className="text-center">
                <span className="text-3xl font-bold text-white">$6.99</span>
                <span className="text-gray-400">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-gray-300">
                <li>• 3 full-length songs</li>
                <li>• Voice cloning & TTS</li>
                <li>• Advanced editing tools</li>
                <li>• High-quality downloads</li>
              </ul>
              <Button onClick={handleLogin} className="w-full bg-vibrant-orange hover:bg-orange-600">
                Upgrade to Basic
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-center flex items-center justify-center">
                <Crown className="w-5 h-5 mr-2 text-yellow-500" />
                Pro
              </CardTitle>
              <div className="text-center">
                <span className="text-3xl font-bold text-white">$12.99</span>
                <span className="text-gray-400">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-gray-300">
                <li>• 50 songs per month</li>
                <li>• Analytics & version control</li>
                <li>• Real-time collaboration</li>
                <li>• All genres & features</li>
              </ul>
              <Button onClick={handleLogin} className="w-full bg-gradient-to-r from-purple-500 to-blue-500">
                Upgrade to Pro
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-400">
          <p>Join thousands of creators making fire tracks with Burnt Beats</p>
          <div className="flex justify-center items-center mt-4 space-x-4">
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-500 mr-1" />
              <span>4.9/5 rating</span>
            </div>
            <div>•</div>
            <div>10,000+ songs generated</div>
            <div>•</div>
            <div>Real music, real AI</div>
          </div>
        </div>
      </main>
    </div>
  );
}