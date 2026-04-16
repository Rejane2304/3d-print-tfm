/**
 * Hook para manejar la redirección post-autenticación
 * Usuarios normales: -> catálogo si carrito vacío, -> callbackUrl si tiene items
 * Admin: -> /admin/dashboard
 */
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

const CART_STORAGE_KEY = 'cart';

/**
 * Verifica si el carrito (localStorage) tiene items
 */
function hasCartItems(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const cartData = localStorage.getItem(CART_STORAGE_KEY);
    if (!cartData) return false;

    const cart = JSON.parse(cartData);
    return cart?.items?.length > 0;
  } catch {
    return false;
  }
}

export function useAuthRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const justRegistered = searchParams.get('registro') === 'exitoso';

  useEffect(() => {
    if (status !== 'authenticated' || !session) {
      return;
    }

    // Si estamos migrando el carrito, no redirigir aún
    const migratingCart = sessionStorage.getItem('migratingCart');
    if (migratingCart) {
      return;
    }

    const userRole = (session.user as { role?: string })?.role;

    if (userRole === 'ADMIN') {
      // Admin siempre va al dashboard
      router.push('/admin/dashboard');
    } else if (!justRegistered) {
      // Usuario normal: verificar carrito
      const cartHasItems = hasCartItems();

      if (cartHasItems) {
        // Si tiene items en carrito, ir al callbackUrl (o home)
        router.push(callbackUrl);
      } else {
        // Si carrito vacío, ir al catálogo de productos
        router.push('/products');
      }
    }
  }, [status, session, router, callbackUrl, justRegistered]);

  return { status, justRegistered };
}
