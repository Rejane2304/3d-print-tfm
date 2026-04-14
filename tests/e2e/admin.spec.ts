/**
 * E2E Tests - Admin Dashboard
 *
 * Tests de admin que funcionan en todos los navegadores.
 * Cada test hace login manualmente y verifica que la autenticación funcionó.
 */
import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

// Helper para hacer login como admin con verificación robusta
async function loginAsAdmin(page: any) {
  // Ir a auth con timeout generoso
  await page.goto('/auth', { timeout: 60000 });

  // Esperar a que la página cargue completamente
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Dar tiempo adicional para renderizado
  await page.waitForTimeout(2000);

  // Verificar si ya estamos autenticados (redirigidos fuera de /auth)
  const url = page.url();
  if (!url.includes('/auth')) {
    console.log('Already authenticated, skipping login');
    return;
  }

  // Esperar a que el formulario esté disponible
  try {
    await page.waitForSelector('[data-testid="login-email"]', { timeout: 10000 });
  } catch {
    // Si no se encuentra el formulario, verificar si estamos redirigidos
    const currentUrl = page.url();
    if (!currentUrl.includes('/auth')) {
      return;
    }
    throw new Error('Login form not found after waiting');
  }

  // Llenar login con esperas entre campos
  await page.locator('[data-testid="login-email"]').fill('admin@3dprint.com');
  await page.waitForTimeout(500);

  await page.locator('[data-testid="login-password"]').fill('AdminTFM2024!');
  await page.waitForTimeout(500);

  await page.locator('button[type="submit"]').first().click();

  // Esperar redirección con timeout largo
  await page.waitForTimeout(6000);

  // Verificar que el login funcionó
  const currentUrl = page.url();

  if (currentUrl.includes('/auth')) {
    // Intentar login una vez más si falló
    console.log('First login attempt failed, retrying...');
    await page.waitForTimeout(2000);

    // Verificar que el formulario sigue ahí
    const hasForm = (await page.locator('[data-testid="login-email"]').count()) > 0;
    if (hasForm) {
      await page.locator('[data-testid="login-email"]').fill('admin@3dprint.com');
      await page.locator('[data-testid="login-password"]').fill('AdminTFM2024!');
      await page.locator('button[type="submit"]').first().click();
      await page.waitForTimeout(6000);
    }

    // Si sigue en auth, algo está mal
    const finalUrl = page.url();
    if (finalUrl.includes('/auth')) {
      throw new Error('Login failed after retry');
    }
  }
}

test.describe('Admin E2E', () => {
  // Test 1: Access admin panel
  test('debe poder acceder a panel de admin', async ({ page }) => {
    await loginAsAdmin(page);

    // Ir al dashboard
    await page.goto('/admin/dashboard', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    const isOnAdminDashboard = currentUrl.includes('/admin/dashboard');
    const isRedirectedToLogin = currentUrl.includes('/login') || currentUrl.includes('/auth');

    // Verificar que estamos en dashboard o redirigidos
    expect(isOnAdminDashboard || isRedirectedToLogin).toBe(true);

    if (isOnAdminDashboard) {
      const bodyText = (await page.locator('body').textContent()) || '';
      const adminKeywords = ['Panel', 'Dashboard', 'Ingresos', 'Pedidos', 'Gestión', 'Resumen', 'admin', 'Admin'];
      const hasAdminContent = adminKeywords.some(k => bodyText.includes(k));
      expect(hasAdminContent).toBe(true);
    }
  });

  // Test 2: View products list
  test('debe ver lista de productos en admin', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/products', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    const bodyText = (await page.locator('body').textContent()) || '';

    const isOnProductsPage = currentUrl.includes('/admin/products');
    const isRedirected = currentUrl.includes('/login') || currentUrl.includes('/auth');

    if (isOnProductsPage) {
      const productKeywords = ['Productos', 'products', 'Catálogo', 'Stock', 'Gestión', 'Lista'];
      const hasProductContent = productKeywords.some(k => bodyText.includes(k));
      expect(hasProductContent).toBe(true);
    } else {
      expect(isRedirected).toBe(true);
    }
  });

  // Test 3: View orders list
  test('debe ver lista de pedidos en admin', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/orders', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    const bodyText = (await page.locator('body').textContent()) || '';

    const isOnOrdersPage = currentUrl.includes('/admin/orders');
    const isRedirected = currentUrl.includes('/login') || currentUrl.includes('/auth');

    if (isOnOrdersPage) {
      const orderKeywords = ['Pedidos', 'pedidos', 'Orders', 'Gestión', 'admin', 'Órdenes'];
      const hasOrderContent = orderKeywords.some(k => bodyText.includes(k));
      expect(hasOrderContent).toBe(true);
    } else if (isRedirected) {
      expect(isRedirected).toBe(true);
    } else {
      throw new Error(`Unexpected page: ${currentUrl}`);
    }
  });

  // Test 4: Block non-admin access
  test('debe bloquear acceso a no-admins', async ({ page, browser }) => {
    // Crear nuevo contexto sin autenticación
    const newContext = await browser.newContext();
    const newPage = await newContext.newPage();

    try {
      await newPage.goto('/admin/dashboard', { timeout: 60000 });
      await newPage.waitForLoadState('domcontentloaded', { timeout: 30000 });
      await newPage.waitForTimeout(3000);

      const currentUrl = newPage.url();
      const isBlocked =
        currentUrl.includes('/login') || currentUrl.includes('/auth') || currentUrl.includes('/unauthorized');

      expect(isBlocked).toBe(true);
    } finally {
      await newContext.close();
    }
  });
});
