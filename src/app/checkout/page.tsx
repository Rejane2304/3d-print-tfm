/**
 * Checkout Page
 * Allows user to select address and proceed to payment with Stripe
 * Responsive: mobile → desktop
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, MapPin, CreditCard, ChevronRight } from 'lucide-react';

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
}

interface CartItem {
  id: string;
  quantity: number;
  unitPrice: number;
  product: {
    id: string;
    nombre: string;
    slug: string;
    imagen: string | null;
  };
}

export default function CheckoutPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [cart, setCart] = useState<{ items: CartItem[]; subtotal: number } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load addresses
      const resDirecciones = await fetch('/api/direcciones');
      if (resDirecciones.ok) {
        const data = await resDirecciones.json();
        setAddresses(data.direcciones || []);
        // Select primary address by default
        const principal = data.direcciones?.find((d: Address) => d.isPrimary);
        if (principal) {
          setSelectedAddress(principal.id);
        }
      }

      // Load cart
      const resCarrito = await fetch('/api/cart');
      if (resCarrito.ok) {
        const data = await resCarrito.json();
        setCart(data.carrito);

        // Si el carrito está vacío, redirigir
        if (!data.carrito?.items?.length) {
          router.push('/cart');
        }
      }
    } catch {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/checkout');
      return;
    }

    if (status === 'authenticated') {
      loadData();
    }
  }, [status, router, loadData]);

  const handleProceedToPayment = async () => {
    if (!selectedAddress) {
      setError('Selecciona una dirección de envío');
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shippingAddressId: selectedAddress,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar checkout');
      }

      // Redirigir a Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error unknown');
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
  const total = (cart?.subtotal || 0) + shippingCost;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Checkout
          </h1>
          <p className="text-gray-600">
            Revisa tu pedido y selecciona dirección de envío
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Selección de dirección */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-indigo-600" />
                <h2 className="text-xl font-semibold">Dirección de envío</h2>
              </div>

              {addresses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    No tienes direcciones guardadas
                  </p>
                  <a
                    href="/account/direcciones"
                    className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800"
                  >
                    Agregar dirección <ChevronRight className="h-4 w-4" />
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedAddress === address.id
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="direccion"
                        value={address.id}
                        checked={selectedAddress === address.id}
                        onChange={(e) => setSelectedAddress(e.target.value)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{address.nombre}</span>
                          {address.isPrimary && (
                            <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                              Principal
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {address.destinatario}
                        </p>
                        <p className="text-sm text-gray-600">
                          {address.direccion}
                          {address.complemento && `, ${address.complemento}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          {address.postalCode} {address.ciudad},{' '}
                          {address.provincia}
                        </p>
                        <p className="text-sm text-gray-600">
                          Tel: {address.telefono}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Resumen de items */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Resumen del pedido</h2>
               {cart?.items.map((item) => (
                 <div
                   key={item.id}
                   className="flex items-center gap-4 py-3 border-b border-gray-100"
                 >
                   <div className="flex-1">
                     <p className="font-medium">{item.product.nombre}</p>
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

          {/* Totales y pago */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-6">Total del pedido</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{cart?.subtotal.toFixed(2) || '0.00'} €</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Envío</span>
                  <span className={shippingCost === 0 ? 'text-green-600' : ''}>
                    {shippingCost === 0 ? 'Gratis' : `${shippingCost.toFixed(2)} €`}
                  </span>
                </div>
                {shippingCost > 0 && (
                  <p className="text-sm text-blue-600">
                    Te faltan {(50 - (cart?.subtotal || 0)).toFixed(2)} € para envío gratis
                  </p>
                )}
                <div className="flex justify-between text-xl font-bold border-t pt-3">
                  <span>Total</span>
                  <span className="text-indigo-600">{total.toFixed(2)} €</span>
                </div>
              </div>

              <button
                onClick={handleProceedToPayment}
                disabled={processing || !selectedAddress || addresses.length === 0}
                data-testid="complete-checkout-button"
                className="w-full bg-indigo-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    Proceder al pago
                  </>
                )}
              </button>

              <p className="text-sm text-gray-500 mt-4 text-center">
                Serás redirigido a Stripe para completar el pago de forma segura
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
