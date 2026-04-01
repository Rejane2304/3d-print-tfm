/**
 * API de Métricas del Dashboard Admin
 * 
 * GET /api/admin/metrics - Obtener estadísticas del panel
 * Requiere: Rol ADMIN
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export async function GET(req: NextRequest) {
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
    const usuario = await prisma.usuario.findUnique({
      where: { email: session.user.email },
    });

    if (!usuario || usuario.rol !== 'ADMIN') {
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
      prisma.pedido.count(),
      prisma.producto.count(),
      prisma.usuario.count({ where: { rol: 'CLIENTE' } }),
      prisma.pedido.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      prisma.pedido.aggregate({
        where: {
          estado: { in: ['CONFIRMADO', 'PREPARANDO', 'ENVIADO', 'ENTREGADO'] },
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
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}
