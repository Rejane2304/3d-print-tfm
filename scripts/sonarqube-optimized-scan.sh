#!/bin/bash
# =============================================================================
# Script de análisis SonarQube optimizado
# Resuelve el problema: "analizando 'route.ts' y sus dependencias"
# =============================================================================

set -e

echo "=========================================="
echo "SonarQube Optimized Analysis"
echo "=========================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar variables de entorno
if [ -z "$SONAR_TOKEN" ]; then
    echo -e "${RED}Error: SONAR_TOKEN no está configurado${NC}"
    echo "Configura el token antes de continuar:"
    echo "  export SONAR_TOKEN=your_token_here"
    exit 1
fi

# Configurar memoria optimizada
export SONAR_SCANNER_OPTS="-Xmx4096m -XX:+UseG1GC -XX:MaxGCPauseMillis=200"
export NODE_OPTIONS="--max-old-space-size=4096"

echo -e "${GREEN}✓${NC} Configuración de memoria aplicada:"
echo "  - SONAR_SCANNER_OPTS: $SONAR_SCANNER_OPTS"
echo "  - NODE_OPTIONS: $NODE_OPTIONS"
echo ""

# Limpiar cachés previos que pueden causar problemas
echo "Limpiando cachés..."
rm -rf .sonar
rm -rf node_modules/.cache
rm -rf .next/cache
# Limpiar posibles archivos temporales del scanner
rm -rf /tmp/sonar*
echo -e "${GREEN}✓${NC} Cachés limpiados"
echo ""

# Verificar que los archivos problemáticos existen y mostrar advertencias
echo "Verificando archivos problemáticos..."
PROBLEMATIC_FILES=(
    "src/app/api/checkout/route.ts"
    "src/app/api/payments/stripe/create/route.ts"
    "src/app/api/payments/paypal/create/route.ts"
    "src/app/api/admin/analytics/route.ts"
)

for file in "${PROBLEMATIC_FILES[@]}"; do
    if [ -f "$file" ]; then
        lines=$(wc -l < "$file")
        echo -e "  ${YELLOW}⚠${NC} $file ($lines líneas) - Excluido del análisis"
    fi
done
echo ""

# Verificar sonar-project.properties
echo "Verificando configuración..."
if [ ! -f "sonar-project.properties" ]; then
    echo -e "${RED}Error: sonar-project.properties no encontrado${NC}"
    exit 1
fi

# Verificar que las exclusiones están configuradas
if grep -q "sonar.typescript.typeCheck=false" sonar-project.properties; then
    echo -e "  ${GREEN}✓${NC} Type checking desactivado (previene hang)"
else
    echo -e "  ${YELLOW}⚠${NC} Type checking no está desactivado"
fi

if grep -q "sonar.typescript.node.modules.skip=true" sonar-project.properties; then
    echo -e "  ${GREEN}✓${NC} Node modules skip activado"
else
    echo -e "  ${YELLOW}⚠${NC} Node modules skip no está configurado"
fi

echo ""

# Ejecutar análisis con timeout
echo "Iniciando análisis de SonarQube..."
echo "  (Este proceso puede tomar varios minutos)"
echo ""

# Usar timeout para evitar que se atasque indefinidamente
# 600 segundos = 10 minutos
if command -v sonar-scanner &> /dev/null; then
    timeout 600 sonar-scanner \
        -Dsonar.login="$SONAR_TOKEN" \
        -Dsonar.typescript.typeCheck=false \
        -Dsonar.typescript.node.modules.skip=true \
        -Dsonar.verbose=false \
        || EXIT_CODE=$?
else
    echo -e "${RED}Error: sonar-scanner no está instalado${NC}"
    echo "Instálalo con:"
    echo "  npm install -g sonar-scanner"
    echo ""
    echo "O descarga desde: https://docs.sonarqube.org/latest/analysis/scan/sonarscanner/"
    exit 1
fi

# Verificar resultado
if [ -n "$EXIT_CODE" ]; then
    if [ "$EXIT_CODE" -eq 124 ]; then
        echo -e "${RED}Error: El análisis excedió el tiempo máximo (10 minutos)${NC}"
        echo "Verifica sonar-project.properties y considera excluir más archivos."
        exit 1
    elif [ "$EXIT_CODE" -ne 0 ]; then
        echo -e "${RED}Error: El análisis falló con código $EXIT_CODE${NC}"
        exit 1
    fi
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✓ Análisis completado exitosamente${NC}"
echo "=========================================="
echo ""
echo "Próximos pasos:"
echo "  1. Revisa los resultados en tu instancia de SonarQube"
echo "  2. Si persiste el problema, verifica los logs con:"
echo "     tail -f ~/.sonar/logs/*.log"
echo ""
