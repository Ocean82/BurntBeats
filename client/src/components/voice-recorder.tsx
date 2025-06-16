import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Play, Pause, Trash2, Upload } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { VoiceSample } from "@shared/schema";

interface VoiceRecorderProps {
  userId: number;
}

export default function VoiceRecorder({ userId }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: voiceSamples = [] } = useQuery<VoiceSample[]>({
    queryKey: [`/api/voice-samples/${userId}`],
  });

  const uploadVoiceSampleMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/voice-samples", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) throw new Error("Upload failed");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/voice-samples/${userId}`] });
      setRecordedBlob(null);
      setRecordingDuration(0);
      toast({
        title: "Voice sample uploaded",
        description: "Your voice sample has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "Failed to upload voice sample. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteVoiceSampleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/voice-samples/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/voice-samples/${userId}`] });
      toast({
        title: "Voice sample deleted",
        description: "Voice sample has been removed.",
      });
    },
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" });
        setRecordedBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      toast({
        title: "Recording failed",
        description: "Unable to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const saveRecording = () => {
    if (!recordedBlob) return;

    const formData = new FormData();
    formData.append("audio", recordedBlob, "recording.wav");
    formData.append("name", `Voice Sample ${new Date().toLocaleString()}`);
    formData.append("userId", userId.toString());
    formData.append("duration", recordingDuration.toString());

    uploadVoiceSampleMutation.mutate(formData);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="bg-dark-card border-gray-800 mt-6">
      <CardHeader>
        <CardTitle className="text-lg font-poppins font-semibold text-white">
          Voice Recording & Cloning
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recording Interface */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Record Voice Sample
            </label>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-center mb-4">
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-16 h-16 rounded-full ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600' 
                      : 'bg-vibrant-orange hover:bg-orange-600'
                  }`}
                >
                  {isRecording ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Mic className="w-6 h-6" />
                  )}
                </Button>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-2">
                  {isRecording 
                    ? `Recording... ${formatDuration(recordingDuration)}`
                    : recordedBlob 
                      ? `Recorded: ${formatDuration(recordingDuration)}`
                      : "Click to start recording"
                  }
                </p>
                
                {/* Waveform visualization */}
                <div className="flex items-center justify-center space-x-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`w-1 bg-gray-600 rounded-full transition-all duration-150 ${
                        isRecording ? 'waveform-bar' : ''
                      }`}
                      style={{ height: isRecording ? '24px' : '12px' }}
                    />
                  ))}
                </div>
              </div>

              {recordedBlob && (
                <div className="mt-4 space-y-2">
                  <Button
                    onClick={saveRecording}
                    disabled={uploadVoiceSampleMutation.isPending}
                    className="w-full bg-spotify-green hover:bg-green-600"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadVoiceSampleMutation.isPending ? "Saving..." : "Save Recording"}
                  </Button>
                  <Button
                    onClick={() => {
                      setRecordedBlob(null);
                      setRecordingDuration(0);
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Discard
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Saved Voice Samples */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Saved Voice Samples
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {voiceSamples.length === 0 ? (
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                  <p className="text-sm text-gray-400">No voice samples yet</p>
                </div>
              ) : (
                voiceSamples.map((sample) => (
                  <div
                    key={sample.id}
                    className="bg-gray-800 rounded-lg p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center flex-1">
                      <div className="w-6 h-4 bg-spotify-green rounded-sm mr-2 flex items-center justify-center">
                        <div className="w-3 h-2 bg-white rounded-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-white truncate block">
                          {sample.name}
                        </span>
                        {sample.duration && (
                          <span className="text-xs text-gray-400">
                            {formatDuration(sample.duration)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="ghost" className="p-1">
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="p-1 text-red-400 hover:text-red-300"
                        onClick={() => deleteVoiceSampleMutation.mutate(sample.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
