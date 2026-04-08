# 3D Print TFM

E-commerce de Impresión 3D - Proyecto de Fin de Máster

[![Tests](https://img.shields.io/badge/tests-407%20passing-brightgreen)](https://github.com/tu-usuario/3d-print-tfm)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.35-black)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22.0-2D3748)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-Academic-orange)](LICENSE)

## 📋 Índice

- [Descripción](#descripción)
- [Características](#características)
- [Tecnologías](#tecnologías)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso](#uso)
- [Testing](#testing)
- [Estructura](#estructura)
- [Documentación](#documentación)
- [Soporte](#soporte)

---

## Descripción

Aplicación web de comercio electrónico especializada en productos impresos en 3D. Desarrollada como Trabajo de Fin de Máster con enfoque TDD (Test-Driven Development).

### Características Principales

- **Catálogo fijo** de productos en PLA/PETG con filtros avanzados y búsqueda
- **Carrito de compras** persistente con gestión completa de items
- **Checkout completo** con 4 métodos de pago simulados (Tarjeta, PayPal, Bizum, Transferencia)
- **Gestión de pedidos** con flujo completo de estados
- **Panel de administración** con 13 módulos CRUD completos
- **Diseño responsive** optimizado desde mobile hasta 4K
- **100% UI en español** con sistema de traducción en backend
- **Sistema de tiempo real** con WebSockets para notificaciones instantáneas
- **Seguridad enterprise-grade** con múltiples capas de protección
- **407 tests** automatizados (unitarios, integración y E2E)

---

## Tecnologías

| Categoría | Tecnologías |
|-----------|-------------|
| **Frontend** | Next.js 14.2.35, React ^18, Tailwind CSS ^3.4.1 |
| **Backend** | Next.js API Routes, TypeScript ^5 |
| **Base de datos** | PostgreSQL, Prisma ORM ^5.22.0 |
| **Autenticación** | NextAuth.js ^4.24.13 |
| **Pagos** | Stripe (simulado), PayPal (simulado) |
| **Real-time** | Socket.io + EventStore (PostgreSQL) |
| **Testing** | Vitest, Playwright |
| **Seguridad** | bcrypt (12 rounds), rate limiting, account lockout |
| **Deployment** | Vercel |

---

## Instalación

### Prerrequisitos

- Node.js 18+
- PostgreSQL (local o Supabase)
- npm

### Pasos

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/your-user/3d-print-tfm.git
   cd 3d-print-tfm
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env.local
   # Editar .env.local con tus valores
   ```

4. **Configurar base de datos**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   npm run db:seed
   ```

5. **Iniciar servidor de desarrollo**
   ```bash
   npm run dev
   ```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

---

## Configuración

### Variables de Entorno Requeridas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | URL de conexión PostgreSQL | `postgresql://user:pass@localhost:5432/db` |
| `NEXTAUTH_SECRET` | Secreto JWT (generar con `openssl rand -base64 32`) | - |
| `NEXTAUTH_URL` | URL base de la app | `http://localhost:3000` |
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe (modo test) | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Secreto del webhook de Stripe | `whsec_...` |
| `PAYPAL_CLIENT_ID` | ID de cliente PayPal (sandbox) | - |
| `PAYPAL_CLIENT_SECRET` | Secreto de cliente PayPal | - |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | ID público de PayPal | - |

---

## Uso

### Usuarios de Prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@3dprint.com | AdminTFM2024! |
| Cliente | juan@example.com | JuanTFM2024! |

### Comandos Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar servidor
npm run lint             # Ejecutar ESLint
npm run lint -- --fix    # Corregir errores ESLint

# Base de datos
npm run db:generate      # Generar cliente Prisma
npm run db:migrate       # Crear migración
npm run db:seed          # Poblar datos iniciales
npm run db:reset         # Reset + seed
npm run db:studio        # Abrir Prisma Studio

# Testing
npm run test:unit              # Tests unitarios
npm run test:integration         # Tests de integración
npm run test:e2e               # Tests E2E
npm run test:coverage          # Tests con cobertura
```

---

## Testing

### Resumen

- ✅ **Unitarios:** 295 tests (validadores, middleware, seguridad)
- ✅ **Integración:** 96 tests (APIs, auth, carrito, checkout)
- ✅ **E2E:** 16 tests en 6 dispositivos (Chrome, Firefox, Safari, móviles)
- ✅ **Total:** 407 tests (100% passing)
- ✅ **Cobertura:** 80%+

### Ejecutar Tests

```bash
npm run test:unit        # Tests unitarios con Vitest
npm run test:integration # Tests de integración (requiere PostgreSQL)
npm run test:e2e         # Tests E2E con Playwright
```

---

## Estructura

```
3d-print-tfm/
├── prisma/
│   ├── schema.prisma          # Esquema de BD (18 modelos)
│   └── seed.ts                # Datos iniciales
├── src/
│   ├── app/
│   │   ├── (auth)/            # Autenticación
│   │   ├── (shop)/            # Tienda pública
│   │   │   ├── products/      # Catálogo
│   │   │   ├── cart/          # Carrito
│   │   │   ├── checkout/      # Checkout
│   │   │   └── account/       # Cuenta usuario
│   │   ├── (admin)/           # Panel admin
│   │   │   ├── dashboard/
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   ├── clients/
│   │   │   ├── invoices/
│   │   │   ├── coupons/
│   │   │   ├── inventory/
│   │   │   ├── alerts/
│   │   │   ├── faqs/
│   │   │   ├── shipping/
│   │   │   └── site-config/
│   │   └── api/               # APIs
│   ├── components/            # Componentes React
│   ├── lib/                   # Utilidades
│   └── tests/                 # Tests
│       ├── unit/
│       ├── integration/
│       └── e2e/
├── public/                    # Assets estáticos
└── docs/                      # Documentación
```

---

## Documentación

- **[Guía de Testing](docs/TESTING.md)** - Cómo ejecutar y mantener tests
- **[Roadmap](docs/ROADMAP.md)** - Plan de mejoras y próximos pasos
- **[Estructura de Carpetas](docs/ESTRUCTURA_CARPETAS.md)** - Organización del proyecto
- **Documentación académica** en [`/docs/`](docs/)

---

## Seguridad

- **Autenticación:** JWT con NextAuth.js, sesiones httpOnly/secure/sameSite
- **Autorización:** RBAC (USER/ADMIN) con middleware
- **Contraseñas:** bcrypt (12 rounds), validación de complejidad
- **Rate Limiting:** 5 intentos/15min login, protección contra fuerza bruta
- **Prevenciones:** SQL Injection (Prisma), XSS, CSRF
- **Manejo de errores:** Centralizado, sin filtrado de información sensible

---

## Soporte

Para preguntas o soporte:
- 📧 Email: support@3dprint.com
- 📚 Documentación: Ver carpeta `/docs/`

---

## Licencia

Este proyecto es desarrollado para fines académicos como Trabajo de Fin de Máster.

---

**Desarrollado con ❤️ por Rejane Rodrigues**

**Última actualización:** Abril 2025
