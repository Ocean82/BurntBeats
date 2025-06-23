
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { apiRequest } from '@/lib/queryClient';
import type { VoiceSample, InsertVoiceSample } from '@shared/schema';

interface UseVoiceSamplesProps {
  userId: number;
  enabled?: boolean;
}

export const useVoiceSamples = ({ userId, enabled = true }: UseVoiceSamplesProps) => {
  const { toast } = useToast();
  const { handleError } = useErrorHandler();
  const queryClient = useQueryClient();

  // Fetch all voice samples for user
  const {
    data: voiceSamples = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['/api/voice-samples', userId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/voice-samples?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch voice samples');
      return response.json() as Promise<VoiceSample[]>;
    },
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create voice sample mutation
  const createVoiceSampleMutation = useMutation({
    mutationFn: async (voiceSampleData: Omit<InsertVoiceSample, 'userId'>) => {
      const response = await apiRequest('POST', '/api/voice-samples', {
        ...voiceSampleData,
        userId
      });
      if (!response.ok) throw new Error('Failed to create voice sample');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Voice sample created",
        description: "Your voice sample has been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/voice-samples', userId] });
    },
    onError: (error) => {
      handleError(error as Error, 'Creation failed');
    },
  });

  // Upload voice sample mutation
  const uploadVoiceSampleMutation = useMutation({
    mutationFn: async ({ file, name, metadata }: { 
      file: File; 
      name: string; 
      metadata?: Record<string, any> 
    }) => {
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('name', name);
      formData.append('userId', userId.toString());
      if (metadata) {
        formData.append('metadata', JSON.stringify(metadata));
      }

      const response = await apiRequest('POST', '/api/voice-samples/upload', formData);
      if (!response.ok) throw new Error('Failed to upload voice sample');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Voice sample uploaded",
        description: "Your voice sample has been uploaded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/voice-samples', userId] });
    },
    onError: (error) => {
      handleError(error as Error, 'Upload failed');
    },
  });

  // Delete voice sample mutation
  const deleteVoiceSampleMutation = useMutation({
    mutationFn: async (voiceSampleId: number) => {
      const response = await apiRequest('DELETE', `/api/voice-samples/${voiceSampleId}`);
      if (!response.ok) throw new Error('Failed to delete voice sample');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Voice sample deleted",
        description: "The voice sample has been removed",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/voice-samples', userId] });
    },
    onError: (error) => {
      handleError(error as Error, 'Delete failed');
    },
  });

  // Update voice sample mutation
  const updateVoiceSampleMutation = useMutation({
    mutationFn: async ({ voiceSampleId, updates }: { 
      voiceSampleId: number; 
      updates: Partial<VoiceSample> 
    }) => {
      const response = await apiRequest('PUT', `/api/voice-samples/${voiceSampleId}`, updates);
      if (!response.ok) throw new Error('Failed to update voice sample');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Voice sample updated",
        description: "Your changes have been saved",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/voice-samples', userId] });
    },
    onError: (error) => {
      handleError(error as Error, 'Update failed');
    },
  });

  // Get voice sample by ID
  const getVoiceSample = async (voiceSampleId: number): Promise<VoiceSample | null> => {
    try {
      const response = await apiRequest('GET', `/api/voice-samples/${voiceSampleId}`);
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      handleError(error as Error, 'Failed to fetch voice sample');
      return null;
    }
  };

  // Get voice samples by type
  const getVoiceSamplesByType = (type: string) => {
    return voiceSamples.filter(sample => 
      sample.metadata && 
      typeof sample.metadata === 'object' && 
      'voiceType' in sample.metadata && 
      sample.metadata.voiceType === type
    );
  };

  // Get recent voice samples
  const getRecentVoiceSamples = (limit = 5) => {
    return voiceSamples
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  };

  return {
    // Data
    voiceSamples,
    isLoading,
    error,
    
    // Actions
    createVoiceSample: createVoiceSampleMutation.mutate,
    uploadVoiceSample: uploadVoiceSampleMutation.mutate,
    deleteVoiceSample: deleteVoiceSampleMutation.mutate,
    updateVoiceSample: updateVoiceSampleMutation.mutate,
    getVoiceSample,
    refetch,
    
    // Derived data
    getVoiceSamplesByType,
    getRecentVoiceSamples,
    
    // Status
    isCreating: createVoiceSampleMutation.isPending,
    isUploading: uploadVoiceSampleMutation.isPending,
    isDeleting: deleteVoiceSampleMutation.isPending,
    isUpdating: updateVoiceSampleMutation.isPending,
  };
};
