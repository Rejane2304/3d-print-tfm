# 🚨 AUDITORÍA CRÍTICA - TESTS BORRANDO DATOS DE LA BD DE DESARROLLO

**Fecha de Auditoría**: 2 de Abril de 2026  
**Severidad**: 🔴 **CRÍTICA** - Riesgo de pérdida de datos en producción/desarrollo  
**Estado**: ⚠️ **PROBLEMA IDENTIFICADO Y DOCUMENTADO**

---

## 📋 RESUMEN EJECUTIVO

Se ha identificado un **PROBLEMA CRÍTICO DE SEGURIDAD** donde los tests de integración están configurados para ejecutarse contra la **MISMA BASE DE DATOS DE DESARROLLO** (Supabase). Esto representa un riesgo extremo:

- 🔴 Los tests pueden borrar/truncar datos reales
- 🔴 Pérdida de datos de clientes, pedidos, productos
- 🔴 Potencial daño a operaciones comerciales
- 🔴 Violación de principios de testing (aislamiento)
- 🔴 No cumple con estándares de calidad

**RECOMENDACIÓN INMEDIATA**: No ejecutar `npm test` o `npm run test:integration` en producción/desarrollo sin antes implementar las soluciones propuestas.

---

## 🔍 ANÁLISIS DETALLADO DEL PROBLEMA

### 1. Configuración de Base de Datos

#### ❌ PROBLEMA IDENTIFICADO

**Archivo**: `.env.test`  
**Línea**: 10

```env
# PostgreSQL para tests (mismo servidor, base de datos separada)
# La base de datos de test se limpia antes de cada ejecución
DATABASE_URL=postgresql://postgres.ctwbppfkfsuxymfouptb:putWa3-jinpeg-vorjeh@aws-1-eu-central-1.pooler.supabase.com:5432/postgres

# Skip database operations in test mode for now
SKIP_DB_TESTS=true
```

**El problema**:
1. La `DATABASE_URL` en `.env.test` **APUNTA AL MISMO SERVIDOR DE SUPABASE**
2. El comentario dice "base de datos separada" pero **NO ES VERDAD** - apunta a la BD `postgres` principal
3. El único salvaguarda es `SKIP_DB_TESTS=true` que **DESACTIVA LOS TESTS**
4. Si alguien cambia esta variable a `false`, los tests ejecutarían contra datos reales

#### Comparación de configuraciones:

```
.env (DESARROLLO):
DATABASE_URL=postgresql://postgres.ctwbppfkfsuxymfouptb:putWa3-jinpeg-vorjeh@aws-1-eu-central-1.pooler.supabase.com:5432/postgres

.env.test (TESTS):
DATABASE_URL=postgresql://postgres.ctwbppfkfsuxymfouptb:putWa3-jinpeg-vorjeh@aws-1-eu-central-1.pooler.supabase.com:5432/postgres

❌ SON EXACTAMENTE IGUALES - MISMO SERVIDOR, MISMA BD
```

---

### 2. Setup de Tests - Operaciones Destructivas

**Archivo**: `tests/setup.ts`  
**Líneas**: 47-77

```typescript
/**
 * Limpia la base de datos de test
 * Orden específico para respetar foreign keys
 */
async function limpiarBaseDeDatos() {
  const tablas = [
    'logs_auditoria',
    'tokens_verificacion',
    'sesiones',
    'mensajes_pedido',
    'alertas',
    'movimientos_inventario',
    'pagos',
    'items_pedido',
    'items_carrito',
    'carritos',
    'pedidos',
    'facturas',
    'imagenes_producto',
    'productos',
    'direcciones',
    'usuarios',
    'configuracion_envios',
    'configuracion',
  ];

  for (const tabla of tablas) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tabla}" CASCADE`);
    } catch (error) {
      // Ignorar errores si la tabla no existe o está vacía
    }
  }
}
```

**El problema**:
- `TRUNCATE TABLE ... CASCADE` **BORRA TODOS LOS DATOS** de una tabla
- Si se ejecuta contra la BD de desarrollo, **ELIMINA TODOS LOS CLIENTES, PEDIDOS, PRODUCTOS**
- Se ejecuta en `beforeAll()` y `afterAll()` 
- Los cambios son **PERMANENTES** en la BD real

---

### 3. Flujo de Ejecución de Tests

**Comando**: `npm run test:integration`  
**Script**: `VITEST_ENV=integration vitest --run tests/integration`

```
1. Se carga .env.test
2. DATABASE_URL apunta a Supabase (MISMA BD de desarrollo)
3. setup.ts:beforeAll() se ejecuta
4. Intenta truncar tablas de usuarios, pedidos, productos, etc.
5. Si SKIP_DB_TESTS=false, ¡SE BORRAN TODOS LOS DATOS!
6. Tests se ejecutan contra datos empty
7. setup.ts:afterAll() limpia de nuevo
8. TODOS LOS DATOS DESAPARECEN DE LA BD REAL
```

---

## 🚨 RIESGOS IDENTIFICADOS

### Riesgo 1: Pérdida Accidental de Datos
**Probabilidad**: 🔴 ALTA  
**Impacto**: 🔴 CRÍTICO

Si `SKIP_DB_TESTS` se cambia a `false` accidentalmente o por error:
- Se pierden todos los clientes
- Se pierden todos los pedidos
- Se pierden todos los productos
- Se pierden datos de pagos

### Riesgo 2: Ciencia de Datos Contaminados
**Probabilidad**: 🟠 MEDIA  
**Impacto**: 🟠 ALTO

Los datos de desarrollo se usan para análisis, reportes, decisiones de negocio.
Con TRUNCATE, se pierden historiales completos.

### Riesgo 3: Testing Deficiente
**Probabilidad**: 🔴 ALTA  
**Impacto**: 🟠 ALTO

El único salvaguarda es `SKIP_DB_TESTS=true` que **DESACTIVA LOS TESTS**.
Los tests de integración NO se ejecutan realmente, lo que significa:
- No hay validación real de APIs
- No hay validación de BD
- Falsa sensación de seguridad

### Riesgo 4: Falta de Aislamiento
**Probabilidad**: 🔴 ALTA  
**Impacto**: 🟠 ALTO

Tests que se interfieren entre sí:
- Test A crea usuario
- Test B trunca toda la BD
- Test A falla inesperadamente
- Imposible debuggear

---

## 💡 SOLUCIONES RECOMENDADAS

### SOLUCIÓN 1: Database Separada para Tests (RECOMENDADO)

**Objetivo**: Usar una BD completamente separada para testing  
**Complejidad**: ⭐⭐⭐ Media  
**Impacto**: 🟢 Máximo

#### Paso 1: Crear una BD de Test en Supabase

```sql
-- En Supabase, crear nueva base de datos:
CREATE DATABASE 3dprint_tfm_test;
```

#### Paso 2: Actualizar `.env.test`

```env
# ============================================
# 3D PRINT TFM - TESTING
# ============================================

NODE_ENV="test"
NEXTAUTH_URL="http://localhost:3000"

# ✅ BASE DE DATOS SEPARADA PARA TESTS
# Esta BD es EXCLUSIVA para tests y puede ser truncada sin problemas
DATABASE_URL=postgresql://postgres.ctwbppfkfsuxymfouptb:putWa3-jinpeg-vorjeh@aws-1-eu-central-1.pooler.supabase.com:5432/3dprint_tfm_test

# ✅ HABILITAR TESTS DE BD
SKIP_DB_TESTS=false

# ✅ VARIABLE PARA IDENTIFICAR TESTS
VITEST=true
NODE_ENV=test
```

#### Paso 3: Configurar Migración Automática

**Archivo**: `tests/setup.ts`

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function setupTestDatabase() {
  try {
    console.log('🔄 Ejecutando migraciones en BD de test...');
    
    // Ejecutar migraciones de Prisma
    await execAsync('npx prisma migrate deploy', {
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL, // Usa DB de test
      },
    });
    
    console.log('✅ Migraciones completadas');
    
    // Seed de datos iniciales
    await seedDatosIniciales();
    
    console.log('✅ BD de test lista para tests');
  } catch (error) {
    console.error('❌ Error en setup de BD:', error);
    throw error;
  }
}

// En beforeAll:
beforeAll(async () => {
  if (process.env.VITEST_ENV === 'integration') {
    await setupTestDatabase();
  }
});
```

#### Paso 4: Scripts de Utilidad

**Archivo**: `scripts/test-db-setup.sh`

```bash
#!/bin/bash

# Setup de base de datos para tests
echo "🔄 Preparando base de datos de tests..."

# 1. Cargar variables de entorno
export $(cat .env.test | xargs)

# 2. Ejecutar migraciones
echo "📦 Ejecutando migraciones..."
npx prisma migrate deploy

# 3. Verificar conexión
echo "✅ Base de datos lista para tests"
```

**Actualizar `package.json`**:

```json
{
  "scripts": {
    "test:setup": "bash scripts/test-db-setup.sh",
    "test:integration": "npm run test:setup && VITEST_ENV=integration vitest --run tests/integration",
    "test:integration:watch": "npm run test:setup && VITEST_ENV=integration vitest tests/integration"
  }
}
```

---

### SOLUCIÓN 2: SQLite para Tests Locales (ALTERNATIVA)

**Objetivo**: Usar SQLite en lugar de PostgreSQL para testing  
**Complejidad**: ⭐⭐⭐⭐ Media-Alta  
**Ventaja**: Más rápido, no requiere servidor  

#### Configuración:

```env
# .env.test
DATABASE_URL=file:./test.db
NODE_ENV=test
SKIP_DB_TESTS=false
```

**Ventajas**:
- ✅ BD local, sin conexión a servidor
- ✅ Muy rápido
- ✅ Imposible afectar datos reales

**Desventajas**:
- ❌ Comportamiento diferente a PostgreSQL
- ❌ SQL específico de Postgres puede no funcionar

---

### SOLUCIÓN 3: Docker Container para Tests

**Objetivo**: Base de datos PostgreSQL en container Docker  
**Complejidad**: ⭐⭐⭐⭐⭐ Alta  
**Ventaja**: Ambiente idéntico a producción  

#### Archivo: `docker-compose.test.yml`

```yaml
version: '3.8'

services:
  postgres-test:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: 3dprint_tfm_test
      POSTGRES_PASSWORD: testpassword123
      POSTGRES_USER: testuser
    ports:
      - "5433:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U testuser"]
      interval: 10s
      timeout: 5s
      retries: 5
```

**Script**: `scripts/test-db-docker.sh`

```bash
#!/bin/bash

echo "🐳 Iniciando PostgreSQL en Docker para tests..."

# Iniciar container
docker-compose -f docker-compose.test.yml up -d

# Esperar a que esté listo
sleep 5

# Ejecutar migraciones
DATABASE_URL=postgresql://testuser:testpassword123@localhost:5433/3dprint_tfm_test \
  npx prisma migrate deploy

echo "✅ BD de test en Docker lista"
```

---

## ✅ VERIFICACIÓN DE SOLUCIÓN

### Checklist de Seguridad

Después de implementar la solución, verificar:

- [ ] `.env.test` tiene URL diferente de `.env.development`
- [ ] `SKIP_DB_TESTS=false` está habilitado
- [ ] BD de test está completamente separada
- [ ] Migraciones se ejecutan antes de cada test
- [ ] Datos de desarrollo nunca se borran
- [ ] Tests pueden ejecutarse sin pedir confirmación
- [ ] CI/CD puede ejecutar tests automáticamente

### Test de Validación

**Archivo**: `tests/validate-db-isolation.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { prisma } from '@/lib/db/prisma';

describe('🔒 Validación de Aislamiento de BD', () => {
  it('debe conectarse a BD de test, no de desarrollo', async () => {
    const url = process.env.DATABASE_URL || '';
    
    // Verificar que NO contiene "postgres" principal
    expect(url).not.toContain(':5432/postgres');
    
    // Verificar que contiene database de test
    expect(url).toMatch(/test|testing|3dprint_tfm_test/i);
  });

  it('debe tener BD vacía (sin usuarios de producción)', async () => {
    const usuarios = await prisma.usuario.findMany();
    
    // En BD de test separada, no hay usuarios de producción
    const usuariosReal = usuarios.filter(u => 
      !u.email.includes('test-') && 
      !u.email.includes('@example.com')
    );
    
    expect(usuariosReal.length).toBe(0);
  });

  it('puede truncar sin afectar datos reales', async () => {
    // Este test solo debe correr en BD separada
    if (!process.env.DATABASE_URL?.includes('test')) {
      throw new Error('❌ SEGURIDAD: Intentando ejecutar en BD de producción!');
    }
    
    // OK - estamos en BD separada
    expect(true).toBe(true);
  });
});
```

---

## 📊 COMPARATIVA DE SOLUCIONES

| Aspecto | Sol. 1: BD Separada | Sol. 2: SQLite | Sol. 3: Docker |
|--------|-------------------|----------------|----------------|
| Seguridad | 🟢 Máxima | 🟢 Máxima | 🟢 Máxima |
| Realismo | 🟢 Idéntico | 🟠 Diferente | 🟢 Idéntico |
| Velocidad | 🟠 Requiere conexión | 🟢 Muy rápido | 🟠 Moderado |
| Complejidad | 🟢 Media | 🟢 Media | 🔴 Alta |
| Setup Manual | 🟠 Requiere en Supabase | 🟢 Automático | 🟢 Automático |
| CI/CD Friendly | 🟠 Requiere config | 🟢 Muy fácil | 🟢 Fácil |
| Costo | 💰 Gratis (Supabase) | 💰 Gratis | 💰 Gratis |

**RECOMENDACIÓN**: **Solución 1 (BD Separada)** - Mejor equilibrio de seguridad, realismo y facilidad.

---

## 🛠️ PASOS DE IMPLEMENTACIÓN

### Fase 1: Preparación Inmediata (CRÍTICO)

1. **Asegurar que `SKIP_DB_TESTS=true` está activo**
   ```bash
   grep "SKIP_DB_TESTS" .env.test
   # Debe mostrar: SKIP_DB_TESTS=true
   ```

2. **Documentar en README**
   ```markdown
   ⚠️ IMPORTANTE: No ejecutar `npm test` en producción sin preparar BD de test separada
   ```

3. **Crear branch protegida en GitHub**
   - No permitir cambios a `.env.test` sin revisión

### Fase 2: Implementación (1-2 días)

1. Crear BD separada en Supabase
2. Actualizar `.env.test`
3. Configurar migraciones automáticas
4. Actualizar scripts en `package.json`
5. Crear test de validación

### Fase 3: Validación (1 día)

1. Ejecutar `npm test` y verificar que no afecta datos reales
2. Verificar que BD de test se limpia correctamente
3. Agregar tests a CI/CD
4. Documentar en team wiki

### Fase 4: Hardening (Continuo)

1. Agregar validaciones en setup.ts
2. Agregar tests de aislamiento de BD
3. Monitorear logs de BD para truncates
4. Auditoría trimestral

---

## 📝 ESTADO ACTUAL

| Ítem | Estado | Riesgo |
|------|--------|--------|
| BD Separada para Tests | ❌ NO EXISTE | 🔴 CRÍTICO |
| Aislamiento de Datos | ❌ NO EXISTE | 🔴 CRÍTICO |
| SKIP_DB_TESTS habilitado | ✅ SÍ | 🟠 MEDIO |
| Tests de Validación | ❌ NO EXISTE | 🟠 ALTO |
| Documentación | ❌ NO EXISTE | 🟠 ALTO |

---

## 📞 CONTACTO Y REFERENCIAS

- **Severidad**: 🔴 CRÍTICA
- **Período**: Implementar antes de producción
- **Requiere**: DBA + Backend Developer
- **Tiempo Estimado**: 2-3 días
- **ROI**: 100% - Previene pérdida de datos críticos

---

## 📎 ANEXOS

### A. Comandos de Prueba

```bash
# Verificar BD actual
echo $DATABASE_URL

# Verificar conexión
npx prisma db execute --stdin < test-query.sql

# Contar registros (antes de test)
psql $DATABASE_URL -c "SELECT COUNT(*) FROM usuarios;"

# Ejecutar solo si BD está separada
npm run test:integration
```

### B. Variables de Entorno Seguras

```env
# ❌ INSEGURO
DATABASE_URL=postgresql://...@.../postgres

# ✅ SEGURO
DATABASE_URL=postgresql://...@.../3dprint_tfm_test

# ✅ SEGURO (local)
DATABASE_URL=file:./test.db
```

### C. Referencia: Prisma Documentation

- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing/unit-testing)
- [Database Setup for Tests](https://www.prisma.io/docs/guides/testing/integration-testing)
- [Test Isolation](https://www.prisma.io/docs/guides/testing/isolation)

---

**Documento Preparado**: OpenCode AI  
**Versión**: 1.0  
**Última Actualización**: 2 de Abril de 2026
