//---------------------------------------------------------------------------------------------------------------------------

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authService } from '../services/auth.service';
import { useS3DataStore } from '../stores/s3DataStore';
import type { User } from '../types';

//---------------------------------------------------------------------------------------------------------------------------

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { fetchS3Data } = useS3DataStore();

  // Inicializar el estado de autenticación al cargar la aplicación
  useEffect(() => {
    const initializeAuth = (): void => {
      try {
        // Usar el método del servicio para verificar autenticación
        if (authService.isAuthenticated()) {
          const storedUser: string | null = localStorage.getItem('user');
          if (storedUser) {
            const userData: User = JSON.parse(storedUser);
            setUser(userData);
            setIsAuthenticated(true);
            
            // Si ya hay datos en el store, no hacer fetch
            const store = useS3DataStore.getState();
            if (!store.data) {
              // Solo hacer fetch si no hay datos previos
              fetchS3Data();
            }
          }
        } else {
          // Si no está autenticado o el token expiró, limpiar estado
          authService.clearAuth();
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error al inicializar autenticación:', error);
        // Limpiar localStorage en caso de error
        authService.clearAuth();
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [fetchS3Data]);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const userData: User = await authService.login({ email, password });
      setUser(userData);
      setIsAuthenticated(true);
      
      // Pequeño delay para asegurar que el token se guarde en localStorage
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Hacer fetch inicial de datos después del login exitoso
      await fetchS3Data();
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error en logout:', error);
      // Aún así limpiar el estado local
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context: AuthContextType | undefined = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthProvider };
