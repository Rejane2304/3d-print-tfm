#!/bin/bash
# Demo del Sistema de Subagentes Automatizados
# Muestra cómo se delegan tareas a subagentes especializados

echo "=========================================="
echo "Sistema de Subagentes Automatizados"
echo "=========================================="
echo ""
echo "Tipos de subagentes disponibles:"
echo ""
echo "1. EXPLORE - Búsqueda y exploración de código"
echo "   Ejemplo: Buscar todos los archivos de configuración"
echo ""
echo "2. GENERAL - Propósito general para tareas complejas"
echo "   Ejemplo: Refactorizar el módulo de autenticación"
echo ""
echo "3. CODE-REVIEWER - Revisión de código y calidad"
echo "   Ejemplo: Revisar código después de cambios significativos"
echo ""
echo "4. TEST-RUNNER - Ejecución de tests"
echo "   Ejemplo: Ejecutar tests de integración"
echo ""
echo "5. TRANSLATOR - Traducción de contenido"
echo "   Ejemplo: Traducir mensajes de error al español"
echo ""
echo "=========================================="
echo "Cómo Usar:"
echo "=========================================="
echo ""
echo "Opción 1 - Delegación Automática:"
echo "   Simplemente describe tu tarea y el sistema"
echo "   detectará el tipo apropiado automáticamente."
echo ""
echo "Opción 2 - Delegación Manual:"
echo "   Usa el comando: /delegate [tipo] [tarea]"
echo ""
echo "   Ejemplos:"
echo "   /delegate explore Buscar todas las rutas API"
echo "   /delegate general Refactorizar componentes"
echo "   /delegate test-runner Ejecutar tests unitarios"
echo "   /delegate translator Traducir mensajes"
echo ""
echo "=========================================="
echo "Configuración:"
echo "=========================================="
echo ""
echo "Archivo de configuración:"
echo "   .agent/config/delegation-rules.json"
echo ""
echo "Documentación completa:"
echo "   .agent/SUBAGENTS.md"
echo ""
echo "=========================================="

# Verificar que los archivos existen
if [ -f ".agent/config/delegation-rules.json" ]; then
    echo "✅ Configuración de subagentes encontrada"
else
    echo "❌ Configuración no encontrada"
fi

if [ -f ".agent/SUBAGENTS.md" ]; then
    echo "✅ Documentación de subagentes encontrada"
else
    echo "❌ Documentación no encontrada"
fi

echo ""
echo "Para más información, revisa AGENTS.md"
echo "=========================================="
