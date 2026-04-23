'use client';

import { Package } from 'lucide-react';
import Image from 'next/image';
import type { AppliedCoupon, CartItem } from '../hooks/useCheckoutData';

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  appliedCoupon: AppliedCoupon | null;
}

const FREE_SHIPPING_THRESHOLD = 50;
const DEFAULT_SHIPPING_COST = 5.99;
const VAT_RATE = 0.21;

function calculateShipping(subtotalWithVAT: number, coupon: AppliedCoupon | null): number {
  if (subtotalWithVAT >= FREE_SHIPPING_THRESHOLD) {
    return 0;
  }
  if (coupon?.type === 'FREE_SHIPPING') {
    return 0;
  }
  return DEFAULT_SHIPPING_COST;
}

function calculateDiscount(subtotalWithVAT: number, coupon: AppliedCoupon | null): number {
  if (!coupon) {
    return 0;
  }
  if (coupon.type === 'PERCENTAGE') {
    return subtotalWithVAT * (coupon.discount / 100);
  }
  return coupon.discount;
}

function formatCurrency(value: number): string {
  return value.toFixed(2);
}

export function OrderItems({ items }: Readonly<{ items: CartItem[] }>) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold mb-4">Artículos en tu pedido</h2>

      {items.map(item => (
        <div key={item.id} className="flex items-center gap-3 sm:gap-4 py-3 border-b border-gray-100 last:border-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 flex-shrink-0 overflow-hidden relative rounded">
            {item.product.image ? (
              <Image
                src={item.product.image}
                alt={item.product.name}
                fill
                sizes="(max-width: 640px) 64px, 80px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <Package className="w-full h-full p-3 sm:p-4 text-gray-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm sm:text-base truncate">{item.product.name}</p>
            <p className="text-sm text-gray-600">
              {item.quantity} x {(item.unitPrice || 0).toFixed(2)} €
            </p>
          </div>
          <p className="font-semibold text-sm sm:text-base whitespace-nowrap">
            {((item.quantity || 1) * (item.unitPrice || 0)).toFixed(2)} €
          </p>
        </div>
      ))}
    </div>
  );
}

export function OrderTotals({ subtotal, coupon }: Readonly<{ subtotal: number; coupon: AppliedCoupon | null }>) {
  // El subtotal viene con IVA incluido desde el carrito
  const couponDiscount = calculateDiscount(subtotal, coupon);
  const finalShippingCost = calculateShipping(subtotal, coupon);
  const subtotalAfterDiscount = Math.max(0, subtotal - couponDiscount);

  // Calcular IVA incluido en el subtotal (para mostrarlo por transparencia)
  // IVA = precio_con_iva - precio_sin_iva
  const vatAmountIncluded = subtotalAfterDiscount - subtotalAfterDiscount / (1 + VAT_RATE);

  // Total final: subtotal (con IVA) - descuento + envío (sin IVA)
  const total = subtotalAfterDiscount + finalShippingCost;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <h3 className="text-lg sm:text-xl font-semibold mb-4">Resumen del pedido</h3>

      <div className="space-y-3">
        {/* Subtotal */}
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)} €</span>
        </div>

        {/* Info de IVA incluido */}
        <div className="text-xs text-gray-500 -mt-2 mb-2">IVA incluido</div>

        {/* Descuento por cupón */}
        {couponDiscount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Descuento {coupon?.code && `(${coupon.code})`}</span>
            <span>-{formatCurrency(couponDiscount)} €</span>
          </div>
        )}

        {/* Envío */}
        <div className="flex justify-between text-gray-600">
          <span>Envío</span>
          <span className={finalShippingCost === 0 ? 'text-green-600 font-medium' : ''}>
            {finalShippingCost === 0 ? 'Gratis' : `${formatCurrency(finalShippingCost)} €`}
          </span>
        </div>

        {/* Desglose del IVA (transparencia fiscal) */}
        <div className="border-t border-gray-100 pt-2 mt-2">
          <div className="flex justify-between text-gray-500 text-sm">
            <span>Incluye IVA (21%)</span>
            <span>{formatCurrency(vatAmountIncluded)} €</span>
          </div>
        </div>

        {/* Total Final */}
        <div className="flex justify-between text-xl font-bold border-t-2 border-gray-200 pt-4 mt-4">
          <span>Total a pagar</span>
          <span className="text-indigo-600">{formatCurrency(total)} €</span>
        </div>
      </div>
    </div>
  );
}

export function OrderSummary({ items, subtotal, appliedCoupon }: Readonly<OrderSummaryProps>) {
  return (
    <div className="space-y-4">
      <OrderItems items={items} />
      <OrderTotals subtotal={subtotal} coupon={appliedCoupon} />
    </div>
  );
}
