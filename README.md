# 3D Print TFM

<div align="center">

# 🖨️ E-commerce de Impresión 3D

[![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-Academic-orange.svg)](LICENSE)
[![Presentation](https://img.shields.io/badge/📹-Ver%20Presentación-red)](https://github.com/Rejane2304/3d-print-tfm/releases/download/v1.1.0-presentation/3D_Print_TFM__Un_Modelo_para_Apps_Web.mp4)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)](docs/TESTING.md)
[![Coverage](https://img.shields.io/badge/coverage-80%25-green.svg)](docs/TESTING.md)

**Trabajo de Fin de Máster - Máster de Desarrollo con IA**

🚀 **Demo en Vivo:** [https://3d-print-tfm.vercel.app](https://3d-print-tfm.vercel.app)

📹 **Presentación del Proyecto:** [Descargar Video MP4](https://github.com/Rejane2304/3d-print-tfm/releases/download/v1.1.0-presentation/3D_Print_TFM__Un_Modelo_para_Apps_Web.mp4)

</div>

---

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Características Principales](#características-principales)
- [Stack Tecnológico](#stack-tecnológico)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Instalación y Configuración](#instalación-y-configuración)
- [Uso y Comandos](#uso-y-comandos)
- [Testing y Calidad](#testing-y-calidad)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Documentación Técnica](#documentación-técnica)
- [Roadmap y Mejoras](#roadmap-y-mejoras)
- [Soporte y Contacto](#soporte-y-contacto)

---

## Descripción General

**3D Print TFM** es una aplicación web de comercio electrónico completa especializada en productos impresos en 3D. Desarrollada con un enfoque **Test-Driven Development (TDD)** y principios de **código limpio**, representa una solución enterprise-grade para la venta online de productos de impresión 3D.

### Filosofía del Proyecto

- **🎯 Tolerancia Cero:** Cero errores en ESLint, TypeScript y tests
- **🧪 Test-Driven Development:** 395+ tests (unitarios, integración, E2E)
- **🌍 Backend Translation:** Sistema bilingüe (ES/EN) con traducción en backend
- **🔒 Security First:** Enterprise-grade security con rate limiting, account lockout, validación de contraseñas
- **📱 Responsive Design:** Optimizado desde mobile (320px) hasta 4K (3840px)

### Estadísticas del Proyecto

| Métrica              | Valor                    |
| -------------------- | ------------------------ |
| **Líneas de Código** | **60,000+**              |
| **Archivos Fuente**  | **254+** (TS/TSX)        |
| **Endpoints API**    | **91+** RESTful          |
| **Tests**            | **395+** (80%+ coverage) |
| **Componentes UI**   | **50+**                  |
| **Modelos BD**       | **28** entidades         |
| **Módulos Admin**    | **16** CRUD completos    |

---

## Características Principales

### 🛒 E-commerce Completo

- **Catálogo:** 50+ productos en PLA/PETG con imágenes, categorías, filtros
- **Carrito:** Persistente (localStorage + DB), gestión de cantidades, cálculo de totales con IVA (21%)
- **Checkout:** Multi-paso, 4 métodos de pago, validación de direcciones, cupones de descuento
- **Pedidos:** Flujo completo (Pendiente → Confirmado → En preparación → Enviado → Entregado)

### 👨‍💼 Panel de Administración (16 Módulos)

| Módulo            | Funcionalidad                                                    |
| ----------------- | ---------------------------------------------------------------- |
| **Dashboard**     | Métricas de ventas, pedidos, clientes en tiempo real             |
| **Productos**     | CRUD completo, gestión de imágenes, stock, categorías            |
| **Pedidos**       | Gestión de estados, asignación de transportistas, seguimiento    |
| **Clientes**      | Perfiles, historial de compras, direcciones                      |
| **Facturas**      | Generación automática de PDFs, numeración correlativa, anulación |
| **Cupones**       | Descuentos por porcentaje/fijo/envío gratis, fechas de validez   |
| **Inventario**    | Control de stock, alertas automáticas, ajustes                   |
| **Alertas**       | Sistema de notificaciones configurables                          |
| **FAQs**          | Gestión de preguntas frecuentes                                  |
| **Envíos**        | Zonas de envío configurables, costos por región                  |
| **Categorías**    | CRUD jerárquico de categorías                                    |
| **Reseñas**       | Moderación de reviews de productos                               |
| **Devoluciones**  | Gestión de devoluciones y reembolsos                             |
| **Configuración** | Datos de la empresa, términos legales, cookies                   |

### 💳 Sistema de Pagos

- **Precios:** Con IVA incluido (21%) mostrados de forma transparente
- **Stripe:** Checkout real con tarjetas de prueba (4242 4242 4242 4242)
- **PayPal:** Integración completa con Smart Buttons
- **Bizum:** Simulación para mercado español
- **Transferencia:** Con instrucciones y referencia única
- **Webhooks:** Confirmación asíncrona de pagos

### 🔔 Sistema de Tiempo Real

- **Socket.io:** Notificaciones instantáneas
- **EventStore:** Persistencia de eventos en PostgreSQL
- **Alertas:** Stock bajo, nuevos pedidos, cambios de estado
- **Salas:** Por usuario, admin, producto

### 📄 Facturación

- **Automática:** Generación al entregar pedido
- **PDFs:** Diseño profesional con html2canvas + jsPDF
- **Numeración:** Correlativa por serie (F-2024-0001)
- **Anulación:** Soporte para facturas anuladas
- **Datos Fiscales:** Completos (empresa y cliente)

### 🆕 Nuevas Características (v1.1.0)

| Feature              | Descripción                                               |
| -------------------- | --------------------------------------------------------- |
| **API Client**       | Cliente HTTP centralizado con manejo de errores y retries |
| **React Query**      | Data fetching con caché automática y optimistic updates   |
| **Sonner Toast**     | Notificaciones globales con promesas                      |
| **Skeletons**        | Loading states consistentes en toda la app                |
| **Error Boundaries** | Manejo de errores por área con UI de fallback             |
| **Service Worker**   | Soporte offline básico (PWA)                              |
| **A11y Mejorada**    | Accesibilidad WCAG 2.1 AA compliant                       |

---

## Stack Tecnológico

### Core

| Tecnología       | Versión | Uso                                                      |
| ---------------- | ------- | -------------------------------------------------------- |
| **Next.js**      | ^16.2.4 | Framework full-stack con App Router (actualizado de v14) |
| **React**        | ^18.3.0 | Biblioteca UI                                            |
| **TypeScript**   | ^5.x    | Tipado estático                                          |
| **Tailwind CSS** | ^3.4.19 | Estilos utility-first                                    |
| **Node.js**      | 18+     | Runtime                                                  |

### Backend y Datos

| Tecnología         | Versión  | Uso                             |
| ------------------ | -------- | ------------------------------- |
| **PostgreSQL**     | 15+      | Base de datos principal         |
| **Prisma**         | ^5.22.0  | ORM y migraciones               |
| **NextAuth.js**    | ^4.24.13 | Autenticación JWT               |
| **bcrypt**         | ^5.x     | Hash de contraseñas (12 rounds) |
| **TanStack Query** | ^5.x     | Data fetching y caché           |
| **TanStack Query** | ^5.x     | Data fetching y caché           |

### Pagos

| Servicio          | Tipo     | Descripción                     |
| ----------------- | -------- | ------------------------------- |
| **Stripe**        | Real     | Checkout con tarjetas de prueba |
| **PayPal**        | Real     | Smart Buttons integrados        |
| **Bizum**         | Simulado | Para mercado español            |
| **Transferencia** | Manual   | Con referencia única            |

### Testing

| Framework           | Tipo               | Cobertura            |
| ------------------- | ------------------ | -------------------- |
| **Vitest**          | Unit + Integration | 80%+                 |
| **Playwright**      | E2E                | 91+ tests, 6 devices |
| **Testing Library** | React Testing      | Unitarios            |

### Seguridad y Calidad

| Herramienta   | Propósito                |
| ------------- | ------------------------ |
| **Zod**       | Validación de inputs     |
| **ESLint**    | Linting (max-warnings=0) |
| **Prettier**  | Formateo de código       |
| **Husky**     | Git hooks                |
| **SonarQube** | Análisis estático        |

---

## Arquitectura del Sistema

### Arquitectura de Data Fetching

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ React Query │  │  API Client │  │   Components        │  │
│  │  (Cache)    │  │  (HTTP)     │  │   (UI)              │  │
│  │  - staleTime│  │  - Timeouts │  │  - Skeletons        │  │
│  │  - gcTime   │  │  - Retries  │  │  - Error Boundaries │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Next.js API)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  API Routes │  │   Prisma    │  │   Validation        │  │
│  │  (91+)      │  │   ORM       │  │   (Zod)             │  │
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

### Características del Data Fetching

| Característica         | Implementación                              | Beneficio                     |
| ---------------------- | ------------------------------------------- | ----------------------------- |
| **Caché**              | React Query con staleTime: 5min             | Reduce peticiones al servidor |
| **Retries**            | 3 reintentos con backoff exponencial        | Resiliencia ante fallos       |
| **Optimistic Updates** | UI actualiza antes de confirmación          | UX fluida                     |
| **Invalidación**       | Mutations invalidan queries automáticamente | Consistencia de datos         |
| **Error Handling**     | Error boundaries por área                   | UX robusta                    |

### Flujo de Datos

1. **Frontend (Next.js App Router):** Server Components para SEO + Client Components para interactividad
2. **Data Fetching:** React Query con API Client centralizado
3. **Backend (Next.js API Routes):** RESTful APIs con validación Zod
4. **Base de Datos:** PostgreSQL con Prisma ORM y transacciones ACID
5. **Real-time:** Socket.io + PostgreSQL EventStore para notificaciones instantáneas
6. **Traducción:** Backend 100% - Frontend recibe español directamente

---

## Instalación y Configuración

### Prerrequisitos

- **Node.js:** 18.x o superior
- **PostgreSQL:** 14.x o superior (local o Supabase)
- **npm:** 9.x o superior
- **Git**

### Paso 1: Clonar e Instalar

```bash
# Clonar repositorio
git clone https://github.com/Rejane2304/3d-print-tfm.git
cd 3d-print-tfm

# Instalar dependencias
npm install
```

### Paso 2: Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env.local

# Editar .env.local con tus valores
```

**Variables Requeridas:**

```env
# Base de datos
DATABASE_URL="postgresql://user:password@localhost:5432/3dprint_tfm"
DIRECT_URL="postgresql://user:password@localhost:5432/3dprint_tfm"

# NextAuth
NEXTAUTH_SECRET="tu-secreto-jwt-generado-con-openssl"
NEXTAUTH_URL="http://localhost:3000"

# Stripe (modo test)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# PayPal (sandbox)
PAYPAL_CLIENT_ID="..."
PAYPAL_CLIENT_SECRET="..."
NEXT_PUBLIC_PAYPAL_CLIENT_ID="..."
```

### Paso 3: Configurar Base de Datos

```bash
# Generar cliente Prisma
npx prisma generate

# Setup completo (migraciones + seed)
npm run db:setup:dev
```

### Paso 4: Iniciar Servidor

```bash
# Modo desarrollo
npm run dev

# O con Turbopack (más rápido)
npm run dev -- --turbo
```

La aplicación estará disponible en: **http://localhost:3000**

---

## Uso y Comandos

### Desarrollo

```bash
npm run dev              # Iniciar servidor de desarrollo
npm run build            # Construir para producción
npm run type-check       # Verificar tipos TypeScript
npm start                # Iniciar servidor de producción
```

### Calidad de Código

```bash
npm run lint             # Ejecutar ESLint
npm run lint:fix          # Corregir errores ESLint automáticamente
npm run type-check        # Verificar tipos TypeScript
npm run format            # Formatear código con Prettier
npm run check-code        # Ejecutar lint + type-check
```

### Base de Datos

```bash
npm run db:generate       # Generar cliente Prisma
npm run db:migrate:dev    # Crear nueva migración en DEV
npm run db:setup:dev      # Setup completo en DEV (migraciones + seed)
npm run db:seed:dev       # Poblar con datos iniciales en DEV
npm run db:reset:dev      # Reset + seed (cuidado: borra datos)
npm run db:studio:dev     # Abrir Prisma Studio (GUI)
```

### Testing

```bash
# Tests unitarios
npm run test:unit

# Tests de integración (requiere PostgreSQL en localhost:5433)
npm run test:integration

# Tests E2E con Playwright
npm run test:e2e

# Todos los tests con cobertura
npm run test:coverage
```

### Docker (Opcional)

```bash
# Levantar PostgreSQL para tests
npm run test:docker:up

# Setup completo de tests
npm run test:docker:setup
```

---

## Testing y Calidad

### Suite de Tests Completa

| Tipo            | Framework           | Tests    | Cobertura            |
| --------------- | ------------------- | -------- | -------------------- |
| **Unitarios**   | Vitest              | 299+     | Validadores, helpers |
| **Integración** | Vitest + PostgreSQL | 96+      | APIs, base de datos  |
| **E2E**         | Playwright          | 91+      | Flujos completos     |
| **Total**       | -                   | **395+** | **80%+**             |

### Calidad de Código

- **ESLint:** 0 warnings, 0 errors (max-warnings=0)
- **TypeScript:** Strict mode, no implicit any
- **Prettier:** Formateo consistente
- **SonarQube:** Análisis estático integrado
- **Husky:** Pre-commit hooks para calidad

### Seguridad

- **Autenticación:** JWT con httpOnly/secure/sameSite cookies
- **Autorización:** RBAC (USER/ADMIN) con middleware
- **Contraseñas:** bcrypt (12 rounds), complejidad validada
- **Rate Limiting:** 5 intentos/15min para login
- **Account Lockout:** Bloqueo tras 5 fallos
- **Validación:** Zod para todos los inputs
- **Prevención:** SQL Injection (Prisma), XSS (escapado automático)

---

## Estructura del Proyecto

```
3d-print-tfm/
├── 📁 .agent/                 # Configuración de agentes AI
│   ├── SUBAGENTS.md
│   └── config/
│
├── 📁 .husky/                 # Git hooks
│   └── pre-commit
│
├── 📁 docs/                   # Documentación técnica
│   ├── TESTING.md
│   ├── ROADMAP.md
│   ├── ESTRUCTURA_CARPETAS.md
│   ├── PROJECT-SUMMARY.md
│   └── ...
│
├── 📁 prisma/                 # Base de datos
│   ├── schema.prisma          # 28+ modelos
│   ├── migrations/
│   └── seed.ts
│
├── 📁 scripts/                # Scripts utilitarios
│   ├── db-*.ts                # Scripts de BD por entorno
│   └── sonarqube-optimized-scan.sh
│
├── 📁 src/
│   ├── 📁 app/
│   │   ├── 📁 (shop)/         # Tienda pública
│   │   ├── 📁 admin/          # Panel de administración
│   │   ├── 📁 api/            # APIs RESTful (91+ endpoints)
│   │   └── 📁 auth/           # Autenticación
│   │
│   ├── 📁 components/
│   │   ├── admin/             # Componentes admin
│   │   ├── cart/              # Carrito
│   │   ├── checkout/          # Checkout
│   │   ├── providers/         # QueryProvider, etc.
│   │   ├── ui/skeletons/      # Loading states
│   │   └── ...
│   │
│   ├── 📁 hooks/
│   │   ├── queries/           # React Query hooks
│   │   │   ├── useProducts.ts
│   │   │   ├── useCart.ts
│   │   │   └── useOrders.ts
│   │   └── useRealTime.ts
│   │
│   ├── 📁 lib/
│   │   ├── api/               # API Client y servicios
│   │   │   ├── client.ts      # Cliente HTTP centralizado
│   │   │   └── services/      # Servicios API
│   │   ├── query-client.ts    # React Query config
│   │   ├── i18n/              # Traducciones
│   │   └── ...
│   │
│   └── 📁 types/              # Tipos TypeScript
│       └── api.ts             # Tipos API compartidos
│
├── 📁 tests/
│   ├── 📁 unit/               # Tests unitarios
│   ├── 📁 integration/        # Tests integración
│   └── 📁 e2e/                # Tests E2E
│
├── 📄 AGENTS.md               # Guía para agentes AI
├── 📄 CHANGELOG.md            # Historial de cambios
├── 📄 README.md               # Este archivo
└── 📄 package.json            # Dependencias y scripts
```

---

## Documentación Técnica

### Documentación Principal

| Documento                                                 | Descripción               | Ubicación |
| --------------------------------------------------------- | ------------------------- | --------- |
| **[AGENTS.md](AGENTS.md)**                                | Guía para agentes AI      | `/`       |
| **[TESTING.md](docs/TESTING.md)**                         | Guía completa de testing  | `/docs/`  |
| **[ROADMAP.md](docs/ROADMAP.md)**                         | Plan de mejoras y roadmap | `/docs/`  |
| **[ESTRUCTURA_CARPETAS.md](docs/ESTRUCTURA_CARPETAS.md)** | Estructura detallada      | `/docs/`  |
| **[PROJECT-SUMMARY.md](docs/PROJECT-SUMMARY.md)**         | Documentación académica   | `/docs/`  |
| **[TOLERANCIA-CERO.md](docs/TOLERANCIA-CERO.md)**         | Política de calidad       | `/docs/`  |

### Nuevos Documentos (v1.1.0)

| Documento           | Descripción                       |
| ------------------- | --------------------------------- |
| **API.md**          | Documentación de la API REST      |
| **ARCHITECTURE.md** | Arquitectura técnica detallada    |
| **DEVELOPMENT.md**  | Guía de desarrollo y convenciones |
| **DEPLOYMENT.md**   | Guía de despliegue                |

---

## Roadmap y Mejoras

### Completado ✅

- [x] Sistema de autenticación completo
- [x] Catálogo de productos con filtros
- [x] Carrito persistente
- [x] Checkout con 4 métodos de pago
- [x] Panel admin con 16+ módulos
- [x] Sistema de facturación automática
- [x] Notificaciones en tiempo real
- [x] Tests: 395+ con 80%+ coverage
- [x] Tolerancia cero en ESLint/TypeScript
- [x] **API Client centralizado**
- [x] **React Query para data fetching**
- [x] **Toast system con Sonner**
- [x] **Loading skeletons**
- [x] **Error boundaries**
- [x] **Service Worker para offline**
- [x] **Mejoras de accesibilidad**

### En Progreso 🚧

- [ ] Optimización de imágenes (WebP, lazy loading)
- [ ] Caché Redis para sesiones
- [ ] API GraphQL opcional

### Futuro 📋

- [ ] App móvil (React Native)
- [ ] Marketplace multi-vendedor
- [ ] Integración con ERPs
- [ ] IA para recomendaciones de productos

Ver [ROADMAP.md](docs/ROADMAP.md) para detalles completos.

---

## Soporte y Contacto

### Recursos

- 📚 **Documentación:** Ver carpeta `/docs/`
- 🤖 **Guía Agentes:** Ver [AGENTS.md](AGENTS.md)
- 🐛 **Issues:** [GitHub Issues](https://github.com/Rejane2304/3d-print-tfm/issues)

### Desarrollador

**Rejane Rodrigues**

- 🎓 Máster en Desarrollo de Aplicaciones con IA
- 📧 Email: [tu-email@example.com](mailto:tu-email@example.com)
- 💼 LinkedIn: [linkedin.com/in/rejane-rodrigues](https://linkedin.com/in/rejane-rodrigues)
- 🐙 GitHub: [github.com/Rejane2304](https://github.com/Rejane2304)

---

## Licencia

Este proyecto es desarrollado para fines académicos como **Trabajo de Fin de Máster**.

Copyright © 2026 Rejane Rodrigues. Todos los derechos reservados.

---

<div align="center">

**Desarrollado con ❤️ y muchas ☕ por Rejane Rodrigues**

**Última actualización:** Abril 2026 | **Versión:** 1.1.0

</div>
