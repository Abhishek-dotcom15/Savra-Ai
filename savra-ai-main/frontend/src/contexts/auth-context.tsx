'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  api,
  setTokens,
  clearTokens,
  getToken,
  ApiError,
  setMockAuth,
  getMockAuth,
  clearMockAuth,
} from '@/lib/api';
import { signInWithGoogle } from '@/lib/firebase';
import type { User, LoginRequest, LoginResponse, ApiResponse } from '@/types/api';

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: 'teacher' | 'student' | 'admin';
  schoolCode?: string;
  classId?: string;
  location?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  loginWithGoogle: (role?: 'teacher' | 'student') => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    const mockUser = getMockAuth();
    if (mockUser) {
      setUser({
        ...mockUser,
        createdAt: mockUser.createdAt ?? new Date().toISOString(),
        updatedAt: mockUser.updatedAt ?? new Date().toISOString(),
      } as User);
      setIsLoading(false);
      return;
    }

    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get<ApiResponse<User>>('/auth/me');
      setUser(response.data);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials: LoginRequest) => {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    setTokens(response.data.accessToken, response.data.refreshToken);
    setUser(response.data.user);

    // Redirect based on role
    const user = response.data.user;

    // Check if teacher needs onboarding
    if (user.role === 'teacher' && !user.onboardingCompleted) {
      router.push('/home?setup=true');
      return;
    }

    const redirectMap: Record<string, string> = {
      teacher: '/home',
      student: '/student-home',
      admin: '/admin-dashboard',
    };
    router.push(redirectMap[user.role] || '/');
  };

  const loginWithGoogle = async (role: 'teacher' | 'student' = 'teacher') => {
    try {
      // Sign in with Google using Firebase
      const result = await signInWithGoogle();
      const idToken = await result.user.getIdToken();

      // Send ID token to backend
      const response = await api.post<LoginResponse>('/auth/google', {
        idToken,
        role,
      });

      setTokens(response.data.accessToken, response.data.refreshToken);
      setUser(response.data.user);

      // Redirect based on role
      const user = response.data.user;

      // Check if teacher needs onboarding
      if (user.role === 'teacher' && !user.onboardingCompleted) {
        router.push('/home?setup=true');
        return;
      }

      const redirectMap: Record<string, string> = {
        teacher: '/home',
        student: '/student-home',
        admin: '/admin-dashboard',
      };
      router.push(redirectMap[user.role] || '/');
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      // Re-throw with a user-friendly message if it's not already formatted
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(error?.message || 'Google sign-in failed. Please try again.');
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      const response = await api.post<LoginResponse>('/auth/register', data);
      setTokens(response.data.accessToken, response.data.refreshToken);
      setUser(response.data.user);

      const user = response.data.user;

      if (user.role === 'teacher') {
        router.push('/home?setup=true');
        return;
      }

      const redirectMap: Record<string, string> = {
        student: '/student-home',
        admin: '/admin-dashboard',
      };
      router.push(redirectMap[user.role] || '/');
    } catch (err) {
      if (err instanceof ApiError && err.status === 0) {
        const now = new Date().toISOString();
        const mockUser: User = {
          id: `mock-teacher-${Date.now()}`,
          email: data.email,
          name: data.name,
          role: 'teacher' as const,
          avatarUrl: undefined,
          onboardingCompleted: false,
          createdAt: now,
          updatedAt: now,
        };
        setMockAuth(mockUser);
        setTokens('mock-access-token', 'mock-refresh-token');
        setUser(mockUser);
        router.push('/home?setup=true');
        return;
      }
      throw err;
    }
  };

  const logout = async () => {
    if (!getMockAuth()) {
      try {
        await api.post('/auth/logout');
      } catch {
        // Ignore logout errors - we still want to clear local state
      }
    }
    clearMockAuth();
    clearTokens();
    setUser(null);
    router.push('/teacher/login');
  };

  const refreshUser = async () => {
    const mockUser = getMockAuth();
    if (mockUser) {
      setUser({
        ...mockUser,
        createdAt: mockUser.createdAt ?? new Date().toISOString(),
        updatedAt: mockUser.updatedAt ?? new Date().toISOString(),
      } as User);
      return;
    }
    try {
      const response = await api.get<ApiResponse<User>>('/auth/me');
      setUser(response.data);
    } catch {
      clearTokens();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        loginWithGoogle,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Export the context for testing purposes
export { AuthContext };
