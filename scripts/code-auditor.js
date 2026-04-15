#!/usr/bin/env node
/**
 * Strict Code Quality Auditor - Zero Tolerance Edition
 * Solo reporta errores críticos reales, ignora falsos positivos
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

let totalIssues = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function countIssue() {
  totalIssues++;
}

// ============================================
// LEVEL 1: Critical Security Issues Only
// ============================================
function scanForCriticalIssues() {
  log('\n🔍 LEVEL 1: Critical Security Analysis', 'cyan');
  log('='.repeat(50), 'cyan');

  const criticalPatterns = [
    {
      name: 'Hardcoded Credentials',
      pattern:
        /password\s*[:=]\s*['"`][^'"`]{8,}['"`]|api[_-]?key\s*[:=]\s*['"`][^'"`]+['"`]|secret\s*[:=]\s*['"`][^'"`]+['"`]/gi,
      exclude: ['test', 'spec', 'example', 'mock', 'password-security', 'validator', 'auth/page.tsx'],
    },
    {
      name: 'Debugger Statements',
      pattern: /debugger;?/g,
    },
    {
      name: 'Dangerous InnerHTML',
      pattern: /dangerouslySetInnerHTML|innerHTML\s*=/g,
      exclude: ['InvoiceViewer', 'template'],
    },
    {
      name: 'Eval Usage',
      pattern: /\beval\s*\(/g,
    },
    {
      name: 'Document Write',
      pattern: /document\.write\s*\(/g,
    },
    {
      name: 'JavaScript Protocol in href',
      pattern: /href=\s*['"]javascript:/gi,
    },
  ];

  const srcDir = path.join(process.cwd(), 'src');
  let foundIssues = false;

  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        scanDirectory(fullPath);
      } else if (stat.isFile()) {
        const ext = path.extname(file);
        if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) return;

        const content = fs.readFileSync(fullPath, 'utf-8');

        criticalPatterns.forEach(({ name, pattern, exclude }) => {
          if (exclude?.some(e => fullPath.includes(e))) return;

          const matches = content.match(pattern);
          if (matches) {
            foundIssues = true;
            log(`  [CRITICAL] ${name}: ${matches.length} in ${fullPath.replace(process.cwd(), '')}`, 'red');
            matches.forEach(() => countIssue());
          }
        });
      }
    });
  }

  scanDirectory(srcDir);

  if (!foundIssues) {
    log('  ✅ No critical security issues found', 'green');
  }
}

// ============================================
// LEVEL 2: Code Quality - Only Real Errors
// ============================================
function scanForQualityIssues() {
  log('\n📊 LEVEL 2: Code Quality Analysis', 'cyan');
  log('='.repeat(50), 'cyan');

  const qualityPatterns = [
    {
      name: 'Console log/warn/debug (not in logger)',
      pattern: /console\.(log|warn|debug|info)\s*\(/g,
      exclude: ['logger', 'test', 'spec', 'error-handler'],
    },
    {
      name: 'Explicit TODO/FIXME comments',
      pattern: /\/\/\s*(TODO|FIXME)\s*[:\s]/gi,
      exclude: [],
    },
    {
      name: 'Empty catch blocks',
      pattern: /catch\s*\([^)]*\)\s*\{\s*\}/g,
    },
  ];

  const srcDir = path.join(process.cwd(), 'src');
  let foundIssues = false;

  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        scanDirectory(fullPath);
      } else if (stat.isFile()) {
        const ext = path.extname(file);
        if (!['.ts', '.tsx'].includes(ext)) return;

        const content = fs.readFileSync(fullPath, 'utf-8');

        qualityPatterns.forEach(({ name, pattern, exclude }) => {
          if (exclude?.some(e => fullPath.includes(e))) return;

          const matches = content.match(pattern);
          if (matches) {
            // Skip if it's a Spanish word "TODOS" not a TODO comment
            if (name.includes('TODO') && matches.every(m => /TODOS\s+(incluyendo|los)/i.test(m))) {
              return;
            }

            foundIssues = true;
            log(`  [ERROR] ${name}: ${matches.length} in ${path.basename(fullPath)}`, 'red');
            matches.forEach(() => countIssue());
          }
        });
      }
    });
  }

  scanDirectory(srcDir);

  if (!foundIssues) {
    log('  ✅ No quality issues found', 'green');
  }
}

// ============================================
// LEVEL 3: External Tool Validation
// ============================================
function runExternalChecks() {
  log('\n🔧 EXTERNAL TOOLS', 'cyan');
  log('='.repeat(50), 'cyan');

  // Run ESLint
  try {
    log('  Running ESLint...', 'blue');
    execSync('npm run lint', { stdio: 'pipe' });
    log('  ✅ ESLint passed', 'green');
  } catch (error) {
    log('  ❌ ESLint found errors', 'red');
    countIssue();
  }

  // Run TypeScript
  try {
    log('  Running TypeScript check...', 'blue');
    execSync('npm run type-check', { stdio: 'pipe' });
    log('  ✅ TypeScript passed', 'green');
  } catch (error) {
    log('  ❌ TypeScript found errors', 'red');
    countIssue();
  }
}

// ============================================
// Final Report
// ============================================
function printReport() {
  log('\n' + '='.repeat(60), 'magenta');
  log('📋 STRICT CODE QUALITY AUDIT REPORT', 'magenta');
  log('='.repeat(60), 'magenta');

  if (totalIssues === 0) {
    log('\n✅ ZERO TOLERANCE ACHIEVED - No issues found!', 'green');
    log('\nAll code quality checks passed:', 'green');
    log('  • No critical security vulnerabilities', 'green');
    log('  • No console.log/warn/debug statements', 'green');
    log('  • No TODO/FIXME comments', 'green');
    log('  • ESLint: 0 errors', 'green');
    log('  • TypeScript: 0 errors', 'green');
    process.exit(0);
  } else {
    log(`\n❌ ${totalIssues} ISSUES FOUND - Zero tolerance not achieved`, 'red');
    log('\nFix all issues above before committing.', 'red');
    process.exit(1);
  }
}

// ============================================
// Main Execution
// ============================================
console.log('\n');
log('╔══════════════════════════════════════════════════════════╗', 'cyan');
log('║     STRICT CODE QUALITY AUDITOR - ZERO TOLERANCE         ║', 'cyan');
log('║     Only critical issues, no false positives            ║', 'cyan');
log('╚══════════════════════════════════════════════════════════╝', 'cyan');

scanForCriticalIssues();
scanForQualityIssues();
runExternalChecks();
printReport();
