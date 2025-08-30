'use client';

import { useEffect, useState, useCallback, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useToast } from './use-toast';

// Types
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: string;
  profileImage?: string;
  verificationStatus: string;
  status: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  userType: string;
  organizationDetails?: any;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Load user from token on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!token || !refreshToken) {
          setIsLoading(false);
          return;
        }

        setAccessToken(token);
        
        // Verify token and get user data
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else if (response.status === 401) {
          // Try to refresh token
          await refreshTokenHandler();
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Auto refresh token before expiry
  useEffect(() => {
    if (!accessToken) return;

    // Parse JWT to get expiry
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const expiryTime = payload.exp * 1000;
      const now = Date.now();
      const timeUntilExpiry = expiryTime - now;
      
      // Refresh 5 minutes before expiry
      const refreshTime = timeUntilExpiry - 5 * 60 * 1000;
      
      if (refreshTime > 0) {
        const timeout = setTimeout(() => {
          refreshTokenHandler();
        }, refreshTime);
        
        return () => clearTimeout(timeout);
      }
    } catch (error) {
      console.error('Failed to parse token:', error);
    }
  }, [accessToken]);

  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }

      setAccessToken(data.accessToken);
      setUser(data.user);
      
      toast({
        title: 'Welcome back!',
        description: `Logged in as ${data.user.firstName} ${data.user.lastName}`,
      });

      // Redirect based on user type
      const redirectMap: Record<string, string> = {
        'ADMIN': '/admin/dashboard',
        'EQUIPMENT_SUPPLIER': '/supplier/dashboard',
        'HEALTHCARE_PROVIDER': '/provider/dashboard',
        'MAINTENANCE_ENGINEER': '/engineer/dashboard',
        'CUSTOMER_SERVICE': '/support/dashboard',
        'INDIVIDUAL_CUSTOMER': '/account/dashboard'
      };

      router.push(redirectMap[data.user.userType] || '/dashboard');
    } catch (error: any) {
      toast({
        title: 'Login failed',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [router, toast]);

  const register = useCallback(async (data: RegisterData) => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      toast({
        title: 'Registration successful!',
        description: result.message || 'Please check your email to verify your account.',
      });

      // Redirect to login
      router.push('/login?registered=true');
    } catch (error: any) {
      toast({
        title: 'Registration failed',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [router, toast]);

  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      // Call logout API
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('rememberMe');
      setUser(null);
      setAccessToken(null);
      
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
      
      router.push('/');
    }
  }, [router, toast]);

  const refreshTokenHandler = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Token refresh failed');
      }

      // Update tokens
      localStorage.setItem('accessToken', data.accessToken);
      setAccessToken(data.accessToken);
      
      return data.accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Force logout on refresh failure
      await logout();
      throw error;
    }
  }, [logout]);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Profile update failed');
      }

      setUser(result.user);
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated.',
      });
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    }
  }, [toast]);

  const verifyEmail = useCallback(async (token: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Email verification failed');
      }

      toast({
        title: 'Email verified!',
        description: 'Your email has been successfully verified.',
      });

      router.push('/login?verified=true');
    } catch (error: any) {
      toast({
        title: 'Verification failed',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    }
  }, [router, toast]);

  const requestPasswordReset = useCallback(async (email: string) => {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Password reset request failed');
      }

      toast({
        title: 'Reset email sent',
        description: data.message || 'Check your email for password reset instructions.',
      });
    } catch (error: any) {
      toast({
        title: 'Request failed',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    }
  }, [toast]);

  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Password reset failed');
      }

      toast({
        title: 'Password reset successful',
        description: 'You can now login with your new password.',
      });

      router.push('/login?reset=true');
    } catch (error: any) {
      toast({
        title: 'Reset failed',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    }
  }, [router, toast]);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshToken: refreshTokenHandler,
    updateProfile,
    verifyEmail,
    resetPassword,
    requestPasswordReset
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// HOC for protected routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    redirectTo?: string;
    roles?: string[];
  }
) {
  return function ProtectedComponent(props: P) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    
    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push(options?.redirectTo || '/login');
      }
      
      if (!isLoading && isAuthenticated && options?.roles) {
        if (!options.roles.includes(user?.userType || '')) {
          router.push('/unauthorized');
        }
      }
    }, [isLoading, isAuthenticated, user, router]);
    
    if (isLoading) {
      return <div>Loading...</div>;
    }
    
    if (!isAuthenticated) {
      return null;
    }
    
    if (options?.roles && !options.roles.includes(user?.userType || '')) {
      return null;
    }
    
    return <Component {...props} />;
  };
}