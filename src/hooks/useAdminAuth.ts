/**
 * useAdminAuth Hook
 * Maneja la autenticación y autorización para páginas de administración
 * Evita la duplicación de código en páginas admin
 */
'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface UseAdminAuthOptions {
  callbackUrl?: string;
}

export function useAdminAuth(options: UseAdminAuthOptions = {}) {
  const { callbackUrl = '/admin/dashboard' } = options;
  const { data: session, status } = useSession();
  const router = useRouter();

  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';
  const user = session?.user as { role?: string; id?: string } | undefined;
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/auth?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    if (isAuthenticated && !isAdmin) {
      router.push('/');
      return;
    }
  }, [status, isAuthenticated, isAdmin, router, callbackUrl]);

  return {
    isAuthenticated,
    isLoading,
    isAdmin,
    user,
    status,
  };
}
