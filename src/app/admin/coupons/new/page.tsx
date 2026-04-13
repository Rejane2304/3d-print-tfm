/**
 * New Coupon Page - Admin
 * Form for creating a new coupon
 */
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, CheckCircle2, Euro, Loader2, Percent, Save, Ticket, Truck } from 'lucide-react';

const COUPON_TYPES = [
  {
    value: 'PERCENTAGE',
    label: 'Porcentaje',
    icon: Percent,
    description: 'Descuento por porcentaje (ej: 10%)',
  },
  {
    value: 'FIXED',
    label: 'Monto Fijo',
    icon: Euro,
    description: 'Descuento de cantidad fija (ej: 5€)',
  },
  {
    value: 'FREE_SHIPPING',
    label: 'Envío Gratis',
    icon: Truck,
    description: 'Envío gratuito en el pedido',
  },
];

export default function NuevoCuponPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    type: 'PERCENTAGE',
    value: 10,
    minOrderAmount: '',
    maxUses: '',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: '',
    isActive: true,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth?callbackUrl=/admin/coupons/new');
      return;
    }

    const user = session?.user as { role?: string } | undefined;
    if (status === 'authenticated' && user?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [status, session, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

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

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.code.toUpperCase(),
          type: formData.type,
          value: formData.type === 'FREE_SHIPPING' ? 0 : Number(formData.value),
          minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : undefined,
          maxUses: formData.maxUses ? Number(formData.maxUses) : undefined,
          validFrom: new Date(formData.validFrom).toISOString(),
          validUntil: new Date(formData.validUntil + 'T23:59:59').toISOString(),
          isActive: formData.isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear cupón');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/coupons');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear cupón');
    } finally {
      setLoading(false);
    }
  };

  const getValueLabel = () => {
    switch (formData.type) {
      case 'PERCENTAGE':
        return 'Porcentaje de descuento (%)';
      case 'FIXED':
        return 'Monto de descuento (€)';
      case 'FREE_SHIPPING':
        return 'N/A';
      default:
        return 'Valor';
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
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
                <h1 className="text-3xl font-bold text-gray-900">Nuevo Cupón</h1>
                <nav className="flex mt-1" aria-label="Breadcrumb">
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
                      <span className="text-gray-900">Nuevo</span>
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
            <Link href="/admin/dashboard" className="text-indigo-600 hover:text-indigo-800 font-medium">
              ← Volver al Panel
            </Link>
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
            <p className="text-green-700">Cupón creado exitosamente. Redirigiendo...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-3xl">
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
                    Código del Cupón *
                  </label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase"
                    placeholder="Ej: VERANO2024"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Mínimo 3 caracteres. Solo letras, números, guiones y guiones bajos.
                  </p>
                </div>

                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">Tipo de Descuento *</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {COUPON_TYPES.map(type => {
                      const Icon = type.icon;
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
                          className={`p-3 border rounded-lg text-left transition-colors ${
                            formData.type === type.value
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="h-4 w-4" />
                            <span className="font-medium">{type.label}</span>
                          </div>
                          <p className="text-xs text-gray-500">{type.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">
                      {getValueLabel()} {formData.type !== 'FREE_SHIPPING' && '*'}
                    </label>
                    <input
                      type="number"
                      id="value"
                      name="value"
                      value={formData.value}
                      onChange={handleInputChange}
                      disabled={formData.type === 'FREE_SHIPPING'}
                      min="0"
                      max={formData.type === 'PERCENTAGE' ? 100 : undefined}
                      step={formData.type === 'PERCENTAGE' ? 1 : 0.01}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder={formData.type === 'PERCENTAGE' ? '10' : '5.00'}
                      required={formData.type !== 'FREE_SHIPPING'}
                    />
                    {formData.type === 'PERCENTAGE' && (
                      <p className="mt-1 text-xs text-gray-500">Ingresa el porcentaje sin el símbolo %</p>
                    )}
                    {formData.type === 'FIXED' && (
                      <p className="mt-1 text-xs text-gray-500">Ingresa el monto en euros</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="minOrderAmount" className="block text-sm font-medium text-gray-700 mb-1">
                      Compra Mínima (€)
                    </label>
                    <input
                      type="number"
                      id="minOrderAmount"
                      name="minOrderAmount"
                      value={formData.minOrderAmount}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Opcional"
                    />
                    <p className="mt-1 text-xs text-gray-500">Monto mínimo del pedido para aplicar el cupón</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Límites y Fechas */}
            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Límites y Vigencia</h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="maxUses" className="block text-sm font-medium text-gray-700 mb-1">
                    Usos Máximos
                  </label>
                  <input
                    type="number"
                    id="maxUses"
                    name="maxUses"
                    value={formData.maxUses}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Sin límite"
                  />
                  <p className="mt-1 text-xs text-gray-500">Deja vacío para usos ilimitados</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="validFrom" className="block text-sm font-medium text-gray-700 mb-1">
                      Válido desde *
                    </label>
                    <input
                      type="date"
                      id="validFrom"
                      name="validFrom"
                      value={formData.validFrom}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="validUntil" className="block text-sm font-medium text-gray-700 mb-1">
                      Válido hasta *
                    </label>
                    <input
                      type="date"
                      id="validUntil"
                      name="validUntil"
                      value={formData.validUntil}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Configuración */}
            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuración</h2>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700 cursor-pointer">
                  Cupón activo (disponible para usar)
                </label>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <Link
                href="/admin/coupons"
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 max-w-xs px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4" />
                Crear Cupón
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
