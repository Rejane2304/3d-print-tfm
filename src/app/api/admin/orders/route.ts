/**
 * API de Pedidos Admin
 * CRUD de pedidos para administradores
 * 
 * Requiere: Rol ADMIN
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { z } from 'zod';

// Schema de validación para actualización
const actualizarPedidoSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  internalNotes: z.string().optional(),
  shippedAt: z.string().datetime().optional(),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
});

// GET - Listar pedidos
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!usuario || usuario.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [pedidos, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            take: 1,
          },
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({ 
      success: true, 
      pedidos,
      total,
      pages: Math.ceil(total / limit),
      page,
      limit,
    });
  } catch (error) {
    console.error('Error listando pedidos:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar estado del pedido
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!usuario || usuario.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, ...data } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requerido' },
        { status: 400 }
      );
    }

    const validatedData = actualizarPedidoSchema.parse(data);

    // Actualizar timestamps según el estado
    const updateData: any = { ...validatedData };
    if (validatedData.status === 'SHIPPED' && validatedData.shippedAt) {
      updateData.sentAt = new Date(validatedData.shippedAt);
    } else if (validatedData.status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    } else if (validatedData.status === 'PREPARING') {
      updateData.preparingAt = new Date();
    } else if (validatedData.status === 'CANCELLED') {
      updateData.cancelledAt = new Date();
    }

    const pedido = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, pedido });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Error actualizando pedido:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}