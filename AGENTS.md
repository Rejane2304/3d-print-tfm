# AGENTS.md - 3D Print TFM

> Este archivo contiene información para agentes de IA que trabajan en este proyecto.
> **Última actualización:** Abril 2026

## 🚨 REGLA CRÍTICA DE SEGURIDAD: AISLAMIENTO TOTAL DE BASES DE DATOS

### ⚠️ PROHIBIDO ABSOLUTO: Usar BD de Desarrollo/Producción para Tests

| ❌ PROHIBIDO                                                  | ✅ OBLIGATORIO                             |
| ------------------------------------------------------------- | ------------------------------------------ |
| NUNCA usar `DATABASE_URL` de `.env` o `.env.local` para tests | SIEMPRE usar `DATABASE_URL` de `.env.test` |
| NUNCA tocar datos reales de usuarios/clientes                 | SIEMPRE usar `localhost:5433` (Docker)     |
| NUNCA ejecutar `prisma migrate` en BD de dev/prod             | SIEMPRE validar BD antes de ejecutar tests |
| NUNCA ejecutar `prisma db seed` en dev/prod                   | SIEMPRE truncar tablas antes de cada test  |

### Estructura de Bases de Datos (AISLADAS)

| Entorno  | Base de Datos           | Ubicación               | URL Patrón                 | Uso Permitido       |
| -------- | ----------------------- | ----------------------- | -------------------------- | ------------------- |
| **Test** | `3dprint_tfm_test`      | localhost:5433 (Docker) | `*localhost:5433*`         | ✅ Tests únicamente |
| **Dev**  | Supabase (eu-west-1)    | Cloud (PostgreSQL)      | `*.hkjknnymctorucyhtypm.*` | ❌ NUNCA para tests |
| **Prod** | Supabase (eu-central-1) | Cloud (PostgreSQL)      | `*.ctwbppfkfsuxymfouptb.*` | ❌ NUNCA para tests |

---

## Estado Actual del Proyecto (Abril 2026)

### ✅ Implementado

| Feature                      | Estado        | Detalle                                          |
| ---------------------------- | ------------- | ------------------------------------------------ |
| **Sistema Bilingüe**         | ✅ Completo   | Productos con campos `nameEs`/`nameEn`, etc.     |
| **Migraciones Consolidadas** | ✅ Completo   | Una única migración `init_complete`              |
| **Multi-Entorno BD**         | ✅ Completo   | Scripts por entorno (dev/prod/test)              |
| **Tests**                    | ✅ 395 tests  | Unit (299) + Integration (96) + E2E (91)         |
| **SonarQube**                | ✅ Optimizado | Configuración anti-hang para archivos TypeScript |
| **Seguridad BD**             | ✅ Activo     | Validación obligatoria en todos los tests        |
| **Seed Multi-Entorno**       | ✅ Activo     | Confirmación para producción                     |

### 📁 Archivos Clave

| Archivo                                           | Propósito                               |
| ------------------------------------------------- | --------------------------------------- |
| `prisma/migrations/20260416100000_init_complete/` | Única migración consolidada             |
| `prisma/seed.ts`                                  | Seed con datos bilingües                |
| `scripts/reset-and-seed.ts`                       | Reset completo + seed                   |
| `scripts/seed-prod-with-confirmation.ts`          | Seed con confirmación PROD              |
| `scripts/db-migrate-dev.ts`                       | Migraciones DEV (lee .env.local)        |
| `scripts/db-seed-dev.ts`                          | Seed DEV (lee .env.local)               |
| `scripts/db-studio-dev.ts`                        | Prisma Studio DEV (lee .env.local)      |
| `scripts/db-reset-dev.ts`                         | Reset completo DEV (lee .env.local)     |
| `scripts/db-migrate-prod.ts`                      | Migraciones PROD (lee .env.production)  |
| `scripts/db-test-*.ts`                            | Scripts para BD de test (lee .env.test) |
| `scripts/sonarqube-optimized-scan.sh`             | Análisis SonarQube anti-hang            |
| `scripts/check-sonarqube.sh`                      | Verifica configuración SonarQube        |

---

## Comandos Esenciales

### Setup Inicial

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar .env.local (copiar de .env.example)
cp .env.example .env.local
# Editar con tus credenciales de Supabase DEV

# 3. Generar Prisma Client
npx prisma generate
```

### Desarrollo

```bash
# Servidor de desarrollo (usa Supabase DEV)
npm run dev

# Verificar tipos
npm run type-check

# Lint
npm run lint

# Tests
npm run test:unit        # 299 tests
npm run test:integration # 96 tests
npm run test:e2e         # 91 tests
```

### Base de Datos

```bash
# Setup completo en DEV
npm run db:setup:dev

# Reset completo (truncar + seed) en DEV
npm run db:reset:dev

# Solo seed en DEV
npm run db:seed:dev

# Seed en PROD (con confirmación)
npm run db:seed:prod

# Migrar schema
npm run db:migrate:dev
npm run db:migrate:prod
```

### Prisma Studio

```bash
# BD de test (seguro)
npm run db:studio:test

# BD de dev (verificar primero)
npm run db:studio:dev

# ❌ PRODUCCIÓN BLOQUEADO
npm run db:studio:prod  # Error intencional
```

---

## Estructura del Proyecto

```
3d-print-tfm/
├── prisma/
│   ├── migrations/
│   │   └── 20260416100000_init_complete/  ← Única migración
│   ├── seed.ts                              ← Seed bilingüe
│   └── schema.prisma                        ← Schema actual
├── scripts/
│   ├── reset-and-seed.ts                    ← Reset + seed
│   ├── seed-prod-with-confirmation.ts       ← Seed PROD
│   └── seed-e2e.ts                          ← Seed para tests E2E
├── src/
│   ├── app/                                 ← Next.js App Router
│   ├── lib/
│   │   └── i18n/                            ← Traducciones bilingües
│   └── ...
├── tests/
│   ├── unit/                                ← 299 tests
│   ├── integration/                         ← 96 tests
│   └── e2e/                                 ← 91 tests
└── .env*                                    ← Configuración por entorno
```

---

## Sistema Bilingüe

### Modelo de Producto

```prisma
model Product {
  nameEs          String    // Nombre en español (REQUIRED)
  nameEn          String    // Nombre en inglés (REQUIRED)
  descriptionEs   String    // Descripción español
  descriptionEn   String    // Descripción inglés
  shortDescEs     String?   // Descripción corta español
  shortDescEn     String?   // Descripción corta inglés
  metaTitleEs     String?   // SEO título español
  metaTitleEn     String?   // SEO título inglés
  metaDescEs      String?   // SEO descripción español
  metaDescEn      String?   // SEO descripción inglés
  // ... campos legacy para compatibilidad
  name            String    // @deprecated - usar nameEs
  description     String?   // @deprecated - usar descriptionEs
}
```

### Flujo de Traducción

1. **Admin** escribe en español e inglés en el formulario
2. **BD** almacena ambos idiomas
3. **API** traduce automáticamente usando `i18n/index.ts`
4. **Frontend** recibe contenido ya traducido

---

## Verificación de Tests

Todos los tests de BD incluyen validación automática:

```typescript
// CRITICAL: Validate we're using test database
const databaseUrl = process.env.DATABASE_URL || '';
if (!databaseUrl.includes('test') && !databaseUrl.includes('localhost:5433')) {
  console.error('❌ CRITICAL ERROR: DATABASE_URL does not point to a test database!');
  process.exit(1);
}
```

---

## Troubleshooting

### "The column X does not exist in the current database"

**Causa:** La BD no tiene el schema actualizado

**Solución:** Ejecutar migraciones

```bash
npm run db:migrate:dev
# o para nueva BD:
npx prisma migrate deploy
```

### "Connection refused" al conectar a Supabase

**Causa:** Proyecto Supabase pausado o credenciales incorrectas

**Solución:**

1. Verificar en https://app.supabase.com que el proyecto esté activo
2. Verificar credenciales en `.env.local`

### "Unique constraint violation" al hacer seed

**Causa:** Datos existentes en la BD

**Solución:**

```bash
# Reset completo
npm run db:reset:dev
```

### "Can't reach database server at db.\*.supabase.co:5432" en Prisma Studio

**Causa:** Supabase ya no expone `db.{project}.supabase.co:5432` públicamente. Este host ya no resuelve DNS.

**Solución:** Usar el pooler de Supabase en puerto 5432 (sin pgbouncer):

```env
# ANTES (ya no funciona):
DIRECT_URL=postgresql://...db.hkjknnymctorucyhtypm.supabase.co:5432/postgres

# AHORA (funciona):
DIRECT_URL=postgresql://...aws-1-eu-west-1.pooler.supabase.com:5432/postgres
```

El script `db-studio-dev.ts` ahora agrega automáticamente `sslmode=require` si es necesario.

---

### SonarQube se atasca en "analizando 'route.ts'"

**Causa:** Archivos con tipos complejos de Prisma (ej. `Prisma.CartItemGetPayload`) que SonarQube no puede resolver.

**Solución:** Usar el script optimizado que excluye archivos problemáticos:

```bash
# Ejecutar análisis optimizado
./scripts/sonarqube-optimized-scan.sh

# O verificar configuración
./scripts/check-sonarqube.sh
```

**Archivos excluidos automáticamente:**

- `src/app/api/checkout/route.ts` (542 líneas)
- `src/app/api/payments/stripe/create/route.ts` (393 líneas)
- `src/app/api/payments/paypal/create/route.ts` (383 líneas)
- `src/app/api/admin/analytics/route.ts` (443 líneas)
- Todos los `**/import/processor.ts` y `**/import/route.ts`

**Configuración aplicada:**

- `sonar.typescript.typeCheck=false` (previere análisis de tipos)
- `sonar.typescript.node.modules.skip=true` (ignora node_modules)
- `sonar.javaOpts=-Xmx4096m` (4GB de memoria)
- `sonar.analysis.timeout=300000` (5 minutos timeout)

---

## Contacto y Soporte

- **Autor:** Rejane Rodrigues
- **Proyecto:** TFM - Máster de Desarrollo con IA
- **Repositorio:** https://github.com/Rejane2304/3d-print-tfm

---

**NOTA:** Este archivo debe actualizarse cuando cambien las estructuras principales del proyecto.
