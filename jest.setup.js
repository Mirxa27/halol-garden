/**
 * JEST SETUP - PRODUCTION STANDARDS
 * Configures testing environment with strict validation
 */

import '@testing-library/jest-dom';
import 'jest-extended';
import { TextEncoder, TextDecoder } from 'util';

// Polyfills for Node environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Set production test environment
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000';

// Fail tests on console errors
const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

console.error = (...args) => {
  originalError(...args);
  throw new Error(`Console error detected: ${args.join(' ')}`);
};

console.warn = (...args) => {
  originalWarn(...args);
  throw new Error(`Console warning detected: ${args.join(' ')}`);
};

// No console.log in tests
console.log = (...args) => {
  throw new Error(`Console.log detected in tests: ${args.join(' ')}`);
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Performance monitoring
beforeEach(() => {
  jest.useFakeTimers();
  performance.mark('test-start');
});

afterEach(() => {
  performance.mark('test-end');
  performance.measure('test-duration', 'test-start', 'test-end');
  const measure = performance.getEntriesByName('test-duration')[0];
  
  // Fail if test takes more than 5 seconds
  if (measure && measure.duration > 5000) {
    throw new Error(`Test exceeded maximum duration: ${measure.duration}ms`);
  }
  
  jest.clearAllTimers();
  jest.useRealTimers();
  jest.clearAllMocks();
  performance.clearMarks();
  performance.clearMeasures();
});

// Global test utilities
global.testUtils = {
  // Wait for async operations
  waitForAsync: () => new Promise(resolve => setImmediate(resolve)),
  
  // Flush promises
  flushPromises: () => new Promise(resolve => process.nextTick(resolve)),
  
  // Mock API response
  mockApiResponse: (data, status = 200) => {
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: async () => data,
      text: async () => JSON.stringify(data),
      headers: new Headers(),
    });
  },
  
  // Assert no memory leaks
  assertNoMemoryLeaks: () => {
    if (global.gc) {
      global.gc();
      const usage = process.memoryUsage();
      if (usage.heapUsed > 100 * 1024 * 1024) { // 100MB threshold
        throw new Error(`Memory leak detected: ${usage.heapUsed / 1024 / 1024}MB used`);
      }
    }
  }
};

// Custom matchers
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
  
  toHaveNoViolations(received) {
    const pass = received.violations.length === 0;
    if (pass) {
      return {
        message: () => 'expected accessibility violations',
        pass: true,
      };
    } else {
      return {
        message: () => `found ${received.violations.length} accessibility violations:\n${
          received.violations.map(v => `- ${v.description}`).join('\n')
        }`,
        pass: false,
      };
    }
  }
});

// Strict mode for async tests
jest.setTimeout(10000);

// Fail on unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  throw reason;
});

// Export for use in tests
export { originalError, originalWarn, originalLog };