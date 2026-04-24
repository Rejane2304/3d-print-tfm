/**
 * API Route - Admin Analytics Dashboard (Versión Simplificada y Robusta)
 * GET /api/admin/analytics
 * Returns basic sales and order statistics
 */
export const dynamic = 'force-dynamic';

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { translateOrderStatus } from '@/lib/i18n';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    // Verify admin role
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (adminUser?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
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
    const yearAgo = new Date(today);
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);

    // Build date filter based on range
    let dateFilter: Date;
    switch (range) {
      case 'today':
        dateFilter = today;
        break;
      case 'week':
        dateFilter = weekAgo;
        break;
      case 'year':
        dateFilter = yearAgo;
        break;
      default:
        dateFilter = monthAgo;
    }

    // Consultas simples y atómicas con manejo de errores individual
    let totalOrders = 0;
    let totalRevenue = 0;
    let activeOrders = 0;
    let pendingOrders = 0;
    let statusCounts: Record<string, number> = {};
    interface RecentOrder {
      id: string;
      orderNumber: string;
      status: string;
      total: number;
      createdAt: Date;
      user: {
        name: string | null;
        email: string;
      };
    }
    let recentOrders: RecentOrder[] = [];
    interface TopProduct {
      name: string;
      quantity: number;
      revenue: number;
    }
    let topProducts: TopProduct[] = [];

    try {
      // Total orders
      totalOrders = await prisma.order.count({
        where: { createdAt: { gte: dateFilter } },
      });
    } catch (e) {
      console.error('Error counting orders:', e);
    }

    try {
      // Total revenue (solo pedidos no cancelados)
      const revenueAgg = await prisma.order.aggregate({
        where: {
          createdAt: { gte: dateFilter },
          status: { not: 'CANCELLED' },
        },
        _sum: { total: true },
      });
      totalRevenue = Number(revenueAgg._sum.total || 0);
    } catch (e) {
      console.error('Error aggregating revenue:', e);
    }

    try {
      // Active orders (PENDING + CONFIRMED + PREPARING + SHIPPED)
      activeOrders = await prisma.order.count({
        where: {
          createdAt: { gte: dateFilter },
          status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED'] },
        },
      });
    } catch (e) {
      console.error('Error counting active orders:', e);
    }

    try {
      // Pending orders
      pendingOrders = await prisma.order.count({
        where: {
          createdAt: { gte: dateFilter },
          status: 'PENDING',
        },
      });
    } catch (e) {
      console.error('Error counting pending orders:', e);
    }

    try {
      // Status counts with safe translation
      const statusData = await prisma.order.groupBy({
        by: ['status'],
        where: { createdAt: { gte: dateFilter } },
        _count: { status: true },
      });

      statusCounts = {};
      for (const s of statusData) {
        try {
          const translatedStatus = translateOrderStatus(s.status);
          statusCounts[translatedStatus] = s._count.status;
        } catch {
          statusCounts[s.status] = s._count.status;
        }
      }
    } catch (e) {
      console.error('Error grouping by status:', e);
    }

    try {
      // Recent orders
      const rawOrders = await prisma.order.findMany({
        where: { createdAt: { gte: dateFilter } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          createdAt: true,
          user: {
            select: { name: true, email: true },
          },
        },
      });
      recentOrders = rawOrders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: Number(order.total),
        createdAt: order.createdAt,
        user: {
          name: order.user.name,
          email: order.user.email,
        },
      }));
    } catch (e) {
      console.error('Error fetching recent orders:', e);
    }

    try {
      // Top products
      const orderItems = await prisma.orderItem.findMany({
        where: {
          order: {
            createdAt: { gte: dateFilter },
            status: { not: 'CANCELLED' },
          },
        },
        select: {
          name: true,
          quantity: true,
          subtotal: true,
        },
      });

      // Aggregate products manually
      const productMap = new Map();
      for (const item of orderItems) {
        const existing = productMap.get(item.name) || { name: item.name, quantity: 0, revenue: 0 };
        existing.quantity += item.quantity;
        existing.revenue += Number(item.subtotal);
        productMap.set(item.name, existing);
      }

      topProducts = Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
    } catch (e) {
      console.error('Error fetching top products:', e);
    }

    // Return simplified response
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalOrders,
          totalRevenue,
          activeOrders,
          pendingOrders,
          averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        },
        statusCounts,
        recentOrders,
        topProducts,
        period: range,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Analytics API] Critical error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al generar analytics',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 },
    );
  }
}
