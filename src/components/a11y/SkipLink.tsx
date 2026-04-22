'use client';

/**
 * SkipLink Component
 * Enlace para saltar al contenido principal
 * Visible solo cuando tiene foco (navegación por teclado)
 * Mejora la accesibilidad permitiendo a usuarios de screen reader
 * saltar la navegación repetitiva
 */

export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
                 bg-indigo-600 text-white px-4 py-2 rounded-lg z-[100]
                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                 font-medium text-sm shadow-lg"
    >
      Saltar al contenido principal
    </a>
  );
}

/**
 * SkipLink with custom target
 * Permite especificar un ID de destino diferente
 */
interface SkipLinkCustomProps {
  /** ID del elemento destino (sin #) */
  targetId: string;
  /** Texto del enlace */
  text?: string;
}

export function SkipLinkCustom({ targetId, text = 'Saltar al contenido' }: SkipLinkCustomProps) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
                 bg-indigo-600 text-white px-4 py-2 rounded-lg z-[100]
                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                 font-medium text-sm shadow-lg"
    >
      {text}
    </a>
  );
}

/**
 * Target marker for skip link
 * Marca el inicio del contenido principal
 */
interface SkipLinkTargetProps {
  /** ID del elemento (por defecto 'main-content') */
  id?: string;
  /** Elemento hijo */
  children: React.ReactNode;
  /** Tab index para asegurar que es focusable */
  tabIndex?: number;
}

export function SkipLinkTarget({ id = 'main-content', children, tabIndex = -1 }: SkipLinkTargetProps) {
  return (
    <div id={id} tabIndex={tabIndex} className="outline-none">
      {children}
    </div>
  );
}
