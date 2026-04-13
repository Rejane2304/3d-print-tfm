// Página de edición de cupón - Admin
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, CheckCircle2, Ticket, Trash2 } from 'lucide-react';
import { MdAttachMoney, MdLocalShipping, MdPercent } from 'react-icons/md';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

const couponTypes = [
  { value: 'PERCENTAGE', label: 'Porcentaje', icon: MdPercent },
  { value: 'FIXED', label: 'Cantidad fija', icon: MdAttachMoney },
  { value: 'FREE_SHIPPING', label: 'Envío gratis', icon: MdLocalShipping },
];

const AdminCouponEditPage = () => {
  const params = useParams();
  const couponId = params?.id;
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [coupon] = useState<{
    codigo?: string;
    tipoRaw?: string;
    valorRaw?: number;
    minimoCompra?: number;
    usosMaximos?: number;
    usosActuales?: number;
    validoDesde?: string;
    validoHasta?: string;
    activo?: boolean;
  } | null>(null);
  const [success, setSuccess] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    type: 'PERCENTAGE',
    value: 0,
    minOrderAmount: '',
    maxUses: '',
    validFrom: '',
    validUntil: '',
    isActive: false,
  });

  // handleInputChange eliminado (no se usa)

  const validateForm = () => {
    if (!formData.code.trim()) {
      return 'El código del cupón es obligatorio';
    }
    if (formData.code.length < 3) {
      return 'El código debe tener al menos 3 caracteres';
    }
    if (!/^[A-Z0-9_-]+$/i.test(formData.code)) {
      return 'El código solo puede contener letras, números, guiones y guiones bajos';
    }
    if (formData.type !== 'FREE_SHIPPING') {
      if (formData.value <= 0) {
        return 'El valor debe ser mayor a 0';
      }
      if (formData.type === 'PERCENTAGE' && formData.value > 100) {
        return 'El porcentaje no puede ser mayor a 100';
      }
    }
    if (!formData.validUntil) {
      return 'La fecha de expiración es obligatoria';
    }
    const validFrom = new Date(formData.validFrom);
    const validUntil = new Date(formData.validUntil);
    if (validUntil <= validFrom) {
      return 'La fecha de fin debe ser posterior a la fecha de inicio';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    try {
      const response = await fetch(`/api/admin/coupons/${couponId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.type,
          value: formData.type === 'FREE_SHIPPING' ? 0 : Number(formData.value),
          minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : null,
          maxUses: formData.maxUses ? Number(formData.maxUses) : null,
          validFrom: new Date(formData.validFrom).toISOString(),
          validUntil: new Date(formData.validUntil + 'T23:59:59').toISOString(),
          isActive: formData.isActive,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar cupón');
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar cupón');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/admin/coupons/${couponId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar cupón');
      }
      router.push('/admin/coupons');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar cupón');
      setDeleteModalOpen(false);
    }
  };

  // getValueLabel eliminado (no se usa)

  // saving eliminado (no se usa)

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-[1920px] 3xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/admin/coupons" className="text-gray-500 hover:text-gray-700 transition-colors">
                  <ArrowLeft className="h-6 w-6" />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Editar Cupón</h1>
                  <ol className="flex items-center space-x-2 text-sm">
                    <li>
                      <Link href="/admin/dashboard" className="text-gray-500 hover:text-gray-700">
                        Panel
                      </Link>
                    </li>
                    <li className="text-gray-400">/</li>
                    <li>
                      <Link href="/admin/coupons" className="text-gray-500 hover:text-gray-700">
                        Cupones
                      </Link>
                    </li>
                    <li className="text-gray-400">/</li>
                    <li>
                      <span className="text-gray-900 truncate max-w-xs">{coupon?.codigo}</span>
                    </li>
                  </ol>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Link href="/admin/dashboard" className="text-indigo-600 hover:text-indigo-800 font-medium">
                  ← Volver al Panel
                </Link>
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(true)}
                  className={[
                    'inline-flex',
                    'items-center',
                    'gap-2',
                    'bg-red-600',
                    'text-white',
                    'px-4',
                    'py-2',
                    'rounded-lg',
                    'font-medium',
                    'hover:bg-red-700',
                  ].join(' ')}
                >
                  <Trash2 className="h-5 w-5" />
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
          <p className="text-green-700">Cupón actualizado exitosamente.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
              {/* Información básica */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Información del Cupón
                </h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                      Código del Cupón
                    </label>
                    <input
                      type="text"
                      id="code"
                      name="code"
                      value={formData.code}
                      disabled
                      className={[
                        'w-full',
                        'px-3',
                        'py-2',
                        'border',
                        'border-gray-300',
                        'rounded-lg',
                        'bg-gray-100',
                        'text-gray-600',
                        'uppercase',
                        'cursor-not-allowed',
                      ].join(' ')}
                      title="El código del cupón no puede modificarse. Para cambiar el código, cree un nuevo cupón."
                    />
                  </div>
                  {/* ...otros campos del formulario... */}
                </div>
                {/* ...otros bloques del formulario... */}
              </div>
            </div>
          </form>
          <p className="text-xs text-gray-500 mt-1">
            El código no puede modificarse. Cree un nuevo cupón si necesita un código diferente.
          </p>
          {/* El siguiente bloque parece estar fuera de lugar, lo reubicamos correctamente */}
          <fieldset>
            {couponTypes.map(type => {
              const Icon = type.icon;
              const isSelected = formData.type === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() =>
                    setFormData(prev => ({
                      ...prev,
                      type: type.value,
                      value: type.value === 'FREE_SHIPPING' ? 0 : prev.value,
                    }))
                  }
                  className={[
                    'p-3',
                    'border',
                    'rounded-lg',
                    'text-left',
                    'transition-colors',
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300',
                  ].join(' ')}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    <span>{type.label}</span>
                  </span>
                </button>
              );
            })}
          </fieldset>
          {/* ...resto del formulario y sidebar... */}
        </div>
        {/* Sidebar con estadísticas */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas</h3>
            {coupon && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Usos Actuales</p>
                  <p className="text-2xl font-bold text-indigo-600">{coupon?.usosActuales ?? 0}</p>
                </div>
                {typeof coupon.usosMaximos === 'number' && (
                  <div>
                    <p className="text-sm text-gray-500">Usos Restantes</p>
                    <p className="text-2xl font-bold text-green-600">
                      {(coupon?.usosMaximos ?? 0) - (coupon?.usosActuales ?? 0)}
                    </p>
                  </div>
                )}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">Vigencia</p>
                  <p className="text-sm text-gray-900">
                    {coupon?.validoDesde ? new Date(coupon.validoDesde).toLocaleDateString('es-ES') : ''} -{' '}
                    {coupon?.validoHasta ? new Date(coupon.validoHasta).toLocaleDateString('es-ES') : ''}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="¿Eliminar Cupón?"
        description="Esta acción no se puede deshacer. El cupón será eliminado permanentemente."
        confirmText="Eliminar"
        type="danger"
      />
    </>
  );
};

export default AdminCouponEditPage;
