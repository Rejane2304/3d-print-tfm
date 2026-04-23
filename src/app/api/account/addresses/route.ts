/**
 * API - Gestión de Direcciones del Usuario
 * CRUD completo de direcciones de envío
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// Schema de validación
const addressSchema = z.object({
  name: z.string().min(1, 'El nombre is required'),
  recipient: z.string().min(1, 'El destinatario is required'),
  phone: z.string().min(9, 'Teléfono inválido'),
  address: z.string().min(1, 'La dirección es requerida'),
  complement: z.string().optional(),
  postalCode: z.string().regex(/^\d{5}$/, 'Código postal inválido'),
  city: z.string().min(1, 'La ciudad es requerida'),
  province: z.string().min(1, 'La provincia es requerida'),
  isDefault: z.boolean().default(false),
});

// GET - Listar direcciones del usuario
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!usuario) {
      // Temporal: retornar array vacío en lugar de error 404
      console.warn('[Addresses] User not found for email:', session.user.email);
      return NextResponse.json({ addresses: [] });
    }

    const addresses = await prisma.address.findMany({
      where: { userId: usuario.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error('[Addresses] Error:', error);
    // Temporal: no romper el frontend
    return NextResponse.json({ addresses: [] });
  }
}

// POST - Crear nueva dirección
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario not found' }, { status: 404 });
    }

    const body = await request.json();

    // Validar datos
    const validatedData = addressSchema.parse(body);

    // Si es principal, desmarcar las otras
    if (validatedData.isDefault) {
      await prisma.address.updateMany({
        where: { userId: usuario.id },
        data: { isDefault: false },
      });
    }

    // Contar direcciones existentes
    const count = await prisma.address.count({
      where: { userId: usuario.id },
    });

    // Si es la primera dirección, marcarla como principal
    if (count === 0) {
      validatedData.isDefault = true;
    }

    const newAddress = await prisma.address.create({
      data: {
        id: crypto.randomUUID(),
        name: validatedData.name,
        recipient: validatedData.recipient,
        phone: validatedData.phone,
        address: validatedData.address,
        complement: validatedData.complement,
        postalCode: validatedData.postalCode,
        city: validatedData.city,
        province: validatedData.province,
        isDefault: validatedData.isDefault,
        user: { connect: { id: usuario.id } },
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ address: newAddress }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 });
    }
    console.error('Error al crear dirección:', error);
    return NextResponse.json({ error: 'Error al crear dirección' }, { status: 500 });
  }
}

// PATCH - Actualizar dirección
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario not found' }, { status: 404 });
    }

    const { id, ...data } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID de dirección requerido' }, { status: 400 });
    }

    // Verificar que la dirección pertenece al usuario
    const existing = await prisma.address.findFirst({
      where: { id, userId: usuario.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Dirección no encontrada' }, { status: 404 });
    }

    // Si se marca como principal, desmarcar las otras
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: usuario.id, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updatedAddress = await prisma.address.update({
      where: { id },
      data,
    });

    return NextResponse.json({ address: updatedAddress });
  } catch (error) {
    console.error('Error al actualizar dirección:', error);
    return NextResponse.json({ error: 'Error al actualizar dirección' }, { status: 500 });
  }
}

// DELETE - Eliminar dirección
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de dirección requerido' }, { status: 400 });
    }

    // Verificar que la dirección pertenece al usuario
    const existing = await prisma.address.findFirst({
      where: { id, userId: usuario.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Dirección no encontrada' }, { status: 404 });
    }

    await prisma.address.delete({ where: { id } });

    // Si era la principal, marcar otra como principal
    if (existing.isDefault) {
      const otra = await prisma.address.findFirst({
        where: { userId: usuario.id },
        orderBy: { createdAt: 'asc' },
      });

      if (otra) {
        await prisma.address.update({
          where: { id: otra.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar dirección:', error);
    return NextResponse.json({ error: 'Error al eliminar dirección' }, { status: 500 });
  }
}
