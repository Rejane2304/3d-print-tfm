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
      await expect(page.getByRole('heading', { name: /registro/i })).toBeVisible();
      await expect(page.getByLabel(/nombre/i)).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/contraseña/i)).toBeVisible();
    });

    test('debe validar campos requeridos', async ({ page }) => {
      await page.goto(`${BASE_URL}/registro`);
      
      // Intentar enviar formulario vacío
      await page.getByRole('button', { name: /registrarse/i }).click();
      
      // Debe mostrar errores de validación
      await expect(page.getByText(/nombre es requerido/i)).toBeVisible();
      await expect(page.getByText(/email es requerido/i)).toBeVisible();
    });

    test('debe registrar usuario correctamente', async ({ page }) => {
      await page.goto(`${BASE_URL}/registro`);
      
      // Generar email único
      const uniqueEmail = `test-${Date.now()}@example.com`;
      
      // Llenar formulario
      await page.getByLabel(/nombre/i).fill('Usuario Test');
      await page.getByLabel(/email/i).fill(uniqueEmail);
      await page.getByLabel(/contraseña/i).fill('TestPassword123!');
      await page.getByLabel(/confirmar/i).fill('TestPassword123!');
      
      // Enviar formulario
      await page.getByRole('button', { name: /registrarse/i }).click();
      
      // Debe redirigir a login o mostrar mensaje de éxito
      await expect(page).toHaveURL(/login|registro/);
    });

    test('debe rechazar email duplicado', async ({ page }) => {
      // Asumiendo que este usuario ya existe en seed
      await page.goto(`${BASE_URL}/registro`);
      
      await page.getByLabel(/nombre/i).fill('Usuario Test');
      await page.getByLabel(/email/i).fill('juan@example.com');
      await page.getByLabel(/contraseña/i).fill('TestPassword123!');
      await page.getByLabel(/confirmar/i).fill('TestPassword123!');
      
      await page.getByRole('button', { name: /registrarse/i }).click();
      
      // Debe mostrar error de email duplicado
      await expect(page.getByText(/ya existe/i)).toBeVisible();
    });
  });

  test.describe('Login de usuario', () => {
    test('debe mostrar formulario de login', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      await expect(page.getByRole('heading', { name: /iniciar sesión/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/contraseña/i)).toBeVisible();
    });

    test('debe iniciar sesión con credenciales válidas', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      // Credenciales del seed
      await page.getByLabel(/email/i).fill('juan@example.com');
      await page.getByLabel(/contraseña/i).fill('pass123');
      
      await page.getByRole('button', { name: /iniciar sesión/i }).click();
      
      // Debe redirigir a home
      await expect(page).toHaveURL(`${BASE_URL}/`);
      
      // Debe mostrar el nombre del usuario
      await expect(page.getByText(/hola/i)).toBeVisible();
    });

    test('debe rechazar credenciales inválidas', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      await page.getByLabel(/email/i).fill('juan@example.com');
      await page.getByLabel(/contraseña/i).fill('contraseña-incorrecta');
      
      await page.getByRole('button', { name: /iniciar sesión/i }).click();
      
      // Debe mostrar error de credenciales
      await expect(page.getByText(/credenciales inválidas|error/i)).toBeVisible();
    });

    test('debe redirigir usuarios autenticados desde /login', async ({ page }) => {
      // Primero iniciar sesión
      await page.goto(`${BASE_URL}/login`);
      await page.getByLabel(/email/i).fill('juan@example.com');
      await page.getByLabel(/contraseña/i).fill('pass123');
      await page.getByRole('button', { name: /iniciar sesión/i }).click();
      
      // Esperar a que redirija
      await expect(page).toHaveURL(`${BASE_URL}/`);
      
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
      await page.getByLabel(/email/i).fill('juan@example.com');
      await page.getByLabel(/contraseña/i).fill('pass123');
      await page.getByRole('button', { name: /iniciar sesión/i }).click();
      
      await expect(page).toHaveURL(`${BASE_URL}/`);
      
      // Cerrar sesión
      await page.getByRole('button', { name: /cerrar sesión/i }).click();
      
      // Debe mostrar botones de login/registro
      await expect(page.getByText(/iniciar sesión/i)).toBeVisible();
      await expect(page.getByText(/registrarse/i)).toBeVisible();
    });
  });

  test.describe('Acceso protegido', () => {
    test('debe redirigir usuarios no autenticados de /carrito a /login', async ({ page }) => {
      await page.goto(`${BASE_URL}/carrito`);
      
      await expect(page).toHaveURL(/login/);
      await expect(page.url()).toContain('callbackUrl');
    });

    test('debe redirigir usuarios no autenticados de /cuenta a /login', async ({ page }) => {
      await page.goto(`${BASE_URL}/cuenta/pedidos`);
      
      await expect(page).toHaveURL(/login/);
    });

    test('debe redirigir clientes de /admin a /', async ({ page }) => {
      // Iniciar sesión como cliente
      await page.goto(`${BASE_URL}/login`);
      await page.getByLabel(/email/i).fill('juan@example.com');
      await page.getByLabel(/contraseña/i).fill('pass123');
      await page.getByRole('button', { name: /iniciar sesión/i }).click();
      
      await expect(page).toHaveURL(`${BASE_URL}/`);
      
      // Intentar acceder a admin
      await page.goto(`${BASE_URL}/admin/dashboard`);
      
      // Debe redirigir a home
      await expect(page).toHaveURL(`${BASE_URL}/`);
    });

    test('debe permitir acceso a admin autenticado', async ({ page }) => {
      // Iniciar sesión como admin
      await page.goto(`${BASE_URL}/login`);
      await page.getByLabel(/email/i).fill('admin@3dprint.com');
      await page.getByLabel(/contraseña/i).fill('admin123');
      await page.getByRole('button', { name: /iniciar sesión/i }).click();
      
      // Debe redirigir a admin dashboard
      await expect(page).toHaveURL(`${BASE_URL}/admin/dashboard`);
      
      // Verificar que está en el panel admin
      await expect(page.getByText(/panel de administración/i)).toBeVisible();
    });

    test('debe redirigir admin de /carrito a /admin/dashboard', async ({ page }) => {
      // Iniciar sesión como admin
      await page.goto(`${BASE_URL}/login`);
      await page.getByLabel(/email/i).fill('admin@3dprint.com');
      await page.getByLabel(/contraseña/i).fill('admin123');
      await page.getByRole('button', { name: /iniciar sesión/i }).click();
      
      // Intentar acceder a carrito
      await page.goto(`${BASE_URL}/carrito`);
      
      // Debe redirigir a admin dashboard
      await expect(page).toHaveURL(`${BASE_URL}/admin/dashboard`);
    });
  });

  test.describe('Navegación', () => {
    test('debe mostrar Header en todas las páginas', async ({ page }) => {
      await page.goto(`${BASE_URL}/`);
      await expect(page.getByAltText('3D Print TFM')).toBeVisible();
      
      await page.goto(`${BASE_URL}/productos`);
      await expect(page.getByAltText('3D Print TFM')).toBeVisible();
      
      await page.goto(`${BASE_URL}/login`);
      await expect(page.getByAltText('3D Print TFM')).toBeVisible();
    });

    test('debe mostrar Footer en todas las páginas', async ({ page }) => {
      await page.goto(`${BASE_URL}/`);
      await expect(page.getByText(/3D Print TFM/i)).toBeVisible();
      await expect(page.getByText(/Proyecto académico/i)).toBeVisible();
    });
  });
});
