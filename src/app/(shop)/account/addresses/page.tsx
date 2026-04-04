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
  Phone,
  User
} from 'lucide-react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface Address {
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

export default function MyAddressesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
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
      loadAddresses();
    }
  }, [status, router]);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/account/direcciones');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar direcciones');
      }

      setAddresses(data.direcciones || []);
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
      const method = editingAddress ? 'PATCH' : 'POST';
      const body = editingAddress 
        ? { id: editingAddress.id, ...formData }
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

      await loadAddresses();
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error unknown');
    } finally {
      setSaving(false);
    }
  };

  const deleteAddress = async () => {
    if (!addressToDelete) return;

    try {
      const response = await fetch(`/api/account/direcciones?id=${addressToDelete.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al eliminar');
      }

      await loadAddresses();
      setDeleteModalOpen(false);
      setAddressToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error unknown');
    }
  };

  const setAsPrimary = async (id: string) => {
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

      await loadAddresses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error unknown');
    }
  };

  const openNewModal = () => {
    setEditingAddress(null);
    setFormData({
      nombre: '',
      destinatario: session?.user?.name || '',
      telefono: '',
      direccion: '',
      complemento: '',
      postalCode: '',
      ciudad: '',
      provincia: '',
      isPrimary: addresses.length === 0
    });
    setFormModalOpen(true);
    setError(null);
  };

  const openEditModal = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      nombre: address.nombre,
      destinatario: address.destinatario,
      telefono: address.telefono,
      direccion: address.direccion,
      complemento: address.complemento || '',
      postalCode: address.postalCode,
      ciudad: address.ciudad,
      provincia: address.provincia,
      isPrimary: address.isPrimary
    });
    setFormModalOpen(true);
    setError(null);
  };

  const closeModal = () => {
    setFormModalOpen(false);
    setEditingAddress(null);
    setError(null);
  };

  const confirmDelete = (address: Address) => {
    setAddressToDelete(address);
    setDeleteModalOpen(true);
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
                {addresses.length} de 2 direcciones guardadas
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
        {error && !formModalOpen && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Lista de direcciones */}
        {addresses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes direcciones guardadas</h3>
            <p className="text-gray-500 mb-6">
              Agrega una dirección para poder realizar pedidos
            </p>
            <button
              onClick={openNewModal}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Agregar dirección
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className={`bg-white rounded-lg shadow-sm border overflow-hidden ${
                    address.isPrimary ? 'border-indigo-500 ring-1 ring-indigo-500' : ''
                  }`}
                >
                  {/* Header de la dirección */}
                  <div className="p-6 border-b">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{address.nombre}</h3>
                        {address.isPrimary && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                            <Star className="h-3 w-3 fill-current" />
                            Principal
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(address)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(address)}
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
                        <p className="font-medium text-gray-900">{address.destinatario}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="text-sm">
                        <p className="text-gray-900">{address.direccion}</p>
                        {address.complemento && (
                          <p className="text-gray-600">{address.complemento}</p>
                        )}
                        <p className="text-gray-900">
                          {address.postalCode} {address.ciudad}
                        </p>
                        <p className="text-gray-600">{address.provincia}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-700">{address.telefono}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 bg-gray-50 border-t">
                    {!address.isPrimary ? (
                      <button
                        onClick={() => setAsPrimary(address.id)}
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
            {addresses.length < 2 && (
              <div className="mt-6 text-center">
                <button
                  onClick={openNewModal}
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
      {formModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={closeModal} />
            
            <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingAddress ? 'Editar dirección' : 'Nueva dirección'}
                </h2>
                <button
                  onClick={closeModal}
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

                {!editingAddress?.isPrimary && addresses.length > 0 && (
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
                    onClick={closeModal}
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
                    {editingAddress ? 'Guardar cambios' : 'Agregar dirección'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setAddressToDelete(null);
        }}
        onConfirm={deleteAddress}
        title="¿Eliminar dirección?"
        description={`¿Estás seguro de que deseas eliminar la dirección "${addressToDelete?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        type="danger"
      />
    </div>
  );
}
