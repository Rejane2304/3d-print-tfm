/**
 * API de Alertas Admin
 * Gestión de alertas del sistema
 * 
 * Requiere: Rol ADMIN
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { z } from 'zod';
import { Prisma, AlertType, AlertSeverity, AlertStatus } from '@prisma/client';

// Schema de validación
const actualizarAlertaSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'RESOLVED', 'IGNORED']),
  resolutionNotes: z.string().optional(),
});

// GET - Listar alertas
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
    const type = searchParams.get('type');
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    const where: Prisma.AlertWhereInput = {};

    if (type) {
      where.type = type as AlertType;
    }

    if (severity) {
      where.severity = severity as AlertSeverity;
    }

    if (status) {
      where.status = status as AlertStatus;
    }

    const [alertas, total, pendientes] = await Promise.all([
      prisma.alert.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              stock: true,
            },
          },
          resolvedByUser: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.alert.count({ where }),
      prisma.alert.count({ where: { status: 'PENDING' } }),
    ]);

    return NextResponse.json({ 
      success: true, 
      alertas,
      total,
      pendientes,
      pages: Math.ceil(total / limit),
      page,
      limit,
    });
  } catch (error) {
    console.error('Error listando alertas:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar estado de alerta
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
    const validatedData = actualizarAlertaSchema.parse(body);

    const updateData: Prisma.AlertUncheckedUpdateInput = {
      status: validatedData.status,
    };

    // Si se resuelve, guardar quién y cuándo
    if (validatedData.status === 'RESOLVED') {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = usuario.id;
      if (validatedData.resolutionNotes) {
        updateData.resolutionNotes = validatedData.resolutionNotes;
      }
    }

    const alerta = await prisma.alert.update({
      where: { id: validatedData.id },
      data: updateData,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        resolvedByUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, alerta });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Error actualizando alerta:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
