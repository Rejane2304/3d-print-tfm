# Migración a Estándares de Industria (Inglés)

**Fecha inicio:** 2 Abril 2026  
**Branch:** `refactor/english-migration`  
**Status:** 🟡 EN PROGRESO

---

## FASES

### FASE 1: Base de Datos y Prisma 🟡 INICIADA
- [ ] Backup de base de datos
- [ ] Actualizar schema.prisma (16 models, 11 enums, 60+ fields)
- [ ] Crear migración
- [ ] Actualizar seed.ts
- [ ] Verificación

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

### 2026-04-02 19:XX - Inicio FASE 1
- ✅ Backup creado en `.backups/`
- 🔄 Comenzando actualización de schema.prisma

---

## 🗂️ MAPEO DE CAMBIOS

### Models (16):
```
Usuario → User
Producto → Product
Pedido → Order
Carrito → Cart
Pago → Payment
Direccion → Address
ItemPedido → OrderItem
ItemCarrito → CartItem
ImagenProducto → ProductImage
MovimientoInventario → InventoryMovement
Alerta → Alert
Factura → Invoice
MensajePedido → OrderMessage
ConfiguracionEnvio → ShippingConfig
Configuracion → SiteConfig
LogAuditoria → AuditLog
```

### Enums (11):
```
Rol → Role
Categoria → Category
EstadoPedido → OrderStatus
MetodoPago → PaymentMethod
EstadoPago → PaymentStatus
TipoMovimiento → MovementType
TipoAlerta → AlertType
SeveridadAlerta → AlertSeverity
EstadoAlerta → AlertStatus
```

### Fields principales:
```
nombre → name
descripcion → description
precio → price
cantidad → quantity
subtotal → subtotal
direccion → address
telefono → phone
codigoPostal → postalCode
ciudad → city
provincia → province
pais → country
estado → status
metodoPago → paymentMethod
activo → isActive
creadoEn → createdAt
actualizadoEn → updatedAt
usuarioId → userId
productoId → productId
pedidoId → orderId
```
