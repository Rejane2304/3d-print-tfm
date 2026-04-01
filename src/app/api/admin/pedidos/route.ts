/**
 * API de Pedidos Admin
 * CRUD de pedidos para administradores
 * 
 * Requiere: Rol ADMIN
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { z } from 'zod';

// Schema de validación para actualización
const actualizarPedidoSchema = z.object({
  estado: z.enum(['PENDIENTE', 'PAGADO', 'EN_PREPARACION', 'ENVIADO', 'ENTREGADO', 'CANCELADO']),
  notasInternas: z.string().optional(),
  fechaEnvio: z.string().datetime().optional(),
  numeroSeguimiento: z.string().optional(),
  transportista: z.string().optional(),
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

    const usuario = await prisma.usuario.findUnique({
      where: { email: session.user.email },
    });

    if (!usuario || usuario.rol !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (estado) {
      where.estado = estado;
    }

    const [pedidos, total] = await Promise.all([
      prisma.pedido.findMany({
        where,
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              email: true,
            },
          },
          items: {
            take: 1,
          },
          pago: true,
        },
        orderBy: { creadoEn: 'desc' },
        skip,
        take: limit,
      }),
      prisma.pedido.count({ where }),
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

    const usuario = await prisma.usuario.findUnique({
      where: { email: session.user.email },
    });

    if (!usuario || usuario.rol !== 'ADMIN') {
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
    if (validatedData.estado === 'ENVIADO' && validatedData.fechaEnvio) {
      updateData.enviadoEn = new Date(validatedData.fechaEnvio);
    } else if (validatedData.estado === 'ENTREGADO') {
      updateData.entregadoEn = new Date();
      updateData.fechaEntrega = new Date();
    } else if (validatedData.estado === 'EN_PREPARACION') {
      updateData.preparandoEn = new Date();
    } else if (validatedData.estado === 'CANCELADO') {
      updateData.canceladoEn = new Date();
    }

    const pedido = await prisma.pedido.update({
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