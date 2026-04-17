#!/bin/bash
# =============================================================================
# Script de desarrollo con apertura automática de navegador
# Reemplaza: npm run dev
# =============================================================================

echo "Iniciando servidor de desarrollo..."
echo ""

# Iniciar Next.js en background
npm run dev &
DEV_PID=$!

# Esperar a que el servidor esté listo
sleep 5

# Abrir navegador automáticamente
echo "Abriendo navegador..."
open http://localhost:3000

echo ""
echo "✅ Servidor corriendo en: http://localhost:3000"
echo "✅ Navegador abierto"
echo ""
echo "Para detener el servidor, presiona Ctrl+C"
echo ""

# Esperar a que el proceso termine
wait $DEV_PID
