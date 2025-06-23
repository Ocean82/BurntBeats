import { jest } from '@jest/globals';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.JWT_SECRET = 'test-secret';

// Mock external services
jest.mock('../server/stripe-service', () => ({
  StripeService: {
    createPaymentIntent: jest.fn(),
    createCustomer: jest.fn(),
    handleWebhook: jest.fn()
  }
}));

// Mock file system operations
jest.mock('fs/promises');
jest.mock('fs');

// Mock audio processing
jest.mock('../server/enhanced-voice-pipeline');

// Set up global test timeout
jest.setTimeout(30000);

import { customMatchers } from './test-utils';

// Add custom matchers
expect.extend(customMatchers);

// Jest globals are automatically available in the test environment
// Import testing library matchers
import '@testing-library/jest-dom';