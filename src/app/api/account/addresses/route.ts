/**
 * API - Gestión de Direcciones del Usuario
 * CRUD completo de direcciones de envío
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// Schema de validación
const direccionSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  destinatario: z.string().min(1, 'El destinatario es requerido'),
  telefono: z.string().min(9, 'Teléfono inválido'),
  direccion: z.string().min(1, 'La dirección es requerida'),
  complemento: z.string().optional(),
  codigoPostal: z.string().regex(/^\d{5}$/, 'Código postal inválido'),
  ciudad: z.string().min(1, 'La ciudad es requerida'),
  provincia: z.string().min(1, 'La provincia es requerida'),
  esPrincipal: z.boolean().default(false),
});

// GET - Listar direcciones del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

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

    const direcciones = await prisma.direccion.findMany({
      where: { usuarioId: usuario.id },
      orderBy: [
        { esPrincipal: 'desc' },
        { creadoEn: 'desc' }
      ]
    });

    return NextResponse.json({ direcciones });
  } catch (error) {
    console.error('Error al obtener direcciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener direcciones' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva dirección
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

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

    const body = await request.json();
    
    // Validar datos
    const validatedData = direccionSchema.parse(body);

    // Si es principal, desmarcar las otras
    if (validatedData.esPrincipal) {
      await prisma.direccion.updateMany({
        where: { usuarioId: usuario.id },
        data: { esPrincipal: false }
      });
    }

    // Contar direcciones existentes
    const count = await prisma.direccion.count({
      where: { usuarioId: usuario.id }
    });

    // Si es la primera dirección, marcarla como principal
    if (count === 0) {
      validatedData.esPrincipal = true;
    }

    const direccion = await prisma.direccion.create({
      data: {
        ...validatedData,
        usuarioId: usuario.id
      }
    });

    return NextResponse.json({ direccion }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error al crear dirección:', error);
    return NextResponse.json(
      { error: 'Error al crear dirección' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar dirección
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

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

    const { id, ...data } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID de dirección requerido' },
        { status: 400 }
      );
    }

    // Verificar que la dirección pertenece al usuario
    const existing = await prisma.direccion.findFirst({
      where: { id, usuarioId: usuario.id }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Dirección no encontrada' },
        { status: 404 }
      );
    }

    // Si se marca como principal, desmarcar las otras
    if (data.esPrincipal) {
      await prisma.direccion.updateMany({
        where: { usuarioId: usuario.id, id: { not: id } },
        data: { esPrincipal: false }
      });
    }

    const direccion = await prisma.direccion.update({
      where: { id },
      data
    });

    return NextResponse.json({ direccion });
  } catch (error) {
    console.error('Error al actualizar dirección:', error);
    return NextResponse.json(
      { error: 'Error al actualizar dirección' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar dirección
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID de dirección requerido' },
        { status: 400 }
      );
    }

    // Verificar que la dirección pertenece al usuario
    const existing = await prisma.direccion.findFirst({
      where: { id, usuarioId: usuario.id }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Dirección no encontrada' },
        { status: 404 }
      );
    }

    await prisma.direccion.delete({ where: { id } });

    // Si era la principal, marcar otra como principal
    if (existing.esPrincipal) {
      const otra = await prisma.direccion.findFirst({
        where: { usuarioId: usuario.id },
        orderBy: { creadoEn: 'asc' }
      });

      if (otra) {
        await prisma.direccion.update({
          where: { id: otra.id },
          data: { esPrincipal: true }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar dirección:', error);
    return NextResponse.json(
      { error: 'Error al eliminar dirección' },
      { status: 500 }
    );
  }
}
