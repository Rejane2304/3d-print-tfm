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
import { checkRateLimit } from '@/lib/rate-limit';
import { changePasswordSchema } from '@/lib/validators';
import { translateErrorMessage } from '@/lib/i18n';

// Schema de validación para actualizar perfil - más permisivo
const profileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional().or(z.literal('')),
  taxId: z.string().max(20).optional().or(z.literal('')),
});

/**
 * Verifica si la nueva contraseña coincide con alguna de las últimas 5 contraseñas
 */
async function checkPasswordHistory(
  userId: string,
  newPassword: string
): Promise<boolean> {
  const passwordHistory = await prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  for (const entry of passwordHistory) {
    const isMatch = await bcrypt.compare(newPassword, entry.hash);
    if (isMatch) {
      return true;
    }
  }

  return false;
}

/**
 * Guarda el hash de la contraseña actual en el historial
 */
async function savePasswordToHistory(
  userId: string,
  passwordHash: string
): Promise<void> {
  await prisma.passwordHistory.create({
    data: {
      userId,
      hash: passwordHash,
    },
  });
}

// GET - Obtener perfil del usuario
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: translateErrorMessage('No autenticado') },
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
        { success: false, error: translateErrorMessage('Usuario not found') },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, usuario });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    return NextResponse.json(
      { success: false, error: translateErrorMessage('Internal error') },
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
        { success: false, error: translateErrorMessage('No autenticado') },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Si hay datos de contraseña, aplicar rate limiting y procesar cambio
    if (body.passwordActual && body.passwordNuevo) {
      // Check rate limiting for password change
      const rateLimitResponse = checkRateLimit(req, 'passwordChange');
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      const usuario = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      if (!usuario) {
        return NextResponse.json(
          { success: false, error: translateErrorMessage('Usuario not found') },
          { status: 404 }
        );
      }

      // Transform Spanish field names to English for schema validation
      const passwordData = changePasswordSchema.parse({
        currentPassword: body.passwordActual,
        newPassword: body.passwordNuevo,
        confirmPassword: body.passwordNuevo,
      });

      // Verificar contraseña actual
      const passwordValido = await bcrypt.compare(
        passwordData.currentPassword,
        usuario.password
      );

      if (!passwordValido) {
        return NextResponse.json(
          { success: false, error: 'Contraseña actual incorrecta' },
          { status: 400 }
        );
      }

      // Verificar que la nueva contraseña no coincida con las últimas 5
      const isReused = await checkPasswordHistory(
        usuario.id,
        passwordData.newPassword
      );
      if (isReused) {
        return NextResponse.json(
          { success: false, error: 'La nueva contraseña no puede coincidir con ninguna de tus últimas 5 contraseñas' },
          { status: 400 }
        );
      }

      // Guardar la contraseña actual en el historial antes de actualizar
      await savePasswordToHistory(usuario.id, usuario.password);

      // Actualizar contraseña
      const hashedPassword = await bcrypt.hash(passwordData.newPassword, 12);
      await prisma.user.update({
        where: { id: usuario.id },
        data: { password: hashedPassword },
      });

      return NextResponse.json({
        success: true,
        message: 'Contraseña actualizada correctamente',
      });
    }

    // Actualizar datos del perfil (sin rate limiting para datos no sensibles)
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!usuario) {
      return NextResponse.json(
        { success: false, error: translateErrorMessage('Usuario not found') },
        { status: 404 }
      );
    }

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
      { success: false, error: translateErrorMessage('Internal error') },
      { status: 500 }
    );
  }
}
