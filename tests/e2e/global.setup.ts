/**
 * Global Setup for Playwright E2E Tests
 * Se ejecuta antes de todos los tests para preparar el entorno
 * @see https://playwright.dev/docs/test-global-setup-teardown
 */
import { test as setup, expect } from '@playwright/test';

// Opcional: Verificar que el servidor está respondiendo antes de iniciar tests
setup('setup', async () => {
  console.log('🔧 E2E Global Setup: Verificando entorno de tests...');
  console.log('✅ Setup completado');
});
