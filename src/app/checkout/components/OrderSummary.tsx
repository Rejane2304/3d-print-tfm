'use client';

import { Package } from 'lucide-react';
import Image from 'next/image';
import type { AppliedCoupon, CartItem } from '../hooks/useCheckoutData';

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  appliedCoupon: AppliedCoupon | null;
}

interface OrderTotalsProps {
  subtotal: number;
  coupon: AppliedCoupon | null;
}

const TAX_RATE = 0.21;
const FREE_SHIPPING_THRESHOLD = 50;
const DEFAULT_SHIPPING_COST = 5.99;

function calculateShipping(subtotal: number, coupon: AppliedCoupon | null): number {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    return 0;
  }
  if (coupon?.type === 'FREE_SHIPPING') {
    return 0;
  }
  return DEFAULT_SHIPPING_COST;
}

function calculateDiscount(subtotal: number, coupon: AppliedCoupon | null): number {
  if (!coupon) {
    return 0;
  }
  if (coupon.type === 'PERCENTAGE') {
    return subtotal * (coupon.discount / 100);
  }
  return coupon.discount;
}

function formatCurrency(value: number): string {
  return value.toFixed(2);
}

export function OrderItems({ items }: { items: CartItem[] }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold mb-4">Resumen del pedido</h2>

      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3 sm:gap-4 py-3 border-b border-gray-100 last:border-0"
        >
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
            <p className="font-medium text-sm sm:text-base truncate">
              {item.product.name}
            </p>
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

export function OrderTotals({ subtotal, coupon }: OrderTotalsProps) {
  const couponDiscount = calculateDiscount(subtotal, coupon);
  const finalShippingCost = calculateShipping(subtotal, coupon);
  const discountedSubtotal = Math.max(0, subtotal - couponDiscount);
  const taxAmount = (discountedSubtotal + finalShippingCost) * TAX_RATE;
  const total = discountedSubtotal + finalShippingCost + taxAmount;

  return (
    <div className="border-t pt-4 sm:pt-6 mb-4 sm:mb-6">
      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
        Resumen del pedido
      </h3>

      <div className="space-y-2 sm:space-y-3">
        {/* Subtotal */}
        <div className="flex justify-between text-gray-600 text-sm sm:text-base">
          <span>Subtotal (sin IVA)</span>
          <span>{formatCurrency(subtotal)} €</span>
        </div>

        {/* Descuento por cupón */}
        {couponDiscount > 0 && (
          <div className="flex justify-between text-green-600 text-sm sm:text-base">
            <span>Descuento ({coupon?.code})</span>
            <span>-{formatCurrency(couponDiscount)} €</span>
          </div>
        )}

        {/* Envío */}
        <div className="flex justify-between text-gray-600 text-sm sm:text-base">
          <span>Envío</span>
          <span className={finalShippingCost === 0 ? 'text-green-600 font-medium' : ''}>
            {finalShippingCost === 0 ? 'Gratis' : `${formatCurrency(finalShippingCost)} €`}
          </span>
        </div>

        {/* IVA */}
        <div className="flex justify-between text-gray-600 text-sm sm:text-base">
          <span>IVA (21%)</span>
          <span>{formatCurrency(taxAmount)} €</span>
        </div>

        {/* Total Final */}
        <div className="flex justify-between text-lg sm:text-xl font-bold border-t-2 border-gray-200 pt-3 mt-2">
          <span>Total a pagar</span>
          <span className="text-indigo-600">{formatCurrency(total)} €</span>
        </div>
      </div>
    </div>
  );
}

export function OrderSummary({ items, subtotal, appliedCoupon }: OrderSummaryProps) {
  return (
    <>
      <OrderItems items={items} />
      <OrderTotals subtotal={subtotal} coupon={appliedCoupon} />
    </>
  );
}
