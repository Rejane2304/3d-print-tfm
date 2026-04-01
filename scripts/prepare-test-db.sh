#!/bin/bash

# ============================================
# Script de preparación para tests con PostgreSQL
# ============================================

echo "🧪 Preparando entorno de tests con PostgreSQL..."

# Verificar que DATABASE_URL está configurado
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL no está configurado"
  echo "Por favor, configura la variable DATABASE_URL en .env.test"
  exit 1
fi

echo "✅ DATABASE_URL configurado"

# Verificar conexión a PostgreSQL
echo "🔌 Verificando conexión a PostgreSQL..."
npx prisma db execute --stdin <<EOF
SELECT 1;
EOF

if [ $? -ne 0 ]; then
  echo "❌ No se pudo conectar a PostgreSQL"
  exit 1
fi

echo "✅ Conexión a PostgreSQL exitosa"

# Ejecutar migraciones pendientes
echo "📦 Ejecutando migraciones..."
npx prisma migrate deploy

if [ $? -ne 0 ]; then
  echo "❌ Error al ejecutar migraciones"
  exit 1
fi

echo "✅ Migraciones completadas"

# Limpiar datos de test (opcional, los tests limpian por sí mismos)
echo "🧹 Preparando base de datos de test..."

echo ""
echo "✅ Entorno de tests listo"
echo ""
echo "Puedes ejecutar los tests con:"
echo "  npm run test:unit       - Tests unitarios"
echo "  npm run test:integration - Tests de integración"
echo "  npm test                - Todos los tests"
