# API Documentation

## Base URL

- **Desarrollo:** `http://localhost:3000/api`
- **Producción:** `https://3d-print-tfm.vercel.app/api`

## Autenticación

La mayoría de endpoints requieren autenticación vía NextAuth session cookie. La sesión se envía automáticamente en las cookies.

Para endpoints públicos, no se requiere autenticación.

## Códigos de Error

| Código               | Descripción                              |
| -------------------- | ---------------------------------------- |
| `UNAUTHORIZED`       | 401 - Sesión no válida o expirada        |
| `FORBIDDEN`          | 403 - No tiene permisos para esta acción |
| `NOT_FOUND`          | 404 - Recurso no encontrado              |
| `VALIDATION_ERROR`   | 400/422 - Datos de entrada inválidos     |
| `INSUFFICIENT_STOCK` | 400 - No hay stock suficiente            |
| `INVALID_COUPON`     | 400 - Cupón inválido o expirado          |
| `PAYMENT_FAILED`     | 400 - Error en procesamiento de pago     |
| `TIMEOUT`            | 408 - Tiempo de espera excedido          |
| `NETWORK_ERROR`      | 0 - Error de conexión                    |
| `INTERNAL_ERROR`     | 500 - Error interno del servidor         |

## Endpoints

### Productos

#### GET /api/products

Lista todos los productos activos.

**Query Parameters:**

| Parámetro   | Tipo    | Descripción                      |
| ----------- | ------- | -------------------------------- |
| `category`  | string  | Filtrar por slug de categoría    |
| `material`  | string  | Filtrar por material (PLA, PETG) |
| `search`    | string  | Búsqueda por nombre              |
| `minPrice`  | number  | Precio mínimo                    |
| `maxPrice`  | number  | Precio máximo                    |
| `inStock`   | boolean | Solo productos con stock         |
| `page`      | number  | Página (default: 1)              |
| `limit`     | number  | Items por página (default: 12)   |
| `sortBy`    | string  | Campo de ordenamiento            |
| `sortOrder` | string  | asc o desc                       |

**Response:**

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "prod_123",
        "name": "Soporte Móvil",
        "nameEn": "Phone Stand",
        "slug": "soporte-movil",
        "price": 15.99,
        "salePrice": null,
        "image": "https://...",
        "stock": 25,
        "category": {
          "id": "cat_1",
          "name": "Oficina"
        },
        "rating": 4.5,
        "reviewCount": 12
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 12,
      "total": 100,
      "totalPages": 9
    }
  }
}
```

#### GET /api/products/[slug]

Obtiene detalles de un producto específico.

**Response:**

```json
{
  "success": true,
  "data": {
    "product": {
      "id": "prod_123",
      "name": "Soporte Móvil",
      "nameEn": "Phone Stand",
      "description": "Soporte ajustable para móvil...",
      "descriptionEn": "Adjustable phone stand...",
      "price": 15.99,
      "images": [...],
      "specifications": {...},
      "reviews": [...]
    }
  }
}
```

---

### Carrito

#### GET /api/cart

Obtiene el carrito del usuario actual.

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "item_123",
        "productId": "prod_456",
        "name": "Soporte Móvil",
        "quantity": 2,
        "price": 15.99,
        "subtotal": 31.98,
        "image": "https://..."
      }
    ],
    "summary": {
      "itemCount": 2,
      "subtotal": 31.98,
      "discount": 0,
      "tax": 6.72,
      "shipping": 5.0,
      "total": 43.7
    }
  }
}
```

#### POST /api/cart/items

Agrega un item al carrito.

**Request Body:**

```json
{
  "productId": "prod_456",
  "quantity": 2
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "item": {...},
    "summary": {...}
  }
}
```

#### PATCH /api/cart/items/[id]

Actualiza la cantidad de un item.

**Request Body:**

```json
{
  "quantity": 3
}
```

#### DELETE /api/cart/items/[id]

Elimina un item del carrito.

---

### Órdenes

#### GET /api/orders

Lista las órdenes del usuario autenticado.

**Query Parameters:**

| Parámetro | Tipo   | Descripción        |
| --------- | ------ | ------------------ |
| `page`    | number | Página             |
| `limit`   | number | Items por página   |
| `status`  | string | Filtrar por estado |

**Response:**

```json
{
  "success": true,
  "data": {
    "orders": [...],
    "pagination": {...}
  }
}
```

#### GET /api/orders/[id]

Obtiene detalles de una orden específica.

**Response:**

```json
{
  "success": true,
  "data": {
    "order": {
      "id": "ord_123",
      "status": "CONFIRMED",
      "items": [...],
      "shippingAddress": {...},
      "paymentMethod": "CARD",
      "summary": {...}
    }
  }
}
```

#### POST /api/orders

Crea una nueva orden.

**Request Body:**

```json
{
  "shippingAddressId": "addr_123",
  "paymentMethod": "CARD",
  "couponCode": "SAVE10"
}
```

---

### Checkout

#### POST /api/checkout/validate-address

Valida una dirección de envío.

**Request Body:**

```json
{
  "street": "Calle Mayor 123",
  "city": "Madrid",
  "postalCode": "28001",
  "country": "ES"
}
```

#### POST /api/checkout/calculate-shipping

Calcula costos de envío.

**Request Body:**

```json
{
  "postalCode": "28001",
  "items": [...]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "options": [
      {
        "id": "standard",
        "name": "Envío Estándar",
        "price": 5.0,
        "estimatedDays": "3-5 días"
      }
    ]
  }
}
```

---

### Pagos

#### POST /api/payments/stripe/create

Crea una sesión de pago con Stripe.

**Request Body:**

```json
{
  "orderId": "ord_123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "sessionId": "cs_...",
    "url": "https://checkout.stripe.com/..."
  }
}
```

#### POST /api/payments/paypal/create

Crea una orden de pago con PayPal.

**Request Body:**

```json
{
  "orderId": "ord_123"
}
```

#### POST /api/payments/bizum/create

Procesa pago con Bizum (simulado).

#### POST /api/payments/transfer/create

Crea instrucciones para transferencia bancaria.

---

### Cupones

#### POST /api/coupons/validate

Valida un código de cupón.

**Request Body:**

```json
{
  "code": "SAVE10",
  "cartTotal": 100.0
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "valid": true,
    "coupon": {
      "code": "SAVE10",
      "type": "PERCENTAGE",
      "value": 10,
      "discount": 10.0
    }
  }
}
```

---

### Admin

#### GET /api/admin/products

Lista productos para administración.

**Query Parameters:**

| Parámetro  | Tipo   | Descripción              |
| ---------- | ------ | ------------------------ |
| `page`     | number | Página                   |
| `limit`    | number | Items por página         |
| `search`   | string | Búsqueda                 |
| `category` | string | Categoría                |
| `status`   | string | Estado (active/inactive) |

#### POST /api/admin/products

Crea un nuevo producto.

**Request Body:**

```json
{
  "nameEs": "Soporte Móvil",
  "nameEn": "Phone Stand",
  "descriptionEs": "...",
  "descriptionEn": "...",
  "price": 15.99,
  "stock": 25,
  "categoryId": "cat_1",
  "images": [...]
}
```

#### PATCH /api/admin/products/[id]

Actualiza un producto.

#### DELETE /api/admin/products/[id]

Elimina un producto.

---

#### GET /api/admin/orders

Lista todas las órdenes.

**Query Parameters:**

| Parámetro | Tipo   | Descripción          |
| --------- | ------ | -------------------- |
| `page`    | number | Página               |
| `limit`   | number | Items por página     |
| `status`  | string | Estado de la orden   |
| `search`  | string | Búsqueda por cliente |

#### PATCH /api/admin/orders/[id]/status

Actualiza el estado de una orden.

**Request Body:**

```json
{
  "status": "SHIPPED",
  "trackingNumber": "TRACK123"
}
```

---

### Autenticación

#### POST /api/auth/register

Registra un nuevo usuario.

**Request Body:**

```json
{
  "email": "usuario@ejemplo.com",
  "password": "SecurePass123!",
  "name": "Juan Pérez"
}
```

#### POST /api/auth/reset-password

Solicita reset de contraseña.

#### PATCH /api/auth/reset-password

Actualiza contraseña con token.

---

### Usuario

#### GET /api/user/profile

Obtiene el perfil del usuario.

#### PATCH /api/user/profile

Actualiza el perfil.

#### GET /api/user/addresses

Lista direcciones del usuario.

#### POST /api/user/addresses

Agrega una nueva dirección.

---

## Uso con React Query

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

// Query para obtener productos
function useProducts(filters = {}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => apiClient.get('/api/products', { params: filters }),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Mutation para agregar al carrito
function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: data => apiClient.post('/api/cart/items', data),
    onSuccess: () => {
      // Invalidar queries de carrito
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}
```

---

## Manejo de Errores

```typescript
import { apiClient, isApiError, getUserFriendlyErrorMessage } from '@/lib/api/client';
import { toast } from 'sonner';

try {
  const result = await apiClient.post('/api/orders', orderData);
} catch (error) {
  if (isApiError(error)) {
    // Error conocido de la API
    console.error('API Error:', error.status, error.code);
    toast.error(getUserFriendlyErrorMessage(error));
  } else {
    // Error desconocido
    toast.error('Ha ocurrido un error inesperado');
  }
}
```

---

## Rate Limiting

La API implementa rate limiting:

- **Endpoints públicos:** 100 requests/minuto
- **Endpoints autenticados:** 1000 requests/minuto
- **Endpoints de pago:** 10 requests/minuto

---

## Versionado

La API sigue el versionado semántico del proyecto. La versión actual es **v1.1.0**.

Cambios breaking serán documentados en el CHANGELOG.
