/**
 * CartIcon Component
 * Ícono del carrito con contador de items
 * Funciona para usuarios autenticados (API) y no autenticados (localStorage)
 * Se muestra en el Header
 */
'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';

export default function CartIcon() {
  const { cart, loading } = useCart();
  const itemCount = cart?.totalItems || 0;

  return (
    <Link
      href="/cart"
      data-testid="cart-icon"
      className="relative p-2 text-gray-600 hover:text-indigo-600 transition-colors flex items-center gap-2"
      aria-label="Ver carrito"
    >
      <ShoppingCart className="h-5 w-5" />
      <span className="text-sm font-medium hidden lg:inline">Carrito</span>

      {!loading && itemCount > 0 && (
        <span data-testid="cart-count" className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
    </Link>
  );
}
