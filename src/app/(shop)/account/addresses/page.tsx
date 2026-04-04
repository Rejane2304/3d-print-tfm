/**
 * Página de Mis Direcciones - Usuario
 * Gestión completa de direcciones de envío
 */
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Star,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Home,
  Building,
  Phone,
  User,
  Navigation
} from 'lucide-react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface Direccion {
  id: string;
  nombre: string;
  destinatario: string;
  telefono: string;
  direccion: string;
  complemento?: string;
  postalCode: string;
  ciudad: string;
  provincia: string;
  isPrimary: boolean;
  createdAt: string;
}

export default function MisDireccionesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [direcciones, setDirecciones] = useState<Direccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalEliminarOpen, setModalEliminarOpen] = useState(false);
  const [direccionAEliminar, setDireccionAEliminar] = useState<Direccion | null>(null);
  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [direccionEditando, setDireccionEditando] = useState<Direccion | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    destinatario: '',
    telefono: '',
    direccion: '',
    complemento: '',
    postalCode: '',
    ciudad: '',
    provincia: '',
    isPrimary: false
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth?callbackUrl=/account/direcciones');
      return;
    }

    if (status === 'authenticated') {
      cargarDirecciones();
    }
  }, [status, router]);

  const cargarDirecciones = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/account/direcciones');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar direcciones');
      }

      setDirecciones(data.direcciones || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error unknown');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = '/api/account/direcciones';
      const method = direccionEditando ? 'PATCH' : 'POST';
      const body = direccionEditando 
        ? { id: direccionEditando.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar dirección');
      }

      await cargarDirecciones();
      cerrarModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error unknown');
    } finally {
      setSaving(false);
    }
  };

  const eliminarDireccion = async () => {
    if (!direccionAEliminar) return;

    try {
      const response = await fetch(`/api/account/direcciones?id=${direccionAEliminar.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al eliminar');
      }

      await cargarDirecciones();
      setModalEliminarOpen(false);
      setDireccionAEliminar(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error unknown');
    }
  };

  const marcarComoPrincipal = async (id: string) => {
    try {
      const response = await fetch('/api/account/direcciones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isPrimary: true })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al actualizar');
      }

      await cargarDirecciones();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error unknown');
    }
  };

  const abrirModalNueva = () => {
    setDireccionEditando(null);
    setFormData({
      nombre: '',
      destinatario: session?.user?.name || '',
      telefono: '',
      direccion: '',
      complemento: '',
      postalCode: '',
      ciudad: '',
      provincia: '',
      isPrimary: direcciones.length === 0
    });
    setModalFormOpen(true);
    setError(null);
  };

  const abrirModalEditar = (direccion: Direccion) => {
    setDireccionEditando(direccion);
    setFormData({
      nombre: direccion.nombre,
      destinatario: direccion.destinatario,
      telefono: direccion.telefono,
      direccion: direccion.direccion,
      complemento: direccion.complemento || '',
      postalCode: direccion.postalCode,
      ciudad: direccion.ciudad,
      provincia: direccion.provincia,
      isPrimary: direccion.isPrimary
    });
    setModalFormOpen(true);
    setError(null);
  };

  const cerrarModal = () => {
    setModalFormOpen(false);
    setDireccionEditando(null);
    setError(null);
  };

  const confirmarEliminar = (direccion: Direccion) => {
    setDireccionAEliminar(direccion);
    setModalEliminarOpen(true);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando direcciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mis Direcciones</h1>
              <p className="mt-2 text-gray-600">
                {direcciones.length} de 2 direcciones guardadas
              </p>
            </div>
            <Link
              href="/account"
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              ← Volver a mi cuenta
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error */}
        {error && !modalFormOpen && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Lista de direcciones */}
        {direcciones.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes direcciones guardadas</h3>
            <p className="text-gray-500 mb-6">
              Agrega una dirección para poder realizar pedidos
            </p>
            <button
              onClick={abrirModalNueva}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Agregar dirección
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {direcciones.map((direccion) => (
                <div
                  key={direccion.id}
                  className={`bg-white rounded-lg shadow-sm border overflow-hidden ${
                    direccion.isPrimary ? 'border-indigo-500 ring-1 ring-indigo-500' : ''
                  }`}
                >
                  {/* Header de la dirección */}
                  <div className="p-6 border-b">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{direccion.nombre}</h3>
                        {direccion.isPrimary && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                            <Star className="h-3 w-3 fill-current" />
                            Principal
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => abrirModalEditar(direccion)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => confirmarEliminar(direccion)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="p-6 space-y-3">
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">{direccion.destinatario}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="text-sm">
                        <p className="text-gray-900">{direccion.direccion}</p>
                        {direccion.complemento && (
                          <p className="text-gray-600">{direccion.complemento}</p>
                        )}
                        <p className="text-gray-900">
                          {direccion.postalCode} {direccion.ciudad}
                        </p>
                        <p className="text-gray-600">{direccion.provincia}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-700">{direccion.telefono}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 bg-gray-50 border-t">
                    {!direccion.isPrimary ? (
                      <button
                        onClick={() => marcarComoPrincipal(direccion.id)}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Establecer como dirección principal
                      </button>
                    ) : (
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        Dirección principal
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Botón agregar más */}
            {direcciones.length < 2 && (
              <div className="mt-6 text-center">
                <button
                  onClick={abrirModalNueva}
                  className="inline-flex items-center gap-2 border-2 border-dashed border-gray-300 text-gray-600 px-6 py-3 rounded-lg font-medium hover:border-indigo-500 hover:text-indigo-600 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  Agregar otra dirección
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de formulario */}
      {modalFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={cerrarModal} />
            
            <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {direccionEditando ? 'Editar dirección' : 'Nueva dirección'}
                </h2>
                <button
                  onClick={cerrarModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la dirección *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Casa, Trabajo, Casa de mis padres"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Destinatario *
                    </label>
                    <input
                      type="text"
                      value={formData.destinatario}
                      onChange={(e) => setFormData({ ...formData, destinatario: e.target.value })}
                      placeholder="Nombre y apellidos"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      placeholder="612345678"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección *
                  </label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    placeholder="Calle, número, piso..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Complemento (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.complemento}
                    onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                    placeholder="Piso, puerta, escalera..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código Postal *
                    </label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      placeholder="28001"
                      maxLength={5}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ciudad *
                    </label>
                    <input
                      type="text"
                      value={formData.ciudad}
                      onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                      placeholder="Madrid"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provincia *
                  </label>
                  <input
                    type="text"
                    value={formData.provincia}
                    onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                    placeholder="Madrid"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>

                {!direccionEditando?.isPrimary && direcciones.length > 0 && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPrimary"
                      checked={formData.isPrimary}
                      onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isPrimary" className="text-sm text-gray-700">
                      Establecer como dirección principal
                    </label>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={cerrarModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {direccionEditando ? 'Guardar cambios' : 'Agregar dirección'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      <ConfirmModal
        isOpen={modalEliminarOpen}
        onClose={() => {
          setModalEliminarOpen(false);
          setDireccionAEliminar(null);
        }}
        onConfirm={eliminarDireccion}
        title="¿Eliminar dirección?"
        description={`¿Estás seguro de que deseas eliminar la dirección "${direccionAEliminar?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        type="danger"
      />
    </div>
  );
}
