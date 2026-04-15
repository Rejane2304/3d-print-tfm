# Servicio Centralizado de Métricas

## Descripción

Este módulo proporciona un servicio centralizado para el cálculo de métricas del dashboard administrativo, garantizando consistencia entre diferentes endpoints y componentes.

## Problema Solucionado

Anteriormente, las métricas se calculaban de forma inconsistente en múltiples lugares:

- `/src/app/api/admin/dashboard/route.ts` - Usaba lógica propia
- `/src/app/api/admin/metrics/route.ts` - Otra lógica diferente
- Componentes frontend - Cálculos propios

## Solución

Un servicio centralizado que:

1. Define métricas de forma clara y documentada
2. Implementa caché en memoria (TTL: 60 segundos)
3. Proporciona invalidación manual del caché
4. Es utilizado por todos los endpoints API

## Métricas Disponibles

### Métricas Financieras

| Métrica            | Descripción             | Cálculo                                                                             |
| ------------------ | ----------------------- | ----------------------------------------------------------------------------------- |
| `grossRevenue`     | Ingresos brutos totales | Suma de `total` de pedidos con pago COMPLETED o PAYMENT_PENDING (excluye CANCELLED) |
| `netRevenue`       | Ingresos netos          | GrossRevenue - devoluciones aprobadas (APPROVED, COMPLETED)                         |
| `revenueThisMonth` | Ingresos del mes actual | Suma de pedidos no cancelados creados este mes                                      |

### Métricas de Pedidos

| Métrica           | Descripción        | Cálculo                                                      |
| ----------------- | ------------------ | ------------------------------------------------------------ |
| `totalOrders`     | Total de pedidos   | Conteo de pedidos con estado ≠ CANCELLED                     |
| `ordersThisMonth` | Pedidos del mes    | Conteo de pedidos no cancelados del mes actual               |
| `pendingOrders`   | Pedidos pendientes | Conteo de pedidos con estado PENDING (no incluye PROCESSING) |
| `deliveredOrders` | Pedidos entregados | Conteo de pedidos DELIVERED con pago COMPLETED               |

### Métricas de Productos y Alertas

| Métrica            | Descripción              | Cálculo                                            |
| ------------------ | ------------------------ | -------------------------------------------------- |
| `lowStockProducts` | Productos con stock bajo | Conteo de productos con stock < 5                  |
| `activeAlerts`     | Alertas activas          | Conteo de alertas con estado PENDING o IN_PROGRESS |
| `totalCustomers`   | Total de clientes        | Conteo de usuarios con rol CUSTOMER                |

## Uso

### Obtener Métricas

```typescript
import { getDashboardMetrics } from '@/lib/metrics/metrics-service';

// Obtener métricas (con caché)
const metrics = await getDashboardMetrics();

// Forzar recálculo (sin caché)
const freshMetrics = await getDashboardMetrics(true);
```

### Invalidar Caché

```typescript
import { invalidateMetricsCache } from '@/lib/metrics/metrics-service';

// Después de crear un pedido o cambiar estado
invalidateMetricsCache();
```

### Obtener Métricas Actualizadas y Emitir Evento

```typescript
import { refreshAndGetMetrics } from '@/lib/metrics/metrics-service';
import { emitMetricsUpdate } from '@/lib/realtime/event-service';

// En un webhook o después de cambios importantes
const metrics = await refreshAndGetMetrics();
await emitMetricsUpdate(metrics);
```

### Ver Estado del Caché

```typescript
import { getCacheStatus } from '@/lib/metrics/metrics-service';

const status = getCacheStatus();
// { isCached: boolean, age: number | null, ttl: number }
```

## Integración con Eventos en Tiempo Real

El servicio se integra con el sistema de eventos en tiempo real para notificar
actualizaciones al dashboard:

```typescript
// Después de confirmar un pago
const metrics = await refreshAndGetMetrics();
await emitMetricsUpdate(metrics);
```

Los eventos `metrics:update` son escuchados por:

- El hook `useRealTime` para actualizar el UI
- El dashboard admin en tiempo real

## Endpoints API que Usan este Servicio

1. `/api/admin/metrics` - Métricas básicas del dashboard
2. `/api/admin/dashboard` - Datos completos del dashboard

Ambos endpoints devuelven los mismos valores calculados, garantizando consistencia.

## Caché

- **TTL**: 60 segundos
- **Almacenamiento**: Memoria (Node.js global)
- **Invalidación**: Manual mediante `invalidateMetricsCache()`
- **Casos de invalidación**:
  - Creación de nuevo pedido
  - Cambio de estado de pedido
  - Confirmación de pago
  - Devolución aprobada
  - Cambio de stock
  - Nueva alerta

## Archivos Relacionados

- `/src/lib/metrics/metrics-service.ts` - Servicio principal
- `/src/app/api/admin/metrics/route.ts` - Endpoint de métricas
- `/src/app/api/admin/dashboard/route.ts` - Endpoint del dashboard
- `/src/lib/realtime/event-service.ts` - Servicio de eventos
- `/src/hooks/useRealTime.ts` - Hook para eventos en tiempo real

## Notas de Implementación

1. **Rendimiento**: Las métricas se calculan en paralelo para optimizar tiempo de respuesta
2. **Consistencia**: Todos los endpoints usan las mismas funciones de cálculo
3. **Documentación**: Cada métrica tiene definición clara y ejemplos
4. **Testing**: Fácil de mockear para tests unitarios
