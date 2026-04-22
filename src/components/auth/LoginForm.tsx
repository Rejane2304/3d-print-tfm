/**
 * LoginForm Component
 * Formulario de inicio de sesión con mejoras de accesibilidad
 * - Labels asociados a inputs
 * - Estados aria-invalid y aria-describedby
 * - Mensajes de error accesibles
 * - Focus management
 */
'use client';

import { useState, useId } from 'react';
import { signIn } from 'next-auth/react';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';

interface LoginFormProps {
  email: string;
  onEmailChange: (email: string) => void;
  onLoginStart: () => void;
  onLoginError: (error: string) => void;
  onLoginSuccess: () => Promise<void>;
}

export default function LoginForm({
  email,
  onEmailChange,
  onLoginStart,
  onLoginError,
  onLoginSuccess,
}: Readonly<LoginFormProps>) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate unique IDs for accessibility
  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    onLoginStart();

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        const errorMsg = 'Email o contraseña incorrectos';
        setError(errorMsg);
        onLoginError(errorMsg);
      } else {
        await onLoginSuccess();
      }
    } catch {
      const errorMsg = 'Error al iniciar sesión. Inténtalo de nuevo.';
      setError(errorMsg);
      onLoginError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} data-testid="login-form" className="space-y-5" aria-busy={isLoading}>
      {/* Error message */}
      {error && (
        <div
          id={errorId}
          role="alert"
          aria-live="assertive"
          className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
        >
          {error}
        </div>
      )}

      {/* Email Field */}
      <div>
        <label htmlFor={emailId} className="block text-sm font-medium text-gray-700 mb-2">
          Correo electrónico
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            id={emailId}
            data-testid="login-email"
            type="email"
            required
            autoComplete="email"
            aria-required="true"
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={`block w-full pl-10 pr-3 py-3 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${
              error
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-indigo-500 focus:border-transparent'
            }`}
            placeholder="tu@email.com"
            value={email}
            onChange={e => {
              onEmailChange(e.target.value);
              if (error) setError(null);
            }}
          />
        </div>
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor={passwordId} className="block text-sm font-medium text-gray-700 mb-2">
          Contraseña
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            id={passwordId}
            data-testid="login-password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            aria-required="true"
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={`block w-full pl-10 pr-12 py-3 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${
              error
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-indigo-500 focus:border-transparent'
            }`}
            placeholder="••••••••"
            value={password}
            onChange={e => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={showPassword}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Eye className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        data-testid="login-submit"
        disabled={isLoading}
        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
        aria-busy={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Iniciando sesión...
          </div>
        ) : (
          <div className="flex items-center">
            Iniciar sesión
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </div>
        )}
      </button>
    </form>
  );
}
