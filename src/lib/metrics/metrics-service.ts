/**
 * Servicio Centralizado de Métricas del Dashboard - Versión Robusta
 *
 * Este servicio unifica el cálculo de todas las métricas del dashboard administrativo
 * para garantizar consistencia entre diferentes endpoints y componentes.
 *
 * Características:
 * - Cálculos consistentes y documentados
 * - Manejo de errores individual para cada métrica
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
 * FUNCIONES DE CÁLCULO CON MANEJO DE ERRORES (PRIVADAS)
 * ============================================================================
 */

/**
 * Calcula los ingresos brutos con manejo de errores
 */
async function calculateGrossRevenue(): Promise<number> {
  try {
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
  } catch (error) {
    console.error('[Metrics] Error calculating gross revenue:', error);
    return 0;
  }
}

/**
 * Calcula los ingresos del mes actual con manejo de errores
 */
async function calculateRevenueThisMonth(): Promise<number> {
  try {
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
  } catch (error) {
    console.error('[Metrics] Error calculating revenue this month:', error);
    return 0;
  }
}

/**
 * Calcula las devoluciones aprobadas con manejo de errores
 */
async function calculateApprovedReturns(): Promise<number> {
  try {
    const result = await prisma.return.aggregate({
      where: {
        status: { in: ['APPROVED', 'COMPLETED'] },
      },
      _sum: { totalAmount: true },
    });

    return Number(result._sum.totalAmount || 0);
  } catch (error) {
    console.error('[Metrics] Error calculating approved returns:', error);
    return 0;
  }
}

/**
 * Calcula el total de pedidos con manejo de errores
 */
async function calculateTotalOrders(): Promise<number> {
  try {
    return prisma.order.count({
      where: { status: { not: OrderStatus.CANCELLED } },
    });
  } catch (error) {
    console.error('[Metrics] Error calculating total orders:', error);
    return 0;
  }
}

/**
 * Calcula los pedidos del mes actual con manejo de errores
 */
async function calculateOrdersThisMonth(): Promise<number> {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return prisma.order.count({
      where: {
        status: { not: OrderStatus.CANCELLED },
        createdAt: { gte: monthStart },
      },
    });
  } catch (error) {
    console.error('[Metrics] Error calculating orders this month:', error);
    return 0;
  }
}

/**
 * Calcula los pedidos pendientes con manejo de errores
 */
async function calculatePendingOrders(): Promise<number> {
  try {
    return prisma.order.count({
      where: { status: OrderStatus.PENDING },
    });
  } catch (error) {
    console.error('[Metrics] Error calculating pending orders:', error);
    return 0;
  }
}

/**
 * Calcula los pedidos entregados con manejo de errores
 */
async function calculateDeliveredOrders(): Promise<number> {
  try {
    return prisma.order.count({
      where: {
        status: OrderStatus.DELIVERED,
        payment: {
          status: PaymentStatus.COMPLETED,
        },
      },
    });
  } catch (error) {
    console.error('[Metrics] Error calculating delivered orders:', error);
    return 0;
  }
}

/**
 * Calcula los productos con stock bajo con manejo de errores
 */
async function calculateLowStockProducts(): Promise<number> {
  try {
    return prisma.product.count({
      where: {
        stock: { lt: LOW_STOCK_THRESHOLD },
        isActive: true,
      },
    });
  } catch (error) {
    console.error('[Metrics] Error calculating low stock products:', error);
    return 0;
  }
}

/**
 * Calcula las alertas activas con manejo de errores
 */
async function calculateActiveAlerts(): Promise<number> {
  try {
    return prisma.alert.count({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
    });
  } catch (error) {
    console.error('[Metrics] Error calculating active alerts:', error);
    return 0;
  }
}

/**
 * Calcula el total de clientes con manejo de errores
 */
async function calculateTotalCustomers(): Promise<number> {
  try {
    return prisma.user.count({
      where: { role: 'CUSTOMER' },
    });
  } catch (error) {
    console.error('[Metrics] Error calculating total customers:', error);
    return 0;
  }
}

/**
 * ============================================================================
 * FUNCIÓN PRINCIPAL PÚBLICA
 * ============================================================================
 */

/**
 * Obtiene todas las métricas del dashboard con manejo de errores robusto
 *
 * Esta función calcula todas las métricas necesarias para el dashboard
 * administrativo de forma consistente. Utiliza caché para mejorar el rendimiento.
 * Si alguna métrica falla, las demás continúan y se retornan valores por defecto.
 *
 * @param skipCache Si es true, ignora el caché y recalcula todas las métricas
 * @returns Objeto con todas las métricas del dashboard (con valores por defecto si fallan)
 */
export async function getDashboardMetrics(skipCache = false): Promise<DashboardMetrics> {
  // Verificar caché primero
  if (!skipCache) {
    const cached = getCachedMetrics();
    if (cached) {
      return cached;
    }
  }

  // Calcular todas las métricas individualmente con manejo de errores
  const grossRevenue = await calculateGrossRevenue();
  const approvedReturns = await calculateApprovedReturns();
  const totalOrders = await calculateTotalOrders();
  const pendingOrders = await calculatePendingOrders();
  const deliveredOrders = await calculateDeliveredOrders();
  const lowStockProducts = await calculateLowStockProducts();
  const activeAlerts = await calculateActiveAlerts();
  const totalCustomers = await calculateTotalCustomers();
  const ordersThisMonth = await calculateOrdersThisMonth();
  const revenueThisMonth = await calculateRevenueThisMonth();

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
 */
export function invalidateMetricsCache(): void {
  metricsCache = null;
}

/**
 * Obtiene el estado actual del caché
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
 * Obtiene métricas actualizadas e invalida el caché
 */
export async function refreshAndGetMetrics(): Promise<DashboardMetrics> {
  invalidateMetricsCache();
  return getDashboardMetrics(true);
}
