/**
 * Página del Carrito de Compras
 * Muestra items del carrito y permite gestionarlos
 * Responsive: mobile → desktop
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import CartItem from '@/components/cart/CartItem';
import CartSummary from '@/components/cart/CartSummary';
import { Loader2, AlertCircle } from 'lucide-react';

interface CartItemData {
  id: string;
  productoId: string;
  cantidad: number;
  precioUnitario: number;
  producto: {
    id: string;
    nombre: string;
    slug: string;
    precio: number;
    stock: number;
    imagen: string | null;
  };
}

interface CartData {
  id: string | null;
  items: CartItemData[];
  subtotal: number;
  totalItems: number;
}

export default function CarritoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Cargar carrito al montar el componente
  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/carrito');
      return;
    }

    fetchCart();
  }, [status, router]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/carrito');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar el carrito');
      }
      
      setCart(data.carrito);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId: string, cantidad: number) => {
    try {
      setUpdatingItem(itemId);
      
      const response = await fetch(`/api/carrito/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cantidad }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar cantidad');
      }
      
      // Recargar carrito
      await fetchCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      setUpdatingItem(itemId);
      
      const response = await fetch(`/api/carrito/${itemId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar item');
      }
      
      // Recargar carrito
      await fetchCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleCheckout = () => {
    setIsProcessing(true);
    // Redirigir a checkout
    router.push('/checkout');
  };

  const handleContinueShopping = () => {
    router.push('/productos');
  };

  // Mostrar loading mientras verifica sesión
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando carrito...</p>
        </div>
      </div>
    );
  }

  // Si no hay sesión, redirigir
  if (status === 'unauthenticated') {
    return null; // El useEffect ya redirige
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Tu Carrito
          </h1>
          <p className="text-gray-600 text-lg">
            Revisa tus items y procede al pago cuando estés listo
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              Cerrar
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de items */}
          <div className="lg:col-span-2">
            {cart?.items && cart.items.length > 0 ? (
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemoveItem}
                    isUpdating={updatingItem === item.id}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <svg
                    className="h-24 w-24 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Tu carrito está vacío
                </h2>
                <p className="text-gray-600 mb-6">
                  Añade algunos productos para comenzar tu compra
                </p>
                <button
                  onClick={handleContinueShopping}
                  className="bg-indigo-600 text-white py-3 px-8 rounded-md font-medium hover:bg-indigo-700 transition-colors"
                >
                  Explorar productos
                </button>
              </div>
            )}
          </div>

          {/* Resumen */}
          <div className="lg:col-span-1">
            <CartSummary
              items={cart?.items || []}
              subtotal={cart?.subtotal || 0}
              isProcessing={isProcessing}
              onCheckout={handleCheckout}
              onContinueShopping={handleContinueShopping}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
