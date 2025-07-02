import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Upload, Music, Play, Pause, Download, X, FileAudio } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedSongFormProps {
  onSubmit?: (data: any) => void;
  isGenerating?: boolean;
}

export default function EnhancedSongFormWithDragDrop({ onSubmit, isGenerating = false }: EnhancedSongFormProps) {
  // Form states
  const [lyrics, setLyrics] = useState('');
  const [genre, setGenre] = useState('');
  const [voiceType, setVoiceType] = useState('');
  const [mood, setMood] = useState('');
  const [tempo, setTempo] = useState([120]);
  const [duration, setDuration] = useState([180]);
  const [isSimpleMode, setIsSimpleMode] = useState(true);
  
  // Advanced features
  const [draggedFiles, setDraggedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [totalFileSize, setTotalFileSize] = useState(0);
  const [exportFormat, setExportFormat] = useState('mp3');
  const [showMixer, setShowMixer] = useState(false);
  
  // Mixer controls
  const [stems, setStems] = useState({
    vocals: { volume: 75, muted: false },
    drums: { volume: 80, muted: false },
    bass: { volume: 70, muted: false },
    melody: { volume: 85, muted: false },
  });

  type StemKey = keyof typeof stems;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const genres = [
    "Pop", "Rock", "Hip Hop", "Electronic", "Jazz", "Classical",
    "Country", "R&B", "Reggae", "Blues", "Folk", "Punk",
    "Metal", "Indie", "Alternative", "Ambient"
  ];

  const voiceTypes = [
    "Male Vocalist", "Female Vocalist", "Child Voice", "Elderly Voice",
    "Robotic", "Whisper", "Powerful", "Soft", "Raspy", "Smooth"
  ];

  const moods = [
    "Happy", "Sad", "Energetic", "Calm", "Romantic", "Aggressive",
    "Mysterious", "Uplifting", "Melancholic", "Dreamy"
  ];

  const exportFormats = [
    { value: 'mp3', label: 'MP3 (320kbps)', size: 'Small' },
    { value: 'wav', label: 'WAV (Lossless)', size: 'Large' },
    { value: 'flac', label: 'FLAC (Compressed)', size: 'Medium' }
  ];

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('audio/') || 
      file.name.match(/\.(mp3|wav|flac|m4a|aac)$/i)
    );
    
    handleFileUpload(files);
  };

  const handleFileUpload = (files: File[]) => {
    const newFiles = [...draggedFiles, ...files];
    setDraggedFiles(newFiles);
    
    // Calculate total file size
    const newTotalSize = newFiles.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024);
    setTotalFileSize(newTotalSize);
  };

  const removeFile = (index: number) => {
    const newFiles = draggedFiles.filter((_, i) => i !== index);
    setDraggedFiles(newFiles);
    
    const newTotalSize = newFiles.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024);
    setTotalFileSize(newTotalSize);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = {
      lyrics,
      genre,
      voiceType,
      mood,
      tempo: tempo[0],
      duration: duration[0],
      exportFormat,
      uploadedFiles: draggedFiles,
      stemSettings: stems,
      isSimpleMode
    };
    
    onSubmit?.(formData);
  };

  // Get pricing tier based on file size
  const getPricingTier = () => {
    if (totalFileSize < 9) return { name: 'Base Song', price: '$1.99', color: 'bg-blue-500' };
    if (totalFileSize <= 20) return { name: 'Premium Song', price: '$4.99', color: 'bg-purple-500' };
    return { name: 'Ultra Song', price: '$8.99', color: 'bg-orange-500' };
  };

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Creation Mode</CardTitle>
            <div className="flex items-center space-x-2">
              <span className={cn("text-sm", isSimpleMode ? "text-white" : "text-gray-400")}>
                Simple
              </span>
              <Switch
                checked={!isSimpleMode}
                onCheckedChange={(checked) => setIsSimpleMode(!checked)}
              />
              <span className={cn("text-sm", !isSimpleMode ? "text-white" : "text-gray-400")}>
                Advanced
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Drag & Drop Area */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Audio File Upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              isDragOver 
                ? "border-purple-400 bg-purple-500/10" 
                : "border-gray-600 hover:border-gray-500"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="audio/*"
              className="hidden"
              onChange={(e) => handleFileUpload(Array.from(e.target.files || []))}
            />
            
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-gray-700 flex items-center justify-center">
                <Music className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <p className="text-lg text-white">Drop your tracks here to edit</p>
                <p className="text-sm text-gray-400">Supports MP3, WAV, FLAC, and more</p>
              </div>
            </div>
          </div>

          {/* Uploaded Files Display */}
          {draggedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-white font-semibold">Uploaded Files:</p>
              {draggedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-700/50 rounded p-3"
                >
                  <div className="flex items-center gap-3">
                    <FileAudio className="w-4 h-4 text-purple-400" />
                    <span className="text-white text-sm">{file.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {(file.size / (1024 * 1024)).toFixed(1)} MB
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              
              {/* File Size Summary */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-600">
                <span className="text-gray-400">Total Size:</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{totalFileSize.toFixed(1)} MB</span>
                  <Badge className={getPricingTier().color}>
                    {getPricingTier().name} - {getPricingTier().price}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Lyrics Input */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Lyrics</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder="Enter your lyrics here... Let the creativity flow!"
              className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 min-h-[120px]"
              required
            />
          </CardContent>
        </Card>

        {/* Basic Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm">Genre</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={genre} onValueChange={setGenre} required>
                <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                  <SelectValue placeholder="Choose genre" />
                </SelectTrigger>
                <SelectContent>
                  {genres.map((g) => (
                    <SelectItem key={g} value={g.toLowerCase()}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm">Voice Type</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={voiceType} onValueChange={setVoiceType}>
                <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                  <SelectValue placeholder="Select voice" />
                </SelectTrigger>
                <SelectContent>
                  {voiceTypes.map((v) => (
                    <SelectItem key={v} value={v.toLowerCase()}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm">Mood</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={mood} onValueChange={setMood}>
                <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                  <SelectValue placeholder="Set mood" />
                </SelectTrigger>
                <SelectContent>
                  {moods.map((m) => (
                    <SelectItem key={m} value={m.toLowerCase()}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Settings */}
        {!isSimpleMode && (
          <div className="space-y-4">
            {/* Tempo and Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-sm">Tempo: {tempo[0]} BPM</CardTitle>
                </CardHeader>
                <CardContent>
                  <Slider
                    value={tempo}
                    onValueChange={setTempo}
                    min={60}
                    max={180}
                    step={1}
                    className="w-full"
                  />
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-sm">Duration: {Math.floor(duration[0] / 60)}:{(duration[0] % 60).toString().padStart(2, '0')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Slider
                    value={duration}
                    onValueChange={setDuration}
                    min={30}
                    max={360}
                    step={15}
                    className="w-full"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Export Format */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Export Format</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {exportFormats.map((format) => (
                    <div
                      key={format.value}
                      className={cn(
                        "border rounded-lg p-3 cursor-pointer transition-colors",
                        exportFormat === format.value
                          ? "border-purple-500 bg-purple-500/20"
                          : "border-gray-600 hover:border-gray-500"
                      )}
                      onClick={() => setExportFormat(format.value)}
                    >
                      <div className="text-white font-medium">{format.label}</div>
                      <div className="text-gray-400 text-sm">{format.size} file size</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Mixer Toggle */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Advanced Mixer</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMixer(!showMixer)}
                    className="border-gray-600 text-white hover:bg-gray-700"
                  >
                    {showMixer ? 'Hide' : 'Show'} Mixer
                  </Button>
                </div>
              </CardHeader>
              
              {showMixer && (
                <CardContent className="space-y-4">
                  {Object.entries(stems).map(([stem, settings]) => {
                    const stemKey = stem as StemKey;
                    return (
                      <div key={stem} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-white capitalize font-medium">{stem}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setStems(prev => ({
                                ...prev,
                                [stemKey]: { ...prev[stemKey], muted: !prev[stemKey].muted }
                              }))
                            }
                            className={cn(
                              "text-xs",
                              settings.muted ? "text-red-400" : "text-green-400"
                            )}
                          >
                            {settings.muted ? 'Muted' : 'Active'}
                          </Button>
                        </div>
                        <Slider
                          value={[settings.volume]}
                          onValueChange={([value]) =>
                            setStems(prev => ({
                              ...prev,
                              [stemKey]: { ...prev[stemKey], volume: value }
                            }))
                          }
                          min={0}
                          max={100}
                          step={1}
                          className="w-full"
                          disabled={settings.muted}
                        />
                        <div className="text-right text-xs text-gray-400">
                          {settings.volume}%
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              )}
            </Card>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3"
          disabled={isGenerating || !lyrics.trim() || !genre}
        >
          {isGenerating ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating Your Track...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Generate Song
            </div>
          )}
        </Button>
      </form>
    </div>
  );
}