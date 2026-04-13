# Estructura de Carpetas del Proyecto

```
3d-print-tfm/
│
├── 📁 .agent/                    # Configuración de agentes IA
│   └── config/
│       └── delegation-rules.json
│
├── 📁 .backups/                  # Backups automáticos
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
│   ├── ESTRUCTURA_CARPETAS.md   # Este archivo
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
│   ├── schema.prisma             # Esquema de Prisma (24+ entidades)
│   ├── migrations/
│   │   └── [migraciones automáticas]
│   └── seed.ts                   # Datos iniciales (semilla)
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
│   ├── create-realistic-hero.py
│   └── wait-for-postgres.js
│
├── 📁 src/                       # 💻 Código fuente principal
│   │
│   ├── 📁 app/                   # Next.js App Router
│   │   ├── 📁 (auth)/            # Rutas de autenticación
│   │   │   └── auth/page.tsx     # Página /auth unificada
│   │   │
│   │   ├── 📁 admin/             # Panel de administración (15+ módulos)
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── orders/page.tsx
│   │   │   ├── orders/[id]/page.tsx
│   │   │   ├── products/page.tsx
│   │   │   ├── products/new/page.tsx
│   │   │   ├── products/[id]/editar/page.tsx
│   │   │   ├── categories/page.tsx
│   │   │   ├── categories/[id]/page.tsx
│   │   │   ├── categories/new/page.tsx
│   │   │   ├── inventory/page.tsx
│   │   │   ├── inventory/[id]/page.tsx
│   │   │   ├── clients/page.tsx
│   │   │   ├── clients/[id]/page.tsx
│   │   │   ├── coupons/page.tsx
│   │   │   ├── coupons/new/page.tsx
│   │   │   ├── coupons/[id]/page.tsx
│   │   │   ├── faqs/page.tsx
│   │   │   ├── faqs/new/page.tsx
│   │   │   ├── faqs/[id]/page.tsx
│   │   │   ├── alerts/page.tsx
│   │   │   ├── reviews/page.tsx
│   │   │   ├── invoices/page.tsx
│   │   │   ├── invoices/[id]/page.tsx
│   │   │   ├── shipping/page.tsx
│   │   │   ├── shipping/new/page.tsx
│   │   │   ├── shipping/[id]/page.tsx
│   │   │   └── site-config/page.tsx
│   │   │
│   │   ├── 📁 api/               # API Routes (62+ endpoints)
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/route.ts
│   │   │   │   └── register/route.ts
│   │   │   ├── account/
│   │   │   │   ├── profile/route.ts
│   │   │   │   ├── addresses/route.ts
│   │   │   │   ├── orders/route.ts
│   │   │   │   ├── orders/[id]/route.ts
│   │   │   │   ├── reviews/route.ts
│   │   │   │   ├── invoices/route.ts
│   │   │   │   └── invoices/[id]/
│   │   │   │       ├── route.ts
│   │   │   │       └── pdf/route.ts
│   │   │   ├── cart/
│   │   │   │   ├── route.ts
│   │   │   │   ├── clear/route.ts
│   │   │   │   └── [itemId]/route.ts
│   │   │   ├── products/
│   │   │   │   ├── route.ts
│   │   │   │   └── [slug]/route.ts
│   │   │   ├── categories/route.ts
│   │   │   ├── reviews/
│   │   │   │   ├── route.ts
│   │   │   │   ├── [id]/route.ts
│   │   │   │   └── product/[productId]/route.ts
│   │   │   ├── faqs/route.ts
│   │   │   ├── checkout/
│   │   │   │   ├── route.ts
│   │   │   │   ├── confirm-payment/route.ts
│   │   │   │   └── verify/route.ts
│   │   │   ├── payments/
│   │   │   │   ├── stripe/
│   │   │   │   │   └── create-order/route.ts
│   │   │   │   └── paypal/
│   │   │   │       ├── create-order/route.ts
│   │   │   │       └── capture-order/route.ts
│   │   │   ├── shipping/
│   │   │   │   ├── calculate/route.ts
│   │   │   │   └── zones/route.ts
│   │   │   ├── coupons/
│   │   │   │   ├── apply/route.ts
│   │   │   │   └── validate/route.ts
│   │   │   ├── admin/
│   │   │   │   ├── analytics/route.ts
│   │   │   │   ├── metrics/route.ts
│   │   │   │   ├── orders/route.ts
│   │   │   │   ├── orders/[id]/route.ts
│   │   │   │   ├── products/route.ts
│   │   │   │   ├── products/[slug]/route.ts
│   │   │   │   ├── inventory/route.ts
│   │   │   │   ├── inventory/[id]/route.ts
│   │   │   │   ├── inventory/[id]/adjust/route.ts
│   │   │   │   ├── inventory/[id]/history/route.ts
│   │   │   │   ├── categories/route.ts
│   │   │   │   ├── categories/[id]/route.ts
│   │   │   │   ├── clients/route.ts
│   │   │   │   ├── clients/[id]/route.ts
│   │   │   │   ├── faqs/route.ts
│   │   │   │   ├── faqs/[id]/route.ts
│   │   │   │   ├── coupons/route.ts
│   │   │   │   ├── coupons/[id]/route.ts
│   │   │   │   ├── alerts/route.ts
│   │   │   │   ├── alerts/[id]/route.ts
│   │   │   │   ├── config/route.ts
│   │   │   │   ├── invoices/route.ts
│   │   │   │   ├── invoices/[id]/route.ts
│   │   │   │   ├── invoices/[id]/pdf/route.ts
│   │   │   │   ├── reviews/route.ts
│   │   │   │   ├── reviews/[id]/route.ts
│   │   │   │   ├── shipping/route.ts
│   │   │   │   ├── shipping/[id]/route.ts
│   │   │   │   ├── upload/route.ts
│   │   │   │   └── users/[id]/unlock/route.ts
│   │   │   ├── webhooks/
│   │   │   │   └── stripe/route.ts
│   │   │   └── events/route.ts
│   │   │
│   │   ├── 📁 [páginas públicas]/
│   │   │   ├── page.tsx              # Página de inicio
│   │   │   ├── faqs/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   ├── cart/page.tsx
│   │   │   ├── checkout/page.tsx
│   │   │   ├── products/page.tsx
│   │   │   ├── products/[slug]/page.tsx
│   │   │   ├── account/
│   │   │   │   ├── profile/page.tsx
│   │   │   │   ├── orders/page.tsx
│   │   │   │   ├── orders/[id]/page.tsx
│   │   │   │   ├── addresses/page.tsx
│   │   │   │   ├── invoices/page.tsx
│   │   │   │   └── reviews/page.tsx
│   │   │
│   │   ├── layout.tsx            # Layout raíz
│   │   ├── globals.css           # Estilos globales
│   │   └── loading.tsx           # Loading state global
│   │
│   ├── 📁 components/            # 🧩 Componentes React
│   │   ├── admin/                # Componentes de admin
│   │   │   ├── RealTimeNotifications.tsx
│   │   │   └── DashboardMetricsUpdater.tsx
│   │   ├── auth/                 # Componentes de autenticación
│   │   │   └── PasswordStrength.tsx
│   │   ├── cart/                 # Componentes del carrito
│   │   │   ├── CartIcon.tsx
│   │   │   ├── CartItem.tsx
│   │   │   ├── CartSummary.tsx
│   │   │   └── CouponInput.tsx
│   │   ├── checkout/             # Componentes de checkout
│   │   ├── layout/               # Header, Footer, Layout
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   ├── orders/               # Componentes de pedidos
│   │   │   └── OrderProgressBar.tsx
│   │   ├── payment/              # PayPalButton, etc.
│   │   │   └── PayPalButton.tsx
│   │   ├── products/             # ProductCard, AddToCartButton
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductImageGallery.tsx
│   │   │   ├── AddToCartButton.tsx
│   │   │   ├── FilterSidebar.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   └── SortSelector.tsx
│   │   ├── providers/            # Providers de contexto
│   │   │   ├── CartPersistenceProvider.tsx
│   │   │   ├── PayPalProvider.tsx
│   │   │   └── SessionProvider.tsx
│   │   ├── reviews/              # ReviewsList, ReviewForm
│   │   │   ├── ReviewsList.tsx
│   │   │   ├── ReviewForm.tsx
│   │   │   └── ReviewFormClient.tsx
│   │   ├── invoices/             # InvoiceViewer
│   │   │   ├── InvoiceViewer.tsx
│   │   │   └── InvoiceNotAvailableModal.tsx
│   │   └── ui/                   # Componentes UI reutilizables
│   │       ├── Button.tsx
│   │       ├── DataTable.tsx
│   │       ├── ConfirmModal.tsx
│   │       ├── Input.tsx
│   │       ├── StarRating.tsx
│   │       └── PhoneInput.tsx
│   │
│   ├── 📁 hooks/                 # 🎣 Custom React Hooks
│   │   ├── useCart.ts
│   │   ├── useCoupon.ts
│   │   ├── useRealTime.ts
│   │   └── useCartPersistence.ts
│   │
│   ├── 📁 lib/                   # 📚 Librerías y utilidades
│   │   ├── alerts/
│   │   │   └── alert-service.ts   # Servicio de alertas
│   │   ├── auth/
│   │   │   └── auth-options.ts
│   │   ├── db/
│   │   │   └── prisma.ts
│   │   ├── errors/
│   │   │   └── api-wrapper.ts
│   │   ├── i18n/
│   │   │   └── index.ts          # Sistema de traducción backend
│   │   ├── invoices/
│   │   │   └── invoice-service.ts
│   │   ├── realtime/
│   │   │   ├── event-service.ts
│   │   │   └── event-store.ts
│   │   ├── validators/
│   │   │   └── index.ts          # Esquemas Zod
│   │   ├── auth.ts
│   │   └── rate-limit.ts
│   │
│   ├── 📁 providers/             # 🔄 Context Providers
│   │   ├── SiteConfigProvider.tsx
│   │   └── ToastProvider.tsx
│   │
│   ├── 📁 types/                 # 📋 TypeScript Types
│   │   ├── next-auth.d.ts
│   │   └── invoice.ts
│   │
│   └── middleware.ts             # 🛡️ Next.js Middleware
│       # (protección de rutas, rate limiting)
│
├── 📁 test-results/              # Resultados de tests E2E
│
├── 📁 tests/                     # 🧪 Tests
│   ├── e2e/                      # Tests E2E (Playwright)
│   │   ├── auth.spec.ts
│   │   ├── shop.spec.ts
│   │   └── admin.spec.ts
│   ├── integration/              # Tests de integración
│   │   ├── helpers.ts
│   │   └── api/
│   │       ├── auth.test.ts
│   │       ├── products.test.ts
│   │       ├── cart.test.ts
│   │       ├── checkout.test.ts
│   │       ├── orders.test.ts
│   │       ├── admin-clients.test.ts
│   │       ├── addresses.test.ts
│   │       └── invoices.test.ts
│   ├── unit/                     # Tests unitarios
│   │   ├── components/
│   │   ├── helpers/
│   │   ├── security/
│   │   ├── validators/
│   │   │   ├── auth.test.ts
│   │   │   ├── product.test.ts
│   │   │   ├── order.test.ts
│   │   │   ├── address.test.ts
│   │   │   └── password-security.test.ts
│   │   ├── middleware.test.ts
│   │   └── validaciones.test.ts
│   ├── setup.ts                  # Configuración de tests
│   ├── setup.components.ts
│   └── helpers.ts
│
├── 📄 Archivos Raíz
│   ├── .env                      # Variables de entorno
│   ├── .env.example
│   ├── .env.test
│   ├── .eslintrc.json            # Configuración ESLint
│   ├── .gitignore
│   ├── AGENTS.md                 # Guía para agentes IA
│   ├── CHANGELOG.md
│   ├── README.md                 # Documentación principal
│   ├── docker-compose.test.yml   # Docker para tests
│   ├── next.config.mjs           # Configuración Next.js
│   ├── package.json
│   ├── playwright.config.ts      # Configuración Playwright
│   ├── postcss.config.mjs
│   ├── tailwind.config.ts        # Configuración Tailwind CSS
│   ├── tsconfig.json
│   ├── vitest.config.ts          # Configuración Vitest
│   ├── vitest.integration.config.ts
│   └── TEST_MATRIX.csv           # Matriz de tests
```

---

## 📊 Estadísticas del Proyecto

| Métrica                | Valor                                 |
| ---------------------- | ------------------------------------- |
| **Lenguaje Principal** | TypeScript                            |
| **Framework**          | Next.js 14 (App Router)               |
| **Base de Datos**      | PostgreSQL + Prisma ORM               |
| **Estilos**            | Tailwind CSS                          |
| **Tests**              | Vitest (unitarios) + Playwright (e2e) |
| **Entidades BD**       | 24+                                   |
| **Rutas API**          | 62+                                   |
| **Páginas Admin**      | 15+ módulos                           |
| **Archivos Git**       | 315+                                  |
| **Archivos Fuente**    | 166 (TS/TSX)                          |

---

## 🎯 Convenciones de Nomenclatura

- **Rutas API**: `/api/[dominio]/[acción]`
- **Páginas Admin**: `/admin/[sección]/page.tsx`
- **Páginas Tienda**: `/[ruta]/page.tsx`
- **Componentes**: `PascalCase.tsx`
- **Hooks**: `use[Nombre].ts`
- **API Routes**: `route.ts`
- **Traducción**: Todos los textos en español (backend traduce)

## Generado: Abril 2026
