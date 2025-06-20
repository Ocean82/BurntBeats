import { useState, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { apiRequest } from '@/lib/queryClient';

interface UseVoiceCloningProps {
  userId: number;
  onVoiceCloned?: (voiceData: any) => void;
}

interface VoiceCloningOptions {
  genre: string;
  style: string;
  voiceSampleId?: number;
  audioBlob?: Blob;
}

export const useVoiceCloning = ({ userId, onVoiceCloned }: UseVoiceCloningProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [clonedVoice, setClonedVoice] = useState<string | null>(null);
  const [processingStage, setProcessingStage] = useState<string>('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { toast } = useToast();
  const { handleError, handleAsync } = useErrorHandler();
  const queryClient = useQueryClient();

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

      mediaRecorder.start(1000); // Collect data every second
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

  // Voice embedding extraction using advanced audio processing
  const extractVoiceEmbedding = useCallback(async (audioData: Blob | File): Promise<any> => {
    setProcessingStage('Extracting voice characteristics...');
    
    const formData = new FormData();
    formData.append('audio', audioData);
    formData.append('userId', userId.toString());

    const response = await apiRequest('POST', '/api/voice-analysis/embedding', formData);
    return await response.json();
  }, [userId]);

  // Voice similarity analysis for quality assessment
  const analyzeSimilarity = useCallback(async (embedding: any, targetGenre: string): Promise<number> => {
    setProcessingStage('Analyzing voice similarity...');
    
    const response = await apiRequest('POST', '/api/voice-analysis/similarity', {
      embedding,
      targetGenre,
      userId
    });
    
    const result = await response.json();
    return result.similarity;
  }, [userId]);

  // Spectral transfer for voice style adaptation
  const applySpectralTransfer = useCallback(async (embedding: any, targetStyle: string): Promise<any> => {
    setProcessingStage('Applying spectral transfer...');
    
    const response = await apiRequest('POST', '/api/voice-processing/spectral-transfer', {
      embedding,
      targetStyle,
      userId
    });
    
    return await response.json();
  }, [userId]);

  // Timbre preservation during voice transformation
  const preserveTimbre = useCallback(async (spectralData: any): Promise<any> => {
    setProcessingStage('Preserving voice timbre...');
    
    const response = await apiRequest('POST', '/api/voice-processing/timbre-preservation', {
      spectralData,
      userId
    });
    
    return await response.json();
  }, [userId]);

  // Pitch and formant manipulation for genre adaptation
  const manipulatePitchAndFormant = useCallback(async (
    voiceData: any, 
    genre: string, 
    style: string
  ): Promise<any> => {
    setProcessingStage('Adapting voice for genre and style...');
    
    const response = await apiRequest('POST', '/api/voice-processing/pitch-formant', {
      voiceData,
      genre,
      style,
      userId
    });
    
    return await response.json();
  }, [userId]);

  // Main voice cloning mutation
  const voiceCloningMutation = useMutation({
    mutationFn: async (options: VoiceCloningOptions) => {
      const { genre, style, voiceSampleId, audioBlob } = options;

      if (!voiceSampleId && !audioBlob) {
        throw new Error("Please select a voice sample or record a new one");
      }

      let audioData: Blob | File;
      
      if (audioBlob) {
        audioData = audioBlob;
      } else {
        // Fetch existing voice sample
        const response = await apiRequest('GET', `/api/voice-samples/${voiceSampleId}`);
        const blob = await response.blob();
        audioData = new File([blob], 'voice-sample.webm', { type: 'audio/webm' });
      }

      // Step 1: Extract voice embedding
      const embedding = await extractVoiceEmbedding(audioData);
      
      // Step 2: Analyze similarity for quality assessment
      const similarity = await analyzeSimilarity(embedding, genre);
      
      if (similarity < 0.7) {
        throw new Error("Voice quality insufficient for cloning. Please provide a clearer recording.");
      }
      
      // Step 3: Apply spectral transfer
      const spectralTransfer = await applySpectralTransfer(embedding, style);
      
      // Step 4: Preserve timbre characteristics
      const timbrePreserved = await preserveTimbre(spectralTransfer);
      
      // Step 5: Manipulate pitch and formant for genre adaptation
      const finalVoice = await manipulatePitchAndFormant(timbrePreserved, genre, style);
      
      // Step 6: Generate final cloned voice
      setProcessingStage('Generating final cloned voice...');
      const response = await apiRequest('POST', '/api/voice-clone/generate', {
        voiceData: finalVoice,
        genre,
        style,
        userId
      });
      
      return await response.json();
    },
    onSuccess: (result) => {
      setClonedVoice(result.audioUrl);
      setProcessingStage('');
      
      toast({
        title: "Voice Cloned Successfully",
        description: "Your custom voice is ready for song generation!",
      });
      
      onVoiceCloned?.(result);
      
      // Invalidate voice samples cache
      queryClient.invalidateQueries({ queryKey: ['/api/voice-samples', userId] });
    },
    onError: (error) => {
      setProcessingStage('');
      handleError(error as Error, "Voice Cloning Failed");
    },
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

  // Clear cloned voice
  const clearClonedVoice = useCallback(() => {
    setClonedVoice(null);
  }, []);

  return {
    // State
    isRecording,
    recordedBlob,
    clonedVoice,
    processingStage,
    isCloning: voiceCloningMutation.isPending,
    
    // Actions
    startRecording,
    stopRecording,
    cloneVoice,
    clearRecording,
    clearClonedVoice,
    
    // Status
    cloningError: voiceCloningMutation.error,
  };
};