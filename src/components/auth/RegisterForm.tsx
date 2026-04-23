/**
 * RegisterForm Component
 * Formulario de registro con datos personales y dirección
 * Mejoras de accesibilidad: labels asociados, aria-invalid, aria-describedby
 */
 
'use client';

import { useState, useId } from 'react';
import {
  ArrowRight,
  Building,
  CheckCircle2,
  Eye,
  EyeOff,
  Home,
  Lock,
  Mail,
  Map,
  MapPin,
  Phone,
  User,
} from 'lucide-react';
import PasswordStrength, { isPasswordValid } from './PasswordStrength';

interface RegisterData {
  nombre: string;
  email: string;
  password: string;
  confirmarPassword: string;
  telefono: string;
  direccion: string;
  complemento: string;
  codigoPostal: string;
  ciudad: string;
  provincia: string;
}

interface RegisterFormProps {
  initialEmail: string;
  onEmailChange: (email: string) => void;
  onRegisterSuccess: () => void;
  onRegisterError: (error: string) => void;
}

export default function RegisterForm({
  initialEmail,
  onEmailChange,
  onRegisterSuccess,
  onRegisterError,
}: Readonly<RegisterFormProps>) {
  const [formData, setFormData] = useState<RegisterData>({
    nombre: '',
    email: initialEmail,
    password: '',
    confirmarPassword: '',
    telefono: '',
    direccion: '',
    complemento: '',
    codigoPostal: '',
    ciudad: '',
    provincia: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Unique IDs for accessibility
  const ids = {
    nombre: useId(),
    email: useId(),
    telefono: useId(),
    password: useId(),
    confirmarPassword: useId(),
    direccion: useId(),
    complemento: useId(),
    codigoPostal: useId(),
    ciudad: useId(),
    provincia: useId(),
  };

  const updateField = (field: keyof RegisterData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user types
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (error) setError(null);

    if (field === 'email') {
      onEmailChange(value);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (formData.password !== formData.confirmarPassword) {
      errors.confirmarPassword = 'Las contraseñas no coinciden';
    }

    if (!isPasswordValid(formData.password)) {
      errors.password = 'La contraseña no cumple con todos los requisitos de seguridad';
    }

    if (!formData.direccion) {
      errors.direccion = 'La dirección es obligatoria';
    }
    if (!formData.codigoPostal) {
      errors.codigoPostal = 'El código postal es obligatorio';
    }
    if (!formData.ciudad) {
      errors.ciudad = 'La ciudad es obligatoria';
    }
    if (!formData.provincia) {
      errors.provincia = 'La provincia es obligatoria';
    }

    const cpRegex = /^\d{5}$/;
    if (formData.codigoPostal && !cpRegex.test(formData.codigoPostal)) {
      errors.codigoPostal = 'El código postal debe tener 5 dígitos';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    onRegisterError('');

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
          email: formData.email,
          password: formData.password,
          telefono: formData.telefono || undefined,
          direccion: {
            nombre: 'Principal',
            destinatario: formData.nombre,
            telefono: formData.telefono || '',
            direccion: formData.direccion,
            complemento: formData.complemento || undefined,
            codigoPostal: formData.codigoPostal,
            ciudad: formData.ciudad,
            provincia: formData.provincia,
            esPrincipal: true,
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        onRegisterSuccess();
      } else {
        const errorMsg = data.error || 'Error al registrar usuario';
        setError(errorMsg);
        onRegisterError(errorMsg);
      }
    } catch {
      const errorMsg = 'Error al registrar. Inténtalo de nuevo.';
      setError(errorMsg);
      onRegisterError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-8" role="status" aria-live="polite">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" aria-hidden="true" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">¡Registro exitoso!</h3>
        <p className="text-gray-600">Redirigiendo al login...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-busy={isLoading}>
      {/* Global Error */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
        >
          {error}
        </div>
      )}

      {/* Sección: Datos Personales */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
          <User className="h-4 w-4" aria-hidden="true" />
          Datos Personales
        </h3>

        {/* Nombre */}
        <div className="mb-4">
          <label htmlFor={ids.nombre} className="block text-sm font-medium text-gray-700 mb-2">
            Nombre completo <span aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              id={ids.nombre}
              data-testid="register-name"
              name="nombre"
              type="text"
              required
              aria-required="true"
              aria-invalid={!!fieldErrors.nombre}
              aria-describedby={fieldErrors.nombre ? `${ids.nombre}-error` : undefined}
              autoComplete="name"
              className={`block w-full pl-10 pr-3 py-3 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                fieldErrors.nombre ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Tu nombre completo"
              value={formData.nombre}
              onChange={e => updateField('nombre', e.target.value)}
            />
          </div>
          {fieldErrors.nombre && (
            <p id={`${ids.nombre}-error`} className="mt-1 text-sm text-red-600" role="alert">
              {fieldErrors.nombre}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="mb-4">
          <label htmlFor={ids.email} className="block text-sm font-medium text-gray-700 mb-2">
            Correo electrónico <span aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              id={ids.email}
              data-testid="register-email"
              name="email"
              type="email"
              required
              aria-required="true"
              autoComplete="email"
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              placeholder="tu@email.com"
              value={formData.email}
              onChange={e => updateField('email', e.target.value)}
            />
          </div>
        </div>

        {/* Teléfono */}
        <div className="mb-4">
          <label htmlFor={ids.telefono} className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              id={ids.telefono}
              name="telefono"
              type="tel"
              autoComplete="tel"
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              placeholder="+34 600 123 456"
              value={formData.telefono}
              onChange={e => updateField('telefono', e.target.value)}
            />
          </div>
        </div>

        {/* Password */}
        <div className="mb-4">
          <label htmlFor={ids.password} className="block text-sm font-medium text-gray-700 mb-2">
            Contraseña <span aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              id={ids.password}
              data-testid="register-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              aria-required="true"
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? `${ids.password}-error` : undefined}
              autoComplete="new-password"
              className={`block w-full pl-10 pr-12 py-3 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                fieldErrors.password ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Mínimo 10 caracteres"
              value={formData.password}
              onChange={e => updateField('password', e.target.value)}
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
          {fieldErrors.password && (
            <p id={`${ids.password}-error`} className="mt-1 text-sm text-red-600" role="alert">
              {fieldErrors.password}
            </p>
          )}
          <PasswordStrength password={formData.password} />
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor={ids.confirmarPassword} className="block text-sm font-medium text-gray-700 mb-2">
            Confirmar contraseña <span aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              id={ids.confirmarPassword}
              data-testid="register-confirm-password"
              name="confirmarPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              aria-required="true"
              aria-invalid={!!fieldErrors.confirmarPassword}
              aria-describedby={fieldErrors.confirmarPassword ? `${ids.confirmarPassword}-error` : undefined}
              autoComplete="new-password"
              className={`block w-full pl-10 pr-12 py-3 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                fieldErrors.confirmarPassword ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Repite tu contraseña"
              value={formData.confirmarPassword}
              onChange={e => updateField('confirmarPassword', e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={showConfirmPassword}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Eye className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
          {fieldErrors.confirmarPassword && (
            <p id={`${ids.confirmarPassword}-error`} className="mt-1 text-sm text-red-600" role="alert">
              {fieldErrors.confirmarPassword}
            </p>
          )}
        </div>
      </div>

      {/* Sección: Dirección de Envío */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
          <MapPin className="h-4 w-4" aria-hidden="true" />
          Dirección de Envío
        </h3>

        {/* Dirección */}
        <div className="mb-4">
          <label htmlFor={ids.direccion} className="block text-sm font-medium text-gray-700 mb-2">
            Calle y número <span aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Home className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              id={ids.direccion}
              name="direccion"
              type="text"
              required
              aria-required="true"
              aria-invalid={!!fieldErrors.direccion}
              aria-describedby={fieldErrors.direccion ? `${ids.direccion}-error` : undefined}
              autoComplete="street-address"
              className={`block w-full pl-10 pr-3 py-3 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                fieldErrors.direccion ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Calle Mayor 123"
              value={formData.direccion}
              onChange={e => updateField('direccion', e.target.value)}
            />
          </div>
          {fieldErrors.direccion && (
            <p id={`${ids.direccion}-error`} className="mt-1 text-sm text-red-600" role="alert">
              {fieldErrors.direccion}
            </p>
          )}
        </div>

        {/* Complemento */}
        <div className="mb-4">
          <label htmlFor={ids.complemento} className="block text-sm font-medium text-gray-700 mb-2">
            Piso, puerta, escalera <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Building className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              id={ids.complemento}
              name="complemento"
              type="text"
              autoComplete="address-line2"
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              placeholder="2º A"
              value={formData.complemento}
              onChange={e => updateField('complemento', e.target.value)}
            />
          </div>
        </div>

        {/* Código Postal */}
        <div className="mb-4">
          <label htmlFor={ids.codigoPostal} className="block text-sm font-medium text-gray-700 mb-2">
            Código Postal <span aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Map className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              id={ids.codigoPostal}
              name="codigoPostal"
              type="text"
              required
              aria-required="true"
              aria-invalid={!!fieldErrors.codigoPostal}
              aria-describedby={fieldErrors.codigoPostal ? `${ids.codigoPostal}-error` : undefined}
              autoComplete="postal-code"
              maxLength={5}
              pattern="\d{5}"
              className={`block w-full pl-10 pr-3 py-3 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                fieldErrors.codigoPostal ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="28001"
              value={formData.codigoPostal}
              onChange={e => updateField('codigoPostal', e.target.value)}
            />
          </div>
          {fieldErrors.codigoPostal && (
            <p id={`${ids.codigoPostal}-error`} className="mt-1 text-sm text-red-600" role="alert">
              {fieldErrors.codigoPostal}
            </p>
          )}
        </div>

        {/* Ciudad y Provincia - Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Ciudad */}
          <div>
            <label htmlFor={ids.ciudad} className="block text-sm font-medium text-gray-700 mb-2">
              Ciudad <span aria-hidden="true">*</span>
            </label>
            <input
              id={ids.ciudad}
              name="ciudad"
              type="text"
              required
              aria-required="true"
              aria-invalid={!!fieldErrors.ciudad}
              aria-describedby={fieldErrors.ciudad ? `${ids.ciudad}-error` : undefined}
              autoComplete="address-level2"
              className={`block w-full px-3 py-3 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                fieldErrors.ciudad ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Madrid"
              value={formData.ciudad}
              onChange={e => updateField('ciudad', e.target.value)}
            />
            {fieldErrors.ciudad && (
              <p id={`${ids.ciudad}-error`} className="mt-1 text-sm text-red-600" role="alert">
                {fieldErrors.ciudad}
              </p>
            )}
          </div>

          {/* Provincia */}
          <div>
            <label htmlFor={ids.provincia} className="block text-sm font-medium text-gray-700 mb-2">
              Provincia <span aria-hidden="true">*</span>
            </label>
            <input
              id={ids.provincia}
              name="provincia"
              type="text"
              required
              aria-required="true"
              aria-invalid={!!fieldErrors.provincia}
              aria-describedby={fieldErrors.provincia ? `${ids.provincia}-error` : undefined}
              autoComplete="address-level1"
              className={`block w-full px-3 py-3 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                fieldErrors.provincia ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Madrid"
              value={formData.provincia}
              onChange={e => updateField('provincia', e.target.value)}
            />
            {fieldErrors.provincia && (
              <p id={`${ids.provincia}-error`} className="mt-1 text-sm text-red-600" role="alert">
                {fieldErrors.provincia}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        data-testid="register-submit"
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
            Registrando...
          </div>
        ) : (
          <div className="flex items-center">
            Registrarse
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </div>
        )}
      </button>

      {/* Terms */}
      <p className="text-xs text-center text-gray-500">
        Al registrarte, aceptas nuestros{' '}
        <a href="/terms" className="text-indigo-600 hover:text-indigo-500 underline">
          términos y condiciones
        </a>{' '}
        y{' '}
        <a href="/privacy" className="text-indigo-600 hover:text-indigo-500 underline">
          política de privacidad
        </a>
      </p>
    </form>
  );
}
