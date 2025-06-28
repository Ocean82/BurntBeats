
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { useSongGeneration } from '@/hooks/use-song-generation';
import type { Song } from '@shared/schema';

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
const mockApiRequest = vi.fn();
vi.mock('../../../client/src/lib/queryClient', () => ({
  apiRequest: mockApiRequest
}));

// Mock toast and error handler
const mockToast = vi.fn();
const mockHandleError = vi.fn();
vi.mock('../../../client/src/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));
vi.mock('../../../client/src/hooks/use-error-handler', () => ({
  useErrorHandler: () => ({ handleError: mockHandleError })
}));

describe('useSongGeneration Hook', () => {
  // Common test data
  const mockSongData = {
    lyrics: 'Test lyrics for song generation',
    genre: 'pop',
    mood: 'happy',
    tempo: 120,
    title: 'Test Song'
  };

  const mockUser = { id: 1, username: 'testuser', plan: 'free' };

  const mockCompletedSong: Song = {
    id: 1,
    userId: '1',
    title: 'Test Song',
    lyrics: 'Test lyrics for song generation',
    genre: 'pop',
    mood: 'happy',
    tempo: 120,
    status: 'completed',
    generationProgress: 100,
    generatedAudioPath: '/uploads/test-song.mp3',
    sections: null,
    settings: null,
    planRestricted: false,
    playCount: 0,
    likes: 0,
    rating: '4',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useSongGeneration(mockUser), {
      wrapper: createWrapper()
    });

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.generationProgress).toBe(0);
    expect(result.current.generationStage).toBe('Ready');
    expect(result.current.generatingSong).toBeNull();
    expect(result.current.generationError).toBeNull();
  });

  it('should generate song successfully with immediate completion', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(mockCompletedSong)
    };

    mockApiRequest.mockResolvedValue(mockResponse);

    const onGenerationComplete = vi.fn();
    const onGenerationStart = vi.fn();

    const { result } = renderHook(() => useSongGeneration({
      ...mockUser,
      onGenerationComplete,
      onGenerationStart
    }), {
      wrapper: createWrapper()
    });

    // Start generation
    result.current.generateSong(mockSongData);

    // Verify initial state during generation
    expect(result.current.isGenerating).toBe(true);
    expect(onGenerationStart).toHaveBeenCalled();

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });

    expect(result.current.generationProgress).toBe(100);
    expect(onGenerationComplete).toHaveBeenCalledWith(mockCompletedSong);
    expect(mockToast).toHaveBeenCalledWith({
      title: "Song Generated Successfully",
      description: "Your song with authentic musical composition is ready to play!",
    });
  });

  it('should handle progressive generation with polling', async () => {
    const pendingSong = { ...mockCompletedSong, status: 'pending', generationProgress: 0 };
    const progressingSong = { ...mockCompletedSong, status: 'processing', generationProgress: 50 };

    // Initial generation response
    const initialResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(pendingSong)
    };

    // Progress polling responses
    const progressResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(progressingSong)
    };

    const completedResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(mockCompletedSong)
    };

    mockApiRequest
      .mockResolvedValueOnce(initialResponse)
      .mockResolvedValueOnce(progressResponse)
      .mockResolvedValueOnce(completedResponse);

    const onGenerationComplete = vi.fn();

    const { result } = renderHook(() => useSongGeneration({
      ...mockUser,
      onGenerationComplete
    }), {
      wrapper: createWrapper()
    });

    result.current.generateSong(mockSongData);

    await waitFor(() => {
      expect(result.current.generatingSong).toEqual(pendingSong);
    });

    // Fast-forward polling intervals
    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(result.current.generationProgress).toBe(50);
    });

    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
      expect(onGenerationComplete).toHaveBeenCalledWith(mockCompletedSong);
    });
  });

  it('should handle API errors during generation', async () => {
    const mockError = new Error('API request failed');
    mockApiRequest.mockRejectedValue(mockError);

    const { result } = renderHook(() => useSongGeneration(mockUser), {
      wrapper: createWrapper()
    });

    result.current.generateSong(mockSongData);

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });

    expect(result.current.generationError).toBeTruthy();
    expect(mockHandleError).toHaveBeenCalledWith(mockError, "Generation Failed");
    expect(result.current.generatingSong).toBeNull();
    expect(result.current.generationProgress).toBe(0);
  });

  it('should handle HTTP error responses', async () => {
    const errorResponse = {
      ok: false,
      json: vi.fn().mockResolvedValue({ message: 'Insufficient credits' })
    };

    mockApiRequest.mockResolvedValue(errorResponse);

    const { result } = renderHook(() => useSongGeneration(mockUser), {
      wrapper: createWrapper()
    });

    result.current.generateSong(mockSongData);

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });

    expect(result.current.generationError).toBeTruthy();
    expect(mockHandleError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Insufficient credits' }),
      "Generation Failed"
    );
  });

  it('should handle failed song status during polling', async () => {
    const pendingSong = { ...mockCompletedSong, status: 'pending', generationProgress: 0 };
    const failedSong = { ...mockCompletedSong, status: 'failed', generationProgress: 0 };

    const initialResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(pendingSong)
    };

    const failedResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(failedSong)
    };

    mockApiRequest
      .mockResolvedValueOnce(initialResponse)
      .mockResolvedValueOnce(failedResponse);

    const { result } = renderHook(() => useSongGeneration(mockUser), {
      wrapper: createWrapper()
    });

    result.current.generateSong(mockSongData);

    await waitFor(() => {
      expect(result.current.generatingSong).toEqual(pendingSong);
    });

    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });

    expect(mockHandleError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Song generation failed. Please try again." })
    );
  });

  it('should handle network timeouts and failures', async () => {
    const timeoutError = new Error('Network timeout');
    timeoutError.name = 'TimeoutError';
    
    mockApiRequest.mockRejectedValue(timeoutError);

    const { result } = renderHook(() => useSongGeneration(mockUser), {
      wrapper: createWrapper()
    });

    result.current.generateSong(mockSongData);

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });

    expect(mockHandleError).toHaveBeenCalledWith(timeoutError, "Generation Failed");
  });

  it('should handle polling errors gracefully', async () => {
    const pendingSong = { ...mockCompletedSong, status: 'pending', generationProgress: 0 };

    const initialResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(pendingSong)
    };

    const pollingError = new Error('Polling failed');

    mockApiRequest
      .mockResolvedValueOnce(initialResponse)
      .mockRejectedValueOnce(pollingError);

    const { result } = renderHook(() => useSongGeneration(mockUser), {
      wrapper: createWrapper()
    });

    result.current.generateSong(mockSongData);

    await waitFor(() => {
      expect(result.current.generatingSong).toEqual(pendingSong);
    });

    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });

    expect(mockHandleError).toHaveBeenCalledWith(pollingError, "Progress Check Failed");
  });

  it('should cancel generation successfully', async () => {
    const { result } = renderHook(() => useSongGeneration(mockUser), {
      wrapper: createWrapper()
    });

    // Start generation
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ ...mockCompletedSong, status: 'pending' })
    };
    mockApiRequest.mockResolvedValue(mockResponse);

    result.current.generateSong(mockSongData);

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(true);
    });

    // Cancel generation
    result.current.cancelGeneration();

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.generatingSong).toBeNull();
    expect(result.current.generationProgress).toBe(0);
  });

  it('should handle unexpected payload structures', async () => {
    const malformedResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ unexpected: 'data' })
    };

    mockApiRequest.mockResolvedValue(malformedResponse);

    const { result } = renderHook(() => useSongGeneration(mockUser), {
      wrapper: createWrapper()
    });

    result.current.generateSong(mockSongData);

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });

    // Should handle gracefully even with unexpected data
    expect(result.current.generationError).toBeNull();
  });

  it('should clean up polling on unmount', async () => {
    const pendingSong = { ...mockCompletedSong, status: 'pending', generationProgress: 0 };

    const initialResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(pendingSong)
    };

    mockApiRequest.mockResolvedValue(initialResponse);

    const { result, unmount } = renderHook(() => useSongGeneration(mockUser), {
      wrapper: createWrapper()
    });

    result.current.generateSong(mockSongData);

    await waitFor(() => {
      expect(result.current.generatingSong).toEqual(pendingSong);
    });

    // Unmount should not cause errors
    unmount();

    vi.advanceTimersByTime(5000);

    // No additional API calls should be made after unmount
    expect(mockApiRequest).toHaveBeenCalledTimes(1);
  });

  it('should handle unhandled promise rejections', async () => {
    const { result } = renderHook(() => useSongGeneration(mockUser), {
      wrapper: createWrapper()
    });

    // Simulate unhandled promise rejection
    const unhandledRejectionEvent = new Event('unhandledrejection') as PromiseRejectionEvent;
    Object.defineProperty(unhandledRejectionEvent, 'reason', { value: 'Unhandled error' });

    window.dispatchEvent(unhandledRejectionEvent);

    expect(result.current.generatingSong).toBeNull();
    expect(result.current.generationProgress).toBe(0);
  });
});
