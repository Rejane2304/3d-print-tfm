# 3D Print TFM

E-commerce de Impresión 3D - Proyecto de Fin de Máster

🚀 **Demo en Vivo:** [https://3d-print-tfm.vercel.app](https://3d-print-tfm.vercel.app)

[![Tests](https://img.shields.io/badge/tests-passing-brightgreen)](https://github.com/tu-usuario/3d-print-tfm)
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

- **Catálogo fijo** de 50+ productos en PLA/PETG con filtros avanzados y búsqueda
- **Carrito de compras** persistente con gestión completa de items
- **Checkout completo** con 4 métodos de pago (Stripe, PayPal, Bizum, Transferencia) - **precios con IVA incluido (21%)**
- **Gestión de pedidos** con flujo completo de estados y notificaciones en tiempo real
- **Panel de administración** con 14+ módulos CRUD (productos, pedidos, clientes, cupones, facturas, inventario, alertas, FAQs, envíos, etc.)
- **Sistema de cupones** con descuentos por porcentaje, fijo y envío gratis
- **Facturación automática** con generación de PDFs
- **Sistema de alertas** de inventario en tiempo real
- **Gestión de envíos** con zonas y costos configurables
- **Diseño responsive** optimizado desde mobile hasta 4K
- **100% UI en español** con sistema de traducción en backend
- **Sistema de tiempo real** con Socket.io para notificaciones instantáneas
- **Seguridad enterprise-grade** con rate limiting, account lockout, validación de contraseñas
- **Tests automatizados** (unitarios, integración y E2E con Playwright)

---

## Tecnologías

| Categoría | Tecnologías |
|-----------|-------------|
| **Frontend** | Next.js 14.2.35 (App Router), React ^18, TypeScript ^5 |
| **Estilos** | Tailwind CSS ^3.4.1, Lucide React (iconos) |
| **Backend** | Next.js API Routes, Server Actions |
| **Base de datos** | PostgreSQL (Supabase), Prisma ORM ^5.22.0 |
| **Autenticación** | NextAuth.js ^4.24.13 (Credentials + JWT) |
| **Pagos** | Stripe (Checkout real), PayPal (Smart Buttons), Bizum (simulado), Transferencia |
| **Real-time** | Socket.io + PostgreSQL EventStore |
| **Testing** | Vitest (unit/integration), Playwright (E2E), Testing Library |
| **Seguridad** | bcrypt (12 rounds), rate limiting, account lockout, input validation (Zod) |
| **PDFs** | html2canvas, jsPDF (facturas) |
| **Deployment** | Vercel (serverless), CI/CD ready |

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
| `NEXT_PUBLIC_APP_URL` | URL pública de la app | `http://localhost:3000` |
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe (modo test/live) | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Secreto del webhook de Stripe | `whsec_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clave pública de Stripe | `pk_test_...` |
| `PAYPAL_CLIENT_ID` | ID de cliente PayPal (sandbox/live) | - |
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
npm run db:seed          # Poblar datos iniciales (50+ productos, 8 usuarios)
npm run db:reset         # Reset + seed
npm run db:studio        # Abrir Prisma Studio

# Testing
npm run test:unit              # Tests unitarios
npm run test:integration       # Tests de integración
npm run test:e2e               # Tests E2E
npm run test:coverage          # Tests con cobertura
```

---

## Testing

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
│   ├── schema.prisma          # Esquema de BD (18+ modelos)
│   └── seed.ts                # Datos iniciales (50+ productos)
├── src/
│   ├── app/
│   │   ├── (auth)/            # Autenticación (login, registro)
│   │   ├── (shop)/            # Tienda pública
│   │   │   ├── products/      # Catálogo con filtros
│   │   │   ├── cart/          # Carrito de compras
│   │   │   ├── checkout/      # Checkout multi-paso
│   │   │   └── account/       # Cuenta usuario (pedidos, perfil, facturas)
│   │   ├── admin/             # Panel admin (14+ módulos)
│   │   │   ├── dashboard/
│   │   │   ├── products/      # CRUD productos con imágenes
│   │   │   ├── orders/        # Gestión de pedidos
│   │   │   ├── clients/       # Gestión de clientes
│   │   │   ├── invoices/      # Facturación y PDFs
│   │   │   ├── coupons/       # Sistema de cupones
│   │   │   ├── inventory/     # Control de inventario
│   │   │   ├── alerts/        # Alertas automáticas
│   │   │   ├── faqs/          # Gestión de FAQs
│   │   │   ├── shipping/      # Zonas de envío
│   │   │   └── site-config/   # Configuración del sitio
│   │   └── api/               # APIs RESTful
│   ├── components/            # Componentes React reutilizables
│   ├── lib/                   # Utilidades y helpers
│   │   ├── pricing/           # Cálculos de precios con IVA
│   │   ├── i18n/              # Traducciones backend
│   │   └── realtime/          # Socket.io y eventos
│   └── tests/                 # Tests
│       ├── unit/
│       ├── integration/
│       └── e2e/
├── public/                    # Assets estáticos (imágenes, etc.)
└── docs/                      # Documentación adicional
```

---

## Documentación

- **[Guía de Testing](docs/TESTING.md)** - Cómo ejecutar y mantener tests
- **[Roadmap](docs/ROADMAP.md)** - Plan de mejoras y próximos pasos
- **[Estructura de Carpetas](docs/ESTRUCTURA_CARPETAS.md)** - Organización del proyecto
- **[Resumen del Proyecto](docs/PROJECT-SUMMARY.md)** - Documentación académica
- **Documentación técnica** en [`/docs/`](docs/)

---

## Seguridad

- **Autenticación:** JWT con NextAuth.js, sesiones httpOnly/secure/sameSite
- **Autorización:** RBAC (USER/ADMIN) con middleware de protección de rutas
- **Contraseñas:** bcrypt (12 rounds), validación de complejidad (mayúsculas, minúsculas, números, símbolos)
- **Rate Limiting:** 5 intentos/15min login, bloqueo de cuenta tras 5 fallos
- **Prevenciones:** SQL Injection (Prisma ORM), XSS sanitización, CSRF tokens
- **Validación:** Zod para validación de inputs en APIs
- **Manejo de errores:** Centralizado, sin filtrado de información sensible

---

## Funcionalidades Destacadas

### 💳 Sistema de Pagos
- **Stripe:** Checkout real con tarjetas de prueba
- **PayPal:** Smart Buttons integrados
- **Bizum:** Simulación para mercado español
- **Transferencia:** Con referencia única

### 🎟️ Sistema de Cupones
- Descuentos por porcentaje (ej: 10% off)
- Descuentos fijos (ej: -10€)
- Envío gratis
- Fechas de validez, usos máximos, monto mínimo

### 📧 Notificaciones en Tiempo Real
- Alertas de stock bajo
- Nuevos pedidos (panel admin)
- Actualizaciones de estado de pedido

### 📄 Facturación
- Generación automática de facturas en PDF
- Numeración correlativa
- Datos fiscales completos

---

## Soporte

Para preguntas o soporte:
- 📧 Email: support@3dprint.com
- 📚 Documentación: Ver carpeta `/docs/`
- 🐛 Issues: GitHub Issues

---

## Licencia

Este proyecto es desarrollado para fines académicos como Trabajo de Fin de Máster.

---

**Desarrollado con ❤️ por Rejane Rodrigues**

**Última actualización:** Abril 2025
