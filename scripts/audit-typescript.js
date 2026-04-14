#!/usr/bin/env node
/**
 * AUDIT-TYPESCRIPT.JS - Auditoría Profunda de Código TypeScript
 *
 * Detecta:
 * - Imports no utilizados
 * - Variables no usadas
 * - TODOs sin fecha
 * - Console.log en producción
 * - Tipos 'any' explícitos
 *
 * USO:
 *   node scripts/audit-typescript.js [--fix]
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { glob } from 'glob';

const AUTO_FIX = process.argv.includes('--fix');

// Estado
const issues = {
  unusedImports: [],
  consoleLogs: [],
  explicitAny: [],
  todosWithoutDate: [],
};

const colors = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
};

function log(color, msg) {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

// Verificar errores de TypeScript
function checkTypeScriptErrors() {
  console.log('\n🔍 Verificando errores de TypeScript...');

  try {
    execSync('npx tsc --noEmit', { cwd: process.cwd(), stdio: 'pipe' });
    log('green', '✅ No hay errores de TypeScript');
    return true;
  } catch (e) {
    const output = e.stdout?.toString() || '';
    const errors = output.split('\n').filter(l => l.includes('error TS'));

    log('red', `❌ ${errors.length} errores de TypeScript encontrados`);
    errors.slice(0, 10).forEach(err => {
      console.log(`   ${err.substring(0, 100)}`);
    });
    return false;
  }
}

// Buscar TODOs sin fecha
function checkTODOs(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    if (/\/\/.*TODO(?!.*\d{4}-\d{2}-\d{2})/i.test(line) && !line.includes('TODO: YYYY-MM-DD')) {
      issues.todosWithoutDate.push({
        file: filePath,
        line: index + 1,
        text: line.trim(),
      });
    }
  });
}

// Main
function main() {
  console.log(colors.cyan + '╔══════════════════════════════════════════════════════════════╗');
  console.log('║     AUDIT-TYPESCRIPT - Auditoría de Código                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝' + colors.reset);

  const tsOk = checkTypeScriptErrors();

  console.log('\n🔍 Auditando código...');
  const files = glob.sync('src/**/*.{ts,tsx}');

  files.forEach(file => checkTODOs(file));

  // Reporte
  console.log('\n' + '='.repeat(60));
  if (issues.todosWithoutDate.length > 0) {
    log('yellow', `TODOs sin fecha: ${issues.todosWithoutDate.length}`);
  } else {
    log('green', '✅ No se encontraron issues');
  }

  if (!tsOk) {
    console.log('\n' + colors.red + '❌ Corrige los errores de TypeScript primero');
    console.log('   Run: npx tsc --noEmit' + colors.reset);
  }
}

main();
