/**
 * E2E Tests - Authentication Flow (Simplificado y Robusto)
 *
 * PRINCIPIO: Los tests E2E deben ser resilientes a cambios de UI.
 * En lugar de depender de data-testid específicos, usamos:
 * - Selectores semánticos (roles, etiquetas)
 * - Verificación de comportamiento, no implementación
 * - Timeouts generosos para CI/CD
 */
import { test, expect } from '@playwright/test';

test.describe('Auth E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a auth antes de cada test
    await page.goto('/auth', { timeout: 60000 });
    // Esperar a que la red se estabilice y el DOM esté listo
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    // Esperar un poco más para que React hydrate el contenido
    await page.waitForTimeout(1000);
  });

  test('debe cargar la página de autenticación', async ({ page }) => {
    // Verificar que la página carga buscando el texto "Bienvenido"
    // Usar waitFor para esperar a que el elemento aparezca
    // Buscar el heading específico en lugar de texto genérico
    const heading = page.locator('h1', { hasText: /Bienvenido/i });
    await expect(heading).toBeVisible({ timeout: 30000 });

    // Verificar el texto del heading
    await expect(heading).toContainText('Bienvenido');

    // Verificación adicional: el body debe contener el texto
    const bodyText = await page.locator('body').textContent();
    expect(bodyText?.toLowerCase()).toContain('bienvenido');
  });

  test('debe tener formulario de login visible', async ({ page }) => {
    // Buscar inputs de email y password por tipo (más robusto que data-testid)
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    // Verificar visibilidad con timeout generoso
    await expect(emailInput).toBeVisible({ timeout: 20000 });
    await expect(passwordInput).toBeVisible({ timeout: 20000 });
  });

  test('debe permitir escribir en campos de login', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');

    // Verificar que el valor se escribió correctamente
    await expect(emailInput).toHaveValue('test@example.com');
    await expect(passwordInput).toHaveValue('password123');
  });

  test('debe mostrar error con credenciales inválidas', async ({ page }) => {
    // Llenar formulario con credenciales falsas
    await page.locator('input[type="email"]').first().fill('invalid@example.com');
    await page.locator('input[type="password"]').first().fill('wrongpassword');

    // Encontrar y hacer clic en botón de submit
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Esperar respuesta
    await page.waitForTimeout(3000);

    // Verificar que estamos en auth (no redirigió) o hay mensaje de error
    const currentUrl = page.url();
    const bodyText = await page.locator('body').textContent();

    const isStillOnAuth = currentUrl.includes('/auth');
    const hasErrorMessage =
      bodyText?.toLowerCase().includes('error') ||
      bodyText?.toLowerCase().includes('inválido') ||
      bodyText?.toLowerCase().includes('incorrecto') ||
      bodyText?.toLowerCase().includes('no encontrado');

    expect(isStillOnAuth || hasErrorMessage).toBe(true);
  });

  test('debe tener tabs o links para cambiar entre login y registro', async ({ page }) => {
    // Esperar a que los tabs estén visibles
    const loginTab = page.locator('[data-testid="login-tab"]');
    const registerTab = page.locator('[data-testid="register-tab"]');

    // Verificar que ambos tabs existen y son visibles
    await expect(loginTab).toBeVisible({ timeout: 20000 });
    await expect(registerTab).toBeVisible({ timeout: 20000 });

    // Verificar el texto de los tabs
    await expect(loginTab).toContainText(/iniciar sesión|login/i);
    await expect(registerTab).toContainText(/registrarse|register/i);

    // Verificación alternativa: el body debe contener texto de registro
    const bodyText = await page.locator('body').textContent();
    const hasRegisterOption =
      bodyText?.toLowerCase().includes('registrar') ||
      bodyText?.toLowerCase().includes('registrarse') ||
      bodyText?.toLowerCase().includes('crear cuenta');

    expect(hasRegisterOption).toBe(true);
  });
});
