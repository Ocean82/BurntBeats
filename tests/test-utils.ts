import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a new QueryClient for each test
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 0,
        gcTime: 0, // Updated from cacheTime
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    queryClient = createTestQueryClient(),
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

// Mock fetch for tests
export function mockFetch(response: any, ok = true) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
    })
  ) as jest.Mock;
}

// Clean up after each test
export function cleanupTests() {
  jest.restoreAllMocks();
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';

// Mock audio utilities
export const mockAudioUtils = {
  createAudioContext: jest.fn(() => ({
    createOscillator: jest.fn(),
    createGain: jest.fn(),
    destination: {},
  })),
  loadAudioFile: jest.fn(),
  generateWaveform: jest.fn(() => new Array(100).fill(0.5)),
};

// Mock API responses
export const mockApiResponses = {
  songGeneration: {
    success: true,
    song: {
      id: 1,
      title: 'Test Song',
      lyrics: 'Test lyrics',
      genre: 'pop',
      audioUrl: '/uploads/test-song.mp3',
      createdAt: new Date().toISOString(),
    },
  },
  voiceCloning: {
    success: true,
    voice: {
      id: 1,
      name: 'Test Voice',
      audioUrl: '/uploads/test-voice.wav',
      qualityScore: 0.95,
    },
  },
  userAuth: {
    success: true,
    user: {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      plan: 'free',
    },
  },
};

// Test data generators
export const generateTestSong = (overrides = {}) => ({
  id: Math.floor(Math.random() * 1000),
  title: 'Test Song',
  lyrics: 'Test lyrics for automated testing',
  genre: 'pop',
  mood: 'happy',
  tempo: 120,
  audioUrl: `/uploads/test-song-${Date.now()}.mp3`,
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const generateTestUser = (overrides = {}) => ({
  id: Math.floor(Math.random() * 1000),
  email: `test-${Date.now()}@example.com`,
  name: 'Test User',
  plan: 'free',
  createdAt: new Date().toISOString(),
  ...overrides,
});

// Custom matchers
export const customMatchers = {
  toBeValidAudioUrl: (received: string) => {
    const audioExtensions = ['.mp3', '.wav', '.m4a', '.ogg'];
    const hasAudioExtension = audioExtensions.some(ext => received.includes(ext));
    
    return {
      message: () => `Expected ${received} to be a valid audio URL`,
      pass: hasAudioExtension && received.startsWith('/uploads/'),
    };
  },
  
  toHaveValidTimestamp: (received: string) => {
    const date = new Date(received);
    const isValid = date instanceof Date && !isNaN(date.getTime());
    
    return {
      message: () => `Expected ${received} to be a valid timestamp`,
      pass: isValid,
    };
  },
};

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidAudioUrl(): R;
      toHaveValidTimestamp(): R;
    }
  }
}

// Wait for async operations
export const waitForAsync = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

// Test environment setup
export const setupTestEnvironment = () => {
  // Mock console methods to reduce noise in tests
  const originalConsole = { ...console };
  
  beforeAll(() => {
    console.warn = jest.fn();
    console.error = jest.fn();
  });
  
  afterAll(() => {
    Object.assign(console, originalConsole);
  });
};