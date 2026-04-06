/**
 * Checkout Page - Formulario Simplificado de Pago
 * Flujo: Usuario elige método → Confirma → Pedido creado → Redirección a success
 * Sin redirecciones externas ni formularios complejos
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, MapPin, CreditCard, Wallet, Banknote, ArrowRightLeft, Package, CheckCircle2 } from 'lucide-react';
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
  address: string;
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

type PaymentMethod = 'CARD' | 'PAYPAL' | 'BIZUM' | 'TRANSFER';

const paymentMethods = [
  {
    id: 'CARD' as PaymentMethod,
    name: 'Tarjeta de crédito/débito',
    description: 'Pago seguro con tarjeta',
    icon: CreditCard,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
  },
  {
    id: 'PAYPAL' as PaymentMethod,
    name: 'PayPal',
    description: 'Pago rápido con PayPal',
    icon: Wallet,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    id: 'BIZUM' as PaymentMethod,
    name: 'Bizum',
    description: 'Pago instantáneo desde tu móvil',
    icon: Banknote,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  {
    id: 'TRANSFER' as PaymentMethod,
    name: 'Transferencia bancaria',
    description: 'Transferencia a nuestra cuenta',
    icon: ArrowRightLeft,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
];

export default function CheckoutPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [, setUserProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [cart, setCart] = useState<{ items: CartItem[]; subtotal: number } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderData, setOrderData] = useState<{ orderId: string; orderNumber: string } | null>(null);

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
          paymentMethod: paymentMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar el pedido');
      }

      // Pedido completado exitosamente
      setOrderComplete(true);
      setOrderData({
        orderId: data.orderId,
        orderNumber: data.orderNumber,
      });

      // Vaciar carrito local
      setCart({ items: [], subtotal: 0 });
      window.dispatchEvent(new Event('cartUpdated'));

      // Redirigir a la página de éxito después de 2 segundos
      setTimeout(() => {
        router.push(`/checkout/success?orderId=${data.orderId}`);
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setProcessing(false);
    }
  };

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

  // Si el pedido está completado, mostrar pantalla de éxito
  if (orderComplete) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              ¡Pago completado!
            </h1>
            
            <p className="text-gray-600 mb-4">
              Tu pedido ha sido procesado exitosamente.
            </p>
            
            {orderData && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-1">Número de pedido:</p>
                <p className="text-xl font-bold text-indigo-600">{orderData.orderNumber}</p>
              </div>
            )}
            
            <p className="text-sm text-gray-500 mb-6">
              Redirigiendo a los detalles de tu pedido...
            </p>
            
            <div className="animate-pulse">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const shippingCost = (cart?.subtotal || 0) >= 50 ? 0 : 5.99;
  const subtotal = cart?.subtotal || 0;
  const taxRate = 0.21;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + shippingCost + taxAmount;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _selectedAddress = addresses.find(a => a.id === selectedAddressId);
  const selectedPaymentMethod = paymentMethods.find(m => m.id === paymentMethod);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Finalizar Compra
          </h1>
          <p className="text-gray-600">Revisa tu pedido, elige método de pago y confirma</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Columna izquierda: Datos de envío y productos */}
          <div className="space-y-6">
            {/* Dirección de envío */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-indigo-600" />
                  <h2 className="text-xl font-semibold">Dirección de envío</h2>
                </div>
                <a
                  href="/account/addresses"
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Gestionar direcciones →
                </a>
              </div>

              {addresses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No tienes direcciones guardadas</p>
                  <a
                    href="/account/addresses"
                    className="inline-flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Añadir dirección
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      htmlFor={`address-${address.id}`}
                      className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedAddressId === address.id
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        id={`address-${address.id}`}
                        name="address"
                        value={address.id}
                        checked={selectedAddressId === address.id}
                        onChange={() => setSelectedAddressId(address.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {translateAddressName(address.name)}
                          </span>
                          {address.isDefault && (
                            <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                              Principal
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{address.address}</p>
                        {address.complement && (
                          <p className="text-sm text-gray-600">{address.complement}</p>
                        )}
                        <p className="text-sm text-gray-600">
                          {address.postalCode} {address.city}, {address.province}
                        </p>
                        <p className="text-sm text-gray-600">Tel: {address.phone}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Productos */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Resumen del pedido</h2>
              
              {cart?.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                  <div className="w-20 h-20 bg-gray-100 flex-shrink-0 overflow-hidden relative">
                    {item.product.image ? (
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        sizes="80px"
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

          {/* Columna derecha: Método de pago y confirmación */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-6">Método de pago</h2>

              {/* Selector de métodos de pago */}
              <div className="space-y-3 mb-6">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <label
                      key={method.id}
                      htmlFor={`payment-${method.id}`}
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        paymentMethod === method.id
                          ? `${method.borderColor} ${method.bgColor}`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        id={`payment-${method.id}`}
                        name="paymentMethod"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={() => {
                          setPaymentMethod(method.id);
                          setShowConfirmation(false);
                        }}
                        className="sr-only"
                      />
                      <div className={`p-2 rounded-lg ${method.bgColor}`}>
                        <Icon className={`h-6 w-6 ${method.color}`} />
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">{method.name}</span>
                        <p className="text-sm text-gray-500">{method.description}</p>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Resumen de totales */}
              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Total del pedido</h3>
                
                <div className="space-y-3">
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
              </div>

              {/* Botón de confirmación */}
              {!showConfirmation ? (
                <button
                  onClick={() => setShowConfirmation(true)}
                  disabled={!selectedAddressId || addresses.length === 0}
                  className="w-full bg-indigo-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Confirmar pedido
                </button>
              ) : (
                <div className="space-y-4">
                  {/* Confirmación final */}
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-indigo-900 font-medium mb-2">
                      ¿Confirmar compra?
                    </p>
                    <p className="text-sm text-indigo-700">
                      Vas a pagar <span className="font-bold">{total.toFixed(2)} €</span> con{' '}
                      <span className="font-medium">{selectedPaymentMethod?.name}</span>
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={processPayment}
                      disabled={processing}
                      className="flex-1 bg-indigo-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-5 w-5" />
                          Sí, pagar {total.toFixed(2)} €
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setShowConfirmation(false)}
                      disabled={processing}
                      className="flex-1 bg-gray-200 text-gray-700 py-4 px-6 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
