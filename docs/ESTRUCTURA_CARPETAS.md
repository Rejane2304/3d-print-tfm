# Estructura de Carpetas del Proyecto

```
3d-print-tfm/
│
├── 📁 .agent/                    # Configuración de agentes IA
│   └── config/
│       └── delegation-rules.json
│
├── 📁 .backups/                # Backups automáticos
│
├── 📁 coverage/                  # Reportes de cobertura de tests
│
├── 📁 docs/                      # 📚 Documentación del proyecto
│   ├── 01-business-model-canvas.md
│   ├── 02-entity-analysis.md
│   ├── 03-business-processes.md
│   ├── 04-use-cases.md
│   ├── 05-monetization-strategy.md
│   ├── 06-customer-segments.md
│   ├── 07-competitive-analysis.md
│   ├── 08-implementation-roadmap.md
│   ├── 09-quality-audit.md
│   ├── 10-deployment-guide.md
│   ├── 11-complete-audit-refactoring.md
│   ├── DIAGRAMA_DER.md          # Diagrama Entidad-Relación
│   ├── MIGRATION_STATUS.md
│   ├── PROJECT-SUMMARY.md
│   ├── REALTIME_IMPLEMENTATION_SUMMARY.md
│   ├── ROADMAP.md
│   ├── TFM-API-Collection.postman_collection.json
│   ├── TFM-PRESENTACION.md
│   ├── TFM-PRESENTACION.pdf
│   └── TESTING.md
│
├── 📁 playwright-report/         # Reportes de tests E2E
│
├── 📁 prisma/                    # 🗄️ Base de datos
│   ├── schema.prisma             # Esquema de Prisma (19 entidades)
│   ├── migrations/
│   │   └── [migraciones automáticas]
│   └── seed.ts                   # Datos iniciales (semilla)
│
├── 📁 private/                   # 🔒 Archivos privados (no en git)
│
├── 📁 public/                    # 🌐 Archivos públicos
│   ├── images/
│   │   ├── hero/                 # Imágenes del hero
│   │   ├── logo.svg
│   │   └── products/             # Imágenes de productos
│   └── data/
│       ├── faqs.csv              # FAQs iniciales
│       └── products.csv          # Productos iniciales
│
├── 📁 scripts/                   # 🛠️ Scripts de utilidad
│   ├── clean-all.sh
│   ├── fix-tests.sh
│   ├── generate-hero-bg.py
│   ├── generate-presentation-pdf.js
│   └── create-realistic-hero.py
│
├── 📁 src/                       # 💻 Código fuente principal
│   │
│   ├── 📁 app/                   # Next.js App Router
│   │   ├── 📁 (routes)/          # Rutas públicas
│   │   │   ├── (shop)/
│   │   │   │   ├── account/
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   ├── profile/page.tsx
│   │   │   │   │   ├── orders/page.tsx
│   │   │   │   │   ├── orders/[id]/page.tsx
│   │   │   │   │   ├── addresses/page.tsx
│   │   │   │   │   ├── invoices/page.tsx
│   │   │   │   │   └── reviews/page.tsx
│   │   │   │   ├── cart/page.tsx
│   │   │   │   ├── checkout/page.tsx
│   │   │   │   └── products/
│   │   │   │       ├── page.tsx
│   │   │   │       └── [slug]/page.tsx
│   │   │   ├── faqs/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   └── page.tsx          # Página de inicio
│   │   │
│   │   ├── 📁 admin/             # Panel de administración
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── orders/page.tsx
│   │   │   ├── orders/[id]/page.tsx
│   │   │   ├── products/page.tsx
│   │   │   ├── products/new/page.tsx
│   │   │   ├── products/[id]/page.tsx
│   │   │   ├── categories/page.tsx
│   │   │   ├── categories/[id]/page.tsx
│   │   │   ├── inventory/page.tsx
│   │   │   ├── clients/page.tsx
│   │   │   ├── clients/[id]/page.tsx
│   │   │   ├── coupons/page.tsx
│   │   │   ├── faqs/page.tsx
│   │   │   ├── faqs/new/page.tsx
│   │   │   ├── faqs/[id]/page.tsx
│   │   │   ├── alerts/page.tsx
│   │   │   ├── config/page.tsx
│   │   │   └── shipping/page.tsx
│   │   │
│   │   ├── 📁 api/               # API Routes (backend)
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/route.ts
│   │   │   ├── account/
│   │   │   │   ├── profile/route.ts
│   │   │   │   ├── addresses/route.ts
│   │   │   │   ├── orders/route.ts
│   │   │   │   ├── orders/[id]/route.ts
│   │   │   │   ├── reviews/route.ts
│   │   │   │   └── invoices/route.ts
│   │   │   ├── cart/route.ts
│   │   │   ├── products/route.ts
│   │   │   ├── products/[slug]/route.ts
│   │   │   ├── reviews/
│   │   │   │   ├── route.ts
│   │   │   │   ├── [id]/route.ts
│   │   │   │   └── product/[productId]/route.ts
│   │   │   ├── faqs/route.ts
│   │   │   ├── payments/
│   │   │   │   ├── stripe/
│   │   │   │   │   └── create/route.ts
│   │   │   │   └── paypal/
│   │   │   │       ├── create/route.ts
│   │   │   │       └── capture/route.ts
│   │   │   ├── shipping/
│   │   │   │   ├── calculate/route.ts
│   │   │   │   └── zones/route.ts
│   │   │   ├── admin/
│   │   │   │   ├── analytics/route.ts
│   │   │   │   ├── orders/route.ts
│   │   │   │   ├── orders/[id]/route.ts
│   │   │   │   ├── products/route.ts
│   │   │   │   ├── products/[id]/route.ts
│   │   │   │   ├── inventory/route.ts
│   │   │   │   ├── categories/route.ts
│   │   │   │   ├── clients/route.ts
│   │   │   │   ├── faqs/route.ts
│   │   │   │   ├── faqs/[id]/route.ts
│   │   │   │   ├── coupons/route.ts
│   │   │   │   ├── alerts/route.ts
│   │   │   │   ├── config/route.ts
│   │   │   │   ├── invoices/route.ts
│   │   │   │   ├── invoices/[id]/route.ts
│   │   │   │   └── shipping/route.ts
│   │   │   ├── webhooks/
│   │   │   │   ├── stripe/route.ts
│   │   │   │   └── paypal/route.ts
│   │   │   └── realtime/
│   │   │       └── events/route.ts
│   │   │
│   │   ├── layout.tsx            # Layout raíz
│   │   └── globals.css             # Estilos globales
│   │
│   ├── 📁 components/            # 🧩 Componentes React
│   │   ├── admin/                # Componentes de admin
│   │   ├── auth/                 # Componentes de autenticación
│   │   ├── cart/                 # Componentes del carrito
│   │   ├── checkout/             # Componentes de checkout
│   │   ├── layout/               # Header, Footer, Layout
│   │   ├── orders/               # Componentes de pedidos
│   │   ├── payment/              # PayPalButton, etc.
│   │   ├── products/             # ProductCard, AddToCartButton
│   │   ├── providers/            # PayPalProvider, etc.
│   │   ├── reviews/              # ReviewsList, ReviewForm
│   │   └── ui/                   # Componentes UI reutilizables
│   │       ├── Button.tsx
│   │       ├── DataTable.tsx
│   │       ├── ConfirmModal.tsx
│   │       └── Input.tsx
│   │
│   ├── 📁 hooks/                 # 🎣 Custom React Hooks
│   │   ├── useCart.ts
│   │   ├── useSiteConfig.ts
│   │   └── useToast.ts
│   │
│   ├── 📁 lib/                   # 📚 Librerías y utilidades
│   │   ├── auth/
│   │   │   └── auth-options.ts
│   │   ├── db/
│   │   │   └── prisma.ts
│   │   ├── errors/
│   │   │   └── api-wrapper.ts
│   │   ├── i18n/
│   │   │   └── index.ts          # Traducciones
│   │   ├── rate-limit.ts
│   │   ├── validators/
│   │   │   └── index.ts
│   │   ├── realtime/
│   │   │   ├── event-service.ts
│   │   │   └── event-store.ts
│   │   └── auth.ts
│   │
│   ├── 📁 providers/             # 🔄 Context Providers
│   │   ├── SiteConfigProvider.tsx
│   │   └── ToastProvider.tsx
│   │
│   ├── 📁 types/                 # 📋 TypeScript Types
│   │   └── next-auth.d.ts
│   │
│   └── middleware.ts             # 🛡️ Next.js Middleware
│       # (protección de rutas, rate limiting)
│
├── 📁 test-results/              # Resultados de tests E2E
│
├── 📁 tests/                     # 🧪 Tests
│   ├── e2e/                      # Tests E2E (Playwright)
│   │   ├── auth.spec.ts
│   │   ├── cart.spec.ts
│   │   ├── checkout.spec.ts
│   │   └── products.spec.ts
│   ├── integration/              # Tests de integración
│   │   └── api/
│   │       ├── auth.test.ts
│   │       ├── cart.test.ts
│   │       └── orders.test.ts
│   └── unit/                     # Tests unitarios
│       └── components/
│
├── 📄 Root Files
│   ├── .env                      # Variables de entorno
│   ├── .env.example
│   ├── .env.test
│   ├── .eslintrc.json            # Configuración ESLint
│   ├── .gitignore
│   ├── AGENTS.md                 # Guía para agentes IA
│   ├── CHANGELOG.md
│   ├── README.md                 # Documentación principal
│   ├── next.config.mjs           # Configuración Next.js
│   ├── package.json
│   ├── playwright.config.ts      # Configuración Playwright
│   ├── postcss.config.mjs
│   ├── tailwind.config.ts        # Configuración Tailwind CSS
│   ├── tsconfig.json
│   ├── vitest.config.ts          # Configuración Vitest
│   └── TEST_MATRIX.csv           # Matriz de tests
```

---

## 📊 Estadísticas del Proyecto

| Métrica | Valor |
|---------|-------|
| **Lenguaje Principal** | TypeScript |
| **Framework** | Next.js 14 (App Router) |
| **Base de Datos** | PostgreSQL + Prisma ORM |
| **Estilos** | Tailwind CSS |
| **Tests** | Vitest (unit) + Playwright (e2e) |
| **Entidades** | 19 |
| **Rutas API** | 40+ |
| **Páginas** | 25+ |

---

## 🎯 Convenciones de Nomenclatura

- **Rutas API**: `/api/[dominio]/[acción]`
- **Páginas Admin**: `/admin/[sección]/page.tsx`
- **Páginas Tienda**: `/[ruta]/page.tsx`
- **Componentes**: `PascalCase.tsx`
- **Hooks**: `use[Nombre].ts`
- **API Routes**: `route.ts`

## Generado: Abril 2025
