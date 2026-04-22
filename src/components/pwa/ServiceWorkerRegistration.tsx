/**
 * ServiceWorkerRegistration Component
 * Maneja el registro del Service Worker en el cliente
 */

'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/pwa/register-sw';

export function ServiceWorkerRegistration(): null {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
}
