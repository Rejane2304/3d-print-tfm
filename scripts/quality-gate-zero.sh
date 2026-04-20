#!/bin/bash
# =============================================================================
# QUALITY GATE - TOLERANCIA CERO
# Script de verificación exhaustiva antes de commits
# =============================================================================

set -e  # Exit on first error

echo "🔒 QUALITY GATE - TOLERANCIA CERO"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Function to check and report
check_step() {
    local name="$1"
    local command="$2"
    
    echo -n "Checking $name... "
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${RED}✗${NC}"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# 1. TypeScript Strict
echo "📋 Paso 1: TypeScript Strict Mode"
if ! npx tsc --noEmit --strict 2>&1 | grep -q "error TS"; then
    echo -e "${GREEN}✓ TypeScript: Sin errores${NC}"
else
    echo -e "${RED}✗ TypeScript: Hay errores${NC}"
    npx tsc --noEmit --strict 2>&1 | grep "error TS" | head -10
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 2. ESLint
echo "📋 Paso 2: ESLint"
if npx eslint src --ext .ts,.tsx --max-warnings=0 2>&1 | grep -q "error"; then
    echo -e "${RED}✗ ESLint: Hay errores${NC}"
    npx eslint src --ext .ts,.tsx --max-warnings=0 2>&1 | grep "error" | head -10
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ ESLint: Sin errores${NC}"
fi
echo ""

# 3. Tests Unitarios
echo "📋 Paso 3: Tests Unitarios"
if npm run test:unit 2>&1 | grep -q "passed"; then
    echo -e "${GREEN}✓ Tests: Todos pasaron${NC}"
else
    echo -e "${RED}✗ Tests: Hay fallos${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 4. Build
echo "📋 Paso 4: Build de Producción"
if npm run build 2>&1 | grep -qE "(error|failed|Error|Failed)"; then
    echo -e "${RED}✗ Build: Falló${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ Build: Exitoso${NC}"
fi
echo ""

# Resultado final
echo "=================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ QUALITY GATE PASADO${NC}"
    echo -e "${GREEN}   Tolerancia cero: Sin errores${NC}"
    exit 0
else
    echo -e "${RED}❌ QUALITY GATE FALLIDO${NC}"
    echo -e "${RED}   Se encontraron $ERRORS errores${NC}"
    echo ""
    echo "Corrige los errores antes de hacer commit."
    exit 1
fi
