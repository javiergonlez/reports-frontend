//---------------------------------------------------------------------------------------------------------------------------

import type { LoginRequest, LoginResponse, User } from '../types';

//---------------------------------------------------------------------------------------------------------------------------

const API_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const login = async (credentials: LoginRequest): Promise<User> => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData: unknown & {message: string} = await response.json();
      throw new Error(errorData.message || 'Error de autenticación');
    }

    const data: LoginResponse = await response.json();

    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('token', data.token);
    localStorage.setItem('tokenExpiresAt', data.expiresAt.toString());
    localStorage.setItem('isAuthenticated', 'true');

    return data.user;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error de conexión');
  }
};

const logout = async (): Promise<void> => {
  try {
    const token: string | null = localStorage.getItem('token');

    if (token) {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
    }
  } catch (error) {
    // Error en logout
  } finally {
    // Limpiar localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiresAt');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('s3-data-storage');
  }
};

const getToken = (): string | null => {
  return localStorage.getItem('token');
};

const isTokenExpired = (): boolean => {
  const expiresAt: string | null = localStorage.getItem('tokenExpiresAt');

  if (!expiresAt) {
    return true;
  }

  try {
    const expirationTime: number = parseInt(expiresAt, 10);
    const currentTime: number = Date.now();

    if (isNaN(expirationTime)) {
      return true;
    }

    return currentTime > expirationTime;
  } catch (error) {
    return true;
  }
};

const isAuthenticated = (): boolean => {
  const isAuth: string | null = localStorage.getItem('isAuthenticated');
  const token: string | null = localStorage.getItem('token');
  const user: string | null = localStorage.getItem('user');

  if (!isAuth || !token || !user) return false;

  if (isTokenExpired()) {
    clearAuth();
    return false;
  }

  return true;
};

const clearAuth = (): void => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  localStorage.removeItem('tokenExpiresAt');
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('s3-data-storage');
};

export { login, logout, getToken, isTokenExpired, isAuthenticated, clearAuth };
