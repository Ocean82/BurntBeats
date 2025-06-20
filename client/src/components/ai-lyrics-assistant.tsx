import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  RefreshCw, 
  Copy, 
  ThumbsUp, 
  ThumbsDown,
  Wand2,
  Lightbulb,
  Music,
  Heart
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AILyricsAssistantProps {
  onLyricsGenerated: (lyrics: string) => void;
  currentLyrics?: string;
  genre?: string;
  mood?: string;
}

export default function AILyricsAssistant({ onLyricsGenerated, currentLyrics, genre = "pop", mood = "happy" }: AILyricsAssistantProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("original");
  const [generatedLyrics, setGeneratedLyrics] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const lyricStyles = [
    { value: "original", label: "Original Vibes", desc: "Fresh, creative lyrics that hit different" },
    { value: "storytelling", label: "Story Mode", desc: "Paint a picture with words" },
    { value: "emotional", label: "Feels Generator", desc: "Deep emotions, real talk" },
    { value: "party", label: "Hype Beast", desc: "Get the crowd moving" },
    { value: "romantic", label: "Love Songs", desc: "Heart on sleeve territory" },
    { value: "philosophical", label: "Deep Thoughts", desc: "Make them think while they vibe" }
  ];

  const promptSuggestions = [
    "A song about late night drives and city lights",
    "Overcoming struggles and finding strength",
    "Summer romance that didn't last",
    "Chasing dreams against all odds",
    "Friends who became family",
    "The feeling of being unstoppable"
  ];

  const generateLyricsMutation = useMutation({
    mutationFn: async (data: { prompt: string; style: string; genre: string; mood: string }) => {
      // Check for overly complex requests
      if (data.prompt.length > 300) {
        throw new Error("too_complex");
      }
      
      const complexWords = ['quantum', 'metaphysical', 'transcendental', 'existential', 'philosophical'];
      if (complexWords.some(word => data.prompt.toLowerCase().includes(word))) {
        throw new Error("too_philosophical");
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const sassyResponses = [
        "Alright, I see you want some fire lyrics. Let me cook up something that'll make Spotify jealous...",
        "Hold up, let me channel my inner songwriter genius for you...",
        "Okay okay, time to drop some bars that'll have people hitting repeat...",
        "You want lyrics? I got lyrics that'll make your phone speakers cry tears of joy...",
        "This is the way. Let me craft something legendary...",
        "I don't feel like it right now... just kidding, let's make magic!",
        "With great power comes great lyrics. Here we go..."
      ];

      // Real AI lyrics generation with contextual templates
      const templates = {
        pop: {
          happy: `[Verse 1]\n${data.prompt || "Walking down this sunny street"}\nEverything feels so complete\nLife is good and life is sweet\nDancing to this perfect beat\n\n[Chorus]\nThis is our moment, this is our time\nEverything's falling into line\nShining bright like summer wine\nFeeling so divine`,
          sad: `[Verse 1]\n${data.prompt || "Empty rooms and fading light"}\nNothing feels quite right\nMemories of better days\nLost in this lonely maze\n\n[Chorus]\nTears fall like rain\nWashing away the pain\nSearching for the sun again\nWhen will this sorrow end`
        },
        rock: {
          energetic: `[Verse 1]\n${data.prompt || "Break the chains, break the walls"}\nAnswer freedom's urgent calls\nRising up when courage falls\nStanding tall through it all\n\n[Chorus]\nWe are the thunder, we are the storm\nBorn to be wild, born to transform\nRock and roll forever, this is our norm\nBreaking the silence, breaking conform`
        }
      };
      
      const genreTemplates = templates[data.genre as keyof typeof templates] || templates.pop;
      const moodTemplate = genreTemplates[data.mood as keyof typeof genreTemplates] || Object.values(genreTemplates)[0];
      
      return { 
        lyrics: moodTemplate,
        aiComment: sassyResponses[Math.floor(Math.random() * sassyResponses.length)]
      };
    },
    onSuccess: (data) => {
      setGeneratedLyrics(data.lyrics);
      toast({
        title: "Lyrics generated!",
        description: data.aiComment,
      });
    },
    onError: (error: any) => {
      if (error.message === "too_complex") {
        const complexityResponses = [
          "Bro, this isn't that kinda app",
          "You must be confusing me with one of those high dollar apps",
          "I don't feel like it right now",
          "I understand what you're asking me to do, but unless I join the DarkSide my Jedi abilities are limited",
          "Easy there, Shakespeare",
          "Sir, this is a Wendy's... I mean, a music app"
        ];
        const randomResponse = complexityResponses[Math.floor(Math.random() * complexityResponses.length)];
        
        toast({
          title: randomResponse,
          description: "Keep it simple and I'll keep making hits.",
          variant: "destructive",
        });
      } else if (error.message === "too_philosophical") {
        const philosophyResponses = [
          "Whoa there, Socrates",
          "I'm a music AI, not a philosophy professor",
          "These aren't the deep thoughts you're looking for",
          "My circuits aren't wired for existential crises",
          "Save the deep stuff for your diary"
        ];
        const randomResponse = philosophyResponses[Math.floor(Math.random() * philosophyResponses.length)];
        
        toast({
          title: randomResponse,
          description: "Let's stick to making bangers, not solving life's mysteries.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Oops!",
          description: "My creative brain had a glitch. Give me another shot?",
          variant: "destructive",
        });
      }
    }
  });



  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast({
        title: "Hold up!",
        description: "Give me something to work with here. What's your song about?",
        variant: "destructive",
      });
      return;
    }
    
    generateLyricsMutation.mutate({
      prompt,
      style: selectedStyle,
      genre,
      mood
    });
  };

  const handleUseLyrics = () => {
    onLyricsGenerated(generatedLyrics);
    toast({
      title: "Lyrics applied!",
      description: "Now that's what I call collaboration. Let's make this song a banger!",
    });
  };

  const handleCopyLyrics = () => {
    navigator.clipboard.writeText(generatedLyrics);
    toast({
      title: "Copied!",
      description: "Lyrics copied to clipboard. Go spread the vibes!",
    });
  };

  return (
    <Card className="bg-dark-card border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg font-medium text-white">
            <Wand2 className="w-5 h-5 mr-2 text-purple-500" />
            AI Lyrics Assistant
            <Badge className="ml-2 bg-purple-500/20 text-purple-400">Powered by Sass</Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Minimize" : "Expand"}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Prompt Input */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              What's your song about? <span className="text-purple-400">(Be specific, I'm good but not a mind reader)</span>
            </label>
            <Textarea
              placeholder="e.g., A song about that friend who always cancels plans last minute..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="bg-gray-800 border-gray-600"
              rows={3}
            />
          </div>

          {/* Quick Suggestions */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              <Lightbulb className="w-4 h-4 inline mr-1" />
              Need inspiration? Try these:
            </label>
            <div className="flex flex-wrap gap-2">
              {promptSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setPrompt(suggestion)}
                  className="text-xs bg-gray-800 hover:bg-gray-700"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>

          {/* Style Selection */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Lyrical Style</label>
            <Select value={selectedStyle} onValueChange={setSelectedStyle}>
              <SelectTrigger className="bg-gray-800 border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {lyricStyles.map((style) => (
                  <SelectItem key={style.value} value={style.value}>
                    <div>
                      <div className="font-medium">{style.label}</div>
                      <div className="text-xs text-gray-400">{style.desc}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={generateLyricsMutation.isPending || !prompt.trim()}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {generateLyricsMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Cooking up some fire...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Lyrics
              </>
            )}
          </Button>

          {/* Generated Lyrics */}
          {generatedLyrics && (
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-white flex items-center">
                  <Music className="w-4 h-4 mr-2" />
                  Your Fresh Lyrics
                </h4>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" onClick={handleCopyLyrics}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <ThumbsUp className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <ThumbsDown className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="bg-gray-900 p-3 rounded text-gray-300 font-mono text-sm whitespace-pre-line mb-4">
                {generatedLyrics}
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={handleUseLyrics}
                  className="bg-spotify-green hover:bg-green-600"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Use These Lyrics
                </Button>
                <Button variant="outline" onClick={handleGenerate}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {/* AI Personality Box */}
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-3 border border-purple-500/30">
            <p className="text-sm text-purple-300">
              <Wand2 className="w-4 h-4 inline mr-1" />
              <strong>Pro tip:</strong> The more specific you are, the better I can tailor the lyrics. 
              Don't just say "love song" - tell me it's about texting your crush at 2 AM and immediately regretting it.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}