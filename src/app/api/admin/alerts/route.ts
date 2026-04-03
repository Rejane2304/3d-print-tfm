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

// Schema de validación
const actualizarAlertaSchema = z.object({
  id: z.string().uuid(),
  estado: z.enum(['PENDIENTE', 'EN_PROCESO', 'RESUELTA', 'IGNORADA']),
  notasResolucion: z.string().optional(),
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
    const tipo = searchParams.get('tipo');
    const severidad = searchParams.get('severidad');
    const estado = searchParams.get('estado');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (tipo) {
      where.tipo = tipo;
    }
    
    if (severidad) {
      where.severidad = severidad;
    }
    
    if (estado) {
      where.estado = estado;
    }

    const [alertas, total, pendientes] = await Promise.all([
      prisma.alert.findMany({
        where,
        include: {
          producto: {
            select: {
              id: true,
              nombre: true,
              slug: true,
              stock: true,
            },
          },
          resueltaPorUsuario: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
        orderBy: [
          { severidad: 'desc' },
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
      { success: false, error: 'Error interno' },
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

    const updateData: any = {
      estado: validatedData.estado,
    };

    // Si se resuelve, guardar quién y cuándo
    if (validatedData.estado === 'RESUELTA') {
      updateData.resueltaEn = new Date();
      updateData.resueltaPor = usuario.id;
      if (validatedData.notasResolucion) {
        updateData.notasResolucion = validatedData.notasResolucion;
      }
    }

    const alerta = await prisma.alert.update({
      where: { id: validatedData.id },
      data: updateData,
      include: {
        producto: {
          select: {
            id: true,
            nombre: true,
            slug: true,
          },
        },
        resueltaPorUsuario: {
          select: {
            id: true,
            nombre: true,
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
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}
