
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { useSongGeneration } from '../../client/src/hooks/use-song-generation';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Mock API request
vi.mock('../../client/src/lib/queryClient', () => ({
  apiRequest: vi.fn()
}));

describe('useSongGeneration Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useSongGeneration(), {
      wrapper: createWrapper()
    });

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.generationProgress).toBe(0);
    expect(result.current.generationStage).toBe('');
    expect(result.current.generatedSong).toBeNull();
  });

  it('should generate song successfully', async () => {
    const mockResponse = {
      json: vi.fn().mockResolvedValue({
        success: true,
        song: {
          id: 1,
          lyrics: 'Test lyrics',
          audioUrl: '/uploads/test-song.mp3'
        }
      })
    };

    vi.mocked(require('../../client/src/lib/queryClient').apiRequest)
      .mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useSongGeneration(), {
      wrapper: createWrapper()
    });

    const songData = {
      lyrics: 'Test lyrics',
      genre: 'pop',
      mood: 'happy',
      tempo: 120
    };

    result.current.generateSong(songData);

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });

    expect(result.current.generatedSong).toMatchObject({
      id: 1,
      lyrics: 'Test lyrics',
      audioUrl: '/uploads/test-song.mp3'
    });
  });

  it('should handle generation errors', async () => {
    const mockError = new Error('Generation failed');
    vi.mocked(require('../../client/src/lib/queryClient').apiRequest)
      .mockRejectedValue(mockError);

    const { result } = renderHook(() => useSongGeneration(), {
      wrapper: createWrapper()
    });

    result.current.generateSong({
      lyrics: 'Test lyrics',
      genre: 'pop',
      mood: 'happy',
      tempo: 120
    });

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
  });

  it('should track generation progress', async () => {
    const { result } = renderHook(() => useSongGeneration(), {
      wrapper: createWrapper()
    });

    // Test progress tracking functionality
    expect(result.current.generationProgress).toBe(0);
    expect(result.current.generationStage).toBe('');
  });
});
