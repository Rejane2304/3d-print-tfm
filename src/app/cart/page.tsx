/**
 * Shopping Cart Page with Coupon Support
 * Displays cart items and allows managing them including coupon application
 * Responsive: mobile → 4K
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import CartItem from '@/components/cart/CartItem';
import CartSummary from '@/components/cart/CartSummary';
import { useCoupon } from '@/hooks/useCoupon';
import { Loader2, AlertCircle, Info } from 'lucide-react';
import Link from 'next/link';

export default function CarritoPage() {
  const router = useRouter();
  const { 
    cart, 
    loading, 
    error, 
    setError, 
    isAuthenticated,
    updateQuantity, 
    removeItem
  } = useCart();
  
  const { 
    appliedCoupon, 
    applyCoupon, 
    removeCoupon 
  } = useCoupon();
  
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    try {
      setUpdatingItem(itemId);
      const result = await updateQuantity(itemId, quantity);
      if (!result.success) {
        throw new Error(result.error || 'Error al actualizar');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      setUpdatingItem(itemId);
      const result = await removeItem(itemId);
      if (!result.success) {
        throw new Error(result.error || 'Error al eliminar item');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleApplyCoupon = async (code: string) => {
    try {
      await applyCoupon(code);
    } catch (err) {
      // El error ya se maneja en el hook
      throw err;
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      router.push('/auth?callbackUrl=/checkout');
      return;
    }
    
    // Guardar el cupón aplicado en localStorage para usarlo en checkout
    if (appliedCoupon) {
      localStorage.setItem('appliedCoupon', JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem('appliedCoupon');
    }
    
    setIsProcessing(true);
    router.push('/checkout');
  };

  const handleContinueShopping = () => {
    router.push('/products');
  };

  // Show loading while loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 text-sm sm:text-base">Cargando carrito...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
            Tu Carrito
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Revisa tus items y procede al pago cuando estés listo
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 sm:gap-3">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700 text-sm flex-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Info para usuarios no autenticados */}
        {!isAuthenticated && cart?.items && cart.items.length > 0 && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-md flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0 mt-0.5 sm:mt-0" />
            <div className="flex-1">
              <p className="text-blue-700 text-sm">
                Estás comprando como invitado. Para finalizar tu compra, necesitarás iniciar sesión o registrarte.
              </p>
            </div>
            <Link
              href="/auth?callbackUrl=/checkout"
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap text-center"
            >
              Iniciar sesión
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Lista de items */}
          <div className="lg:col-span-2">
            {cart?.items && cart.items.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
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
              <div data-testid="empty-cart" className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <svg
                    className="h-16 w-16 sm:h-24 sm:w-24 mx-auto"
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
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  Tu carrito está vacío
                </h2>
                <p className="text-sm sm:text-base text-gray-600 mb-6">
                  Añade algunos productos para comenzar tu compra
                </p>
                <button
                  onClick={handleContinueShopping}
                  className="bg-indigo-600 text-white py-2.5 sm:py-3 px-6 sm:px-8 rounded-md font-medium hover:bg-indigo-700 transition-colors text-sm sm:text-base"
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
              onApplyCoupon={isAuthenticated && (cart?.items?.length || 0) > 0 ? handleApplyCoupon : undefined}
              onRemoveCoupon={handleRemoveCoupon}
              appliedCoupon={appliedCoupon}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
