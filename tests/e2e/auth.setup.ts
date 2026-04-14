/**
 * Setup Tests - Auth State Storage
 *
 * Autentica usuarios de prueba y guarda el estado para reutilizar.
 * Este archivo es necesario para que playwright.config.ts funcione,
 * pero si el login falla, los tests admin harán login manualmente.
 */
import { test as setup } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const AUTH_DIR = join(__dirname, '.auth');

// Crear directorio de auth si no existe
if (!existsSync(AUTH_DIR)) {
  mkdirSync(AUTH_DIR, { recursive: true });
}

// Helper para intentar login (no falla si no funciona)
async function attemptLogin(page: any, browserName: string) {
  try {
    await page.goto('/auth', { timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(1500);

    // Si ya estamos autenticados, salir
    if (!page.url().includes('/auth')) return true;

    // Intentar login
    await page.locator('input[type="email"]').first().fill('admin@3dprint.com');
    await page.locator('input[type="password"]').first().fill('AdminTFM2024!');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(4000);

    return !page.url().includes('/auth');
  } catch {
    return false;
  }
}

// Setup para Chromium
setup('authenticate chromium', async ({ page, browserName }) => {
  if (browserName !== 'chromium') {
    setup.skip();
    return;
  }
  // Intentar login (el resultado no se usa, los tests admin hacen login manual)
  await attemptLogin(page, browserName);
  // Siempre guardar estado, aunque sea anónimo
  await page.context().storageState({ path: join(AUTH_DIR, 'admin-chromium.json') });
});

// Setup para Firefox
setup('authenticate firefox', async ({ page, browserName }) => {
  if (browserName !== 'firefox') {
    setup.skip();
    return;
  }
  await attemptLogin(page, browserName);
  await page.context().storageState({ path: join(AUTH_DIR, 'admin-firefox.json') });
});

// Setup para WebKit (Safari)
setup('authenticate webkit', async ({ page, browserName }) => {
  if (browserName !== 'webkit') {
    setup.skip();
    return;
  }
  await attemptLogin(page, browserName);
  await page.context().storageState({ path: join(AUTH_DIR, 'admin-webkit.json') });
});
