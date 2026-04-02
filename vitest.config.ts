import { defineConfig } from 'vitest/config';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

// Cargar .env.test si está usando ambiente de tests
const envFile = process.env.NODE_ENV === 'test' || process.env.VITEST_ENV === 'integration' 
  ? '.env.test' 
  : '.env';

if (fs.existsSync(envFile)) {
  const envContent = dotenv.parse(fs.readFileSync(envFile));
  Object.assign(process.env, envContent);
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
      '**/tests/unit/components/**', // Excluir tests de componentes React - requieren configuración especial
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
});
