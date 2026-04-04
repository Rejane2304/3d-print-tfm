import { defineConfig } from 'vitest/config';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

// Load .env.test first for tests to ensure test environment variables take priority
// This prevents accidentally using production database URLs during tests
const envFiles = ['.env.test', '.env'];
for (const file of envFiles) {
  if (fs.existsSync(file)) {
    const envContent = dotenv.parse(fs.readFileSync(file));
    // Only set values that aren't already set (unless it's .env.test which should override)
    if (file === '.env.test') {
      Object.assign(process.env, envContent);
    } else {
      for (const [key, value] of Object.entries(envContent)) {
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

export default defineConfig({
  test: {
    environment: process.env.VITEST_ENV === 'integration' ? 'node' : 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/tests/e2e/**',
      '**/tests/unit/components/**', // Requiere configuración adicional - ver ROADMAP
    ],
    testTimeout: process.env.VITEST_ENV === 'integration' ? 20000 : 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  esbuild: {
    include: [/\.[jt]sx?$/],
    exclude: [],
    loader: 'tsx',
  },
  // Configuración para React Testing Library y componentes
  define: {
    'process.env': {},
  },
});
