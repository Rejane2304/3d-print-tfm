/**
 * API Route - Inventory History (Admin)
 * GET /api/admin/inventory/[id]/history
 * Returns inventory movement history for a specific product
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { translateErrorMessage, translateMovementType, translateProductName } from '@/lib/i18n';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: productId } = await params;

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

    // Get query parameters for pagination
    const { searchParams } = new URL(req.url);
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const limit = Number.parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // Get product details
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        slug: true,
        stock: true,
        images: {
          where: { isMain: true },
          take: 1,
          select: { url: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ success: false, error: 'Producto no encontrado' }, { status: 404 });
    }

    // Get total count of movements
    const total = await prisma.inventoryMovement.count({
      where: { productId },
    });

    // Get movements with user info
    const movements = await prisma.inventoryMovement.findMany({
      where: { productId },
      include: {
        createdByUser: {
          select: {
            name: true,
            email: true,
          },
        },
        order: {
          select: {
            orderNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Transform movements to Spanish
    const movementsTranslated = movements.map(movement => ({
      id: movement.id,
      tipo: translateMovementType(movement.type),
      cantidad: movement.quantity,
      stockAnterior: movement.previousStock,
      stockNuevo: movement.newStock,
      razon: movement.reason,
      referencia: movement.reference,
      fecha: movement.createdAt,
      usuario: movement.createdByUser?.name || 'Sistema',
      pedido: movement.order?.orderNumber || null,
    }));

    return NextResponse.json({
      success: true,
      producto: {
        id: product.id,
        nombre: translateProductName(product.slug),
        slug: product.slug,
        stockActual: product.stock,
        imagen: product.images[0]?.url || null,
      },
      movimientos: movementsTranslated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching inventory history:', error);
    return NextResponse.json(
      {
        success: false,
        error: translateErrorMessage('Error al obtener historial'),
      },
      { status: 500 },
    );
  }
}
