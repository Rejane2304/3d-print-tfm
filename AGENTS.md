# AGENTS.md - 3D Print TFM

> Este archivo contiene información para agentes de IA que trabajan en este proyecto.

## 🚨 REGLA CRÍTICA DE SEGURIDAD #1: AISLAMIENTO TOTAL DE BASES DE DATOS

### ⚠️ PROHIBIDO ABSOLUTO: Usar BD de Desarrollo/Producción para Tests

**Esta prohibición es INQUEBRANTABLE y de cumplimiento obligatorio:**

| ❌ PROHIBIDO                                                  | ✅ OBLIGATORIO                             |
| ------------------------------------------------------------- | ------------------------------------------ |
| NUNCA usar `DATABASE_URL` de `.env` o `.env.local` para tests | SIEMPRE usar `DATABASE_URL` de `.env.test` |
| NUNCA tocar datos reales de usuarios/clientes                 | SIEMPRE usar `localhost:5433` (Docker)     |
| NUNCA ejecutar `prisma migrate` en BD de dev/prod             | SIEMPRE validar BD antes de ejecutar tests |
| NUNCA ejecutar `prisma db seed` en dev/prod                   | SIEMPRE truncar tablas antes de cada test  |

### ⚠️ CONSECUENCIAS DE INCUMPLIMIENTO

**Si un agente usa la BD de dev/prod para tests:**

1. 🔴 **Datos reales de clientes pueden ser borrados** (TRUNCATE en tests)
2. 🔴 **Datos de prueba aparecerán en producción** (productos fake, pedidos de test)
3. 🔴 **Seeder puede sobrescribir datos reales**
4. 🔴 **Tests pueden exponer información sensible**

### Estructura de Bases de Datos (AISLADAS)

| Entorno  | Base de Datos      | Ubicación               | URL Patrón                  | Uso Permitido       |
| -------- | ------------------ | ----------------------- | --------------------------- | ------------------- |
| **Test** | `3dprint_tfm_test` | localhost:5433 (Docker) | `*localhost:5433*`          | ✅ Tests únicamente |
| **Dev**  | Supabase           | Cloud (PostgreSQL)      | `*.supabase.co*,*.pooler.*` | ❌ NUNCA para tests |
| **Prod** | Supabase           | Cloud (PostgreSQL)      | `*.supabase.co*,*.pooler.*` | ❌ NUNCA para tests |

### Verificación OBLIGATORIA en Cada Archivo de Test

**Todos los archivos de test DEBEN incluir esta validación:**

```typescript
// CRITICAL: Validate we're using test database
const databaseUrl = process.env.DATABASE_URL || '';
if (!databaseUrl.includes('test') && !databaseUrl.includes('localhost:5433')) {
  console.error('❌ CRITICAL ERROR: DATABASE_URL does not point to a test database!');
  console.error('   Current:', databaseUrl.substring(0, 50) + '...');
  console.error('   Tests MUST use localhost:5433 only.');
  process.exit(1);
}
console.log('✅ Using TEST database:', databaseUrl.split('@')[1]?.split('/')[0] || 'localhost:5433');
```

### Configuración Correcta por Tipo de Test

| Tipo de Test    | Base de Datos    | Archivo de Config | Comando                    |
| --------------- | ---------------- | ----------------- | -------------------------- |
| **Unitarios**   | Ninguna (mocks)  | N/A               | `npm run test:unit`        |
| **Integración** | `localhost:5433` | `.env.test`       | `npm run test:integration` |
| **E2E**         | `localhost:5433` | `.env.test`       | `npm run test:e2e`         |

### Checklist Pre-Test (OBLIGATORIO)

Antes de ejecutar CUALQUIER test que use base de datos:

- [ ] Verificar que `.env.test` tiene `DATABASE_URL=postgresql://testuser:testpassword123@localhost:5433/3dprint_tfm_test`
- [ ] Verificar que Docker está corriendo: `docker ps | grep 3dprint-test-db`
- [ ] Verificar que `process.env.DATABASE_URL` incluye `localhost:5433`
- [ ] Verificar que NO se usa `DATABASE_URL` de `.env` o `.env.local`

### Historial de Incidentes

**2024-XX-XX**: Tests E2E crearon productos en BD de desarrollo por configuración incorrecta de `DATABASE_URL`. Se implementaron validaciones adicionales de hard-fail.

**2026-04-16**: Agentes deben verificar explícitamente la URL de BD antes de ejecutar cualquier operación de base de datos en tests.

### Verificación Automática

Los tests E2E verifican automáticamente:

```typescript
if (!databaseUrl.includes('test') && !databaseUrl.includes('localhost')) {
  console.error('❌ ERROR: DATABASE_URL does not point to a test database!');
  process.exit(1);
}
```

### Configuración Correcta

1. Tests unitarios: Usan mocks, no necesitan BD
2. Tests integración: Usan `localhost:5433` (Docker)
3. Tests E2E: Usan `localhost:5433` (Docker + Next.js en test mode)

### Historial de Incidentes

**2024-XX-XX**: Tests E2E crearon productos en BD de desarrollo por configuración incorrecta de `DATABASE_URL`. Se implementaron validaciones adicionales de hard-fail.

**2026-04-16**: Agentes deben verificar explícitamente la URL de BD antes de ejecutar cualquier operación de base de datos en tests.

### Verificación Automática

Los tests E2E verifican automáticamente:

```typescript
if (!databaseUrl.includes('test') && !databaseUrl.includes('localhost:5433')) {
  console.error('❌ ERROR: DATABASE_URL does not point to a test database!');
  process.exit(1);
}
```

### Configuración Correcta

1. Tests unitarios: Usan mocks, no necesitan BD
2. Tests integración: Usan `localhost:5433` (Docker)
3. Tests E2E: Usan `localhost:5433` (Docker + Next.js en test mode)

### Prisma Studio - Guía de Seguridad

Prisma Studio es una herramienta visual para explorar la base de datos. **DEBE usarse con precaución** para evitar tocar datos de producción.

#### Comandos Seguros

```bash
# ✅ Prisma Studio con BD de test (RECOMENDADO para desarrollo)
npm run db:studio:test

# ⚠️ Prisma Studio con BD actual (verificar .env primero!)
npm run db:studio
```

#### Verificación Antes de Abrir Prisma Studio

**SIEMPRE ejecutar este comando antes:**

```bash
# Verificar qué BD se usará
echo $DATABASE_URL | grep -E "(test|localhost:5433)" && echo "✅ BD de test detectada" || echo "❌ ATENCIÓN: No es BD de test"
```

#### Tabla de Comandos Prisma Studio

| Comando                  | BD Usada            | Seguro       | Uso                        |
| ------------------------ | ------------------- | ------------ | -------------------------- |
| `npm run db:studio:test` | `localhost:5433`    | ✅ SÍ        | Desarrollo y pruebas       |
| `npm run db:studio`      | La de `.env` actual | ⚠️ Verificar | Solo si .env apunta a test |
| `npx prisma studio`      | La de `.env` actual | ❌ NO        | Peligroso - sin validación |

#### Reglas para Prisma Studio

1. **NUNCA** usar `npx prisma studio` directamente (usa BD de .env sin validar)
2. **SIEMPRE** preferir `npm run db:studio:test` para desarrollo
3. **NUNCA** abrir Prisma Studio en BD de producción
4. **SIEMPRE** verificar la URL antes de ejecutar comandos manuales

#### Verificación Visual en Prisma Studio

Una vez abierto, verifica en la esquina inferior:

- ✅ **Esperado:** `postgresql://testuser:***@localhost:5433/3dprint_tfm_test`
- ❌ **Peligro:** Cualquier URL con `supabase.co` o `pooler.supabase.com`

---

## Gestión de Bases de Datos Multi-Entorno

### Estructura de Bases de Datos

| Entorno  | Base de Datos           | Ubicación               | URL Patrón                 | Script de Seed                    |
| -------- | ----------------------- | ----------------------- | -------------------------- | --------------------------------- |
| **Test** | `3dprint_tfm_test`      | localhost:5433 (Docker) | `*localhost:5433*`         | `npm run test:db:seed`            |
| **Dev**  | Supabase (eu-west-1)    | Cloud (PostgreSQL)      | `*.hkjknnymctorucyhtypm.*` | `npm run db:seed:dev`             |
| **Prod** | Supabase (eu-central-1) | Cloud (PostgreSQL)      | `*.ctwbppfkfsuxymfouptb.*` | `npm run db:seed:prod` (confirma) |

### Comandos por Entorno

#### Desarrollo (Supabase Dev)

```bash
# Setup completo (migrate + seed)
npm run db:setup:dev

# Solo migraciones
npm run db:migrate:dev

# Solo seed
npm run db:seed:dev

# Prisma Studio (BD de desarrollo)
npm run db:studio:dev
```

#### Producción (Supabase Prod) - ⚠️ CON CUIDADO

```bash
# Solo migraciones (sin confirmación)
npm run db:migrate:prod

# Seed con confirmación interactiva (escribe "PRODUCCION")
npm run db:seed:prod

# ❌ Prisma Studio está BLOQUEADO en producción
```

#### Test (localhost:5433)

```bash
# Seed en BD de test
npm run test:db:seed

# Prisma Studio con BD de test
npm run db:studio:test
```

### Configuración de Archivos .env

#### `.env.local` (Desarrollo)

Apunta a **Supabase DEV** para desarrollo colaborativo:

```bash
DATABASE_URL=postgresql://postgres.hkjknnymctorucyhtypm:putWa3-jinpeg-vorjeh@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10
DIRECT_URL=postgresql://postgres.hkjknnymctorucyhtypm:putWa3-jinpeg-vorjeh@db.hkjknnymctorucyhtypm.supabase.co:5432/postgres
```

#### `.env` (Producción - Solo para deployment)

Apunta a **Supabase PROD** (descomentar solo para deploy):

```bash
# DATABASE_URL=postgresql://postgres.ctwbppfkfsuxymfouptb:putWa3-jinpeg-vorjeh@aws-1-eu-central-1.pooler.supabase.com:5432/postgres
# DIRECT_URL=postgresql://postgres.ctwbppfkfsuxymfouptb:putWa3-jinpeg-vorjeh@aws-1-eu-central-1.pooler.supabase.com:5432/postgres
```

#### `.env.test` (Tests)

Apunta a **localhost:5433** exclusivamente:

```bash
DATABASE_URL=postgresql://testuser:testpassword123@localhost:5433/3dprint_tfm_test
```

### ⚠️ Seguridad en Seeds

| Entorno  | ¿Requiere Confirmación?      | ¿Qué hace?                                   |
| -------- | ---------------------------- | -------------------------------------------- |
| **Test** | ❌ No                        | TRUNCATE + Seed automático                   |
| **Dev**  | ❌ No                        | TRUNCATE + Seed con datos de desarrollo      |
| **Prod** | ✅ SÍ - Escribe "PRODUCCION" | TRUNCATE + Seed con confirmación interactiva |

**⚠️ Advertencia:** El seed SIEMPRE hace `TRUNCATE` de todas las tablas antes de insertar datos.

### Flujo de Trabajo Recomendado

1. **Desarrollo Local**: Usa `npm run dev` (apunta a Supabase DEV)
2. **Pruebas**: Usa `npm run test:e2e` (usa localhost:5433 automáticamente)
3. **Seed en DEV**: `npm run db:setup:dev` (cuando necesites datos frescos)
4. **Seed en PROD**: Solo durante mantenimiento, con confirmación

---

## Información del Proyecto

- **Nombre**: 3D Print
- **Framework**: Next.js 14 con App Router
- **Base de datos**: PostgreSQL con Prisma ORM
- **Autenticación**: NextAuth.js
- **Testing**: Vitest (unitarios) + Vitest (integración) + Playwright (e2e)
- **Idioma UI**: Español (backend traduce todo antes de enviar al frontend)

## Arquitectura de Traducción

Este proyecto usa un sistema **100% backend translation**:

- **BD**: Todo en inglés (enums, contenido)
- **Código**: Todo en inglés (variables, funciones, clases)
- **API Routes**: Transforman inglés → español
- **Frontend**: Recibe español directamente
- **UI**: 100% español

### Cómo Funciona

1. Los datos se almacenan en inglés en la BD (ej: "Floral Decorative Vase")
2. Las API routes usan helpers de `/src/lib/i18n/index.ts` para traducir
3. El frontend recibe el contenido ya en español (ej: "Jarrón Decorativo Floral")
4. No hay i18n en el frontend - todo se traduce en el backend

### Módulo de Traducción

Ubicación: `/src/lib/i18n/index.ts`

Diccionarios disponibles:

- `productTranslations`: Traducciones de productos por slug
- `categoryTranslations`: Traducciones de categorías por slug
- `enumTranslations`: Traducciones de enums (estados, métodos, etc.)
- `errorMessages`: Traducciones de mensajes de error
- `faqTranslations`: Traducciones de FAQs
- `shippingTranslations`: Traducciones de métodos de envío

Funciones helpers:

- `translateProductName(slug)` → Nombre español
- `translateProductDescription(slug)` → Descripción española
- `translateCategoryName(slug)` → Nombre español
- `translateOrderStatus(status)` → Estado traducido
- `translatePaymentStatus(status)` → Estado de pago traducido
- `translatePaymentMethod(method)` → Método traducido

### Rutas API Traducidas

✅ `/api/products` - Productos traducidos
✅ `/api/products/[slug]` - Detalle de producto traducido
✅ `/api/cart` - Items del carrito traducidos
✅ `/api/account/orders` - Pedidos con productos traducidos
✅ `/api/account/orders/[id]` - Detalle con productos traducidos
✅ `/api/admin/products` - Productos traducidos
✅ `/api/admin/inventory` - Inventario con nombres traducidos
✅ `/api/admin/shipping` - Zonas de envío (listar, crear)
✅ `/api/admin/shipping/[id]` - Zona de envío individual (obtener, actualizar, eliminar)
✅ `/api/shipping/zones` - Zonas de envío públicas
✅ `/api/shipping/calculate` - Calcular costo de envío

## Convenciones de Código

### Nomenclatura

- **Variables/Funciones**: camelCase en inglés
- **Componentes**: PascalCase en inglés
- **API Routes**: inglés (ej: `route.ts`)
- **Database fields**: inglés
- **Enums**: UPPER_SNAKE_CASE en inglés

### Ejemplo

```typescript
// ✅ Correcto
const productName = translateProductName(product.slug);
const orderStatus = translateOrderStatus(order.status);

// ❌ Incorrecto
const nombreProducto = product.name; // Enviaría inglés al frontend
const estadoPedido = order.status; // Enviaría PENDING en lugar de Pendiente
```

## Estructura del Proyecto

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── (routes)/          # Páginas de la aplicación
│   └── layout.tsx         # Layout raíz
├── components/            # Componentes React
├── lib/                   # Librerías y utilidades
│   ├── i18n/             # Módulo de traducción
│   ├── errors/           # Manejo de errores
│   ├── validators/       # Validaciones Zod
│   └── db/               # Configuración Prisma
└── types/                # Tipos TypeScript

tests/
├── unit/                 # Tests unitarios
├── integration/          # Tests de integración
└── e2e/                  # Tests E2E con Playwright

prisma/
├── schema.prisma         # Esquema de BD
└── seed.ts              # Datos iniciales
```

## Comandos Importantes

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo

# Testing
npm test                 # Ejecutar todos los tests
npm run test:unit        # Tests unitarios con Vitest
npm run test:e2e         # Tests E2E con Playwright

# Base de datos
npx prisma migrate dev   # Ejecutar migraciones
npx prisma db seed       # Sembrar datos iniciales
npx prisma generate      # Generar cliente Prisma

# Construcción
npm run build           # Construir aplicación
```

## Sistema de Subagentes

Este proyecto soporta delegación automática a subagentes especializados.

### Documentación

Ver `.agent/SUBAGENTS.md` para información detallada sobre el sistema de subagentes.

### Configuración

Las reglas de delegación están en `.agent/config/delegation-rules.json`.

### Tipos de Subagentes Disponibles

1. **explore** - Búsqueda y exploración de código
2. **general** - Propósito general para tareas complejas
3. **code-reviewer** - Revisión de código y calidad
4. **test-runner** - Ejecución de tests
5. **translator** - Traducción de contenido

### Uso Manual

Para forzar el uso de un subagente específico:

```
/delegate [tipo] [descripción de la tarea]
```

Ejemplos:

```
/delegate explore Buscar todos los archivos de configuración
/delegate general Refactorizar el módulo de autenticación
/delegate test-runner Ejecutar tests de integración
/delegate translator Traducir mensajes de error
```

## Testing

### Tests Unitarios

- **Framework**: Vitest
- **Ubicación**: `tests/unit/`
- **Convención**: `[nombre].test.ts`

### Tests de Integración

- **Framework**: Vitest + PostgreSQL real
- **Ubicación**: `tests/integration/`
- **Base de datos**: `localhost:5433` (Docker)
- **Comando**: `npm run test:integration`

#### Cobertura de Tests de Integración (96 tests)

| Módulo                | Tests | Descripción                         |
| --------------------- | ----- | ----------------------------------- |
| **Invoices API**      | 30    | Facturas, PDFs, autenticación admin |
| **Addresses API**     | 18    | CRUD de direcciones, validaciones   |
| **Cart API**          | 20    | Carrito, items, control de stock    |
| **Products API**      | 19    | Productos, filtros, búsqueda, admin |
| **Checkout API**      | 16    | Pedidos, pagos, webhooks de Stripe  |
| **Auth API**          | 13    | Registro, login, hash de passwords  |
| **Admin Clients API** | 7     | Gestión de clientes para admins     |

#### Validación de Seguridad

Cada test de integración valida:

```
✅ Database Validation: PASSED
   Database: 3dprint_tfm_test
   Environment: test
```

**IMPORTANTE**: Los tests de integración limpian la BD antes de cada ejecución (`TRUNCATE TABLE ... CASCADE`) y nunca tocan datos de dev/prod.

### Tests E2E

- **Framework**: Playwright
- **Ubicación**: `tests/e2e/`
- **Configuración**: `playwright.config.ts`

## Seguridad

### Variables de Entorno Sensibles

NUNCA hagas commit de:

- `.env`
- `.env.local`
- `.env.test`
- Archivos con credenciales reales

### Base de Datos

- Producción y test son bases separadas
- Tests siempre usan `3dprint_tfm_test`
- Verificación automática en `beforeAll` de tests

### Autenticación

- NextAuth.js con credenciales personalizadas
- Roles: USER, ADMIN
- Middleware protege rutas según rol

## Contacto y Soporte

- **Autor**: Rejane Rodrigues
- **Proyecto**: TFM - Máster de Desarrollo con IA

---

**Última actualización**: Abril 2025
