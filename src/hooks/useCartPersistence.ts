'use client';

import { useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

const CART_STORAGE_KEY = 'cart';
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos

/**
 * Hook para gestionar la persistencia del carrito
 * - Usuarios autenticados: Carrito persistente en BD
 * - Usuarios no autenticados: Carrito se limpia al cerrar sesión o después de inactividad
 */
export function useCartPersistence() {
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';

  // Función para limpiar carrito de invitado
  const clearGuestCart = useCallback(() => {
    if (!isAuthenticated) {
      localStorage.removeItem(CART_STORAGE_KEY);
      window.dispatchEvent(new Event('cartUpdated'));
      console.log('[CartPersistence] Carrito de invitado limpiado');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isLoading) return;

    // Para usuarios NO autenticados
    if (!isAuthenticated) {
      let inactivityTimer: NodeJS.Timeout;

      // Resetear timer de inactividad
      const resetInactivityTimer = () => {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
          clearGuestCart();
        }, INACTIVITY_TIMEOUT);
      };

      // Eventos que indican actividad del usuario
      const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
      
      // Iniciar timer
      resetInactivityTimer();

      // Agregar listeners
      activityEvents.forEach(event => {
        document.addEventListener(event, resetInactivityTimer);
      });

      // Limpiar carrito al cerrar la pestaña (para invitados)
      const handleBeforeUnload = () => {
        // Solo limpiar si no es un refresh
        if (!sessionStorage.getItem('isRefreshing')) {
          localStorage.removeItem(CART_STORAGE_KEY);
        }
      };

      // Marcar cuando se está refrescando
      const handleLoad = () => {
        sessionStorage.setItem('isRefreshing', 'true');
        setTimeout(() => {
          sessionStorage.removeItem('isRefreshing');
        }, 1000);
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('load', handleLoad);

      return () => {
        clearTimeout(inactivityTimer);
        activityEvents.forEach(event => {
          document.removeEventListener(event, resetInactivityTimer);
        });
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('load', handleLoad);
      };
    }
  }, [isAuthenticated, isLoading, clearGuestCart]);

  return { clearGuestCart };
}
