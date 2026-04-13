'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, Tag } from 'lucide-react';
import type { AppliedCoupon } from '../hooks/useCheckoutData';

interface CouponSectionProps {
  appliedCoupon: AppliedCoupon | null;
  onApplyCoupon: (code: string) => Promise<void>;
  onRemoveCoupon: () => void;
}

export function CouponSection({
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
}: Readonly<CouponSectionProps>) {
  const [couponCode, setCouponCode] = useState('');
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async() => {
    if (!couponCode.trim()) {
      return;
    }

    setApplying(true);
    setError(null);

    try {
      await onApplyCoupon(couponCode.trim());
      setCouponCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aplicar cupón');
    } finally {
      setApplying(false);
    }
  };

  const handleRemove = () => {
    onRemoveCoupon();
    setCouponCode('');
    setError(null);
  };

  if (appliedCoupon) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800">
              Cupón <span className="font-semibold">{appliedCoupon.code}</span> aplicado
            </span>
          </div>
          <button
            onClick={handleRemove}
            className="text-xs text-green-700 hover:text-green-900 underline"
          >
            Quitar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
      <div className="flex items-center gap-2 mb-2">
        <Tag className="h-4 w-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">¿Tienes un cupón?</span>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          placeholder="Introduce tu código"
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              void handleApply();
            }
          }}
        />
        <button
          onClick={() => void handleApply()}
          disabled={applying || !couponCode.trim()}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {applying ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Aplicar'
          )}
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-600 mt-2">{error}</p>
      )}
    </div>
  );
}
