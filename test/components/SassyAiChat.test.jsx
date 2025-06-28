import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SassyAiChat } from '../../client/src/components/sassy-ai-chat';

// Mock the useAuth hook
jest.mock('../../client/src/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    isAuthenticated: true
  })
}));

describe('SassyAiChat Component', () => {
  test('renders chat interface with input', () => {
    render(<SassyAiChat />);
    expect(screen.getByPlaceholderText(/ask me anything/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  test('displays sassy responses', async () => {
    render(<SassyAiChat />);
    
    const input = screen.getByPlaceholderText(/ask me anything/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(input, { target: { value: 'Help me write lyrics' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText(/what did you expect from the free plan/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('handles empty input gracefully', () => {
    render(<SassyAiChat />);
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);
    
    // Should not crash or send empty message
    expect(screen.queryByText('')).not.toBeInTheDocument();
  });

  test('shows chat history', async () => {
    render(<SassyAiChat />);
    
    const input = screen.getByPlaceholderText(/ask me anything/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });
});