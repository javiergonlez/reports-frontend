//---------------------------------------------------------------------------------------------------------------------------

import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth.service';

//---------------------------------------------------------------------------------------------------------------------------

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Verificar expiracion del token solo al montar el componente
  useEffect(() => {
    if (isAuthenticated && authService.checkTokenExpiration()) {
      console.log('Token expirado detectado en ProtectedLayout');
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
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}; 

export { ProtectedLayout };