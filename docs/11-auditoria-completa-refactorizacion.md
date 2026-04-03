# 📋 Auditoría Completa y Plan de Refactorización

**Proyecto:** 3D Print TFM  
**Fecha:** 2 de Abril de 2026  
**Auditor:** OpenCode AI  
**Estado:** 🔴 CRÍTICO - Requiere refactorización

---

## 📌 RESUMEN EJECUTIVO

El proyecto **3D Print TFM** está funcional pero sufre de problemas graves de organización que afectan la mantenibilidad, consistencia de tests y claridad de documentación. **No se propone modificar lógica de negocio, funcionalidades, flujos, UI/UX ni bases de datos.**

### Problemas Identificados

| Categoría | Problema | Severidad |
|-----------|----------|-----------|
| Documentación | 14 archivos duplicados/confusos en raíz | 🔴 Crítica |
| Tests | Inconsistencia, tests excluidos, setup complejo | 🔴 Crítica |
| Configuración | Variables de entorno fragmentadas | 🟡 Media |
| Estructura | Mezcla español/inglés en rutas | 🟡 Media |
| Archivos | Scripts temporales y backups huérfanos | 🟢 Baja |

### Métricas Clave

- **Tests Totales:** 351-378 (inconsistencia documentada)
- **Tests Unitarios Excluidos:** 5 archivos (components/)
- **Commits arreglando tests:** 7 consecutivos (indica inestabilidad)
- **Archivos de documentación:** 14 en raíz (excesivo)
- **Helpers de tests:** 7 archivos (excesivo)
- **Scripts de setup BD:** 3 (redundantes)

---

## 🔍 ANÁLISIS DETALLADO

### 1. DOCUMENTACIÓN - Caos y Duplicación

#### 1.1 Archivos en Raíz (14 archivos)

```
AUDIT_DATABASE_TESTS.md         # Análisis técnico BD
AUDIT_REPORT.md                 # Reporte de auditoría
AUDIT_SUMMARY.txt               # Resumen en texto
AUDIT_VISUAL_SUMMARY.md         # Resumen visual
DATABASE_SEED.md                # Documentación seed
DELETION_RULES.md               # Reglas de borrado
IMPLEMENTATION_CHECKLIST.md     # Checklist implementación
IMPLEMENTATION_COMPLETE.md      # Reporte completado
MIGRATION_GUIDE_TRANSACTIONS.md # Guía migración
QUICK_START.md                  # Inicio rápido
QUICK_START_TESTS.md            # Tests inicio rápido
README.md                       # Principal
TESTING_SETUP_GUIDE.md          # Guía tests
⚠️_ALERTA_TESTS.md              # Alerta con emoji en nombre
```

#### 1.2 Problemas Identificados

**a) Información Contradictoria**

README.md afirma:
```
✅ **Total:** 378 tests pasando (100%)
```

AUDIT_REPORT.md afirma:
```
Tests Totales: 357 (351 pasando, 6 fallos de aislamiento)
```

**Discrepancia:** 27 tests sin explicación clara.

**b) Duplicación de Temas**

| Tema | Archivos | Problema |
|------|----------|----------|
| Tests BD | AUDIT_DATABASE_TESTS, TESTING_SETUP_GUIDE, ⚠️_ALERTA_TESTS, AUDIT_SUMMARY | Mismo tema, 4 formatos |
| Implementación | IMPLEMENTATION_CHECKLIST, IMPLEMENTATION_COMPLETE | Checklist vs reporte |
| Inicio Rápido | QUICK_START, QUICK_START_TESTS | Separación innecesaria |
| Auditoría | AUDIT_REPORT, AUDIT_SUMMARY, AUDIT_VISUAL_SUMMARY | Triple redundancia |

**c) Archivos Temporales/Obsoletos**

- `DELETION_RULES.md` - Reglas específicas ya implementadas
- `DATABASE_SEED.md` - Documentado en README y seed.ts
- `MIGRATION_GUIDE_TRANSACTIONS.md` - Migraciones ya aplicadas
- `⚠️_ALERTA_TESTS.md` - Emoji en nombre, contenido temporal

**d) Documentación Privada Duplicada**

En `/private/`:
- `GUIA_VARIABLES_ENTORNO.md` - Ya cubierto en README
- `COMANDOS.md` - Comandos ya están en README
- `PLAN_IMPLEMENTACION.md` - 14KB, probablemente desfasado
- `RESUMEN_CONFIGURACION.md` - Resumen innecesario

---

### 2. TESTS - Inconsistencia y Complejidad Excesiva

#### 2.1 Problemas de Estabilidad

**Historial Git (7 commits consecutivos arreglando tests):**

```
23b9556 fix(tests): resolve intermittent failures with PostgreSQL...
087228c fix(tests): add aggressive data persistence handling...
7fae7bf fix(tests): implement deadlock handling...
79ef0ad fix(tests): resolve remaining integration test failures...
65bfc59 fix(tests): resolve deadlock issues in concurrent test execution
e63f680 fix(test): correct duplicate email validation test...
b8bf9ed fix: improve test isolation and fix failing integration tests
```

**Análisis:** Tests flaky que fallan intermitentemente indican problemas de aislamiento y race conditions.

#### 2.2 Estructura de Tests Desbalanceada

```
tests/
├── e2e/
│   └── auth/
│       └── login.spec.ts              # 1 archivo E2E
├── unit/
│   ├── components/                    # 5 archivos EXCLUIDOS ❌
│   ├── security/
│   │   └── database-isolation.test.ts # Tests condicionales
│   ├── services/
│   └── validaciones.test.ts           # 454 líneas
├── integration/                         # 17 archivos
│   ├── api/
│   ├── admin/
│   ├── auth/
│   ├── pages/
│   └── account/
├── helpers/                             # 7 ARCHIVOS
│   ├── db-validation.ts
│   ├── db-integration-setup.ts
│   ├── db-cleanup.ts
│   ├── db-wait.ts
│   ├── db-mutex.ts
│   ├── db-transactions.ts
│   └── db-*.ts
└── setup.ts                           # 327 líneas (complejo)
```

#### 2.3 Tests Excluidos (Nunca Ejecutados)

**vitest.config.ts (línea 28):**
```typescript
exclude: [
  '**/node_modules/**',
  // ...
  '**/tests/unit/components/**', // ❌ EXCLUIDO
]
```

**Tests existentes pero ignorados:**
- `CartItem.test.tsx`
- `CartSummary.test.tsx`
- `Footer.test.tsx`
- `Header.test.tsx`
- Otros componentes UI

**Impacto:** Cobertura de componentes React es 0%.

#### 2.4 Tests con Condicionales de Salto

**tests/unit/security/database-isolation.test.ts:**
```typescript
const skipTests = process.env.SKIP_DB_TESTS === 'true';
const describeFunc = skipTests ? describe.skip : describe;

describeFunc('Validación de Aislamiento de BD', () => {
  // Tests que pueden no ejecutarse
});
```

**Problema:** Tests que se saltan silenciosamente sin indicar claramente que fueron omitidos.

#### 2.5 Complejidad de Setup de BD

**scripts/ (setup de BD test):**
```
prepare-test-db.sh      # Script legacy
setup-test-db.sh        # Script actual
init-test-db.sql        # SQL directo
test-setup-complete.sh  # Verificación
wait-for-postgres.js    # Utilidad Node
```

**helpers/ (manejo de BD en tests):**
```
db-validation.ts        # 120 líneas - Validación seguridad
db-integration-setup.ts # Setup específico
db-cleanup.ts         # Limpieza
db-wait.ts            # Esperas
db-mutex.ts           # Mutex PostgreSQL
db-transactions.ts    # Manejo transacciones
```

**Problema:** 7 archivos para manejar algo que debería ser manejado por `beforeAll`/`afterAll` estándar.

#### 2.6 Problemas en tests/setup.ts (327 líneas)

**Código problemático:**
```typescript
// Líneas 61-120: Función limpiarBaseDeDatos()
// - Usa TRUNCATE CASCADE destructivo
// - Requiere 3 reintentos por deadlocks
// - 17 tablas hardcodeadas

// Líneas 125-235: Función seedDatosIniciales()
// - 4 bloques try-catch anidados
// - Delays arbitrarios (100ms, 1500ms)
// - Hardcode de IDs ('test-admin-id', 'test-product-1')

// Líneas 243-327: beforeAll/afterAll
// - Uso de advisory locks PostgreSQL
// - Lógica compleja de serialización
// - Flags globales (dbSetupDone, setupPromise)
```

**Indicadores de fragilidad:**
1. Uso de `await new Promise(resolve => setTimeout(resolve, 100))` x4
2. Reintentos por deadlocks (indica concurrencia mal manejada)
3. Advisory locks manuales en lugar de transacciones
4. Validaciones condicionales que pueden saltarse

---

### 3. CONFIGURACIÓN - Fragmentación

#### 3.1 Variables de Entorno (6 archivos)

| Archivo | Tamaño | Estado | Problema |
|---------|--------|--------|----------|
| `.env` | ~50 líneas | 🔴 Secreto | No versionar |
| `.env.development` | 6 líneas | 🟡 Vacío | Insuficiente |
| `.env.example` | 50+ líneas | 🟢 Template | OK |
| `.env.production.example` | ~30 líneas | 🟢 Template | OK |
| `.env.test` | 68 líneas | 🟢 Configurado | OK pero largo |
| `.env.test.example` | ~40 líneas | 🟢 Template | Duplica info |

**Análisis de .env.development (6 líneas):**
```bash
# ============================================
# 3D PRINT TFM - DESARROLLO
# ============================================

NODE_ENV="development"
NEXTAUTH_URL="http://localhost:3000"
```

**Problema:** Faltan todas las variables críticas (DATABASE_URL, STRIPE keys, etc.). Desarrolladores deben adivinar o copiar de .env.example.

#### 3.2 Scripts en package.json

**14 scripts relacionados con tests:**
```json
{
  "test": "vitest",
  "test:unit": "vitest --run tests/unit",
  "test:integration": "VITEST_ENV=integration vitest --run...",
  "test:integration:watch": "VITEST_ENV=integration vitest...",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:docker:up": "docker-compose...",
  "test:docker:down": "docker-compose...",
  "test:docker:wait": "node scripts/wait-for-postgres.js",
  "test:docker:setup": "npm run test:docker:up && ...",
  "test:db:migrate": "DATABASE_URL=... npx prisma migrate deploy",
  "test:db:seed": "DATABASE_URL=... tsx prisma/seed.ts",
  "test:all": "npm run test:docker:setup && ..."
}
```

**Problemas:**
1. `test:db:migrate` y `test:db:seed` hardcodean DATABASE_URL
2. Complejidad excesiva (docker up → wait → migrate → seed)
3. Falta `test:watch` simple
4. `test:all` asume Docker siempre

#### 3.3 Configuración de Vitest

**vitest.config.ts (58 líneas):**

**Problemas:**
1. Carga condicional de `.env` (líneas 7-14) - innecesario
2. Exclusión de tests de componentes (línea 28)
3. Timeout extendido para integración (línea 30)
4. Thresholds de cobertura 80% que incluyen código excluido

#### 3.4 Gitignore Descontrolado (321 líneas)

**Problemas:**
1. **Excesivamente largo** para proyecto pequeño
2. **Secciones para herramientas no usadas:**
   - Yarn, pnpm (usamos npm)
   - Parcel, webpack
   - Lerna
   - Firebase

3. **Ignora archivos que deberían versionarse:**
   ```gitignore
   package-lock.json              # ❌ Lock file ignorado
   .env.test                      # OK ignorar, pero confuso
   ```

4. **Duplicación de patrones:**
   - `*.tmp`, `*.temp` repetidos
   - `*~` (backup) aparece 3 veces
   - `.cache/` y `cache/` separados

---

### 4. ESTRUCTURA DE CARPETAS - Inconsistencia de Idiomas

#### 4.1 Rutas API Mixtas

```
src/app/api/
├── carrito/                    # Español
├── checkout/                   # Inglés ❌
├── productos/                  # Español
├── auth/
│   ├── [...nextauth]/          # Inglés ❌
│   └── register/               # Inglés ❌
├── admin/
│   ├── products/               # Inglés ❌
│   ├── orders/                 # Inglés ❌
│   └── invoices/               # Inglés ❌
├── account/
│   ├── profile/                # Inglés ❌
│   └── addresses/              # Inglés ❌
└── webhooks/stripe/            # Inglés OK (término técnico)
```

**Análisis:**
- `carrito` (español) vs `checkout` (inglés) - inconsistente
- `productos` (español) vs `products` (inglés en admin) - inconsistente
- Toda la BD está en español (nombres de campos), pero algunas rutas en inglés

**Impacto:**
1. Dificulta recordar URLs
2. Inconsistencia en documentación
3. Código más difícil de mantener

#### 4.2 Estructura de Componentes

```
src/components/
├── cart/                       # Inglés ❌
├── products/                   # Inglés ❌
├── layout/                     # Inglés ❌
└── ui/                         # Inglés OK
```

**Contradicción:** BD en español, componentes en inglés.

---

### 5. ARCHIVOS HUÉRFANOS Y TEMPORALES

#### 5.1 En Raíz

```
fix-tests.sh                    # Script temporal (1,803 bytes)
tsconfig.tsbuildinfo            # Build artifact (894KB) ❌
.backups/                       # Carpeta de backups
```

#### 5.2 En /private/

```
public/
└── images/
    └── products/               # DUPLICA public/images/products/
```

**Duplicación:** 10 carpetas de productos duplicadas.

#### 5.3 En scripts/

```
prepare-test-db.sh              # Legacy (1,301 bytes)
test-setup-complete.sh          # Verificación temporal (3,846 bytes)
```

**Redundancia:** `prepare-test-db.sh` vs `setup-test-db.sh` (similar nombre, diferente función).

---

### 6. PROBLEMAS DE CONFIGURACIÓN DE BD

#### 6.1 Complejidad de Prisma

**prisma/schema.prisma:** Modelo funcional (18 modelos) - ✅ OK

**Problemas en prisma/seed.ts:**
1. 300+ líneas de código de seed
2. Hardcode de datos CSV
3. Uso de `createMany` sin transacciones explícitas
4. Manejo de errores genérico (console.error)

#### 6.2 Conexión Prisma

**src/lib/db/prisma.ts (15 líneas):**
```typescript
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

**Problemas:**
1. Sin manejo de errores de conexión
2. Sin logging condicional
3. Sin configuración de connection pool
4. Sin reconnect automático

---

## 🎯 PLAN DE REFACTORIZACIÓN

### Principios Rectores

1. **NO modificar lógica de negocio**
2. **NO modificar funcionalidades existentes**
3. **NO modificar flujos de usuario**
4. **NO modificar UI/UX**
5. **NO modificar base de datos ni migraciones**
6. **Solo reorganizar, consolidar y limpiar**

### FASE 1: Consolidar Documentación (Prioridad: 🔴 ALTA)

#### Objetivo
Reducir 14 archivos en raíz a 5 archivos bien organizados en `docs/`.

#### Acciones

**1.1 Crear estructura docs/**
```
docs/
├── README.md                   # Índice de documentación
├── SETUP.md                    # Guía completa de instalación
├── TESTING.md                  # Todo sobre tests
├── ENVIRONMENT.md              # Variables de entorno
├── ARCHITECTURE.md             # Decisiones de arquitectura
└── api/                        # Documentación de API (si aplica)
```

**1.2 Migrar contenido**

| De | A | Acción |
|----|---|--------|
| `README.md` | `docs/README.md` (índice) | Resumir y linkear |
| `README.md` (setup) | `docs/SETUP.md` | Migrar contenido |
| `GUIA_VARIABLES_ENTORNO.md` | `docs/ENVIRONMENT.md` | Unificar |
| `TESTING_SETUP_GUIDE.md` | `docs/TESTING.md` | Consolidar |
| `AUDIT_DATABASE_TESTS.md` | `docs/TESTING.md#database` | Sección |
| `IMPLEMENTATION_COMPLETE.md` | `docs/ARCHITECTURE.md` | Historial |

**1.3 Eliminar archivos redundantes**

**Eliminar de raíz:**
- [ ] `AUDIT_DATABASE_TESTS.md`
- [ ] `AUDIT_REPORT.md`
- [ ] `AUDIT_SUMMARY.txt`
- [ ] `AUDIT_VISUAL_SUMMARY.md`
- [ ] `DATABASE_SEED.md`
- [ ] `DELETION_RULES.md`
- [ ] `IMPLEMENTATION_CHECKLIST.md`
- [ ] `IMPLEMENTATION_COMPLETE.md`
- [ ] `MIGRATION_GUIDE_TRANSACTIONS.md`
- [ ] `QUICK_START.md`
- [ ] `QUICK_START_TESTS.md`
- [ ] `TESTING_SETUP_GUIDE.md`
- [ ] `⚠️_ALERTA_TESTS.md`

**Actualizar:**
- [ ] `README.md` (raíz) - Resumir y apuntar a docs/
- [ ] `private/GUIA_VARIABLES_ENTORNO.md` - Mover a docs/ o eliminar

**1.4 Contenido de docs/README.md**

```markdown
# Documentación 3D Print TFM

## 📚 Índice

- [Guía de Instalación](SETUP.md) - Cómo configurar el proyecto
- [Testing](TESTING.md) - Cómo ejecutar y mantener tests
- [Variables de Entorno](ENVIRONMENT.md) - Configuración de .env
- [Arquitectura](ARCHITECTURE.md) - Decisiones de diseño

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Base de datos
npx prisma migrate dev
npm run db:seed

# Desarrollo
npm run dev
```

## 🧪 Testing

Ver [TESTING.md](TESTING.md) para guía completa.
```

---

### FASE 2: Simplificar Tests (Prioridad: 🔴 ALTA)

#### Objetivo
Reducir complejidad, eliminar tests excluidos, estabilizar ejecución.

#### Acciones

**2.1 Consolidar helpers de tests**

**ANTES:**
```
tests/helpers/
├── db-validation.ts (120 líneas)
├── db-integration-setup.ts
├── db-cleanup.ts
├── db-wait.ts
├── db-mutex.ts
├── db-transactions.ts
└── (6+ archivos)
```

**DESPUÉS:**
```
tests/
├── helpers.ts                  # Un solo archivo (~150 líneas)
├── setup.ts                    # Simplificado
└── ...
```

**Contenido de tests/helpers.ts:**
```typescript
/**
 * Helpers simplificados para tests
 */
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

/**
 * Limpia BD de test (simplificado)
 */
export async function cleanupDatabase() {
  const tables = [
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
  ];

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
    } catch {
      // Ignorar si tabla no existe
    }
  }
}

/**
 * Crea datos básicos de test
 */
export async function seedTestData() {
  // Implementación simplificada
}

/**
 * Valida que estamos en BD de test
 */
export function validateTestDB() {
  const url = process.env.DATABASE_URL || '';
  if (!url.includes('test') && !url.includes(':5433')) {
    throw new Error('DATABASE_URL debe apuntar a BD de test');
  }
}
```

**2.2 Simplificar tests/setup.ts**

**ANTES:** 327 líneas con locks, reintentos, delays.

**DESPUÉS:** ~80 líneas
```typescript
import { beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/db/prisma';
import { cleanupDatabase, seedTestData, validateTestDB } from './helpers';

beforeAll(async () => {
  if (process.env.VITEST_ENV !== 'integration') return;
  if (process.env.SKIP_DB_TESTS === 'true') return;
  
  validateTestDB();
  await cleanupDatabase();
  await seedTestData();
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

**2.3 Habilitar tests de componentes**

**vitest.config.ts:**
```typescript
// Eliminar línea:
// '**/tests/unit/components/**',

// O cambiar a:
exclude: [
  '**/node_modules/**',
  '**/dist/**',
  '**/.next/**',
  '**/cypress/**',
  '**/tests/e2e/**',
  // tests/unit/components/** - HABILITADO
]
```

**2.4 Eliminar scripts redundantes**

**Eliminar:**
- [ ] `tests/helpers/db-integration-setup.ts`
- [ ] `tests/helpers/db-cleanup.ts`
- [ ] `tests/helpers/db-wait.ts`
- [ ] `tests/helpers/db-mutex.ts`
- [ ] `tests/helpers/db-transactions.ts`
- [ ] `scripts/prepare-test-db.sh`
- [ ] `scripts/test-setup-complete.sh`

---

### FASE 3: Unificar Configuración (Prioridad: 🟡 MEDIA)

#### Objetivo
Simplificar variables de entorno y scripts de npm.

#### Acciones

**3.1 Consolidar archivos .env**

**.env.example (completo):**
```bash
# ============================================
# 3D PRINT TFM - Variables de Entorno
# ============================================

NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000

# Base de datos (Supabase Session Pooler)
DATABASE_URL=postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres

# NextAuth
NEXTAUTH_SECRET=generar_con_openssl_rand_base64_32

# Stripe (modo test)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**.env.development:**
```bash
# Cargar desde .env local
# Este archivo puede estar vacío si usas .env
```

**Eliminar:**
- [ ] `.env.test.example` (redundante con documentación)

**3.2 Simplificar scripts de test**

**package.json:**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    
    "test": "vitest",
    "test:unit": "vitest --run tests/unit",
    "test:integration": "VITEST_ENV=integration vitest --run tests/integration",
    "test:e2e": "playwright test",
    "test:coverage": "vitest --coverage",
    
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    
    "docker:up": "docker-compose -f docker-compose.test.yml up -d",
    "docker:down": "docker-compose -f docker-compose.test.yml down"
  }
}
```

**Eliminar:**
- [ ] `test:integration:watch` (usar `test:integration --watch`)
- [ ] `test:ui` (complejidad innecesaria)
- [ ] `test:docker:wait` (integrar en docker:up)
- [ ] `test:docker:setup` (documentar en lugar de script)
- [ ] `test:db:migrate` (usar db:migrate con env)
- [ ] `test:db:seed` (usar db:seed con env)
- [ ] `test:all` (demasiado acoplado)

---

### FASE 4: Limpiar Raíz del Proyecto (Prioridad: 🟡 MEDIA)

#### Acciones

**4.1 Eliminar archivos temporales**

**Eliminar de raíz:**
- [ ] `fix-tests.sh` (script temporal)
- [ ] `tsconfig.tsbuildinfo` (agregar a .gitignore)
- [ ] `.backups/` (si no es necesario para workflow)

**4.2 Agregar a .gitignore**

```bash
# Build artifacts
*.tsbuildinfo
.backups/

# Scripts temporales
fix-*.sh
```

**4.3 Limpiar /private**

**Eliminar:**
- [ ] `private/public/` (duplicado)
- [ ] `private/COMANDOS.md` (ya en README)
- [ ] `private/RESUMEN_CONFIGURACION.md` (redundante)

**Mantener:**
- `private/PLAN_IMPLEMENTACION.md` (documentación histórica)
- `private/GUIA_VARIABLES_ENTORNO.md` (hasta migrar a docs/)

---

### FASE 5: Estandarizar Nombres (Prioridad: 🟢 BAJA)

#### Decisión Requerida

**Opción A: Todo en Español** (coincide con BD)
```
api/
├── carrito/              # (ya está)
├── pago/                 # (antes checkout)
├── productos/            # (ya está)
└── autenticacion/        # (antes auth)
```

**Opción B: Todo en Inglés** (coincide con código)
```
api/
├── cart/                 # (antes carrito)
├── checkout/             # (ya está)
├── products/             # (antes productos)
└── auth/                 # (ya está)
```

**Recomendación:** Opción A (Español) porque:
1. La BD ya está en español (nombres de campos)
2. Documentación y requisitos en español
3. Proyecto académico español

#### Acciones (si se elige español)

**Crear redirecciones (para no romper URLs):**
```typescript
// src/app/checkout/page.tsx
import { redirect } from 'next/navigation';

export default function CheckoutRedirect() {
  redirect('/pago');
}
```

**Renombrar:**
- [ ] `app/api/checkout/` → `app/api/pago/`
- [ ] `app/api/auth/` → `app/api/autenticacion/`
- [ ] `app/admin/products/` → `app/admin/productos/`
- [ ] `app/admin/orders/` → `app/admin/pedidos/`
- [ ] `app/admin/invoices/` → `app/admin/facturas/`
- [ ] `components/cart/` → `components/carrito/`
- [ ] `components/products/` → `components/productos/`

**Nota:** Esta fase es opcional y puede posponerse.

---

### FASE 6: Simplificar .gitignore (Prioridad: 🟢 BAJA)

#### Objetivo
Reducir de 321 líneas a ~100 líneas.

#### Acciones

**6.1 Crear .gitignore simplificado**

```gitignore
# Dependencies
/node_modules
/.pnp
.pnp.js
package-lock.json  # ❌ Quitar de ignore (debe versionarse)

# Next.js
/.next/
/out/
/dist/
/build/

# TypeScript
*.tsbuildinfo

# Testing
/coverage/
/test-results/
/playwright-report/

# Environment
.env
.env.local
.env.*.local
!.env.example

# Secrets
*.key
*.pem
secrets/
credentials.json

# Database
*.db
*.sqlite

# IDEs
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Temp
*.tmp
*.temp
.backups/

# Vercel
.vercel
```

**6.2 Eliminar secciones innecesarias:**
- [ ] Sección Yarn (no se usa)
- [ ] Sección pnpm (no se usa)
- [ ] Sección Lerna (no se usa)
- [ ] Sección Parcel (no se usa)
- [ ] Sección Firebase (no se usa)
- [ ] Sección CI/CD workflows (si no se usan)
- [ ] Duplicados de patrones

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Pre-requisitos
- [ ] Crear rama `refactor/cleanup-project`
- [ ] Hacer backup de archivos importantes
- [ ] Ejecutar tests actuales y documentar baseline

### Fase 1: Documentación
- [ ] Crear carpeta `docs/`
- [ ] Crear `docs/README.md`
- [ ] Crear `docs/SETUP.md`
- [ ] Crear `docs/TESTING.md`
- [ ] Crear `docs/ENVIRONMENT.md`
- [ ] Crear `docs/ARCHITECTURE.md`
- [ ] Migrar contenido de archivos existentes
- [ ] Eliminar 13 archivos redundantes de raíz
- [ ] Actualizar `README.md` raíz
- [ ] Verificar todos los enlaces funcionan

### Fase 2: Tests
- [ ] Crear `tests/helpers.ts`
- [ ] Migrar funciones de helpers/
- [ ] Simplificar `tests/setup.ts`
- [ ] Habilitar tests de componentes en vitest.config.ts
- [ ] Ejecutar tests y verificar estabilidad
- [ ] Eliminar 6 archivos de helpers/
- [ ] Eliminar 2 scripts redundantes

### Fase 3: Configuración
- [ ] Actualizar `.env.example`
- [ ] Simplificar `.env.development`
- [ ] Eliminar `.env.test.example`
- [ ] Actualizar scripts en package.json
- [ ] Verificar npm install funciona
- [ ] Verificar npm run dev funciona
- [ ] Verificar npm run test:unit funciona
- [ ] Verificar npm run test:integration funciona

### Fase 4: Limpieza
- [ ] Eliminar `fix-tests.sh`
- [ ] Eliminar `.backups/`
- [ ] Actualizar `.gitignore`
- [ ] Eliminar `private/public/`
- [ ] Eliminar `private/COMANDOS.md`
- [ ] Eliminar `private/RESUMEN_CONFIGURACION.md`

### Fase 5: Idiomas (Opcional)
- [ ] Decidir: español vs inglés
- [ ] Renombrar carpetas (si aplica)
- [ ] Crear redirecciones
- [ ] Actualizar imports
- [ ] Verificar build

### Fase 6: Finalización
- [ ] Ejecutar lint
- [ ] Ejecutar tests:unit
- [ ] Ejecutar tests:integration
- [ ] Verificar build de producción
- [ ] Commit con mensaje claro
- [ ] Merge a main

---

## 🎉 CRITERIOS DE ÉXITO

La refactorización se considera exitosa cuando:

1. ✅ **Documentación:** Máximo 5 archivos en `docs/`, README raíz simplificado
2. ✅ **Tests:** Todos los tests existentes pasan, componentes habilitados
3. ✅ **Configuración:** Máximo 4 scripts de test en package.json
4. ✅ **Limpieza:** Raíz limpia (solo README, LICENSE, config esenciales)
5. ✅ **Build:** `npm run build` funciona sin errores
6. ✅ **Tests:** `npm run test:unit` y `npm run test:integration` pasan
7. ✅ **Funcionalidad:** Aplicación corre igual que antes

---

## ⚠️ RIESGOS Y MITIGACIÓN

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Tests dejan de funcionar | Media | Alto | Backup antes de empezar, probar por fases |
| Documentación pierde info | Baja | Medio | Migrar contenido, no recrear |
| Variables de entorno rotas | Baja | Alto | Verificar cada cambio, testear |
| Rutas cambian (SEO) | Baja | Medio | Redirecciones 301 si cambian URLs |
| Developer confusión | Media | Medio | README claro, anunciar cambios |

---

## 📞 PRÓXIMOS PASOS

1. **Revisar este documento** con el equipo
2. **Priorizar fases** (recomendado: Fase 1 → 2 → 3 → 4)
3. **Asignar responsables** por fase
4. **Crear issues/tareas** en sistema de tracking
5. **Establecer timeline** (estimado: 2-3 días de trabajo)
6. **Comunicar** al equipo sobre cambios estructurales

---

**Documento creado:** 2 de Abril de 2026  
**Versión:** 1.0  
**Estado:** Listo para implementación
