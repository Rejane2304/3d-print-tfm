/**
 * Página de Checkout
 * Permite al usuario seleccionar dirección y proceder al pago con Stripe
 * Responsive: mobile → desktop
 */
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, MapPin, CreditCard, ChevronRight } from 'lucide-react';

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
}

interface CarritoItem {
  id: string;
  quantity: number;
  unitPrice: number;
  producto: {
    id: string;
    nombre: string;
    slug: string;
    imagen: string | null;
  };
}

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [direcciones, setDirecciones] = useState<Direccion[]>([]);
  const [direccionSeleccionada, setDireccionSeleccionada] = useState<string>('');
  const [carrito, setCarrito] = useState<{ items: CarritoItem[]; subtotal: number } | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/checkout');
      return;
    }

    if (status === 'authenticated') {
      cargarDatos();
    }
  }, [status, router]);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      // Cargar direcciones
      const resDirecciones = await fetch('/api/direcciones');
      if (resDirecciones.ok) {
        const data = await resDirecciones.json();
        setDirecciones(data.direcciones || []);
        // Seleccionar dirección principal por defecto
        const principal = data.direcciones?.find((d: Direccion) => d.isPrimary);
        if (principal) {
          setDireccionSeleccionada(principal.id);
        }
      }

      // Cargar carrito
      const resCarrito = await fetch('/api/cart');
      if (resCarrito.ok) {
        const data = await resCarrito.json();
        setCarrito(data.carrito);

        // Si el carrito está vacío, redirigir
        if (!data.carrito?.items?.length) {
          router.push('/cart');
        }
      }
    } catch (err) {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleProcederPago = async () => {
    if (!direccionSeleccionada) {
      setError('Selecciona una dirección de envío');
      return;
    }

    try {
      setProcesando(true);
      setError(null);

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shippingAddressId: direccionSeleccionada,
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
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setProcesando(false);
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

  const gastosEnvio = (carrito?.subtotal || 0) >= 50 ? 0 : 5.99;
  const total = (carrito?.subtotal || 0) + gastosEnvio;

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

              {direcciones.length === 0 ? (
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
                  {direcciones.map((direccion) => (
                    <label
                      key={direccion.id}
                      className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        direccionSeleccionada === direccion.id
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="direccion"
                        value={direccion.id}
                        checked={direccionSeleccionada === direccion.id}
                        onChange={(e) => setDireccionSeleccionada(e.target.value)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{direccion.nombre}</span>
                          {direccion.isPrimary && (
                            <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                              Principal
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {direccion.destinatario}
                        </p>
                        <p className="text-sm text-gray-600">
                          {direccion.direccion}
                          {direccion.complemento && `, ${direccion.complemento}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          {direccion.postalCode} {direccion.ciudad},{' '}
                          {direccion.provincia}
                        </p>
                        <p className="text-sm text-gray-600">
                          Tel: {direccion.telefono}
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
              {carrito?.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 py-3 border-b border-gray-100"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.producto.nombre}</p>
                    <p className="text-sm text-gray-600">
                      {item.quantity} x {item.unitPrice.toFixed(2)} €
                    </p>
                  </div>
                  <p className="font-semibold">
                    {(item.quantity * item.unitPrice).toFixed(2)} €
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
                  <span>{carrito?.subtotal.toFixed(2) || '0.00'} €</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Envío</span>
                  <span className={gastosEnvio === 0 ? 'text-green-600' : ''}>
                    {gastosEnvio === 0 ? 'Gratis' : `${gastosEnvio.toFixed(2)} €`}
                  </span>
                </div>
                {gastosEnvio > 0 && (
                  <p className="text-sm text-blue-600">
                    Te faltan {(50 - (carrito?.subtotal || 0)).toFixed(2)} € para envío gratis
                  </p>
                )}
                <div className="flex justify-between text-xl font-bold border-t pt-3">
                  <span>Total</span>
                  <span className="text-indigo-600">{total.toFixed(2)} €</span>
                </div>
              </div>

              <button
                onClick={handleProcederPago}
                disabled={procesando || !direccionSeleccionada || direcciones.length === 0}
                className="w-full bg-indigo-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {procesando ? (
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
