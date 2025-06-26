import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileAudio, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import StripeCheckout from "./stripe-checkout";
import type { Song } from "@shared/schema";

interface DownloadOptionsProps {
  song: Song;
}

export default function DownloadOptions({ song }: DownloadOptionsProps) {
  const { toast } = useToast();

  const downloadMutation = useMutation({
    mutationFn: async ({ format }: { format: string }) => {
      const response = await fetch(`/api/download/${song.id}/${format}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Download failed");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${song.title}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Download started",
        description: "Your song download has begun.",
      });
    },
    onError: () => {
      toast({
        title: "Download failed",
        description: "Unable to download the file. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      {/* Burnt Beats Ownership Message */}
      <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-orange-200 mb-2">🎵 Complete Ownership Rights</h3>
            <p className="text-orange-200/80 mb-4">
              When you download your song, you own it 100%. Use it commercially, sell it, remix it - no restrictions whatsoever.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="bg-orange-500/20 rounded-lg p-3">
                <strong className="text-orange-300">Commercial Rights</strong>
                <p className="text-orange-200/70">Sell your music anywhere</p>
              </div>
              <div className="bg-orange-500/20 rounded-lg p-3">
                <strong className="text-orange-300">No Royalties</strong>
                <p className="text-orange-200/70">Keep 100% of profits</p>
              </div>
              <div className="bg-orange-500/20 rounded-lg p-3">
                <strong className="text-orange-300">Forever Yours</strong>
                <p className="text-orange-200/70">No time limits or restrictions</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Size-Based Download Options */}
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <span>Download Your Song</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {/* Bonus Track */}
            <Card className="border-yellow-500/20 bg-yellow-500/5">
              <CardContent className="p-4 text-center">
                <h4 className="font-semibold text-yellow-300 mb-2">🧪 Bonus Track ($0.99)</h4>
                <p className="text-sm text-gray-400 mb-3">Watermarked demo. Test the vibe before buying.</p>
                <Button 
                  onClick={() => downloadMutation.mutate({ format: 'bonus-demo' })}
                  className="w-full bg-yellow-500 hover:bg-yellow-600"
                  disabled={downloadMutation.isPending}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Bonus
                </Button>
              </CardContent>
            </Card>

            {/* Base Song */}
            <Card className="border-green-500/20 bg-green-500/5">
              <CardContent className="p-4 text-center">
                <h4 className="font-semibold text-green-300 mb-2">🔉 Base Song ($1.99)</h4>
                <p className="text-sm text-gray-400 mb-3">Tracks under 9MB. Great for quick loops or intros.</p>
                <Button 
                  onClick={() => downloadMutation.mutate({ format: 'base-song' })}
                  className="w-full bg-green-500 hover:bg-green-600"
                  disabled={downloadMutation.isPending}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Base
                </Button>
              </CardContent>
            </Card>

            {/* Premium Song */}
            <Card className="border-blue-500/20 bg-blue-500/5">
              <CardContent className="p-4 text-center">
                <h4 className="font-semibold text-blue-300 mb-2">🎧 Premium Song ($4.99)</h4>
                <p className="text-sm text-gray-400 mb-3">Tracks 9MB-20MB. Crisp quality with depth.</p>
                <Button 
                  onClick={() => downloadMutation.mutate({ format: 'premium-song' })}
                  className="w-full bg-blue-500 hover:bg-blue-600"
                  disabled={downloadMutation.isPending}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Premium
                </Button>
              </CardContent>
            </Card>

            {/* Ultra Super Great Amazing Song */}
            <Card className="border-indigo-500/20 bg-indigo-500/5">
              <CardContent className="p-4 text-center">
                <h4 className="font-semibold text-indigo-300 mb-2">💽 Ultra Song ($8.99)</h4>
                <p className="text-sm text-gray-400 mb-3">Tracks over 20MB. Complex, layered creations.</p>
                <Button 
                  onClick={() => downloadMutation.mutate({ format: 'ultra-song' })}
                  className="w-full bg-indigo-500 hover:bg-indigo-600"
                  disabled={downloadMutation.isPending}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Ultra
                </Button>
              </CardContent>
            </Card>

            {/* Full License */}
            <Card className="border-purple-500/20 bg-purple-500/5">
              <CardContent className="p-4 text-center">
                <h4 className="font-semibold text-purple-300 mb-2">🪪 Full License ($10.00)</h4>
                <p className="text-sm text-gray-400 mb-3">Full ownership. Use, distribute, monetize—forever.</p>
                <Button 
                  onClick={() => downloadMutation.mutate({ format: 'full-license' })}
                  className="w-full bg-purple-500 hover:bg-purple-600"
                  disabled={downloadMutation.isPending}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download License
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const downloadFormats = [
    {
      format: "mp3",
      name: "MP3 Format",
      description: "320 kbps, 15.2 MB",
      icon: FileAudio,
      color: "bg-spotify-green hover:bg-green-600",
    },
    {
      format: "wav",
      name: "WAV Format", 
      description: "44.1 kHz, 42.8 MB",
      icon: FileAudio,
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      format: "flac",
      name: "FLAC Format",
      description: "Lossless, 28.1 MB", 
      icon: FileAudio,
      color: "bg-vibrant-orange hover:bg-orange-600",
    },
  ];

  return (
    <Card className="bg-dark-card border-gray-800 mt-8">
      <CardHeader>
        <CardTitle className="text-lg font-poppins font-semibold text-white">
          Download & Export
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {downloadFormats.map((format) => (
            <div key={format.format} className="bg-gray-800 rounded-lg p-4 text-center">
              <format.icon className="text-2xl mb-2 mx-auto w-8 h-8" />
              <h4 className="font-medium mb-1 text-white">{format.name}</h4>
              <p className="text-xs text-gray-400 mb-3">{format.description}</p>
              <Button
                onClick={() => downloadMutation.mutate({ format: format.format })}
                disabled={downloadMutation.isPending}
                className={`w-full text-white text-sm transition-colors ${format.color}`}
              >
                <Download className="w-4 h-4 mr-1" />
                Download {format.format.toUpperCase()}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium mb-1 text-white">Export Project</h4>
              <p className="text-sm text-gray-400">Save project file for future editing</p>
            </div>
            <Button variant="outline" className="bg-gray-700 hover:bg-gray-600 border-gray-600">
              <Save className="w-4 h-4 mr-1" />
              Export Project
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
