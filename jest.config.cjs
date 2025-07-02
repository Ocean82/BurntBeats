
/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '**/tests/unit/**/*.test.js',
    '**/tests/integration/**/*.test.js',
    '**/tests/frontend/**/*.test.js',
    '**/tests/performance/**/*.test.js',
    '**/tests/security/**/*.test.js'
  ],
  
  // Enhanced coverage including frontend files
  collectCoverageFrom: [
    'server/**/*.js',
    'shared/**/*.js',
    '!server/**/*.d.ts',
    '!server/index.js'
  ],
  
  // Alias sync with tsconfig.json paths config
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1'
  },
  
  testTimeout: 30000,
  
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'],
  
  // Coverage reporting configuration
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  }
};

module.exports = config;
