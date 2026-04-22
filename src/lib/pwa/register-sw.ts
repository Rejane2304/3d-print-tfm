/**
 * Registro y gestión del Service Worker
 * Proporciona funcionalidad PWA con manejo de actualizaciones
 */

interface ServiceWorkerRegistrationExtended extends ServiceWorkerRegistration {
  waiting: ServiceWorker | null;
  installing: ServiceWorker | null;
}

/**
 * Registra el Service Worker
 */
export function registerServiceWorker(): void {
  if (typeof window === 'undefined') return;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = '/sw.js';

      navigator.serviceWorker
        .register(swUrl)
        .then(registration => {
          console.log('[PWA] SW registered:', registration.scope);

          handleServiceWorkerUpdates(registration as ServiceWorkerRegistrationExtended);
          handleServiceWorkerMessages(registration);
        })
        .catch(error => {
          console.log('[PWA] SW registration failed:', error);
        });
    });
  } else {
    console.log('[PWA] Service Workers not supported');
  }
}

/**
 * Maneja las actualizaciones del Service Worker
 */
function handleServiceWorkerUpdates(registration: ServiceWorkerRegistrationExtended): void {
  // Detectar nueva versión instalándose
  registration.addEventListener('updatefound', () => {
    const newWorker = registration.installing;

    if (!newWorker) return;

    console.log('[PWA] New service worker installing...');

    newWorker.addEventListener('statechange', () => {
      console.log('[PWA] SW state:', newWorker.state);

      // Nueva versión instalada y lista
      if (newWorker.state === 'installed') {
        if (navigator.serviceWorker.controller) {
          // Hay un SW activo, esta es una actualización
          console.log('[PWA] New version available');
          showUpdateNotification(newWorker);
        } else {
          // Primera instalación
          console.log('[PWA] App is ready for offline use');
        }
      }
    });
  });
}

/**
 * Muestra notificación de actualización disponible
 */
function showUpdateNotification(worker: ServiceWorker): void {
  // Crear un evento personalizado para que la app lo capture
  const updateEvent = new CustomEvent('sw-update-available', {
    detail: { worker },
  });
  window.dispatchEvent(updateEvent);

  // También mostrar confirmación nativa
  if (confirm('Nueva versión disponible. ¿Actualizar ahora?')) {
    updateServiceWorker(worker);
  }
}

/**
 * Actualiza el Service Worker
 */
export function updateServiceWorker(worker: ServiceWorker): void {
  // Enviar mensaje al SW para que se active
  worker.postMessage({ type: 'SKIP_WAITING' });

  // Recargar la página cuando el nuevo SW tome control
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('[PWA] New service worker activated, reloading...');
    window.location.reload();
  });
}

/**
 * Maneja mensajes del Service Worker
 */
function handleServiceWorkerMessages(registration: ServiceWorkerRegistration): void {
  navigator.serviceWorker.addEventListener('message', event => {
    console.log('[PWA] Message from SW:', event.data);

    if (event.data.type === 'SYNC_CART') {
      // Disparar evento para que el carrito se sincronice
      const syncEvent = new CustomEvent('cart-sync-required', {
        detail: { timestamp: event.data.timestamp },
      });
      window.dispatchEvent(syncEvent);
    }
  });
}

/**
 * Desregistra el Service Worker (útil para debugging)
 */
export async function unregisterServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const result = await registration.unregister();

      if (result) {
        console.log('[PWA] Service Worker unregistered');
      } else {
        console.log('[PWA] Failed to unregister Service Worker');
      }
    } catch (error) {
      console.error('[PWA] Error unregistering:', error);
    }
  }
}

/**
 * Verifica si hay una actualización disponible
 */
export async function checkForUpdates(): Promise<boolean> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();

      // Si hay un nuevo SW esperando, hay actualización
      if (registration.waiting) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('[PWA] Error checking for updates:', error);
      return false;
    }
  }
  return false;
}

/**
 * Obtiene información del Service Worker actual
 */
export async function getServiceWorkerInfo(): Promise<{
  version: string;
  caches: string[];
} | null> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;

      if (!registration.active) {
        return null;
      }

      // Crear un canal de mensajes para obtener info
      const messageChannel = new MessageChannel();

      return new Promise(resolve => {
        messageChannel.port1.onmessage = event => {
          resolve(event.data);
        };

        if (registration.active) {
          registration.active.postMessage({ type: 'GET_VERSION' }, [messageChannel.port2]);
        }

        // Timeout por si no hay respuesta
        setTimeout(() => resolve(null), 2000);
      });
    } catch (error) {
      console.error('[PWA] Error getting SW info:', error);
      return null;
    }
  }
  return null;
}

/**
 * Sincroniza el carrito cuando vuelve la conexión
 */
export async function requestCartSync(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const swRegistration = await navigator.serviceWorker.ready;

    // Verificar si background sync está soportado
    if (!('sync' in swRegistration)) {
      // Fallback: disparar evento para sincronización manual
      window.dispatchEvent(new CustomEvent('cart-sync-required'));
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (swRegistration as any).sync.register('sync-cart');
    console.log('[PWA] Cart sync registered');
  } catch (error) {
    console.log('[PWA] Background sync failed, syncing manually');
    // Fallback: disparar evento para sincronización manual
    window.dispatchEvent(new CustomEvent('cart-sync-required'));
  }
}

// Note: Las variables globales se eliminan para evitar problemas de referencia nula.
// Usar siempre navigator.serviceWorker.ready directamente.
