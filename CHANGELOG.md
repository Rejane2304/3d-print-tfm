# Changelog - 3D Print TFM

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.1.0] - 2026-04-22

### 🚀 Mejoras Arquitectónicas - Data Fetching Moderno

Esta versión introduce una arquitectura moderna de data fetching con React Query y un API Client centralizado.

### ✨ Nuevas Características

#### 🌐 API Client Centralizado

- **Cliente HTTP fetch** centralizado en `/src/lib/api/client.ts` (471 líneas)
- **Manejo de errores** con clases `ApiError`, `ApiTimeoutError`, `ApiNetworkError`
- **Retries automáticos** con backoff exponencial (hasta 3 intentos)
- **CSRF protection** mediante tokens en headers
- **Timeouts configurables** (default: 30 segundos)
- **Mensajes de error amigables** para usuarios

```typescript
// Ejemplo de uso
import { apiClient, isApiError } from '@/lib/api/client';

const products = await apiClient.get('/api/products');
const newOrder = await apiClient.post('/api/orders', orderData);
```

#### ⚛️ React Query (TanStack Query)

- **Integración completa** con `@tanstack/react-query` v5
- **Caché inteligente** con staleTime: 5 minutos, gcTime: 10 minutos
- **Refetching automático** al reconectar a red
- **Optimistic Updates** para UX fluida en carrito
- **Invalidación automática** de queries tras mutations

```typescript
// En componentes
const { data: products, isLoading, error } = useProducts();
const { mutate: addToCart, isPending } = useAddToCart();
```

#### 🔔 Sistema de Notificaciones (Sonner)

- **Toast notifications** globales con `sonner`
- **Promises con loading state** integrado
- **Tipos**: success, error, warning, info
- **Posición**: bottom-right por defecto

```typescript
toast.success('Producto añadido al carrito');
toast.promise(saveData(), {
  loading: 'Guardando...',
  success: 'Guardado exitoso',
  error: 'Error al guardar',
});
```

#### 💀 Loading States (Skeletons)

- **Componentes Skeleton** reutilizables para todas las páginas
- **Consistencia visual** durante carga de datos
- **Ubicación**: `/src/components/ui/skeletons/`
- **Cobertura**: Productos, carrito, checkout, órdenes, admin

#### 🛡️ Error Boundaries

- **Manejo de errores por área** con fallback UI
- **Captura de errores** en componentes React
- **UI de recuperación** con opción de retry
- **Logging de errores** para debugging

#### 📱 Service Worker (PWA)

- **Soporte offline básico** con Service Worker
- **Precache** de assets estáticos
- **Notificaciones push** preparadas
- **Instalación como app** en móviles/escritorio

#### ♿ Accesibilidad (A11y)

- **Skip links** para navegación rápida
- **Focus traps** en modales y drawers
- **ARIA labels** en todos los componentes interactivos
- **Contraste validado** WCAG 2.1 AA compliant
- **Keyboard navigation** completa sin mouse

### 🗂️ Nueva Estructura de Archivos

```
src/
├── lib/
│   ├── api/
│   │   ├── client.ts          # API Client (471 líneas)
│   │   ├── services/          # Servicios API
│   │   └── hooks.ts           # Hooks legacy
│   └── query-client.ts        # React Query config
├── hooks/
│   └── queries/               # React Query hooks
│       ├── useProducts.ts
│       ├── useCart.ts
│       ├── useOrders.ts
│       ├── useUser.ts
│       └── useCheckout.ts
├── components/
│   ├── providers/
│   │   ├── QueryProvider.tsx  # React Query provider
│   │   └── ToastProvider.tsx  # Sonner provider
│   └── ui/skeletons/          # Loading states
└── types/
    └── api.ts                 # Tipos API (751 líneas)
```

### 🔧 Hooks de React Query

| Hook               | Descripción                                |
| ------------------ | ------------------------------------------ |
| `useProducts`      | Fetch y gestión de productos con filtros   |
| `useCart`          | Gestión del carrito con optimistic updates |
| `useOrders`        | Historial de pedidos del usuario           |
| `useUser`          | Datos del usuario y perfil                 |
| `useCheckout`      | Proceso de checkout con validaciones       |
| `useAdminOrders`   | Gestión de pedidos en admin                |
| `useAdminProducts` | Gestión de productos en admin              |

### 📦 Tipos API Compartidos

- **751 líneas** de tipos TypeScript estandarizados
- **Responses/Requests** para todos los endpoints
- **Enums** para códigos de error y estados
- **Reutilización** entre frontend y backend

### 🧪 Tests Actualizados

- Tests unitarios para API Client
- Tests de integración para React Query hooks
- Tests E2E actualizados para nuevos flujos

---

## [1.3.0] - 2026-04-24

### 🔧 Hotfixes - Día de Entrega

Esta versión corrige errores críticos de conexión a base de datos y estabiliza la aplicación para la entrega final.

### 🐛 Correcciones Críticas

#### Gestión de Conexiones a Base de Datos

- **EMAXCONNSESSION Fix**: Solucionado error de "max clients reached" en Supabase
- **Desconexión explícita**: Añadido `await prisma.$disconnect()` en APIs críticas
- **Archivos actualizados**:
  - `/api/admin/analytics`
  - `/api/categories`
  - `/api/products`
  - `/api/site-config`

#### Server Components Error - Digest Fixes

- **Digest 2487300856**: Corregido error en panel admin (hydration mismatch)
- **Digest 3994233889**: Corregido error en página de facturas
- **Digest 69983904**: Estabilizada carga de páginas con datos dinámicos

#### Sistema de Impresión de Facturas

- **Layout unificado**: Botón "Imprimir" ahora usa el mismo layout que "Descargar PDF"
- **Sin bucles infinitos**: Corregido auto-print que causaba bloqueos
- **ClientOnly wrapper**: Añadido para evitar hydration errors

### 📋 Cambios Técnicos

| Archivo                                         | Cambio                                        |
| ----------------------------------------------- | --------------------------------------------- |
| `src/lib/db/prisma.ts`                          | Middleware de retry para errores de conexión  |
| `src/app/api/admin/analytics/route.ts`          | Desconexión explícita post-query              |
| `src/app/api/categories/route.ts`               | Desconexión explícita post-query              |
| `src/app/api/products/route.ts`                 | Desconexión explícita post-query              |
| `src/app/api/site-config/route.ts`              | Desconexión explícita post-query              |
| `src/app/admin/dashboard/page.tsx`              | ClientOnly para evitar SSR issues             |
| `src/app/(shop)/account/invoices/[id]/page.tsx` | ClientOnly wrapper + suppressHydrationWarning |

---

## [1.2.0] - 2026-04-23

### 💰 Precios con IVA Incluido y Flujo de Checkout Mejorado

Esta versión corrige la visualización de precios para mostrar siempre IVA incluido y mejora la estabilidad del flujo de checkout.

### ✨ Mejoras

#### 💵 Precios con IVA Incluido

- **Todos los precios mostrados al cliente incluyen IVA (21%)**
- **API del carrito** devuelve precios con IVA
- **ProductCard** muestra precios con IVA incluido
- **Página de detalle de producto** con precios con IVA
- **Carrito y Checkout** sincronizados con IVA
- **Función `calculatePriceWithVAT()`** en `lib/constants/tax.ts` para cálculo preciso

#### 🛒 Checkout Mejorado

- **Resumen del pedido simplificado** sin duplicación de IVA
- **Títulos diferenciados**: "Artículos en tu pedido" y "Resumen del pedido"
- **Cálculo de envío** basado en subtotal con IVA
- **PayPal y Stripe** estandarizados para usar precios con IVA
- **Redirección corregida** al carrito cuando no hay items

#### 🧪 Tests Actualizados

- **Tests de integración** actualizados para reflejar precios con IVA
- **96 tests de integración** pasando
- **Cálculo de subtotal** ajustado en tests del carrito

### 📋 Cambios Técnicos

| Archivo                                        | Cambio                             |
| ---------------------------------------------- | ---------------------------------- |
| `src/app/api/cart/route.ts`                    | Devuelve precios con IVA           |
| `src/components/cart/CartItem.tsx`             | Muestra precios con IVA            |
| `src/components/cart/CartSummary.tsx`          | Resumen simplificado               |
| `src/app/checkout/components/OrderSummary.tsx` | Títulos diferenciados              |
| `src/app/products/[slug]/page.tsx`             | Precios con IVA en detalle         |
| `src/components/products/ProductCard.tsx`      | Precios con IVA en tarjetas        |
| `src/lib/constants/tax.ts`                     | `calculatePriceWithVAT()` mejorado |
| `src/app/api/payments/paypal/create/route.ts`  | Estandarizado con IVA              |
| `src/app/api/payments/stripe/create/route.ts`  | Estandarizado con IVA              |

---

## [1.0.0] - 2026-04-22

### 🎉 Versión Final - TFM Completado

Esta versión representa la entrega final del Trabajo de Fin de Máster - E-commerce de Impresión 3D.

### ✨ Características Implementadas

#### 🏪 Tienda Pública

- **Página de Inicio** con productos destacados y hero section
- **Catálogo de Productos** con filtros avanzados (categoría, material, precio, stock)
- **Búsqueda de Productos** por nombre y descripción
- **Detalle de Producto** con galería de imágenes, especificaciones y reseñas
- **Carrito de Compras** persistente con gestión completa de items
- **Checkout** con 4 métodos de pago simulados (CARD, PAYPAL, BIZUM, TRANSFER)
- **Sistema de Cupones** de descuento (PERCENTAGE, FIXED, FREE_SHIPPING)
- **Página de FAQs** pública con búsqueda y categorías
- **Autenticación Unificada** (`/auth`) con tabs de login/registro

#### 👔 Panel de Administración (13 Módulos)

1. **Dashboard** - Métricas y estadísticas del negocio
2. **Productos** - CRUD completo con imágenes y traducciones
3. **Categorías** - CRUD con imágenes y orden de visualización
4. **Pedidos** - Gestión de estados y detalles completos
5. **Clientes** - Gestión de usuarios y roles
6. **Inventario** - Control de stock con movimientos y alertas
7. **Facturas** - Generación de PDFs con numeración automática
8. **Cupones** - Códigos de descuento configurables
9. **Reseñas** - Moderación de opiniones de clientes
10. **FAQs** - Gestión de preguntas frecuentes
11. **Envíos** - Zonas de envío por código postal
12. **Configuración** - Datos de la empresa editables
13. **Alertas** - Sistema de alertas automáticas

#### 👤 Cuenta de Usuario

- **Mis Pedidos** - Historial completo con facturas
- **Mis Reseñas** - Gestión de reseñas del usuario
- **Mis Direcciones** - Gestión de direcciones de envío
- **Mi Perfil** - Edición de datos personales y cambio de contraseña

#### 🔧 Sistema de Traducción

- **Backend Translation** - BD en inglés, UI en español
- **Diccionarios** de productos, categorías, enums, FAQs
- **Traducción automática** en API routes

#### ⚡ Sistema de Tiempo Real

- **EventStore** - Persistencia de eventos PostgreSQL (7 días retención)
- **WebSocket** - Notificaciones instantáneas con polling (3s)
- **Eventos**: order:new, order:status:updated, stock:updated, stock:low
- **Rooms**: Admin recibe todos, usuarios solo los suyos
- **Multi-tab**: Todas las pestañas reciben eventos
- **Offline mode**: Acumulación de eventos al reconectar
- **Notificaciones visuales**: Badge + panel deslizable

### 🧪 Testing

```
Total: 395 tests (100% passing)
├── Unit Tests: 299
├── Integration Tests: 96
└── E2E Tests: 91 (multi-device)

Cobertura: 80%+ objetivo alcanzado
```

- Tests unitarios con Vitest
- Tests de integración con testcontainers (PostgreSQL real)
- Tests E2E con Playwright en 6 dispositivos

### 🔐 Seguridad

- **Autenticación**: JWT con NextAuth.js, sesiones httpOnly/secure/sameSite
- **Autorización**: RBAC (CUSTOMER/ADMIN) con middleware
- **Contraseñas**: bcrypt con 12 salt rounds, complejidad reforzada (10+ chars + símbolos)
- **Rate Limiting**: 5 intentos/15min login, 3 registros/hora, 3 cambios/hora
- **Account Lockout**: 5 intentos fallidos = 30 minutos bloqueo
- **Historial**: Prevención de reúso de últimas 5 contraseñas
- **Validación**: Bloqueo de 80+ contraseñas comunes + Have I Been Pwned API
- **Indicador**: Barra de fortaleza en tiempo real
- **Prevenciones**: SQL Injection (Prisma), XSS, CSRF

### ⚡ Performance

- Lighthouse scores 90+ en todas las páginas
- Core Web Vitals optimizados
- Code splitting y lazy loading
- Imágenes optimizadas con Next.js Image

### 📝 Documentación

- **docs/**: Documentación pública en inglés
  - PROJECT-SUMMARY.md
  - TESTING.md
  - 10-deployment-guide.md
  - Documentación académica (01-09)

### 🗃️ Base de Datos

- **18 modelos** de entidades
- **Seed data** completo:
  - 10 usuarios (incluyendo admin)
  - 5 categorías
  - 10 productos con imágenes
  - 15 reseñas
  - 4 cupones de ejemplo
  - 9 direcciones
  - 10 pedidos de ejemplo
  - 7 facturas

### 🛠️ Tecnologías

- **Framework**: Next.js 14.2.35 con App Router
- **React**: 18
- **ORM**: Prisma 5.22.0
- **Base de Datos**: PostgreSQL (Supabase)
- **Autenticación**: NextAuth.js 4.24.13
- **Testing**: Vitest + Playwright
- **Estilos**: Tailwind CSS 3.4.1
- **Validación**: Zod 3.23.8

### 🐛 Correcciones Importantes

- **Fix**: Ordenamiento de productos en español (post-traducción)
- **Fix**: Importación MessageSquare en account layout
- **Fix**: Sistema de seed con datos reales
- **Fix**: Traducción completa de enums y estados

---

## [1.0.1] - 2026-04-08

### 🎨 Mejoras de UI/UX

- **Catálogo de Productos**: Rediseño moderno con nueva hero section y mejoras en ProductCard
- **Notificaciones en Tiempo Real**: Implementación de componente de notificaciones con badge y panel deslizable
- **DataTable Responsive**: Todas las tablas del panel de administración ahora son completamente responsive
- **ProductImageGallery**: Mejoras para prevenir el recorte de imágenes de productos

### 🔔 Sistema de Alertas

- **Nuevos tipos de alertas**: Implementación de 5 nuevos tipos de alertas automáticas:
  - `NEW_ORDER` - Notificación de nuevos pedidos
  - `NEGATIVE_REVIEW` - Alerta de reseñas negativas
  - `HIGH_VALUE_ORDER` - Alerta de pedidos de alto valor
  - `NEW_USER` - Notificación de nuevos usuarios registrados
  - `COUPON_EXPIRING` - Alerta de cupones próximos a expirar
- **Triggers automáticos**: Sistema de disparadores automáticos para generar alertas basado en eventos del sistema

### 🔧 Correcciones Técnicas

- **Fix API de Reseñas**: Corrección del método GET en el endpoint de reseñas de usuario
- **Fix Métodos de Pago**: Corrección en la visualización de "Transferencia" y "Bizum" en el checkout
- **Fix Traducción de Cupones**: Mejora en la visualización de cupones (ej: "5 € SAVE5")
- **Fix Modal de Facturas**: Mejoras en el texto del modal de disponibilidad de facturas

### 📄 Páginas Legales

Creación de todas las páginas legales requeridas:

- **Términos y Condiciones** (`/terms`)
- **Política de Privacidad** (`/privacy`)
- **Política de Cookies** (`/cookies`)
- **Aviso Legal** (`/legal`)

### ⚡ Responsive Design

- **Todas las tablas de administración**: Adaptación responsive completa para:
  - Tabla de productos
  - Tabla de pedidos
  - Tabla de clientes
  - Tabla de facturas
  - Tabla de cupones
  - Tabla de reseñas
  - Tabla de FAQs
  - Tabla de envíos
  - Tabla de inventario

---

## Historial de Desarrollo

### Fase 1: Fundamentos (Abril 2026)

- Setup Next.js 14 + TypeScript
- Configuración Prisma + PostgreSQL
- Modelo de datos (18 entidades)
- Sistema de autenticación básico
- 37 tests unitarios

### Fase 2: Autenticación y Navegación (Abril 2026)

- Página de login/registro unificada (/auth)
- Middleware de autorización
- Header y Footer responsive
- 16 tests E2E iniciales

### Fase 3: Catálogo de Productos (Abril 2026)

- Grid de productos con filtros
- Página de detalle de producto
- Búsqueda y paginación
- Carrito persistente
- 33 tests de integración

### Fase 4: Checkout y Pagos (Abril 2026)

- Checkout completo
- Sistema de pagos simulado
- Webhooks de confirmación
- Historial de pedidos
- 31 tests de integración

### Fase 5: Panel de Administración (Abril 2026)

- Dashboard con métricas
- CRUD de productos
- Gestión de pedidos
- 41 tests de admin

### Fase 6: Funcionalidades Avanzadas (Abril 2026)

- Sistema de facturación con PDFs
- Sistema de alertas automáticas
- Mensajería en pedidos
- Edición de perfiles
- 82 tests adicionales

### Fase 7: Módulos Adicionales (Abril 2026)

- Sistema de categorías con imágenes
- Sistema de cupones de descuento
- Sistema de reseñas con moderación
- Sistema de FAQs
- Gestión de envíos por zonas
- Configuración del sitio
- Control de inventario

### Fase 8: Calidad y Documentación (Abril 2026)

- Optimización de performance
- Accesibilidad WCAG 2.1 AA
- Testing multi-dispositivo (114 tests E2E)
- Documentación completa
- Preparación para entrega

---

## Notas

- Los pagos están **simulados** para el TFM (no requiere Stripe/PayPal real)
- El sistema de traducción funciona 100% en backend
- Base de datos seedeada con datos de ejemplo
- Listo para despliegue en Vercel + Supabase

---

**Autor**: Rejane Rodrigues  
**Proyecto**: TFM - Máster en Desarrollo de Software  
**Institución**: Universidad  
**Año**: 2026
