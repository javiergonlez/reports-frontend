//---------------------------------------------------------------------------------------------------------------------------

import type { ValidationError, ValidationResult } from '../types';

//---------------------------------------------------------------------------------------------------------------------------

const validateEmail = (email: string): ValidationError | null => {
  if (!email) {
    return {
      field: 'email',
      message: 'El email es requerido'
    };
  }

  const emailRegex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      field: 'email',
      message: 'El formato del email no es válido'
    };
  }

  return null;
}

const validatePassword = (password: string): ValidationError | null => {
  if (!password) {
    return {
      field: 'password',
      message: 'La contraseña es requerida'
    };
  }

  if ('string' !== typeof password) {
    return {
      field: 'password',
      message: 'La contraseña debe ser una cadena de texto'
    };
  }

  if (6 > password.length) {
    return {
      field: 'password',
      message: 'La contraseña debe tener al menos 6 caracteres'
    };
  }

  return null;
}

const validateLoginForm = (email: string, password: string): ValidationResult => {
  const errors: ValidationError[] = [];

  const emailError: ValidationError | null = validateEmail(email);
  if (emailError) {
    errors.push(emailError);
  }

  const passwordError: ValidationError | null = validatePassword(password);
  if (passwordError) {
    errors.push(passwordError);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export { validateEmail, validatePassword, validateLoginForm };