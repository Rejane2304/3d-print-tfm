#!/bin/bash
# Script de limpieza completa

echo "=========================================="
echo "LIMPIEZA COMPLETA DEL PROYECTO"
echo "=========================================="

# Detener procesos
echo "1. Deteniendo procesos..."
pkill -f "next" 2>/dev/null || true

# Limpiar caché
echo "2. Limpiando cachés..."
rm -rf .next/
rm -rf node_modules/.cache
rm -rf ~/Library/Caches/next-js* 2>/dev/null || true

# Regenerar Prisma
echo "3. Regenerando Prisma Client..."
npx prisma@5.22.0 generate

echo ""
echo "=========================================="
echo "✅ LIMPIEZA COMPLETADA"
echo "=========================================="
echo "Ejecuta: npm run dev"
