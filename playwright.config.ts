import { defineConfig, devices } from '@playwright/test';
import path from 'path';

// Cargar variables de entorno de test si no están ya cargadas
if (!process.env.NODE_ENV) {
  require('dotenv').config({ path: path.resolve(__dirname, '.env.test') });
}

/**
 * Configuración de Playwright para tests E2E
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
      dependencies: ['setup'],
    },
    {
      name: 'Desktop Firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
      dependencies: ['setup'],
    },
    {
      name: 'Desktop Safari',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
      dependencies: ['setup'],
    },
    {
      name: 'Tablet iPad',
      use: {
        ...devices['iPad Pro 11'],
        viewport: { width: 834, height: 1194 },
      },
      dependencies: ['setup'],
    },
    {
      name: 'Mobile iPhone',
      use: {
        ...devices['iPhone 14'],
        viewport: { width: 390, height: 844 },
      },
      dependencies: ['setup'],
    },
    // Pantallas muy grandes (4K)
    {
      name: 'Desktop 4K',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 3840, height: 2160 },
      },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'NODE_ENV=test npx next dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      NODE_ENV: 'test',
    },
  },
});
