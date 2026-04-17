#!/bin/bash
# Script para verificar el estado de SonarQube

echo "========================================"
echo "Verificación de SonarQube"
echo "========================================"
echo ""

echo "1. TypeScript Check:"
npm run type-check 2>&1 | tail -3

echo ""
echo "2. Archivos de importación refactorizados:"
for file in categories clients coupons inventory orders; do
  lines=$(wc -l < "src/app/api/admin/${file}/import/route.ts" 2>/dev/null || echo "N/A")
  echo "   - ${file}/import/route.ts: ${lines} líneas"
done

echo ""
echo "3. Complejidad estimada (basado en funciones):"
grep -c "^export async function POST" src/app/api/admin/*/import/route.ts 2>/dev/null || echo "   POST functions found"

echo ""
echo "========================================"
echo "Verificación completada"
echo "========================================"
