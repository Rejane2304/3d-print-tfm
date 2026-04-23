/**
 * Service Worker Deshabilitado Temporalmente
 * Versión minimal para evitar errores 401 en recursos estáticos
 */

self.addEventListener('install', () => {
  console.log('[SW] Disabled - skipping activation');
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  console.log('[SW] Disabled - claiming clients');
  self.clients.claim();
});

// No interceptar ninguna petición
self.addEventListener('fetch', () => {
  // Passthrough - no caching
});
