#!/bin/bash
# Script de verificación de calidad del código
# Ejecutar antes de commit: ./scripts/verify-and-fix.sh

set -e

echo "🔍 VERIFICACIÓN PRE-COMMIT"
echo "═══════════════════════════════════════════════════════════════"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS_FOUND=0
WARNINGS_FOUND=0

# Función para ejecutar comando y capturar errores
run_check() {
    local name="$1"
    local cmd="$2"
    
    echo ""
    echo "📋 Verificando: $name"
    
    if eval "$cmd" 2>&1; then
        echo -e "${GREEN}✅ $name: OK${NC}"
        return 0
    else
        echo -e "${RED}❌ $name: FALLÓ${NC}"
        ERRORS_FOUND=$((ERRORS_FOUND + 1))
        return 1
    fi
}

# 1. TypeScript - Sin errores
echo ""
echo "1️⃣  Verificando TypeScript..."
npx tsc --noEmit --project tsconfig.json 2>&1 | head -50 || ERRORS_FOUND=$((ERRORS_FOUND + 1))

# 2. ESLint - Sin errores ni advertencias
echo ""
echo "2️⃣  Verificando ESLint..."
npx eslint . --ext .ts,.tsx --max-warnings 0 --fix 2>&1 || {
    echo -e "${YELLOW}⚠️  ESLint encontró problemas${NC}"
    WARNINGS_FOUND=$((WARNINGS_FOUND + 1))
}

# 3. Prettier - Formato correcto
echo ""
echo "3️⃣  Verificando formato..."
npx prettier --check "src/**/*.{ts,tsx}" 2>&1 || {
    echo "🔧 Corrigiendo formato..."
    npx prettier --write "src/**/*.{ts,tsx}" 2>&1
}

# 4. Prisma - Schema válido
echo ""
echo "4️⃣  Verificando Prisma..."
npx prisma validate 2>&1 || ERRORS_FOUND=$((ERRORS_FOUND + 1))

# 5. Tests pasan
echo ""
echo "5️⃣  Ejecutando tests..."
npm run test:unit 2>&1 | tail -20 || ERRORS_FOUND=$((ERRORS_FOUND + 1))

# 6. Build exitoso
echo ""
echo "6️⃣  Verificando build..."
npm run build 2>&1 | tail -30 || ERRORS_FOUND=$((ERRORS_FOUND + 1))

# Reporte final
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "📊 RESUMEN"
echo "═══════════════════════════════════════════════════════════════"

if [ $ERRORS_FOUND -eq 0 ] && [ $WARNINGS_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ Todo está limpio y listo para commit${NC}"
    echo ""
    exit 0
else
    if [ $ERRORS_FOUND -gt 0 ]; then
        echo -e "${RED}❌ Se encontraron $ERRORS_FOUND errores críticos${NC}"
    fi
    if [ $WARNINGS_FOUND -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Se encontraron $WARNINGS_FOUND advertencias${NC}"
    fi
    echo ""
    echo "🔧 Corrige los problemas antes de hacer commit"
    exit 1
fi
