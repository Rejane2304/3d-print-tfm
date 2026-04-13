# Sistema de Subagentes Automatizados

## Descripción

Este sistema permite la delegación automática de tareas a subagentes especializados, mejorando la eficiencia y velocidad en la ejecución de tareas complejas.

## Tipos de Subagentes Disponibles

### 1. **explore** (Búsqueda y Exploración)

- **Cuándo usar**: Cuando necesitas encontrar archivos, explorar la estructura del código, buscar patrones específicos
- **Ejemplos**:
  - "Encuentra todos los componentes React"
  - "Busca dónde se usa la función X"
  - "Explora la estructura de la base de datos"

### 2. **general** (Propósito General)

- **Cuándo usar**: Para tareas complejas de investigación, análisis de código, o ejecutar múltiples pasos
- **Ejemplos**:
  - "Analiza el rendimiento de la aplicación"
  - "Refactoriza el módulo X siguiendo mejores prácticas"
  - "Genera documentación para la API"

### 3. **code-reviewer** (Revisión de Código)

- **Cuándo usar**: Después de escribir código significativo, para revisar calidad y encontrar bugs
- **Ejemplos**:
  - "Revisa esta función que acabo de escribir"
  - "Verifica si hay problemas de seguridad"
  - "Comprueba la cobertura de tests"

### 4. **test-runner** (Ejecución de Tests)

- **Cuándo usar**: Para ejecutar tests específicos o suites completas
- **Ejemplos**:
  - "Ejecuta todos los tests unitarios"
  - "Corre los tests de integración del módulo X"
  - "Verifica que nada se rompió"

### 5. **translator** (Traducción)

- **Cuándo usar**: Para tareas de traducción de código, documentación o contenido
- **Ejemplos**:
  - "Traduce todos los mensajes de error a español"
  - "Localiza la aplicación"
  - "Actualiza las traducciones"

## Cómo Funciona

El sistema analiza automáticamente cada solicitud y determina:

1. **Tipo de tarea**: Qué categoría de trabajo se necesita
2. **Subagente apropiado**: Cuál especialización es la mejor
3. **Paralelización posible**: Si se pueden dividir las tareas en subtareas independientes
4. **Dependencias**: Qué tareas deben esperar a otras

## Configuración

Las reglas de delegación están definidas en `.agent/config/delegation-rules.json`. Puedes personalizar:

- Patrones de búsqueda para cada tipo de tarea
- Número máximo de subagentes simultáneos
- Timeout por tipo de tarea
- Reglas de prioridad

## Uso Manual

Si quieres forzar el uso de un subagente específico, puedes usar el comando `/delegate`:

```
/delegate [tipo] [descripción de la tarea]
```

Ejemplos:

```
/delegate explore Buscar todos los archivos de configuración
/delegate general Refactorizar el módulo de autenticación
/delegate test-runner Ejecutar tests de integración
```

## Beneficios

1. **Eficiencia**: Las tareas se ejecutan en paralelo cuando es posible
2. **Especialización**: Cada subagente optimizado para su tipo de tarea
3. **Escalabilidad**: Puedes agregar más tipos de subagentes según necesites
4. **Transparencia**: Siempre sabes qué subagente está trabajando en qué

## Monitorización

Puedes ver el estado de los subagentes activos en cualquier momento ejecutando:

```bash
npx agent status
```

Esto mostrará:

- Subagentes activos
- Tareas en cola
- Resultados pendientes
- Errores si los hay
