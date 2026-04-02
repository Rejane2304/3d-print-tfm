#!/bin/bash

# ============================================
# SCRIPT MASTER - SETUP COMPLETO DE TESTS
# ============================================
# 
# Este script automatiza todo el setup de tests:
# 1. Inicia PostgreSQL en Docker
# 2. Espera a que esté listo
# 3. Ejecuta migraciones
# 4. Hace seed de datos iniciales
# 5. Ejecuta tests
# 6. Limpia (opcional)

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones de log
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# ============================================
# MAIN
# ============================================

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  🧪 SETUP AUTOMÁTICO DE TESTS CON DOCKER              ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Verificar Docker
log_info "Verificando Docker..."
if ! command -v docker &> /dev/null; then
    log_error "Docker no está instalado. Instálalo en https://docker.com"
    exit 1
fi
log_success "Docker instalado"

# Step 2: Verificar Docker Compose
log_info "Verificando Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose no está instalado"
    exit 1
fi
log_success "Docker Compose instalado"

# Step 3: Detener containers previos (si existen)
log_info "Limpiando containers previos..."
docker-compose -f docker-compose.test.yml down -v 2>/dev/null || true
log_success "Limpieza completada"

# Step 4: Iniciar PostgreSQL
log_info "Iniciando PostgreSQL en Docker..."
docker-compose -f docker-compose.test.yml up -d
log_success "Container iniciado"

# Step 5: Esperar a que PostgreSQL esté listo
log_info "Esperando a que PostgreSQL esté disponible..."
npm run test:docker:wait
log_success "PostgreSQL está listo"

# Step 6: Ejecutar migraciones
log_info "Ejecutando migraciones Prisma..."
npm run test:db:migrate
log_success "Migraciones completadas"

# Step 7: Seed de datos iniciales
log_info "Insertando datos de test..."
npm run test:db:seed
log_success "Datos iniciales insertados"

# Step 8: Listar información de BD
echo ""
log_info "Información de la BD de tests:"
echo "   Servidor: localhost"
echo "   Puerto: 5433"
echo "   Usuario: testuser"
echo "   Base de datos: 3dprint_tfm_test"
echo "   Password: testpassword123"
echo ""

# Step 9: Oferta de ejecutar tests
echo "╔════════════════════════════════════════════════════════╗"
echo "║  ✅ Setup completado con éxito                         ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

log_success "BD de tests lista para usar"
echo ""
echo "Próximos comandos:"
echo "  • Ejecutar tests: npm run test:integration"
echo "  • Tests en modo watch: npm run test:integration:watch"
echo "  • Ver todos los tests: npm run test:all"
echo "  • Detener Docker: npm run test:docker:down"
echo ""

# Preguntar si ejecutar tests
read -p "¿Deseas ejecutar los tests ahora? (s/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    log_info "Ejecutando tests..."
    npm run test:integration
    log_success "Tests completados"
fi

echo ""
log_success "¡Setup completado!"
echo ""
