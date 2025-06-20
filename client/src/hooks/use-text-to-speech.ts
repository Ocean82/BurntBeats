import { useState, useMemo, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { apiRequest } from '@/lib/queryClient';

type VoiceType = 'singing' | 'reading';
type PitchType = 'low' | 'normal' | 'high';
type SpeedType = 'slow' | 'normal' | 'fast';
type ToneType = 'warm' | 'neutral' | 'bright';

interface UseTextToSpeechProps {
  userId: number;
  onVoiceGenerated?: (audioUrl: string) => void;
}

interface VoiceGenerationOptions {
  text: string;
  voiceType: VoiceType;
  pitch: PitchType;
  speed: SpeedType;
  tone: ToneType;
  saveAsVoiceSample?: boolean;
  sampleName?: string;
}

const voiceSettings = {
  pitch: [
    { value: "low", label: "Low Pitch" },
    { value: "normal", label: "Normal Pitch" }, 
    { value: "high", label: "High Pitch" }
  ],
  speed: [
    { value: "slow", label: "Slow" },
    { value: "normal", label: "Normal" },
    { value: "fast", label: "Fast" }
  ],
  tone: [
    { value: "warm", label: "Warm" },
    { value: "neutral", label: "Neutral" },
    { value: "bright", label: "Bright" }
  ]
};

const sampleTexts = {
  singing: `Hello, I'm testing my voice for singing. 
La la la, do re mi fa sol la ti do.
This voice will be used to create beautiful songs.
Testing different notes and vocal ranges now.`,
  
  reading: `This is a sample text for natural voice reading.
I can read articles, books, and any written content.
My voice sounds clear and natural for text-to-speech.
Perfect for audiobooks and narration projects.`
};

export const useTextToSpeech = ({ userId, onVoiceGenerated }: UseTextToSpeechProps) => {
  const [text, setText] = useState(sampleTexts.singing);
  const [voiceType, setVoiceType] = useState<VoiceType>("singing");
  const [pitch, setPitch] = useState<PitchType>("normal");
  const [speed, setSpeed] = useState<SpeedType>("normal");
  const [tone, setTone] = useState<ToneType>("warm");
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [processingStage, setProcessingStage] = useState<string>('');

  const { toast } = useToast();
  const { handleError, handleAsync } = useErrorHandler();
  const queryClient = useQueryClient();

  // Input validation
  const isValidText = useMemo(() => {
    const trimmedText = text.trim();
    return trimmedText.length >= 10 && trimmedText.length <= 500;
  }, [text]);

  // Update sample text when voice type changes
  const handleVoiceTypeChange = useCallback((newVoiceType: VoiceType) => {
    setVoiceType(newVoiceType);
    setText(sampleTexts[newVoiceType]);
  }, []);

  // Type-safe setters for voice parameters
  const handlePitchChange = useCallback((value: string) => {
    setPitch(value as PitchType);
  }, []);

  const handleSpeedChange = useCallback((value: string) => {
    setSpeed(value as SpeedType);
  }, []);

  const handleToneChange = useCallback((value: string) => {
    setTone(value as ToneType);
  }, []);

  // Generate voice with advanced processing
  const generateVoiceMutation = useMutation({
    mutationFn: async (options: VoiceGenerationOptions) => {
      const { text, voiceType, pitch, speed, tone } = options;

      if (!isValidText) {
        throw new Error("Text must be between 10 and 500 characters");
      }

      // Step 1: Text preprocessing and analysis
      setProcessingStage('Analyzing text structure...');
      const textAnalysis = await apiRequest('POST', '/api/tts/analyze-text', {
        text,
        voiceType,
        userId
      });
      const analysis = await textAnalysis.json();

      // Step 2: Phoneme extraction and processing
      setProcessingStage('Extracting phonemes...');
      const phonemeResponse = await apiRequest('POST', '/api/tts/phonemes', {
        text,
        analysis,
        userId
      });
      const phonemes = await phonemeResponse.json();

      // Step 3: Voice synthesis with specified parameters
      setProcessingStage('Synthesizing voice...');
      const synthesisResponse = await apiRequest('POST', '/api/tts/synthesize', {
        phonemes,
        voiceType,
        pitch,
        speed,
        tone,
        userId
      });
      const synthesis = await synthesisResponse.json();

      // Step 4: Audio post-processing and enhancement
      setProcessingStage('Enhancing audio quality...');
      const enhancementResponse = await apiRequest('POST', '/api/tts/enhance', {
        rawAudio: synthesis.audioData,
        voiceType,
        tone,
        userId
      });
      const enhanced = await enhancementResponse.json();

      // Step 5: Final audio generation
      setProcessingStage('Generating final audio...');
      const finalResponse = await apiRequest('POST', '/api/tts/generate', {
        enhancedAudio: enhanced.audioData,
        metadata: {
          voiceType,
          pitch,
          speed,
          tone,
          textLength: text.length
        },
        userId
      });

      return await finalResponse.json();
    },
    onSuccess: (result) => {
      setGeneratedAudio(result.audioUrl);
      setProcessingStage('');
      
      toast({
        title: "Voice Generated Successfully",
        description: "Your text has been converted to high-quality speech",
      });

      onVoiceGenerated?.(result.audioUrl);
    },
    onError: (error) => {
      setProcessingStage('');
      handleError(error as Error, "Voice Generation Failed");
    },
  });

  // Save generated voice as voice sample
  const saveVoiceMutation = useMutation({
    mutationFn: async ({ audioUrl, name }: { audioUrl: string; name: string }) => {
      const response = await apiRequest('POST', '/api/voice-samples', {
        name,
        audioUrl,
        voiceType,
        metadata: {
          pitch,
          speed,
          tone,
          originalText: text.substring(0, 100),
          generatedVia: 'text-to-speech'
        },
        userId
      });

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Voice Sample Saved",
        description: "Your generated voice has been saved for future use",
      });

      // Invalidate voice samples cache
      queryClient.invalidateQueries({ queryKey: ['/api/voice-samples', userId] });
    },
    onError: (error) => {
      handleError(error as Error, "Save Failed");
    },
  });

  // Generate voice with current settings
  const generateVoice = useCallback(() => {
    generateVoiceMutation.mutate({
      text,
      voiceType,
      pitch,
      speed,
      tone
    });
  }, [generateVoiceMutation, text, voiceType, pitch, speed, tone]);

  // Save current generated voice as sample
  const saveAsVoiceSample = useCallback((name: string) => {
    if (generatedAudio) {
      saveVoiceMutation.mutate({ audioUrl: generatedAudio, name });
    }
  }, [saveVoiceMutation, generatedAudio]);

  // Clear generated audio
  const clearGeneratedAudio = useCallback(() => {
    setGeneratedAudio(null);
  }, []);

  // Reset to defaults
  const resetSettings = useCallback(() => {
    setVoiceType('singing');
    setPitch('normal');
    setSpeed('normal');
    setTone('warm');
    setText(sampleTexts.singing);
    setGeneratedAudio(null);
  }, []);

  return {
    // State
    text,
    voiceType,
    pitch,
    speed,
    tone,
    generatedAudio,
    processingStage,
    isGenerating: generateVoiceMutation.isPending,
    isSaving: saveVoiceMutation.isPending,
    isValidText,

    // Actions
    setText,
    setVoiceType: handleVoiceTypeChange,
    setPitch: handlePitchChange,
    setSpeed: handleSpeedChange,
    setTone: handleToneChange,
    generateVoice,
    saveAsVoiceSample,
    clearGeneratedAudio,
    resetSettings,

    // Configuration
    voiceSettings,
    sampleTexts,

    // Status
    generationError: generateVoiceMutation.error,
    saveError: saveVoiceMutation.error,
  };
};