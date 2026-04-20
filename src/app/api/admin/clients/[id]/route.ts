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

// Type definitions for client data
interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface ClientOrderFull {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: Date;
  items: OrderItem[];
  payment: { status: string; method: string } | null;
}

interface ClientAddress {
  id: string;
  name: string;
  recipient: string;
  phone: string | null;
  address: string;
  postalCode: string;
  city: string;
  province: string;
  isDefault: boolean;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

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
    const orders = client.orders as unknown as ClientOrderFull[];
    const totalOrders = orders.length;
    const totalSpent = orders
      .filter(o => o.status !== 'CANCELLED')
      .reduce((sum: number, o) => sum + Number(o.total), 0);

    const completedOrders = orders.filter(o => o.status === 'DELIVERED').length;

    const pendingOrders = orders.filter(o => ['PENDING', 'CONFIRMED', 'PREPARING'].includes(o.status)).length;

    const addresses = client.addresses as unknown as ClientAddress[];

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
        addresses: addresses.map((addr: ClientAddress) => ({
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
        orders: orders.map((order: ClientOrderFull) => ({
          id: order.id,
          numeroPedido: order.orderNumber,
          estado: translateOrderStatus(order.status),
          total: Number(order.total),
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
