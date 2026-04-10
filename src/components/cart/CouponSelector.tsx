/**
 * CouponSelector Component
 * Selector de cupones con dropdown de cupones disponibles
 * Simplificado y sin errores confusos
 */
"use client";

import { useState, useEffect } from "react";
import {
  Ticket,
  Loader2,
  CheckCircle2,
  XCircle,
  X,
  ChevronDown,
  Tag,
} from "lucide-react";

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
}: CouponSelectorProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<AvailableCoupon[]>(
    [],
  );
  const [showDropdown, setShowDropdown] = useState(false);

  // Cargar cupones disponibles al montar el componente
  useEffect(() => {
    loadAvailableCoupons();
  }, []);

  const loadAvailableCoupons = async () => {
    try {
      const response = await fetch("/api/coupons");
      const data = await response.json();
      if (data.success) {
        setAvailableCoupons(data.coupons || []);
      }
    } catch (err) {
      console.error("Error loading coupons:", err);
    }
  };

  // Filtrar cupones válidos para el subtotal actual
  const validCoupons = availableCoupons.filter(
    (coupon) => !coupon.minOrderAmount || subtotal >= coupon.minOrderAmount,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      await onApply(code.trim().toUpperCase());
      setCode("");
      setShowDropdown(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error aplicando cupón");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCoupon = async (
    couponCode: string,
    couponCodeRaw: string,
  ) => {
    setLoading(true);
    setError(null);
    setShowDropdown(false);

    try {
      // Usar codeRaw (original en inglés) para aplicar el cupón
      await onApply(couponCodeRaw.toUpperCase());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error aplicando cupón");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setCode("");
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
              <p className="text-xs sm:text-sm font-medium text-green-800">
                Cupón aplicado
              </p>
              <p className="text-base sm:text-lg font-bold text-green-900 truncate">
                {appliedCoupon.code}
              </p>
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
              <span className="font-medium text-green-800">
                -{appliedCoupon.discount.toFixed(2)}€
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Selector de cupones disponibles */}
      {validCoupons.length > 0 && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={disabled || loading}
            className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              <span className="font-medium">
                {validCoupons.length} cupón
                {validCoupons.length !== 1 ? "es" : ""} disponible
                {validCoupons.length !== 1 ? "s" : ""}
              </span>
            </div>
            <ChevronDown
              className={`h-5 w-5 transition-transform ${showDropdown ? "rotate-180" : ""}`}
            />
          </button>

          {showDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
              {validCoupons.map((coupon) => (
                <button
                  key={coupon.id}
                  type="button"
                  onClick={() =>
                    handleSelectCoupon(coupon.code, coupon.codeRaw)
                  }
                  disabled={loading}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {coupon.code}
                      </p>
                      <p className="text-sm text-gray-600">
                        {coupon.description}
                      </p>
                    </div>
                    <Ticket className="h-5 w-5 text-indigo-600" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* O ingresar código manualmente */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Ticket className="h-5 w-5 text-gray-400" />
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            placeholder="O ingresa tu código manualmente"
            disabled={disabled || loading}
            className="flex-1 pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={disabled || loading || !code.trim()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Aplicar
          </button>
        </form>
      </div>

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
