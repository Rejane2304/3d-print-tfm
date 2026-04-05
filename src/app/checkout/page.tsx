/**
 * Checkout Page - Formulario Unificado de Datos de Envío
 * Combina datos personales y dirección de envío en un solo formulario
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, MapPin, CreditCard, Wallet, Package } from 'lucide-react';
import Image from 'next/image';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  taxId: string | null;
}

interface Address {
  id: string;
  name: string;
  recipient: string;
  phone: string;
  street: string;
  complement?: string;
  postalCode: string;
  city: string;
  province: string;
  isDefault: boolean;
}

interface CartItem {
  id: string;
  quantity: number;
  unitPrice: number;
  product: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
  };
}

type PaymentMethod = 'stripe' | 'paypal';

export default function CheckoutPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [cart, setCart] = useState<{ items: CartItem[]; subtotal: number } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');
  
  // Estado unificado para el formulario
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    // Datos personales
    name: '',
    email: '',
    phone: '',
    taxId: '',
    // Datos de dirección
    addressName: '',
    street: '',
    streetNumber: '',
    complement: '',
    postalCode: '',
    city: '',
    province: '',
    isDefault: false
  });

  // Función para traducir nombres de dirección comunes
  const translateAddressName = (name: string): string => {
    const translations: { [key: string]: string } = {
      'home': 'Casa',
      'house': 'Casa',
      'work': 'Trabajo',
      'office': 'Oficina',
      'apartment': 'Apartamento',
      'flat': 'Piso',
      'parents': 'Casa de padres',
      'family': 'Casa familiar',
    };
    const lowerName = name?.toLowerCase().trim();
    return translations[lowerName] || name;
  };

  // Función para parsear la dirección y separar calle y número
  const parseStreetAddress = (street: string): { streetName: string; streetNumber: string } => {
    // Patrón común: "Calle Nombre 123" o "Calle Nombre, 123" o "Calle Nombre Nº123"
    const match = street.match(/^(.+?)\s+(?:(?:nº|n°|n|#)?\s*(\d+.*)|s\/n|sin\s+número)?$/i);
    if (match) {
      return {
        streetName: match[1].trim(),
        streetNumber: match[2] || ''
      };
    }
    return { streetName: street, streetNumber: '' };
  };

  // Función para combinar calle y número
  const combineStreetAddress = (streetName: string, streetNumber: string): string => {
    if (streetNumber.trim()) {
      return `${streetName.trim()} ${streetNumber.trim()}`;
    }
    return streetName.trim();
  };

  // Cargar datos iniciales
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load user profile
      const resProfile = await fetch('/api/account/profile');
      if (resProfile.ok) {
        const data = await resProfile.json();
        if (data.success) {
          setUserProfile(data.usuario);
          setFormData(prev => ({
            ...prev,
            name: data.usuario.name || '',
            email: data.usuario.email || '',
            phone: data.usuario.phone || '',
            taxId: data.usuario.taxId || ''
          }));
        }
      }

      // Load addresses
      const resAddresses = await fetch('/api/account/addresses');
      if (resAddresses.ok) {
        const data = await resAddresses.json();
        setAddresses(data.addresses || []);
        const primary = data.addresses?.find((d: Address) => d.isDefault);
        if (primary) {
          setSelectedAddressId(primary.id);
          // Parse street to separate street name and number
          const { streetName, streetNumber } = parseStreetAddress(primary.street || '');
          // Cargar datos de dirección en el formulario
          setFormData(prev => ({
            ...prev,
            addressName: translateAddressName(primary.name || ''),
            street: streetName,
            streetNumber: streetNumber,
            complement: primary.complement || '',
            postalCode: primary.postalCode || '',
            city: primary.city || '',
            province: primary.province || '',
            isDefault: primary.isDefault || false
          }));
        }
      } else if (resAddresses.status === 401) {
        router.push('/auth?callbackUrl=/checkout');
        return;
      }

      // Load cart
      const resCart = await fetch('/api/cart');
      if (resCart.ok) {
        const data = await resCart.json();
        setCart(data.cart);
        if (!data.cart?.items?.length) {
          router.push('/cart');
          return;
        }
      }
    } catch (err) {
      setError('Error al cargar datos del checkout');
      console.error('Error loading checkout data:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth?callbackUrl=/checkout');
      return;
    }
    if (status === 'authenticated') {
      loadData();
    }
  }, [status, router, loadData]);

  // Guardar datos unificados
  const guardarDatos = async () => {
    try {
      // Guardar perfil
      const profileResponse = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          taxId: formData.taxId
        })
      });

      // Guardar dirección
      if (selectedAddressId) {
        await fetch('/api/account/addresses', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedAddressId,
            name: formData.addressName,
            recipient: formData.name,
            address: combineStreetAddress(formData.street, formData.streetNumber),
            complement: formData.complement,
            postalCode: formData.postalCode,
            city: formData.city,
            province: formData.province,
            phone: formData.phone,
            isDefault: formData.isDefault
          })
        });
      }

      // Recargar datos
      await loadData();
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving data:', err);
      setError('Error al guardar los datos');
    }
  };

  const cancelarEdicion = () => {
    // Restaurar valores originales
    if (userProfile) {
      setFormData(prev => ({
        ...prev,
        name: userProfile.name || '',
        email: userProfile.email || '',
        phone: userProfile.phone || '',
        taxId: userProfile.taxId || ''
      }));
    }
    const selected = addresses.find(a => a.id === selectedAddressId);
    if (selected) {
      const { streetName, streetNumber } = parseStreetAddress(selected.street || '');
      setFormData(prev => ({
        ...prev,
        addressName: translateAddressName(selected.name || ''),
        street: streetName,
        streetNumber: streetNumber,
        complement: selected.complement || '',
        postalCode: selected.postalCode || '',
        city: selected.city || '',
        province: selected.province || '',
        isDefault: selected.isDefault || false
      }));
    }
    setIsEditing(false);
  };

  const processPayment = async () => {
    if (!selectedAddressId) {
      setError('Selecciona una dirección de envío');
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingAddressId: selectedAddressId,
          paymentMethod: paymentMethod.toUpperCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar el pedido');
      }

      // Confirm payment
      const confirmResponse = await fetch('/api/checkout/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: data.orderId,
          paymentMethod: paymentMethod.toUpperCase(),
        }),
      });

      if (!confirmResponse.ok) {
        console.error('Payment confirmation error');
      }

      // Clear cart
      setCart({ items: [], subtotal: 0 });
      window.dispatchEvent(new Event('cartUpdated'));
      router.push('/checkout/success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setProcessing(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando checkout...</p>
        </div>
      </div>
    );
  }

  const shippingCost = (cart?.subtotal || 0) >= 50 ? 0 : 5.99;
  const subtotal = cart?.subtotal || 0;
  const taxRate = 0.21;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + shippingCost + taxAmount;

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Finalizar Compra
          </h1>
          <p className="text-gray-600">Revisa tu pedido y confirma el pago</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Columna izquierda: Datos de envío unificados */}
          <div className="space-y-6">
            {/* Formulario Unificado */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-indigo-600" />
                  <h2 className="text-xl font-semibold">Datos de envío</h2>
                </div>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Editar
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={guardarDatos}
                      className="text-sm text-green-600 hover:text-green-800 font-medium"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={cancelarEdicion}
                      className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>

              {isEditing ? (
                // Formulario Editable
                <div className="space-y-6">
                  {/* Datos Personales */}
                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
                      Datos personales
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Nombre completo *
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          disabled
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Teléfono *
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          NIF / DNI
                        </label>
                        <input
                          type="text"
                          value={formData.taxId}
                          onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dirección */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
                      Dirección de envío
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Nombre de la dirección *
                        </label>
                        <input
                          type="text"
                          value={formData.addressName}
                          onChange={(e) => setFormData({ ...formData, addressName: e.target.value })}
                          placeholder="Ej: Casa, Oficina"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Calle *
                          </label>
                          <input
                            type="text"
                            value={formData.street}
                            onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                            placeholder="Calle Principal"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Número *
                          </label>
                          <input
                            type="text"
                            value={formData.streetNumber}
                            onChange={(e) => setFormData({ ...formData, streetNumber: e.target.value })}
                            placeholder="123"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Complemento (piso, puerta, etc.)
                        </label>
                        <input
                          type="text"
                          value={formData.complement}
                          onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                          placeholder="Piso 2, Puerta B"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Código postal *
                          </label>
                          <input
                            type="text"
                            value={formData.postalCode}
                            onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Ciudad *
                          </label>
                          <input
                            type="text"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Provincia *
                          </label>
                          <input
                            type="text"
                            value={formData.province}
                            onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="checkbox"
                          id="isDefault"
                          checked={formData.isDefault}
                          onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="isDefault" className="text-sm text-gray-700">
                          Guardar como dirección principal
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Vista Resumida (No editable)
                addresses.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">No tienes direcciones guardadas</p>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Añadir dirección de envío →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Info Personal */}
                    <div className="border-b border-gray-100 pb-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Datos personales</h3>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                          <span className="text-gray-500">Nombre:</span>
                          <p className="font-medium">{userProfile?.name || formData.name}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Email:</span>
                          <p className="font-medium">{userProfile?.email || formData.email}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Teléfono:</span>
                          <p className="font-medium">{userProfile?.phone || formData.phone || '-'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">NIF/DNI:</span>
                          <p className="font-medium">{userProfile?.taxId || formData.taxId || '-'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Info Dirección */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">
                        Dirección de envío
                        {selectedAddress?.isDefault && (
                          <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">Principal</span>
                        )}
                      </h3>
                      <div className="text-sm space-y-1">
                        <p className="font-medium text-gray-900">{selectedAddress?.name || formData.addressName}</p>
                        <p className="text-gray-600">{combineStreetAddress(formData.street, formData.streetNumber)}</p>
                        {(selectedAddress?.complement || formData.complement) && (
                          <p className="text-gray-600">{selectedAddress?.complement || formData.complement}</p>
                        )}
                        <p className="text-gray-600">
                          {(selectedAddress?.postalCode || formData.postalCode)} {''}
                          {(selectedAddress?.city || formData.city)}, {''}
                          {(selectedAddress?.province || formData.province)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Resumen del pedido */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Resumen del pedido</h2>
              
              {cart?.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-3 border-b border-gray-100">
                  <div className="w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden relative">
                    {item.product.image ? (
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <Package className="w-full h-full p-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-gray-600">
                      {item.quantity} x {(item.unitPrice || 0).toFixed(2)} €
                    </p>
                  </div>
                  <p className="font-semibold">
                    {((item.quantity || 1) * (item.unitPrice || 0)).toFixed(2)} €
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Columna derecha: Totales y pago */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-6">Total del pedido</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{subtotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Envío</span>
                  <span className={shippingCost === 0 ? 'text-green-600' : ''}>
                    {shippingCost === 0 ? 'Gratis' : `${shippingCost.toFixed(2)} €`}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>IVA (21%)</span>
                  <span>{taxAmount.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-xl font-bold border-t pt-3">
                  <span>Total</span>
                  <span className="text-indigo-600">{total.toFixed(2)} €</span>
                </div>
              </div>

              {/* Método de pago */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Método de pago</h3>
                <div className="space-y-2">
                  <label
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      paymentMethod === 'stripe'
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="stripe"
                      checked={paymentMethod === 'stripe'}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="sr-only"
                    />
                    <CreditCard className="h-5 w-5 text-indigo-600" />
                    <div className="flex-1">
                      <span className="font-medium">Tarjeta de crédito/débito</span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      paymentMethod === 'paypal'
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paypal"
                      checked={paymentMethod === 'paypal'}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="sr-only"
                    />
                    <Wallet className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <span className="font-medium">PayPal</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Botón de pago */}
              <button
                onClick={processPayment}
                disabled={processing || !selectedAddressId || addresses.length === 0}
                className="w-full bg-indigo-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    {paymentMethod === 'stripe' ? (
                      <CreditCard className="h-5 w-5" />
                    ) : (
                      <Wallet className="h-5 w-5" />
                    )}
                    Confirmar pedido - {total.toFixed(2)} €
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
