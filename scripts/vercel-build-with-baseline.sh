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

# Paso 3: Intentar migraciones (con manejo de baseline automático y reintentos)
echo ""
echo "🗄️  Paso 3: Aplicando migraciones..."

# Función para ejecutar migrate deploy con reintentos
run_migrate_with_retry() {
  local max_attempts=5
  local attempt=1
  local delay=5
  
  while [ $attempt -le $max_attempts ]; do
    echo "🔄 Intento $attempt de $max_attempts..."
    
    set +e
    OUTPUT=$(npx prisma migrate deploy 2>&1)
    EXIT_CODE=$?
    set -e
    
    if [ $EXIT_CODE -eq 0 ]; then
      echo "✅ Migraciones aplicadas correctamente"
      return 0
    fi
    
    # Verificar si es error P3005 (baseline needed)
    if echo "$OUTPUT" | grep -q "P3005"; then
      echo "⚠️  Detectada BD existente sin migraciones (P3005)"
      echo "🔄 Ejecutando baseline automático..."
      
      set +e
      npx prisma migrate resolve --applied 20260416100000_init_complete
      RESOLVE_EXIT=$?
      set -e
      
      if [ $RESOLVE_EXIT -eq 0 ]; then
        echo "✅ Baseline completado"
        return 0
      fi
    fi
    
    # Verificar si es error de conexión (MaxClientsInSessionMode)
    if echo "$OUTPUT" | grep -q "MaxClientsInSessionMode"; then
      echo "⚠️  Pool de conexiones lleno, esperando ${delay}s..."
      sleep $delay
      # Aumentar delay para siguiente intento
      delay=$((delay + 5))
      attempt=$((attempt + 1))
      continue
    fi
    
    # Otro error, mostrar y continuar
    echo "❌ Error en migrate deploy:"
    echo "$OUTPUT"
    
    # Si no es error de conexión, no reintentar
    if ! echo "$OUTPUT" | grep -q "Connection\|pool\|timeout\|ECONNREFUSED"; then
      return 1
    fi
    
    sleep $delay
    attempt=$((attempt + 1))
  done
  
  echo "❌ Se agotaron los intentos de migración"
  return 1
}

if ! run_migrate_with_retry; then
  exit 1
fi

# Paso 4: Build de Next.js
echo ""
echo "🏗️  Paso 4: Construyendo Next.js..."
npx next build

echo ""
echo "✅ BUILD COMPLETADO EXITOSAMENTE"
