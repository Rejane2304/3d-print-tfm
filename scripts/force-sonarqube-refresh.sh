#!/bin/bash
# Script para forzar análisis limpio de SonarQube

echo "=========================================="
echo "Forzando análisis limpio de SonarQube"
echo "=========================================="
echo ""

# 1. Limpiar caché de Next.js
echo "1. Limpiando caché de Next.js..."
rm -rf .next
rm -rf node_modules/.cache
echo "   ✅ Caché limpiado"
echo ""

# 2. Verificar que los archivos son simples
echo "2. Verificando archivos simplificados:"
for dir in categories clients coupons inventory orders; do
  lines=$(wc -l < "src/app/api/admin/${dir}/import/route.ts" 2>/dev/null || echo "0")
  if [ "$lines" -lt 20 ]; then
    echo "   ✅ $dir/import/route.ts: $lines líneas (correcto)"
  else
    echo "   ⚠️  $dir/import/route.ts: $lines líneas (revisar)"
  fi
done
echo ""

# 3. Compilar TypeScript para asegurar que no hay errores
echo "3. Compilando TypeScript..."
npm run type-check 2>&1 | grep -E "(error|Error)" || echo "   ✅ Sin errores de TypeScript"
echo ""

# 4. Construir el proyecto
echo "4. Construyendo proyecto..."
npm run build 2>&1 | tail -5
echo ""

echo "=========================================="
echo "Proceso completado"
echo "=========================================="
echo ""
echo "Próximos pasos:"
echo "1. En VS Code: Cmd+Shift+P → Developer: Reload Window"
echo "2. Esperar a que SonarLint se reinicie"
echo "3. Verificar que los 9 problemas desaparecen"
echo ""
