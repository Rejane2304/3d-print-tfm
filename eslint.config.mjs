import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  // Next.js core-web-vitals and typescript configs
  ...compat.extends('next/core-web-vitals', 'next/typescript', 'prettier'),

  // Global ignores
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'dist/**',
      'coverage/**',
      '*.config.js',
      'scripts/**',
      'lint-staged.config.js',
    ],
  },

  // Base configuration for TS/TSX files
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-require-imports': 'error',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-expressions': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'no-console': 'off',
      'no-unused-vars': 'off',
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      'no-duplicate-imports': 'off',
      'no-warning-comments': ['warn', { terms: ['todo', 'fixme', 'hack', 'xxx'], location: 'start' }],
      'no-debugger': 'error',
      'no-alert': 'error',
    },
  },

  // Test files - relaxed rules
  {
    files: ['tests/**/*', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },

  // Dialogs - allow alert
  {
    files: ['src/lib/dialogs/*.ts'],
    rules: {
      'no-alert': 'off',
      'no-restricted-globals': 'off',
    },
  },

  // Scripts - allow console
  {
    files: ['scripts/**/*'],
    rules: {
      'no-console': 'off',
    },
  },

  // Admin pages
  {
    files: ['src/app/admin/**/*.tsx', 'src/app/admin/**/*.ts'],
    rules: {
      'no-alert': 'off',
      'no-restricted-globals': ['error', 'event', 'fdescribe', 'fit'],
    },
  },

  // Logger
  {
    files: ['src/lib/logger/*.ts'],
    rules: {
      'no-console': 'off',
      'no-warning-comments': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
];

export default eslintConfig;
