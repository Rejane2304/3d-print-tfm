/**
 * Admin Orders API
 * CRUD for orders for administrators
 * 
 * Requires: ADMIN role
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { z } from 'zod';
import { Prisma, OrderStatus } from '@prisma/client';
import { translateOrderStatus, translateErrorMessage } from '@/lib/i18n';
import { emitOrderStatusUpdated } from '@/lib/realtime/event-service';

// Validation schema for update
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const actualizarPedidoSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  internalNotes: z.string().optional(),
  shippedAt: z.string().datetime().optional(),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
});

// GET - List orders
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
    const limit = Number.parseInt(searchParams.get('limit') || '50', 10);
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};
    if (status) {
      where.status = status as OrderStatus;
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

    // Translate order data before sending to frontend
    // Transform to Spanish response format matching frontend expectations
    const pedidosTraducidos = pedidos.map(pedido => ({
      id: pedido.id,
      orderNumber: pedido.orderNumber,
      estado: translateOrderStatus(pedido.status),
      total: pedido.total,
      createdAt: pedido.createdAt,
      usuario: {
        nombre: pedido.user.name,
        email: pedido.user.email,
      },
      items: pedido.items.map(item => ({ id: item.id })),
    }));

    return NextResponse.json({ 
      success: true, 
      pedidos: pedidosTraducidos,
      total,
      pages: Math.ceil(total / limit),
      page,
      limit,
    });
  } catch (error) {
    console.error('Error listing orders:', error);
    return NextResponse.json(
      { success: false, error: translateErrorMessage('Internal error') },
      { status: 500 }
    );
  }
}

// Mapping of statuses from Spanish to English
const estadoToEnglish: Record<string, string> = {
  'Pendiente': 'PENDING',
  'Confirmado': 'CONFIRMED',
  'En preparación': 'PREPARING',
  'Enviado': 'SHIPPED',
  'Entregado': 'DELIVERED',
  'Cancelado': 'CANCELLED',
};

// PATCH - Update order status
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
    const { id, estado, notasInternas, numeroSeguimiento, transportista } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requerido' },
        { status: 400 }
      );
    }

    // Convert status from Spanish to English
    const englishStatus = estadoToEnglish[estado];
    if (!englishStatus) {
      return NextResponse.json(
        { success: false, error: 'Estado inválido' },
        { status: 400 }
      );
    }

    // Update timestamps based on status
    const updateData: Prisma.OrderUpdateInput = {
      status: englishStatus as OrderStatus,
      internalNotes: notasInternas,
    };

    if (englishStatus === 'SHIPPED') {
      if (numeroSeguimiento) updateData.trackingNumber = numeroSeguimiento;
      if (transportista) updateData.carrier = transportista;
    }

    const pedido = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    // Emitir evento de cambio de estado en tiempo real
    if (pedido.user?.id) {
      await emitOrderStatusUpdated(
        pedido.id,
        estado,
        pedido.user.id
      );
    }

    return NextResponse.json({ success: true, pedido });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Error updating order:', error);
    return NextResponse.json(
      { success: false, error: translateErrorMessage('Internal error') },
      { status: 500 }
    );
  }
}