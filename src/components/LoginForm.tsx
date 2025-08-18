//---------------------------------------------------------------------------------------------------------------------------

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextInput,
  PasswordInput,
  Button,
  Text,
  Loader
} from '@mantine/core';
import { useAuth } from '../contexts/AuthContext';
import { validateLoginForm } from '../utils/validation';
import type { LoginCredentials, ValidationError } from '../types';
import './auth.css';

//---------------------------------------------------------------------------------------------------------------------------

interface LoginFormProps {
  onSuccess?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  // TODO: AJUSTAR DETALLES
  
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const handleInputChange = (field: keyof LoginCredentials) => (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const value: string = event.target.value.trim();
    setCredentials((prev: LoginCredentials) => ({
      ...prev,
      [field]: value
    }));

    // Limpiar errores específicos del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors((prev: { [key: string]: string }) => {
        const newErrors: { [key: string]: string } = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Limpiar error general cuando el usuario empiece a escribir
    if (generalError) {
      setGeneralError(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setErrors({});
    setGeneralError(null);

    // Validación del frontend (mismas reglas que el backend)
    const validation = validateLoginForm(credentials.email, credentials.password);

    if (!validation.isValid) {
      const fieldErrors: { [key: string]: string } = {};
      validation.errors.forEach((error: ValidationError) => {
        fieldErrors[error.field] = error.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      await login(
        credentials.email.trim().toLowerCase(),
        credentials.password
      );

      onSuccess?.();
      navigate('/'); // Redirigir a la pagina principal
    } catch (err) {
      const errorMessage: string = err instanceof Error ? err.message : 'Error desconocido';
      setGeneralError(errorMessage);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-left-section">
        <div className="auth-form-container">
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-input-group">
              <TextInput
                label="Ingresá tu E-mail"
                placeholder="Ingresá tu E-mail de acceso"
                value={credentials.email}
                onChange={handleInputChange('email')}
                type="email"
                autoComplete="username"
                error={errors.email}
                classNames={{
                  input: 'auth-input',
                  label: 'auth-label',
                  error: 'auth-error'
                }}
              />

              <PasswordInput
                label="Ingresá tu Contraseña"
                placeholder="Tu clave de acceso"
                value={credentials.password}
                onChange={handleInputChange('password')}
                minLength={6}
                autoComplete="current-password"
                error={errors.password}
                classNames={{
                  input: 'auth-input',
                  label: 'auth-label',
                  error: 'auth-error'
                }}
              />
            </div>

            <div className="auth-button-group">
              <Button
                type="submit"
                variant='filled'
                className="auth-submit-button"
                loading={isLoading}
                size='lg'
                h={62}
              >
                {isLoading ? 'INICIANDO SESIÓN...' : 'INICIAR SESIÓN'}
              </Button>

              <div className="auth-error-container">
                {isLoading && (
                  <div className="auth-loading">
                    <Loader color="blue" type="dots" />
                  </div>
                )}
                {generalError && (
                  <Text c="red" className="auth-error-message">
                    {generalError}
                  </Text>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      <div
        className="auth-right-section"
        style={{
          backgroundImage: 'url(/auth-background.jpg)'
        }}
      />
    </div>
  );
}; 

export { LoginForm };