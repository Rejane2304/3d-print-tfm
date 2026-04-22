/**
 * Utilidades de accesibilidad para manejo de foco
 * @module lib/a11y/focus
 */

/**
 * Obtiene todos los elementos focusables dentro de un contenedor
 * @param element - Elemento contenedor
 * @returns NodeList de elementos focusables
 */
export function getFocusableElements(element: HTMLElement): NodeListOf<HTMLElement> {
  return element.querySelectorAll(
    'button, [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
}

/**
 * Crea un focus trap dentro de un elemento (para modales, dropdowns, etc.)
 * @param element - Elemento contenedor donde se hará el trap
 * @returns Objeto con firstFocusable, lastFocusable y cleanup function
 */
export function trapFocus(element: HTMLElement) {
  const focusableElements = getFocusableElements(element);
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    }
  };

  document.addEventListener('keydown', handleTabKey);

  return {
    firstFocusable,
    lastFocusable,
    cleanup: () => document.removeEventListener('keydown', handleTabKey),
  };
}

/**
 * Guarda el elemento que tiene el foco actualmente
 * @returns El elemento activo o null
 */
export function saveFocus(): Element | null {
  return document.activeElement;
}

/**
 * Restaura el foco a un elemento previamente guardado
 * @param element - Elemento al que restaurar el foco
 */
export function restoreFocus(element: Element | null): void {
  if (element instanceof HTMLElement) {
    setTimeout(() => element.focus(), 0);
  }
}

/**
 * Foca el primer elemento focusable dentro de un contenedor
 * @param element - Elemento contenedor
 */
export function focusFirstElement(element: HTMLElement): void {
  const focusableElements = getFocusableElements(element);
  if (focusableElements.length > 0) {
    focusableElements[0].focus();
  }
}
