import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { trpc } from '../utils/trpc';

// Типы для нашей системы аутентификации
interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  roles?: string[];
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AuthProvider {
  name: string;
  displayName: string;
  authUrl: string;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  refreshUserData: () => Promise<void>;
  availableProviders: AuthProvider[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availableProviders, setAvailableProviders] = useState<AuthProvider[]>([]);

  // TRPC запросы
  const { data: authStatus, refetch: refetchAuthStatus } = trpc.auth.getAuthStatus.useQuery(
    undefined,
    { 
      enabled: true, // Always enabled since token is now passed via headers
      retry: false,
    }
  );

  const { data: providersData } = trpc.auth.getAvailableProviders.useQuery(
    undefined,
    { retry: false }
  );

  const logoutMutation = trpc.auth.signOut.useMutation();

  // Обновляем состояние на основе TRPC ответа
  useEffect(() => {
    console.log('[AuthContext] Auth status changed:', authStatus);
    
    if (authStatus) {
      if (authStatus.isAuthenticated && authStatus.user) {
        console.log('[AuthContext] User authenticated:', authStatus.user.email);
        setUser(authStatus.user);
        setIsLoading(false);
      } else {
        console.log('[AuthContext] User not authenticated, clearing state');
        setUser(null);
        setToken(null);
        Cookies.remove('auth-token');
        setIsLoading(false);
      }
    }
  }, [authStatus]);

  // Инициализация при загрузке
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Проверяем токен в cookies
        const savedToken = Cookies.get('auth-token');
        
        if (savedToken) {
          setToken(savedToken);
          // TRPC запрос автоматически подхватит токен из cookies
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Обновляем провайдеры при получении данных
  useEffect(() => {
    if (providersData?.providers) {
      setAvailableProviders(providersData.providers);
    }
  }, [providersData]);

  const login = (newToken: string, userData: User) => {
    console.log('[AuthContext] Login called with token:', newToken ? '***' + newToken.slice(-10) : 'none');
    console.log('[AuthContext] Login called with user:', userData.email);
    
    setToken(newToken);
    setUser(userData);
    
    // Backend уже устанавливает cookie, но проверим, что он там есть
    const existingCookie = Cookies.get('auth-token');
    if (!existingCookie) {
      console.log('[AuthContext] Cookie not found, setting manually...');
      // Если по какой-то причине backend не установил cookie, установим его
      Cookies.set('auth-token', newToken, {
        expires: 7, // 7 дней
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
    } else {
      console.log('[AuthContext] Cookie already set by backend');
    }
    
    console.log('[AuthContext] Token saved, current cookie:', Cookies.get('auth-token') ? '***' + Cookies.get('auth-token')!.slice(-10) : 'none');
    
    // Принудительно обновляем статус аутентификации
    setTimeout(() => {
      console.log('[AuthContext] Refetching auth status...');
      refetchAuthStatus();
    }, 100);
  };

  const logout = async () => {
    try {
      if (token) {
        // Отправляем запрос на logout через TRPC
        await logoutMutation.mutateAsync({ token });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Очищаем состояние независимо от результата
      setUser(null);
      setToken(null);
      Cookies.remove('auth-token');
      
      // Перенаправляем на главную страницу
      window.location.href = '/';
    }
  };

  const refreshUserData = async () => {
    if (token) {
      try {
        await refetchAuthStatus();
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      }
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
    refreshUserData,
    availableProviders,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 