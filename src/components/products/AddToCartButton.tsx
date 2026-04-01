/**
 * AddToCartButton Component
 * Botón para añadir productos al carrito desde la página de detalle
 * Responsive: mobile → desktop
 */
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Check, Loader2 } from 'lucide-react';

interface AddToCartButtonProps {
  productoId: string;
  stock: number;
}

export default function AddToCartButton({ productoId, stock }: AddToCartButtonProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddToCart = async () => {
    // Verificar si está autenticado
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=' + encodeURIComponent(window.location.pathname));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const response = await fetch('/api/carrito', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productoId,
          cantidad,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al añadir al carrito');
      }

      // Mostrar éxito temporalmente
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);

      // Refrescar la página para actualizar el carrito
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Si no hay stock, deshabilitar botón
  const isOutOfStock = stock <= 0;

  return (
    <div className="space-y-4">
      {/* Selector de cantidad */}
      <div className="flex items-center gap-4">
        <label htmlFor="cantidad" className="text-sm font-medium text-gray-700">
          Cantidad:
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCantidad(Math.max(1, cantidad - 1))}
            disabled={cantidad <= 1 || loading || isOutOfStock}
            className="p-2 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Decrementar cantidad"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          
          <input
            type="number"
            id="cantidad"
            value={cantidad}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              if (!isNaN(value)) {
                setCantidad(Math.max(1, Math.min(value, stock)));
              }
            }}
            min={1}
            max={stock}
            disabled={loading || isOutOfStock}
            className="w-16 text-center border border-gray-300 rounded-md py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          
          <button
            type="button"
            onClick={() => setCantidad(Math.min(stock, cantidad + 1))}
            disabled={cantidad >= stock || loading || isOutOfStock}
            className="p-2 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Incrementar cantidad"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Botón de añadir al carrito */}
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={loading || isOutOfStock}
        className={`w-full py-3 px-6 rounded-md font-medium text-white transition-all duration-200 flex items-center justify-center gap-2 ${
          success
            ? 'bg-green-600 hover:bg-green-700'
            : isOutOfStock
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Añadiendo...
          </>
        ) : success ? (
          <>
            <Check className="h-5 w-5" />
            ¡Añadido!
          </>
        ) : isOutOfStock ? (
          <>
            <ShoppingCart className="h-5 w-5" />
            Agotado
          </>
        ) : (
          <>
            <ShoppingCart className="h-5 w-5" />
            Añadir al carrito
          </>
        )}
      </button>

      {/* Mensaje de error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Enlace al carrito */}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-700 mb-2">
            Producto añadido correctamente
          </p>
          <a
            href="/carrito"
            className="text-sm font-medium text-green-700 hover:text-green-800 underline"
          >
            Ver carrito →
          </a>
        </div>
      )}
    </div>
  );
}
