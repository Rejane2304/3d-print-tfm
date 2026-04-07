/**
 * useCoupon Hook
 * Hook personalizado para gestionar cupones en el carrito
 */
'use client';

import { useState, useCallback } from 'react';

interface AppliedCoupon {
  code: string;
  type: string;
  value: number;
  discount: number;
  discountType: 'amount' | 'percentage' | 'free_shipping';
  freeShipping: boolean;
}

interface CouponSummary {
  subtotal: number;
  discount: number;
  discountType: 'amount' | 'percentage' | 'free_shipping';
  freeShipping: boolean;
  totalAfterDiscount: number;
}

export function useCoupon() {
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyCoupon = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error aplicando cupón');
      }

      setAppliedCoupon({
        code: data.coupon.code,
        type: data.coupon.type,
        value: data.coupon.value,
        discount: data.cartSummary.discount,
        discountType: data.cartSummary.discountType,
        freeShipping: data.cartSummary.freeShipping,
      });

      return {
        success: true,
        discount: data.cartSummary.discount,
        freeShipping: data.cartSummary.freeShipping,
        totalAfterDiscount: data.cartSummary.totalAfterDiscount,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error aplicando cupón';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setError(null);
  }, []);

  const validateCoupon = useCallback(async (code: string, orderAmount: number) => {
    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, orderAmount }),
      });

      const data = await response.json();

      return {
        valid: data.success && data.valid,
        coupon: data.coupon,
        error: data.error,
      };
    } catch {
      return {
        valid: false,
        error: 'Error validando cupón',
      };
    }
  }, []);

  const calculateDiscount = useCallback((subtotal: number): number => {
    if (!appliedCoupon) return 0;

    if (appliedCoupon.discountType === 'percentage') {
      return Math.round(subtotal * (appliedCoupon.value / 100) * 100) / 100;
    } else if (appliedCoupon.discountType === 'amount') {
      return Math.min(appliedCoupon.value, subtotal);
    }
    
    return 0;
  }, [appliedCoupon]);

  return {
    appliedCoupon,
    loading,
    error,
    applyCoupon,
    removeCoupon,
    validateCoupon,
    calculateDiscount,
  };
}
