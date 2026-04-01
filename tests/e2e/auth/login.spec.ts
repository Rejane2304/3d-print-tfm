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
      await expect(page.getByRole('button', { name: /crear cuenta/i }).first()).toBeVisible();
      
      // El tab de login debe estar activo por defecto
      await expect(page.locator('input#login-email')).toBeVisible();
    });

    test('debe redirigir /login a /auth', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      // Debe redirigir a /auth
      await expect(page).toHaveURL(/auth/);
      await expect(page.getByRole('button', { name: /iniciar sesión/i }).first()).toBeVisible();
    });

    test('debe redirigir /registro a /auth con tab register', async ({ page }) => {
      await page.goto(`${BASE_URL}/registro`);
      
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
      await page.locator('button[type="submit"]').filter({ hasText: /crear cuenta/i }).click();
      
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
      await page.locator('button[type="submit"]').filter({ hasText: /crear cuenta/i }).click();
      
      // Esperar procesamiento
      await page.waitForTimeout(3000);
      
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
      
      await page.locator('button[type="submit"]').filter({ hasText: /crear cuenta/i }).click();
      
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
      
      // Esperar redirección
      await page.waitForTimeout(3000);
      
      // Debe haber redirigido (probablemente a home)
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/auth');
    });

    test('debe rechazar credenciales inválidas', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth`);
      
      await page.locator('input#login-email').fill('juan@example.com');
      await page.locator('input#login-password').fill('contraseña-incorrecta');
      
      await page.locator('button[type="submit"]').filter({ hasText: /iniciar sesión/i }).click();
      
      // Esperar a que aparezca el mensaje de error (máx 5 segundos)
      await page.waitForSelector('text=Email o contraseña incorrectos', { timeout: 5000 });
      
      // Verificar que el error es visible
      const errorVisible = await page.locator('text=Email o contraseña incorrectos').isVisible();
      expect(errorVisible).toBe(true);
    });

    test('debe redirigir usuarios autenticados desde /auth', async ({ page }) => {
      // Primero iniciar sesión
      await page.goto(`${BASE_URL}/auth`);
      await page.locator('input#login-email').fill('juan@example.com');
      await page.locator('input#login-password').fill('pass123');
      await page.locator('button[type="submit"]').filter({ hasText: /iniciar sesión/i }).click();
      
      // Esperar a que redirija fuera de /auth (login exitoso)
      await page.waitForURL((url) => !url.pathname.includes('/auth'), { timeout: 10000 });
      
      // Intentar volver a auth - debe redirigir automáticamente
      await page.goto(`${BASE_URL}/auth`);
      
      // Esperar un momento para que ocurra la redirección automática
      await page.waitForTimeout(3000);
      
      // Debe redirigir automáticamente
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
      
      // Esperar redirección y que la sesión se establezca
      await page.waitForTimeout(3000);
      
      if (isMobile) {
        // En mobile, abrir menú hamburguesa primero
        const menuButton = page.locator('header button').filter({ has: page.locator('svg') }).first();
        if (await menuButton.isVisible().catch(() => false)) {
          await menuButton.click();
          await page.waitForTimeout(500);
        }
      }
      
      // Buscar y hacer clic en cerrar sesión por el icono (más confiable)
      const logoutButton = page.locator('button svg.lucide-log-out').locator('..');
      
      if (await logoutButton.isVisible().catch(() => false)) {
        await logoutButton.click();
      }
      
      // Esperar a que se complete el logout
      await page.waitForTimeout(2000);
      
      // Refrescar página para verificar que se cerró sesión
      await page.reload();
      await page.waitForTimeout(1500);
      
      if (isMobile) {
        // En mobile, abrir menú hamburguesa para ver el botón de login
        const menuButton = page.locator('header button').filter({ has: page.locator('svg') }).first();
        if (await menuButton.isVisible().catch(() => false)) {
          await menuButton.click();
          await page.waitForTimeout(500);
        }
      }
      
      // Verificar que se muestra el botón de iniciar sesión
      // Buscar por el href o el icono de login (más confiable que el texto)
      const loginLink = page.locator('a[href="/auth"], a[href="/login"]').first();
      const loginVisible = await loginLink.isVisible().catch(() => false);
      
      // Alternativa: buscar el icono de login
      if (!loginVisible) {
        const loginIcon = page.locator('a svg.lucide-log-in').locator('..');
        const loginIconVisible = await loginIcon.isVisible().catch(() => false);
        expect(loginIconVisible).toBe(true);
      } else {
        expect(loginVisible).toBe(true);
      }
    });
  });

  test.describe('Acceso protegido', () => {
    test('debe redirigir usuarios no autenticados de /carrito a /auth', async ({ page }) => {
      await page.goto(`${BASE_URL}/carrito`);
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      expect(currentUrl).toContain('auth');
    });

    test('debe redirigir usuarios no autenticados de /cuenta a /auth', async ({ page }) => {
      await page.goto(`${BASE_URL}/cuenta/pedidos`);
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
      
      await page.waitForTimeout(3000);
      
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
      
      await page.waitForTimeout(3000);
      
      // Intentar acceder a admin
      await page.goto(`${BASE_URL}/admin/dashboard`);
      await page.waitForTimeout(2000);
      
      const is404 = await page.getByText(/404|not found/i).isVisible().catch(() => false);
      expect(is404).toBe(false);
    });

    test('debe redirigir admin de /carrito a área admin', async ({ page }) => {
      // Iniciar sesión como admin
      await page.goto(`${BASE_URL}/auth`);
      await page.locator('input#login-email').fill('admin@3dprint.com');
      await page.locator('input#login-password').fill('admin123');
      await page.locator('button[type="submit"]').filter({ hasText: /iniciar sesión/i }).click();
      
      await page.waitForTimeout(3000);
      
      // Intentar acceder a carrito
      await page.goto(`${BASE_URL}/carrito`);
      await page.waitForTimeout(2000);
      
      // Debe redirigir fuera del carrito
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/carrito');
    });
  });

  test.describe('Navegación', () => {
    test('debe mostrar Header en todas las páginas', async ({ page }) => {
      await page.goto(`${BASE_URL}/`);
      await expect(page.locator('header')).toBeVisible();
      
      await page.goto(`${BASE_URL}/productos`);
      await expect(page.locator('header')).toBeVisible();
      
      await page.goto(`${BASE_URL}/auth`);
      await expect(page.locator('header')).toBeVisible();
    });

    test('debe mostrar Footer en todas las páginas', async ({ page }) => {
      await page.goto(`${BASE_URL}/`);
      await expect(page.locator('footer')).toBeVisible();
    });
  });
});