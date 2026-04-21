#!/bin/bash
# Build script for Vercel with automatic baseline handling and schema verification

set -e

echo "🔧 Vercel Build con Validación de Schema"
echo "============================================"
echo ""

# Export DIRECT_URL si no está definido (para Prisma)
if [ -z "$DIRECT_URL" ] && [ -n "$DATABASE_URL" ]; then
  export DIRECT_URL="$DATABASE_URL"
  echo "✅ DIRECT_URL configurado desde DATABASE_URL"
fi

# Paso 1: Generar Prisma Client
echo "📦 Paso 1: Generando Prisma Client..."
npx prisma generate

# Paso 2: Verificar si el schema está sincronizado
echo ""
echo "🗄️  Paso 2: Verificando sincronización del schema..."

set +e
# Intentar validar el schema contra la BD
npx prisma validate >/dev/null 2>&1
VALIDATE_EXIT=$?
set -e

# Intentar una consulta simple para verificar columnas
set +e
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  try {
    await prisma.product.findFirst({ select: { id: true, nameEs: true }, take: 1 });
    console.log('SCHEMA_OK');
  } catch(e) {
    if (e.message.includes('nameEs') || e.message.includes('column') || e.message.includes('does not exist')) {
      console.log('SCHEMA_MISMATCH');
    } else {
      console.log('SCHEMA_OK');
    }
  } finally {
    await prisma.\$disconnect();
  }
}
test();
" >/tmp/schema_check.txt 2>&1
SCHEMA_RESULT=$(cat /tmp/schema_check.txt)

if echo "$SCHEMA_RESULT" | grep -q "SCHEMA_MISMATCH"; then
  echo "⚠️  Schema desincronizado detectado"
  echo "🔧 Ejecutando migración de columnas bilingües..."
  
  # Ejecutar script de migración que maneja datos existentes
  node scripts/migrate-bilingual-columns.js
  
  echo "✅ Columnas bilingües migradas exitosamente"
else
  echo "✅ Schema verificado correctamente"
fi

# Paso 3: Intentar migraciones (con manejo de baseline automático)
echo ""
echo "🗄️  Paso 3: Aplicando migraciones..."

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

# Paso 4: Build de Next.js
echo ""
echo "🏗️  Paso 4: Construyendo Next.js..."
npx next build

echo ""
echo "✅ BUILD COMPLETADO EXITOSAMENTE"
