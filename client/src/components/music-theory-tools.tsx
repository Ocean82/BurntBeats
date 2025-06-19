import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Music2, 
  Play, 
  RefreshCw, 
  Lightbulb,
  Target,
  Volume2,
  Settings
} from "lucide-react";

export default function MusicTheoryTools() {
  const [selectedKey, setSelectedKey] = useState("C");
  const [selectedScale, setSelectedScale] = useState("major");
  const [chordProgression, setChordProgression] = useState(["C", "Am", "F", "G"]);
  const [bpm, setBpm] = useState(120);
  const [timeSignature, setTimeSignature] = useState("4/4");

  const keys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const scales = [
    { value: "major", name: "Major", pattern: [0, 2, 4, 5, 7, 9, 11] },
    { value: "minor", name: "Natural Minor", pattern: [0, 2, 3, 5, 7, 8, 10] },
    { value: "dorian", name: "Dorian", pattern: [0, 2, 3, 5, 7, 9, 10] },
    { value: "mixolydian", name: "Mixolydian", pattern: [0, 2, 4, 5, 7, 9, 10] },
    { value: "pentatonic", name: "Pentatonic", pattern: [0, 2, 4, 7, 9] }
  ];

  const commonProgressions = {
    pop: [["C", "Am", "F", "G"], ["Am", "F", "C", "G"], ["F", "G", "Am", "C"]],
    rock: [["C", "F", "G", "C"], ["Am", "C", "F", "G"], ["C", "G", "Am", "F"]],
    jazz: [["Cmaj7", "Am7", "Dm7", "G7"], ["Fmaj7", "Em7", "Am7", "Dm7"]],
    blues: [["C7", "F7", "C7", "C7"], ["F7", "F7", "C7", "C7"], ["G7", "F7", "C7", "G7"]]
  };

  const getScaleNotes = (key: string, scale: string) => {
    const keyIndex = keys.indexOf(key);
    const scalePattern = scales.find(s => s.value === scale)?.pattern || [0, 2, 4, 5, 7, 9, 11];
    
    return scalePattern.map(interval => {
      const noteIndex = (keyIndex + interval) % 12;
      return keys[noteIndex];
    });
  };

  const generateChordProgression = (genre: keyof typeof commonProgressions) => {
    const progressions = commonProgressions[genre];
    const randomProgression = progressions[Math.floor(Math.random() * progressions.length)];
    setChordProgression(randomProgression);
  };

  const getLyricSuggestions = () => {
    const suggestions = {
      major: ["bright", "happy", "uplifting", "celebration", "joy", "love", "freedom"],
      minor: ["melancholy", "introspective", "emotional", "longing", "nostalgia", "depth"],
      dorian: ["mysterious", "ethereal", "folk-like", "ancient", "storytelling"],
      mixolydian: ["bluesy", "rock", "powerful", "driving", "energetic"],
      pentatonic: ["simple", "catchy", "universal", "timeless", "memorable"]
    };
    
    return suggestions[selectedScale as keyof typeof suggestions] || suggestions.major;
  };

  const getChordAnalysis = (chord: string) => {
    const analyses = {
      "C": { quality: "Major", function: "Tonic", mood: "Stable, Happy" },
      "Am": { quality: "Minor", function: "Relative Minor", mood: "Sad, Introspective" },
      "F": { quality: "Major", function: "Subdominant", mood: "Lifting, Supportive" },
      "G": { quality: "Major", function: "Dominant", mood: "Tension, Leading" },
      "Dm": { quality: "Minor", function: "ii chord", mood: "Gentle, Melancholy" },
      "Em": { quality: "Minor", function: "iii chord", mood: "Bright Minor" }
    };
    
    return analyses[chord as keyof typeof analyses] || { 
      quality: "Unknown", 
      function: "Analyze", 
      mood: "Varied" 
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-poppins font-bold text-white">Music Theory Tools</h2>
        <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
          Pro Feature
        </Badge>
      </div>

      <Tabs defaultValue="scales" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800">
          <TabsTrigger value="scales">Scales & Keys</TabsTrigger>
          <TabsTrigger value="chords">Chord Progressions</TabsTrigger>
          <TabsTrigger value="rhythm">Rhythm & Tempo</TabsTrigger>
          <TabsTrigger value="suggestions">AI Suggestions</TabsTrigger>
        </TabsList>

        <TabsContent value="scales" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-dark-card border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-white">Scale Builder</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Key</label>
                    <Select value={selectedKey} onValueChange={setSelectedKey}>
                      <SelectTrigger className="bg-gray-800 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {keys.map(key => (
                          <SelectItem key={key} value={key}>{key}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Scale</label>
                    <Select value={selectedScale} onValueChange={setSelectedScale}>
                      <SelectTrigger className="bg-gray-800 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {scales.map(scale => (
                          <SelectItem key={scale.value} value={scale.value}>
                            {scale.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-white mb-3">Scale Notes</h4>
                  <div className="flex flex-wrap gap-2">
                    {getScaleNotes(selectedKey, selectedScale).map((note, index) => (
                      <Badge key={index} variant="outline" className="bg-spotify-green/20 text-spotify-green">
                        {note}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button className="w-full" variant="outline">
                  <Play className="w-4 h-4 mr-2" />
                  Play Scale
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-dark-card border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-white">Lyric Mood Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-white mb-3">
                      Suggested Themes for {selectedScale}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {getLyricSuggestions().map((suggestion, index) => (
                        <Badge key={index} variant="secondary" className="bg-gray-700 text-gray-300">
                          {suggestion}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-white mb-2">Scale Characteristics</h5>
                    <p className="text-sm text-gray-400">
                      {selectedScale === "major" && "Bright, happy, uplifting. Perfect for love songs, celebrations, and positive themes."}
                      {selectedScale === "minor" && "Sad, introspective, emotional. Great for ballads, heartbreak, and deep emotions."}
                      {selectedScale === "dorian" && "Mysterious, folk-like, slightly dark but not as sad as minor."}
                      {selectedScale === "mixolydian" && "Bluesy, rock-oriented, with a distinctive flat 7th that adds character."}
                      {selectedScale === "pentatonic" && "Simple, catchy, universally appealing. Used in many pop and rock songs."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="chords" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-dark-card border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-white">Chord Progression Builder</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(commonProgressions).map(([genre, _]) => (
                    <Button
                      key={genre}
                      variant="outline"
                      size="sm"
                      onClick={() => generateChordProgression(genre as keyof typeof commonProgressions)}
                      className="capitalize"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      {genre}
                    </Button>
                  ))}
                </div>

                <div className="bg-gray-800 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-white mb-3">Current Progression</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {chordProgression.map((chord, index) => (
                      <div key={index} className="text-center">
                        <div className="bg-spotify-green/20 text-spotify-green p-2 rounded mb-1 font-medium">
                          {chord}
                        </div>
                        <div className="text-xs text-gray-400">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button className="w-full" variant="outline">
                  <Play className="w-4 h-4 mr-2" />
                  Play Progression
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-dark-card border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-white">Chord Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {chordProgression.map((chord, index) => {
                  const analysis = getChordAnalysis(chord);
                  return (
                    <div key={index} className="bg-gray-800 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white">{chord}</span>
                        <Badge variant="outline" className="text-xs">
                          {analysis.quality}
                        </Badge>
                      </div>
                      <div className="text-sm space-y-1">
                        <div className="text-gray-400">
                          <span className="text-gray-300">Function:</span> {analysis.function}
                        </div>
                        <div className="text-gray-400">
                          <span className="text-gray-300">Mood:</span> {analysis.mood}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rhythm" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-dark-card border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-white">Tempo & Timing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">BPM</label>
                    <Input
                      type="number"
                      value={bpm}
                      onChange={(e) => setBpm(parseInt(e.target.value))}
                      className="bg-gray-800 border-gray-600"
                      min="60"
                      max="200"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Time Signature</label>
                    <Select value={timeSignature} onValueChange={setTimeSignature}>
                      <SelectTrigger className="bg-gray-800 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4/4">4/4 (Common)</SelectItem>
                        <SelectItem value="3/4">3/4 (Waltz)</SelectItem>
                        <SelectItem value="6/8">6/8 (Compound)</SelectItem>
                        <SelectItem value="2/4">2/4 (March)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-white mb-3">Tempo Guide</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Ballad:</span>
                      <span className="text-gray-400">60-80 BPM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Medium:</span>
                      <span className="text-gray-400">80-120 BPM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Upbeat:</span>
                      <span className="text-gray-400">120-140 BPM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Dance:</span>
                      <span className="text-gray-400">120-130 BPM</span>
                    </div>
                  </div>
                </div>

                <Button className="w-full" variant="outline">
                  <Volume2 className="w-4 h-4 mr-2" />
                  Play Metronome
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-dark-card border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-white">Rhythm Patterns</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    { name: "Basic Rock", pattern: "X-x-X-x-" },
                    { name: "Pop Groove", pattern: "X--xX-x-" },
                    { name: "Ballad", pattern: "X---x---" },
                    { name: "Funk", pattern: "X-xX--x-" }
                  ].map((rhythm, index) => (
                    <div key={index} className="bg-gray-800 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white">{rhythm.name}</span>
                        <Button size="sm" variant="ghost">
                          <Play className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="font-mono text-sm text-gray-400">
                        {rhythm.pattern}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-6">
          <Card className="bg-dark-card border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center text-lg font-medium text-white">
                <Lightbulb className="w-5 h-5 mr-2" />
                AI Music Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-800 p-4 rounded-lg">
                  <Target className="w-8 h-8 text-blue-500 mb-3" />
                  <h4 className="font-medium text-white mb-2">Song Structure</h4>
                  <p className="text-sm text-gray-400">
                    Based on your key ({selectedKey}) and genre, try: Verse → Chorus → Verse → Chorus → Bridge → Chorus
                  </p>
                </div>
                
                <div className="bg-gray-800 p-4 rounded-lg">
                  <Music2 className="w-8 h-8 text-green-500 mb-3" />
                  <h4 className="font-medium text-white mb-2">Melody Tips</h4>
                  <p className="text-sm text-gray-400">
                    For {selectedScale} scale: Focus on the {getScaleNotes(selectedKey, selectedScale)[0]} and {getScaleNotes(selectedKey, selectedScale)[4]} notes for strong resolution
                  </p>
                </div>
                
                <div className="bg-gray-800 p-4 rounded-lg">
                  <Settings className="w-8 h-8 text-purple-500 mb-3" />
                  <h4 className="font-medium text-white mb-2">Production</h4>
                  <p className="text-sm text-gray-400">
                    At {bpm} BPM: Add reverb to vocals, use compression for drums, consider adding subtle strings in the chorus
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-spotify-green/20 to-green-600/20 p-6 rounded-lg border border-spotify-green/30">
                <h4 className="font-medium text-white mb-3 flex items-center">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Smart Recommendations
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-spotify-green rounded-full mt-2"></div>
                    <div>
                      <span className="text-white font-medium">Chord Substitution:</span>
                      <span className="text-gray-300 ml-2">Try replacing the F chord with Dm7 for a jazzier sound</span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-spotify-green rounded-full mt-2"></div>
                    <div>
                      <span className="text-white font-medium">Vocal Harmony:</span>
                      <span className="text-gray-300 ml-2">Add a harmony a third above the melody in the chorus</span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-spotify-green rounded-full mt-2"></div>
                    <div>
                      <span className="text-white font-medium">Dynamic Build:</span>
                      <span className="text-gray-300 ml-2">Start with just piano and vocals, add drums at the second verse</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}