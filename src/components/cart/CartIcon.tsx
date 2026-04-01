/**
 * CartIcon Component
 * Ícono del carrito con contador de items
 * Se muestra en el Header
 */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

export default function CartIcon() {
  const [itemCount, setItemCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCartCount();
  }, []);

  const fetchCartCount = async () => {
    try {
      const response = await fetch('/api/carrito');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.carrito) {
          setItemCount(data.carrito.totalItems || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching cart count:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link 
      href="/carrito" 
      className="relative p-2 text-gray-700 hover:text-indigo-600 transition-colors"
      aria-label="Ver carrito"
    >
      <ShoppingCart className="h-6 w-6" />
      
      {!loading && itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
    </Link>
  );
}
