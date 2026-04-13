# AGENTS.md - 3D Print TFM

> Este archivo contiene información para agentes de IA que trabajan en este proyecto.

## 🚨 REGLAS CRÍTICAS DE SEGURIDAD - LECTURA OBLIGATORIA

### ⚠️ PROHIBIDO: Usar BD de Desarrollo/Producción para Tests

**Esta prohibición es INQUEBRANTABLE:**

- ❌ **NUNCA** usar `DATABASE_URL` de `.env` (Supabase) para tests
- ❌ **NUNCA** permitir que tests E2E toquen datos reales de usuarios
- ❌ **NUNCA** ejecutar `prisma migrate` o seed en BD de dev/prod
- ✅ **SIEMPRE** usar `DATABASE_URL` de `.env.test` (localhost:5433)
- ✅ **SIEMPRE** verificar que `DATABASE_URL` contiene "test" o "localhost" antes de ejecutar tests

### Estructura de Bases de Datos

| Entorno  | Base de Datos      | Ubicación               | Uso                    |
| -------- | ------------------ | ----------------------- | ---------------------- |
| **Test** | `3dprint_tfm_test` | localhost:5433 (Docker) | Tests E2E, Integración |
| **Dev**  | Supabase           | Cloud (PostgreSQL)      | Desarrollo local       |
| **Prod** | Supabase           | Cloud (PostgreSQL)      | Producción             |

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

**2024-XX-XX**: Tests E2E crearon productos en BD de desarrollo por configuración incorrecta de `DATABASE_URL`. Se implementaron validaciones adicionales.

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
