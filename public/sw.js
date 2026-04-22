/**
 * Service Worker para 3D Print TFM
 * Proporciona funcionalidad offline y caching de recursos
 */

const STATIC_CACHE = 'static-v1';
const API_CACHE = 'api-v1';
const IMAGE_CACHE = 'images-v1';

// Rutas estáticas principales a cachear
const STATIC_ASSETS = ['/', '/products', '/cart', '/checkout'];

// URLs de la API a cachear con estrategia Stale While Revalidate
const API_ROUTES = ['/api/products', '/api/categories'];

// Instalación: Precachear assets críticos
self.addEventListener('install', event => {
  console.log('[SW] Installing...');

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(error => {
        console.error('[SW] Failed to cache static assets:', error);
      }),
  );

  // Activar inmediatamente
  self.skipWaiting();
});

// Activación: Limpiar caches antiguas
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');

  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => {
              // Mantener solo caches de la versión actual
              return name !== STATIC_CACHE && name !== API_CACHE && name !== IMAGE_CACHE;
            })
            .map(name => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            }),
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      }),
  );
});

// Estrategia: Cache First
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Network request failed:', error);
    throw error;
  }
}

// Estrategia: Network First
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache...');
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// Estrategia: Stale While Revalidate
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then(networkResponse => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(error => {
      console.log('[SW] Background fetch failed:', error);
      // Silently fail background fetch
    });

  // Devolver cache inmediatamente si existe, o esperar red
  return cached || fetchPromise;
}

// Verificar si una URL es de API cacheable
function isApiCacheable(url) {
  return API_ROUTES.some(route => url.pathname.startsWith(route));
}

// Verificar si es una imagen de producto
function isProductImage(url) {
  return url.pathname.includes('/products/') || url.pathname.includes('/uploads/') || url.hostname.includes('supabase');
}

// Fetch: Estrategia de caché según tipo de recurso
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar peticiones no GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorar peticiones de analytics y tracking
  if (url.hostname.includes('google-analytics') || url.hostname.includes('googletagmanager')) {
    return;
  }

  // Estrategia: Cache First para imágenes
  if (request.destination === 'image' || isProductImage(url)) {
    event.respondWith(
      cacheFirst(request, IMAGE_CACHE).catch(() => {
        // Devolver imagen placeholder en caso de error
        return new Response('', { status: 404 });
      }),
    );
    return;
  }

  // Estrategia: Stale While Revalidate para API de productos/categorías
  if (isApiCacheable(url)) {
    event.respondWith(
      staleWhileRevalidate(request, API_CACHE).catch(() => {
        return new Response(JSON.stringify({ error: 'Network unavailable' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      }),
    );
    return;
  }

  // Estrategia: Network First para navegación HTML
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request, STATIC_CACHE).catch(() => {
        // Fallback a página offline si existe
        return caches.match('/offline.html');
      }),
    );
    return;
  }

  // Estrategia: Cache First para assets estáticos (JS, CSS, fuentes)
  if (request.destination === 'script' || request.destination === 'style' || request.destination === 'font') {
    event.respondWith(cacheFirst(request, STATIC_CACHE).catch(() => fetch(request)));
    return;
  }

  // Default: Network First para todo lo demás
  event.respondWith(networkFirst(request, STATIC_CACHE).catch(() => fetch(request)));
});

// Background Sync para carrito
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-cart') {
    event.waitUntil(syncCartWithServer());
  }
});

// Sincronizar carrito pendiente
async function syncCartWithServer() {
  console.log('[SW] Syncing cart with server...');

  try {
    const clients = await self.clients.matchAll({ type: 'window' });

    if (clients.length > 0) {
      // Notificar a los clientes que sincronicen el carrito
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_CART',
          timestamp: Date.now(),
        });
      });
    }
  } catch (error) {
    console.error('[SW] Error syncing cart:', error);
  }
}

// Push Notifications (preparado para futuro)
self.addEventListener('push', event => {
  console.log('[SW] Push received:', event);

  const data = event.data?.json() || {};
  const title = data.title || '3D Print TFM';
  const options = {
    body: data.body || 'Nueva notificación',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: data.data || {},
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notificación click
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event);

  event.notification.close();

  const notificationData = event.notification.data;
  const urlToOpen = notificationData?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      // Si hay una ventana abierta, enfocarla
      for (const client of clients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no, abrir nueva ventana
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    }),
  );
});

// Message handler para comunicación con la app
self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: '1.0.0',
      caches: [STATIC_CACHE, API_CACHE, IMAGE_CACHE],
    });
  }
});
