import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SongForm } from '../../client/src/components/song-form';

// Mock the useAuth hook
jest.mock('../../client/src/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    isAuthenticated: true
  })
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

const renderWithQueryClient = (component) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('SongForm Component', () => {
  test('renders form with all required fields', () => {
    renderWithQueryClient(<SongForm />);
    
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/lyrics/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/genre/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate song/i })).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    renderWithQueryClient(<SongForm />);
    
    const generateButton = screen.getByRole('button', { name: /generate song/i });
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      expect(screen.getByText(/lyrics are required/i)).toBeInTheDocument();
    });
  });

  test('accepts valid form input', () => {
    renderWithQueryClient(<SongForm />);
    
    const titleInput = screen.getByLabelText(/title/i);
    const lyricsInput = screen.getByLabelText(/lyrics/i);
    
    fireEvent.change(titleInput, { target: { value: 'Test Song' } });
    fireEvent.change(lyricsInput, { target: { value: 'Test lyrics content' } });
    
    expect(titleInput).toHaveValue('Test Song');
    expect(lyricsInput).toHaveValue('Test lyrics content');
  });

  test('shows genre selection dropdown', () => {
    renderWithQueryClient(<SongForm />);
    
    const genreSelect = screen.getByLabelText(/genre/i);
    fireEvent.click(genreSelect);
    
    expect(screen.getByText(/pop/i)).toBeInTheDocument();
    expect(screen.getByText(/rock/i)).toBeInTheDocument();
    expect(screen.getByText(/jazz/i)).toBeInTheDocument();
  });

  test('disables form during submission', async () => {
    renderWithQueryClient(<SongForm />);
    
    const titleInput = screen.getByLabelText(/title/i);
    const lyricsInput = screen.getByLabelText(/lyrics/i);
    const generateButton = screen.getByRole('button', { name: /generate song/i });
    
    fireEvent.change(titleInput, { target: { value: 'Test Song' } });
    fireEvent.change(lyricsInput, { target: { value: 'Test lyrics' } });
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(generateButton).toBeDisabled();
    });
  });
});