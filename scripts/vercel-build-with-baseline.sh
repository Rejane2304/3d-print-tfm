#!/bin/bash
# Build script for Vercel - Solo genera Prisma Client, NO hace migraciones
# Las migraciones deben ejecutarse manualmente: npx prisma migrate deploy

set -e

echo "🔧 Vercel Build (Sin Migraciones)"
echo "=================================="
echo ""

# Paso 1: Generar Prisma Client (solo esto, sin migraciones)
echo "📦 Generando Prisma Client..."
npx prisma generate

# Paso 2: Build de Next.js
echo ""
echo "🏗️  Construyendo Next.js..."
npx next build

echo ""
echo "✅ BUILD COMPLETADO EXITOSAMENTE"
echo ""
echo "⚠️  NOTA: Las migraciones de BD deben ejecutarse por separado:"
echo "   npx prisma migrate deploy"
