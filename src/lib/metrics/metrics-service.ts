/**
 * Servicio Centralizado de Métricas del Dashboard
 *
 * Este servicio unifica el cálculo de todas las métricas del dashboard administrativo
 * para garantizar consistencia entre diferentes endpoints y componentes.
 *
 * Características:
 * - Cálculos consistentes y documentados
 * - Cache en memoria con TTL de 60 segundos
 * - Invalidación manual mediante invalidateCache()
 * - Tipado estricto TypeScript
 *
 * @module metrics/metrics-service
 */

import { prisma } from '@/lib/db/prisma';
import { PaymentStatus, OrderStatus } from '@prisma/client';

/**
 * ============================================================================
 * TIPOS Y DEFINICIONES
 * ============================================================================
 */

/**
 * Métricas principales del dashboard
 */
export interface DashboardMetrics {
  /** Ingresos brutos: Suma de totalAmount de pedidos con pago COMPLETED o PAYMENT_PENDING */
  grossRevenue: number;
  /** Ingresos netos: GrossRevenue - devoluciones aprobadas */
  netRevenue: number;
  /** Total de pedidos (excluye CANCELLED) */
  totalOrders: number;
  /** Pedidos en estado PENDING */
  pendingOrders: number;
  /** Pedidos DELIVERED con pago COMPLETED */
  deliveredOrders: number;
  /** Productos con stock bajo (< 5 unidades) */
  lowStockProducts: number;
  /** Alertas activas (no resueltas) */
  activeAlerts: number;
  /** Total de clientes registrados */
  totalCustomers: number;
  /** Pedidos del mes actual (excluye CANCELLED) */
  ordersThisMonth: number;
  /** Ingresos del mes actual (pedidos no cancelados) */
  revenueThisMonth: number;
}

/**
 * Entrada de caché con timestamp
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * ============================================================================
 * CONFIGURACIÓN
 * ============================================================================
 */

/** Tiempo de vida del caché en milisegundos (60 segundos) */
const CACHE_TTL = 60 * 1000;

/** Umbral de stock bajo */
const LOW_STOCK_THRESHOLD = 5;

/**
 * ============================================================================
 * CACHE EN MEMORIA
 * ============================================================================
 */

// Cache simple en memoria para las métricas
let metricsCache: CacheEntry<DashboardMetrics> | null = null;

/**
 * Obtiene las métricas del caché si son válidas
 * @returns Métricas cacheadas o null si expiraron/no existen
 */
function getCachedMetrics(): DashboardMetrics | null {
  if (!metricsCache) return null;

  const now = Date.now();
  const age = now - metricsCache.timestamp;

  if (age > CACHE_TTL) {
    // Cache expirado, limpiar
    metricsCache = null;
    return null;
  }

  return metricsCache.data;
}

/**
 * Guarda métricas en el caché
 * @param metrics Métricas a cachear
 */
function setCachedMetrics(metrics: DashboardMetrics): void {
  metricsCache = {
    data: metrics,
    timestamp: Date.now(),
  };
}

/**
 * ============================================================================
 * FUNCIONES DE CÁLCULO (PRIVADAS)
 * ============================================================================
 */

/**
 * Calcula los ingresos brutos
 *
 * Definición: Suma de `totalAmount` de pedidos con pago COMPLETED o PAYMENT_PENDING
 * Incluye envío y descuentos aplicados
 *
 * @returns Ingresos brutos totales
 */
async function calculateGrossRevenue(): Promise<number> {
  const result = await prisma.order.aggregate({
    where: {
      status: { not: OrderStatus.CANCELLED },
      payment: {
        status: {
          in: [PaymentStatus.COMPLETED, PaymentStatus.PENDING],
        },
      },
    },
    _sum: { total: true },
  });

  return Number(result._sum.total || 0);
}

/**
 * Calcula los ingresos del mes actual
 *
 * Definición: Suma de `totalAmount` de pedidos no cancelados del mes actual
 *
 * @returns Ingresos del mes actual
 */
async function calculateRevenueThisMonth(): Promise<number> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const result = await prisma.order.aggregate({
    where: {
      status: { not: OrderStatus.CANCELLED },
      createdAt: { gte: monthStart },
    },
    _sum: { total: true },
  });

  return Number(result._sum.total || 0);
}

/**
 * Calcula las devoluciones aprobadas
 *
 * Definición: Suma de `totalAmount` de devoluciones con estado APPROVED o COMPLETED
 *
 * @returns Total de devoluciones aprobadas
 */
async function calculateApprovedReturns(): Promise<number> {
  const result = await prisma.return.aggregate({
    where: {
      status: { in: ['APPROVED', 'COMPLETED'] },
    },
    _sum: { totalAmount: true },
  });

  return Number(result._sum.totalAmount || 0);
}

/**
 * Calcula el total de pedidos
 *
 * Definición: Conteo de pedidos con estado diferente a CANCELLED
 *
 * @returns Total de pedidos
 */
async function calculateTotalOrders(): Promise<number> {
  return prisma.order.count({
    where: { status: { not: OrderStatus.CANCELLED } },
  });
}

/**
 * Calcula los pedidos del mes actual
 *
 * Definición: Conteo de pedidos no cancelados creados este mes
 *
 * @returns Pedidos del mes actual
 */
async function calculateOrdersThisMonth(): Promise<number> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  return prisma.order.count({
    where: {
      status: { not: OrderStatus.CANCELLED },
      createdAt: { gte: monthStart },
    },
  });
}

/**
 * Calcula los pedidos pendientes
 *
 * Definición: Conteo de pedidos con estado PENDING
 * NOTA: No incluye PROCESSING
 *
 * @returns Pedidos pendientes
 */
async function calculatePendingOrders(): Promise<number> {
  return prisma.order.count({
    where: { status: OrderStatus.PENDING },
  });
}

/**
 * Calcula los pedidos entregados
 *
 * Definición: Conteo de pedidos con estado DELIVERED y pago COMPLETED
 *
 * @returns Pedidos entregados y pagados
 */
async function calculateDeliveredOrders(): Promise<number> {
  return prisma.order.count({
    where: {
      status: OrderStatus.DELIVERED,
      payment: {
        status: PaymentStatus.COMPLETED,
      },
    },
  });
}

/**
 * Calcula los productos con stock bajo
 *
 * Definición: Conteo de productos con stock < 5 unidades
 *
 * @returns Productos con stock bajo
 */
async function calculateLowStockProducts(): Promise<number> {
  return prisma.product.count({
    where: {
      stock: { lt: LOW_STOCK_THRESHOLD },
      isActive: true,
    },
  });
}

/**
 * Calcula las alertas activas
 *
 * Definición: Conteo de alertas con estado PENDING o IN_PROGRESS
 *
 * @returns Alertas activas
 */
async function calculateActiveAlerts(): Promise<number> {
  return prisma.alert.count({
    where: {
      status: { in: ['PENDING', 'IN_PROGRESS'] },
    },
  });
}

/**
 * Calcula el total de clientes
 *
 * Definición: Conteo de usuarios con rol CUSTOMER
 *
 * @returns Total de clientes
 */
async function calculateTotalCustomers(): Promise<number> {
  return prisma.user.count({
    where: { role: 'CUSTOMER' },
  });
}

/**
 * ============================================================================
 * FUNCIÓN PRINCIPAL PÚBLICA
 * ============================================================================
 */

/**
 * Obtiene todas las métricas del dashboard
 *
 * Esta función calcula todas las métricas necesarias para el dashboard
 * administrativo de forma consistente. Utiliza caché para mejorar el rendimiento.
 *
 * Métricas calculadas:
 * - grossRevenue: Ingresos brutos (pedidos pagados, incluye envío)
 * - netRevenue: Ingresos netos (grossRevenue - devoluciones)
 * - totalOrders: Total de pedidos (excluye cancelados)
 * - pendingOrders: Pedidos en estado PENDING
 * - deliveredOrders: Pedidos DELIVERED con pago COMPLETED
 * - lowStockProducts: Productos con stock < 5
 * - activeAlerts: Alertas no resueltas
 * - totalCustomers: Total de clientes
 * - ordersThisMonth: Pedidos del mes actual
 * - revenueThisMonth: Ingresos del mes actual
 *
 * @param skipCache Si es true, ignora el caché y recalcula todas las métricas
 * @returns Objeto con todas las métricas del dashboard
 *
 * @example
 * ```typescript
 * // Obtener métricas (con caché)
 * const metrics = await getDashboardMetrics();
 *
 * // Forzar recálculo (sin caché)
 * const freshMetrics = await getDashboardMetrics(true);
 * ```
 */
export async function getDashboardMetrics(skipCache = false): Promise<DashboardMetrics> {
  // Verificar caché primero
  if (!skipCache) {
    const cached = getCachedMetrics();
    if (cached) {
      return cached;
    }
  }

  // Calcular todas las métricas en paralelo para mejor rendimiento
  const [
    grossRevenue,
    approvedReturns,
    totalOrders,
    pendingOrders,
    deliveredOrders,
    lowStockProducts,
    activeAlerts,
    totalCustomers,
    ordersThisMonth,
    revenueThisMonth,
  ] = await Promise.all([
    calculateGrossRevenue(),
    calculateApprovedReturns(),
    calculateTotalOrders(),
    calculatePendingOrders(),
    calculateDeliveredOrders(),
    calculateLowStockProducts(),
    calculateActiveAlerts(),
    calculateTotalCustomers(),
    calculateOrdersThisMonth(),
    calculateRevenueThisMonth(),
  ]);

  // Calcular ingresos netos
  const netRevenue = Math.max(0, grossRevenue - approvedReturns);

  const metrics: DashboardMetrics = {
    grossRevenue,
    netRevenue,
    totalOrders,
    pendingOrders,
    deliveredOrders,
    lowStockProducts,
    activeAlerts,
    totalCustomers,
    ordersThisMonth,
    revenueThisMonth,
  };

  // Guardar en caché
  setCachedMetrics(metrics);

  return metrics;
}

/**
 * ============================================================================
 * FUNCIONES DE GESTIÓN DE CACHÉ
 * ============================================================================
 */

/**
 * Invalida el caché de métricas
 *
 * Esta función debe llamarse cuando los datos cambian (pedidos nuevos,
 * actualizaciones de estado, devoluciones, etc.) para forzar el recálculo
 * en la próxima solicitud.
 *
 * @example
 * ```typescript
 * // Después de crear un pedido
 * await invalidateMetricsCache();
 * await emitMetricsUpdate(await getDashboardMetrics());
 * ```
 */
export function invalidateMetricsCache(): void {
  metricsCache = null;
}

/**
 * Obtiene el estado actual del caché
 *
 * �til para debugging y monitoreo
 *
 * @returns Información del estado del caché
 */
export function getCacheStatus(): {
  isCached: boolean;
  age: number | null;
  ttl: number;
} {
  if (!metricsCache) {
    return { isCached: false, age: null, ttl: CACHE_TTL };
  }

  const age = Date.now() - metricsCache.timestamp;
  return {
    isCached: true,
    age,
    ttl: CACHE_TTL,
  };
}

/**
 * ============================================================================
 * FUNCIÓN DE EMISIÓN DE EVENTOS (INTEGRACIÓN)
 * ============================================================================
 */

/**
 * Obtiene métricas actualizadas e invalida el caché
 *
 * Combina la invalidación del caché con el recálculo de métricas
 * para usar cuando se emiten eventos de actualización.
 *
 * @returns Métricas recién calculadas
 *
 * @example
 * ```typescript
 * // En un webhook de Stripe después de confirmar pago
 * const metrics = await refreshAndGetMetrics();
 * await emitMetricsUpdate(metrics);
 * ```
 */
export async function refreshAndGetMetrics(): Promise<DashboardMetrics> {
  invalidateMetricsCache();
  return getDashboardMetrics(true);
}
