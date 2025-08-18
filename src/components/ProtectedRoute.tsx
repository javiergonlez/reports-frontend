//---------------------------------------------------------------------------------------------------------------------------

import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isTokenExpired, clearAuth } from '../services/auth.service';

//---------------------------------------------------------------------------------------------------------------------------

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/login' 
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Verificar expiración del token solo al montar el componente
  useEffect(() => {
    if (isAuthenticated && isTokenExpired()) {
      
      clearAuth();
      // El contexto de auth manejará la redirección
    }
  }, [isAuthenticated]); // Solo se ejecuta al montar el componente

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}; 

export { ProtectedRoute };