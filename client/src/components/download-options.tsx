import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileAudio, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
