export const dynamic = 'force-dynamic';

/**
 * API Route - Admin Analytics Dashboard
 * GET /api/admin/analytics
 * Returns sales, orders, customer statistics
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { translateOrderStatus, translateProductName } from '@/lib/i18n';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 },
      );
    }

    // Verify admin role
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (adminUser?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Acceso denegado' },
        { status: 403 },
      );
    }

    // Get date range from query
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'month';

    // Calculate date ranges - use ISO format for PostgreSQL compatibility
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const lastMonthStart = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1,
    );
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    const yearStart = new Date(today.getFullYear(), 0, 1);

    // Debug logging eliminado por lint

    // Build date filters
    let dateFilter: Date;
    switch (range) {
      case 'today':
        dateFilter = today;
        break;
      case 'week':
        dateFilter = weekAgo;
        break;
      case 'lastMonth':
        dateFilter = lastMonthStart;
        break;
      case 'year':
        dateFilter = yearStart;
        break;
      default:
        dateFilter = monthAgo;
    }

    // Sales Summary - Ingresos completos para gestoría
    const salesSummary = await Promise.all([
      // INGRESOS BRUTOS (todos los pedidos, incluyendo cancelados)
      // Today
      prisma.order.aggregate({
        where: { createdAt: { gte: today } },
        _sum: { total: true },
      }),
      // This week
      prisma.order.aggregate({
        where: { createdAt: { gte: weekAgo } },
        _sum: { total: true },
      }),
      // This month
      prisma.order.aggregate({
        where: { createdAt: { gte: monthAgo } },
        _sum: { total: true },
      }),
      // Last month
      prisma.order.aggregate({
        where: {
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
        _sum: { total: true },
      }),
      // Total histórico bruto
      prisma.order.aggregate({
        _sum: { total: true },
      }),

      // INGRESOS NETOS (excluyendo cancelados) - Lo que realmente se espera recibir
      // Today
      prisma.order.aggregate({
        where: {
          createdAt: { gte: today },
          status: { not: 'CANCELLED' },
        },
        _sum: { total: true },
      }),
      // This week
      prisma.order.aggregate({
        where: {
          createdAt: { gte: weekAgo },
          status: { not: 'CANCELLED' },
        },
        _sum: { total: true },
      }),
      // This month
      prisma.order.aggregate({
        where: {
          createdAt: { gte: monthAgo },
          status: { not: 'CANCELLED' },
        },
        _sum: { total: true },
      }),
      // Last month
      prisma.order.aggregate({
        where: {
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
          status: { not: 'CANCELLED' },
        },
        _sum: { total: true },
      }),
      // Total histórico neto
      prisma.order.aggregate({
        where: { status: { not: 'CANCELLED' } },
        _sum: { total: true },
      }),

      // INGRESOS REALIZADOS (DELIVERED) - Pedidos ya entregados y cobrados
      // Today
      prisma.order.aggregate({
        where: {
          status: 'DELIVERED',
          deliveredAt: { gte: today },
        },
        _sum: { total: true },
      }),
      // This week
      prisma.order.aggregate({
        where: {
          status: 'DELIVERED',
          deliveredAt: { gte: weekAgo },
        },
        _sum: { total: true },
      }),
      // This month
      prisma.order.aggregate({
        where: {
          status: 'DELIVERED',
          deliveredAt: { gte: monthAgo },
        },
        _sum: { total: true },
      }),
      // Last month
      prisma.order.aggregate({
        where: {
          status: 'DELIVERED',
          deliveredAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
        _sum: { total: true },
      }),
      // Total histórico entregado
      prisma.order.aggregate({
        where: { status: 'DELIVERED' },
        _sum: { total: true },
      }),

      // CANCELACIONES (pérdidas por pedidos cancelados) - usando createdAt en lugar de cancelledAt
      // Today
      prisma.order.aggregate({
        where: {
          status: 'CANCELLED',
          createdAt: { gte: today },
        },
        _sum: { total: true },
      }),
      // This week
      prisma.order.aggregate({
        where: {
          status: 'CANCELLED',
          createdAt: { gte: weekAgo },
        },
        _sum: { total: true },
      }),
      // This month
      prisma.order.aggregate({
        where: {
          status: 'CANCELLED',
          createdAt: { gte: monthAgo },
        },
        _sum: { total: true },
      }),
      // Last month
      prisma.order.aggregate({
        where: {
          status: 'CANCELLED',
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
        _sum: { total: true },
      }),
      // Total histórico cancelado
      prisma.order.aggregate({
        where: { status: 'CANCELLED' },
        _sum: { total: true },
      }),
    ]);

    // Order Stats - Métricas completas para gestoría
    const orderStats = await Promise.all([
      // Total orders histórico (TODOS incluyendo cancelados)
      prisma.order.count(),
      // Total excluyendo cancelados (pedidos activos/completados)
      prisma.order.count({ where: { status: { not: 'CANCELLED' } } }),
      // Today (TODOS los pedidos creados hoy)
      prisma.order.count({
        where: { createdAt: { gte: today } },
      }),
      // This week (TODOS los pedidos de la semana)
      prisma.order.count({
        where: { createdAt: { gte: weekAgo } },
      }),
      // This month (TODOS los pedidos del mes)
      prisma.order.count({
        where: { createdAt: { gte: monthAgo } },
      }),
      // Pedidos cancelados (total histórico)
      prisma.order.count({ where: { status: 'CANCELLED' } }),
      // Pedidos pendientes de pago (PENDING)
      prisma.order.count({ where: { status: 'PENDING' } }),
      // Pedidos pagados/confirmados (CONFIRMED y posteriores, excluyendo CANCELLED y PENDING)
      prisma.order.count({
        where: {
          status: { in: ['CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED'] },
        },
      }),
      // By status (todos los estados para desglose)
      prisma.order.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);

    // Customer Stats
    const customerStats = await Promise.all([
      // Total customers
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      // New this month
      prisma.user.count({
        where: {
          role: 'CUSTOMER',
          createdAt: { gte: monthAgo },
        },
      }),
      // Active (have placed orders)
      prisma.user.count({
        where: {
          role: 'CUSTOMER',
          orders: { some: {} },
        },
      }),
    ]);

    // Top Products - Solo pedidos DELIVERED (ventas reales)
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          status: 'DELIVERED',
          deliveredAt: { gte: dateFilter },
        },
      },
      _sum: {
        quantity: true,
        subtotal: true,
      },
      orderBy: {
        _sum: { quantity: 'desc' },
      },
      take: 5,
    });

    // Get product details for top products
    const topProductsWithDetails = await Promise.all(
      topProducts.map(async item => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId || '' },
          select: { name: true, stock: true, slug: true },
        });
        return {
          id: item.productId,
          nombre: product?.slug
            ? translateProductName(product.slug)
            : 'Producto eliminado',
          vendido: item._sum.quantity || 0,
          ingresos: Number(item._sum.subtotal || 0),
          stock: product?.stock || 0,
        };
      }),
    );

    // Top Customers - Solo pedidos DELIVERED
    const topCustomers = await prisma.order.groupBy({
      by: ['userId'],
      where: {
        status: 'DELIVERED',
        deliveredAt: { gte: dateFilter },
      },
      _count: { id: true },
      _sum: { total: true },
      orderBy: {
        _sum: { total: 'desc' },
      },
      take: 5,
    });

    // Get customer details
    const topCustomersWithDetails = await Promise.all(
      topCustomers.map(async customer => {
        const user = await prisma.user.findUnique({
          where: { id: customer.userId },
          select: { name: true },
        });
        return {
          id: customer.userId,
          nombre: user?.name || 'Cliente eliminado',
          pedidos: customer._count.id,
          gastado: Number(customer._sum.total || 0),
        };
      }),
    );

    // Recent Orders
    const recentOrders = await prisma.order.findMany({
      where: { createdAt: { gte: dateFilter } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        orderNumber: true,
        total: true,
        status: true,
        createdAt: true,
        user: {
          select: { name: true },
        },
      },
    });

    const statusCounts: Record<string, number> = {};
    orderStats[8].forEach((s: { status: string; _count: { status: number } }) => {
      const translatedStatus = translateOrderStatus(s.status);
      statusCounts[translatedStatus] = s._count.status;
    });

    return NextResponse.json({
      success: true,
      data: {
        salesSummary: {
          // INGRESOS BRUTOS (todos los pedidos, incluyendo cancelados)
          gross: {
            today: Number(salesSummary[0]._sum.total || 0),
            thisWeek: Number(salesSummary[1]._sum.total || 0),
            thisMonth: Number(salesSummary[2]._sum.total || 0),
            lastMonth: Number(salesSummary[3]._sum.total || 0),
            total: Number(salesSummary[4]._sum.total || 0),
          },
          // INGRESOS NETOS (excluyendo cancelados) - Lo que se espera recibir
          net: {
            today: Number(salesSummary[5]._sum.total || 0),
            thisWeek: Number(salesSummary[6]._sum.total || 0),
            thisMonth: Number(salesSummary[7]._sum.total || 0),
            lastMonth: Number(salesSummary[8]._sum.total || 0),
            total: Number(salesSummary[9]._sum.total || 0),
          },
          // INGRESOS ENTREGADOS (DELIVERED) - Pedidos ya completados
          delivered: {
            today: Number(salesSummary[10]._sum.total || 0),
            thisWeek: Number(salesSummary[11]._sum.total || 0),
            thisMonth: Number(salesSummary[12]._sum.total || 0),
            lastMonth: Number(salesSummary[13]._sum.total || 0),
            total: Number(salesSummary[14]._sum.total || 0),
          },
          // CANCELACIONES (pérdidas)
          cancelled: {
            today: Number(salesSummary[15]._sum.total || 0),
            thisWeek: Number(salesSummary[16]._sum.total || 0),
            thisMonth: Number(salesSummary[17]._sum.total || 0),
            lastMonth: Number(salesSummary[18]._sum.total || 0),
            total: Number(salesSummary[19]._sum.total || 0),
          },
          // Legacy (para compatibilidad con frontend actual)
          today: Number(salesSummary[5]._sum.total || 0),
          thisWeek: Number(salesSummary[6]._sum.total || 0),
          thisMonth: Number(salesSummary[7]._sum.total || 0),
          lastMonth: Number(salesSummary[8]._sum.total || 0),
          total: Number(salesSummary[9]._sum.total || 0),
        },
        orderStats: {
          // Métricas de gestoría completas
          totalHistoric: orderStats[0],           // Todos los pedidos (incluye cancelados)
          totalActive: orderStats[1],            // Pedidos no cancelados
          totalToday: orderStats[2],             // Pedidos creados hoy
          totalThisWeek: orderStats[3],          // Pedidos de la semana
          totalThisMonth: orderStats[4],         // Pedidos del mes
          totalCancelled: orderStats[5],         // Pedidos cancelados
          totalPending: orderStats[6],           // Pedidos pendientes de pago
          totalPaid: orderStats[7],              // Pedidos pagados/confirmados
          // Legacy (para compatibilidad)
          total: orderStats[1],
          today: orderStats[2],
          thisWeek: orderStats[3],
          thisMonth: orderStats[4],
          byStatus: statusCounts,
        },
        customerStats: {
          total: customerStats[0],
          newThisMonth: customerStats[1],
          active: customerStats[2],
        },
        topProducts: topProductsWithDetails,
        topCustomers: topCustomersWithDetails,
        recentOrders: recentOrders.map((o) => ({
          id: o.id,
          numeroPedido: o.orderNumber,
          clienteNombre: o.user?.name || 'N/A',
          total: Number(o.total),
          estado: translateOrderStatus(o.status),
          creadoEn: o.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener analytics' },
      { status: 500 },
    );
  }
}
