//---------------------------------------------------------------------------------------------------------------------------

import type { DashboardData, S3Response } from '../types';
import { authService } from './auth.service';

//---------------------------------------------------------------------------------------------------------------------------

const API_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = API_URL;
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Agregar token de autorización si está disponible
    const token: string | null = authService.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async handleResponse(response: Response): Promise<Response> {
    if (response.status === 401) {
      console.log('Token expirado o inválido, ejecutando logout automático');
      authService.clearAuth();
      
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      
      throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente.');
    }
    
    return response;
  }

  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    // Verificar si el token ha expirado antes de hacer la petición
    if (authService.checkTokenExpiration()) {
      console.log('Token expirado detectado en fetchWithAuth, ejecutando logout automático');
      authService.clearAuth();
      
      // Redirigir al login si estamos en el navegador
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      
      throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente.');
    }

    const response: Response = await fetch(url, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    });

    return this.handleResponse(response);
  }

  async getDashboardFiles(): Promise<DashboardData> {
    try {
      console.log('Haciendo petición a:', `${this.baseUrl}/dashboard/file`);

      const response: Response = await this.fetchWithAuth(`${this.baseUrl}/dashboard/file`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorText: string = await response.text();
        console.error('Error en la respuesta:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data: DashboardData = await response.json();
      console.log('Datos recibidos del backend:', data);

      return data;
    } catch (error) {
      console.error('Error al obtener datos del dashboard:', error);
      throw error;
    }
  }

  async getS3DataJson(): Promise<S3Response> {
    try {
      console.log('Haciendo petición a:', `${this.baseUrl}/dashboard/data`);

      const response: Response = await this.fetchWithAuth(`${this.baseUrl}/dashboard/data`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorText: string = await response.text();
        console.error('Error en la respuesta:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data: S3Response = await response.json();

      return data;
    } catch (error) {
      console.error('Error al obtener datos S3:', error);
      throw error;
    }
  }

  // Metodo para probar la conexion basica
  async testConnection(): Promise<boolean> {
    try {
      console.log('Probando conexión con el backend...');
      const response: Response = await fetch(`${this.baseUrl}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: string = await response.text();
        console.log('Conexión exitosa:', data);
        return true;
      } else {
        console.log('Conexión fallida, status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      return false;
    }
  }
}

export const apiService: ApiService = new ApiService();