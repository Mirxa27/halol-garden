import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthStore, tokenUtils, authFetch } from '../lib/auth';
import { mockFetch, mockFetchError, createMockUser, waitForAsync } from './setup';

describe('Authentication System', () => {
  beforeEach(() => {
    // Reset Zustand store
    useAuthStore.getState().logout();
    localStorage.clear();
  });

  describe('useAuthStore', () => {
    it('should have initial state', () => {
      const { result } = renderHook(() => useAuthStore());
      
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should login successfully', async () => {
      const mockUser = createMockUser();
      const mockResponse = {
        user: mockUser,
        token: 'mock-jwt-token',
      };

      mockFetch(mockResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe('mock-jwt-token');
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(localStorage.getItem('auth-token')).toBe('mock-jwt-token');
    });

    it('should handle login failure', async () => {
      mockFetch({ message: 'Invalid credentials' }, { status: 401, ok: false });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.login('test@example.com', 'wrongpassword');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Invalid credentials');
    });

    it('should register successfully', async () => {
      const mockUser = createMockUser();
      const mockResponse = {
        user: mockUser,
        token: 'mock-jwt-token',
      };

      mockFetch(mockResponse);

      const { result } = renderHook(() => useAuthStore());

      const registerData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'user' as const,
        termsAccepted: true,
      };

      await act(async () => {
        await result.current.register(registerData);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe('mock-jwt-token');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should logout successfully', () => {
      const { result } = renderHook(() => useAuthStore());

      // Set initial state
      act(() => {
        useAuthStore.setState({
          user: createMockUser(),
          token: 'mock-token',
          isAuthenticated: true,
        });
      });

      localStorage.setItem('auth-token', 'mock-token');

      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorage.getItem('auth-token')).toBeNull();
    });

    it('should refresh token successfully', async () => {
      const mockUser = createMockUser();
      const mockResponse = {
        user: mockUser,
        token: 'new-jwt-token',
      };

      mockFetch(mockResponse);

      const { result } = renderHook(() => useAuthStore());

      // Set initial state with token
      act(() => {
        useAuthStore.setState({
          token: 'old-token',
          isAuthenticated: true,
        });
      });

      await act(async () => {
        await result.current.refreshToken();
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe('new-jwt-token');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle refresh token failure', async () => {
      mockFetchError('Token refresh failed');

      const { result } = renderHook(() => useAuthStore());

      // Set initial state with token
      act(() => {
        useAuthStore.setState({
          token: 'old-token',
          isAuthenticated: true,
        });
      });

      await act(async () => {
        await result.current.refreshToken();
      });

      // Should logout on refresh failure
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should update profile successfully', async () => {
      const updatedUser = { ...createMockUser(), name: 'Updated Name' };
      mockFetch(updatedUser);

      const { result } = renderHook(() => useAuthStore());

      // Set initial authenticated state
      act(() => {
        useAuthStore.setState({
          user: createMockUser(),
          token: 'mock-token',
          isAuthenticated: true,
        });
      });

      await act(async () => {
        await result.current.updateProfile({ name: 'Updated Name' });
      });

      expect(result.current.user?.name).toBe('Updated Name');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should reset password successfully', async () => {
      mockFetch({ message: 'Password reset email sent' });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.resetPassword('test@example.com');
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should verify email successfully', async () => {
      const mockUser = { ...createMockUser(), verified: true };
      mockFetch({ user: mockUser });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.verifyEmail('verification-token');
      });

      expect(result.current.user?.verified).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should clear error', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        useAuthStore.setState({ error: 'Test error' });
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('tokenUtils', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should get token from localStorage', () => {
      localStorage.setItem('auth-token', 'test-token');
      expect(tokenUtils.getToken()).toBe('test-token');
    });

    it('should set token in localStorage', () => {
      tokenUtils.setToken('new-token');
      expect(localStorage.getItem('auth-token')).toBe('new-token');
    });

    it('should remove token from localStorage', () => {
      localStorage.setItem('auth-token', 'test-token');
      tokenUtils.removeToken();
      expect(localStorage.getItem('auth-token')).toBeNull();
    });

    it('should check if token is expired', () => {
      // Create a mock JWT token with expiration
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const expiredPayload = btoa(JSON.stringify({ 
        exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
      }));
      const validPayload = btoa(JSON.stringify({ 
        exp: Math.floor(Date.now() / 1000) + 3600 // Expires in 1 hour
      }));
      
      const expiredToken = `${header}.${expiredPayload}.signature`;
      const validToken = `${header}.${validPayload}.signature`;

      expect(tokenUtils.isTokenExpired(expiredToken)).toBe(true);
      expect(tokenUtils.isTokenExpired(validToken)).toBe(false);
      expect(tokenUtils.isTokenExpired('invalid-token')).toBe(true);
    });

    it('should get token payload', () => {
      const payload = { userId: '123', exp: 1234567890 };
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `${header}.${encodedPayload}.signature`;

      expect(tokenUtils.getTokenPayload(token)).toEqual(payload);
      expect(tokenUtils.getTokenPayload('invalid-token')).toBeNull();
    });
  });

  describe('authFetch', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should make authenticated request', async () => {
      localStorage.setItem('auth-token', 'test-token');
      mockFetch({ success: true });

      await authFetch('/api/test');

      expect(global.fetch).toHaveBeenCalledWith('/api/test', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
      });
    });

    it('should make unauthenticated request', async () => {
      mockFetch({ success: true });

      await authFetch('/api/test');

      expect(global.fetch).toHaveBeenCalledWith('/api/test', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should handle 401 response and refresh token', async () => {
      localStorage.setItem('auth-token', 'old-token');
      
      // First call returns 401
      (global.fetch as any).mockResolvedValueOnce({
        status: 401,
        ok: false,
      });

      // Mock refresh token success
      mockFetch({ user: createMockUser(), token: 'new-token' });

      // Second call with new token succeeds
      mockFetch({ success: true });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await authFetch('/api/test');
      });

      // Should have called fetch 3 times: initial, refresh, retry
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should logout on refresh failure', async () => {
      localStorage.setItem('auth-token', 'old-token');
      
      // First call returns 401
      (global.fetch as any).mockResolvedValueOnce({
        status: 401,
        ok: false,
      });

      // Mock refresh token failure
      mockFetchError('Refresh failed');

      const { result } = renderHook(() => useAuthStore());

      try {
        await authFetch('/api/test');
      } catch (error) {
        expect(error.message).toBe('Session expired');
      }

      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});
