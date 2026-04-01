/**
 * API Route para items individuales del carrito
 * 
 * PATCH /api/cart/[itemId] - Actualizar quantity
 * DELETE /api/cart/[itemId] - Eliminar item
 * 
 * Requiere autenticación
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withErrorHandler } from '@/lib/errors/api-wrapper';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

// PATCH /api/cart/[itemId] - Actualizar quantity
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

  // Obtener nueva quantity
  const body = await req.json();
  const { quantity } = body;

  if (quantity === undefined || quantity < 0) {
    return NextResponse.json(
      { success: false, error: 'Cantidad inválida' },
      { status: 400 }
    );
  }

  // Buscar item y verificar que pertenece al usuario
  const item = await prisma.itemCarrito.findFirst({
    where: {
      id: itemId,
      carrito: {
        usuario: {
          email: session.user.email,
        },
      },
    },
    include: {
      producto: true,
      carrito: true,
    },
  });

  if (!item) {
    return NextResponse.json(
      { success: false, error: 'Item no encontrado' },
      { status: 404 }
    );
  }

  // Si quantity es 0, eliminar el item
  if (quantity === 0) {
    await prisma.itemCarrito.delete({
      where: { id: itemId },
    });

    // Recalcular subtotal
    const itemsRestantes = await prisma.itemCarrito.findMany({
      where: { carritoId: item.carritoId },
    });

    const nuevoSubtotal = itemsRestantes.reduce(
      (sum: number, i: { unitPrice: { toString: () => string }; quantity: number }) =>
        sum + Number(i.unitPrice) * i.quantity,
      0
    );

    await prisma.carrito.update({
      where: { id: item.carritoId },
      data: { subtotal: nuevoSubtotal },
    });

    return NextResponse.json({
      success: true,
      message: 'Item eliminado',
    });
  }

  // Verificar stock
  if (item.producto.stock < quantity) {
    return NextResponse.json(
      { success: false, error: 'Stock insuficiente' },
      { status: 400 }
    );
  }

  // Actualizar quantity
  await prisma.itemCarrito.update({
    where: { id: itemId },
    data: { quantity },
  });

  // Recalcular subtotal
  const items = await prisma.itemCarrito.findMany({
    where: { carritoId: item.carritoId },
  });

  const nuevoSubtotal = items.reduce(
    (sum: number, i: { unitPrice: { toString: () => string }; quantity: number }) =>
      sum + Number(i.unitPrice) * i.quantity,
    0
  );

  await prisma.carrito.update({
    where: { id: item.carritoId },
    data: { subtotal: nuevoSubtotal },
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
  const item = await prisma.itemCarrito.findFirst({
    where: {
      id: itemId,
      carrito: {
        usuario: {
          email: session.user.email,
        },
      },
    },
    include: {
      carrito: true,
    },
  });

  if (!item) {
    return NextResponse.json(
      { success: false, error: 'Item no encontrado' },
      { status: 404 }
    );
  }

  // Eliminar item
  await prisma.itemCarrito.delete({
    where: { id: itemId },
  });

  // Recalcular subtotal
  const itemsRestantes = await prisma.itemCarrito.findMany({
    where: { carritoId: item.carritoId },
  });

  const nuevoSubtotal = itemsRestantes.reduce(
    (sum: number, i: { unitPrice: { toString: () => string }; quantity: number }) =>
      sum + Number(i.unitPrice) * i.quantity,
    0
  );

  await prisma.carrito.update({
    where: { id: item.carritoId },
    data: { subtotal: nuevoSubtotal },
  });

  return NextResponse.json({
    success: true,
    message: 'Item eliminado del carrito',
  });
});
