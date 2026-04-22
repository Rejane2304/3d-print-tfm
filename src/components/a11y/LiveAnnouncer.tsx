'use client';

/**
 * LiveAnnouncer Component
 * Región aria-live para anunciar cambios dinámicos a screen readers
 * Debe montarse una sola vez en el layout raíz
 *
 * Uso: El hook useAnnouncer() se comunica con este componente
 * a través del ID 'sr-announcer'
 */

interface LiveAnnouncerProps {
  /** Nivel de prioridad de los anuncios (por defecto 'polite') */
  priority?: 'polite' | 'assertive';
  /** ID personalizado (por defecto 'sr-announcer') */
  id?: string;
}

export function LiveAnnouncer({ priority = 'polite', id = 'sr-announcer' }: LiveAnnouncerProps) {
  return (
    <div
      id={id}
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
      // El contenido se actualiza mediante JavaScript desde useAnnouncer
    />
  );
}

/**
 * LiveAnnouncerAssertive
 * Versión con prioridad 'assertive' para mensajes críticos
 * (errores, alertas, etc.)
 */
export function LiveAnnouncerAssertive({ id = 'sr-announcer-assertive' }: { id?: string }) {
  return <div id={id} aria-live="assertive" aria-atomic="true" className="sr-only" />;
}

/**
 * AnnouncerRegion
 * Componente que agrupa ambos anunciadores
 * Recomendado usar en el layout raíz
 */
export function AnnouncerRegion() {
  return (
    <>
      {/* Para anuncios no urgentes */}
      <LiveAnnouncer priority="polite" id="sr-announcer" />
      {/* Para anuncios urgentes */}
      <LiveAnnouncerAssertive id="sr-announcer-assertive" />
    </>
  );
}
