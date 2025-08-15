import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types for authentication
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'provider' | 'admin';
  avatar?: string;
  verified: boolean;
  createdAt: string;
  lastLogin?: string;
  preferences?: {
    language: 'ar' | 'en';
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  clearError: () => void;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'user' | 'provider';
  termsAccepted: boolean;
}

// API endpoints
const API_BASE = '/api/auth';

// Auth store with Zustand
export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Login failed');
          }

          const data = await response.json();
          
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          localStorage.setItem('auth-token', data.token);
          
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
          });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Registration failed');
          }

          const result = await response.json();
          
          if (result.token) {
            set({
              user: result.user,
              token: result.token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            localStorage.setItem('auth-token', result.token);
          } else {
            set({ isLoading: false });
          }
          
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Registration failed',
          });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('auth-token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      refreshToken: async () => {
        const { token } = get();
        if (!token) return;

        try {
          const response = await fetch(`${API_BASE}/refresh`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Token refresh failed');
          }

          const data = await response.json();
          
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
          });

          localStorage.setItem('auth-token', data.token);
          
        } catch (error) {
          get().logout();
        }
      },

      updateProfile: async (data: Partial<User>) => {
        const { token } = get();
        if (!token) throw new Error('Not authenticated');

        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`${API_BASE}/profile`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Profile update failed');
          }

          const updatedUser = await response.json();
          
          set({
            user: updatedUser,
            isLoading: false,
            error: null,
          });
          
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Profile update failed',
          });
          throw error;
        }
      },

      resetPassword: async (email: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`${API_BASE}/reset-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Password reset failed');
          }

          set({ isLoading: false });
          
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Password reset failed',
          });
          throw error;
        }
      },

      verifyEmail: async (token: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`${API_BASE}/verify-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Email verification failed');
          }

          const data = await response.json();
          
          set({
            user: data.user,
            isLoading: false,
            error: null,
          });
          
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Email verification failed',
          });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Auth guard hook
export const useAuthGuard = (requiredRole?: 'user' | 'provider' | 'admin') => {
  const { user, isAuthenticated } = useAuthStore();

  const hasAccess = () => {
    if (!isAuthenticated || !user) return false;
    if (!requiredRole) return true;
    
    const roleHierarchy = { user: 1, provider: 2, admin: 3 };
    const userLevel = roleHierarchy[user.role];
    const requiredLevel = roleHierarchy[requiredRole];
    
    return userLevel >= requiredLevel;
  };

  return {
    isAuthenticated,
    user,
    hasAccess: hasAccess(),
    canAccess: (role: 'user' | 'provider' | 'admin') => {
      if (!user) return false;
      const roleHierarchy = { user: 1, provider: 2, admin: 3 };
      return roleHierarchy[user.role] >= roleHierarchy[role];
    },
  };
};

// Token management utilities
export const tokenUtils = {
  getToken: () => {
    return localStorage.getItem('auth-token');
  },

  setToken: (token: string) => {
    localStorage.setItem('auth-token', token);
  },

  removeToken: () => {
    localStorage.removeItem('auth-token');
  },

  isTokenExpired: (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  },

  getTokenPayload: (token: string) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  },
};

// Fetch wrapper with auth
export const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = tokenUtils.getToken();
  
  const authHeaders = token ? {
    'Authorization': `Bearer ${token}`,
  } : {};

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
  });

  // Handle token expiration
  if (response.status === 401 && token) {
    const { refreshToken, logout } = useAuthStore.getState();
    
    try {
      await refreshToken();
      const newToken = tokenUtils.getToken();
      return fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${newToken}`,
          ...options.headers,
        },
      });
    } catch {
      logout();
      window.location.href = '/login';
      throw new Error('Session expired');
    }
  }

  return response;
};

export default useAuthStore;
