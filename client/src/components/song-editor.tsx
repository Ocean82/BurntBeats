import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import UpgradeModal from "./upgrade-modal";
import { 
  Edit3, 
  Save, 
  Undo, 
  RotateCcw, 
  Play, 
  Music, 
  Volume2,
  Clock,
  Type,
  Crown
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Song } from "@shared/schema";

interface SongEditorProps {
  song: Song;
  userPlan: string;
  onSongUpdated: (song: Song) => void;
  onUpgrade: () => void;
}

interface SongSection {
  id: number;
  type: string;
  startTime: number;
  endTime: number;
  lyrics: string;
}

export default function SongEditor({ song, userPlan, onSongUpdated, onUpgrade }: SongEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSong, setEditedSong] = useState(song);
  const [sections, setSections] = useState<SongSection[]>(
    song.sections as SongSection[] || [
      { id: 1, type: "Verse 1", startTime: 0, endTime: 30, lyrics: song.lyrics.split('\n')[0] || "" },
      { id: 2, type: "Chorus", startTime: 30, endTime: 60, lyrics: song.lyrics.split('\n')[1] || "" },
    ]
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateSongMutation = useMutation({
    mutationFn: async (updates: Partial<Song>) => {
      const response = await apiRequest("PATCH", `/api/songs/${song.id}`, updates);
      return await response.json();
    },
    onSuccess: (updatedSong: Song) => {
      queryClient.invalidateQueries({ queryKey: [`/api/songs/single/${song.id}`] });
      onSongUpdated(updatedSong);
      setIsEditing(false);
      toast({
        title: "Song updated",
        description: "Your changes have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    },
  });

  const regenerateSectionMutation = useMutation({
    mutationFn: async (sectionId: number) => {
      // Mock regeneration - in real app would call AI service
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Section regenerated",
        description: "The section has been updated with a new variation.",
      });
    },
  });

  const sectionTypes = [
    "Verse 1", "Verse 2", "Verse 3",
    "Chorus", "Pre-Chorus", "Post-Chorus",
    "Bridge", "Outro", "Intro", "Instrumental"
  ];

  const handleSaveChanges = () => {
    const combinedLyrics = sections.map(section => section.lyrics).join('\n\n');
    updateSongMutation.mutate({
      ...editedSong,
      lyrics: combinedLyrics,
      sections: sections,
    });
  };

  const handleSectionChange = (sectionId: number, field: keyof SongSection, value: any) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId ? { ...section, [field]: value } : section
    ));
  };

  const addSection = () => {
    const newId = Math.max(...sections.map(s => s.id)) + 1;
    const lastSection = sections[sections.length - 1];
    setSections(prev => [...prev, {
      id: newId,
      type: "Verse",
      startTime: lastSection?.endTime || 0,
      endTime: (lastSection?.endTime || 0) + 30,
      lyrics: ""
    }]);
  };

  const removeSection = (sectionId: number) => {
    setSections(prev => prev.filter(section => section.id !== sectionId));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (userPlan === "free") {
    return (
      <Card className="bg-dark-card border-gray-800 mt-8">
        <CardHeader>
          <CardTitle className="text-lg font-poppins font-semibold text-white">
            Song Editing (Basic Feature)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Edit3 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">Advanced Editing Tools</h3>
            <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
              Edit lyrics, modify song sections, regenerate parts, and fine-tune your songs with advanced editing tools. Get 4 full-length songs per month with Basic plan.
            </p>
            <UpgradeModal currentPlan={userPlan} onUpgrade={onUpgrade}>
              <Button className="bg-gradient-to-r from-vibrant-orange to-orange-600 hover:from-orange-600 hover:to-vibrant-orange text-white">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Basic - $6.99/mo
              </Button>
            </UpgradeModal>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-dark-card border-gray-800 mt-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-poppins font-semibold text-white">
            Song Editor
          </CardTitle>
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditing(false)}
                >
                  <Undo className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button 
                  size="sm"
                  onClick={handleSaveChanges}
                  disabled={updateSongMutation.isPending}
                  className="bg-spotify-green hover:bg-green-600"
                >
                  <Save className="w-4 h-4 mr-1" />
                  {updateSongMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="w-4 h-4 mr-1" />
                Edit Song
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-6">
            {/* Song Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Song Title</label>
                <Input
                  value={editedSong.title}
                  onChange={(e) => setEditedSong(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-gray-800 border-gray-600"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Genre</label>
                <Select 
                  value={editedSong.genre} 
                  onValueChange={(value) => setEditedSong(prev => ({ ...prev, genre: value }))}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["pop", "rock", "jazz", "electronic", "classical", "hip-hop", "country", "r&b"].map((genre) => (
                      <SelectItem key={genre} value={genre}>
                        {genre.charAt(0).toUpperCase() + genre.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator className="bg-gray-700" />

            {/* Song Sections */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Song Sections</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={addSection}
                >
                  Add Section
                </Button>
              </div>

              <div className="space-y-4">
                {sections.map((section, index) => (
                  <div key={section.id} className="bg-gray-800 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                      <Select 
                        value={section.type} 
                        onValueChange={(value) => handleSectionChange(section.id, 'type', value)}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {sectionTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <Input
                          type="number"
                          value={section.startTime}
                          onChange={(e) => handleSectionChange(section.id, 'startTime', parseInt(e.target.value))}
                          className="bg-gray-700 border-gray-600 text-xs"
                          placeholder="Start"
                        />
                        <span className="text-gray-400">-</span>
                        <Input
                          type="number"
                          value={section.endTime}
                          onChange={(e) => handleSectionChange(section.id, 'endTime', parseInt(e.target.value))}
                          className="bg-gray-700 border-gray-600 text-xs"
                          placeholder="End"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => regenerateSectionMutation.mutate(section.id)}
                          disabled={regenerateSectionMutation.isPending}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                        {sections.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSection(section.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    </div>

                    <Textarea
                      value={section.lyrics}
                      onChange={(e) => handleSectionChange(section.id, 'lyrics', e.target.value)}
                      className="w-full bg-gray-700 border-gray-600 text-white resize-none"
                      placeholder={`Enter lyrics for ${section.type}...`}
                      rows={3}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Song Overview */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-medium text-white mb-2">{song.title}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-400">
                <div className="flex items-center">
                  <Music className="w-4 h-4 mr-2" />
                  {song.genre}
                </div>
                <div className="flex items-center">
                  <Volume2 className="w-4 h-4 mr-2" />
                  {song.vocalStyle}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  {song.songLength}
                </div>
                <div className="flex items-center">
                  <Type className="w-4 h-4 mr-2" />
                  {sections.length} sections
                </div>
              </div>
            </div>

            {/* Section Preview */}
            <div className="space-y-3">
              {sections.map((section) => (
                <div key={section.id} className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">{section.type}</span>
                    <span className="text-xs text-gray-400">
                      {formatTime(section.startTime)} - {formatTime(section.endTime)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-2">{section.lyrics}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}