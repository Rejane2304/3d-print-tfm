# Análisis de Entidades - 3D Print TFM

## 📊 Modelo de Datos

### Resumen de Entidades

El sistema cuenta con **18 modelos** principales organizados en 4 categorías funcionales:

```
┌─────────────────────────────────────────┐
│           USUARIOS Y AUTH              │
├─────────────────────────────────────────┤
│ • Usuario                              │
│ • Cuenta (NextAuth)                    │
│ • Session                              │
│ • VerificationToken                    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│           CATÁLOGO Y SHOP              │
├─────────────────────────────────────────┤
│ • Producto                             │
│ • Categoría                            │
│ • Material                             │
│ • Stock/Movimientos                    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│           COMPRAS Y PAGOS              │
├─────────────────────────────────────────┤
│ • Carrito                              │
│ • ItemCarrito                          │
│ • Pedido                               │
│ • DetallePedido                        │
│ • Pago                                 │
│ • Factura                              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│           ADMIN Y LOGS                 │
├─────────────────────────────────────────┤
│ • Direccion                            │
│ • Alerta                               │
│ • MensajePedido                        │
│ • LogAuditoria                         │
│ • MovimientoInventario                 │
└─────────────────────────────────────────┘
```

---

## 👤 ENTIDADES DE USUARIO

### Usuario
**Propósito**: Gestión de usuarios del sistema

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| email | String | Email único para login |
| password | String | Hash bcrypt de contraseña |
| nombre | String | Nombre completo |
| rol | Enum | CLIENTE / ADMIN |
| nif | String | NIF español (facturación) |
| telefono | String | Contacto telefónico |
| activo | Boolean | Estado de la cuenta |
| emailVerificado | DateTime | Verificación de email |
| creadoEn | DateTime | Fecha de registro |

**Relaciones**:
- Uno a muchos: Pedidos, Facturas, Direcciones, Alertas
- Uno a uno: Cuenta (NextAuth)

**Reglas de Negocio**:
- Email debe ser único
- Rol por defecto: CLIENTE
- NIF validado formato español (8 dígitos + letra)

---

## 🛍️ ENTIDADES DE CATÁLOGO

### Producto
**Propósito**: Catálogo de productos impresos en 3D

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| nombre | String | Nombre del producto |
| slug | String | URL amigable única |
| descripcion | String | Descripción larga |
| descripcionCorta | String | Resumen (140 chars) |
| precio | Decimal | Precio en EUR |
| stock | Int | Unidades disponibles |
| stockMinimo | Int | Umbral alerta stock bajo |
| sku | String | Código único de producto |
| categoria | Enum | DECORACION / TECNICO / JOYERIA / ARTE / HOGAR |
| material | Enum | PLA / PETG / ABS / FLEX / RESINA |
| color | String | Color disponible |
| tiempoImpresion | Int | Minutos estimados |
| peso | Decimal | Gramos de filamento |
| dimensiones | Json | {largo, ancho, alto} |
| imagenes | Json | Array de URLs |
| activo | Boolean | Visible en tienda |
| destacado | Boolean | Aparece en home |

**Relaciones**:
- Uno a muchos: ItemsCarrito, DetallePedido, MovimientosInventario, Alertas
- Muchos a uno: Categoria (implícito), Material (implícito)

**Reglas de Negocio**:
- Slug único y SEO-friendly
- Stock no puede ser negativo
- Precio > 0
- Imagen principal obligatoria

---

### Material
**Propósito**: Tipos de filamentos disponibles

| Campo | Tipo | Descripción |
|-------|------|-------------|
| tipo | Enum | PLA / PETG / ABS / FLEX / RESINA |
| nombre | String | Nombre comercial |
| descripcion | String | Características |
| precioKg | Decimal | Coste por kg |
| biodegradable | Boolean | Eco-friendly |
| temperatura | Int | Temp impresión (°C) |

**Materiales Soportados**:
- **PLA**: Biodegradable, fácil impresión, colores variados
- **PETG**: Resistente, transparente, alimenticio
- **ABS**: Resistente a impactos, alta temperatura
- **FLEX**: Flexible, TPU
- **RESINA**: Alta calidad, detalle fino

---

## 🛒 ENTIDADES DE COMPRA

### Carrito
**Propósito**: Carrito temporal de compras

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador |
| usuarioId | UUID | Dueño del carrito |
| sessionId | String | Para usuarios anónimos |
| items | Relación | Productos en carrito |
| creadoEn | DateTime | Fecha creación |
| actualizadoEn | DateTime | Última modificación |

**Reglas de Negocio**:
- Un carrito por usuario
- Items expiran después de 30 días
- Stock verificado en checkout

---

### Pedido
**Propósito**: Registro de compras completadas

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| numeroPedido | String | P-20260001 (secuencial) |
| usuarioId | UUID | Cliente |
| estado | Enum | PENDIENTE / CONFIRMADO / PREPARANDO / ENVIADO / ENTREGADO / CANCELADO |
| subtotal | Decimal | Suma de items |
| envio | Decimal | Coste envío |
| total | Decimal | Total a pagar |
| nombreEnvio | String | Destinatario |
| direccionEnvio | String | Dirección completa |
| telefonoEnvio | String | Teléfono contacto |
| metodoPago | Enum | TARJETA / TRANSFERENCIA |
| notas | String | Instrucciones especiales |
| creadoEn | DateTime | Fecha del pedido |

**Relaciones**:
- Muchos a uno: Usuario
- Uno a muchos: DetallePedido, Pago, Factura, Mensajes

**Ciclo de Vida**:
```
PENDIENTE → CONFIRMADO → PREPARANDO → ENVIADO → ENTREGADO
     ↓
CANCELADO (en cualquier punto)
```

---

### Pago
**Propósito**: Registro de transacciones de pago

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador |
| pedidoId | UUID | Pedido asociado |
| stripeSessionId | String | Referencia Stripe |
| stripePaymentIntentId | String | ID de pago Stripe |
| monto | Decimal | Cantidad pagada |
| estado | Enum | PENDIENTE / COMPLETADO / FALLIDO / REEMBOLSADO |
# Entity Analysis - 3D Print TFM

## 📊 Data Model

### Entity Overview

The system has **18 main models** organized into 4 functional categories:

```
┌──────────────────────────────┐
│           USERS & AUTH                │
├──────────────────────────────┤
│ • User                                 │
│ • Account (NextAuth)                   │
│ • Session                              │
│ • VerificationToken                    │
└──────────────────────────────┘

┌──────────────────────────────┐
│           CATALOG & SHOP               │
├──────────────────────────────┤
│ • Product                              │
│ • Category                             │
│ • Material                             │
│ • Stock/Movements                      │
└──────────────────────────────┘

┌──────────────────────────────┐
│           PURCHASES & PAYMENTS         │
├──────────────────────────────┤
│ • Cart                                 │
│ • CartItem                             │
│ • Order                                │
│ • OrderDetail                          │
│ • Payment                              │
│ • Invoice                              │
└──────────────────────────────┘

┌──────────────────────────────┐
│           ADMIN & LOGS                 │
├──────────────────────────────┤
│ • Address                              │
│ • Alert                                │
│ • OrderMessage                         │
│ • AuditLog                             │
│ • InventoryMovement                    │
└──────────────────────────────┘
```

---

## 👤 USER ENTITIES

### User
**Purpose**: System user management

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| email | String | Unique email for login |
| password | String | Bcrypt password hash |
| name | String | Full name |
| role | Enum | CUSTOMER / ADMIN |
| nif | String | Spanish NIF (billing) |
| phone | String | Contact phone |
| active | Boolean | Account status |
| emailVerified | DateTime | Email verification |
| createdAt | DateTime | Registration date |

**Relations**:
- One-to-many: Orders, Invoices, Addresses, Alerts
- One-to-one: Account (NextAuth)

**Business Rules**:
- Email must be unique
- Default role: CUSTOMER
- NIF validated (Spanish format: 8 digits + letter)

---

## 🛍️ CATALOG ENTITIES

### Product
**Purpose**: 3D printed product catalog

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| name | String | Product name |
| slug | String | Unique SEO-friendly URL |
| description | String | Long description |
| shortDescription | String | Summary (140 chars) |
| price | Decimal | Price in EUR |
| stock | Int | Available units |
| minStock | Int | Low stock alert threshold |
| sku | String | Unique product code |
| category | Enum | DECORATION / TECHNICAL / JEWELRY / ART / HOME |
| material | Enum | PLA / PETG / ABS / FLEX / RESIN |
| color | String | Available color |
| printTime | Int | Estimated minutes |
| weight | Decimal | Filament grams |
| dimensions | Json | {length, width, height} |
| images | Json | Array of URLs |
| active | Boolean | Visible in store |
| featured | Boolean | Appears on home |

**Relations**:
- One-to-many: CartItems, OrderDetail, InventoryMovements, Alerts
- Many-to-one: Category (implicit), Material (implicit)

**Business Rules**:
- Unique, SEO-friendly slug
- Stock cannot be negative
- Price > 0
- Main image required

---

### Material
**Purpose**: Available filament types

| Field | Type | Description |
|-------|------|-------------|
| type | Enum | PLA / PETG / ABS / FLEX / RESIN |
| name | String | Commercial name |
| description | String | Features |
| pricePerKg | Decimal | Cost per kg |
| biodegradable | Boolean | Eco-friendly |
| temperature | Int | Print temp (°C) |

**Supported Materials**:
- **PLA**: Biodegradable, easy to print, many colors
- **PETG**: Resistant, transparent, food-safe
- **ABS**: Impact resistant, high temp
- **FLEX**: Flexible, TPU
- **RESIN**: High quality, fine detail

---

## 🛒 PURCHASE ENTITIES

### Cart
**Purpose**: Temporary shopping cart

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Identifier |
| userId | UUID | Cart owner |
| sessionId | String | For anonymous users |
| items | Relation | Products in cart |
| createdAt | DateTime | Creation date |
| updatedAt | DateTime | Last modification |

**Business Rules**:
- One cart per user
- Items expire after 30 days
- Stock checked at checkout

---

### Order
**Purpose**: Completed purchase record

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| orderNumber | String | P-20260001 (sequential) |
| userId | UUID | Customer |
| status | Enum | PENDING / CONFIRMED / PREPARING / SHIPPED / DELIVERED / CANCELLED |
| subtotal | Decimal | Item sum |
| shipping | Decimal | Shipping cost |
| total | Decimal | Total to pay |
| shippingName | String | Recipient |
| shippingAddress | String | Full address |
| shippingPhone | String | Contact phone |
| paymentMethod | Enum | CARD / TRANSFER |
| notes | String | Special instructions |
| createdAt | DateTime | Order date |

**Relations**:
- Many-to-one: User
- One-to-many: OrderDetail, Payment, Invoice, Messages

**Lifecycle**:
```
PENDING → CONFIRMED → PREPARING → SHIPPED → DELIVERED
     ↓
CANCELLED (at any point)
```

---

### Payment
**Purpose**: Payment transaction record

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Identifier |
| orderId | UUID | Associated order |
| stripeSessionId | String | Stripe reference |
| stripePaymentIntentId | String | Stripe payment ID |
| amount | Decimal | Amount paid |
| status | Enum | PENDING / COMPLETED / FAILED / REFUNDED |
| method | String | Card, transfer |
| receipt | String | Receipt URL |

---

### Invoice
**Purpose**: Spanish legal invoicing

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Identifier |
| invoiceNumber | String | F-2026-000001 (unique) |
| series | String | F (fixed) |
| number | Int | Sequential number |
| orderId | UUID | Invoiced order |
| companyName | String | Seller data |
| companyNif | String | B12345678 |
| customerName | String | Buyer data |
| customerNif | String | Customer NIF |
| baseAmount | Decimal | Subtotal |
| vatRate | Decimal | 21% (Spanish VAT) |
| vatAmount | Decimal | VAT amount |
| total | Decimal | Total with VAT |
| cancelled | Boolean | Cancelled invoice |
| pdfUrl | String | Generated PDF URL |

**Legal Format**:
- Numbering: F-YYYY-NNNNNN
- 21% VAT applicable
- Full issuer and receiver data
- Cannot be deleted (only cancelled)

---

## 📍 AUXILIARY ENTITIES

### Address
**Purpose**: Saved shipping addresses

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Identifier |
| userId | UUID | Owner |
| name | String | Title ("Home", "Office") |
| street | String | Full address |
| city | String | City |
| province | String | Province |
| zip | String | Postal code |
| country | String | Spain (default) |
| main | Boolean | Default address |

---

## 🔔 ADMIN ENTITIES

### Alert
**Purpose**: System notification system

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Identifier |
| type | Enum | LOW_STOCK / OUT_OF_STOCK / UNPAID_ORDER / LATE_ORDER / SYSTEM_ERROR |
| severity | Enum | LOW / MEDIUM / HIGH / CRITICAL |
| title | String | Short summary |
| message | String | Full description |
| productId | UUID | Related product (optional) |
| orderId | UUID | Related order (optional) |
| status | Enum | PENDING / IN_PROGRESS / RESOLVED / IGNORED |
| resolvedBy | UUID | Admin who resolved |
| resolvedAt | DateTime | Resolution date |
| resolutionNotes | String | Internal notes |

**Rules**:
- Automatically generated by the system
- Low stock: when stock < minStock
- Unpaid order: >24h since creation

---

### OrderMessage
**Purpose**: Chat between admin and customers in orders

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Identifier |
| orderId | UUID | Associated order |
| userId | UUID | Message author |
| message | String | Content (max 1000 chars) |
| fromCustomer | Boolean | true = customer, false = admin |
| attachments | Json | URLs of attached files |
| read | Boolean | Read status |
| readAt | DateTime | Read date |
| createdAt | DateTime | Sent date |

**Rules**:
- Only participants: admin and order owner
- Messages ordered by date