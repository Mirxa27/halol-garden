/**
 * PRODUCTION TESTING CONFIGURATION
 * Enforces strict testing standards with zero tolerance for low coverage
 */

module.exports = {
  displayName: 'Production Tests',
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>'],
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.{ts,tsx,js,jsx}',
    '**/*.{test,spec}.{ts,tsx,js,jsx}'
  ],
  
  // Module paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@components/(.*)$': '<rootDir>/components/$1',
    '^@lib/(.*)$': '<rootDir>/lib/$1',
    '^@hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@utils/(.*)$': '<rootDir>/utils/$1',
    '^@types/(.*)$': '<rootDir>/types/$1',
    '^@services/(.*)$': '<rootDir>/services/$1',
    '^@config/(.*)$': '<rootDir>/config/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js'
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        strict: true
      }
    }]
  },
  
  // STRICT COVERAGE THRESHOLDS - NO EXCEPTIONS
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Critical paths require 100% coverage
    './lib/': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    './services/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './utils/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  
  // Coverage collection
  collectCoverageFrom: [
    '**/*.{ts,tsx,js,jsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/dist/**',
    '!**/coverage/**',
    '!**/*.config.{js,ts}',
    '!**/public/**',
    '!**/__tests__/**',
    '!**/__mocks__/**',
    '!**/migrations/**'
  ],
  
  // Coverage reporters
  coverageReporters: [
    'json',
    'lcov',
    'text',
    'text-summary',
    'html',
    'cobertura'
  ],
  
  // Test timeout for production
  testTimeout: 10000,
  
  // Bail on first test failure in production
  bail: true,
  
  // Verbose output for CI/CD
  verbose: true,
  
  // Error on deprecated APIs
  errorOnDeprecated: true,
  
  // Maximum worker threads
  maxWorkers: '50%',
  
  // Cache directory
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Clear mocks automatically
  clearMocks: true,
  
  // Restore mocks automatically
  restoreMocks: true,
  
  // Detect open handles
  detectOpenHandles: true,
  
  // Detect memory leaks
  detectLeaks: false, // Enable in CI/CD
  
  // Force coverage collection
  collectCoverage: true,
  
  // Fail tests on console warnings
  silent: false,
  
  // Watch plugins for development
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  
  // Global setup/teardown
  globalSetup: '<rootDir>/jest.global-setup.js',
  globalTeardown: '<rootDir>/jest.global-teardown.js',
  
  // Reporter configuration
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './test-results',
      outputName: 'junit.xml',
      ancestorSeparator: ' › ',
      uniqueOutputName: 'false',
      suiteNameTemplate: '{filepath}',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}'
    }],
    ['jest-html-reporters', {
      publicPath: './test-results/html',
      filename: 'report.html',
      expand: true,
      pageTitle: 'Production Test Report',
      logoImgPath: './public/logo.png',
      hideIcon: false,
      customInfos: [
        {
          title: 'Environment',
          value: process.env.NODE_ENV || 'test'
        },
        {
          title: 'Coverage Threshold',
          value: '80%'
        }
      ]
    }]
  ],
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  },
  
  // Module file extensions
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node'
  ],
  
  // Snapshot serializers
  snapshotSerializers: [
    '@emotion/jest/serializer'
  ],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/dist/',
    '/coverage/'
  ],
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    '/node_modules/(?!(.*\\.mjs$))'
  ],
  
  // Unmocked module patterns
  unmockedModulePathPatterns: [
    'node_modules/react/',
    'node_modules/enzyme/'
  ]
};