'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * Hook para anunciar mensajes a screen readers
 * Útil para notificar cambios dinámicos en la UI
 * @returns Función announce para hacer anuncios
 */
export function useAnnouncer() {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  /**
   * Anuncia un mensaje a screen readers
   * @param message - Mensaje a anunciar
   * @param priority - 'polite' espera a que termine el lector, 'assertive' lo interrumpe
   */
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.getElementById('sr-announcer');
    if (!announcer) {
      console.warn('Live announcer not found. Make sure LiveAnnouncer is mounted in your layout.');
      return;
    }

    // Limpiar timeout anterior si existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Establecer aria-live según prioridad
    announcer.setAttribute('aria-live', priority);

    // Establecer el mensaje (usar setTimeout para asegurar que el cambio de aria-live se aplique)
    setTimeout(() => {
      announcer.textContent = message;

      // Limpiar después de un tiempo para permitir reanuncios del mismo mensaje
      timeoutRef.current = setTimeout(() => {
        announcer.textContent = '';
      }, 1000);
    }, 100);
  }, []);

  /**
   * Anuncia cambios de estado (éxito, error, etc.)
   * @param type - Tipo de estado
   * @param message - Mensaje opcional personalizado
   */
  const announceStatus = useCallback(
    (type: 'success' | 'error' | 'loading' | 'info', message?: string) => {
      const defaultMessages = {
        success: 'Operación completada con éxito',
        error: 'Ha ocurrido un error',
        loading: 'Cargando...',
        info: 'Información actualizada',
      };

      announce(message || defaultMessages[type], type === 'error' ? 'assertive' : 'polite');
    },
    [announce],
  );

  return {
    announce,
    announceStatus,
  };
}
