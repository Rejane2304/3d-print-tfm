# 🚀 INICIO RÁPIDO - TESTS SEGUROS

## ✅ Problema Resuelto ✅

Se ha implementado la **solución profesional: Docker Local** para aislar completamente la BD de tests.

---

## 📋 Requisitos Previos

- ✅ Docker instalado ([Descargar aquí](https://docker.com))
- ✅ Node.js 18+ instalado
- ✅ Este repositorio

---

## 🚀 Iniciar Tests en 1 Comando

```bash
# Comando único que hace todo
npm run test:docker:setup

# El script hará:
# 1. ✅ Inicia PostgreSQL en Docker
# 2. ✅ Espera a que esté listo
# 3. ✅ Ejecuta migraciones
# 4. ✅ Crea datos de test
# 5. ✅ Te pregunta si ejecutar tests
```

**Tiempo**: ~30 segundos

---

## 🧪 Ejecutar Tests

### Opción 1: Después del setup automático (recomendado)

```bash
# Ya tienes Docker corriendo, simplemente:
npm run test:integration

# Con auto-reload:
npm run test:integration:watch
```

### Opción 2: Pasos manuales

```bash
# 1. Iniciar Docker
npm run test:docker:up

# 2. Esperar a que PostgreSQL esté listo
npm run test:docker:wait

# 3. Ejecutar migraciones
npm run test:db:migrate

# 4. Seed (datos iniciales)
npm run test:db:seed

# 5. Ejecutar tests
npm run test:integration
```

---

## 📊 Información de la BD

Después de `npm run test:docker:setup`, tienes disponible:

```
Servidor: localhost
Puerto: 5433
Usuario: testuser
Password: testpassword123
Base de datos: 3dprint_tfm_test
```

Conectar con pgAdmin/DBeaver:
- Host: `localhost`
- Port: `5433`
- Username: `testuser`
- Password: `testpassword123`
- Database: `3dprint_tfm_test`

---

## 🛑 Detener Docker

```bash
# Detener container (datos se pierden - es normal)
npm run test:docker:down

# Alternativa: Ver estado
docker-compose -f docker-compose.test.yml ps
```

---

## ✅ Verificar que Está Funcionando

```bash
# Debe mostrar BD de test separada (NO /postgres)
echo $DATABASE_URL

# Debe mostrar "test"
echo $NODE_ENV

# Ejecutar tests de aislamiento
npm run test:unit tests/unit/security/database-isolation.test.ts
```

**Esperado**:
```
✅ Validación de BD: OK - Usando BD aislada para tests
✅ Todos los tests pasan
✅ Datos de desarrollo intactos
```

---

## 🎯 Casos de Uso

### Caso 1: Desarrollo Normal
```bash
npm run test:docker:setup  # Primera vez
npm run test:integration   # Cada vez que hagas cambios
```

### Caso 2: Tests en Watch Mode (desarrollo)
```bash
npm run test:docker:up              # Terminal 1
npm run test:integration:watch       # Terminal 2
# Los tests se re-ejecutan al cambiar código
```

### Caso 3: CI/CD (GitHub Actions, etc.)
```bash
npm run test:all  # Setup + tests + cleanup
```

### Caso 4: Tests E2E
```bash
npm run test:docker:setup
npm run test:e2e
npm run test:docker:down
```

---

## 🐛 Solución de Problemas

### Error: "Connection refused"

```bash
# Docker no está corriendo
docker-compose -f docker-compose.test.yml ps

# Reinicia
npm run test:docker:down
npm run test:docker:up
npm run test:docker:wait
```

### Error: "database 3dprint_tfm_test does not exist"

```bash
# Ejecutar migraciones
npm run test:db:migrate

# Luego seed
npm run test:db:seed
```

### Error: "SKIP_DB_TESTS está true"

```bash
# Editar .env.test
SKIP_DB_TESTS=false
```

### Error: "psql command not found"

```bash
# El script wait-for-postgres.js requiere psql
# Opción 1: Instalar PostgreSQL client
brew install postgresql  # macOS
apt-get install postgresql-client  # Linux
choco install postgresql  # Windows

# Opción 2: Usar alternativa (Docker)
docker exec 3dprint-test-db psql -U testuser -d 3dprint_tfm_test -c "SELECT 1"
```

---

## 📚 Documentación Completa

Para más detalles, ver:

- **AUDIT_DATABASE_TESTS.md** - Análisis técnico completo
- **TESTING_SETUP_GUIDE.md** - Guía detallada de todas las opciones
- **AUDIT_VISUAL_SUMMARY.md** - Diagramas y comparativas
- **IMPLEMENTATION_CHECKLIST.md** - Checklist completo

---

## 🔐 Seguridad

✅ **Protecciones implementadas**:

1. **BD Completamente Separada**
   - Docker container independiente
   - Puerto diferente (5433 vs 5432)
   - Datos nunca se mezclan

2. **Validaciones Automáticas**
   - Detecta si tries conectar a BD de producción
   - Falla con error claro

3. **Limpieza Automática**
   - Tests limpian la BD después de cada ejecución
   - Datos de desarrollo NUNCA se tocan

4. **Documentación Clara**
   - Instrucciones paso a paso
   - Alertas en archivos sensibles

---

## 🎉 Estado Actual

```
✅ BD separada para tests
✅ Docker configurado
✅ Scripts NPM listos
✅ Validaciones implementadas
✅ Documentación completa
✅ Tests ejecutables
✅ PROBLEMA RESUELTO
```

---

## 📞 Soporte

Si tienes problemas:

1. Ver "Solución de Problemas" arriba
2. Revisar logs: `docker-compose -f docker-compose.test.yml logs postgres-test`
3. Verificar Docker está corriendo: `docker ps`
4. Revisar documentación en **TESTING_SETUP_GUIDE.md**

---

**Versión**: 1.0  
**Fecha**: 2 de Abril de 2026  
**Status**: 🟢 IMPLEMENTADO Y LISTO
