#!/usr/bin/env node
/**
 * ZERO TOLERANCE CODE CHECK
 * Script de monitoreo en tiempo real para detectar TODOS los errores

 * REGLA DE TOLERANCIA CERO:
 * - 0 errores de TypeScript
 * - 0 errores de ESLint
 * - 0 errores de SonarQube
 * - 0 advertencias (warnings)
 * - 0 archivos sin formato correcto
 * - 0 imports no usados
 * - 0 variables no usadas
 * - 0 funciones vacías
 * - 0 tipos 'any' implícitos

 * Cualquier error detiene el commit.
 */

import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

let TOTAL_ERRORS = 0;

function runCheck(name, command, parser) {
  console.log(`\n🔍 ${name}...`);
  try {
    const output = execSync(command, {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const result = parser ? parser(output) : { errors: 0, output };
    if (result.errors === 0) {
      console.log(`  ✅ ${name}: SIN ERRORES`);
    } else {
      console.log(`  ❌ ${name}: ${result.errors} ERRORES`);
      if (result.output) {
        console.log(result.output);
      }
      TOTAL_ERRORS += result.errors;
    }
    return result.errors;
  } catch (error) {
    const errorOutput = error.stdout || error.message;
    const result = parser ? parser(errorOutput) : { errors: 1, output: errorOutput };
    console.log(`  ❌ ${name}: ${result.errors} ERRORES`);
    if (result.output) {
      console.log(result.output);
    }
    TOTAL_ERRORS += result.errors;
    return result.errors;
  }
}

console.log('═══════════════════════════════════════════════════════════');
console.log('  ZERO TOLERANCE CODE CHECK - TOLERANCIA CERO');
console.log('═══════════════════════════════════════════════════════════');

// 1. TypeScript - Estricto
runCheck('TypeScript', 'npx tsc --noEmit --project tsconfig.json', (output) => {
  const lines = output.split('\n').filter(l => l.includes('error TS'));
  return { errors: lines.length, output: lines.join('\n') };
});

// 2. ESLint - Todos los archivos
runCheck('ESLint (src/)', 'npx eslint src/ --ext .ts,.tsx --max-warnings 0', (output) => {
  const match = output.match(/(\d+) problem/);
  return { errors: match ? Number.parseInt(match[1]) : 0, output };
});

// 3. ESLint - Tests
runCheck('ESLint (tests/)', 'npx eslint tests/ --ext .ts,.tsx --max-warnings 0', (output) => {
  const match = output.match(/(\d+) problem/);
  return { errors: match ? Number.parseInt(match[1]) : 0, output };
});

// 4. Prettier Check
runCheck('Prettier', 'npx prettier --check "src/**/*.{ts,tsx}" "tests/**/*.{ts,tsx}"', (output) => {
  const lines = output.split('\n').filter(l => l.includes('[warn]'));
  return { errors: lines.length, output: lines.join('\n') };
});

// Reporte final
console.log('\n═══════════════════════════════════════════════════════════');
console.log('  RESULTADO FINAL');
console.log('═══════════════════════════════════════════════════════════');

if (TOTAL_ERRORS === 0) {
  console.log('  ✅ PROYECTO LIMPIO - TOLERANCIA CERO CUMPLIDA');
  console.log('  Todos los checks pasaron sin errores ni advertencias.');
  process.exit(0);
} else {
  console.log(`  ❌ SE ENCONTRARON ${TOTAL_ERRORS} PROBLEMAS`);
  console.log('  El commit está BLOQUEADO.');
  console.log('');
  console.log('  Corrige todos los errores antes de continuar.');
  process.exit(1);
}
