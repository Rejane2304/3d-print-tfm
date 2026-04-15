#!/usr/bin/env node
/**
 * Comprehensive Code Quality Auditor
 * Detects errors and warnings at multiple levels
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

let totalIssues = 0;
let criticalIssues = 0;
let warnings = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function countIssue(severity) {
  totalIssues++;
  if (severity === 'critical') criticalIssues++;
  if (severity === 'warning') warnings++;
}

// ============================================
// LEVEL 1: Static Analysis - Pattern Detection
// ============================================
function scanForPatterns() {
  log('\n🔍 LEVEL 1: Static Pattern Analysis', 'cyan');
  log('='.repeat(50), 'cyan');

  const patterns = [
    {
      name: 'Hardcoded Credentials',
      pattern:
        /password\s*[:=]\s*['"`][^'"`]+['"`]|api[_-]?key\s*[:=]\s*['"`][^'"`]+['"`]|secret\s*[:=]\s*['"`][^'"`]+['"`]/gi,
      severity: 'critical',
      files: ['.ts', '.tsx', '.js', '.jsx'],
    },
    {
      name: 'Console Statements in Production',
      pattern: /console\.(log|debug|warn)\s*\(/g,
      severity: 'warning',
      files: ['.ts', '.tsx'],
      exclude: ['error', 'logger', 'test', 'spec'],
    },
    {
      name: 'Debugger Statements',
      pattern: /debugger;?/g,
      severity: 'critical',
      files: ['.ts', '.tsx', '.js', '.jsx'],
    },
    {
      name: 'TODO/FIXME without Ticket',
      pattern: /TODO(?!\s*\[)|FIXME(?!\s*\[)/gi,
      severity: 'warning',
      files: ['.ts', '.tsx'],
    },
    {
      name: 'Dangerous InnerHTML',
      pattern: /dangerouslySetInnerHTML|innerHTML\s*=/g,
      severity: 'critical',
      files: ['.tsx', '.jsx'],
    },
    {
      name: 'Eval Usage',
      pattern: /\beval\s*\(/g,
      severity: 'critical',
      files: ['.ts', '.tsx', '.js', '.jsx'],
    },
    {
      name: 'Any Type Usage',
      pattern: /:\s*any\b/g,
      severity: 'warning',
      files: ['.ts', '.tsx'],
    },
    {
      name: 'Empty Catch Blocks',
      pattern: /catch\s*\([^)]*\)\s*\{\s*\}/g,
      severity: 'warning',
      files: ['.ts', '.tsx'],
    },
    {
      name: 'Mutable Exports',
      pattern: /export\s+(let|var)\s+/g,
      severity: 'warning',
      files: ['.ts', '.tsx'],
    },
    {
      name: 'SetState in Render',
      pattern: /setState\s*\([^)]*\)\s*.*render|render.*setState/g,
      severity: 'critical',
      files: ['.tsx', '.jsx'],
    },
  ];

  const srcDir = path.join(process.cwd(), 'src');

  function scanDirectory(dir, patterns) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        scanDirectory(fullPath, patterns);
      } else if (stat.isFile()) {
        const ext = path.extname(file);
        const content = fs.readFileSync(fullPath, 'utf-8');

        patterns.forEach(({ name, pattern, severity, files: exts, exclude }) => {
          if (!exts.includes(ext)) return;
          if (exclude?.some(e => fullPath.includes(e))) return;

          const matches = content.match(pattern);
          if (matches) {
            const color = severity === 'critical' ? 'red' : 'yellow';
            log(
              `  [${severity.toUpperCase()}] ${name}: ${matches.length} matches in ${fullPath.replace(process.cwd(), '')}`,
              color,
            );
            matches.forEach(() => countIssue(severity));
          }
        });
      }
    });
  }

  if (fs.existsSync(srcDir)) {
    scanDirectory(srcDir, patterns);
  }
}

// ============================================
// LEVEL 2: Complexity Analysis
// ============================================
function analyzeComplexity() {
  log('\n📊 LEVEL 2: Code Complexity Analysis', 'cyan');
  log('='.repeat(50), 'cyan');

  const srcDir = path.join(process.cwd(), 'src');

  function calculateComplexity(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Count control structures
    const ifStatements = (content.match(/\bif\s*\(/g) || []).length;
    const loops = (content.match(/\b(for|while|do)\s*\(/g) || []).length;
    const switches = (content.match(/\bswitch\s*\(/g) || []).length;
    const catches = (content.match(/\bcatch\s*\(/g) || []).length;
    const logicOperators = (content.match(/\|\||&&/g) || []).length;

    // Cyclomatic complexity approximation
    const complexity = ifStatements + loops + switches + catches + logicOperators / 2;

    // Lines of code
    const lines = content.split('\n').length;

    return { complexity, lines, file: filePath };
  }

  const complexFiles = [];

  function scanDir(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        scanDir(fullPath);
      } else if (stat.isFile() && /\.(ts|tsx)$/.test(file)) {
        const result = calculateComplexity(fullPath);
        if (result.complexity > 15 || result.lines > 300) {
          complexFiles.push(result);
        }
      }
    });
  }

  if (fs.existsSync(srcDir)) {
    scanDir(srcDir);
  }

  if (complexFiles.length > 0) {
    log(`  Found ${complexFiles.length} files with high complexity:`, 'yellow');
    complexFiles
      .sort((a, b) => b.complexity - a.complexity)
      .slice(0, 10)
      .forEach(({ file, complexity, lines }) => {
        const severity = complexity > 25 || lines > 500 ? 'critical' : 'warning';
        const color = severity === 'critical' ? 'red' : 'yellow';
        log(
          `    [${severity.toUpperCase()}] ${path.basename(file)}: complexity ${complexity.toFixed(1)}, ${lines} lines`,
          color,
        );
        countIssue(severity);
      });
  } else {
    log('  ✅ No high complexity files found', 'green');
  }
}

// ============================================
// LEVEL 3: Import/Dependency Analysis
// ============================================
function analyzeDependencies() {
  log('\n📦 LEVEL 3: Dependency Analysis', 'cyan');
  log('='.repeat(50), 'cyan');

  const issues = [];

  // Check for circular dependencies
  const srcDir = path.join(process.cwd(), 'src');
  const imports = new Map();

  function scanImports(dir) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scanImports(fullPath);
      } else if (/\.(ts|tsx)$/.test(file)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const importMatches = content.match(/from\s+['"]([^'"]+)['"]/g) || [];

        imports.set(
          fullPath,
          importMatches
            .map(imp => {
              const match = imp.match(/from\s+['"]([^'"]+)['"]/);
              return match ? match[1] : null;
            })
            .filter(Boolean),
        );
      }
    });
  }

  scanImports(srcDir);

  // Check for duplicate imports
  const allImports = [];
  imports.forEach((imps, file) => {
    imps.forEach(imp => {
      if (imp.startsWith('.') || imp.startsWith('@/')) {
        allImports.push({ file, import: imp });
      }
    });
  });

  // Find unused exports (simplified check)
  const exportedFunctions = [];
  const usedFunctions = [];

  imports.forEach((imps, file) => {
    const content = fs.readFileSync(file, 'utf-8');

    // Find exports
    const exportMatches = content.match(/export\s+(?:async\s+)?function\s+(\w+)/g) || [];
    exportMatches.forEach(exp => {
      const name = exp.match(/function\s+(\w+)/)?.[1];
      if (name) exportedFunctions.push({ name, file });
    });

    // Check usage in other files
    exportedFunctions.forEach(({ name, file: exportedFile }) => {
      if (file !== exportedFile && content.includes(name)) {
        usedFunctions.push(name);
      }
    });
  });

  // Report potential unused exports
  const potentiallyUnused = exportedFunctions.filter(({ name }) => !usedFunctions.includes(name));

  if (potentiallyUnused.length > 0) {
    log(`  ⚠️  Found ${potentiallyUnused.length} potentially unused exports:`, 'yellow');
    potentiallyUnused.slice(0, 5).forEach(({ name, file }) => {
      log(`    - ${name} in ${path.basename(file)}`, 'yellow');
      countIssue('warning');
    });
  }
}

// ============================================
// LEVEL 4: Performance Analysis
// ============================================
function analyzePerformance() {
  log('\n⚡ LEVEL 4: Performance Analysis', 'cyan');
  log('='.repeat(50), 'cyan');

  const performanceIssues = [
    {
      name: 'Inline Function in JSX',
      pattern: /onClick=\{\s*\(\)\s*=>/g,
      severity: 'warning',
    },
    {
      name: 'Object/Array Literal in JSX',
      pattern: /style=\{\s*\{|data=\{\s*\[/g,
      severity: 'warning',
    },
    {
      name: 'Large Bundle Import',
      pattern: /import.*from\s+['"]lodash['"]/g,
      severity: 'warning',
    },
    {
      name: 'Synchronous File Operations',
      pattern: /readFileSync|writeFileSync/g,
      severity: 'warning',
    },
  ];

  const srcDir = path.join(process.cwd(), 'src');

  function scanForPerfIssues(dir) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scanForPerfIssues(fullPath);
      } else if (/\.(ts|tsx)$/.test(file)) {
        const content = fs.readFileSync(fullPath, 'utf-8');

        performanceIssues.forEach(({ name, pattern, severity }) => {
          const matches = content.match(pattern);
          if (matches) {
            log(`  [${severity.toUpperCase()}] ${name}: ${matches.length} in ${path.basename(fullPath)}`, 'yellow');
            matches.forEach(() => countIssue(severity));
          }
        });
      }
    });
  }

  scanForPerfIssues(srcDir);
}

// ============================================
// LEVEL 5: Security Analysis
// ============================================
function analyzeSecurity() {
  log('\n🔒 LEVEL 5: Security Analysis', 'cyan');
  log('='.repeat(50), 'cyan');

  const securityPatterns = [
    {
      name: 'SQL Injection Risk',
      pattern: /\$\{.*\b(query|sql|select|insert|update|delete)\b/i,
      severity: 'critical',
    },
    {
      name: 'XSS Risk - href/javascript',
      pattern: /href=\s*['"]javascript:/gi,
      severity: 'critical',
    },
    {
      name: 'XSS Risk - target="_blank" without rel',
      pattern: /target=\"_blank\"(?!.*rel=)/gi,
      severity: 'warning',
    },
    {
      name: 'Sensitive Data in Comments',
      pattern: /\/\/.*(?:password|secret|key|token|auth)/gi,
      severity: 'warning',
    },
    {
      name: 'Window Location Assignment',
      pattern: /window\.location\s*=|location\.href\s*=/g,
      severity: 'warning',
    },
    {
      name: 'Document Write',
      pattern: /document\.write\s*\(/g,
      severity: 'critical',
    },
  ];

  const srcDir = path.join(process.cwd(), 'src');

  function scanForSecurityIssues(dir) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scanForSecurityIssues(fullPath);
      } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
        const content = fs.readFileSync(fullPath, 'utf-8');

        securityPatterns.forEach(({ name, pattern, severity }) => {
          const matches = content.match(pattern);
          if (matches) {
            const color = severity === 'critical' ? 'red' : 'yellow';
            log(`  [${severity.toUpperCase()}] ${name}: ${matches.length} in ${path.basename(fullPath)}`, color);
            matches.forEach(() => countIssue(severity));
          }
        });
      }
    });
  }

  scanForSecurityIssues(srcDir);
}

// ============================================
// LEVEL 6: Accessibility Analysis
// ============================================
function analyzeAccessibility() {
  log('\n♿ LEVEL 6: Accessibility Analysis', 'cyan');
  log('='.repeat(50), 'cyan');

  const a11yPatterns = [
    {
      name: 'Missing alt attribute',
      pattern: /\u003cimg(?!.*alt=)[^\u003e]*\/?\u003e/gi,
      severity: 'warning',
    },
    {
      name: 'Click without keyboard handler',
      pattern: /onClick=\{[^}]+\}(?!.*onKeyDown)(?!.*role=)/g,
      severity: 'warning',
    },
    {
      name: 'Empty Button',
      pattern: /\u003cbutton[^\u003e]*\u003e\s*\u003c\/button\u003e/gi,
      severity: 'warning',
    },
  ];

  const srcDir = path.join(process.cwd(), 'src');

  function scanForA11yIssues(dir) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scanForA11yIssues(fullPath);
      } else if (/\.(tsx|jsx)$/.test(file)) {
        const content = fs.readFileSync(fullPath, 'utf-8');

        a11yPatterns.forEach(({ name, pattern, severity }) => {
          const matches = content.match(pattern);
          if (matches) {
            log(`  [${severity.toUpperCase()}] ${name}: ${matches.length} in ${path.basename(fullPath)}`, 'yellow');
            matches.forEach(() => countIssue(severity));
          }
        });
      }
    });
  }

  scanForA11yIssues(srcDir);
}

// ============================================
// Run External Tools
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
    log('  ❌ ESLint found issues', 'red');
    countIssue('critical');
  }

  // Run TypeScript
  try {
    log('  Running TypeScript check...', 'blue');
    execSync('npm run type-check', { stdio: 'pipe' });
    log('  ✅ TypeScript passed', 'green');
  } catch (error) {
    log('  ❌ TypeScript found issues', 'red');
    countIssue('critical');
  }
}

// ============================================
// Final Report
// ============================================
function printReport() {
  log('\n' + '='.repeat(60), 'magenta');
  log('📋 CODE QUALITY AUDIT REPORT', 'magenta');
  log('='.repeat(60), 'magenta');
  log(`\nTotal Issues Found: ${totalIssues}`, 'blue');
  log(`  🔴 Critical: ${criticalIssues}`, criticalIssues > 0 ? 'red' : 'green');
  log(`  🟡 Warnings: ${warnings}`, warnings > 0 ? 'yellow' : 'green');

  if (criticalIssues > 0) {
    log('\n⚠️  Critical issues must be fixed before commit!', 'red');
    process.exit(1);
  } else if (warnings > 0) {
    log('\n⚠️  Warnings should be reviewed', 'yellow');
  } else {
    log('\n✅ No issues found! Code is clean.', 'green');
  }
}

// ============================================
// Main Execution
// ============================================
console.log('\n');
log('╔══════════════════════════════════════════════════════════╗', 'cyan');
log('║     COMPREHENSIVE CODE QUALITY AUDITOR v2.0              ║', 'cyan');
log('║     Multi-level error detection system                  ║', 'cyan');
log('╚══════════════════════════════════════════════════════════╝', 'cyan');

scanForPatterns();
analyzeComplexity();
analyzeDependencies();
analyzePerformance();
analyzeSecurity();
analyzeAccessibility();
runExternalChecks();
printReport();
