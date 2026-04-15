#!/bin/bash
# Database Environment Safety Check
# Usage: source scripts/check-db-env.sh

echo "🔒 Verificando entorno de base de datos..."

# Detectar entorno
if [[ "$DATABASE_URL" == *"eu-central-1"* ]] || [[ "$DATABASE_URL" == *"ctwbppfkfsuxymfouptb"* ]]; then
    echo "❌ DETECTADO: PRODUCCIÓN"
    echo "Host: aws-1-eu-central-1.pooler.supabase.com"
    echo ""
    echo "⚠️  OPERACIÓN BLOQUEADA por seguridad"
    echo "No se permiten operaciones destructivas en producción."
    echo ""
    echo "Para desarrollo, use:"
    echo "  export DATABASE_URL=postgresql://postgres.hkjknnymctorucyhtypm..."
    echo ""
    return 1
fi

if [[ "$DATABASE_URL" == *"eu-west-1"* ]] || [[ "$DATABASE_URL" == *"hkjknnymctorucyhtypm"* ]]; then
    echo "✅ DESARROLLO detectado"
    echo "Host: aws-1-eu-west-1.pooler.supabase.com"
    return 0
fi

if [[ "$DATABASE_URL" == *"localhost:5433"* ]]; then
    echo "✅ TEST detectado"
    echo "Host: localhost:5433"
    return 0
fi

echo "⚠️  Entorno desconocido"
echo "DATABASE_URL: ${DATABASE_URL//:*@/:****@}"
return 1
