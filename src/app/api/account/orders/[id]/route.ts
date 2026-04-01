/**
 * API - Detalle de Pedido del Usuario Autenticado
 * GET /api/account/orders/[id]
 * Devuelve el detalle completo de un pedido específico del usuario
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener usuario
    const usuario = await prisma.usuario.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Obtener pedido específico del usuario
    const pedido = await prisma.pedido.findFirst({
      where: {
        id: params.id,
        usuarioId: usuario.id
      },
      include: {
        items: {
          include: {
            producto: {
              select: {
                nombre: true,
                slug: true,
                imagenes: {
                  where: { esPrincipal: true },
                  take: 1,
                  select: { url: true }
                }
              }
            }
          }
        },
        factura: {
          select: {
            id: true,
            numeroFactura: true,
            anulada: true,
            emitidaEn: true
          }
        },
        pago: {
          select: {
            estado: true,
            metodo: true,
            creadoEn: true
          }
        },
        mensajes: {
          orderBy: { creadoEn: 'asc' },
          select: {
            id: true,
            mensaje: true,
            esDeCliente: true,
            creadoEn: true
          }
        }
      }
    });

    if (!pedido) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ pedido });
  } catch (error) {
    console.error('Error al obtener pedido:', error);
    return NextResponse.json(
      { error: 'Error al obtener pedido' },
      { status: 500 }
    );
  }
}
