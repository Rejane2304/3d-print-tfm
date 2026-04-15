export const dynamic = 'force-dynamic';

/**
 * API de Métricas del Dashboard Admin
 *
 * GET /api/admin/metrics - Obtener estadísticas del panel
 * Requiere: Rol ADMIN
 *
 * Este endpoint utiliza el servicio centralizado de métricas para garantizar
 * consistencia en todos los cálculos del dashboard.
 *
 * Métricas devueltas:
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
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { getDashboardMetrics } from '@/lib/metrics/metrics-service';

export async function GET() {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    // Verificar rol admin
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (usuario?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 });
    }

    // Obtener métricas del servicio centralizado (con caché)
    const metrics = await getDashboardMetrics();

    return NextResponse.json({
      success: true,
      metrics,
    });
  } catch (error) {
    console.error('Error obteniendo métricas:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
