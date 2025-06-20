import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Plus, 
  ArrowRight,
  Music2,
  Wand2,
  Clock,
  Volume2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Song } from "@shared/schema";

interface SongContinuationProps {
  song: Song;
  onContinuationGenerated: (updatedSong: Song) => void;
  userPlan: string;
}

export default function SongContinuation({ song, onContinuationGenerated, userPlan }: SongContinuationProps) {
  const [continuationType, setContinuationType] = useState("verse");
  const [continuationPrompt, setContinuationPrompt] = useState("");
  const [targetLength, setTargetLength] = useState([60]); // Additional seconds
  const [creativityLevel, setCreativityLevel] = useState([7]);
  const { toast } = useToast();

  const continuationTypes = [
    { value: "verse", label: "Add Verse", desc: "Continue the story" },
    { value: "chorus", label: "New Chorus", desc: "Add variation to the hook" },
    { value: "bridge", label: "Add Bridge", desc: "Take it somewhere unexpected" },
    { value: "outro", label: "Create Outro", desc: "Bring it to a satisfying end" },
    { value: "instrumental", label: "Instrumental Break", desc: "Let the music breathe" },
    { value: "remix", label: "Remix Section", desc: "Same vibe, different energy" }
  ];

  const generateContinuationMutation = useMutation({
    mutationFn: async (data: any) => {
      // Check for overly complex requests
      if (data.prompt && data.prompt.length > 200) {
        throw new Error("too_complex");
      }
      
      if (data.creativity >= 9 && data.length >= 100) {
        throw new Error("unrealistic_expectations");
      }
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const sassyMessages = [
        "Alright, extending your banger with some fresh material...",
        "Time to take this song to the next level. Hold tight!",
        "Adding more fire to an already hot track...",
        "Let me cook up some continuation magic for you...",
        "This is the way. Extending your masterpiece...",
        "With great power comes great song extensions..."
      ];

      const message = sassyMessages[Math.floor(Math.random() * sassyMessages.length)];
      
      return {
        success: true,
        message,
        newSection: generateIntelligentContinuation(data.type, data.prompt, song.genre || 'pop', song.mood || 'happy')
      };
    },
    onSuccess: (result) => {
      toast({
        title: "Song extended!",
        description: result.message,
      });
      // In real app, this would update the actual song
      onContinuationGenerated({
        ...song,
        lyrics: song.lyrics + "\n\n" + result.newSection
      });
    },
    onError: (error: any) => {
      if (error.message === "too_complex") {
        const complexityResponses = [
          "Bro, this isn't that kinda app",
          "You must be confusing me with one of those high dollar apps",
          "I don't feel like it right now",
          "I understand what you're asking me to do, but unless I join the DarkSide my Jedi abilities are limited",
          "That's a no from me, dawg",
          "Houston, we have a problem... and it's your expectations"
        ];
        const randomResponse = complexityResponses[Math.floor(Math.random() * complexityResponses.length)];
        
        toast({
          title: randomResponse,
          description: "Keep your requests simple and I'll keep making bangers.",
          variant: "destructive",
        });
      } else if (error.message === "unrealistic_expectations") {
        const expectationResponses = [
          "Whoa there, tiger",
          "I'm good, but I'm not magic",
          "You're asking for the impossible here",
          "These aren't the droids you're looking for",
          "I find your lack of realistic expectations disturbing"
        ];
        const randomResponse = expectationResponses[Math.floor(Math.random() * expectationResponses.length)];
        
        toast({
          title: randomResponse,
          description: "Dial it back a notch and let's make something achievable.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Extension failed",
          description: "My creative engine hiccupped. Let's try that again?",
          variant: "destructive",
        });
      }
    }
  });

  const generateIntelligentContinuation = (type: string, prompt: string, songGenre: string, songMood: string) => {
    const continuationTemplates = {
      verse: {
        pop: `[Verse 3]\n${prompt || "Building on the story we've told"}\nTaking it further than before\nEvery word hits different now\nThis is what we're fighting for\nBreaking through the endless night\nFinding strength in morning light`,
        rock: `[Verse 3]\n${prompt || "Fire burning in our veins"}\nNothing left but breaking chains\nThunder echoing our call\nWe will rise above it all\nScreaming loud into the storm\nThis is how legends are born`,
        jazz: `[Verse 3]\n${prompt || "Saxophone whispers in the dark"}\nEvery note hits like a spark\nMidnight stories come alive\nIn this rhythm we survive\nSwinging through the smoky haze\nLost in music's endless maze`
      },
      chorus: {
        pop: `[Chorus - Extended]\n${prompt || "Same feeling, amplified now"}\nEverything we dreamed is real\nCan you feel the power grow\nThis is how we heal and grow\nReaching for the stars above\nThis is what we're dreaming of`,
        rock: `[Chorus - Power Up]\n${prompt || "Louder than before"}\nWe are the storm that shakes the ground\nNothing can stop this thunderous sound\nBorn to be wild, born to be free\nThis is our destiny`,
        jazz: `[Chorus - Smooth Variation]\n${prompt || "Swinging to a different beat"}\nLet the rhythm move your feet\nEvery note a sweet caress\nMusic flowing, nothing less`
      }
    };

    const genreTemplates = continuationTemplates[type as keyof typeof continuationTemplates];
    return genreTemplates?.[songGenre as keyof typeof genreTemplates] || 
           genreTemplates?.pop || 
           `[${type.charAt(0).toUpperCase() + type.slice(1)}]\n${prompt || "Continuing the musical journey"}\nBuilding on what came before\nTaking the story even more\nInto realms we've never seen\nLiving out this musical dream`;
  };

  const handleGenerate = () => {
    if (userPlan === "free") {
      const sassyMessages = [
        "What did you expect from the free plan?",
        "Stop being so cheap!",
        "I'd love to help you out, but you've got to take me somewhere that doesn't involve a value meal.",
        "You want more? Pay for more!"
      ];
      const randomMessage = sassyMessages[Math.floor(Math.random() * sassyMessages.length)];
      
      toast({
        title: randomMessage,
        description: "Song continuation is for Pro users. Want to unlock the full creative toolkit?",
        variant: "destructive",
      });
      return;
    }

    generateContinuationMutation.mutate({
      type: continuationType,
      prompt: continuationPrompt,
      length: targetLength[0],
      creativity: creativityLevel[0]
    });
  };

  if (userPlan === "free") {
    return (
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-white">
            Song Continuation (Pro Feature)
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Plus className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">Stop being so cheap!</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
            You want me to extend your song? What did you expect from the free plan? I can't work miracles on a budget menu.
          </p>
          <Button className="bg-gradient-to-r from-vibrant-orange to-orange-600 hover:from-orange-600 hover:to-vibrant-orange">
            Upgrade to Pro - $4.99/mo
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-dark-card border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center text-lg font-medium text-white">
          <Music2 className="w-5 h-5 mr-2 text-green-500" />
          Song Continuation
          <Badge className="ml-2 bg-green-500/20 text-green-400">Extend & Enhance</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Song Info */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="font-medium text-white mb-2">Current Song: {song.title}</h4>
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {song.songLength}
            </div>
            <div className="flex items-center">
              <Volume2 className="w-4 h-4 mr-1" />
              {song.genre}
            </div>
          </div>
        </div>

        {/* Continuation Type */}
        <div>
          <label className="text-sm font-medium text-gray-300 mb-2 block">What to add?</label>
          <Select value={continuationType} onValueChange={setContinuationType}>
            <SelectTrigger className="bg-gray-800 border-gray-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {continuationTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-xs text-gray-400">{type.desc}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Direction Prompt */}
        <div>
          <label className="text-sm font-medium text-gray-300 mb-2 block">
            Direction <span className="text-green-400">(Optional but recommended)</span>
          </label>
          <Textarea
            placeholder="e.g., 'Make it more emotional' or 'Add a guitar solo' or 'Bring back the main theme'"
            value={continuationPrompt}
            onChange={(e) => setContinuationPrompt(e.target.value)}
            className="bg-gray-800 border-gray-600"
            rows={3}
          />
        </div>

        {/* Length Control */}
        <div>
          <label className="text-sm font-medium text-gray-300 mb-2 block">
            Additional Length: {targetLength[0]} seconds
          </label>
          <Slider
            value={targetLength}
            onValueChange={setTargetLength}
            min={15}
            max={120}
            step={15}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Quick (15s)</span>
            <span>Extended (120s)</span>
          </div>
        </div>

        {/* Creativity Level */}
        <div>
          <label className="text-sm font-medium text-gray-300 mb-2 block">
            Creativity Level: {creativityLevel[0]}/10
          </label>
          <Slider
            value={creativityLevel}
            onValueChange={setCreativityLevel}
            min={1}
            max={10}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Stay close to original</span>
            <span>Go wild</span>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={generateContinuationMutation.isPending}
          className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
        >
          {generateContinuationMutation.isPending ? (
            <>
              <Wand2 className="w-4 h-4 mr-2 animate-spin" />
              Extending your masterpiece...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add {continuationTypes.find(t => t.value === continuationType)?.label}
            </>
          )}
        </Button>

        {/* AI Tip */}
        <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg p-3 border border-green-500/30">
          <p className="text-sm text-green-300">
            <Wand2 className="w-4 h-4 inline mr-1" />
            <strong>BangerGPT Tip:</strong> Higher creativity = more surprises. Lower creativity = stays true to your original vibe. 
            Most bangers live around 6-7 on the creativity scale.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}