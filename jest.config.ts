import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/apps', '<rootDir>/packages'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@mobiwave/(.*)$': '<rootDir>/packages/$1/src',
  },
  setupFilesAfterSetup: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.base.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  testTimeout: 30000,
  clearMocks: true,
  restoreMocks: true,
  collectCoverageFrom: [
    'apps/*/src/**/*.ts',
    '!apps/*/src/__tests__/**',
    '!apps/*/src/**/*.routes.ts',
    '!apps/*/src/**/*.controller.ts',
    '!apps/*/src/main.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  verbose: true,
};

export default config;
