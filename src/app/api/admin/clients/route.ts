export const dynamic = 'force-dynamic';

/**
 * API Route - List Clients (Admin)
 * GET /api/admin/clients
 * Supports pagination, search, and filtering
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

// Type for client order data
interface ClientOrder {
  total: number | { toNumber(): number };
  status: string;
  createdAt: Date;
}

// Type for client with orders
interface ClientWithData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  lastAccess: Date | null;
  _count: {
    orders: number;
  };
  orders: ClientOrder[];
}

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

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const limit = Number.parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build where clause using any to bypass strict typing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {
      role: 'CUSTOMER',
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    // Get total count
    const total = await prisma.user.count({ where });

    // Get clients with aggregated data
    const clients = (await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        lastAccess: true,
        _count: {
          select: {
            orders: true,
          },
        },
        orders: {
          select: {
            total: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    })) as ClientWithData[];

    // Calculate total spent per client
    const clientsWithStats = clients.map((client: ClientWithData) => {
      const totalSpent = client.orders
        .filter((o: ClientOrder) => o.status !== 'CANCELLED')
        .reduce((sum: number, o: ClientOrder) => sum + Number(o.total), 0);

      let lastOrder: ClientOrder | null = null;
      if (client.orders.length > 0) {
        const sortedOrders = [...client.orders].sort(
          (a: ClientOrder, b: ClientOrder) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        lastOrder = sortedOrders[0];
      }

      return {
        id: client.id,
        nombre: client.name,
        email: client.email,
        telefono: client.phone,
        activo: client.isActive,
        creadoEn: client.createdAt,
        ultimoAcceso: client.lastAccess,
        totalPedidos: client._count.orders,
        totalGastado: totalSpent.toFixed(2),
        fechaUltimoPedido: lastOrder ? new Date(lastOrder.createdAt).toISOString() : null,
      };
    });

    return NextResponse.json({
      success: true,
      clients: clientsWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ success: false, error: 'Error al obtener clientes' }, { status: 500 });
  }
}
