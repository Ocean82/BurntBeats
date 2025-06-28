import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AudioPlayer } from '../../client/src/components/audio-player';

// Mock HTML5 Audio API
global.HTMLMediaElement.prototype.play = jest.fn(() => Promise.resolve());
global.HTMLMediaElement.prototype.pause = jest.fn();
global.HTMLMediaElement.prototype.load = jest.fn();

Object.defineProperty(global.HTMLMediaElement.prototype, 'currentTime', {
  writable: true,
  value: 0,
});

Object.defineProperty(global.HTMLMediaElement.prototype, 'duration', {
  writable: true,
  value: 180, // 3 minutes
});

describe('AudioPlayer Component', () => {
  const mockSong = {
    id: 'test-song-id',
    title: 'Test Song',
    artist: 'Test Artist',
    audioUrl: '/api/audio/test-song-id'
  };

  test('renders player with song information', () => {
    render(<AudioPlayer song={mockSong} />);
    
    expect(screen.getByText('Test Song')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
  });

  test('shows play button initially', () => {
    render(<AudioPlayer song={mockSong} />);
    
    const playButton = screen.getByRole('button', { name: /play/i });
    expect(playButton).toBeInTheDocument();
  });

  test('toggles between play and pause', async () => {
    render(<AudioPlayer song={mockSong} />);
    
    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });
    
    const pauseButton = screen.getByRole('button', { name: /pause/i });
    fireEvent.click(pauseButton);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
    });
  });

  test('displays progress bar', () => {
    render(<AudioPlayer song={mockSong} />);
    
    const progressBar = screen.getByRole('slider');
    expect(progressBar).toBeInTheDocument();
  });

  test('shows time display', () => {
    render(<AudioPlayer song={mockSong} />);
    
    expect(screen.getByText('0:00')).toBeInTheDocument();
    expect(screen.getByText('3:00')).toBeInTheDocument();
  });

  test('handles volume control', () => {
    render(<AudioPlayer song={mockSong} />);
    
    const volumeButton = screen.getByRole('button', { name: /volume/i });
    expect(volumeButton).toBeInTheDocument();
    
    fireEvent.click(volumeButton);
    const volumeSlider = screen.getByRole('slider', { name: /volume/i });
    expect(volumeSlider).toBeInTheDocument();
  });

  test('displays download button for purchased songs', () => {
    const purchasedSong = { ...mockSong, isPurchased: true };
    render(<AudioPlayer song={purchasedSong} />);
    
    expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
  });

  test('shows purchase options for unpurchased songs', () => {
    const unpurchasedSong = { ...mockSong, isPurchased: false };
    render(<AudioPlayer song={unpurchasedSong} />);
    
    expect(screen.getByText(/buy now/i)).toBeInTheDocument();
  });

  test('handles audio loading errors gracefully', async () => {
    const errorSong = { ...mockSong, audioUrl: '/invalid-url' };
    render(<AudioPlayer song={errorSong} />);
    
    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);
    
    // Should handle error without crashing
    await waitFor(() => {
      expect(playButton).toBeInTheDocument();
    });
  });
});