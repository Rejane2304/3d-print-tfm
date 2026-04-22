# Architecture Overview

## Visión General

3D Print TFM es una aplicación e-commerce full-stack construida con **Next.js 16**, **React 18** y **TypeScript**. La arquitectura sigue principios de **Domain-Driven Design** y **Clean Architecture**, con una clara separación de responsabilidades.

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    NEXT.JS (Frontend)                     │  │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────────────────┐  │  │
│  │  │   App     │  │  Client   │  │    Server Actions     │  │  │
│  │  │  Router   │  │ Components│  │    (API Calls)        │  │  │
│  │  └─────┬─────┘  └─────┬─────┘  └───────────┬───────────┘  │  │
│  │        │              │                    │              │  │
│  │  ┌─────▼──────────────▼────────────────────▼───────────┐  │  │
│  │  │              React Query (TanStack)                  │  │  │
│  │  │  • Cache (5 min stale)                              │  │  │
│  │  │  • Optimistic Updates                               │  │  │
│  │  │  • Background Refetching                            │  │  │
│  │  └────────────────────────┬────────────────────────────┘  │  │
│  │                           │                               │  │
│  │  ┌────────────────────────▼────────────────────────────┐  │  │
│  │  │              API Client Centralizado                 │  │  │
│  │  │  • HTTP Client (fetch)                              │  │  │
│  │  │  • Error Handling                                   │  │  │
│  │  │  • Retry Logic (3 attempts)                         │  │  │
│  │  │  • CSRF Protection                                  │  │  │
│  │  │  • Timeout (30s)                                    │  │  │
│  │  └────────────────────────┬────────────────────────────┘  │  │
│  └───────────────────────────┼────────────────────────────────┘  │
└───────────────────────────────┼───────────────────────────────────┘
                                │ HTTP/HTTPS
┌───────────────────────────────▼───────────────────────────────────┐
│                      SERVIDOR (Next.js)                            │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                      API Routes                               │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │ │
│  │  │    REST     │  │   Zod       │  │    Prisma ORM       │  │ │
│  │  │   Endpoints │  │ Validation  │  │    (PostgreSQL)     │  │ │
│  │  │   (91+)     │  │             │  │                     │  │ │
│  │  └──────┬──────┘  └─────────────┘  └─────────────────────┘  │ │
│  │         │                                                    │ │
│  │  ┌──────▼─────────────────────────────────────────────────┐  │ │
│  │  │                    Servicios                            │  │ │
│  │  │  • CartService        • OrderService                   │  │ │
│  │  │  • ProductService     • PaymentService                 │  │ │
│  │  │  • InvoiceService     • NotificationService            │  │ │
│  │  └────────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

## Data Flow (Flujo de Datos)

### 1. Lectura de Datos (Read Operations)

```
┌──────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────┐
│  React   │───▶│ React Query  │───▶│ API Client  │───▶│   API    │
Component  │◀───│   (Cache)    │◀───│  (HTTP)     │◀───│  Route   │
└──────────┘    └──────────────┘    └─────────────┘    └────┬─────┘
                                                             │
┌──────────┐    ┌──────────────┐    ┌─────────────┐         │
│   User   │◀───│  Skeletons   │◀───│  UI State   │◀────────┘
Interface  │    │  (Loading)   │    │  (React)    │
└──────────┘    └──────────────┘    └─────────────┘
```

### 2. Escritura de Datos (Write Operations)

```
┌──────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────┐
│  User    │───▶│   Mutation   │───▶│   Optimistic │───▶│   API    │
  Action   │    │ (React Query)│    │    Update    │    │  Route   │
└──────────┘    └──────────────┘    └─────────────┘    └────┬─────┘
                             │                              │
                             │    ┌─────────────┐           │
                             └───▶│ Invalidation│◀──────────┘
                                  │   (Cache)   │
                                  └─────────────┘
```

## Componentes Principales

### API Client (`/src/lib/api/client.ts`)

El API Client es el corazón del sistema de data fetching. Proporciona:

**Características:**

- **HTTP Methods**: GET, POST, PATCH, PUT, DELETE
- **Error Handling**: Clases especializadas para diferentes tipos de error
- **Retry Logic**: Hasta 3 intentos con backoff exponencial
- **CSRF Protection**: Tokens automáticos en headers
- **Timeout**: 30 segundos por defecto
- **Type Safety**: Respuestas tipadas con TypeScript

**Ejemplo:**

```typescript
const products = await apiClient.get<ProductResponse[]>('/api/products');
const order = await apiClient.post<OrderResponse>('/api/orders', data);
```

### React Query Integration (`/src/lib/query-client.ts`)

Configuración global de React Query:

```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos fresh
      gcTime: 10 * 60 * 1000, // 10 minutos en caché
      retry: 3, // 3 reintentos
      retryDelay: attempt => Math.min(1000 * 2 ** attempt, 30000),
      refetchOnWindowFocus: false, // No recargar al cambiar de pestaña
      refetchOnReconnect: true, // Sí recargar al reconectar
    },
    mutations: {
      retry: 1, // 1 reintento en mutaciones
    },
  },
});
```

### Custom Hooks (`/src/hooks/queries/`)

Hooks especializados por dominio:

| Hook               | Propósito            | Caché                |
| ------------------ | -------------------- | -------------------- |
| `useProducts`      | Fetch de productos   | 5 minutos            |
| `useProduct`       | Detalle de producto  | 5 minutos            |
| `useCart`          | Gestión del carrito  | No cache (real-time) |
| `useOrders`        | Historial de órdenes | 5 minutos            |
| `useUser`          | Perfil de usuario    | 5 minutos            |
| `useCheckout`      | Proceso de checkout  | No cache             |
| `useAdminOrders`   | Órdenes para admin   | 2 minutos            |
| `useAdminProducts` | Productos para admin | 2 minutos            |

### Cart System

Sistema de carrito dual-mode:

```
┌─────────────────────────────────────────────────────────────┐
│                    CART SYSTEM                               │
│                                                              │
│  ┌──────────────────┐      ┌──────────────────┐             │
│  │  Guest Cart      │      │  User Cart       │             │
│  │                  │      │                  │             │
│  │  localStorage    │      │  PostgreSQL      │             │
│  │  + React State   │      │  + API Sync      │             │
│  │                  │      │                  │             │
│  │  • Persistente   │      │  • Persistente   │             │
│  │  • Offline       │      │  • Cross-device  │             │
│  │  • No auth       │      │  • Auth required │             │
│  └──────────────────┘      └──────────────────┘             │
│           │                          │                      │
│           └──────────┬───────────────┘                      │
│                      │                                      │
│           ┌──────────▼──────────┐                          │
│           │   Login Event       │                          │
│           │   → Migration       │                          │
│           │   Guest → User      │                          │
│           └─────────────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

### State Management

| Estado                 | Tecnología                | Persistencia       | Scope      |
| ---------------------- | ------------------------- | ------------------ | ---------- |
| **Datos del Servidor** | React Query               | Memoria (caché)    | Global     |
| **Carrito**            | Context + localStorage/DB | Browser/PostgreSQL | User/Guest |
| **Sesión**             | NextAuth                  | Cookie httpOnly    | Global     |
| **UI State**           | React useState            | Memoria            | Component  |
| **Preferencias**       | Context + localStorage    | Browser            | User       |

### Error Handling

Estrategia de manejo de errores por capas:

```
┌─────────────────────────────────────────────────────────────┐
│                  ERROR HANDLING HIERARCHY                    │
│                                                              │
│  Layer 1: Error Boundary (UI Fallback)                       │
│     ↓                                                        │
│  Layer 2: React Query (Error State)                          │
│     ↓                                                        │
│  Layer 3: API Client (Network/HTTP Errors)                   │
│     ↓                                                        │
│  Layer 4: API Routes (Validation/Business Errors)            │
│     ↓                                                        │
│  Layer 5: Database (Constraint/Data Errors)                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Notification System

Sistema de notificaciones en tiempo real:

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Server     │──────▶│  Socket.io   │──────▶│   Client     │
│  Events      │      │   (WebSocket)│      │  Listeners   │
└──────────────┘      └──────────────┘      └──────┬───────┘
                                                   │
┌──────────────┐      ┌──────────────┐            │
│  EventStore  │◀─────│  PostgreSQL  │◀───────────┘
│  (Persist)   │      │  (Pub/Sub)   │
└──────────────┘      └──────────────┘
```

## Performance Optimizations

### 1. Caché Multi-Capa

```
┌────────────────────────────────────────────────────────────┐
│                    CACHE LAYERS                             │
│                                                             │
│  L1: React Query Cache (In-Memory)                         │
│      • staleTime: 5 min                                    │
│      • gcTime: 10 min                                      │
│                                                             │
│  L2: Browser Cache (HTTP)                                  │
│      • Cache-Control headers                               │
│      • ETag support                                        │
│                                                             │
│  L3: Service Worker (PWA)                                  │
│      • Precache static assets                              │
│      • Offline fallback                                    │
│                                                             │
│  L4: CDN (Vercel Edge)                                     │
│      • Global distribution                                 │
│      • Automatic optimization                              │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### 2. Optimistic Updates

Flujo de optimistic updates en carrito:

```typescript
// 1. UI se actualiza inmediatamente
const addToCart = useMutation({
  mutationFn: addItemToCart,

  // 2. Optimistic update
  onMutate: async newItem => {
    await queryClient.cancelQueries({ queryKey: ['cart'] });
    const previousCart = queryClient.getQueryData(['cart']);

    // 3. Actualizar caché optimistamente
    queryClient.setQueryData(['cart'], old => ({
      ...old,
      items: [...old.items, newItem],
    }));

    return { previousCart };
  },

  // 4. Rollback si falla
  onError: (err, newItem, context) => {
    queryClient.setQueryData(['cart'], context.previousCart);
    toast.error('Error al agregar al carrito');
  },

  // 5. Refetch para confirmar
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['cart'] });
  },
});
```

### 3. Lazy Loading

Componentes cargados dinámicamente:

```typescript
// Lazy load de componentes pesados
const ProductImageGallery = dynamic(
  () => import('@/components/products/ProductImageGallery'),
  {
    loading: () => <ProductImageGallerySkeleton />,
    ssr: false
  }
);

const PayPalButton = dynamic(
  () => import('@/components/payment/PayPalButton'),
  { ssr: false }
);
```

## Security Architecture

### Autenticación y Autorización

```
┌─────────────────────────────────────────────────────────────┐
│                  AUTHENTICATION FLOW                         │
│                                                              │
│  User                                                        │
│    │                                                         │
│    ▼                                                         │
│  ┌──────────────┐      ┌──────────────┐      ┌───────────┐  │
│  │   Login      │─────▶│  NextAuth.js │─────▶│  JWT      │  │
│  │   Form       │      │  (Server)    │      │  Token    │  │
│  └──────────────┘      └──────────────┘      └─────┬─────┘  │
│                                                    │         │
│                              ┌─────────────────────┘         │
│                              ▼                               │
│                        ┌──────────┐                          │
│                        │  Cookie  │                          │
│                        │ httpOnly │                          │
│                        │ Secure   │                          │
│                        │ SameSite │                          │
│                        └────┬─────┘                          │
│                             │                                │
│  ┌──────────────────────────▼────────────────────────────┐   │
│  │              AUTHORIZATION MIDDLEWARE                  │   │
│  │                                                        │   │
│  │  RBAC (Role-Based Access Control)                      │   │
│  │  • CUSTOMER: Acceso a shop y account                   │   │
│  │  • ADMIN: Acceso completo a admin panel                │   │
│  │                                                        │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Rate Limiting

```typescript
// Configuración de rate limiting
const rateLimitConfig = {
  login: { points: 5, duration: 15 * 60 }, // 5 intentos/15min
  register: { points: 3, duration: 60 * 60 }, // 3 registros/hora
  api: { points: 100, duration: 60 }, // 100 req/min
  payment: { points: 10, duration: 60 }, // 10 pagos/min
};
```

## Testing Strategy

### Pirámide de Tests

```
                    ▲
                   /│\
                  / │ \        E2E Tests (91+)
                 /  │  \       Playwright
                /   │   \      Flujos completos
               /────┼────\
              /     │     \     Integration Tests (96+)
             /      │      \    Vitest + PostgreSQL
            /       │       \   APIs + Database
           /────────┼────────\
          /         │         \  Unit Tests (299+)
         /          │          \ Vitest
        /           │           \ Lógica, Validators
       ─────────────┴─────────────
```

### Estrategia por Capa

| Capa           | Tipo de Test       | Framework                | Cobertura |
| -------------- | ------------------ | ------------------------ | --------- |
| **Components** | Unit + Integration | Testing Library + Vitest | 80%+      |
| **Hooks**      | Unit               | Testing Library + Vitest | 80%+      |
| **API Routes** | Integration        | Vitest + testcontainers  | 90%+      |
| **Services**   | Unit               | Vitest                   | 85%+      |
| **E2E Flows**  | E2E                | Playwright               | 19 tests  |

## Deployment

### Vercel (Producción)

```
┌─────────────────────────────────────────────────────────────┐
│                  VERCEL DEPLOYMENT                           │
│                                                              │
│  GitHub                                                      │
│    │                                                         │
│    │ Push to main                                            │
│    ▼                                                         │
│  ┌──────────────┐      ┌──────────────┐      ┌───────────┐  │
│  │   Vercel     │─────▶│    Build     │─────▶│  Deploy   │  │
│  │   (CI/CD)    │      │    (Next.js) │      │  (Edge)   │  │
│  └──────────────┘      └──────────────┘      └───────────┘  │
│                                                              │
│  Environment Variables:                                      │
│  • DATABASE_URL (Supabase)                                   │
│  • NEXTAUTH_SECRET                                           │
│  • Stripe/PayPal keys                                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Monitoreo

### Métricas Clave

| Métrica             | Herramienta      | Objetivo   |
| ------------------- | ---------------- | ---------- |
| **Performance**     | Lighthouse       | 90+ score  |
| **Core Web Vitals** | Vercel Analytics | LCP < 2.5s |
| **Error Rate**      | Sentry           | < 1%       |
| **Test Coverage**   | Vitest           | > 80%      |
| **Uptime**          | Vercel           | 99.9%      |

---

## Decisiones de Arquitectura

### ¿Por qué React Query?

- **Caché automática** sin configuración compleja
- **Sincronización** automática del estado
- **Optimistic updates** integrados
- **DevTools** para debugging
- **TypeScript first**

### ¿Por qué API Client propio?

- **Control total** sobre el manejo de errores
- **Retry logic** personalizada
- **CSRF protection** integrada
- **Type safety** end-to-end
- **Fácil testing** con mocks

### ¿Por qué no Redux/Zustand?

- **React Query** maneja estado del servidor
- **Context** es suficiente para estado local
- **Menos boilerplate** y complejidad
- **Mejor performance** con menos renders

---

## Evolución Futura

### Roadmap Técnico

1. **v1.2.0**: GraphQL opcional para queries complejas
2. **v1.3.0**: Redis para caché de sesiones
3. **v2.0.0**: Microservicios para pagos y notificaciones

### Escalabilidad

La arquitectura actual soporta:

- **10,000+ productos**
- **100,000+ usuarios**
- **1,000+ pedidos/día**

Para escalar más allá:

- Implementar Redis para caché
- Separar API en microservicios
- Usar CDN para assets
- Sharding de base de datos
