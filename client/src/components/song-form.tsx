import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import VoiceRecorder from "./voice-recorder";
import PlanUpgrade from "./plan-upgrade";
import TextToSpeech from "./text-to-speech";
import { insertSongSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, FileText, Upload, Lock, Crown, Mic2 } from "lucide-react";
import type { Song, VoiceSample } from "@shared/schema";
import { z } from "zod";

const formSchema = insertSongSchema.extend({
  lyrics: z.string().min(10, "Lyrics must be at least 10 characters long"),
  singingStyle: z.string().optional(),
  mood: z.string().optional(),
  tone: z.string().optional(),
});

interface SongFormProps {
  onSongGenerated: (song: Song) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

export default function SongForm({ onSongGenerated, currentStep, setCurrentStep }: SongFormProps) {
  const [tempo, setTempo] = useState([120]);
  const [vocalStyle, setVocalStyle] = useState("male");
  const [singingStyle, setSingingStyle] = useState("smooth");
  const [mood, setMood] = useState("happy");
  const [tone, setTone] = useState("warm");
  const [userPlan] = useState("free"); // Mock user plan - would come from auth context
  const [selectedVoiceSample, setSelectedVoiceSample] = useState<number | null>(null);
  const [advancedSettings, setAdvancedSettings] = useState({
    introOutro: true,
    instrumental: false,
    harmonies: true,
  });
  const { toast } = useToast();

  // Fetch user's voice samples
  const { data: voiceSamples = [] } = useQuery<VoiceSample[]>({
    queryKey: [`/api/voice-samples/1`], // Mock user ID
    enabled: userPlan === "pro",
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: 1, // Mock user ID
      title: "",
      lyrics: "",
      genre: "pop",
      vocalStyle: "male",
      singingStyle: "smooth",
      mood: "happy", 
      tone: "warm",
      tempo: 120,
      songLength: userPlan === "free" ? "0:30" : "3:00 - 3:30",
      voiceSampleId: null,
      status: "pending",
      generationProgress: 0,
      planRestricted: userPlan === "free",
      settings: {},
    },
  });

  const generateSongMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await apiRequest("POST", "/api/songs", {
        ...data,
        tempo: tempo[0],
        vocalStyle,
        singingStyle,
        mood,
        tone,
        voiceSampleId: selectedVoiceSample,
        settings: advancedSettings,
      });
      return await response.json();
    },
    onSuccess: (song: Song) => {
      toast({
        title: "Song generation started",
        description: "Your song is being generated. This may take a few minutes.",
      });
      onSongGenerated(song);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start song generation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const title = data.lyrics.split('\n')[0] || "Untitled Song";
    generateSongMutation.mutate({ ...data, title });
  };

  const genres = [
    "Pop", "Rock", "Jazz", "Electronic", "Classical", "Hip-Hop", "Country", "R&B"
  ];

  const vocalStyles = [
    { value: "male", label: "Male Voice", sample: "🎵 Male sample" },
    { value: "female", label: "Female Voice", sample: "🎵 Female sample" },
    { value: "instrumental", label: "Instrumental", sample: "🎵 No vocals" },
    { value: "custom", label: "Custom Voice", sample: "🎵 Your voice" },
  ];

  const singingStyles = [
    { value: "smooth", label: "Smooth", description: "Soft and flowing vocals" },
    { value: "powerful", label: "Powerful", description: "Strong and commanding" },
    { value: "emotional", label: "Emotional", description: "Expressive and heartfelt" },
    { value: "raspy", label: "Raspy", description: "Textured and gritty" },
    { value: "melodic", label: "Melodic", description: "Tune-focused singing" },
    { value: "rhythmic", label: "Rhythmic", description: "Beat-driven vocals" },
  ];

  const moods = [
    { value: "happy", label: "Happy", color: "bg-yellow-500" },
    { value: "sad", label: "Sad", color: "bg-blue-500" },
    { value: "energetic", label: "Energetic", color: "bg-orange-500" },
    { value: "calm", label: "Calm", color: "bg-green-500" },
    { value: "romantic", label: "Romantic", color: "bg-pink-500" },
    { value: "mysterious", label: "Mysterious", color: "bg-purple-500" },
    { value: "uplifting", label: "Uplifting", color: "bg-cyan-500" },
    { value: "melancholic", label: "Melancholic", color: "bg-gray-500" },
  ];

  const tones = [
    { value: "warm", label: "Warm", description: "Rich and inviting" },
    { value: "bright", label: "Bright", description: "Clear and crisp" },
    { value: "deep", label: "Deep", description: "Low and resonant" },
    { value: "light", label: "Light", description: "Airy and gentle" },
    { value: "rich", label: "Rich", description: "Full-bodied sound" },
    { value: "ethereal", label: "Ethereal", description: "Dreamy and floating" },
  ];

  const songLengths = userPlan === "free" 
    ? ["0:30"] 
    : [
        "3:00 - 3:30",
        "3:30 - 4:00", 
        "4:00 - 4:30",
        "4:30 - 5:00",
        "5:00 - 5:30"
      ];

  const wordCount = form.watch("lyrics")?.split(/\s+/).filter(word => word.length > 0).length || 0;
  const estimatedDuration = Math.max(180, wordCount * 3); // Rough estimate
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `~${mins}:${secs.toString().padStart(2, '0')} minutes`;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lyrics Input */}
          <div className="lg:col-span-2">
            <div className="bg-dark-card rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-poppins font-semibold">Song Lyrics</h3>
                <div className="flex items-center space-x-2">
                  <Button type="button" variant="outline" size="sm" className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600">
                    <Sparkles className="w-4 h-4 mr-1" />
                    AI Assist
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600">
                    <Upload className="w-4 h-4 mr-1" />
                    Import
                  </Button>
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="lyrics"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        {...field}
                        className="w-full h-64 bg-gray-800 border-gray-600 text-white placeholder-gray-400 resize-none"
                        placeholder={`Enter your song lyrics here...

[Verse 1]
Walking down the street tonight
Stars are shining bright
Everything feels so right
In this moment of pure light

[Chorus]
We're dancing through the night
Everything's gonna be alright
Let the music take control
Feel it deep within your soul

[Verse 2]
...`}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
                <span>{wordCount} words</span>
                <span>{formatDuration(estimatedDuration)}</span>
              </div>
            </div>

            {/* Custom Voice Samples - Pro Only */}
            {userPlan === "pro" && vocalStyle === "custom" && (
              <div className="bg-dark-card rounded-xl p-6 mt-6">
                <h3 className="text-lg font-poppins font-semibold mb-4 flex items-center">
                  <Crown className="mr-2 text-vibrant-orange" />
                  Custom Voice Samples
                </h3>
                
                {voiceSamples.length > 0 && (
                  <div className="mb-4">
                    <FormLabel className="text-sm font-medium text-gray-300 mb-2 block">
                      Select Voice Sample
                    </FormLabel>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {voiceSamples.map((sample) => (
                        <div
                          key={sample.id}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedVoiceSample === sample.id 
                              ? "bg-spotify-green/20 border border-spotify-green" 
                              : "bg-gray-800 hover:bg-gray-700"
                          }`}
                          onClick={() => setSelectedVoiceSample(
                            selectedVoiceSample === sample.id ? null : sample.id
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-white">{sample.name}</span>
                            <span className="text-xs text-gray-400">
                              {sample.duration ? `${Math.floor(sample.duration / 60)}:${(sample.duration % 60).toString().padStart(2, '0')}` : ""}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <VoiceRecorder userId={1} />
                <TextToSpeech userId={1} />
              </div>
            )}

            {/* Voice Recording for Free Users */}
            {userPlan === "free" && (
              <div className="bg-dark-card rounded-xl p-6 mt-6 relative">
                <div className="absolute inset-0 bg-gray-900/50 rounded-xl flex items-center justify-center z-10">
                  <div className="text-center">
                    <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Voice cloning requires Pro plan</p>
                  </div>
                </div>
                <VoiceRecorder userId={1} />
                <TextToSpeech userId={1} />
              </div>
            )}
          </div>

          {/* Style Controls */}
          <div className="space-y-6">
            {/* Music Style */}
            <div className="bg-dark-card rounded-xl p-6">
              <h3 className="text-lg font-poppins font-semibold mb-4">Music Style</h3>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="genre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-300">Genre</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-800 border-gray-600">
                            <SelectValue placeholder="Select a genre" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {genres.map((genre) => (
                            <SelectItem key={genre} value={genre.toLowerCase()}>
                              {genre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel className="text-sm font-medium text-gray-300 mb-2 block">Vocal Style</FormLabel>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {vocalStyles.map((style) => (
                      <Button
                        key={style.value}
                        type="button"
                        variant={vocalStyle === style.value ? "default" : "outline"}
                        size="sm"
                        className={`${vocalStyle === style.value ? "bg-spotify-green hover:bg-spotify-green" : ""} h-auto p-3 flex flex-col`}
                        onClick={() => setVocalStyle(style.value)}
                      >
                        <span className="font-medium">{style.label}</span>
                        <span className="text-xs opacity-70">{style.sample}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {userPlan === "pro" && (
                  <>
                    <div>
                      <FormLabel className="text-sm font-medium text-gray-300 mb-2 block">Singing Style</FormLabel>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {singingStyles.map((style) => (
                          <Button
                            key={style.value}
                            type="button"
                            variant={singingStyle === style.value ? "default" : "outline"}
                            size="sm"
                            className={`${singingStyle === style.value ? "bg-spotify-green hover:bg-spotify-green" : ""} h-auto p-3 flex flex-col`}
                            onClick={() => setSingingStyle(style.value)}
                          >
                            <span className="font-medium">{style.label}</span>
                            <span className="text-xs opacity-70">{style.description}</span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <FormLabel className="text-sm font-medium text-gray-300 mb-2 block">Mood</FormLabel>
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        {moods.map((moodOption) => (
                          <Button
                            key={moodOption.value}
                            type="button"
                            variant={mood === moodOption.value ? "default" : "outline"}
                            size="sm"
                            className={`${mood === moodOption.value ? "bg-spotify-green hover:bg-spotify-green" : ""} h-auto p-3 flex flex-col`}
                            onClick={() => setMood(moodOption.value)}
                          >
                            <div className={`w-4 h-4 rounded-full ${moodOption.color} mb-1`}></div>
                            <span className="text-xs">{moodOption.label}</span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <FormLabel className="text-sm font-medium text-gray-300 mb-2 block">Tone</FormLabel>
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {tones.map((toneOption) => (
                          <Button
                            key={toneOption.value}
                            type="button"
                            variant={tone === toneOption.value ? "default" : "outline"}
                            size="sm"
                            className={`${tone === toneOption.value ? "bg-spotify-green hover:bg-spotify-green" : ""} h-auto p-3 flex flex-col`}
                            onClick={() => setTone(toneOption.value)}
                          >
                            <span className="font-medium">{toneOption.label}</span>
                            <span className="text-xs opacity-70">{toneOption.description}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <FormLabel className="text-sm font-medium text-gray-300 mb-2 block">Tempo</FormLabel>
                  <div className="space-y-2">
                    <Slider
                      value={tempo}
                      onValueChange={setTempo}
                      min={60}
                      max={180}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Slow (60)</span>
                      <span className="text-spotify-green font-medium">{tempo[0]} BPM</span>
                      <span>Fast (180)</span>
                    </div>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="songLength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-300">Song Length</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-800 border-gray-600">
                            <SelectValue placeholder="Select song length" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {songLengths.map((length) => (
                            <SelectItem key={length} value={length}>
                              {length}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Advanced Options - Pro Only */}
            {userPlan === "pro" ? (
              <div className="bg-dark-card rounded-xl p-6">
                <h3 className="text-lg font-poppins font-semibold mb-4">Advanced Options</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Add Intro/Outro</span>
                    <Switch
                      checked={advancedSettings.introOutro}
                      onCheckedChange={(checked) => 
                        setAdvancedSettings(prev => ({ ...prev, introOutro: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Instrumental Breaks</span>
                    <Switch
                      checked={advancedSettings.instrumental}
                      onCheckedChange={(checked) => 
                        setAdvancedSettings(prev => ({ ...prev, instrumental: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Auto-Harmonies</span>
                    <Switch
                      checked={advancedSettings.harmonies}
                      onCheckedChange={(checked) => 
                        setAdvancedSettings(prev => ({ ...prev, harmonies: checked }))
                      }
                    />
                  </div>
                </div>
              </div>
            ) : (
              <PlanUpgrade 
                currentPlan={userPlan} 
                onUpgrade={() => toast({
                  title: "Upgrade to Pro",
                  description: "Visit your account settings to upgrade your plan.",
                })}
              />
            )}

            {/* Generate Button */}
            <Button
              type="submit"
              disabled={generateSongMutation.isPending}
              className="w-full bg-gradient-to-r from-spotify-green to-green-600 hover:from-green-600 hover:to-spotify-green text-white py-4 px-6 h-auto font-poppins font-semibold text-lg transition-all duration-200 transform hover:scale-105"
            >
              <Sparkles className="mr-2" />
              {generateSongMutation.isPending 
                ? "Starting Generation..." 
                : userPlan === "free" 
                  ? "Generate 30s Song (Free)" 
                  : "Generate Song"
              }
            </Button>

            {userPlan === "free" && (
              <div className="mt-2 text-center">
                <p className="text-xs text-gray-400">
                  Free plan creates 30-second songs. 
                  <span className="text-vibrant-orange cursor-pointer hover:underline ml-1">
                    Upgrade to Pro for full-length songs
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}
