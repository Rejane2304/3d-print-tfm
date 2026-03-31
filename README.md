# 3D Print TFM

E-commerce de Impresión 3D - Proyecto de Fin de Máster

[![Tests](https://img.shields.io/badge/tests-passing-brightgreen)](https://github.com/tu-usuario/3d-print-tfm)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.35-black)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22.0-2D3748)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

## 📋 Descripción

Aplicación web de comercio electrónico especializada en productos impresos en 3D. Desarrollada como Trabajo de Fin de Máster con enfoque TDD (Test-Driven Development).

### Características Principales

- **Catálogo fijo** de productos en PLA/PETG
- **Gestión de pedidos** con flujo de estados completo
- **Pagos con Stripe** (modo test)
- **Panel de administración** con CRUDs completos
- **Responsive** desde mobile hasta 4K
- **100% en español** (UI y backend)
- **Seguridad enterprise** con autenticación JWT
- **Manejo de errores** centralizado

## 🚀 Tecnologías

| Categoría | Tecnologías |
|-----------|-------------|
| **Frontend** | Next.js 14, React 18, Tailwind CSS 3.4 |
| **Backend** | Next.js API Routes, TypeScript 5 |
| **Base de datos** | PostgreSQL, Prisma ORM 5.22 |
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
| `DATABASE_URL` | Supabase (2 proyectos gratuitos) | URL de conexión PostgreSQL |
| `NEXTAUTH_SECRET` | Generar localmente | Secreto para JWT (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Configurar | URL base de la app (`http://localhost:3000`) |
| `STRIPE_SECRET_KEY` | Stripe Dashboard | Clave secreta de Stripe (modo test) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard | Clave pública de Stripe (modo test) |

**Arquitectura de base de datos:** Supabase gratuito con 2 proyectos separados (desarrollo + producción)

**Ver guía paso a paso:** [private/GUIA_VARIABLES_ENTORNO.md](private/GUIA_VARIABLES_ENTORNO.md)

## 🧪 Testing

### Tests Unitarios
```bash
npm test
```

### Tests con Cobertura
```bash
npm run test:coverage
```

### Tests E2E (Playwright)
```bash
npm run test:e2e
```

### Todos los tests
```bash
npm run lint
npm test
npm run test:e2e
```

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
│   │   ├── (admin)/           # Panel admin
│   │   └── api/               # API routes
│   │       └── auth/
│   │           └── [...nextauth]/
│   │               └── route.ts   # Configuración NextAuth
│   ├── components/            # Componentes React
│   ├── lib/
│   │   ├── db/                # Conexión Prisma
│   │   ├── auth/              # Configuración auth
│   │   ├── validators/          # Validaciones Zod
│   │   ├── errors/            # Manejo de errores
│   │   │   ├── index.ts       # Tipos y utilidades
│   │   │   └── api-wrapper.ts # Wrappers para API routes
│   │   └── utils/             # Utilidades
│   ├── hooks/                 # Custom hooks
│   └── types/                 # Tipos TypeScript
│       └── next-auth.d.ts     # Tipos extendidos de NextAuth
├── tests/
│   ├── unit/                  # Tests unitarios
│   ├── integration/           # Tests de integración
│   └── e2e/                   # Tests E2E
├── public/                    # Assets estáticos
│   ├── images/                # Imágenes del proyecto
│   │   ├── logo.svg
│   │   └── products/          # Imágenes de productos (p1-p10)
│   └── data/                  # Archivos CSV con datos iniciales
├── doc/                       # Documentación TFM
└── private/                   # Datos y recursos de referencia
    ├── PLAN_IMPLEMENTACION.md
    ├── COMANDOS.md
    ├── GUIA_VARIABLES_ENTORNO.md
    ├── data/                  # CSV fuente
    └── public/                # Imágenes fuente
```

## 👥 Usuarios de Prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@3dprint.com | admin123 |
| Cliente | juan@example.com | pass123 |
| Cliente | maria@example.com | pass123 |

## 📚 Documentación

- [Plan de Implementación](private/PLAN_IMPLEMENTACION.md) - Roadmap completo del proyecto
- [Guía de Variables de Entorno](private/GUIA_VARIABLES_ENTORNO.md) - Paso a paso para configurar credenciales
- [Comandos de Desarrollo](private/COMANDOS.md) - Comandos útiles
- Documentación completa en `/doc/`

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
npm run dev              # Iniciar servidor de desarrollo
npm run lint             # Ejecutar ESLint
npm test                 # Ejecutar tests unitarios

# Base de datos
npm run db:generate      # Generar cliente Prisma
npm run db:migrate       # Crear migración
npm run db:seed          # Cargar datos iniciales
npm run db:reset         # Resetear BD + seed
npm run db:studio        # Abrir Prisma Studio

# Testing
npm run test:coverage    # Tests con cobertura
npm run test:e2e         # Tests E2E con Playwright
npm run test:e2e:ui      # Tests E2E con interfaz
```

## 📝 Historial de Cambios

### 2024-XX-XX: Fase 3 - Catálogo de Productos (TDD)

**Tests escritos e implementación:**

**API Endpoints:**
- ✅ `GET /api/productos` - Listado con filtros, ordenamiento y paginación
- ✅ `GET /api/productos/[slug]` - Detalle de producto con productos relacionados

**Tests de Integración:**
- ✅ `tests/integration/api/productos.test.ts` - 23 tests (listado con filtros)
- ✅ `tests/integration/api/producto-detalle.test.ts` - 10 tests (detalle de producto)

**Páginas Implementadas:**
- ✅ `/productos` - Catálogo con filtros laterales, paginación, ordenamiento y búsqueda
- ✅ `/productos/[slug]` - Página de detalle con:
  - Galería de imágenes
  - Información completa del producto
  - Selector de stock
  - Productos relacionados
  - Botón de añadir al carrito

**Funcionalidades del Catálogo:**
- Filtrado por categoría (DECORACION, ACCESORIOS, FUNCIONAL, ARTICULADOS, JUGUETES)
- Filtrado por material (PLA, PETG)
- Filtrado por rango de precio
- Filtrado por disponibilidad (en stock)
- Búsqueda por nombre y descripción
- Ordenamiento por nombre, precio o stock
- Paginación configurable
- Diseño responsive

**Total tests Fase 3: 33 nuevos tests**

### 2024-XX-XX: Tests Fase 2 (TDD)

**Tests escritos siguiendo TDD correctamente:**

**Tests de Integración:**
- ✅ `tests/integration/api/registro.test.ts` - Tests API de registro (validación, creación, duplicados)
- ✅ `tests/integration/auth/login.test.ts` - Tests flujo de login (autorización, sesión, usuarios inactivos)
- ✅ `tests/integration/middleware.test.ts` - Tests middleware de autorización (redirecciones por rol)
- ✅ `tests/integration/pages/home.test.ts` - Tests página de inicio (carga de productos, imágenes)

**Tests Unitarios:**
- ✅ `tests/unit/components/Header.test.tsx` - Tests componente Header (auth, navegación, responsive)
- ✅ `tests/unit/components/Footer.test.tsx` - Tests componente Footer (enlaces, información)

**Tests E2E:**
- ✅ `tests/e2e/auth/login.spec.ts` - Tests E2E flujo completo de autenticación (registro, login, logout, acceso protegido)

**Estructura de Tests:**
```
tests/
├── integration/
│   ├── api/registro.test.ts
│   ├── auth/login.test.ts
│   ├── middleware.test.ts
│   └── pages/home.test.ts
├── unit/
│   ├── validaciones.test.ts
│   └── components/
│       ├── Header.test.tsx
│       └── Footer.test.tsx
└── e2e/
    └── auth/
        └── login.spec.ts
```

### 2024-XX-XX: Corrección de Rutas de Imágenes

**Problema identificado**: Las rutas de imágenes en `public/data/products.csv` estaban incorrectas y no coincidían con la estructura de directorios real.

**Cambios realizados**:
- ✅ Corregidas las rutas en `public/data/products.csv`: De `/images/products/p1.jpg` a `/images/products/p1/p1-1.jpg`
- ✅ Regenerados los datos de seed con `npm run db:seed`
- ✅ Verificado que las imágenes se cargan correctamente en la página de inicio

**Estructura de imágenes**:
```
public/images/products/
├── p1/p1-1.jpg      # Vaso Decorativo Floral
├── p2/p2-1.jpg      # Organizador de Escritorio
├── p3/p3-1.jpg      # Maceta Geométrica
└── ... (p4-p10)
```

Ver detalles completos en: [private/RESUMEN_CONFIGURACION.md](private/RESUMEN_CONFIGURACION.md)

## 📝 Licencia

Este proyecto es desarrollado para fines académicos como Trabajo de Fin de Máster.

---

**Desarrollado con ❤️ por Rejane Rodrigues**
