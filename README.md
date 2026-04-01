# 3D Print TFM

E-commerce de Impresión 3D - Proyecto de Fin de Máster

[![Tests](https://img.shields.io/badge/tests-passing-brightgreen)](https://github.com/tu-usuario/3d-print-tfm)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.35-black)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22.0-2D3748)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

## 📋 Descripción

Aplicación web de comercio electrónico especializada en productos impresos en 3D. Desarrollada como Trabajo de Fin de Máster con enfoque TDD (Test-Driven Development).

### Características Principales

- **Catálogo fijo** de productos en PLA/PETG con filtros y búsqueda
- **Gestión de pedidos** con flujo de estados completo
- **Pagos con Stripe** (modo test)
- **Panel de administración** con CRUDs completos
- **Responsive** desde mobile hasta 4K
- **100% en español** (UI y backend)
- **Seguridad enterprise** con autenticación JWT
- **Manejo de errores** centralizado
- **110+ tests** (unitarios, integración y E2E)

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
| **Despliegue** | Vercel |

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

### Tests Unitarios (Sin necesidad de BD)
```bash
npm run test:unit
# o
npm test -- tests/unit
```

### Tests de Integración (Requiere PostgreSQL)
```bash
# Configurar .env.test con DATABASE_URL de test
npm run test:integration
# o
VITEST_ENV=integration npm test -- tests/integration
```

### Tests E2E (Requiere servidor corriendo)
```bash
# Terminal 1: Iniciar servidor
npm run dev

# Terminal 2: Ejecutar tests E2E
npm run test:e2e
```

### Tests con Cobertura
```bash
npm run test:coverage
```

### Verificación completa
```bash
npm run lint
npm run test:unit
npm run test:integration
npm run test:e2e
```

## 📊 Estado de Tests

- ✅ **Unitarios:** 37 tests (validaciones)
- ✅ **Integración:** 73 tests (API, auth, middleware, páginas)
- ✅ **E2E:** Tests de autenticación en múltiples dispositivos
- ✅ **Total:** 110+ tests pasando

## 🗄️ Estructura del Proyecto

```
3d-print-tfm/
├── prisma/
│   ├── schema.prisma          # Esquema de base de datos (16 modelos)
│   └── seed.ts                # Datos iniciales desde CSV
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Login, Registro
│   │   ├── (shop)/            # Tienda pública
│   │   │   ├── page.tsx        # Home con productos destacados
│   │   │   ├── productos/      # Catálogo de productos
│   │   │   └── productos/[slug]/  # Detalle de producto
│   │   ├── (admin)/           # Panel admin
│   │   │   └── dashboard/      # Dashboard administrativo
│   │   └── api/               # API routes
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts   # Configuración NextAuth
│   │       ├── auth/registro/     # API de registro
│   │       ├── productos/         # API de catálogo
│   │       └── productos/[slug]/  # API de detalle
│   ├── components/
│   │   ├── products/          # Componentes de catálogo
│   │   │   ├── ProductCard.tsx
│   │   │   ├── FilterSidebar.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   └── SortSelector.tsx
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
│   │   │   ├── productos.test.ts
│   │   │   └── producto-detalle.test.ts
│   │   ├── auth/
│   │   │   └── login.test.ts
│   │   ├── middleware.test.ts
│   │   └── pages/
│   │       └── home.test.ts
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

- [Plan de Implementación](private/PLAN_IMPLEMENTACION.md) - Roadmap completo del proyecto
- [Guía de Variables de Entorno](private/GUIA_VARIABLES_ENTORNO.md) - Configuración paso a paso
- [Comandos de Desarrollo](private/COMANDOS.md) - Comandos útiles y troubleshooting
- Documentación académica en `/doc/`

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

### 2025-04-01: Corrección de Tests E2E y Configuración PostgreSQL

**Tests E2E corregidos:**
- ✅ Actualizados selectores para usar IDs de inputs
- ✅ Corregido test de Footer (selector específico)
- ✅ Tests de login funcionando en todos los dispositivos

**Configuración de tests:**
- ✅ Tests configurados para usar PostgreSQL (no SQLite)
- ✅ Agregados scripts `test:unit` y `test:integration`
- ✅ Creado script `prepare-test-db.sh`
- ✅ 110 tests pasando correctamente

### 2025-04-01: Fase 3 - Catálogo de Productos (Completada)

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

### 2025-04-01: Corrección de Errores de Lint y TypeScript

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
