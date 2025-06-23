
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import SongForm from '../../client/src/components/song-form';

// Mock hooks
vi.mock('../../client/src/hooks/use-song-generation', () => ({
  useSongGeneration: () => ({
    generateSong: vi.fn(),
    isGenerating: false,
    generationProgress: 0,
    generationStage: '',
    generatedSong: null,
    error: null
  })
}));

vi.mock('../../client/src/hooks/use-voice-samples', () => ({
  useVoiceSamples: () => ({
    voiceSamples: [],
    isLoading: false,
    error: null
  })
}));

describe('SongForm Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
  });

  const renderSongForm = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <SongForm />
      </QueryClientProvider>
    );
  };

  it('should render form elements', () => {
    renderSongForm();

    expect(screen.getByLabelText(/lyrics/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/genre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mood/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tempo/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate song/i })).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    renderSongForm();

    const generateButton = screen.getByRole('button', { name: /generate song/i });
    await user.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/lyrics are required/i)).toBeInTheDocument();
    });
  });

  it('should update form values when typing', async () => {
    const user = userEvent.setup();
    renderSongForm();

    const lyricsInput = screen.getByLabelText(/lyrics/i);
    await user.type(lyricsInput, 'Test lyrics for my song');

    expect(lyricsInput).toHaveValue('Test lyrics for my song');
  });

  it('should handle genre selection', async () => {
    const user = userEvent.setup();
    renderSongForm();

    const genreSelect = screen.getByLabelText(/genre/i);
    await user.selectOptions(genreSelect, 'rock');

    expect(genreSelect).toHaveValue('rock');
  });

  it('should handle tempo slider', async () => {
    const user = userEvent.setup();
    renderSongForm();

    const tempoSlider = screen.getByLabelText(/tempo/i);
    fireEvent.change(tempoSlider, { target: { value: '140' } });

    expect(tempoSlider).toHaveValue('140');
  });

  it('should disable generate button while generating', () => {
    vi.mocked(require('../../client/src/hooks/use-song-generation').useSongGeneration)
      .mockReturnValue({
        generateSong: vi.fn(),
        isGenerating: true,
        generationProgress: 50,
        generationStage: 'Processing...',
        generatedSong: null,
        error: null
      });

    renderSongForm();

    const generateButton = screen.getByRole('button', { name: /generating.../i });
    expect(generateButton).toBeDisabled();
  });

  it('should show progress when generating', () => {
    vi.mocked(require('../../client/src/hooks/use-song-generation').useSongGeneration)
      .mockReturnValue({
        generateSong: vi.fn(),
        isGenerating: true,
        generationProgress: 75,
        generationStage: 'Creating vocals...',
        generatedSong: null,
        error: null
      });

    renderSongForm();

    expect(screen.getByText('Creating vocals...')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });
});
