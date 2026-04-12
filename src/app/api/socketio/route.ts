import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { translateErrorMessage } from '@/lib/i18n';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Simple REST endpoint for event polling (fallback for WebSockets)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const lastEventId = searchParams.get('lastEventId');

    if (!userId) {
      return NextResponse.json(
        { error: translateErrorMessage('User ID required') },
        { status: 400 },
      );
    }

    // Get pending events for user
    const events = await prisma.eventStore.findMany({
      where: {
        OR: [{ room: `user:${userId}` }, { room: 'admin' }],
        ...(lastEventId
          ? {
            id: { gt: lastEventId },
          }
          : {
            delivered: false,
          }),
      },
      orderBy: { timestamp: 'asc' },
      take: 100,
    });

    // Mark events as delivered
    if (events.length > 0) {
      await prisma.eventStore.updateMany({
        where: {
          id: { in: events.map((e) => e.id) },
        },
        data: {
          delivered: true,
          deliveredAt: new Date(),
        },
      });
    }

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: translateErrorMessage('Internal server error') },
      { status: 500 },
    );
  }
}

// Endpoint to emit events (called by other API routes)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, payload, room, userId } = body;

    if (!type || !payload || !room) {
      return NextResponse.json(
        { error: translateErrorMessage('Missing required fields') },
        { status: 400 },
      );
    }

    // Store event
    const event = await prisma.eventStore.create({
      data: {
        id: crypto.randomUUID(),
        type,
        payload,
        room,
        userId: userId || null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        delivered: false,
      },
    });

    return NextResponse.json({ success: true, eventId: event.id });
  } catch (error) {
    console.error('Error emitting event:', error);
    return NextResponse.json(
      { error: translateErrorMessage('Internal server error') },
      { status: 500 },
    );
  }
}
