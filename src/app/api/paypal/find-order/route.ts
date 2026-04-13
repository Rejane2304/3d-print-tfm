/**
 * API Route - Find Order by PayPal Order ID
 * GET /api/paypal/find-order?paypalOrderId=xxx
 * Busca el pedido interno asociado a un paypalOrderId
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const paypalOrderId = searchParams.get('paypalOrderId');

    if (!paypalOrderId) {
      return NextResponse.json({ error: 'PayPal Order ID requerido' }, { status: 400 });
    }

    // Buscar el pedido por paypalOrderId
    const order = await prisma.order.findFirst({
      where: {
        paypalOrderId: paypalOrderId,
        user: {
          email: session.user.email,
        },
      },
      select: {
        id: true,
        orderNumber: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    console.error('Error finding order by PayPal ID:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
