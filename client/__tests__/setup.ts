// Test setup and configuration
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with Testing Library matchers
expect.extend(matchers);

// Global test setup
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
  
  // Reset localStorage
  localStorage.clear();
  
  // Reset sessionStorage
  sessionStorage.clear();
  
  // Mock window.location
  delete (window as any).location;
  window.location = {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  } as any;
  
  // Mock window.crypto
  Object.defineProperty(window, 'crypto', {
    value: {
      getRandomValues: vi.fn((arr: any) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      }),
    },
  });
  
  // Mock fetch
  global.fetch = vi.fn();
  
  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
  
  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
  
  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Global test utilities
export const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user' as const,
  verified: true,
  createdAt: '2023-01-01T00:00:00Z',
  preferences: {
    language: 'ar' as const,
    theme: 'light' as const,
    notifications: true,
  },
  ...overrides,
});

export const createMockAuthState = (user = createMockUser()) => ({
  user,
  token: 'mock-token',
  isAuthenticated: true,
  isLoading: false,
  error: null,
});

export const mockFetch = (response: any, options: { status?: number; ok?: boolean } = {}) => {
  const { status = 200, ok = true } = options;
  
  (global.fetch as any).mockResolvedValueOnce({
    ok,
    status,
    json: () => Promise.resolve(response),
    text: () => Promise.resolve(JSON.stringify(response)),
    headers: new Headers(),
  });
};

export const mockFetchError = (error: string | Error) => {
  const errorObj = typeof error === 'string' ? new Error(error) : error;
  (global.fetch as any).mockRejectedValueOnce(errorObj);
};

export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = vi.fn();
  console.warn = vi.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Mock environment variables for tests
vi.mock('../lib/config', () => ({
  config: {
    NODE_ENV: 'test',
    API_BASE_URL: 'http://localhost:3000/api',
    APP_NAME: 'Test App',
    VERSION: '1.0.0',
  },
}));
