/**
 * API de Métricas del Dashboard Admin
 * 
 * GET /api/admin/metrics - Obtener estadísticas del panel
 * Requiere: Rol ADMIN
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export async function GET() {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar rol admin
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!usuario || usuario.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Calcular métricas
    const [
      totalPedidos,
      totalProductos,
      totalUsuarios,
      pedidosMes,
      ventasMes,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.product.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      prisma.order.aggregate({
        where: {
          status: { in: ['CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED'] },
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { total: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      metrics: {
        totalPedidos,
        totalProductos,
        totalUsuarios,
        pedidosMes,
        ventasMes: Number(ventasMes._sum.total || 0),
      },
    });
  } catch (error) {
    console.error('Error obteniendo métricas:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
