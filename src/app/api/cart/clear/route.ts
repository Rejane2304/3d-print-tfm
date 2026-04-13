/**
 * API Route - Vaciar Carrito
 * DELETE /api/cart/clear
 * Vacía completamente el carrito del usuario autenticado
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Obtener usuario
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { cart: true },
    });

    if (!user?.cart) {
      return NextResponse.json({
        success: true,
        message: 'Carrito ya está vacío',
      });
    }

    // Eliminar todos los items del carrito
    await prisma.cartItem.deleteMany({
      where: { cartId: user.cart.id },
    });

    // Actualizar subtotal del carrito
    await prisma.cart.update({
      where: { id: user.cart.id },
      data: { subtotal: 0 },
    });

    return NextResponse.json({ success: true, message: 'Carrito vaciado' });
  } catch (error) {
    console.error('Error vaciando carrito:', error);
    return NextResponse.json({ error: 'Error al vaciar carrito' }, { status: 500 });
  }
}
