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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VoiceRecorder from "./voice-recorder";
import UpgradeModal from "./upgrade-modal";
import TextToSpeech from "./text-to-speech";
import LyricsQualityChecker from "./lyrics-quality-checker";
import AILyricsAssistant from "./ai-lyrics-assistant";
import StyleReferenceUpload from "./style-reference-upload";
import { insertSongSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, FileText, Upload, Lock, Crown, Mic2, Music } from "lucide-react";
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
  user: any;
  onUpgrade: () => void;
}

export default function SongForm({ onSongGenerated, currentStep, setCurrentStep, user, onUpgrade }: SongFormProps) {
  const [tempo, setTempo] = useState([120]);
  const [vocalStyle, setVocalStyle] = useState("male");
  const [singingStyle, setSingingStyle] = useState("smooth");
  const [mood, setMood] = useState("happy");
  const [tone, setTone] = useState("warm");
  const userPlan = user?.plan || "free";
  const freeUsage = { songsThisMonth: user?.songsThisMonth || 0, limit: 2 };
  const [selectedVoiceSample, setSelectedVoiceSample] = useState<number | null>(null);
  const [advancedSettings, setAdvancedSettings] = useState({
    introOutro: true,
    instrumental: false,
    harmonies: true,
  });
  const [lyricsQuality, setLyricsQuality] = useState<any>(null);
  const [currentLyrics, setCurrentLyrics] = useState("");
  const [songDuration, setSongDuration] = useState([120]); // Default 2 minutes
  const { toast } = useToast();

  const formatDurationFromSeconds = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Fetch user's voice samples
  const { data: voiceSamples = [] } = useQuery<VoiceSample[]>({
    queryKey: [`/api/voice-samples/1`], // Mock user ID
    enabled: userPlan === "pro",
  });

  const songLengths = [
    "3:00 - 3:30",
    "3:30 - 4:00", 
    "4:00 - 4:30",
    "4:30 - 5:00",
    "5:00 - 5:30"
  ];

  // Set default song length for all plans
  const defaultSongLength = "3:00 - 3:30";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: "1", // Test user ID as string
      title: "",
      lyrics: "",
      genre: "pop",
      vocalStyle: "male",
      singingStyle: "smooth",
      mood: "happy", 
      tone: "warm",
      tempo: 120,
      songLength: "2:00",
      voiceSampleId: null,
      status: "pending",
      generationProgress: 0,
      planRestricted: userPlan === "free",
      settings: {},
    },
  });

  const generateMelodyMutation = useMutation({
    mutationFn: async (data: { genre: string; mood: string; tempo: number; duration: number }) => {
      const response = await apiRequest("POST", "/api/generate-melody", data);
      return await response.json();
    },
    onSuccess: (melody) => {
      toast({
        title: "Melody Generated!",
        description: "Your musical composition is ready. Preview it before creating the full song!",
      });
    }
  });

  const generateSongMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      if (userPlan === "free" && freeUsage.songsThisMonth >= freeUsage.limit) {
        throw new Error("Monthly limit reached");
      }

      if (lyricsQuality?.shouldBlock) {
        throw new Error("Lyrics quality too low");
      }

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
      const sassySuccessMessages = [
        "Alright, let's cook up some fire! Your song is in the oven.",
        "Time to work my magic. This is gonna be good!",
        "Your song is being crafted. Get ready for something special.",
        "Let me turn these lyrics into pure gold. This might take a hot minute.",
        "This is the way. Your banger is being forged...",
        "With great lyrics comes great responsibility. Processing...",
        "I don't feel like it right now... just kidding, making magic!"
      ];
      const randomMessage = sassySuccessMessages[Math.floor(Math.random() * sassySuccessMessages.length)];

      toast({
        title: "Song generation started",
        description: randomMessage,
      });
      onSongGenerated(song);
    },
    onError: (error: any) => {
      if (error.message === "Monthly limit reached") {
        const sassyLimitMessages = [
          "Hold up there, speed racer!",
          "What did you expect from the free plan?",
          "Stop being so cheap!",
          "I'd love to help you out, but you've got to take me somewhere that doesn't involve a value meal."
        ];
        const randomTitle = sassyLimitMessages[Math.floor(Math.random() * sassyLimitMessages.length)];

        toast({
          title: randomTitle,
          description: "You've burned through all 3 free songs this month. Time to upgrade if you want to keep the party going!",
          variant: "destructive",
        });
      } else if (error.message === "Lyrics quality too low") {
        const sassyQualityMessages = [
          "Not happening with these lyrics!",
          "Maybe you should get your pencil back out and try again?",
          "This sounds like something my grandma came up with.",
          "Even auto-generated lyrics have more soul than this."
        ];
        const randomTitle = sassyQualityMessages[Math.floor(Math.random() * sassyQualityMessages.length)];

        toast({
          title: randomTitle,
          description: "I've got standards. Fix up those lyrics and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Something went sideways",
          description: "My creative engine hiccupped. Give it another shot?",
          variant: "destructive",
        });
      }
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

  const wordCount = form.watch("lyrics")?.split(/\s+/).filter(word => word.length > 0).length || 0;
  const estimatedDuration = Math.max(180, wordCount * 3); // Rough estimate
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `~${mins}:${secs.toString().padStart(2, '0')} minutes`;
  };

  const usage = user?.usage;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Music className="w-6 h-6 mr-2 text-purple-400" />
            Create Your Song
          </CardTitle>
          <CardDescription className="text-gray-400">
            Transform your lyrics into professional music with AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="lyrics" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-white/10">
                  <TabsTrigger value="lyrics" className="text-white">
                    Lyrics & Title
                  </TabsTrigger>
                  <TabsTrigger value="style" className="text-white">
                    Style & Genre
                  </TabsTrigger>
                  <TabsTrigger value="vocals" className="text-white">
                    Vocals & Voice
                  </TabsTrigger>
                  <TabsTrigger value="advanced" className="text-white">
                    Advanced
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="lyrics" className="space-y-6">
                  <div className="space-y-4">
                    {/* AI Lyrics Assistant */}
                    <AILyricsAssistant 
                      onLyricsGenerated={(lyrics) => {
                        form.setValue("lyrics", lyrics);
                        setCurrentLyrics(lyrics);
                      }}
                      currentLyrics={currentLyrics}
                      genre={form.watch("genre")}
                      mood={mood}
                    />

                    <FormField
                      control={form.control}
                      name="lyrics"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white font-medium">Song Lyrics</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                setCurrentLyrics(e.target.value);
                              }}
                              className="w-full h-64 bg-white/10 border-white/20 text-white placeholder:text-gray-400 resize-none"
                              placeholder="Enter your song lyrics here... Each line will be analyzed for melody generation."
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>{wordCount} words</span>
                      <span>{formatDuration(estimatedDuration)}</span>
                    </div>

                    {/* Lyrics Quality Checker */}
                    <LyricsQualityChecker 
                      lyrics={currentLyrics}
                      onQualityChecked={setLyricsQuality}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="style" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="genre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white font-medium">Genre</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white/10 border-white/20 text-white">
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

                    <div className="space-y-2">
                      <FormLabel className="text-white font-medium">Mood</FormLabel>
                      <div className="grid grid-cols-4 gap-2">
                        {moods.map((moodOption) => (
                          <Button
                            key={moodOption.value}
                            type="button"
                            variant={mood === moodOption.value ? "default" : "outline"}
                            size="sm"
                            className={`${mood === moodOption.value ? "bg-spotify-green hover:bg-spotify-green" : "bg-white/10 border-white/20 hover:bg-white/20"} h-auto p-3 flex flex-col text-white`}
                            onClick={() => setMood(moodOption.value)}
                          >
                            <div className={`w-4 h-4 rounded-full ${moodOption.color} mb-1`}></div>
                            <span className="text-xs">{moodOption.label}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <FormLabel className="text-white font-medium">Tempo: {tempo[0]} BPM</FormLabel>
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
                  </div>
                </TabsContent>

                <TabsContent value="vocals" className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <FormLabel className="text-white font-medium mb-2 block">Vocal Style</FormLabel>
                      <div className="grid grid-cols-2 gap-2">
                        {vocalStyles.map((style) => (
                          <Button
                            key={style.value}
                            type="button"
                            variant={vocalStyle === style.value ? "default" : "outline"}
                            size="sm"
                            className={`${vocalStyle === style.value ? "bg-spotify-green hover:bg-spotify-green" : "bg-white/10 border-white/20 hover:bg-white/20"} h-auto p-3 flex flex-col text-white`}
                            onClick={() => setVocalStyle(style.value)}
                          >
                            <span className="font-medium">{style.label}</span>
                            <span className="text-xs opacity-70">{style.sample}</span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    {userPlan === "pro" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <FormLabel className="text-white font-medium mb-2 block">Singing Style</FormLabel>
                          <div className="grid grid-cols-2 gap-2">
                            {singingStyles.map((style) => (
                              <Button
                                key={style.value}
                                type="button"
                                variant={singingStyle === style.value ? "default" : "outline"}
                                size="sm"
                                className={`${singingStyle === style.value ? "bg-spotify-green hover:bg-spotify-green" : "bg-white/10 border-white/20 hover:bg-white/20"} h-auto p-3 flex flex-col text-white`}
                                onClick={() => setSingingStyle(style.value)}
                              >
                                <span className="font-medium">{style.label}</span>
                                <span className="text-xs opacity-70">{style.description}</span>
                              </Button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <FormLabel className="text-white font-medium mb-2 block">Tone</FormLabel>
                          <div className="grid grid-cols-3 gap-2">
                            {tones.map((toneOption) => (
                              <Button
                                key={toneOption.value}
                                type="button"
                                variant={tone === toneOption.value ? "default" : "outline"}
                                size="sm"
                                className={`${tone === toneOption.value ? "bg-spotify-green hover:bg-spotify-green" : "bg-white/10 border-white/20 hover:bg-white/20"} h-auto p-3 flex flex-col text-white`}
                                onClick={() => setTone(toneOption.value)}
                              >
                                <span className="font-medium">{toneOption.label}</span>
                                <span className="text-xs opacity-70">{toneOption.description}</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Custom Voice Samples - Pro Only */}
                    {userPlan === "pro" && vocalStyle === "custom" && (
                      <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                          <CardTitle className="text-white text-lg flex items-center">
                            <Crown className="mr-2 text-vibrant-orange" />
                            Custom Voice Samples
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
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
                        </CardContent>
                      </Card>
                    )}

                    {/* Voice Recording for Free Users */}
                    {userPlan === "free" && (
                      <Card className="bg-white/5 border-white/10 relative">
                        <div className="absolute inset-0 bg-gray-900/50 rounded-xl flex items-center justify-center z-10">
                          <div className="text-center">
                            <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">Voice cloning requires Pro plan</p>
                          </div>
                        </div>
                        <CardContent className="p-6">
                          <VoiceRecorder userId={1} />
                          <TextToSpeech userId={1} />
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-6">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="songLength"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white font-medium mb-2 block">
                            Song Length: {formatDurationFromSeconds(songDuration[0])}
                          </FormLabel>
                          <div className="space-y-2">
                            <Slider
                              value={songDuration}
                              onValueChange={(value) => {
                                setSongDuration(value);
                                const minutes = Math.floor(value[0] / 60);
                                const seconds = value[0] % 60;
                                const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                                field.onChange(timeString);
                              }}
                              min={userPlan === "free" ? 30 : 30}
                              max={userPlan === "free" ? 120 : 330}
                              step={15}
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-400">
                              <span>0:30</span>
                              <span className="text-spotify-green font-medium">
                                {formatDurationFromSeconds(songDuration[0])}
                              </span>
                              <span>{userPlan === "free" ? "2:00" : "5:30"}</span>
                            </div>
                            {userPlan === "free" && (
                              <p className="text-xs text-orange-400">
                                Free plan: Up to 2 minutes. Upgrade for full-length songs up to 5:30.
                              </p>
                            )}
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Advanced Options - Pro Only */}
                    {userPlan === "pro" ? (
                      <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                          <CardTitle className="text-white text-lg">Advanced Options</CardTitle>
                        </CardHeader>
                        <CardContent>
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
                        </CardContent>
                      </Card>
                    ) : (
                      <UpgradeModal currentPlan={userPlan} onUpgrade={onUpgrade}>
                        <Card className="bg-gradient-to-br from-vibrant-orange/20 to-spotify-green/20 border-vibrant-orange/30 border cursor-pointer hover:bg-gradient-to-br hover:from-vibrant-orange/30 hover:to-spotify-green/30 transition-all">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-poppins font-semibold text-white flex items-center">
                                <Crown className="mr-2 text-vibrant-orange" />
                                Unlock Pro Features
                              </h3>
                              <span className="text-xl font-bold text-vibrant-orange">$6.99/mo</span>
                            </div>
                            <p className="text-gray-300 text-sm mb-4">
                              Get advanced vocal controls, full-length songs, voice cloning, and professional editing tools.
                            </p>
                          </CardContent>
                        </Card>
                      </UpgradeModal>
                    )}

                    {/* Style Reference Upload */}
                    <StyleReferenceUpload 
                      onStyleExtracted={(styleData) => {
                        // Apply extracted style to form
                        if (styleData.genre) {
                          const genreMap: { [key: string]: string } = {
                            "electronic pop": "electronic",
                            "hip hop": "hip-hop",
                            "r&b": "rnb"
                          };
                          const mappedGenre = genreMap[styleData.genre.toLowerCase()] || styleData.genre.toLowerCase();
                          form.setValue("genre", mappedGenre);
                        }
                        if (styleData.tempo) setTempo([styleData.tempo]);
                        if (styleData.mood) setMood(styleData.mood.toLowerCase());
                        if (styleData.key) {
                          toast({
                            title: "Style extracted!",
                            description: `Found ${styleData.genre} in ${styleData.key} at ${styleData.tempo} BPM. Let's make something similar but better!`,
                          });
                        }
                      }}
                      userPlan={userPlan}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {usage && typeof usage === 'object' && 'songsThisMonth' in usage && (
                <div className="mb-6 p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Monthly Usage:</span>
                    <span className="text-sm font-semibold text-vibrant-orange">
                      {(usage as any).songsThisMonth}/{(usage as any).monthlyLimit === -1 ? "∞" : (usage as any).monthlyLimit} songs
                    </span>
                  </div>
                  {user?.plan === 'free' && (
                    <div className="mt-2 text-xs text-gray-400">
                      Free plan: Full-length songs, no storage
                    </div>
                  )}
                </div>
              )}

              {/* Generate Button */}
              <div className="space-y-3">
                <Button
                  type="submit"
                  disabled={generateSongMutation.isPending || (userPlan === "free" && freeUsage.songsThisMonth >= freeUsage.limit) || !form.watch("lyrics")?.trim()}
                  className="w-full bg-gradient-to-r from-spotify-green to-green-600 hover:from-green-600 hover:to-spotify-green text-white py-6 px-8 h-auto font-poppins font-bold text-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                >
                  <Sparkles className="mr-3 w-6 h-6" />
                  {generateSongMutation.isPending 
                    ? "🎵 Creating Your Masterpiece..." 
                    : userPlan === "free" && freeUsage.songsThisMonth >= freeUsage.limit
                      ? "Monthly Limit Reached"
                      : !form.watch("lyrics")?.trim()
                        ? "Write Some Lyrics First!"
                        : userPlan === "free" 
                          ? `🚀 Generate Song (${freeUsage.limit - freeUsage.songsThisMonth} left)` 
                          : "🚀 Generate Amazing Song"
                  }
                </Button>
                
                {/* Melody Preview Button */}
                {form.watch("genre") && !generateSongMutation.isPending && (
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => generateMelodyMutation.mutate({
                        genre: form.watch("genre"),
                        mood: mood,
                        tempo: tempo[0],
                        duration: songDuration[0]
                      })}
                      disabled={generateMelodyMutation.isPending}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-none py-3 px-6 font-semibold mr-4"
                    >
                      {generateMelodyMutation.isPending ? "🎼 Creating..." : "🎼 Preview Melody"}
                    </Button>
                    
                    {/* Quick Generate Button for faster access */}
                    {form.watch("lyrics")?.trim() && (
                      <Button
                        type="submit"
                        variant="outline"
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-none py-3 px-6 font-semibold"
                      >
                        ⚡ Quick Generate
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {userPlan === "free" && (
                <div className="mt-2 text-center">
                  <p className="text-xs text-gray-400">
                    Free plan: 2 full-length songs per month, no storage or editing. 
                    <span className="text-vibrant-orange cursor-pointer hover:underline ml-1">
                      Upgrade to Basic for voice cloning & storage
                    </span>
                  </p>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div></TabsContent>

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

            {/* Style Reference Upload */}
            <StyleReferenceUpload 
              onStyleExtracted={(styleData) => {
                // Apply extracted style to form
                if (styleData.genre) {
                  const genreMap: { [key: string]: string } = {
                    "electronic pop": "electronic",
                    "hip hop": "hip-hop",
                    "r&b": "rnb"
                  };
                  const mappedGenre = genreMap[styleData.genre.toLowerCase()] || styleData.genre.toLowerCase();
                  form.setValue("genre", mappedGenre);
                }
                if (styleData.tempo) setTempo([styleData.tempo]);
                if (styleData.mood) setMood(styleData.mood.toLowerCase());
                if (styleData.key) {
                  toast({
                    title: "Style extracted!",
                    description: `Found ${styleData.genre} in ${styleData.key} at ${styleData.tempo} BPM. Let's make something similar but better!`,
                  });
                }
              }}
              userPlan={userPlan}
            />
          </div>

          

                
  );
}