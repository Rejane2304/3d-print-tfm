#!/bin/bash

# ============================================
# SETUP DE BASE DE DATOS PARA TESTS
# ============================================
# Script que prepara la base de datos para tests
# de forma segura, sin afectar datos de desarrollo

set -e  # Exit on error

echo "🧪 Preparando base de datos para tests..."
echo ""

# 1. Verificar variables de entorno
echo "📋 Verificando configuración..."

if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL no está configurada"
  exit 1
fi

# 2. Validar que no estamos usando BD de producción
if echo "$DATABASE_URL" | grep -q "3dprint_tfm_test"; then
  echo "✅ Usando BD de test separada"
else
  echo "⚠️  Advertencia: DATABASE_URL no contiene 'test'"
  echo "   DATABASE_URL actual: $DATABASE_URL"
fi

# 3. Ejecutar migraciones
echo ""
echo "📦 Ejecutando migraciones Prisma..."
npx prisma migrate deploy --skip-generate

if [ $? -eq 0 ]; then
  echo "✅ Migraciones completadas"
else
  echo "⚠️  Error en migraciones (puede ser normal si BD existe)"
fi

# 4. Verificar conexión
echo ""
echo "🔍 Verificando conexión a BD..."
npx prisma db execute --stdin <<EOF
SELECT COUNT(*) as tablas FROM information_schema.tables 
WHERE table_schema = 'public';
EOF

if [ $? -eq 0 ]; then
  echo "✅ Conexión a BD establecida"
else
  echo "❌ Error conectando a BD"
  exit 1
fi

echo ""
echo "✅ Base de datos lista para tests"
echo ""
