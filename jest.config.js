
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/tests/unit/**/*.test.ts', '**/tests/integration/**/*.test.ts'],
  collectCoverageFrom: [
    'server/**/*.ts',
    'shared/**/*.ts',
    '!server/**/*.d.ts',
    '!server/index.ts'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  testTimeout: 30000,
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true
    }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
};
