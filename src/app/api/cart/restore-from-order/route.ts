/**
 * API Route - Restore Cart from Order
 * POST /api/cart/restore-from-order
 * Restaura el carrito desde un pedido cancelado
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID requerido' }, { status: 400 });
    }

    // Buscar el pedido (puede ser PENDING o CANCELLED)
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        status: { in: ['PENDING', 'CANCELLED'] },
        user: { email: session.user.email },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado o ya procesado' }, { status: 404 });
    }

    // Buscar o crear carrito del usuario
    let cart = await prisma.cart.findUnique({
      where: { userId: order.userId },
      include: { items: true },
    });

    cart ??= await prisma.cart.create({
      data: {
        id: crypto.randomUUID(),
        user: { connect: { id: order.userId } },
        updatedAt: new Date(),
      },
      include: { items: true },
    });

    // Restaurar items del pedido al carrito
    for (const orderItem of order.items) {
      // Saltar items sin productId (producto eliminado)
      if (!orderItem.productId) {
        continue;
      }

      // Verificar si el producto ya esta en el carrito
      const existingItem = cart.items.find(item => item.productId === orderItem.productId);

      if (existingItem) {
        // Actualizar cantidad
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: existingItem.quantity + orderItem.quantity,
          },
        });
      } else {
        // Crear nuevo item
        await prisma.cartItem.create({
          data: {
            id: crypto.randomUUID(),
            cart: { connect: { id: cart.id } },
            product: { connect: { id: orderItem.productId } },
            quantity: orderItem.quantity,
            unitPrice: orderItem.price,
            updatedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Carrito restaurado correctamente',
    });
  } catch (error) {
    console.error('Error restoring cart:', error);
    return NextResponse.json({ error: 'Error al restaurar carrito' }, { status: 500 });
  }
}
