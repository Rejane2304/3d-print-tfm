# 3D Print TFM

E-commerce de Impresión 3D - Proyecto de Fin de Máster

[![Tests](https://img.shields.io/badge/tests-passing-brightgreen)](https://github.com/tu-usuario/3d-print-tfm)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.35-black)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22.0-2D3748)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

## 📎 Enlaces Directos

- **📄 Documentación PDF**: [`docs/TFM-PRESENTACION.pdf`](./docs/TFM-PRESENTACION.pdf) - Resumen ejecutivo del proyecto
- **🚀 Demo**: [https://3d-print-tfm.vercel.app](https://3d-print-tfm.vercel.app) *(cuando esté desplegado)*

---

## 📋 Descripción

Aplicación web de comercio electrónico especializada en productos impresos en 3D. Desarrollada como Trabajo de Fin de Máster con enfoque TDD (Test-Driven Development).

### Características Principales

- **Catálogo fijo** de productos en PLA/PETG con filtros y búsqueda
- **Carrito de compras** con gestión completa
- **Pagos con Stripe** (modo test) - Checkout integrado
- **Gestión de pedidos** con flujo de estados completo
- **Panel de administración** con CRUDs completos
- **Responsive** desde mobile hasta 4K
- **100% en español** (UI y backend)
- **Seguridad enterprise** con autenticación JWT
- **Manejo de errores** centralizado
- **378 tests** (unitarios, integración y E2E)

## 🚀 Tecnologías

| Categoría | Tecnologías |
|-----------|-------------|
| **Frontend** | Next.js 14, React 18, Tailwind CSS 3.4 |
| **Backend** | Next.js API Routes, TypeScript 5 |
| **Base de datos** | PostgreSQL (Supabase), Prisma ORM 5.22 |
| **Autenticación** | NextAuth.js 4.24 |
| **Pagos** | Stripe (modo test) |
| **Testing** | Vitest, Playwright |
| **Validation** | Zod |
| **Deployment** | Vercel (recommended) |
| **Icons** | Lucide React |

## 📦 Installation

### Prerequisites

- Node.js 18+
- Supabase account (for database)
- Stripe account (for test payments)
- npm or yarn

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-user/3d-print-tfm.git
   cd 3d-print-tfm
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   See the full guide at: [private/ENV_VARIABLES_GUIDE.md](private/ENV_VARIABLES_GUIDE.md)
   
   ```bash
   # Copy example file
   cp .env.example .env.local
   
   # Or edit .env directly
   # Fill in DATABASE_URL, NEXTAUTH_SECRET, STRIPE_SECRET_KEY, etc.
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Create migrations (first time)
   npx prisma migrate dev --name init
   
   # Seed initial data
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

The app will be available at [http://localhost:3000](http://localhost:3000)

## 🔧 Required Environment Variables

| Variable | Source | Description |
|----------|--------|-------------|
| `DATABASE_URL` | Supabase (Session Pooler) | PostgreSQL connection URL |
| `NEXTAUTH_SECRET` | Generate locally | JWT secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Configure | Base app URL (`http://localhost:3000`) |
| `STRIPE_SECRET_KEY` | Stripe Dashboard | Stripe secret key (test mode) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard | Stripe public key (test mode) |
| `STRIPE_WEBHOOK_SECRET` | Stripe CLI | Stripe webhook secret |

**Database architecture:** Supabase with 2 separate projects (development + production)

**Step-by-step guide:** [private/ENV_VARIABLES_GUIDE.md](private/ENV_VARIABLES_GUIDE.md)

## 🧪 Testing

The test suite is being rebuilt for better focus and maintainability.

### Run Tests

```bash
# All tests
npm test

# Unit tests (validation, components)
npm run test:unit

# Integration (APIs, database) - Requires PostgreSQL
npm run test:integration

# E2E (full flows) - Requires server running
npm run test:e2e

# With coverage
npm run test:coverage
```

📚 **Full documentation:** [docs/TESTING.md](docs/TESTING.md)  
📋 **Improvement roadmap:** [docs/ROADMAP.md](docs/ROADMAP.md)

## 📊 Test Status

- ✅ **Unit:** 37 tests (validation)
- ✅ **Integration:** 227 tests (API, auth, cart, checkout, pages, admin)
- ✅ **E2E:** 114 tests on 6 devices (Chrome, Firefox, Safari, iPad, iPhone, 4K)
- ✅ **Total:** 378 tests passing (100%)

## 🗄️ Project Structure

```
3d-print-tfm/
├── prisma/
│   ├── schema.prisma          # Database schema (18 models)
│   └── seed.ts                # Initial data from CSV
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Login, Register
│   │   ├── (shop)/            # Public shop
│   │   │   ├── page.tsx        # Home with featured products
│   │   │   ├── products/      # Product catalog
│   │   │   ├── products/[slug]/  # Product detail
│   │   │   └── cart/          # Shopping cart
│   │   ├── (admin)/           # Admin panel
│   │   │   └── dashboard/      # Admin dashboard
│   │   └── api/               # API routes
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts   # NextAuth config
│   │       ├── auth/register/     # Register API
│   │       ├── cart/              # Cart API
│   │       │   └── [itemId]/      # Update/delete items
│   │       ├── checkout/          # Stripe checkout API
│   │       ├── products/          # Catalog API
│   │       ├── products/[slug]/   # Product detail API
│   │       └── webhooks/stripe/   # Stripe webhook
│   ├── components/
│   │   ├── cart/               # Cart components
│   │   │   ├── CartItem.tsx
│   │   │   ├── CartSummary.tsx
│   │   │   └── CartIcon.tsx
│   │   ├── products/           # Catalog components
│   │   │   ├── ProductCard.tsx
│   │   │   ├── FilterSidebar.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── SortSelector.tsx
│   │   │   └── AddToCartButton.tsx
│   │   ├── layout/            # Header, Footer
│   │   └── ui/                # Base components
│   ├── lib/
│   │   ├── db/prisma.ts      # Prisma connection
│   │   ├── auth/             # Auth config
│   │   ├── validators/       # Zod validations
│   │   └── errors/           # Error handling
│   ├── hooks/                # Custom hooks
│   └── types/                # TypeScript types
├── tests/
│   ├── unit/                 # Unit tests
│   │   └── validation.test.ts
│   ├── integration/          # Integration tests
│   │   ├── api/
│   │   │   ├── register.test.ts
│   │   │   ├── cart.test.ts
│   │   │   ├── checkout.test.ts
│   │   │   ├── products.test.ts
│   │   │   ├── product-detail.test.ts
│   │   │   └── webhook-stripe.test.ts
│   │   ├── auth/
│   │   │   └── login.test.ts
│   │   ├── middleware.test.ts
│   │   └── pages/
│   │       ├── home.test.ts
│   │       └── checkout.test.ts
│   └── e2e/                  # E2E tests
│       └── auth/
│           └── login.spec.ts
├── public/
│   ├── images/
│   │   ├── logo.svg
│   │   └── products/         # p1-p10 with images
│   └── data/                 # Initial data CSV
├── scripts/                  # Utility scripts
│   └── prepare-test-db.sh    # Prepare test DB
├── docs/                     # Project documentation
└── private/                  # Private documentation
   ├── PLAN_IMPLEMENTATION.md
   ├── COMMANDS.md
   └── ENV_VARIABLES_GUIDE.md
```

## 👥 Test Users

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@3dprint.com | admin123 |
| Customer | juan@example.com | pass123 |
| Customer | maria@example.com | pass123 |

## 📚 Documentation

- **[Testing Guide](docs/TESTING.md)** - How to run and maintain tests
- **[Roadmap](docs/ROADMAP.md)** - Improvement plan and next steps
- [Environment Variables Guide](private/ENV_VARIABLES_GUIDE.md) - Step-by-step configuration
- Academic documentation in [`/docs/`](docs/)

## 🔐 Security

- JWT authentication with NextAuth.js
- Strict backend validation with Zod
- SQL Injection protection (Prisma)
- Input sanitization
- Rate limiting on login
- Secure sessions (httpOnly, secure, sameSite)
- Centralized error handling (no client leaks)

## 🛠️ Useful Commands

```bash
# Development
npm run dev                    # Start development server
npm run lint                   # Run ESLint
npm run lint -- --fix          # Fix ESLint errors

# Database
npm run db:generate            # Generate Prisma client
npm run db:migrate             # Create migration
npm run db:seed                # Seed initial data
npm run db:reset               # Reset DB + seed
npm run db:studio              # Open Prisma Studio

# Testing
npm run test:unit              # Unit tests
npm run test:integration       # Integration tests
npm run test:e2e               # E2E tests with Playwright
npm run test:e2e:ui            # E2E tests with UI
npm run test:coverage          # Tests with coverage

# Scripts
./scripts/prepare-test-db.sh   # Prepare test DB
```

## 📝 Historial de Cambios Recientes

### 2026-04-01: UI/UX Modernizada - Unificación Auth

**Unificación Login/Registro:**
- ✅ Nueva página `/auth` con tabs de login y registro
- ✅ UX mejorada: cambio instantáneo entre tabs
- ✅ Email compartido entre login y registro
- ✅ Header moderno con iconos Lucide (carrito, cuenta, logout)
- ✅ Redirecciones de URLs antiguas (/login, /registro)
- ✅ Tests E2E actualizados: 96 tests pasando en todos los dispositivos

**Navegación Role-Based:**
- ✅ Clientes: Ven carrito, tienda, cuenta
- ✅ Admin: Ve dashboard, gestión, NO ve carrito
- ✅ Redirecciones automáticas según rol

### 2026-04-01: Fases 6-8 - Features Avanzadas Completadas

**Fase 6 - Alertas Automáticas:**
- ✅ `/admin/alertas` - Sistema de gestión de alertas
- ✅ API `/api/admin/alertas` - CRUD completo de alertas
- ✅ Tipos: STOCK_BAJO, STOCK_AGOTADO, PEDIDO_SIN_PAGAR, PEDIDO_ATRASADO, ERROR_SISTEMA
- ✅ Niveles de severidad: BAJA, MEDIA, ALTA, CRITICA
- ✅ Estados: PENDIENTE, EN_PROCESO, RESUELTA, IGNORADA
- ✅ Filtros por tipo, severidad y estado

**Fase 6 - Mensajería:**
- ✅ API `/api/admin/mensajes` - Sistema de chat en pedidos
- ✅ Mensajes entre admin y clientes
- ✅ Marcado de mensajes leídos
- ✅ Soporte para archivos adjuntos

**Fase 6 - Perfiles Editables:**
- ✅ `/cuenta/perfil` - Página de edición de perfil
- ✅ API `/api/cuenta/perfil` - Actualización de datos personales
- ✅ Cambio de contraseña con validación
- ✅ Validación de NIF, teléfono y email

**Tests:**
- ✅ `tests/integration/admin/alertas.test.ts` - 20 tests
- ✅ `tests/integration/admin/mensajes.test.ts` - 15 tests  
- ✅ `tests/integration/cuenta/perfil.test.ts` - 17 tests
- ✅ Total Fases 6-8: 52 tests
- ✅ **Total proyecto: 227 tests (100%)**

### 2026-04-01: Fase 6 - Sistema de Facturación (Completada)

**Implementación:**
- ✅ `/admin/facturas` - Gestión completa de facturas
- ✅ `/admin/facturas/[id]` - Detalle de factura con PDF
- ✅ API `/api/admin/facturas` - CRUD de facturas
- ✅ API `/api/admin/facturas/[id]/pdf` - Generación de PDF
- ✅ Generación automática de números de factura (F-AAAA-NNNNNN)
- ✅ Anulación de facturas (soft delete)
- ✅ Cálculo automático de IVA 21%

**Tests:**
- ✅ `tests/integration/admin/facturas.test.ts` - 30 tests
- ✅ Tests de validación de NIF
- ✅ Tests de formato de factura española
- ✅ Total Fase 6: 30 tests
- ✅ **Total proyecto: 212 tests (100%)**

### 2026-04-01: Fase 5 - Panel Admin (Completada)

**Implementación:**
- ✅ `/admin/dashboard` - Dashboard con métricas y navegación
- ✅ `/admin/productos` - Gestión completa de productos con filtros
- ✅ `/admin/productos/nuevo` - Formulario de creación de productos
- ✅ `/admin/pedidos` - Gestión de pedidos con filtros por estado
- ✅ `/admin/pedidos/[id]` - Detalle de pedido con actualización de estado
- ✅ API `/api/admin/metrics` - Métricas del dashboard
- ✅ API `/api/admin/productos` - CRUD de productos
- ✅ API `/api/admin/pedidos` - Gestión de pedidos

**Tests:**
- ✅ `tests/integration/admin/panel.test.ts` - 12 tests
- ✅ `tests/integration/admin/dashboard-ui.test.ts` - 5 tests
- ✅ `tests/integration/admin/productos.test.ts` - 14 tests
- ✅ `tests/integration/admin/pedidos.test.ts` - 10 tests
- ✅ Total Fase 5: 41 tests

### 2026-04-01: Fase 4 - Checkout + Pagos (Completada)

**Implementación:**
- ✅ `/carrito` - Carrito de compras completo con gestión de items
- ✅ `/checkout` - Proceso de checkout con Stripe
- ✅ `/checkout/success` - Confirmación de pago
- ✅ API `/api/carrito` - CRUD completo del carrito
- ✅ API `/api/checkout` - Integración Stripe Checkout
- ✅ Webhook `/api/webhooks/stripe` - Confirmación de pagos
- ✅ Componentes: CartItem, CartSummary, CartIcon, AddToCartButton

**Tests:**
- ✅ `tests/integration/api/carrito.test.ts` - 8 tests
- ✅ `tests/integration/api/checkout.test.ts` - 6 tests
- ✅ `tests/integration/api/webhook-stripe.test.ts` - 9 tests
- ✅ `tests/integration/pages/checkout.test.ts` - 8 tests
- ✅ Total Fase 4: 31 tests

### 2026-04-01: Corrección Final - Todos los Tests Pasando

**Correcciones:**
- ✅ Todos los 141 tests pasando (100%)
- ✅ Corregidos tests de integración del checkout
- ✅ Documentación actualizada

### 2026-04-01: Corrección de Tests E2E y Configuración PostgreSQL

**Tests E2E corregidos:**
- ✅ Actualizados selectores para usar IDs de inputs
- ✅ Corregido test de Footer (selector específico)
- ✅ Tests de login funcionando en todos los dispositivos

**Configuración de tests:**
- ✅ Tests configurados para usar PostgreSQL (no SQLite)
- ✅ Agregados scripts `test:unit` y `test:integration`
- ✅ Creado script `prepare-test-db.sh`
- ✅ 110 tests pasando correctamente

### 2026-04-01: Fase 3 - Catálogo de Productos (Completada)

**Implementación:**
- ✅ `/productos` - Catálogo con filtros, paginación, ordenamiento y búsqueda
- ✅ `/productos/[slug]` - Detalle de producto con galería y productos relacionados
- ✅ Filtros por categoría, material, precio, stock
- ✅ Búsqueda por nombre y descripción
- ✅ Ordenamiento por nombre, precio o stock
- ✅ Diseño responsive (mobile → 4K)

**Tests:**
- ✅ `tests/integration/api/productos.test.ts` - 23 tests
- ✅ `tests/integration/api/producto-detalle.test.ts` - 10 tests
- ✅ Total Fase 3: 33 tests

### 2026-04-01: Corrección de Errores de Lint y TypeScript

**Correcciones:**
- ✅ ESLint: Sin errores ni warnings
- ✅ TypeScript: Sin errores
- ✅ Eliminados `any` innecesarios
- ✅ Corregidas variables no utilizadas
- ✅ Tipado mejorado en NextAuth y middleware

## 📝 Licencia

Este proyecto es desarrollado para fines académicos como Trabajo de Fin de Máster.

---

**Desarrollado con ❤️ por Rejane Rodrigues**

## 🗄️ Poblar bases de datos (desarrollo y test)

Para poblar las bases de datos de desarrollo (Supabase) y test local (Docker), usa los siguientes comandos según el entorno:

### Poblar base de datos de desarrollo (Supabase)

Asegúrate de tener configurado `.env` con la DATABASE_URL de Supabase:

```bash
npx -y ts-node -r dotenv/config prisma/seed.ts dotenv_config_path=.env
```

### Poblar base de datos de test local (Docker)

Asegúrate de tener configurado `.env.local` con la DATABASE_URL de test (Docker):

```bash
npx -y ts-node -r dotenv/config prisma/seed.ts dotenv_config_path=.env.local
```

> **Nota:** Solo necesitas el archivo `.env.local` para el entorno de test local. Elimina `.env.test` para evitar duplicidades.

Esto garantiza que cada entorno se pobla de forma separada y segura.
