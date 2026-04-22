# 3D Print TFM

<div align="center">

# 🖨️ E-commerce de Impresión 3D

[![Version](https://img.shields.io/badge/version-1.0.1-blue.svg)](CHANGELOG.md)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)](docs/TESTING.md)
[![Coverage](https://img.shields.io/badge/coverage-80%25-green.svg)](docs/TESTING.md)
[![License](https://img.shields.io/badge/license-Academic-orange.svg)](LICENSE)

**Trabajo de Fin de Máster - Máster en Desarrollo de Aplicaciones con Inteligencia Artificial**

🚀 **Demo en Vivo:** [https://3d-print-tfm.vercel.app](https://3d-print-tfm.vercel.app)

</div>

---

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Stack Tecnológico](#stack-tecnológico)
- [Características Principales](#características-principales)
- [Instalación y Configuración](#instalación-y-configuración)
- [Uso y Comandos](#uso-y-comandos)
- [Testing y Calidad](#testing-y-calidad)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Documentación Técnica](#documentación-técnica)
- [Seguridad](#seguridad)
- [Roadmap y Mejoras](#roadmap-y-mejoras)
- [Soporte y Contacto](#soporte-y-contacto)

---

## Descripción General

**3D Print TFM** es una aplicación web de comercio electrónico completa especializada en productos impresos en 3D. Desarrollada con un enfoque **Test-Driven Development (TDD)** y principios de **código limpio**, representa una solución enterprise-grade para la venta online de productos de impresión 3D.

### Filosofía del Proyecto

- **🎯 Tolerancia Cero:** Cero errores en ESLint, TypeScript y tests
- **🧪 Test-Driven Development:** 395+ tests (unitarios, integración, E2E)
- **🌍 Backend Translation:** Sistema 100% español con traducción en backend
- **🔒 Security First:** Enterprise-grade security con rate limiting, account lockout, validación de contraseñas
- **📱 Responsive Design:** Optimizado desde mobile (320px) hasta 4K (3840px)

### Estadísticas del Proyecto

| Métrica              | Valor                   |
| -------------------- | ----------------------- |
| **Líneas de Código** | **60,764**              |
| **Archivos Fuente**  | **254+** (TS/TSX)       |
| **Endpoints API**    | **91** RESTful          |
| **Tests**            | **395** (80%+ coverage) |
| **Componentes UI**   | **50+**                 |
| **Modelos BD**       | **28** entidades        |
| **Módulos Admin**    | **16** CRUD completos   |

---

## Arquitectura del Sistema

### Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (Navegador)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Next.js   │  │  React 18   │  │   Tailwind CSS      │  │
│  │  (App Router)│  │  (UI)       │  │   (Estilos)         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVIDOR (Next.js)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  API Routes │  │   Server    │  │     Middleware      │  │
│  │  (62+ endpoints)│  │   Actions   │  │   (Auth/Security)   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATOS Y SERVICIOS                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  PostgreSQL │  │  Prisma ORM │  │  Stripe/PayPal     │  │
│  │  (Supabase) │  │  (24 models)│  │  (Pagos)            │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Socket.io   │  │  EventStore │  │  PDF Generation    │  │
│  │ (Real-time) │  │  (PostgreSQL)│  │  (html2canvas)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de Datos

1. **Frontend (Next.js App Router):** Server Components para SEO + Client Components para interactividad
2. **Backend (Next.js API Routes):** RESTful APIs con validación Zod
3. **Base de Datos:** PostgreSQL con Prisma ORM y transacciones ACID
4. **Real-time:** Socket.io + PostgreSQL EventStore para notificaciones instantáneas
5. **Traducción:** Backend 100% - Frontend recibe español directamente

---

## Stack Tecnológico

### Core

| Tecnología       | Versión | Uso                                 |
| ---------------- | ------- | ----------------------------------- |
| **Next.js**      | 16.2.4  | Framework full-stack con App Router |
| **React**        | ^18.3.0 | Biblioteca UI                       |
| **TypeScript**   | ^5.x    | Tipado estático                     |
| **Tailwind CSS** | ^3.4.19 | Estilos utility-first               |
| **Node.js**      | 18+     | Runtime                             |

### Backend y Datos

| Tecnología      | Versión  | Uso                             |
| --------------- | -------- | ------------------------------- |
| **PostgreSQL**  | 15+      | Base de datos principal         |
| **Prisma**      | ^5.22.0  | ORM y migraciones               |
| **NextAuth.js** | ^4.24.13 | Autenticación JWT               |
| **bcrypt**      | ^5.x     | Hash de contraseñas (12 rounds) |
| **Socket.io**   | ^4.x     | Comunicación tiempo real        |

### Pagos

| Servicio          | Tipo     | Descripción                     |
| ----------------- | -------- | ------------------------------- |
| **Stripe**        | Real     | Checkout con tarjetas de prueba |
| **PayPal**        | Real     | Smart Buttons integrados        |
| **Bizum**         | Simulado | Para mercado español            |
| **Transferencia** | Manual   | Con referencia única            |

### Testing

| Framework           | Tipo               | Cobertura           |
| ------------------- | ------------------ | ------------------- |
| **Vitest**          | Unit + Integration | 80%+                |
| **Playwright**      | E2E                | 19 tests, 6 devices |
| **Testing Library** | React Testing      | Unitarios           |

### Seguridad y Calidad

| Herramienta   | Propósito                |
| ------------- | ------------------------ |
| **Zod**       | Validación de inputs     |
| **ESLint**    | Linting (max-warnings=0) |
| **Prettier**  | Formateo de código       |
| **Husky**     | Git hooks                |
| **SonarQube** | Análisis estático        |

---

## Características Principales

### 🛒 E-commerce Completo

- **Catálogo:** 50+ productos en PLA/PETG con imágenes, categorías, filtros
- **Carrito:** Persistente (localStorage + DB), gestión de cantidades, cálculo de totales con IVA (21%)
- **Checkout:** Multi-paso, 4 métodos de pago, validación de direcciones, cupones de descuento
- **Pedidos:** Flujo completo (Pendiente → Confirmado → En preparación → Enviado → Entregado)

### 👨‍💼 Panel de Administración (15+ Módulos)

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
git clone https://github.com/tu-usuario/3d-print-tfm.git
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

# Ejecutar migraciones
npx prisma migrate dev --name init

# Poblar datos iniciales (50+ productos, 8 usuarios)
npm run db:seed
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
npm run db:migrate          # Crear nueva migración
npm run db:setup:dev        # Setup completo en DEV (migraciones + seed)
npm run db:seed             # Poblar con datos iniciales
npm run db:reset            # Reset + seed (cuidado: borra datos)
npm run db:studio           # Abrir Prisma Studio (GUI)
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
├── 📁 docs/                   # Documentación técnica (14+ archivos)
│   ├── TESTING.md
│   ├── ROADMAP.md
│   ├── ESTRUCTURA_CARPETAS.md
│   ├── PROJECT-SUMMARY.md
│   └── ...
│
├── 📁 prisma/                 # Base de datos
│   ├── schema.prisma          # 24+ modelos
│   ├── migrations/
│   └── seed.ts
│
├── 📁 scripts/                # Scripts utilitarios
│   ├── code-auditor.js
│   └── wait-for-postgres.mjs
│
├── 📁 src/
│   ├── 📁 app/
│   │   ├── 📁 (shop)/         # Tienda pública
│   │   │   ├── account/       # Perfil, pedidos, facturas, direcciones
│   │   │   ├── cart/          # Carrito de compras
│   │   │   ├── checkout/      # Checkout multi-paso
│   │   │   ├── products/      # Catálogo con filtros
│   │   │   └── ...
│   │   │
│   │   ├── 📁 admin/          # Panel de administración (15+ módulos)
│   │   │   ├── alerts/
│   │   │   ├── categories/
│   │   │   ├── clients/
│   │   │   ├── coupons/
│   │   │   ├── dashboard/
│   │   │   ├── faqs/
│   │   │   ├── inventory/
│   │   │   ├── invoices/
│   │   │   ├── orders/
│   │   │   ├── products/
│   │   │   ├── returns/
│   │   │   ├── reviews/
│   │   │   ├── shipping/
│   │   │   └── site-config/
│   │   │
│   │   ├── 📁 api/            # APIs RESTful (62+ endpoints)
│   │   │   ├── account/
│   │   │   ├── admin/
│   │   │   ├── auth/
│   │   │   ├── cart/
│   │   │   ├── checkout/
│   │   │   ├── payments/
│   │   │   └── webhooks/
│   │   │
│   │   ├── 📁 auth/           # Autenticación
│   │   ├── 📁 checkout/
│   │   ├── 📁 products/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── 📁 components/
│   │   ├── admin/             # Componentes admin
│   │   ├── auth/              # Login, registro
│   │   ├── cart/              # Carrito, items
│   │   ├── checkout/          # Formularios checkout
│   │   ├── layout/            # Header, footer
│   │   ├── payment/           # PayPal, métodos de pago
│   │   ├── products/          # Cards, filtros, galería
│   │   └── ui/                # Componentes UI reutilizables
│   │
│   ├── 📁 hooks/              # Custom React hooks
│   │   ├── useAdminAuth.ts
│   │   ├── useCart.ts
│   │   └── useRealTime.ts
│   │
│   ├── 📁 lib/
│   │   ├── alerts/            # Servicio de alertas
│   │   ├── auth/              # Configuración NextAuth
│   │   ├── db/                # Cliente Prisma
│   │   ├── errors/            # Manejo de errores
│   │   ├── i18n/              # Traducciones (backend)
│   │   ├── invoices/          # Servicio de facturas
│   │   ├── logger/            # Logger estructurado
│   │   ├── realtime/          # Socket.io + EventStore
│   │   └── validators/        # Zod schemas
│   │
│   ├── 📁 providers/          # Context providers
│   ├── 📁 styles/             # Estilos globales
│   └── 📁 types/              # Tipos TypeScript globales
│
├── 📁 tests/
│   ├── 📁 unit/               # Tests unitarios (Vitest)
│   ├── 📁 integration/         # Tests integración (Vitest + DB)
│   └── 📁 e2e/                # Tests E2E (Playwright)
│
├── 📄 .env.example            # Variables de entorno de ejemplo
├── 📄 .eslintrc.json          # Configuración ESLint
├── 📄 .prettierrc             # Configuración Prettier
├── 📄 AGENTS.md               # Guía para agentes AI
├── 📄 CHANGELOG.md            # Historial de cambios
├── 📄 DATABASE-SAFETY.md      # Seguridad de BD
├── 📄 LICENSE                 # Licencia académica
├── 📄 next.config.ts          # Configuración Next.js
├── 📄 package.json            # Dependencias y scripts
├── 📄 postcss.config.js       # Configuración PostCSS
├── 📄 README.md               # Este archivo
├── 📄 tailwind.config.ts      # Configuración Tailwind
├── 📄 tsconfig.json           # Configuración TypeScript
└── 📄 vitest.config.ts        # Configuración Vitest
```

---

## Documentación Técnica

### Documentación Principal

| Documento                                                 | Descripción               | Ubicación |
| --------------------------------------------------------- | ------------------------- | --------- |
| **[TESTING.md](docs/TESTING.md)**                         | Guía completa de testing  | `/docs/`  |
| **[ROADMAP.md](docs/ROADMAP.md)**                         | Plan de mejoras y roadmap | `/docs/`  |
| **[ESTRUCTURA_CARPETAS.md](docs/ESTRUCTURA_CARPETAS.md)** | Estructura detallada      | `/docs/`  |
| **[PROJECT-SUMMARY.md](docs/PROJECT-SUMMARY.md)**         | Documentación académica   | `/docs/`  |
| **[TOLERANCIA-CERO.md](docs/TOLERANCIA-CERO.md)**         | Política de calidad       | `/docs/`  |
| **[AGENTS.md](AGENTS.md)**                                | Guía para agentes AI      | `/`       |

### Seguridad y Operaciones

| Documento                | Descripción                     |
| ------------------------ | ------------------------------- |
| **DATABASE-SAFETY.md**   | Protocolos de seguridad de BD   |
| **DATABASE-CONFIG.md**   | Configuración de bases de datos |
| **DATABASE-STATUS.md**   | Estado de migraciones           |
| **DEPLOYMENT-STATUS.md** | Estado de despliegue            |

### Fiscal y Legal

| Documento                                 | Descripción          |
| ----------------------------------------- | -------------------- |
| **AUDITORIA-FISCAL-COMPLETA.md**          | Documentación fiscal |
| **VERIFICACION-FISCAL-FINAL-APROBADO.md** | Verificación fiscal  |

---

## Seguridad

### Medidas Implementadas

| Capa              | Implementación                                            |
| ----------------- | --------------------------------------------------------- |
| **Autenticación** | JWT con NextAuth.js, sesiones httpOnly/secure/sameSite    |
| **Autorización**  | RBAC (USER/ADMIN) con middleware de protección de rutas   |
| **Contraseñas**   | bcrypt (12 rounds), validación de complejidad             |
| **Rate Limiting** | 5 intentos/15min login, bloqueo tras 5 fallos             |
| **SQL Injection** | Prisma ORM (consultas parametrizadas)                     |
| **XSS**           | Escapado automático de React, sanitización de inputs      |
| **CSRF**          | Tokens en formularios, validación de origen               |
| **Validación**    | Zod para todos los inputs de APIs                         |
| **Errores**       | Manejo centralizado, sin filtrado de información sensible |

### Validación de Contraseñas

- **Longitud mínima:** 8 caracteres
- **Complejidad:** Mayúsculas, minúsculas, números, símbolos
- **Lista negra:** 100+ contraseñas comunes bloqueadas
- **Pwned Check:** Integración opcional con Have I Been Pwned

---

## Roadmap y Mejoras

### Completado ✅

- [x] Sistema de autenticación completo
- [x] Catálogo de productos con filtros
- [x] Carrito persistente
- [x] Checkout con 4 métodos de pago
- [x] Panel admin con 15+ módulos
- [x] Sistema de facturación automática
- [x] Notificaciones en tiempo real
- **Tests:** 395+ con 80%+ coverage
- [x] Tolerancia cero en ESLint/TypeScript

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
- 🐛 **Issues:** [GitHub Issues](https://github.com/tu-usuario/3d-print-tfm/issues)
- 💬 **Discusiones:** [GitHub Discussions](https://github.com/tu-usuario/3d-print-tfm/discussions)

### Desarrollador

**Rejane Rodrigues**

- 🎓 Máster en Desarrollo de Aplicaciones con IA
- 📧 Email: [tu-email@example.com](mailto:tu-email@example.com)
- 💼 LinkedIn: [linkedin.com/in/tu-perfil](https://linkedin.com/in/tu-perfil)
- 🐙 GitHub: [github.com/tu-usuario](https://github.com/tu-usuario)

---

## Licencia

Este proyecto es desarrollado para fines académicos como **Trabajo de Fin de Máster**.

Copyright © 2025 Rejane Rodrigues. Todos los derechos reservados.

---

<div align="center">

**Desarrollado con ❤️ y muchas ☕ por Rejane Rodrigues**

**Última actualización:** Abril 2025 | **Versión:** 1.0.1

</div>
