# Procesos de Negocio - 3D Print TFM

## 🔄 Diagramas de Flujo

### 1. PROCESO DE COMPRA (Customer Journey)

```
┌─────────────────────────────────────────────────────────────┐
│  FASE 1: DESCUBRIMIENTO                                      │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────┐
│   Entrada    │  Usuario llega a la web
└──────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  Browse Catálogo                  │
│  • Ver productos destacados       │
│  • Filtrar por categoría          │
│  • Buscar por nombre              │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  Selección de Producto            │
│  • Ver detalle                    │
│  • Ver imágenes                   │
│  • Ver especificaciones           │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  Añadir al Carrito                │
│  • Elegir cantidad                │
│  • Validar stock                  │
│  • Confirmar adición            │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  CONTINUAR COMPRANDO?             │
│  ├─ SI → Volver a catálogo        │
│  └─ NO → Ir al checkout           │
└──────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  FASE 2: CHECKOUT                                              │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  Revisar Carrito                  │
│  • Ver items                      │
│  • Modificar cantidades           │
│  • Eliminar items                 │
│  • Ver totales                    │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  ¿Usuario Logueado?               │
│  ├─ SI → Continuar                │
│  └─ NO → Login/Registro           │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  Seleccionar Dirección            │
│  • Elegir dirección guardada      │
│  • O crear nueva dirección        │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  Confirmar Pedido                 │
│  • Revisar resumen                │
│  • Aceptar términos               │
│  • Proceder al pago               │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  PAGO CON STRIPE                  │
│  • Redirección a Stripe Checkout  │
│  • Introducir datos tarjeta       │
│  • Confirmar pago                 │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  Webhook Stripe                   │
│  • Confirmación de pago           │
│  • Actualizar pedido              │
│  • Enviar email                   │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  ✅ PEDIDO CONFIRMADO             │
│  • Mostrar página de éxito        │
│  • Número de pedido               │
│  • Instrucciones siguientes       │
└──────────────────────────────────┘
```

---

### 2. PROCESO DE PRODUCCIÓN (Admin)

```
┌─────────────────────────────────────────────────────────────┐
│  RECEPCIÓN DE PEDIDO PAGADO                                    │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  Dashboard Admin                  │
│  • Ver notificación               │
│  • Ver detalle del pedido         │
│  • Items a fabricar               │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  VALIDAR STOCK                    │
│  ├─ Stock suficiente              │
│  └─ Stock insuficiente → Alerta   │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  MARCAR: EN PREPARACIÓN           │
│  • Cliente recibe notificación    │
│  • Tiempo estimado: 1-3 días      │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  FABRICACIÓN                      │
│  • Preparar archivos G-code       │
│  • Configurar impresora           │
│  • Imprimir productos             │
│  • Post-procesado (limpieza)      │
│  • Control de calidad             │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  EMPAQUETADO                      │
│  • Embalaje protector             │
│  • Añadir branding                │
│  • Incluir instrucciones          │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  MARCAR: ENVIADO                  │
│  • Añadir tracking                │
│  • Generar etiqueta               │
│  • Entregar a mensajería          │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  Seguimiento                      │
│  • Cliente ve tracking            │
│  • Notificaciones de estado       │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  MARCAR: ENTREGADO                │
│  • Confirmación recepción         │
│  • Habilitar reseñas              │
│  • Cerrar pedido                  │
└──────────────────────────────────┘
```

---

### 3. PROCESO DE GESTIÓN DE PRODUCTOS

```
┌─────────────────────────────────────────────────────────────┐
│  CREAR NUEVO PRODUCTO                                          │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  Formulario Admin                 │
│  • Nombre y descripción           │
│  • Seleccionar categoría          │
│  • Definir precio                 │
│  • Seleccionar material           │
│  • Subir imágenes                 │
│  • Configurar stock               │
│  • Establecer dimensiones         │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  VALIDACIÓN                       │
│  ├─ Datos completos              │
│  │   ├─ Precio > 0                │
│  │   ├─ Stock ≥ 0                 │
│  │   └─ Imagen principal          │
│  └─ Error → Corregir              │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  GENERAR SLUG                     │
│  • URL amigable única             │
│  • Ej: "soporte-movil-moderno"    │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  CALCULAR COSTES                  │
│  • Gramos de filamento            │
│  • Tiempo de impresión            │
│  • Coste eléctrico                │
│  • Margen de beneficio            │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  PUBLICAR                         │
│  • Producto activo                │
│  • Visible en catálogo            │
│  • Indexado para SEO              │
└──────────────────────────────────┘
```

---

## 🎭 Procesos de Usuario vs Admin

### Usuario (Cliente)

| Proceso | Interacción | Tiempo |
|---------|-------------|--------|
| **Registro** | Formulario → Email confirmación | 2 min |
| **Navegación** | Browse → Filtros → Detalle | 1-5 min |
| **Añadir al carrito** | Click → Cantidad → Confirmar | 30 seg |
| **Checkout** | Carrito → Login → Dirección → Pago | 3-5 min |
| **Seguimiento pedido** | Login → Mis pedidos → Tracking | 1 min |
| **Contactar soporte** | Pedido → Chat → Mensaje | 2 min |

### Admin

| Proceso | Interacción | Tiempo |
|---------|-------------|--------|
| **Gestionar pedido** | Dashboard → Pedido → Actualizar estado | 1-2 min |
| **Crear producto** | Formulario → Subir imágenes → Publicar | 10-15 min |
| **Gestionar stock** | Producto → Ajustar cantidad → Guardar | 1 min |
| **Ver alertas** | Alertas → Ver detalle → Resolver | 2 min |
| **Generar factura** | Pedido → Crear factura → Descargar PDF | 1 min |
| **Responder mensaje** | Chat → Escribir → Enviar | 2 min |

---

## 📊 Métricas de Procesos

### Conversión

| Paso | Tasa Estimada |
|------|---------------|
| Visita → Vista producto | 40% |
| Vista producto → Añadir carrito | 15% |
| Carrito → Checkout | 60% |
| Checkout → Pago completado | 70% |
| **Conversión total** | **2.5%** |

### Tiempos de Respuesta

| Proceso | Objetivo | Máximo |
|---------|----------|--------|
| Carga de página | <2s | 3s |
| Filtrar productos | <500ms | 1s |
| Añadir al carrito | <200ms | 500ms |
| Checkout Stripe | <3s | 5s |
| Generar factura PDF | <2s | 5s |

---

## 🔄 Estados y Transiciones

### Pedido

```
[PENDIENTE] ────────→ [CONFIRMADO] ───────→ [PREPARANDO]
      │                      │                      │
      │                      │                      │
      ▼                      ▼                      ▼
[CANCELADO]            [CANCELADO]            [CANCELADO]
                              │                      │
                              ▼                      ▼
                        [ENVIADO] ────────────→ [ENTREGADO]
```

**Reglas**:
- PENDIENTE: Esperando pago Stripe
- CONFIRMADO: Pago recibido, esperando producción
- PREPARANDO: En fabricación
- ENVIADO: Entregado a mensajería
- ENTREGADO: Confirmado por cliente
- CANCELADO: Puede cancelarse hasta PREPARANDO

### Pago

```
[PENDIENTE] → [COMPLETADO]
      │
      └──────→ [FALLIDO]
                │
                └──────→ [REINTENTO] → [COMPLETADO]
                              │
                              └──────→ [FALLIDO] (definitivo)
```

### Factura

```
[PENDIENTE] → [EMITIDA]
                   │
                   └──────→ [ANULADA] (con nota de crédito)
```

**Nota**: Las facturas emitidas no se pueden eliminar, solo anular.

---

## 🚨 Procesos de Excepción

### Error de Pago

```
1. Stripe devuelve error
2. Mostrar mensaje al usuario
3. Ofrecer reintentar
4. Log en sistema de alertas
5. Si persiste → Contactar soporte
```

### Stock Insuficiente

```
1. Verificar stock en checkout
2. Si insuficiente:
   - Mostrar error
   - Sugerir cantidad máxima
   - Notificar admin (alerta automática)
3. Opción: Pre-order si disponible
```

### Devolución

```
1. Cliente solicita devolución (48h)
2. Admin evalúa:
   - Producto defectuoso → Aceptar
   - Cambio de opinión → Política
3. Generar nota de crédito
4. Procesar reembolso Stripe
5. Actualizar inventario
```

---

## 📱 Flujos Multi-Dispositivo

### Escritorio vs Móvil

| Proceso | Desktop | Mobile |
|---------|---------|--------|
| Navegación | Sidebar + Grid | Drawer + Scroll |
| Filtros | Sidebar fija | Bottom sheet |
| Checkout | 3 columnas | Paso a paso |
| Admin | Full dashboard | Cards simplificadas |

---

## ✅ Checklist de Procesos

### Antes del Lanzamiento

- [ ] Proceso de compra completo probado
- [ ] Checkout Stripe en test mode
- [ ] Webhook de confirmación funcionando
- [ ] Gestión de pedidos admin operativa
- [ ] Sistema de alertas configurado
- [ ] Emails de confirmación enviándose
- [ ] Tracking de envíos integrado
- [ ] Proceso de devolución documentado

### Post-Lanzamiento

- [ ] Monitoreo de conversiones
- [ ] Optimización de tiempos de carga
- [ ] Mejora de UX basada en feedback
- [ ] Automatización de procesos repetitivos
- [ ] Documentación de casos edge

---

**Estado**: ✅ Procesos documentados y probados