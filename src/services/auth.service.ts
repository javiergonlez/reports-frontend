//---------------------------------------------------------------------------------------------------------------------------

import type { LoginRequest, LoginResponse, LogoutResponse, User } from '../types';

//---------------------------------------------------------------------------------------------------------------------------

const API_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class AuthService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = API_URL;
  }

  async login(credentials: LoginRequest): Promise<User> {
    try {
      console.log('Iniciando login...');

      const response: Response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        console.log(errorBody.message)
        try {
          console.log("auth...")
        } catch {
          throw new Error(`${errorBody.message}`);
        }
      }

      const data: LoginResponse = await response.json();
      console.log('Login exitoso:', data);

      // Guardar informacion del usuario, token y fecha de expiracion en localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      localStorage.setItem('tokenExpiresAt', data.expiresAt.toString());
      localStorage.setItem('isAuthenticated', 'true');

      return data.user;
    } catch (error) {
      console.error('Error en login:', error);

      // Limpiar localStorage en caso de error
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('tokenExpiresAt');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('s3-data-storage');

      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      console.log('Iniciando logout...');

      const token = localStorage.getItem('token');

      if (token) {
        const response: Response = await fetch(`${this.baseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorText: string = await response.text();
          console.error('Error en logout:', errorText);
          throw new Error(`Logout failed: ${response.status} - ${errorText}`);
        }

        const data: LogoutResponse = await response.json();
        console.log('Logout exitoso:', data);
      }

      // Limpiar localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('tokenExpiresAt');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('s3-data-storage');
    } catch (error) {
      console.error('Error en logout:', error);
      // Aún así limpiar localStorage en caso de error
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('tokenExpiresAt');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('s3-data-storage');
      throw error;
    }
  }

  // Metodo para obtener el token del localStorage
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Metodo para verificar si el token ha expirado
  isTokenExpired(): boolean {
    const expiresAt: string | null = localStorage.getItem('tokenExpiresAt');

    if (!expiresAt) {
      console.log('No hay fecha de expiración, token expirado');
      return true;
    }

    try {
      const expirationTime: number = parseInt(expiresAt, 10);
      const currentTime: number = Date.now();

      // Verificar que la fecha sea válida
      if (isNaN(expirationTime)) {
        console.log('Fecha de expiración inválida, token expirado');
        return true;
      }

      const isExpired: boolean = currentTime > expirationTime;

      return isExpired;
    } catch (error) {
      console.error('Error al verificar expiración del token:', error);
      return true; // Si hay error, considerar como expirado
    }
  }

  // Metodo para verificar y manejar la expiracion del token
  checkTokenExpiration(): boolean {
    if (this.isTokenExpired()) {
      console.log('Token expirado detectado');
      return true; // Token expirado
    }
    return false; // Token valido
  }

  // Metodo para verificar si el usuario esta autenticado
  isAuthenticated(): boolean {
    const isAuth: string | null = localStorage.getItem('isAuthenticated');
    const token: string | null = localStorage.getItem('token');
    const user: string | null = localStorage.getItem('user');

    if (!isAuth || !token || !user) return false;

    // Verificar si el token ha expirado
    if (this.isTokenExpired()) {
      this.clearAuth();
      return false;
    }

    return true;
  }

  // Limpiar la autenticacion
  clearAuth(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiresAt');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('s3-data-storage');
  }
}

export const authService: AuthService = new AuthService(); 