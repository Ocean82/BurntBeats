import { useState, useRef, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/hooks/use-error-handler';

interface VoiceSample {
  id: string;
  userId: string;
  name: string;
  audioUrl: string;
  anthemUrl?: string;
  sampleUrl?: string;
  isPublic: boolean;
  characteristics?: any;
  createdAt: Date;
}

interface UseVoiceCloningProps {
  userId: number;
  onVoiceCloned?: (voiceData: VoiceSample) => void;
}

interface VoiceCloningOptions {
  audio: Blob | string;
  name: string;
  makePublic: boolean;
  sampleText?: string;
}

export const useVoiceCloning = ({ userId, onVoiceCloned }: UseVoiceCloningProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [processingStage, setProcessingStage] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { toast } = useToast();
  const { handleError, handleAsync } = useErrorHandler();
  const queryClient = useQueryClient();

  // Fetch available voices
  const { data: voices = [], isLoading: isLoadingVoices, refetch: refetchVoices } = useQuery<VoiceSample[]>({
    queryKey: ['voices', userId],
    queryFn: async () => {
      const response = await fetch('/api/voice-cloning/voices', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch voices');
      const data = await response.json();
      return data.voices || [];
    }
  });

  // Start audio recording
  const startRecording = useCallback(async () => {
    const success = await handleAsync(async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm;codecs=opus' });
        setRecordedBlob(blob);
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
    }, {
      errorTitle: "Recording Failed",
      successMessage: "Recording started successfully"
    });

    return success !== null;
  }, [handleAsync]);

  // Stop audio recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  }, [isRecording]);

  // Voice cloning mutation
  const voiceCloningMutation = useMutation({
    mutationFn: async (options: VoiceCloningOptions) => {
      setProcessingStage('Preparing voice data...');

      const formData = new FormData();

      if (options.audio instanceof Blob) {
        formData.append('audio', options.audio, 'voice_sample.webm');
      } else {
        formData.append('audioUrl', options.audio);
      }

      formData.append('name', options.name);
      formData.append('makePublic', options.makePublic.toString());

      if (options.sampleText) {
        formData.append('sampleText', options.sampleText);
      }

      setProcessingStage('Uploading and processing...');

      const response = await fetch('/api/voice-cloning/clone', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Voice cloning failed');
      }

      setProcessingStage('Finalizing...');
      const result = await response.json();
      return result;
    },
    onSuccess: (result) => {
      setProcessingStage('');

      toast({
        title: "Voice Cloned Successfully",
        description: "Your custom voice is ready for song generation!",
      });

      onVoiceCloned?.(result);

      // Invalidate and refetch voices
      queryClient.invalidateQueries({ queryKey: ['voices'] });
      refetchVoices();
    },
    onError: (error) => {
      setProcessingStage('');
      handleError(error as Error, "Voice Cloning Failed");
    },
  });

  // Delete voice mutation
  const deleteVoiceMutation = useMutation({
    mutationFn: async (voiceId: string) => {
      const response = await fetch(`/api/voice-cloning/voices/${voiceId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete voice');
      }
    },
    onSuccess: () => {
      toast({
        title: "Voice Deleted",
        description: "Voice has been removed successfully",
      });

      queryClient.invalidateQueries({ queryKey: ['voices'] });
      refetchVoices();
    },
    onError: (error) => {
      handleError(error as Error, "Failed to delete voice");
    }
  });

  // Clone voice with given options
  const cloneVoice = useCallback((options: VoiceCloningOptions) => {
    voiceCloningMutation.mutate(options);
  }, [voiceCloningMutation]);

  // Clear recorded audio
  const clearRecording = useCallback(() => {
    setRecordedBlob(null);
    if (recordedBlob) {
      URL.revokeObjectURL(URL.createObjectURL(recordedBlob));
    }
  }, [recordedBlob]);

  return {
    // State
    isRecording,
    recordedBlob,
    processingStage,
    isCloning: voiceCloningMutation.isPending,
    isLoadingVoices,
    voices,

    // Actions
    startRecording,
    stopRecording,
    cloneVoice,
    clearRecording,
    deleteVoice: deleteVoiceMutation.mutate,
    refetchVoices,

    // Status
    cloningError: voiceCloningMutation.error,
    isDeleting: deleteVoiceMutation.isPending
  };
};