# ✅ CHECKLIST DE IMPLEMENTACIÓN - SOLUCIÓN TESTS

## Fase 1: Preparación Inmediata (30 minutos)

- [ ] Leer `AUDIT_SUMMARY.txt` (resumen de problema)
- [ ] Leer `AUDIT_DATABASE_TESTS.md` (análisis técnico)
- [ ] Leer `TESTING_SETUP_GUIDE.md` (guía operativa)
- [ ] Elegir solución (Recomendado: Docker Local)
- [ ] Comunicar al equipo del problema

---

## Fase 2: Implementación (Elegir UNA opción)

### ✅ OPCIÓN A: Docker Local (RECOMENDADO)

**Tiempo estimado**: 5-10 minutos

Pasos:
- [ ] Verificar que Docker está instalado: `docker --version`
- [ ] Iniciar PostgreSQL en Docker:
  ```bash
  docker-compose -f docker-compose.test.yml up -d
  ```
- [ ] Verificar que container está corriendo:
  ```bash
  docker ps | grep 3dprint-test-db
  ```
- [ ] Esperar ~5 segundos a que PostgreSQL esté listo
- [ ] Confirmar `.env.test` tiene configuración correcta:
  ```env
  DATABASE_URL=postgresql://testuser:testpassword123@localhost:5433/3dprint_tfm_test
  SKIP_DB_TESTS=false
  ```

---

### ✅ OPCIÓN B: Base de Datos Separada en Supabase

**Tiempo estimado**: 10-15 minutos

Pasos:
- [ ] Ir a https://supabase.com/dashboard
- [ ] Seleccionar proyecto "3dprint-tfm"
- [ ] Ir a SQL Editor
- [ ] Crear query:
  ```sql
  CREATE DATABASE 3dprint_tfm_test;
  ```
- [ ] Ejecutar query
- [ ] Ir a Configuración → Base de datos
- [ ] Copiar connection string
- [ ] Reemplazar `/postgres` con `/3dprint_tfm_test`
- [ ] Actualizar `.env.test`:
  ```env
  DATABASE_URL=postgresql://postgres.xxxxx:password@aws-1-eu-central-1.pooler.supabase.com:5432/3dprint_tfm_test
  SKIP_DB_TESTS=false
  ```
- [ ] Ejecutar migraciones:
  ```bash
  bash scripts/setup-test-db.sh
  ```

---

### ✅ OPCIÓN C: SQLite Local

**Tiempo estimado**: 2-3 minutos

Pasos:
- [ ] Actualizar `.env.test`:
  ```env
  DATABASE_URL=file:./test.db
  SKIP_DB_TESTS=false
  ```
- [ ] Ejecutar migraciones:
  ```bash
  npx prisma migrate deploy
  ```

---

## Fase 3: Validación (15-20 minutos)

### Validaciones Básicas

- [ ] DATABASE_URL NO contiene `/postgres` (BD default)
- [ ] DATABASE_URL contiene `test` o `5433` o `test.db`
- [ ] NODE_ENV está en `.env.test`
- [ ] SKIP_DB_TESTS=false

### Validación de Conexión

```bash
# Verificar variables
[ ] echo "DATABASE_URL: $DATABASE_URL"
[ ] echo "NODE_ENV: $NODE_ENV"

# Verificar conexión a BD
[ ] npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM usuarios;"
```

### Ejecutar Tests

```bash
# Tests unitarios (sin BD)
[ ] npm run test:unit

# Tests de integración (con BD)
[ ] npm run test:integration

# Test de aislamiento
[ ] npm run test:unit tests/unit/security/database-isolation.test.ts
```

### Verificar Que Es Seguro

```bash
# Antes de ejecutar tests
[ ] Confirmar que DATABASE_URL es de test (no de producción)
[ ] Confirmar que SKIP_DB_TESTS=false
[ ] Confirmar que NODE_ENV=test

# Después de ejecutar tests
[ ] Verificar que datos de desarrollo están intactos
[ ] Ir a Supabase/pgAdmin y confirmar que usuarios y productos originales existen
[ ] Confirmar que no hay datos duplicados
```

---

## Fase 4: Finalización (10 minutos)

### Documentación

- [ ] Crear documento DEPLOYMENT_NOTES.md con:
  - Opción elegida
  - Pasos tomados
  - Resultados
  - Problemas encontrados (si los hay)

### Comunicación

- [ ] Informar al equipo que problema está resuelto
- [ ] Compartir `TESTING_SETUP_GUIDE.md` con el equipo
- [ ] Agregar recordatorio a README.md

### Cleanup (según opción elegida)

**Si usas Docker**:
- [ ] Agregar a `.gitignore`: `test.db` (si existe)
- [ ] Documentar en README: `docker-compose -f docker-compose.test.yml up -d`

**Si usas Supabase**:
- [ ] Documentar en README la BD de test creada
- [ ] Guardar conexión en 1Password/documentación segura

**Si usas SQLite**:
- [ ] Agregar a `.gitignore`: `test.db`
- [ ] Documentar que se genera automáticamente

---

## Verificación Final

Ejecutar el siguiente comando y verificar que TODO pasa:

```bash
npm run test:integration
```

**Output esperado**:
```
✅ Validación de BD: OK - Usando BD aislada para tests
🧪 Configurando base de datos de test (PostgreSQL)...
✅ BD de test lista
[X tests passing...]
✅ Limpieza completada
```

---

## Resolución de Problemas

### Error: "Connection refused"

```bash
# Si usas Docker, iniciar container
docker-compose -f docker-compose.test.yml up -d

# Esperar 5 segundos
sleep 5

# Intentar de nuevo
npm run test:integration
```

### Error: "SKIP_DB_TESTS está true"

```bash
# Editar .env.test
SKIP_DB_TESTS=false
```

### Error: "Intentando conectar a BD de producción"

```bash
# Verificar que DATABASE_URL es correcto
echo $DATABASE_URL

# Debe contener:
# ✓ "test" o
# ✓ "5433" o
# ✓ "file:./test.db"

# NO debe contener:
# ✗ ":5432/postgres"
```

---

## Checklist de Seguridad Final

- [ ] BD test está 100% separada
- [ ] DATABASE_URL NO apunta a BD principal
- [ ] No hay datos reales en BD test
- [ ] Tests se ejecutan sin error
- [ ] Datos de desarrollo están intactos
- [ ] Documentación está actualizada
- [ ] Equipo está informado
- [ ] Problema está resuelto ✅

---

## Próximos Pasos

Después de implementar:

1. Ejecutar tests regularmente para asegurar que siguen pasando
2. Documentar en CI/CD para ejecutar tests automáticamente
3. Entrenar al equipo en esta configuración
4. Revisar regularmente que BD de test está separada
5. Considerar agregar hooks de pre-commit que validen

---

**Versión**: 1.0  
**Fecha**: 2 de Abril de 2026  
**Estado**: 🟢 LISTO PARA IMPLEMENTAR
