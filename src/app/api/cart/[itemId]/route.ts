/**
 * API Route para items individuales del carrito
 * 
 * PATCH /api/cart/[itemId] - Actualizar cantidad
 * DELETE /api/cart/[itemId] - Eliminar item
 * 
 * Requiere autenticación
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withErrorHandler } from '@/lib/errors/api-wrapper';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

// PATCH /api/cart/[itemId] - Actualizar cantidad
export const PATCH = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: { itemId: string } }
) => {
  const { itemId } = params;

  // Verificar autenticación
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json(
      { success: false, error: 'No autenticado' },
      { status: 401 }
    );
  }

  // Obtener nueva cantidad
  const body = await req.json();
  const { quantity } = body;

  if (quantity === undefined || quantity < 0) {
    return NextResponse.json(
      { success: false, error: 'Cantidad inválida' },
      { status: 400 }
    );
  }

  // Buscar item y verificar que pertenece al usuario
  const item = await prisma.cartItem.findFirst({
    where: {
      id: itemId,
      cart: {
        user: {
          email: session.user.email,
        },
      },
    },
    include: {
      product: true,
      cart: true,
    },
  });

  if (!item) {
    return NextResponse.json(
      { success: false, error: 'Item no encontrado' },
      { status: 404 }
    );
  }

  // Si cantidad es 0, eliminar el item
  if (quantity === 0) {
    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    // Recalcular subtotal
    const remainingItems = await prisma.cartItem.findMany({
      where: { cartId: item.cartId },
    });

    const newSubtotal = remainingItems.reduce(
      (sum: number, i: { unitPrice: { toString: () => string }; quantity: number }) =>
        sum + Number(i.unitPrice) * i.quantity,
      0
    );

    await prisma.cart.update({
      where: { id: item.cartId },
      data: { subtotal: newSubtotal },
    });

    return NextResponse.json({
      success: true,
      message: 'Item eliminado',
    });
  }

  // Verificar stock
  if (item.product.stock < quantity) {
    return NextResponse.json(
      { success: false, error: 'Stock insuficiente' },
      { status: 400 }
    );
  }

  // Actualizar cantidad
  await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity },
  });

  // Recalcular subtotal
  const items = await prisma.cartItem.findMany({
    where: { cartId: item.cartId },
  });

  const newSubtotal = items.reduce(
    (sum: number, i: { unitPrice: { toString: () => string }; quantity: number }) =>
      sum + Number(i.unitPrice) * i.quantity,
    0
  );

  await prisma.cart.update({
    where: { id: item.cartId },
    data: { subtotal: newSubtotal },
  });

  return NextResponse.json({
    success: true,
    message: 'Cantidad actualizada',
  });
});

// DELETE /api/cart/[itemId] - Eliminar item
export const DELETE = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: { itemId: string } }
) => {
  const { itemId } = params;

  // Verificar autenticación
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json(
      { success: false, error: 'No autenticado' },
      { status: 401 }
    );
  }

  // Buscar item y verificar que pertenece al usuario
  const item = await prisma.cartItem.findFirst({
    where: {
      id: itemId,
      cart: {
        user: {
          email: session.user.email,
        },
      },
    },
    include: {
      cart: true,
    },
  });

  if (!item) {
    return NextResponse.json(
      { success: false, error: 'Item no encontrado' },
      { status: 404 }
    );
  }

  // Eliminar item
  await prisma.cartItem.delete({
    where: { id: itemId },
  });

  // Recalcular subtotal
  const remainingItems = await prisma.cartItem.findMany({
    where: { cartId: item.cartId },
  });

  const newSubtotal = remainingItems.reduce(
    (sum: number, i: { unitPrice: { toString: () => string }; quantity: number }) =>
      sum + Number(i.unitPrice) * i.quantity,
    0
  );

  await prisma.cart.update({
    where: { id: item.cartId },
    data: { subtotal: newSubtotal },
  });

  return NextResponse.json({
    success: true,
    message: 'Item eliminado del carrito',
  });
});
