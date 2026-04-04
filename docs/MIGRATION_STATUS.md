# Migration to Industry Standards (English)

**Start date:** April 2, 2026  
**Branch:** `refactor/english-migration`  
**Status:** ✅ COMPLETED - PHASE 1

---

## PHASES

### PHASE 1: Database and Prisma ✅ COMPLETED
- [x] Rewrite schema.prisma (17 models, 11 enums, 60+ fields) - 100% ENGLISH
- [x] All model names in English: User, Product, Order, etc.
- [x] All field names in English: name, price, quantity, etc.
- [x] All enum values in English: CUSTOMER, PENDING, SHIPPED, etc.
- [x] Use @map() to maintain compatibility with DB column names
- [x] Rewrite seed.ts with names in English
- [x] Force push to DB: `npx prisma db push --force-reset`
- [x] Execute seed: ✅ 38 records created (10 users, 10 products, 10 orders, 8 alerts)
- [x] Clean temporary files
- [x] Commit: `28b5e12` - feat: migrate Prisma schema to English with @map()

### PHASE 2: Core Code 🔴 PENDING
- [ ] /src/lib/validators/index.ts
- [ ] /src/lib/auth/auth-options.ts
- [ ] /src/types/next-auth.d.ts
- [ ] API Routes (26 files)
- [ ] Components (14 files)
- [ ] Hooks (2 files)

### PHASE 3: Tests 🔴 PENDING
- [ ] tests/helpers.ts
- [ ] Integration tests (6 files)
- [ ] E2E tests (6 files)
- [ ] Unit tests

### PHASE 4: Final Verification 🔴 PENDING
- [ ] Build without errors
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Final commit

---

## 📝 CHANGE LOG

### 2026-04-02 21:XX - PHASE 1 COMPLETED
- ✅ Schema.prisma 100% in English (model names, fields AND enum values)
- ✅ DB synchronized with `prisma db push --force-reset`
- ✅ Seed executed successfully (38 records)
- ✅ Temporary files deleted
- ✅ Commit made: `28b5e12`

---

## 🗂️ PRISMA CHANGES MAPPING - 100% IN ENGLISH

### Models (17):
```
Usuario → User
Direccion → Address
Producto → Product
ImagenProducto → ProductImage
Carrito → Cart
ItemCarrito → CartItem
Pedido → Order
ItemPedido → OrderItem
Pago → Payment
MovimientoInventario → InventoryMovement
Alerta → Alert
Factura → Invoice
MensajePedido → OrderMessage
ConfiguracionEnvio → ShippingConfig
Configuracion → SiteConfig
Session → Session (no change)
LogAuditoria → AuditLog
```

### Enums (11) - Names AND values in English:
```
Rol → Role (CLIENTE → CUSTOMER, ADMIN → ADMIN)
Categoria → Category (DECORACION → DECORATION, ACCESORIOS → ACCESSORIES, etc.)
EstadoPedido → OrderStatus (PENDIENTE → PENDING, CONFIRMADO → CONFIRMED, etc.)
MetodoPago → PaymentMethod (TARJETA → CARD, BIZUM → BIZUM, TRANSFERENCIA → TRANSFER)
EstadoPago → PaymentStatus (PENDIENTE → PENDING, PROCESANDO → PROCESSING, etc.)
TipoMovimiento → MovementType (ENTRADA → IN, SALIDA → OUT, etc.)
TipoAlerta → AlertType (STOCK_BAJO → LOW_STOCK, SIN_STOCK → OUT_OF_STOCK, etc.)
SeveridadAlerta → AlertSeverity (BAJA → LOW, MEDIA → MEDIUM, etc.)
EstadoAlerta → AlertStatus (PENDIENTE → PENDING, EN_PROGRESO → IN_PROGRESS, etc.)
Material → Material (no changes - already in English)
```

### Main fields with @map():
```
name → @map("nombre")
description → @map("descripcion")
price → @map("precio")
quantity → @map("cantidad")
address → @map("direccion")
phone → @map("telefono")
postalCode → @map("codigoPostal")
city → @map("ciudad")
province → @map("provincia")
country → @map("pais") - default("Spain") instead of "España"
status → @map("estado")
paymentMethod → @map("metodoPago")
isActive → @map("activo")
createdAt → @map("creadoEn")
updatedAt → @map("actualizadoEn")
userId → @map("usuarioId")
productId → @map("productoId")
orderId → @map("pedidoId")
```

---

## ✅ PHASE 1 RESULT

**Database:**
- ✅ Schema 100% in English
- ✅ DB synchronized
- ✅ 38 seed records created successfully
- ✅ Prisma Client regenerated without errors

**Modified files:**
- ✅ `prisma/schema.prisma` - 100% English
- ✅ `prisma/seed.ts` - Updated with English enums

**Commits:**
- ✅ `28b5e12` - feat: migrate Prisma schema to English with @map()

---

## 📋 NEXT STEPS - PHASE 2

Update source code files to use the new Prisma names:

1. **src/lib/validators/index.ts** - Update enum references (Category, OrderStatus, etc.)
2. **src/lib/auth/auth-options.ts** - Update references to User, Role
3. **src/types/next-auth.d.ts** - Update session types
4. **API Routes** - Update all model references (producto → product, etc.)
5. **Components** - Update props and interfaces
6. **Hooks** - Update useCart and others

**Note:** The code now uses 100% English names, but UI values remain in Spanish.
