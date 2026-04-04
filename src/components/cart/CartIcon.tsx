/**
 * CartIcon Component
 * Modern shopping bag icon with animated counter
 * Works for authenticated (API) and unauthenticated (localStorage) users
 * Positioned on the right side of header
 */
'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/hooks/useCart';

export default function CartIcon() {
  const { cart } = useCart();
  const itemCount = cart?.totalItems || 0;

  return (
    <Link
      href="/cart"
      data-testid="cart-icon"
      className="relative flex items-center justify-center w-10 h-10 rounded-full text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
      aria-label="Ver carrito"
      title="Carrito"
    >
      <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />

      {itemCount > 0 && (
        <span 
          data-testid="cart-count" 
          className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm animate-in zoom-in duration-200"
        >
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Link>
  );
}
