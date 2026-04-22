'use client';

import { useEffect, useRef } from 'react';
import { trapFocus, saveFocus, restoreFocus } from '@/lib/a11y/focus';

interface UseFocusTrapOptions {
  /** Si el trap está activo */
  isActive: boolean;
  /** Callback cuando se presiona Escape */
  onEscape?: () => void;
  /** Si se debe retornar el foco al cerrar */
  restoreFocusOnClose?: boolean;
}

/**
 * Hook para crear un focus trap en un elemento
 * Útil para modales, dropdowns, menús, etc.
 * @param containerRef - Ref del elemento contenedor
 * @param options - Opciones de configuración
 */
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>, options: UseFocusTrapOptions) {
  const { isActive, onEscape, restoreFocusOnClose = true } = options;
  const previousFocusRef = useRef<Element | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Guardar el foco actual antes de activar el trap
    previousFocusRef.current = saveFocus();

    // Crear el focus trap
    const { cleanup } = trapFocus(containerRef.current);
    cleanupRef.current = cleanup;

    // Focar el primer elemento focusable
    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (focusableElements.length > 0) {
      setTimeout(() => (focusableElements[0] as HTMLElement).focus(), 0);
    }

    return () => {
      cleanup();
      cleanupRef.current = null;
    };
  }, [isActive, containerRef]);

  // Manejar tecla Escape
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault();
        onEscape();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onEscape]);

  // Restaurar foco al desactivar
  useEffect(() => {
    return () => {
      if (restoreFocusOnClose && previousFocusRef.current) {
        restoreFocus(previousFocusRef.current);
      }
    };
  }, [restoreFocusOnClose]);
}
