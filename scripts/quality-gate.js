#!/usr/bin/env node
/**
 * QUALITY GATE - Sistema Definitivo de Calidad de Código
 * 
 * REGLAS ESTRICTAS:
 * - CERO errores TypeScript
 * - CERO errores ESLint
 * - CERO advertencias SonarQube
 * - CERO console.log en producción
 * - CÓDIGO 100% formateado
 * 
 * Cualquier fallo = BLOQUEO INMEDIATO
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

let EXIT_CODE = 0;
const ERRORS = [];

function error(file, line, message, severity = 'ERROR') {
  ERRORS.push({ file, line, message, severity });
  EXIT_CODE = 1;
}

function section(title) {
  console.log(`\n🔍 ${title}`);
  console.log('─'.repeat(60));
}

function run(command, options = {}) {
  try {
    return execSync(command, { 
      cwd: ROOT, 
      encoding: 'utf-8',
      stdio: options.silent ? ['pipe', 'pipe', 'pipe'] : 'inherit',
      ...options 
    });
  } catch (e) {
    if (options.ignoreErrors) return e.stdout || '';
    throw e;
  }
}

// ═══════════════════════════════════════════════════════════
// CHECK 1: TypeScript Strict
// ═══════════════════════════════════════════════════════════
section('TypeScript Strict Check');
try {
  run('npx tsc --noEmit --project tsconfig.json', { silent: true });
  console.log('✅ TypeScript: Sin errores');
} catch (e) {
  const output = e.stdout || e.message;
  const lines = output.split('\n').filter(l => l.includes('error TS'));
  lines.forEach(line => {
    const match = line.match(/(.+)\((\d+),(\d+)\):\s+error\s+TS\d+:\s+(.+)/);
    if (match) {
      error(match[1], match[2], match[4], 'TS_ERROR');
    }
  });
  console.log(`❌ TypeScript: ${lines.length} errores`);
}

// ═══════════════════════════════════════════════════════════
// CHECK 2: ESLint Zero Tolerance
// ═══════════════════════════════════════════════════════════
section('ESLint Zero Tolerance');
try {
  run('npx eslint . --ext .ts,.tsx --max-warnings 0', { silent: true });
  console.log('✅ ESLint: Sin errores ni advertencias');
} catch (e) {
  const output = e.stdout || e.message;
  const lines = output.split('\n').filter(l => l.includes('error') || l.includes('warning'));
  lines.forEach(line => {
    const match = line.match(/(.+):(\d+):(\d+):\s+(error|warning)\s+(.+)/);
    if (match) {
      error(match[1], match[2], match[5], match[4].toUpperCase());
    }
  });
  console.log(`❌ ESLint: ${lines.length} problemas`);
}

// ═══════════════════════════════════════════════════════════
// CHECK 3: No Console.log in Production Code
// ═══════════════════════════════════════════════════════════
section('Console.log Detection (src/ only)');
const consoleOutput = run('grep -r "console\\.log" src/ --include="*.ts" --include="*.tsx" -n || true', { silent: true });
const consoleLines = consoleOutput.split('\n').filter(l => l.trim() && !l.includes('node_modules'));
if (consoleLines.length > 0) {
  consoleLines.forEach(line => {
    const match = line.match(/(.+):(\d+):.+console\.log/);
    if (match) {
      error(match[1], match[2], 'console.log encontrado en código de producción', 'CONSOLE');
    }
  });
  console.log(`❌ Console.log: ${consoleLines.length} encontrados`);
} else {
  console.log('✅ Console.log: Limpio');
}

// ═══════════════════════════════════════════════════════════
// CHECK 4: Prettier Format
// ═══════════════════════════════════════════════════════════
section('Prettier Format Check');
try {
  run('npx prettier --check "src/**/*.{ts,tsx}" --log-level warn', { silent: true });
  console.log('✅ Prettier: Todo formateado');
} catch (e) {
  const output = e.stdout || '';
  const unformatted = output.split('\n').filter(l => l.includes('[warn]')).length;
  error('PRETTIER', 'N/A', `${unformatted} archivos sin formatear`, 'FORMAT');
  console.log(`❌ Prettier: ${unformatted} archivos sin formatear`);
}

// ═══════════════════════════════════════════════════════════
// CHECK 5: SonarQube Critical Issues
// ═══════════════════════════════════════════════════════════
section('SonarQube Critical Rules');
const patterns = [
  { pattern: 'dangerouslySetInnerHTML', desc: 'XSS Risk: dangerouslySetInnerHTML' },
  { pattern: 'eval\\(', desc: 'Security: eval() usage' },
  { pattern: 'innerHTML\\s*=', desc: 'XSS Risk: innerHTML assignment' },
];

patterns.forEach(({ pattern, desc }) => {
  const result = run(`grep -r "${pattern}" src/ --include="*.ts" --include="*.tsx" -n || true`, { silent: true });
  if (result.trim()) {
    result.split('\n').forEach(line => {
      const match = line.match(/(.+):(\d+):/);
      if (match) {
        error(match[1], match[2], desc, 'SONARQUBE');
      }
    });
  }
});

// ═══════════════════════════════════════════════════════════
// REPORT FINAL
// ═══════════════════════════════════════════════════════════
console.log('\n' + '═'.repeat(60));
console.log('QUALITY GATE REPORT');
console.log('═'.repeat(60));

if (ERRORS.length === 0) {
  console.log('✅ ÉXITO: Código 100% limpio');
  console.log('   Todos los checks pasaron sin errores.');
  console.log('   El commit está AUTORIZADO.');
  process.exit(0);
} else {
  console.log(`❌ FALLO: ${ERRORS.length} problemas encontrados`);
  console.log('');
  console.log('Detalles:');
  console.log('─'.repeat(60));
  
  ERRORS.forEach(({ file, line, message, severity }) => {
    const icon = severity === 'ERROR' || severity === 'TS_ERROR' ? '🔴' : '🟡';
    console.log(`${icon} ${file}:${line}`);
    console.log(`   ${message}`);
  });
  
  console.log('');
  console.log('═'.repeat(60));
  console.log('ACCIÓN REQUERIDA:');
  console.log('1. Corrige todos los errores listados arriba');
  console.log('2. Ejecuta: npm run lint:fix (para auto-corregir)');
  console.log('3. Verifica: npx tsc --noEmit');
  console.log('4. Intenta el commit nuevamente');
  console.log('═'.repeat(60));
  process.exit(1);
}
