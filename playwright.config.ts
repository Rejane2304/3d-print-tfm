import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

// Load test environment variables if not already loaded
if (!process.env.NODE_ENV) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('dotenv').config({ path: path.resolve(__dirname, '.env.test') });
}

/**
 * Playwright configuration for E2E tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
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
    // Regular tests (no auth required)
    {
      name: 'Desktop Chrome',
      testMatch: /(shop|auth)\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
      dependencies: ['setup'],
    },
    {
      name: 'Desktop Firefox',
      testMatch: /(shop|auth)\.spec\.ts/,
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
      dependencies: ['setup'],
    },
    {
      name: 'Desktop Safari',
      testMatch: /(shop|auth)\.spec\.ts/,
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
      dependencies: ['setup'],
    },
    {
      name: 'Tablet iPad',
      testMatch: /(shop|auth)\.spec\.ts/,
      use: {
        ...devices['iPad Pro 11'],
        viewport: { width: 834, height: 1194 },
      },
      dependencies: ['setup'],
    },
    {
      name: 'Mobile iPhone',
      testMatch: /(shop|auth)\.spec\.ts/,
      use: {
        ...devices['iPhone 14'],
        viewport: { width: 390, height: 844 },
      },
      dependencies: ['setup'],
    },
    {
      name: 'Desktop 4K',
      testMatch: /(shop|auth)\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 3840, height: 2160 },
      },
      dependencies: ['setup'],
    },
    // Admin tests (login manual, funciona en todos los navegadores)
    {
      name: 'Admin Desktop Chrome',
      testMatch: /admin\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
      dependencies: ['setup'],
    },
    {
      name: 'Admin Desktop Firefox',
      testMatch: /admin\.spec\.ts/,
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
      dependencies: ['setup'],
    },
    {
      name: 'Admin Desktop Safari',
      testMatch: /admin\.spec\.ts/,
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
      dependencies: ['setup'],
    },
    {
      name: 'Admin Tablet iPad',
      testMatch: /admin\.spec\.ts/,
      use: {
        ...devices['iPad Pro 11'],
        viewport: { width: 834, height: 1194 },
      },
      dependencies: ['setup'],
    },
    {
      name: 'Admin Mobile iPhone',
      testMatch: /admin\.spec\.ts/,
      use: {
        ...devices['iPhone 14'],
        viewport: { width: 390, height: 844 },
      },
      dependencies: ['setup'],
    },
    {
      name: 'Admin Desktop 4K',
      testMatch: /admin\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 3840, height: 2160 },
      },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'NODE_ENV=test npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      NODE_ENV: 'test',
      // Force using test database - NEVER use dev/prod databases for tests
      DATABASE_URL: 'postgresql://testuser:testpassword123@localhost:5433/3dprint_tfm_test',
    },
  },
});
