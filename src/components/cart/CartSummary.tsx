
'use client';
/**
 * Updated CartSummary Component with Coupon Support
 * Resumen del carrito con integración de cupones
 */

import { ArrowRight, Loader2, ShoppingCart, Tag } from 'lucide-react';
import { CouponSelector } from './CouponSelector';

interface CartSummaryProps {
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    product: {
      name: string;
      price: number;
    };
  }>;
  subtotal: number;
  shippingCost?: number;
  freeShippingFrom?: number;
  taxRate?: number; // IVA (porcentaje, ej: 21 para 21%)
  isProcessing?: boolean;
  onCheckout: () => void;
  onContinueShopping: () => void;
  onApplyCoupon?: (code: string) => Promise<void>;
  onRemoveCoupon?: () => void;
  appliedCoupon?: {
    code: string;
    discount: number;
    type: string;
    freeShipping?: boolean;
  } | null;
}

const CartSummary: React.FC<Readonly<CartSummaryProps>> = ({
  items,
  subtotal,
  shippingCost = 5.99,
  freeShippingFrom = 50,
  taxRate = 21,
  isProcessing = false,
  onCheckout,
  onContinueShopping,
  onApplyCoupon,
  onRemoveCoupon,
  appliedCoupon,
}) => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const hasFreeShippingCoupon = appliedCoupon?.freeShipping === true;
  const isFreeShipping = subtotal >= freeShippingFrom || hasFreeShippingCoupon;
  const shipping = isFreeShipping ? 0 : shippingCost;
  const couponDiscount = appliedCoupon?.discount || 0;
  const discountedSubtotal = Math.max(0, subtotal - couponDiscount);
  const taxMultiplier = taxRate / 100;
  const taxAmount = (discountedSubtotal + shipping) * taxMultiplier;
  const total = discountedSubtotal + shipping + taxAmount;
  const hasItems = items.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 lg:sticky lg:top-24">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
        <ShoppingCart className="h-5 w-5 flex-shrink-0" />
        Resumen del pedido
      </h2>

      {hasItems ? (
        <>
          {/* Items count */}
          <div className="mb-4 text-sm text-gray-600">
            {totalItems} {totalItems === 1 ? 'artículo' : 'artículos'}
          </div>

          {/* Sección de Cupón */}
          {onApplyCoupon && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <Tag className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700">
                  Código de descuento
                </span>
              </div>
              <CouponSelector
                onApply={onApplyCoupon}
                onRemove={onRemoveCoupon || (() => {})}
                appliedCoupon={appliedCoupon}
                subtotal={subtotal}
                disabled={isProcessing}
              />
            </div>
          )}

          {/* Desglose completo con IVA separado (Transparente) */}

          {/* Subtotal (sin IVA) */}
          <div className="flex justify-between py-2 border-b border-gray-100 text-sm sm:text-base">
            <span className="text-gray-600">Subtotal (sin IVA)</span>
            <span className="font-medium">{subtotal.toFixed(2)} €</span>
          </div>

          {/* Descuento por cupón */}
          {couponDiscount > 0 && (
            <div className="flex justify-between py-2 border-b border-gray-100 text-sm sm:text-base">
              <span className="text-green-600">
                Descuento {appliedCoupon?.code && `(${appliedCoupon.code})`}
              </span>
              <span className="font-medium text-green-600">
                -{couponDiscount.toFixed(2)} €
              </span>
            </div>
          )}

          {/* Envío */}
          <div className="flex justify-between py-2 border-b border-gray-100 text-sm sm:text-base">
            <span className="text-gray-600">Envío</span>
            <span
              className={
                isFreeShipping ? 'text-green-600 font-medium' : 'font-medium'
              }
            >
              {isFreeShipping ? 'Gratis' : `${shipping.toFixed(2)} €`}
            </span>
          </div>

          {/* Info envío gratis */}
          {!isFreeShipping && subtotal > 0 && (
            <div className="text-xs sm:text-sm text-blue-600 mt-2">
              Te falta {(freeShippingFrom - subtotal).toFixed(2)} € para envío
              gratis
            </div>
          )}

          {/* IVA (separado y transparente) */}
          <div className="flex justify-between py-2 border-b border-gray-100 text-sm sm:text-base">
            <span className="text-gray-600">IVA ({taxRate}%)</span>
            <span className="font-medium">{taxAmount.toFixed(2)} €</span>
          </div>

          {/* Total Final */}
          <div className="flex justify-between py-3 sm:py-4 mt-3 sm:mt-4 border-t-2 border-gray-200">
            <span className="text-base sm:text-lg font-bold text-gray-900">
              Total a pagar
            </span>
            <span className="text-xl sm:text-2xl font-bold text-indigo-600">
              {total.toFixed(2)} €
            </span>
          </div>

          {/* Botones de acción */}
          <div className="space-y-2 sm:space-y-3 mt-4 sm:mt-6">
            <button
              type="button"
              onClick={onCheckout}
              disabled={isProcessing || !hasItems}
              data-testid="checkout-button"
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md font-medium hover:bg-indigo-700 \
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 \
                disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors min-h-[44px]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  <span className="text-sm sm:text-base">Procesando...</span>
                </>
              ) : (
                <>
                  <span className="text-sm sm:text-base">Proceder al pago</span>
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onContinueShopping}
              disabled={isProcessing}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-md font-medium hover:bg-gray-200 \
                focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 \
                transition-colors min-h-[44px] text-sm sm:text-base"
            >
              Seguir comprando
            </button>
          </div>
        </>
      ) : (
        /* Carrito vacío */
        <div className="text-center py-6 sm:py-8">
          <ShoppingCart className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
            Tu carrito está vacío
          </h3>
          <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">
            Añade algunos productos para continuar
          </p>
          <button
            type="button"
            onClick={onContinueShopping}
            className="bg-indigo-600 text-white py-2.5 sm:py-2 px-6 rounded-md font-medium hover:bg-indigo-700 \
              transition-colors min-h-[44px]"
          >
            Explorar productos
          </button>
        </div>
      )}
    </div>
  );
};
export default CartSummary;
