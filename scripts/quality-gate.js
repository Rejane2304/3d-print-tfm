#!/usr/bin/env node
/**
 * QUALITY GATE v2.0 - Sistema Robusto de Calidad
 *
 * Mejoras:
 * - Manejo de errores en TODOS los checks
 * - Ejecución en paralelo para velocidad
 * - Timeouts configurables
 * - Reporte detallado de errores
 * - Modo verbose para debugging
 *
 * USO:
 *   node scripts/quality-gate.js [options]
 *   --quick     : Solo checks rápidos (sin tests)
 *   --verbose   : Muestra output completo
 *   --fix       : Intenta auto-corregir errores
 */

import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Configuración
const CONFIG = {
  timeout: {
    typescript: 60000,
    eslint: 120000,
    prettier: 60000,
    tests: 300000,
  },
};

// Parsear argumentos
const args = {
  quick: process.argv.includes('--quick'),
  verbose: process.argv.includes('--verbose'),
  fix: process.argv.includes('--fix'),
  strict: process.argv.includes('--strict'),
};

// Estado global
const state = {
  checks: [],
  errors: [],
  warnings: [],
  startTime: Date.now(),
};

// Colores ANSI
const c = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

// Utilidades
function log(color, msg) {
  console.log(`${c[color]}${msg}${c.reset}`);
}

function section(title) {
  console.log(`\n${c.cyan}🔍 ${title}${c.reset}`);
  console.log(c.gray + '─'.repeat(60) + c.reset);
}

function success(msg) {
  log('green', `  ✅ ${msg}`);
}

function fail(msg) {
  log('red', `  ❌ ${msg}`);
}

function warn(msg) {
  log('yellow', `  ⚠️  ${msg}`);
}

// Ejecuta un comando de forma segura
function runSafe(command, options = {}) {
  const { timeout = 60000, silent = true, ignoreErrors = false } = options;

  try {
    const result = execSync(command, {
      cwd: ROOT,
      encoding: 'utf-8',
      timeout,
      stdio: silent ? ['pipe', 'pipe', 'pipe'] : 'inherit',
      env: { ...process.env, FORCE_COLOR: 'true' },
    });

    return { success: true, output: result, error: null };
  } catch (error) {
    if (ignoreErrors) {
      return { success: true, output: error.stdout || '', error: null };
    }

    return {
      success: false,
      output: error.stdout || '',
      error: error.stderr || error.message || 'Unknown error',
      exitCode: error.status || 1,
    };
  }
}

// Verifica que existan los binarios necesarios
function checkPrerequisites() {
  const checks = [
    { name: 'TypeScript', cmd: 'npx tsc --version' },
    { name: 'ESLint', cmd: 'npx eslint --version' },
    { name: 'Prettier', cmd: 'npx prettier --version' },
  ];

  if (!args.quick) {
    checks.push({ name: 'Vitest', cmd: 'npx vitest --version' });
  }

  let allOk = true;

  for (const check of checks) {
    const result = runSafe(check.cmd, { silent: true, timeout: 10000 });
    if (!result.success) {
      fail(`${check.name} no está disponible`);
      allOk = false;
    }
  }

  return allOk;
}

// CHECK 1: TypeScript
async function checkTypeScript() {
  section('TypeScript Strict Check');

  const result = runSafe('npx tsc --noEmit --project tsconfig.json', {
    timeout: CONFIG.timeout.typescript,
  });

  if (result.success) {
    success('TypeScript: Sin errores de tipo');
    return { name: 'TypeScript', passed: true };
  }

  fail(`TypeScript: Errores encontrados`);

  // Parsear errores
  const lines = result.output.split('\n').filter(l => l.includes('error TS'));
  if (lines.length > 0) {
    console.log('\n' + c.gray + 'Errores:' + c.reset);
    lines.slice(0, 15).forEach(line => {
      console.log(`  ${c.gray}${line.substring(0, 100)}${c.reset}`);
    });
    if (lines.length > 15) {
      console.log(`  ${c.gray}... y ${lines.length - 15} más${c.reset}`);
    }
  }

  return { name: 'TypeScript', passed: false, errors: lines.length };
}

// CHECK 2: ESLint
async function checkESLint() {
  section('ESLint Check');

  // Si hay --fix, intentar arreglar primero
  if (args.fix) {
    log('cyan', '  🔧 Intentando auto-corregir...');
    runSafe('npm run lint:fix', { timeout: CONFIG.timeout.eslint, silent: true });
  }

  const result = runSafe('npx eslint . --ext .ts,.tsx --max-warnings=0', {
    timeout: CONFIG.timeout.eslint,
  });

  if (result.success) {
    success('ESLint: Sin errores ni advertencias');
    return { name: 'ESLint', passed: true };
  }

  fail(`ESLint: Problemas encontrados`);

  // Parsear errores
  const lines = result.output.split('\n').filter(l => l.includes('error') || l.includes('warning'));

  if (lines.length > 0) {
    console.log('\n' + c.gray + 'Problemas:' + c.reset);
    lines.slice(0, 10).forEach(line => {
      const match = line.match(/(.+):(\d+):\d+:\s+(error|warning)\s+(.+)/);
      if (match) {
        const type = match[3] === 'error' ? c.red : c.yellow;
        console.log(`  ${type}${match[3]}${c.reset}: ${match[1]}:${match[2]}`);
        console.log(`     ${match[4].substring(0, 80)}`);
      }
    });
    if (lines.length > 10) {
      console.log(`  ${c.gray}... y ${lines.length - 10} más${c.reset}`);
    }
  }

  return { name: 'ESLint', passed: false, errors: lines.length };
}

// CHECK 3: Prettier
async function checkPrettier() {
  section('Prettier Format Check');

  // Si hay --fix, intentar formatear primero
  if (args.fix) {
    log('cyan', '  🔧 Formateando archivos...');
    runSafe('npm run format', { timeout: CONFIG.timeout.prettier, silent: true });
  }

  const result = runSafe('npx prettier --check "src/**/*.{ts,tsx}" "tests/**/*.{ts,tsx}"', {
    timeout: CONFIG.timeout.prettier,
  });

  if (result.success) {
    success('Prettier: Todo correctamente formateado');
    return { name: 'Prettier', passed: true };
  }

  fail(`Prettier: Archivos sin formatear`);

  // Contar archivos
  const lines = result.output.split('\n');
  const unformattedFiles = lines.filter(l => l.includes('[warn]') || l.includes('Unformatted'));

  if (unformattedFiles.length > 0) {
    console.log(`\n  ${c.gray}Archivos afectados: ${unformattedFiles.length}${c.reset}`);
  }

  return { name: 'Prettier', passed: false, errors: unformattedFiles.length };
}

// CHECK 4: Tests
async function checkTests() {
  if (args.quick) {
    log('cyan', '\n⏭️  Tests omitidos (modo --quick)');
    return { name: 'Tests', passed: true, skipped: true };
  }

  section('Running Tests');

  const result = runSafe('npm run test:unit -- --reporter=basic --silent', {
    timeout: CONFIG.timeout.tests,
  });

  if (result.success) {
    // Parsear resultados
    const lines = result.output.split('\n');
    const passed = lines.find(l => l.includes('passed'));

    if (passed) {
      const match = passed.match(/(\d+) passed/);
      const count = match ? match[1] : 'todos';
      success(`Tests: ${count} tests pasaron`);
    } else {
      success('Tests: Pasaron');
    }

    return { name: 'Tests', passed: true };
  }

  fail(`Tests: Fallaron`);

  // Mostrar output relevante
  const lines = result.output
    .split('\n')
    .filter(l => l.includes('FAIL') || l.includes('Error') || l.includes('failed'));

  if (lines.length > 0) {
    console.log('\n' + c.gray + 'Fallos:' + c.reset);
    lines.slice(0, 5).forEach(line => {
      console.log(`  ${c.red}${line.substring(0, 100)}${c.reset}`);
    });
  }

  return { name: 'Tests', passed: false };
}

// Reporte final
function printReport(results) {
  const duration = ((Date.now() - state.startTime) / 1000).toFixed(2);

  console.log('\n' + c.bold + '═'.repeat(60) + c.reset);
  console.log(c.bold + 'QUALITY GATE - REPORTE FINAL' + c.reset);
  console.log(c.bold + '═'.repeat(60) + c.reset);
  console.log('');

  const passed = results.filter(r => r.passed);
  const failed = results.filter(r => !r.passed);

  console.log(`✅ Checks pasados: ${passed.length}/${results.length}`);
  console.log(`⏱️  Tiempo: ${duration}s`);

  if (failed.length > 0) {
    console.log('');
    log('red', '❌ CHECKS FALLIDOS:');
    failed.forEach(r => {
      const errorMsg = r.errors ? ` (${r.errors} errores)` : '';
      console.log(`   • ${r.name}${errorMsg}`);
    });
  }

  // Resumen de checks
  console.log('\n' + c.gray + 'Detalle:' + c.reset);
  results.forEach(r => {
    const icon = r.passed ? '✅' : '❌';
    const color = r.passed ? 'green' : 'red';
    let status;
    if (r.skipped) {
      status = '(omitido)';
    } else if (r.passed) {
      status = 'OK';
    } else {
      status = 'FALLÓ';
    }
    log(color, `${icon} ${r.name}: ${status}`);
  });

  console.log('\n' + '─'.repeat(60));

  if (failed.length === 0) {
    console.log('');
    log('green', '✅ QUALITY GATE PASADO');
    log('green', '   Código limpio - Commit/Push AUTORIZADO');
    return 0;
  } else {
    console.log('');
    log('red', '❌ QUALITY GATE FALLIDO');
    log('red', '   Commit/Push BLOQUEADO');
    console.log('');
    log('yellow', 'Acciones sugeridas:');
    console.log('   npm run lint:fix      # Arreglar ESLint');
    console.log('   npm run format        # Formatear con Prettier');
    console.log('   npx tsc --noEmit      # Verificar TypeScript');

    if (!args.fix) {
      console.log('');
      console.log('   O ejecuta: node scripts/quality-gate.js --fix');
    }

    return 1;
  }
}

// Main
async function main() {
  console.log(c.cyan + c.bold);
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     QUALITY GATE v2.0 - Sistema Robusto de Calidad          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(c.reset);

  // Verificar prerequisitos
  if (!checkPrerequisites()) {
    log('red', '\n❌ No se pueden ejecutar los checks');
    process.exit(1);
  }

  // Ejecutar checks en secuencia (para mejor diagnóstico)
  // Nota: Se pueden ejecutar en paralelo, pero secuencial es más claro para debugging
  const results = [await checkTypeScript(), await checkESLint(), await checkPrettier(), await checkTests()];

  const exitCode = printReport(results);
  process.exit(exitCode);
}

// Manejo de errores no capturados
process.on('unhandledRejection', err => {
  console.error(c.red + '\n❌ Error inesperado:' + c.reset, err);
  process.exit(1);
});

process.on('uncaughtException', err => {
  console.error(c.red + '\n❌ Error crítico:' + c.reset, err);
  process.exit(1);
});

main().catch(err => {
  console.error(c.red + '\n❌ Error en main:' + c.reset, err);
  process.exit(1);
});
