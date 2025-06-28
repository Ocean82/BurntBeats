
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests', '<rootDir>/test'],
  testMatch: [
    '**/tests/unit/**/*.test.ts', 
    '**/tests/integration/**/*.test.ts',
    '**/test/components/**/*.test.jsx',
    '**/test/**/*.test.js'
  ],
  
  // Enhanced coverage including frontend files
  collectCoverageFrom: [
    'server/**/*.ts',
    'shared/**/*.ts',
    'client/**/*.ts?(x)', // Frontend test coverage
    '!server/**/*.d.ts',
    '!server/index.ts',
    '!client/**/*.d.ts'
  ],
  
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts', '<rootDir>/test/setupTests.js'],
  
  // Alias sync with tsconfig.json paths config
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1'
  },
  
  testTimeout: 30000,
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  
  // Watch plugins for improved local testing experience
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Coverage reporting configuration
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
  
  // Future project separation structure (commented for reference)
  // projects: [
  //   {
  //     displayName: 'server',
  //     testMatch: ['<rootDir>/tests/unit/**/*.test.ts', '<rootDir>/tests/integration/**/*.test.ts'],
  //     testEnvironment: 'node'
  //   },
  //   {
  //     displayName: 'client',
  //     testMatch: ['<rootDir>/tests/frontend/**/*.test.ts?(x)'],
  //     testEnvironment: 'jsdom'
  //   }
  // ]
};
