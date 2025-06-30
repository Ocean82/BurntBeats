import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from './use-toast';

interface VoicePipelineConfig {
  backendUrl: string;
  model: 'rvc' | 'bark';
  quality: 'high' | 'medium' | 'low';
}

interface VoiceRegistration {
  voice_id: string;
  embedding_path: string;
  file_size: number;
  status: string;
}

interface VoiceSynthesis {
  audio_url: string;
  text: string;
  voice_id?: string;
  model: string;
  status: string;
}

export function useVoicePipeline(config: VoicePipelineConfig) {
  const { toast } = useToast();
  const [processingStage, setProcessingStage] = useState<string>('');
  const [processingProgress, setProcessingProgress] = useState<number>(0);

  // Voice registration mutation (upload voice sample)
  const registerVoice = useMutation({
    mutationFn: async (audioFile: File): Promise<VoiceRegistration> => {
      setProcessingStage('Uploading voice sample...');
      setProcessingProgress(25);

      const formData = new FormData();
      formData.append('file', audioFile);

      const response = await fetch(`${config.backendUrl}/register-voice`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Voice registration failed: ${response.statusText}`);
      }

      setProcessingStage('Creating voice embedding...');
      setProcessingProgress(75);

      const result = await response.json();
      
      setProcessingStage('Voice registered successfully!');
      setProcessingProgress(100);

      return result;
    },
    onSuccess: (data) => {
      toast({
        title: "Voice Registered",
        description: `Voice sample uploaded successfully. ID: ${data.voice_id.substring(0, 8)}...`,
      });
    },
    onError: (error) => {
      toast({
        title: "Voice Registration Failed", 
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  });

  // Voice synthesis mutation (generate speech)
  const synthesizeVoice = useMutation({
    mutationFn: async ({ 
      text, 
      voiceId, 
      style = 'natural', 
      emotion = 'neutral' 
    }: {
      text: string;
      voiceId?: string;
      style?: string;
      emotion?: string;
    }): Promise<VoiceSynthesis> => {
      setProcessingStage('Preparing synthesis...');
      setProcessingProgress(20);

      const endpoint = config.model === 'rvc' && voiceId 
        ? '/synthesize-rvc' 
        : '/synthesize-bark';

      const requestBody = config.model === 'rvc' && voiceId ? {
        text,
        voice_id: voiceId,
        style,
        emotion
      } : {
        text,
        voice_id: voiceId,
        speed: 1.0,
        pitch: 1.0,
        quality: config.quality
      };

      setProcessingStage(`Generating with ${config.model.toUpperCase()}...`);
      setProcessingProgress(60);

      const response = await fetch(`${config.backendUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Voice synthesis failed: ${response.statusText}`);
      }

      setProcessingStage('Processing audio...');
      setProcessingProgress(90);

      const result = await response.json();
      
      setProcessingStage('Voice synthesis complete!');
      setProcessingProgress(100);

      // Convert relative URL to absolute URL
      result.audio_url = `${config.backendUrl}${result.audio_url}`;

      return result;
    },
    onSuccess: (data) => {
      toast({
        title: "Voice Generated",
        description: `Speech synthesis completed using ${data.model.toUpperCase()}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Voice Synthesis Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred", 
        variant: "destructive"
      });
    }
  });

  // Get available voices
  const { data: voices, refetch: refreshVoices } = useQuery({
    queryKey: ['/voices', config.backendUrl],
    queryFn: async () => {
      const response = await fetch(`${config.backendUrl}/voices`);
      if (!response.ok) {
        throw new Error('Failed to fetch voices');
      }
      return response.json();
    }
  });

  // Check backend health
  const { data: backendHealth } = useQuery({
    queryKey: ['/health', config.backendUrl],
    queryFn: async () => {
      const response = await fetch(`${config.backendUrl}/health`);
      if (!response.ok) {
        throw new Error('Backend health check failed');
      }
      return response.json();
    },
    refetchInterval: 30000, // Check every 30 seconds
    retry: 3
  });

  const isBackendHealthy = backendHealth?.status === 'healthy';
  const isProcessing = registerVoice.isPending || synthesizeVoice.isPending;

  return {
    // Voice registration
    registerVoice: registerVoice.mutate,
    isRegisteringVoice: registerVoice.isPending,
    registrationError: registerVoice.error,

    // Voice synthesis  
    synthesizeVoice: synthesizeVoice.mutate,
    isSynthesizing: synthesizeVoice.isPending,
    synthesisError: synthesizeVoice.error,
    lastSynthesisResult: synthesizeVoice.data,

    // Available voices
    voices: voices?.voices || [],
    voiceCount: voices?.count || 0,
    refreshVoices,

    // Backend status
    isBackendHealthy,
    backendHealth,

    // Processing state
    isProcessing,
    processingStage,
    processingProgress,

    // Reset processing state
    resetProcessing: useCallback(() => {
      setProcessingStage('');
      setProcessingProgress(0);
    }, [])
  };
}