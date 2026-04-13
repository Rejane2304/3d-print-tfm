/**
 * RegisterForm Component
 * Formulario de registro con datos personales y dirección
 */
/* eslint-disable max-len */
'use client';

import { useState } from 'react';
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

  const updateField = (field: keyof RegisterData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'email') {
      onEmailChange(value);
    }
  };

  const validateForm = (): string | null => {
    if (formData.password !== formData.confirmarPassword) {
      return 'Las contraseñas no coinciden';
    }

    if (!isPasswordValid(formData.password)) {
      return 'La contraseña no cumple con todos los requisitos de seguridad';
    }

    if (!formData.direccion || !formData.codigoPostal || !formData.ciudad || !formData.provincia) {
      return 'Por favor, completa todos los campos de dirección obligatorios';
    }

    const cpRegex = /^\d{5}$/;
    if (!cpRegex.test(formData.codigoPostal)) {
      return 'El código postal debe tener 5 dígitos';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    onRegisterError('');

    const validationError = validateForm();
    if (validationError) {
      onRegisterError(validationError);
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
        onRegisterError(data.error || 'Error al registrar usuario');
      }
    } catch {
      onRegisterError('Error al registrar. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">¡Registro exitoso!</h3>
        <p className="text-gray-600">Redirigiendo al login...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Sección: Datos Personales */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
          <User className="h-4 w-4" />
          Datos Personales
        </h3>

        {/* Nombre */}
        <div className="mb-4">
          <label htmlFor="register-nombre" className="block text-sm font-medium text-gray-700 mb-2">
            Nombre completo *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="register-nombre"
              data-testid="register-name"
              name="nombre"
              type="text"
              required
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              placeholder="Tu nombre completo"
              value={formData.nombre}
              onChange={e => updateField('nombre', e.target.value)}
            />
          </div>
        </div>

        {/* Email */}
        <div className="mb-4">
          <label htmlFor="register-email" className="block text-sm font-medium text-gray-700 mb-2">
            Correo electrónico *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="register-email"
              data-testid="register-email"
              name="email"
              type="email"
              required
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              placeholder="tu@email.com"
              value={formData.email}
              onChange={e => updateField('email', e.target.value)}
            />
          </div>
        </div>

        {/* Teléfono */}
        <div className="mb-4">
          <label htmlFor="register-telefono" className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="register-telefono"
              name="telefono"
              type="tel"
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              placeholder="+34 600 123 456"
              value={formData.telefono}
              onChange={e => updateField('telefono', e.target.value)}
            />
          </div>
        </div>

        {/* Password */}
        <div className="mb-4">
          <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 mb-2">
            Contraseña *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="register-password"
              data-testid="register-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              placeholder="Mínimo 10 caracteres"
              value={formData.password}
              onChange={e => updateField('password', e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <PasswordStrength password={formData.password} />
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="register-confirm" className="block text-sm font-medium text-gray-700 mb-2">
            Confirmar contraseña *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="register-confirm"
              data-testid="register-confirm-password"
              name="confirmarPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              placeholder="Repite tu contraseña"
              value={formData.confirmarPassword}
              onChange={e => updateField('confirmarPassword', e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Sección: Dirección de Envío */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Dirección de Envío
        </h3>

        {/* Dirección */}
        <div className="mb-4">
          <label htmlFor="register-direccion" className="block text-sm font-medium text-gray-700 mb-2">
            Calle y número *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Home className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="register-direccion"
              name="direccion"
              type="text"
              required
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              placeholder="Calle Mayor 123"
              value={formData.direccion}
              onChange={e => updateField('direccion', e.target.value)}
            />
          </div>
        </div>

        {/* Complemento */}
        <div className="mb-4">
          <label htmlFor="register-complemento" className="block text-sm font-medium text-gray-700 mb-2">
            Piso, puerta, escalera <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Building className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="register-complemento"
              name="complemento"
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              placeholder="2º A"
              value={formData.complemento}
              onChange={e => updateField('complemento', e.target.value)}
            />
          </div>
        </div>

        {/* Código Postal */}
        <div className="mb-4">
          <label htmlFor="register-cp" className="block text-sm font-medium text-gray-700 mb-2">
            Código Postal *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Map className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="register-cp"
              name="codigoPostal"
              type="text"
              required
              maxLength={5}
              pattern="\d{5}"
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              placeholder="28001"
              value={formData.codigoPostal}
              onChange={e => updateField('codigoPostal', e.target.value)}
            />
          </div>
        </div>

        {/* Ciudad y Provincia - Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Ciudad */}
          <div>
            <label htmlFor="register-ciudad" className="block text-sm font-medium text-gray-700 mb-2">
              Ciudad *
            </label>
            <input
              id="register-ciudad"
              name="ciudad"
              type="text"
              required
              className="block w-full px-3 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              placeholder="Madrid"
              value={formData.ciudad}
              onChange={e => updateField('ciudad', e.target.value)}
            />
          </div>

          {/* Provincia */}
          <div>
            <label htmlFor="register-provincia" className="block text-sm font-medium text-gray-700 mb-2">
              Provincia *
            </label>
            <input
              id="register-provincia"
              name="provincia"
              type="text"
              required
              className="block w-full px-3 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              placeholder="Madrid"
              value={formData.provincia}
              onChange={e => updateField('provincia', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        data-testid="register-submit"
        disabled={isLoading}
        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        {isLoading ? (
          <div className="flex items-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
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
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        )}
      </button>

      {/* Terms */}
      <p className="text-xs text-center text-gray-500">
        Al registrarte, aceptas nuestros{' '}
        <button
          type="button"
          className="text-indigo-600 hover:text-indigo-500 underline cursor-pointer bg-transparent border-none p-0"
          tabIndex={0}
          aria-label="Términos y condiciones"
          onClick={() => {}}
        >
          términos y condiciones
        </button>{' '}
        y{' '}
        <button
          type="button"
          className="text-indigo-600 hover:text-indigo-500 underline cursor-pointer bg-transparent border-none p-0"
          tabIndex={0}
          aria-label="Política de privacidad"
          onClick={() => {}}
        >
          política de privacidad
        </button>
      </p>
    </form>
  );
}
