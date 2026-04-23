/**
 * Service Worker - Minimal para PWA
 * Versión que no intercepta peticiones (evita warnings)
 */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.clients.claim();
});

// Nota: No hay handler de 'fetch' para evitar el warning de "no-op fetch handler"
