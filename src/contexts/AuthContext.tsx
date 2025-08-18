//---------------------------------------------------------------------------------------------------------------------------

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { login as loginService, logout as logoutService, isAuthenticated, clearAuth } from '../services/auth.service'
import { useS3DataStore } from '../stores/s3DataStore'
import type { S3DataState, User } from '../types'

//---------------------------------------------------------------------------------------------------------------------------

type AuthContextType = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext: React.Context<AuthContextType | undefined>
  = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { fetchS3Data } = useS3DataStore();

  // Inicializar el estado de autenticación al cargar la aplicación
  useEffect(() => {
    const initializeAuth = (): void => {
      try {
        if (isAuthenticated()) {
          const storedUser: string | null = localStorage.getItem('user');
          if (storedUser) {
            const userData: User = JSON.parse(storedUser);
            setUser(userData);
            setIsAuth(true);

            // Si ya hay datos en el store, no hacer fetch
            const store: S3DataState = useS3DataStore.getState();
            if (!store.data) {
              fetchS3Data();
            }
          }
        } else {
          clearAuth();
          setUser(null);
          setIsAuth(false);
        }
      } catch (error) {
        console.error('Error al inicializar autenticación:', error);
        clearAuth();
        setUser(null);
        setIsAuth(false);
      } finally {
        setIsLoading(false);
      }
    }

    initializeAuth();
  }, [fetchS3Data])

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const userData: User = await loginService({ email, password });
      setUser(userData);
      setIsAuth(true);

      // Hacer fetch inicial de datos después del login exitoso
      await fetchS3Data();
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await logoutService();
      setUser(null);
      setIsAuth(false);
    } catch (error) {
      console.error('Error en logout:', error);
      setUser(null);
      setIsAuth(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: isAuth,
    isLoading,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context: AuthContextType | undefined = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthProvider };
