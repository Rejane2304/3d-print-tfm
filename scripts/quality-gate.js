#!/usr/bin/env node
/**
 * QUALITY GATE - Sistema Definitivo de Calidad de Código
 *
 * REGLAS TOLERANCIA CERO:
 * - 0 errores TypeScript
 * - 0 errores ESLint
 * - 0 archivos sin formatear
 * - 0 tests fallidos
 *
 * USO:
 *   node scripts/quality-gate.js [--strict] [--quick]
 *
 * EXIT CODE: 0 = OK, 1 = BLOQUEADO
 */

import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Parsear argumentos
const args = {
  strict: process.argv.includes('--strict'),
  quick: process.argv.includes('--quick'),
};

// Estado
const state = {
  errors: [],
  warnings: [],
  checksPassed: 0,
  checksFailed: 0,
};

// Colores
const colors = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  reset: '\x1b[0m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log(`\n${colors.cyan}🔍 ${title}${colors.reset}`);
}

function run(command, options = {}) {
  try {
    return execSync(command, {
      cwd: ROOT,
      encoding: 'utf-8',
      stdio: options.silent ? ['pipe', 'pipe', 'pipe'] : 'inherit',
      ...options,
    });
  } catch (e) {
    if (options.ignoreErrors) {
      return e.stdout || e.message || '';
    }
    throw e;
  }
}

// Check 1: TypeScript
function checkTypeScript() {
  section('TypeScript Strict Check');
  try {
    run('npx tsc --noEmit --project tsconfig.json', { silent: true });
    log('green', '✅ TypeScript: Sin errores');
    state.checksPassed++;
    return true;
  } catch (e) {
    const lines = (e.stdout || '').split('\n').filter(l => l.includes('error TS'));
    log('red', `❌ TypeScript: ${lines.length} errores`);
    state.errors.push(...lines.slice(0, 10).map(l => l.substring(0, 100)));
    state.checksFailed++;
    return false;
  }
}

// Check 2: ESLint
function checkESLint() {
  section('ESLint Check');
  try {
    execSync('npm run lint', { cwd: ROOT, stdio: 'pipe' });
    log('green', '✅ ESLint: Sin errores');
    state.checksPassed++;
    return true;
  } catch (e) {
    log('red', '❌ ESLint: Errores encontrados');
    state.checksFailed++;
    return false;
  }
}

// Check 3: Prettier
function checkPrettier() {
  section('Prettier Format Check');
  try {
    // Solo verificar src/ y tests/
    execSync('npx prettier --check "src/**/*.{ts,tsx}" "tests/**/*.{ts,tsx}"', {
      cwd: ROOT,
      stdio: 'pipe',
    });
    log('green', '✅ Prettier: Todo formateado');
    state.checksPassed++;
    return true;
  } catch (e) {
    log('red', '❌ Prettier: Archivos sin formatear');
    state.checksFailed++;
    return false;
  }
}

// Check 4: Tests (si no es quick)
function checkTests() {
  if (args.quick) {
    log('cyan', '⏭️  Tests omitidos (--quick)');
    return true;
  }

  section('Running Tests');
  let allPassed = true;

  // Unit tests
  try {
    run('npm run test:unit -- --silent', { silent: true });
    log('green', '✅ Unit Tests: Pasaron');
    state.checksPassed++;
  } catch (e) {
    log('red', '❌ Unit Tests: Fallaron');
    state.checksFailed++;
    allPassed = false;
  }

  return allPassed;
}

// Reporte final
function printReport() {
  console.log('\n' + '═'.repeat(60));
  console.log('QUALITY GATE - REPORTE FINAL');
  console.log('═'.repeat(60));
  console.log('');

  console.log(`✅ Checks pasados: ${state.checksPassed}`);
  console.log(`❌ Checks fallidos: ${state.checksFailed}`);

  if (state.errors.length > 0) {
    console.log('\nErrores:');
    state.errors.forEach(e => console.log(`  ${e}`));
  }

  console.log('\n' + '─'.repeat(60));

  if (state.checksFailed === 0) {
    console.log('');
    log('green', '✅ QUALITY GATE PASADO');
    log('green', '   Código limpio - Commit/Push AUTORIZADO');
    return 0;
  } else {
    console.log('');
    log('red', '❌ QUALITY GATE FALLIDO');
    log('red', '   Commit/Push BLOQUEADO');
    console.log('');
    log('yellow', 'Acciones:');
    console.log('   1. npm run lint:fix    (arreglar ESLint)');
    console.log('   2. npm run format      (formatear código)');
    console.log('   3. npx tsc --noEmit    (verificar TypeScript)');
    return 1;
  }
}

// Main
function main() {
  console.log(colors.cyan + '╔══════════════════════════════════════════════════════════════╗');
  console.log('║     QUALITY GATE - Sistema de Calidad Tolerancia Cero      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝' + colors.reset);

  const checks = [checkTypeScript(), checkESLint(), checkPrettier(), checkTests()];

  const exitCode = printReport();
  process.exit(exitCode);
}

main();
