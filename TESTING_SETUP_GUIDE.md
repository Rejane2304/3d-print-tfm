# 🚀 CONFIGURACIÓN RÁPIDA - TESTS SEGUROS

Este documento te guía para configurar tests de forma **SEGURA** sin riesgo de borrar datos de desarrollo.

---

## ⚠️ SITUACIÓN ACTUAL (CRÍTICA)

```
❌ DATABASE_URL en .env.test apunta a MISMA BD que desarrollo
❌ Tests pueden ejecutar TRUNCATE contra datos reales
❌ Un error puede borrar todos los clientes, pedidos, productos
✅ Protegido por SKIP_DB_TESTS=true (tests deshabilitados)
```

---

## 🔧 SOLUCIÓN: Elige UNA opción

### OPCIÓN 1: Docker Local (Recomendado para desarrollo)

**Ventajas**: ✅ Rápido, ✅ Local, ✅ Seguro  
**Desventajas**: Requiere Docker

#### Paso 1: Iniciar PostgreSQL en Docker

```bash
# Inicia container PostgreSQL para tests
docker-compose -f docker-compose.test.yml up -d

# Verificar que está listo (esperar ~5 segundos)
docker-compose -f docker-compose.test.yml logs postgres-test
```

#### Paso 2: Configurar .env.test

Ya está configurado por defecto con:
```env
DATABASE_URL=postgresql://testuser:testpassword123@localhost:5433/3dprint_tfm_test
SKIP_DB_TESTS=false
```

#### Paso 3: Ejecutar tests

```bash
# Tests de integración
npm run test:integration

# Tests con UI
npm run test:integration:watch
```

#### Limpiar después

```bash
# Detener container
docker-compose -f docker-compose.test.yml down

# Eliminar volumen de datos (reinicio limpio)
docker-compose -f docker-compose.test.yml down -v
```

---

### OPCIÓN 2: Base de Datos Separada en Supabase

**Ventajas**: ✅ Idéntica a producción, ✅ En la nube  
**Desventajas**: Requiere crear BD en Supabase, Requiere conexión

#### Paso 1: Crear BD en Supabase

1. Ir a https://supabase.com/dashboard
2. Seleccionar proyecto "3dprint-tfm"
3. SQL Editor → Crear query:

```sql
-- Crear BD nueva para tests
CREATE DATABASE 3dprint_tfm_test;
```

4. Ejecutar query

#### Paso 2: Obtener conexión

1. En Supabase, ir a Configuración → Base de datos
2. Connection string: Copiar URL de conexión
3. Reemplazar `/postgres` con `/3dprint_tfm_test`

```
postgresql://postgres.xxxxx:password@aws-1-eu-central-1.pooler.supabase.com:5432/3dprint_tfm_test
```

#### Paso 3: Configurar .env.test

```env
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-1-eu-central-1.pooler.supabase.com:5432/3dprint_tfm_test
SKIP_DB_TESTS=false
```

#### Paso 4: Ejecutar migraciones

```bash
# Ejecutar setup script
bash scripts/setup-test-db.sh

# O manualmente
npx prisma migrate deploy

# Ejecutar tests
npm run test:integration
```

---

### OPCIÓN 3: SQLite Local (Para desarrollo rápido)

**Ventajas**: ✅ Sin servidor, ✅ Muy rápido, ✅ Automático  
**Desventajas**: Comportamiento diferente a PostgreSQL

#### Paso 1: Configurar .env.test

```env
DATABASE_URL=file:./test.db
SKIP_DB_TESTS=false
```

#### Paso 2: Ejecutar migraciones

```bash
npx prisma migrate deploy

# Tests
npm run test:integration
```

#### Limpiar después

```bash
# Eliminar BD SQLite
rm test.db
```

---

## ✅ VERIFICAR QUE ES SEGURO

Antes de ejecutar tests, verificar:

```bash
# 1. Verificar que DATABASE_URL no apunta a /postgres
echo $DATABASE_URL
# ❌ Debe NO contener: :5432/postgres
# ✅ Debe contener: test, 5433, o test.db

# 2. Verificar que NODE_ENV=test
echo $NODE_ENV
# Debe mostrar: test

# 3. Verificar que SKIP_DB_TESTS=false
echo $SKIP_DB_TESTS
# Debe mostrar: false
```

---

## 🧪 EJECUTAR TESTS

### Tests de Integración (con BD)

```bash
npm run test:integration
```

Expected output:
```
✅ Validación de BD: OK - Usando BD aislada para tests
🧪 Configurando base de datos de test (PostgreSQL)...
✅ BD de test lista
[tests running...]
✅ Limpieza completada
```

### Tests Unitarios (sin BD)

```bash
npm run test:unit
```

### Todos los tests

```bash
npm test
```

### Tests en modo watch

```bash
npm run test:integration:watch
```

---

## 🔐 VALIDACIONES DE SEGURIDAD

El sistema tiene **3 niveles de protección**:

### Nivel 1: Variable de entorno SKIP_DB_TESTS
```env
SKIP_DB_TESTS=true   # ← Tests deshabilitados (actual)
SKIP_DB_TESTS=false  # ← Tests habilitados (después de setup)
```

### Nivel 2: Validación en setup.ts
```typescript
// Si DATABASE_URL apunta a producción → FALLA
await validateTestDatabaseIsolation();
```

### Nivel 3: Tests de aislamiento
```bash
# Verifica que BD es realmente aislada
npm run test:unit tests/unit/security/database-isolation.test.ts
```

---

## ❌ ERRORES COMUNES Y SOLUCIONES

### Error: "Conectando a BD postgres default"

**Causa**: DATABASE_URL apunta a `/postgres` principal

**Solución**:
```bash
# Editar .env.test y cambiar:
# ❌ ...@host:5432/postgres
# ✅ ...@host:5432/3dprint_tfm_test

# O si usas Docker:
# ✅ DATABASE_URL=postgresql://testuser:testpassword123@localhost:5433/3dprint_tfm_test
```

### Error: "Connection refused"

**Causa**: Docker no está corriendo o configuración incorrecta

**Solución**:
```bash
# Iniciar Docker
docker-compose -f docker-compose.test.yml up -d

# Verificar
docker ps | grep 3dprint-test-db

# Ver logs
docker-compose -f docker-compose.test.yml logs postgres-test
```

### Error: "SKIP_DB_TESTS está true"

**Causa**: Tests están deshabilitados

**Solución**:
```bash
# Editar .env.test:
SKIP_DB_TESTS=false
```

---

## 📊 COMPARATIVA: Antes vs Después

### ANTES (Actual - INSEGURO)
```
❌ BD test = BD desarrollo
❌ Tests pueden truncar datos reales
❌ SKIP_DB_TESTS=true (tests deshabilitados)
❌ Falsa sensación de seguridad
```

### DESPUÉS (Con cualquier opción - SEGURO)
```
✅ BD test = BD completamente separada
✅ Tests corren en aislamiento total
✅ SKIP_DB_TESTS=false (tests habilitados)
✅ Seguridad total para datos reales
```

---

## 🚀 PRÓXIMOS PASOS

1. **Elegir opción** (recomendado: Docker)
2. **Ejecutar setup** (siguiendo pasos arriba)
3. **Ejecutar tests**: `npm run test:integration`
4. **Verificar**: Todos los tests pasan
5. **Confirmar**: Datos de desarrollo intactos

---

## 📞 SOPORTE

Si tienes dudas:

1. Revisar `AUDIT_DATABASE_TESTS.md` para más detalles
2. Ver `docker-compose.test.yml` para Docker
3. Ver `scripts/setup-test-db.sh` para automático

---

**Última actualización**: 2 de Abril de 2026  
**Versión**: 1.0  
**Estado**: 🟢 LISTO PARA IMPLEMENTAR
