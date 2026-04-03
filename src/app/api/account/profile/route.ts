/**
 * API de Perfil de Usuario
 * Gestión de datos personales del usuario autenticado
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { z } from 'zod';
import bcrypt from 'bcrypt';

// Schema de validación para actualizar perfil
const profileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().regex(/^\+?[0-9]{9,15}$/).optional(),
  taxId: z.string().regex(/^\d{8}[A-Z]$/).optional(),
});

// Schema para cambiar contraseña
const passwordSchema = z.object({
  passwordActual: z.string().min(1),
  passwordNuevo: z.string().min(8),
});

// GET - Obtener perfil del usuario
export async function GET() {
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
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        taxId: true,
        role: true,
        createdAt: true,
      },
    });

    if (!usuario) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, usuario });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar perfil
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

    if (!usuario) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const body = await req.json();

    // Si hay datos de contraseña, procesar cambio de contraseña
    if (body.passwordActual && body.passwordNuevo) {
      const passwordData = passwordSchema.parse(body);

      // Verificar contraseña actual
      const passwordValido = await bcrypt.compare(
        passwordData.passwordActual,
        usuario.password
      );

      if (!passwordValido) {
        return NextResponse.json(
          { success: false, error: 'Contraseña actual incorrecta' },
          { status: 400 }
        );
      }

      // Actualizar contraseña
      const hashedPassword = await bcrypt.hash(passwordData.passwordNuevo, 12);
      await prisma.user.update({
        where: { id: usuario.id },
        data: { password: hashedPassword },
      });

      return NextResponse.json({
        success: true,
        message: 'Contraseña actualizada correctamente',
      });
    }

    // Actualizar datos del perfil
    const profileData = profileSchema.parse(body);

    const usuarioActualizado = await prisma.user.update({
      where: { id: usuario.id },
      data: profileData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        taxId: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      usuario: usuarioActualizado,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Error actualizando perfil:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}
