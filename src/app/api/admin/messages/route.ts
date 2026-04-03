/**
 * API de Mensajería Admin
 * Sistema de mensajes en pedidos
 * 
 * Requiere: Rol ADMIN o ser dueño del pedido
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { z } from 'zod';

// Schema de validación
const crearMensajeSchema = z.object({
  pedidoId: z.string().uuid(),
  mensaje: z.string().min(1).max(1000),
});

// GET - Listar mensajes de un pedido
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

    if (!usuario) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const pedidoId = searchParams.get('pedidoId');

    if (!pedidoId) {
      return NextResponse.json(
        { success: false, error: 'pedidoId es requerido' },
        { status: 400 }
      );
    }

    // Verificar acceso al pedido (admin o dueño)
    const pedido = await prisma.order.findUnique({
      where: { id: pedidoId },
    });

    if (!pedido) {
      return NextResponse.json(
        { success: false, error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }

    // Solo admin o el dueño del pedido puede ver mensajes
    if (usuario.role !== 'ADMIN' && pedido.usuarioId !== usuario.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    const mensajes = await prisma.orderMessage.findMany({
      where: { pedidoId },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            rol: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ 
      success: true, 
      mensajes,
    });
  } catch (error) {
    console.error('Error listando mensajes:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}

// POST - Crear mensaje
export async function POST(req: NextRequest) {
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

    if (!usuario) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = crearMensajeSchema.parse(body);

    // Verificar que el pedido existe
    const pedido = await prisma.order.findUnique({
      where: { id: validatedData.pedidoId },
    });

    if (!pedido) {
      return NextResponse.json(
        { success: false, error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }

    // Solo admin o el dueño del pedido puede enviar mensajes
    if (usuario.role !== 'ADMIN' && pedido.usuarioId !== usuario.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Crear mensaje
    const mensaje = await prisma.orderMessage.create({
      data: {
        pedidoId: validatedData.pedidoId,
        usuarioId: usuario.id,
        mensaje: validatedData.mensaje,
        esDeCliente: usuario.role !== 'ADMIN',
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            rol: true,
          },
        },
      },
    });

    return NextResponse.json(
      { success: true, mensaje },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Error creando mensaje:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}