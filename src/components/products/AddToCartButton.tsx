/**
 * AddToCartButton Component
 * Botón para añadir productos al carrito desde la página de detalle
 * Soporta usuarios autenticados (API) y no autenticados (localStorage)
 * Responsive: mobile → desktop
 */
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useCart } from '@/hooks/useCart';
import { ShoppingCart, Check, Loader2 } from 'lucide-react';

interface ProductInfo {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  image: string | null;
}

interface AddToCartButtonProps {
  productId: string;
  stock: number;
  product: ProductInfo;
}

export default function AddToCartButton({ productId, stock, product }: AddToCartButtonProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { status } = useSession();
  const { addItem } = useCart();
  
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddToCart = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const result = await addItem(productId, quantity, product);

      if (!result.success) {
        throw new Error(result.error || 'Error al añadir al carrito');
      }

      // Mostrar éxito temporalmente
      // El evento cartUpdated ya se disparó en addItem, que actualizará el contador
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error unknown');
    } finally {
      setLoading(false);
    }
  };

  // Si no hay stock, deshabilitar botón
  const isOutOfStock = stock <= 0;

  return (
    <div className="space-y-4" data-testid="add-to-cart-container">
      {/* Selector de quantity */}
      <div className="flex items-center gap-4">
        <label htmlFor="quantity" className="text-sm font-medium text-gray-700">
          Cantidad:
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1 || loading || isOutOfStock}
            className="p-2 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Decrementar quantity"
            data-testid="decrease-quantity"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          
          <input
            type="number"
            id="quantity"
            data-testid="quantity-input"
            value={quantity}
            onChange={(e) => {
              const value = Number.parseInt(e.target.value, 10);
              if (!isNaN(value)) {
                setQuantity(Math.max(1, Math.min(value, stock)));
              }
            }}
            min={1}
            max={stock}
            disabled={loading || isOutOfStock}
            className="w-16 text-center border border-gray-300 rounded-md py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          
          <button
            type="button"
            onClick={() => setQuantity(Math.min(stock, quantity + 1))}
            disabled={quantity >= stock || loading || isOutOfStock}
            className="p-2 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Incrementar quantity"
            data-testid="increase-quantity"
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
        data-testid="add-to-cart-button"
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
            href="/cart"
            className="text-sm font-medium text-green-700 hover:text-green-800 underline"
          >
            Ver carrito →
          </a>
        </div>
      )}
    </div>
  );
}
