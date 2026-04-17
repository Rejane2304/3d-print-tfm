#!/bin/bash
#
# Sistema Infalible de Detección de Errores v4.0
# Pre-commit hook robusto y completo
#
# Características:
# - Detección temprana de errores críticos
# - Reporte detallado con sugerencias de corrección
# - Sistema de prevención de deuda técnica
# - Integración con Prisma, TypeScript, ESLint, Tests
#

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Contadores
ERRORS=0
WARNINGS=0
FIXABLE=0

# Archivos modificados (staged)
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx|json|md|css|scss)$' || true)

# Funciones de utilidad
print_header() {
    echo ""
    echo -e "${MAGENTA}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${MAGENTA}${BOLD}  SISTEMA INFALIBLE DE DETECCIÓN DE ERRORES v4.0${NC}"
    echo -e "${MAGENTA}${BOLD}  Pre-commit Quality Gate${NC}"
    echo -e "${MAGENTA}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_section() {
    echo ""
    echo -e "${CYAN}${BOLD}$1${NC}"
    echo -e "${BLUE}─────────────────────────────────────────────────────────────${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    ERRORS=$((ERRORS + 1))
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    WARNINGS=$((WARNINGS + 1))
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_suggestion() {
    echo -e "${CYAN}💡 $1${NC}"
}

# ============================================
# CHECK 1: Prisma Schema Validation
# ============================================
check_prisma() {
    print_section "1️⃣  VALIDACIÓN DE PRISMA SCHEMA"
    
    if ! command -v npx &> /dev/null; then
        print_warning "npx no disponible, saltando validación de Prisma"
        return 0
    fi
    
    # Verificar que el schema sea válido
    if npx prisma validate > /tmp/prisma-validation.log 2>&1; then
        print_success "Schema de Prisma válido"
        return 0
    else
        print_error "Schema de Prisma tiene errores"
        print_info "Detalles:"
        grep -E "error:|Error:" /tmp/prisma-validation.log | head -5 | while read line; do
            echo "   $line"
        done
        print_suggestion "Ejecuta: npx prisma validate"
        return 1
    fi
}

# ============================================
# CHECK 2: Prisma Client Generation
# ============================================
check_prisma_client() {
    print_section "2️⃣  GENERACIÓN DE PRISMA CLIENT"
    
    # Verificar si hay cambios en el schema
    if git diff --cached --name-only | grep -q "prisma/schema.prisma"; then
        print_info "Detectados cambios en schema.prisma"
        
        if npx prisma generate > /tmp/prisma-generate.log 2>&1; then
            print_success "Prisma Client generado correctamente"
            
            # Verificar que los campos bilingües existan
            if grep -q "nameEs" node_modules/.prisma/client/index.d.ts 2>/dev/null; then
                print_success "Campos bilingües (nameEs, nameEn) detectados en Prisma Client"
            else
                print_error "Campos bilingües NO encontrados en Prisma Client"
                print_suggestion "El schema.prisma debe tener los campos nameEs, nameEn, etc."
                return 1
            fi
        else
            print_error "Falló la generación del Prisma Client"
            print_info "Detalles:"
            tail -10 /tmp/prisma-generate.log | while read line; do
                echo "   $line"
            done
            return 1
        fi
    else
        print_info "No hay cambios en schema.prisma, verificando cliente existente..."
        
        # Verificar que el cliente actual tenga los campos bilingües
        if [ -f "node_modules/.prisma/client/index.d.ts" ]; then
            if grep -q "nameEs" node_modules/.prisma/client/index.d.ts; then
                print_success "Prisma Client existente tiene campos bilingües"
            else
                print_warning "Prisma Client existente NO tiene campos bilingües"
                print_suggestion "Considera regenerar: npx prisma generate"
            fi
        fi
    fi
    
    return 0
}

# ============================================
# CHECK 3: TypeScript Compilation
# ============================================
check_typescript() {
    print_section "3️⃣  COMPILACIÓN TYPESCRIPT"
    
    print_info "Verificando errores de TypeScript..."
    
    # Ejecutar tsc y capturar errores
    if npx tsc --noEmit 2>&1 | tee /tmp/tsc-errors.log | grep -q "error TS"; then
        local error_count=$(grep -c "error TS" /tmp/tsc-errors.log)
        print_error "Se encontraron $error_count errores de TypeScript"
        
        print_info "Errores principales:"
        grep "error TS" /tmp/tsc-errors.log | head -10 | while read line; do
            # Extraer información del error
            if [[ $line =~ ^(.+)\(([0-9]+),([0-9]+)\):\ error\ (TS[0-9]+):\ (.+)$ ]]; then
                local file="${BASH_REMATCH[1]}"
                local line_num="${BASH_REMATCH[2]}"
                local col="${BASH_REMATCH[3]}"
                local code="${BASH_REMATCH[4]}"
                local msg="${BASH_REMATCH[5]}"
                
                echo -e "   ${YELLOW}$file:${NC}[$line_num:$col] ${RED}$code${NC}: $msg"
                
                # Sugerencias específicas
                case "$code" in
                    "TS2551")
                        print_suggestion "   El campo no existe en el tipo. Verifica Prisma Client: npx prisma generate"
                        ;;
                    "TS2345")
                        print_suggestion "   Los tipos no coinciden. Revisa la asignación de tipos"
                        ;;
                    "TS2322")
                        print_suggestion "   Tipos incompatibles. Usa 'as' con cuidado o corrige el tipo"
                        ;;
                    "TS7006")
                        print_suggestion "   Añade anotaciones de tipo explícitas"
                        ;;
                esac
            else
                echo "   $line"
            fi
        done
        
        if [ "$error_count" -gt 10 ]; then
            print_info "... y $((error_count - 10)) errores más"
        fi
        
        return 1
    else
        print_success "TypeScript compilación exitosa - Sin errores"
        return 0
    fi
}

# ============================================
# CHECK 4: ESLint
# ============================================
check_eslint() {
    print_section "4️⃣  ESLINT"
    
    # Verificar solo archivos staged para ser más rápido
    if [ -n "$STAGED_FILES" ]; then
        print_info "Verificando archivos modificados..."
        
        local files_to_check=""
        for file in $STAGED_FILES; do
            if [[ $file =~ \.(ts|tsx|js|jsx)$ ]]; then
                files_to_check="$files_to_check $file"
            fi
        done
        
        if [ -n "$files_to_check" ]; then
            if npx eslint $files_to_check --ext .ts,.tsx 2>&1 | tee /tmp/eslint.log | grep -q "error"; then
                local error_count=$(grep -c "error" /tmp/eslint.log)
                print_error "ESLint encontró $error_count errores"
                print_info "Ejecuta: npx eslint --fix $files_to_check"
                FIXABLE=$((FIXABLE + error_count))
                return 1
            else
                print_success "ESLint pasó sin errores"
            fi
        else
            print_info "No hay archivos TypeScript/JavaScript modificados"
        fi
    else
        print_info "No hay archivos staged para verificar"
    fi
    
    return 0
}

# ============================================
# CHECK 5: Tests Unitarios
# ============================================
check_tests() {
    print_section "5️⃣  TESTS UNITARIOS"
    
    print_info "Ejecutando tests unitarios..."
    
    if npm run test:unit -- --run 2>&1 | tee /tmp/test-output.log | tail -20 | grep -q "passed"; then
        # Extraer conteo de tests
        local test_line=$(grep -E "Test Files|Tests" /tmp/test-output.log | tail -2)
        print_success "Tests completados: $test_line"
        return 0
    else
        print_error "Algunos tests fallaron"
        print_info "Ejecuta: npm run test:unit"
        return 1
    fi
}

# ============================================
# CHECK 6: Archivos Importantes
# ============================================
check_critical_files() {
    print_section "6️⃣  VERIFICACIÓN DE ARCHIVOS CRÍTICOS"
    
    local has_errors=0
    
    # Verificar que package.json tenga todas las dependencias necesarias
    if ! grep -q "@testing-library/dom" package.json 2>/dev/null; then
        print_error "Falta @testing-library/dom en package.json"
        print_suggestion "Ejecuta: npm install --save-dev @testing-library/dom"
        has_errors=1
    fi
    
    # Verificar que .env.example esté actualizado
    if [ -f ".env.example" ]; then
        if ! grep -q "DATABASE_URL" .env.example; then
            print_warning ".env.example podría estar desactualizado"
        fi
    fi
    
    # Verificar que AGENTS.md esté presente
    if [ ! -f "AGENTS.md" ]; then
        print_warning "AGENTS.md no encontrado - importante para documentación"
    fi
    
    if [ $has_errors -eq 0 ]; then
        print_success "Archivos críticos verificados"
    fi
    
    return $has_errors
}

# ============================================
# REPORTE FINAL
# ============================================
print_report() {
    echo ""
    echo -e "${MAGENTA}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${MAGENTA}${BOLD}                    REPORTE FINAL${NC}"
    echo -e "${MAGENTA}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    
    if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}${BOLD}✅ TODOS LOS CHECKS PASARON${NC}"
        echo -e "${GREEN}El código está listo para commit${NC}"
        echo ""
        print_suggestion "Procede con: git commit"
        exit 0
    elif [ $ERRORS -eq 0 ] && [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}${BOLD}⚠️  ADVERTENCIAS DETECTADAS${NC}"
        echo -e "${YELLOW}$WARNINGS advertencias encontradas${NC}"
        echo ""
        print_suggestion "Considera corregir las advertencias antes de continuar"
        echo -e "${GREEN}Pero el commit está permitido${NC}"
        exit 0
    else
        echo -e "${RED}${BOLD}❌ ERRORES CRÍTICOS DETECTADOS${NC}"
        echo -e "${RED}$ERRORS errores, $WARNINGS advertencias${NC}"
        
        if [ $FIXABLE -gt 0 ]; then
            echo ""
            print_suggestion "$FIXABLE errores pueden corregirse automáticamente:"
            print_suggestion "  npx eslint --fix ."
            print_suggestion "  npx prettier --write ."
        fi
        
        echo ""
        echo -e "${RED}${BOLD}COMMIT BLOQUEADO${NC}"
        echo -e "${RED}Corrige los errores antes de continuar${NC}"
        echo ""
        exit 1
    fi
}

# ============================================
# EJECUCIÓN PRINCIPAL
# ============================================
main() {
    print_header
    
    # Ejecutar checks
    check_prisma || true
    check_prisma_client || true
    check_typescript || true
    check_eslint || true
    check_tests || true
    check_critical_files || true
    
    # Reporte final
    print_report
}

# Capturar señales para limpieza
trap 'echo -e "\n\n${RED}❌ Interrumpido por el usuario${NC}"; exit 130' INT TERM

# Ejecutar
main "$@"
