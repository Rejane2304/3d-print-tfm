'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, Ticket, X, XCircle } from 'lucide-react';

interface CouponInputProps {
  onApply: (code: string) => Promise<void>;
  onRemove: () => void;
  appliedCoupon?: {
    code: string;
    discount: number;
    type: string;
  } | null;
  subtotal: number;
  disabled?: boolean;
}

export function CouponInput({
  onApply,
  onRemove,
  appliedCoupon,
  subtotal,
  disabled = false,
}: Readonly<CouponInputProps>) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  const handleValidate = async () => {
    if (!code.trim()) {
      return;
    }
    setValidating(true);
    setError(null);
    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          orderAmount: subtotal,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setError(null);
      } else {
        setError(data.error || 'Cupón inválido');
      }
    } catch {
      setError('Error validando cupón');
    } finally {
      setValidating(false);
    }
  };

  // Validar después de 500ms sin escribir
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCode = e.target.value.toUpperCase();
    setCode(newCode);
    setError(null);
    if (newCode.trim()) {
      setTimeout(() => {
        if (newCode === e.target.value.toUpperCase()) {
          handleValidate();
        }
      }, 500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || loading) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onApply(code.trim().toUpperCase());
      setCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error aplicando cupón');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setCode('');
    setError(null);
    onRemove();
  };

  // Si ya hay un cupón aplicado, mostrar resumen
  if (appliedCoupon) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-green-800">Cupón aplicado</p>
              <p className="text-base sm:text-lg font-bold text-green-900 truncate">{appliedCoupon.code}</p>
            </div>
          </div>
          <button
            onClick={handleRemove}
            disabled={disabled}
            className="p-2 text-green-600 hover:bg-green-100 rounded transition-colors disabled:opacity-50 \
              flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Eliminar cupón"
            aria-label="Eliminar cupón"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {appliedCoupon.discount > 0 && (
          <div className="mt-2 pt-2 border-t border-green-200">
            <div className="flex justify-between text-sm">
              <span className="text-green-700">Descuento aplicado:</span>
              <span className="font-medium text-green-800">-{appliedCoupon.discount.toFixed(2)}€</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Ticket className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            inputMode="text"
            autoComplete="off"
            value={code}
            onChange={handleCodeChange}
            placeholder="Ingresa tu código de cupón"
            disabled={disabled || loading}
            className="w-full pl-10 pr-10 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 \
              focus:ring-indigo-500 focus:border-transparent uppercase disabled:bg-gray-100 \
              disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px]"
          />

          {validating && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={disabled || loading || !code.trim()}
          className="px-4 py-2.5 sm:py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 \
            disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 \
            min-h-[44px] text-sm sm:text-base whitespace-nowrap"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Aplicar
        </button>
      </form>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <XCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <p className="text-xs text-gray-500">Ejemplos: WELCOME10, VERANO2024</p>
    </div>
  );
}
