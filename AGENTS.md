# AGENTS.md - 3D Print TFM

> Este archivo contiene información para agentes de IA que trabajan en este proyecto.
> **Última actualización:** Abril 2026 (Día de Entrega)

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

| Feature                      | Estado        | Detalle                                                      |
| ---------------------------- | ------------- | ------------------------------------------------------------ |
| **Sistema Bilingüe**         | ✅ Completo   | Productos con campos `nameEs`/`nameEn`, etc.                 |
| **Migraciones Consolidadas** | ✅ Completo   | Una única migración `init_complete`                          |
| **Multi-Entorno BD**         | ✅ Completo   | Scripts por entorno (dev/prod/test)                          |
| **Tests**                    | ✅ 395+ tests | Unit (299) + Integration (96) + E2E (91+)                    |
| **SonarQube**                | ✅ Optimizado | Configuración anti-hang para archivos TypeScript             |
| **Seguridad BD**             | ✅ Activo     | Validación obligatoria en todos los tests                    |
| **Seed Multi-Entorno**       | ✅ Activo     | Confirmación para producción                                 |
| **API Client Centralizado**  | ✅ Completo   | Cliente HTTP con manejo de errores, retries, CSRF protection |
| **React Query**              | ✅ Completo   | TanStack Query v5 con caché de 5 minutos                     |
| **Tipos API Compartidos**    | ✅ Completo   | 751 líneas de tipos estandarizados en `/src/types/api.ts`    |
| **Toast System**             | ✅ Completo   | Notificaciones globales con sonner + ToastProvider           |
| **Loading States**           | ✅ Completo   | 14 archivos loading.tsx + SkeletonCard + LoadingSpinner      |
| **Error Boundaries**         | ✅ Completo   | 8 archivos error.tsx + ErrorMessage global                   |
| **Service Worker**           | ✅ Completo   | PWA con sw.js, manifest.json, registro automático            |
| **Lazy Loading**             | ✅ Completo   | Componentes pesados con dynamic imports                      |
| **Real-time**                | ✅ Activo     | SSE + Socket.io para notificaciones en tiempo real           |
| **Accesibilidad**            | ✅ Completo   | A11y audit + Skip Links + Focus Traps + Announcer            |
| **Documentación**            | ✅ Completo   | 13 archivos en /docs con guías y reportes                    |
| **Network Status**           | ✅ Completo   | Hook useNetworkStatus para detectar conexión                 |
| **ClientOnly**               | ✅ Completo   | Wrapper para componentes solo cliente                        |

### 📁 Archivos Clave

| Archivo                                           | Propósito                                      |
| ------------------------------------------------- | ---------------------------------------------- |
| `prisma/migrations/20260416100000_init_complete/` | Única migración consolidada                    |
| `prisma/seed.ts`                                  | Seed con datos bilingües                       |
| `scripts/reset-and-seed.ts`                       | Reset completo + seed                          |
| `scripts/seed-prod-with-confirmation.ts`          | Seed con confirmación PROD                     |
| `scripts/db-migrate-dev.ts`                       | Migraciones DEV (lee .env.local)               |
| `scripts/db-seed-dev.ts`                          | Seed DEV (lee .env.local)                      |
| `scripts/db-studio-dev.ts`                        | Prisma Studio DEV (lee .env.local)             |
| `scripts/db-reset-dev.ts`                         | Reset completo DEV (lee .env.local)            |
| `scripts/db-migrate-prod.ts`                      | Migraciones PROD (lee .env.production)         |
| `scripts/db-test-*.ts`                            | Scripts para BD de test (lee .env.test)        |
| `scripts/sonarqube-optimized-scan.sh`             | Análisis SonarQube anti-hang                   |
| `scripts/check-sonarqube.sh`                      | Verifica configuración SonarQube               |
| `src/lib/api/client.ts`                           | API Client centralizado (471 líneas)           |
| `src/lib/api/services/*.ts`                       | Servicios API (products, cart, orders, etc.)   |
| `src/lib/query-client.ts`                         | Configuración React Query                      |
| `src/types/api.ts`                                | Tipos compartidos API (751 líneas)             |
| `src/hooks/queries/*.ts`                          | React Query hooks (useProducts, useCart, etc.) |
| `src/components/providers/QueryProvider.tsx`      | Provider de React Query                        |
| `src/components/providers/ToastProvider.tsx`      | Provider global con sonner                     |
| `src/components/ui/skeletons/*.tsx`               | Componentes Skeleton                           |
| `src/components/ui/LoadingSpinner.tsx`            | Spinner de carga reutilizable                  |
| `src/components/ui/SkeletonCard.tsx`              | Card skeleton para productos                   |
| `src/components/ui/ErrorMessage.tsx`              | Componente de error global                     |
| `src/components/providers/ClientOnly.tsx`         | Wrapper para componentes solo cliente          |
| `src/hooks/useToast.ts`                           | Hook para mostrar toasts                       |
| `src/hooks/useNetworkStatus.ts`                   | Hook para detectar estado de conexión          |
| `src/hooks/useFocusTrap.ts`                       | Hook para atrapar focus en modales             |
| `src/hooks/useAnnouncer.ts`                       | Hook para anuncios de accesibilidad            |
| `public/sw.js`                                    | Service Worker PWA                             |
| `public/manifest.json`                            | Manifiesto PWA                                 |
| `src/lib/pwa/register-sw.ts`                      | Registro automático del Service Worker         |

---

## Arquitectura Actual

### Data Fetching: React Query + API Client

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ React Query │  │  API Client │  │   Components        │  │
│  │  (Cache)    │  │  (HTTP)     │  │   (UI)              │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Next.js API)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  API Routes │  │   Prisma    │  │   Validation        │  │
│  │  (RESTful)  │  │   ORM       │  │   (Zod)             │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (PostgreSQL)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Products   │  │   Orders    │  │   Users             │  │
│  │  Cart       │  │   Invoices  │  │   Reviews           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Características de Data Fetching

| Característica         | Implementación                                     | Beneficio                     |
| ---------------------- | -------------------------------------------------- | ----------------------------- |
| **Caché**              | React Query staleTime: 5min, gcTime: 10min         | Reduce peticiones al servidor |
| **Refetching**         | Refetch on reconnect, window focus disabled        | Datos frescos sin overhead    |
| **Retries**            | 3 reintentos con backoff exponencial               | Resiliencia ante fallos       |
| **Optimistic Updates** | UI se actualiza antes de confirmación del servidor | UX fluida                     |
| **Invalidación**       | Mutations invalidan queries automáticamente        | Consistencia de datos         |

### Sistema de Notificaciones (Sonner Toast)

```typescript
// Ejemplo de uso
toast.success('Producto añadido al carrito');
toast.error('Error al procesar el pago');
toast.promise(saveData(), {
  loading: 'Guardando...',
  success: 'Guardado exitoso',
  error: 'Error al guardar',
});
```

### Estado Global

| Estado           | Tecnología             | Persistencia      |
| ---------------- | ---------------------- | ----------------- |
| Datos Servidor   | React Query            | Caché en memoria  |
| Carrito Invitado | localStorage           | Navegador         |
| Carrito Usuario  | PostgreSQL             | BD + localStorage |
| Sesión           | NextAuth               | Cookie httpOnly   |
| Preferencias     | Context + localStorage | Navegador         |

### Performance

- **Service Worker**: Soporte offline básico con precache de assets estáticos
- **Lazy Loading**: Componentes pesados cargados dinámicamente
- **Optimistic Updates**: UI responde inmediatamente, sincroniza después
- **Image Optimization**: Next.js Image con WebP y lazy loading

### Accesibilidad (A11y)

- **Skip Links**: Navegación rápida para teclado
- **Focus Traps**: Modales atrapando focus
- **ARIA Labels**: Todos los componentes interactivos etiquetados
- **Contraste Validado**: WCAG 2.1 AA compliant
- **Keyboard Navigation**: Navegación completa sin mouse

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
npm run test:e2e         # 91+ tests

# Build con verificación
cd /Users/rejanerodrigues/MASTER/3d-print-tfm && npm run build
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
│   └── schema.prisma                        ← Schema actual (28 modelos)
├── scripts/
│   ├── reset-and-seed.ts                    ← Reset + seed
│   ├── seed-prod-with-confirmation.ts       ← Seed PROD
│   ├── seed-e2e.ts                          ← Seed para tests E2E
│   └── db-*.ts                              ← Scripts por entorno
├── src/
│   ├── app/                                 ← Next.js App Router
│   │   ├── (shop)/                          ← Tienda pública
│   │   ├── admin/                           ← Panel de administración
│   │   ├── api/                             ← API Routes (91+ endpoints)
│   │   ├── checkout/                        ← Checkout multi-paso
│   │   └── **/*.tsx                         ← loading.tsx / error.tsx (22 archivos)
│   ├── components/
│   │   ├── providers/
│   │   │   ├── QueryProvider.tsx            ← React Query provider
│   │   │   ├── PayPalProvider.tsx           ← PayPal provider
│   │   │   ├── ToastProvider.tsx            ← Provider global con sonner
│   │   │   └── ClientOnly.tsx               ← Wrapper para componentes cliente
│   │   ├── ui/
│   │   │   ├── skeletons/                   ← Componentes Skeleton
│   │   │   ├── LoadingSpinner.tsx           ← Spinner de carga
│   │   │   ├── SkeletonCard.tsx             ← Card skeleton
│   │   │   └── ErrorMessage.tsx             ← Componente de error global
│   │   ├── a11y/                            ← Componentes de accesibilidad
│   │   │   ├── SkipLink.tsx                 ← Skip link para navegación
│   │   │   ├── FocusTrap.tsx                ← Atrapar focus en modales
│   │   │   └── LiveAnnouncer.tsx            ← Anunciador para screen readers
│   │   ├── admin/                           ← Componentes admin
│   │   ├── cart/                            ← Componentes carrito
│   │   └── ...
│   ├── hooks/
│   │   ├── queries/                         ← React Query hooks
│   │   │   ├── useProducts.ts
│   │   │   ├── useCart.ts
│   │   │   ├── useOrders.ts
│   │   │   └── ...
│   │   ├── useCart.ts                       ← Hook legacy (migrando)
│   │   ├── useRealTime.ts                   ← WebSocket hooks
│   │   ├── useToast.ts                      ← Hook para notificaciones
│   │   ├── useNetworkStatus.ts              ← Hook para estado de red
│   │   ├── useFocusTrap.ts                  ← Hook para atrapar focus
│   │   └── useAnnouncer.ts                  ← Hook para anuncios A11y
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts                    ← API Client (471 líneas)
│   │   │   ├── services/                    ← Servicios API
│   │   │   └── hooks.ts                     ← Hooks de API legacy
│   │   ├── pwa/
│   │   │   └── register-sw.ts               ← Registro del Service Worker
│   │   ├── query-client.ts                  ← React Query config
│   │   ├── i18n/                            ← Traducciones bilingües
│   │   └── ...
│   └── types/
│       ├── api.ts                           ← Tipos API (751 líneas)
│       └── ...
├── docs/                                    ← Documentación del proyecto
│   ├── A11Y_AUDIT_REPORT.md                 ← Reporte de accesibilidad
│   ├── E2E_TEST_FIXES.md                    ← Guía de fixes E2E
│   ├── TESTING_STRATEGY.md                  ← Estrategia de testing
│   └── ... (13 archivos en total)
├── tests/
│   ├── unit/                                ← 299 tests
│   ├── integration/                         ← 96 tests
│   └── e2e/                                 ← 91+ tests (95.6% passing)
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

## API Client Usage

### Ejemplo Básico

```typescript
import { apiClient } from '@/lib/api/client';
import type { ProductResponse } from '@/types/api';

// GET request
const products = await apiClient.get<ProductResponse[]>('/api/products');

// POST request
const newProduct = await apiClient.post<ProductResponse>('/api/products', {
  nameEs: 'Soporte Móvil',
  nameEn: 'Phone Stand',
  // ...
});

// Con opciones
const data = await apiClient.get('/api/data', {
  timeout: 5000, // 5 segundos timeout
  retries: 1, // 1 reintento
});
```

### Manejo de Errores

```typescript
import { isApiError, getUserFriendlyErrorMessage } from '@/lib/api/client';

try {
  const result = await apiClient.post('/api/orders', orderData);
} catch (error) {
  if (isApiError(error)) {
    console.error('API Error:', error.status, error.code);
    toast.error(getUserFriendlyErrorMessage(error));
  }
}
```

### React Query Hooks

```typescript
import { useProducts } from '@/hooks/queries/useProducts';
import { useCart } from '@/hooks/queries/useCart';

// En componente
function ProductList() {
  const { data: products, isLoading, error } = useProducts();
  const { addItem, isAdding } = useCart();

  if (isLoading) return <ProductSkeleton />;
  if (error) return <ErrorBoundary error={error} />;

  return (
    <div>
      {products?.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={() => addItem(product.id)}
          isAdding={isAdding}
        />
      ))}
    </div>
  );
}
```

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

### Error 500 en endpoints de pagos (PayPal/Stripe)

**Causa:** Intentar leer `req.json()` dos veces (en el try y en el catch)

**Solución:** Almacenar el body en una variable fuera del try-catch:

```typescript
// ❌ INCORRECTO - Esto causa error 500
export async function POST(req: NextRequest) {
  try {
    const body = await req.json(); // Primera lectura
    // ... código ...
  } catch (error) {
    const body = await req.json().catch(() => ({})); // ¡ERROR! Segunda lectura
  }
}

// ✅ CORRECTO - Body guardado antes del try
export async function POST(req: NextRequest) {
  let requestBody = {};
  try {
    requestBody = await req.json(); // Leer una sola vez
    // ... código ...
  } catch (error) {
    const { orderId } = requestBody; // Reusar la variable
  }
}
```

**Archivos corregidos (Abril 2026):**

- `/src/app/api/payments/paypal/create/route.ts`
- `/src/app/api/payments/stripe/create/route.ts`

---

### Tests E2E fallan por selectores

**Causa:** Selectores CSS han cambiado o no son específicos suficientes

**Solución:** Usar selectores más robustos con atributos `data-testid`:

```typescript
// ✅ CORRECTO - Usar data-testid
await page.getByTestId('add-to-cart-button').click();
await page.getByTestId('product-card-123').waitFor();

// ❌ INCORRECTO - Selectores frágiles
await page.locator('button.bg-blue-500').click();
```

**Ver guía completa:** `/docs/E2E_TEST_FIXES.md`

---

### Hydration errors en componentes del cliente

**Causa:** Componentes que acceden a `window` o `localStorage` durante SSR

**Solución:** Usar `ClientOnly` wrapper o `useEffect` con `isClient`:

```typescript
import { ClientOnly } from '@/components/providers/ClientOnly';

// ✅ CORRECTO - Usar ClientOnly
<ClientOnly fallback={<Skeleton />}>
  <PayPalButton />
</ClientOnly>

// ✅ CORRECTO - Usar useEffect
const [isClient, setIsClient] = useState(false);
useEffect(() => setIsClient(true), []);
if (!isClient) return <Skeleton />;
```

---

### Service Worker no se registra

**Causa:** El SW necesita ser servido desde el root y estar en public/

**Solución:** Verificar que existan los archivos:

```bash
# Verificar archivos PWA
ls -la public/sw.js
ls -la public/manifest.json
```

El registro es automático en `src/lib/pwa/register-sw.ts` y se ejecuta en `_app.tsx`.

---

### Toasts no aparecen

**Causa:** ToastProvider no está montado o se llama fuera del provider

**Solución:** Verificar que `ToastProvider` esté en `_app.tsx` o `layout.tsx`:

```typescript
import { ToastProvider } from '@/components/providers/ToastProvider';

export default function RootLayout({ children }) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}
```

**Uso correcto del hook:**

```typescript
import { useToast } from '@/hooks/useToast';

const { toast } = useToast();
toast.success('¡Éxito!');
toast.error('Error al procesar');
```

---

## Contacto y Soporte

- **Autor:** Rejane Rodrigues
- **Proyecto:** TFM - Máster de Desarrollo con IA
- **Repositorio:** https://github.com/Rejane2304/3d-print-tfm

---

**NOTA:** Este archivo debe actualizarse cuando cambien las estructuras principales del proyecto.
