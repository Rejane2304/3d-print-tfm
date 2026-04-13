/**
 * Hook para manejar la redirección post-autenticación
 */
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

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
      router.push('/admin/dashboard');
    } else if (!justRegistered) {
      // Solo redirigir si no acabamos de registrarnos
      router.push(callbackUrl);
    }
  }, [status, session, router, callbackUrl, justRegistered]);

  return { status, justRegistered };
}
