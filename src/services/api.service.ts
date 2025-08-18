//---------------------------------------------------------------------------------------------------------------------------

import type { DashboardData, S3Response } from '../types';
import { getToken, clearAuth, isTokenExpired } from './auth.service';

//---------------------------------------------------------------------------------------------------------------------------

const API_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const token: string | null = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers
};

const handleResponse = async (response: Response): Promise<Response> => {
  if (response.status === 401) {
    clearAuth();

    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }

    throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente.');
  }

  return response;
};

const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  if (isTokenExpired()) {
    
    clearAuth();

    // Redirigir al login si estamos en el navegador
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }

    throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente.');
  }

  const response: Response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  return handleResponse(response);
};

const getDashboardFiles = async (): Promise<DashboardData> => {
  try {
    

    const response: Response = await fetchWithAuth(`${API_URL}/dashboard/file`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorText: string = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data: DashboardData = await response.json();
    

    return data;
  } catch (error) {
    throw error;
  }
};

const getS3DataJson = async (): Promise<S3Response> => {
  try {
    

    const response: Response = await fetchWithAuth(`${API_URL}/dashboard/data`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorText: string = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data: S3Response = await response.json();

    return data;
  } catch (error) {
    throw error;
  }
};
export { getDashboardFiles, getS3DataJson };

