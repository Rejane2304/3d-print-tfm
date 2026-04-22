/**
 * VisuallyHidden Component
 * Renderiza contenido solo visible para screen readers
 * Utiliza la clase Tailwind 'sr-only' que:
 * - Oculta visualmente el contenido
 * - Mantiene el contenido accesible para screen readers
 */

import type { ReactNode } from 'react';

interface VisuallyHiddenProps {
  /** Contenido a ocultar visualmente pero mantener accesible */
  children: ReactNode;
  /** Clases adicionales (opcional) */
  className?: string;
}

export function VisuallyHidden({ children, className = '' }: VisuallyHiddenProps) {
  return <span className={`sr-only ${className}`.trim()}>{children}</span>;
}

/**
 * Versión alternativa que se muestra solo cuando tiene foco
 * Útil para skip links y elementos que deben aparecer al navegar con teclado
 */
interface VisuallyHiddenFocusableProps extends VisuallyHiddenProps {
  /** Elemento HTML a renderizar (por defecto 'span') */
  as?: 'span' | 'div' | 'a' | 'button';
}

export function VisuallyHiddenFocusable({
  children,
  className = '',
  as: Component = 'span',
}: VisuallyHiddenFocusableProps) {
  const baseClasses = 'sr-only focus:not-sr-only focus:absolute focus:z-50';
  return <Component className={`${baseClasses} ${className}`.trim()}>{children}</Component>;
}
