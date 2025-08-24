export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  silent: true,
  forceExit: true,
  detectOpenHandles: false,
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true
    }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(chalk|ansi-styles|#ansi-styles|strip-ansi|ansi-regex|supports-color|has-flag)/)'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: [
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/src/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.test.ts'
  ],
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup/jest.setup.ts']
};