/**
 * Edit Shipping Zone Page - Admin
 * Form for editing an existing shipping zone
 */
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, CheckCircle2, Clock, Euro, Loader2, MapPin, Plus, Save, Truck, X } from 'lucide-react';

export default function EditarZonaEnvioPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const zoneId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Arrays para regiones y prefijos
  const [regionInput, setRegionInput] = useState('');
  const [postalCodeInput, setPostalCodeInput] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    regions: [] as string[],
    postalCodePrefixes: [] as string[],
    baseCost: 0,
    freeShippingThreshold: '',
    estimatedDaysMin: 3,
    estimatedDaysMax: 5,
    isActive: true,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth?callbackUrl=/admin/shipping');
      return;
    }

    const user = session?.user as { role?: string } | undefined;
    if (status === 'authenticated') {
      if (user?.role !== 'ADMIN') {
        router.push('/');
        return;
      }
      loadZone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, router, zoneId]);

  const loadZone = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/shipping/${zoneId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error cargando zona de envío');
      }

      const zone = data.zone;
      setFormData({
        name: zone.nombre,
        country: zone.pais,
        regions: zone.regiones,
        postalCodePrefixes: zone.prefijosCP,
        baseCost: zone.costoBase,
        freeShippingThreshold: zone.envioGratisDesde?.toString() || '',
        estimatedDaysMin: zone.diasEstimadosMin,
        estimatedDaysMax: zone.diasEstimadosMax,
        isActive: zone.activo,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando zona de envío');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let newValue;
    if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      newValue = Number(value);
    } else {
      newValue = value;
    }
    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const addRegion = () => {
    if (regionInput.trim() && !formData.regions.includes(regionInput.trim())) {
      setFormData(prev => ({
        ...prev,
        regions: [...prev.regions, regionInput.trim()],
      }));
      setRegionInput('');
    }
  };

  const removeRegion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      regions: prev.regions.filter((_, i) => i !== index),
    }));
  };

  const addPostalCode = () => {
    if (postalCodeInput.trim() && !formData.postalCodePrefixes.includes(postalCodeInput.trim())) {
      setFormData(prev => ({
        ...prev,
        postalCodePrefixes: [...prev.postalCodePrefixes, postalCodeInput.trim()],
      }));
      setPostalCodeInput('');
    }
  };

  const removePostalCode = (index: number) => {
    setFormData(prev => ({
      ...prev,
      postalCodePrefixes: prev.postalCodePrefixes.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      return 'El nombre de la zona es obligatorio';
    }
    if (!formData.country.trim()) {
      return 'El país es obligatorio';
    }
    if (formData.regions.length === 0) {
      return 'Debe agregar al menos una región';
    }
    if (formData.postalCodePrefixes.length === 0) {
      return 'Debe agregar al menos un prefijo de código postal';
    }
    if (formData.baseCost < 0) {
      return 'El costo base no puede ser negativo';
    }
    if (formData.estimatedDaysMin < 1) {
      return 'Los días estimados mínimos deben ser al menos 1';
    }
    if (formData.estimatedDaysMax < 1) {
      return 'Los días estimados máximos deben ser al menos 1';
    }
    if (formData.estimatedDaysMin > formData.estimatedDaysMax) {
      return 'Los días estimados mínimos no pueden ser mayores que los máximos';
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

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/shipping/${zoneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          country: formData.country,
          regions: formData.regions,
          postalCodePrefixes: formData.postalCodePrefixes,
          baseCost: formData.baseCost,
          freeShippingThreshold: formData.freeShippingThreshold ? Number(formData.freeShippingThreshold) : null,
          estimatedDaysMin: formData.estimatedDaysMin,
          estimatedDaysMax: formData.estimatedDaysMax,
          isActive: formData.isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar zona de envío');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/shipping');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar zona de envío');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando zona de envío...</p>
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
              <Link href="/admin/shipping" className="text-gray-500 hover:text-gray-700 transition-colors">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Editar Zona de Envío</h1>
                <nav className="flex mt-1" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-2 text-sm">
                    <li>
                      <Link href="/admin/dashboard" className="text-gray-500 hover:text-gray-700">
                        Panel
                      </Link>
                    </li>
                    <li className="text-gray-400">/</li>
                    <li>
                      <Link href="/admin/shipping" className="text-gray-500 hover:text-gray-700">
                        Envío
                      </Link>
                    </li>
                    <li className="text-gray-400">/</li>
                    <li>
                      <span className="text-gray-900">Editar</span>
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
            <p className="text-green-700">Zona de envío actualizada exitosamente. Redirigiendo...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-3xl">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
            {/* Información básica */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Información de la Zona
              </h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Zona *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    // eslint-disable-next-line max-len
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg \
                      focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Ej: Península - Zona Centro"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                    País *
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    // eslint-disable-next-line max-len
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg \
                      focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Ej: España"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Regiones */}
            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Regiones *
              </h2>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={regionInput}
                    onChange={e => setRegionInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addRegion();
                      }
                    }}
                    // eslint-disable-next-line max-len
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Ej: Madrid"
                  />
                  <button
                    type="button"
                    onClick={addRegion}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar
                  </button>
                </div>

                {formData.regions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.regions.map(region => (
                      <span
                        key={region}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 \
                          rounded-full text-sm"
                      >
                        {region}
                        <button
                          type="button"
                          onClick={() => removeRegion(formData.regions.indexOf(region))}
                          className="p-0.5 hover:bg-indigo-100 rounded-full"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Códigos Postales */}
            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Prefijos de Código Postal *
              </h2>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={postalCodeInput}
                    onChange={e => setPostalCodeInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addPostalCode();
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg \
                      focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Ej: 28"
                  />
                  <button
                    type="button"
                    onClick={addPostalCode}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar
                  </button>
                </div>

                <p className="text-xs text-gray-500">
                  Los prefijos se usan para determinar a qué zona pertenece un código postal. Ejemplo: &quot;28&quot;
                  cubre todos los códigos que empiezan con 28 (28001, 28002, etc.)
                </p>

                {formData.postalCodePrefixes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.postalCodePrefixes.map(prefix => (
                      <span
                        key={prefix}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 \
                          rounded-full text-sm font-mono"
                      >
                        {prefix}
                        <button
                          type="button"
                          onClick={() => removePostalCode(formData.postalCodePrefixes.indexOf(prefix))}
                          className="p-0.5 hover:bg-green-100 rounded-full"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Costos y Envío Gratis */}
            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Costos
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="baseCost" className="block text-sm font-medium text-gray-700 mb-1">
                    Costo Base (€) *
                  </label>
                  <input
                    type="number"
                    id="baseCost"
                    name="baseCost"
                    value={formData.baseCost}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg \
                      focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="freeShippingThreshold" className="block text-sm font-medium text-gray-700 mb-1">
                    Envío Gratis Desde (€)
                  </label>
                  <input
                    type="number"
                    id="freeShippingThreshold"
                    name="freeShippingThreshold"
                    value={formData.freeShippingThreshold}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg \
                      focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Opcional"
                  />
                  <p className="text-xs text-gray-500 mt-1">Deja vacío si no hay envío gratis</p>
                </div>
              </div>
            </div>

            {/* Días Estimados */}
            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Tiempo de Entrega Estimado *
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="estimatedDaysMin" className="block text-sm font-medium text-gray-700 mb-1">
                    Días Mínimos *
                  </label>
                  <input
                    type="number"
                    id="estimatedDaysMin"
                    name="estimatedDaysMin"
                    value={formData.estimatedDaysMin}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg \
                      focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="estimatedDaysMax" className="block text-sm font-medium text-gray-700 mb-1">
                    Días Máximos *
                  </label>
                  <input
                    type="number"
                    id="estimatedDaysMax"
                    name="estimatedDaysMax"
                    value={formData.estimatedDaysMax}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg \
                      focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
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
                  Zona activa (disponible para usar)
                </label>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <Link
                href="/admin/shipping"
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 max-w-xs px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 \
                  disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4" />
                Guardar Cambios
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
