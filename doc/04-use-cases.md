# Casos de Uso - 3D Print TFM

## 👤 Casos de Uso de Cliente

### UC-001: Registrarse
**Actor**: Cliente potencial
**Descripción**: Crear una cuenta nueva
**Precondiciones**: No estar logueado
**Flujo Principal**:
1. Usuario accede a /registro
2. Completa: nombre, email, password, confirmarPassword
3. Sistema valida datos (Zod)
4. Sistema verifica email único
5. Sistema crea usuario (bcrypt hash)
6. Sistema redirige a login con mensaje éxito

**Flujos Alternativos**:
- Email duplicado: Mostrar error
- Password débil: Mostrar requisitos
- Campos vacíos: Validación HTML5

**Postcondiciones**: Usuario creado en BD

---

### UC-002: Iniciar Sesión
**Actor**: Usuario registrado
**Descripción**: Autenticarse en el sistema
**Precondiciones**: Tener cuenta
**Flujo Principal**:
1. Usuario accede a /login
2. Introduce email y password
3. Sistema verifica credenciales
4. Sistema crea sesión (JWT)
5. Redirección a página anterior o home

**Flujos Alternativos**:
- Credenciales inválidas: Mostrar error
- Cuenta no verificada: Mensaje apropiado
- Usuario ADMIN: Redirección a /admin/dashboard

**Postcondiciones**: Sesión activa

---

### UC-003: Navegar Catálogo
**Actor**: Cualquier usuario
**Descripción**: Ver productos disponibles
**Flujo Principal**:
1. Accede a /productos
2. Ve grid de productos paginado
3. Aplica filtros (categoría, material, precio)
4. Ordena por precio o novedad
5. Selecciona producto para detalle

**Flujos Alternativos**:
- Sin resultados: Mensaje "No hay productos"
- Error carga: Reintentar automático

---

### UC-004: Añadir al Carrito
**Actor**: Usuario autenticado
**Descripción**: Guardar producto para compra
**Precondiciones**: Estar logueado
**Flujo Principal**:
1. En detalle de producto, selecciona cantidad
2. Click "Añadir al carrito"
3. Sistema verifica stock
4. Sistema actualiza carrito en BD
5. Notificación visual de éxito

**Flujos Alternativos**:
- Stock insuficiente: Mostrar cantidad máxima disponible
- Producto ya en carrito: Incrementar cantidad

---

### UC-005: Realizar Checkout
**Actor**: Usuario con items en carrito
**Descripción**: Completar compra
**Precondiciones**: Items en carrito, estar logueado
**Flujo Principal**:
1. Va a /carrito
2. Revisa items y totales
3. Procede a checkout
4. Selecciona dirección de envío
5. Revisa resumen del pedido
6. Click "Pagar con Stripe"
7. Redirección a Stripe Checkout
8. Completa pago en Stripe
9. Webhook confirma pago
10. Sistema crea pedido CONFIRMADO
11. Redirección a /checkout/success

**Flujos Alternativos**:
- Pago fallido: Volver a checkout con error
- Cancelar en Stripe: Pedido PENDIENTE (esperando)
- Stock agotado: Alertar y remover item

**Postcondiciones**: Pedido creado, pago procesado

---

### UC-006: Ver Historial de Pedidos
**Actor**: Cliente
**Descripción**: Consultar pedidos anteriores
**Flujo Principal**:
1. Accede a /cuenta/pedidos
2. Ve lista de pedidos ordenados
3. Click en pedido para detalle
4. Ve: productos, estado, tracking, total

---

### UC-007: Editar Perfil
**Actor**: Cliente
**Descripción**: Actualizar datos personales
**Flujo Principal**:
1. Va a /cuenta/perfil
2. Modifica: nombre, teléfono, NIF
3. Guarda cambios
4. Sistema valida (Zod)
5. Actualiza BD
6. Confirma éxito

**Flujos Alternativos**:
- Cambiar password: Requiere password actual

---

## 👔 Casos de Uso de Administrador

### UC-101: Dashboard de Métricas
**Actor**: Admin
**Descripción**: Ver resumen de negocio
**Flujo Principal**:
1. Login como admin
2. Redirección a /admin/dashboard
3. Ve widgets: pedidos hoy, ventas mes, stock bajo, alertas
4. Acceso rápido a secciones

---

### UC-102: Crear Producto
**Actor**: Admin
**Descripción**: Añadir nuevo producto al catálogo
**Flujo Principal**:
1. Va a /admin/productos/nuevo
2. Completa formulario:
   - Nombre, descripción
   - Categoría, material
   - Precio, stock
   - Dimensiones, peso
   - Imágenes
3. Sistema valida
4. Genera slug automático
5. Guarda en BD
6. Producto visible en tienda

---

### UC-103: Gestionar Pedidos
**Actor**: Admin
**Descripción**: Actualizar estado de pedidos
**Flujo Principal**:
1. Va a /admin/pedidos
2. Ve lista con filtros (estado, fecha)
3. Click en pedido para detalle
4. Actualiza estado:
   - PENDIENTE → CONFIRMADO
   - CONFIRMADO → PREPARANDO
   - PREPARANDO → ENVIADO (+tracking)
   - ENVIADO → ENTREGADO
5. Cliente recibe notificación

**Flujos Alternativos**:
- Cancelar pedido: Solo si PENDIENTE o CONFIRMADO

---

### UC-104: Generar Factura
**Actor**: Admin
**Descripción**: Crear factura para pedido entregado
**Precondiciones**: Pedido ENTREGADO
**Flujo Principal**:
1. Va a detalle de pedido
2. Click "Generar Factura"
3. Sistema verifica pedido entregado
4. Genera número F-2026-NNNNNN
5. Calcula IVA 21%
6. Guarda factura en BD
7. Genera PDF (HTML)
8. Muestra vista previa
9. Opción descargar PDF

---

### UC-105: Responder Alertas
**Actor**: Admin
**Descripción**: Gestionar alertas del sistema
**Flujo Principal**:
1. Ve notificación de alerta
2. Va a /admin/alertas
3. Filtra por: tipo, severidad, estado
4. Click en alerta para detalle
5. Marca como "En proceso" o "Resuelta"
6. Añade notas de resolución
7. Si stock bajo: Reponer stock

**Tipos de Alertas**:
- STOCK_BAJO: Producto por debajo de mínimo
- PEDIDO_SIN_PAGAR: >24h sin pago
- ERROR_SISTEMA: Fallo webhook, etc.

---

### UC-106: Mensajería con Cliente
**Actor**: Admin
**Descripción**: Chat en pedidos
**Flujo Principal**:
1. Va a detalle de pedido
2. Ve sección mensajes
3. Escribe mensaje al cliente
4. Marca "esAdmin: true"
5. Cliente recibe notificación
6. Cliente responde
7. Ciclo continúa hasta resolución

---

## 🔒 Casos de Uso de Sistema

### UC-201: Generar Alerta Stock Bajo
**Actor**: Sistema (automático)
**Descripción**: Detectar y notificar stock bajo
**Trigger**: Stock < stockMinimo
**Flujo**:
1. Verificar stock periódicamente
2. Si stock < mínimo:
3. Crear alerta STOCK_BAJO
4. Notificar admin en dashboard
5. Mostrar en listado de alertas

---

### UC-202: Procesar Webhook Stripe
**Actor**: Sistema
**Descripción**: Confirmar pagos
**Trigger**: Evento Stripe
**Flujo**:
1. Recibe POST /api/webhooks/stripe
2. Verifica firma del webhook
3. Procesa evento:
   - checkout.session.completed
   - payment_intent.succeeded
4. Actualiza estado de pago
5. Actualiza estado de pedido
6. Envia email de confirmación

---

### UC-203: Middleware de Autorización
**Actor**: Sistema
**Descripción**: Proteger rutas
**Flujo**:
1. Usuario solicita ruta protegida
2. Middleware verifica sesión
3. Si no autenticado → /login
4. Si autenticado, verifica rol:
   - Ruta /admin → Solo ADMIN
   - Ruta /carrito → No ADMIN (redirigir)
5. Si autorizado → Continuar

---

## 📊 Matriz de Actores vs Casos de Uso

| Caso de Uso | Cliente | Admin | Sistema |
|-------------|---------|-------|---------|
| UC-001 Registro | ✅ | ❌ | ❌ |
| UC-002 Login | ✅ | ✅ | ❌ |
| UC-003 Navegar | ✅ | ✅ | ❌ |
| UC-004 Carrito | ✅ | ❌ | ❌ |
| UC-005 Checkout | ✅ | ❌ | ❌ |
| UC-006 Historial | ✅ | ❌ | ❌ |
| UC-007 Perfil | ✅ | ❌ | ❌ |
| UC-101 Dashboard | ❌ | ✅ | ❌ |
| UC-102 Productos | ❌ | ✅ | ❌ |
| UC-103 Pedidos | ❌ | ✅ | ❌ |
| UC-104 Facturas | ❌ | ✅ | ❌ |
| UC-105 Alertas | ❌ | ✅ | ❌ |
| UC-106 Mensajes | ✅ | ✅ | ❌ |
| UC-201 Stock | ❌ | ❌ | ✅ |
| UC-202 Webhook | ❌ | ❌ | ✅ |
| UC-203 Auth | ❌ | ❌ | ✅ |

**Total**: 16 casos de uso principales

---

## ✅ Criterios de Aceptación

### Para cada Caso de Uso

- [ ] Flujo principal documentado
- [ ] Flujos alternativos identificados
- [ ] Pre/post condiciones definidas
- [ ] Tests E2E implementados
- [ ] Tests de integración pasando
- [ ] Validación Zod completa

**Estado**: ✅ 16/16 casos de uso implementados y probados