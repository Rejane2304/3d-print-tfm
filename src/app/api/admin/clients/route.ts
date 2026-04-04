/**
 * API Route - List Clients (Admin)
 * GET /api/admin/clients
 * Supports pagination, search, and filtering
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

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
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
    const clients = await prisma.user.findMany({
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
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Calculate total spent per client
    const clientsWithStats = clients.map((client) => {
      const totalSpent = client.orders
        .filter((o) => o.status !== 'CANCELLED')
        .reduce((sum, o) => sum + Number(o.total), 0);

      const lastOrder = client.orders.length > 0 
        ? client.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
        : null;

      return {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        isActive: client.isActive,
        createdAt: client.createdAt,
        lastAccess: client.lastAccess,
        totalOrders: client._count.orders,
        totalSpent: totalSpent.toFixed(2),
        lastOrderDate: lastOrder ? new Date(lastOrder.createdAt).toISOString() : null,
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
    return NextResponse.json(
      { success: false, error: 'Error al obtener clientes' },
      { status: 500 }
    );
  }
}
