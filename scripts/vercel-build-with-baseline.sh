#!/bin/bash
# Build script for Vercel with automatic baseline handling

set -e

echo "🔧 Vercel Build con Auto-Baseline"
echo "=================================="
echo ""

# Export DIRECT_URL si no está definido (para Prisma)
if [ -z "$DIRECT_URL" ] && [ -n "$DATABASE_URL" ]; then
  export DIRECT_URL="$DATABASE_URL"
  echo "✅ DIRECT_URL configurado desde DATABASE_URL"
fi

# Paso 1: Generar Prisma Client
echo "📦 Paso 1: Generando Prisma Client..."
npx prisma generate

# Paso 2: Intentar migraciones (con manejo de baseline automático)
echo ""
echo "🗄️  Paso 2: Verificando migraciones..."

# Capturar output y código de salida del migrate deploy
set +e
OUTPUT=$(npx prisma migrate deploy 2>&1)
EXIT_CODE=$?
set -e

if [ $EXIT_CODE -ne 0 ]; then
  # Verificar si es error P3005
  if echo "$OUTPUT" | grep -q "P3005"; then
    echo "⚠️  Detectada BD existente sin migraciones (P3005)"
    echo "🔄 Ejecutando baseline automático..."
    echo ""
    
    # Hacer baseline de la migración
    npx prisma migrate resolve --applied 20260416100000_init_complete
    echo "✅ Baseline completado"
  else
    # Si es otro error, mostrarlo y salir
    echo "❌ Error en migrate deploy:"
    echo "$OUTPUT"
    exit 1
  fi
else
  echo "✅ Migraciones aplicadas correctamente"
fi

# Paso 3: Build de Next.js
echo ""
echo "🏗️  Paso 3: Construyendo Next.js..."
npx next build

echo ""
echo "✅ BUILD COMPLETADO EXITOSAMENTE"
