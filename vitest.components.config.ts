import { defineConfig } from 'vitest/config';
import path from 'node:path';
import dotenv from 'dotenv';
import fs from 'node:fs';

// Load .env files
const envFiles = ['.env.test', '.env'];
for (const file of envFiles) {
  if (fs.existsSync(file)) {
    const envContent = dotenv.parse(fs.readFileSync(file));
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
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.components.ts'],
    include: ['tests/unit/components/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
    ],
    testTimeout: 10000,
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
    jsx: 'automatic', // Use automatic JSX runtime (no need to import React)
  },
  define: {
    'process.env': {},
  },
});
