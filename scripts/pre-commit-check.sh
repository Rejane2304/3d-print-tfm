#!/bin/bash
# Script de verificación PRÁCTICO para pre-commit
# Solo verifica errores CRÍTICOS, no warnings de estilo

set -e

echo "🔍 VERIFICACIÓN PRE-COMMIT (Modo Práctico)"
echo "═══════════════════════════════════════════════════════════════"

ERRORS=0

# 1. TypeScript - Solo errores de compilación, no warnings
echo ""
echo "1️⃣  Verificando TypeScript..."
npx tsc --noEmit --project tsconfig.json 2>&1 | grep -E "^[^ ]*error TS[0-9]+:" | head -20 || true
if [ $? -ne 0 ]; then
    echo "✅ TypeScript OK"
else
    echo "❌ Errores de TypeScript encontrados"
    ERRORS=$((ERRORS + 1))
fi

# 2. ESLint - Solo errores, no warnings
echo ""
echo "2️⃣  Verificando ESLint (solo src/, ignorando tests)..."
npx eslint src/ --ext .ts,.tsx --quiet 2>&1 || {
    echo "⚠️  ESLint encontró errores"
    ERRORS=$((ERRORS + 1))
}

# 3. Build
echo ""
echo "3️⃣  Verificando build..."
npm run build 2>&1 | tail -10 || ERRORS=$((ERRORS + 1))

# 4. Tests
echo ""
echo "4️⃣  Ejecutando tests..."
npm run test:unit 2>&1 | tail -10 || ERRORS=$((ERRORS + 1))

# Reporte
echo ""
echo "═══════════════════════════════════════════════════════════════"
if [ $ERRORS -eq 0 ]; then
    echo "✅ Todo listo para commit"
    exit 0
else
    echo "❌ Hay $ERRORS problemas que requieren atención"
    echo ""
    echo "💡 Sugerencia: Ejecuta 'npm run lint:fix' para auto-corregir"
    exit 1
fi
