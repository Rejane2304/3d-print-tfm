/**
 * CouponSelector Component - Mejorado
 * Muestra cupones disponibles de forma clara y permite aplicarlos fácilmente
 */

'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Tag, Ticket, X, XCircle, Copy, Info, Sparkles } from 'lucide-react';

interface AvailableCoupon {
  id: string;
  code: string;
  codeRaw: string;
  description: string;
  type: string;
  value: number;
  minOrderAmount: number | null;
}

interface CouponSelectorProps {
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

export function CouponSelector({
  onApply,
  onRemove,
  appliedCoupon,
  subtotal,
  disabled = false,
}: Readonly<CouponSelectorProps>) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<AvailableCoupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Cargar cupones disponibles al montar el componente
  useEffect(() => {
    loadAvailableCoupons();
  }, []);

  const loadAvailableCoupons = async () => {
    try {
      setLoadingCoupons(true);
      const response = await fetch('/api/coupons');
      const data = await response.json();
      if (data.success) {
        setAvailableCoupons(data.coupons || []);
      }
    } catch (err) {
      console.error('Error loading coupons:', err);
    } finally {
      setLoadingCoupons(false);
    }
  };

  // Separar cupones en válidos e inválidos según el subtotal
  const validCoupons = availableCoupons.filter(coupon => !coupon.minOrderAmount || subtotal >= coupon.minOrderAmount);
  const invalidCoupons = availableCoupons.filter(coupon => coupon.minOrderAmount && subtotal < coupon.minOrderAmount);

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

  const handleSelectCoupon = async (couponCode: string, couponCodeRaw: string) => {
    setLoading(true);
    setError(null);
    try {
      await onApply(couponCodeRaw.toUpperCase());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error aplicando cupón');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (codeToCopy: string) => {
    navigator.clipboard.writeText(codeToCopy);
    setCopiedCode(codeToCopy);
    setTimeout(() => setCopiedCode(null), 2000);
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
            className="p-2 text-green-600 hover:bg-green-100 rounded transition-colors disabled:opacity-50 flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
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
    <div className="space-y-4">
      {/* Header de cupones */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-indigo-600" />
        <h3 className="font-semibold text-gray-900">Cupones de descuento</h3>
      </div>

      {/* Cupones disponibles */}
      {loadingCoupons ? (
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Cargando cupones...</span>
        </div>
      ) : validCoupons.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Haz clic en un cupón para aplicarlo:</p>
          <div className="grid grid-cols-1 gap-2">
            {validCoupons.map(coupon => (
              <button
                key={coupon.id}
                onClick={() => handleSelectCoupon(coupon.code, coupon.codeRaw)}
                disabled={disabled || loading}
                className="group relative flex items-start gap-3 p-3 bg-white border-2 border-indigo-100 rounded-lg hover:border-indigo-500 transition-all disabled:opacity-50 text-left"
              >
                {/* Icono */}
                <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                  <Tag className="h-5 w-5 text-indigo-600 group-hover:text-white transition-colors" />
                </div>

                {/* Info del cupón */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-sm">{coupon.code}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Activo
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{coupon.description}</p>
                </div>

                {/* Botón copiar */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleCopyCode(coupon.codeRaw);
                  }}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                  title="Copiar código"
                >
                  {copiedCode === coupon.codeRaw ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
          <p>No hay cupones disponibles en este momento</p>
        </div>
      )}

      {/* Cupones que requieren más compra */}
      {invalidCoupons.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-amber-600">
            <Info className="h-4 w-4" />
            <span className="text-sm font-medium">Cupones que podrás usar comprando más:</span>
          </div>
          <div className="grid grid-cols-1 gap-2 opacity-60">
            {invalidCoupons.map(coupon => (
              <div key={coupon.id} className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <Tag className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-700 text-sm">{coupon.code}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                      Requiere {coupon.minOrderAmount}€
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{coupon.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Separador */}
      {validCoupons.length > 0 && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 text-gray-500">O ingresa tu código</span>
          </div>
        </div>
      )}

      {/* Input manual */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Ticket className="h-5 w-5 text-gray-400" />
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={e => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            placeholder="Escribe tu código de cupón"
            disabled={disabled || loading}
            className="flex-1 pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase disabled:bg-gray-100 text-sm"
          />
          <button
            type="submit"
            disabled={disabled || loading || !code.trim()}
            className="px-4 sm:px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap text-sm"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Aplicar
          </button>
        </div>
      </form>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          <XCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
