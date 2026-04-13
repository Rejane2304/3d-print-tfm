/**
 * Página de Mis Direcciones - Usuario
 * Gestión completa de direcciones de envío
 */
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Edit2, Loader2, MapPin, Phone, Plus, Star, Trash2, User, X } from 'lucide-react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface Address {
  id: string;
  name: string;
  recipient: string;
  phone: string;
  address: string;
  complement?: string;
  postalCode: string;
  city: string;
  province: string;
  isDefault: boolean;
  createdAt: string;
}

// Traducir nombres de dirección comunes
const translateAddressName = (name: string): string => {
  const translations: { [key: string]: string } = {
    home: 'Casa',
    house: 'Casa',
    work: 'Trabajo',
    office: 'Oficina',
    apartment: 'Apartamento',
    flat: 'Piso',
    parents: 'Casa de padres',
    family: 'Casa familiar',
  };
  const lowerName = name?.toLowerCase().trim();
  return translations[lowerName] || name;
};

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
    name: '',
    recipient: '',
    phone: '',
    address: '',
    complement: '',
    postalCode: '',
    city: '',
    province: '',
    isDefault: false,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth?callbackUrl=/account/addresses');
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

      const response = await fetch('/api/account/addresses');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar direcciones');
      }

      setAddresses(data.addresses || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = '/api/account/addresses';
      const method = editingAddress ? 'PATCH' : 'POST';
      const body = editingAddress ? { id: editingAddress.id, ...formData } : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar dirección');
      }

      await loadAddresses();
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  const deleteAddress = async () => {
    if (!addressToDelete) {
      return;
    }

    try {
      const response = await fetch(`/api/account/addresses?id=${addressToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al eliminar');
      }

      await loadAddresses();
      setDeleteModalOpen(false);
      setAddressToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const setAsPrimary = async (id: string) => {
    try {
      const response = await fetch('/api/account/addresses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isDefault: true }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al actualizar');
      }

      await loadAddresses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const openNewModal = () => {
    setEditingAddress(null);
    setFormData({
      name: '',
      recipient: session?.user?.name || '',
      phone: '',
      address: '',
      complement: '',
      postalCode: '',
      city: '',
      province: '',
      isDefault: addresses.length === 0,
    });
    setFormModalOpen(true);
    setError(null);
  };

  const openEditModal = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      name: address.name,
      recipient: address.recipient,
      phone: address.phone,
      address: address.address,
      complement: address.complement || '',
      postalCode: address.postalCode,
      city: address.city,
      province: address.province,
      isDefault: address.isDefault,
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
        <div className="max-w-[1920px] 3xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mis Direcciones</h1>
              <p className="mt-2 text-gray-600">{addresses.length} de 2 direcciones guardadas</p>
            </div>
            <Link href="/account" className="text-indigo-600 hover:text-indigo-800 font-medium">
              ← Volver a mi cuenta
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1920px] 3xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <p className="text-gray-500 mb-6">Agrega una dirección para poder realizar pedidos</p>
            <button
              onClick={openNewModal}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium \
                hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Agregar dirección
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {addresses.map(address => (
                <div
                  key={address.id}
                  className={`bg-white rounded-lg shadow-sm border overflow-hidden ${
                    address.isDefault ? 'border-indigo-500 ring-1 ring-indigo-500' : ''
                  }`}
                >
                  {/* Header de la dirección */}
                  <div className="p-4 sm:p-6 border-b">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                          {translateAddressName(address.name)}
                        </h3>
                        {address.isDefault && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 \
                              bg-indigo-100 text-indigo-700 text-xs font-medium \
                              rounded-full flex-shrink-0"
                          >
                            <Star className="h-3 w-3 fill-current" />
                            Principal
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => openEditModal(address)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg \
                            transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                          title="Editar"
                          aria-label="Editar dirección"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(address)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg \
                            transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                          title="Eliminar"
                          aria-label="Eliminar dirección"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="p-4 sm:p-6 space-y-2 sm:space-y-3">
                    <div className="flex items-start gap-3">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm sm:text-base">{address.recipient}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs sm:text-sm min-w-0">
                        <p className="text-gray-900 break-words">{address.address}</p>
                        {address.complement && <p className="text-gray-600 break-words">{address.complement}</p>}
                        <p className="text-gray-900">
                          {address.postalCode} {address.city}
                        </p>
                        <p className="text-gray-600">{address.province}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-700">{address.phone}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t">
                    {address.isDefault ? (
                      <span className="text-xs sm:text-sm text-gray-500 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                        Dirección principal
                      </span>
                    ) : (
                      <button
                        onClick={() => setAsPrimary(address.id)}
                        className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 font-medium min-h-[44px] \
                        flex items-center"
                      >
                        Establecer como dirección principal
                      </button>
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
                  className="inline-flex items-center gap-2 border-2 border-dashed border-gray-300 text-gray-600 \
                  px-6 py-3 rounded-lg font-medium hover:border-indigo-500 hover:text-indigo-600 transition-colors"
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
          <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
            <button
              type="button"
              className="fixed inset-0 bg-gray-500 bg-opacity-75"
              aria-label="Cerrar modal"
              onClick={closeModal}
              tabIndex={0}
              style={{ cursor: 'pointer' }}
            />

            <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-4 sm:p-6 m-2">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  {editingAddress ? 'Editar dirección' : 'Nueva dirección'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 p-1 min-h-[44px] min-w-[44px] flex items-center \
                    justify-center"
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>

              {error && (
                <div className="mb-3 sm:mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div>
                  <label htmlFor="addressName" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la dirección *
                  </label>
                  <input
                    id="addressName"
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Casa, Trabajo, Casa de mis padres"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 \
                      focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 \
                      text-sm sm:text-base min-h-[44px]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-1">
                      Destinatario *
                    </label>
                    <input
                      id="recipient"
                      type="text"
                      value={formData.recipient}
                      onChange={e => setFormData({ ...formData, recipient: e.target.value })}
                      placeholder="Nombre y apellidos"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 \
                        focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 \
                        text-sm sm:text-base min-h-[44px]"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono *
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="612345678"
                      className={
                        'w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 ' +
                        'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ' +
                        'text-sm sm:text-base min-h-[44px]'
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="addressLine" className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección *
                  </label>
                  <input
                    id="addressLine"
                    type="text"
                    autoComplete="street-address"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Calle, número, piso..."
                    className={
                      'w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 ' +
                      'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ' +
                      'text-sm sm:text-base min-h-[44px]'
                    }
                    required
                  />
                </div>

                <div>
                  <label htmlFor="complement" className="block text-sm font-medium text-gray-700 mb-1">
                    Complemento (opcional)
                  </label>
                  <input
                    id="complement"
                    type="text"
                    value={formData.complement}
                    onChange={e => setFormData({ ...formData, complement: e.target.value })}
                    placeholder="Piso, puerta, escalera..."
                    className={
                      'w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 ' +
                      'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ' +
                      'text-sm sm:text-base min-h-[44px]'
                    }
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                      Código Postal *
                    </label>
                    <input
                      id="postalCode"
                      type="text"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      value={formData.postalCode}
                      onChange={e => setFormData({ ...formData, postalCode: e.target.value })}
                      placeholder="28001"
                      maxLength={5}
                      className={[
                        'w-full',
                        'border',
                        'border-gray-300',
                        'rounded-lg',
                        'px-3',
                        'py-2.5',
                        'sm:py-2',
                        'focus:ring-2',
                        'focus:ring-indigo-500',
                        'focus:border-indigo-500',
                        'text-sm',
                        'sm:text-base',
                        'min-h-[44px]',
                      ].join(' ')}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      Ciudad *
                    </label>
                    <input
                      id="city"
                      type="text"
                      autoComplete="address-level2"
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Madrid"
                      className={[
                        'w-full',
                        'border',
                        'border-gray-300',
                        'rounded-lg',
                        'px-3',
                        'py-2.5',
                        'sm:py-2',
                        'focus:ring-2',
                        'focus:ring-indigo-500',
                        'focus:border-indigo-500',
                        'text-sm',
                        'sm:text-base',
                        'min-h-[44px]',
                      ].join(' ')}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">
                    Provincia *
                  </label>
                  <input
                    id="province"
                    type="text"
                    autoComplete="address-level1"
                    value={formData.province}
                    onChange={e => setFormData({ ...formData, province: e.target.value })}
                    placeholder="Madrid"
                    className={[
                      'w-full',
                      'border',
                      'border-gray-300',
                      'rounded-lg',
                      'px-3',
                      'py-2.5',
                      'sm:py-2',
                      'focus:ring-2',
                      'focus:ring-indigo-500',
                      'focus:border-indigo-500',
                      'text-sm',
                      'sm:text-base',
                      'min-h-[44px]',
                    ].join(' ')}
                    required
                  />
                </div>

                {!editingAddress?.isDefault && addresses.length > 0 && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={formData.isDefault}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          isDefault: e.target.checked,
                        })
                      }
                      className={[
                        'h-4',
                        'w-4',
                        'min-h-[16px]',
                        'min-w-[16px]',
                        'text-indigo-600',
                        'focus:ring-indigo-500',
                        'border-gray-300',
                        'rounded',
                      ].join(' ')}
                    />
                    <label htmlFor="isDefault" className="text-sm text-gray-700">
                      Establecer como dirección principal
                    </label>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className={[
                      'flex-1',
                      'px-4',
                      'py-2.5',
                      'sm:py-2',
                      'border',
                      'border-gray-300',
                      'text-gray-700',
                      'rounded-lg',
                      'font-medium',
                      'hover:bg-gray-50',
                      'min-h-[44px]',
                    ].join(' ')}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className={[
                      'flex-1',
                      'px-4',
                      'py-2.5',
                      'sm:py-2',
                      'bg-indigo-600',
                      'text-white',
                      'rounded-lg',
                      'font-medium',
                      'hover:bg-indigo-700',
                      'disabled:opacity-50',
                      'flex',
                      'items-center',
                      'justify-center',
                      'gap-2',
                      'min-h-[44px]',
                    ].join(' ')}
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
        description={`¿Estás seguro de que deseas eliminar la dirección "${
          addressToDelete ? translateAddressName(addressToDelete.name) : ''
        }"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        type="danger"
      />
    </div>
  );
}
