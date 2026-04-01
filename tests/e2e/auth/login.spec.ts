/**
 * Tests E2E - Flujo de Autenticación
 * Tests con Playwright para el flujo completo de login/logout
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Flujo de Autenticación', () => {
  test.describe('Registro de usuario', () => {
    test('debe mostrar formulario de registro', async ({ page }) => {
      await page.goto(`${BASE_URL}/registro`);
      
      // Verificar que el formulario existe
      await expect(page.getByRole('heading', { name: /crear cuenta/i })).toBeVisible();
      await expect(page.locator('input#nombre')).toBeVisible();
      await expect(page.locator('input#email')).toBeVisible();
      await expect(page.locator('input#password')).toBeVisible();
    });

    test('debe validar campos requeridos', async ({ page }) => {
      await page.goto(`${BASE_URL}/registro`);
      
      // Intentar enviar formulario vacío
      await page.getByRole('button', { name: /crear cuenta/i }).click();
      
      // En HTML5 la validación nativa previene el submit, verificamos que sigue en la misma página
      await expect(page).toHaveURL(/registro/);
    });

    test('debe registrar usuario correctamente', async ({ page }) => {
      await page.goto(`${BASE_URL}/registro`);
      
      // Generar email único
      const uniqueEmail = `test-e2e-${Date.now()}@example.com`;
      
      // Llenar formulario - usando los IDs de los inputs
      await page.locator('input#nombre').fill('Usuario Test E2E');
      await page.locator('input#email').fill(uniqueEmail);
      await page.locator('input#password').fill('TestPassword123!');
      await page.locator('input#confirmarPassword').fill('TestPassword123!');
      
      // Enviar formulario
      await page.getByRole('button', { name: /crear cuenta/i }).click();
      
      // Debe redirigir a login (porque después del registro exitoso redirige a login)
      await expect(page).toHaveURL(/login/);
    });

    test('debe rechazar email duplicado', async ({ page }) => {
      // Asumiendo que este usuario ya existe en seed
      await page.goto(`${BASE_URL}/registro`);
      
      await page.locator('input#nombre').fill('Usuario Test');
      await page.locator('input#email').fill('juan@example.com');
      await page.locator('input#password').fill('TestPassword123!');
      await page.locator('input#confirmarPassword').fill('TestPassword123!');
      
      await page.getByRole('button', { name: /crear cuenta/i }).click();
      
      // Esperar un momento para que aparezca el error
      await page.waitForTimeout(500);
      
      // Debe mostrar error de email duplicado o estar en la misma página
      await expect(page.getByText(/ya existe|error/i)).toBeVisible();
    });
  });

  test.describe('Login de usuario', () => {
    test('debe mostrar formulario de login', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      await expect(page.getByRole('heading', { name: /iniciar sesión/i })).toBeVisible();
      await expect(page.locator('input#email')).toBeVisible();
      await expect(page.locator('input#password')).toBeVisible();
    });

    test('debe iniciar sesión con credenciales válidas', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      // Credenciales del seed
      await page.locator('input#email').fill('juan@example.com');
      await page.locator('input#password').fill('pass123');
      
      await page.getByRole('button', { name: /iniciar sesión/i }).click();
      
      // Debe redirigir a home
      await expect(page).toHaveURL(`${BASE_URL}/`);
      
      // Debe mostrar el nombre del usuario (usando locator más específico)
      await expect(page.locator('header')).toContainText(/Hola,/);
    });

    test('debe rechazar credenciales inválidas', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      await page.locator('input#email').fill('juan@example.com');
      await page.locator('input#password').fill('contraseña-incorrecta');
      
      await page.getByRole('button', { name: /iniciar sesión/i }).click();
      
      // Esperar a que aparezca el error
      await page.waitForTimeout(500);
      
      // Debe mostrar error de credenciales
      await expect(page.getByText(/incorrectos|error/i)).toBeVisible();
    });

    test('debe redirigir usuarios autenticados desde /login', async ({ page }) => {
      // Primero iniciar sesión
      await page.goto(`${BASE_URL}/login`);
      await page.locator('input#email').fill('juan@example.com');
      await page.locator('input#password').fill('pass123');
      await page.getByRole('button', { name: /iniciar sesión/i }).click();
      
      // Esperar a que redirija
      await page.waitForURL(`${BASE_URL}/`);
      
      // Intentar volver a login
      await page.goto(`${BASE_URL}/login`);
      
      // Debe redirigir automáticamente
      await expect(page).toHaveURL(`${BASE_URL}/`);
    });
  });

  test.describe('Logout', () => {
    test('debe cerrar sesión correctamente', async ({ page }) => {
      // Iniciar sesión primero
      await page.goto(`${BASE_URL}/login`);
      await page.locator('input#email').fill('juan@example.com');
      await page.locator('input#password').fill('pass123');
      await page.getByRole('button', { name: /iniciar sesión/i }).click();
      
      await page.waitForURL(`${BASE_URL}/`);
      
      // Cerrar sesión
      await page.getByRole('button', { name: /cerrar sesión/i }).click();
      
      // Esperar a que se cierre sesión
      await page.waitForTimeout(1000);
      
      // Debe mostrar botones de login/registro
      await expect(page.getByRole('link', { name: /iniciar sesión/i })).toBeVisible();
    });
  });

  test.describe('Acceso protegido', () => {
    test('debe redirigir usuarios no autenticados de /carrito a /login', async ({ page }) => {
      await page.goto(`${BASE_URL}/carrito`);
      
      await expect(page).toHaveURL(/login/);
      expect(page.url()).toContain('callbackUrl');
    });

    test('debe redirigir usuarios no autenticados de /cuenta a /login', async ({ page }) => {
      await page.goto(`${BASE_URL}/cuenta/pedidos`);
      
      await expect(page).toHaveURL(/login/);
    });

    test('debe redirigir clientes de /admin a /', async ({ page }) => {
      // Iniciar sesión como cliente
      await page.goto(`${BASE_URL}/login`);
      await page.locator('input#email').fill('juan@example.com');
      await page.locator('input#password').fill('pass123');
      await page.getByRole('button', { name: /iniciar sesión/i }).click();
      
      await page.waitForURL(`${BASE_URL}/`);
      
      // Intentar acceder a admin
      await page.goto(`${BASE_URL}/admin/dashboard`);
      
      // Debe redirigir a home
      await expect(page).toHaveURL(`${BASE_URL}/`);
    });

    test('debe permitir acceso a admin autenticado', async ({ page }) => {
      // Iniciar sesión como admin
      await page.goto(`${BASE_URL}/login`);
      await page.locator('input#email').fill('admin@3dprint.com');
      await page.locator('input#password').fill('admin123');
      await page.getByRole('button', { name: /iniciar sesión/i }).click();
      
      // Debe redirigir a admin dashboard
      await page.waitForURL(`${BASE_URL}/admin/dashboard`);
      
      // Verificar que está en el panel admin
      await expect(page).toHaveURL(/admin/);
    });

    test('debe redirigir admin de /carrito a /admin/dashboard', async ({ page }) => {
      // Iniciar sesión como admin
      await page.goto(`${BASE_URL}/login`);
      await page.locator('input#email').fill('admin@3dprint.com');
      await page.locator('input#password').fill('admin123');
      await page.getByRole('button', { name: /iniciar sesión/i }).click();
      
      await page.waitForURL(`${BASE_URL}/admin/dashboard`);
      
      // Intentar acceder a carrito
      await page.goto(`${BASE_URL}/carrito`);
      
      // Debe redirigir a admin dashboard
      await expect(page).toHaveURL(`${BASE_URL}/admin/dashboard`);
    });
  });

  test.describe('Navegación', () => {
    test('debe mostrar Header en todas las páginas', async ({ page }) => {
      await page.goto(`${BASE_URL}/`);
      // Verificar el logo en lugar del alt text que puede no estar visible
      await expect(page.locator('header')).toBeVisible();
      await expect(page.getByRole('link', { name: /3d print tfm/i })).toBeVisible();
      
      await page.goto(`${BASE_URL}/productos`);
      await expect(page.locator('header')).toBeVisible();
      
      await page.goto(`${BASE_URL}/login`);
      await expect(page.locator('header')).toBeVisible();
    });

    test('debe mostrar Footer en todas las páginas', async ({ page }) => {
      await page.goto(`${BASE_URL}/`);
      await expect(page.locator('footer')).toBeVisible();
      // Usar el heading específico del footer en lugar de getByText general
      await expect(page.locator('footer h3')).toContainText('3D Print TFM');
    });
  });
});
