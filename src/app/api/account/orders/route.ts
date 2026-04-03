/**
 * API - Listado de Pedidos del Usuario Autenticado
 * GET /api/account/orders
 * Devuelve todos los pedidos del usuario logueado
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener usuario
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Obtener pedidos del usuario
    const pedidos = await prisma.order.findMany({
      where: { userId: usuario.id },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                slug: true,
                images: {
                  where: { isMain: true },
                  take: 1,
                  select: { url: true }
                }
              }
            }
          }
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            isCancelled: true
          }
        },
        payment: {
          select: {
            status: true,
            method: true
          }
        }
      }
    });

    return NextResponse.json({ pedidos });
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    return NextResponse.json(
      { error: 'Error al obtener pedidos' },
      { status: 500 }
    );
  }
}
