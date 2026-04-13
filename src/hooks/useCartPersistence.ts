'use client';

import { useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';

const CART_STORAGE_KEY = 'cart';
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

/**
 * Hook to manage cart persistence
 * - Authenticated users: Persistent cart in database
 * - Guest users: Cart is cleared on logout or after inactivity
 */
export function useCartPersistence() {
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';

  // Function to clear guest cart
  const clearGuestCart = useCallback(() => {
    if (!isAuthenticated) {
      localStorage.removeItem(CART_STORAGE_KEY);
      window.dispatchEvent(new Event('cartUpdated'));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    // For NON-authenticated users
    if (!isAuthenticated) {
      let inactivityTimer: NodeJS.Timeout;

      // Reset inactivity timer
      const resetInactivityTimer = () => {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
          clearGuestCart();
        }, INACTIVITY_TIMEOUT);
      };

      // Events that indicate user activity
      const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];

      // Start timer
      resetInactivityTimer();

      // Add listeners
      activityEvents.forEach((event) => {
        document.addEventListener(event, resetInactivityTimer);
      });

      // Clear cart when closing tab (for guests)
      const handleBeforeUnload = () => {
        // Only clear if not a refresh
        if (!sessionStorage.getItem('isRefreshing')) {
          localStorage.removeItem(CART_STORAGE_KEY);
        }
      };

      // Mark when refreshing
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
        activityEvents.forEach((event) => {
          document.removeEventListener(event, resetInactivityTimer);
        });
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('load', handleLoad);
      };
    }
  }, [isAuthenticated, isLoading, clearGuestCart]);

  return { clearGuestCart };
}
