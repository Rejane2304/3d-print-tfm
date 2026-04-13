/**
 * API Route - Client Detail (Admin)
 * GET /api/admin/clients/[id]
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { translateOrderStatus, translatePaymentMethod, translatePaymentStatus } from '@/lib/i18n';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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

    const { id } = params;

    // Get client with all related data
    const client = await prisma.user.findUnique({
      where: { id, role: 'CUSTOMER' },
      include: {
        addresses: {
          orderBy: { isDefault: 'desc' },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            items: {
              select: {
                id: true,
                name: true,
                quantity: true,
                price: true,
                subtotal: true,
              },
            },
            payment: {
              select: {
                status: true,
                method: true,
              },
            },
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ success: false, error: 'Cliente no encontrado' }, { status: 404 });
    }

    // Calculate statistics
    const totalOrders = client.orders.length;
    const totalSpent = client.orders.filter(o => o.status !== 'CANCELLED').reduce((sum, o) => sum + Number(o.total), 0);

    const completedOrders = client.orders.filter(o => o.status === 'DELIVERED').length;

    const pendingOrders = client.orders.filter(o => ['PENDING', 'CONFIRMED', 'PREPARING'].includes(o.status)).length;

    return NextResponse.json({
      success: true,
      client: {
        id: client.id,
        nombre: client.name,
        email: client.email,
        telefono: client.phone,
        activo: client.isActive,
        creadoEn: client.createdAt,
        ultimoAcceso: client.lastAccess,
        addresses: client.addresses.map(addr => ({
          id: addr.id,
          name: addr.name,
          recipient: addr.recipient,
          phone: addr.phone,
          address: addr.address,
          postalCode: addr.postalCode,
          city: addr.city,
          province: addr.province,
          isDefault: addr.isDefault,
        })),
        orders: client.orders.map(order => ({
          id: order.id,
          numeroPedido: order.orderNumber,
          estado: translateOrderStatus(order.status),
          total: order.total,
          createdAt: order.createdAt,
          itemCount: order.items.length,
          pagoEstado: translatePaymentStatus(order.payment?.status || 'PENDING'),
          pagoMetodo: translatePaymentMethod(order.payment?.method || 'CARD'),
        })),
        estadisticas: {
          totalPedidos: totalOrders,
          totalGastado: totalSpent.toFixed(2),
          pedidosCompletados: completedOrders,
          pedidosPendientes: pendingOrders,
          valorPromedio: totalOrders > 0 ? (totalSpent / totalOrders).toFixed(2) : '0.00',
        },
      },
    });
  } catch (error) {
    console.error('Error fetching client detail:', error);
    return NextResponse.json({ success: false, error: 'Error al obtener detalle del cliente' }, { status: 500 });
  }
}
