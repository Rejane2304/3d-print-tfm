/**
 * API Route - Admin Analytics Dashboard
 * GET /api/admin/analytics
 * Returns sales, orders, customer statistics
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verify admin role
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Acceso denegado' },
        { status: 403 }
      );
    }

    // Get date range from query
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'month';

    // Calculate date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    const yearStart = new Date(today.getFullYear(), 0, 1);

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

    // Sales Summary
    const salesSummary = await Promise.all([
      // Today
      prisma.order.aggregate({
        where: {
          status: { not: 'CANCELLED' },
          createdAt: { gte: today },
        },
        _sum: { total: true },
      }),
      // This week
      prisma.order.aggregate({
        where: {
          status: { not: 'CANCELLED' },
          createdAt: { gte: weekAgo },
        },
        _sum: { total: true },
      }),
      // This month
      prisma.order.aggregate({
        where: {
          status: { not: 'CANCELLED' },
          createdAt: { gte: monthAgo },
        },
        _sum: { total: true },
      }),
      // Last month
      prisma.order.aggregate({
        where: {
          status: { not: 'CANCELLED' },
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
        _sum: { total: true },
      }),
      // Total
      prisma.order.aggregate({
        where: { status: { not: 'CANCELLED' } },
        _sum: { total: true },
      }),
    ]);

    // Order Stats
    const orderStats = await Promise.all([
      // Total orders
      prisma.order.count(),
      // Today
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      // This week
      prisma.order.count({ where: { createdAt: { gte: weekAgo } } }),
      // This month
      prisma.order.count({ where: { createdAt: { gte: monthAgo } } }),
      // By status
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

    // Top Products
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          status: { not: 'CANCELLED' },
          createdAt: { gte: dateFilter },
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
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId || '' },
          select: { name: true, stock: true },
        });
        return {
          id: item.productId,
          name: product?.name || 'Producto eliminado',
          sold: item._sum.quantity || 0,
          revenue: Number(item._sum.subtotal || 0),
          stock: product?.stock || 0,
        };
      })
    );

    // Top Customers
    const topCustomers = await prisma.order.groupBy({
      by: ['userId'],
      where: {
        status: { not: 'CANCELLED' },
        createdAt: { gte: dateFilter },
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
      topCustomers.map(async (customer) => {
        const user = await prisma.user.findUnique({
          where: { id: customer.userId },
          select: { name: true },
        });
        return {
          id: customer.userId,
          name: user?.name || 'Cliente eliminado',
          orders: customer._count.id,
          spent: Number(customer._sum.total || 0),
        };
      })
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
    orderStats[4].forEach((s) => {
      statusCounts[s.status] = s._count.status;
    });

    return NextResponse.json({
      success: true,
      data: {
        salesSummary: {
          today: Number(salesSummary[0]._sum.total || 0),
          thisWeek: Number(salesSummary[1]._sum.total || 0),
          thisMonth: Number(salesSummary[2]._sum.total || 0),
          lastMonth: Number(salesSummary[3]._sum.total || 0),
          total: Number(salesSummary[4]._sum.total || 0),
        },
        orderStats: {
          total: orderStats[0],
          today: orderStats[1],
          thisWeek: orderStats[2],
          thisMonth: orderStats[3],
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
          orderNumber: o.orderNumber,
          customerName: o.user?.name || 'N/A',
          total: Number(o.total),
          status: o.status,
          createdAt: o.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener analytics' },
      { status: 500 }
    );
  }
}
