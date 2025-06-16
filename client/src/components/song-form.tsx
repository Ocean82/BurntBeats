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
import { insertSongSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, FileText, Upload } from "lucide-react";
import type { Song } from "@shared/schema";
import { z } from "zod";

const formSchema = insertSongSchema.extend({
  lyrics: z.string().min(10, "Lyrics must be at least 10 characters long"),
});

interface SongFormProps {
  onSongGenerated: (song: Song) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

export default function SongForm({ onSongGenerated, currentStep, setCurrentStep }: SongFormProps) {
  const [tempo, setTempo] = useState([120]);
  const [vocalStyle, setVocalStyle] = useState("male");
  const [advancedSettings, setAdvancedSettings] = useState({
    introOutro: true,
    instrumental: false,
    harmonies: true,
  });
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: 1, // Mock user ID
      title: "",
      lyrics: "",
      genre: "pop",
      vocalStyle: "male",
      tempo: 120,
      songLength: "3:00 - 3:30",
      voiceSampleId: null,
      status: "pending",
      generationProgress: 0,
      settings: {},
    },
  });

  const generateSongMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await apiRequest("POST", "/api/songs", {
        ...data,
        tempo: tempo[0],
        vocalStyle,
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
    { value: "male", label: "Male Voice" },
    { value: "female", label: "Female Voice" },
    { value: "instrumental", label: "Instrumental" },
    { value: "custom", label: "Custom Voice" },
  ];

  const songLengths = [
    "3:00 - 3:30",
    "3:30 - 4:00", 
    "4:00 - 4:30",
    "4:30 - 5:00"
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
                  <Button type="button" variant="outline" size="sm">
                    <Sparkles className="w-4 h-4 mr-1" />
                    AI Assist
                  </Button>
                  <Button type="button" variant="outline" size="sm">
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

            {/* Voice Recording */}
            <VoiceRecorder userId={1} />
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
                  <div className="grid grid-cols-2 gap-2">
                    {vocalStyles.map((style) => (
                      <Button
                        key={style.value}
                        type="button"
                        variant={vocalStyle === style.value ? "default" : "outline"}
                        size="sm"
                        className={vocalStyle === style.value ? "bg-spotify-green hover:bg-spotify-green" : ""}
                        onClick={() => setVocalStyle(style.value)}
                      >
                        {style.label}
                      </Button>
                    ))}
                  </div>
                </div>

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

            {/* Advanced Options */}
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

            {/* Generate Button */}
            <Button
              type="submit"
              disabled={generateSongMutation.isPending}
              className="w-full bg-gradient-to-r from-spotify-green to-green-600 hover:from-green-600 hover:to-spotify-green text-white py-4 px-6 h-auto font-poppins font-semibold text-lg transition-all duration-200 transform hover:scale-105"
            >
              <Sparkles className="mr-2" />
              {generateSongMutation.isPending ? "Starting Generation..." : "Generate Song"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
