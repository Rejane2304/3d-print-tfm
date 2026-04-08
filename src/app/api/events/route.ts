import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { translateErrorMessage } from '@/lib/i18n';

// GET /api/events - Obtener eventos pendientes
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const lastEventId = searchParams.get('lastEventId');
    const userId = session.user.id;
    const userRole = session.user.rol;

    // Construir rooms a las que el usuario tiene acceso
    const rooms = [`user:${userId}`];
    if (userRole === 'ADMIN') {
      rooms.push('admin');
    }

    // Obtener eventos pendientes
    const events = await prisma.eventStore.findMany({
      where: {
        room: { in: rooms },
        ...(lastEventId ? {
          id: { gt: lastEventId }
        } : {
          delivered: false
        })
      },
      orderBy: { timestamp: 'asc' },
      take: 100
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST /api/events/acknowledge - Marcar eventos como entregados
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { eventIds } = body;

    if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
      return NextResponse.json({ error: 'IDs de eventos inválidos' }, { status: 400 });
    }

    await prisma.eventStore.updateMany({
      where: {
        id: { in: eventIds }
      },
      data: {
        delivered: true,
        deliveredAt: new Date()
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error acknowledging events:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
