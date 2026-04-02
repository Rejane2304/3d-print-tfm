# Migración a Estándares de Industria (Inglés)

**Fecha inicio:** 2 Abril 2026  
**Branch:** `refactor/english-migration`  
**Status:** ✅ COMPLETADA - FASE 1

---

## FASES

### FASE 1: Base de Datos y Prisma ✅ COMPLETADA
- [x] Reescribir schema.prisma (17 models, 11 enums, 60+ fields) - 100% INGLÉS
- [x] Todos los nombres de modelos en inglés: User, Product, Order, etc.
- [x] Todos los nombres de campos en inglés: name, price, quantity, etc.
- [x] Todos los valores de enums en inglés: CUSTOMER, PENDING, SHIPPED, etc.
- [x] Usar @map() para mantener compatibilidad con nombres de columnas en BD
- [x] Reescribir seed.ts con nombres en inglés
- [x] Forzar push a BD: `npx prisma db push --force-reset`
- [x] Ejecutar seed: ✅ 38 registros creados (10 users, 10 products, 10 orders, 8 alerts)
- [x] Limpiar archivos temporales
- [x] Commit: `28b5e12` - feat: migrate Prisma schema to English with @map()

### FASE 2: Código Core 🔴 PENDIENTE
- [ ] /src/lib/validators/index.ts
- [ ] /src/lib/auth/auth-options.ts
- [ ] /src/types/next-auth.d.ts
- [ ] API Routes (26 archivos)
- [ ] Components (14 archivos)
- [ ] Hooks (2 archivos)

### FASE 3: Tests 🔴 PENDIENTE
- [ ] tests/helpers.ts
- [ ] Integration tests (6 archivos)
- [ ] E2E tests (6 archivos)
- [ ] Unit tests

### FASE 4: Verificación Final 🔴 PENDIENTE
- [ ] Build sin errores
- [ ] Tests pasando
- [ ] Documentación actualizada
- [ ] Commit final

---

## 📝 REGISTRO DE CAMBIOS

### 2026-04-02 21:XX - FASE 1 COMPLETADA
- ✅ Schema.prisma 100% en inglés (nombres de modelos, campos Y valores de enums)
- ✅ BD sincronizada con `prisma db push --force-reset`
- ✅ Seed ejecutado exitosamente (38 registros)
- ✅ Archivos temporales eliminados
- ✅ Commit realizado: `28b5e12`

---

## 🗂️ MAPEO DE CAMBIOS PRISMA - 100% EN INGLÉS

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
Session → Session (sin cambio)
LogAuditoria → AuditLog
```

### Enums (11) - Nombres Y valores en inglés:
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
Material → Material (sin cambios - ya estaban en inglés)
```

### Campos principales con @map():
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
country → @map("pais") - default("Spain") en lugar de "España"
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

## ✅ RESULTADO FASE 1

**Base de datos:**
- ✅ Schema 100% en inglés
- ✅ BD sincronizada
- ✅ 38 registros de seed creados exitosamente
- ✅ Prisma Client regenerado sin errores

**Archivos modificados:**
- ✅ `prisma/schema.prisma` - 100% inglés
- ✅ `prisma/seed.ts` - Actualizado con enums en inglés

**Commits:**
- ✅ `28b5e12` - feat: migrate Prisma schema to English with @map()

---

## 📋 PRÓXIMOS PASOS - FASE 2

Actualizar archivos de código fuente para usar los nuevos nombres de Prisma:

1. **src/lib/validators/index.ts** - Actualizar referencias a enums (Category, OrderStatus, etc.)
2. **src/lib/auth/auth-options.ts** - Actualizar referencias a User, Role
3. **src/types/next-auth.d.ts** - Actualizar tipos de sesión
4. **API Routes** - Actualizar todas las referencias de modelos (producto → product, etc.)
5. **Components** - Actualizar props e interfaces
6. **Hooks** - Actualizar useCart y otros

**Nota:** El código ahora usa nombres 100% en inglés, pero los valores de la UI siguen en español.
