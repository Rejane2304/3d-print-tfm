/**
 * API Route - Inventory Management (Admin)
 * GET /api/admin/inventory
 * Supports pagination, filtering by stock level
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
    const stockLevel = searchParams.get('stockLevel') || 'all';

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (stockLevel === 'low') {
      where.stock = { gt: 0, lte: { minStock: { gt: 0 } } };
    } else if (stockLevel === 'critical') {
      where.stock = { lte: 0 };
    } else if (stockLevel === 'out') {
      where.stock = 0;
    }

    // Get total count
    const total = await prisma.product.count({ where });

    // Get products with stock info
    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        stock: true,
        minStock: true,
        price: true,
        isActive: true,
        category: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            movements: true,
          },
        },
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            createdAt: true,
            type: true,
            quantity: true,
          },
        },
      },
      orderBy: { stock: 'asc' },
      skip,
      take: limit,
    });

    // Determine stock status
    const productsWithStatus = products.map((product) => {
      const stockStatus = 
        product.stock <= 0 ? 'critical' :
        product.stock <= product.minStock ? 'low' : 'normal';

      const lastMovement = product.movements[0];

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        stock: product.stock,
        minStock: product.minStock,
        price: product.price,
        category: product.category?.name || 'Sin categoría',
        isActive: product.isActive,
        stockStatus,
        movementCount: product._count.movements,
        lastMovementAt: lastMovement?.createdAt || null,
        lastMovementType: lastMovement?.type || null,
      };
    });

    return NextResponse.json({
      success: true,
      products: productsWithStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener inventario' },
      { status: 500 }
    );
  }
}
