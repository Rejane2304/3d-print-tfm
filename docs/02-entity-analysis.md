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
| metodo | String | Tarjeta, transferencia |
| comprobante | String | URL de comprobante |

---

### Factura
**Propósito**: Facturación legal española

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador |
| numeroFactura | String | F-2026-000001 (único) |
| serie | String | F (fijo) |
| numero | Int | Secuencial numérico |
| pedidoId | UUID | Pedido facturado |
| empresaNombre | String | Datos del vendedor |
| empresaNif | String | B12345678 |
| clienteNombre | String | Datos del comprador |
| clienteNif | String | NIF del cliente |
| baseImponible | Decimal | Subtotal |
| tipoIva | Decimal | 21% (IVA español) |
| cuotaIva | Decimal | Cantidad IVA |
| total | Decimal | Total con IVA |
| anulada | Boolean | Factura anulada |
| pdfUrl | String | URL del PDF generado |

**Formato Legal**:
- Numeración: F-AAAA-NNNNNN
- IVA 21% aplicable
- Datos completos emisor y receptor
- No se pueden eliminar (solo anular)

---

## 📍 ENTIDADES AUXILIARES

### Direccion
**Propósito**: Direcciones de envío guardadas

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador |
| usuarioId | UUID | Propietario |
| nombre | String | Título ("Casa", "Oficina") |
| calle | String | Dirección completa |
| ciudad | String | Ciudad |
| provincia | String | Provincia |
| cp | String | Código postal |
| pais | String | España (por defecto) |
| principal | Boolean | Dirección por defecto |

---

## 🔔 ENTIDADES DE ADMIN

### Alerta
**Propósito**: Sistema de notificaciones del sistema

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador |
| tipo | Enum | STOCK_BAJO / STOCK_AGOTADO / PEDIDO_SIN_PAGAR / PEDIDO_ATRASADO / ERROR_SISTEMA |
| severidad | Enum | BAJA / MEDIA / ALTA / CRITICA |
| titulo | String | Resumen breve |
| mensaje | String | Descripción completa |
| productoId | UUID | Producto relacionado (opcional) |
| pedidoId | UUID | Pedido relacionado (opcional) |
| estado | Enum | PENDIENTE / EN_PROCESO / RESUELTA / IGNORADA |
| resueltaPor | UUID | Admin que resolvió |
| resueltaEn | DateTime | Fecha resolución |
| notasResolucion | String | Notas internas |

**Reglas**:
- Generadas automáticamente por el sistema
- Stock bajo: cuando stock < stockMinimo
- Pedido sin pagar: >24h desde creación

---

### MensajePedido
**Propósito**: Chat entre admin y clientes en pedidos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador |
| pedidoId | UUID | Pedido asociado |
| usuarioId | UUID | Autor del mensaje |
| mensaje | String | Contenido (max 1000 chars) |
| esDeCliente | Boolean | true = cliente, false = admin |
| adjuntos | Json | URLs archivos adjuntos |
| leido | Boolean | Estado de lectura |
| leidoEn | DateTime | Fecha lectura |
| creadoEn | DateTime | Fecha envío |

**Reglas**:
- Solo participantes: admin y dueño del pedido
- Mensajes ordenados por fecha
- Marcado de leído

---

### MovimientoInventario
**Propósito**: Tracking de cambios de stock

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador |
| productoId | UUID | Producto afectado |
| tipo | Enum | ENTRADA / SALIDA / AJUSTE |
| cantidad | Int | Positivo o negativo |
| stockAnterior | Int | Stock antes del movimiento |
| stockNuevo | Int | Stock después |
| motivo | String | Razón del movimiento |
| referencia | String | ID de pedido o ajuste |
| creadoPor | UUID | Usuario que realizó |
| creadoEn | DateTime | Fecha del movimiento |

**Reglas**:
- Trazabilidad completa
- No se pueden eliminar (solo anular con movimiento contrario)
- Automático en ventas, manual en ajustes

---

## 🔐 AUTENTICACIÓN (NextAuth)

### Cuenta, Session, VerificationToken
**Uso**: Interno de NextAuth.js

- **Cuenta**: Vinculación con proveedores OAuth (Google, etc.)
- **Session**: Sesiones activas del usuario
- **VerificationToken**: Tokens para verificación de email

---

## 📐 Diagrama ER Simplificado

```
USUARIO ||--o{ PEDIDO : realiza
USUARIO ||--o{ CARRITO : posee
USUARIO ||--o{ DIRECCION : tiene
USUARIO ||--o{ FACTURA : emite

PRODUCTO }o--|| CATEGORIA : pertenece
PRODUCTO }o--|| MATERIAL : usa
PRODUCTO ||--o{ ITEM_CARRITO : en
PRODUCTO ||--o{ DETALLE_PEDIDO : incluido
PRODUCTO ||--o{ MOVIMIENTO_INVENTARIO : afecta
PRODUCTO ||--o{ ALERTA : genera

PEDIDO ||--|{ DETALLE_PEDIDO : contiene
PEDIDO ||--o| PAGO : tiene
PEDIDO ||--o| FACTURA : genera
PEDIDO ||--o{ MENSAJE : incluye

CARRITO ||--|{ ITEM_CARRITO : contiene
```

---

## 🎯 Índices de Rendimiento

### Índices Creados (Optimización)

| Tabla | Índice | Uso |
|-------|--------|-----|
| Producto | slug | Búsquedas URL |
| Producto | categoria + activo | Filtrado catálogo |
| Producto | destacado | Home page |
| Pedido | usuarioId + creadoEn | Historial de cliente |
| Pedido | estado | Gestión de pedidos admin |
| Pedido | numeroPedido | Búsqueda de pedidos |
| Factura | numeroFactura | Búsqueda única |
| Factura | clienteNif | Filtrado por cliente |
| Alerta | tipo + estado | Dashboard admin |
| Alerta | severidad | Priorización |

---

## 📈 Estadísticas de Modelo

- **Tablas principales**: 18
- **Relaciones**: 25+
- **Enums**: 8
- **Índices**: 40+
- **Campos validados**: 150+

**Estado**: ✅ Modelo finalizado y probado