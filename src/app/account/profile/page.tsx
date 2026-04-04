/**
 * Página de Perfil de Usuario
 * Edición de datos personales
 */
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Phone, 
  CreditCard,
  Lock,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';

interface PerfilData {
  nombre: string;
  email: string;
  telefono: string;
  nif: string;
}

interface UpdateProfileBody {
  nombre: string;
  telefono?: string;
  nif?: string;
  passwordActual?: string;
  passwordNuevo?: string;
}

export default function PerfilPage() {
  const { status, update } = useSession();
  const router = useRouter();
  const [perfil, setPerfil] = useState<PerfilData>({
    nombre: '',
    email: '',
    telefono: '',
    nif: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Campos de contraseña
  const [cambiarPassword, setCambiarPassword] = useState(false);
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNuevo, setPasswordNuevo] = useState('');
  const [passwordConfirmar, setPasswordConfirmar] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/account/perfil');
      return;
    }

    if (status === 'authenticated') {
      cargarPerfil();
    }
  }, [status, router]);

  const cargarPerfil = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/account/perfil');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar perfil');
      }

      setPerfil({
        nombre: data.usuario.nombre || '',
        email: data.usuario.email || '',
        telefono: data.usuario.telefono || '',
        nif: data.usuario.nif || ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error unknown');
    } finally {
      setLoading(false);
    }
  };

  const guardarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Validar contraseñas si se está cambiando
      if (cambiarPassword) {
        if (passwordNuevo !== passwordConfirmar) {
          throw new Error('Las contraseñas no coinciden');
        }
        if (passwordNuevo.length < 8) {
          throw new Error('La contraseña debe tener al menos 8 caracteres');
        }
      }

      const body: UpdateProfileBody = {
        nombre: perfil.nombre,
        telefono: perfil.telefono || undefined,
        nif: perfil.nif || undefined
      };

      if (cambiarPassword) {
        body.passwordActual = passwordActual;
        body.passwordNuevo = passwordNuevo;
      }

      const response = await fetch('/api/account/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar');
      }

      setSuccess('Perfil actualizado correctamente');
      
      // Limpiar campos de contraseña
      if (cambiarPassword) {
        setPasswordActual('');
        setPasswordNuevo('');
        setPasswordConfirmar('');
        setCambiarPassword(false);
      }

      // Actualizar sesión
      await update();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error unknown');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-600 mt-2">
            Gestiona tus datos personales y preferencias de cuenta
          </p>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={guardarPerfil} className="space-y-6">
          {/* Información Personal */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={perfil.nombre}
                  onChange={(e) => setPerfil({ ...perfil, nombre: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                  minLength={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={perfil.email}
                  disabled
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100 text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  El email no se puede modificar
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={perfil.telefono}
                    onChange={(e) => setPerfil({ ...perfil, telefono: e.target.value })}
                    placeholder="+34 600 123 456"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NIF / DNI
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={perfil.nif}
                    onChange={(e) => setPerfil({ ...perfil, nif: e.target.value.toUpperCase() })}
                    placeholder="12345678A"
                    maxLength={9}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cambiar Contraseña */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Seguridad
            </h2>
            
            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cambiarPassword}
                  onChange={(e) => setCambiarPassword(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">
                  Cambiar contraseña
                </span>
              </label>
            </div>

            {cambiarPassword && (
              <div className="space-y-4 border-t border-gray-200 pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña actual
                  </label>
                  <div className="relative">
                    <input
                      type={mostrarPassword ? 'text' : 'password'}
                      value={passwordActual}
                      onChange={(e) => setPasswordActual(e.target.value)}
                      className="w-full pr-10 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required={cambiarPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarPassword(!mostrarPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {mostrarPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    value={passwordNuevo}
                    onChange={(e) => setPasswordNuevo(e.target.value)}
                    minLength={8}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required={cambiarPassword}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Mínimo 8 caracteres
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar nueva contraseña
                  </label>
                  <input
                    type="password"
                    value={passwordConfirmar}
                    onChange={(e) => setPasswordConfirmar(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required={cambiarPassword}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Guardar cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
