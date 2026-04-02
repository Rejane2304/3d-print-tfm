# 3D Print TFM

E-commerce de Impresión 3D - Proyecto de Fin de Máster

[![Tests](https://img.shields.io/badge/tests-passing-brightgreen)](https://github.com/tu-usuario/3d-print-tfm)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.35-black)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22.0-2D3748)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

## 🌐 Enlaces del Proyecto

- **📊 Presentación TFM**: [Ver slides](https://docs.google.com/presentation/d/PLACEHOLDER) *(Próximamente)*
- **🚀 Demo en vivo**: [Ver despliegue](https://PLACEHOLDER.vercel.app) *(Próximamente)*

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
| **Validación** | Zod |
| **Despliegue** | Vercel (recomendado) |
| **Icons** | Lucide React |

## 📦 Instalación

### Requisitos previos

- Node.js 18+
- Cuenta en Supabase (para base de datos)
- Cuenta en Stripe (para pagos de prueba)
- npm o yarn

### Pasos

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/3d-print-tfm.git
   cd 3d-print-tfm
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   
   Ver guía completa en: [private/GUIA_VARIABLES_ENTORNO.md](private/GUIA_VARIABLES_ENTORNO.md)
   
   ```bash
   # Copiar archivo de ejemplo
   cp .env.example .env.local
   
   # O editar directamente .env
   # Completar DATABASE_URL, NEXTAUTH_SECRET, STRIPE_SECRET_KEY, etc.
   ```

4. **Configurar base de datos**
   ```bash
   # Generar cliente Prisma
   npx prisma generate
   
   # Crear migraciones (primera vez)
   npx prisma migrate dev --name init
   
   # Cargar datos iniciales
   npm run db:seed
   ```

5. **Iniciar servidor de desarrollo**
   ```bash
   npm run dev
   ```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## 🔧 Variables de Entorno Requeridas

| Variable | Origen | Descripción |
|----------|--------|-------------|
| `DATABASE_URL` | Supabase (Session Pooler) | URL de conexión PostgreSQL |
| `NEXTAUTH_SECRET` | Generar localmente | Secreto para JWT (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Configurar | URL base de la app (`http://localhost:3000`) |
| `STRIPE_SECRET_KEY` | Stripe Dashboard | Clave secreta de Stripe (modo test) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard | Clave pública de Stripe (modo test) |
| `STRIPE_WEBHOOK_SECRET` | Stripe CLI | Secreto para webhooks de Stripe |

**Arquitectura de base de datos:** Supabase con 2 proyectos separados (desarrollo + producción)

**Ver guía paso a paso:** [private/GUIA_VARIABLES_ENTORNO.md](private/GUIA_VARIABLES_ENTORNO.md)

## 🧪 Testing

La suite de tests está siendo reconstruida para ser más enfocada y mantenible.

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Unitarios (validaciones, componentes)
npm run test:unit

# Integración (APIs, base de datos) - Requiere PostgreSQL
npm run test:integration

# E2E (flujos completos) - Requiere servidor corriendo
npm run test:e2e

# Con cobertura
npm run test:coverage
```

📚 **Documentación completa:** [doc/TESTING.md](doc/TESTING.md)  
📋 **Roadmap de mejoras:** [doc/ROADMAP.md](doc/ROADMAP.md)

## 📊 Estado de Tests

- ✅ **Unitarios:** 37 tests (validaciones)
- ✅ **Integración:** 227 tests (API, auth, carrito, checkout, páginas, admin)
- ✅ **E2E:** 114 tests en 6 dispositivos (Chrome, Firefox, Safari, iPad, iPhone, 4K)
- ✅ **Total:** 378 tests pasando (100%)

## 🗄️ Estructura del Proyecto

```
3d-print-tfm/
├── prisma/
│   ├── schema.prisma          # Esquema de base de datos (18 modelos)
│   └── seed.ts                # Datos iniciales desde CSV
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Login, Registro
│   │   ├── (shop)/            # Tienda pública
│   │   │   ├── page.tsx        # Home con productos destacados
│   │   │   ├── productos/      # Catálogo de productos
│   │   │   ├── productos/[slug]/  # Detalle de producto
│   │   │   └── carrito/        # Carrito de compras
│   │   ├── (admin)/           # Panel admin
│   │   │   └── dashboard/      # Dashboard administrativo
│   │   └── api/               # API routes
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts   # Configuración NextAuth
│   │       ├── auth/registro/     # API de registro
│   │       ├── carrito/            # API del carrito
│   │       │   └── [itemId]/       # Actualizar/eliminar items
│   │       ├── checkout/           # API de checkout Stripe
│   │       ├── productos/          # API de catálogo
│   │       ├── productos/[slug]/  # API de detalle
│   │       └── webhooks/stripe/   # Webhook para pagos
│   ├── components/
│   │   ├── cart/               # Componentes del carrito
│   │   │   ├── CartItem.tsx
│   │   │   ├── CartSummary.tsx
│   │   │   └── CartIcon.tsx
│   │   ├── products/           # Componentes de catálogo
│   │   │   ├── ProductCard.tsx
│   │   │   ├── FilterSidebar.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── SortSelector.tsx
│   │   │   └── AddToCartButton.tsx
│   │   ├── layout/            # Header, Footer
│   │   └── ui/               # Componentes base
│   ├── lib/
│   │   ├── db/prisma.ts      # Conexión Prisma
│   │   ├── auth/             # Configuración auth
│   │   ├── validators/       # Validaciones Zod
│   │   └── errors/           # Manejo de errores
│   ├── hooks/                # Custom hooks
│   └── types/                # Tipos TypeScript
├── tests/
│   ├── unit/                 # Tests unitarios
│   │   └── validaciones.test.ts
│   ├── integration/          # Tests de integración
│   │   ├── api/
│   │   │   ├── registro.test.ts
│   │   │   ├── carrito.test.ts
│   │   │   ├── checkout.test.ts
│   │   │   ├── productos.test.ts
│   │   │   ├── producto-detalle.test.ts
│   │   │   └── webhook-stripe.test.ts
│   │   ├── auth/
│   │   │   └── login.test.ts
│   │   ├── middleware.test.ts
│   │   └── pages/
│   │       ├── home.test.ts
│   │       └── checkout.test.ts
│   └── e2e/                  # Tests E2E
│       └── auth/
│           └── login.spec.ts
├── public/
│   ├── images/
│   │   ├── logo.svg
│   │   └── products/         # p1-p10 con imágenes
│   └── data/                 # CSV con datos iniciales
├── scripts/                  # Scripts de utilidad
│   └── prepare-test-db.sh    # Preparar BD de test
├── doc/                      # Documentación TFM
└── private/                  # Documentación privada
    ├── PLAN_IMPLEMENTACION.md
    ├── COMANDOS.md
    └── GUIA_VARIABLES_ENTORNO.md
```

## 👥 Usuarios de Prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@3dprint.com | admin123 |
| Cliente | juan@example.com | pass123 |
| Cliente | maria@example.com | pass123 |

## 📚 Documentación

- **[Guía de Testing](doc/TESTING.md)** - Cómo ejecutar y mantener tests
- **[Roadmap](doc/ROADMAP.md)** - Plan de mejoras y próximos pasos
- [Guía de Variables de Entorno](private/GUIA_VARIABLES_ENTORNO.md) - Configuración paso a paso
- Documentación académica TFM en [`/doc/`](doc/)

## 🔐 Seguridad

- Autenticación JWT con NextAuth.js
- Validación estricta en backend con Zod
- Protección contra SQL Injection (Prisma)
- Sanitización de inputs
- Rate limiting en login
- Sesiones seguras (httpOnly, secure, sameSite)
- Manejo centralizado de errores (sin leaks al cliente)

## 🛠️ Comandos Útiles

```bash
# Desarrollo
npm run dev                    # Iniciar servidor de desarrollo
npm run lint                   # Ejecutar ESLint
npm run lint -- --fix          # Corregir errores de ESLint

# Base de datos
npm run db:generate            # Generar cliente Prisma
npm run db:migrate             # Crear migración
npm run db:seed                # Cargar datos iniciales
npm run db:reset               # Resetear BD + seed
npm run db:studio              # Abrir Prisma Studio

# Testing
npm run test:unit              # Tests unitarios
npm run test:integration       # Tests de integración
npm run test:e2e               # Tests E2E con Playwright
npm run test:e2e:ui            # Tests E2E con interfaz
npm run test:coverage          # Tests con cobertura

# Scripts
./scripts/prepare-test-db.sh   # Preparar BD de test
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
