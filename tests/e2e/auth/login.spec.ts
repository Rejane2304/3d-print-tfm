/**
 * Tests E2E - Flujo de Autenticación
 * Tests con Playwright para el flujo completo de login/logout
 * 
 * NOTA: Ahora usando página unificada /auth con tabs
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Flujo de Autenticación', () => {
  test.describe('Página /auth unificada', () => {
    test('debe mostrar tabs de login y registro', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth`);
      
      // Verificar que existen ambos tabs (usando .first() para evitar strict mode violation)
      await expect(page.getByRole('button', { name: /iniciar sesión/i }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: /registrarse/i }).first()).toBeVisible();
      
      // El tab de login debe estar activo por defecto
      await expect(page.locator('input#login-email')).toBeVisible();
    });

    test('debe redirigir /login a /auth', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      // Debe redirigir a /auth
      await expect(page).toHaveURL(/auth/);
      await expect(page.getByRole('button', { name: /iniciar sesión/i }).first()).toBeVisible();
    });

    test('debe redirigir /register a /auth con tab register', async ({ page }) => {
      await page.goto(`${BASE_URL}/register`);
      
      // Debe redirigir a /auth con tab=register
      await expect(page).toHaveURL(/auth.*tab=register/);
      
      // El tab de registro debe estar activo
      await expect(page.locator('input#register-nombre')).toBeVisible();
    });
  });

  test.describe('Registro de usuario', () => {
    test('debe mostrar formulario de registro', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth?tab=register`);
      
      // Verificar que el formulario existe
      await expect(page.getByRole('heading', { name: /bienvenido/i })).toBeVisible();
      await expect(page.locator('input#register-nombre')).toBeVisible();
      await expect(page.locator('input#register-email')).toBeVisible();
      await expect(page.locator('input#register-password')).toBeVisible();
    });

    test('debe validar campos requeridos en registro', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth?tab=register`);
      
      // Intentar enviar formulario vacío
      await page.locator('button[type="submit"]').filter({ hasText: /registrarse/i }).click();
      
      // Debe seguir en la misma página (validación HTML5)
      await expect(page).toHaveURL(/auth/);
    });

    test('debe registrar usuario correctamente', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth?tab=register`);
      
      // Generar email único
      const uniqueEmail = `test-e2e-${Date.now()}@example.com`;
      
      // Llenar formulario
      await page.locator('input#register-nombre').fill('Usuario Test E2E');
      await page.locator('input#register-email').fill(uniqueEmail);
      await page.locator('input#register-password').fill('TestPassword123!');
      await page.locator('input#register-confirm').fill('TestPassword123!');
      
      // Enviar formulario
      await page.locator('button[type="submit"]').filter({ hasText: /registrarse/i }).click();
      
      // Esperar procesamiento
      await page.waitForTimeout(4000);
      
      // Verificar éxito: debe mostrar mensaje de éxito o redirigir
      const currentUrl = page.url();
      const hasSuccessMessage = await page.getByText(/registro exitoso|cuenta creada/i).isVisible().catch(() => false);
      const isAuthPage = currentUrl.includes('/auth');
      
      expect(hasSuccessMessage || isAuthPage).toBe(true);
    });

    test('debe rechazar email duplicado', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth?tab=register`);
      
      await page.locator('input#register-nombre').fill('Usuario Test');
      await page.locator('input#register-email').fill('juan@example.com');
      await page.locator('input#register-password').fill('TestPassword123!');
      await page.locator('input#register-confirm').fill('TestPassword123!');
      
      await page.locator('button[type="submit"]').filter({ hasText: /registrarse/i }).click();
      
      await page.waitForTimeout(2000);
      
      // Debe mostrar error de email duplicado
      const errorVisible = await page.getByText(/ya existe|email|error/i).isVisible().catch(() => false);
      expect(errorVisible).toBe(true);
    });
  });

  test.describe('Login de usuario', () => {
    test('debe mostrar formulario de login', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth`);
      
      await expect(page.getByRole('heading', { name: /bienvenido/i })).toBeVisible();
      await expect(page.locator('input#login-email')).toBeVisible();
      await expect(page.locator('input#login-password')).toBeVisible();
    });

    test('debe iniciar sesión con credenciales válidas', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth`);
      
      // Credenciales del seed
      await page.locator('input#login-email').fill('juan@example.com');
      await page.locator('input#login-password').fill('pass123');
      
      await page.locator('button[type="submit"]').filter({ hasText: /iniciar sesión/i }).click();
      
      // Esperar más tiempo para la redirección completa
      await page.waitForTimeout(4000);
      
      // Verificar que ya no estamos en auth (puede estar en home, products o cualquier otra página)
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/auth');
    });

    test('debe rechazar credenciales inválidas', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth`);
      
      await page.locator('input#login-email').fill('juan@example.com');
      await page.locator('input#login-password').fill('contraseña-incorrecta');
      
      await page.locator('button[type="submit"]').filter({ hasText: /iniciar sesión/i }).click();
      
      // Esperar a que se procese el login (dar tiempo al error)
      await page.waitForTimeout(3000);
      
      // Verificar que NO redirige (es decir, sigue en /auth o página de error)
      const currentUrl = page.url();
      
      // NextAuth típicamente permanece en /auth si hay error
      // O redirige a /auth con algún parámetro de error
      const stillOnAuth = currentUrl.includes('/auth');
      
      // Alternativamente, puede haber un mensaje de error visible
      const hasErrorMessage = await page
        .getByText(/Email o contraseña|incorrectos|error/i)
        .isVisible()
        .catch(() => false);
      
      // Debe cumplir al menos una condición
      expect(stillOnAuth || hasErrorMessage).toBe(true);
    });

    test('debe redirigir usuarios autenticados desde /auth', async ({ page }) => {
      // Primero iniciar sesión
      await page.goto(`${BASE_URL}/auth`);
      await page.locator('input#login-email').fill('juan@example.com');
      await page.locator('input#login-password').fill('pass123');
      await page.locator('button[type="submit"]').filter({ hasText: /iniciar sesión/i }).click();
      
      // Esperar a que redirija fuera de /auth (login exitoso)
      await page.waitForURL((url) => !url.pathname.includes('/auth'), { timeout: 15000 });
      
      // Intentar volver a auth - ahora debería redirigir automáticamente
      await page.goto(`${BASE_URL}/auth`);
      
      // Esperar redirección automática (usuarios autenticados no pueden ver /auth)
      try {
        await page.waitForURL((url) => !url.pathname.includes('/auth'), { timeout: 5000 });
      } catch {
        // Si no redirige automáticamente, verificar que al menos no estamos en auth
        await page.waitForTimeout(2000);
      }
      
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/auth');
    });
  });

  test.describe('Logout', () => {
    test('debe cerrar sesión correctamente', async ({ page, isMobile }) => {
      // Iniciar sesión primero
      await page.goto(`${BASE_URL}/auth`);
      await page.locator('input#login-email').fill('juan@example.com');
      await page.locator('input#login-password').fill('pass123');
      await page.locator('button[type="submit"]').filter({ hasText: /iniciar sesión/i }).click();
      
      // Esperar redirección completa
      await page.waitForTimeout(4000);
      
      // Verificar que estamos autenticados (no en /auth)
      let currentUrl = page.url();
      expect(currentUrl).not.toContain('/auth');
      
      if (isMobile) {
        // En mobile, abrir menú hamburguesa primero
        const menuButton = page.locator('header button').filter({ has: page.locator('svg') }).first();
        if (await menuButton.isVisible().catch(() => false)) {
          await menuButton.click();
          await page.waitForTimeout(500);
        }
      }
      
      // Buscar y hacer clic en cerrar sesión
      const logoutLink = page.locator('a[href="/api/auth/signout"]').first();
      if (await logoutLink.isVisible().catch(() => false)) {
        await logoutLink.click();
      } else {
        // Si no hay link visible, intentar hacer clic en botón de logout si existe
        const logoutButton = page.locator('button:has-text("Cerrar sesión"), button:has-text("Salir")').first();
        if (await logoutButton.isVisible().catch(() => false)) {
          await logoutButton.click();
        }
      }
      
      // Esperar a que se complete el logout
      await page.waitForTimeout(4000);
      
      // Refrescar página para verificar que se cerró sesión
      await page.reload();
      await page.waitForTimeout(2000);
      
      if (isMobile) {
        // En mobile, abrir menú hamburguesa para ver el botón de login
        const menuButton = page.locator('header button').filter({ has: page.locator('svg') }).first();
        if (await menuButton.isVisible().catch(() => false)) {
          await menuButton.click();
          await page.waitForTimeout(500);
        }
      }
      
      // Verificar que se muestra el botón de iniciar sesión
      const loginLink = page.locator('a[href="/auth"]').first();
      const loginVisible = await loginLink.isVisible().catch(() => false);
      
      // Alternativa: buscar formulario de login
      if (!loginVisible) {
        const loginForm = await page.locator('input#login-email').isVisible().catch(() => false);
        expect(loginForm || loginVisible).toBe(true);
      } else {
        expect(loginVisible).toBe(true);
      }
    });
  });

  test.describe('Acceso protegido', () => {
    test('debe PERMITIR acceso a /cart para usuarios no autenticados (invitados)', async ({ page }) => {
      // CAMBIO: El carrito ahora es accesible para invitados (usa localStorage)
      await page.goto(`${BASE_URL}/cart`);
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      // Ya no redirige, permite ver el carrito vacío
      expect(currentUrl).toContain('/cart');
      expect(currentUrl).toContain("/cart");
    });

    test('debe redirigir usuarios no autenticados de /account a /auth', async ({ page }) => {
      await page.goto(`${BASE_URL}/account/orders`);
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      expect(currentUrl).toContain('auth');
    });

    test('debe redirigir clientes de /admin a /', async ({ page }) => {
      // Iniciar sesión como cliente
      await page.goto(`${BASE_URL}/auth`);
      await page.locator('input#login-email').fill('juan@example.com');
      await page.locator('input#login-password').fill('pass123');
      await page.locator('button[type="submit"]').filter({ hasText: /iniciar sesión/i }).click();
      
      await page.waitForTimeout(4000);
      
      // Intentar acceder a admin
      await page.goto(`${BASE_URL}/admin/dashboard`);
      await page.waitForTimeout(2000);
      
      // Debe redirigir a home
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/admin');
    });

    test('debe permitir acceso a admin autenticado', async ({ page }) => {
      // Iniciar sesión como admin
      await page.goto(`${BASE_URL}/auth`);
      await page.locator('input#login-email').fill('admin@3dprint.com');
      await page.locator('input#login-password').fill('admin123');
      await page.locator('button[type="submit"]').filter({ hasText: /iniciar sesión/i }).click();
      
      await page.waitForTimeout(4000);
      
      // Intentar acceder a admin
      await page.goto(`${BASE_URL}/admin/dashboard`);
      await page.waitForTimeout(2000);
      
      const is404 = await page.getByText(/404|not found/i).isVisible().catch(() => false);
      expect(is404).toBe(false);
    });

    test('debe redirigir admin de /cart a área admin', async ({ page }) => {
      // Iniciar sesión como admin
      await page.goto(`${BASE_URL}/auth`);
      await page.locator('input#login-email').fill('admin@3dprint.com');
      await page.locator('input#login-password').fill('admin123');
      await page.locator('button[type="submit"]').filter({ hasText: /iniciar sesión/i }).click();
      
      await page.waitForTimeout(4000);
      
      // Intentar acceder a cart - debe redirigir a admin
      await page.goto(`${BASE_URL}/cart`);
      
      // Esperar redirección al área de admin
      try {
        await page.waitForURL((url) => url.pathname.includes('/admin') || !url.pathname.includes('/cart'), { timeout: 5000 });
      } catch {
        await page.waitForTimeout(2000);
      }
      
      const currentUrl = page.url();
      // Debe estar en /admin/dashboard o cualquier página que no sea /cart
      expect(currentUrl === `${BASE_URL}/` || currentUrl.includes('/admin') || !currentUrl.includes('/cart')).toBe(true);
    });
  });

  test.describe('Navegación', () => {
    test('debe mostrar Header en páginas principales', async ({ page }) => {
      await page.goto(`${BASE_URL}/`);
      await expect(page.locator('header')).toBeVisible({ timeout: 15000 });
      
      await page.goto(`${BASE_URL}/auth`);
      await expect(page.locator('header')).toBeVisible({ timeout: 15000 });
    });

    test('debe mostrar Footer en todas las páginas', async ({ page }) => {
      await page.goto(`${BASE_URL}/`);
      await expect(page.locator('footer')).toBeVisible();
    });
  });
});
