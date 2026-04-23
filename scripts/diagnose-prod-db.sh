#!/bin/bash
# Diagnóstico de Base de Datos Producción
# Ejecutar: ./scripts/diagnose-prod-db.sh

echo "════════════════════════════════════════════════════════════"
echo "  DIAGNÓSTICO BD PRODUCCIÓN"
echo "════════════════════════════════════════════════════════════"
echo ""

# Verificar variables de entorno
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL no está configurada"
    echo "Por favor, exporta la variable antes de ejecutar:"
    echo "export DATABASE_URL=postgresql://..."
    exit 1
fi

echo "✅ DATABASE_URL configurada"
echo ""

# Probar conexión básica
echo "🔍 Probando conexión..."
psql "$DATABASE_URL" -c "SELECT version();" 2>&1 | head -5

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ ERROR DE CONEXIÓN"
    echo "Posibles causas:"
    echo "  1. Supabase en modo 'Paused' - Ve a https://app.supabase.com"
    echo "  2. Contraseña incorrecta"
    echo "  3. IP no autorizada"
    exit 1
fi

echo ""
echo "🔍 Verificando tablas críticas..."
echo ""

# Contar usuarios
USER_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT count(*) FROM users;" 2>/dev/null | xargs)
echo "  Usuarios: ${USER_COUNT:-0}"

# Contar productos
PRODUCT_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT count(*) FROM products;" 2>/dev/null | xargs)
echo "  Productos: ${PRODUCT_COUNT:-0}"

# Verificar site_configs
SITE_CONFIG=$(psql "$DATABASE_URL" -t -c "SELECT id FROM site_configs LIMIT 1;" 2>/dev/null | xargs)
if [ -n "$SITE_CONFIG" ]; then
    echo "  SiteConfig: ✅ Existe ($SITE_CONFIG)"
else
    echo "  SiteConfig: ❌ No existe"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  RESULTADO"
echo "════════════════════════════════════════════════════════════"

if [ -z "$USER_COUNT" ] || [ "$USER_COUNT" = "0" ]; then
    echo "⚠️  BD VACÍA - Necesitas ejecutar: npm run db:seed:prod"
else
    echo "✅ BD CON DATOS - Verificar aplicación"
fi

echo ""
