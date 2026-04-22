/**
 * Query Client Configuration
 * Configuración de TanStack Query (React Query) para el proyecto 3D Print TFM
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Cache data for 10 minutes after last use
      gcTime: 10 * 60 * 1000, // 10 minutes (antes cacheTime)
      // Retry failed queries 3 times
      retry: 3,
      // Exponential backoff for retries
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Don't refetch on window focus to avoid unnecessary reloads
      refetchOnWindowFocus: false,
      // Refetch when reconnecting to network
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});

// Export for use in other modules
export default queryClient;
