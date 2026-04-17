#!/bin/bash
# Script para verificar el estado de SonarQube con la configuración optimizada

echo "========================================"
echo "Verificación de SonarQube Optimizado"
echo "========================================"
echo ""

echo "1. Verificando configuración SonarQube:"
echo "   ----------------------------------------"

# Verificar sonar-project.properties
if [ -f "sonar-project.properties" ]; then
    echo "   ✅ sonar-project.properties existe"
    
    # Verificar configuraciones clave
    if grep -q "sonar.typescript.typeCheck=false" sonar-project.properties; then
        echo "   ✅ Type checking desactivado (previene hang)"
    else
        echo "   ❌ Type checking NO desactivado"
    fi
    
    if grep -q "sonar.typescript.node.modules.skip=true" sonar-project.properties; then
        echo "   ✅ Node modules skip activado"
    else
        echo "   ❌ Node modules skip NO activado"
    fi
    
    if grep -q "sonar.javaOpts=-Xmx4096m" sonar-project.properties; then
        echo "   ✅ Memoria configurada a 4GB"
    else
        echo "   ❌ Memoria NO configurada correctamente"
    fi
    
    if grep -q "sonar.analysis.timeout=300000" sonar-project.properties; then
        echo "   ✅ Timeout configurado (5 minutos)"
    else
        echo "   ❌ Timeout NO configurado"
    fi
else
    echo "   ❌ sonar-project.properties NO encontrado"
fi

echo ""
echo "2. Verificando VS Code settings:"
echo "   ----------------------------------------"

if [ -f ".vscode/settings.json" ]; then
    echo "   ✅ .vscode/settings.json existe"
    
    if grep -q "sonarlint.excludedFiles" .vscode/settings.json; then
        echo "   ✅ Archivos excluidos configurados"
    else
        echo "   ❌ Archivos excluidos NO configurados"
    fi
else
    echo "   ⚠️  .vscode/settings.json NO existe (opcional)"
fi

echo ""
echo "3. Verificando script de análisis:"
echo "   ----------------------------------------"

if [ -f "scripts/sonarqube-optimized-scan.sh" ]; then
    echo "   ✅ scripts/sonarqube-optimized-scan.sh existe"
    if [ -x "scripts/sonarqube-optimized-scan.sh" ]; then
        echo "   ✅ Script es ejecutable"
    else
        echo "   ⚠️  Script no es ejecutable (ejecutar: chmod +x)"
    fi
else
    echo "   ❌ Script NO encontrado"
fi

echo ""
echo "4. Verificando archivos problemáticos:"
echo "   ----------------------------------------"

PROBLEMATIC_FILES=(
    "src/app/api/checkout/route.ts"
    "src/app/api/payments/stripe/create/route.ts"
    "src/app/api/payments/paypal/create/route.ts"
    "src/app/api/admin/analytics/route.ts"
)

for file in "${PROBLEMATIC_FILES[@]}"; do
    if [ -f "$file" ]; then
        lines=$(wc -l < "$file" | tr -d ' ')
        echo "   ⚠️  $file ($lines líneas) - Excluido del análisis"
    fi
done

echo ""
echo "5. TypeScript Check (resumen):"
npm run type-check 2>&1 | tail -3 || echo "   ⚠️  Errores de TypeScript detectados"

echo ""
echo "========================================"
echo "Verificación completada"
echo "========================================"
echo ""
echo "Para ejecutar el análisis optimizado:"
echo "  ./scripts/sonarqube-optimized-scan.sh"
echo ""
